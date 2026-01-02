import asyncio
from database import AsyncSessionLocal
from models import Order, User
from sqlalchemy import select

async def list_orders():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Order))
        orders = result.scalars().all()
        print(f"Found {len(orders)} orders in DB:")
        for o in orders:
            print(f"Order ID: {o.id} | User ID: {o.user_id} | Status: {o.status} | Loc: {o.pickup_location}")

if __name__ == "__main__":
    asyncio.run(list_orders())
