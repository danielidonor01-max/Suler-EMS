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

## Phase 5: Payroll Module [IN PROGRESS]
- [ ] PayrollRunWorkflow (DRAFT → REVIEW → APPROVED → PROCESSED)
- [ ] Salary snapshot into PayrollEntry (no retroactive recompute)
- [ ] Adjustment auto-flip to APPLIED on PROCESS (same transaction)
- [ ] Idempotent processing via `updateMany` state guard
- [ ] Reconciliation check: PayrollRun totals ≡ Σ(entries)
- [ ] /payroll/register, /payroll/runs/[id], /payroll/approvals, /my-payroll

## Phase 6: Roles UI + Hardening [PENDING]
- [ ] Admin UI for Role / Permission management
- [ ] Middleware-based RouteGuard (server-side equivalent)
- [ ] Permission refresh on role change (version bump pattern)
- [ ] Inngest background processing for payroll > 250 entries
- [ ] PDF/CSV export pipeline
- [ ] A11y pass on icon-only buttons

---

> **Architecture rules:** see [ARCHITECTURE.md](ARCHITECTURE.md). Every
> contributor must follow them. The HR_ADMIN canonical-role rule and the
> terminal-state irreversibility rule were derived from real bugs — don't
> regress them.
