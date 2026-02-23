from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ShipmentBase(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    speed_kmh: Optional[float] = None
    fuel_consumed_liters: float = 0.0
    distance_covered_km: float = 0.0
    total_distance_km: Optional[float] = None
    eta_minutes: Optional[int] = None
    status: str = "in_transit"
    vehicle_type: str = "truck"
    cargo_weight_tons: float = 10.0
    driver_score: float = 100.0
    green_score: str = "B"
    green_score_value: float = 70.0
    predicted_final_co2_kg: Optional[float] = None


class Shipment(ShipmentBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ShipmentWithEmissions(Shipment):
    total_co2_kg: float
    co2_per_km: float | None = None


class ShipmentCreate(BaseModel):
    shipment_id: str
    origin: str
    destination: str
    total_distance_km: float
    vehicle_type: str = "truck"
    cargo_weight_tons: float = 10.0


class ShipmentDetailResponse(BaseModel):
    shipment: Shipment
    emissions_history: list[dict]
    prediction: Optional[dict] = None


class DriverScoreBreakdown(BaseModel):
    shipment_id: str
    base_score: float
    harsh_braking_penalty: float
    idling_penalty: float
    speeding_penalty: float
    final_score: float
