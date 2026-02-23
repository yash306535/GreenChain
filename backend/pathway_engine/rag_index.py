from __future__ import annotations

import logging
import os
from typing import List

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
POLICIES_PATH = os.path.join(DATA_DIR, "sustainability_policies.txt")
logger = logging.getLogger("greenchain.ai")

_DEFAULT_POLICIES: list[str] = [
    "Prioritize low-emission transport modes where service levels are maintained.",
    "Consolidate loads to reduce empty miles and improve route utilization.",
    "Track CO2 per shipment and set monthly reduction targets.",
    "Prefer EV or CNG fleets for short-haul urban distribution when feasible.",
    "Escalate high-emission anomalies for review and corrective action.",
]


def build_policy_table() -> list[str]:
    try:
        with open(POLICIES_PATH, "r", encoding="utf-8") as f:
            rows = [
                line.strip()
                for line in f.readlines()
                if line.strip() and not line.strip().startswith("#")
            ]
            return rows or _DEFAULT_POLICIES
    except FileNotFoundError:
        logger.warning("Policy file not found at %s; using default policy table", POLICIES_PATH)
        return _DEFAULT_POLICIES


# Words too generic to be useful for keyword matching
_STOP_WORDS = {
    "the", "is", "are", "a", "an", "in", "on", "at", "to", "for", "of",
    "and", "or", "be", "my", "our", "where", "what", "how", "which",
    "this", "that", "it", "was", "will", "can", "do", "does", "with",
    "by", "from", "have", "has", "had", "get", "we", "i", "me", "us",
    "them", "they", "he", "she", "you", "who", "being", "still",
}


def search_policies(table: list[str], query: str, k: int = 5) -> List[str]:
    """Score each policy by how many query keywords it contains.

    Falls back to the first k entries so the AI always has some policy
    context even when no keywords match (e.g. plain-English questions).
    """
    q_lower = query.lower()
    keywords = [w for w in q_lower.split() if w not in _STOP_WORDS and len(w) > 2]

    scored: list[tuple[int, str]] = []
    for policy in table:
        p_lower = policy.lower()
        if q_lower in p_lower:          # exact phrase hit — top priority
            scored.append((100, policy))
        else:
            score = sum(1 for kw in keywords if kw in p_lower)
            if score > 0:
                scored.append((score, policy))

    if scored:
        scored.sort(key=lambda x: x[0], reverse=True)
        return [p for _, p in scored[:k]]

    # No keyword match — still give the AI the first k policies as context
    return table[:k]
