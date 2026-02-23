import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from ..models.green_score import GreenScoreBreakdown, FleetGreenScoreEntry
from ..services.supabase_client import get_supabase_client
from ..services.local_seed_data import fleet_green_scores, get_shipment, get_shipment_emissions


logger = logging.getLogger("greenchain.green_score")

router = APIRouter()


@router.get("/fleet", response_model=list[FleetGreenScoreEntry])
async def get_fleet_green_scores() -> list[FleetGreenScoreEntry]:
    try:
        supabase = await get_supabase_client()
        resp = await supabase.table("shipments").select(
            "shipment_id, origin, destination, vehicle_type, green_score, green_score_value",
        ).execute()
        if resp.error:
            raise RuntimeError(resp.error.message)

        entries: list[FleetGreenScoreEntry] = []
        for row in resp.data or []:
            entries.append(
                FleetGreenScoreEntry(
                    shipment_id=row["shipment_id"],
                    grade=row.get("green_score") or "B",
                    value=float(row.get("green_score_value") or 0.0),
                    origin=row.get("origin") or "",
                    destination=row.get("destination") or "",
                    vehicle_type=row.get("vehicle_type") or "truck",
                )
            )

        entries.sort(key=lambda e: e.value, reverse=True)
        return entries
    except Exception as exc:
        logger.warning("Falling back to local seeded fleet green scores: %s", exc)
        return [FleetGreenScoreEntry(**row) for row in fleet_green_scores()]


@router.get("/{shipment_id}", response_model=GreenScoreBreakdown)
async def get_green_score_breakdown(shipment_id: str) -> GreenScoreBreakdown:
    try:
        supabase = await get_supabase_client()
        resp = (
            await supabase.table("shipments")
            .select(
                "shipment_id, green_score, green_score_value, driver_score, cargo_weight_tons, distance_covered_km, vehicle_type",
            )
            .eq("shipment_id", shipment_id)
            .single()
            .execute()
        )
        if resp.error or not resp.data:
            raise HTTPException(status_code=404, detail="Shipment not found")

        row = resp.data
        # Reconstruct the component scores with the same weights used in
        # pathway_pipeline._compute_co2 to give a transparent explanation.
        driver_score = float(row.get("driver_score") or 0.0)
        cargo = float(row.get("cargo_weight_tons") or 0.0)
        distance = float(row.get("distance_covered_km") or 0.0)

        # Approximate co2_per_km from cumulative emissions if needed via
        # an additional query.
        em_resp = (
            await supabase.table("emissions")
            .select("co2_kg")
            .eq("shipment_id", shipment_id)
            .execute()
        )
        if em_resp.error:
            raise RuntimeError(em_resp.error.message)
        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in em_resp.data or []))
        co2_per_km = total_co2 / distance if distance > 0 else 0.0

        # Vehicle bonus
        vtype = row.get("vehicle_type") or "truck"
        if vtype.startswith("ev"):
            vt_bonus = 10.0
        elif vtype == "train":
            vt_bonus = 8.0
        else:
            vt_bonus = 0.0

        utilization = min(1.0, cargo / 20.0)
        load_score = utilization * 100.0

        from ..services.carbon_credits import INDIA_BASELINE_CO2_PER_KM

        baseline = INDIA_BASELINE_CO2_PER_KM
        if co2_per_km <= 0:
            efficiency_score = 100.0
        else:
            ratio = co2_per_km / baseline
            efficiency_score = max(0.0, min(100.0, 100.0 * (2 - ratio)))

        green_value = float(row.get("green_score_value") or 0.0)

        return GreenScoreBreakdown(
            shipment_id=shipment_id,
            grade=row.get("green_score") or "B",
            value=green_value,
            co2_efficiency_score=efficiency_score,
            driver_score_component=driver_score,
            vehicle_type_bonus=vt_bonus,
            load_utilization_score=load_score,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Falling back to local seeded green score for %s: %s", shipment_id, exc)
        row = get_shipment(shipment_id)
        if not row:
            raise HTTPException(status_code=404, detail="Shipment not found")
        emissions = get_shipment_emissions(shipment_id)
        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in emissions))
        distance = float(row.get("distance_covered_km") or 0.0)
        co2_per_km = (total_co2 / distance) if distance > 0 else 0.0

        vtype = row.get("vehicle_type") or "truck"
        if vtype.startswith("ev"):
            vt_bonus = 10.0
        elif vtype == "train":
            vt_bonus = 8.0
        else:
            vt_bonus = 0.0

        cargo = float(row.get("cargo_weight_tons") or 0.0)
        utilization = min(1.0, cargo / 20.0)
        load_score = utilization * 100.0
        efficiency_score = max(0.0, min(100.0, 100.0 * (2 - (co2_per_km / 0.9 if co2_per_km > 0 else 0.0))))

        return GreenScoreBreakdown(
            shipment_id=shipment_id,
            grade=row.get("green_score") or "B",
            value=float(row.get("green_score_value") or 0.0),
            co2_efficiency_score=efficiency_score,
            driver_score_component=float(row.get("driver_score") or 0.0),
            vehicle_type_bonus=vt_bonus,
            load_utilization_score=load_score,
        )


@router.get("", response_model=list[FleetGreenScoreEntry])
async def get_fleet_green_scores_compat() -> list[FleetGreenScoreEntry]:
    return await get_fleet_green_scores()
