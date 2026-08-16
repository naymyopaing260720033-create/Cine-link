"""Safe local tests for CineLink's private Telegram operational-log notifications."""

from __future__ import annotations

import unittest

from bot.clients import ExternalServiceError, TelegramClient
from bot.models import PublicationRequest
from bot.service import PublishingService


class FakeResponse:
    def __init__(self, body: dict[str, object]) -> None:
        self.body = body

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self.body


class FakeSession:
    def __init__(self, response_body: dict[str, object]) -> None:
        self.response_body = response_body
        self.requests: list[tuple[str, dict[str, object], int]] = []

    def post(self, url: str, json: dict[str, object], timeout: int) -> FakeResponse:
        self.requests.append((url, json, timeout))
        return FakeResponse(self.response_body)


class LogNotificationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.request = PublicationRequest(
            kind="episode",
            tmdb_id=1399,
            season=1,
            episode=2,
            quality="1080p",
            language="Myanmar",
            source_channel_id=-1001234567890,
            source_message_id=922,
            source_media_type="video",
        )

    def test_send_log_builds_the_expected_telegram_request_without_network_access(self) -> None:
        client = TelegramClient("test-token")
        fake_session = FakeSession({"ok": True, "result": {"message_id": 5}})
        client.session = fake_session  # type: ignore[assignment]

        client.send_log(-1009988776655, "Published\nExample Title")

        self.assertEqual(len(fake_session.requests), 1)
        url, payload, timeout = fake_session.requests[0]
        self.assertEqual(url, "https://api.telegram.org/bottest-token/sendMessage")
        self.assertEqual(timeout, 12)
        self.assertEqual(
            payload,
            {
                "chat_id": -1009988776655,
                "text": "Published\nExample Title",
                "disable_web_page_preview": True,
            },
        )

    def test_send_log_treats_a_rejected_telegram_request_as_retryable(self) -> None:
        client = TelegramClient("test-token")
        client.session = FakeSession({"ok": False, "description": "Forbidden"})  # type: ignore[assignment]

        with self.assertRaises(ExternalServiceError):
            client.send_log(-1009988776655, "Retry required")

    def test_notification_templates_cover_published_rejected_and_retryable_cases(self) -> None:
        published = PublishingService._notification_text("published", self.request, "CineLink Test", None)
        rejected = PublishingService._notification_text("rejected", self.request, None, "EPISODE is required")
        retryable = PublishingService._notification_text("retryable_failure", self.request, None, "Telegram API request failed")

        self.assertIn("Published", published)
        self.assertIn("CineLink Test · TMDB 1399 · S01E02", published)
        self.assertIn("Rejected", rejected)
        self.assertIn("Reason: EPISODE is required", rejected)
        self.assertIn("Retry required", retryable)
        self.assertIn("Reason: Telegram API request failed", retryable)


if __name__ == "__main__":
    unittest.main()
