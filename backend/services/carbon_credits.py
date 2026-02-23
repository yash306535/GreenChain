from __future__ import annotations

from dataclasses import dataclass
import os


INDIA_BASELINE_CO2_PER_KM = float(os.getenv("INDIA_BASELINE_CO2_PER_KM", "0.9"))
CARBON_CREDIT_PRICE_INR = float(os.getenv("CARBON_CREDIT_PRICE_INR", "800"))


@dataclass
class CarbonCreditResult:
    baseline_co2_kg: float
    actual_co2_kg: float
    co2_saved_kg: float
    credits_earned: float
    credit_value_inr: float


def calculate_carbon_credits(
    distance_km: float,
    actual_co2_kg: float,
    baseline_co2_per_km: float | None = None,
) -> CarbonCreditResult:
    """Calculate Gold Standard style carbon credits for a shipment.

    1 credit = 1 tonne CO2 avoided.
    Baseline by default uses India avg diesel truck 0.9 kg/km.
    """

    baseline_per_km = baseline_co2_per_km or INDIA_BASELINE_CO2_PER_KM
    baseline_co2_kg = distance_km * baseline_per_km
    co2_saved_kg = max(0.0, baseline_co2_kg - actual_co2_kg)
    credits = co2_saved_kg / 1000.0
    value_inr = credits * CARBON_CREDIT_PRICE_INR

    return CarbonCreditResult(
        baseline_co2_kg=baseline_co2_kg,
        actual_co2_kg=actual_co2_kg,
        co2_saved_kg=co2_saved_kg,
        credits_earned=credits,
        credit_value_inr=value_inr,
    )
