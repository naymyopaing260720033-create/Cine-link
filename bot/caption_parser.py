"""Strict key-value caption parsing for private CineLink source channels."""

from __future__ import annotations

from bot.models import ContentKind, PublicationRequest


class CaptionError(ValueError):
    """Raised when an administrator post cannot safely enter the public catalog."""


ALLOWED_KEYS = {
    "TYPE",
    "TMDB_ID",
    "SEASON",
    "EPISODE",
    "TITLE",
    "EPISODE_TITLE",
    "YEAR",
    "QUALITY",
    "LANGUAGE",
}


def _positive_int(fields: dict[str, str], name: str) -> int:
    raw_value = fields.get(name, "")
    if not raw_value:
        raise CaptionError(f"{name} is required")
    if not raw_value.isdigit() or int(raw_value) <= 0:
        raise CaptionError(f"{name} must be a positive integer")
    return int(raw_value)


def _optional_text(fields: dict[str, str], name: str) -> str | None:
    value = fields.get(name, "").strip()
    if len(value) > 120:
        raise CaptionError(f"{name} must not exceed 120 characters")
    return value or None


def _parse_fields(caption: str) -> dict[str, str]:
    if not caption or not caption.strip():
        raise CaptionError("A structured caption is required")

    fields: dict[str, str] = {}
    for raw_line in caption.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if ":" not in line:
            raise CaptionError("Each caption line must use KEY: VALUE format")
        raw_key, raw_value = line.split(":", 1)
        key = raw_key.strip().upper()
        value = raw_value.strip()
        if key not in ALLOWED_KEYS:
            raise CaptionError(f"Unsupported caption key: {key}")
        if not value:
            raise CaptionError(f"{key} must have a value")
        if key in fields:
            raise CaptionError(f"{key} may only appear once")
        fields[key] = value
    return fields


def parse_caption(
    caption: str,
    expected_kind: ContentKind,
    source_channel_id: int,
    source_message_id: int,
    source_media_type: str,
) -> PublicationRequest:
    """Parse an allowed caption; source channels define the required content kind."""

    fields = _parse_fields(caption)
    declared_type = fields.get("TYPE", "").strip().upper()
    allowed_type = "MOVIE" if expected_kind == "movie" else "EPISODE"
    if declared_type and declared_type != allowed_type:
        raise CaptionError(f"TYPE must be {allowed_type} in this source channel")

    tmdb_id = _positive_int(fields, "TMDB_ID")
    season: int | None = None
    episode: int | None = None
    if expected_kind == "episode":
        season = _positive_int(fields, "SEASON")
        episode = _positive_int(fields, "EPISODE")

    return PublicationRequest(
        kind=expected_kind,
        tmdb_id=tmdb_id,
        season=season,
        episode=episode,
        quality=_optional_text(fields, "QUALITY"),
        language=_optional_text(fields, "LANGUAGE"),
        source_channel_id=source_channel_id,
        source_message_id=source_message_id,
        source_media_type=source_media_type,
    )
