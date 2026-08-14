# CineLink Backend Blueprint

**Status:** Architecture discussion and pre-implementation design

## Recommended Decision

CineLink အတွက် **Vercel-hosted TypeScript webhook bot** ကို အကြံပြုပါတယ်။ Vercel မှာ website frontend နဲ့ request-driven API routes ကို တစ်နေရာတည်းမှာ deploy လုပ်နိုင်ပြီး Telegram channel updates နဲ့ `/start` deep-link requests ကို webhook endpoint များက လက်ခံနိုင်ပါတယ်။ Vercel Functions မှာ Node.js runtime ကို official support ပြုလုပ်ထားပြီး function များကို request အလိုက် run စေတဲ့ပုံစံဖြစ်တာကြောင့် long polling မဟုတ်တဲ့ Telegram webhook architecture နဲ့ ကိုက်ညီပါတယ်။ [1] [2]

Supabase ကို **admin authentication, operational records, webhook logs, audit records, and optional user state** အတွက် အသုံးပြုမယ်။ MongoDB Atlas ကိုတော့ သင်ရွေးထားသလို **movies, series, episodes, and Telegram source-message mapping** အတွက် အသုံးပြုမယ်။ Supabase နဲ့ MongoDB ကို တာဝန်ခွဲသုံးရင် catalog document structure ကို MongoDB မှာ လွတ်လပ်စွာ စီမံနိုင်ပြီး admin/security/audit data ကို Supabase မှာ သီးခြားထိန်းနိုင်ပါတယ်။

> Vercel သည် Telegram bot process ကို 24/7 background worker အဖြစ် အမြဲ run ထားမည်မဟုတ်ပါ။ Telegram update ရှိသည့်အချိန်တိုင်း Vercel Function ကို webhook ဖြင့် ခေါ်မည်ဖြစ်သောကြောင့် bot သည် user အမြင်တွင် အမြဲ reachable ဖြစ်နေမည်ဖြစ်သည်။ Long polling သို့မဟုတ် persistent worker လိုအပ်သည့်အလုပ်များကို Vercel webhook route ထဲ မထည့်သင့်ပါ။

## Deployment Topology

```text
Private Movies Channel ─┐
                        ├─ Telegram Webhook ── Vercel Node.js Function
Private Series Channel ┘                         │
                                                  ├─ Parse caption
                                                  ├─ Validate channel + media
                                                  ├─ Upsert MongoDB catalog
                                                  ├─ Write Supabase sync/audit log
                                                  └─ Refresh website-visible catalog

CineLink Website ── Vercel frontend/API ── MongoDB catalog
                                 │
                                 └─ Supabase Auth + operational data

User clicks Watch Here ── Telegram /start deep-link
                                 │
                                 └─ Vercel Function resolves token
                                    and calls Telegram Bot API
                                    to copy the private source message
```

Vercel Function duration, payload, memory, and bundle-size limits vary by configuration and deployment plan, so the webhook should perform short validation and database writes rather than download or transcode media. [2] Telegram က private channel message ကို server က download လုပ်စရာမလိုဘဲ Bot API မှတစ်ဆင့် source message ကို copy/forward လုပ်စေခြင်းက ဒီကန့်သတ်ချက်များကို ရှောင်ရှားရန် ပိုသင့်တော်ပါတယ်။

## Vercel Function Boundaries

| Route | Method | Responsibility | Public or private |
|---|---|---|---|
| `/api/telegram/webhook` | `POST` | `channel_post` updates လက်ခံခြင်း၊ caption parse ခြင်း၊ MongoDB upsert နှင့် sync log ရေးခြင်း | Telegram secret header ဖြင့်ကာကွယ်ထားသော public endpoint |
| `/api/telegram/start` | `GET` or `POST` | Website ကထုတ်ပေးသော opaque token ကို resolve လုပ်ပြီး Telegram Bot API ဖြင့် source message copy လုပ်ခြင်း | Public request; token validation နှင့် rate limit လို |
| `/api/catalog` | `GET` | Website အတွက် published movies, series, episodes data ပြန်ပေးခြင်း | Public read-only |
| `/api/admin/catalog` | `POST/PATCH/DELETE` | Manual correction, publish/unpublish, poster override နှင့် episode edit | Supabase Auth admin only |
| `/api/health` | `GET` | Vercel, MongoDB, Supabase connectivity နှင့် last webhook status စစ်ခြင်း | Public-safe health response |

Webhook handler သည် Telegram request ရောက်လာသည်နှင့် authentication, source channel allowlist, caption validation နှင့် duplicate check ကို အရင်လုပ်ရပါမယ်။ Poster metadata ကို TMDB မှ ဆွဲယူခြင်းက webhook response ကို မလိုအပ်ဘဲကြာစေမည်ဆိုပါက catalog record ကို `metadata_pending` အဖြစ်သိမ်းပြီး သီးခြား retryable job သို့မဟုတ် admin refresh action ဖြင့် update လုပ်သင့်ပါတယ်။

