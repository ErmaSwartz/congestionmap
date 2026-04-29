import type { Regime, BandRow } from '../types';
import { BandChart } from '../components/BandChart';
import { CountUp } from '../components/CountUp';

interface CommonProps {
  reduceMotion: boolean;
  inView: boolean;
}

export function HeroSection() {
  return (
    <section data-step="hero" className="section hero" id="section-hero">
      <div className="section-eyebrow">A spatial-statistics study</div>
      <h1>On January 5, 2025, New York City started charging to drive into Manhattan.</h1>
      <p className="lede">Traffic doesn't disappear when its price goes up. It moves. The question is <em>where</em>, and how unevenly.</p>
      <p>Three things could plausibly happen at once. Some trips don't happen at all. Some relocate, with pickups and drop-offs shifting outward into the ring of neighborhoods just outside the cordon. And some modes substitute, where drivers who used to bring a car into Manhattan now take a yellow cab once they've arrived.</p>
      <p>All three appear in 89.6 million yellow-taxi trips before and after the toll switched on. The spatial structure of the change is what this story is about.</p>
    </section>
  );
}

export function PickupSection() {
  return (
    <section data-step="pickup" className="section" id="section-pickup">
      <div className="section-eyebrow">Act I · Where pickups grew</div>
      <h2>Pickups grew almost everywhere.</h2>
      <div className="stat-block">
        <div className="stat-label">Median zone-level change</div>
        <div className="stat-num pos">+160%</div>
      </div>
      <p>Aggregating <strong>89.6 million</strong> yellow-taxi trips to <strong>243 taxi zones</strong>, only five zones declined. The other 238 grew, with a median pct-change of +160%.</p>
      <p>This is the raw substrate the model has to explain. Hover any zone to see its pre-period and post-period pickup counts.</p>
    </section>
  );
}

interface RingsProps extends CommonProps {
  bands: BandRow[];
  highlight: string | null;
  onBandHover: (band: string | null) => void;
}

export function RingsSection({ bands, highlight, onBandHover }: RingsProps) {
  return (
    <section data-step="rings" className="section" id="section-rings">
      <div className="section-eyebrow">Act II · The ripple</div>
      <h2>A boundary "dead zone" — and a 3-to-5-mile peak.</h2>
      <div className="stat-row">
        <div>
          <div className="stat-label">0 – ¼ mi</div>
          <div className="stat-num neg" style={{ fontSize: 32 }}>−1.6%</div>
        </div>
        <div>
          <div className="stat-label">3 – 5 mi</div>
          <div className="stat-num pos" style={{ fontSize: 32 }}>+31.5%</div>
        </div>
      </div>
      <p>The narrow strip just outside the cordon is the only band of any width that declined — drivers staying back from the boundary.</p>
      <p>The strongest growth lands 3–5 miles out: Long Island City, Williamsburg, Park Slope, the South Bronx — transit-accessible neighborhoods just beyond the toll.</p>
      <BandChart bands={bands} highlight={highlight} onHover={onBandHover} />
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>Hover a band to highlight matching zones on the map.</p>
    </section>
  );
}

interface GwrProps extends CommonProps {
  regime: Regime;
  onRegimeChange: (r: Regime) => void;
}

