/**
 * Build pre-computed Act 1 chart data from the long-format MTA CSV.
 * Single source of truth for all Act 1 numbers; the browser only ever
 * reads the JSON this script writes.
 *
 *   in:  public/data/mta_modes.csv   columns: date, mode, count
 *   out: public/data/act1.json
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSV  = path.join(ROOT, 'public/data/mta_modes.csv');
const OUT  = path.join(ROOT, 'public/data/act1.json');

// ── analysis parameters (must match the analysis notebook) ──────────────────
const TREATMENT       = '2025-01-05';
const WINDOW_START_MD = '01-05';
const WINDOW_END_MD   = '04-30';
const PRE_YEARS       = [2022, 2023, 2024];
const SHARE_MODES     = ['Subway', 'Bus', 'LIRR', 'MNR', 'SIR', 'AAR', 'BT'] as const;
const TREND_MODES     = ['Subway', 'Bus', 'LIRR', 'MNR', 'SIR', 'AAR', 'BT'] as const;
const STACK_START     = '2022-01-01';
const ROLLING_WINDOW  = 14;

type Row = { date: string; mode: string; count: number };

// ── parse ────────────────────────────────────────────────────────────────────
const csvText = fs.readFileSync(CSV, 'utf-8');
const parsed  = Papa.parse<Record<string, string>>(csvText, {
  header: true,
  skipEmptyLines: true,
}).data;

const rows: Row[] = parsed
  .map((r) => ({
    date: (r.date ?? '').trim(),
    mode: (r.mode ?? '').trim(),
    count: Number((r.count ?? '').replace(/,/g, '')),
  }))
  .filter((r) => r.date && r.mode && Number.isFinite(r.count));

if (!rows.length) {
  throw new Error(`No usable rows parsed from ${CSV}`);
}

// ── helpers ──────────────────────────────────────────────────────────────────
function inWindow(date: string, year: number): boolean {
  return date >= `${year}-${WINDOW_START_MD}` && date <= `${year}-${WINDOW_END_MD}`;
}

function windowMean(mode: string, year: number): number {
  let sum = 0;
  let n = 0;
  for (const r of rows) {
    if (r.mode === mode && inWindow(r.date, year)) {
      sum += r.count;
      n += 1;
    }
  }
  return n === 0 ? NaN : sum / n;
}

/** Closed-form OLS for a single predictor. */
function ols(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const xm = x.reduce((s, v) => s + v, 0) / n;
  const ym = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xm) * (y[i] - ym);
    den += (x[i] - xm) ** 2;
  }
  const slope = num / den;
  return { slope, intercept: ym - slope * xm };
}

// ── 1. Stacked-area data: 14-day rolling mean of band totals from 2022-01-01 ─
const byDate = new Map<string, Record<string, number>>();
for (const r of rows) {
  if (r.date < STACK_START) continue;
  const bucket = byDate.get(r.date) ?? {};
  bucket[r.mode] = r.count;
  byDate.set(r.date, bucket);
}
const dates = [...byDate.keys()].sort();

type DailyBands = { date: string; subway: number; otherTransit: number; bt: number };
const daily: DailyBands[] = dates.map((d) => {
  const m = byDate.get(d)!;
  return {
    date: d,
    subway: m['Subway'] ?? 0,
    otherTransit:
      (m['Bus']  ?? 0) + (m['LIRR'] ?? 0) + (m['MNR'] ?? 0) +
      (m['SIR']  ?? 0) + (m['AAR']  ?? 0),
    bt: m['BT'] ?? 0,
  };
});

const stackedArea: DailyBands[] = daily.map((_, i) => {
  const start = Math.max(0, i - (ROLLING_WINDOW - 1));
  const slice = daily.slice(start, i + 1);
  const n = slice.length;
  return {
    date: daily[i].date,
    subway:       slice.reduce((s, x) => s + x.subway,       0) / n,
    otherTransit: slice.reduce((s, x) => s + x.otherTransit, 0) / n,
    bt:           slice.reduce((s, x) => s + x.bt,           0) / n,
  };
});

// ── 2. Per-mode comparison stats (naive vs trend-adjusted) ──────────────────
type ModeStats = {
  mode: string;
  naive_pct: number;
  trend_adjusted_pct: number;
  observed_2025: number;
  projected_2025: number;
};
const perMode: ModeStats[] = TREND_MODES.map((mode) => {
  const m24 = windowMean(mode, 2024);
  const m25 = windowMean(mode, 2025);
  const yrs  = PRE_YEARS;
  const vals = PRE_YEARS.map((y) => windowMean(mode, y));
  const { slope, intercept } = ols(yrs, vals);
  const projected = intercept + slope * 2025;
  return {
    mode,
    naive_pct: ((m25 - m24) / m24) * 100,
    trend_adjusted_pct: ((m25 - projected) / projected) * 100,
    observed_2025: m25,
    projected_2025: projected,
  };
});

// ── 3. Mode-share table ──────────────────────────────────────────────────────
const totals2024 = SHARE_MODES.map((m) => windowMean(m, 2024));
const totals2025 = SHARE_MODES.map((m) => windowMean(m, 2025));
const sum2024 = totals2024.reduce((s, v) => s + v, 0);
const sum2025 = totals2025.reduce((s, v) => s + v, 0);

type ShareRow = { mode: string; share_2024: number; share_2025: number; delta_pp: number };
const modeShare: ShareRow[] = SHARE_MODES.map((mode, i) => {
  const share_2024 = (totals2024[i] / sum2024) * 100;
  const share_2025 = (totals2025[i] / sum2025) * 100;
  return { mode, share_2024, share_2025, delta_pp: share_2025 - share_2024 };
});

// ── 4. Headline scalars ──────────────────────────────────────────────────────
const headline = {
  total_2024: sum2024,
  total_2025: sum2025,
  pct_change: ((sum2025 - sum2024) / sum2024) * 100,
};

// ── write ────────────────────────────────────────────────────────────────────
const out = {
  meta: {
    treatment: TREATMENT,
    window: `${WINDOW_START_MD} → ${WINDOW_END_MD}`,
    pre_years_for_trend: PRE_YEARS,
    rolling_window_days: ROLLING_WINDOW,
    generated_at: new Date().toISOString(),
  },
  headline,
  stackedArea,
  perMode,
  modeShare,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(`  stackedArea: ${stackedArea.length} rows`);
console.log(`  perMode:     ${perMode.length} rows`);
console.log(`  modeShare:   ${modeShare.length} rows`);
console.log(`  headline:    +${headline.pct_change.toFixed(2)}%  (${Math.round(sum2024).toLocaleString()} → ${Math.round(sum2025).toLocaleString()})`);
