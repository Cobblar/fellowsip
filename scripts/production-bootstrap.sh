#!/bin/bash
# One-time script to bootstrap the production database migration system
# Run this ONCE on the production server after deploying the new migration system

set -e

echo "=========================================="
echo "Production Database Migration Bootstrap"
echo "=========================================="
echo ""
echo "This script will:"
echo "1. Mark all existing migrations as applied"
echo "2. Verify the migration system is working"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Marking existing migrations as applied..."
npm run db:bootstrap

echo ""
echo "Step 2: Verifying migration system..."
npm run db:migrate

echo ""
echo "=========================================="
echo "✅ Bootstrap complete!"
echo "=========================================="
echo ""
echo "The migration system is now ready."
echo "Future deployments will automatically apply new migrations."
echo ""
