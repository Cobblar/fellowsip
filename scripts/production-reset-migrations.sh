#!/bin/bash
# Script to reset and properly bootstrap migrations on production
# This will clear the migration history and re-apply all migrations properly

set -e

echo "=========================================="
echo "RESETTING MIGRATION SYSTEM"
echo "=========================================="
echo ""
echo "This will:"
echo "1. Clear the migration tracking table"
echo "2. Re-apply ALL migrations from scratch"
echo "3. Properly track which migrations have been applied"
echo ""
echo "⚠️  WARNING: This will re-run migration SQL"
echo "⚠️  Existing columns/tables will be skipped (safe)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Clearing migration history..."
cd /opt/apps/fellowsip
node -e "import('postgres').then(m => { const sql = m.default('postgresql://fellowsip:fellowsip_dev@localhost:5432/fellowsip'); sql\`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE\`.then(() => { console.log('✓ Cleared migration history'); process.exit(0); }); })"

echo ""
echo "Step 2: Re-applying all migrations properly..."
npm run db:bootstrap

echo ""
echo "Step 3: Verifying migration system..."
npm run db:migrate

echo ""
echo "=========================================="
echo "✅ Migration system reset complete!"
echo "=========================================="
echo ""
echo "All migrations have been properly applied."
echo "Future deployments will work correctly."
echo ""
