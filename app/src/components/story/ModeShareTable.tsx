import { useMemo } from 'react';
import type { Act1Data } from '../../data/act1';

type Props = {
  data: Act1Data['modeShare'];
};

const COMMUTER_PARATRANSIT = ['LIRR', 'MNR', 'SIR', 'AAR'] as const;

type Row = {
  label: string;
  share_2024: number;
  share_2025: number;
  delta_pp: number;
  isGroup?: boolean;
};

export function ModeShareTable({ data }: Props) {
  const rows = useMemo<Row[]>(() => {
    const byMode = Object.fromEntries(data.map((r) => [r.mode, r]));
    const grouped: Row = COMMUTER_PARATRANSIT.reduce<Row>(
      (acc, mode) => {
        const r = byMode[mode];
        if (!r) return acc;
        return {
          ...acc,
          share_2024: acc.share_2024 + r.share_2024,
          share_2025: acc.share_2025 + r.share_2025,
          delta_pp: acc.delta_pp + r.delta_pp,
        };
      },
      {
        label: 'Commuter rail + paratransit',
        share_2024: 0,
        share_2025: 0,
        delta_pp: 0,
        isGroup: true,
      },
    );

    const out: Row[] = [
      { label: 'Bridges & tunnels', ...byMode.BT, delta_pp: byMode.BT?.delta_pp ?? 0 },
      { label: 'Subway',            ...byMode.Subway, delta_pp: byMode.Subway?.delta_pp ?? 0 },
      { label: 'Bus',               ...byMode.Bus, delta_pp: byMode.Bus?.delta_pp ?? 0 },
      grouped,
    ].map((r) => ({
      label: r.label,
      share_2024: r.share_2024,
      share_2025: r.share_2025,
      delta_pp: r.delta_pp,
      isGroup: r.isGroup,
    }));

    return out.sort((a, b) => a.delta_pp - b.delta_pp);
  }, [data]);

  return (
    <table className="mode-share-table" aria-label="Mode share of total daily trips into the CBD, 2024 vs 2025.">
      <thead>
        <tr>
          <th scope="col">Mode</th>
          <th scope="col" className="numeric">2024 share</th>
          <th scope="col" className="numeric">2025 share</th>
          <th scope="col" className="numeric">Change (pp)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className={r.label === 'Bridges & tunnels' ? 'text-decline' : ''}>
              {r.label}
            </td>
            <td className="numeric">{r.share_2024.toFixed(2)}%</td>
            <td className="numeric">{r.share_2025.toFixed(2)}%</td>
            <td className={`numeric delta ${deltaClass(r.delta_pp)}`}>
              {fmtDelta(r.delta_pp)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function deltaClass(pp: number): string {
  if (pp > 0.05) return 'text-rise';
  if (pp < -0.05) return 'text-decline';
  return 'text-muted';
}

function fmtDelta(pp: number): string {
  const sign = pp > 0 ? '+' : '';
  return `${sign}${pp.toFixed(2)} pp`;
}
