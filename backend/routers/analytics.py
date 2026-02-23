import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException

from models.analytics import (
    FleetOverviewKPIs,
    VehicleComparisonEntry,
    MonthlyTargetProgress,
    ModalShiftOpportunity,
)
from services.supabase_client import get_supabase_client
from services.carbon_credits import CARBON_CREDIT_PRICE_INR
from services.local_seed_data import fleet_overview as seed_fleet_overview


logger = logging.getLogger("greenchain.analytics")

router = APIRouter()


@router.get("/fleet-overview", response_model=FleetOverviewKPIs)
async def fleet_overview() -> FleetOverviewKPIs:
    try:
        supabase = await get_supabase_client()

        stats_resp = await supabase.table("daily_fleet_stats").select("*").order("date", desc=True).limit(1).execute()
        if stats_resp.error:
            raise RuntimeError(stats_resp.error.message)
        if stats_resp.data:
            row = stats_resp.data[0]
            return FleetOverviewKPIs(
                total_co2_kg=float(row.get("total_co2_kg") or 0.0),
                total_shipments=int(row.get("total_shipments") or 0),
                avg_green_score=float(row.get("avg_green_score") or 0.0),
                total_carbon_credits=float(row.get("total_carbon_credits") or 0.0),
                flagged_shipments=int(row.get("flagged_shipments") or 0),
            )

        # Fallback: compute from raw tables
        em_resp = await supabase.table("emissions").select("co2_kg").execute()
        if em_resp.error:
            raise RuntimeError(em_resp.error.message)
        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in em_resp.data or []))

        sh_resp = await supabase.table("shipments").select("green_score_value").execute()
        if sh_resp.error:
            raise RuntimeError(sh_resp.error.message)
        gs = [float(r.get("green_score_value") or 0.0) for r in sh_resp.data or []]

        return FleetOverviewKPIs(
            total_co2_kg=total_co2,
            total_shipments=len(gs),
            avg_green_score=sum(gs) / len(gs) if gs else 0.0,
            total_carbon_credits=0.0,
            flagged_shipments=0,
        )
    except Exception as exc:
        logger.warning("Falling back to local seeded fleet overview: %s", exc)
        return FleetOverviewKPIs(**seed_fleet_overview())


@router.get("/vehicles/comparison", response_model=list[VehicleComparisonEntry])
async def vehicles_comparison() -> list[VehicleComparisonEntry]:
    try:
        supabase = await get_supabase_client()
        sh_resp = await supabase.table("shipments").select("shipment_id, vehicle_type, distance_covered_km").execute()
        if sh_resp.error:
            raise RuntimeError(sh_resp.error.message)

        em_resp = await supabase.table("emissions").select("shipment_id, co2_kg").execute()
        if em_resp.error:
            raise RuntimeError(em_resp.error.message)

        total_by_shipment: dict[str, float] = {}
        for row in em_resp.data or []:
            sid = row["shipment_id"]
            total_by_shipment[sid] = total_by_shipment.get(sid, 0.0) + float(row.get("co2_kg") or 0.0)

        by_vehicle: dict[str, dict[str, float]] = {}
        for row in sh_resp.data or []:
            sid = row["shipment_id"]
            vtype = row.get("vehicle_type") or "truck"
            dist = float(row.get("distance_covered_km") or 0.0)
            co2 = total_by_shipment.get(sid, 0.0)
            agg = by_vehicle.setdefault(vtype, {"co2": 0.0, "km": 0.0})
            agg["co2"] += co2
            agg["km"] += dist

        result: list[VehicleComparisonEntry] = []
        for vtype, agg in by_vehicle.items():
            km = agg["km"] or 1.0
            result.append(
                VehicleComparisonEntry(
                    vehicle_type=vtype,
                    total_co2_kg=agg["co2"],
                    co2_per_km=agg["co2"] / km,
                )
            )
        return result
    except Exception as exc:
        logger.exception("Failed to compute vehicle comparison")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/monthly-target", response_model=MonthlyTargetProgress)
async def monthly_target_progress() -> MonthlyTargetProgress:
    try:
        supabase = await get_supabase_client()
        today = datetime.utcnow().date()
        month_start = today.replace(day=1)

        resp = (
            await supabase.table("emissions")
            .select("co2_kg, recorded_at")
            .gte("recorded_at", month_start.isoformat())
            .execute()
        )
        if resp.error:
            raise RuntimeError(resp.error.message)

        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in resp.data or []))

        import os

        target = float(os.getenv("MONTHLY_CO2_TARGET_KG", "5000"))
        progress_pct = (total_co2 / target * 100) if target > 0 else 0.0

        return MonthlyTargetProgress(
            month=month_start.strftime("%Y-%m"),
            target_co2_kg=target,
            actual_co2_kg=total_co2,
            progress_pct=progress_pct,
        )
    except Exception as exc:
        logger.exception("Failed to compute monthly target progress")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/modal-shift-opportunity", response_model=ModalShiftOpportunity)
async def modal_shift_opportunity() -> ModalShiftOpportunity:
    """Analyze how many truck routes could move to rail and potential savings."""

    try:
        supabase = await get_supabase_client()

        sh_resp = await supabase.table("shipments").select(
            "shipment_id, origin, destination, vehicle_type, distance_covered_km, cargo_weight_tons",
        ).execute()
        if sh_resp.error:
            raise RuntimeError(sh_resp.error.message)

        candidates = [
            r
            for r in (sh_resp.data or [])
            if (r.get("vehicle_type") or "truck").startswith("truck")
        ]

        # Approximate that 30% of truck OD pairs could be moved to rail
        potential = candidates[: max(1, len(candidates) // 3)]

        total_saving_kg = 0.0
        for row in potential:
            dist = float(row.get("distance_covered_km") or 0.0) or 200.0
            cargo = float(row.get("cargo_weight_tons") or 10.0)
            # Truck vs rail per route
            truck_rate = 0.9
            rail_rate = 0.03 * cargo
            truck_co2 = dist * truck_rate
            rail_co2 = dist * rail_rate
            total_saving_kg += max(0.0, truck_co2 - rail_co2)

        tonnes_per_month = total_saving_kg / 1000.0

        rationale = (
            "Shifting a subset of long-haul truck routes to rail can cut emissions "
            "by ~85% for those corridors, while also improving cost per tonne-km."
        )

        return ModalShiftOpportunity(
            routes_to_shift=len(potential),
            estimated_co2_saving_tonnes_per_month=tonnes_per_month,
            rationale=rationale,
        )
    except Exception as exc:
        logger.exception("Failed to compute modal shift opportunity")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("")
async def analytics_root() -> dict[str, Any]:
    overview = await fleet_overview()
    return {
        "fleet_stats": [overview.model_dump()],
        "driver_leaderboard": [],
        "benchmark_comparisons": [],
    }
