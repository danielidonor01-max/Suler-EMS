# Suler EMS — Architectural Rules

This document is the single source of truth for the architectural rules every
contributor (human or AI) must follow. Rules are derived from concrete incidents
in the codebase's history; each one exists because violating it broke something.

If you disagree with a rule, propose a change here **before** writing code that
violates it.

---

## 1. Workflow is an implementation detail. The client never touches it.

**Rule:** Any feature that involves approval or state transitions (Leave,
Expenditure, PayrollRun, Asset Request, Overtime, Purchase Request, etc.) MUST
funnel every mutation through a single domain endpoint. The client does **not**
know `WorkflowInstance` or `WorkflowAuditEntry` exist.

**Correct:**

```
POST /api/leave/requests           — LeaveService.submitLeave()
PATCH /api/finance/expenditures/[id]/transition  — ExpenditureService.transitionExpenditure()
```

**Wrong:**

```
POST /api/leave/requests           — creates LeaveRequest only
POST /api/workflows                — client then creates WorkflowInstance
```

**Why:** Atomicity (a half-created resource without its workflow is
unrecoverable). Reusability (every approval domain follows the same shape).
Audit guarantees (only the service knows how to write a complete audit entry).

**How to apply:** Each domain lives in `src/modules/<domain>/domain/<domain>.service.ts`.
Services use `prisma.$transaction` for any multi-table write. Routes are thin:
validate (Zod) → call service → return.

---

## 2. Workflow role names are canonical. Use `HR_ADMIN`, not `HR`.

**Rule:** All workflow guards, `requiredRole` fields, and RBAC string
comparisons MUST use the exact role names seeded in the database:

```
SUPER_ADMIN, HR_ADMIN, FINANCE_MANAGER, MANAGER, EMPLOYEE
```

**Why:** A prior Phase 2 bug used `requiredRole: 'HR'` while the database
seeded `HR_ADMIN`. Result: the UI rendered the approval button, the user
clicked it, the engine silently rejected the transition. Visible UI + failed
approvals = the worst kind of bug.

**How to apply:**
- Workflow definitions (`src/modules/workflow/definitions/*.workflow.ts`)
  reference these names exactly.
- `RoleName` type in `src/modules/auth/domain/role.model.ts` is the strict
  authoritative list — extending it requires updating the seed in lockstep.
- Employee policy (`src/policies/employee.policy.ts`) MAY recognize multiple
  display aliases (e.g. legacy `'HR'`) for **visibility** rules, but workflow
  routing must use the canonical names.
- `npm run db:verify` asserts every workflow definition's `requiredRole`
  resolves to a seeded `Role.name`.

---

## 3. Terminal states are irreversible.

**Rule:** Once a workflow reaches a terminal state, no transitions, no edits,
no field mutations, no recalculation are allowed. Mistakes are corrected by
creating a **new** resource, not by mutating history.

| Workflow | Terminal states |
|---|---|
| Leave | `APPROVED`, `REJECTED`, `CANCELLED` |
| Expenditure | `DISBURSED`, `REJECTED`, `CANCELLED` |
| Payroll Run | `PROCESSED`, `CANCELLED` |

**Why:** Audit trail integrity. If money has been disbursed or payroll has
been processed, the historical record must match what actually happened.

**How to apply:**
- Workflow definition: terminal states have empty `allowedActions: []`.
- Domain models that record post-action data (PaymentDate, ProcessedAt) are
  set inside the same `$transaction` as the state change and never updated
  afterward.
- No service method may take `id` and a terminal-state row and rewrite fields.

---

## 4. Multi-table writes are atomic.

**Rule:** Whenever a single business action touches more than one table, wrap
it in `prisma.$transaction(async (tx) => { ... })`. No exceptions.

**Examples in the codebase:**
- `LeaveService.submitLeave`: LeaveRequest + WorkflowInstance + audit entry + link.
- `ExpenditureService.transitionExpenditure`: workflow state + resource status +
  Budget.spentAmount + BudgetCategory.spentAmount (on DISBURSE).
- `PayrollService.processRun`: run status + all entries' status + adjustments
  `PENDING → APPLIED`.

**Why:** A failure mid-write leaves the system in a state where invariants
break — e.g. an expenditure marked DISBURSED but the budget not incremented.
Every invariant in `npm run db:verify` exists because someone broke it once.

**How to apply:**
- Reads can be outside the transaction.
- Anything that modifies more than one row across more than one model goes
  inside.
- Pre-flight checks that depend on current state (e.g. budget balance) must
  be re-read **inside** the transaction to avoid TOCTOU.

---

## 5. Snapshot, don't recompute.

**Rule:** When a resource records the result of a calculation (payslip,
expenditure amount, audit entry, payroll entry), the inputs are **frozen** at
creation. Later changes to source data MUST NOT retroactively change the
record.

**Examples:**
- `PayrollEntry` stores `basicSalary`, `housingAllowance`, etc. as columns —
  not a foreign key to `SalaryStructure`. A July payslip remains a July
  payslip even after an August raise.
- `PayrollRun.rateSnapshot` stores the statutory rates used. Re-running the
  same calc in 2027 produces the same numbers.
- `Expenditure.amount` is set on submit and never updated.
- `WorkflowAuditEntry.fromState` / `toState` / `actorName` / `actorRole` are
  inlined strings, not relations — the audit record survives an actor being
  renamed or a state being removed from the workflow definition.

**How to apply:**
- New tables that record a "what happened" snapshot copy the inputs they
  needed. They do not reference source rows.
- New tables that record "the current state of a thing" use relations.

