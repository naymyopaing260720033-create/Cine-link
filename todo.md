# CineLink Task Checklist

## Dark / Light Mode

- [x] Inspect and align the existing ThemeProvider with CineLink's Midnight Marquee tokens.
- [x] Add a persistent, accessible Dark/Light mode control to the shared header and mobile navigation.
- [x] Define a readable light cinema palette while preserving the amber/gold brand accent.
- [x] Verify the shared layout across home, detail, browse, and favorites pages at desktop and mobile widths.
- [x] Run TypeScript and production build checks.

## Light Mode Contrast Refinement

- [x] Inspect the Home hero backdrop layers and theme-specific text contrast.
- [x] Refine Light mode hero overlay strength and gradient direction without weakening Dark mode.
- [x] Refine movie and series poster hover scrims, CTA chips, and favorite controls for Light mode.
- [x] Verify desktop and mobile screenshots and run checks.

## Simplified Public Navigation

- [x] Inspect the shared desktop/mobile menu and browse route handling.
- [x] Replace genre links with Home, Movies, and Series only.
- [x] Verify each navigation item at desktop and mobile widths.

## Recently Added Section

- [x] Inspect Home rail composition and TMDB endpoints for recent movie and series data.
- [x] Add a responsive Recently Added horizontal section with loading skeletons.
- [x] Verify populated and fallback states at desktop and mobile widths.

## Similar Titles on Detail Pages

- [x] Inspect movie and series detail layouts, TMDB types, and reusable rail components.
- [x] Add TMDB similar-content endpoints and responsive rails below both detail pages.
- [x] Verify populated, loading, empty, and responsive states.

## Home Mobile Hero Spacing

- [x] Inspect the mobile hero height and the gap before the Movies section.
- [x] Tighten the mobile-only hero spacing without changing the desktop composition.
- [x] Verify the revised layout at mobile and desktop widths.

## Conditional Continue Watching Spacing

- [x] Inspect spacing when Continue Watching is present versus absent.
- [x] Apply separate compact spacing for both Home states.
- [x] Verify both states at mobile and desktop widths.

## Home Hero CTA Refinement

- [x] Inspect the Home hero CTA markup and current theme-aware button styles.
- [x] Change the primary CTA to “Watch Here” with balanced sizing and strengthen the Details border.
- [x] Verify the revised hero at mobile and desktop widths.

## Recently Added Movie Ordering

- [x] Inspect the current Recently Added data flow and rail composition.
- [x] Show movies only and order them newest-first by TMDB release date.
- [x] Verify ordering, loading/empty states, and responsive behavior.

## Dynamic Home Hero Feature

- [x] Inspect the current Home hero featured selection and TMDB data flow.
- [x] Replace the fixed Spider-Man hero with dynamic TMDB-powered featured content.
- [x] Verify the hero poster/backdrop at mobile and desktop widths, then save a checkpoint.

## Home Hero Poster Brightness

- [x] Inspect the poster wash, edge, and image contrast layers in the hero.
- [x] Increase featured poster brightness while preserving readable hero copy.
- [x] Verify dark/light mode behavior at desktop and mobile widths, then save a checkpoint.

## Compact Mobile Hero Poster

- [x] Inspect the current responsive poster anchor and mobile hero backdrop composition.
- [x] Convert the mobile poster into a compact thumbnail without changing desktop behavior.
- [x] Verify mobile artwork visibility and desktop regression, then save a checkpoint.

## Home Hero Cross-Fade

- [x] Inspect the rotating backdrop and poster render layers.
- [x] Add a 250ms cross-fade for featured artwork changes with reduced-motion support.
- [x] Verify the transition and responsive hero layout, then save a checkpoint.

## Hero Poster Clarity and Content Stability

- [x] Inspect the hero poster asset sizing, filtering, and cross-fade opacity.
- [x] Improve poster sharpness without reducing the artwork's visual detail.
- [x] Stabilize title, description, and CTA positions across short and long featured titles.
- [x] Verify multiple rotating hero states at mobile and desktop widths, then save a checkpoint.

## Reference-Style Crisp Hero Poster

- [x] Inspect the current poster wash and compare the intended treatment with the supplied reference.
- [x] Reduce poster dimming and apply a crisp, high-detail hero poster treatment.
- [x] Verify poster clarity and text contrast at mobile and desktop widths, then save a checkpoint.

## Remove Initial Hero Mini Thumbnail

- [x] Inspect the responsive hero poster anchor and its mobile visibility rules.
- [x] Remove the mini thumbnail from the initial Home hero presentation.
- [x] Verify backdrop, text, CTA spacing, and desktop/mobile composition, then save a checkpoint.

## Home Rail Order

- [x] Inspect the current Home section markup and Recently Added ordering.
- [x] Place Recently Added first, followed by Movies and Series.
- [x] Verify rail spacing, loading states, and mobile/desktop order, then save a checkpoint.
