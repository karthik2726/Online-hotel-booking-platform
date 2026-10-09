"""Configuration module for Hotel Booking Platform."""
import os
from pathlib import Path

# Disable C extensions to ensure cross-platform compatibility under Windows AppLocker policies
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = os.environ.get("HOTEL_DB_PATH", str(BASE_DIR / "hotel_booking.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Simulated payment delay/success configuration
SIMULATED_PAYMENT_AUTO_SUCCESS = True
