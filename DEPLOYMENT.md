# Deployment Checklist

## First-Time Setup (One-Time Only)

After pushing the new migration system to production, you need to bootstrap the database:

```bash
# SSH into production server
ssh cobbler@192.168.1.43

# Navigate to app directory
cd /opt/apps/fellowsip

# Run the bootstrap script (one-time only)
bash scripts/production-bootstrap.sh
```

This will:
1. Mark all existing migrations as applied in the database
2. Verify the migration system is working correctly

**You only need to do this ONCE** after deploying the new migration system.

## Regular Deployment Workflow

### 1. Making Database Changes

When you need to change the database schema:

```bash
# 1. Edit the schema file
vim packages/server/src/db/schema.ts

# 2. Generate migration
cd packages/server
npx drizzle-kit generate

# 3. Test migration locally
cd ../..
npm run db:migrate

# 4. Commit BOTH schema and migration files
git add packages/server/src/db/schema.ts
git add packages/server/drizzle/
git commit -m "Add new database column for X"
```

### 2. Deploying to Production

```bash
# Push to production (triggers automatic deployment)
git push production main
```

The post-receive hook will automatically:
1. ✅ Pull latest code
2. ✅ Update the post-receive hook itself
3. ✅ Install dependencies
4. ✅ **Run database migrations** (`npm run db:migrate`)
5. ✅ Build the application
6. ✅ Restart PM2 processes

### 3. Verify Deployment

```bash
# Check PM2 status
ssh cobbler@192.168.1.43 "pm2 status"

# Check application logs
ssh cobbler@192.168.1.43 "pm2 logs fellowsip-server --lines 50"

# Verify database migration
ssh cobbler@192.168.1.43 "cd /opt/apps/fellowsip && npm run db:migrate"
```

## Troubleshooting

### Migration fails during deployment

```bash
# SSH to production
ssh cobbler@192.168.1.43

# Navigate to app directory
cd /opt/apps/fellowsip

# Check what went wrong
npm run db:migrate

# If needed, manually apply migrations
npm run db:migrate
pm2 restart ecosystem.config.js
```

### "relation already exists" error

This means a table already exists but the migration system doesn't know about it:

```bash
# SSH to production
ssh cobbler@192.168.1.43
cd /opt/apps/fellowsip

# Mark existing migrations as applied
npm run db:bootstrap

# Try migration again
npm run db:migrate
```

### Rollback a deployment

```bash
# SSH to production
ssh cobbler@192.168.1.43
cd /opt/apps/fellowsip

# Reset to previous commit
git reset --hard HEAD~1

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart ecosystem.config.js
```

**Note**: Database migrations are NOT automatically rolled back. You'll need to manually revert schema changes if needed.

## What Changed?

### Before (Manual System)
- ❌ Manual `fix-db-columns.ts` script
- ❌ Had to manually update script for each schema change
- ❌ Script could get out of sync with schema
- ❌ No migration history tracking
- ❌ Errors were ignored (`|| echo "continuing..."`)

### After (Drizzle Migrations)
- ✅ Automatic migration generation from schema
- ✅ Schema is the single source of truth
- ✅ Migration history tracked in database
- ✅ Migrations fail loudly if there's an issue
- ✅ Proper rollback capability

## Files Changed

- `scripts/post-receive` - Now runs `npm run db:migrate` instead of `db:fix`
- `scripts/migrate-db.ts` - New: Runs Drizzle migrations
- `scripts/bootstrap-migrations.ts` - New: One-time setup script
- `scripts/production-bootstrap.sh` - New: Production setup helper
- `package.json` - Added `db:migrate` and `db:bootstrap` scripts
- `MIGRATIONS.md` - New: Migration system documentation

## Important Notes

1. **Always generate migrations** when changing the schema
2. **Always commit migration files** along with schema changes
3. **Test migrations locally** before pushing to production
4. **The bootstrap script** only needs to be run once per environment
5. **The old `db:fix` script** is deprecated but kept for reference
