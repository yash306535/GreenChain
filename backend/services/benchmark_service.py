from __future__ import annotations

from typing import Any, Dict


BENCHMARKS = {
    "india_avg_truck_co2_per_km": 0.9,
    "eu_2030_target_co2_per_km": 0.55,
    "best_diesel_co2_per_km": 0.65,
    "ev_truck_co2_per_km": 0.05,
    "train_co2_per_km_per_tonne": 0.03,
}


def benchmark_shipment(total_co2_kg: float, distance_km: float) -> Dict[str, Any]:
    if distance_km <= 0:
        actual_rate = 0.0
    else:
        actual_rate = total_co2_kg / distance_km

    india = BENCHMARKS["india_avg_truck_co2_per_km"]
    eu = BENCHMARKS["eu_2030_target_co2_per_km"]
    best_diesel = BENCHMARKS["best_diesel_co2_per_km"]
    ev = BENCHMARKS["ev_truck_co2_per_km"]

    def _position_vs(target: float) -> Dict[str, Any]:
        delta = actual_rate - target
        pct = (delta / target * 100) if target > 0 else 0.0
        status = "below" if actual_rate <= target else "above"
        return {"delta": delta, "percent": pct, "status": status}

    # Simple percentile proxy: relative position between worst and best
    # assuming India avg ~70th percentile and EU ~30th.
    if actual_rate <= ev:
        percentile = 5.0
    elif actual_rate <= eu:
        percentile = 25.0
    elif actual_rate <= best_diesel:
        percentile = 45.0
    elif actual_rate <= india:
        percentile = 70.0
    else:
        percentile = 90.0

    return {
        "actual_co2_per_km": actual_rate,
        "vs_india_avg": _position_vs(india),
        "vs_eu_2030": _position_vs(eu),
        "vs_best_diesel": _position_vs(best_diesel),
        "vs_ev_truck": _position_vs(ev),
        "percentile": percentile,
    }
