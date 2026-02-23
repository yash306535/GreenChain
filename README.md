<div align="center">

# 🌿 GreenChain

### AI-Powered Green Logistics & Sustainability Platform

[![React Native](https://img.shields.io/badge/React_Native-Expo-0EA5E9?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

**Track emissions. Earn carbon credits. Decarbonize your fleet.**

</div>

---

## 🚀 What is GreenChain?

GreenChain is a real-time sustainability intelligence platform for logistics fleets. It monitors every shipment's carbon footprint, grades drivers and vehicles against India's national emission baseline, and uses Gemini AI to give fleet managers instant, actionable advice — from cutting idle time to switching diesel routes to EV.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Shipment Tracking** | Real-time GPS, speed, fuel burn, and ETA per shipment |
| **Green Score Grading** | A–F grade per shipment based on CO₂ efficiency, driver behaviour, vehicle type, and load factor |
| **Carbon Credit Engine** | Auto-calculates credits earned vs India's 0.90 kg CO₂/km baseline (Gold Standard VER) |
| **AI Copilot** | Ask Gemini anything — "where is money being wasted on fuel?" — gets real fleet context |
| **Smart Alerts** | Push notifications for emission spikes, harsh braking, idling, and delay risks |
| **Interactive Map** | Live shipment pins on Leaflet/OpenStreetMap, filterable by grade |
| **Route Alternatives** | AI-ranked EV/CNG/rail recommendations per lane |
| **Proactive Insights** | Daily auto-generated fleet sustainability insights |

---

## 📱 App Screens

```
Dashboard     →  Fleet KPIs, carbon credits, grade distribution
Shipments     →  Live list with grade badges and alert counts
Map           →  Pin map with filter chips and slide-up detail panel
Alerts        →  Real-time push notifications, severity-coded feed
AI Chat       →  Gemini-powered sustainability copilot
Settings      →  Profile, preferences, weekly report
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│               React Native (Expo)                │
│  Dashboard · Map · Shipments · Alerts · AI Chat  │
└───────────────────┬─────────────────────────────┘
                    │  REST + WebSocket
┌───────────────────▼─────────────────────────────┐
│               FastAPI Backend                    │
│  /shipments  /alerts  /ai/ask  /emissions        │
│  /route-alternatives  /weekly-report             │
└──────┬──────────────────────┬────────────────────┘
       │                      │
┌──────▼──────┐     ┌─────────▼────────┐
│  Supabase   │     │   Gemini AI       │
│  PostgreSQL │     │   (2.0-flash)     │
│  Realtime   │     │   RAG + Policies  │
└─────────────┘     └──────────────────┘
```

---

## 🌱 Emission Benchmarks

| Mode | CO₂/km | GreenChain Grade |
|------|--------|-----------------|
| Diesel Truck | 0.90 kg | Baseline (India avg) |
| CNG Truck | 0.52 kg | B–C |
| EV Truck | 0.05 kg | A+ |
| Rail Freight | 0.015 kg | A+ |
| **EU 2030 Target** | **0.55 kg** | — |

---

## 🛠 Tech Stack

**Frontend**
- React Native + Expo Router (file-based navigation)
- TypeScript
- Leaflet.js via WebView (interactive map, no API key needed)
- expo-notifications (push alerts)
- Animated API (skeleton loading, transitions)

**Backend**
- FastAPI + Uvicorn
- Gemini 2.0 Flash (AI copilot, with 4-model fallback chain)
- Supabase (PostgreSQL + realtime subscriptions)
- Pathway-style streaming simulator (live telemetry)
- RAG policy engine (50 sustainability policies, keyword-scored retrieval)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Expo Go app (iOS/Android) **or** run `npx expo run:android` for a dev build
- Supabase project
- Google Gemini API key

---

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

Seed the database and start the server:
```bash
python seed_supabase.py          # one-time DB seed
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`.
Swagger docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

> Use your machine's local IP (e.g. `192.168.1.x`), not `localhost` — the phone needs to reach your dev server over the network.

```bash
npx expo start          # Expo Go (QR code)
# or
npx expo run:android    # dev build with full native modules
```

---

## 📁 Project Structure

```
greenchain/
├── frontend/
│   ├── app/
│   │   ├── (tabs)/          # Dashboard, Map, Shipments, Alerts, AI, Settings
│   │   ├── auth/            # Login / Register
│   │   └── shipment/[id]    # Shipment detail with skeleton loading
│   ├── hooks/               # useShipments, useAlerts, useDashboard
│   ├── lib/                 # notifications.ts, api.ts
│   └── components/          # Shared UI components
│
└── backend/
    ├── routers/             # ai_insights, shipments, alerts, emissions
    ├── services/            # gemini_service, supabase_client
    ├── pathway_engine/      # stream_simulator, rag_index
    ├── models/              # Pydantic schemas
    └── data/
        └── sustainability_policies.txt   # 50 RAG policies
```

---

## 🤖 AI Copilot — How It Works

1. User asks a question in the chat screen
2. Backend fetches live fleet stats from `shipments` table
3. RAG engine keyword-scores 50 sustainability policies, returns top 5
4. Gemini 2.0 Flash receives: **fleet context + policies + question + chat history**
5. Response is stored and returned with full multi-turn support

Example questions that work well:
- *"Where is money being wasted on fuel?"*
- *"Which shipment should switch to EV first?"*
- *"Explain why SHP-001 got a D grade"*
- *"How many carbon credits did we earn this week?"*

---

## 🔔 Alerts & Notifications

| Severity | Trigger |
|----------|---------|
| 🔴 High | CO₂/km > 1.0 kg |
| 🟡 Medium | ETA drift > 30 min, 5+ harsh braking events in 90 min |
| 🟢 Low | Idling > 12 min in 60 min |

Notifications fire via `expo-notifications` (works in Expo Go). New alerts trigger push notifications only after the first app load — no spam on startup.

---

## 📊 Carbon Credit Calculation

```
credits = (baseline_co2 - actual_co2) / 1000
baseline_co2 = distance_km × 0.90 kg/km          # India national average
actual_co2   = fuel_litres × 2.68 kg/L            # IPCC AR6 diesel factor

1 credit = 1 tonne CO₂ avoided = ₹800 (~USD 9.50)
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shipments/` | All shipments with live telemetry |
| GET | `/shipments/{id}` | Single shipment detail |
| GET | `/alerts/` | All fleet alerts |
| POST | `/ai/ask` | AI copilot query |
| GET | `/ai/proactive-insights` | 3 daily auto-insights |
| POST | `/ai/ev-transition-advice` | EV conversion ranking |
| GET | `/ai/weekly-report-summary` | Executive summary |
| GET | `/emissions/` | Fleet emission records |
| GET | `/route-alternatives/{id}` | Greener route options |

---

## 🗺 Roadmap

- [ ] Real GPS integration (replace simulator)
- [ ] Driver mobile app with score dashboard
- [ ] Multi-tenant fleet management
- [ ] Blockchain-verified carbon credit certificates
- [ ] Rail booking API integration (IRCTC / Rivigo)
- [ ] Scope 3 supply chain reporting export (GHG Protocol)

---

## 🏆 Built For

> Hackathon / Demo project showcasing how AI + real-time telemetry + sustainability policies can reduce logistics emissions and monetize green performance for Indian fleets.

---

<div align="center">

Made with 💚 for a greener supply chain

</div>
