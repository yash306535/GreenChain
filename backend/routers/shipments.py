import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from ..models.shipment import (
    Shipment,
    ShipmentWithEmissions,
    ShipmentDetailResponse,
    DriverScoreBreakdown,
)
from ..services.route_optimizer import generate_route_alternatives
from ..services.driver_score import compute_driver_score_breakdown
from ..pathway_engine.predictor import predict_shipment_co2
from ..services.postgres_client import pg_fetch_all, pg_fetch_one
from ..services.local_seed_data import (
    list_shipments_with_emissions,
    get_shipment,
    get_shipment_emissions,
)


logger = logging.getLogger("greenchain.shipments")

router = APIRouter()


async def _map_row_to_shipment(row: dict[str, Any]) -> Shipment:
    return Shipment(**row)


@router.get("/", response_model=list[ShipmentWithEmissions])
async def list_shipments() -> list[ShipmentWithEmissions]:
    """Return all shipments with aggregated emissions and green scores."""

    try:
        result: list[ShipmentWithEmissions] = []
        rows = await run_in_threadpool(
            pg_fetch_all,
            """
            SELECT
                s.*,
                COALESCE(em.total_co2_kg, 0)::double precision AS total_co2_kg,
                CASE
                    WHEN COALESCE(s.distance_covered_km, 0) > 0
                        THEN COALESCE(em.total_co2_kg, 0) / s.distance_covered_km
                    ELSE 0
                END::double precision AS co2_per_km
            FROM shipments s
            LEFT JOIN (
                SELECT shipment_id, SUM(co2_kg) AS total_co2_kg
                FROM emissions
                GROUP BY shipment_id
            ) em ON em.shipment_id = s.shipment_id
            ORDER BY s.created_at DESC
            """,
        )

        for row in rows:
            shipment = await _map_row_to_shipment(row)
            result.append(
                ShipmentWithEmissions(
                    **shipment.model_dump(),
                    total_co2_kg=float(row.get("total_co2_kg") or 0.0),
                    co2_per_km=float(row.get("co2_per_km") or 0.0),
                )
            )
        return result
    except Exception as exc:
        logger.warning("Falling back to local seeded shipments: %s", exc)
        return [ShipmentWithEmissions(**row) for row in list_shipments_with_emissions()]


@router.get("/{shipment_id}", response_model=ShipmentDetailResponse)
async def get_shipment_detail(shipment_id: str) -> ShipmentDetailResponse:
    try:
        shipment_row = await run_in_threadpool(
            pg_fetch_one,
            "SELECT * FROM shipments WHERE shipment_id = %s LIMIT 1",
            (shipment_id,),
        )
        if not shipment_row:
            raise HTTPException(status_code=404, detail="Shipment not found")

        shipment = await _map_row_to_shipment(shipment_row)

        emissions_history = await run_in_threadpool(
            pg_fetch_all,
            "SELECT * FROM emissions WHERE shipment_id = %s ORDER BY recorded_at ASC",
            (shipment_id,),
        )

        prediction = await predict_shipment_co2(shipment_id, emissions_history)

        return ShipmentDetailResponse(
            shipment=shipment,
            emissions_history=emissions_history,
            prediction=prediction,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Falling back to local seeded shipment detail for %s: %s", shipment_id, exc)
        shipment_row = get_shipment(shipment_id)
        if not shipment_row:
            raise HTTPException(status_code=404, detail="Shipment not found")
        emissions_history = get_shipment_emissions(shipment_id)
        prediction = await predict_shipment_co2(shipment_id, emissions_history)
        return ShipmentDetailResponse(
            shipment=Shipment(**shipment_row),
            emissions_history=emissions_history,
            prediction=prediction,
        )


@router.get("/{shipment_id}/emissions/history")
async def get_shipment_emission_history(shipment_id: str) -> list[dict[str, Any]]:
    try:
        rows = await run_in_threadpool(
            pg_fetch_all,
            "SELECT * FROM emissions WHERE shipment_id = %s ORDER BY recorded_at ASC",
            (shipment_id,),
        )
        return rows
    except Exception as exc:
        logger.exception("Failed to fetch emission history for %s", shipment_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{shipment_id}/route-alternatives")
async def get_route_alternatives(shipment_id: str) -> list[dict[str, Any]]:
    try:
        shipment_row = await run_in_threadpool(
            pg_fetch_one,
            "SELECT * FROM shipments WHERE shipment_id = %s LIMIT 1",
            (shipment_id,),
        )
        if not shipment_row:
            raise HTTPException(status_code=404, detail="Shipment not found")

        alternatives = await generate_route_alternatives(shipment_row)
        return alternatives
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to generate route alternatives for %s", shipment_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{shipment_id}/driver-score", response_model=DriverScoreBreakdown)
async def get_driver_score(shipment_id: str) -> DriverScoreBreakdown:
    try:
        telemetry_rows = await run_in_threadpool(
            pg_fetch_all,
            """
            SELECT shipment_id, co2_kg, co2_per_km, emission_factor, fuel_efficiency_kmpl, recorded_at
            FROM emissions
            WHERE shipment_id = %s
            ORDER BY recorded_at ASC
            LIMIT 100
            """,
            (shipment_id,),
        )
        breakdown = compute_driver_score_breakdown(shipment_id, telemetry_rows or [])
        return breakdown
    except Exception as exc:
        logger.exception("Failed to compute driver score for %s", shipment_id)
        raise HTTPException(status_code=500, detail=str(exc))
