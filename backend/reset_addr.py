import asyncio
import os, sys
sys.path.append(os.getcwd())
from database import engine, Base
import models
from sqlalchemy import text
from models import Address

async def main():
    try:
        async with engine.begin() as conn:
            print('Dropping addresses table...')
            await conn.execute(text('DROP TABLE IF EXISTS addresses CASCADE'))
            print('Dropped table')
            # Wait for drop?
        
        async with engine.begin() as conn:
            print('Recreating tables...')
            await conn.run_sync(Base.metadata.create_all)
            print('Recreated tables')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    asyncio.run(main())
