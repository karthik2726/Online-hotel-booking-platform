"""Stand-alone database initialization and seeding script."""
import sys
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_path))

from app.database import SessionLocal, engine, Base
from app.seed_data import seed_database_tables

def main():
    print("Initializing SQLite database tables and seeding realistic data...")
    db = SessionLocal()
    try:
        stats = seed_database_tables(db)
        print("Seeding complete!")
        for k, v in stats.items():
            print(f" - {k}: {v}")
    except Exception as e:
        print(f"Error seeding database: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