## Caption Contract

Caption format ကို လူဖတ်လွယ်ပြီး parser က တိတိကျကျဖတ်နိုင်အောင် key-value lines သုံးပါမယ်။ `TMDB_ID` ကို မဖြစ်မနေထည့်စေခြင်းက title-only matching မှားယွင်းမှုကို လျှော့ချပါမယ်။

### Movie post

```text
TYPE: MOVIE
TMDB_ID: 12345
TITLE: Example Movie
YEAR: 2026
```

### Series episode post

```text
TYPE: EPISODE
TMDB_ID: 67890
SEASON: 1
EPISODE: 3
EPISODE_TITLE: The Return
```

Parser က `TYPE`၊ `TMDB_ID`၊ `SEASON`၊ `EPISODE` တို့ကို validate လုပ်ရမည်။ Movies channel မှ `TYPE: EPISODE` ဝင်လာလျှင် reject လုပ်ပြီး error log ရေးရမည်။ Series channel မှ movie type ဝင်လာလျှင်လည်း အလားတူ reject လုပ်ရမည်။ Episode တစ်ပိုင်းစီကို post တစ်ခုချင်းတင်ခြင်းက NEW badge, season/episode picker နှင့် Telegram delivery mapping ကို အရှင်းဆုံးဖြစ်စေပါတယ်။

## Data Ownership

| Data group | Primary store | Core fields |
|---|---|---|
| Movie catalog | MongoDB | `tmdbId`, `title`, `posterPath`, `backdropPath`, `overview`, `status`, `publishedAt` |
| Series catalog | MongoDB | `tmdbId`, `title`, `posterPath`, `backdropPath`, `overview`, `status`, `publishedAt` |
| Episodes | MongoDB | `seriesId`, `seasonNumber`, `episodeNumber`, `episodeTitle`, `publishedAt`, `status` |
| Telegram source | MongoDB | `channelId`, `messageId`, `chatType`, `mediaType`, `telegramFileId`, `targetType`, `targetId` |
| Admin accounts | Supabase Auth | Admin identity, role, active status |
| Webhook and audit logs | Supabase | Event ID, source message, result, error, retry count, timestamps |
| Deep-link tokens | Supabase or MongoDB | Token hash, target type, target ID, expiry, used count |
| Viewed state | Initially localStorage; later Supabase | User/browser identity, target ID, viewed timestamp |

MongoDB မှာ `telegram_sources` collection အတွက် `{ channelId, messageId }` unique index ထားရပါမယ်။ Telegram webhook retry ဖြစ်ပါက တူညီသော channel post ကို ထပ်မသိမ်းဘဲ ယခင် record ကို ပြန်အသုံးပြုနိုင်ရန် ဒီ idempotency key က အရေးကြီးပါတယ်။

## End-to-End Flow

### Channel publish

Admin က private Movies သို့မဟုတ် Series channel ထဲ video/document post တင်ပါမယ်။ Bot သည် channel နှစ်ခုစလုံးတွင် admin ဖြစ်ရမည်။ Telegram က `channel_post` update ကို Vercel webhook route ဆီပို့မည်ဖြစ်ပြီး route က Telegram secret header ကိုစစ်ပြီး allowlisted channel ID ဟုတ်မဟုတ် စစ်ပါမယ်။ Telegram Bot API တွင် webhook update များကို HTTPS endpoint သို့ ပို့နိုင်ပြီး `allowed_updates` ဖြင့် လိုအပ်သည့် update type များကို ကန့်သတ်နိုင်ပါတယ်။ [3]

Caption မှ metadata ကို parse ပြီး MongoDB ထဲ movie/series/episode record နှင့် `telegram_sources` mapping ကို upsert လုပ်ပါမယ်။ Website သည် catalog API မှ `publishedAt` နှင့် `status: published` record များကို ဖတ်ပြီး card/detail/season picker တွင် NEW badge ပြပါမယ်။ User က item ကိုဖွင့်ကြည့်ပြီးနောက် badge ဖျောက်ခြင်းကို ပထမအဆင့်မှာ localStorage ဖြင့် ဆက်သုံးနိုင်ပြီး login ထည့်ပြီးနောက် Supabase user ID ဖြင့် server-side state သို့ ပြောင်းနိုင်ပါတယ်။

### Watch Here delivery

