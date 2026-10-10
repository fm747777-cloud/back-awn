# AWN Enterprise Platform — Phase 4G: UMS Backend Architecture & Secure Persistence Foundation

## Executive Status & Transparency Declaration

- **Current Runtime Persistence Mode**: `local_storage_single_browser` (`IS_BACKEND_ENABLED = false` in `src/api/axiosClient.ts`, `USE_DEMO_MODE = true` in `src/api/api.ts`).
- **Authoritative Local Storage Keys**: All 8 `awn_ums_*_v1` collections remain intact and active in `src/pages/ums/umsMockData.ts` so existing React 19 UMS workflows, EN/AR bilingual views, and the permanent light theme continue to operate with zero regression.
- **No Unapproved Data Upload**: No employee PII, salary records, banking details, or attachments are uploaded to any external service.
- **Phase 4G Foundation Delivered**:
  1. `src/schemas/umsSchema.ts` — Shared Zod v4 validation schemas for all UMS entities, sub-records, and graph invariants.
  2. `src/pages/ums/umsPersistenceFoundation.ts` — Canonical 15-table PostgreSQL DDL specification, Zero-Trust Default-Deny RBAC & Field-Level PII Redaction Engine, Deterministic UUID v5-style ID Mapper, Dry-Run Migration Validator, Idempotency Ledger, and Checksum-Verified Backup/Rollback Engine.
  3. `src/api/umsApi.ts` — Dual-mode Frontend Data-Access Repository (`local_storage_single_browser` active by default, seamlessly switchable to `remote_rest_api` via `axiosClient`).
  4. `scripts/verify-ums-phase4g.ts` — Automated release-gate verification suite (45 assertions).

---

## 1. Repository & Architecture Discovery

### 1.1 Existing Authentication & Session Handling
- **Store**: `src/store/useAuthStore.ts` uses Zustand with `persist` middleware storing session state in `localStorage` under `'auth'`, `'token'`, and `'awn_logged_out'`.
- **Default Demo Session**: When `awn_logged_out !== 'true'`, `getInitialAuthState()` initializes `DEMO_DEFAULT_TOKEN = 'demo-jwt-token'` and `DEMO_DEFAULT_USER = { id: 'demo-admin-1', type: 'Super Admin', fullName: 'Karim Wagdi' }`.
- **Login Flow**: `src/pages/LoginPage.tsx` validates credentials via `loginSchema` (`src/schemas/authSchema.ts`) and calls `authApi.login(data)` (`src/api/api.ts`). When `USE_DEMO_MODE = true`, it returns a local token; when `USE_DEMO_MODE = false`, it posts to `POST /auth/login`.
- **HTTP Client**: `src/api/axiosClient.ts` reads `import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL`. A request interceptor currently blocks network requests while `IS_BACKEND_ENABLED = false`. When enabled, it attaches `Authorization: Bearer ${token}` and logs out on `401`/`403`.

### 1.2 Current Routing & Protected Routes
- **Router**: `src/routers/index.tsx` defines `/login` (public) and `/` wrapped in `<ProtectedRoute />` (`src/layouts/ProtectedRoute.tsx`).
- **Limitation Identified**: `ProtectedRoute.tsx` only verifies `!isLoggedOut && token && token.trim() !== ''` on the client. It does not validate JWT cryptographic signatures, token expiry, or module/route RBAC permissions.

