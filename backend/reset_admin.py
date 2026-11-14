
from getpass import getpass

from sqlalchemy import text

from app.auth import hash_password
from app.database import get_db


ADMIN_ID = 2
NEW_EMAIL = "administrator@123.com"
NEW_NAME = "Administrator"

password = getpass("Enter your new admin password: ")
confirm_password = getpass("Confirm your new admin password: ")

if len(password) < 8:
    raise SystemExit("Password must contain at least 8 characters.")

if password != confirm_password:
    raise SystemExit("Passwords do not match.")

db_generator = get_db()
db = next(db_generator)

try:
    # Check that the new email is not used by another account
    existing = db.execute(
        text("""
            SELECT user_id
            FROM users
            WHERE email = :email
              AND user_id != :admin_id
        """),
        {
            "email": NEW_EMAIL,
            "admin_id": ADMIN_ID
        }
    ).first()

    if existing:
        raise Exception("This email is already used by another account.")

    # Confirm that the original administrator exists
    admin = db.execute(
        text("""
            SELECT user_id
            FROM users
            WHERE user_id = :admin_id
        """),
        {"admin_id": ADMIN_ID}
    ).first()

    if not admin:
        raise Exception("Administrator account ID 2 was not found.")

    # Update administrator details and securely hash the new password
    db.execute(
        text("""
            UPDATE users
            SET
                name = :name,
                email = :email,
                password_hash = :password_hash,
                role = 'ADMIN'
            WHERE user_id = :admin_id
        """),
        {
            "name": NEW_NAME,
            "email": NEW_EMAIL,
            "password_hash": hash_password(password),
            "admin_id": ADMIN_ID
        }
    )

    db.commit()

    print("\nAdministrator credentials updated successfully!")
    print("Name:", NEW_NAME)
    print("Login email:", NEW_EMAIL)
    print("Database user ID:", ADMIN_ID)
    print("Role: ADMIN")
    print("Password: Updated successfully (not displayed).")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
    db_generator.close()
