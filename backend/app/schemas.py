
from pydantic import BaseModel, EmailStr
from datetime import datetime


# ===================================
# USER SCHEMAS
# ===================================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str | None = None
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


# ===================================
# PARKING AREA SCHEMAS
# ===================================

class ParkingAreaCreate(BaseModel):
    name: str
    location: str


class ParkingAreaResponse(BaseModel):
    area_id: int
    name: str
    location: str

    class Config:
        from_attributes = True


# ===================================
# PARKING SLOT SCHEMAS
# ===================================

class SlotCreate(BaseModel):
    area_id: int
    slot_no: str
    floorNo: str
    slot_type: str = "NORMAL"
    status: str = "AVAILABLE"
    is_ev_charging: bool = False


class SlotUpdate(BaseModel):
    slot_no: str
    floorNo: str
    slot_type: str
    status: str
    is_ev_charging: bool


class SlotResponse(BaseModel):
    slot_id: int
    area_id: int
    slot_no: str
    floorNo: str
    slot_type: str
    status: str
    is_ev_charging: bool

    class Config:
        from_attributes = True


# ===================================
# BOOKING SCHEMAS
# ===================================

class BookingCreate(BaseModel):
    user_id: int
    slot_id: int
    start_time: datetime
    end_time: datetime


class BookingResponse(BaseModel):
    booking_id: int
    user_id: int
    slot_id: int
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ===================================
# ADMIN SCHEMAS
# ===================================

class AdminUserUpdate(BaseModel):
    name: str
    email: EmailStr
    role: str


# ===================================
# RESCHEDULE BOOKING
# ===================================

class BookingReschedule(BaseModel):
    start_time: datetime
    end_time: datetime


# ===================================
# PAYMENT SCHEMAS
# ===================================

class PaymentCreate(BaseModel):
    booking_id: int
    amount: float
    payment_method: str


class PaymentResponse(BaseModel):
    payment_id: int
    booking_id: int
    amount: float
    payment_method: str
    transaction_id: str | None
    payment_status: str
    payment_time: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


# ===================================
# EV CHARGER SCHEMAS
# ===================================

class EVChargerCreate(BaseModel):
    slot_id: int
    charger_type: str
    powerVal: float | None = None
    status: str = "AVAILABLE"


class EVChargerUpdate(BaseModel):
    charger_type: str
    powerVal: float | None = None
    status: str


# ===================================
# QR SCHEMAS
# ===================================

class QREntryRequest(BaseModel):
    token: str


class QRExitRequest(BaseModel):
    token: str
