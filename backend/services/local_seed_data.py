"""
Local seed data — rich demo dataset for GreenChain.

Used automatically when Supabase/PostgreSQL is unavailable (seeded_mode).
Also imported by seed_supabase.py to push the same data into the real DB.

10 realistic Indian logistics shipments:
  • All vehicle types  : truck_diesel, truck_cng, ev_truck, train
  • All green grades   : A (×3), B (×3), C (×2), D (×1), F (×1)
  • All statuses       : in_transit (×7), completed (×3)
  • 4-5 emission readings per shipment (realistic segment progression)
  • 7 alerts covering delay_risk, emission_spike, harsh_braking, idle_alert
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any


_now = datetime.utcnow()

# ──────────────────────────────────────────────────────────────────────────────
# Shipments
# ──────────────────────────────────────────────────────────────────────────────

_shipments: list[dict[str, Any]] = [

    # ── 1. Delhi → Mumbai  |  truck_diesel  |  Grade C  |  in_transit 40% ──
    {
        "id": "demo-1",
        "shipment_id": "SHP-2001",
        "origin": "Delhi",
        "destination": "Mumbai",
        "current_lat": 24.80,        # ~40% interpolated
        "current_lng": 75.48,
        "speed_kmh": 61.0,
        "fuel_consumed_liters": 140.0,
        "distance_covered_km": 560.0,
        "total_distance_km": 1400.0,
        "eta_minutes": 1020,         # ~17 hrs remaining
        "status": "in_transit",
        "vehicle_type": "truck_diesel",
        "cargo_weight_tons": 22.0,
        "driver_score": 73.0,
        "green_score": "C",
        "green_score_value": 63.0,
        "predicted_final_co2_kg": 1085.0,
        "created_at": (_now - timedelta(hours=9)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 2. Bengaluru → Hyderabad  |  ev_truck  |  Grade A  |  in_transit 65% ──
    {
        "id": "demo-2",
        "shipment_id": "SHP-2002",
        "origin": "Bengaluru",
        "destination": "Hyderabad",
        "current_lat": 15.84,        # ~65% interpolated
        "current_lng": 78.17,
        "speed_kmh": 68.0,
        "fuel_consumed_liters": 0.0,  # EV — no fuel
        "distance_covered_km": 371.0,
        "total_distance_km": 570.0,
        "eta_minutes": 150,
        "status": "in_transit",
        "vehicle_type": "ev_truck",
        "cargo_weight_tons": 8.0,
        "driver_score": 93.0,
        "green_score": "A",
        "green_score_value": 94.0,
        "predicted_final_co2_kg": 29.0,
        "created_at": (_now - timedelta(hours=6)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 3. Mumbai → Pune  |  truck_cng  |  Grade B  |  completed ──
    {
        "id": "demo-3",
        "shipment_id": "SHP-2003",
        "origin": "Mumbai",
        "destination": "Pune",
        "current_lat": 18.5204,      # at destination
        "current_lng": 73.8567,
        "speed_kmh": 0.0,
        "fuel_consumed_liters": 31.5,
        "distance_covered_km": 150.0,
        "total_distance_km": 150.0,
        "eta_minutes": 0,
        "status": "completed",
        "vehicle_type": "truck_cng",
        "cargo_weight_tons": 15.0,
        "driver_score": 86.0,
        "green_score": "B",
        "green_score_value": 79.0,
        "predicted_final_co2_kg": 82.0,
        "created_at": (_now - timedelta(hours=5)).isoformat(),
        "updated_at": (_now - timedelta(hours=1)).isoformat(),
    },

    # ── 4. Chennai → Bengaluru  |  truck_diesel  |  Grade D  |  in_transit 80% ──
    {
        "id": "demo-4",
        "shipment_id": "SHP-2004",
        "origin": "Chennai",
        "destination": "Bengaluru",
        "current_lat": 13.51,        # ~80% interpolated
        "current_lng": 79.21,
        "speed_kmh": 38.0,           # slow — congestion + bad driving
        "fuel_consumed_liters": 88.0,
        "distance_covered_km": 280.0,
        "total_distance_km": 350.0,
        "eta_minutes": 115,          # slight delay risk
        "status": "in_transit",
        "vehicle_type": "truck_diesel",
        "cargo_weight_tons": 18.0,
        "driver_score": 58.0,        # poor — high idling + harsh braking
        "green_score": "D",
        "green_score_value": 46.0,
        "predicted_final_co2_kg": 295.0,
        "created_at": (_now - timedelta(hours=7)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 5. Kolkata → Bhubaneswar  |  train  |  Grade A  |  in_transit 30% ──
    {
        "id": "demo-5",
        "shipment_id": "SHP-2005",
        "origin": "Kolkata",
        "destination": "Bhubaneswar",
        "current_lat": 21.87,        # ~30% interpolated
        "current_lng": 87.28,
        "speed_kmh": 85.0,
        "fuel_consumed_liters": 0.0,  # electric rail
        "distance_covered_km": 132.0,
        "total_distance_km": 440.0,
        "eta_minutes": 220,
        "status": "in_transit",
        "vehicle_type": "train",
        "cargo_weight_tons": 45.0,   # high cargo — rail advantage
        "driver_score": 96.0,
        "green_score": "A",
        "green_score_value": 97.0,
        "predicted_final_co2_kg": 13.0,
        "created_at": (_now - timedelta(hours=2)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 6. Ahmedabad → Delhi  |  truck_diesel  |  Grade C  |  in_transit 55% ──
    {
        "id": "demo-6",
        "shipment_id": "SHP-2006",
        "origin": "Ahmedabad",
        "destination": "Delhi",
        "current_lat": 25.73,        # ~55% interpolated
        "current_lng": 74.67,
        "speed_kmh": 55.0,
        "fuel_consumed_liters": 131.0,
        "distance_covered_km": 522.0,
        "total_distance_km": 950.0,
        "eta_minutes": 510,
        "status": "in_transit",
        "vehicle_type": "truck_diesel",
        "cargo_weight_tons": 20.0,
        "driver_score": 77.0,
        "green_score": "C",
        "green_score_value": 66.0,
        "predicted_final_co2_kg": 679.0,
        "created_at": (_now - timedelta(hours=8)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 7. Jaipur → Lucknow  |  truck_cng  |  Grade B  |  completed ──
    {
        "id": "demo-7",
        "shipment_id": "SHP-2007",
        "origin": "Jaipur",
        "destination": "Lucknow",
        "current_lat": 26.8467,      # at destination
        "current_lng": 80.9462,
        "speed_kmh": 0.0,
        "fuel_consumed_liters": 150.0,
        "distance_covered_km": 600.0,
        "total_distance_km": 600.0,
        "eta_minutes": 0,
        "status": "completed",
        "vehicle_type": "truck_cng",
        "cargo_weight_tons": 12.0,
        "driver_score": 83.0,
        "green_score": "B",
        "green_score_value": 75.0,
        "predicted_final_co2_kg": 330.0,
        "created_at": (_now - timedelta(hours=14)).isoformat(),
        "updated_at": (_now - timedelta(hours=2)).isoformat(),
    },

    # ── 8. Hyderabad → Chennai  |  ev_truck  |  Grade A  |  in_transit 45% ──
    {
        "id": "demo-8",
        "shipment_id": "SHP-2008",
        "origin": "Hyderabad",
        "destination": "Chennai",
        "current_lat": 15.23,        # ~45% interpolated
        "current_lng": 79.37,
        "speed_kmh": 72.0,
        "fuel_consumed_liters": 0.0,
        "distance_covered_km": 284.0,
        "total_distance_km": 630.0,
        "eta_minutes": 295,
        "status": "in_transit",
        "vehicle_type": "ev_truck",
        "cargo_weight_tons": 9.0,
        "driver_score": 91.0,
        "green_score": "A",
        "green_score_value": 92.0,
        "predicted_final_co2_kg": 32.0,
        "created_at": (_now - timedelta(hours=4)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 9. Nagpur → Pune  |  truck_diesel  |  Grade F  |  in_transit 20% ──
    {
        "id": "demo-9",
        "shipment_id": "SHP-2009",
        "origin": "Nagpur",
        "destination": "Pune",
        "current_lat": 20.73,        # ~20% interpolated
        "current_lng": 78.12,
        "speed_kmh": 22.0,           # near-idling — anomaly
        "fuel_consumed_liters": 47.0,
        "distance_covered_km": 118.0,
        "total_distance_km": 590.0,
        "eta_minutes": 580,          # severely delayed
        "status": "in_transit",
        "vehicle_type": "truck_diesel",
        "cargo_weight_tons": 16.0,
        "driver_score": 51.0,        # worst performer
        "green_score": "F",
        "green_score_value": 32.0,
        "predicted_final_co2_kg": 668.0,
        "created_at": (_now - timedelta(hours=3)).isoformat(),
        "updated_at": _now.isoformat(),
    },

    # ── 10. Delhi → Chandigarh  |  truck_cng  |  Grade B  |  completed ──
    {
        "id": "demo-10",
        "shipment_id": "SHP-2010",
        "origin": "Delhi",
        "destination": "Chandigarh",
        "current_lat": 30.7333,      # at destination
        "current_lng": 76.7794,
        "speed_kmh": 0.0,
        "fuel_consumed_liters": 50.0,
        "distance_covered_km": 250.0,
        "total_distance_km": 250.0,
        "eta_minutes": 0,
        "status": "completed",
        "vehicle_type": "truck_cng",
        "cargo_weight_tons": 11.0,
        "driver_score": 88.0,
        "green_score": "B",
        "green_score_value": 81.0,
        "predicted_final_co2_kg": 137.0,
        "created_at": (_now - timedelta(hours=6)).isoformat(),
        "updated_at": (_now - timedelta(hours=3)).isoformat(),
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# Emission readings  (4-5 per shipment, showing segment-by-segment progression)
# ──────────────────────────────────────────────────────────────────────────────

_emissions: list[dict[str, Any]] = [

    # ── SHP-2001  Delhi → Mumbai  (truck_diesel, 560 km covered so far) ──
    # seg 0–140 km: highway, decent
    {"shipment_id": "SHP-2001", "co2_kg": 105.0, "co2_per_km": 0.75, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.57, "recorded_at": (_now - timedelta(hours=8)).isoformat()},
    {"shipment_id": "SHP-2001", "co2_kg": 114.0, "co2_per_km": 0.81, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.31, "recorded_at": (_now - timedelta(hours=6)).isoformat()},
    {"shipment_id": "SHP-2001", "co2_kg": 109.0, "co2_per_km": 0.78, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.44, "recorded_at": (_now - timedelta(hours=4)).isoformat()},
    {"shipment_id": "SHP-2001", "co2_kg": 111.0, "co2_per_km": 0.79, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.40, "recorded_at": (_now - timedelta(hours=2)).isoformat()},
    # seg 420–560 km: urban entry, fuel jump
    {"shipment_id": "SHP-2001", "co2_kg": 119.0, "co2_per_km": 0.85, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.15, "recorded_at": (_now - timedelta(minutes=25)).isoformat()},

    # ── SHP-2002  Bengaluru → Hyderabad  (ev_truck, 371 km) ──
    {"shipment_id": "SHP-2002", "co2_kg": 4.6,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=5)).isoformat()},
    {"shipment_id": "SHP-2002", "co2_kg": 4.6,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=3, minutes=30)).isoformat()},
    {"shipment_id": "SHP-2002", "co2_kg": 4.7,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=2)).isoformat()},
    {"shipment_id": "SHP-2002", "co2_kg": 4.6,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(minutes=45)).isoformat()},

    # ── SHP-2003  Mumbai → Pune  (truck_cng, 150 km, completed) ──
    {"shipment_id": "SHP-2003", "co2_kg": 27.5, "co2_per_km": 0.55, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.81, "recorded_at": (_now - timedelta(hours=4)).isoformat()},
    {"shipment_id": "SHP-2003", "co2_kg": 28.2, "co2_per_km": 0.56, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.72, "recorded_at": (_now - timedelta(hours=3)).isoformat()},
    {"shipment_id": "SHP-2003", "co2_kg": 26.3, "co2_per_km": 0.53, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.98, "recorded_at": (_now - timedelta(hours=2)).isoformat()},

    # ── SHP-2004  Chennai → Bengaluru  (truck_diesel, 280 km, bad driver) ──
    {"shipment_id": "SHP-2004", "co2_kg": 74.0, "co2_per_km": 0.74, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.62, "recorded_at": (_now - timedelta(hours=6)).isoformat()},
    # idling spike — fuel up, distance static
    {"shipment_id": "SHP-2004", "co2_kg": 98.0, "co2_per_km": 0.98, "emission_factor": 2.68, "fuel_efficiency_kmpl": 2.73, "recorded_at": (_now - timedelta(hours=4)).isoformat()},
    {"shipment_id": "SHP-2004", "co2_kg": 88.0, "co2_per_km": 0.88, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.05, "recorded_at": (_now - timedelta(hours=2)).isoformat()},
    # another spike near congestion
    {"shipment_id": "SHP-2004", "co2_kg": 105.0, "co2_per_km": 1.05, "emission_factor": 2.68, "fuel_efficiency_kmpl": 2.55, "recorded_at": (_now - timedelta(minutes=30)).isoformat()},

    # ── SHP-2005  Kolkata → Bhubaneswar  (train, 132 km, very clean) ──
    {"shipment_id": "SHP-2005", "co2_kg": 2.0,  "co2_per_km": 0.015, "emission_factor": 0.045, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=1, minutes=45)).isoformat()},
    {"shipment_id": "SHP-2005", "co2_kg": 1.9,  "co2_per_km": 0.014, "emission_factor": 0.045, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=0, minutes=50)).isoformat()},
    {"shipment_id": "SHP-2005", "co2_kg": 2.1,  "co2_per_km": 0.016, "emission_factor": 0.045, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(minutes=20)).isoformat()},

    # ── SHP-2006  Ahmedabad → Delhi  (truck_diesel, 522 km) ──
    {"shipment_id": "SHP-2006", "co2_kg": 96.0, "co2_per_km": 0.73, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.68, "recorded_at": (_now - timedelta(hours=7)).isoformat()},
    {"shipment_id": "SHP-2006", "co2_kg": 99.0, "co2_per_km": 0.75, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.57, "recorded_at": (_now - timedelta(hours=5)).isoformat()},
    {"shipment_id": "SHP-2006", "co2_kg": 103.0,"co2_per_km": 0.78, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.44, "recorded_at": (_now - timedelta(hours=3)).isoformat()},
    {"shipment_id": "SHP-2006", "co2_kg": 101.0,"co2_per_km": 0.77, "emission_factor": 2.68, "fuel_efficiency_kmpl": 3.48, "recorded_at": (_now - timedelta(hours=1)).isoformat()},

    # ── SHP-2007  Jaipur → Lucknow  (truck_cng, 600 km, completed) ──
    {"shipment_id": "SHP-2007", "co2_kg": 82.5, "co2_per_km": 0.55, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.82, "recorded_at": (_now - timedelta(hours=12)).isoformat()},
    {"shipment_id": "SHP-2007", "co2_kg": 84.0, "co2_per_km": 0.56, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.75, "recorded_at": (_now - timedelta(hours=9)).isoformat()},
    {"shipment_id": "SHP-2007", "co2_kg": 80.5, "co2_per_km": 0.54, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.89, "recorded_at": (_now - timedelta(hours=6)).isoformat()},
    {"shipment_id": "SHP-2007", "co2_kg": 83.0, "co2_per_km": 0.55, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.82, "recorded_at": (_now - timedelta(hours=3)).isoformat()},

    # ── SHP-2008  Hyderabad → Chennai  (ev_truck, 284 km) ──
    {"shipment_id": "SHP-2008", "co2_kg": 3.5,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=3)).isoformat()},
    {"shipment_id": "SHP-2008", "co2_kg": 3.6,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=2)).isoformat()},
    {"shipment_id": "SHP-2008", "co2_kg": 3.4,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(hours=1)).isoformat()},
    {"shipment_id": "SHP-2008", "co2_kg": 3.7,  "co2_per_km": 0.05, "emission_factor": 0.05, "fuel_efficiency_kmpl": None, "recorded_at": (_now - timedelta(minutes=20)).isoformat()},

    # ── SHP-2009  Nagpur → Pune  (truck_diesel, 118 km, worst performer) ──
    # massive fuel spike from the start — old diesel truck, poor driving
    {"shipment_id": "SHP-2009", "co2_kg": 56.0, "co2_per_km": 0.93, "emission_factor": 2.68, "fuel_efficiency_kmpl": 2.88, "recorded_at": (_now - timedelta(hours=2, minutes=30)).isoformat()},
    # Idling event — CO2 generated with near-zero distance
    {"shipment_id": "SHP-2009", "co2_kg": 68.0, "co2_per_km": 1.13, "emission_factor": 2.68, "fuel_efficiency_kmpl": 2.37, "recorded_at": (_now - timedelta(hours=1, minutes=15)).isoformat()},
    # Partial recovery but still bad
    {"shipment_id": "SHP-2009", "co2_kg": 42.0, "co2_per_km": 0.95, "emission_factor": 2.68, "fuel_efficiency_kmpl": 2.82, "recorded_at": (_now - timedelta(minutes=20)).isoformat()},

    # ── SHP-2010  Delhi → Chandigarh  (truck_cng, 250 km, completed) ──
    {"shipment_id": "SHP-2010", "co2_kg": 41.0, "co2_per_km": 0.55, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.82, "recorded_at": (_now - timedelta(hours=5)).isoformat()},
    {"shipment_id": "SHP-2010", "co2_kg": 42.5, "co2_per_km": 0.57, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.68, "recorded_at": (_now - timedelta(hours=4)).isoformat()},
    {"shipment_id": "SHP-2010", "co2_kg": 40.5, "co2_per_km": 0.54, "emission_factor": 2.1, "fuel_efficiency_kmpl": 3.89, "recorded_at": (_now - timedelta(hours=3)).isoformat()},
    {"shipment_id": "SHP-2010", "co2_kg": 13.0, "co2_per_km": 0.52, "emission_factor": 2.1, "fuel_efficiency_kmpl": 4.04, "recorded_at": (_now - timedelta(hours=2, minutes=30)).isoformat()},
]

# ──────────────────────────────────────────────────────────────────────────────
# Alerts  (7 alerts — mix of severities and types)
# ──────────────────────────────────────────────────────────────────────────────

_alerts: list[dict[str, Any]] = [

    # High severity
    {
        "id": "alert-demo-1",
        "shipment_id": "SHP-2009",
        "alert_type": "emission_spike",
        "severity": "high",
        "message": (
            "CO₂/km reached 1.13 kg/km on Nagpur–Pune segment — "
            "25% above threshold. Suspected idling or load imbalance."
        ),
        "is_read": False,
        "created_at": (_now - timedelta(hours=1, minutes=15)).isoformat(),
    },
    {
        "id": "alert-demo-2",
        "shipment_id": "SHP-2004",
        "alert_type": "emission_spike",
        "severity": "high",
        "message": (
            "Emission rate spiked to 1.05 kg/km near Krishnagiri — "
            "driver idling detected for 18 min. Immediate action recommended."
        ),
        "is_read": False,
        "created_at": (_now - timedelta(minutes=30)).isoformat(),
    },

    # Medium severity
    {
        "id": "alert-demo-3",
        "shipment_id": "SHP-2004",
        "alert_type": "delay_risk",
        "severity": "medium",
        "message": (
            "SHP-2004 ETA drifted by 35 min due to congestion on NH-44. "
            "Delivery window may be missed if speed stays below 50 km/h."
        ),
        "is_read": False,
        "created_at": (_now - timedelta(hours=1)).isoformat(),
    },
    {
        "id": "alert-demo-4",
        "shipment_id": "SHP-2001",
        "alert_type": "delay_risk",
        "severity": "medium",
        "message": (
            "SHP-2001 (Delhi–Mumbai) fuel consumption 12% above expected "
            "average for this route segment. Check tyre pressure and load distribution."
        ),
        "is_read": False,
        "created_at": (_now - timedelta(minutes=40)).isoformat(),
    },
    {
        "id": "alert-demo-5",
        "shipment_id": "SHP-2009",
        "alert_type": "harsh_braking",
        "severity": "medium",
        "message": (
            "6 harsh braking events logged in the last 90 min for SHP-2009. "
            "Driver score has fallen to 51. Consider driver coaching."
        ),
        "is_read": False,
        "created_at": (_now - timedelta(hours=1, minutes=30)).isoformat(),
    },

    # Low severity
    {
        "id": "alert-demo-6",
        "shipment_id": "SHP-2006",
        "alert_type": "idle_alert",
        "severity": "low",
        "message": (
            "SHP-2006 idled for 12 min at Ajmer bypass toll plaza. "
            "Minor CO₂ overhead (~3 kg) — no immediate action needed."
        ),
        "is_read": True,
        "created_at": (_now - timedelta(hours=2)).isoformat(),
    },
    {
        "id": "alert-demo-7",
        "shipment_id": "SHP-2001",
        "alert_type": "route_suggestion",
        "severity": "low",
        "message": (
            "Alternative rail corridor (Delhi–Mumbai freight) could save "
            "~810 kg CO₂ and 1.2 carbon credits. View in Route Alternatives."
        ),
        "is_read": True,
        "created_at": (_now - timedelta(hours=3)).isoformat(),
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Public helper functions  (same API as before — routers rely on these)
# ──────────────────────────────────────────────────────────────────────────────

def list_shipments_with_emissions() -> list[dict[str, Any]]:
    """Return shipments annotated with total CO₂ and CO₂/km."""
    by_shipment: dict[str, float] = {}
    for row in _emissions:
        sid = row["shipment_id"]
        by_shipment[sid] = by_shipment.get(sid, 0.0) + float(row.get("co2_kg") or 0.0)

    result: list[dict[str, Any]] = []
    for row in _shipments:
        total_co2 = by_shipment.get(row["shipment_id"], 0.0)
        distance = float(row.get("distance_covered_km") or 0.0)
        result.append(
            {
                **row,
                "total_co2_kg": total_co2,
                "co2_per_km": (total_co2 / distance) if distance > 0 else 0.0,
            }
        )
    return result


def get_shipment(shipment_id: str) -> dict[str, Any] | None:
    for row in _shipments:
        if row["shipment_id"] == shipment_id:
            return row
    return None


def get_shipment_emissions(shipment_id: str) -> list[dict[str, Any]]:
    return [row for row in _emissions if row["shipment_id"] == shipment_id]


def list_alerts(unread_only: bool = False, shipment_id: str | None = None) -> list[dict[str, Any]]:
    rows = list(_alerts)
    if unread_only:
        rows = [row for row in rows if not row.get("is_read")]
    if shipment_id:
        rows = [row for row in rows if row["shipment_id"] == shipment_id]
    return rows


def mark_alert_read(alert_id: str, is_read: bool) -> dict[str, Any] | None:
    for row in _alerts:
        if row["id"] == alert_id:
            row["is_read"] = is_read
            return row
    return None


def fleet_green_scores() -> list[dict[str, Any]]:
    return [
        {
            "shipment_id": row["shipment_id"],
            "grade":        row.get("green_score") or "B",
            "value":        float(row.get("green_score_value") or 0.0),
            "origin":       row.get("origin") or "",
            "destination":  row.get("destination") or "",
            "vehicle_type": row.get("vehicle_type") or "truck",
        }
        for row in _shipments
    ]


def report_summary() -> dict[str, Any]:
    rows = list_shipments_with_emissions()
    total_co2 = float(sum(r.get("total_co2_kg", 0.0) for r in rows))
    total_shipments = len(rows)
    avg_co2 = total_co2 / total_shipments if total_shipments else 0.0

    carbon_credits = []
    for row in rows:
        sid = row["shipment_id"]
        actual   = float(row.get("total_co2_kg") or 0.0)
        baseline = float(row.get("distance_covered_km") or 0.0) * 0.9
        saved    = max(0.0, baseline - actual)
        credits  = round(saved / 1000.0, 3)
        carbon_credits.append(
            {
                "id":               f"cc-{sid}",
                "shipment_id":      sid,
                "credits_earned":   credits,
                "baseline_co2_kg":  baseline,
                "actual_co2_kg":    actual,
                "co2_saved_kg":     saved,
                "credit_value_inr": round(credits * 800, 2),
                "created_at":       _now.isoformat(),
            }
        )

    return {
        "total_shipments":      total_shipments,
        "total_co2_kg":         total_co2,
        "avg_co2_per_shipment": avg_co2,
        "carbon_credits":       carbon_credits,
    }


def fleet_overview() -> dict[str, Any]:
    rows     = list_shipments_with_emissions()
    total_co2 = float(sum(r.get("total_co2_kg", 0.0) for r in rows))
    avg_green = (
        sum(float(r.get("green_score_value") or 0.0) for r in rows) / len(rows)
        if rows else 0.0
    )
    flagged   = len([a for a in _alerts if a["severity"] in {"high", "critical"} and not a.get("is_read")])
    return {
        "total_co2_kg":         total_co2,
        "total_shipments":      len(rows),
        "avg_green_score":      round(avg_green, 1),
        "total_carbon_credits": sum(c["credits_earned"] for c in report_summary()["carbon_credits"]),
        "flagged_shipments":    flagged,
    }
