# OGBA Product & Implementation Plan

## Current decision
- Treat existing D1 data as disposable test data.
- Purge and reset the database before shipping Clerk-based auth and registration.
- No legacy email migration or dual-support window is required.

## Milestone 1 — Auth foundation (Clerk)

### Goal
Users can create accounts, log in, and have authenticated sessions.

### Scope
- Add Clerk account creation/login UI starting on `register.html`.
- Add login entry points where needed in navigation/registration flow.
- Verify Clerk auth tokens in Worker API endpoints.

### Done criteria
- Unauthenticated users are prompted to sign in before registration actions.
- Authenticated user identity is available in Worker endpoints.

---

## Milestone 2 — Data model reset and Clerk identity

### Goal
Use `clerk_user_id` as the canonical user identity in D1.

### Scope
- Purge test data in D1.
- Recreate tables/columns as needed for clean Clerk-based schema.
- Remove dependency on email as primary key for registration ownership.

### Done criteria
- Registrations are linked to `clerk_user_id`.
- Cancel/edit permissions are based on `clerk_user_id`.

---

## Milestone 3 — Admin authorization via Clerk roles

### Goal
Replace insecure admin password logic with role-based access control.

### Scope
- Remove hardcoded admin password checks in frontend.
- Require authenticated Clerk session for admin page/API actions.
- Gate admin actions with role/claim checks from Clerk metadata.

### Done criteria
- No plaintext admin password in client code.
- Only users with admin role can access admin actions.

---

## Milestone 4 — Transactional emails (Resend)

### Goal
Send reliable transactional emails for registration lifecycle events.

### Scope
- Integrate Resend in Worker backend.
- Send emails for registration confirmation and cancellation.
- Use Clerk-linked user info for recipient identity.

### Done criteria
- Registration/cancellation actions trigger correct email delivery attempts.
- Failures are logged and visible for troubleshooting.

---

## Milestone 5 — Payments (Stripe)

### Goal
Require successful payment to confirm a game registration.

### Scope
- Add Stripe checkout flow to registration path.
- Add Stripe webhook endpoint in Worker.
- Update D1 status only from verified webhook events.

### Done criteria
- Registration moves through explicit statuses (`pending_payment`, `paid`, `canceled`).
- Paid status is written only from webhook verification.

---

## Build order
1. Clerk auth foundation
2. D1 purge + Clerk ID schema reset
3. Admin role auth
4. Resend integration
5. Stripe integration

## Workflow policy
- Keep changes small and milestone-based.
- Land each milestone in separate PRs.
- Update this file when scope changes.
