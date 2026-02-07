import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Starting migration...")
        stmts = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_latitude FLOAT",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_longitude FLOAT",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_address VARCHAR",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_latitude FLOAT",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_longitude FLOAT",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS drop_address VARCHAR"
        ]
        
        for stmt in stmts:
            try:
                await conn.execute(text(stmt))
                print(f"Executed: {stmt}")
            except Exception as e:
                print(f"Error executing {stmt}: {e}")
                
        print("Migration complete")

if __name__ == "__main__":
    asyncio.run(migrate())
