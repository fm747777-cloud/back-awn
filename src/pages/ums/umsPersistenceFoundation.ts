/**
 * Phase 4G: UMS Backend Architecture & Secure Persistence Foundation
 *
 * Provides:
 * 1. Canonical PostgreSQL Relational Schema & Transaction Specification
 * 2. Zero-Trust Server-Grade RBAC Policy Evaluator, Privilege-Escalation Guard & PII Redaction Engine
 * 3. Deterministic Legacy-ID-to-UUID Mapper, Dry-Run Migration Validator, Idempotency Ledger & Rollback Engine
 *
 * NOTE: Preserves browser localStorage (`awn_ums_*_v1`) as the active persistence source until a
 * provisioned backend database is enabled and an explicit administrator migration step is approved.
 */

import {
    UMS_EMPLOYEES_STORAGE_KEY,
    UMS_DESIGNATIONS_STORAGE_KEY,
    UMS_DEPARTMENTS_STORAGE_KEY,
    UMS_SECURITY_GROUPS_STORAGE_KEY,
    UMS_ROLES_STORAGE_KEY,
    UMS_BRANCHES_STORAGE_KEY,
    UMS_CUSTOM_ADDONS_STORAGE_KEY,
    UMS_AUDIT_TRAIL_STORAGE_KEY,
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
    saveDesignations,
    saveBranches,
    saveRoles,
    saveSecurityGroups,
    saveCustomAddons,
    saveUmsAuditTrail,
    inspectUmsStorageHealth,
    wouldCreateCircularManagerChain,
    normalizeCustomAddonText,
    type EmployeeRecord,
    type DepartmentRecord,
    type DesignationRecord,
    type BranchRecord,
    type RoleRecord,
    type SecurityGroupRecord,
    type SecurityGroupPermissions,
    type CustomAddonRecord,
    type UmsAuditEvent,
} from './umsMockData';

import {
    umsBranchSchema,
    umsDepartmentSchema,
    umsDesignationSchema,
    umsSecurityGroupSchema,
    umsRoleSchema,
    umsCustomAddonSchema,
    umsEmployeeRecordSchema,
    umsAuditEventSchema,
} from '../../schemas/umsSchema';

// ============================================================================
// 1. STORAGE & MIGRATION CONSTANTS
// ============================================================================

export const UMS_MIGRATION_SNAPSHOT_STORAGE_KEY = 'awn_ums_migration_snapshot_v1';
export const UMS_MIGRATION_LEDGER_STORAGE_KEY = 'awn_ums_migration_ledger_v1';

export const UMS_ALL_STORAGE_KEYS = [
    UMS_BRANCHES_STORAGE_KEY,
    UMS_SECURITY_GROUPS_STORAGE_KEY,
    UMS_ROLES_STORAGE_KEY,
    UMS_DEPARTMENTS_STORAGE_KEY,
    UMS_DESIGNATIONS_STORAGE_KEY,
    UMS_CUSTOM_ADDONS_STORAGE_KEY,
    UMS_EMPLOYEES_STORAGE_KEY,
    UMS_AUDIT_TRAIL_STORAGE_KEY,
] as const;

export type UmsModuleKey = keyof SecurityGroupPermissions;

export type UmsOperation = 'read' | 'create' | 'update' | 'delete' | 'export';

export type UmsProtectedResource =
    | 'Employee'
    | 'Department'
    | 'Designation'
    | 'Branch'
    | 'Role'
    | 'Security Group'
    | 'Custom Addon'
    | 'Audit Trail';

export type UmsSensitiveFieldScope =
    | 'compensation'
    | 'banking'
    | 'identity_documents'
    | 'dependents'
    | 'security_assignment';

// ============================================================================
// 2. RELATIONAL DATABASE SCHEMA SPECIFICATION (POSTGRESQL DDL)
// ============================================================================

export interface UmsDatabaseTableSpec {
    tableName: string;
    domainEntity: string;
    sourceStorageKey: string;
    primaryKey: string;
    uniqueConstraints: string[];
    foreignKeys: Array<{
        column: string;
        referencesTable: string;
        referencesColumn: string;
        onDelete: 'RESTRICT' | 'SET NULL' | 'CASCADE';
        deferrable?: boolean;
    }>;
    indexes: string[];
}

