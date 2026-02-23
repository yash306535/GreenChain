from __future__ import annotations

import csv
from io import StringIO
from typing import Any, List


def generate_emissions_csv(rows: List[dict[str, Any]]) -> str:
    """Build a CSV string for emissions rows using stdlib csv module."""

    if not rows:
        return ""
    buf = StringIO()
    writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


def build_fleet_summary(rows: List[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate a simple JSON fleet summary from emission/shipments rows."""

    if not rows:
        return {
            "total_shipments": 0,
            "total_co2_kg": 0.0,
            "avg_co2_per_shipment": 0.0,
        }

    total_shipments = len({r["shipment_id"] for r in rows})
    total_co2 = float(sum(r.get("co2_kg", 0.0) for r in rows))
    avg = total_co2 / total_shipments if total_shipments > 0 else 0.0

    return {
        "total_shipments": total_shipments,
        "total_co2_kg": total_co2,
        "avg_co2_per_shipment": avg,
    }
