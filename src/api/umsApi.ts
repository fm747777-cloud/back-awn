/**
 * Phase 4G: UMS Frontend Data-Access Abstraction & Dual-Mode Repository
 *
 * Bridges existing UMS pages (`umsMockData.ts` synchronous/localStorage workflows)
 * and the target REST Backend API (`axiosClient` -> `/ums/*`) without requiring
 * a rewrite of existing React 19 UMS components.
 */

import { axiosClient, IS_BACKEND_ENABLED } from './axiosClient';
import { USE_DEMO_MODE } from './api';
import {
    loadEmployees,
    saveEmployees,
    loadDepartments,
    saveDepartments,
    loadDesignations,
    saveDesignations,
    loadBranches,
    saveBranches,
    loadRoles,
    saveRoles,
    loadSecurityGroups,
    saveSecurityGroups,
    loadCustomAddons,
    saveCustomAddons,
    loadUmsAuditTrail,
    recordUmsAuditEvent,
    syncMasterEntityEmployeeCounts,
    checkEmployeeDeletionEligibility,
    checkDepartmentDeletionEligibility,
    checkDesignationDeletionEligibility,
    checkBranchDeletionEligibility,
    checkRoleDeletionEligibility,
    checkSecurityGroupDeletionEligibility,
    checkCustomAddonDeletionEligibility,
    type EmployeeRecord,
    type DepartmentRecord,
    type DesignationRecord,
    type BranchRecord,
    type RoleRecord,
    type SecurityGroupRecord,
    type CustomAddonRecord,
    type UmsAuditEvent,
} from '../pages/ums/umsMockData';

import {
    evaluateUmsRbacDecision,
    validatePrivilegeEscalationGuard,
    redactEmployeeForActor,
    runUmsLocalStorageMigrationDryRun,
    type UmsActorContext,
    type UmsRbacDecision,
    type UmsMigrationDryRunReport,
} from '../pages/ums/umsPersistenceFoundation';

import {
    umsEmployeeRecordSchema,
    umsDepartmentSchema,
    umsDesignationSchema,
    umsBranchSchema,
    umsRoleSchema,
    umsSecurityGroupSchema,
    umsCustomAddonSchema,
} from '../schemas/umsSchema';

export type UmsPersistenceMode = 'local_storage_single_browser' | 'remote_rest_api';

export interface UmsRepositoryResult<T> {
    ok: boolean;
    statusCode: 200 | 201 | 400 | 401 | 403 | 404 | 409;
    persistenceMode: UmsPersistenceMode;
    data?: T;
    errorCode?: string;
    messageEn?: string;
    messageAr?: string;
    validationErrors?: string[];
}

export function getActiveUmsPersistenceMode(): UmsPersistenceMode {
    if (IS_BACKEND_ENABLED && !USE_DEMO_MODE) {
        return 'remote_rest_api';
    }
    return 'local_storage_single_browser';
}

export const DEFAULT_SUPER_ADMIN_ACTOR: UmsActorContext = {
    isAuthenticated: true,
    actorEmployeeId: 'emp-1',
    actorRoleId: 'rol-1',
    actorSecurityGroupId: 'sec-1',
    actorEmail: 'karim@awn.sa',
};

