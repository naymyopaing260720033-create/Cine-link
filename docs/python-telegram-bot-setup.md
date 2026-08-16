# CineLink Python Telegram Bot Setup

## Scope

The Python bot is deployed as the Vercel Function `api/telegram.py`. It accepts authenticated Telegram updates at `POST /api/telegram`, auto-publishes valid private-channel posts, records audit events, sends operational-log messages, and handles CineLink's `/start` delivery payloads.

## Required Vercel Environment Variables

Add these values through **Vercel Project → Settings → Environment Variables**. They are server-side secrets; none use the `VITE_` prefix and none belong in GitHub, source files, or chat messages.

| Name | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather API token for the CineLink bot. |
| `TELEGRAM_WEBHOOK_SECRET` | Random URL-safe secret sent by Telegram in `X-Telegram-Bot-Api-Secret-Token`. Use at least 32 random characters. |
| `TELEGRAM_MOVIES_CHANNEL_ID` | Private Movies source-channel ID, usually beginning with `-100`. |
| `TELEGRAM_SERIES_CHANNEL_ID` | Private Series source-channel ID, usually beginning with `-100`. |
| `TELEGRAM_LOG_CHANNEL_ID` | Private operational-log channel ID, usually beginning with `-100`. |
| `MONGODB_URI` | MongoDB Atlas SRV connection string with a least-privilege application user. |
| `MONGODB_DB_NAME` | Optional MongoDB database name; defaults to `cinelink`. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key; never expose it to the browser. |
| `SUPABASE_AUDIT_TABLE` | Optional audit-table name; defaults to `telegram_audit_events`. |
| `TMDB_API_KEY` | Server-side TMDB v3 API key used to validate the TMDB ID. |

Apply each value to **Production**, **Preview**, and **Development** as appropriate, then redeploy.

## Telegram Channel Setup

1. Create three private Telegram channels: **Movies**, **Series**, and **CineLink Logs**.
2. Add the bot as an administrator to all three channels. It needs access to receive source-channel posts and permission to post messages in `CineLink Logs`.
3. Capture the `-100...` chat IDs from an authenticated test `channel_post` after a temporary webhook setup, or from a trusted admin utility. Do not guess or use a channel username in place of the ID.
4. Use these captions in source channels:

```text
# Movies channel
TMDB_ID: 603
QUALITY: 1080p
LANGUAGE: Myanmar Sub
```

```text
# Series channel
TMDB_ID: 1399
SEASON: 1
EPISODE: 2
QUALITY: 1080p
LANGUAGE: Myanmar Sub
```

Only a `video` or `document` post with a structured caption can publish. `TYPE: MOVIE` or `TYPE: EPISODE` is optional; if supplied, it must match the source channel.

## Supabase Setup

Run [`supabase/telegram_audit_events.sql`](../supabase/telegram_audit_events.sql) once in the Supabase SQL Editor. The table intentionally has RLS enabled and no public policy; only the server's service-role key writes operational records.

## Configure the Telegram Webhook

After Vercel deploys the function, set the webhook from a trusted terminal. Replace the shell variables locally; never paste a real bot token into a repository, browser URL history, or chat message.

```bash
curl --request POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=https://YOUR-VERCEL-DOMAIN/api/telegram" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["channel_post","message"]'
```

Confirm the webhook with:

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## Validation Checklist

1. Run the local unit tests with `python3 -m unittest discover -s tests -v`.
2. Deploy from GitHub to Vercel.
3. Visit `https://YOUR-VERCEL-DOMAIN/api/telegram`; it should return `{"ok":true,"configured":true}` after all secrets are set.
4. Post one valid movie file and one valid episode file to their respective source channels.
5. Confirm a `Published` message appears in `CineLink Logs`, a MongoDB catalog document exists, and a Supabase audit row has status `published`.
6. Post a malformed caption. Confirm it does not publish and a `Rejected` log message plus audit row appears.
7. A temporary TMDB or MongoDB dependency failure returns HTTP `503` only after a durable `retryable_failure` audit record is written. Telegram can retry that update; a successful retry reclaims the same event key without creating a duplicate catalog item or duplicate log notification.

## References

[Telegram Bot API](https://core.telegram.org/bots/api)

[Vercel Python Functions](https://vercel.com/docs/functions/runtimes/python)
