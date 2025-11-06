import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_rating_fields():
    """Fix rating fields that are set to 'N/A' string"""
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    # Find all content with rating as string "N/A"
    result = await db.content.update_many(
        {"rating": "N/A"},
        {"$set": {"rating": 0.0}}
    )
    
    print(f"✅ Updated {result.modified_count} documents with rating='N/A' to rating=0.0")
    
    # Also check for any other string values in rating field
    cursor = db.content.find({"rating": {"$type": "string"}})
    string_ratings = await cursor.to_list(length=None)
    
    if string_ratings:
        print(f"\n⚠️  Found {len(string_ratings)} more documents with string rating values:")
        for doc in string_ratings[:5]:  # Show first 5
            print(f"  - {doc['title']}: rating={doc.get('rating')}")
        
        # Fix all string ratings to 0.0
        result2 = await db.content.update_many(
            {"rating": {"$type": "string"}},
            {"$set": {"rating": 0.0}}
        )
        print(f"✅ Updated {result2.modified_count} more documents with string ratings to 0.0")
    else:
        print("✅ No other string rating values found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_rating_fields())
