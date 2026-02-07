import asyncio
from sqlalchemy import text
from database import async_engine

async def remove_access_key_column():
    """Remove access_key column from users table"""
    async with async_engine.begin() as conn:
        # Check if column exists first
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='access_key'
        """))
        
        if result.fetchone():
            print("Removing access_key column from users table...")
            await conn.execute(text("ALTER TABLE users DROP COLUMN access_key"))
            print("✓ Successfully removed access_key column")
        else:
            print("access_key column does not exist, skipping")

if __name__ == "__main__":
    asyncio.run(remove_access_key_column())
