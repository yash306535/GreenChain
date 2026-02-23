import logging

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from ..models.alert import Alert, AlertUpdate
from ..services.postgres_client import pg_fetch_all, pg_execute_returning
from ..services.local_seed_data import list_alerts, mark_alert_read as mark_alert_read_seed


logger = logging.getLogger("greenchain.alerts")

router = APIRouter()


@router.get("/", response_model=list[Alert])
async def get_unread_alerts() -> list[Alert]:
    try:
        rows = await run_in_threadpool(
            pg_fetch_all,
            "SELECT * FROM alerts WHERE is_read = FALSE ORDER BY created_at DESC",
        )
        return [Alert(**row) for row in rows]
    except Exception as exc:
        logger.warning("Falling back to local seeded unread alerts: %s", exc)
        return [Alert(**row) for row in list_alerts(unread_only=True)]


@router.get("/{shipment_id}", response_model=list[Alert])
async def get_alerts_for_shipment(shipment_id: str) -> list[Alert]:
    try:
        rows = await run_in_threadpool(
            pg_fetch_all,
            "SELECT * FROM alerts WHERE shipment_id = %s ORDER BY created_at DESC",
            (shipment_id,),
        )
        return [Alert(**row) for row in rows]
    except Exception as exc:
        logger.warning("Falling back to local seeded alerts for %s: %s", shipment_id, exc)
        return [Alert(**row) for row in list_alerts(shipment_id=shipment_id)]


@router.patch("/{alert_id}/read", response_model=Alert)
async def mark_alert_read(alert_id: str, payload: AlertUpdate) -> Alert:
    try:
        rows = await run_in_threadpool(
            pg_execute_returning,
            "UPDATE alerts SET is_read = %s WHERE id = %s RETURNING *",
            (payload.is_read, alert_id),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Alert not found")
        return Alert(**rows[0])
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Falling back to local seeded alert update for %s: %s", alert_id, exc)
        row = mark_alert_read_seed(alert_id, payload.is_read)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return Alert(**row)


@router.put("/{alert_id}/read", response_model=Alert)
async def mark_alert_read_compat(alert_id: str) -> Alert:
    return await mark_alert_read(alert_id, AlertUpdate(is_read=True))
