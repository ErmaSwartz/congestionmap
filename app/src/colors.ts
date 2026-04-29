import { scaleDiverging } from 'd3-scale';

// 5 stops — increase (deep green) → cream → decline (magenta)
// Cream center sits at the "no change" anchor.
const RAMP = ['#2F5D3A', '#8FA38B', '#F2E4D3', '#E89AB4', '#E5337A'] as const;

function interp(t: number): string {
  // t in [0,1] across RAMP[0..4]
  if (t <= 0) return RAMP[0];
  if (t >= 1) return RAMP[4];
  const seg = t * 4;
  const i = Math.floor(seg);
  const f = seg - i;
  const a = RAMP[i] as string;
  const b = RAMP[Math.min(i + 1, 4)] as string;
  return mix(a, b, f);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/**
 * pct_change choropleth — typical NYC zones run 0..+200%.
 * Diverging around 0; clamp to [-30, 200] for visual readability.
 * Negative = magenta (decline), positive = green (increase).
 *
 * NOTE the visual ramp is "increase=green, decline=magenta",
 * but in this dataset the substantively interesting *outcome* is "growth"
 * (+green), with declines (−magenta) being rare. This matches the
 * project's editorial choice of #E5337A for declines and #2F5D3A for
 * increases.
 */
export function pickupColor(pct: number | null | undefined): string {
  if (pct == null || isNaN(pct)) return '#cccccc';
  // map pct in [-30, 200] -> [0, 1], where 0.5 corresponds to pct=0
  const lo = -30;
  const hi = 200;
  const center = 0;
  // piecewise normalization so 0% sits at the cream center stop (t=0.5)
  let t: number;
  if (pct <= center) {
    t = 0.5 * Math.max(0, (pct - lo) / (center - lo));
  } else {
    t = 0.5 + 0.5 * Math.min(1, (pct - center) / (hi - center));
  }
  // Flip ramp: positive=green (left), negative=magenta (right) requires reversed mapping
  return interp(1 - t);
}

/**
 * GWR distance-coefficient color.
 * The distance coefficient says "%-change in pickups per additional mile from cordon".
 * Range observed: roughly -50..+200. Center at 0.
 * Same diverging ramp.
 */
export function coefColor(coef: number | null | undefined): string {
  if (coef == null || isNaN(coef)) return '#cccccc';
  const lo = -50;
  const hi = 200;
  const center = 0;
  let t: number;
  if (coef <= center) {
    t = 0.5 * Math.max(0, (coef - lo) / (center - lo));
  } else {
    t = 0.5 + 0.5 * Math.min(1, (coef - center) / (hi - center));
  }
  return interp(1 - t);
}

/**
 * Distance-band index → tint. Inside is the deepest cream, 5+ is
 * a low-saturation green-grey.
 */
const BAND_TINTS: Record<string, string> = {
  inside: '#E5337A',
  '0-0.25': '#E89AB4',
  '0.25-1': '#F2E4D3',
  '1-3': '#C9D6BE',
  '3-5': '#8FA38B',
  '5+': '#2F5D3A',
};

export function bandColor(band: string): string {
  return BAND_TINTS[band] ?? '#cccccc';
}

export function bandFromDist(d: number): string {
  if (d <= 0) return 'inside';
  if (d <= 0.25) return '0-0.25';
  if (d <= 1) return '0.25-1';
  if (d <= 3) return '1-3';
  if (d <= 5) return '3-5';
  return '5+';
}

export const RAMP_HEX = RAMP;
export { interp as rampInterp };

// d3 helper exposed for any future continuous use
export const pickupScale = scaleDiverging<string>().domain([-30, 0, 200]).interpolator((t) => interp(1 - t));
export const coefScale = scaleDiverging<string>().domain([-50, 0, 200]).interpolator((t) => interp(1 - t));
