from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db import Base, engine
from app.routers import analytics, auth, dashboard, settings as settings_router, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vaulto API",
    description="Backend API for tracking income, expenses, savings, investments, and emergency funds.",
    version="1.0.0",
)

origins = [settings.frontend_origin, "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(settings_router.router)


@app.get("/")
def root():
    return {"message": "Welcome to the Vaulto API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
