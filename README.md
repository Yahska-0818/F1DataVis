# F1 Data Vis

![React](https://img.shields.io/badge/frontend-React_%2B_Vite-61DAFB.svg?logo=react)
![Python](https://img.shields.io/badge/backend-FastAPI_%2B_FastF1-3776AB.svg?logo=python)
![Redis](https://img.shields.io/badge/cache-Redis-DC382D.svg?logo=redis)

**F1 Data Vis** is a high-performance telemetry analysis dashboard for Formula 1. It bridges the gap between high-level race overviews and granular engineering data, visualizing everything from tire degradation curves to corner-by-corner throttle inputs.

Powered by **FastF1** and optimized with **Redis caching**, it transforms millions of telemetry data points into interactive, instant insights.

**Access it [here](https://f1datavis-frontend.onrender.com/)**

---

## Features

### Race Overview
- **Pace Distribution:** Box plots visualizing lap time consistency and tire degradation, with intelligent outlier filtering (IQR method).
- **Qualifying Analysis:** Stacked bar charts breaking down lap times by Sector 1, 2, and 3 to show where time was gained or lost.
- **Lap Progression:** Interactive line charts to track race narrative, strategy, and pace evolution over time.

### Deep Telemetry Analysis
- **Click-to-Compare:** Select specific laps from the progression chart to overlay detailed telemetry.
- **Full Trace Data:** Synchronized visualization of Speed, Throttle, Brake, RPM, Gear, and DRS usage against track distance.
- **Delta Timing:** Instant delta comparison against the fastest selected lap.
- **Track Dominance Map:** A mini-sector map revealing exactly where each driver was faster on the circuit.

### Performance Engineering
- **Smart Caching:** Redis-backed architecture ensures repeated queries load instantly.
- **Background Warming:** Automated scheduler pre-fetches data for recent races to minimize cold starts.
- **Optimized Payloads:** Backend filters and downsamples high-frequency data (20hz+) for smooth frontend rendering without lag.

---

## Tech Stack

### Frontend
- **Framework:** React 18 + Vite (TypeScript)
- **Visualization:** Recharts (Customized specifically for telemetry data)
- **Styling:** Tailwind CSS
- **State Management:** React Hooks + Custom Data Processing Services

### Backend
- **API:** FastAPI (Python 3.11)
- **Data Source:** [FastF1](https://github.com/theOehrly/Fast-F1)
- **Caching:** Redis (with `allkeys-lru` eviction policy)
- **Task Scheduling:** APScheduler (for cache warming)
- **Data Processing:** Pandas & NumPy (Vectorized operations for speed)

---

## Screenshots

| Race Pace Distribution |
|:---:|
| ![Race Pace](./Screenshot%202025-12-04%20171531.png) |
| **Pace Progression** |
| ![Pace Progression](./Screenshot%202025-12-04%20171652.png) |
| **Lap Telemetry** |
| ![Lap Telemetry](./Screenshot%202025-12-04%20174703.png) |
---
