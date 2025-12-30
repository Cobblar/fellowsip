---
description: How to deploy changes to production
---

# Deployment Workflow

## IMPORTANT: Always Ask Before Pushing to Production

**Never push to production without explicit user approval.** This includes:
- `git push origin main` (when origin includes production remote)
- `git push production main`
- Running any commands on the production server that modify state

## Deployment Steps

1. **Make changes locally** - Write code, test locally
2. **Commit changes** - `git add -A && git commit -m "message"`
3. **ASK USER** - "Ready to deploy to production?" - Wait for approval
4. **Push to production** - Only after user confirms:
   ```bash
   git push origin main
   ```

## What Happens on Deploy

The post-receive hook runs:
1. Pulls code to `/opt/apps/fellowsip`
2. Runs `npm install`
3. Runs `npm run db:push` (syncs database schema)
4. Runs `npm run build`
5. Restarts PM2 processes

## Database Migrations

- Schema changes are applied via `db:push` during deployment
- This is safe - it only adds/modifies columns, doesn't delete data
- If manual migration is needed, use `scripts/fix-db-columns.ts`

## Production Server Access

```bash
# SSH into production
ssh root@192.168.1.43

# Check logs
pm2 logs fellowsip-server --lines 50

# Restart services
pm2 restart all
```