export function GwrSection({ regime, onRegimeChange }: GwrProps) {
  return (
    <section data-step="gwr" className="section" id="section-gwr">
      <div className="section-eyebrow">Act III · Local effects (GWR)</div>
      <h2>The distance effect flips sign across the city.</h2>
      <div className="segmented" role="tablist" aria-label="Time-of-day regime">
        <button
          role="tab"
          aria-selected={regime === 'peak'}
          className={regime === 'peak' ? 'active' : ''}
          onClick={() => onRegimeChange('peak')}
        >Peak</button>
        <button
          role="tab"
          aria-selected={regime === 'offpeak'}
          className={regime === 'offpeak' ? 'active' : ''}
          onClick={() => onRegimeChange('offpeak')}
        >Off-peak</button>
      </div>
      <p>Geographically Weighted Regression fits a separate local slope at every taxi zone using only that zone's neighbors. The result is not one coefficient for the city — it's an array of 237 coefficients, one per zone.</p>
      <p>Inner Manhattan and the Hudson waterfront read near zero or slightly negative — pickups are up almost everywhere there, regardless of distance. Outer Brooklyn, Queens, the Bronx, and Staten Island read strongly positive: the further from the cordon, the more pickups grew.</p>
      <p><strong>Peak</strong> looks remarkably similar to the all-hours field. <strong>Off-peak</strong> is steeper — when the toll is essentially off, distance from it predicts pickup change <em>more</em> steeply than when it's on. The cordon is producing the spatial pattern, but only a slice of it.</p>
    </section>
  );
}

interface BridgesProps extends CommonProps {}

export function BridgesSection({ inView, reduceMotion }: BridgesProps) {
  return (
    <section data-step="bridges" className="section" id="section-bridges">
      <div className="section-eyebrow">Act IV · The intake side</div>
      <h2>Vehicle entries fell at almost every crossing.</h2>
      <div className="stat-block">
        <div className="stat-label">MTA bridge &amp; tunnel inflow, Jan–Apr 2025 vs 2024</div>
        <div className="stat-num neg">
          <CountUp to={-3.25} active={inView} reduceMotion={reduceMotion} suffix="%" />
        </div>
      </div>
      <p>Seven of the nine MTA crossings declined. The Verrazzano-Narrows fell <strong>−8.7%</strong> and Marine Parkway <strong>−8.5%</strong>. Only Henry Hudson rose, at <strong>+2.6%</strong>.</p>
      <p>This is the intake side of the story, and it confirms the cordon did reduce vehicles entering the city — even as taxi pickups grew almost everywhere outside it.</p>
    </section>
  );
}

interface CodaProps extends CommonProps {}

export function CodaSection({ inView, reduceMotion }: CodaProps) {
  return (
    <section data-step="coda" className="section" id="section-coda">
      <div className="section-eyebrow">Coda · Takeaways</div>
      <h2>The cordon amplifies, not originates.</h2>
      <div className="coda">
        <div className="coda-cards">
          <div className="coda-card">
            <div className="stat-label">Network-wide bridge inflow</div>
            <div className="stat-num neg">
              <CountUp to={-3.25} active={inView} reduceMotion={reduceMotion} suffix="%" />
            </div>
            <p>Seven of nine MTA crossings declined.</p>
          </div>
          <div className="coda-card">
            <div className="stat-label">3 – 5 mile band</div>
            <div className="stat-num pos">
              <CountUp to={31.5} active={inView} reduceMotion={reduceMotion} suffix="%" />
            </div>
            <p>Strongest spillover ring beyond the cordon.</p>
          </div>
          <div className="coda-card">
            <div className="stat-label">GWR R² (peak / off-peak)</div>
            <div className="stat-num">0.76 · 0.77</div>
            <p>Letting the slope vary in space recovers ~25 points of explanatory power.</p>
          </div>
        </div>
        <p>Congestion pricing produces a measurable additional distance-decay, but the broader spillover pattern was already in motion: yellow-taxi demand was redistributing toward outer boroughs whether or not the cordon went on. The policy amplifies a dynamic rather than originating it.</p>
        <p>The fringe and outer-borough zones that absorbed the most demand are where a redistributive-equity analysis of the policy should look next.</p>
        <div className="coda-links">
          <a href="https://github.com/ErmaSwartz/congestionmap" target="_blank" rel="noopener noreferrer">Code · GitHub ↗</a>
          <a href="poster_assets/posterGWR.svg" target="_blank" rel="noopener noreferrer">Poster (PDF) ↗</a>
          <a href="https://github.com/ErmaSwartz/congestionmap#methodology" target="_blank" rel="noopener noreferrer">Methodology ↗</a>
        </div>
      </div>
    </section>
  );
}
