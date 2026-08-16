"""Telegram webhook entrypoint deployed by Vercel at /api/telegram."""

from __future__ import annotations

import hmac
import logging
from functools import lru_cache
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request

from bot.config import Settings
from bot.service import PublishingService

logger = logging.getLogger("cinelink.telegram")

app = FastAPI(title="CineLink Telegram Webhook", docs_url=None, redoc_url=None)


@lru_cache(maxsize=1)
def get_service() -> PublishingService:
    """Create shared SDK clients once per warm Vercel function instance."""

    return PublishingService.from_settings(Settings.from_env())


@app.get("/")
@app.get("/api/telegram")
async def health() -> dict[str, bool]:
    """Return a secret-free readiness response for deployment checks."""

    try:
        Settings.from_env()
    except ValueError:
        return {"ok": False, "configured": False}
    return {"ok": True, "configured": True}


@app.post("/")
@app.post("/api/telegram")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, Any]:
    """Validate a Telegram update and return quickly after durable processing."""

    settings = Settings.from_env()
    received_secret = x_telegram_bot_api_secret_token or ""
    if not hmac.compare_digest(received_secret, settings.telegram_webhook_secret):
        raise HTTPException(status_code=403, detail="Invalid Telegram webhook secret")

    try:
        update = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON update") from exc

    if not isinstance(update, dict):
        raise HTTPException(status_code=400, detail="Telegram update must be an object")

    try:
        result = get_service().process_update(update)
    except Exception:
        logger.exception("Unhandled Telegram webhook failure")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    if result.status == "retryable_failure":
        raise HTTPException(status_code=503, detail="Temporary dependency failure; Telegram may retry this update")

    return {"ok": True, "status": result.status, "eventKey": result.event_key}
