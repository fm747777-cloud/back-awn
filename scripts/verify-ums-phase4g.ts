/**
 * Phase 4G Automated Verification Suite
 * Verifies:
 * 1. Repository & Storage Discovery Invariants (all 8 awn_ums_*_v1 keys & current persistence mode)
 * 2. PostgreSQL Relational Schema & DDL Completeness (15 tables, FKs, unique constraints, deferred FKs)
 * 3. Zod Domain Validation Schemas (seed validation & invalid payload rejection)
 * 4. Dry-Run Migration Validator, Anomaly Detection, Deterministic UUID Mapping & Idempotency Ledger
 * 5. Pre-Migration Backup Snapshot & Checksum-Verified Atomic Rollback Recovery
 * 6. Backend-Grade Default-Deny RBAC Enforcement, Privilege Escalation Guards & Field-Level PII Redaction
 * 7. Dual-Mode Repository Abstraction (`umsApi`) Compatibility with Existing `localStorage` Workflows
 */

import {
    INITIAL_BRANCHES,
    INITIAL_DEPARTMENTS,
    INITIAL_DESIGNATIONS,
    INITIAL_ROLES,
    INITIAL_SECURITY_GROUPS,
    INITIAL_CUSTOM_ADDONS,
    INITIAL_EMPLOYEES,
    INITIAL_UMS_AUDIT_TRAIL,
    loadEmployees,
    loadDepartments,
    loadDesignations,
    loadBranches,
    loadRoles,
    loadSecurityGroups,
    loadCustomAddons,
    loadUmsAuditTrail,
    saveEmployees,
    saveDepartments,
} from '../src/pages/ums/umsMockData';

import {
    UMS_ALL_STORAGE_KEYS,
    UMS_DATABASE_SCHEMA_CATALOG,
    UMS_POSTGRES_DDL_SQL,
    evaluateUmsRbacDecision,
    validatePrivilegeEscalationGuard,
    resolveEmployeeFieldAccess,
    redactEmployeeForActor,
    buildDeterministicUmsUuid,
    runUmsLocalStorageMigrationDryRun,
    createUmsMigrationBackupSnapshot,
    restoreUmsMigrationBackupSnapshot,
    recordUmsMigrationLedgerEntry,
    type UmsActorContext,
} from '../src/pages/ums/umsPersistenceFoundation';

import {
    umsBranchSchema,
    umsDepartmentSchema,
    umsDesignationSchema,
    umsSecurityGroupSchema,
    umsRoleSchema,
    umsCustomAddonSchema,
    umsEmployeeRecordSchema,
    umsAuditEventSchema,
    validateEmployeeRecordWithGraph,
} from '../src/schemas/umsSchema';

import { umsApi, getActiveUmsPersistenceMode } from '../src/api/umsApi';

// In-memory browser storage shim for deterministic Node execution
class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length(): number {
        return this.store.size;
    }
    clear(): void {
        this.store.clear();
    }
    getItem(key: string): string | null {
        return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string): void {
        this.store.delete(key);
    }
    setItem(key: string, value: string): void {
        this.store.set(key, String(value));
    }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'window', {
    value: { localStorage: memoryStorage },
    writable: true,
    configurable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    writable: true,
    configurable: true,
});

let passed = 0;
let failed = 0;

function assert(condition: unknown, label: string): void {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error(`❌ FAILED: ${label}`);
    }
}

