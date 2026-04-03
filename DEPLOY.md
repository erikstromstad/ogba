# OGBA Deploy Guide (GitHub + Cloudflare Workers)

This repo deploys from GitHub to Cloudflare Workers.

## One-time Cloudflare build settings

In Cloudflare → Workers → `ogba` → Build:

- **Git repository**: `erikstromstad/ogba`
- **Production branch**: `main`
- **Build command**: `None`
- **Deploy command**: `npx wrangler deploy`
- **Root directory**: `/`

The `wrangler.jsonc` file in this repo provides the Worker name, compatibility date, and assets directory.

---

## Normal workflow for changes

1. Create a feature branch from `main`.
   - Example: `feat/admin-player-toggle`
2. Make your code changes.
3. Commit and push branch.
4. Open PR into `main`.
5. Resolve merge conflicts if any.
6. Wait for Cloudflare check to pass.
7. Merge PR.
8. Confirm production deploy in Cloudflare and test site.

---

## Quick merge-conflict rule for this repo

When both branches edit the same line, keep the version that matches the intended UX.

Example for admin player toggle:
- keep `Expand Players` for collapsed state
- keep `Collapse` for expanded state

---

## If deployment fails

Open PR → Cloudflare bot comment → **View logs**.

Common errors and fixes:

### `Missing entry-point to Worker script or to assets directory`
- Ensure `wrangler.jsonc` exists at repo root.
- Ensure it includes:
  - `name`: `ogba`
  - `assets.directory`: `.`
- Ensure Cloudflare deploy command is `npx wrangler deploy`.

### `A compatibility_date is required`
- Ensure `wrangler.jsonc` includes `compatibility_date`.
- Use a real date in `YYYY-MM-DD` format.

### Worker name mismatch warning
- Ensure `wrangler.jsonc` `name` matches Worker project name (`ogba`).

---

## Compatibility date guidance

- `compatibility_date` is a Worker runtime baseline, not an expiration date.
- Using today's date is safe for tomorrow and future days.
- Update it only when you intentionally want newer runtime behavior.
- A simple schedule is to review and update every 1–3 months.

---

## Solo-developer GitHub branch protection (recommended)

For `main`:
- Require pull request before merging: **ON**
- Required approvals: **0** (solo-friendly)
- Block force pushes: **ON**
- Block deletions: **ON**
- Require status checks: **ON** after checks are stable
