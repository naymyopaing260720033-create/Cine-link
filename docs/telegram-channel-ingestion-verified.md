# Verified Telegram Channel-Ingestion Constraints

## Telegram Bot API

Telegram's Bot API is HTTP-based and supports configuring an HTTPS webhook endpoint with `setWebhook`. For CineLink, the webhook should accept only the update types needed for channel catalog ingestion, particularly `channel_post` and optionally `edited_channel_post`.

The webhook configuration supports a `secret_token`. Telegram includes this configured value in the `X-Telegram-Bot-Api-Secret-Token` header of webhook requests, allowing the application to reject requests that do not present the expected value.

The CineLink bot must be added as an administrator in each private source channel so it can receive the channel post updates and later send video or document media to a user via the deep-link flow.

Source: https://core.telegram.org/bots/api

## Vercel Deployment Boundary

For non-Next applications, Vercel deploys files under `/api` as functions. A TypeScript webhook handler can therefore live at an API route such as `/api/telegram`, receive Telegram's HTTPS request, validate the secret header, persist the parsed catalog record, and return quickly.

The webhook path must be idempotent because the same source post can be retried. The primary idempotency key should combine the private channel ID with Telegram's `message_id`; updates should not be stored solely by TMDB ID because a series may receive multiple episode posts.

Source: https://vercel.com/docs/functions/functions-api-reference

