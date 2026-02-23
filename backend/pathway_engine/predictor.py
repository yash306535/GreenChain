from __future__ import annotations

from typing import Any, Dict


def _compute_emission_rate_series(emissions_history: list[dict[str, Any]]) -> list[float]:
    rates: list[float] = []
    for row in emissions_history:
        co2_per_km = row.get("co2_per_km")
        if co2_per_km is not None:
            rates.append(float(co2_per_km))
    return rates if rates else [0.0]


def _linear_fit(rates: list[float]) -> tuple[float, float]:
    """OLS linear regression y = a*x + b on integer index x. Returns (a, b)."""
    n = len(rates)
    if n < 2:
        return 0.0, rates[0] if rates else 0.0
    sum_x = n * (n - 1) / 2
    sum_y = sum(rates)
    sum_xx = n * (n - 1) * (2 * n - 1) / 6
    sum_xy = sum(i * y for i, y in enumerate(rates))
    denom = n * sum_xx - sum_x * sum_x
    if denom == 0:
        return 0.0, sum_y / n
    a = (n * sum_xy - sum_x * sum_y) / denom
    b = (sum_y - a * sum_x) / n
    return a, b


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

    if n >= 2 and any(r > 0 for r in rates):
        a, b = _linear_fit(rates)
        current_rate = max(0.0, a * (n - 1) + b)
    else:
        current_rate = rates[-1] if rates else 0.0

    last = emissions_history[-1] if emissions_history else {}
    distance_covered = float(last.get("distance_covered_km") or 0.0)
    total_distance = float(last.get("total_distance_km") or distance_covered * 1.6)
    remaining_km = max(0.0, total_distance - distance_covered)

    if "EV" in shipment_id.upper():
        correction_factor = 0.9
    elif "RAIL" in shipment_id.upper() or "TRAIN" in shipment_id.upper():
        correction_factor = 0.8
    else:
        correction_factor = 1.05

    predicted_final_co2 = current_rate * remaining_km * correction_factor

    lower = max(0.0, predicted_final_co2 * 0.85)
    upper = predicted_final_co2 * 1.15

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
