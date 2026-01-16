import asyncio
from backend.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        print("Checking and adding columns...")
        
        # Add name column to users if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR"))
            print("Added 'name' column to users table.")
        except Exception as e:
            print(f"Skipping 'name' column addition: {e}")

        # Add driver_id column to vehicles if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE vehicles ADD COLUMN driver_id INTEGER REFERENCES users(id)"))
            print("Added 'driver_id' column to vehicles table.")
        except Exception as e:
            print(f"Skipping 'driver_id' column addition: {e}")
            
    print("Database schema update complete.")

if __name__ == "__main__":
    import sys, os
    # Add project root to sys.path so backend module is found
    sys.path.insert(0, os.getcwd())
    asyncio.run(main())
