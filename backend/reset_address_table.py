import asyncio
from database import engine, Base
from models import Address
from sqlalchemy import text

async def reset_address_table():
    async with engine.begin() as conn:
        print('Dropping addresses table...')
        await conn.execute(text('DROP TABLE IF EXISTS addresses CASCADE'))
        print('Recreating tables...')
        await conn.run_sync(Base.metadata.create_all)
    print('Reset complete')

if __name__ == '__main__':
    asyncio.run(reset_address_table())
