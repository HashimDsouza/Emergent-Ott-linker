#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def fix_link():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # Fix Netflix India link
    result = await db.feed_items.update_one(
        {'title': {'$regex': 'Netflix India November 2025'}},
        {'$set': {'source_url': 'https://www.siasat.com/list-of-20-movies-shows-trending-on-netflix-india-nov-2025-3297786/'}}
    )
    
    print(f'✅ Fixed Netflix India link: {result.modified_count} updated')
    
    # Verify
    item = await db.feed_items.find_one({'title': {'$regex': 'Netflix India'}})
    if item:
        print(f'   New URL: {item["source_url"]}')
    
    client.close()

asyncio.run(fix_link())
