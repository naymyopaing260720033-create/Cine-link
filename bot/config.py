"""Server-only configuration for the CineLink Telegram webhook."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def _required_int(name: str) -> int:
    raw_value = _required(name)
    try:
        return int(raw_value)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be an integer") from exc


@dataclass(frozen=True)
class Settings:
    telegram_bot_token: str
    telegram_webhook_secret: str
    movies_channel_id: int
    series_channel_id: int
    log_channel_id: int
    mongodb_uri: str
    mongodb_database: str
    supabase_url: str
    supabase_service_role_key: str
    tmdb_api_key: str
    supabase_audit_table: str = "telegram_audit_events"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            telegram_bot_token=_required("TELEGRAM_BOT_TOKEN"),
            telegram_webhook_secret=_required("TELEGRAM_WEBHOOK_SECRET"),
            movies_channel_id=_required_int("TELEGRAM_MOVIES_CHANNEL_ID"),
            series_channel_id=_required_int("TELEGRAM_SERIES_CHANNEL_ID"),
            log_channel_id=_required_int("TELEGRAM_LOG_CHANNEL_ID"),
            mongodb_uri=_required("MONGODB_URI"),
            mongodb_database=os.getenv("MONGODB_DB_NAME", "cinelink").strip() or "cinelink",
            supabase_url=_required("SUPABASE_URL").rstrip("/"),
            supabase_service_role_key=_required("SUPABASE_SERVICE_ROLE_KEY"),
            tmdb_api_key=_required("TMDB_API_KEY"),
            supabase_audit_table=os.getenv("SUPABASE_AUDIT_TABLE", "telegram_audit_events").strip()
            or "telegram_audit_events",
        )
