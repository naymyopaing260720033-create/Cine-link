# CineLink လက်ရှိ Code အလုပ်လုပ်ပုံ

**ရည်ရွယ်ချက်။** CineLink သည် movie/series metadata ကို TMDB မှဖတ်ပြသပြီး၊ actual video file ကို website ပေါ်မတင်ဘဲ private Telegram channels နှင့် bot မှတစ်ဆင့်ပို့ပေးရန် ဒီဇိုင်းလုပ်ထားသော application ဖြစ်သည်။ အဓိကအားဖြင့် public movie-browsing website တစ်ခုနှင့် server-side Telegram webhook bot တစ်ခု ပေါင်းစပ်ထားခြင်းဖြစ်သည်။

> Website က movie/series ကို **ရှာဖွေကြည့်ရန်** ဖြစ်ပြီး၊ Telegram bot က authorized user ဆီသို့ **source-channel media ကို copy ပို့ရန်** ဖြစ်သည်။

## 1. နည်းပညာတည်ဆောက်ပုံ

| အပိုင်း | အသုံးပြုထားသည့်နည်းပညာ | တာဝန် |
|---|---|---|
| Public website | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui | TMDB data ကိုဖတ်ပြခြင်း၊ user UI၊ favorites နှင့် theme memory |
| Client-side routing | Wouter | Home, movie, series, search, favorites စသည့် SPA routes များ |
| Movie metadata | TMDB API | Title, poster, backdrop, trailer, season/episode, similar titles |
| Telegram webhook | Python + FastAPI | Telegram update လက်ခံခြင်း၊ channel post စစ်ခြင်း၊ `/start` command ကို ကိုင်တွယ်ခြင်း |
| Main catalog store | MongoDB Atlas | Published movies/episodes, media mapping, processed events, notification state |
| Audit store | Supabase | Published/rejected/retryable events အတွက် audit rows |
| Hosting | Vercel | React static site နှင့် `/api/telegram` Python serverless endpoint |

React route map ကို `client/src/App.tsx` မှာသတ်မှတ်ထားပြီး `/`, `/movie/:id`, `/tv/:id`, `/search`, `/favorites` နှင့် အခြား support routes များကို handle လုပ်ထားသည်။ Dark theme ကို default ထားပြီး light mode ပြောင်းနိုင်သလို favorites state အားလုံးကို provider အောက်တွင်ထိန်းထားသည်။ [1]

## 2. Frontend: Website ပိုင်း

### Home page

`client/src/pages/Home.tsx` က TMDB datasets အများအပြားကို parallel fetch လုပ်ပြီး Home UI ကိုဖန်တီးသည်။ Featured hero အတွက် movie pool တည်ဆောက်ကာ 9 seconds တိုင်း auto-rotate လုပ်သည်။ Artwork ပြောင်းချိန်တွင် 250ms cross-fade ဖြစ်ပြီး dot navigation ဖြင့် user က manually ရွေးနိုင်သည်။

Home rail order သည် **Recently Added → Movies → Series → Latest Update** ဖြစ်သည်။ Recently Added က movie-only, newest-first dataset ကိုသုံးပြီး user မကြည့်ရသေးသော movie တွင် `NEW` badge ပြသည်။ User က detail page ဖွင့်ပြီးနောက် အဲဒီ movie ID ကို browser local storage တွင်မှတ်ထားလို့ နောက်တစ်ကြိမ် Home ဝင်လျှင် badge ပျောက်သွားသည်။

| Frontend feature | လုပ်ပုံ |
|---|---|
| Hero | TMDB movie posters/backdrops, auto rotation, dot controls, responsive desktop/mobile layout |
| Loading UX | Shimmer/skeleton components ဖြင့် TMDB fetch စောင့်ချိန်ကိုဖုံးပေးခြင်း |
| Movie card | Poster, rating score, hover effect, compact mobile sizing |
| Trailer | YouTube trailer ရှိလျှင် detail page အတွင်း inline play; မရှိလျှင် unavailable state |
| Similar titles | TMDB similar endpoint မှ movie/series rail ပြခြင်း |
| Search | Movies နှင့် series နှစ်မျိုးလုံးကိုရှာနိုင်ခြင်း |
| Dark / Light | Browser preference ကို local storage တွင်သိမ်းပြီး persistent theme toggle ပေးခြင်း |

