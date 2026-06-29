# Layero Branch Migration Guide

## Current State

- **GitHub default branch:** `main`
- **Layero PRODUCTION branch:** `master` (from screenshot)
- **Layero preview branch:** `main`

## Safe Migration Steps

1. **Verify `origin/main` is ready**
   - Local checks pass: `npm run typecheck`, `npm run test`, `npm run build`
   - 64 unit tests passing

2. **Check preview deployment**
   - Open Layero dashboard
   - Verify `main` preview deployment works
   - Test `GET /healthz` endpoint on preview

3. **Switch Layero production branch**
   - In Layero dashboard:
     - Go to project settings
     - Change production branch from `master` to `main`
     - OR create new production deployment from `main` and switch traffic

4. **Verify production**
   - Test `GET /healthz` on production URL
   - Verify MCP connection in dry-run mode only
   - Check Layero deployment logs

5. **After confirming production works**
   ```bash
   git push origin --delete master
   ```

6. **Verify branch cleanup**
   - Check `git fetch && git branch -r` shows no `origin/master`
   - Confirm Layero has no broken deployments

## Warning

**Do NOT delete `origin/master` until:**
- Production deployment switched to `main` AND verified working
- You have explicit confirmation that `master` is no longer needed

## References

- CI workflow: `.github/workflows/ci.yml` (triggers on `main`)
- Infrastructure docs: `docs/INFRASTRUCTURE.md`
- Schema audit: `docs/SCHEMA_AUDIT.md`