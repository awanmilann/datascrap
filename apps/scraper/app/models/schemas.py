from pydantic import BaseModel
from typing import Optional


class ScrapeRequest(BaseModel):
    project_id: str
    urls: list[str]
    fields: list[str]
    custom_selector: Optional[str] = None


class ScrapeResponse(BaseModel):
    job_id: str
    status: str
    total_items: int = 0


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    total_urls: int
    processed_urls: int
    total_items: int


class WebhookPayload(BaseModel):
    job_id: str
    status: str
    total_items: int = 0
    error_message: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str
