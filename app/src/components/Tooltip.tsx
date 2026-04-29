export type TooltipState =
  | { kind: 'zone'; name: string; borough: string; pct: number; dist: number; x: number; y: number }
  | { kind: 'band'; name: string; borough: string; dist: number; x: number; y: number }
  | { kind: 'gwr'; name: string; borough: string; coef: number; r2: number; significant: boolean; x: number; y: number }
  | { kind: 'bridge'; name: string; pct: number; pre: number; post: number; x: number; y: number };

function fmtPct(v: number): { txt: string; sign: 'pos' | 'neg' | 'neu' } {
  if (isNaN(v)) return { txt: '—', sign: 'neu' };
  const sign = v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
  const txt = (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  return { txt, sign };
}

function fmtNum(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return v.toLocaleString();
}

export function Tooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null;
  const style = { left: state.x, top: state.y };

  if (state.kind === 'zone') {
    const pct = fmtPct(state.pct);
    return (
      <div className="tooltip" style={style}>
        <div className="tooltip-name">{state.name}</div>
        <div className={`tooltip-pct ${pct.sign === 'neg' ? 'neg' : pct.sign === 'pos' ? 'pos' : ''}`}>{pct.txt}</div>
        <div className="tooltip-meta">
          {state.borough} · {state.dist.toFixed(1)} mi from cordon
        </div>
      </div>
    );
  }

  if (state.kind === 'band') {
    return (
      <div className="tooltip" style={style}>
        <div className="tooltip-name">{state.name}</div>
        <div className="tooltip-meta">
          {state.borough} · {state.dist.toFixed(1)} mi from cordon
        </div>
      </div>
    );
  }

  if (state.kind === 'gwr') {
    const c = fmtPct(state.coef);
    return (
      <div className="tooltip" style={style}>
        <div className="tooltip-name">{state.name}</div>
        <div className={`tooltip-pct ${c.sign === 'neg' ? 'neg' : c.sign === 'pos' ? 'pos' : ''}`}>
          β = {c.txt}/mi
        </div>
        <div className="tooltip-meta">
          {state.borough} · local R² {state.r2.toFixed(2)} {state.significant ? '· sig' : ''}
        </div>
      </div>
    );
  }

  if (state.kind === 'bridge') {
    const pct = fmtPct(state.pct);
    return (
      <div className="tooltip" style={style}>
        <div className="tooltip-name">{state.name}</div>
        <div className={`tooltip-pct ${pct.sign === 'neg' ? 'neg' : pct.sign === 'pos' ? 'pos' : ''}`}>{pct.txt}</div>
        <div className="tooltip-meta">
          {fmtNum(state.pre)} → {fmtNum(state.post)} vehicles
        </div>
      </div>
    );
  }

  return null;
}
