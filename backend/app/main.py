"""FastAPI main application entrypoint for Online Hotel Booking Platform."""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .database import engine, Base, SessionLocal
from .models.domain import HotelModel
from .seed_data import seed_database_tables
from .services.exceptions import (
    ResourceNotFoundException,
    BookingConflictException,
    BusinessRuleValidationException,
    PaymentFailedException
)
from .routers import hotels, rooms, bookings, admin

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Online Hotel Booking Platform — Round 2 LLD",
    description="Low-Level Design (LLD) demonstration implementing OOP, concurrency control, idempotency, and cancellation workflows.",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Exception Handlers -----------------

@app.exception_handler(ResourceNotFoundException)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": "NOT_FOUND", "message": exc.message, "status_code": 404}
    )

@app.exception_handler(BookingConflictException)
async def booking_conflict_handler(request: Request, exc: BookingConflictException):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": "BOOKING_CONFLICT", "message": exc.message, "status_code": 409}
    )

@app.exception_handler(BusinessRuleValidationException)
async def business_rule_handler(request: Request, exc: BusinessRuleValidationException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "VALIDATION_FAILED", "message": exc.message, "status_code": 400}
    )

@app.exception_handler(PaymentFailedException)
async def payment_failed_handler(request: Request, exc: PaymentFailedException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "PAYMENT_FAILED", "message": exc.message, "status_code": 400}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    details = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = str(err.get("msg", "Invalid value"))
        error_messages.append(f"{loc}: {msg}" if loc else msg)
        details.append({
            "field": loc,
            "message": msg,
            "type": str(err.get("type", "value_error"))
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "UNPROCESSABLE_ENTITY",
            "message": "; ".join(error_messages),
            "details": details,
            "status_code": 422
        }
    )

# ----------------- Routers -----------------
app.include_router(hotels.router)
app.include_router(rooms.router)
app.include_router(bookings.router)
app.include_router(admin.router)

@app.on_event("startup")
def on_startup():
    """Auto-seed database if empty on startup."""
    db = SessionLocal()
    try:
        hotel_count = db.query(HotelModel).count()
        if hotel_count == 0:
            seed_database_tables(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "platform": "Online Hotel Booking Platform (Round 2 LLD)",
        "version": "1.0.0",
        "docs_url": "/docs",
        "status": "operational"
    }

@app.get("/api/health")
def health_check():
    return {"status": "UP", "database": "connected"}
