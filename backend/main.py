import asyncio
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from services.supabase_client import get_supabase_client
from services.gemini_service import init_gemini
from pathway_engine.stream_simulator import StreamSimulator


_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env")

logger = logging.getLogger("greenchain")
logging.basicConfig(level=logging.INFO)


STREAM_INTERVAL_SECONDS = 3


class StreamController:
    """Controls the background simulation + streaming loop.

    This controller is shared across HTTP and WebSocket endpoints so that
    there is a single source of truth for whether the simulation is running.
    """

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._simulator: StreamSimulator | None = None
        self._running = asyncio.Event()
        self._ws_connections: set[WebSocket] = set()

    @property
    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()

    async def register_ws(self, ws: WebSocket) -> None:
        self._ws_connections.add(ws)

    async def unregister_ws(self, ws: WebSocket) -> None:
        self._ws_connections.discard(ws)

    async def _broadcast_ws(self, payload: dict) -> None:
        to_remove: list[WebSocket] = []
        for conn in list(self._ws_connections):
            try:
                await conn.send_json(payload)
            except Exception as exc:  # network / disconnect
                logger.warning("Failed to push to websocket: %s", exc)
                to_remove.append(conn)
        for conn in to_remove:
            await self.unregister_ws(conn)

    async def start(self) -> None:
        if self.is_running:
            logger.info("Stream already running")
            return

        supabase = await get_supabase_client()
        self._simulator = StreamSimulator(supabase=supabase)
        self._running.set()
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Stream simulation started")

    async def stop(self) -> None:
        if not self.is_running:
            return
        self._running.clear()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info("Stream simulation stopped")

    async def _run_loop(self) -> None:
        assert self._simulator is not None
        try:
            async for reading in self._simulator.stream(interval_seconds=STREAM_INTERVAL_SECONDS):
                # Persist shipment snapshot + emissions inside the simulator
                # and broadcast to any connected websocket clients.
                await self._broadcast_ws({"type": "shipment_update", "data": reading})
                if not self._running.is_set():
                    break
        except asyncio.CancelledError:
            logger.info("Stream loop cancelled")
        except Exception:
            logger.exception("Error in stream loop")
        finally:
            self._running.clear()


stream_controller = StreamController()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI lifespan handler.

    Ensures Supabase and Gemini are initialised and that any background
    simulation is stopped cleanly on shutdown.
    """

    app.state.seeded_mode = False

    # Init Supabase client once so that configuration issues fail fast.
    try:
        await get_supabase_client()
    except Exception:
        app.state.seeded_mode = True
        logger.warning("Supabase unavailable, starting in local seeded mode")

    # Configure Gemini
    try:
        init_gemini()
    except Exception:
        logger.warning("Gemini unavailable, AI endpoints may return fallback responses")

    logger.info("GreenChain backend startup complete")
    yield

    # Shutdown logic
    try:
        await stream_controller.stop()
    except Exception:
        logger.exception("Error stopping stream controller during shutdown")


app = FastAPI(title="GreenChain API", version="1.0.0", lifespan=lifespan)

# CORS for local Expo / web clients
origins = [
    "http://localhost:3000",
    "http://localhost:19006",
    "http://localhost:8081",
    "http://127.0.0.1:3000",
    "*",  # can be tightened in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers – implemented in their respective modules. We import lazily to
# avoid circular dependencies during tooling / partial implementation.
from routers import (  # noqa: E402
    shipments,
    emissions,
    ai_insights,
    analytics,
    alerts,
    reports,
    green_score,
    ml_routes,
)


app.include_router(shipments.router, prefix="/shipments", tags=["shipments"])
app.include_router(emissions.router, prefix="/emissions", tags=["emissions"])
app.include_router(ai_insights.router, prefix="/ai", tags=["ai"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(green_score.router, prefix="/green-score", tags=["green-score"])
app.include_router(ml_routes.router, prefix="/api/ml", tags=["ml"])


@app.get("/health")
async def health() -> dict:
    """Basic health check endpoint."""

    return {"status": "ok"}


@app.post("/shipments/stream/start")
async def start_stream():
    try:
        await stream_controller.start()
        return {"status": "started"}
    except Exception as exc:
        logger.exception("Failed to start stream")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to start stream: {exc}"},
        )


@app.post("/shipments/stream/stop")
async def stop_stream():
    try:
        await stream_controller.stop()
        return {"status": "stopped"}
    except Exception as exc:
        logger.exception("Failed to stop stream")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to stop stream: {exc}"},
        )


@app.websocket("/ws/shipments")
async def ws_shipments(websocket: WebSocket):
    await websocket.accept()
    await stream_controller.register_ws(websocket)
    try:
        # Keep the connection alive; the controller will push updates.
        while True:
            # We don't expect messages from the client; just ping-pong.
            try:
                await websocket.receive_text()
            except Exception:
                # Ignore client messages; we only push.
                await asyncio.sleep(1)
    except WebSocketDisconnect:
        await stream_controller.unregister_ws(websocket)
    except Exception as exc:
        logger.warning("WebSocket error: %s", exc)
        await stream_controller.unregister_ws(websocket)


@app.websocket("/ws/alerts")
async def ws_alerts(websocket: WebSocket):
    """Placeholder websocket for alerts stream.

    Actual alert push logic will be wired from anomaly detector once
    implemented; for now this simply keeps a connection open so the
    frontend can be integrated while backend logic is completed.
    """

    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        logger.warning("Alerts WebSocket error: %s", exc)
        return


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
