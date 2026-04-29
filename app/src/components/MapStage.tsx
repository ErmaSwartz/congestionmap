import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MLMap, ExpressionSpecification, MapMouseEvent } from 'maplibre-gl';
import type { Act, Regime, Bridge, ZoneFC, PeakFC, OffpeakFC, CordonFC } from '../types';
import { Tooltip, type TooltipState } from './Tooltip';
import { Legend } from './Legend';

interface Props {
  zones: ZoneFC;
  peak: PeakFC;
  offpeak: OffpeakFC;
  cordon: CordonFC;
  bridges: Bridge[];
  act: Act;
  regime: Regime;
  highlightBand: string | null;
  reduceMotion: boolean;
}

// ── MapLibre fill-color expressions ─────────────────────────────────

// pct_change choropleth (Act I) — diverging green→cream→magenta
const PCT_COLOR: ExpressionSpecification = [
  'case',
  ['has', 'pct_change'],
  [
    'interpolate',
    ['linear'],
    ['to-number', ['get', 'pct_change']],
    -30, '#E5337A',
    -5, '#E89AB4',
    10, '#F2E4D3',
    60, '#C9D6BE',
    120, '#8FA38B',
    220, '#2F5D3A',
  ],
  '#cccccc',
];

const PEAK_COEF_COLOR: ExpressionSpecification = [
  'case',
  ['has', 'peak_dist_coeff'],
  [
    'interpolate',
    ['linear'],
    ['to-number', ['get', 'peak_dist_coeff']],
    -50, '#E5337A',
    -15, '#E89AB4',
    0, '#F2E4D3',
    25, '#C9D6BE',
    80, '#8FA38B',
    200, '#2F5D3A',
  ],
  '#cccccc',
];

const OFFPEAK_COEF_COLOR: ExpressionSpecification = [
  'case',
  ['has', 'offpeak_dist_coeff'],
  [
    'interpolate',
    ['linear'],
    ['to-number', ['get', 'offpeak_dist_coeff']],
    -50, '#E5337A',
    -15, '#E89AB4',
    0, '#F2E4D3',
    25, '#C9D6BE',
    80, '#8FA38B',
    200, '#2F5D3A',
  ],
  '#cccccc',
];

// Distance-band tint per zone (Act II) — based on dist_to_cz_mi
const BAND_COLOR: ExpressionSpecification = [
  'case',
  ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 0], '#E5337A',
  ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 0.25], '#E89AB4',
  ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 1], '#F2E4D3',
  ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 3], '#C9D6BE',
  ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 5], '#8FA38B',
  '#2F5D3A',
];

// Bridge-marker color expression based on pct_change sign
const BRIDGE_COLOR: ExpressionSpecification = [
  'case',
  ['<', ['to-number', ['get', 'pct_change']], 0], '#E5337A',
  '#2F5D3A',
];

