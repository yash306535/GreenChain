from __future__ import annotations

from io import StringIO
from typing import Any, List

import pandas as pd


def generate_emissions_csv(rows: List[dict[str, Any]]) -> str:
    """Build a CSV string for emissions joined with shipments if desired.

    rows should already contain the necessary joined fields; this helper just
    converts them into a CSV string using pandas.
    """

    if not rows:
        df = pd.DataFrame()
    else:
        df = pd.DataFrame(rows)
    buf = StringIO()
    df.to_csv(buf, index=False)
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
