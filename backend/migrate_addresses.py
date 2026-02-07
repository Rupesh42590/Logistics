import asyncio
from database import engine, Base
from models import Address

async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Migration complete')

if __name__ == '__main__':
    asyncio.run(migrate())