### 1.3 Complete UMS Data Model, Relationships & `localStorage` Keys
| Storage Key (`awn_ums_*_v1`) | TypeScript Interface | Seed Count | Code Pattern | Key Relationships & Invariants |
| :--- | :--- | :---: | :---: | :--- |
| `awn_ums_branches_v1` | `BranchRecord` | 3 | `BRN-001`..`003` | Exactly 1 branch must have `isHeadquarter = true`; referenced by `EmployeeRecord.branchId`. |
| `awn_ums_security_groups_v1` | `SecurityGroupRecord` | 4 | `SEC-001`..`004` | Contains 7-module `SecurityGroupPermissions` matrix (`ums`, `edms`, `service`, `workflow`, `request`, `asset`, `ticketing`); referenced by `RoleRecord.securityGroupId`. |
| `awn_ums_roles_v1` | `RoleRecord` | 4 | `ROL-001`..`004` | Links to `securityGroupId`; defines hierarchy `level` (`1..5`, where `1` is highest privilege); referenced by `EmployeeRecord.roleId`. |
| `awn_ums_departments_v1` | `DepartmentRecord` | 6 | `DEP-001`..`006` | Optional `headEmployeeId` -> `EmployeeRecord.id`; referenced by `EmployeeRecord.departmentId` and `DesignationRecord.departmentId`. |
| `awn_ums_designations_v1` | `DesignationRecord` | 8 | `DES-001`..`008` | Optional `departmentId` -> `DepartmentRecord.id`; referenced by `EmployeeRecord.designationId`. |
| `awn_ums_custom_addons_v1` | `CustomAddonRecord` | 16 | `ADD-001`..`016` | 4 categories (`bank` [4], `religion` [3], `job_title` [5], `job_grade` [4]); referenced by `EmployeeRecord` (`bankId`, `religionId`, `jobTitleId`, `jobGradeId`). |
| `awn_ums_employees_v1` | `EmployeeRecord` | 8 | `EMP-001`..`008` | Embeds `salaryDetails`, `documentAttachments`, and `dependents` (`depn-1`..`depn-4`); self-referential `managerId` (DAG — no cycles). |
| `awn_ums_audit_trail_v1` | `UmsAuditEvent` | 5 | `UMSAUD-1001`..`1005` | Sanitized via `sanitizeAuditStateSnapshot` to redact binary DataURLs, IBANs, and credentials. |

---

## 2. Target Multi-User Architecture & Responsibility Boundaries

### 2.1 Why Reuse the Existing REST API Architecture + Relational PostgreSQL
- `src/api/axiosClient.ts` and `src/api/api.ts` already establish a REST/JSON backend contract (`VITE_BASE_URL` / `VITE_API_BASE_URL`) with UUID primary keys (`UUID_REGEX`) and existing stubs for `/company-branch`, `/company-user`, and `/user`.
- Extending this single REST API service backed by **PostgreSQL** avoids introducing a second competing backend or NoSQL store and provides native ACID transactions, deferrable foreign keys (essential for the `Department.headEmployeeId <-> Employee.departmentId` cycle), and strict relational integrity.

### 2.2 Layer Responsibility Boundaries
1. **React 19 Frontend (`src/pages/ums/*`, `src/api/umsApi.ts`)**:
   - Presentation, bilingual EN/AR rendering, client-side form UX validation (`src/schemas/umsSchema.ts`), and invoking `umsApi`. Never holds service secrets or acts as the authority for RBAC.
2. **Authentication & Session Layer (`/auth/*` + Server Session Middleware)**:
   - Issues short-lived signed access tokens (`15m`) + `HttpOnly; Secure; SameSite=Strict` refresh cookies, binds authenticated principals to `ums_employees.id`, and immediately revokes sessions when an employee or role is set to `Inactive`.
3. **Backend API & Authorization Layer (`/ums/*`)**:
   - Enforces Default-Deny RBAC (`evaluateUmsRbacDecision`), privilege-escalation guards (`validatePrivilegeEscalationGuard`), Zod payload validation, field-level PII redaction (`redactEmployeeForActor`), and server-derived audit logging (`actorId`/`actorEmail` extracted from verified session token, never from request body).
4. **PostgreSQL Database & Private Object Storage**:
   - Enforces schema constraints, `ON DELETE RESTRICT` referential integrity, partial unique indexes, and stores employee attachments in private object storage (`ums_employee_attachments.storage_object_key`) accessed only via short-lived signed URLs.

---

## 3. Relational Database Schema & Transaction Design

