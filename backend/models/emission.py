from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Emission(BaseModel):
    id: str
    shipment_id: str
    co2_kg: float
    co2_per_km: float
    emission_factor: float
    fuel_efficiency_kmpl: Optional[float]
    recorded_at: datetime


class EmissionSummary(BaseModel):
    total_co2_kg: float
    total_credits: float
    total_credits_inr: float


class EmissionTrendPoint(BaseModel):
    date: datetime
    total_co2_kg: float


class EmissionLeaderboardEntry(BaseModel):
    shipment_id: str
    total_co2_kg: float
    co2_per_km: float
