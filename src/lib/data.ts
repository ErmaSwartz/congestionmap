// Build-time CSV loaders. Reads from /public/data/* via Node fs so the
// component output is fully static — no browser fetch needed for first paint.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Monthly {
  month: string;          // "YYYY-MM"
  date: Date;             // first of the month, UTC
  cordonUmol: number;
  restUmol: number;
  cordonN: number;
  restN: number;
}

export function loadMonthly(): Monthly[] {
  const path = resolve("public/data/no2_monthly.csv");
  const csv = readFileSync(path, "utf-8").trim();
  const [head, ...rows] = csv.split("\n");
  const cols = head.split(",");
  const idx = {
    month: cols.indexOf("month"),
    cordon: cols.indexOf("cordon_umol_m2"),
    rest: cols.indexOf("rest_umol_m2"),
    cN: cols.indexOf("cordon_n_pixels"),
    rN: cols.indexOf("rest_n_pixels"),
  };
  return rows.map((line) => {
    const f = line.split(",");
    const [y, m] = f[idx.month].split("-").map(Number);
    return {
      month: f[idx.month],
      date: new Date(Date.UTC(y, m - 1, 1)),
      cordonUmol: parseFloat(f[idx.cordon]),
      restUmol: parseFloat(f[idx.rest]),
      cordonN: parseInt(f[idx.cN], 10),
      restN: parseInt(f[idx.rN], 10),
    };
  });
}

export interface DidCi {
  realGap: { value: number; ci: [number, number] };
  didOfDids: { value: number; ci: [number, number] };
  nCordon: number;
  nRest: number;
  nBoot: number;
}

export function loadDidCi(): DidCi {
  // Computed once and copied into the repo so the website build doesn't
  // depend on the analysis tree being present.
  const path = resolve("public/data/did_ci.json");
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return {
    realGap: {
      value: raw.real_window.gap_pp,
      ci: raw.real_window.gap_ci_pp as [number, number],
    },
    didOfDids: {
      value: raw.did_of_dids_pp,
      ci: raw.did_of_dids_ci_pp as [number, number],
    },
    nCordon: raw.n_cordon_pixels,
    nRest: raw.n_rest_pixels,
    nBoot: raw.n_bootstrap,
  };
}
