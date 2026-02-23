import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from services.supabase_client import get_supabase_client
from services.report_generator import generate_emissions_csv, build_fleet_summary
from services.local_seed_data import report_summary


logger = logging.getLogger("greenchain.reports")

router = APIRouter()


@router.get("/csv")
async def download_emissions_csv():
    """Return full emissions CSV for download."""

    try:
        supabase = await get_supabase_client()
        resp = await supabase.table("emissions").select("*").execute()
        if resp.error:
            raise RuntimeError(resp.error.message)
        rows = resp.data or []

        csv_str = generate_emissions_csv(rows)
        return StreamingResponse(
            iter([csv_str.encode("utf-8")]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=emissions.csv"},
        )
    except Exception as exc:
        logger.warning("Falling back to local seeded CSV generation: %s", exc)
        summary = report_summary()
        csv_str = generate_emissions_csv(summary.get("carbon_credits", []))
        return StreamingResponse(
            iter([csv_str.encode("utf-8")]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=emissions.csv"},
        )


@router.get("/fleet-summary")
async def fleet_summary():
    try:
        supabase = await get_supabase_client()
        resp = await supabase.table("emissions").select("shipment_id, co2_kg").execute()
        if resp.error:
            raise RuntimeError(resp.error.message)
        rows = resp.data or []

        summary = build_fleet_summary(rows)
        return JSONResponse(summary)
    except Exception as exc:
        logger.warning("Falling back to local seeded fleet summary: %s", exc)
        return JSONResponse(report_summary())


@router.get("")
async def reports_root():
    return JSONResponse(report_summary())
