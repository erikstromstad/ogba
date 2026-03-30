# OGBA project instructions

## Goals
Keep this site simple, stable, and easy to maintain.

## Stack
- HTML/CSS/JS frontend
- Cloudflare Worker backend
- Cloudflare D1 database

## Rules
- Make minimal changes.
- Do not introduce frameworks unless explicitly requested.
- Preserve existing file structure.
- Prefer full-file replacement only when necessary.
- For backend changes, explain any required D1 migration.
- For frontend changes, preserve responsive behavior.
- Do not add auth or payment logic unless explicitly requested.
- Avoid breaking the index hero section when editing CSS.

## Key files
- worker.js
- style.css
- index.html
- runs.html
- admin.html