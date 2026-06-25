import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Header, HTTPException, Request
from app.models.schemas import (
    ScrapeRequest,
    ScrapeResponse,
    JobStatusResponse,
    WebhookPayload,
    ErrorResponse,
)
from app.services.supabase_service import (
    get_client,
    update_job_status,
    insert_error_log,
    insert_audit_log,
    check_domain_blocklist,
)
from app.services.scraper_service import validate_url, check_robots_txt
from app.workers.worker import process_job

logger = logging.getLogger(__name__)

router = APIRouter()


def _verify_internal_api_key(x_api_key: Optional[str] = None) -> None:
    expected = os.environ.get("SCRAPER_INTERNAL_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=500, detail="SCRAPER_INTERNAL_API_KEY not configured")
    if not x_api_key or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


def _verify_webhook_secret(x_webhook_secret: Optional[str] = None) -> None:
    expected = os.environ.get("WEBHOOK_SECRET", "")
    if not expected:
        raise HTTPException(status_code=500, detail="WEBHOOK_SECRET not configured")
    if not x_webhook_secret or x_webhook_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing webhook secret")


@router.post("/api/scrape", response_model=ScrapeResponse)
async def create_scrape_job(
    body: ScrapeRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    _verify_internal_api_key(x_api_key)

    if not body.urls:
        raise HTTPException(status_code=400, detail="At least one URL is required")
    if not body.fields:
        raise HTTPException(status_code=400, detail="At least one field is required")

    for url in body.urls:
        if not url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail=f"Invalid URL protocol: {url}")
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        if not validate_url(url):
            raise HTTPException(status_code=400, detail=f"Unsafe or invalid URL: {url}")
        blocked = await check_domain_blocklist(hostname.lower())
        if blocked:
            raise HTTPException(status_code=400, detail=f"Domain is blocked: {hostname}")
        allowed = await check_robots_txt(hostname)
        if not allowed:
            raise HTTPException(status_code=400, detail=f"robots.txt disallows scraping: {url}")

    job_id = str(uuid.uuid4())
    client = get_client()
    job_record = {
        "id": job_id,
        "project_id": body.project_id,
        "status": "pending",
        "total_urls": len(body.urls),
        "processed_urls": 0,
        "total_items": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    client.table("scrape_jobs").insert(job_record).execute()

    audit_log = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "action": "scrape_created",
        "details": {
            "project_id": body.project_id,
            "url_count": len(body.urls),
            "fields": body.fields,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await insert_audit_log(audit_log)

    asyncio.create_task(
        process_job(
            job_id=job_id,
            project_id=body.project_id,
            urls=body.urls,
            fields=body.fields,
            custom_selector=body.custom_selector,
        )
    )

    return ScrapeResponse(job_id=job_id, status="pending")


@router.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    client = get_client()
    result = client.table("scrape_jobs").select("*").eq("id", job_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = result.data[0]
    return JobStatusResponse(
        job_id=job["id"],
        status=job["status"],
        total_urls=job.get("total_urls", 0),
        processed_urls=job.get("processed_urls", 0),
        total_items=job.get("total_items", 0),
    )


@router.post("/api/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    _verify_internal_api_key(x_api_key)
    client = get_client()
    result = client.table("scrape_jobs").select("*").eq("id", job_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = result.data[0]
    if job["status"] != "running" and job["status"] != "pending":
        raise HTTPException(status_code=400, detail="Job is not running or pending")

    await update_job_status(job_id, "failed")

    error_log = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "url": "",
        "error_message": "Job cancelled by user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await insert_error_log(error_log)

    audit_log = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "action": "scrape_cancelled",
        "details": {"status": "failed", "reason": "Cancelled by user"},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await insert_audit_log(audit_log)

    return {"detail": "Job cancelled"}


@router.post("/api/webhook")
async def receive_webhook(
    body: WebhookPayload,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
):
    _verify_webhook_secret(x_webhook_secret)

    update_data = {"status": body.status, "total_items": body.total_items}
    if body.error_message:
        update_data["error_message"] = body.error_message

    client = get_client()
    client.table("scrape_jobs").update(update_data).eq("id", body.job_id).execute()

    audit_log = {
        "id": str(uuid.uuid4()),
        "job_id": body.job_id,
        "action": f"webhook_{body.status}",
        "details": {
            "total_items": body.total_items,
            "error_message": body.error_message,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await insert_audit_log(audit_log)

    return {"detail": "Webhook received"}