---

## 6. Idempotent state transitions.

**Rule:** State-change endpoints must be safe to call twice. The second call
returns `409 INVALID_STATE_TRANSITION`, not a duplicate side-effect.

**Why:** Double-clicks, network retries, browser refresh on a confirmation
page. Disbursing twice or processing payroll twice corrupts financial state.

**How to apply:**
- The workflow engine rejects transitions from the current state if the target
  isn't allowed from there. After a successful PROCESS, the state is
  `PROCESSED` and `APPROVED → PROCESSED` is no longer a valid edge.
- Inside the transaction, services that perform large side-effects (e.g.
  payroll process) should use `prisma.<model>.updateMany({ where: { id, status: <expected> }, data: ... })`
  and check the returned `count`. If `count === 0`, throw `409` — someone got
  there first. This guards against the race between two concurrent transitions
  that both read `status = APPROVED` at the same instant.

---

## 7. Money: `number` in the domain, `Decimal(18,2)` in Prisma.

**Rule:** All money-bearing columns in Prisma use `Decimal(18,2)`. Domain code
(services, calc functions) uses plain `number`. Repository methods cast at
the boundary.

**Why:** Prisma's `Decimal` is a string-backed wrapper that doesn't arithmetic
naturally — `a + b` on two Decimals concatenates strings. Plain `number` is
safe for NGN amounts well below `Number.MAX_SAFE_INTEGER`.

**How to apply:**
- Service reads: `Number(prismaRow.amount)`. Helper: `dec()` in `verify.ts`.
- Service writes: `await tx.expenditure.update({ data: { amount: 1234 } })` —
  Prisma accepts `number` and casts.
- Calculation modules (`computePayroll`, `calculatePAYE`) are pure functions
  over `number`.

---

## 8. Approval queues clone, they don't reinvent.

**Rule:** Every approval queue page is structurally identical:

```
/leave/approvals
/finance/approvals
/payroll/approvals
```

Same `useSWR` + 15s polling, same row layout with inline reject composer,
same `apiMutate` to `PATCH /<domain>/[id]/transition`, same banner-error
pattern.

**Why:** Behavior consistency across domains. A user who learned to approve
leave already knows how to approve expenditures and payroll. Code consistency
makes bugs in one domain visible in others.

**How to apply:** When adding a new approval-bearing domain, copy
`src/app/(dashboard)/finance/approvals/page.tsx` and rename. Diverge only when
the domain requires it (e.g. payroll shows entry counts and total amounts in
the row).

---

## 9. Polling first, WebSockets later.

**Rule:** UI freshness comes from periodic polling (`useApi` with `pollMs`).
WebSockets, SSE, and Redis pub/sub stay parked until a concrete pilot
requirement justifies the operational cost.

**Polling cadence by criticality:**

| Surface | Poll |
|---|---|
| Messages (open thread) | 5s |
| Conversation list | 10s |
| Approval queues | 15s |
| Dashboards / KPIs | 30s |
| Budget / payroll lists | 30s |
| Audit feed | 30s |

**Why:** Polling is observable in DevTools, reproducible, debuggable.
WebSockets fail silently on flaky networks and require server-side state. We
add them when a feature actually requires sub-second freshness — not pre-emptively.

---

## 10. System roles and invariants are sacred.

**Rule:** The five seeded role names —
`SUPER_ADMIN`, `HR_ADMIN`, `FINANCE_MANAGER`, `MANAGER`, `EMPLOYEE` — are
**system roles**. They cannot be renamed, deleted, or have their identity
mutated by any API call. Their **permissions** can be edited (Phase 6); their
**names** are part of the workflow definitions and cannot drift.

**Two operational invariants** that no admin action may violate:

1. `count(active users with role = SUPER_ADMIN) >= 1` — there must always be
   at least one super admin. The very last super admin cannot be downgraded
   or deactivated.
2. A `SUPER_ADMIN` cannot remove their own `role:manage` permission (or any
   permission their own session relies on to keep editing roles). This
   prevents the "last admin locks themselves out" failure.

**Why:** Custom-role CRUD belongs to Phase 7+ — until then, the workflows,
seed data, RBAC tests, and policies all assume these five names exist
unchanged. The two invariants are the difference between "recoverable mistake"
and "platform is unmanageable and we need a DB shell to fix it".

**How to apply:**
- `RoleService.updateRolePermissions(roleId, ...)` checks the actor's session
  before applying mutations that would affect their own access.
- `UserService` (or any role-reassignment code) checks the SUPER_ADMIN count
  before allowing a downgrade.
- Any DELETE on a system role returns `409 SYSTEM_ROLE_PROTECTED`.
- Every grant/revoke writes a `SecurityEvent` (governance audit trail).

---

## 11. Permission changes propagate to active sessions.

**Rule:** When a role's permissions are modified, every active session
holding that role must pick up the change without forcing the user to log
out and back in.

**Implementation:** `User.version` is bumped on any permission change
affecting that user. The client polls `/api/auth/session-version` every 60s;
on mismatch it calls NextAuth's session `update()` which refreshes the JWT
with current DB permissions.

**Why:** Without this, an admin grants someone `finance:approve` and the user
sees a forbidden screen for the next 30 days until the JWT expires.

**How to apply:** Any service that mutates a `Role.permissions` collection
or a user's `roleId` must bump `User.version` for every affected user, in the
same transaction as the change.

---

## Phase status

See [task.md](task.md) for the live phase roadmap. Phases 1–5 complete;
Phase 6 (RBAC Hardening) in progress at time of writing.
