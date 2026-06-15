# Suler EMS — E2E Walkthrough Log

This file is the running E2E acceptance log per phase. Each phase appends a
self-contained section. The previous phases' detailed sections are maintained
in the operator's local working copy; this committed version forward-tracks
Phase 6 onward so structure stays consistent.

For the architectural rules every phase respects, see [ARCHITECTURE.md](ARCHITECTURE.md).
For phase status, see [task.md](task.md).

Prior phase summaries (signed off):

- **Phase 1 — Database Foundation** ✅ — Postgres + 25-user seed + Finance/Payroll models + domain layer
- **Phase 2 — Leave & Workflow Integration** ✅ — atomic LeaveService, manager+HR approval queue, audit chain
- **Phase 3 — Messaging Integration** ✅ — CommunicationContext API-backed, DMs persisted, announcements role-gated
- **Phase 4 — Finance Module** ✅ — ExpenditureWorkflow, atomic budget disbursement, 409 BUDGET_EXCEEDED, DISBURSED terminal
- **Phase 5 — Payroll Module** ✅ — PayrollRunWorkflow, salary snapshot, idempotent PROCESS via updateMany, reconciliation guard, adjustment auto-apply

---

## Phase 6 — RBAC Hardening *(template — fill after E2E)*

### Changes Made

#### 1. Schema & Seed
- (none required — `User.version` field already exists in schema)
- `seed.ts` updated to grant `payroll:edit` to `FINANCE_MANAGER` *(if not already from Phase 5)*

#### 2. Services
- `RoleService` with four invariants enforced:
  - **C1** Seed role protection — `SUPER_ADMIN`, `HR_ADMIN`, `FINANCE_MANAGER`, `MANAGER`, `EMPLOYEE` cannot be deleted or renamed (409 `SYSTEM_ROLE_PROTECTED`)
  - **C2** SystemEvent + SecurityEvent audit on every grant/revoke
  - **C3** Self-lockout prevention — actor cannot remove their own `role:manage` (or session-essential) permission
  - **C4** ≥1 SUPER_ADMIN invariant — last super admin cannot be downgraded or deactivated

#### 3. API Routes
- `GET /api/admin/roles` — list all roles + their permissions
- `GET /api/admin/roles/[id]` — role detail
- `GET /api/admin/permissions` — list all available permissions
- `POST /api/admin/roles/[id]/permissions/[code]` — grant
- `DELETE /api/admin/roles/[id]/permissions/[code]` — revoke
- `GET /api/auth/session-version` — current `User.version` for caller (used by client poller)

#### 4. Server-side Middleware
- `middleware.ts` — gates `/admin/*`, `/finance/*`, `/payroll/*`, `/governance/*`, `/leave/approvals` server-side via JWT inspection. Returns 403 / redirects before page render.
- API routes keep their own `withAuth` guards — no middleware on `/api/*` to avoid double-checking (ARCHITECTURE.md §3 of Phase 6 decisions).

#### 5. Permission Version Refresh
- Client hook `useSessionVersion` polls `/api/auth/session-version` every 60s.
- On mismatch, calls NextAuth's `session.update()` → JWT regenerated with current DB permissions.
- Every `RoleService.grant/revoke` bumps `User.version` for every user assigned to that role, inside the same transaction.

#### 6. A11y Sweep
- All icon-only buttons (`messaging/ChatComponents.tsx`, finance/payroll/leave pages) now have `type="button"` and `aria-label`.
- ESLint rule `jsx-a11y/control-has-associated-label` added to prevent regression.

#### 7. db:verify Extension
- New check: every workflow definition's `requiredPermission` must be granted to at least one role whose `name` matches the same transition's `requiredRole`. Catches the class of bug that surfaced in Phase 5 (`payroll:edit` missing from `FINANCE_MANAGER`).

---

### E2E Validation Sequence

#### Permission Assignment Flow

```text
TODO after run:
1. Login as admin@suler.com  →  navigate to /admin/roles
2. Grant 'finance:view' to EMPLOYEE role
3. Verify: SystemEvent + SecurityEvent created
4. Verify: every User with EMPLOYEE role has User.version bumped
5. Login as employee@suler.com (in another browser)
6. Within ≤60s, /finance page becomes accessible without manual reload
```

#### Role Update Flow

```text
TODO after run:
1. Login as admin@suler.com  →  /admin/roles  →  pick MANAGER
2. Revoke 'leave:approve'
3. Verify: existing leave requests in MANAGER's queue still visible
4. But: trying to APPROVE returns 403 UNAUTHORIZED_WORKFLOW_ACTION
```

#### Middleware Validation

```text
TODO after run:
1. Unauthenticated request to /finance  →  302 → /login
2. Login as employee@suler.com
3. Request /admin/roles  →  302 → /forbidden?path=/admin/roles (no role:manage permission)
   (proxy.ts gates server-side; the response is a redirect to the
   forbidden landing page, not a literal 403)
4. Request /finance  →  200 (has finance:view)
5. Request /api/finance/budgets without session  →  401 (handled by withAuth, not middleware)
```

#### Self-Lockout Prevention (C3)

```text
TODO after run:
1. Login as admin@suler.com
2. Open /admin/roles, pick SUPER_ADMIN role
3. Attempt to revoke 'role:manage'
4. Expected: 409 SELF_LOCKOUT_PREVENTED
```

#### Last Super Admin (C4)

```text
TODO after run:
1. (DB sanity) confirm only admin@suler.com has SUPER_ADMIN role
2. Attempt to demote admin@suler.com (via role change endpoint)
3. Expected: 409 LAST_SUPER_ADMIN_PROTECTED
4. Verify count(SUPER_ADMIN) remains 1
```

#### System Role Protection (C1)

```text
TODO after run:
1. Attempt to DELETE /api/admin/roles/{HR_ADMIN-id}
2. Expected: 409 SYSTEM_ROLE_PROTECTED
3. All five seed role names still present
```

---

### Database Verification

```text
TODO after run:
npm run db:verify
Expected: ✅ ALL CHECKS PASSED — DB integrity confirmed
New check this phase:
  ✓  Every workflow requiredPermission is granted to a role whose name matches requiredRole
```

---

### Acceptance Gate

- [ ] Roles UI lists 5 roles + 33 permissions, editable matrix
- [ ] Grant/revoke succeeds, creates SystemEvent + SecurityEvent
- [ ] User.version bumped for affected users in same transaction
- [ ] Client picks up grant within 60s polling window (no manual reload)
- [ ] Middleware blocks unauthorized page loads server-side
- [ ] All 4 constraints rejected with correct 409 codes
- [ ] db:verify exits green including new permission-coverage check
- [ ] A11y: no icon-only buttons missing aria-label (lint pass)

---

### Final Status

*(Mark COMPLETE after sign-off.)*
