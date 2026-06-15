# Suler EMS Production Roadmap

## Phase 36: Governance & Audit Integration [COMPLETE]
- [x] Activate Immutable System Audit Registry (`/governance`)
- [x] Integrate Statutory Rate Management in Compliance Hub
- [x] Implement Granular Payslip Breakdown Engine
- [x] Wire Finance & Security consoles to Forensic Logging

## Phase 37: Operational Hardening [COMPLETE]
- [x] Refactor SettingsContext for Global Governance Persistence
- [x] Wire Integration Hub to Institutional Registry
- [x] Wire Security Console to Forensic Oversight
- [x] Implement Context-Aware Audit Search for Cost Centers

## Phase 38: Backend Transition & Scaling
- [x] Migrate localStorage to Production API/PostgreSQL (Phases 1–5)
- [ ] Implement OAuth2/SSO Identity Provider
- [ ] Enable Automated Regulatory PDF/CSV Exports
- [ ] Multi-Regional Enterprise Load Testing

## Phase 1: Database Foundation [COMPLETE]
- [x] Postgres via docker-compose; schema migrated from SQLite
- [x] Finance + Payroll Prisma models
- [x] Domain service layer scaffolded
- [x] 25-user demo seed (departments, budgets, salaries, leave, payroll)

## Phase 2: Leave & Workflow Integration [COMPLETE]
- [x] LeaveService (atomic submit + transition via WorkflowEngine)
- [x] /api/leave/requests + transition routes
- [x] Tracker page wired to live data
- [x] Leave submission form + manager approval queue
- [x] ActivityContext hydrated from WorkflowAuditEntry

## Phase 3: Messaging Integration [COMPLETE]
- [x] CommunicationContext API-backed (10s/5s polling)
- [x] useApi() + useApiMutation() hooks standardized
- [x] Conversation list, DM thread, broadcast publish/receive
- [x] Announcements visible to permitted roles

## Phase 4: Finance Module [COMPLETE]
- [x] ExpenditureWorkflow (DRAFT → SUBMITTED → APPROVED → DISBURSED)
- [x] Atomic disbursement: Expenditure + Budget + Category updated together
- [x] Budget balance pre-check (409 BUDGET_EXCEEDED)
- [x] /finance/approvals queue cloning /leave/approvals pattern
- [x] DISBURSED terminal (constraint enforced by workflow definition)

## Phase 5: Payroll Module [COMPLETE]
- [x] PayrollRunWorkflow (DRAFT → REVIEW → APPROVED → PROCESSED)
- [x] Salary snapshot into PayrollEntry (no retroactive recompute)
- [x] Adjustment auto-flip to APPLIED on PROCESS (same transaction)
- [x] Idempotent processing via `updateMany` state guard
- [x] Reconciliation check: PayrollRun totals ≡ Σ(entries)
- [x] /payroll/register, /payroll/runs/[id], /payroll/approvals, /my-payroll

## Phase 6: Roles UI + RBAC Hardening [COMPLETE]
- [x] Admin UI for Role / Permission management (`/admin/roles`)
- [x] Server-side route protection via `proxy.ts` (Next.js 16 rename)
- [x] Permission refresh on role change (User.version bump + 60s poll → JWT refresh)
- [x] Four invariants enforced (C1 system roles, C2 audit, C3 self-lockout, C4 last super admin)
- [x] db:verify extended (permission-coverage, ≥1 SUPER_ADMIN, HR_ADMIN canonical)
- [x] ARCHITECTURE.md formalized (11 rules)

## Phase 6.1: Roles CRUD + User Management [COMPLETE]
- [x] Custom role create (blank start, UPPER_SNAKE_CASE)
- [x] Role rename + describe (non-system only)
- [x] Role delete (blocks if users assigned)
- [x] `/admin/users` page with role-change modal (calls PATCH endpoint)
- [x] `User.version` bumped on role assignment

## Phase 7: Pilot Hardening [IN PROGRESS]
- [ ] PDF/CSV export pipeline (payslip PDF, payroll register CSV, audit log CSV)
- [ ] A11y ratchet: jsx-a11y rule warn → error after pre-Phase-6 sweep
- [ ] Broken-route audit (catch the next /workforce-class bug before users do)
- [ ] Inngest async payroll processing (only when concrete need surfaces; deferred to Phase 8)
- [ ] OAuth/SSO identity provider (deferred to Phase 8)
- [ ] Multi-regional load testing (deferred to Phase 8)

---

> **Architecture rules:** see [ARCHITECTURE.md](ARCHITECTURE.md). Every
> contributor must follow them. The HR_ADMIN canonical-role rule and the
> terminal-state irreversibility rule were derived from real bugs — don't
> regress them.
