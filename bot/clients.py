"""Minimal server-side clients for Telegram, TMDB, MongoDB, and Supabase REST."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import requests
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo import ReturnDocument

from bot.models import PublicationRequest

logger = logging.getLogger("cinelink.clients")


class ExternalServiceError(RuntimeError):
    """A retryable dependency failure safe to expose only as an internal reason code."""


class TelegramClient:
    def __init__(self, bot_token: str) -> None:
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
        self.session = requests.Session()

    def _post(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.session.post(f"{self.base_url}/{method}", json=payload, timeout=12)
            response.raise_for_status()
            body = response.json()
        except (requests.RequestException, ValueError) as exc:
            raise ExternalServiceError("Telegram API request failed") from exc
        if not body.get("ok"):
            raise ExternalServiceError("Telegram API rejected the request")
        return body["result"]

    def send_log(self, chat_id: int, text: str) -> None:
        self._post("sendMessage", {"chat_id": chat_id, "text": text, "disable_web_page_preview": True})

    def copy_media_to_user(self, user_id: int, source_channel_id: int, source_message_id: int) -> None:
        self._post(
            "copyMessage",
            {"chat_id": user_id, "from_chat_id": source_channel_id, "message_id": source_message_id},
        )

    def send_user_message(self, user_id: int, text: str) -> None:
        self._post("sendMessage", {"chat_id": user_id, "text": text})


class TMDBClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.session = requests.Session()

    def fetch_metadata(self, request: PublicationRequest) -> dict[str, Any]:
        endpoint = "movie" if request.kind == "movie" else "tv"
        try:
            response = self.session.get(
                f"https://api.themoviedb.org/3/{endpoint}/{request.tmdb_id}",
                params={"api_key": self.api_key, "language": "en-US"},
                timeout=12,
            )
        except requests.RequestException as exc:
            raise ExternalServiceError("TMDB request failed") from exc
        if response.status_code == 404:
            raise ValueError("TMDB_ID was not found for the expected content type")
        if response.status_code >= 500 or response.status_code == 429:
            raise ExternalServiceError("TMDB is temporarily unavailable")
        if response.status_code != 200:
            raise ValueError("TMDB metadata could not be validated")
        try:
            data = response.json()
        except ValueError as exc:
            raise ExternalServiceError("TMDB returned invalid JSON") from exc
        title = data.get("title") if request.kind == "movie" else data.get("name")
        if not isinstance(title, str) or not title.strip():
            raise ValueError("TMDB title is missing")
        return {
            "tmdbId": request.tmdb_id,
            "title": title.strip(),
            "posterPath": data.get("poster_path"),
            "backdropPath": data.get("backdrop_path"),
            "releaseDate": data.get("release_date") if request.kind == "movie" else data.get("first_air_date"),
        }


class MongoCatalog:
    def __init__(self, uri: str, database_name: str) -> None:
        self.client = MongoClient(uri, appname="CineLinkTelegramWebhook", serverSelectionTimeoutMS=6000)
        database = self.client[database_name]
        self.events: Collection = database["telegram_events"]
        self.catalog: Collection = database["catalog"]
        self.media: Collection = database["telegram_media"]
        self._indexes_ready = False

    def ensure_indexes(self) -> None:
        if self._indexes_ready:
            return
        self.events.create_index([("eventKey", ASCENDING)], unique=True)
        self.catalog.create_index(
            [("kind", ASCENDING), ("tmdbId", ASCENDING), ("season", ASCENDING), ("episode", ASCENDING)],
            unique=True,
        )
        self.media.create_index([("contentKey", ASCENDING)], unique=True)
        self._indexes_ready = True

    def claim_event(self, event_key: str, channel_id: int, message_id: int) -> bool:
        now = datetime.now(timezone.utc)
        retrying_event = self.events.find_one_and_update(
            {"eventKey": event_key, "status": "retryable_failure"},
            {"$set": {"status": "processing", "updatedAt": now}},
            return_document=ReturnDocument.BEFORE,
        )
        if retrying_event is not None:
            return True
        result = self.events.update_one(
            {"eventKey": event_key},
            {"$setOnInsert": {"eventKey": event_key, "sourceChannelId": channel_id, "sourceMessageId": message_id,
              "status": "processing", "notificationStatus": "pending", "createdAt": now, "updatedAt": now}},
            upsert=True,
        )
        return result.upserted_id is not None

    def mark_event(self, event_key: str, status: str, details: dict[str, Any]) -> None:
        update: dict[str, Any] = {
            "$set": {"status": status, "details": details, "updatedAt": datetime.now(timezone.utc)}
        }
        if status == "retryable_failure":
            update["$inc"] = {"retryCount": 1}
        self.events.update_one(
            {"eventKey": event_key},
            update,
        )

    def claim_notification(self, event_key: str) -> bool:
        result = self.events.update_one(
            {"eventKey": event_key, "notificationStatus": {"$in": ["pending", "failed"]}},
            {"$set": {"notificationStatus": "sending", "updatedAt": datetime.now(timezone.utc)}},
        )
        return result.modified_count == 1

    def finish_notification(self, event_key: str, status: str) -> None:
        self.events.update_one(
            {"eventKey": event_key},
            {"$set": {"notificationStatus": status, "updatedAt": datetime.now(timezone.utc)}},
        )

    def publish(self, request: PublicationRequest, metadata: dict[str, Any]) -> datetime:
        now = datetime.now(timezone.utc)
        identity = {"kind": request.kind, "tmdbId": request.tmdb_id, "season": request.season, "episode": request.episode}
        catalog_document = {**identity, "contentKey": request.content_key, "title": metadata["title"],
            "posterPath": metadata.get("posterPath"), "backdropPath": metadata.get("backdropPath"),
            "releaseDate": metadata.get("releaseDate"), "quality": request.quality, "language": request.language,
            "status": "published", "lastPublishedAt": now, "updatedAt": now}
        self.catalog.update_one(identity, {"$set": catalog_document, "$setOnInsert": {"createdAt": now}}, upsert=True)
        self.media.update_one(
            {"contentKey": request.content_key},
            {"$set": {"contentKey": request.content_key, "sourceChannelId": request.source_channel_id,
              "sourceMessageId": request.source_message_id, "sourceMediaType": request.source_media_type,
              "updatedAt": now}, "$setOnInsert": {"createdAt": now}},
            upsert=True,
        )
        return now

    def find_media(self, content_key: str) -> dict[str, Any] | None:
        return self.media.find_one({"contentKey": content_key})


class SupabaseAuditClient:
    def __init__(self, base_url: str, service_role_key: str, table: str) -> None:
        self.url = f"{base_url}/rest/v1/{table}?on_conflict=event_key"
        self.headers = {"apikey": service_role_key, "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
        self.session = requests.Session()

    def record(self, event: dict[str, Any]) -> None:
        try:
            response = self.session.post(self.url, headers=self.headers, json=event, timeout=10)
            response.raise_for_status()
        except requests.RequestException:
            logger.exception("Supabase audit write failed", extra={"eventKey": event.get("event_key")})
