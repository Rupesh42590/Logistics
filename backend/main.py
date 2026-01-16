from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from contextlib import asynccontextmanager
import models
from auth import get_current_user, create_access_token, get_password_hash, verify_password
from schemas import UserCreate, UserResponse, Token, CompanyCreate, CompanyResponse, OrderCreate, OrderResponse, ZoneCreate, ZoneResponse, VehicleCreate, VehicleResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from models import User, Company, UserRole, Order, Zone, Vehicle

# ... (rest of imports)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174", # In case port shifts
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Logistics API"}



from fastapi.security import OAuth2PasswordRequestForm

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

from schemas import ChangePasswordRequest

@app.post("/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify old password
    if not verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect old password"
        )
    
    # Update with new password
    hashed_new_pwd = get_password_hash(request.new_password)
    current_user.hashed_password = hashed_new_pwd
    
    await db.commit()
    return {"message": "Password updated successfully"}

# Signup Endpoint (Combined Company + User for MSME)
@app.post("/signup/msme", response_model=UserResponse)
async def signup_msme(
    user_details: UserCreate, 
    company_details: CompanyCreate, 
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_details.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create Company
    new_company = Company(
        name=company_details.name,
        gst_number=company_details.gst_number,
        address=company_details.address
    )
    db.add(new_company)
    await db.flush() # Get ID
    
    # Create User
    hashed_pwd = get_password_hash(user_details.password)
    new_user = User(
        email=user_details.email,
        hashed_password=hashed_pwd,
        role=UserRole.MSME,
        company_id=new_company.id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Order Endpoints
from schemas import OrderCreate, OrderResponse
from models import Order

@app.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate Volume
    volume = (order.length_cm * order.width_cm * order.height_cm) / 1000000.0
    
    # Format Location
    pickup_loc_str = f"{order.latitude},{order.longitude}"
    
    new_order = Order(
        user_id=current_user.id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=volume,
        pickup_location=pickup_loc_str,
        status=models.OrderStatus.PENDING
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    # Map back to response schema
    lat, lon = map(float, new_order.pickup_location.split(','))
    
    return OrderResponse(
        id=new_order.id,
        user_id=new_order.user_id,
        item_name=new_order.item_name,
        length_cm=new_order.length_cm,
        width_cm=new_order.width_cm,
        height_cm=new_order.height_cm,
        weight_kg=new_order.weight_kg,
        volume_m3=new_order.volume_m3,
        status=new_order.status,
        assigned_vehicle_id=new_order.assigned_vehicle_id,
        latitude=lat,
        longitude=lon
    )

# --- Geospatial Logic ---
from shapely.geometry import Point, Polygon
import json

# Order Endpoints
@app.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Calculate Volume
    volume = (order.length_cm * order.width_cm * order.height_cm) / 1000000.0
    pickup_loc_str = f"{order.latitude},{order.longitude}"
    
    # --- Auto-Assignment Logic ---
    status_val = models.OrderStatus.PENDING
    assigned_vehicle_id = None
    
    # 1. Fetch all zones from DB
    result = await db.execute(select(models.Zone))
    db_zones = result.scalars().all()
    
    matched_zone_id = None
    point = Point(order.latitude, order.longitude)
    
    for z in db_zones:
        # Parse Geometry. stored as "lat,lng;lat,lng" or JSON
        # frontend leaflet draw usually gives array of arrays [[lat,lng],...]
        # We'll assume json string storage in this iteration for robustness
        try:
            coords = json.loads(z.geometry_coords)
            # Shapely expects list of (x, y) = (lat, lng) tuples. 
            # Note: GeoJSON is usually (lng, lat). Leaflet is (lat, lng).
            # We will standardize on receiving [ [lat,lng], ... ] from frontend
            poly_coords = [(p[0], p[1]) for p in coords]
            polygon = Polygon(poly_coords)
            
            if polygon.contains(point):
                matched_zone_id = z.id
                break
        except Exception as e:
            print(f"Zone parse error {z.name}: {e}")
            continue
    
    if matched_zone_id:
        # 2. Find available vehicle in that zone
        result = await db.execute(select(Vehicle).where(Vehicle.zone_id == matched_zone_id))
        vehicles_in_zone = result.scalars().all()
        
        for v in vehicles_in_zone:
            # Simple capacity check
            if v.max_weight_kg >= order.weight_kg and v.max_volume_m3 >= volume:
                assigned_vehicle_id = v.id
                status_val = models.OrderStatus.ASSIGNED
                break
    
    new_order = Order(
        user_id=current_user.id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=volume,
        pickup_location=pickup_loc_str,
        status=status_val,
        assigned_vehicle_id=assigned_vehicle_id
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    lat, lon = map(float, new_order.pickup_location.split(','))
    
    return OrderResponse(
        id=new_order.id,
        user_id=new_order.user_id,
        item_name=new_order.item_name,
        length_cm=new_order.length_cm,
        width_cm=new_order.width_cm,
        height_cm=new_order.height_cm,
        weight_kg=new_order.weight_kg,
        volume_m3=new_order.volume_m3,
        status=new_order.status,
        assigned_vehicle_id=new_order.assigned_vehicle_id,
        latitude=lat,
        longitude=lon
    )

@app.get("/orders", response_model=list[OrderResponse])
@app.get("/orders", response_model=list[OrderResponse])
async def read_orders(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Order, Vehicle).outerjoin(Vehicle, Order.assigned_vehicle_id == Vehicle.id)
    
    if current_user.role == models.UserRole.SUPER_ADMIN:
        stmt = stmt.order_by(Order.id.desc())
    else:
        stmt = stmt.where(Order.user_id == current_user.id).order_by(Order.id.desc())
        
    result = await db.execute(stmt)
    rows = result.all() # list of (Order, Vehicle) tuples
    
    response = []
    for o, v in rows:
        lat, lon = 0.0, 0.0
        if o.pickup_location:
            try:
                lat, lon = map(float, o.pickup_location.split(','))
            except:
                pass
        
        response.append(OrderResponse(
            id=o.id,
            user_id=o.user_id,
            item_name=o.item_name,
            length_cm=o.length_cm,
            width_cm=o.width_cm,
            height_cm=o.height_cm,
            weight_kg=o.weight_kg,
            volume_m3=o.volume_m3,
            status=o.status,
            assigned_vehicle_id=o.assigned_vehicle_id,
            assigned_vehicle_number=v.vehicle_number if v else None,
            latitude=lat,
            longitude=lon
        ))
    return response

@app.get("/orders/{order_id}/compatible-vehicles", response_model=list[VehicleResponse])
async def get_compatible_vehicles(order_id: int, db: AsyncSession = Depends(get_db)):
    # 1. Get Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    lat, lon = map(float, order.pickup_location.split(','))
    point = Point(lat, lon)
    
    # 2. Get All Zones
    z_res = await db.execute(select(models.Zone))
    zones = z_res.scalars().all()
    
    compatible_vehicles = []
    
    for z in zones:
        try:
            coords = json.loads(z.geometry_coords)
            poly_coords = [(p[0], p[1]) for p in coords]
            polygon = Polygon(poly_coords)
            
            if polygon.contains(point):
                # Found the zone. Get vehicles in this zone.
                v_res = await db.execute(select(Vehicle).where(Vehicle.zone_id == z.id))
                vehs = v_res.scalars().all()
                
                # Filter by capacity
                for v in vehs:
                     if v.max_weight_kg >= order.weight_kg and v.max_volume_m3 >= order.volume_m3:
                          compatible_vehicles.append(v)
        except:
            continue
            
    return [
        VehicleResponse(
            id=v.id,
            vehicle_number=v.vehicle_number,
            max_volume_m3=v.max_volume_m3,
            max_weight_kg=v.max_weight_kg,
            zone_id=v.zone_id,
            current_volume_m3=0.0,
            utilization_percentage=0.0
        ) for v in compatible_vehicles
    ]

from schemas import AssignOrderRequest

@app.post("/orders/{order_id}/assign", response_model=OrderResponse)
async def assign_order(
    order_id: int, 
    request: AssignOrderRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Admin
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can assign orders")

    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Fetch Vehicle
    v_result = await db.execute(select(Vehicle).where(Vehicle.id == request.vehicle_id))
    vehicle = v_result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Update
    order.assigned_vehicle_id = vehicle.id
    order.status = models.OrderStatus.ASSIGNED
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = map(float, order.pickup_location.split(','))

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=vehicle.vehicle_number,
        latitude=lat,
        longitude=lon
    )

@app.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify Ownership
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")

    # Check Status
    if order.status != models.OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    # Update
    order.status = models.OrderStatus.CANCELLED
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = 0.0, 0.0
    if order.pickup_location:
         try:
             lat, lon = map(float, order.pickup_location.split(','))
         except:
             pass

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=None,
        latitude=lat,
        longitude=lon
    )

@app.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify Ownership
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")

    # Check Status
    if order.status != models.OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    # Update
    order.status = models.OrderStatus.CANCELLED
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = 0.0, 0.0
    if order.pickup_location:
         try:
             lat, lon = map(float, order.pickup_location.split(','))
         except:
             pass

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=None,
        latitude=lat,
        longitude=lon
    )

@app.post("/orders/{order_id}/unassign", response_model=OrderResponse)
async def unassign_order(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Admin
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can unassign orders")

    # Fetch Order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Update
    order.assigned_vehicle_id = None
    order.status = models.OrderStatus.PENDING
    
    await db.commit()
    await db.refresh(order)
    
    lat, lon = 0.0, 0.0
    if order.pickup_location:
         try:
             lat, lon = map(float, order.pickup_location.split(','))
         except:
             pass

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        item_name=order.item_name,
        length_cm=order.length_cm,
        width_cm=order.width_cm,
        height_cm=order.height_cm,
        weight_kg=order.weight_kg,
        volume_m3=order.volume_m3,
        status=order.status,
        assigned_vehicle_id=order.assigned_vehicle_id,
        assigned_vehicle_number=None,
        latitude=lat,
        longitude=lon
    )

# Zone Endpoints
from schemas import ZoneCreate, ZoneResponse
from models import Zone

@app.post("/zones", response_model=ZoneResponse)
async def create_zone(zone: ZoneCreate, db: AsyncSession = Depends(get_db)):
    # Flatten geometry to JSON string for simple storage
    geo_str = json.dumps(zone.coordinates)
    
    new_zone = Zone(
        name=zone.name,
        geometry_coords=geo_str
    )
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    
    return ZoneResponse(
        id=new_zone.id,
        name=new_zone.name,
        coordinates=json.loads(new_zone.geometry_coords)
    )

@app.get("/zones", response_model=list[ZoneResponse])
async def read_zones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Zone))
    zones = result.scalars().all()
    return [
        ZoneResponse(
            id=z.id,
            name=z.name,
            coordinates=json.loads(z.geometry_coords)
        ) for z in zones
    ]