export const UMS_DATABASE_SCHEMA_CATALOG: UmsDatabaseTableSpec[] = [
    {
        tableName: 'ums_branches',
        domainEntity: 'BranchRecord',
        sourceStorageKey: UMS_BRANCHES_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_branches_legacy_id (legacy_id)',
            'uq_ums_branches_code (code)',
            'uq_ums_branches_cr_number (cr_number)',
            'idx_ums_branches_single_hq (is_headquarter) WHERE is_headquarter = TRUE',
        ],
        foreignKeys: [],
        indexes: ['idx_ums_branches_status (status)', 'idx_ums_branches_city_en (city_en)'],
    },
    {
        tableName: 'ums_security_groups',
        domainEntity: 'SecurityGroupRecord',
        sourceStorageKey: UMS_SECURITY_GROUPS_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_security_groups_legacy_id (legacy_id)',
            'uq_ums_security_groups_code (code)',
            'uq_ums_security_groups_name_en (LOWER(name_en))',
        ],
        foreignKeys: [],
        indexes: ['idx_ums_security_groups_status (status)'],
    },
    {
        tableName: 'ums_security_group_permissions',
        domainEntity: 'SecurityGroupPermissions',
        sourceStorageKey: UMS_SECURITY_GROUPS_STORAGE_KEY,
        primaryKey: '(security_group_id, module_key) PRIMARY KEY',
        uniqueConstraints: ['pk_ums_sg_permissions (security_group_id, module_key)'],
        foreignKeys: [
            {
                column: 'security_group_id',
                referencesTable: 'ums_security_groups',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
        ],
        indexes: ['idx_ums_sg_permissions_module (module_key)'],
    },
    {
        tableName: 'ums_roles',
        domainEntity: 'RoleRecord',
        sourceStorageKey: UMS_ROLES_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_roles_legacy_id (legacy_id)',
            'uq_ums_roles_code (code)',
            'uq_ums_roles_name_en (LOWER(name_en))',
        ],
        foreignKeys: [
            {
                column: 'security_group_id',
                referencesTable: 'ums_security_groups',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
        ],
        indexes: [
            'idx_ums_roles_security_group_id (security_group_id)',
            'idx_ums_roles_level_status (level, status)',
        ],
    },
    {
        tableName: 'ums_departments',
        domainEntity: 'DepartmentRecord',
        sourceStorageKey: UMS_DEPARTMENTS_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_departments_legacy_id (legacy_id)',
            'uq_ums_departments_code (code)',
            'uq_ums_departments_name_en (LOWER(name_en))',
        ],
        foreignKeys: [
            {
                column: 'head_employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'SET NULL',
                deferrable: true,
            },
        ],
        indexes: [
            'idx_ums_departments_head_employee_id (head_employee_id)',
            'idx_ums_departments_status (status)',
        ],
    },
    {
        tableName: 'ums_designations',
        domainEntity: 'DesignationRecord',
        sourceStorageKey: UMS_DESIGNATIONS_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_designations_legacy_id (legacy_id)',
            'uq_ums_designations_code (code)',
        ],
        foreignKeys: [
            {
                column: 'department_id',
                referencesTable: 'ums_departments',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
        ],
        indexes: [
            'idx_ums_designations_department_id (department_id)',
            'idx_ums_designations_status (status)',
        ],
    },
    {
        tableName: 'ums_custom_addons',
        domainEntity: 'CustomAddonRecord',
        sourceStorageKey: UMS_CUSTOM_ADDONS_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_custom_addons_legacy_id (legacy_id)',
            'uq_ums_custom_addons_code (code)',
            'uq_ums_custom_addons_type_name_en (addon_type, LOWER(name_en))',
            'uq_ums_custom_addons_type_name_ar (addon_type, name_ar)',
        ],
        foreignKeys: [],
        indexes: ['idx_ums_custom_addons_type_status (addon_type, status)'],
    },
    {
        tableName: 'ums_employees',
        domainEntity: 'EmployeeRecord (Core & Employment)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_employees_legacy_id (legacy_id)',
            'uq_ums_employees_code (code)',
            'uq_ums_employees_email (LOWER(email))',
            'uq_ums_employees_work_email (LOWER(work_email)) WHERE work_email IS NOT NULL AND work_email <> \'\'',
        ],
        foreignKeys: [
            {
                column: 'branch_id',
                referencesTable: 'ums_branches',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'department_id',
                referencesTable: 'ums_departments',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'designation_id',
                referencesTable: 'ums_designations',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'role_id',
                referencesTable: 'ums_roles',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'manager_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
                deferrable: true,
            },
            {
                column: 'job_grade_id',
                referencesTable: 'ums_custom_addons',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'job_title_id',
                referencesTable: 'ums_custom_addons',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
            {
                column: 'religion_id',
                referencesTable: 'ums_custom_addons',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
        ],
        indexes: [
            'idx_ums_employees_status (status)',
            'idx_ums_employees_department_id (department_id)',
            'idx_ums_employees_branch_id (branch_id)',
            'idx_ums_employees_role_id (role_id)',
            'idx_ums_employees_manager_id (manager_id)',
        ],
    },
    {
        tableName: 'ums_employee_compensation',
        domainEntity: 'SalaryDetails (1:1 Protected Table)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'employee_id UUID PRIMARY KEY',
        uniqueConstraints: ['pk_ums_employee_compensation (employee_id)'],
        foreignKeys: [
            {
                column: 'employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
        ],
        indexes: [],
    },
    {
        tableName: 'ums_employee_banking',
        domainEntity: 'EmployeeRecord Banking (1:1 Protected Table)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'employee_id UUID PRIMARY KEY',
        uniqueConstraints: [
            'pk_ums_employee_banking (employee_id)',
            'uq_ums_employee_banking_iban (iban) WHERE iban IS NOT NULL AND iban <> \'\'',
        ],
        foreignKeys: [
            {
                column: 'employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
            {
                column: 'bank_id',
                referencesTable: 'ums_custom_addons',
                referencesColumn: 'id',
                onDelete: 'RESTRICT',
            },
        ],
        indexes: ['idx_ums_employee_banking_bank_id (bank_id)'],
    },
    {
        tableName: 'ums_employee_regulatory_docs',
        domainEntity: 'EmployeeRecord Identity & Regulatory (1:1 Protected Table)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'employee_id UUID PRIMARY KEY',
        uniqueConstraints: [
            'pk_ums_employee_regulatory_docs (employee_id)',
            'uq_ums_employee_iqama (iqama_number) WHERE iqama_number IS NOT NULL AND iqama_number <> \'\'',
        ],
        foreignKeys: [
            {
                column: 'employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
        ],
        indexes: ['idx_ums_employee_iqama_expiry (iqama_expiry_date)'],
    },
    {
        tableName: 'ums_employee_attachments',
        domainEntity: 'EmployeeDocumentAttachment (1:N Object Storage Metadata)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: ['uq_ums_employee_attachment_category (employee_id, category)'],
        foreignKeys: [
            {
                column: 'employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
        ],
        indexes: ['idx_ums_employee_attachments_emp (employee_id)'],
    },
    {
        tableName: 'ums_employee_dependents',
        domainEntity: 'EmployeeDependent (1:N Protected Table)',
        sourceStorageKey: UMS_EMPLOYEES_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: [
            'uq_ums_dependents_legacy_id (legacy_id)',
            'uq_ums_dependents_emp_national_id (employee_id, national_id_or_iqama)',
        ],
        foreignKeys: [
            {
                column: 'employee_id',
                referencesTable: 'ums_employees',
                referencesColumn: 'id',
                onDelete: 'CASCADE',
            },
        ],
        indexes: ['idx_ums_dependents_employee_id (employee_id)'],
    },
    {
        tableName: 'ums_audit_events',
        domainEntity: 'UmsAuditEvent (Append-Only Immutable Audit Log)',
        sourceStorageKey: UMS_AUDIT_TRAIL_STORAGE_KEY,
        primaryKey: 'id UUID PRIMARY KEY',
        uniqueConstraints: ['uq_ums_audit_events_code (event_code)'],
        foreignKeys: [],
        indexes: [
            'idx_ums_audit_events_timestamp (occurred_at DESC)',
            'idx_ums_audit_events_resource (resource_type, resource_id)',
            'idx_ums_audit_events_actor (actor_id)',
        ],
    },
    {
        tableName: 'ums_migration_ledger',
        domainEntity: 'Idempotent Migration Execution Ledger',
        sourceStorageKey: UMS_MIGRATION_LEDGER_STORAGE_KEY,
        primaryKey: 'idempotency_key VARCHAR(128) PRIMARY KEY',
        uniqueConstraints: ['pk_ums_migration_ledger (idempotency_key)'],
        foreignKeys: [],
        indexes: ['idx_ums_migration_ledger_executed_at (executed_at DESC)'],
    },
];

export const UMS_POSTGRES_DDL_SQL = `-- AWN UMS Phase 4G Canonical PostgreSQL Schema
BEGIN;

CREATE TABLE IF NOT EXISTS ums_branches (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    city_en VARCHAR(100) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,
    cr_number VARCHAR(20) NOT NULL UNIQUE,
    address_en VARCHAR(300) NOT NULL DEFAULT '',
    address_ar VARCHAR(300) NOT NULL DEFAULT '',
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(160) NOT NULL,
    is_headquarter BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ums_branches_single_hq
    ON ums_branches (is_headquarter)
    WHERE is_headquarter = TRUE;

CREATE TABLE IF NOT EXISTS ums_security_groups (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    description_en VARCHAR(500) NOT NULL DEFAULT '',
    description_ar VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_security_group_permissions (
    security_group_id UUID NOT NULL REFERENCES ums_security_groups(id) ON DELETE CASCADE,
    module_key VARCHAR(32) NOT NULL CHECK (module_key IN ('ums', 'edms', 'service', 'workflow', 'request', 'asset', 'ticketing')),
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_write BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    can_export BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (security_group_id, module_key)
);

CREATE TABLE IF NOT EXISTS ums_roles (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    security_group_id UUID NOT NULL REFERENCES ums_security_groups(id) ON DELETE RESTRICT,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    description_en VARCHAR(500) NOT NULL DEFAULT '',
    description_ar VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_departments (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    head_employee_id UUID NULL,
    description_en VARCHAR(500) NOT NULL DEFAULT '',
    description_ar VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_designations (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    title_en VARCHAR(160) NOT NULL,
    title_ar VARCHAR(160) NOT NULL,
    department_id UUID NULL REFERENCES ums_departments(id) ON DELETE RESTRICT,
    description_en VARCHAR(500) NOT NULL DEFAULT '',
    description_ar VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_custom_addons (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    addon_type VARCHAR(32) NOT NULL CHECK (addon_type IN ('bank', 'religion', 'job_title', 'job_grade')),
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    description_en VARCHAR(500),
    description_ar VARCHAR(500),
    grade_level SMALLINT CHECK (grade_level IS NULL OR grade_level >= 1),
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive')),
    created_by VARCHAR(160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_employees (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Draft')),
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    work_email VARCHAR(160),
    phone VARCHAR(32) NOT NULL,
    dob_gregorian DATE,
    dob_hijri VARCHAR(32),
    religion_id UUID NULL REFERENCES ums_custom_addons(id) ON DELETE RESTRICT,
    marital_status VARCHAR(24) NOT NULL,
    gender VARCHAR(16) NOT NULL,
    citizenship VARCHAR(24) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    branch_id UUID NOT NULL REFERENCES ums_branches(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES ums_departments(id) ON DELETE RESTRICT,
    designation_id UUID NOT NULL REFERENCES ums_designations(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES ums_roles(id) ON DELETE RESTRICT,
    job_title_id UUID NULL REFERENCES ums_custom_addons(id) ON DELETE RESTRICT,
    job_grade_id UUID NOT NULL REFERENCES ums_custom_addons(id) ON DELETE RESTRICT,
    manager_id UUID NULL REFERENCES ums_employees(id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
    joining_date DATE NOT NULL,
    contract_type VARCHAR(32) NOT NULL,
    probation_period_days SMALLINT NOT NULL DEFAULT 90,
    is_under_probation BOOLEAN NOT NULL DEFAULT FALSE,
    employment_type VARCHAR(32) NOT NULL,
    invitation_status VARCHAR(24) NOT NULL DEFAULT 'Not Sent',
    created_by VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ums_employees_no_self_manager CHECK (manager_id IS NULL OR manager_id <> id)
);

ALTER TABLE ums_departments
    ADD CONSTRAINT fk_ums_departments_head_employee
    FOREIGN KEY (head_employee_id) REFERENCES ums_employees(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS ums_employee_compensation (
    employee_id UUID PRIMARY KEY REFERENCES ums_employees(id) ON DELETE CASCADE,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (basic_salary >= 0),
    housing_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (housing_allowance >= 0),
    transportation_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (transportation_allowance >= 0),
    food_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (food_allowance >= 0),
    other_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_allowances >= 0),
    gross_salary NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gross_salary >= 0),
    net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (net_salary >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_employee_banking (
    employee_id UUID PRIMARY KEY REFERENCES ums_employees(id) ON DELETE CASCADE,
    bank_id UUID NULL REFERENCES ums_custom_addons(id) ON DELETE RESTRICT,
    account_holder_name VARCHAR(160),
    iban VARCHAR(34),
    account_number VARCHAR(34),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_employee_regulatory_docs (
    employee_id UUID PRIMARY KEY REFERENCES ums_employees(id) ON DELETE CASCADE,
    iqama_number VARCHAR(32),
    iqama_profession VARCHAR(160),
    iqama_expiry_date DATE,
    work_permit_number VARCHAR(64),
    work_permit_expiry_date DATE,
    passport_number VARCHAR(32),
    passport_issue_country VARCHAR(100),
    passport_issue_date DATE,
    passport_expiry DATE,
    visa_number VARCHAR(32),
    visa_type VARCHAR(64),
    visa_border_number VARCHAR(32),
    visa_issue_date DATE,
    visa_expiry DATE,
    contract_number VARCHAR(64),
    contract_start_date DATE,
    contract_end_date DATE,
    driving_license_number VARCHAR(64),
    driving_license_type VARCHAR(64),
    driving_license_issue_date DATE,
    driving_license_expiry DATE,
    gosi_subscription_number VARCHAR(64),
    professional_subscription_number VARCHAR(64),
    subscription_issue_date DATE,
    subscription_expiry_date DATE,
    health_insurance_provider VARCHAR(120),
    health_insurance_policy VARCHAR(64),
    health_insurance_class VARCHAR(32),
    health_insurance_expiry DATE,
    health_card_number VARCHAR(64),
    health_card_authority VARCHAR(120),
    health_card_issue_date DATE,
    health_card_expiry_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ums_employee_attachments (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES ums_employees(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880),
    mime_type VARCHAR(64) NOT NULL,
    storage_object_key VARCHAR(512) NOT NULL,
    sha256_checksum VARCHAR(64),
    uploaded_by UUID NULL REFERENCES ums_employees(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, category)
);

CREATE TABLE IF NOT EXISTS ums_employee_dependents (
    id UUID PRIMARY KEY,
    legacy_id VARCHAR(64) UNIQUE,
    employee_id UUID NOT NULL REFERENCES ums_employees(id) ON DELETE CASCADE,
    name_en VARCHAR(160) NOT NULL,
    name_ar VARCHAR(160) NOT NULL,
    relationship VARCHAR(24) NOT NULL CHECK (relationship IN ('Spouse', 'Child', 'Parent', 'Other')),
    dob DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    nationality VARCHAR(100),
    national_id_or_iqama VARCHAR(32) NOT NULL,
    id_expiry_date DATE,
    passport_number VARCHAR(32),
    insurance_included BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_object_key VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, national_id_or_iqama)
);

CREATE TABLE IF NOT EXISTS ums_audit_events (
    id UUID PRIMARY KEY,
    event_code VARCHAR(32) NOT NULL UNIQUE,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(160) NOT NULL,
    actor_email VARCHAR(160) NOT NULL,
    action VARCHAR(24) NOT NULL,
    resource_type VARCHAR(32) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    details_en TEXT NOT NULL,
    details_ar TEXT NOT NULL,
    previous_state VARCHAR(240),
    new_state VARCHAR(240)
);

CREATE TABLE IF NOT EXISTS ums_migration_ledger (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    batch_checksum VARCHAR(64) NOT NULL,
    source_version VARCHAR(32) NOT NULL DEFAULT 'v1',
    migrated_counts JSONB NOT NULL,
    executed_by VARCHAR(160) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;`;

// ============================================================================
// 3. BACKEND-ENFORCED ZERO-TRUST RBAC & FIELD-LEVEL REDACTION ENGINE
// ============================================================================

export interface UmsActorContext {
    isAuthenticated: boolean;
    actorEmployeeId?: string;
    actorRoleId?: string;
    actorSecurityGroupId?: string;
    actorEmail?: string;
}

export interface UmsRbacDecision {
    allowed: boolean;
    statusCode: 200 | 401 | 403;
    reasonCode:
        | 'ALLOWED'
        | 'UNAUTHENTICATED_SESSION'
        | 'ACTOR_EMPLOYEE_NOT_ACTIVE'
        | 'ACTOR_ROLE_MISSING_OR_INACTIVE'
        | 'ACTOR_SECURITY_GROUP_MISSING_OR_INACTIVE'
        | 'MODULE_PERMISSION_DENIED'
        | 'AUDIT_TRAIL_IMMUTABLE'
        | 'SECURITY_ADMIN_LEVEL_1_REQUIRED'
        | 'SELF_PRIVILEGE_ESCALATION_BLOCKED'
        | 'ROLE_LEVEL_ESCALATION_BLOCKED'
        | 'SECURITY_GROUP_ESCALATION_BLOCKED';
    reasonEn: string;
    reasonAr: string;
    effectiveRole?: RoleRecord;
    effectiveSecurityGroup?: SecurityGroupRecord;
}

/**
 * Evaluates server-grade RBAC permissions using a strict Default-Deny model.
 * If authentication, active employee status (when employee-bound), active role,
 * or active security group cannot be established, access is denied immediately.
 */
export function evaluateUmsRbacDecision(params: {
    actor: UmsActorContext | null | undefined;
    module?: UmsModuleKey;
    resource: UmsProtectedResource;
    operation: UmsOperation;
    roles?: RoleRecord[];
    securityGroups?: SecurityGroupRecord[];
    employees?: EmployeeRecord[];
}): UmsRbacDecision {
    const {
        actor,
        module = 'ums',
        resource,
        operation,
        roles = loadRoles(),
        securityGroups = loadSecurityGroups(),
        employees = loadEmployees(),
    } = params;

    if (!actor || !actor.isAuthenticated) {
        return {
            allowed: false,
            statusCode: 401,
            reasonCode: 'UNAUTHENTICATED_SESSION',
            reasonEn: 'Access denied: No verified authenticated session was provided.',
            reasonAr: 'تم رفض الوصول: لا توجد جلسة مصادقة موثقة.',
        };
    }

    // Resolve actor employee if bound
    let resolvedRoleId = actor.actorRoleId;
    if (actor.actorEmployeeId) {
        const actorEmp = employees.find((e) => e.id === actor.actorEmployeeId);
        if (!actorEmp || actorEmp.status !== 'Active') {
            return {
                allowed: false,
                statusCode: 403,
                reasonCode: 'ACTOR_EMPLOYEE_NOT_ACTIVE',
                reasonEn:
                    'Access denied: Actor employee profile does not exist or is not in Active status.',
                reasonAr: 'تم رفض الوصول: ملف الموظف غير موجود أو غير نشط حالياً.',
            };
        }
        resolvedRoleId = resolvedRoleId || actorEmp.roleId;
    }

    if (!resolvedRoleId) {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'ACTOR_ROLE_MISSING_OR_INACTIVE',
            reasonEn: 'Access denied: No role is assigned to the current principal.',
            reasonAr: 'تم رفض الوصول: لم يتم تعيين دور وظيفي للمستخدم الحالي.',
        };
    }

    const role = roles.find((r) => r.id === resolvedRoleId);
    if (!role || role.status !== 'Active') {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'ACTOR_ROLE_MISSING_OR_INACTIVE',
            reasonEn: 'Access denied: Assigned role does not exist or is Inactive.',
            reasonAr: 'تم رفض الوصول: الدور الوظيفي المسند غير موجود أو غير نشط.',
        };
    }

    const sgId = actor.actorSecurityGroupId || role.securityGroupId;
    const sg = securityGroups.find((g) => g.id === sgId);
    if (!sg || sg.status !== 'Active' || !sg.permissions) {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'ACTOR_SECURITY_GROUP_MISSING_OR_INACTIVE',
            reasonEn: 'Access denied: Linked security group does not exist or is Inactive.',
            reasonAr: 'تم رفض الوصول: مجموعة الأمان المرتبطة غير موجودة أو غير نشطة.',
        };
    }

    // Immutable Audit Trail enforcement
    if (
        resource === 'Audit Trail' &&
        (operation === 'create' || operation === 'update' || operation === 'delete')
    ) {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'AUDIT_TRAIL_IMMUTABLE',
            reasonEn:
                'Access denied: Audit Trail records are append-only system logs and cannot be created, modified, or deleted by user requests.',
            reasonAr:
                'تم رفض الوصول: سجلات التدقيق محمية ضد الإضافة المباشرة أو التعديل أو الحذف.',
            effectiveRole: role,
            effectiveSecurityGroup: sg,
        };
    }

    // Security Group & Role definition mutations require Level 1 Super Admin
    if (
        (resource === 'Role' || resource === 'Security Group') &&
        (operation === 'create' || operation === 'update' || operation === 'delete')
    ) {
        const isSuperAdmin =
            role.level === 1 &&
            sg.permissions.ums?.read === true &&
            sg.permissions.ums?.write === true;
        if (!isSuperAdmin) {
            return {
                allowed: false,
                statusCode: 403,
                reasonCode: 'SECURITY_ADMIN_LEVEL_1_REQUIRED',
                reasonEn:
                    'Access denied: Modifying Role or Security Group definitions requires an active Level-1 Super Administrator.',
                reasonAr:
                    'تم رفض الوصول: تعديل الأدوار أو مجموعات الأمان يتطلب صلاحية مدير النظام العام (المستوى الأول).',
                effectiveRole: role,
                effectiveSecurityGroup: sg,
            };
        }
    }

    const modulePerms = sg.permissions[module];
    if (!modulePerms) {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'MODULE_PERMISSION_DENIED',
            reasonEn: `Access denied: No permissions configured for module "${module}".`,
            reasonAr: `تم رفض الوصول: لا توجد صلاحيات معرفة للوحدة "${module}".`,
            effectiveRole: role,
            effectiveSecurityGroup: sg,
        };
    }

    const hasCrudFlag =
        operation === 'read'
            ? modulePerms.read
            : operation === 'create' || operation === 'update'
            ? modulePerms.write
            : operation === 'delete'
            ? modulePerms.delete
            : modulePerms.export;

    if (!hasCrudFlag) {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'MODULE_PERMISSION_DENIED',
            reasonEn: `Access denied: Security group "${sg.nameEn}" (${sg.code}) does not grant "${operation}" permission on module "${module}".`,
            reasonAr: `تم رفض الوصول: مجموعة الأمان "${sg.nameAr}" (${sg.code}) لا تمنح صلاحية "${operation}" على وحدة "${module}".`,
            effectiveRole: role,
            effectiveSecurityGroup: sg,
        };
    }

    return {
        allowed: true,
        statusCode: 200,
        reasonCode: 'ALLOWED',
        reasonEn: 'Operation authorized by server RBAC policy.',
        reasonAr: 'العملية مصرح بها وفق سياسة صلاحيات النظام.',
        effectiveRole: role,
        effectiveSecurityGroup: sg,
    };
}

