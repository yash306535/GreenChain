from __future__ import annotations

from typing import Literal


VehicleType = Literal["truck", "ev_truck", "train"]


def calculate_co2(
    vehicle_type: VehicleType,
    distance_km: float,
    fuel_liters: float,
    cargo_weight_tons: float,
) -> tuple[float, float]:
    """Return (co2_kg, co2_per_km) using the project emission factors.

    - Diesel truck: fuel_liters * 2.68 * (1 + cargo_tons/30 * 0.15)
    - EV truck: distance_km * 0.05
    - Train: distance_km * 0.03 * cargo_tons
    """

    if vehicle_type == "train":
        co2_kg = distance_km * 0.03 * cargo_weight_tons
    elif vehicle_type.startswith("ev"):
        co2_kg = distance_km * 0.05
    else:
        load_factor = 1 + (cargo_weight_tons / 30.0) * 0.15
        co2_kg = fuel_liters * 2.68 * load_factor

    co2_per_km = co2_kg / distance_km if distance_km > 0 else 0.0
    return co2_kg, co2_per_km
