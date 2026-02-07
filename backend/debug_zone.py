
import asyncio
from database import AsyncSessionLocal
from sqlalchemy import select
from models import Order, Zone, Vehicle
from shapely.geometry import Point, Polygon
import json

async def test_logic():
    async with AsyncSessionLocal() as db:
        # Get Order #3 (or just the latest order having issues)
        result = await db.execute(select(Order).order_by(Order.id.desc()))
        orders = result.scalars().all()
        if not orders:
            print("No orders found")
            return
            
        # Let's check the specific order mentioned or just the last few
        for order in orders[:3]:
            print(f"--- Checking Order {order.id} ---")
            print(f"Item: {order.item_name}, Pickup: {order.pickup_location}")
            
            try:
                lat, lon = map(float, order.pickup_location.split(','))
                point = Point(lat, lon)
                print(f"Point: {point}")
            except Exception as e:
                print(f"Error parsing location: {e}")
                continue

            z_res = await db.execute(select(Zone))
            zones = z_res.scalars().all()
            
            for z in zones:
                print(f"  Checking Zone: {z.name} (ID: {z.id})")
                try:
                    coords = json.loads(z.geometry_coords)
                    # print(f"    Coords raw: {coords}")
                    poly_coords = [(p[0], p[1]) for p in coords]
                    polygon = Polygon(poly_coords)
                    
                    is_contained = polygon.contains(point)
                    print(f"    Contains point? {is_contained}")
                    
                    if is_contained:
                        v_res = await db.execute(select(Vehicle).where(Vehicle.zone_id == z.id))
                        vehs = v_res.scalars().all()
                        print(f"    Vehicles in zone: {len(vehs)}")
                        for v in vehs:
                            fits = v.max_weight_kg >= order.weight_kg and v.max_volume_m3 >= order.volume_m3
                            print(f"      Vehicle {v.vehicle_number}: Cap {v.max_weight_kg}kg/{v.max_volume_m3}m3 vs Order {order.weight_kg}/{order.volume_m3}. Fits? {fits}")

                except Exception as e:
                    print(f"    Error processing zone: {e}")

if __name__ == "__main__":
    asyncio.run(test_logic())
