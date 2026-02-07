from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from models import UserRole, OrderStatus

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MSME

class UserCreate(UserBase):
    password: str
    company_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    company_id: Optional[int] = None
    company: Optional['CompanyResponse'] = None
    
    class Config:
        from_attributes = True

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    gst_number: str
    address: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

# Vehicle Schemas
# Zone Schemas
class ZoneBase(BaseModel):
    name: str
    # Expecting list of lat/lng objects or list of lists for GeoJSON
    coordinates: List[Any] 

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: int
    
    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    vehicle_number: str
    max_volume_m3: float
    max_weight_kg: float
    zone_id: Optional[int] = None
    driver_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    max_volume_m3: Optional[float] = None
    max_weight_kg: Optional[float] = None
    zone_id: Optional[int] = None
    driver_id: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int
    current_volume_m3: float = 0.0 
    utilization_percentage: float = 0.0
    zone: Optional[ZoneResponse] = None
    
    class Config:
        from_attributes = True

# Driver Schemas
class DriverBase(BaseModel):
    name: str

class DriverCreate(DriverBase):
    employee_id: str
    vehicle_number: Optional[str] = None
    password: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    employee_id: Optional[str] = None
    role: UserRole = UserRole.DRIVER
    vehicle_number: Optional[str] = None
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    item_name: Optional[str] = None
    length_cm: float
    width_cm: float
    height_cm: float
    weight_kg: float
    # pickup_location as lat/lon dict?
    pickup_latitude: float
    pickup_longitude: float
    pickup_address: Optional[str] = None

    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    drop_address: Optional[str] = None

    # Legacy (mapped to pickup in main.py if needed, or just removed if we update frontend)
    # We will try to allow frontend to send generic lat/lon but prefer specific.
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    user_id: int
    status: OrderStatus
    volume_m3: float
    assigned_vehicle_id: Optional[int] = None
    assigned_vehicle_number: Optional[str] = None
    
    class Config:
        from_attributes = True


class AssignOrderRequest(BaseModel):
    vehicle_id: int

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# Address Schemas
class AddressBase(BaseModel):
    label: Optional[str] = "Office"
    recipient_name: str
    mobile_number: Optional[str] = None
    address_line1: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float
    longitude: float

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
