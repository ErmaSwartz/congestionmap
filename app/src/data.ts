import { useEffect, useState } from 'react';
import type { ZoneFC, PeakFC, OffpeakFC, CordonFC, Bridge, BandRow } from './types';
import { BAND_ORDER } from './types';

const base = import.meta.env.BASE_URL;

interface DataBundle {
  zones: ZoneFC;
  peak: PeakFC;
  offpeak: OffpeakFC;
  cordon: CordonFC;
  bridges: Bridge[];
  bands: BandRow[];
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function fetchCSV(path: string): Promise<BandRow[]> {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  const [header, ...rows] = text.trim().split('\n');
  const cols = header.split(',');
  return rows.map((line) => {
    const vals = line.split(',');
    const obj: Record<string, string> = {};
    cols.forEach((c, i) => (obj[c] = vals[i]));
    return {
      dist_band: obj.dist_band,
      after: Number(obj.after),
      before: Number(obj.before),
      spillover: Number(obj.spillover),
    };
  });
}

export function useDataBundle() {
  const [bundle, setBundle] = useState<DataBundle | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchJSON<ZoneFC>('data/zones.geojson'),
      fetchJSON<PeakFC>('data/gwr_peak.geojson'),
      fetchJSON<OffpeakFC>('data/gwr_offpeak.geojson'),
      fetchJSON<CordonFC>('data/cordon.geojson'),
      fetchJSON<Bridge[]>('data/bridges.json'),
      fetchCSV('data/bands.csv'),
    ])
      .then(([zones, peak, offpeak, cordon, bridges, bands]) => {
        if (cancelled) return;
        bands.sort((a, b) => BAND_ORDER.indexOf(a.dist_band) - BAND_ORDER.indexOf(b.dist_band));
        setBundle({ zones, peak, offpeak, cordon, bridges, bands });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { bundle, error };
}
