# Green Piggy Bank Finance theme

The theme is shared across the app from `src/theme.css`, and its fixed animated background is mounted once from `src/main.jsx`.

## Tune the palette

Edit the named CSS variables at the top of `src/theme.css`. The main background uses `--forest-950`, `--forest-900`, and `--forest-800`; emerald and mint accents are grouped below them. Category chart colors also live in `src/settings.js` and `src/App.jsx` so the graph strokes and progress rings match the CSS palette.

## Change the bill count

Edit the `bills` array in `src/components/AnimatedBackground.jsx`. It currently has 12 notes. The responsive CSS hides later notes on smaller screens, so keep those breakpoints in mind when changing the list size.

## Adjust animation speed

Change the `speed` values in that same `bills` array to change each note's float duration. The background drift and sparkle timing are in the `@keyframes` and animation declarations in `src/theme.css`. Scroll-scrub timing is tied to page progress and does not need a duration setting.

The background becomes static when `prefers-reduced-motion` is enabled. In browsers without CSS scroll timelines, a throttled `requestAnimationFrame` scroll handler provides the same scrubbed states.
