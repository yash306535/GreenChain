from __future__ import annotations

from typing import Any, Dict

import numpy as np


def _compute_emission_rate_series(emissions_history: list[dict[str, Any]]) -> np.ndarray:
    rates: list[float] = []
    for row in emissions_history:
        co2_per_km = row.get("co2_per_km")
        if co2_per_km is not None:
            rates.append(float(co2_per_km))
    if not rates:
        return np.array([0.0])
    return np.array(rates, dtype=float)


async def predict_shipment_co2(
    shipment_id: str, emissions_history: list[dict[str, Any]]
) -> Dict[str, float]:
    """Predict final CO2 for a shipment using a simple linear regression.

    We fit a trend over the co2_per_km series and extrapolate the current
    emission rate. Remaining distance should ideally come from the shipment
    table, but here we approximate based on last emission sample fields if
    available.
    """

    rates = _compute_emission_rate_series(emissions_history)
    n = len(rates)
    x = np.arange(n, dtype=float)

    if n >= 2 and np.any(rates > 0):
        # simple linear regression y = a*x + b
        a, b = np.polyfit(x, rates, 1)
        current_rate = max(0.0, float(a * (n - 1) + b))
    else:
        current_rate = float(rates[-1]) if n else 0.0

    # Approximate remaining distance: assume 60% of journey left if we don't
    # have better information from emissions (this will be refined via
    # shipment data in higher-level service calls if needed).
    last = emissions_history[-1] if emissions_history else {}
    distance_covered = float(last.get("distance_covered_km") or 0.0)
    total_distance = float(last.get("total_distance_km") or distance_covered * 1.6)
    remaining_km = max(0.0, total_distance - distance_covered)

    # Correction factor based on simple route-type heuristic inferred from id
    if "EV" in shipment_id.upper():
        correction_factor = 0.9
    elif "RAIL" in shipment_id.upper() or "TRAIN" in shipment_id.upper():
        correction_factor = 0.8
    else:
        correction_factor = 1.05

    predicted_final_co2 = current_rate * remaining_km * correction_factor

    # Simple confidence interval: +/- 15%
    lower = max(0.0, predicted_final_co2 * 0.85)
    upper = predicted_final_co2 * 1.15

    # Confidence score: more points & stable trend -> higher confidence
    if n >= 10:
        confidence = 0.85
    elif n >= 5:
        confidence = 0.75
    elif n >= 2:
        confidence = 0.6
    else:
        confidence = 0.4

    return {
        "predicted_kg": float(predicted_final_co2),
        "lower": float(lower),
        "upper": float(upper),
        "confidence": float(confidence),
    }
