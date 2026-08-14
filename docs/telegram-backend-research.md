# Telegram Backend Architecture Research

## Sources

- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram Bot Features: https://core.telegram.org/bots/features

## Findings

- Telegram provides an HTTP-based Bot API and supports webhook delivery for updates to a public HTTPS endpoint.
- A bot can receive channel post updates when it has the required access in the channel; the backend should explicitly filter and validate the configured Movies and Series channel IDs.
- Telegram deep links support a `start` parameter in private bot chats. The parameter allows letters, numbers, underscores, and hyphens, and may be up to 64 characters. The bot receives the value as `/start <parameter>`.
- Telegram's `setWebhook` supports an `allowed_updates` list, so the integration can request only the update types it needs, such as `channel_post`, `edited_channel_post`, and `message`.
- Telegram's `setWebhook` also supports a `secret_token`; the webhook request includes it in the `X-Telegram-Bot-Api-Secret-Token` header, which should be checked before processing an update.
- Telegram retries webhook requests when the endpoint does not return a successful 2xx response, so the channel-ingestion handler must be idempotent and deduplicate updates by Telegram chat and message identifiers.
- A compact opaque token such as `m_<catalog-id>` or `e_<catalog-id>` is safer than exposing raw storage identifiers or file URLs in the public website URL.
- The backend must validate every received `/start` parameter and authorize every bot action independently of the command list shown to users.
- Telegram bot tokens, private channel identifiers, and file-delivery metadata must remain server-side; they must never be embedded in the CineLink browser bundle.

## Architecture implication

The requested flow is event-driven rather than a periodic browser refresh: a private-channel post should be normalized into a catalog record, the website should read the published catalog through a backend API, and the bot should resolve the deep-link token to the corresponding Telegram message or file when the user starts the bot.

## Supabase Runtime Findings

- Supabase Edge Functions run in the Deno-compatible Edge Runtime and are TypeScript-first server-side functions, not a persistent Python worker runtime.
- Supabase documents Edge Functions as suitable for listening to webhooks and integrating with third-party services, with project secrets exposed through server-side environment variables.
- Supabase provides an official Telegram bot example using Edge Functions and the grammY framework, so a TypeScript/Deno bot or webhook handler can run within Supabase if the Python requirement is relaxed.
- If Python remains mandatory, the Python bot should run as a separate always-on service and use Supabase for shared operational APIs, secrets, webhook coordination, or database access; it should not be treated as a Supabase Edge Function process.

## Current Recommended Split

- MongoDB: movies, series, episodes, TMDB metadata, Telegram source chat/message identifiers, publish status, and catalog-specific fields.
- Supabase: admin authentication, webhook/API boundary, operational logs, idempotency records, deep-link token records, and optional user/viewed state.
- Python bot service: Telegram channel ingestion and private-message delivery if Python is retained; alternatively, move the bot webhook/delivery layer to a Supabase Edge Function using TypeScript/Deno.

## Official Supabase Sources

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Telegram Bot example: https://supabase.com/docs/guides/functions/examples/telegram-bot

## Vercel Hosting Findings

- Vercel Functions support official Node.js and Edge runtimes, and Vercel describes each function as an HTTP-oriented function served through its CDN rather than a permanently running worker process.
- Vercel also supports Python functions, but the selected TypeScript bot should use the Node.js runtime for the website API and Telegram webhook handlers.
- Vercel Functions provide automatic concurrency scaling and isolated execution environments, which fit request-driven Telegram webhooks and `/start` deep-link requests.
- A Vercel deployment is therefore suitable for webhook ingestion and bot delivery requests, but not for Telegram long polling or a process that must remain continuously running between requests.
- The Vercel function duration, payload, memory, and bundle-size limits must be checked against the selected deployment plan before adding long-running work or large media processing.

## Official Vercel Sources

- Vercel Functions limits: https://vercel.com/docs/functions/limitations
- Vercel Functions runtimes: https://vercel.com/docs/functions/runtimes
