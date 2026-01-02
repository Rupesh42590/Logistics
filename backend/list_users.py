import asyncio
from database import AsyncSessionLocal
from models import User
from sqlalchemy import select

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
