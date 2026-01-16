from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey
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
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.MSME)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    company = relationship("Company", back_populates="users")
    orders = relationship("Order", back_populates="user")

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
    
    # pickup_location = Column(Geometry("POINT"), nullable=False)
    pickup_location = Column(String, nullable=True) # Mocking geometry
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    user = relationship("User", back_populates="orders")
    vehicle = relationship("Vehicle", back_populates="orders")
