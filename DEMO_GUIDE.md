# GreenChain — Demo Guide

---

## What is GreenChain?

**GreenChain** is a real-time supply chain sustainability platform built for Indian logistics operators. It helps fleet managers and sustainability officers:

- **Track live shipments** across India with GPS coordinates, speed, and ETA
- **Monitor CO₂ emissions** per vehicle, per route, and per driver in real time
- **Benchmark performance** against India average, EU 2030 targets, EV trucks, and rail
- **Score every shipment** A–F using a Green Score (efficiency + driver behaviour + vehicle type + cargo load)
- **Earn carbon credits** automatically when emissions beat the India baseline (0.9 kg/km)
- **Get AI-powered recommendations** via an on-device chat powered by Google Gemini
- **Receive smart alerts** for emission spikes, harsh braking, idling, delay risks

**Target users:** Logistics managers, sustainability officers, fleet operators, ESG reporting teams.

**Core value proposition:** One dashboard that turns raw telemetry (GPS, fuel, speed) into actionable sustainability intelligence — live, not retrospective.

---

## Architecture in 60 seconds

```
Mobile App (React Native / Expo)
  ↕  REST + WebSocket
FastAPI Backend (Python)
  ↕  PostgreSQL (Supabase)
  ↕  Google Gemini (AI)
  ↕  Stream Simulator (live telemetry)
```

- The **stream simulator** runs in the backend and pushes a telemetry tick every 3 seconds for each active shipment (position, speed, fuel, anomalies).
- The **frontend polls** every 30 seconds for shipments and 15 seconds for alerts — WebSocket pushes real-time updates between polls.
- **All data flows through a single Supabase PostgreSQL database** — no separate analytics store.
- When the database is unavailable the app **automatically falls back to rich local seed data** so the UI is always functional.

---

## Running the demo

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt          # first time only
python -m backend.main                   # starts on port 8000
```

The server logs will say either:
- `GreenChain backend startup complete` — connected to Supabase
- `Supabase unavailable, starting in local seeded mode` — using local demo data (still fully functional)

### 2. Seed the database (if Supabase is available)

```bash
# From repo root
python -m backend.seed_supabase
```

This inserts 10 realistic Indian shipments, 37 emission readings, and 7 alerts into your live Supabase database. Safe to re-run — it upserts, never duplicates.

### 3. Start the live stream (optional — makes shipments move in real time)

```bash
curl -X POST http://localhost:8000/shipments/stream/start
```

### 4. Start the frontend

```bash
cd frontend
npm install                              # first time only
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

---

## Demo flow — step by step

Walk through this sequence for a polished 5-minute demo.

---

### Screen 1 — Dashboard (home tab)

**What to say:**
> "This is the fleet overview — all active and completed shipments, live. Each card shows the route, vehicle type, how far along it is, the current green score grade, and any active alerts."

**What to point at:**
- The **alert banners** at the top — you'll see 2 high-severity alerts (SHP-2004 and SHP-2009) in red
- A **Grade A** card (SHP-2002 Bengaluru→Hyderabad, EV truck) — "This EV truck is tracking at just 0.05 kg CO₂/km versus the India average of 0.9"
- A **Grade F** card (SHP-2009 Nagpur→Pune) — "This diesel truck has 6 harsh braking events and is burning 1.13 kg/km — nearly double the EU 2030 target. The system flagged it automatically."
- Tap a card to open the **Shipment Detail** screen

---

### Screen 2 — Shipment Detail (tap SHP-2009)

**What to say:**
> "Every shipment has a full breakdown — live coordinates, current speed, fuel burned, and a predicted final CO₂ for the whole journey. The emission history chart shows exactly when the spike happened."

**What to point at:**
- The **emission gauge** (red, F grade) — "42.5 kg so far, predicted to reach 668 kg total vs the 531 kg baseline — that's negative carbon credits"
- The **Route Alternatives** button — tap it
- The modal shows 3 alternatives: **EV truck** (saves ~580 kg), **Rail corridor** (saves ~640 kg), **Load consolidation**
- "For the next shipment on this lane, switching to rail would save 640 kg and earn 0.64 carbon credits worth ₹512"

---

### Screen 3 — Emissions tab

**What to say:**
> "Fleet-level emissions analytics. Today's total, weekly average, and trend versus Monday. The weekly chart shows the up-and-down — Tuesday spike was SHP-2004 idling on NH-44."

**What to point at:**
- The **3 summary stat cards** at the top — Today / Weekly Avg / vs Monday
- The **gauge** — current reading with colour-coded status badge
- The **Benchmark bars** — show how the fleet compares to India avg (0.90), EU 2030 (0.55), EVs (0.05), trains (0.03)
- "Our fleet average is 0.77 kg/km — better than India avg but still 40% above the EU 2030 target. That's the gap we need to close."

---

### Screen 4 — AI Insights tab

**What to say:**
> "This is the AI layer — powered by Google Gemini. I can ask it anything about the fleet and it answers using live data context."

**Demo prompts to use:**
1. Tap the quick chip: **"Which shipments are highest emission risk?"**
   - AI responds with SHP-2009 and SHP-2004, explains the spike, suggests driver coaching + route change
2. Type manually: **"How much CO₂ can we save by switching SHP-2001 to rail?"**
   - AI calculates: Delhi–Mumbai by truck = ~1,085 kg predicted; by rail ≈ 42 kg; saving ≈ 1,043 kg = 1.04 credits = ₹832
