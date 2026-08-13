# Movie Stream — Design Brainstorm

## Three Stylistic Approaches

### 1. Midnight Marquee
A dark, cinematic theatre-inspired aesthetic with warm amber accents evoking vintage marquee signage and glowing projector light. Emotional intent: the hush of a cinema before the show begins.
**Probability: 0.07**

### 2. Broadcast Blueprint
A light, editorial design language inspired by film-distribution trade papers — cream paper background, red stamp accents, typewriter-style details. Feels like a film catalog you can hold.
**Probability: 0.02**

### 3. Signal Pop
A bold, saturated post-cinema style — electric crimson and off-white, brutalist oversized numerals and poster-collage layouts. High energy, street-poster vibes.
**Probability: 0.05**

---

## CHOSEN: Midnight Marquee

### Design Movement
Cinematic Modernism — a blend of classic theatre marquee signage (neon-warm glow, ticket textures) with contemporary streaming UI craft (Netflix-scale card grids, editorial detail pages).

### Core Principles
1. **Cinema-first darkness** — backgrounds are near-black with a warm charcoal undertone, never flat #000.
2. **Amber projection light** — a single warm accent (#f0a32e family) used like a spotlight: sparse, deliberate, always signaling "play / watch".
3. **Poster-led composition** — movie artwork carries the visual weight; UI chrome recedes.
4. **Physical media textures** — subtle grain, ticket stubs, marquee borders give digital depth.

### Color Philosophy
Dark charcoal-navy base (oklch ~0.16 hue 260) mimicking an unlit cinema hall; warm amber accent evokes the glow of the projector beam and vintage marquee bulbs; muted gold for ratings. Text is warm off-white. The palette says: "settle in, the show is starting."

### Layout Paradigm
Asymmetric hero with oversized poster bleeding off-canvas right, horizontal rail-based browsing (Netflix-style rows with scroll snapping), and detail pages split into a 1/3 poster rail + 2/3 content zone. Avoid centered symmetric blocks.

### Signature Elements
1. **Marquee chip** — amber-bordered pill with corner notches, used for "WATCH NOW / TELEGRAM STREAM" CTAs.
2. **Rating marquee** — star + golden numeral like a cinema lobby display.
3. **Film grain overlay** — a barely-visible noise layer over hero and cards.

### Interaction Philosophy
Interactions feel like theatre mechanics: hovers "light up" posters (scale 1.03 + amber rim), CTAs press down like physical buttons (scale 0.97, 140ms). Telegram CTA opens a direct conversation link — one click to the bot.

### Animation
Entrance: fade+translateY(12px) staggered 50ms per card, 300ms ease-out. Hover on posters: scale 1.04, 220ms cubic-bezier(0.23,1,0.32,1), amber border glow. Marquee chip: subtle box-shadow pulse on hover (amber glow). No scroll-jacking; respect prefers-reduced-motion.

### Typography System
- Display: **Fraunces** (700/900) — cinematic serif with optical size, evoking marquee lettering.
- Body/UI: **Inter Tight** (400/500/600) — clean, modern, tight tracking.
- Numerals/ratings: Fraunces 700 in amber.
- Hierarchy: hero titles 3–5rem Fraunces; section headers 1.5rem Fraunces 700 uppercase letterspaced; metadata 0.8rem uppercase tracking-widest in muted gold.

### Brand Essence
CineLink — a catalogue-to-Telegram streaming bridge for cinephiles; for movie lovers who watch through Telegram channels; different because it pairs TMDB's beautiful data with instant bot-delivered streams. Personality: **cinematic, warm, effortless**.

### Brand Voice
Headlines sound like marquee announcements. CTAs are direct imperatives.
- Example headline: "Tonight's Feature, Delivered by Telegram."
- Example CTA: "Send '/movie' to the bot"

### Wordmark & Logo
Logotype "CineLink" in Fraunces 900 with the dot over the 'i' replaced by an amber film-frame square. Mark: a bold amber film-reel/play hybrid glyph, no text, transparent PNG.

### Signature Brand Color
Marquee Amber — oklch(0.78 0.15 70) — the glow that unmistakably owns the brand.

## Telegram Integration Plan (functional spec)
- TMDB API (free public endpoints, API key configurable via env constant `VITE_TMDB_API_KEY`, fallback to demo via env-driven switch).
- Each movie detail page exposes a "Watch on Telegram" CTA linking to `https://t.me/<bot_username>` (configured via `VITE_TELEGRAM_BOT` and optional deep-link `?start=movie_<id>`).
- Local config file `lib/config.ts` centralizes BOT username + instructions text so the owner can edit one place.
- Optional admin-configurable: a `client/src/pages/Admin.tsx` (protected by simple localStorage token) to edit bot username and per-movie notes — since static site, config persists in localStorage + exported JSON.