/**
 * Prevents privilege escalation when creating or updating an Employee or Role assignment:
 * 1. An actor cannot modify their own roleId, securityGroupId, or status.
 * 2. A non-Level-1 actor cannot assign a role whose level is higher-privilege (numerically smaller or equal)
 *    than the actor's own role level, nor grant a security group with permissions exceeding the actor's group.
 */
export function validatePrivilegeEscalationGuard(params: {
    actor: UmsActorContext;
    targetEmployeeId?: string;
    previousRoleId?: string;
    proposedRoleId: string;
    previousSecurityGroupId?: string;
    proposedSecurityGroupId?: string;
    roles?: RoleRecord[];
    securityGroups?: SecurityGroupRecord[];
    employees?: EmployeeRecord[];
}): UmsRbacDecision {
    const {
        actor,
        targetEmployeeId,
        previousRoleId,
        proposedRoleId,
        previousSecurityGroupId,
        proposedSecurityGroupId,
        roles = loadRoles(),
        securityGroups = loadSecurityGroups(),
        employees = loadEmployees(),
    } = params;

    const baseDecision = evaluateUmsRbacDecision({
        actor,
        module: 'ums',
        resource: 'Employee',
        operation: previousRoleId ? 'update' : 'create',
        roles,
        securityGroups,
        employees,
    });

    if (!baseDecision.allowed || !baseDecision.effectiveRole || !baseDecision.effectiveSecurityGroup) {
        return baseDecision;
    }

    const actorRole = baseDecision.effectiveRole;
    const actorSg = baseDecision.effectiveSecurityGroup;

    // Rule 1: Prevent self-privilege modification
    if (
        actor.actorEmployeeId &&
        targetEmployeeId &&
        actor.actorEmployeeId === targetEmployeeId
    ) {
        const roleChanged = Boolean(previousRoleId && previousRoleId !== proposedRoleId);
        const sgChanged = Boolean(
            proposedSecurityGroupId &&
                previousSecurityGroupId &&
                previousSecurityGroupId !== proposedSecurityGroupId
        );
        if (roleChanged || sgChanged) {
            return {
                allowed: false,
                statusCode: 403,
                reasonCode: 'SELF_PRIVILEGE_ESCALATION_BLOCKED',
                reasonEn:
                    'Security violation: Principals are prohibited from modifying their own role or security group assignment.',
                reasonAr:
                    'مخالفة أمنية: يُمنع المستخدم من تعديل دوره الوظيفي أو مجموعة الأمان الخاصة بحسابه الشخصي.',
                effectiveRole: actorRole,
                effectiveSecurityGroup: actorSg,
            };
        }
    }

    const targetRole = roles.find((r) => r.id === proposedRoleId);
    if (!targetRole || targetRole.status !== 'Active') {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'ACTOR_ROLE_MISSING_OR_INACTIVE',
            reasonEn: 'Proposed target role does not exist or is Inactive.',
            reasonAr: 'الدور الوظيفي المقترح غير موجود أو غير نشط.',
            effectiveRole: actorRole,
            effectiveSecurityGroup: actorSg,
        };
    }

    // Rule 2: Prevent assigning a role with higher privilege than the actor's own role
    // (Level 1 is highest privilege; only Level 1 can assign Level 1 or equal-level administrative roles)
    if (actorRole.level > 1 && targetRole.level <= actorRole.level) {
        const isUnchangedExistingRole = Boolean(previousRoleId && previousRoleId === proposedRoleId);
        if (!isUnchangedExistingRole) {
            return {
                allowed: false,
                statusCode: 403,
                reasonCode: 'ROLE_LEVEL_ESCALATION_BLOCKED',
                reasonEn: `Security violation: Actor with Role Level ${actorRole.level} cannot grant Role "${targetRole.nameEn}" (Level ${targetRole.level}).`,
                reasonAr: `مخالفة أمنية: لا يمكن لمستخدم بمستوى صلاحية (${actorRole.level}) منح الدور "${targetRole.nameAr}" ذي المستوى (${targetRole.level}).`,
                effectiveRole: actorRole,
                effectiveSecurityGroup: actorSg,
            };
        }
    }

    // Rule 3: Prevent granting a security group that possesses permissions the actor lacks
    const targetSgId = proposedSecurityGroupId || targetRole.securityGroupId;
    const targetSg = securityGroups.find((g) => g.id === targetSgId);
    if (!targetSg || targetSg.status !== 'Active') {
        return {
            allowed: false,
            statusCode: 403,
            reasonCode: 'ACTOR_SECURITY_GROUP_MISSING_OR_INACTIVE',
            reasonEn: 'Target security group does not exist or is Inactive.',
            reasonAr: 'مجموعة الأمان المستهدفة غير موجودة أو غير نشطة.',
            effectiveRole: actorRole,
            effectiveSecurityGroup: actorSg,
        };
    }

    if (actorRole.level > 1) {
        const moduleKeys: UmsModuleKey[] = [
            'ums',
            'edms',
            'service',
            'workflow',
            'request',
            'asset',
            'ticketing',
        ];
        for (const mod of moduleKeys) {
            const actorMod = actorSg.permissions[mod];
            const targetMod = targetSg.permissions[mod];
            if (
                (targetMod.read && !actorMod.read) ||
                (targetMod.write && !actorMod.write) ||
                (targetMod.delete && !actorMod.delete) ||
                (targetMod.export && !actorMod.export)
            ) {
                const isUnchangedRoleAndGroup = Boolean(
                    previousRoleId === proposedRoleId &&
                        (!proposedSecurityGroupId ||
                            previousSecurityGroupId === proposedSecurityGroupId)
                );
                if (!isUnchangedRoleAndGroup) {
                    return {
                        allowed: false,
                        statusCode: 403,
                        reasonCode: 'SECURITY_GROUP_ESCALATION_BLOCKED',
                        reasonEn: `Security violation: Cannot assign security group "${targetSg.nameEn}" because it grants elevated "${mod}" permissions not held by the actor.`,
                        reasonAr: `مخالفة أمنية: لا يمكن إسناد مجموعة الأمان "${targetSg.nameAr}" لأنها تمنح صلاحيات أعلى في وحدة "${mod}" لا يملكها المستخدم الحالي.`,
                        effectiveRole: actorRole,
                        effectiveSecurityGroup: actorSg,
                    };
                }
            }
        }
    }

    return {
        allowed: true,
        statusCode: 200,
        reasonCode: 'ALLOWED',
        reasonEn: 'Role and security group assignment validated.',
        reasonAr: 'تم التحقق من سلامة إسناد الدور ومجموعة الأمان.',
        effectiveRole: actorRole,
        effectiveSecurityGroup: actorSg,
    };
}

