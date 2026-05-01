import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import type { Act1Data } from '../../data/act1';

type ModeRow = Act1Data['perMode'][number];

type Props = {
  data: ModeRow[];
};

const ROW_H = 44;
const BAR_H = 14;
const LABEL_W = 64;
const VALUE_PAD = 6;
const MARGIN = { top: 16, right: 56, bottom: 8, left: 8 };

export function NaiveVsTrendBars({ data }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.naive_pct - a.naive_pct),
    [data],
  );

  const { x, x0, height, plotLeft, plotRight } = useMemo(() => {
    const allValues = data.flatMap((d) => [d.naive_pct, d.trend_adjusted_pct]);
    const maxAbs = Math.max(...allValues.map(Math.abs)) * 1.08;
    const plotLeft = MARGIN.left + LABEL_W;
    const plotRight = width - MARGIN.right;
    const x = scaleLinear().domain([-maxAbs, maxAbs]).range([plotLeft, plotRight]);
    const x0 = x(0);
    const height = MARGIN.top + sorted.length * ROW_H + MARGIN.bottom;
    return { x, x0, height, plotLeft, plotRight };
  }, [data, sorted.length, width]);

  return (
    <div className="story-chart" ref={wrapRef}>
      <h3 className="story-chart-title">
        What the naive comparison says, and what the trend-adjusted version says
      </h3>

      <div className="story-legend">
        <span className="swatch" />
        <span className="label-mono">Naive</span>
        <span className="swatch faint" />
        <span className="label-mono">Trend-adjusted</span>
      </div>

      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Paired horizontal bar chart of naive and trend-adjusted percent change for each transit and vehicle mode."
      >
        {/* zero line */}
        <line
          x1={x0}
          x2={x0}
          y1={MARGIN.top - 4}
          y2={height - MARGIN.bottom}
          stroke="rgba(26,26,26,0.22)"
        />
        {/* axis edges */}
        <line
          x1={plotLeft}
          x2={plotRight}
          y1={MARGIN.top - 4}
          y2={MARGIN.top - 4}
          stroke="rgba(26,26,26,0.08)"
        />

        {sorted.map((row, i) => {
          const cy = MARGIN.top + i * ROW_H + ROW_H / 2;
          const naiveX = x(row.naive_pct);
          const trendX = x(row.trend_adjusted_pct);

          const naiveBarLeft = Math.min(x0, naiveX);
          const naiveBarWidth = Math.abs(naiveX - x0);
          const trendBarLeft = Math.min(x0, trendX);
          const trendBarWidth = Math.abs(trendX - x0);

          const naiveColor = row.naive_pct >= 0 ? 'var(--increase)' : 'var(--decline)';
          const trendColor = row.trend_adjusted_pct >= 0 ? 'var(--increase)' : 'var(--decline)';

          const naiveBarY = cy - BAR_H - 1;
          const trendBarY = cy + 1;

          const naiveLabelX =
            row.naive_pct >= 0 ? naiveX + VALUE_PAD : naiveX - VALUE_PAD;
          const trendLabelX =
            row.trend_adjusted_pct >= 0 ? trendX + VALUE_PAD : trendX - VALUE_PAD;
          const naiveAnchor = row.naive_pct >= 0 ? 'start' : 'end';
          const trendAnchor = row.trend_adjusted_pct >= 0 ? 'start' : 'end';

          return (
            <g key={row.mode}>
              {/* mode label */}
              <text
                x={MARGIN.left + LABEL_W - 12}
                y={cy}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                letterSpacing="0.08em"
                fill="var(--ink)"
              >
                {row.mode.toUpperCase()}
              </text>

              {/* naive bar */}
              <rect
                x={naiveBarLeft}
                y={naiveBarY}
                width={Math.max(naiveBarWidth, 1)}
                height={BAR_H}
                fill={naiveColor}
                opacity={1}
                rx={1}
              />
              {/* trend-adjusted bar */}
              <rect
                x={trendBarLeft}
                y={trendBarY}
                width={Math.max(trendBarWidth, 1)}
                height={BAR_H}
                fill={trendColor}
                opacity={0.42}
                rx={1}
              />

              {/* end labels */}
              <text
                x={naiveLabelX}
                y={naiveBarY + BAR_H / 2}
                textAnchor={naiveAnchor}
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--ink-muted)"
              >
                {fmtPct(row.naive_pct)}
              </text>
              <text
                x={trendLabelX}
                y={trendBarY + BAR_H / 2}
                textAnchor={trendAnchor}
                dominantBaseline="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--ink-muted)"
              >
                {fmtPct(row.trend_adjusted_pct)}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="story-chart-caption">
        For each mode, the gap between the dark bar and the light bar is the part of the change
        that the pre-treatment trend would have predicted anyway.
        <br />
        Only the light bar is the part that's actually new.
      </p>
    </div>
  );
}

function fmtPct(v: number): string {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}
