// Resolve CSS design tokens (--accent, --bg, …) to concrete color strings for
// <canvas> drawing. Canvas pixels can't reference CSS custom properties the way
// SVG/CSS-styled elements can, so canvas renderers read the computed value off
// <html> (which carries the active data-theme). SVG/HTML elements should keep
// using var(--…) directly so they re-theme without a redraw; this is only for
// the canvas 2d context. Values are read at draw time, so any chart redraw
// (resize, data change, zoom) picks up the current theme.
export function token(name: string, fallback = ''): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}
