from __future__ import annotations

import json
import math
import os
from typing import Any

from ..services.carbon_credits import INDIA_BASELINE_CO2_PER_KM


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
EV_ROUTES_PATH = os.path.join(DATA_DIR, "ev_routes_data.json")


def _load_ev_routes() -> list[dict[str, Any]]:
    if not os.path.exists(EV_ROUTES_PATH):
        return []
    with open(EV_ROUTES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _estimate_diesel_co2(distance_km: float, cargo_tons: float) -> float:
    # Baseline 0.9 kg/km adjusted for load (15% impact at 30t)
    load_factor = 1 + (cargo_tons / 30.0) * 0.15
    return distance_km * INDIA_BASELINE_CO2_PER_KM * load_factor


def _estimate_ev_co2(distance_km: float) -> float:
    return distance_km * 0.05


def _estimate_rail_co2(distance_km: float, cargo_tons: float) -> float:
    return distance_km * 0.03 * cargo_tons


async def generate_route_alternatives(shipment_row: dict[str, Any]) -> list[dict[str, Any]]:
    """Generate three concrete route alternatives with CO2 savings math.

    1) EV truck alternative
    2) Rail corridor (if available for this origin-destination)
    3) Load consolidation scenario when utilization is low
    """

    origin = shipment_row.get("origin")
    destination = shipment_row.get("destination")
    distance_km = float(shipment_row.get("total_distance_km") or shipment_row.get("distance_covered_km") or 0.0)
    if distance_km <= 0:
        distance_km = max(float(shipment_row.get("distance_covered_km") or 0.0), 50.0)
    cargo_tons = float(shipment_row.get("cargo_weight_tons") or 10.0)

    current_vehicle = shipment_row.get("vehicle_type") or "truck"

    diesel_co2 = _estimate_diesel_co2(distance_km, cargo_tons)
    ev_co2 = _estimate_ev_co2(distance_km)
    rail_co2 = _estimate_rail_co2(distance_km, cargo_tons)

    # 1) EV truck alternative
    ev_saving_pct = (diesel_co2 - ev_co2) / diesel_co2 * 100 if diesel_co2 > 0 else 0
    ev_alt = {
        "type": "ev_truck",
        "alternative_route": f"{origin} -> {destination}",
        "alternative_vehicle": "ev_truck",
        "estimated_co2_saving_pct": round(ev_saving_pct, 2),
        "estimated_time_delta_mins": 10,  # assume minor charging overhead
        "cost_implication_inr": round(distance_km * 5, 2),  # rough TCO difference
        "feasibility_score": 0.8 if current_vehicle != "ev_truck" else 0.4,
    }

    # 2) Rail corridor alternative (if configured)
    ev_routes = _load_ev_routes()
    has_rail = any(
        r.get("origin") == origin and r.get("destination") == destination and r.get("has_rail")
        for r in ev_routes
    )
    rail_saving_pct = (diesel_co2 - rail_co2) / diesel_co2 * 100 if diesel_co2 > 0 else 0
    rail_alt = {
        "type": "rail_corridor",
        "alternative_route": f"{origin} -> Rail hub -> {destination}",
        "alternative_vehicle": "rail",
        "estimated_co2_saving_pct": round(rail_saving_pct, 2),
        "estimated_time_delta_mins": 30,  # transfer overhead
        "cost_implication_inr": -round(distance_km * 3, 2),  # savings vs truck
        "feasibility_score": 0.9 if has_rail else 0.5,
    }

    # 3) Load consolidation scenario
    # Assume ideal utilization 85%; if below, we estimate benefit of consolidation.
    current_utilization = min(1.0, cargo_tons / 20.0)  # 20t as nominal capacity
    target_utilization = 0.85
    if current_utilization >= target_utilization:
        consolidation_saving_pct = 0.0
        wait_time_mins = 0
    else:
        underutilization_factor = (target_utilization - current_utilization) / target_utilization
        consolidation_saving_pct = underutilization_factor * 30.0  # 30% potential from spec
        wait_time_mins = int(underutilization_factor * 120)  # up to 2h wait

    consolidation_alt = {
        "type": "load_consolidation",
        "alternative_route": f"Consolidated {origin} -> {destination}",
        "alternative_vehicle": current_vehicle,
        "estimated_co2_saving_pct": round(consolidation_saving_pct, 2),
        "estimated_time_delta_mins": wait_time_mins,
        "cost_implication_inr": -round(diesel_co2 * 0.2, 2),  # 20% fuel cost saving
        "feasibility_score": 0.7 if current_utilization < target_utilization else 0.3,
    }

    return [ev_alt, rail_alt, consolidation_alt]
