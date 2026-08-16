"""Typed values shared by caption parsing, publishing, and Telegram delivery."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

ContentKind = Literal["movie", "episode"]


@dataclass(frozen=True)
class PublicationRequest:
    kind: ContentKind
    tmdb_id: int
    season: int | None
    episode: int | None
    quality: str | None
    language: str | None
    source_channel_id: int
    source_message_id: int
    source_media_type: str

    @property
    def content_key(self) -> str:
        if self.kind == "movie":
            return f"movie:{self.tmdb_id}"
        return f"episode:{self.tmdb_id}:s{self.season}:e{self.episode}"


@dataclass(frozen=True)
class PublishResult:
    status: Literal["published", "rejected", "retryable_failure", "duplicate", "ignored"]
    event_key: str | None
    published_at: datetime | None = None