export interface EmployeeFieldAccessProfile {
    canReadDirectoryBasic: boolean;
    canReadCompensation: boolean;
    canWriteCompensation: boolean;
    canReadBanking: boolean;
    canWriteBanking: boolean;
    canReadIdentityDocuments: boolean;
    canWriteIdentityDocuments: boolean;
    canReadDependents: boolean;
    canWriteDependents: boolean;
    isRedactedView: boolean;
}

export function resolveEmployeeFieldAccess(params: {
    actor: UmsActorContext;
    targetEmployeeId?: string;
    roles?: RoleRecord[];
    securityGroups?: SecurityGroupRecord[];
    employees?: EmployeeRecord[];
}): EmployeeFieldAccessProfile {
    const readDecision = evaluateUmsRbacDecision({
        actor: params.actor,
        module: 'ums',
        resource: 'Employee',
        operation: 'read',
        roles: params.roles,
        securityGroups: params.securityGroups,
        employees: params.employees,
    });

    if (!readDecision.allowed || !readDecision.effectiveRole || !readDecision.effectiveSecurityGroup) {
        return {
            canReadDirectoryBasic: false,
            canReadCompensation: false,
            canWriteCompensation: false,
            canReadBanking: false,
            canWriteBanking: false,
            canReadIdentityDocuments: false,
            canWriteIdentityDocuments: false,
            canReadDependents: false,
            canWriteDependents: false,
            isRedactedView: true,
        };
    }

    const role = readDecision.effectiveRole;
    const sg = readDecision.effectiveSecurityGroup;
    const isSelf = Boolean(
        params.actor.actorEmployeeId &&
            params.targetEmployeeId &&
            params.actor.actorEmployeeId === params.targetEmployeeId
    );
    const isSuperAdmin = role.level === 1 && sg.permissions.ums.write && sg.permissions.ums.delete;
    const isHrManager = sg.permissions.ums.read && sg.permissions.ums.write;
    const isComplianceAuditor =
        sg.permissions.ums.read && !sg.permissions.ums.write && sg.permissions.ums.export && role.level <= 2;

    const canReadSensitive = isSuperAdmin || isHrManager || isComplianceAuditor || isSelf;
    const canWriteSensitive = isSuperAdmin || isHrManager;

    return {
        canReadDirectoryBasic: true,
        canReadCompensation: canReadSensitive,
        canWriteCompensation: canWriteSensitive,
        canReadBanking: canReadSensitive,
        canWriteBanking: canWriteSensitive,
        canReadIdentityDocuments: canReadSensitive,
        canWriteIdentityDocuments: canWriteSensitive,
        canReadDependents: canReadSensitive,
        canWriteDependents: canWriteSensitive,
        isRedactedView: !canReadSensitive,
    };
}

