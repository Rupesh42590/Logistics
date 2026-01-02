import asyncio
from sqlalchemy import text
from database import engine

async def reset_sequences():
    async with engine.begin() as conn:
        try:
            # PostgreSQL specific syntax for resetting sequences
            print("Resetting 'orders_id_seq'...")
            await conn.execute(text("ALTER SEQUENCE orders_id_seq RESTART WITH 1;"))
            
            print("Resetting 'vehicles_id_seq'...")
            await conn.execute(text("ALTER SEQUENCE vehicles_id_seq RESTART WITH 1;"))
            
            print("Successfully reset order and vehicle IDs to start from 1.")
        except Exception as e:
            print(f"Error resetting sequences: {e}")
            print("Note: This script assumes PostgreSQL and standard naming conventions.")

if __name__ == "__main__":
    asyncio.run(reset_sequences())