// Carto Positron raster style — no token required.
const POSITRON_STYLE = {
  version: 8 as const,
  sources: {
    positron: {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© <a href="https://carto.com/">CARTO</a> · © OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'positron-bg', type: 'raster' as const, source: 'positron' as const },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

const FRAME = {
  desktop: { center: [-73.96, 40.74] as [number, number], zoom: 10.4, padding: { top: 40, bottom: 40, left: 60, right: 60 } },
  hero:    { center: [-73.97, 40.75] as [number, number], zoom: 10.0 },
  bridges: { center: [-73.91, 40.71] as [number, number], zoom: 9.6 },
};

export function MapStage({ zones, peak, offpeak, cordon, bridges, act, regime, highlightBand, reduceMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const cordonPulsedRef = useRef(false);

  // ── init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: POSITRON_STYLE as maplibregl.StyleSpecification,
      center: FRAME.hero.center,
      zoom: FRAME.hero.zoom,
      attributionControl: false,
      cooperativeGestures: false,
      pitchWithRotate: false,
      dragRotate: false,
      keyboard: true,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();

    map.on('load', () => {
      // sources
      map.addSource('zones', { type: 'geojson', data: zones, promoteId: 'LocationID' });
      map.addSource('peak', { type: 'geojson', data: peak, promoteId: 'LocationID' });
      map.addSource('offpeak', { type: 'geojson', data: offpeak, promoteId: 'LocationID' });
      map.addSource('cordon', { type: 'geojson', data: cordon });
      map.addSource('bridges', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: bridges.map((b, i) => ({
            type: 'Feature',
            id: i,
            properties: { name: b.name, pct_change: b.pct_change, pre_volume: b.pre_volume, post_volume: b.post_volume },
            geometry: { type: 'Point', coordinates: [b.lon, b.lat] },
          })),
        },
      });

      // ── layers (declared once, opacity-toggled per act) ──

      // distance bands (Act II) — sits at the bottom so other choropleths can blend over
      map.addLayer({
        id: 'zones-bands',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': BAND_COLOR,
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 600 },
          'fill-color-transition': { duration: 600 },
        } as never,
      });

      // pickup choropleth (Act I)
      map.addLayer({
        id: 'zones-pickup',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': PCT_COLOR,
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 600 },
          'fill-color-transition': { duration: 600 },
        } as never,
      });

      // peak coefficient (Act III)
      map.addLayer({
        id: 'zones-peak',
        type: 'fill',
        source: 'peak',
        paint: {
          'fill-color': PEAK_COEF_COLOR,
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 600 },
          'fill-color-transition': { duration: 600 },
        } as never,
      });

      // offpeak coefficient (Act III)
      map.addLayer({
        id: 'zones-offpeak',
        type: 'fill',
        source: 'offpeak',
        paint: {
          'fill-color': OFFPEAK_COEF_COLOR,
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 600 },
          'fill-color-transition': { duration: 600 },
        } as never,
      });

      // band emphasis (Act II hover/brush)
      map.addLayer({
        id: 'zones-band-emphasis',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': '#1A1A1A',
          'line-width': 1.5,
          'line-opacity': 0,
          'line-opacity-transition': { duration: 400 },
        } as never,
      });

      // zone outlines — always faintly visible once we leave hero
      map.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': 'rgba(26, 26, 26, 0.18)',
          'line-width': 0.4,
          'line-opacity': 0,
          'line-opacity-transition': { duration: 600 },
        } as never,
      });

      // cordon — fill + line
      map.addLayer({
        id: 'cordon-fill',
        type: 'fill',
        source: 'cordon',
        paint: {
          'fill-color': '#E5337A',
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 1200 },
        } as never,
      });

      map.addLayer({
        id: 'cordon-line',
        type: 'line',
        source: 'cordon',
        paint: {
          'line-color': '#E5337A',
          'line-width': 2,
          'line-opacity': 0,
          'line-opacity-transition': { duration: 600 },
        } as never,
      });

      // bridges (Act IV)
      map.addLayer({
        id: 'bridges-circles',
        type: 'circle',
        source: 'bridges',
        paint: {
          'circle-color': BRIDGE_COLOR,
          'circle-stroke-color': 'rgba(26, 26, 26, 0.4)',
          'circle-stroke-width': 1,
          'circle-radius': [
            'interpolate', ['linear'], ['to-number', ['get', 'pre_volume']],
            1000000, 8,
            14000000, 22,
          ],
          'circle-opacity': 0,
          'circle-opacity-transition': { duration: 600 },
          'circle-stroke-opacity': 0,
          'circle-stroke-opacity-transition': { duration: 600 },
        } as never,
      });

      // hover state listener for tooltips
      const handleMove = (e: MapMouseEvent) => {
        const layers = (() => {
          if (act === 'pickup') return ['zones-pickup'];
          if (act === 'rings') return ['zones-bands'];
          if (act === 'gwr') return [regime === 'peak' ? 'zones-peak' : 'zones-offpeak'];
          if (act === 'bridges') return ['bridges-circles'];
          return [];
        })();
        if (layers.length === 0) {
          setTooltip(null);
          map.getCanvas().style.cursor = '';
          return;
        }
        const features = map.queryRenderedFeatures(e.point, { layers });
        if (features.length === 0) {
          setTooltip(null);
          map.getCanvas().style.cursor = '';
          return;
        }
        const f = features[0];
        const p = f.properties as Record<string, unknown>;
        map.getCanvas().style.cursor = 'pointer';
        if (act === 'bridges') {
          setTooltip({
            kind: 'bridge',
            name: String(p.name),
            pct: Number(p.pct_change),
            pre: Number(p.pre_volume),
            post: Number(p.post_volume),
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        } else if (act === 'gwr') {
          const coef = regime === 'peak' ? Number(p.peak_dist_coeff) : Number(p.offpeak_dist_coeff);
          const r2 = regime === 'peak' ? Number(p.peak_local_r2) : Number(p.offpeak_local_r2);
          const sig = regime === 'peak' ? Number(p.peak_dist_sig) : Number(p.offpeak_dist_sig);
          setTooltip({
            kind: 'gwr',
            name: String(p.zone),
            borough: String(p.borough),
            coef,
            r2,
            significant: sig === 1,
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        } else if (act === 'rings') {
          setTooltip({
            kind: 'band',
            name: String(p.zone),
            borough: String(p.borough),
            dist: Number(p.dist_to_cz_mi),
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        } else {
          setTooltip({
            kind: 'zone',
            name: String(p.zone),
            borough: String(p.borough),
            pct: Number(p.pct_change),
            dist: Number(p.dist_to_cz_mi),
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
          });
        }
      };
      map.on('mousemove', handleMove);
      map.on('mouseleave', () => setTooltip(null));

      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── apply per-act layer visibility ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    type Settings = Partial<Record<string, number>>;
    const visible: Settings = {
      'zones-line': 0,
      'zones-pickup': 0,
      'zones-bands': 0,
      'zones-peak': 0,
      'zones-offpeak': 0,
      'zones-band-emphasis': 0,
      'cordon-fill': 0,
      'cordon-line': 0,
      'bridges-circles': 0,
    };

    if (act === 'hero') {
      visible['cordon-fill'] = cordonPulsedRef.current ? 0.18 : 0.45;
      visible['cordon-line'] = 1;
      // pulse on first entry only
      if (!cordonPulsedRef.current && !reduceMotion) {
        const fill = 'cordon-fill';
        // animate from 0 → 0.7 → 0.18
        map.setPaintProperty(fill, 'fill-opacity', 0);
        requestAnimationFrame(() => {
          map.setPaintProperty(fill, 'fill-opacity', 0.7);
          window.setTimeout(() => {
            map.setPaintProperty(fill, 'fill-opacity', 0.18);
          }, 1200);
        });
        cordonPulsedRef.current = true;
      } else {
        cordonPulsedRef.current = true;
      }
    } else if (act === 'pickup') {
      visible['zones-pickup'] = 0.85;
      visible['zones-line'] = 1;
      visible['cordon-line'] = 1;
    } else if (act === 'rings') {
      visible['zones-bands'] = 0.7;
      visible['zones-line'] = 1;
      visible['cordon-line'] = 1;
      visible['zones-band-emphasis'] = highlightBand ? 1 : 0;
    } else if (act === 'gwr') {
      visible['zones-line'] = 1;
      visible['cordon-line'] = 1;
      if (regime === 'peak') visible['zones-peak'] = 0.85;
      else visible['zones-offpeak'] = 0.85;
    } else if (act === 'bridges') {
      visible['cordon-line'] = 1;
      visible['bridges-circles'] = 0.92;
    } else if (act === 'coda') {
      visible['zones-pickup'] = 0.65;
      visible['cordon-line'] = 1;
      visible['zones-line'] = 0.6;
    }

    // apply
    for (const [layer, opacity] of Object.entries(visible)) {
      try {
        const prop = layer.startsWith('bridges-') ? 'circle-opacity' :
                     layer === 'zones-line' || layer === 'cordon-line' || layer === 'zones-band-emphasis' ? 'line-opacity' :
                     'fill-opacity';
        map.setPaintProperty(layer, prop, opacity ?? 0);
        if (layer === 'bridges-circles') {
          map.setPaintProperty(layer, 'circle-stroke-opacity', opacity ?? 0);
        }
      } catch {
        // layer may not be ready yet — silently skip
      }
    }

    // ── camera framing
    if (act === 'hero') {
      map.easeTo({ center: FRAME.hero.center, zoom: FRAME.hero.zoom, duration: reduceMotion ? 0 : 1200 });
    } else if (act === 'bridges') {
      map.easeTo({ center: FRAME.bridges.center, zoom: FRAME.bridges.zoom, duration: reduceMotion ? 0 : 1200 });
    } else {
      map.easeTo({ center: FRAME.desktop.center, zoom: FRAME.desktop.zoom, duration: reduceMotion ? 0 : 1200 });
    }
  }, [act, regime, highlightBand, ready, reduceMotion]);

  // ── band brushing emphasis (Act II): paint band emphasis layer based on highlightBand ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filter = makeBandFilter(highlightBand);
    try {
      map.setFilter('zones-band-emphasis', filter);
    } catch {
      // layer not ready
    }
  }, [highlightBand, ready]);

  return (
    <>
      <div ref={containerRef} className="map-stage" aria-label="Interactive map of NYC congestion-pricing spillover" />
      <Tooltip state={tooltip} />
      <Legend act={act} regime={regime} />
    </>
  );
}

function makeBandFilter(band: string | null): ExpressionSpecification {
  if (!band) return ['==', ['get', 'LocationID'], -1];
  if (band === 'inside') return ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 0];
  if (band === '0-0.25') return ['all', ['>', ['to-number', ['get', 'dist_to_cz_mi']], 0], ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 0.25]];
  if (band === '0.25-1') return ['all', ['>', ['to-number', ['get', 'dist_to_cz_mi']], 0.25], ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 1]];
  if (band === '1-3') return ['all', ['>', ['to-number', ['get', 'dist_to_cz_mi']], 1], ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 3]];
  if (band === '3-5') return ['all', ['>', ['to-number', ['get', 'dist_to_cz_mi']], 3], ['<=', ['to-number', ['get', 'dist_to_cz_mi']], 5]];
  return ['>', ['to-number', ['get', 'dist_to_cz_mi']], 5];
}
