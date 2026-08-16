"""Import-level validation for the Vercel FastAPI webhook entrypoint."""

import unittest

from api.telegram import app


class WebhookImportTests(unittest.TestCase):
    def test_health_and_webhook_routes_are_registered(self) -> None:
        routes = {(route.path, tuple(sorted(route.methods or []))) for route in app.routes}
        self.assertIn(("/", ("GET",)), routes)
        self.assertIn(("/", ("POST",)), routes)
        self.assertIn(("/api/telegram", ("GET",)), routes)
        self.assertIn(("/api/telegram", ("POST",)), routes)


if __name__ == "__main__":
    unittest.main()
