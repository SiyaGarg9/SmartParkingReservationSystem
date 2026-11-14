from fastapi import FastAPI

from app.routes import users, parking, slots, bookings
from app.routes import admin, search, payments
from app.routes import navigation
from app.routes import qr
from app.routes import feedback, notifications
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Smart Parking Reservation System",
    description="Backend API for Smart Parking Reservation System",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# REGISTER ROUTERS
# =========================================================

app.include_router(users.router)
app.include_router(parking.router)
app.include_router(slots.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(search.router)
app.include_router(payments.router)
app.include_router(navigation.router)
app.include_router(qr.router)
app.include_router(notifications.router)
@app.get("/")
def home():
    return {
        "message": "Smart Parking Reservation System API is running"
    }


@app.get("/about")
def about():
    return {
        "project": "Smart Parking Reservation System",
        "version": "1.0.0",
        "status": "Development"
    }