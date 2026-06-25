import os
from datetime import datetime, timezone
from typing import Any, Optional
from supabase import create_client, Client


_supabase: Optional[Client] = None


def init_supabase() -> Client:
    global _supabase
    if _supabase is not None:
        return _supabase

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    _supabase = create_client(url, key)
    return _supabase


def get_client() -> Client:
    client = init_supabase()
    return client


async def update_job_status(job_id: str, status: str, **extra: Any) -> None:
    client = get_client()
    payload: dict[str, Any] = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
    payload.update(extra)
    client.table("scrape_jobs").update(payload).eq("id", job_id).execute()


async def insert_scraped_item(item: dict[str, Any]) -> None:
    client = get_client()
    client.table("scraped_items").insert(item).execute()


async def insert_error_log(log: dict[str, Any]) -> None:
    client = get_client()
    client.table("error_logs").insert(log).execute()


async def insert_audit_log(log: dict[str, Any]) -> None:
    client = get_client()
    client.table("audit_logs").insert(log).execute()


async def check_domain_blocklist(domain: str) -> bool:
    client = get_client()
    result = client.table("domain_blocklist").select("domain").eq("domain", domain.lower()).execute()
    return len(result.data) > 0