### Movie နှင့် Series detail pages

Movie detail page က title, poster, description, rating, cast, inline trailer, favorite control နှင့် Similar Movies rail ကိုပြသည်။ Movie detail ဝင်ချိန်တွင် user ကအဲဒီ movie ကိုကြည့်ပြီးပြီဟု local storage တွင်မှတ်ထားလို့ Home ရှိ `NEW` badge ကို auto-hide လုပ်ပေးသည်။

Series detail page က ပိုမိုရှုပ်ထွေးသည်။ Series metadata ကိုရယူပြီး season list ကိုပြသကာ user ရွေးသော season အတွက် episodes ကို fetch လုပ်သည်။ Selected season/episode ကို Continue Watching data အဖြစ် browser local storage တွင်သိမ်းထားသောကြောင့် နောက်တစ်ကြိမ်ပြန်ဝင်လျှင် အရင်ကြည့်ထားသည့် episode ကို ပြန်ရွေးပေးနိုင်သည်။ `Watch Here` ခလုတ်က selected episode အတွက် Telegram deep link ကိုတည်ဆောက်သည်။ [2]

### Watch link ၏အဓိပ္ပါယ်

Website ရှိ `Watch Here` ခလုတ်သည် video URL တိုက်ရိုက်မဟုတ်ပါ။ Telegram bot ထံသို့ payload ပါသော link ဖြင့်သွားစေသည်။ Movie အတွက် `m_<tmdbId>`၊ episode အတွက် `s_<tmdbId>_s<season>_e<episode>` ပုံစံ payload သုံးသည်။ Bot က `/start <payload>` ရလာလျှင် MongoDB ထဲက သက်ဆိုင်ရာ source channel/message mapping ကိုရှာပြီး user chat သို့ media ကို copy ပို့ပေးသည်။

## 3. Telegram webhook backend

### Endpoint နှင့် security gate

`api/telegram.py` သည် Vercel ပေါ်ရှိ FastAPI entrypoint ဖြစ်ပြီး `POST /api/telegram` ကိုလက်ခံသည်။ Telegram ကပို့သော `X-Telegram-Bot-Api-Secret-Token` header နှင့် Vercel environment variable ထဲက webhook secret ကို constant-time comparison ဖြင့်စစ်သည်။ မကိုက်ညီလျှင် `403` ပြန်ပေးသည်။ JSON format မမှန်လျှင် `400`၊ temporary dependency failure ဖြစ်လျှင် Telegram ပြန်ပို့နိုင်ရန် `503` ပြန်ပေးသည်။ [3]

`GET /api/telegram` သည် secret မဖော်ပြသော health response သာပေးသည်။ Environment variables မပြည့်စုံလျှင် `configured: false` ဟုသာပြမည်ဖြစ်ပြီး bot token ကိုပြန်မပို့ပါ။

### Server-only configuration

`bot/config.py` က sensitive values အားလုံးကို `os.getenv()` ဖြင့် environment မှသာဖတ်သည်။ Code ထဲတွင် Telegram bot token၊ MongoDB URI သို့မဟုတ် Supabase service-role key value မပါပါ။ [4]

| Environment variable | အဓိပ္ပါယ် |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather မှရသော bot access token |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook header စစ်ရန် user-generated random secret |
| `TELEGRAM_MOVIES_CHANNEL_ID` | Movies private source channel ID |
| `TELEGRAM_SERIES_CHANNEL_ID` | Series private source channel ID |
| `TELEGRAM_LOG_CHANNEL_ID` | CineLink Logs private channel ID |
| `MONGODB_URI`, `MONGODB_DB_NAME` | MongoDB Atlas connection နှင့် database name |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase audit logging server credentials |
| `TMDB_API_KEY` | Backend အတွက် TMDB API key |

> **အရေးကြီးသည်။** အထက်ပါ values များကို Vercel Project Settings → Environment Variables တွင်သာထည့်ရမည်။ Frontend `VITE_` variable, GitHub, source code, သို့မဟုတ် chat တွင် မထည့်ရပါ။

