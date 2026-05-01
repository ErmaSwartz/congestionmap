import { useEffect, useState } from 'react';

export type Act1Data = {
  meta: {
    treatment: string;
    window: string;
    pre_years_for_trend: number[];
    rolling_window_days: number;
    generated_at: string;
  };
  headline: {
    total_2024: number;
    total_2025: number;
    pct_change: number;
  };
  stackedArea: {
    date: string;
    subway: number;
    otherTransit: number;
    bt: number;
  }[];
  perMode: {
    mode: string;
    naive_pct: number;
    trend_adjusted_pct: number;
    observed_2025: number;
    projected_2025: number;
  }[];
  modeShare: {
    mode: string;
    share_2024: number;
    share_2025: number;
    delta_pp: number;
  }[];
};

const base = import.meta.env.BASE_URL;

let cached: Act1Data | null = null;
let pending: Promise<Act1Data> | null = null;

export function fetchAct1Data(): Promise<Act1Data> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetch(`${base}data/act1.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load act1.json: ${r.status}`);
      return r.json() as Promise<Act1Data>;
    })
    .then((d) => {
      cached = d;
      pending = null;
      return d;
    });
  return pending;
}

export function useAct1Data(): { data: Act1Data | null; error: Error | null } {
  const [data, setData] = useState<Act1Data | null>(cached);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (cached) {
      setData(cached);
      return;
    }
    let alive = true;
    fetchAct1Data()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { data, error };
}
