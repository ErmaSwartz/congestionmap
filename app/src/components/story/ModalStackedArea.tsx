import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import type { Act1Data } from '../../data/act1';

type Datum = Act1Data['stackedArea'][number];

type Props = {
  data: Datum[];
  treatment: string;        // ISO date string, e.g. "2025-01-05"
  height?: number;
};

type Stacked = {
  date: Date;
  s0: number; s1: number;   // subway band
  o0: number; o1: number;   // other transit band
  b0: number; b1: number;   // bridges & tunnels band
};

const MARGIN = { top: 32, right: 16, bottom: 28, left: 52 };

export function ModalStackedArea({ data, treatment, height = 280 }: Props) {
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

  const { stacked, x, y, yTicks, yearTicks } = useMemo(() => {
    const stacked: Stacked[] = data.map((d) => {
      const s1 = d.subway;
      const o1 = s1 + d.otherTransit;
      const b1 = o1 + d.bt;
      return {
        date: new Date(d.date),
        s0: 0, s1,
        o0: s1, o1,
        b0: o1, b1,
      };
    });
    const xDomain: [Date, Date] = [stacked[0].date, stacked[stacked.length - 1].date];
    const yMax = stacked.reduce((m, p) => (p.b1 > m ? p.b1 : m), 0);
    const x = scaleTime().domain(xDomain).range([MARGIN.left, width - MARGIN.right]);
    const y = scaleLinear().domain([0, yMax]).nice().range([height - MARGIN.bottom, MARGIN.top]);
    const yTicks = y.ticks(5);
    // year ticks
    const years = new Set<number>();
    stacked.forEach((p) => years.add(p.date.getFullYear()));
    const yearTicks = [...years]
      .map((yr) => new Date(yr, 0, 1))
      .filter((d) => x(d) >= MARGIN.left && x(d) <= width - MARGIN.right);
    return { stacked, x, y, yTicks, yearTicks };
  }, [data, width, height]);

  const subwayPath = useMemo(() => bandPath(stacked, x, y, (p) => p.s0, (p) => p.s1), [stacked, x, y]);
  const otherPath  = useMemo(() => bandPath(stacked, x, y, (p) => p.o0, (p) => p.o1), [stacked, x, y]);
  const btPath     = useMemo(() => bandPath(stacked, x, y, (p) => p.b0, (p) => p.b1), [stacked, x, y]);

  const treatmentX = x(new Date(treatment));

  // Hover
  const [hover, setHover] = useState<Stacked | null>(null);
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (px < MARGIN.left || px > width - MARGIN.right) {
      setHover(null);
      return;
    }
    const targetDate = x.invert(px).getTime();
    let lo = 0;
    let hi = stacked.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (stacked[mid].date.getTime() < targetDate) lo = mid + 1;
      else hi = mid;
    }
    setHover(stacked[lo]);
  };

  return (
    <div className="story-chart" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Stacked area chart of daily trips into the CBD by mode group, January 2022 through April 2026."
      >
        {/* y gridlines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(26,26,26,0.06)"
            />
            <text
              x={MARGIN.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--muted)"
            >
              {(t / 1e6).toFixed(1)}M
            </text>
          </g>
        ))}

        {/* areas — subway (calm ink), other transit (rise), bt (decline) */}
        <path d={subwayPath} fill="var(--ink)"      opacity={0.16} />
        <path d={otherPath}  fill="var(--increase)" opacity={0.55} />
        <path d={btPath}     fill="var(--decline)"  opacity={0.55} />

        {/* treatment vertical line + label */}
        <line
          x1={treatmentX}
          x2={treatmentX}
          y1={MARGIN.top}
          y2={height - MARGIN.bottom}
          stroke="var(--ink)"
          strokeDasharray="4 3"
          strokeOpacity={0.55}
        />
        <text
          x={treatmentX}
          y={MARGIN.top - 10}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          letterSpacing="0.12em"
          fill="var(--ink)"
        >
          CONGESTION PRICING BEGINS
        </text>

        {/* year x-ticks */}
        {yearTicks.map((d) => (
          <text
            key={+d}
            x={x(d)}
            y={height - 10}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--muted)"
          >
            {d.getFullYear()}
          </text>
        ))}

        {/* hover marker */}
        {hover && (
          <line
            x1={x(hover.date)}
            x2={x(hover.date)}
            y1={MARGIN.top}
            y2={height - MARGIN.bottom}
            stroke="rgba(26,26,26,0.45)"
            strokeWidth={1}
          />
        )}
      </svg>

      {/* tooltip */}
      {hover && (
        <div className="hover-readout">
          <span className="label-mono">{fmtDate(hover.date)}</span>
          <span><strong>Subway</strong> <span className="num">{((hover.s1 - hover.s0) / 1e6).toFixed(2)}M</span></span>
          <span><strong>Other transit</strong> <span className="num">{((hover.o1 - hover.o0) / 1e6).toFixed(2)}M</span></span>
          <span className="text-decline"><strong>BT</strong> <span className="num">{((hover.b1 - hover.b0) / 1e6).toFixed(2)}M</span></span>
        </div>
      )}

      {/* inline legend (small) */}
      <div className="story-legend" style={{ marginTop: 8 }}>
        <span className="swatch" style={{ background: 'var(--ink)', opacity: 0.16 }} />
        <span className="label-mono">Subway</span>
        <span className="swatch" style={{ background: 'var(--increase)', opacity: 0.55 }} />
        <span className="label-mono">Other transit</span>
        <span className="swatch" style={{ background: 'var(--decline)', opacity: 0.55 }} />
        <span className="label-mono">Bridges &amp; tunnels</span>
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────────
function bandPath(
  pts: Stacked[],
  x: ReturnType<typeof scaleTime>,
  y: ReturnType<typeof scaleLinear>,
  getLow: (p: Stacked) => number,
  getHigh: (p: Stacked) => number,
): string {
  if (!pts.length) return '';
  let top = '';
  for (let i = 0; i < pts.length; i++) {
    const xp = x(pts[i].date);
    const yt = y(getHigh(pts[i]));
    top += `${i === 0 ? 'M' : 'L'}${xp},${yt} `;
  }
  let bot = '';
  for (let i = pts.length - 1; i >= 0; i--) {
    const xp = x(pts[i].date);
    const yb = y(getLow(pts[i]));
    bot += `L${xp},${yb} `;
  }
  return top + bot + 'Z';
}

function fmtDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
