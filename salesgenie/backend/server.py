"""SalesGenie AI — API Backend

A thin FastAPI application that aggregates routes from modular routers
and initializes the ML model on startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml_engine import retrain_ml_model
from routers.leads import router as leads_router
from routers.analytics import router as analytics_router
from routers.outreach import router as outreach_router

app = FastAPI(
    title="SalesGenie AI - Lead Intelligence API Backend",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(leads_router)
app.include_router(analytics_router)
app.include_router(outreach_router)


# ---------------------------------------------------------------------------
# Startup — train/load ML model
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    retrain_ml_model()


# ---------------------------------------------------------------------------
# Root health-check
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to SalesGenie AI - AI Sales Assistant & Lead Intelligence Platform API!",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ---------------------------------------------------------------------------
# Entry point for `python server.py`
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
