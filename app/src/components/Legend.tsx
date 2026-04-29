import type { Act, Regime } from '../types';

interface Props {
  act: Act;
  regime: Regime;
}

const PCT_GRADIENT = 'linear-gradient(to right, #E5337A, #E89AB4, #F2E4D3, #C9D6BE, #8FA38B, #2F5D3A)';
const COEF_GRADIENT = PCT_GRADIENT;

const BAND_TINT_GRADIENT =
  'linear-gradient(to right, #E5337A 0%, #E5337A 16.6%, #E89AB4 16.6%, #E89AB4 33.3%, #F2E4D3 33.3%, #F2E4D3 50%, #C9D6BE 50%, #C9D6BE 66.6%, #8FA38B 66.6%, #8FA38B 83.3%, #2F5D3A 83.3%, #2F5D3A 100%)';

export function Legend({ act, regime }: Props) {
  if (act === 'hero') return null;

  if (act === 'pickup' || act === 'coda') {
    return (
      <div className="legend" role="img" aria-label="Color scale: pickup change by zone">
        <div className="legend-title">Pickup change</div>
        <div className="legend-bar" style={{ background: PCT_GRADIENT }} />
        <div className="legend-ticks">
          <span>−30%</span>
          <span>0</span>
          <span>+200%+</span>
        </div>
      </div>
    );
  }

  if (act === 'rings') {
    return (
      <div className="legend" role="img" aria-label="Distance bands from cordon">
        <div className="legend-title">Miles from cordon</div>
        <div className="legend-bar" style={{ background: BAND_TINT_GRADIENT }} />
        <div className="legend-ticks">
          <span>inside</span>
          <span>1 mi</span>
          <span>5+ mi</span>
        </div>
      </div>
    );
  }

  if (act === 'gwr') {
    return (
      <div className="legend" role="img" aria-label="Local distance coefficient">
        <div className="legend-title">Local β · {regime} ({"%"} per mile)</div>
        <div className="legend-bar" style={{ background: COEF_GRADIENT }} />
        <div className="legend-ticks">
          <span>−50</span>
          <span>0</span>
          <span>+200+</span>
        </div>
      </div>
    );
  }

  if (act === 'bridges') {
    return (
      <div className="legend" role="img" aria-label="Bridge entry change legend">
        <div className="legend-title">Bridge / tunnel entries</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#E5337A', borderRadius: 999 }} />
          <span>declined</span>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#2F5D3A', borderRadius: 999, marginLeft: 8 }} />
          <span>rose</span>
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted)' }}>circle area ∝ pre-period volume</div>
      </div>
    );
  }

  return null;
}
