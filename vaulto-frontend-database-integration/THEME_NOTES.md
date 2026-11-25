# Nexora Carbon & Crimson Theme

The theme is shared across the app from `src/theme.css` and `src/styles.css`, and its fixed scroll-reactive dark-carbon & crimson orbital background is mounted once from `src/main.jsx`.

## Tune the palette

Edit the named CSS variables at the top of `src/theme.css`. The core OLED black surfaces use `--carbon-950` through `--carbon-700`, paired with vibrant crimson red (`--crimson-700` to `--crimson-300`), emerald gains (`--gain-green`), warm amber, and crisp titanium neutral text (`--text`, `--text-soft`, `--muted`). Category colors also live in `src/settings.js` and `src/App.jsx` so progress rings, tracks, and Recharts visualizations match the CSS tokens.

## Adjust background atmosphere & scroll parallax

Edit `floatingDollars`, `embers`, and `OrbitalArcs` in `src/components/AnimatedBackground.jsx` to tune the restrained floating `$` markers, ember dust, and crimson orbital arcs. Scroll parallax is driven via `--scroll-y` and `--scroll-progress` in a throttled `requestAnimationFrame` scroll handler, along with the top crimson scroll-progress hairline.

## Reduced motion

All background and entrance animations respect `prefers-reduced-motion: reduce` and automatically pause when the browser tab is hidden.
