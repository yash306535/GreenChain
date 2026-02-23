import os
from functools import lru_cache
from typing import Any, Dict, List
import logging

import google.generativeai as genai

from .supabase_client import get_supabase_client

logger = logging.getLogger("greenchain.ai")


def init_gemini() -> None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY must be set")
    genai.configure(api_key=api_key)


def _normalize_model_name(name: str) -> str:
    name = name.strip()
    if not name:
        return name
    return name if name.startswith("models/") else f"models/{name}"


def _candidate_model_names() -> list[str]:
    preferred = os.getenv("GEMINI_MODEL", "").strip()
    fallback = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]
    out: list[str] = []
    seen: set[str] = set()
    for raw in ([preferred] if preferred else []) + fallback:
        name = _normalize_model_name(raw)
        if not name or name in seen:
            continue
        seen.add(name)
        out.append(name)
    return out


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return (
        "resourceexhausted" in msg
        or "quota exceeded" in msg
        or "you exceeded your current quota" in msg
        or "429" in msg
    )


def _fallback_ai_text(prompt: str) -> str:
    # Keep this concise and deterministic so API callers always get a valid response.
    return (
        "AI response is temporarily unavailable because Gemini API quota is exhausted. "
        "Please retry shortly, switch to a billed key/project, or reduce request frequency. "
        f"Request preview: {prompt[:180]}"
    )


@lru_cache(maxsize=8)
def _get_model(model_name: str) -> genai.GenerativeModel:
    init_gemini()
    return genai.GenerativeModel(model_name)


async def get_fleet_context() -> str:
    """Build a textual context of fleet KPIs for AI prompts.

    Tries daily_fleet_stats first; falls back to computing live stats
    directly from the shipments table so the AI is never given empty context.
    """

    supabase = await get_supabase_client()

    # ── Try pre-aggregated daily stats ────────────────────────────────────────
    stats_resp = (
        await supabase.table("daily_fleet_stats")
        .select("*")
        .order("date", desc=True)
        .limit(1)
        .execute()
    )
    if not stats_resp.error and stats_resp.data:
        row = stats_resp.data[0]
        return (
            f"date={row['date']}, total_co2_kg={row.get('total_co2_kg')}, "
            f"total_shipments={row.get('total_shipments')}, avg_green_score={row.get('avg_green_score')}, "
            f"total_carbon_credits={row.get('total_carbon_credits')}, flagged_shipments={row.get('flagged_shipments')}"
        )

    # ── Fallback: compute live from shipments table ────────────────────────────
    # Only select columns guaranteed to exist in the shipments schema.
    # co2_per_km / total_co2_kg live in the emissions table, not shipments.
    sh_resp = (
        await supabase.table("shipments")
        .select(
            "shipment_id, origin, destination, vehicle_type, status, "
            "fuel_consumed_liters, predicted_final_co2_kg, "
            "green_score, green_score_value, driver_score, "
            "distance_covered_km, total_distance_km, cargo_weight_tons"
        )
        .execute()
    )
    if sh_resp.error or not sh_resp.data:
        logger.warning("Shipments query failed for fleet context: %s",
                       sh_resp.error.message if sh_resp.error else "empty result")
        return "No fleet data available."

    rows = sh_resp.data
    total = len(rows)
    in_transit = sum(1 for r in rows if r.get("status") == "in_transit")
    completed = sum(1 for r in rows if r.get("status") == "completed")

    # Total fuel and predicted CO2 from shipments table
    total_fuel = sum(r["fuel_consumed_liters"] for r in rows if r.get("fuel_consumed_liters"))
    total_co2 = sum(r["predicted_final_co2_kg"] for r in rows if r.get("predicted_final_co2_kg"))

    # CO2/km approximated as predicted_final_co2_kg / total_distance_km per shipment
    co2_per_km_vals = []
    for r in rows:
        co2 = r.get("predicted_final_co2_kg")
        dist = r.get("total_distance_km")
        if co2 and dist and dist > 0:
            co2_per_km_vals.append(co2 / dist)
    avg_co2_per_km = round(sum(co2_per_km_vals) / len(co2_per_km_vals), 3) if co2_per_km_vals else None

    gs_vals = [r["green_score_value"] for r in rows if r.get("green_score_value") is not None]
    avg_gs = round(sum(gs_vals) / len(gs_vals), 1) if gs_vals else None

    ds_vals = [r["driver_score"] for r in rows if r.get("driver_score") is not None]
    avg_driver = round(sum(ds_vals) / len(ds_vals), 1) if ds_vals else None

    vehicle_counts: dict[str, int] = {}
    for r in rows:
        vt = r.get("vehicle_type") or "unknown"
        vehicle_counts[vt] = vehicle_counts.get(vt, 0) + 1

    grade_counts: dict[str, int] = {}
    for r in rows:
        g = r.get("green_score") or "unknown"
        grade_counts[g] = grade_counts.get(g, 0) + 1

    # Shipments above India baseline (0.90 kg CO2/km) — wasting fuel/money
    high_emission = []
    for r in rows:
        co2 = r.get("predicted_final_co2_kg")
        dist = r.get("total_distance_km")
        if co2 and dist and dist > 0 and (co2 / dist) > 0.90:
            high_emission.append(r)
    high_ids = ", ".join(r["shipment_id"] for r in high_emission[:5])

    lines = [
        f"total_shipments={total} (in_transit={in_transit}, completed={completed})",
        f"avg_co2_per_km={avg_co2_per_km if avg_co2_per_km is not None else 'N/A'} kg/km  [India baseline=0.90 kg/km]",
        f"total_predicted_co2_kg={round(total_co2, 1)}",
        f"total_fuel_consumed_litres={round(total_fuel, 1)}",
        f"avg_green_score={avg_gs if avg_gs is not None else 'N/A'}/100",
        f"avg_driver_score={avg_driver if avg_driver is not None else 'N/A'}/100",
        f"vehicle_mix={vehicle_counts}",
        f"grade_distribution={grade_counts}",
        f"shipments_above_emission_baseline={len(high_emission)} (IDs: {high_ids or 'none'})",
    ]
    return "\n".join(lines)


async def generate_gemini_response(
    prompt: str,
    system_instruction: str | None = None,
    history: List[Dict[str, Any]] | None = None,
) -> str:
    """Call Gemini with optional system instruction and chat history.

    History format: [{"role": "user"|"model", "parts": ["text"]}, ...]
    """

    contents: List[Dict[str, Any]] = []
    if system_instruction:
        contents.append({"role": "user", "parts": [system_instruction]})
    if history:
        contents.extend(history)
    contents.append({"role": "user", "parts": [prompt]})

    last_error: Exception | None = None
    for model_name in _candidate_model_names():
        try:
            model = _get_model(model_name)
            resp = model.generate_content(contents)
            return resp.text or ""
        except Exception as exc:
            last_error = exc
            msg = str(exc).lower()
            if "not found" in msg or "not supported for generatecontent" in msg:
                logger.warning("Gemini model unavailable: %s; trying next candidate", model_name)
                continue
            if _is_quota_error(exc):
                logger.warning("Gemini quota exhausted for %s; trying next candidate", model_name)
                continue
            raise

    if last_error:
        if _is_quota_error(last_error):
            return _fallback_ai_text(prompt)
        raise last_error
    raise RuntimeError("No Gemini model candidates available")
