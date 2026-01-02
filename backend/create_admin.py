import asyncio
from database import AsyncSessionLocal
from models import User, UserRole
from auth import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@example.com"
        
        # Check if exists
        result = await db.execute(select(User).where(User.email == admin_email))
        if result.scalars().first():
            print(f"Admin user {admin_email} already exists.")
            return

        new_user = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            role=UserRole.SUPER_ADMIN,
            company_id=None # Admins don't belong to an MSME company
        )
        
        db.add(new_user)
        await db.commit()
        print(f"Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
