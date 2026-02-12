from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
# from geoalchemy2 import Geometry
import enum
from database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    MSME = "MSME"
    DRIVER = "DRIVER"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    gst_number = Column(String, nullable=False)
    address = Column(String, nullable=False)
    
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.MSME)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee_id = Column(String, unique=True, index=True, nullable=True)
    
    company = relationship("Company", back_populates="users")
    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user")

class Zone(Base):
    __tablename__ = "zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # Storing simple list of coords for now: "lat,lng;lat,lng..."
    geometry_coords = Column(String, nullable=False) 
    
    vehicles = relationship("Vehicle", back_populates="zone")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, nullable=False)
    max_volume_m3 = Column(Float, nullable=False)
    max_weight_kg = Column(Float, nullable=False)
    
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    zone = relationship("Zone", back_populates="vehicles")
    
    # New driver association
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Optional relationship to User (driver)
    driver = relationship("User", backref="vehicles")
    
    orders = relationship("Order", back_populates="vehicle")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_name = Column(String, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    length_cm = Column(Float, nullable=False)
    width_cm = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    
    volume_m3 = Column(Float, nullable=False)
    
    # Locations
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)
    pickup_address = Column(String, nullable=True)
    
    drop_latitude = Column(Float, nullable=True)
    drop_longitude = Column(Float, nullable=True)
    drop_address = Column(String, nullable=True)

    pickup_location = Column(String, nullable=True) # Kept for legacy support if needed
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    # Dual Confirmation Flags
    driver_confirmed_delivery = Column(Boolean, default=False)
    user_confirmed_delivery = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")

class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=True) # e.g. "Home", "Office"
    recipient_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)
    
    # Simplified address storage as per user request (focus on lat/long + single string)
    address_line1 = Column(String, nullable=True) 
    pincode = Column(String, nullable=True)
    city = Column(String, nullable=True) 
    state = Column(String, nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    user = relationship("User", back_populates="addresses")

# Update User model to include addresses relationship
User.addresses = relationship("Address", back_populates="user")
