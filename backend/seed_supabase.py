#!/usr/bin/env python3
"""
seed_supabase.py — Push demo data into the live Supabase / PostgreSQL database.

Usage (run from the repo root):
    python -m backend.seed_supabase

Or from inside the backend/ folder:
    python seed_supabase.py

Requirements:
  • DATABASE_URL set in backend/.env  (postgresql://user:pass@host:port/db)
  • psycopg2-binary installed  (pip install psycopg2-binary)

What it does:
  1. Creates the shipments, emissions, and alerts tables if they don't exist.
  2. Upserts 10 demo shipments (safe to re-run — won't duplicate).
  3. Clears old demo emissions / alerts (prefixed SHP-20xx) then re-inserts.
  4. Prints a tidy summary of what was written.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ── Allow running as a script OR as a module ────────────────────────────────
_HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(_HERE.parent))

from dotenv import load_dotenv

load_dotenv(_HERE / ".env")

import psycopg2
import psycopg2.extras

from backend.services.local_seed_data import (
    _shipments,
    _emissions,
    _alerts,
)

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    print(
        "ERROR: DATABASE_URL not found in backend/.env\n"
        "Add a line like:\n"
        "  DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres"
    )
    sys.exit(1)


# ──────────────────────────────────────────────────────────────────────────────
# DDL — create tables if they don't already exist
# ──────────────────────────────────────────────────────────────────────────────

DDL = """
-- Create tables if they don't exist yet.
-- If they already exist (e.g. created by Supabase or the stream simulator)
-- the CREATE TABLE IF NOT EXISTS is a no-op; the ALTER TABLE statements below
-- then safely add any columns that the stream simulator did not create.

CREATE TABLE IF NOT EXISTS shipments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id             TEXT UNIQUE NOT NULL,
    origin                  TEXT,
    destination             TEXT,
    current_lat             DOUBLE PRECISION,
    current_lng             DOUBLE PRECISION,
    speed_kmh               DOUBLE PRECISION,
    fuel_consumed_liters    DOUBLE PRECISION,
    distance_covered_km     DOUBLE PRECISION,
    total_distance_km       DOUBLE PRECISION,
    vehicle_type            TEXT,
    cargo_weight_tons       DOUBLE PRECISION,
    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- These columns may be absent when the table was created by the stream
-- simulator alone. ADD COLUMN IF NOT EXISTS is safe to run multiple times.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS eta_minutes             INTEGER;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status                  TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_score            DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS green_score             TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS green_score_value       DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS predicted_final_co2_kg  DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS emissions (
    id                   BIGSERIAL PRIMARY KEY,
    shipment_id          TEXT NOT NULL,
    co2_kg               DOUBLE PRECISION,
    co2_per_km           DOUBLE PRECISION,
    emission_factor      DOUBLE PRECISION,
    fuel_efficiency_kmpl DOUBLE PRECISION,
    recorded_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id  TEXT NOT NULL,
    alert_type   TEXT,
    severity     TEXT,
    message      TEXT,
    is_read      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT now()
);
"""


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _upsert_shipments(cur: psycopg2.extensions.cursor) -> int:
    sql = """
    INSERT INTO shipments (
        shipment_id, origin, destination,
        current_lat, current_lng, speed_kmh, fuel_consumed_liters,
        distance_covered_km, total_distance_km, eta_minutes, status,
        vehicle_type, cargo_weight_tons, driver_score,
        green_score, green_score_value, predicted_final_co2_kg,
        created_at, updated_at
    ) VALUES (
        %(shipment_id)s, %(origin)s, %(destination)s,
        %(current_lat)s, %(current_lng)s, %(speed_kmh)s, %(fuel_consumed_liters)s,
        %(distance_covered_km)s, %(total_distance_km)s, %(eta_minutes)s, %(status)s,
        %(vehicle_type)s, %(cargo_weight_tons)s, %(driver_score)s,
        %(green_score)s, %(green_score_value)s, %(predicted_final_co2_kg)s,
        %(created_at)s, %(updated_at)s
    )
    ON CONFLICT (shipment_id) DO UPDATE SET
        origin                 = EXCLUDED.origin,
        destination            = EXCLUDED.destination,
        current_lat            = EXCLUDED.current_lat,
        current_lng            = EXCLUDED.current_lng,
        speed_kmh              = EXCLUDED.speed_kmh,
        fuel_consumed_liters   = EXCLUDED.fuel_consumed_liters,
        distance_covered_km    = EXCLUDED.distance_covered_km,
        total_distance_km      = EXCLUDED.total_distance_km,
        eta_minutes            = EXCLUDED.eta_minutes,
        status                 = EXCLUDED.status,
        vehicle_type           = EXCLUDED.vehicle_type,
        cargo_weight_tons      = EXCLUDED.cargo_weight_tons,
        driver_score           = EXCLUDED.driver_score,
        green_score            = EXCLUDED.green_score,
        green_score_value      = EXCLUDED.green_score_value,
        predicted_final_co2_kg = EXCLUDED.predicted_final_co2_kg,
        updated_at             = EXCLUDED.updated_at
    """
    psycopg2.extras.execute_batch(cur, sql, _shipments)
    return len(_shipments)


def _replace_emissions(cur: psycopg2.extensions.cursor) -> int:
    """Delete existing demo emissions then bulk-insert fresh ones."""
    demo_ids = list({r["shipment_id"] for r in _emissions})
    cur.execute(
        "DELETE FROM emissions WHERE shipment_id = ANY(%s)",
        (demo_ids,),
    )

    sql = """
    INSERT INTO emissions (shipment_id, co2_kg, co2_per_km, emission_factor,
                           fuel_efficiency_kmpl, recorded_at)
    VALUES (%(shipment_id)s, %(co2_kg)s, %(co2_per_km)s, %(emission_factor)s,
            %(fuel_efficiency_kmpl)s, %(recorded_at)s)
    """
    psycopg2.extras.execute_batch(cur, sql, _emissions)
    return len(_emissions)


def _replace_alerts(cur: psycopg2.extensions.cursor) -> int:
    """Delete existing demo alerts for these shipments then re-insert.
    We do NOT provide the 'id' column so the DB auto-generates a UUID.
    """
    demo_shipment_ids = list({r["shipment_id"] for r in _alerts})
    cur.execute(
        "DELETE FROM alerts WHERE shipment_id = ANY(%s)",
        (demo_shipment_ids,),
    )

    sql = """
    INSERT INTO alerts (shipment_id, alert_type, severity, message, is_read, created_at)
    VALUES (%(shipment_id)s, %(alert_type)s, %(severity)s, %(message)s,
            %(is_read)s, %(created_at)s)
    """
    psycopg2.extras.execute_batch(cur, sql, _alerts)
    return len(_alerts)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print("Connecting to database…")
    try:
        conn = psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("Creating tables (if needed)…")
        cur.execute(DDL)

        print("Upserting shipments…")
        n_ships = _upsert_shipments(cur)

        print("Replacing emission readings…")
        n_emiss = _replace_emissions(cur)

        print("Upserting alerts…")
        n_alert = _replace_alerts(cur)

        conn.commit()

        print("\n✓ Seed complete")
        print(f"  Shipments  : {n_ships}")
        print(f"  Emissions  : {n_emiss} readings")
        print(f"  Alerts     : {n_alert}")
        print()
        print("Inserted shipment IDs:")
        for s in _shipments:
            grade  = s['green_score']
            status = s['status']
            print(f"  {s['shipment_id']}  {s['origin']:15} → {s['destination']:15}  [{s['vehicle_type']:13}]  Grade {grade}  {status}")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR — rolled back: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