export function maskSensitiveIdentifier(value?: string, visibleTail: number = 4): string | undefined {
    if (!value || !value.trim()) return undefined;
    const clean = value.trim();
    if (clean.length <= visibleTail) return '****';
    const prefix = clean.startsWith('SA') ? 'SA' : '';
    const bodyLength = Math.max(4, clean.length - prefix.length - visibleTail);
    return `${prefix}${'*'.repeat(bodyLength)}${clean.slice(-visibleTail)}`;
}

/**
 * Redacts an EmployeeRecord for actors who have basic directory `ums.read` access
 * (such as Operations & Service Officers `SEC-003`) but lack HR/Finance/SuperAdmin/Auditor
 * authorization to view compensation, bank account numbers, IBANs, or raw identity documents.
 */
export function redactEmployeeForActor(
    employee: EmployeeRecord,
    actor: UmsActorContext,
    context?: {
        roles?: RoleRecord[];
        securityGroups?: SecurityGroupRecord[];
        employees?: EmployeeRecord[];
    }
): EmployeeRecord & { __redactedScopes?: UmsSensitiveFieldScope[] } {
    const fieldAccess = resolveEmployeeFieldAccess({
        actor,
        targetEmployeeId: employee.id,
        roles: context?.roles,
        securityGroups: context?.securityGroups,
        employees: context?.employees,
    });

    if (!fieldAccess.isRedactedView) {
        return {
            ...employee,
            __redactedScopes: [],
        };
    }

    const redactedScopes: UmsSensitiveFieldScope[] = [
        'compensation',
        'banking',
        'identity_documents',
        'dependents',
    ];

    return {
        ...employee,
        salaryDetails: {
            basicSalary: 0,
            housingAllowance: 0,
            transportationAllowance: 0,
            foodAllowance: 0,
            otherAllowances: 0,
            grossSalary: 0,
            netSalary: 0,
        },
        iban: maskSensitiveIdentifier(employee.iban, 4),
        accountNumber: maskSensitiveIdentifier(employee.accountNumber, 4),
        iqamaNumber: maskSensitiveIdentifier(employee.iqamaNumber, 4),
        passportNumber: maskSensitiveIdentifier(employee.passportNumber, 3),
        gosiSubscriptionNumber: maskSensitiveIdentifier(employee.gosiSubscriptionNumber, 3),
        visaNumber: maskSensitiveIdentifier(employee.visaNumber, 3),
        documentAttachments: undefined,
        dependents: (employee.dependents || []).map((dep) => ({
            ...dep,
            nationalIdOrIqama: maskSensitiveIdentifier(dep.nationalIdOrIqama, 4) || '******',
            passportNumber: maskSensitiveIdentifier(dep.passportNumber, 3),
            documentAttachment: undefined,
        })),
        __redactedScopes: redactedScopes,
    };
}

// ============================================================================
// 4. DETERMINISTIC ID MAPPING, DRY-RUN MIGRATION VALIDATOR & ROLLBACK ENGINE
// ============================================================================

