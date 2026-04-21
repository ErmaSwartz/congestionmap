# NYC Congestion Pricing: Taxi Spillover Analysis

## Overview

This project analyzes the spatial impact of congestion pricing in New York City, with a focus on how taxi activity changes as distance from the congestion zone increases.

Rather than only measuring changes inside the zone, this analysis asks:

> How does traffic behavior redistribute across space?

Using taxi trip data, bridge traffic data, and spatial buffering techniques, this project identifies patterns of spillover and visualizes them through an interactive web map.

---

## Key Questions

- Does congestion pricing reduce traffic within the zone?
- Where does displaced traffic go?
- How does taxi activity change across distance bands?
- Do outer areas experience increased congestion?

---

## Data Sources

- NYC Taxi Trip Data (aggregated before/after congestion pricing)
- Congestion Zone Boundary (GeoJSON)
- NYC Street Centerline Data (for spatial context)
- Bridge and Tunnel Traffic Counts (summary metric)

---

## Methodology

### 1. Spatial Buffering

The congestion zone was used as a base geometry and expanded into distance-based bands:

- Inside zone
- 0–0.25 miles
- 0.25–1 mile
- 1–3 miles
- 3–5 miles
- 5+ miles

Buffers were created using projected CRS (EPSG:2263) to ensure accurate distance calculations.

---

### 2. Taxi Spillover Calculation

For each band:

\[
\text{Percent Change} = \frac{After - Before}{Before} \times 100
\]

This captures how taxi activity changed after congestion pricing.

---

### 3. Spatial Join

Taxi metrics were merged onto spatial bands to enable mapping.

---

### 4. Visualization

An interactive web map was built using:

- `GeoPandas` for spatial processing
- `Folium` for mapping
- `Chart.js` for embedded visualizations

The map includes:
- Distance-based color grading (choropleth)
- Tooltips with raw and percentage values
- NYC street network for context
- Congestion zone boundary overlay

---

## Results

### 🚖 Taxi Activity

- Significant increases observed outside the congestion zone
- Strongest growth in:
  - 1–3 mile band
  - 3–5 mile band
  - 5+ mile band

- Minimal or negative change near the immediate boundary (0–0.25 miles)

### 🌉 Bridge Traffic

- Overall decrease (~ -3.25%)

### 📊 Interpretation

This suggests:

- Congestion pricing successfully reduces traffic inflow into the zone
- However, activity redistributes outward rather than disappearing
- Outer neighborhoods may experience increased traffic pressure

---

## Interactive Map

The final output is an interactive HTML map that includes:

- Choropleth visualization of taxi spillover
- Hover tooltips with detailed metrics
- Embedded bar chart showing change by distance
- Styled legend, title, and map UI elements

---

## How to Run

```bash
pip install geopandas pandas folium branca jinja2
