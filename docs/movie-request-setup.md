# CineLink — Movie Request Workflow

## What the feature does

CineLink visitors can submit a movie request by entering only a movie name. They do not need an account, and the form does not collect a Telegram username, email address, or other contact details. The request server normalizes the name and checks the `movie_requests` MongoDB collection.

When a title is new, CineLink creates one MongoDB document and posts a plain-text notification to the private **CineLink Requests** Telegram channel. When a visitor requests an existing `new` or `searching` title again, CineLink increases its `requestCount` and `lastRequestedAt` only. It intentionally does not send a second Telegram notification.

> The Requests channel is an operational queue only. It does not trigger the Movies/Series auto-publishing bot flow and it must not be added to the Movies or Series ingest allowlist.

## Admin workflow

Open `/admin`, sign in with the CineLink owner account, and scroll to **Audience requests → Movie Requests**. Each request shows the requested title, demand count, and the time of the most recent request.

| Admin action | Effect |
|---|---|
| `New` | Default state for a newly received request. |
| `Searching` | The title is being checked or sourced. |
| `Available` | The title is now available for CineLink viewers. |
| `Declined` | The title will not be added. |
| Internal note | Optional private context for the CineLink admin team. It is never shown publicly. |
| Delete | Permanently removes the request record from MongoDB. Use only for clear mistakes or unwanted entries. |

## Required deployment configuration

The development environment has validated the current values. Before a Vercel deployment, ensure the same server-only variables exist in **Vercel Project Settings → Environment Variables** for the Production environment.

| Variable | Required value |
|---|---|
| `MONGODB_URI` | MongoDB Atlas `mongodb+srv://...` connection string. |
| `MONGODB_DB_NAME` | `cinelink` is the recommended database name. |
| `TELEGRAM_BOT_TOKEN` | BotFather token for the CineLink Telegram bot. Never expose it in the browser or GitHub. |
| `TELEGRAM_REQUESTS_CHANNEL_ID` | Numeric ID of the private CineLink Requests channel, usually starting with `-100`. |

The Telegram bot must be added as an administrator of the private Requests channel and be permitted to post messages. The request server sends the message through the Telegram Bot API; no visitor credential is used.

## Vercel routing

`api/[...all].ts` is the Node serverless bridge for CineLink's tRPC, OAuth, and storage endpoints. `api/telegram.py` remains the dedicated Python Telegram webhook endpoint. The SPA rewrite excludes `/api/*`, so public page routing and server API routing remain separate.

After adding or changing an environment variable in Vercel, redeploy the project. Test the workflow by submitting a movie name on the Home footer or Search page, then verify one matching message arrives in the private Requests channel and the request appears under `/admin`.

## Operational guardrails

The public form limits names to 2–180 characters, has a 60-second browser-side cooldown, and includes a hidden honeypot field. The server requires a valid title, keeps all MongoDB and Telegram credentials server-side, and restricts the request list/update/delete procedures to authenticated admins.

Movie posters, video files, and visitor-identifying information are not stored in the MongoDB request documents.

## Live submission verification

On 2026-08-27, the public Home request form submitted a new title and received an `accepted: true`, `duplicate: false` response from the CineLink server. The request was intentionally sent only after operator confirmation. A read-only MongoDB verification confirmed the record exists with `requestCount: 1`, `notificationStatus: sent`, and a Telegram notification timestamp. The test request is visible in the authenticated Admin Editor queue and may be deleted there after review.