/**
 * Generates a deterministic UUID (v5-formatted 36-char string) from a domain namespace
 * and legacy identifier (`emp-1`, `dep-1`, `BRN-001`, etc.).
 * Ensures retrying migration produces identical database primary keys and prevents duplicate imports.
 */
export function buildDeterministicUmsUuid(namespace: string, legacyIdOrCode: string): string {
    const input = `awn-ums-v1:${namespace.trim().toLowerCase()}:${legacyIdOrCode.trim().toLowerCase()}`;
    const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];

    for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        for (let s = 0; s < seeds.length; s++) {
            seeds[s] = Math.imul(seeds[s] ^ (code + s * 31), 0x01000193) >>> 0;
            seeds[s] = ((seeds[s] << 13) | (seeds[s] >>> 19)) >>> 0;
        }
    }

    const hex = seeds.map((n) => n.toString(16).padStart(8, '0')).join('');
    const p1 = hex.slice(0, 8);
    const p2 = hex.slice(8, 12);
    const p3 = `5${hex.slice(13, 16)}`;
    const variantNibble = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
    const p4 = `${variantNibble}${hex.slice(17, 20)}`;
    const p5 = hex.slice(20, 32);

    return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export type UmsMigrationAnomalySeverity = 'blocking_error' | 'warning';

export interface UmsMigrationAnomaly {
    severity: UmsMigrationAnomalySeverity;
    entityType: UmsProtectedResource;
    recordId: string;
    field: string;
    code:
        | 'DUPLICATE_ID'
        | 'DUPLICATE_CODE'
        | 'DUPLICATE_EMAIL'
        | 'DUPLICATE_IQAMA'
        | 'ORPHAN_FOREIGN_KEY'
        | 'CIRCULAR_MANAGER_CHAIN'
        | 'HQ_BRANCH_INVARIANT'
        | 'SCHEMA_VALIDATION_ERROR'
        | 'INLINE_ATTACHMENT_EXTERNALIZATION_REQUIRED'
        | 'STORAGE_CORRUPTION_DETECTED';
    messageEn: string;
    messageAr: string;
}

export interface UmsMigrationIdMapping {
    entityType: UmsProtectedResource;
    legacyId: string;
    businessCode: string;
    targetUuid: string;
}

export interface UmsMigrationDryRunReport {
    dryRunTimestamp: string;
    readyToMigrate: boolean;
    idempotencyKey: string;
    alreadyMigratedInLedger: boolean;
    dependencyOrder: readonly string[];
    counts: {
        branches: number;
        securityGroups: number;
        roles: number;
        departments: number;
        designations: number;
        customAddons: number;
        employees: number;
        dependents: number;
        auditEvents: number;
    };
    blockingErrorCount: number;
    warningCount: number;
    anomalies: UmsMigrationAnomaly[];
    idMappings: UmsMigrationIdMapping[];
}

