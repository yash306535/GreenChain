from datetime import date
from pydantic import BaseModel


class FleetOverviewKPIs(BaseModel):
    total_co2_kg: float
    total_shipments: int
    avg_green_score: float
    total_carbon_credits: float
    flagged_shipments: int


class VehicleComparisonEntry(BaseModel):
    vehicle_type: str
    total_co2_kg: float
    co2_per_km: float


class MonthlyTargetProgress(BaseModel):
    month: str
    target_co2_kg: float
    actual_co2_kg: float
    progress_pct: float


class ModalShiftOpportunity(BaseModel):
    routes_to_shift: int
    estimated_co2_saving_tonnes_per_month: float
    rationale: str
