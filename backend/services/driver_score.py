from __future__ import annotations

from typing import Any

from models.shipment import DriverScoreBreakdown


BASE_SCORE = 100.0
HARSH_BRAKING_PENALTY = 5.0
IDLING_PENALTY = 10.0
SPEEDING_PENALTY = 8.0


def compute_driver_score_breakdown(
    shipment_id: str, telemetry_rows: list[dict[str, Any]]
) -> DriverScoreBreakdown:
    """Compute driver score penalties from recent telemetry.

    The telemetry_rows come from the emissions table, but we treat them as a
    proxy for harsh events by looking at co2 spikes and inefficiency. In a
    real system, these would come from dedicated telematics tables; here we
    approximate while keeping the logic deterministic and meaningful.
    """

    harsh_braking_events = 0
    idle_minutes_estimate = 0.0
    speeding_events = 0

    # Very simple heuristic over emission rate deltas.
    prev_rate: float | None = None
    for row in telemetry_rows:
        co2_per_km = float(row.get("co2_per_km") or 0.0)
        speed = float(row.get("speed_kmh") or 0.0)
        if prev_rate is not None:
            if co2_per_km > prev_rate * 1.5:
                harsh_braking_events += 1
        prev_rate = co2_per_km

        if speed < 5:
            idle_minutes_estimate += 1.0  # treat each low-speed sample as ~1min
        if speed > 90:
            speeding_events += 1

    harsh_penalty = harsh_braking_events * HARSH_BRAKING_PENALTY
    idling_penalty = (idle_minutes_estimate // 10) * IDLING_PENALTY
    speeding_penalty = speeding_events * SPEEDING_PENALTY

    final_score = max(0.0, BASE_SCORE - harsh_penalty - idling_penalty - speeding_penalty)

    return DriverScoreBreakdown(
        shipment_id=shipment_id,
        base_score=BASE_SCORE,
        harsh_braking_penalty=harsh_penalty,
        idling_penalty=idling_penalty,
        speeding_penalty=speeding_penalty,
        final_score=final_score,
    )
