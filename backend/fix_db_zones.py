import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            print("Creating zones table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS zones (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL UNIQUE,
                    geometry_coords VARCHAR NOT NULL
                )
            """))
            print("Zones table created/verified.")
            
            print("Adding zone_id to vehicles...")
            try:
                await conn.execute(text("ALTER TABLE vehicles ADD COLUMN zone_id INTEGER REFERENCES zones(id)"))
            except Exception as e:
                print(f"Column might exist: {e}")

            # Optional: drop service_zone column if you want cleanup, but keeping for safety
            
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
