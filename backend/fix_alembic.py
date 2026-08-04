import asyncio
from sqlalchemy import text
from app.core.database import engine

async def fix():
    async with engine.connect() as conn:
        await conn.execute(text("DELETE FROM alembic_version WHERE version_num = 'f2a3b4c5d6e7'"))
        await conn.commit()
        print('Removed f2a3b4c5d6e7 from alembic_version')

asyncio.run(fix())
