import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

export type Act = 'hero' | 'pickup' | 'rings' | 'gwr' | 'bridges' | 'coda';

export type Regime = 'peak' | 'offpeak';

export interface ZoneProps {
  LocationID: number;
  borough: string;
  zone: string;
  pct_change: number;
  dist_to_cz_mi: number;
  dist_coeff: number;
  local_r2: number;
  dist_sig: 0 | 1;
}

export interface PeakProps {
  LocationID: number;
  borough: string;
  zone: string;
  dist_to_cz_mi: number;
  peak_pct_change: number;
  peak_dist_coeff: number;
  peak_local_r2: number;
  peak_dist_sig: 0 | 1;
}

export interface OffpeakProps {
  LocationID: number;
  borough: string;
  zone: string;
  dist_to_cz_mi: number;
  offpeak_pct_change: number;
  offpeak_dist_coeff: number;
  offpeak_local_r2: number;
  offpeak_dist_sig: 0 | 1;
}

export type ZoneFC = FeatureCollection<Polygon | MultiPolygon, ZoneProps>;
export type PeakFC = FeatureCollection<Polygon | MultiPolygon, PeakProps>;
export type OffpeakFC = FeatureCollection<Polygon | MultiPolygon, OffpeakProps>;
export type CordonFC = FeatureCollection<Polygon | MultiPolygon>;

export interface Bridge {
  name: string;
  lon: number;
  lat: number;
  pct_change: number;
  pre_volume: number;
  post_volume: number;
}

export interface BandRow {
  dist_band: string;
  after: number;
  before: number;
  spillover: number;
}

export const BAND_ORDER = ['inside', '0-0.25', '0.25-1', '1-3', '3-5', '5+'];

export const BAND_LABELS: Record<string, string> = {
  inside: 'inside zone',
  '0-0.25': '0 – ¼ mi',
  '0.25-1': '¼ – 1 mi',
  '1-3': '1 – 3 mi',
  '3-5': '3 – 5 mi',
  '5+': '5+ mi',
};
