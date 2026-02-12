import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from database import DATABASE_URL

async def migrate():
    # Use valid isolation level for schema changes if needed, or just handle errors separately
    # set isolation_level to AUTOCOMMIT to ensure each statement runs immediately
    eng = create_async_engine(DATABASE_URL, echo=True, isolation_level="AUTOCOMMIT")
    
    async with eng.connect() as conn:
        print("Migrating database...")
        
        # Add Columns (idempotent-ish with IF NOT EXISTS)
        print("Adding driver_confirmed_delivery column...")
        try:
            await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_confirmed_delivery BOOLEAN DEFAULT FALSE;"))
        except Exception as e:
            print(f"Column update error: {e}")

        print("Adding user_confirmed_delivery column...")
        try:
             await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_confirmed_delivery BOOLEAN DEFAULT FALSE;"))
        except Exception as e:
            print(f"Column update error: {e}")

        # Update Enums - These must be done carefully as they can fail if value exists
        print("Updating OrderStatus enum (DELIVERED)...")
        try:
             await conn.execute(text("ALTER TYPE orderstatus ADD VALUE 'DELIVERED';"))
        except Exception as e:
            print(f"Enum update note (DELIVERED): {e}")

        print("Updating OrderStatus enum (CANCELLED)...")
        try:
             await conn.execute(text("ALTER TYPE orderstatus ADD VALUE 'CANCELLED';"))
        except Exception as e:
            print(f"Enum update note (CANCELLED): {e}")

        print("Migration complete.")
    
    await eng.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(migrate())
    except Exception as e:
        print(f"Migration script failed: {e}")
