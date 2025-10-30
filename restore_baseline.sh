#!/bin/bash
# Quick restore script for v1.0-working-baseline

echo "🔄 Restoring OTT Linker to working baseline..."
echo ""

# Navigate to app directory
cd /app

# Show current branch and commit
echo "📍 Current state:"
git log --oneline -1
echo ""

# Confirm restore
echo "⚠️  This will restore code to v1.0-working-baseline"
echo "   (All API integrations complete, before UI redesign)"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Restore cancelled"
    exit 1
fi

# Restore code
echo "📦 Restoring code from Git tag..."
git checkout v1.0-working-baseline

# Restore database
echo "💾 Restoring database..."
cd /app/backend
python backup_database.py restore /app/database_backups/backup_20251030_064808.json

# Restart services
echo "🔄 Restarting services..."
sudo supervisorctl restart all
sleep 3

# Check status
echo ""
echo "✅ Restore complete!"
echo ""
echo "📊 Service status:"
sudo supervisorctl status

echo ""
echo "🧪 Testing API..."
curl -s http://localhost:8001/api/ | python3 -m json.tool

echo ""
echo "🎉 Baseline restored successfully!"
echo "   Git tag: v1.0-working-baseline"
echo "   Commit: cc22331"
echo "   All API integrations working"
echo ""
echo "📖 See /app/RESTORE_BASELINE.md for details"