export function runUmsLocalStorageMigrationDryRun(customDataset?: {
    branches?: BranchRecord[];
    securityGroups?: SecurityGroupRecord[];
    roles?: RoleRecord[];
    departments?: DepartmentRecord[];
    designations?: DesignationRecord[];
    customAddons?: CustomAddonRecord[];
    employees?: EmployeeRecord[];
    auditEvents?: UmsAuditEvent[];
}): UmsMigrationDryRunReport {
    const branches = customDataset?.branches ?? loadBranches();
    const securityGroups = customDataset?.securityGroups ?? loadSecurityGroups();
    const roles = customDataset?.roles ?? loadRoles();
    const departments = customDataset?.departments ?? loadDepartments();
    const designations = customDataset?.designations ?? loadDesignations();
    const customAddons = customDataset?.customAddons ?? loadCustomAddons();
    const employees = customDataset?.employees ?? loadEmployees();
    const auditEvents = customDataset?.auditEvents ?? loadUmsAuditTrail();

    const anomalies: UmsMigrationAnomaly[] = [];
    const idMappings: UmsMigrationIdMapping[] = [];

    // 0. Check storage health if running against live localStorage
    if (!customDataset) {
        const health = inspectUmsStorageHealth();
        for (const [key, item] of Object.entries(health)) {
            if (item.status === 'corrupted_json' || item.status === 'non_array_json') {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: key,
                    field: key,
                    code: 'STORAGE_CORRUPTION_DETECTED',
                    messageEn: `Storage key "${key}" contains corrupted payload (${item.status}). Inspect backup key "${key}__corrupted_backup" before migrating.`,
                    messageAr: `المفتاح التخزيني "${key}" يحتوي على بيانات تالفة (${item.status}). يرجى مراجعة النسخة الاحتياطية قبل الترحيل.`,
                });
            }
        }
    }

    const checkUnique = (
        entityType: UmsProtectedResource,
        records: Array<{ id: string; code: string }>,
        namespace: string
    ) => {
        const seenIds = new Set<string>();
        const seenCodes = new Set<string>();
        for (const rec of records) {
            const normId = rec.id.trim().toLowerCase();
            const normCode = rec.code.trim().toUpperCase();
            if (seenIds.has(normId)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType,
                    recordId: rec.id,
                    field: 'id',
                    code: 'DUPLICATE_ID',
                    messageEn: `Duplicate legacy ID "${rec.id}" in ${entityType}.`,
                    messageAr: `تكرار المعرف الداخلي "${rec.id}" في ${entityType}.`,
                });
            }
            seenIds.add(normId);

            if (seenCodes.has(normCode)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType,
                    recordId: rec.id,
                    field: 'code',
                    code: 'DUPLICATE_CODE',
                    messageEn: `Duplicate business code "${rec.code}" in ${entityType}.`,
                    messageAr: `تكرار الرمز المعياري "${rec.code}" في ${entityType}.`,
                });
            }
            seenCodes.add(normCode);

            idMappings.push({
                entityType,
                legacyId: rec.id,
                businessCode: rec.code,
                targetUuid: buildDeterministicUmsUuid(namespace, rec.id),
            });
        }
    };

    checkUnique('Branch', branches, 'branch');
    checkUnique('Security Group', securityGroups, 'security_group');
    checkUnique('Role', roles, 'role');
    checkUnique('Department', departments, 'department');
    checkUnique('Designation', designations, 'designation');
    checkUnique('Custom Addon', customAddons, 'custom_addon');
    checkUnique('Employee', employees, 'employee');

    // 1. Branch HQ invariant & schema validation
    const hqBranches = branches.filter((b) => b.isHeadquarter);
    if (hqBranches.length !== 1) {
        anomalies.push({
            severity: 'blocking_error',
            entityType: 'Branch',
            recordId: hqBranches.map((b) => b.id).join(',') || 'none',
            field: 'isHeadquarter',
            code: 'HQ_BRANCH_INVARIANT',
            messageEn: `Expected exactly 1 Headquarters branch, found ${hqBranches.length}.`,
            messageAr: `يجب وجود مقر رئيسي واحد فقط، ولكن تم العثور على (${hqBranches.length}).`,
        });
    }
    for (const brn of branches) {
        const res = umsBranchSchema.safeParse(brn);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Branch',
                recordId: brn.id,
                field: res.error.issues[0]?.path.join('.') || 'branch',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid branch schema',
                messageAr: 'خطأ في التحقق من صحة مخطط بيانات الفرع',
            });
        }
    }

    // 2. Security Groups & Roles FK + Schema checks
    const sgIds = new Set(securityGroups.map((g) => g.id));
    for (const sg of securityGroups) {
        const res = umsSecurityGroupSchema.safeParse(sg);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Security Group',
                recordId: sg.id,
                field: res.error.issues[0]?.path.join('.') || 'securityGroup',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid security group schema',
                messageAr: 'خطأ في التحقق من صحة مجموعة الأمان',
            });
        }
    }

    const roleIds = new Set(roles.map((r) => r.id));
    for (const role of roles) {
        if (!sgIds.has(role.securityGroupId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Role',
                recordId: role.id,
                field: 'securityGroupId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Role "${role.code}" references non-existent securityGroupId "${role.securityGroupId}".`,
                messageAr: `الدور "${role.code}" يشير إلى مجموعة أمان غير موجودة "${role.securityGroupId}".`,
            });
        }
        const res = umsRoleSchema.safeParse(role);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Role',
                recordId: role.id,
                field: res.error.issues[0]?.path.join('.') || 'role',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid role schema',
                messageAr: 'خطأ في التحقق من صحة الدور الوظيفي',
            });
        }
    }

    // 3. Departments & Designations FK + Schema checks
    const deptIds = new Set(departments.map((d) => d.id));
    const empIds = new Set(employees.map((e) => e.id));
    for (const dept of departments) {
        if (dept.headEmployeeId && !empIds.has(dept.headEmployeeId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Department',
                recordId: dept.id,
                field: 'headEmployeeId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Department "${dept.code}" references non-existent headEmployeeId "${dept.headEmployeeId}".`,
                messageAr: `القسم "${dept.code}" يشير إلى مدير قسم غير موجود "${dept.headEmployeeId}".`,
            });
        }
        const res = umsDepartmentSchema.safeParse(dept);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Department',
                recordId: dept.id,
                field: res.error.issues[0]?.path.join('.') || 'department',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid department schema',
                messageAr: 'خطأ في التحقق من صحة بيانات القسم',
            });
        }
    }

    const desigIds = new Set(designations.map((d) => d.id));
    for (const desig of designations) {
        if (desig.departmentId && !deptIds.has(desig.departmentId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Designation',
                recordId: desig.id,
                field: 'departmentId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Designation "${desig.code}" references non-existent departmentId "${desig.departmentId}".`,
                messageAr: `المسمى الوظيفي "${desig.code}" يشير إلى قسم غير موجود "${desig.departmentId}".`,
            });
        }
        const res = umsDesignationSchema.safeParse(desig);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Designation',
                recordId: desig.id,
                field: res.error.issues[0]?.path.join('.') || 'designation',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid designation schema',
                messageAr: 'خطأ في التحقق من صحة المسمى الوظيفي',
            });
        }
    }

    // 4. Custom Addons uniqueness & validation
    const addonIds = new Set(customAddons.map((a) => a.id));
    const seenAddonTypeName = new Set<string>();
    for (const addon of customAddons) {
        const keyEn = `${addon.type}:${normalizeCustomAddonText(addon.nameEn, 'en')}`;
        if (seenAddonTypeName.has(keyEn)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Custom Addon',
                recordId: addon.id,
                field: 'nameEn',
                code: 'DUPLICATE_CODE',
                messageEn: `Duplicate Custom Addon name "${addon.nameEn}" within category "${addon.type}".`,
                messageAr: `تكرار اسم الإضافة المخصصة "${addon.nameEn}" ضمن فئة "${addon.type}".`,
            });
        }
        seenAddonTypeName.add(keyEn);

        const res = umsCustomAddonSchema.safeParse(addon);
        if (!res.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Custom Addon',
                recordId: addon.id,
                field: res.error.issues[0]?.path.join('.') || 'customAddon',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid custom addon schema',
                messageAr: 'خطأ في التحقق من صحة الإضافة المخصصة',
            });
        }
    }

    // 5. Employees uniqueness, FKs, circular managers & inline attachments
    const branchIds = new Set(branches.map((b) => b.id));
    const seenEmails = new Set<string>();
    const seenWorkEmails = new Set<string>();
    const seenIqamas = new Set<string>();
    let totalDependents = 0;

    for (const emp of employees) {
        totalDependents += Array.isArray(emp.dependents) ? emp.dependents.length : 0;

        const normEmail = (emp.email || '').trim().toLowerCase();
        if (normEmail) {
            if (seenEmails.has(normEmail)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: emp.id,
                    field: 'email',
                    code: 'DUPLICATE_EMAIL',
                    messageEn: `Duplicate personal email "${emp.email}" on employee "${emp.code}".`,
                    messageAr: `تكرار البريد الإلكتروني الشخصي "${emp.email}" للموظف "${emp.code}".`,
                });
            }
            seenEmails.add(normEmail);
        }

        const normWorkEmail = (emp.workEmail || '').trim().toLowerCase();
        if (normWorkEmail) {
            if (seenWorkEmails.has(normWorkEmail)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: emp.id,
                    field: 'workEmail',
                    code: 'DUPLICATE_EMAIL',
                    messageEn: `Duplicate work email "${emp.workEmail}" on employee "${emp.code}".`,
                    messageAr: `تكرار البريد الوظيفي "${emp.workEmail}" للموظف "${emp.code}".`,
                });
            }
            seenWorkEmails.add(normWorkEmail);
        }

        const normIqama = (emp.iqamaNumber || '').trim();
        if (normIqama) {
            if (seenIqamas.has(normIqama)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: emp.id,
                    field: 'iqamaNumber',
                    code: 'DUPLICATE_IQAMA',
                    messageEn: `Duplicate National ID / Iqama "${normIqama}" on employee "${emp.code}".`,
                    messageAr: `تكرار رقم الهوية / الإقامة "${normIqama}" للموظف "${emp.code}".`,
                });
            }
            seenIqamas.add(normIqama);
        }

        if (!branchIds.has(emp.branchId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'branchId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing branchId "${emp.branchId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى فرع غير موجود "${emp.branchId}".`,
            });
        }
        if (!deptIds.has(emp.departmentId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'departmentId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing departmentId "${emp.departmentId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى قسم غير موجود "${emp.departmentId}".`,
            });
        }
        if (!desigIds.has(emp.designationId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'designationId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing designationId "${emp.designationId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى مسمى وظيفي غير موجود "${emp.designationId}".`,
            });
        }
        if (!roleIds.has(emp.roleId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'roleId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing roleId "${emp.roleId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى دور وظيفي غير موجود "${emp.roleId}".`,
            });
        }
        if (!addonIds.has(emp.jobGradeId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'jobGradeId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing jobGradeId "${emp.jobGradeId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى درجة وظيفية غير موجودة "${emp.jobGradeId}".`,
            });
        }
        if (emp.jobTitleId && !addonIds.has(emp.jobTitleId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'jobTitleId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing jobTitleId "${emp.jobTitleId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى مسمى إضافي غير موجود "${emp.jobTitleId}".`,
            });
        }
        if (emp.bankId && !addonIds.has(emp.bankId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'bankId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing bankId "${emp.bankId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى بنك غير موجود "${emp.bankId}".`,
            });
        }
        if (emp.religionId && !addonIds.has(emp.religionId)) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'religionId',
                code: 'ORPHAN_FOREIGN_KEY',
                messageEn: `Employee "${emp.code}" references missing religionId "${emp.religionId}".`,
                messageAr: `الموظف "${emp.code}" يشير إلى ديانة غير موجودة "${emp.religionId}".`,
            });
        }
        if (emp.managerId) {
            if (!empIds.has(emp.managerId)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: emp.id,
                    field: 'managerId',
                    code: 'ORPHAN_FOREIGN_KEY',
                    messageEn: `Employee "${emp.code}" references missing managerId "${emp.managerId}".`,
                    messageAr: `الموظف "${emp.code}" يشير إلى مدير مباشر غير موجود "${emp.managerId}".`,
                });
            } else if (wouldCreateCircularManagerChain(emp.id, emp.managerId, employees)) {
                anomalies.push({
                    severity: 'blocking_error',
                    entityType: 'Employee',
                    recordId: emp.id,
                    field: 'managerId',
                    code: 'CIRCULAR_MANAGER_CHAIN',
                    messageEn: `Employee "${emp.code}" has a circular manager chain via "${emp.managerId}".`,
                    messageAr: `الموظف "${emp.code}" يقع ضمن سلسلة إدارية دائرية مغلقة عبر "${emp.managerId}".`,
                });
            }
        }

        if (emp.avatarUrl && emp.avatarUrl.startsWith('data:')) {
            anomalies.push({
                severity: 'warning',
                entityType: 'Employee',
                recordId: emp.id,
                field: 'avatarUrl',
                code: 'INLINE_ATTACHMENT_EXTERNALIZATION_REQUIRED',
                messageEn: `Employee "${emp.code}" has an inline DataURL avatar that will be externalized to object storage during migration.`,
                messageAr: `الموظف "${emp.code}" لديه صورة مضمنة (DataURL) سيتم نقلها إلى مخزن الملفات الآمن أثناء الترحيل.`,
            });
        }

        const empSchemaRes = umsEmployeeRecordSchema.safeParse(emp);
        if (!empSchemaRes.success) {
            anomalies.push({
                severity: 'blocking_error',
                entityType: 'Employee',
                recordId: emp.id,
                field: empSchemaRes.error.issues[0]?.path.join('.') || 'employee',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: empSchemaRes.error.issues[0]?.message || 'Invalid employee schema',
                messageAr: 'خطأ في التحقق من صحة مخطط بيانات الموظف',
            });
        }
    }

    for (const ev of auditEvents) {
        const res = umsAuditEventSchema.safeParse(ev);
        if (!res.success) {
            anomalies.push({
                severity: 'warning',
                entityType: 'Audit Trail',
                recordId: ev.id,
                field: res.error.issues[0]?.path.join('.') || 'audit',
                code: 'SCHEMA_VALIDATION_ERROR',
                messageEn: res.error.issues[0]?.message || 'Invalid audit event schema',
                messageAr: 'تحذير في مخطط سجل التدقيق',
            });
        }
    }

    const fingerprintSource = [
        branches.map((b) => `${b.id}:${b.code}`).join(','),
        securityGroups.map((g) => `${g.id}:${g.code}`).join(','),
        roles.map((r) => `${r.id}:${r.code}`).join(','),
        departments.map((d) => `${d.id}:${d.code}`).join(','),
        designations.map((d) => `${d.id}:${d.code}`).join(','),
        customAddons.map((a) => `${a.id}:${a.code}`).join(','),
        employees.map((e) => `${e.id}:${e.code}:${e.updatedAt}`).join(','),
    ].join('|');

    const idempotencyKey = `ums-mig-${buildDeterministicUmsUuid('migration_batch', fingerprintSource)}`;
    const ledger = getUmsMigrationLedger();
    const alreadyMigratedInLedger = ledger.some((entry) => entry.idempotencyKey === idempotencyKey);

    const blockingErrorCount = anomalies.filter((a) => a.severity === 'blocking_error').length;
    const warningCount = anomalies.filter((a) => a.severity === 'warning').length;

    return {
        dryRunTimestamp: new Date().toISOString(),
        readyToMigrate: blockingErrorCount === 0,
        idempotencyKey,
        alreadyMigratedInLedger,
        dependencyOrder: [
            '1. ums_branches',
            '2. ums_security_groups',
            '3. ums_security_group_permissions',
            '4. ums_roles',
            '5. ums_custom_addons (bank, religion, job_title, job_grade)',
            '6. ums_departments (with head_employee_id deferred)',
            '7. ums_designations',
            '8. ums_employees (with manager_id deferred)',
            '9. ums_departments.head_employee_id & ums_employees.manager_id FK resolution',
            '10. ums_employee_compensation & ums_employee_banking & ums_employee_regulatory_docs',
            '11. ums_employee_attachments & ums_employee_dependents',
            '12. ums_audit_events & ums_migration_ledger commit',
        ],
        counts: {
            branches: branches.length,
            securityGroups: securityGroups.length,
            roles: roles.length,
            departments: departments.length,
            designations: designations.length,
            customAddons: customAddons.length,
            employees: employees.length,
            dependents: totalDependents,
            auditEvents: auditEvents.length,
        },
        blockingErrorCount,
        warningCount,
        anomalies,
        idMappings,
    };
}

