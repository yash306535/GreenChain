from __future__ import annotations

import asyncio
import os
from typing import Any, Dict

import pathway as pw

from services.supabase_client import get_supabase_client
from services.carbon_credits import calculate_carbon_credits, INDIA_BASELINE_CO2_PER_KM
from services.driver_score import BASE_SCORE


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STREAM_FILE = os.path.join(DATA_DIR, "telemetry_stream.jsonl")


class ShipmentSchema(pw.Schema):
    shipment_id: str
    lat: float
    lng: float
    speed_kmh: float
    fuel_consumed_liters: float
    distance_covered_km: float
    vehicle_type: str
    idle_minutes: float
    harsh_braking_events: int
    cargo_weight_tons: float
    timestamp: str


def _compute_co2(row: Dict[str, Any]) -> Dict[str, Any]:
    distance = float(row["distance_covered_km"])
    vehicle_type = row["vehicle_type"]
    cargo = float(row["cargo_weight_tons"])
    fuel_liters = float(row["fuel_consumed_liters"])

    if vehicle_type == "train":
        co2_kg = distance * 0.03 * cargo
        emission_factor = 0.03 * cargo
    elif vehicle_type.startswith("ev"):
        co2_kg = distance * 0.05
        emission_factor = 0.05
    else:
        # Diesel with load factor
        emission_factor = 2.68
        load_factor = 1 + (cargo / 30.0) * 0.15
        co2_kg = fuel_liters * emission_factor * load_factor

    co2_per_km = co2_kg / distance if distance > 0 else 0.0

    # Driver score penalties
    harsh_penalty = row["harsh_braking_events"] * 5.0
    idle_penalty = (row["idle_minutes"] // 10) * 10.0
    speeding_penalty = 0.0  # speed samples used at ingestion stage
    driver_score = max(0.0, BASE_SCORE - harsh_penalty - idle_penalty - speeding_penalty)

    # Vehicle type bonus
    if vehicle_type.startswith("ev"):
        vt_bonus = 10.0
    elif vehicle_type == "train":
        vt_bonus = 8.0
    else:
        vt_bonus = 0.0

    # Load utilization (target 85% of 20t capacity)
    utilization = min(1.0, cargo / 20.0)
    load_score = utilization * 100.0

    # CO2 efficiency score vs India baseline
    baseline_rate = INDIA_BASELINE_CO2_PER_KM
    if co2_per_km <= 0:
        efficiency_score = 100.0
    else:
        ratio = co2_per_km / baseline_rate
        efficiency_score = max(0.0, min(100.0, 100.0 * (2 - ratio)))

    # Weighted green score
    green_value = (
        efficiency_score * 0.4
        + driver_score * 0.3
        + vt_bonus * 0.2
        + load_score * 0.1
    )

    if green_value >= 90:
        grade = "A+"
    elif green_value >= 80:
        grade = "A"
    elif green_value >= 65:
        grade = "B"
    elif green_value >= 50:
        grade = "C"
    elif green_value >= 35:
        grade = "D"
    else:
        grade = "F"

    return {
        "co2_kg": co2_kg,
        "co2_per_km": co2_per_km,
        "driver_score": driver_score,
        "green_score": grade,
        "green_score_value": green_value,
        "efficiency_score": efficiency_score,
        "vehicle_type_bonus": vt_bonus,
        "load_utilization_score": load_score,
    }


async def _upsert_to_supabase(results: Dict[str, Any]) -> None:
    supabase = await get_supabase_client()
    for shipment_id, row in results.items():
        distance = float(row.get("distance_covered_km") or 0.0)
        co2_kg = float(row["co2_kg"])
        credits = calculate_carbon_credits(distance_km=distance, actual_co2_kg=co2_kg)

        await supabase.table("shipments").update(
            {
                "driver_score": row["driver_score"],
                "green_score": row["green_score"],
                "green_score_value": row["green_score_value"],
                "predicted_final_co2_kg": co2_kg,
            }
        ).eq("shipment_id", shipment_id).execute()

        await supabase.table("carbon_credits").upsert(
            {
                "shipment_id": shipment_id,
                "credits_earned": credits.credits_earned,
                "baseline_co2_kg": credits.baseline_co2_kg,
                "actual_co2_kg": credits.actual_co2_kg,
                "co2_saved_kg": credits.co2_saved_kg,
                "credit_value_inr": credits.credit_value_inr,
            },
            on_conflict="shipment_id",
        ).execute()


def build_pipeline() -> pw.Table:
    telemetry = pw.io.jsonlines.read(
        STREAM_FILE,
        schema=ShipmentSchema,
        mode="streaming",
    )

    enriched = telemetry.select(
        shipment_id=telemetry.shipment_id,
        lat=telemetry.lat,
        lng=telemetry.lng,
        speed_kmh=telemetry.speed_kmh,
        fuel_consumed_liters=telemetry.fuel_consumed_liters,
        distance_covered_km=telemetry.distance_covered_km,
        vehicle_type=telemetry.vehicle_type,
        idle_minutes=telemetry.idle_minutes,
        harsh_braking_events=telemetry.harsh_braking_events,
        cargo_weight_tons=telemetry.cargo_weight_tons,
        timestamp=telemetry.timestamp,
        metrics=pw.apply(_compute_co2, pw.this()),
    )

    # Flatten metrics dict
    result = enriched.select(
        shipment_id=enriched.shipment_id,
        distance_covered_km=enriched.distance_covered_km,
        co2_kg=enriched.metrics["co2_kg"],
        co2_per_km=enriched.metrics["co2_per_km"],
        driver_score=enriched.metrics["driver_score"],
        green_score=enriched.metrics["green_score"],
        green_score_value=enriched.metrics["green_score_value"],
        efficiency_score=enriched.metrics["efficiency_score"],
        vehicle_type_bonus=enriched.metrics["vehicle_type_bonus"],
        load_utilization_score=enriched.metrics["load_utilization_score"],
    )

    return result


async def run_pipeline_forever(poll_interval: int = 5) -> None:
    table = build_pipeline()

    async def sink_to_supabase():
        while True:
            snapshot = table.to_pandas()
            results: Dict[str, Any] = {}
            for _, row in snapshot.iterrows():
                sid = row["shipment_id"]
                results[sid] = row.to_dict()
            if results:
                await _upsert_to_supabase(results)
            await asyncio.sleep(poll_interval)

    # Start Pathway engine
    pw_run_task = asyncio.create_task(asyncio.to_thread(pw.run))
    sink_task = asyncio.create_task(sink_to_supabase())

    await asyncio.gather(pw_run_task, sink_task)
