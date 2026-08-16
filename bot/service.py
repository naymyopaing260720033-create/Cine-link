"""Idempotent Telegram channel publishing and authorized /start media delivery."""

from __future__ import annotations

import logging
from typing import Any

from bot.caption_parser import CaptionError, parse_caption
from bot.clients import ExternalServiceError, MongoCatalog, SupabaseAuditClient, TMDBClient, TelegramClient
from bot.config import Settings
from bot.deep_links import parse_start_payload
from bot.models import ContentKind, PublicationRequest, PublishResult

logger = logging.getLogger("cinelink.publisher")


class PublishingService:
    def __init__(self, settings: Settings, telegram: TelegramClient, tmdb: TMDBClient, catalog: MongoCatalog, audit: SupabaseAuditClient) -> None:
        self.settings = settings
        self.telegram = telegram
        self.tmdb = tmdb
        self.catalog = catalog
        self.audit = audit

    @classmethod
    def from_settings(cls, settings: Settings) -> "PublishingService":
        catalog = MongoCatalog(settings.mongodb_uri, settings.mongodb_database)
        catalog.ensure_indexes()
        return cls(settings, TelegramClient(settings.telegram_bot_token), TMDBClient(settings.tmdb_api_key), catalog,
                   SupabaseAuditClient(settings.supabase_url, settings.supabase_service_role_key, settings.supabase_audit_table))

    def process_update(self, update: dict[str, Any]) -> PublishResult:
        channel_post = update.get("channel_post")
        if not isinstance(channel_post, dict):
            return self._handle_start_command(update)
        chat = channel_post.get("chat")
        if not isinstance(chat, dict):
            return PublishResult(status="ignored", event_key=None)
        channel_id, message_id = chat.get("id"), channel_post.get("message_id")
        if not isinstance(channel_id, int) or not isinstance(message_id, int):
            return PublishResult(status="ignored", event_key=None)
        expected_kind = self._source_kind(channel_id)
        if expected_kind is None:
            return PublishResult(status="ignored", event_key=None)
        event_key = f"telegram:{channel_id}:{message_id}"
        if not self.catalog.claim_event(event_key, channel_id, message_id):
            return PublishResult(status="duplicate", event_key=event_key)
        request: PublicationRequest | None = None
        try:
            request = parse_caption(str(channel_post.get("caption") or ""), expected_kind, channel_id, message_id,
                                    self._source_media_type(channel_post))
            metadata = self.tmdb.fetch_metadata(request)
            published_at = self.catalog.publish(request, metadata)
            self.catalog.mark_event(event_key, "published", {"contentKey": request.content_key, "title": metadata["title"], "tmdbId": request.tmdb_id})
            self._audit(event_key, "published", request, None)
            self._notify_once(event_key, "published", request, metadata["title"], None)
            return PublishResult(status="published", event_key=event_key, published_at=published_at)
        except (CaptionError, ValueError) as exc:
            return self._reject(event_key, request, str(exc))
        except ExternalServiceError as exc:
            return self._retryable_failure(event_key, request, str(exc))
        except Exception:
            logger.exception("Unexpected channel publishing error", extra={"eventKey": event_key})
            return self._retryable_failure(event_key, request, "Unexpected publishing error")

    def _handle_start_command(self, update: dict[str, Any]) -> PublishResult:
        message = update.get("message")
        if not isinstance(message, dict):
            return PublishResult(status="ignored", event_key=None)
        text = str(message.get("text") or "")
        chat = message.get("chat")
        if not isinstance(chat, dict) or not isinstance(chat.get("id"), int) or not text.startswith("/start"):
            return PublishResult(status="ignored", event_key=None)
        user_id = chat["id"]
        parsed = parse_start_payload(text.partition(" ")[2].strip())
        if parsed is None:
            self.telegram.send_user_message(user_id, "Sorry, this watch link is invalid or has expired.")
            return PublishResult(status="ignored", event_key=None)
        kind, tmdb_id, season, episode = parsed
        content_key = f"movie:{tmdb_id}" if kind == "movie" else f"episode:{tmdb_id}:s{season}:e{episode}"
        media = self.catalog.find_media(content_key)
        if not media:
            self.telegram.send_user_message(user_id, "This title is not available yet. Please try again later.")
            return PublishResult(status="ignored", event_key=None)
        self.telegram.copy_media_to_user(user_id, media["sourceChannelId"], media["sourceMessageId"])
        return PublishResult(status="published", event_key=f"delivery:{content_key}")

    def _source_kind(self, channel_id: int) -> ContentKind | None:
        if channel_id == self.settings.movies_channel_id:
            return "movie"
        if channel_id == self.settings.series_channel_id:
            return "episode"
        return None

    @staticmethod
    def _source_media_type(channel_post: dict[str, Any]) -> str:
        if channel_post.get("video"):
            return "video"
        if channel_post.get("document"):
            return "document"
        raise CaptionError("Posts must contain a video or document with the structured caption")

    def _reject(self, event_key: str, request: PublicationRequest | None, reason: str) -> PublishResult:
        self.catalog.mark_event(event_key, "rejected", {"reason": reason})
        self._audit(event_key, "rejected", request, reason)
        self._notify_once(event_key, "rejected", request, None, reason)
        return PublishResult(status="rejected", event_key=event_key)

    def _retryable_failure(self, event_key: str, request: PublicationRequest | None, reason: str) -> PublishResult:
        self.catalog.mark_event(event_key, "retryable_failure", {"reason": reason})
        self._audit(event_key, "retryable_failure", request, reason)
        self._notify_once(event_key, "retryable_failure", request, None, reason)
        return PublishResult(status="retryable_failure", event_key=event_key)

    def _audit(self, event_key: str, status: str, request: PublicationRequest | None, reason: str | None) -> None:
        self.audit.record({"event_key": event_key, "event_status": status,
            "source_channel_id": request.source_channel_id if request else None,
            "source_message_id": request.source_message_id if request else None,
            "content_type": request.kind if request else None, "tmdb_id": request.tmdb_id if request else None,
            "season_number": request.season if request else None, "episode_number": request.episode if request else None,
            "reason_code": reason})

    def _notify_once(self, event_key: str, status: str, request: PublicationRequest | None, title: str | None, reason: str | None) -> None:
        if not self.catalog.claim_notification(event_key):
            return
        try:
            self.telegram.send_log(self.settings.log_channel_id, self._notification_text(status, request, title, reason))
        except ExternalServiceError:
            logger.exception("Private operational-log notification failed", extra={"eventKey": event_key})
            self.catalog.finish_notification(event_key, "failed")
            return
        self.catalog.finish_notification(event_key, "sent")

    @staticmethod
    def _notification_text(status: str, request: PublicationRequest | None, title: str | None, reason: str | None) -> str:
        source, content = "Unknown source", "No valid catalog payload"
        if request:
            source = f"channel {request.source_channel_id} · message {request.source_message_id}"
            content = f"TMDB {request.tmdb_id}"
            if request.kind == "episode":
                content += f" · S{request.season:02d}E{request.episode:02d}"
        if title:
            content = f"{title} · {content}"
        if status == "published":
            return f"Published\n{content}\nSource: {source}"
        if status == "rejected":
            return f"Rejected\nSource: {source}\nReason: {reason or 'Invalid caption'}"
        return f"Retry required\nSource: {source}\nReason: {reason or 'Temporary dependency failure'}"