Website က raw private-channel URL မပေးဘဲ opaque token deep-link ထုတ်ပါမယ်။ ဥပမာ `https://t.me/YourBot?start=m_x7k29` သို့မဟုတ် `https://t.me/YourBot?start=e_p4n81` ဖြစ်နိုင်ပါတယ်။ Telegram deep-link parameter သည် bot ဆီ `/start` parameter အဖြစ် ရောက်ပြီး allowed character set နဲ့ length limit ရှိတာကြောင့် token ကို တိုတောင်းပြီး random ဖြစ်အောင်ထုတ်သင့်ပါတယ်။ [4]

User က Telegram ထဲတွင် Start နှိပ်သောအခါ Vercel `/api/telegram/start` route သည် token ကို validate လုပ်ပြီး source record ကိုရှာပါမယ်။ ထို့နောက် Telegram Bot API ဖြင့် private channel ထဲက source message ကို user chat ထဲ copy/forward လုပ်ပါမယ်။ Token ထဲတွင် MongoDB ID သို့မဟုတ် private channel ID ကို တိုက်ရိုက်မထည့်ဘဲ server-side mapping သာသုံးသင့်ပါတယ်။

## Security and Reliability Rules

| Rule | Implementation |
|---|---|
| Webhook authentication | Telegram webhook `secret_token` နှင့် request header ကိုစစ်ခြင်း |
| Channel authorization | `MOVIES_CHANNEL_ID` နှင့် `SERIES_CHANNEL_ID` allowlist နှင့် update chat ID စစ်ခြင်း |
| Duplicate protection | `channelId + messageId` unique key နှင့် idempotent upsert |
| Secret isolation | Telegram token, MongoDB URI, Supabase service-role key, channel IDs ကို Vercel server environment variables ထဲတွင်သာထားခြင်း |
| Deep-link privacy | Opaque random token သုံးခြင်း၊ raw message ID/channel ID မဖော်ပြခြင်း၊ expiry နှင့် rate limit ထားခြင်း |
| Error handling | Invalid caption, unknown TMDB ID, unavailable source message, and Telegram API failure ကို Supabase audit log ထဲရေးခြင်း |
| Recovery | Failed sync ကို status နှင့် retry count ဖြင့်သိမ်းပြီး admin retry action ထားခြင်း |
| Media safety | Vercel Function ထဲ media download/transcode မလုပ်ဘဲ Telegram source message ကို copy/forward လုပ်ခြင်း |

## Implementation Order

အကောင်းဆုံး implementation အစီအစဉ်က ပထမဆုံး MongoDB schema နှင့် caption parser ကို unit-test လုပ်ခြင်း၊ ထို့နောက် Vercel webhook route ဖြင့် channel post ကို ingest လုပ်ခြင်း၊ catalog API ဖြင့် website ကို MongoDB data ဖတ်စေခြင်း၊ deep-link resolver နှင့် Telegram delivery ကို ထည့်ခြင်း၊ နောက်ဆုံး Supabase Auth/admin correction tools နှင့် audit/retry UI ကို ထည့်ခြင်းဖြစ်ပါတယ်။

လက်ရှိ CineLink project သည် frontend-only ဖြစ်သောကြောင့် ဒီ backend feature ကို စတင်မည်ဆိုလျှင် Vercel API routes/server-side code, environment variables, MongoDB connection layer, Supabase client/server utilities, Telegram webhook handler နှင့် admin authentication တို့ကို ထည့်သွင်းရပါမယ်။ Implementation မစမီ အောက်ပါဆုံးဖြတ်ချက်များကို အတည်ပြုရန်လိုပါတယ်။

| Decision | Recommended default |
|---|---|
| Bot runtime | Vercel Node.js/TypeScript webhook, long polling မသုံးခြင်း |
| Catalog database | MongoDB Atlas |
| Operational/auth database | Supabase Auth + Postgres tables |
| Caption format | Key-value format shown above |
| Series ingestion | Episode တစ်ပိုင်းစီ channel post တစ်ခုချင်း |
| Media handling | Telegram source message ကို copy/forward; Vercel မှ download မလုပ်ခြင်း |
| Website catalog | Admin channel ထဲ publish လုပ်ထားသော items ကို streaming-available catalog အဖြစ် သီးခြားပြခြင်း |

### References

[1]: https://vercel.com/docs/functions/runtimes "Vercel Functions Runtimes"
[2]: https://vercel.com/docs/functions/limitations "Vercel Functions Limits"
[3]: https://core.telegram.org/bots/api "Telegram Bot API"
[4]: https://core.telegram.org/bots/features "Telegram Bot Features — Deep Linking"
[5]: https://supabase.com/docs/guides/functions "Supabase Edge Functions"
[6]: https://supabase.com/docs/guides/functions/examples/telegram-bot "Supabase Telegram Bot Example"
