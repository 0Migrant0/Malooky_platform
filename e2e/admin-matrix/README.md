# Admin action matrix (end-to-end)

Automated end-to-end test that exercises **every** action in
`src/app/api/admin/action/route.ts` against a live server and asserts the
resulting database state through the Supabase REST API (service-role key).

## What it covers

| Suite | Checks | Actions |
| --- | --- | --- |
| `suite-auth.js` | login, cookie issue, token TTL, `/api/me`, anonymous 403, `/dash` render, tampered-token refresh + cookie rotation, refresh redirect hardening | — |
| `suite-content.js` | courses → levels → lessons → video attach → publish/unpublish → deletes, coupons, packages, payment toggle + instructions, testimonials/top students/works/FAQ, retired VIP guards | 15 |
| `suite-people.js` | createUser, student login + 403, setRole promote/demote, grant/revoke, approveOrder/rejectOrder with access grants, consult lifecycle, audit log coverage + actor | 8 |

Assertions check **both** the HTTP response and the DB rows (via a separate
service-role REST read), so a 200 that silently wrote nothing still fails.

Before any network traffic, the runner statically compares the `case "..."`
statements in the action route against its coverage list and fails the run if
an action is uncovered (or the list goes stale) — so a newly added action can
never slip past the matrix unnoticed.

## Running against staging

```bash
BASE_URL=https://your-staging-host npm run test:e2e
```

- `BASE_URL` is required (no default) — point it at a **staging** server, not
  production: the suite writes and deletes test rows.
- Supabase URL + keys are read from the repo `.env` (`NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and can be
  overridden with environment variables.

## Isolation & cleanup

Every run creates its own temporary admin
(`temp-admin-e2e-<timestamp>@test.malooky.dev`), uses timestamped names for
courses/students/consults so it can never collide with leftover data, and
`teardown()` deletes exactly what the run created (accounts, courses, access,
orders, consults, coupons, audit rows) — even when a check fails mid-run.
Cleanup failure makes the run exit non-zero so leaks can't go unnoticed.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | all checks passed, cleanup complete |
| 1 | one or more checks failed, or cleanup leaked rows |
| 2 | setup/runtime error (server unreachable, missing config) |
