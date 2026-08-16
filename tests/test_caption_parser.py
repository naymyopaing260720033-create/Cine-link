"""Unit tests for strict source-channel caption validation."""

import unittest

from bot.caption_parser import CaptionError, parse_caption


class CaptionParserTests(unittest.TestCase):
    def test_movie_caption_only_requires_tmdb_id(self) -> None:
        result = parse_caption(
            "TMDB_ID: 603\nQUALITY: 1080p\nLANGUAGE: Myanmar Sub",
            "movie",
            -100111,
            12,
            "document",
        )
        self.assertEqual(result.kind, "movie")
        self.assertEqual(result.tmdb_id, 603)
        self.assertIsNone(result.season)
        self.assertEqual(result.quality, "1080p")

    def test_episode_caption_requires_season_and_episode(self) -> None:
        result = parse_caption(
            "TYPE: EPISODE\nTMDB_ID: 1399\nSEASON: 1\nEPISODE: 2",
            "episode",
            -100222,
            13,
            "video",
        )
        self.assertEqual(result.content_key, "episode:1399:s1:e2")

    def test_mismatched_type_is_rejected(self) -> None:
        with self.assertRaisesRegex(CaptionError, "TYPE must be MOVIE"):
            parse_caption("TYPE: EPISODE\nTMDB_ID: 603", "movie", -100111, 12, "video")

    def test_duplicate_keys_are_rejected(self) -> None:
        with self.assertRaisesRegex(CaptionError, "TMDB_ID may only appear once"):
            parse_caption("TMDB_ID: 603\nTMDB_ID: 604", "movie", -100111, 12, "video")

    def test_compact_notation_is_rejected_until_explicitly_enabled(self) -> None:
        with self.assertRaisesRegex(CaptionError, "Unsupported caption key: TMDB"):
            parse_caption("TMDB:1399 S01E01", "episode", -100222, 13, "video")


if __name__ == "__main__":
    unittest.main()
