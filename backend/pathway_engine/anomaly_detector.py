from __future__ import annotations

from typing import Any, Dict, List

import pathway as pw

from services.supabase_client import get_supabase_client
from services.notification_service import send_push_notification


class TelemetrySchema(pw.Schema):
    shipment_id: str
    speed_kmh: float
    fuel_consumed_liters: float
    distance_covered_km: float
    co2_per_km: float
    eta_minutes: int
    expected_eta_minutes: int
    lat: float
    lng: float


def _classify_anomaly(window_rows: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    if not window_rows:
        return None
    last = window_rows[-1]
    sid = last["shipment_id"]

    co2_rates = [float(r.get("co2_per_km") or 0.0) for r in window_rows]
    avg_rate = sum(co2_rates) / len(co2_rates) if co2_rates else 0.0

    speed_values = [float(r.get("speed_kmh") or 0.0) for r in window_rows]
    avg_speed = sum(speed_values) / len(speed_values) if speed_values else 0.0

    fuel_diffs = []
    prev_fuel = None
    for r in window_rows:
        f = float(r.get("fuel_consumed_liters") or 0.0)
        if prev_fuel is not None:
            fuel_diffs.append(max(0.0, f - prev_fuel))
        prev_fuel = f
    avg_fuel_inc = sum(fuel_diffs) / len(fuel_diffs) if fuel_diffs else 0.0

    idle_minutes = 0.0
    for r in window_rows:
        if float(r.get("speed_kmh") or 0.0) < 3.0:
            idle_minutes += 3.0  # approx per sample

    eta = int(last.get("eta_minutes") or 0)
    expected_eta = int(last.get("expected_eta_minutes") or eta)

    # Baseline co2 rate approximated by average of previous samples
    baseline_rate = avg_rate * 0.7 if avg_rate > 0 else 0.0

    # High emission
    if avg_rate > baseline_rate * 1.4 and avg_rate > 0:
        return {
            "alert_type": "high_emission",
            "severity": "high",
            "message": f"Shipment {sid} CO2 rate is 40% above baseline.",
        }

    # Idling
    if idle_minutes > 15:
        return {
            "alert_type": "idling",
            "severity": "medium",
            "message": f"Shipment {sid} idling for more than 15 minutes.",
        }

    # Fuel leak suspected
    if avg_fuel_inc > 0 and avg_speed < 10 and avg_fuel_inc > (avg_rate * 2 if avg_rate > 0 else 1):
        return {
            "alert_type": "fuel_leak_suspected",
            "severity": "critical",
            "message": f"Shipment {sid} fuel usage abnormal at low speed.",
        }

    # Delay risk
    if eta - expected_eta > 30:
        return {
            "alert_type": "delay_risk",
            "severity": "medium",
            "message": f"Shipment {sid} ETA exceeded by more than 30 minutes.",
        }

    # Route deviation (simplified: we omit corridor geometry; would be based on lat/lng drift)
    # Placeholder logic: real implementation would project onto corridor and measure distance.

    return None


async def process_anomalies(window_rows: List[Dict[str, Any]]) -> None:
    anomaly = _classify_anomaly(window_rows)
    if not anomaly:
        return

    last = window_rows[-1]
    shipment_id = last["shipment_id"]

    supabase = await get_supabase_client()
    alert_row = {
        "shipment_id": shipment_id,
        "alert_type": anomaly["alert_type"],
        "severity": anomaly["severity"],
        "message": anomaly["message"],
    }
    await supabase.table("alerts").insert(alert_row).execute()

    # Push to all registered users (for demo: broadcast)
    users_resp = await supabase.table("user_devices").select("user_id").execute()
    if not users_resp.error and users_resp.data:
        user_ids = [r["user_id"] for r in users_resp.data if r.get("user_id")]
        if user_ids:
            await send_push_notification(user_ids, title="GreenChain Alert", body=anomaly["message"])
