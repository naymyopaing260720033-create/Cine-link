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