export interface UmsMigrationBackupSnapshot {
    snapshotId: string;
    createdAt: string;
    checksum: string;
    payload: {
        branches: BranchRecord[];
        securityGroups: SecurityGroupRecord[];
        roles: RoleRecord[];
        departments: DepartmentRecord[];
        designations: DesignationRecord[];
        customAddons: CustomAddonRecord[];
        employees: EmployeeRecord[];
        auditEvents: UmsAuditEvent[];
    };
}

export interface UmsMigrationLedgerEntry {
    idempotencyKey: string;
    snapshotId: string;
    executedAt: string;
    counts: UmsMigrationDryRunReport['counts'];
}

export function getUmsMigrationLedger(): UmsMigrationLedgerEntry[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(UMS_MIGRATION_LEDGER_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as UmsMigrationLedgerEntry[]) : [];
    } catch {
        return [];
    }
}

export function recordUmsMigrationLedgerEntry(entry: UmsMigrationLedgerEntry): {
    recorded: boolean;
    alreadyExists: boolean;
} {
    const existing = getUmsMigrationLedger();
    if (existing.some((e) => e.idempotencyKey === entry.idempotencyKey)) {
        return { recorded: false, alreadyExists: true };
    }
    const next = [entry, ...existing];
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(UMS_MIGRATION_LEDGER_STORAGE_KEY, JSON.stringify(next));
    }
    return { recorded: true, alreadyExists: false };
}

/**
 * Captures a complete, checksummed backup of all 8 `awn_ums_*_v1` collections
 * before any migration or batch transformation occurs.
 */
export function createUmsMigrationBackupSnapshot(): UmsMigrationBackupSnapshot {
    const payload = {
        branches: loadBranches(),
        securityGroups: loadSecurityGroups(),
        roles: loadRoles(),
        departments: loadDepartments(),
        designations: loadDesignations(),
        customAddons: loadCustomAddons(),
        employees: loadEmployees(),
        auditEvents: loadUmsAuditTrail(),
    };

    const serialized = JSON.stringify(payload);
    const checksum = buildDeterministicUmsUuid('snapshot_checksum', serialized);
    const snapshot: UmsMigrationBackupSnapshot = {
        snapshotId: `snap-${Date.now()}`,
        createdAt: new Date().toISOString(),
        checksum,
        payload,
    };

    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
            UMS_MIGRATION_SNAPSHOT_STORAGE_KEY,
            JSON.stringify(snapshot)
        );
    }

    return snapshot;
}

/**
 * Restores all 8 `awn_ums_*_v1` localStorage keys atomically from a backup snapshot,
 * verifying checksum integrity before applying the rollback.
 */
export function restoreUmsMigrationBackupSnapshot(
    explicitSnapshot?: UmsMigrationBackupSnapshot
): {
    restored: boolean;
    snapshotId?: string;
    errorEn?: string;
    errorAr?: string;
} {
    let snapshot = explicitSnapshot;
    if (!snapshot && typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = window.localStorage.getItem(UMS_MIGRATION_SNAPSHOT_STORAGE_KEY);
            if (raw) {
                snapshot = JSON.parse(raw) as UmsMigrationBackupSnapshot;
            }
        } catch {
            return {
                restored: false,
                errorEn: 'Stored migration backup snapshot is malformed JSON.',
                errorAr: 'النسخة الاحتياطية المخزنة للترحيل تالفة ولا يمكن قراءتها.',
            };
        }
    }

    if (!snapshot || !snapshot.payload) {
        return {
            restored: false,
            errorEn: 'No migration backup snapshot was found to restore.',
            errorAr: 'لم يتم العثور على نسخة احتياطية لاستعادتها.',
        };
    }

    const expectedChecksum = buildDeterministicUmsUuid(
        'snapshot_checksum',
        JSON.stringify(snapshot.payload)
    );
    if (expectedChecksum !== snapshot.checksum) {
        return {
            restored: false,
            errorEn: 'Backup snapshot checksum verification failed; rollback aborted to prevent corruption.',
            errorAr: 'فشل التحقق من البصمة الرقمية للنسخة الاحتياطية؛ تم إيقاف الاستعادة لمنع تلف البيانات.',
        };
    }

    saveBranches(snapshot.payload.branches);
    saveSecurityGroups(snapshot.payload.securityGroups);
    saveRoles(snapshot.payload.roles);
    saveDepartments(snapshot.payload.departments);
    saveDesignations(snapshot.payload.designations);
    saveCustomAddons(snapshot.payload.customAddons);
    saveEmployees(snapshot.payload.employees);
    saveUmsAuditTrail(snapshot.payload.auditEvents);

    return {
        restored: true,
        snapshotId: snapshot.snapshotId,
    };
}
