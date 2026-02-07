import asyncio
from database import engine
from models import User
from sqlalchemy import select

async def check_users():
    async with engine.begin() as conn:
        result = await conn.execute(select(User))
        users = result.scalars().all()
        print(f'User count: {len(users)}')

if __name__ == '__main__':
    asyncio.run(check_users())