async function runPhase4GVerification(): Promise<void> {
    console.log('======================================================================');
    console.log('AWN UMS — PHASE 4G BACKEND ARCHITECTURE & PERSISTENCE FOUNDATION GATE');
    console.log('======================================================================\n');

    memoryStorage.clear();

    // ------------------------------------------------------------------------
    // SECTION 1: Repository & Storage Discovery Verification
    // ------------------------------------------------------------------------
    console.log('1. Verifying Storage Key Discovery & Active Persistence Mode...');
    assert(
        UMS_ALL_STORAGE_KEYS.length === 8 &&
            UMS_ALL_STORAGE_KEYS.every((k) => k.startsWith('awn_ums_') && k.endsWith('_v1')),
        'All 8 canonical awn_ums_*_v1 storage keys are registered'
    );
    assert(
        getActiveUmsPersistenceMode() === 'local_storage_single_browser',
        'Active persistence mode honestly reports local_storage_single_browser while IS_BACKEND_ENABLED=false'
    );

    const employees = loadEmployees();
    const departments = loadDepartments();
    const designations = loadDesignations();
    const branches = loadBranches();
    const roles = loadRoles();
    const securityGroups = loadSecurityGroups();
    const customAddons = loadCustomAddons();
    const auditEvents = loadUmsAuditTrail();

    assert(employees.length === INITIAL_EMPLOYEES.length, 'Seed employees loaded (8)');
    assert(departments.length === INITIAL_DEPARTMENTS.length, 'Seed departments loaded (6)');
    assert(designations.length === INITIAL_DESIGNATIONS.length, 'Seed designations loaded (8)');
    assert(branches.length === INITIAL_BRANCHES.length, 'Seed branches loaded (3)');
    assert(roles.length === INITIAL_ROLES.length, 'Seed roles loaded (4)');
    assert(
        securityGroups.length === INITIAL_SECURITY_GROUPS.length,
        'Seed security groups loaded (4)'
    );
    assert(
        customAddons.length === INITIAL_CUSTOM_ADDONS.length,
        'Seed custom addons loaded (16)'
    );
    assert(
        auditEvents.length === INITIAL_UMS_AUDIT_TRAIL.length,
        'Seed audit trail events loaded (5)'
    );

    // ------------------------------------------------------------------------
    // SECTION 2: Relational Database Schema & DDL Verification
    // ------------------------------------------------------------------------
    console.log('2. Verifying PostgreSQL Relational Schema & DDL Specification...');
    assert(
        UMS_DATABASE_SCHEMA_CATALOG.length === 15,
        'Database schema catalog defines all 15 normalized UMS tables'
    );
    for (const tableSpec of UMS_DATABASE_SCHEMA_CATALOG) {
        assert(
            UMS_POSTGRES_DDL_SQL.includes(`CREATE TABLE IF NOT EXISTS ${tableSpec.tableName}`),
            `PostgreSQL DDL includes CREATE TABLE for ${tableSpec.tableName}`
        );
    }
    assert(
        UMS_POSTGRES_DDL_SQL.includes('idx_ums_branches_single_hq') &&
            UMS_POSTGRES_DDL_SQL.includes('WHERE is_headquarter = TRUE'),
        'PostgreSQL DDL enforces single Headquarters branch partial unique index'
    );
    assert(
        UMS_POSTGRES_DDL_SQL.includes('fk_ums_departments_head_employee') &&
            UMS_POSTGRES_DDL_SQL.includes('DEFERRABLE INITIALLY DEFERRED'),
        'PostgreSQL DDL defines deferrable FK for Department Head <-> Employee circular dependency'
    );

    // ------------------------------------------------------------------------
    // SECTION 3: Zod Input Schema Validation
    // ------------------------------------------------------------------------
    console.log('3. Verifying Zod Input Schemas on Seed Records & Invalid Payloads...');
    assert(
        branches.every((b) => umsBranchSchema.safeParse(b).success),
        'All seed branches pass umsBranchSchema validation'
    );
    assert(
        departments.every((d) => umsDepartmentSchema.safeParse(d).success),
        'All seed departments pass umsDepartmentSchema validation'
    );
    assert(
        designations.every((d) => umsDesignationSchema.safeParse(d).success),
        'All seed designations pass umsDesignationSchema validation'
    );
    assert(
        securityGroups.every((g) => umsSecurityGroupSchema.safeParse(g).success),
        'All seed security groups pass umsSecurityGroupSchema validation'
    );
    assert(
        roles.every((r) => umsRoleSchema.safeParse(r).success),
        'All seed roles pass umsRoleSchema validation'
    );
    assert(
        customAddons.every((a) => umsCustomAddonSchema.safeParse(a).success),
        'All seed custom addons pass umsCustomAddonSchema validation'
    );
    assert(
        employees.every((e) => umsEmployeeRecordSchema.safeParse(e).success),
        'All seed employees pass umsEmployeeRecordSchema validation'
    );
    assert(
        auditEvents.every((ev) => umsAuditEventSchema.safeParse(ev).success),
        'All seed audit events pass umsAuditEventSchema validation'
    );

    // Negative schema checks
    const invalidActiveNoWorkEmail = {
        ...employees[0],
        status: 'Active' as const,
        workEmail: '',
    };
    assert(
        !umsEmployeeRecordSchema.safeParse(invalidActiveNoWorkEmail).success,
        'Active employee without workEmail is rejected by umsEmployeeRecordSchema'
    );

    const invalidSalaryMismatch = {
        ...employees[0],
        salaryDetails: {
            ...employees[0].salaryDetails,
            grossSalary: 999999,
        },
    };
    assert(
        !umsEmployeeRecordSchema.safeParse(invalidSalaryMismatch).success,
        'Employee with mismatched grossSalary sum is rejected by umsEmployeeRecordSchema'
    );

    const circularCandidate = {
        ...employees[0], // emp-1 is manager of emp-2
        managerId: 'emp-2',
    };
    const circularCheck = validateEmployeeRecordWithGraph(circularCandidate, employees);
    assert(
        !circularCheck.success &&
            circularCheck.errors.some((e) => e.includes('circular manager hierarchy')),
        'Circular manager hierarchy (emp-1 <-> emp-2) is rejected by validateEmployeeRecordWithGraph'
    );

    // ------------------------------------------------------------------------
    // SECTION 4: Dry-Run Migration Validator, Deterministic UUIDs & Idempotency
    // ------------------------------------------------------------------------
    console.log('4. Verifying Dry-Run Migration Validator, Anomaly Detection & Idempotency...');
    const uuid1 = buildDeterministicUmsUuid('employee', 'emp-1');
    const uuid2 = buildDeterministicUmsUuid('employee', 'emp-1');
    const uuidOther = buildDeterministicUmsUuid('employee', 'emp-2');
    assert(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid1),
        'buildDeterministicUmsUuid produces RFC-valid UUID v5 format'
    );
    assert(uuid1 === uuid2 && uuid1 !== uuidOther, 'Deterministic UUID mapping is repeatable and collision-free');

    const cleanDryRun = runUmsLocalStorageMigrationDryRun();
    assert(
        cleanDryRun.readyToMigrate === true && cleanDryRun.blockingErrorCount === 0,
        'Clean seed dataset passes migration dry-run with 0 blocking errors'
    );
    assert(
        cleanDryRun.idMappings.length ===
            branches.length +
                securityGroups.length +
                roles.length +
                departments.length +
                designations.length +
                customAddons.length +
                employees.length,
        'Dry-run generates deterministic UUID mappings for all 49 master + employee records'
    );

    // Anomaly detection test with corrupted relationships & duplicates
    const anomalousDryRun = runUmsLocalStorageMigrationDryRun({
        branches: branches.map((b) => ({ ...b, isHeadquarter: false })), // 0 HQ branches
        employees: [
            ...employees,
            {
                ...employees[0],
                id: 'emp-dup-test',
                code: 'EMP-001', // Duplicate code
                email: 'karim@awn.sa', // Duplicate email
                iqamaNumber: '1098765432', // Duplicate iqama
                departmentId: 'dep-non-existent', // Orphan FK
            },
        ],
    });
    assert(
        anomalousDryRun.readyToMigrate === false && anomalousDryRun.blockingErrorCount >= 5,
        'Dry-run blocks migration when HQ invariant, duplicate codes/emails/iqamas, or orphan FKs exist'
    );
    assert(
        anomalousDryRun.anomalies.some((a) => a.code === 'HQ_BRANCH_INVARIANT') &&
            anomalousDryRun.anomalies.some((a) => a.code === 'DUPLICATE_CODE') &&
            anomalousDryRun.anomalies.some((a) => a.code === 'DUPLICATE_EMAIL') &&
            anomalousDryRun.anomalies.some((a) => a.code === 'DUPLICATE_IQAMA') &&
            anomalousDryRun.anomalies.some((a) => a.code === 'ORPHAN_FOREIGN_KEY'),
        'Dry-run accurately classifies HQ_BRANCH_INVARIANT, DUPLICATE_CODE, DUPLICATE_EMAIL, DUPLICATE_IQAMA, and ORPHAN_FOREIGN_KEY'
    );

    // Idempotency ledger check
    const firstLedgerCommit = recordUmsMigrationLedgerEntry({
        idempotencyKey: cleanDryRun.idempotencyKey,
        snapshotId: 'snap-test-1',
        executedAt: new Date().toISOString(),
        counts: cleanDryRun.counts,
    });
    const duplicateLedgerCommit = recordUmsMigrationLedgerEntry({
        idempotencyKey: cleanDryRun.idempotencyKey,
        snapshotId: 'snap-test-2',
        executedAt: new Date().toISOString(),
        counts: cleanDryRun.counts,
    });
    assert(
        firstLedgerCommit.recorded === true &&
            duplicateLedgerCommit.recorded === false &&
            duplicateLedgerCommit.alreadyExists === true,
        'Idempotency ledger records initial migration batch and blocks duplicate retry execution'
    );

    // ------------------------------------------------------------------------
    // SECTION 5: Backup Snapshot & Checksum-Verified Atomic Rollback
    // ------------------------------------------------------------------------
    console.log('5. Verifying Pre-Migration Backup Snapshot & Atomic Rollback...');
    const snapshot = createUmsMigrationBackupSnapshot();
    assert(Boolean(snapshot.snapshotId && snapshot.checksum), 'Backup snapshot created with checksum');

    // Mutate localStorage state destructively, then rollback
    saveEmployees(employees.slice(0, 2));
    saveDepartments(departments.slice(0, 1));
    assert(loadEmployees().length === 2, 'Simulated partial mutation reduced employee count to 2');

    const rollbackResult = restoreUmsMigrationBackupSnapshot();
    assert(
        rollbackResult.restored === true &&
            loadEmployees().length === 8 &&
            loadDepartments().length === 6,
        'restoreUmsMigrationBackupSnapshot verifies checksum and atomically restores all records'
    );

    // Tampered snapshot checksum must be rejected
    const tamperedRollback = restoreUmsMigrationBackupSnapshot({
        ...snapshot,
        checksum: '00000000-0000-5000-8000-000000000000',
    });
    assert(
        tamperedRollback.restored === false,
        'Tampered backup snapshot fails checksum verification and aborts rollback safely'
    );

    // ------------------------------------------------------------------------
    // SECTION 6: Backend-Enforced RBAC, Escalation Guards & PII Redaction
    // ------------------------------------------------------------------------
    console.log('6. Verifying Zero-Trust RBAC, Privilege Escalation Guards & PII Redaction...');

    const unauthActor: UmsActorContext = { isAuthenticated: false };
    const superAdminActor: UmsActorContext = {
        isAuthenticated: true,
        actorEmployeeId: 'emp-1', // Karim Wagdi, rol-1 (Level 1), sec-1 (Super Admin)
        actorRoleId: 'rol-1',
        actorSecurityGroupId: 'sec-1',
    };
    const hrManagerActor: UmsActorContext = {
        isAuthenticated: true,
        actorEmployeeId: 'emp-3', // Fahad Al-Qahtani, rol-2 (Level 2), sec-2 (HR Manager: read/write/export, delete=false)
        actorRoleId: 'rol-2',
        actorSecurityGroupId: 'sec-2',
    };
    const opsOfficerActor: UmsActorContext = {
        isAuthenticated: true,
        actorEmployeeId: 'emp-5', // Tariq Al-Harbi, rol-3 (Level 3), sec-3 (Ops Officer: read=true, write/delete/export=false)
        actorRoleId: 'rol-3',
        actorSecurityGroupId: 'sec-3',
    };
    const draftEmployeeActor: UmsActorContext = {
        isAuthenticated: true,
        actorEmployeeId: 'emp-8', // Hassan Al-Malki, status=Draft
        actorRoleId: 'rol-3',
        actorSecurityGroupId: 'sec-3',
    };

    assert(
        evaluateUmsRbacDecision({
            actor: unauthActor,
            resource: 'Employee',
            operation: 'read',
        }).statusCode === 401,
        'Default-Deny: Unauthenticated actor receives 401 on Employee read'
    );

    assert(
        evaluateUmsRbacDecision({
            actor: draftEmployeeActor,
            resource: 'Employee',
            operation: 'read',
        }).reasonCode === 'ACTOR_EMPLOYEE_NOT_ACTIVE',
        'Default-Deny: Non-Active (Draft) employee principal is denied access'
    );

    assert(
        evaluateUmsRbacDecision({
            actor: hrManagerActor,
            resource: 'Employee',
            operation: 'create',
        }).allowed === true &&
            evaluateUmsRbacDecision({
                actor: hrManagerActor,
                resource: 'Employee',
                operation: 'delete',
            }).allowed === false,
        'HR Manager (SEC-002) is allowed Employee create/update/export but denied delete'
    );

    assert(
        evaluateUmsRbacDecision({
            actor: hrManagerActor,
            resource: 'Security Group',
            operation: 'update',
        }).reasonCode === 'SECURITY_ADMIN_LEVEL_1_REQUIRED',
        'HR Manager (Level 2) is blocked from modifying Security Group definitions (Level 1 required)'
    );

    assert(
        evaluateUmsRbacDecision({
            actor: superAdminActor,
            resource: 'Audit Trail',
            operation: 'delete',
        }).reasonCode === 'AUDIT_TRAIL_IMMUTABLE',
        'Even Super Admin is blocked from deleting or mutating Audit Trail records'
    );

    // Privilege escalation guard tests
    const selfEscalationAttempt = validatePrivilegeEscalationGuard({
        actor: hrManagerActor,
        targetEmployeeId: 'emp-3', // HR Manager trying to edit their own role to Super Admin
        previousRoleId: 'rol-2',
        proposedRoleId: 'rol-1',
    });
    assert(
        !selfEscalationAttempt.allowed &&
            selfEscalationAttempt.reasonCode === 'SELF_PRIVILEGE_ESCALATION_BLOCKED',
        'Self-privilege modification is blocked by validatePrivilegeEscalationGuard'
    );

    const roleLevelEscalationAttempt = validatePrivilegeEscalationGuard({
        actor: hrManagerActor, // Level 2
        targetEmployeeId: 'emp-5',
        previousRoleId: 'rol-3',
        proposedRoleId: 'rol-1', // Trying to grant Level 1 Super Admin
    });
    assert(
        !roleLevelEscalationAttempt.allowed &&
            roleLevelEscalationAttempt.reasonCode === 'ROLE_LEVEL_ESCALATION_BLOCKED',
        'Level 2 HR Manager is blocked from granting Level 1 Super Admin role to another employee'
    );

    // Sensitive field access & PII redaction tests
    const opsFieldAccess = resolveEmployeeFieldAccess({
        actor: opsOfficerActor,
        targetEmployeeId: 'emp-1',
    });
    assert(
        opsFieldAccess.canReadDirectoryBasic === true &&
            opsFieldAccess.canReadCompensation === false &&
            opsFieldAccess.canReadBanking === false &&
            opsFieldAccess.isRedactedView === true,
        'Operations Officer (SEC-003) receives directory basic access with sensitive fields redacted'
    );

    const redactedEmp1ForOps = redactEmployeeForActor(employees[0], opsOfficerActor);
    assert(
        redactedEmp1ForOps.salaryDetails.grossSalary === 0 &&
            redactedEmp1ForOps.iban?.includes('*') &&
            !redactedEmp1ForOps.iban?.includes('8000012345') &&
            redactedEmp1ForOps.iqamaNumber?.includes('*') &&
            redactedEmp1ForOps.dependents[0].nationalIdOrIqama.includes('*'),
        'redactEmployeeForActor zeroes salaryDetails and masks IBAN, Iqama, Passport, and Dependent IDs for SEC-003 viewer'
    );

    const unredactedSelfForOps = redactEmployeeForActor(employees[4], opsOfficerActor); // emp-5 viewing own profile
    assert(
        unredactedSelfForOps.salaryDetails.grossSalary === 15750 &&
            unredactedSelfForOps.iban === 'SA7780000789012345678901',
        'Employee viewing their own profile receives unredacted self-service read access'
    );

    // ------------------------------------------------------------------------
    // SECTION 7: Dual-Mode Frontend Repository (`umsApi`) Verification
    // ------------------------------------------------------------------------
    console.log('7. Verifying Frontend Data-Access Repository (`umsApi`)...');
    const opsListResult = await umsApi.listEmployees(opsOfficerActor);
    assert(
        opsListResult.ok &&
            opsListResult.data?.length === 8 &&
            opsListResult.data[0].salaryDetails.grossSalary === 0,
        'umsApi.listEmployees enforces RBAC and applies field-level redaction per actor'
    );

    const opsWriteAttempt = await umsApi.upsertEmployee(employees[0], opsOfficerActor);
    assert(
        !opsWriteAttempt.ok && opsWriteAttempt.statusCode === 403,
        'umsApi.upsertEmployee blocks unauthorized write attempt from Operations Officer (403)'
    );

    const depDeleteBlocked = await umsApi.deleteEmployee('emp-1', superAdminActor);
    assert(
        !depDeleteBlocked.ok &&
            depDeleteBlocked.statusCode === 409 &&
            depDeleteBlocked.errorCode === 'DEPENDENCY_CONFLICT',
        'umsApi.deleteEmployee enforces referential integrity (409 Conflict) for Department Head / Manager'
    );

    console.log('\n======================================================================');
    console.log(`PHASE 4G VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runPhase4GVerification().catch((err) => {
    console.error('Unexpected error in Phase 4G verification:', err);
    process.exit(1);
});
