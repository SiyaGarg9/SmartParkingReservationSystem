
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base


# =========================================================
# USER MODEL
# =========================================================

class User(Base):

    __tablename__ = "users"

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    phone = Column(
        String(15),
        unique=True,
        nullable=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False,
        default="USER"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    bookings = relationship(
        "Booking",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "role IN ('USER', 'ADMIN')",
            name="chk_user_role"
        ),
    )


# =========================================================
# PARKING AREA MODEL
# =========================================================

class ParkingArea(Base):

    __tablename__ = "parking_areas"

    area_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    location = Column(
        String(200),
        nullable=False
    )

    slots = relationship(
        "Slot",
        back_populates="parking_area",
        cascade="all, delete-orphan"
    )


# =========================================================
# PARKING SLOT MODEL
# =========================================================

class Slot(Base):

    __tablename__ = "slots"

    slot_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    area_id = Column(
        Integer,
        ForeignKey(
            "parking_areas.area_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    slot_no = Column(
        String(20),
        nullable=False
    )

    floorNo = Column(
        "floorno",
        String(20),
        nullable=True
    )

    slot_type = Column(
        String(20),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="AVAILABLE"
    )

    is_ev_charging = Column(
        Boolean,
        nullable=False,
        default=False
    )

    parking_area = relationship(
        "ParkingArea",
        back_populates="slots"
    )

    ev_charger = relationship(
        "EVCharger",
        back_populates="slot",
        uselist=False,
        cascade="all, delete-orphan"
    )

    bookings = relationship(
        "Booking",
        back_populates="slot",
        cascade="all, delete-orphan"
    )

    __table_args__ = (

        UniqueConstraint(
            "area_id",
            "slot_no",
            name="uq_area_slot"
        ),

        CheckConstraint(
            "slot_type IN ('NORMAL','COMPACT','LARGE','EV')",
            name="chk_slot_type"
        ),

        CheckConstraint(
            "status IN ('AVAILABLE','OCCUPIED','MAINTENANCE')",
            name="chk_slot_status"
        ),
    )


# =========================================================
# EV CHARGER MODEL
# =========================================================

class EVCharger(Base):

    __tablename__ = "ev_chargers"

    charger_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    slot_id = Column(
        Integer,
        ForeignKey(
            "slots.slot_id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    charger_type = Column(
        String(50),
        nullable=False
    )

    powerVal = Column(
    "powerval",
    Numeric(6, 2),
    nullable=True
)

    status = Column(
        String(20),
        nullable=False,
        default="AVAILABLE"
    )

    slot = relationship(
        "Slot",
        back_populates="ev_charger"
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('AVAILABLE','IN_USE','MAINTENANCE')",
            name="chk_charger_status"
        ),
    )


# =========================================================
# BOOKING MODEL
# =========================================================

class Booking(Base):

    __tablename__ = "bookings"

    booking_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.user_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    slot_id = Column(
        Integer,
        ForeignKey(
            "slots.slot_id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    start_time = Column(
        DateTime,
        nullable=False
    )

    end_time = Column(
        DateTime,
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        default="BOOKED"
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="bookings"
    )

    slot = relationship(
        "Slot",
        back_populates="bookings"
    )

    payment = relationship(
        "Payment",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Relationship with feedback
    feedback = relationship(
        "Feedback",
        back_populates="booking",
        uselist=False,
        cascade="all, delete-orphan"
    )

    __table_args__ = (

        CheckConstraint(
            "status IN ('BOOKED','IN_PROGRESS','COMPLETED','CANCELLED')",
            name="chk_booking_status"
        ),

        CheckConstraint(
            "end_time > start_time",
            name="chk_booking_time"
        ),
    )


# =========================================================
# PAYMENT MODEL
# =========================================================

class Payment(Base):

    __tablename__ = "payments"

    payment_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    booking_id = Column(
        Integer,
        ForeignKey(
            "bookings.booking_id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    payment_method = Column(
        String(20),
        nullable=False
    )

    transaction_id = Column(
        String(100),
        unique=True,
        nullable=True
    )

    payment_status = Column(
        String(20),
        nullable=False,
        default="PENDING"
    )

    payment_time = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    booking = relationship(
        "Booking",
        back_populates="payment"
    )

    __table_args__ = (

        CheckConstraint(
            "amount >= 0",
            name="chk_payment_amount"
        ),

        CheckConstraint(
            "payment_method IN ('UPI','CARD','NET_BANKING','WALLET')",
            name="chk_payment_method"
        ),

        CheckConstraint(
            "payment_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')",
            name="chk_payment_status"
        ),
    )


# =========================================================
# FEEDBACK AND RATING MODEL
# =========================================================

class Feedback(Base):

    __tablename__ = "feedback"

    feedback_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    booking_id = Column(
        Integer,
        ForeignKey(
            "bookings.booking_id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    comment = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    booking = relationship(
        "Booking",
        back_populates="feedback"
    )

    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="chk_feedback_rating"
        ),
    )
