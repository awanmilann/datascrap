import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.scraper import router as scraper_router

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(title="DataHarvest Scraper", version="1.0.0")

ALLOWED_ORIGIN = os.environ.get("APP_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SCRAPER_INTERNAL_API_KEY",
        "WEBHOOK_SECRET",
    ]
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        logger.warning("Missing environment variables: %s", ", ".join(missing))
    else:
        logger.info("All required environment variables are set")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dataharvest-scraper"}


app.include_router(scraper_router)
