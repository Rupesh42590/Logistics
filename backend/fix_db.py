import asyncio
from sqlalchemy import text
from database import engine

async def add_column():
    async with engine.begin() as conn:
        try:
            print("Attempting to add item_name column to orders table...")
            await conn.execute(text("ALTER TABLE orders ADD COLUMN item_name VARCHAR"))
            print("Successfully added item_name column.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(add_column())