export const umsApi = {
    getPersistenceMode: getActiveUmsPersistenceMode,

    /**
     * Lists employees with RBAC enforcement and automatic field-level PII redaction
     * for non-privileged viewers (e.g. SEC-003 Operations Officers).
     */
    listEmployees: async (
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR,
        params?: { page?: number; limit?: number; search?: string }
    ): Promise<UmsRepositoryResult<EmployeeRecord[]>> => {
        const mode = getActiveUmsPersistenceMode();
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Employee',
            operation: 'read',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }

        if (mode === 'remote_rest_api') {
            const response = await axiosClient.get('/ums/employees', { params });
            const list: EmployeeRecord[] = Array.isArray(response.data?.data)
                ? response.data.data
                : [];
            return {
                ok: true,
                statusCode: 200,
                persistenceMode: mode,
                data: list.map((emp) => redactEmployeeForActor(emp, actor)),
            };
        }

        const all = loadEmployees();
        const redacted = all.map((emp) => redactEmployeeForActor(emp, actor, { employees: all }));
        return {
            ok: true,
            statusCode: 200,
            persistenceMode: mode,
            data: redacted,
        };
    },

    /**
     * Creates or updates an employee record with:
     * 1. Default-Deny RBAC check (`ums.write`)
     * 2. Privilege-escalation guard (blocks self-escalation and unauthorized role/group elevation)
     * 3. Zod schema validation (`umsEmployeeRecordSchema`)
     * 4. Atomic master count synchronization and sanitized audit logging
     */
    upsertEmployee: async (
        employee: EmployeeRecord,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<EmployeeRecord>> => {
        const mode = getActiveUmsPersistenceMode();
        const existingList = loadEmployees();
        const existing = existingList.find((e) => e.id === employee.id);

        const escalationCheck: UmsRbacDecision = validatePrivilegeEscalationGuard({
            actor,
            targetEmployeeId: employee.id,
            previousRoleId: existing?.roleId,
            proposedRoleId: employee.roleId,
            previousSecurityGroupId: existing?.securityGroupId,
            proposedSecurityGroupId: employee.securityGroupId,
            employees: existingList,
        });

        if (!escalationCheck.allowed) {
            return {
                ok: false,
                statusCode: escalationCheck.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: escalationCheck.reasonCode,
                messageEn: escalationCheck.reasonEn,
                messageAr: escalationCheck.reasonAr,
            };
        }

        const parsed = umsEmployeeRecordSchema.safeParse(employee);
        if (!parsed.success) {
            return {
                ok: false,
                statusCode: 400,
                persistenceMode: mode,
                errorCode: 'SCHEMA_VALIDATION_FAILED',
                messageEn: parsed.error.issues[0]?.message || 'Employee validation failed',
                messageAr: 'فشل التحقق من صحة بيانات الموظف',
                validationErrors: parsed.error.issues.map(
                    (i) => `${i.path.join('.')}: ${i.message}`
                ),
            };
        }

        if (mode === 'remote_rest_api') {
            const response = existing
                ? await axiosClient.patch(`/ums/employees/${employee.id}`, employee)
                : await axiosClient.post('/ums/employees', employee);
            return {
                ok: true,
                statusCode: existing ? 200 : 201,
                persistenceMode: mode,
                data: response.data?.data ?? response.data,
            };
        }

        const updatedList = existing
            ? existingList.map((e) => (e.id === employee.id ? employee : e))
            : [employee, ...existingList];

        saveEmployees(updatedList);
        syncMasterEntityEmployeeCounts(updatedList);

        recordUmsAuditEvent({
            action: existing ? 'UPDATED' : 'CREATED',
            resource: 'Employee',
            resourceId: employee.id,
            resourceName: employee.nameEn,
            detailsEn: `${existing ? 'Updated' : 'Created'} employee ${employee.nameEn} (${employee.code}) via UMS repository.`,
            detailsAr: `${existing ? 'تحديث' : 'إنشاء'} ملف الموظف ${employee.nameAr} (${employee.code}) عبر مستودع البيانات.`,
            previousState: existing ? JSON.stringify(existing) : undefined,
            newState: JSON.stringify(employee),
            actorId: actor.actorEmployeeId || 'demo-admin-1',
            actorEmail: actor.actorEmail || 'karim@awn.sa',
        });

        const reloaded = loadEmployees().find((e) => e.id === employee.id) || employee;
        return {
            ok: true,
            statusCode: existing ? 200 : 201,
            persistenceMode: mode,
            data: reloaded,
        };
    },

    /**
     * Deletes an employee record after verifying `ums.delete` permission
     * and referential integrity (Department Head & Direct Manager dependencies).
     */
    deleteEmployee: async (
        employeeId: string,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<{ deletedId: string }>> => {
        const mode = getActiveUmsPersistenceMode();
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Employee',
            operation: 'delete',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }

        const employees = loadEmployees();
        const departments = loadDepartments();
        const target = employees.find((e) => e.id === employeeId);
        if (!target) {
            return {
                ok: false,
                statusCode: 404,
                persistenceMode: mode,
                errorCode: 'NOT_FOUND',
                messageEn: 'Employee record not found.',
                messageAr: 'ملف الموظف غير موجود.',
            };
        }

        const eligibility = checkEmployeeDeletionEligibility(employeeId, employees, departments);
        if (!eligibility.canDelete) {
            return {
                ok: false,
                statusCode: 409,
                persistenceMode: mode,
                errorCode: 'DEPENDENCY_CONFLICT',
                messageEn: eligibility.reasonEn,
                messageAr: eligibility.reasonAr,
            };
        }

        if (mode === 'remote_rest_api') {
            await axiosClient.delete(`/ums/employees/${employeeId}`);
            return {
                ok: true,
                statusCode: 200,
                persistenceMode: mode,
                data: { deletedId: employeeId },
            };
        }

        const remaining = employees.filter((e) => e.id !== employeeId);
        saveEmployees(remaining);
        syncMasterEntityEmployeeCounts(remaining);

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Employee',
            resourceId: target.id,
            resourceName: target.nameEn,
            detailsEn: `Deleted unlinked employee record ${target.nameEn} (${target.code}).`,
            detailsAr: `حذف ملف الموظف غير المرتبط ${target.nameAr} (${target.code}).`,
            previousState: JSON.stringify(target),
            actorId: actor.actorEmployeeId || 'demo-admin-1',
            actorEmail: actor.actorEmail || 'karim@awn.sa',
        });

        return {
            ok: true,
            statusCode: 200,
            persistenceMode: mode,
            data: { deletedId: employeeId },
        };
    },

    /**
     * Master-entity getters and guarded mutations
     */
    listDepartments: async (
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<DepartmentRecord[]>> => {
        const mode = getActiveUmsPersistenceMode();
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Department',
            operation: 'read',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }
        return {
            ok: true,
            statusCode: 200,
            persistenceMode: mode,
            data: loadDepartments(),
        };
    },

    upsertDepartment: async (
        department: DepartmentRecord,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<DepartmentRecord>> => {
        const mode = getActiveUmsPersistenceMode();
        const list = loadDepartments();
        const existing = list.find((d) => d.id === department.id);
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Department',
            operation: existing ? 'update' : 'create',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }
        const parsed = umsDepartmentSchema.safeParse(department);
        if (!parsed.success) {
            return {
                ok: false,
                statusCode: 400,
                persistenceMode: mode,
                errorCode: 'SCHEMA_VALIDATION_FAILED',
                messageEn: parsed.error.issues[0]?.message,
                validationErrors: parsed.error.issues.map((i) => i.message),
            };
        }
        const next = existing
            ? list.map((d) => (d.id === department.id ? department : d))
            : [department, ...list];
        saveDepartments(next);
        syncMasterEntityEmployeeCounts(loadEmployees());
        return {
            ok: true,
            statusCode: existing ? 200 : 201,
            persistenceMode: mode,
            data: loadDepartments().find((d) => d.id === department.id) || department,
        };
    },

    deleteDepartment: async (
        deptId: string,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<{ deletedId: string }>> => {
        const mode = getActiveUmsPersistenceMode();
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Department',
            operation: 'delete',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }
        const eligibility = checkDepartmentDeletionEligibility(deptId);
        if (!eligibility.canDelete) {
            return {
                ok: false,
                statusCode: 409,
                persistenceMode: mode,
                errorCode: 'DEPENDENCY_CONFLICT',
                messageEn: eligibility.reasonEn,
                messageAr: eligibility.reasonAr,
            };
        }
        saveDepartments(loadDepartments().filter((d) => d.id !== deptId));
        return {
            ok: true,
            statusCode: 200,
            persistenceMode: mode,
            data: { deletedId: deptId },
        };
    },

    upsertSecurityGroup: async (
        securityGroup: SecurityGroupRecord,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<SecurityGroupRecord>> => {
        const mode = getActiveUmsPersistenceMode();
        const list = loadSecurityGroups();
        const existing = list.find((g) => g.id === securityGroup.id);
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Security Group',
            operation: existing ? 'update' : 'create',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }
        const parsed = umsSecurityGroupSchema.safeParse(securityGroup);
        if (!parsed.success) {
            return {
                ok: false,
                statusCode: 400,
                persistenceMode: mode,
                errorCode: 'SCHEMA_VALIDATION_FAILED',
                messageEn: parsed.error.issues[0]?.message,
                validationErrors: parsed.error.issues.map((i) => i.message),
            };
        }
        const next = existing
            ? list.map((g) => (g.id === securityGroup.id ? securityGroup : g))
            : [securityGroup, ...list];
        saveSecurityGroups(next);
        syncMasterEntityEmployeeCounts(loadEmployees());
        return {
            ok: true,
            statusCode: existing ? 200 : 201,
            persistenceMode: mode,
            data: loadSecurityGroups().find((g) => g.id === securityGroup.id) || securityGroup,
        };
    },

    upsertRole: async (
        role: RoleRecord,
        actor: UmsActorContext = DEFAULT_SUPER_ADMIN_ACTOR
    ): Promise<UmsRepositoryResult<RoleRecord>> => {
        const mode = getActiveUmsPersistenceMode();
        const list = loadRoles();
        const existing = list.find((r) => r.id === role.id);
        const rbac = evaluateUmsRbacDecision({
            actor,
            module: 'ums',
            resource: 'Role',
            operation: existing ? 'update' : 'create',
        });
        if (!rbac.allowed) {
            return {
                ok: false,
                statusCode: rbac.statusCode as 401 | 403,
                persistenceMode: mode,
                errorCode: rbac.reasonCode,
                messageEn: rbac.reasonEn,
                messageAr: rbac.reasonAr,
            };
        }
        const parsed = umsRoleSchema.safeParse(role);
        if (!parsed.success) {
            return {
                ok: false,
                statusCode: 400,
                persistenceMode: mode,
                errorCode: 'SCHEMA_VALIDATION_FAILED',
                messageEn: parsed.error.issues[0]?.message,
                validationErrors: parsed.error.issues.map((i) => i.message),
            };
        }
        const next = existing
            ? list.map((r) => (r.id === role.id ? role : r))
            : [role, ...list];
        saveRoles(next);
        syncMasterEntityEmployeeCounts(loadEmployees());
        return {
            ok: true,
            statusCode: existing ? 200 : 201,
            persistenceMode: mode,
            data: loadRoles().find((r) => r.id === role.id) || role,
        };
    },

    listDesignations: (): DesignationRecord[] => loadDesignations(),
    saveDesignations,
    checkDesignationDeletionEligibility,

    listBranches: (): BranchRecord[] => loadBranches(),
    saveBranches,
    checkBranchDeletionEligibility,

    listRoles: (): RoleRecord[] => loadRoles(),
    checkRoleDeletionEligibility,

    listSecurityGroups: (): SecurityGroupRecord[] => loadSecurityGroups(),
    checkSecurityGroupDeletionEligibility,

    listCustomAddons: (): CustomAddonRecord[] => loadCustomAddons(),
    saveCustomAddons,
    checkCustomAddonDeletionEligibility,

    listAuditTrail: (): UmsAuditEvent[] => loadUmsAuditTrail(),

    runMigrationDryRun: (): UmsMigrationDryRunReport => runUmsLocalStorageMigrationDryRun(),

    schemas: {
        umsEmployeeRecordSchema,
        umsDepartmentSchema,
        umsDesignationSchema,
        umsBranchSchema,
        umsRoleSchema,
        umsSecurityGroupSchema,
        umsCustomAddonSchema,
    },
};
