from pydantic import BaseModel


class GreenScoreBreakdown(BaseModel):
    shipment_id: str
    grade: str
    value: float
    co2_efficiency_score: float
    driver_score_component: float
    vehicle_type_bonus: float
    load_utilization_score: float


class FleetGreenScoreEntry(BaseModel):
    shipment_id: str
    grade: str
    value: float
    origin: str
    destination: str
    vehicle_type: str
