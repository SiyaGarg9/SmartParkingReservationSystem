
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

from app.schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ===================================
# REGISTER
# ===================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    # Check if email already exists
    existing_user = db.execute(
        text("""
            SELECT user_id
            FROM users
            WHERE email = :email
        """),
        {
            "email": user.email
        }
    ).fetchone()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    # Hash password
    password_hash = hash_password(user.password)

    # Insert user including phone number
    result = db.execute(
        text("""
            INSERT INTO users
            (
                name,
                email,
                phone,
                password_hash,
                role
            )
            VALUES
            (
                :name,
                :email,
                :phone,
                :password_hash,
                'USER'
            )
            RETURNING
                user_id,
                name,
                email,
                phone,
                role
        """),
        {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "password_hash": password_hash
        }
    )

    new_user = result.mappings().first()

    db.commit()

    return new_user


# ===================================
# LOGIN
# ===================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # Find user in PostgreSQL
    existing_user = db.execute(
        text("""
            SELECT
                user_id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = :email
        """),
        {
            "email": user.email
        }
    ).mappings().first()

    # User doesn't exist
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # Check password
    if not verify_password(
        user.password,
        existing_user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )

    # Generate JWT token
    access_token = create_access_token(
        existing_user["user_id"]
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": existing_user["role"]
    }
