from __future__ import annotations

import asyncio
import json
import os
import random
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, List

from services.supabase_client import get_supabase_client


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CITIES_PATH = os.path.join(DATA_DIR, "indian_city_coordinates.json")
STREAM_FILE = os.path.join(DATA_DIR, "telemetry_stream.jsonl")


@dataclass
class TelemetryReading:
    shipment_id: str
    lat: float
    lng: float
    speed_kmh: float
    fuel_consumed_liters: float
    distance_covered_km: float
    vehicle_type: str
    idle_minutes: float
    harsh_braking_events: int
    cargo_weight_tons: float
    timestamp: str


class StreamSimulator:
    """Simulates 8 concurrent shipments across 10 Indian city routes.

    Every tick, it advances positions, fuel, distance, and injects occasional
    anomalies. It also appends readings to a JSONL file consumed by Pathway
    and upserts shipment state + emissions into Supabase.
    """

    def __init__(self, supabase) -> None:
        self.supabase = supabase
        self.routes = self._load_routes()
        self.shipments = self._init_shipments()

    def _load_routes(self) -> Dict[str, Dict[str, List[float]]]:
        if not os.path.exists(CITIES_PATH):
            # Minimal fallback coordinates for key cities
            cities = {
                "Mumbai": [19.0760, 72.8777],
                "Pune": [18.5204, 73.8567],
                "Delhi": [28.7041, 77.1025],
                "Agra": [27.1767, 78.0081],
                "Bengaluru": [12.9716, 77.5946],
                "Chennai": [13.0827, 80.2707],
                "Hyderabad": [17.3850, 78.4867],
                "Vijayawada": [16.5062, 80.6480],
                "Kolkata": [22.5726, 88.3639],
                "Bhubaneswar": [20.2961, 85.8245],
                "Ahmedabad": [23.0225, 72.5714],
                "Surat": [21.1702, 72.8311],
                "Jaipur": [26.9124, 75.7873],
                "Jodhpur": [26.2389, 73.0243],
                "Lucknow": [26.8467, 80.9462],
                "Varanasi": [25.3176, 82.9739],
                "Chandigarh": [30.7333, 76.7794],
                "Nagpur": [21.1458, 79.0882],
                "Raipur": [21.2514, 81.6296],
            }
        else:
            with open(CITIES_PATH, "r", encoding="utf-8") as f:
                cities = json.load(f)

        def route(a: str, b: str) -> Dict[str, List[float]]:
            return {"start": cities[a], "end": cities[b]}

        return {
            "SHP001": route("Mumbai", "Pune"),
            "SHP002": route("Delhi", "Agra"),
            "SHP003": route("Bengaluru", "Chennai"),
            "SHP004": route("Hyderabad", "Vijayawada"),
            "SHP005": route("Kolkata", "Bhubaneswar"),
            "SHP006": route("Ahmedabad", "Surat"),
            "SHP007": route("Jaipur", "Jodhpur"),
            "SHP008": route("Lucknow", "Varanasi"),
            # Additional logical routes for completeness
            "SHP009": route("Chandigarh", "Delhi"),
            "SHP010": route("Nagpur", "Raipur"),
        }

    def _init_shipments(self) -> Dict[str, Dict[str, float]]:
        shipments: Dict[str, Dict[str, float]] = {}
        vehicles = [
            "truck",
            "truck",
            "truck",
            "truck",
            "truck",
            "ev_truck",
            "ev_truck",
            "train",
        ]
        ids = list(self.routes.keys())[: len(vehicles)]
        for shipment_id, vtype in zip(ids, vehicles):
            total_distance = random.uniform(120, 650)
            shipments[shipment_id] = {
                "vehicle_type": vtype,
                "distance_covered_km": 0.0,
                "fuel_consumed_liters": 0.0,
                "idle_minutes": 0.0,
                "harsh_braking_events": 0,
                "cargo_weight_tons": random.uniform(8, 20),
                "total_distance_km": total_distance,
            }
        return shipments

    async def _persist_reading(self, reading: TelemetryReading) -> None:
        # Append to JSONL file for Pathway
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STREAM_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(reading)) + "\n")

        # Upsert into Supabase shipments + emissions tables
        supabase = self.supabase
        shipment = self.shipments[reading.shipment_id]

        shipment_update = {
            "shipment_id": reading.shipment_id,
            "origin": " ",  # can be enriched via seed; kept minimal here
            "destination": " ",
            "current_lat": reading.lat,
            "current_lng": reading.lng,
            "speed_kmh": reading.speed_kmh,
            "fuel_consumed_liters": shipment["fuel_consumed_liters"],
            "distance_covered_km": shipment["distance_covered_km"],
            "total_distance_km": shipment["total_distance_km"],
            "vehicle_type": shipment["vehicle_type"],
            "cargo_weight_tons": shipment["cargo_weight_tons"],
        }
        await supabase.table("shipments").upsert(shipment_update, on_conflict="shipment_id").execute()

        # Basic emission factor per vehicle
        if shipment["vehicle_type"] == "train":
            emission_factor = 0.03 * shipment["cargo_weight_tons"]
            distance_inc = max(reading.distance_covered_km - (shipment["distance_covered_km"] - 1e-6), 0.0)
            co2_kg = distance_inc * emission_factor
            fuel_eff = None
        elif shipment["vehicle_type"].startswith("ev"):
            emission_factor = 0.05
            distance_inc = max(reading.distance_covered_km - (shipment["distance_covered_km"] - 1e-6), 0.0)
            co2_kg = distance_inc * emission_factor
            fuel_eff = None
        else:
            emission_factor = 2.68
            fuel_eff = (
                distance_inc / (reading.fuel_consumed_liters or 1.0)
                if (distance_inc := max(
                    reading.distance_covered_km - (shipment["distance_covered_km"] - 1e-6),
                    0.0,
                ))
                else None
            )
            co2_kg = reading.fuel_consumed_liters * emission_factor

        if distance_inc := max(
            reading.distance_covered_km - (shipment["distance_covered_km"] - 1e-6),
            0.0,
        ):
            co2_per_km = co2_kg / distance_inc
        else:
            co2_per_km = 0.0

        emission_row = {
            "shipment_id": reading.shipment_id,
            "co2_kg": co2_kg,
            "co2_per_km": co2_per_km,
            "emission_factor": emission_factor,
            "fuel_efficiency_kmpl": fuel_eff,
        }
        await supabase.table("emissions").insert(emission_row).execute()

    async def stream(self, interval_seconds: int = 3) -> AsyncGenerator[Dict[str, float], None]:
        while True:
            for shipment_id, state in self.shipments.items():
                route = self.routes[shipment_id]
                progress = min(1.0, state["distance_covered_km"] / state["total_distance_km"])

                # Linear interpolation of coordinates
                (lat1, lng1), (lat2, lng2) = route["start"], route["end"]
                lat = lat1 + (lat2 - lat1) * progress
                lng = lng1 + (lng2 - lng1) * progress

                # Base values
                base_speed = random.uniform(45, 75)
                speed_kmh = base_speed
                idle_minutes = state["idle_minutes"]
                harsh_events = state["harsh_braking_events"]

                # Distance increment and fuel / energy
                distance_inc = base_speed * (interval_seconds / 3600.0)

                # Vehicle-specific fuel/energy consumption
                if state["vehicle_type"] == "train":
                    fuel_inc = 0.0
                elif state["vehicle_type"].startswith("ev"):
                    fuel_inc = 0.0
                else:
                    fuel_inc = distance_inc / random.uniform(3.5, 5.5)  # km per litre

                # Random anomalies
                anomaly = random.random()
                if anomaly < 0.05:
                    # Idling spike
                    speed_kmh = random.uniform(0, 3)
                    idle_minutes += interval_seconds / 60.0
                elif anomaly < 0.08:
                    # Fuel consumption jump
                    fuel_inc *= random.uniform(1.8, 2.2)
                elif anomaly < 0.12:
                    # Speed drop (congestion)
                    speed_kmh *= 0.4

                # Harsh braking events randomly linked to speed changes
                if speed_kmh < base_speed * 0.5 and base_speed > 50:
                    harsh_events += 1

                state["distance_covered_km"] = min(
                    state["total_distance_km"], state["distance_covered_km"] + distance_inc
                )
                state["fuel_consumed_liters"] += fuel_inc
                state["idle_minutes"] = idle_minutes
                state["harsh_braking_events"] = harsh_events

                reading = TelemetryReading(
                    shipment_id=shipment_id,
                    lat=lat,
                    lng=lng,
                    speed_kmh=speed_kmh,
                    fuel_consumed_liters=state["fuel_consumed_liters"],
                    distance_covered_km=state["distance_covered_km"],
                    vehicle_type=state["vehicle_type"],
                    idle_minutes=idle_minutes,
                    harsh_braking_events=harsh_events,
                    cargo_weight_tons=state["cargo_weight_tons"],
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )

                await self._persist_reading(reading)

                yield asdict(reading)

            await asyncio.sleep(interval_seconds)
