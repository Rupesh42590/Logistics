import asyncio
from database import AsyncSessionLocal
from models import User, UserRole, Company
from auth import get_password_hash
from sqlalchemy import select

async def create_msme():
    async with AsyncSessionLocal() as db:
        email = "msme_test@example.com"
        password = "password123"
        
        # Check if exists
        result = await db.execute(select(User).where(User.email == email))
        if result.scalars().first():
            print(f"User {email} already exists.")
            return

        # Create Company first
        new_company = Company(
            name="Test Logistics Co",
            gst_number="29ABCDE1234F1Z5",
            address="123 Test St, Bangalore"
        )
        db.add(new_company)
        await db.flush()

        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.MSME,
            company_id=new_company.id
        )
        
        db.add(new_user)
        await db.commit()
        print(f"MSME user created successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(create_msme())