3. Tap: **"Top 3 green route optimizations today"**
   - AI lists SHP-2009 (rail switch), SHP-2001 (consolidation), SHP-2006 (CNG upgrade)

**What to say:**
> "The AI has access to all shipment data, emission readings, and the company's sustainability policies. It gives specific, number-backed recommendations — not generic tips."

---

### Screen 5 — Map tab

**What to say:**
> "Live map of all shipments. Each pin shows current position, vehicle type, and status. EV trucks and trains are green; diesel trucks with high emissions are red."

**What to point at:**
- 7 active shipments spread across India
- SHP-2005 (Kolkata→Bhubaneswar train) — "45 tons of cargo at 0.015 kg CO₂/km — the greenest shipment in the fleet today"
- SHP-2009 near Nagpur — pulsing red pin — "flagged for immediate intervention"

---

### Screen 6 — Analytics tab

**What to say:**
> "Fleet-level KPIs — total CO₂ this week, breakdown by vehicle type, and the driver leaderboard."

**What to point at:**
- **Vehicle comparison**: EV trucks generate 97% fewer emissions per km than diesel on the same routes
- **Driver leaderboard**: Top driver (SHP-2005, score 96) vs bottom (SHP-2009, score 51)
- "Driver score factors in idling time, harsh braking events, and speed consistency — not just CO₂"
- Monthly target progress bar — "We're at 68% of the monthly CO₂ budget with 12 days left"

---

### Screen 7 — Score tab

**What to say:**
> "This is the sustainability scorecard — every shipment gets an A–F grade, and the fleet earns carbon credits that have real monetary value."

**What to point at:**
- Fleet average: **B (75.4)**
- **Carbon credits earned today**: ~0.23 credits = ₹184 (EV trucks and CNG trucks beat the baseline)
- SHP-2002 (Grade A, EV): "0.05 kg/km vs 0.9 kg baseline — saved 329 kg so far, generating 0.33 credits"
- SHP-2009 (Grade F): "Running above baseline — negative credit impact on the fleet"
- Achievements section: "These unlock when fleet reaches sustainability milestones — a gamification layer for driver and manager engagement"

---

## Key numbers for the demo

| Metric | Value | Source |
|--------|-------|--------|
| Active shipments | 7 in-transit | seed data |
| Completed today | 3 | seed data |
| Best CO₂/km | 0.015 kg/km | SHP-2005 (train) |
| Worst CO₂/km | 1.13 kg/km | SHP-2009 (diesel, idling) |
| India average | 0.90 kg/km | benchmark |
| EU 2030 target | 0.55 kg/km | benchmark |
| EV truck | 0.05 kg/km | benchmark |
| Unread alerts | 5 | 2 high, 3 medium |
| Fleet green score | B (75.4) | calculated |
| Carbon credits today | ~0.23 | EV + CNG beats baseline |

---

## Talking points — common questions

**"Is this live data?"**
> Yes — when the backend is running with Supabase connected, the stream simulator pushes new telemetry every 3 seconds. The frontend receives updates via WebSocket. The demo seed data gives you realistic numbers even without a live database.

**"How does the green score work?"**
> It combines four factors: CO₂ efficiency vs the India baseline (biggest weight), driver behaviour score (idling, harsh braking, speeding events), vehicle type bonus (EV gets +10, rail +8), and cargo load utilisation. Scores are 0–100 and map to grades A through F.

**"What's a carbon credit worth?"**
> We use Gold Standard methodology: 1 credit = 1 tonne of CO₂ avoided vs the India average baseline of 0.9 kg/km. We price credits at ₹800/credit. A fleet running 80% EV can generate significant monthly credit revenue.

**"What happens with the AI?"**
> The AI gets a live context packet of fleet stats (total CO₂, top emitters, anomalies) plus any relevant sustainability policy text from your documents, then answers using Google Gemini. It maintains conversation history so follow-up questions work naturally.

**"Can this scale to hundreds of trucks?"**
> The architecture is designed for it — Supabase PostgreSQL handles millions of telemetry rows, the FastAPI backend is stateless and can horizontally scale, and the stream simulator can be replaced with a real IoT connector (GPS/OBD device → MQTT → backend).

---

## Demo seed data — full shipment list

| ID | Route | Vehicle | Status | Grade | CO₂/km | Note |
|----|-------|---------|--------|-------|--------|------|
| SHP-2001 | Delhi → Mumbai | Diesel truck | in_transit 40% | C | 0.79 | Long haul, fuel creeping up |
| SHP-2002 | Bengaluru → Hyderabad | EV truck | in_transit 65% | A | 0.05 | Best performer |
| SHP-2003 | Mumbai → Pune | CNG truck | completed | B | 0.55 | Clean short haul |
| SHP-2004 | Chennai → Bengaluru | Diesel truck | in_transit 80% | D | 0.91 | Idling alert active |
| SHP-2005 | Kolkata → Bhubaneswar | Train | in_transit 30% | A | 0.015 | 45 ton cargo, greenest |
| SHP-2006 | Ahmedabad → Delhi | Diesel truck | in_transit 55% | C | 0.76 | Interstate, acceptable |
| SHP-2007 | Jaipur → Lucknow | CNG truck | completed | B | 0.55 | Long completed haul |
| SHP-2008 | Hyderabad → Chennai | EV truck | in_transit 45% | A | 0.05 | Excellent EV |
| SHP-2009 | Nagpur → Pune | Diesel truck | in_transit 20% | F | 1.00 | Worst — harsh braking + idling |
| SHP-2010 | Delhi → Chandigarh | CNG truck | completed | B | 0.54 | Short completed |
