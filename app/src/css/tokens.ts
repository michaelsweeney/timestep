// Single source of truth for the bnd-viz-style design tokens.
//
// The CSS variables in app.global.css are the *runtime* source for plain
// elements + the d3 charts; this module mirrors the same values so the retained
// MUI primitives (Autocomplete, Slider, Dialog/Menu/Switch) can be themed off
// the identical palette. Keep the two in sync.
//
// Two sets: dark (default) and light. Accent is timestep's cool blue #5b9efc
// (contrasting bnd-viz's amber). --mono = JetBrains Mono for EnergyPlus data /
// identifiers / values; --sans = IBM Plex Sans for UI chrome.

export type ThemeName = 'light' | 'dark';

export interface Tokens {
  bg: string;
  panel: string;
  panel2: string;
  hairline: string;
  hairline2: string;
  ink: string;
  inkDim: string;
  inkFaint: string;
  accent: string;
  accentDim: string;
  track: string;
}

export const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";
export const SANS = "'IBM Plex Sans', system-ui, -apple-system, sans-serif";

// bnd-viz dark values as the base; accent swapped to timestep cool blue.
export const DARK: Tokens = {
  bg: '#0b0e13',
  panel: '#10141b',
  panel2: '#141923',
  hairline: '#232b38',
  hairline2: '#2d3848',
  ink: '#c7d3e4',
  inkDim: '#7c8aa0',
  inkFaint: '#4d5a6e',
  accent: '#5b9efc',
  accentDim: '#3a6bb0',
  track: '#1c2430'
};

export const LIGHT: Tokens = {
  bg: '#eef1f5',
  panel: '#f7f9fb',
  panel2: '#ffffff',
  hairline: '#d8dee6',
  hairline2: '#c2ccd9',
  ink: '#2a3442',
  inkDim: '#5d6b7e',
  inkFaint: '#97a3b4',
  accent: '#2f6fd6',
  accentDim: '#9cbdf0',
  track: '#d4dbe5'
};

export const tokensFor = (t: ThemeName): Tokens => (t === 'light' ? LIGHT : DARK);
