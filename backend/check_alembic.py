import asyncio
from sqlalchemy import text, inspect
from app.core.database import engine

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alembic_version' ORDER BY ordinal_position"))
        columns = result.fetchall()
        print('alembic_version columns:', columns)
        
        result = await conn.execute(text('SELECT * FROM alembic_version'))
        rows = result.fetchall()
        print('alembic_version rows:', rows)

asyncio.run(check())
