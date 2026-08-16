"""Unit tests for CineLink's Telegram /start payload contract."""

import unittest

from bot.deep_links import parse_start_payload


class DeepLinkTests(unittest.TestCase):
    def test_movie_payload(self) -> None:
        self.assertEqual(parse_start_payload("m_603"), ("movie", 603, None, None))

    def test_episode_payload(self) -> None:
        self.assertEqual(parse_start_payload("s_1399_s1_e2"), ("episode", 1399, 1, 2))

    def test_invalid_payload_is_not_accepted(self) -> None:
        self.assertIsNone(parse_start_payload("../../secret"))
        self.assertIsNone(parse_start_payload("s_1399_s0_e2"))


if __name__ == "__main__":
    unittest.main()