The canonical 15-table PostgreSQL DDL (`UMS_POSTGRES_DDL_SQL` in `src/pages/ums/umsPersistenceFoundation.ts`) separates general directory columns from sensitive 1:1 and 1:N tables:
1. `ums_branches` (with partial unique index `idx_ums_branches_single_hq WHERE is_headquarter = TRUE`)
2. `ums_security_groups`
3. `ums_security_group_permissions` (composite PK `(security_group_id, module_key)`)
4. `ums_roles` (`FK security_group_id ON DELETE RESTRICT`, `CHECK (level BETWEEN 1 AND 5)`)
5. `ums_departments` (`head_employee_id` with `DEFERRABLE INITIALLY DEFERRED` FK)
6. `ums_designations` (`FK department_id ON DELETE RESTRICT`)
7. `ums_custom_addons` (`UNIQUE (addon_type, LOWER(name_en))`, `UNIQUE (addon_type, name_ar)`)
8. `ums_employees` (core directory & employment fields; `CHECK (manager_id IS NULL OR manager_id <> id)`)
9. `ums_employee_compensation` (1:1 protected salary table)
10. `ums_employee_banking` (1:1 protected banking & IBAN table)
11. `ums_employee_regulatory_docs` (1:1 protected National ID / Iqama, Passport, Visa, GOSI, Qiwa contract, Health Insurance)
12. `ums_employee_attachments` (1:N private object storage metadata; `CHECK (file_size <= 5242880)`)
13. `ums_employee_dependents` (1:N dependents table)
14. `ums_audit_events` (append-only immutable audit log)
15. `ums_migration_ledger` (idempotency tracking table keyed by `idempotency_key`)

---

## 4. LocalStorage-to-Database Migration Strategy

Implemented in `src/pages/ums/umsPersistenceFoundation.ts`:
1. **Preserve Existing `localStorage` Records**: `createUmsMigrationBackupSnapshot()` writes a checksummed snapshot to `awn_ums_migration_snapshot_v1` before any migration step.
2. **Validate & Normalize Legacy Records**: `runUmsLocalStorageMigrationDryRun()` normalizes legacy string lookups (`bankName` -> `bankId`, `religion` -> `religionId`, `jobTitleName` -> `jobTitleId`) and validates every record against `src/schemas/umsSchema.ts`.
3. **Detect Duplicates & Invalid Relationships**: Scans for `DUPLICATE_ID`, `DUPLICATE_CODE`, `DUPLICATE_EMAIL`, `DUPLICATE_IQAMA`, `ORPHAN_FOREIGN_KEY`, `CIRCULAR_MANAGER_CHAIN`, and `HQ_BRANCH_INVARIANT`.
4. **Deterministic UUID Mapping**: `buildDeterministicUmsUuid(namespace, legacyId)` maps `brn-1`, `dep-1`, `emp-1`, etc. to deterministic UUID v5-compatible primary keys while preserving `legacy_id` and `code`.
5. **Dry-Run Report & Idempotent Retry Protection**: Produces `UmsMigrationDryRunReport` with a deterministic batch `idempotencyKey` checked against `ums_migration_ledger` so retries never duplicate records.
6. **Atomic Rollback**: `restoreUmsMigrationBackupSnapshot()` verifies the snapshot checksum and restores all 8 `awn_ums_*_v1` keys atomically.

---

## 5. Backend-Enforced Zero-Trust RBAC Matrix

| Security Group | Linked Role(s) | UMS Read (Directory) | UMS Sensitive Fields (Salary, IBAN, Iqama, Dependents) | UMS Create / Update | UMS Delete | UMS Export | Role & Security Group Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **SEC-001** (`Super Administrators`) | `ROL-001` (Level 1) | Allowed | Full Read & Write | Allowed | Allowed (if unlinked) | Allowed | **Allowed (Level 1 + `ums.write`)** |
| **SEC-002** (`HR & Workforce Managers`) | `ROL-002` (Level 2) | Allowed | Full Read & Write | Allowed (Roles > Level 2 only) | **Denied** (`delete: false`) | Allowed | **Denied** |
| **SEC-003** (`Operations & Service Officers`) | `ROL-003` (Level 3) | Allowed | **Redacted / Masked** (Unmasked for own self-profile only) | **Denied** (`write: false`) | **Denied** (`delete: false`) | **Denied** (`export: false`) | **Denied** |
| **SEC-004** (`Auditors & Compliance Stewards`) | `ROL-004` (Level 2) | Allowed | Read-Only (Audit/Compliance) | **Denied** (`write: false`) | **Denied** (`delete: false`) | Allowed | **Denied** |
| **Unauthenticated / Inactive / Draft** | Any / None | **Denied (401/403)** | **Denied (401/403)** | **Denied (401/403)** | **Denied (401/403)** | **Denied (401/403)** | **Denied (401/403)** |
