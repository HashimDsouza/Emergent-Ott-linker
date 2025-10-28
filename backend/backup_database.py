"""
Database backup script - Export all MongoDB data to JSON
Run this periodically to backup your content and users
"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def backup_database():
    """Backup all collections to JSON files"""
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    backup_dir = Path("/app/database_backups")
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    collections = ["content", "users", "community_messages", "title_links", "chats"]
    
    backup_data = {}
    total_docs = 0
    
    for collection_name in collections:
        try:
            docs = await db[collection_name].find({}, {"_id": 0}).to_list(10000)
            backup_data[collection_name] = docs
            total_docs += len(docs)
            print(f"✅ Backed up {collection_name}: {len(docs)} documents")
        except Exception as e:
            print(f"⚠️  Warning: {collection_name} backup failed: {str(e)}")
            backup_data[collection_name] = []
    
    # Save to file
    backup_file = backup_dir / f"backup_{timestamp}.json"
    with open(backup_file, 'w') as f:
        json.dump(backup_data, f, indent=2)
    
    # Also save latest backup
    latest_file = backup_dir / "backup_latest.json"
    with open(latest_file, 'w') as f:
        json.dump(backup_data, f, indent=2)
    
    print(f"\n🎉 Backup complete!")
    print(f"   Total documents: {total_docs}")
    print(f"   Saved to: {backup_file}")
    print(f"   Latest: {latest_file}")
    
    client.close()

async def restore_database(backup_file: str = "/app/database_backups/backup_latest.json"):
    """Restore database from backup file"""
    
    if not Path(backup_file).exists():
        print(f"❌ Backup file not found: {backup_file}")
        return
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    with open(backup_file, 'r') as f:
        backup_data = json.load(f)
    
    total_restored = 0
    
    for collection_name, docs in backup_data.items():
        if docs:
            await db[collection_name].delete_many({})  # Clear existing
            await db[collection_name].insert_many(docs)
            total_restored += len(docs)
            print(f"✅ Restored {collection_name}: {len(docs)} documents")
    
    print(f"\n🎉 Restore complete! {total_restored} documents restored")
    
    client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        backup_file = sys.argv[2] if len(sys.argv) > 2 else "/app/database_backups/backup_latest.json"
        asyncio.run(restore_database(backup_file))
    else:
        asyncio.run(backup_database())
