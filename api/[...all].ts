import { createApiApp } from "../server/_core/apiApp";

const app = createApiApp();

/**
 * Vercel Node serverless bridge for CineLink's tRPC, OAuth, and storage APIs.
 * The Python `api/telegram.py` function remains the dedicated Telegram webhook.
 */
export default function handler(request: unknown, response: unknown) {
  return app(request as never, response as never);
}
