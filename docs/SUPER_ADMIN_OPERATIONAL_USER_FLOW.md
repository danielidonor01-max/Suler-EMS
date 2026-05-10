# Suler EMS — Super Admin Operational User Flow

## Strategic Purpose
The Super Admin is the highest authority in the system. Their responsibility is to establish global organizational structure, configure office hubs, create and govern users, and enforce compliance and audit controls.

---

## Phase 1 — Authentication and Access
**Use Case:** Login as Seeded Super Admin
- **Actor:** Super Admin
- **Preconditions:** 
  - Seed script has created a Super Admin account.
  - Database is populated.
- **Flow:**
  1. Navigate to `/login`
  2. Enter seeded credentials (e.g., `superadmin@sulerglobal.com`)
  3. Click **Sign In**
  4. System authenticates using NextAuth v5.
  5. Session and permissions are loaded.
  6. Redirect to `/hub` or `/dashboard`.

---

## Phase 2 — Global Organizational Workspace
**Purpose:** Provide command over all organizations, office hubs, and departments.
- **Key Controls:**
  - Organization Selector (e.g., Suler Global)
  - Office Hub Selector (e.g., Lagos HQ)
  - Global Search & Notifications
  - Super Admin Identity Badge
- **Primary Views:**
  - Workforce Metrics & Compliance Status
  - Attendance Overview & Operational Alerts
  - Real-time Audit Activity Feed

---

## Phase 3 — Organization Governance
**Use Case:** Create a New Organization
- **Flow:**
  1. Open **Organization Selector**
  2. Click **Create Organization**
  3. Enter: Name, Industry, Registration Number, Country.
  4. Save.
- **Result:** New organization becomes available in the global switcher.

---

## Phase 4 — Office Hub Management
**Use Case:** Create Lagos, Abuja, and Port Harcourt Hubs
- **Flow:**
  1. Navigate to **Hub Management**
  2. Click **Add Office Hub**
  3. Enter: Hub Name, Address, Region, Time Zone.
  4. Save.
- **Result:** Hub appears in the context-aware Office Hub dropdown.

---

## Phase 5 — Department Setup
**Use Case:** Configure Departments
- **Standard Departments:** HR, Finance, Operations, Legal, Engineering, Sales.
- **Flow:**
  1. Switch to target hub.
  2. Open **Department Registry**.
  3. Click **Create Department**.
  4. Enter details and save.

---

## Phase 6 — Role and Permission Governance
**Use Case:** Create Roles
- **Hierarchical Roles:** Super Admin, Org Admin, HR Manager, Dept Manager, Team Lead, Employee.
- **Flow:**
  1. Open **Governance → Roles**.
  2. Create or edit role.
  3. Assign specific permissions (e.g., `employee:onboard`, `payroll:approve`).
  4. Save.

---

## Phase 7 — Workforce Onboarding
**Use Case:** Add New Employee
- **Flow:**
  1. Go to **Workforce**.
  2. Click **Onboard Employee**.
  3. Enter: Personal Info, Staff ID, Dept, Hub, Role.
  4. Save.
- **System Actions:** Duplicate check, credential generation, welcome email, audit log entry.

---

## Phase 8 — Organizational Switching
**Use Case:** Switch Between Hubs
- **Scenario:** Super Admin wants to inspect Abuja Hub operations.
- **Flow:**
  1. Open **Office Hub** dropdown.
  2. Select **Abuja**.
  3. Dashboard reloads with Abuja-specific data.
- **Result:** All modules (Attendance, Analytics, Staff) become context-aware.

---

## Phase 9 — Workforce Governance Actions
- **Actions:** Edit Identity, Modify Role, Suspend Access, Restore Access, View Audit Trail.
- **Example:** Suspend a compromised account via the Governance Console.

---

## Phase 10 — Attendance & Monitoring
- **Use Cases:**
  - Review daily attendance & approve anomalies.
  - Reconcile biometric/digital device logs.
  - Detect missing punches or scheduling conflicts.

---

## Phase 11 — Analytics and Forecasting
- **Use Cases:**
  - Monitor workforce readiness & attrition prediction.
  - Analyze productivity trends & regional risk factors.

---

## Phase 12 — Security and Audit
- **Use Cases:**
  - Review global login history & trace admin changes.
  - Monitor for multi-tab session conflicts or brute-force attempts.

---

## Phase 13 — Communication
- **Use Cases:**
  - Broadcast announcements to specific departments or hubs.
  - Deliver compliance reminders & policy updates.

---

## Phase 14 — Logout
- **Flow:**
  1. Click profile menu → **Sign Out**.
  2. Session invalidated across all active tabs.
  3. Redirect to `/login`.

---

## End-to-End Operational Lifecycle
1. **Login** → 2. **Global Workspace** → 3. **Org Setup** → 4. **Hub/Dept Setup** → 5. **Role Config** → 6. **Onboarding** → 7. **Context Switching** → 8. **Monitoring/Audit** → 9. **Logout**.
