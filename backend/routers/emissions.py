import logging
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from models.emission import (
    EmissionSummary,
    EmissionTrendPoint,
    EmissionLeaderboardEntry,
)
from services.supabase_client import get_supabase_client
from services.carbon_credits import calculate_carbon_credits
from services.benchmark_service import benchmark_shipment


logger = logging.getLogger("greenchain.emissions")

router = APIRouter()


@router.get("/summary", response_model=EmissionSummary)
async def get_emission_summary() -> EmissionSummary:
    try:
        supabase = await get_supabase_client()
        emissions_resp = await supabase.table("emissions").select("co2_kg").execute()
        if emissions_resp.error:
            raise RuntimeError(emissions_resp.error.message)
        rows = emissions_resp.data or []
        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in rows))

        shipments_resp = await supabase.table("shipments").select("shipment_id, distance_covered_km").execute()
        if shipments_resp.error:
            raise RuntimeError(shipments_resp.error.message)

        total_distance = 0.0
        by_shipment: dict[str, float] = {}
        for r in shipments_resp.data or []:
            sid = r["shipment_id"]
            dist = float(r.get("distance_covered_km") or 0.0)
            total_distance += dist
            by_shipment[sid] = dist

        credits_total = 0.0
        value_total = 0.0
        for sid, dist in by_shipment.items():
            # Approximate per-shipment CO2 share by distance proportion
            shipment_co2 = (dist / total_distance * total_co2) if total_distance > 0 else 0.0
            credits = calculate_carbon_credits(distance_km=dist, actual_co2_kg=shipment_co2)
            credits_total += credits.credits_earned
            value_total += credits.credit_value_inr

        return EmissionSummary(
            total_co2_kg=total_co2,
            total_credits=credits_total,
            total_credits_inr=value_total,
        )
    except Exception as exc:
        logger.exception("Failed to compute emission summary")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/leaderboard", response_model=list[EmissionLeaderboardEntry])
async def get_emission_leaderboard() -> list[EmissionLeaderboardEntry]:
    """Worst→best ranked by total CO2 and CO2/km."""

    try:
        supabase = await get_supabase_client()
        # Aggregate emissions per shipment
        em_resp = await supabase.table("emissions").select("shipment_id, co2_kg").execute()
        if em_resp.error:
            raise RuntimeError(em_resp.error.message)

        by_shipment: dict[str, float] = {}
        for row in em_resp.data or []:
            sid = row["shipment_id"]
            by_shipment[sid] = by_shipment.get(sid, 0.0) + float(row.get("co2_kg") or 0.0)

        sh_resp = await supabase.table("shipments").select("shipment_id, distance_covered_km").execute()
        if sh_resp.error:
            raise RuntimeError(sh_resp.error.message)

        distances = {r["shipment_id"]: float(r.get("distance_covered_km") or 0.0) for r in sh_resp.data or []}

        leaderboard: list[EmissionLeaderboardEntry] = []
        for sid, co2 in by_shipment.items():
            dist = distances.get(sid, 0.0)
            co2_per_km = co2 / dist if dist > 0 else co2
            leaderboard.append(
                EmissionLeaderboardEntry(
                    shipment_id=sid,
                    total_co2_kg=co2,
                    co2_per_km=co2_per_km,
                )
            )

        leaderboard.sort(key=lambda x: x.total_co2_kg, reverse=True)
        return leaderboard
    except Exception as exc:
        logger.exception("Failed to compute emissions leaderboard")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/trends", response_model=list[EmissionTrendPoint])
async def get_emission_trends(days: int = Query(7, ge=1, le=90)) -> list[EmissionTrendPoint]:
    try:
        supabase = await get_supabase_client()
        since = datetime.utcnow() - timedelta(days=days)
        resp = (
            await supabase.table("emissions")
            .select("co2_kg, recorded_at")
            .gte("recorded_at", since.isoformat())
            .order("recorded_at", desc=False)
            .execute()
        )
        if resp.error:
            raise RuntimeError(resp.error.message)

        buckets: dict[str, float] = {}
        for row in resp.data or []:
            ts = row.get("recorded_at")
            if isinstance(ts, str):
                d = ts[:10]
            else:
                d = ts.date().isoformat()
            buckets[d] = buckets.get(d, 0.0) + float(row.get("co2_kg") or 0.0)

        points: list[EmissionTrendPoint] = []
        for d, co2 in sorted(buckets.items()):
            points.append(
                EmissionTrendPoint(
                    date=datetime.fromisoformat(d),
                    total_co2_kg=co2,
                )
            )
        return points
    except Exception as exc:
        logger.exception("Failed to compute emission trends")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/benchmark/{shipment_id}")
async def benchmark_emissions(shipment_id: str) -> dict[str, Any]:
    """Return benchmark comparison vs India/EU/EV targets for a shipment."""

    try:
        supabase = await get_supabase_client()
        sh_resp = (
            await supabase.table("shipments")
            .select("shipment_id, distance_covered_km")
            .eq("shipment_id", shipment_id)
            .single()
            .execute()
        )
        if sh_resp.error or not sh_resp.data:
            raise HTTPException(status_code=404, detail="Shipment not found")

        em_resp = (
            await supabase.table("emissions")
            .select("co2_kg")
            .eq("shipment_id", shipment_id)
            .execute()
        )
        if em_resp.error:
            raise RuntimeError(em_resp.error.message)

        total_co2 = float(sum(r.get("co2_kg", 0.0) for r in em_resp.data or []))
        distance = float(sh_resp.data.get("distance_covered_km") or 0.0)

        return benchmark_shipment(total_co2_kg=total_co2, distance_km=distance)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to benchmark emissions for %s", shipment_id)
        raise HTTPException(status_code=500, detail=str(exc))
