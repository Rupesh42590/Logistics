
import asyncio
from database import AsyncSessionLocal
from models import User, Vehicle, Order
from sqlalchemy import select

async def check_data():
    async with AsyncSessionLocal() as session:
        # Check Users
        result = await session.execute(select(User))
        users = result.scalars().all()
        user_map = {u.id: u.email for u in users}
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"User: {u.email}, Role: {u.role}, ID: {u.id}")

        # Check Vehicles
        result = await session.execute(select(Vehicle))
        vehicles = result.scalars().all()
        print(f"\nTotal Vehicles: {len(vehicles)}")
        for v in vehicles:
            driver_email = user_map.get(v.driver_id, "Unknown")
            print(f"Vehicle: {v.vehicle_number}, ID: {v.id}, DriverID: {v.driver_id} ({driver_email})")

        # Check Orders
        result = await session.execute(select(Order))
        orders = result.scalars().all()
        print(f"\nTotal Orders: {len(orders)}")
        for o in orders:
             print(f"Order: {o.id}, Status: {o.status}, VehicleID: {o.assigned_vehicle_id}, DriverConf: {o.driver_confirmed_delivery}")

if __name__ == "__main__":
    asyncio.run(check_data())
