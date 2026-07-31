import asyncio
from sqlalchemy import text
from app.core.database import engine

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
        tables = [row[0] for row in result.fetchall()]
        print('Existing tables:', tables)
        print('Count:', len(tables))
        expected = [
            'websites', 'website_scan_history', 'wordpress_plugins', 'wordpress_themes',
            'website_ssl', 'hosting_information', 'website_health', 'website_dns', 'website_security'
        ]
        for t in expected:
            if t in tables:
                print(f'OK: {t}')
            else:
                print(f'MISSING: {t}')

asyncio.run(check())
