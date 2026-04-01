# OGBA project instructions

## Goals
Keep this site simple, stable, and easy to maintain.

## Stack
- HTML/CSS/JS frontend
- Cloudflare Worker backend
- Cloudflare D1 database

## Planning source of truth
- Follow `PLANS.md` for product and implementation sequence.
- Current direction: reset test data and rebuild auth around Clerk IDs.

## Rules
- Make minimal changes.
- Do not introduce frameworks unless explicitly requested.
- Preserve existing file structure unless a milestone requires otherwise.
- Prefer focused edits over broad rewrites.
- For backend changes, explain required D1 schema changes clearly.
- For frontend changes, preserve responsive behavior.
- Avoid breaking the index hero section when editing CSS.

## Security rules
- Never store plaintext admin passwords in frontend code.
- Use Clerk auth/roles for admin access once auth milestone starts.
- For payments, treat Stripe webhooks as source of truth for paid status.

## Data policy
- Existing D1 data is disposable test data.
- It is acceptable to purge/reset D1 during Clerk migration milestones.
- No temporary dual-support migration is required for legacy email identity.

## Delivery workflow
- Implement one milestone at a time from `PLANS.md`.
- Keep PRs small and scoped.
- Include a short test checklist for each change.
- If a change touches deployment behavior, update `DEPLOY.md` in the same PR.

## Key files
- worker.js
- style.css
- index.html
- runs.html
- admin.html
- DEPLOY.md
- PLANS.md
- wrangler.jsonc