## 4. Channel post မှ website catalog သို့သွားသည့် flow

Admin က bot ကို administrator လုပ်ထားသည့် private source channel ထဲသို့ video/document နဲ့ structured caption တင်လျှင် အောက်ပါအတိုင်းအလုပ်လုပ်သည်။

```text
Admin private Movies / Series channel post
        ↓
Telegram sends channel_post webhook to /api/telegram
        ↓
Webhook secret validation
        ↓
Allowlisted channel ID check + idempotency event claim
        ↓
Caption parse + TMDB verification
        ↓
MongoDB catalog/media mapping upsert
        ↓
Supabase audit row write
        ↓
CineLink Logs channel notification
        ↓
Website / bot delivery can use the new catalog mapping
```

`bot/service.py` သည် ဒီ flow ကိုညှိနှိုင်းသော core service ဖြစ်သည်။ Source channel ID က Movies channel နှင့်ကိုက်လျှင် movie၊ Series channel နှင့်ကိုက်လျှင် episode အဖြစ်သတ်မှတ်သည်။ ခွင့်မပြုထားသော channel မှ update များကို ignore လုပ်သည်။ [5]

### Caption contract

Movie post အတွက် အနည်းဆုံး caption သည် အောက်ပါပုံစံဖြစ်ရမည်။

```text
TMDB_ID:550
```

Series episode အတွက် season/episode ပါရမည်။

```text
TMDB_ID:1396
SEASON:1
EPISODE:1
```

Parser က `TMDB_ID`, `SEASON`, `EPISODE` ကို positive integers အဖြစ်စစ်ပြီး caption structure မမှန်လျှင် rejected ဖြစ်စေသည်။ Post တွင် video သို့မဟုတ် document မပါလျှင်လည်း rejected ဖြစ်သည်။ Optional metadata fields (`TITLE`, `YEAR`, `QUALITY`, `LANGUAGE` စသည်) ကို support လုပ်ထားသော်လည်း TMDB validation ကိုအခြေခံထားသည်။

### Idempotency နှင့် notifications

Channel ID + Telegram message ID ဖြင့် `telegram:<channelId>:<messageId>` event key ဖန်တီးသည်။ MongoDB က event ကိုတစ်ကြိမ်သာ claim လုပ်ခွင့်ပေးသောကြောင့် Telegram webhook retry ဖြစ်လျှင် catalog ထဲ duplicate title မပေါ်စေပါ။ Publish success, invalid caption/rejection နှင့် retryable infrastructure failure ဖြစ်သည့်အခါ private `CineLink Logs` channel သို့ တစ်ကြိမ်စီ notification ပို့ရန် notification-claim state ကိုသုံးထားသည်။ [5]

**လက်ရှိ code အားသတိပြုရန်။** Duplicate update တွေ့လျှင် service က `duplicate` result ဖြင့်စောစောပြန်လာပြီး CineLink Logs channel သို့ မပို့ပါ။ Supabase duplicate-audit row ကိုအထူးရေးရန် requirement ရှိလျှင် အဲဒီ branch တွင် audit call တစ်ခုထပ်ထည့်ရမည်။

## 5. MongoDB နှင့် Supabase တာဝန်ခွဲထားပုံ

| Storage | သိမ်းသည့်အရာ | ဘာကြောင့်သုံးသလဲ |
|---|---|---|
| MongoDB Atlas | Movies, series, episodes, Telegram media source mapping, processed updates, notification states | Catalog upsert၊ lookup နှင့် idempotency အတွက် |
| Supabase | `telegram_audit_events` operational history | Published/rejected/retryable events ကို စစ်ဆေးရန် |

`supabase/telegram_audit_events.sql` သည် `event_key` ကို unique ထားပြီး status, source channel/message, content type, TMDB ID, season/episode, error reason နှင့် timestamp ကိုသိမ်းသည်။ Table တွင် Row Level Security (RLS) ကို enable လုပ်ထားပြီး public policy ထည့်မထားပါ။ [6]

