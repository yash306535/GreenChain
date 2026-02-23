from __future__ import annotations

import logging
from typing import List

from exponent_server_sdk import PushClient, PushMessage, PushServerError
from requests.exceptions import ConnectionError as RequestsConnectionError

from .supabase_client import get_supabase_client


logger = logging.getLogger("greenchain.notifications")


async def _get_push_tokens(user_ids: List[str]) -> List[str]:
    supabase = await get_supabase_client()
    resp = (
        await supabase.table("user_devices")
        .select("expo_push_token, user_id")
        .in_("user_id", user_ids)
        .execute()
    )
    if resp.error:
        logger.error("Failed to fetch device tokens: %s", resp.error.message)
        return []
    return [r["expo_push_token"] for r in resp.data or [] if r.get("expo_push_token")]


async def send_push_notification(user_ids: List[str], title: str, body: str) -> None:
    tokens = await _get_push_tokens(user_ids)
    if not tokens:
        return

    for token in tokens:
        try:
            response = PushClient().publish(
                PushMessage(to=token, title=title, body=body, sound="default"),
            )
            if not response.ok:
                logger.warning("Push failed for %s: %s", token, response._errors)
        except (PushServerError, RequestsConnectionError) as exc:
            logger.warning("Push error for %s: %s", token, exc)
