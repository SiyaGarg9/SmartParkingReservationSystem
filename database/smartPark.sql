-- Create SmartPark Database
CREATE DATABASE smartpark;
-- connect SmartPark Database \c smartpark

-- Create public schema if it does not exist
CREATE SCHEMA IF NOT EXISTS public;

-- Drop tables in dependency-safe order
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.parking_qr CASCADE;
DROP TABLE IF EXISTS public.indoor_navigation CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.ev_chargers CASCADE;
DROP TABLE IF EXISTS public.slots CASCADE;
DROP TABLE IF EXISTS public.parking_areas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- 1. USERS:- Stores registered user and administrator information.
-- ============================================================
CREATE TABLE public.users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_role
        CHECK (role IN ('USER', 'ADMIN'))
);

-- ============================================================
-- 2. PARKING AREAS
-- Stores parking facility details.
-- ============================================================
CREATE TABLE public.parking_areas (
    area_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL
);

-- ============================================================
-- 3. SLOTS
-- Stores individual parking slot details.
-- ============================================================
CREATE TABLE public.slots (
    slot_id SERIAL PRIMARY KEY,
    area_id INT NOT NULL,
    slot_no VARCHAR(20) NOT NULL,
    floorNo VARCHAR(20),
    slot_type VARCHAR(20) NOT NULL
        CHECK (slot_type IN ('NORMAL', 'COMPACT', 'LARGE', 'EV')),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE')),
    is_ev_charging BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_slots_area_slot_no UNIQUE (area_id, slot_no),
    CONSTRAINT fk_slots_parking_area
        FOREIGN KEY (area_id)
        REFERENCES public.parking_areas(area_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 4. EV CHARGERS
-- Stores EV charger details associated with parking slots.
-- ============================================================
CREATE TABLE public.ev_chargers (
    charger_id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL UNIQUE,
    charger_type VARCHAR(50) NOT NULL,
    powerVal DECIMAL(6,2),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE')),

    CONSTRAINT fk_ev_chargers_slot
        FOREIGN KEY (slot_id)
        REFERENCES public.slots(slot_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 5. BOOKINGS
-- Stores parking reservations made by users.
-- ============================================================
CREATE TABLE public.bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED'
        CHECK (status IN ('BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_booking_time CHECK (end_time > start_time),
    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bookings_slot
        FOREIGN KEY (slot_id)
        REFERENCES public.slots(slot_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 6. PAYMENTS
-- Stores payment details associated with bookings.
-- ============================================================
CREATE TABLE public.payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('UPI', 'CARD', 'NET_BANKING', 'WALLET')),
    transaction_id VARCHAR(100) UNIQUE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES public.bookings(booking_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 7. FEEDBACK
-- Stores user ratings and comments for bookings.
-- ============================================================
CREATE TABLE public.feedback (
    feedback_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedback_booking
        FOREIGN KEY (booking_id)
        REFERENCES public.bookings(booking_id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

-- ============================================================
-- 8. INDOOR NAVIGATION
-- Stores coordinates associated with parking slots.
-- ============================================================
CREATE TABLE public.indoor_navigation (
    navigation_id SERIAL PRIMARY KEY,
    slot_id INT NOT NULL UNIQUE,
    x_coordinate DOUBLE PRECISION NOT NULL,
    y_coordinate DOUBLE PRECISION NOT NULL,

    CONSTRAINT fk_indoor_navigation_slot
        FOREIGN KEY (slot_id)
        REFERENCES public.slots(slot_id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

-- ============================================================
-- 9. PARKING QR
-- Stores entry and exit QR token information for bookings.
-- ============================================================
CREATE TABLE public.parking_qr (
    qr_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    qr_token VARCHAR(100) NOT NULL UNIQUE,
    entry_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    exit_qr_token VARCHAR(100) UNIQUE,
    exit_time TIMESTAMP,

    CONSTRAINT fk_parking_qr_booking
        FOREIGN KEY (booking_id)
        REFERENCES public.bookings(booking_id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

-- ============================================================
-- 10. NOTIFICATIONS
-- Stores notifications for users, optionally linked to bookings.
-- ============================================================
CREATE TABLE public.notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_booking
        FOREIGN KEY (booking_id)
        REFERENCES public.bookings(booking_id)
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

COMMIT;

-- ============================================================
-- End of SmartPark database schema
-- ============================================================