@app.delete("/zones/{zone_id}")
async def delete_zone(zone_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify Admin
    if current_user.role != models.UserRole.SUPER_ADMIN:
         raise HTTPException(status_code=403, detail="Only admins can delete zones")
    
    # Fetch Zone
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    # Check for assigned vehicles
    v_res = await db.execute(select(Vehicle).where(Vehicle.zone_id == zone_id))
    vehicles = v_res.scalars().all()
    if vehicles:
        raise HTTPException(status_code=400, detail=f"Cannot delete zone. It has {len(vehicles)} assigned vehicles.")
    
    await db.delete(zone)
    await db.commit()
    return {"message": "Zone deleted successfully"}

# Vehicle Endpoints

@app.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(vehicle: VehicleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_vehicle = Vehicle(
        vehicle_number=vehicle.vehicle_number,
        max_volume_m3=vehicle.max_volume_m3,
        max_weight_kg=vehicle.max_weight_kg,
        zone_id=vehicle.zone_id
    )
    
    db.add(new_vehicle)
    try:
        await db.commit()
        await db.refresh(new_vehicle)
    except Exception as e:
        await db.rollback()
        # Check for unique constraint violation (simplified check)
        if "unique constraint" in str(e).lower() or "integrityerror" in str(e).lower():
             raise HTTPException(status_code=400, detail="Vehicle number already exists")
        raise HTTPException(status_code=500, detail=str(e))
    
    # Ideally fetch zone relationship to populate schema fully, but basic is fine.
    
    return VehicleResponse(
        id=new_vehicle.id,
        vehicle_number=new_vehicle.vehicle_number,
        max_volume_m3=new_vehicle.max_volume_m3,
        max_weight_kg=new_vehicle.max_weight_kg,
        zone_id=new_vehicle.zone_id,
        current_volume_m3=0.0, 
        utilization_percentage=0.0
    )

@app.get("/vehicles", response_model=list[VehicleResponse])
async def read_vehicles(db: AsyncSession = Depends(get_db)):
   # Join with Zone
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Vehicle).options(selectinload(Vehicle.zone)))
    vehicles = result.scalars().all()
    
    response = []
    for v in vehicles:
        zone_resp = None
        if v.zone:
            zone_resp = ZoneResponse(
                id=v.zone.id,
                name=v.zone.name,
                coordinates=json.loads(v.zone.geometry_coords)
            )

        response.append(VehicleResponse(
            id=v.id,
            vehicle_number=v.vehicle_number,
            max_volume_m3=v.max_volume_m3,
            max_weight_kg=v.max_weight_kg,
            zone_id=v.zone_id,
            zone=zone_resp,
            current_volume_m3=0.0, 
            utilization_percentage=0.0
        ))

    return response

@app.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify Admin (Simplistic, leveraging current_user.role)
    if current_user.role != models.UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete vehicles")

    # Fetch Vehicle
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalars().first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
        
    # Check for assigned orders
    order_res = await db.execute(select(Order).where(Order.assigned_vehicle_id == vehicle.id))
    assigned_orders = order_res.scalars().all()
    
    if assigned_orders:
        raise HTTPException(status_code=400, detail=f"Cannot delete vehicle. It has {len(assigned_orders)} assigned orders. Please unassign first.")

    await db.delete(vehicle)
    await db.commit()
    
    return {"message": "Vehicle deleted successfully"}
