import asyncio
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from database import engine
from sqlalchemy import text

async def add_employee_id_column():
    async with engine.begin() as conn:
        print("Checking if employee_id column exists...")
        try:
            # Try to add the column. If it exists, this might fail or we can check first.
            # Postgres: ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR UNIQUE;
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR"))
            # Add unique constraint index if needed, but simple unique constraint on column is enough usually.
            # But 'IF NOT EXISTS' for constraint is trickier in standard SQL.
            # Let's just add the column first.
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_employee_id ON users (employee_id)"))
            print("Added employee_id column and index.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(add_employee_id_column())
