from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from ..services.supabase_client import get_supabase_client
from ..services.gemini_service import generate_gemini_response, get_fleet_context
from ..pathway_engine.rag_index import build_policy_table, search_policies


logger = logging.getLogger("greenchain.ai")

router = APIRouter()


async def _get_session_history(session_id: str) -> List[Dict[str, Any]]:
    supabase = await get_supabase_client()
    resp = (
        await supabase.table("ai_insights")
        .select("query, response")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    if resp.error:
        logger.error("Failed to fetch AI history: %s", resp.error.message)
        return []
    history: List[Dict[str, Any]] = []
    for row in reversed(resp.data or []):
        history.append({"role": "user", "parts": [row["query"]]})
        history.append({"role": "model", "parts": [row["response"]]})
    return history


async def _store_ai_interaction(
    query: str,
    response: str,
    shipment_id: str | None,
    session_id: str,
    insight_type: str = "user_query",
) -> None:
    supabase = await get_supabase_client()
    await supabase.table("ai_insights").insert(
        {
            "query": query,
            "response": response,
            "shipment_id": shipment_id,
            "session_id": session_id,
            "insight_type": insight_type,
        }
    ).execute()


@router.post("/ask")
async def ai_ask(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        question = payload.get("question") or ""
        shipment_id = payload.get("shipment_id")
        session_id = payload.get("session_id") or "default"

        if not question:
            raise HTTPException(status_code=400, detail="question is required")

        history = await _get_session_history(session_id)
        fleet_context = await get_fleet_context()

        policy_table = build_policy_table()
        policy_snippets = search_policies(policy_table, question, k=5)
        policy_context = "\n".join(policy_snippets)

        system_instruction = (
            "You are GreenChain AI, a sustainability and logistics copilot. "
            "Use the provided fleet KPIs and policy snippets to give precise, actionable green supply chain advice."
        )

        full_prompt = (
            f"Fleet context:\n{fleet_context}\n\n"
            f"Relevant policies:\n{policy_context}\n\n"
            f"User question: {question}"
        )

        answer = await generate_gemini_response(
            prompt=full_prompt,
            system_instruction=system_instruction,
            history=history,
        )

        await _store_ai_interaction(question, answer, shipment_id, session_id)

        return {"answer": answer}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI ask failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/proactive-insights")
async def proactive_insights() -> Dict[str, Any]:
    """Return 3 auto-generated daily insights based on fleet stats."""

    try:
        supabase = await get_supabase_client()
        stats_resp = await supabase.table("daily_fleet_stats").select("*").order("date", desc=True).limit(1).execute()
        if stats_resp.error:
            raise RuntimeError(stats_resp.error.message)
        stats = stats_resp.data[0] if stats_resp.data else {}

        fleet_context = await get_fleet_context()

        prompt = (
            "Generate 3 concise, numbered sustainability insights (1-2 sentences each) "
            "for a logistics fleet based on the following KPIs and trends. "
            "Each insight should highlight a risk or opportunity and include a concrete next action.\n\n"
            f"Fleet stats: {fleet_context}\n"
        )

        answer = await generate_gemini_response(prompt=prompt)
        insights = [line.strip() for line in answer.split("\n") if line.strip()][:3]

        # Store as proactive insights
        for text in insights:
            await _store_ai_interaction(
                query="[auto] proactive insight",
                response=text,
                shipment_id=None,
                session_id="proactive",
                insight_type="proactive",
            )

        return {"insights": insights}
    except Exception as exc:
        logger.exception("Failed to generate proactive insights")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/explain-alert/{alert_id}")
async def explain_alert(alert_id: str) -> Dict[str, Any]:
    try:
        supabase = await get_supabase_client()
        alert_resp = (
            await supabase.table("alerts")
            .select("shipment_id, alert_type, severity, message, created_at")
            .eq("id", alert_id)
            .single()
            .execute()
        )
        if alert_resp.error or not alert_resp.data:
            raise HTTPException(status_code=404, detail="Alert not found")

        alert = alert_resp.data
        fleet_context = await get_fleet_context()

        prompt = (
            "Explain in simple terms why the following alert fired, and provide 3 "
            "specific remediation steps that an operations manager can take. "
            "Be concrete and reference sustainable logistics best practices.\n\n"
            f"Alert: {alert}\n\nFleet context: {fleet_context}"
        )

        answer = await generate_gemini_response(prompt=prompt)

        await _store_ai_interaction(
            query=f"Explain alert {alert_id}",
            response=answer,
            shipment_id=alert.get("shipment_id"),
            session_id="alert_explanations",
            insight_type="alert_explanation",
        )

        return {"explanation": answer}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to explain alert %s", alert_id)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/ev-transition-advice")
async def ev_transition_advice() -> Dict[str, Any]:
    """Analyze all routes and rank which to convert to EV first by CO2 impact."""

    try:
        supabase = await get_supabase_client()
        sh_resp = await supabase.table("shipments").select(
            "shipment_id, origin, destination, distance_covered_km, vehicle_type, cargo_weight_tons",
        ).execute()
        if sh_resp.error:
            raise RuntimeError(sh_resp.error.message)

        rows = sh_resp.data or []
        # Build a compact context for Gemini to rank.
        fleet_routes = []
        for r in rows:
            fleet_routes.append(
                {
                    "shipment_id": r["shipment_id"],
                    "origin": r.get("origin"),
                    "destination": r.get("destination"),
                    "distance_km": float(r.get("distance_covered_km") or 0.0),
                    "vehicle_type": r.get("vehicle_type") or "truck",
                    "cargo_weight_tons": float(r.get("cargo_weight_tons") or 10.0),
                }
            )

        prompt = (
            "You are an EV transition advisor. Given the following list of freight routes, "
            "rank the top 5 routes that should be converted to EV trucks first to maximize CO2 "
            "reduction. Return a JSON array where each element has fields: "
            "shipment_id, alternative, co2_saving_pct, rationale, feasibility.\n\n"
            f"Routes: {fleet_routes}"
        )

        answer = await generate_gemini_response(prompt=prompt)

        import json

        try:
            suggestions = json.loads(answer)
        except Exception:
            # If the model returned text, we just wrap it
            suggestions = [{"raw": answer}]

        await _store_ai_interaction(
            query="EV transition advice",
            response=answer,
            shipment_id=None,
            session_id="ev_advice",
            insight_type="ev_transition",
        )

        return {"suggestions": suggestions}
    except Exception as exc:
        logger.exception("Failed to generate EV transition advice")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/weekly-report-summary")
async def weekly_report_summary() -> Dict[str, Any]:
    try:
        fleet_context = await get_fleet_context()

        prompt = (
            "Write a concise weekly sustainability report summary (4-6 sentences) "
            "for the logistics fleet based on the following KPIs and trends. "
            "Mention CO2 trends, green score, carbon credits earned, and any risks or "
            "opportunities. Use clear, executive-friendly language.\n\n"
            f"Fleet context: {fleet_context}"
        )

        answer = await generate_gemini_response(prompt=prompt)

        await _store_ai_interaction(
            query="Weekly report summary",
            response=answer,
            shipment_id=None,
            session_id="weekly_reports",
            insight_type="weekly_summary",
        )

        return {"summary": answer}
    except Exception as exc:
        logger.exception("Failed to generate weekly report summary")
        raise HTTPException(status_code=500, detail=str(exc))
