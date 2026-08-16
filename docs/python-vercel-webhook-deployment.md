# CineLink Python Webhook Deployment Notes

## Verified Hosting Model

CineLink's Telegram bot is an event-driven webhook service, not a long-polling worker. Telegram sends each update to a public HTTPS endpoint and the Python handler completes the deterministic validation, catalog write, audit, and notification work within that request.

Vercel supports Python functions and can load an ASGI application such as FastAPI from a supported Python entrypoint. Python dependencies can be declared in `requirements.txt` or `pyproject.toml`, and Python 3.12 is the documented default if a supported version is not configured. [1]

Vercel Functions are request-scoped and scale down when idle, which fits Telegram webhooks. The bot must not depend on in-memory state, long polling, or a permanent process; MongoDB and Supabase provide durable state instead. [2]

## Planned Repository Layout

```text
api/telegram.py          # FastAPI webhook entrypoint, deployed at /api/telegram
bot/                     # Python packages: parser, Telegram client, MongoDB, Supabase audit
requirements.txt         # FastAPI, PyMongo, HTTP client
.python-version          # Python 3.12
tests/                   # Standard-library unit tests for caption/deep-link parsing
```

The SPA fallback must explicitly exclude `/api/` so client-side route rewrites never intercept the Telegram endpoint. Vercel rewrites support regular-expression path matching in `vercel.json`. [3]

## Sources

[1] [Using the Python Runtime with Vercel Functions](https://vercel.com/docs/functions/runtimes/python)

[2] [Vercel Functions](https://vercel.com/docs/functions)

[3] [Rewrites on Vercel](https://vercel.com/docs/routing/rewrites)
