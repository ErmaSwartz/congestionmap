import { useEffect, useMemo, useRef, useState } from 'react';
import scrollama from 'scrollama';
import type { Act, Regime } from './types';
import { useDataBundle } from './data';
import { MapStage } from './components/MapStage';
import { ProgressRail } from './components/ProgressRail';
import {
  HeroSection,
  PickupSection,
  RingsSection,
  GwrSection,
  BridgesSection,
  CodaSection,
} from './sections/Sections';

const ACT_ORDER: Act[] = ['hero', 'pickup', 'rings', 'gwr', 'bridges', 'coda'];

export function App() {
  const { bundle, error } = useDataBundle();
  const [act, setAct] = useState<Act>('hero');
  const [regime, setRegime] = useState<Regime>('peak');
  const [highlightBand, setHighlightBand] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [aboutOpen, setAboutOpen] = useState(false);

  const scrollerRef = useRef<ReturnType<typeof scrollama> | null>(null);

  // ── scrollama wiring ─────────────────────────────────────────────
  useEffect(() => {
    if (!bundle) return;
    const sc = scrollama();
    scrollerRef.current = sc;
    sc
      .setup({
        step: '[data-step]',
        offset: 0.55,
        threshold: 4,
      })
      .onStepEnter(({ element }) => {
        const id = element.getAttribute('data-step') as Act;
        if (ACT_ORDER.includes(id)) setAct(id);
      });

    const handleResize = () => sc.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      sc.destroy();
    };
  }, [bundle]);

  const handleJump = (id: Act) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  // toggle reduce-motion class on root for CSS hooks
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  // bands data is required by the rings section
  const bands = useMemo(() => bundle?.bands ?? [], [bundle]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h1>Couldn't load data</h1>
        <pre>{String(error.message ?? error)}</pre>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12 }}>
        Loading data…
      </div>
    );
  }

  return (
    <div className="layout">
      <MapStage
        zones={bundle.zones}
        peak={bundle.peak}
        offpeak={bundle.offpeak}
        cordon={bundle.cordon}
        bridges={bundle.bridges}
        act={act}
        regime={regime}
        highlightBand={highlightBand}
        reduceMotion={reduceMotion}
      />

      <ProgressRail active={act} onJump={handleJump} />

      <div className="top-ui">
        <button
          className={reduceMotion ? 'on' : ''}
          aria-pressed={reduceMotion}
          onClick={() => setReduceMotion((v) => !v)}
          title="Toggle reduced-motion: skip pulses and instant fades"
        >
          {reduceMotion ? 'Motion off' : 'Reduce motion'}
        </button>
        <button
          aria-expanded={aboutOpen}
          onClick={() => setAboutOpen((v) => !v)}
        >
          About
        </button>
      </div>

      {aboutOpen && (
        <div
          role="dialog"
          aria-label="About this study"
          onClick={() => setAboutOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: 32,
              maxWidth: 560,
              width: '100%',
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            <div className="section-eyebrow" style={{ color: 'var(--muted)' }}>About</div>
            <h2 style={{ fontSize: 28, marginBottom: 12 }}>Where Does the Traffic Go?</h2>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>
              A spatial-statistics study of the spillover effects of NYC's January 2025 Central
              Business District congestion charge. 89.6 million yellow-taxi trips, 243 taxi zones,
              MTA bridge &amp; tunnel entry data.
            </p>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>
              Method: matched-period before/after, OLS for a baseline distance-decay slope,
              Geographically Weighted Regression (mgwr 2.x, adaptive bisquare kernel, bandwidth 48
              by AICc) fit separately on peak and off-peak regimes.
            </p>
            <p style={{ color: 'var(--ink-muted)', marginBottom: 16 }}>
              Sources: NYC TLC yellow-taxi trip records · MTA Bridges &amp; Tunnels daily plaza
              traffic · NYC DOT Congestion Relief Zone polygon. All spatial work in EPSG:2263.
            </p>
            <button
              onClick={() => setAboutOpen(false)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                borderBottom: '1px solid currentColor',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="scroll-rail">
        <HeroSection />
        <PickupSection />
        <RingsSection
          bands={bands}
          highlight={highlightBand}
          onBandHover={setHighlightBand}
          inView={act === 'rings'}
          reduceMotion={reduceMotion}
        />
        <GwrSection
          regime={regime}
          onRegimeChange={setRegime}
          inView={act === 'gwr'}
          reduceMotion={reduceMotion}
        />
        <BridgesSection inView={act === 'bridges'} reduceMotion={reduceMotion} />
        <CodaSection inView={act === 'coda'} reduceMotion={reduceMotion} />

        <footer className="app-footer">
          <div>Data: NYC TLC, MTA Bridges &amp; Tunnels, NYC DOT</div>
          <div style={{ marginTop: 4 }}>
            Erma Swartz · 2026 · <a href="https://github.com/ErmaSwartz/congestionmap" target="_blank" rel="noopener noreferrer">github.com/ErmaSwartz/congestionmap</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
