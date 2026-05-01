/**
 * Throwaway preview wrapper. Mounted only when the URL has `?preview=act1`,
 * so the existing site at `/` is unaffected. Loads `public/data/act1.json`
 * and renders the three new components in isolation against a paper bg.
 */
import { useAct1Data } from '../../data/act1';
import { ModalStackedArea } from './ModalStackedArea';
import { NaiveVsTrendBars } from './NaiveVsTrendBars';
import { ModeShareTable } from './ModeShareTable';

export function Act1Preview() {
  const { data, error } = useAct1Data();

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-mono)', color: 'var(--decline)' }}>
        Failed to load act1.json — {String(error.message ?? error)}
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', color: 'var(--muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12,
      }}>
        Loading act1.json…
      </div>
    );
  }

  return (
    <div style={{ padding: '64px 48px', maxWidth: 720, margin: '0 auto', background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="label-mono" style={{ marginBottom: 12 }}>Preview · ?preview=act1</div>
      <h1 className="font-display" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Act 1 components — isolation preview
      </h1>
      <p className="text-muted" style={{ marginBottom: 48, fontSize: 14, fontStyle: 'italic' }}>
        The three components, rendered alone against act1.json. The site at <code>/</code> is untouched.
      </p>

      <section style={{ marginBottom: 80 }}>
        <div className="label-mono">1 · ModalStackedArea</div>
        <ModalStackedArea data={data.stackedArea} treatment={data.meta.treatment} />
      </section>

      <section style={{ marginBottom: 80 }}>
        <div className="label-mono">2 · NaiveVsTrendBars</div>
        <NaiveVsTrendBars data={data.perMode} />
      </section>

      <section style={{ marginBottom: 80 }}>
        <div className="label-mono">3 · ModeShareTable</div>
        <ModeShareTable data={data.modeShare} />
      </section>

      <hr style={{ border: 0, borderTop: '1px solid rgba(26,26,26,0.12)', margin: '40px 0' }} />

      <div className="label-mono" style={{ marginBottom: 8 }}>Headline scalars</div>
      <pre style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-deep)',
        padding: 16, borderRadius: 6, color: 'var(--ink)', overflow: 'auto',
      }}>
{JSON.stringify(data.headline, null, 2)}
      </pre>
    </div>
  );
}