MongoDB integration layer သည် indexes ဖန်တီးခြင်း၊ event claim လုပ်ခြင်း၊ media-to-content mapping သိမ်းခြင်းနှင့် `/start` အတွက် content lookup လုပ်ခြင်းတို့ကိုကိုင်တွယ်သည်။ Telegram client က log notification အတွက် `sendMessage` နှင့် user delivery အတွက် `copyMessage` ကိုသုံးသည်။ TMDB client က content ID အမှန်ဖြစ်ကြောင်းစစ်ပြီး temporary error နှင့် invalid content error ကိုခွဲပေးသည်။

## 6. Vercel deployment

`vercel.json` က frontend build ကို `pnpm run build:client` ဖြင့်လုပ်ပြီး `dist/public` ကို output အဖြစ်သုံးသည်။ SPA route များကို `index.html` သို့ rewrite လုပ်ပေမယ့် `/api/*` ကို rewrite မှဖယ်ထားသောကြောင့် Vercel က `api/telegram.py` ကို serverless Python function အဖြစ်လက်ခံနိုင်သည်။ [7]

| လက်ရှိအဆင့် | အခြေအနေ |
|---|---|
| Frontend code | ပြီးစီးပြီး GitHub `main` တွင်ရှိ |
| Python webhook source | ရေးပြီး tests ပါရှိ |
| Vercel environment variables | ထည့်ရန်လိုသေး |
| Supabase SQL schema | SQL Editor တွင် one-time run လုပ်ရန်လိုသေး |
| Telegram webhook | Vercel URL သို့ `setWebhook` လုပ်ရန်လိုသေး |
| Live end-to-end post | Environment setup ပြီးမှစမ်းရန်လိုသေး |

Vercel variables မထည့်ရသေးသောအခြေအနေတွင် Telegram bot account သည် Telegram ပေါ်မှာရှိနေမည်ဖြစ်သော်လည်း CineLink serverless backend က channel auto-publish၊ log notification၊ `/start` media delivery ကို မလုပ်နိုင်သေးပါ။

## 7. Tests နှင့် လက်ရှိ protection

Backend တွင် caption parser, deep-link builder, log-notification payload နှင့် webhook import အတွက် Python test files ရှိသည်။ Log notification tests များသည် mock များကိုသုံးထားသောကြောင့် private log channel သို့ တကယ် message မပို့ဘဲ payload structure ကိုစစ်နိုင်သည်။

လက်ရှိ security protections များမှာ webhook secret-header check, source-channel allowlist, server-only secret configuration, MongoDB event idempotency, no public Supabase policy, နှင့် Git ignore rules များဖြစ်သည်။ GitHub `main` branch ကို security scan လုပ်ပြီး bot token, MongoDB credential URI, Supabase service key, `.env` files နှင့် private keys မပါကြောင်း အတည်ပြုပြီးဖြစ်သည်။

## 8. ယခုလုပ်ရမည့် setup အစဉ်

1. Vercel တွင် required environment variables အားလုံးကို Production အတွက်ထည့်ပါ။
2. Supabase SQL Editor မှာ `supabase/telegram_audit_events.sql` ကို run ပါ။
3. Movies, Series, CineLink Logs channel များတွင် bot ကို administrator အဖြစ်ထည့်ပါ။
4. Telegram `setWebhook` ကို `https://<your-vercel-domain>/api/telegram` သို့ webhook secret ဖြင့် configure လုပ်ပါ။
5. Movies channel တွင် video/document + `TMDB_ID:550` test post တင်ပါ။
6. MongoDB catalog row, Supabase audit event, CineLink Logs notification နှင့် website/bot delivery flow ကိုစစ်ပါ။

## References

[1]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/client/src/App.tsx "CineLink React route and provider configuration"
[2]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/client/src/pages/TvDetail.tsx "CineLink series detail and Continue Watching flow"
[3]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/api/telegram.py "CineLink Vercel Telegram webhook endpoint"
[4]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/bot/config.py "CineLink server-only environment configuration"
[5]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/bot/service.py "CineLink publication and Telegram delivery service"
[6]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/supabase/telegram_audit_events.sql "CineLink Supabase audit table schema"
[7]: https://github.com/naymyopaing260720033-create/Cine-link/blob/main/vercel.json "CineLink Vercel build and rewrite configuration"
