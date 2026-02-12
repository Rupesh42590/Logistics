import asyncio
import requests
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, AsyncSessionLocal
from models import User, UserRole, Vehicle, Order, OrderStatus, Company, Zone
from passlib.context import CryptContext

# Configuration
BASE_URL = "http://127.0.0.1:8000"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_test_data():
    print("Setting up test data...")
    async with AsyncSessionLocal() as session:
        # 1. Ensure Test Company
        res = await session.execute(select(Company).where(Company.name == "TestWorkflowComp"))
        company = res.scalars().first()
        if not company:
            company = Company(name="TestWorkflowComp", gst_number="TESTGST", address="Test Address")
            session.add(company)
            await session.commit()
            await session.refresh(company)

        # 2. Ensure Test MSME User
        res = await session.execute(select(User).where(User.email == "test_msme@example.com"))
        msme_user = res.scalars().first()
        if not msme_user:
            msme_user = User(
                email="test_msme@example.com",
                hashed_password=pwd_context.hash("password"),
                role=UserRole.MSME,
                company_id=company.id,
                name="Test MSME"
            )
            session.add(msme_user)
            await session.commit()
            await session.refresh(msme_user)
        
        # 3. Ensure Test Driver
        res = await session.execute(select(User).where(User.email == "test_driver@example.com"))
        driver_user = res.scalars().first()
        if not driver_user:
            driver_user = User(
                email="test_driver@example.com",
                hashed_password=pwd_context.hash("password"),
                role=UserRole.DRIVER,
                employee_id="DRV001",
                name="Test Driver"
            )
            session.add(driver_user)
            await session.commit()
            await session.refresh(driver_user)

        # 4. Ensure Test Zone
        res = await session.execute(select(Zone).where(Zone.name == "TestZone"))
        zone = res.scalars().first()
        if not zone:
            zone = Zone(name="TestZone", geometry_coords="[[0,0],[0,10],[10,10],[10,0]]") # Dummy
            session.add(zone)
            await session.commit()
            await session.refresh(zone)

        # 5. Ensure Test Vehicle
        res = await session.execute(select(Vehicle).where(Vehicle.vehicle_number == "TEST-V01"))
        vehicle = res.scalars().first()
        if not vehicle:
            vehicle = Vehicle(
                vehicle_number="TEST-V01",
                max_volume_m3=100,
                max_weight_kg=1000,
                zone_id=zone.id,
                driver_id=driver_user.id
            )
            session.add(vehicle)
        else:
            vehicle.driver_id = driver_user.id # Ensure assignment
            
        await session.commit()
        await session.refresh(vehicle)
        
        return msme_user, driver_user, vehicle

async def run_workflow_tests():
    print("\nRunning Workflow API Tests...")
    
    # Login MSME
    resp = requests.post(f"{BASE_URL}/token", data={"username": "test_msme@example.com", "password": "password"})
    assert resp.status_code == 200, f"MSME Login failed: {resp.text}"
    msme_token = resp.json()["access_token"]
    msme_headers = {"Authorization": f"Bearer {msme_token}"}
    
    # Login Driver
    resp = requests.post(f"{BASE_URL}/token", data={"username": "test_driver@example.com", "password": "password"})
    assert resp.status_code == 200, f"Driver Login failed: {resp.text}"
    driver_token = resp.json()["access_token"]
    driver_headers = {"Authorization": f"Bearer {driver_token}"}
    
    # 1. Create Order (MSME)
    print("1. Creating Order...")
    order_payload = {
        "length_cm": 10, "width_cm": 10, "height_cm": 10, "weight_kg": 5,
        "pickup_latitude": 1.0, "pickup_longitude": 1.0, # Inside dummy zone? roughly
        "drop_latitude": 2.0, "drop_longitude": 2.0,
        "item_name": "Workflow Test Item"
    }
    resp = requests.post(f"{BASE_URL}/orders", json=order_payload, headers=msme_headers)
    if resp.status_code != 200:
        print("Create Order failed:", resp.text)
        return
    order_id = resp.json()["id"]
    print(f"   Order #{order_id} created.")

    # 2. Assign Order to Vehicle (Hack: Update DB directly as we might not trigger auto-assignment with dummy coords)
    print("2. Assigning Order...")
    await assign_order_db(order_id, "TEST-V01")
    
    # 3. Driver Starts Shipment
    print("3. Driver Starting Shipment...")
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/start-shipment", headers=driver_headers)
    assert resp.status_code == 200, f"Start Shipment failed: {resp.text}"
    assert resp.json()["status"] == "SHIPPED", "Status not updated to SHIPPED"
    print("   Shipment Started.")
    
    # 4. Driver Confirms Delivery
    print("4. Driver Confirming Delivery...")
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/confirm-delivery", headers=driver_headers)
    assert resp.status_code == 200, f"Driver Confirm failed: {resp.text}"
    data = resp.json()
    assert data["driver_confirmed_delivery"] == True, "Driver flag not set"
    assert data["status"] == "SHIPPED", "Status changed prematurely"
    print("   Driver Confirmed.")

    # 5. MSME Confirms Delivery
    print("5. MSME Confirming Delivery...")
    resp = requests.post(f"{BASE_URL}/orders/{order_id}/confirm-delivery", headers=msme_headers)
    assert resp.status_code == 200, f"MSME Confirm failed: {resp.text}"
    data = resp.json()
    assert data["user_confirmed_delivery"] == True, "User flag not set"
    assert data["status"] == "DELIVERED", "Status not updated to DELIVERED"
    print("   MSME Confirmed. Order Verified DELIVERED.")
    
    # 6. Test Cancel Logic (Create new order)
    print("6. Testing Cancel Logic...")
    resp = requests.post(f"{BASE_URL}/orders", json=order_payload, headers=msme_headers)
    order_id_2 = resp.json()["id"]
    
    # Cancel Pending
    resp = requests.post(f"{BASE_URL}/orders/{order_id_2}/cancel", headers=msme_headers)
    assert resp.status_code == 200, f"Cancel Pending failed: {resp.text}"
    assert resp.json()["status"] == "CANCELLED"
    print("   Pending Order Cancelled.")
    
    # Create another, assign, then cancel
    resp = requests.post(f"{BASE_URL}/orders", json=order_payload, headers=msme_headers)
    order_id_3 = resp.json()["id"]
    await assign_order_db(order_id_3, "TEST-V01")
    
    resp = requests.post(f"{BASE_URL}/orders/{order_id_3}/cancel", headers=msme_headers)
    assert resp.status_code == 200, f"Cancel Assigned failed: {resp.text}"
    assert resp.json()["status"] == "CANCELLED"
    print("   Assigned Order Cancelled.")
    
    print("\nALL TESTS PASSED!")

async def assign_order_db(order_id, vehicle_number):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Vehicle).where(Vehicle.vehicle_number == vehicle_number))
        v = res.scalars().first()
        res = await session.execute(select(Order).where(Order.id == order_id))
        o = res.scalars().first()
        if o and v:
            o.assigned_vehicle_id = v.id
            o.status = OrderStatus.ASSIGNED
            await session.commit()

async def main():
    # Setup Data
    await setup_test_data()
    # Run Tests
    await run_workflow_tests()

if __name__ == "__main__":
    asyncio.run(main())
