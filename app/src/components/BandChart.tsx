import type { BandRow } from '../types';
import { BAND_LABELS, BAND_ORDER } from '../types';

interface Props {
  bands: BandRow[];
  highlight: string | null;
  onHover: (band: string | null) => void;
}

const MAX_ABS_PCT = 0.35; // axis extends to ±35%

export function BandChart({ bands, highlight, onHover }: Props) {
  return (
    <div
      className="band-chart"
      onMouseLeave={() => onHover(null)}
      role="list"
      aria-label="Pickup change by distance band"
    >
      {BAND_ORDER.map((bandId) => {
        const row = bands.find((b) => b.dist_band === bandId);
        if (!row) return null;
        const pct = row.spillover * 100;
        const sign = pct >= 0 ? 'pos' : 'neg';
        const widthPct = Math.min(50, (Math.abs(row.spillover) / MAX_ABS_PCT) * 50);
        const isActive = highlight === bandId;
        return (
          <div
            key={bandId}
            className={`band-row ${isActive ? 'active' : ''}`}
            onMouseEnter={() => onHover(bandId)}
            onFocus={() => onHover(bandId)}
            tabIndex={0}
            role="listitem"
            aria-label={`${BAND_LABELS[bandId]}: ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
          >
            <span className="band-label">{BAND_LABELS[bandId]}</span>
            <span className="band-bar-track">
              <span className="band-zero" />
              <span
                className={`band-bar-fill ${sign}`}
                style={{ width: `${widthPct}%` }}
              />
            </span>
            <span className={`band-pct ${sign}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}
