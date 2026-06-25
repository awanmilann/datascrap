import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.services.supabase_service import (
    update_job_status,
    insert_scraped_item,
    insert_error_log,
    insert_audit_log,
    check_domain_blocklist,
)
from app.services.scraper_service import extract_data, validate_url, check_robots_txt
from app.utils.security import sanitize_html

logger = logging.getLogger(__name__)

USER_AGENT = "DataHarvest/1.0"
MAX_RETRIES = 3
REQUEST_DELAY = 3


async def process_job(
    job_id: str,
    project_id: str,
    urls: list[str],
    fields: list[str],
    custom_selector: Optional[str] = None,
) -> None:
    total_urls = len(urls)
    processed_urls = 0
    total_items = 0
    domain_last_request: dict[str, float] = {}

    await update_job_status(job_id, "running", total_urls=total_urls, processed_urls=0, total_items=0)

    for url in urls:
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            error_message: Optional[str] = None
            item: Optional[dict] = None

            if not validate_url(url):
                error_message = f"URL validation failed: {url}"

            if not error_message:
                blocked = await check_domain_blocklist(domain)
                if blocked:
                    error_message = f"Domain is blocked: {domain}"

            if not error_message:
                allowed = await check_robots_txt(domain)
                if not allowed:
                    error_message = f"robots.txt disallows scraping: {url}"

            if not error_message:
                now = datetime.now(timezone.utc).timestamp()
                last_req = domain_last_request.get(domain, 0)
                wait = REQUEST_DELAY - (now - last_req)
                if wait > 0:
                    await asyncio.sleep(wait)

                item = await _fetch_and_extract(url, fields, custom_selector)
                domain_last_request[domain] = datetime.now(timezone.utc).timestamp()

            if item and not error_message:
                scraped_item = {
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "project_id": project_id,
                    "source_url": url,
                    "data": item,
                    "raw_html": "",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await insert_scraped_item(scraped_item)
                total_items += 1
            else:
                error_log = {
                    "id": str(uuid.uuid4()),
                    "job_id": job_id,
                    "url": url,
                    "error_message": error_message or "Unknown error",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                await insert_error_log(error_log)

        except Exception as exc:
            logger.exception("Error processing URL %s", url)
            error_log = {
                "id": str(uuid.uuid4()),
                "job_id": job_id,
                "url": url,
                "error_message": str(exc),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await insert_error_log(error_log)

        processed_urls += 1
        await update_job_status(
            job_id,
            "running",
            total_urls=total_urls,
            processed_urls=processed_urls,
            total_items=total_items,
        )

    final_status = "completed"
    await update_job_status(
        job_id,
        final_status,
        total_urls=total_urls,
        processed_urls=processed_urls,
        total_items=total_items,
    )

    audit_log = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "action": "scrape_completed",
        "details": {"status": final_status, "total_urls": total_urls, "total_items": total_items},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await insert_audit_log(audit_log)


async def _fetch_and_extract(
    url: str,
    fields: list[str],
    custom_selector: Optional[str] = None,
) -> Optional[dict]:
    last_exception: Optional[Exception] = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(
                    url,
                    headers={"User-Agent": USER_AGENT},
                    follow_redirects=True,
                )

            if resp.status_code == 403 or resp.status_code == 401:
                logger.warning("Access denied for %s (status %d)", url, resp.status_code)
                return None

            if resp.status_code >= 400:
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2 ** attempt)
                    continue
                logger.error("HTTP %d for %s after %d retries", resp.status_code, url, attempt)
                return None

            html = resp.text
            data = extract_data(html, fields, custom_selector)
            data["source_url"] = url
            return data

        except (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError) as exc:
            last_exception = exc
            logger.warning("Network error on %s (attempt %d/%d): %s", url, attempt, MAX_RETRIES, exc)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(2 ** attempt)
            else:
                logger.error("Max retries reached for %s", url)
                return None

        except Exception as exc:
            last_exception = exc
            logger.exception("Unexpected error on %s", url)
            return None

    return None
