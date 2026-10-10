import fs from 'node:fs';
import path from 'node:path';
import {
    INITIAL_EMPLOYEES,
    INITIAL_DEPARTMENTS,
    INITIAL_DESIGNATIONS,
    INITIAL_ROLES,
    INITIAL_SECURITY_GROUPS,
    INITIAL_BRANCHES,
    INITIAL_CUSTOM_ADDONS,
    UMS_EMPLOYEES_STORAGE_KEY,
    UMS_DEPARTMENTS_STORAGE_KEY,
    loadEmployees,
    saveEmployees,
    loadDepartments,
    saveDepartments,
    loadDesignations,
    saveDesignations,
    loadRoles,
    saveRoles,
    loadSecurityGroups,
    saveSecurityGroups,
    loadBranches,
    saveBranches,
    loadCustomAddons,
    saveCustomAddons,
    loadUmsAuditTrail,
    recordUmsAuditEvent,
    inspectUmsStorageHealth,
    computeUmsDashboardMetrics,
    computeEmployeeDirectoryKpis,
    computeEmployeeProfileCompletion,
    syncMasterEntityEmployeeCounts,
    synchronizeEmployeeRelationships,
    checkEmployeeDeletionEligibility,
    checkDepartmentDeletionEligibility,
    checkDesignationDeletionEligibility,
    checkBranchDeletionEligibility,
    checkRoleDeletionEligibility,
    checkSecurityGroupDeletionEligibility,
    checkCustomAddonDeletionEligibility,
    getCustomAddonLinkedEmployees,
    validateEmployeeImportBatch,
    commitEmployeeImportBatch,
    generateEmployeeSampleZipBytes,
    extractCsvFromZipBytes,
    sanitizeAuditStateSnapshot,
    escapeSafeCsvCell,
    validateUploadFileMeta,
    isValidSaudiMobile,
    calculateSalaryTotals,
    joinNameParts,
    type EmployeeRecord,
} from '../src/pages/ums/umsMockData';

// Simulate browser window.localStorage in Node environment
class MemoryLocalStorage implements Storage {
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

const mockStorage = new MemoryLocalStorage();
Object.defineProperty(globalThis, 'window', {
    value: { localStorage: mockStorage },
    writable: true,
    configurable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
});

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string): void {
    if (condition) {
        passed += 1;
    } else {
        failed += 1;
        console.error(`  ❌ FAIL: ${message}`);
    }
}

function resetAndSeedStorage(): void {
    mockStorage.clear();
    saveDepartments(structuredClone(INITIAL_DEPARTMENTS));
    saveDesignations(structuredClone(INITIAL_DESIGNATIONS));
    saveBranches(structuredClone(INITIAL_BRANCHES));
    saveSecurityGroups(structuredClone(INITIAL_SECURITY_GROUPS));
    saveRoles(structuredClone(INITIAL_ROLES));
    saveCustomAddons(structuredClone(INITIAL_CUSTOM_ADDONS));
    saveEmployees(structuredClone(INITIAL_EMPLOYEES));
    syncMasterEntityEmployeeCounts(loadEmployees());
}

console.log('======================================================================');
console.log('AWN UMS — PHASE 4F REAL-WORLD WORKFLOW SIMULATION & RELEASE GATE');
console.log('======================================================================\n');

// ============================================================================
// SCENARIO A: CREATE AN EMPLOYEE (4-Step Wizard Full Lifecycle)
// ============================================================================
console.log('1. Scenario A: Create an Employee (4-Step Wizard End-to-End)');
resetAndSeedStorage();
{
    const initialEmps = loadEmployees();
    const initialDash = computeUmsDashboardMetrics();
    const initialKpis = computeEmployeeDirectoryKpis(initialEmps);
    const initialDepts = loadDepartments();
    const targetDeptBefore = initialDepts.find((d) => d.id === 'dep-1')!;
    const targetDesigBefore = loadDesignations().find((d) => d.id === 'des-1')!;
    const targetBranchBefore = loadBranches().find((b) => b.id === 'brn-1')!;
    const targetRoleBefore = loadRoles().find((r) => r.id === 'rol-3')!;
    const targetSgBefore = loadSecurityGroups().find((g) => g.id === targetRoleBefore.securityGroupId)!;
    const targetJobTitleBefore = loadCustomAddons().find((a) => a.id === 'add-8')!;
    const targetBankBefore = loadCustomAddons().find((a) => a.id === 'add-1')!;
    const targetReligionBefore = loadCustomAddons().find((a) => a.id === 'add-5')!;
    const targetGradeBefore = loadCustomAddons().find((a) => a.id === 'add-14')!;

    // Step 1: Personal Info
    const firstNameEn = 'Tariq';
    const secondNameEn = 'Salman';
    const thirdNameEn = 'Nasser';
    const lastNameEn = 'Al-Dosari';
    const firstNameAr = 'طارق';
    const secondNameAr = 'سلمان';
    const thirdNameAr = 'ناصر';
    const lastNameAr = 'الدوسري';

    const nameEn = joinNameParts({ firstName: firstNameEn, secondName: secondNameEn, thirdName: thirdNameEn, lastName: lastNameEn });
    const nameAr = joinNameParts({ firstName: firstNameAr, secondName: secondNameAr, thirdName: thirdNameAr, lastName: lastNameAr });

    // Step 2, 3, 4: Employment, Documents/Salary, Dependents
    const salaryDetails = calculateSalaryTotals({
        basicSalary: 19000,
        housingAllowance: 4750,
        transportationAllowance: 1500,
        foodAllowance: 500,
        otherAllowances: 250,
    });

    const newEmployeeRaw: EmployeeRecord = {
        id: 'emp-scenario-a-1',
        code: 'EMP-009',
        status: 'Active',
        nameEn,
        nameAr,
        firstNameEn,
        secondNameEn,
        thirdNameEn,
        lastNameEn,
        firstNameAr,
        secondNameAr,
        thirdNameAr,
        lastNameAr,
        email: 'tariq.dosari@gmail.com',
        workEmail: 'tariq.dosari@awn.sa',
        phone: '+966501122334',
        dobGregorian: '1991-06-15',
        dobHijri: '1411/12/03',
        religionId: 'add-5',
        religion: 'Muslim',
        maritalStatus: 'Married',
        gender: 'Male',
        citizenship: 'Saudi',
        nationality: 'Saudi Arabia',
        branchId: 'brn-1',
        departmentId: 'dep-1',
        designationId: 'des-1',
        jobTitleId: 'add-8',
        roleId: 'rol-3',
        jobGradeId: 'add-14',
        managerId: 'emp-1',
        joiningDate: '2026-10-01',
        contractType: 'Permanent',
        probationPeriodDays: 90,
        isUnderProbation: true,
        employmentType: 'Full-time',
        salaryDetails,
        iqamaNumber: '1099887766',
        iqamaExpiryDate: '2030-06-15',
        iqamaStatus: 'Valid',
        bankId: 'add-1',
        accountHolderName: nameEn,
        iban: 'SA4480000000608010554433',
        accountNumber: '608010554433',
        healthInsuranceProvider: 'Bupa Arabia',
        healthInsurancePolicy: 'BUPA-009-A',
        healthInsuranceExpiry: '2027-10-01',
        passportNumber: 'V11223344',
        passportExpiry: '2031-06-15',
        contractNumber: 'CNT-2026-009',
        gosiSubscriptionNumber: 'GOSI-009988',
        documentAttachments: {
            iqama: {
                category: 'iqama',
                fileName: 'tariq_national_id.pdf',
                fileSize: 245000,
                mimeType: 'application/pdf',
                uploadedAt: '2026-10-01',
            },
        },
        dependents: [
            {
                id: 'dep-child-1',
                name: 'Salman Tariq Al-Dosari',
                relationship: 'Son',
                dobGregorian: '2020-03-10',
                dobHijri: '1441/07/15',
                identificationNumber: '1199887766',
            },
        ],
        invitationStatus: 'Pending',
        invitedAt: '2026-10-01',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        createdBy: 'Karim Wagdi',
    };

    const syncedNewEmp = synchronizeEmployeeRelationships(newEmployeeRaw);
    const updatedList = [syncedNewEmp, ...initialEmps];
    saveEmployees(updatedList);
    syncMasterEntityEmployeeCounts(updatedList);
    recordUmsAuditEvent({
        action: 'CREATED',
        resource: 'Employee',
        resourceId: syncedNewEmp.id,
        resourceName: `${syncedNewEmp.nameEn} (${syncedNewEmp.code})`,
        detailsEn: `Created employee record ${syncedNewEmp.code} (${syncedNewEmp.nameEn}) in ${syncedNewEmp.departmentName}.`,
        detailsAr: `إنشاء سجل موظف ${syncedNewEmp.code} (${syncedNewEmp.nameAr}).`,
        newState: `Status: ${syncedNewEmp.status}`,
    });

    // Reload from localStorage and verify
    const reloadedEmps = loadEmployees();
    const createdEmp = reloadedEmps.find((e) => e.id === 'emp-scenario-a-1');
    assert(Boolean(createdEmp), 'Scenario A: Created employee appears in reloaded employee list');
    assert(createdEmp?.code === 'EMP-009', 'Scenario A: Employee code persisted as EMP-009');
    assert(
        createdEmp?.departmentName === 'Executive Leadership' &&
            createdEmp?.departmentNameAr === 'الإدارة التنفيذية العليا',
        'Scenario A: Department EN/AR labels resolved'
    );
    assert(
        createdEmp?.designationTitle === 'Chief Executive Officer' &&
            createdEmp?.designationTitleAr === 'الرئيس التنفيذي',
        'Scenario A: Designation EN/AR labels resolved'
    );
    assert(
        createdEmp?.branchName === 'Riyadh Main Headquarters' &&
            createdEmp?.branchNameAr === 'المقر الرئيسي - الرياض',
        'Scenario A: Branch EN/AR labels resolved'
    );
    assert(
        createdEmp?.roleName === 'Operations Specialist' &&
            createdEmp?.roleNameAr === 'أخصائي عمليات تنفيذية',
        'Scenario A: Role EN/AR labels resolved'
    );
    assert(
        createdEmp?.securityGroupId === targetSgBefore.id &&
            createdEmp?.securityGroupName === targetSgBefore.nameEn &&
            createdEmp?.securityGroupNameAr === targetSgBefore.nameAr,
        'Scenario A: Security Group EN/AR labels resolved via Role'
    );
    assert(
        createdEmp?.jobTitleName === targetJobTitleBefore.nameEn &&
            createdEmp?.jobTitleNameAr === targetJobTitleBefore.nameAr &&
            createdEmp?.bankName === targetBankBefore.nameEn &&
            createdEmp?.bankNameAr === targetBankBefore.nameAr &&
            createdEmp?.religion === targetReligionBefore.nameEn &&
            createdEmp?.religionAr === targetReligionBefore.nameAr &&
            createdEmp?.jobGradeName === targetGradeBefore.nameEn &&
            createdEmp?.jobGradeNameAr === targetGradeBefore.nameAr,
        'Scenario A: All 4 Custom Addon categories resolved in EN & AR'
    );
    assert(
        createdEmp?.managerName === 'Karim Wagdi' &&
            createdEmp?.managerNameAr === 'كريم وجدي',
        'Scenario A: Direct Manager EN/AR names resolved'
    );
    assert(createdEmp?.salaryDetails.grossSalary === 26000, 'Scenario A: Gross salary calculated accurately (26,000 SAR)');
    assert(computeEmployeeProfileCompletion(createdEmp!).percentage === 100, 'Scenario A: Profile completion is 100%');

    // Verify master-record counts incremented by +1
    const afterDash = computeUmsDashboardMetrics();
    const afterKpis = computeEmployeeDirectoryKpis(reloadedEmps);
    assert(afterDash.totalEmployees === initialDash.totalEmployees + 1, 'Scenario A: Dashboard totalEmployees incremented by 1');
    assert(afterKpis.activeEmployees === initialKpis.activeEmployees + 1, 'Scenario A: Directory activeEmployees incremented by 1');
    assert(
        loadDepartments().find((d) => d.id === 'dep-1')!.employeeCount === targetDeptBefore.employeeCount + 1,
        'Scenario A: Department employeeCount incremented by 1'
    );
    assert(
        loadDesignations().find((d) => d.id === 'des-1')!.employeeCount === targetDesigBefore.employeeCount + 1,
        'Scenario A: Designation employeeCount incremented by 1'
    );
    assert(
        loadBranches().find((b) => b.id === 'brn-1')!.employeeCount === targetBranchBefore.employeeCount + 1,
        'Scenario A: Branch employeeCount incremented by 1'
    );
    assert(
        loadRoles().find((r) => r.id === 'rol-3')!.employeeCount === targetRoleBefore.employeeCount + 1,
        'Scenario A: Role employeeCount incremented by 1'
    );
    assert(
        loadSecurityGroups().find((g) => g.id === targetSgBefore.id)!.userCount === targetSgBefore.userCount + 1,
        'Scenario A: Security Group userCount incremented by 1'
    );
    assert(
        loadCustomAddons().find((a) => a.id === 'add-8')!.usageCount === targetJobTitleBefore.usageCount + 1 &&
            loadCustomAddons().find((a) => a.id === 'add-1')!.usageCount === targetBankBefore.usageCount + 1 &&
            loadCustomAddons().find((a) => a.id === 'add-5')!.usageCount === targetReligionBefore.usageCount + 1 &&
            loadCustomAddons().find((a) => a.id === 'add-14')!.usageCount === targetGradeBefore.usageCount + 1,
        'Scenario A: All 4 Custom Addon usageCounts incremented by 1'
    );

    const latestAudit = loadUmsAuditTrail()[0];
    assert(
        latestAudit.action === 'CREATED' &&
            latestAudit.resource === 'Employee' &&
            latestAudit.resourceId === 'emp-scenario-a-1',
        'Scenario A: Audit Trail recorded CREATED event for new employee'
    );
}

// ============================================================================
// SCENARIO B: EDIT AND PROMOTE A DRAFT EMPLOYEE
// ============================================================================
console.log('2. Scenario B: Edit and Promote a Draft Employee (emp-8)');
{
    const beforeEmps = loadEmployees();
    const draftEmp = beforeEmps.find((e) => e.id === 'emp-8')!;
    assert(draftEmp.status === 'Draft', 'Scenario B: emp-8 starts in Draft status');
    const kpisBefore = computeEmployeeDirectoryKpis(beforeEmps);

    // Simulate wizard edit completion with saveAsDraft = false
    const saveAsDraft = false;
    const finalStatus = saveAsDraft ? 'Draft' : draftEmp.status === 'Draft' ? 'Active' : draftEmp.status;
    const promotedEmp = synchronizeEmployeeRelationships({
        ...draftEmp,
        status: finalStatus,
        phone: '+966509988776',
        iqamaNumber: '1088776655',
        iqamaExpiryDate: '2029-12-31',
        bankId: 'add-2',
        iban: 'SA1210000000204000998877',
        accountNumber: '204000998877',
        salaryDetails: calculateSalaryTotals({
            basicSalary: 12000,
            housingAllowance: 3000,
            transportationAllowance: 1000,
        }),
        invitationStatus: 'Pending',
        invitedAt: '2026-10-02',
        updatedAt: '2026-10-02',
    });

    const updatedEmps = beforeEmps.map((e) => (e.id === 'emp-8' ? promotedEmp : e));
    saveEmployees(updatedEmps);
    syncMasterEntityEmployeeCounts(updatedEmps);
    recordUmsAuditEvent({
        action: 'UPDATED',
        resource: 'Employee',
        resourceId: promotedEmp.id,
        resourceName: `${promotedEmp.nameEn} (${promotedEmp.code})`,
        detailsEn: `Updated employee record ${promotedEmp.code} — Status: ${promotedEmp.status}.`,
        detailsAr: `تحديث سجل الموظف ${promotedEmp.code} — الحالة: ${promotedEmp.status}.`,
        previousState: 'Status: Draft',
        newState: `Status: ${promotedEmp.status}`,
    });

    // Reload and verify Draft -> Active transition persisted
    const reloadedAfterPromote = loadEmployees();
    const reloadedEmp8 = reloadedAfterPromote.find((e) => e.id === 'emp-8')!;
    const kpisAfter = computeEmployeeDirectoryKpis(reloadedAfterPromote);

    assert(reloadedEmp8.status === 'Active', 'Scenario B: Draft employee promoted to Active on full wizard submit');
    assert(reloadedEmp8.salaryDetails.grossSalary === 16000, 'Scenario B: Updated salary persisted across reload');
    assert(reloadedEmp8.bankId === 'add-2' && reloadedEmp8.bankName === 'The Saudi National Bank (SNB)', 'Scenario B: Updated bank persisted across reload');
    assert(
        kpisAfter.draftEmployees === kpisBefore.draftEmployees - 1 &&
            kpisAfter.activeEmployees === kpisBefore.activeEmployees + 1,
        'Scenario B: Directory KPIs reflect -1 Draft and +1 Active employee'
    );
}

// ============================================================================
// SCENARIO C: EDIT AN INACTIVE EMPLOYEE
// ============================================================================
console.log('3. Scenario C: Edit an Inactive Employee (emp-6)');
{
    // First transition emp-6 to Inactive via standard deactivation workflow
    const initialEmps = loadEmployees().map((e) =>
        e.id === 'emp-6' ? { ...e, status: 'Inactive' as const } : e
    );
    saveEmployees(initialEmps);
    syncMasterEntityEmployeeCounts(initialEmps);

    const beforeEmps = loadEmployees();
    const inactiveEmp = beforeEmps.find((e) => e.id === 'emp-6')!;
    assert(inactiveEmp.status === 'Inactive', 'Scenario C: emp-6 starts in Inactive status');

    // Simulate wizard edit of permitted fields while keeping status untouched (saveAsDraft = false)
    const saveAsDraft = false;
    const finalStatus = saveAsDraft
        ? 'Draft'
        : inactiveEmp.status === 'Draft'
        ? 'Active'
        : inactiveEmp.status;

    const editedInactiveEmp = synchronizeEmployeeRelationships({
        ...inactiveEmp,
        status: finalStatus,
        phone: '+966554433221',
        jobTitleId: 'add-10',
        updatedAt: '2026-10-03',
    });

    const updatedEmps = beforeEmps.map((e) => (e.id === 'emp-6' ? editedInactiveEmp : e));
    saveEmployees(updatedEmps);
    syncMasterEntityEmployeeCounts(updatedEmps);

    const reloadedEmps = loadEmployees();
    const reloadedEmp6 = reloadedEmps.find((e) => e.id === 'emp-6')!;
    assert(
        reloadedEmp6.status === 'Inactive',
        'Scenario C: Editing an Inactive employee preserves Inactive status unless explicitly changed'
    );
    assert(
        reloadedEmp6.phone === '+966554433221' && reloadedEmp6.jobTitleId === 'add-10',
        'Scenario C: Permitted field updates on Inactive employee persist accurately'
    );
}

// ============================================================================
// SCENARIO D: MASTER-DATA RENAME PROPAGATION (ALL MODULES & ADDONS IN EN/AR)
// ============================================================================
console.log('4. Scenario D: Master-Data Rename Propagation (Bilingual EN/AR)');
{
    // Rename dep-1, des-1, brn-1, rol-1, sec-1, and custom addons add-8 (job_title), add-1 (bank), add-5 (religion), add-14 (job_grade)
    const depts = loadDepartments().map((d) =>
        d.id === 'dep-1'
            ? { ...d, nameEn: 'Digital Transformation & AI', nameAr: 'التحول الرقمي والذكاء الاصطناعي' }
            : d
    );
    saveDepartments(depts);

    const desigs = loadDesignations().map((d) =>
        d.id === 'des-1'
            ? { ...d, titleEn: 'Chief AI & Digital Officer', titleAr: 'الرئيس التنفيذي للذكاء الاصطناعي' }
            : d
    );
    saveDesignations(desigs);

    const branches = loadBranches().map((b) =>
        b.id === 'brn-1'
            ? { ...b, nameEn: 'Riyadh Digital Tower HQ', nameAr: 'برج الرياض الرقمي الرئيسي' }
            : b
    );
    saveBranches(branches);

    const groups = loadSecurityGroups().map((g) =>
        g.id === 'sec-1'
            ? { ...g, nameEn: 'Sovereign Platform Administrators', nameAr: 'مديرو المنصة السيادية' }
            : g
    );
    saveSecurityGroups(groups);

    const roles = loadRoles().map((r) =>
        r.id === 'rol-1'
            ? { ...r, nameEn: 'Chief Platform Architect', nameAr: 'كبير مهندسي المنصة' }
            : r
    );
    saveRoles(roles);

    const addons = loadCustomAddons().map((a) => {
        if (a.id === 'add-8') {
            return { ...a, nameEn: 'Principal Cloud Architect', nameAr: 'مهندس سحابي رئيسي' };
        }
        if (a.id === 'add-1') {
            return { ...a, nameEn: 'Al Rajhi Capital Bank', nameAr: 'مصرف الراجحي المالية' };
        }
        if (a.id === 'add-5') {
            return { ...a, nameEn: 'Islam (Sunni/General)', nameAr: 'الإسلام' };
        }
        if (a.id === 'add-14') {
            return { ...a, nameEn: 'Grade 12 - Principal', nameAr: 'الدرجة ١٢ - رئيسي' };
        }
        return a;
    });
    saveCustomAddons(addons);

    // Run count & relationship sync
    syncMasterEntityEmployeeCounts(loadEmployees());

    // Reload everything from localStorage
    const reloadedEmps = loadEmployees();
    const emp1 = reloadedEmps.find((e) => e.id === 'emp-1')!;
    const empA = reloadedEmps.find((e) => e.id === 'emp-scenario-a-1')!;
    const reloadedDesig1 = loadDesignations().find((d) => d.id === 'des-1')!;
    const reloadedRole1 = loadRoles().find((r) => r.id === 'rol-1')!;

    assert(
        emp1.departmentName === 'Digital Transformation & AI' &&
            emp1.departmentNameAr === 'التحول الرقمي والذكاء الاصطناعي',
        'Scenario D: Renamed Department EN & AR propagated to linked employees'
    );
    assert(
        emp1.designationTitle === 'Chief AI & Digital Officer' &&
            emp1.designationTitleAr === 'الرئيس التنفيذي للذكاء الاصطناعي',
        'Scenario D: Renamed Designation EN & AR propagated to linked employees'
    );
    assert(
        emp1.branchName === 'Riyadh Digital Tower HQ' &&
            emp1.branchNameAr === 'برج الرياض الرقمي الرئيسي',
        'Scenario D: Renamed Branch EN & AR propagated to linked employees'
    );
    assert(
        emp1.roleName === 'Chief Platform Architect' &&
            emp1.roleNameAr === 'كبير مهندسي المنصة',
        'Scenario D: Renamed Role EN & AR propagated to linked employees'
    );
    assert(
        emp1.securityGroupName === 'Sovereign Platform Administrators' &&
            emp1.securityGroupNameAr === 'مديرو المنصة السيادية',
        'Scenario D: Renamed Security Group EN & AR propagated to linked employees'
    );
    assert(
        reloadedDesig1.departmentName === 'Digital Transformation & AI' &&
            reloadedDesig1.departmentNameAr === 'التحول الرقمي والذكاء الاصطناعي',
        'Scenario D: Renamed Department EN & AR propagated to linked Designations'
    );
    assert(
        reloadedRole1.securityGroupName === 'Sovereign Platform Administrators' &&
            reloadedRole1.securityGroupNameAr === 'مديرو المنصة السيادية',
        'Scenario D: Renamed Security Group EN & AR propagated to linked Roles'
    );
    assert(
        empA.jobTitleName === 'Principal Cloud Architect' &&
            empA.jobTitleNameAr === 'مهندس سحابي رئيسي' &&
            empA.bankName === 'Al Rajhi Capital Bank' &&
            empA.bankNameAr === 'مصرف الراجحي المالية' &&
            empA.religion === 'Islam (Sunni/General)' &&
            empA.religionAr === 'الإسلام' &&
            empA.jobGradeName === 'Grade 12 - Principal' &&
            empA.jobGradeNameAr === 'الدرجة ١٢ - رئيسي',
        'Scenario D: Renamed Custom Addons (job_title, bank, religion, job_grade) EN & AR propagated to linked employees'
    );

    // Verify counts are never double-counted after multiple sync/reload cycles
    syncMasterEntityEmployeeCounts(loadEmployees());
    syncMasterEntityEmployeeCounts(loadEmployees());
    const empsAfterDoubleSync = loadEmployees();
    for (const dept of loadDepartments()) {
        const expected = empsAfterDoubleSync.filter((e) => e.departmentId === dept.id).length;
        assert(dept.employeeCount === expected, `Scenario D: Department ${dept.code} count (${dept.employeeCount}) matches exact linked employees (${expected})`);
    }
    for (const addon of loadCustomAddons()) {
        const expected = getCustomAddonLinkedEmployees(addon, empsAfterDoubleSync).length;
        assert(addon.usageCount === expected, `Scenario D: Custom Addon ${addon.code} usageCount (${addon.usageCount}) matches exact linked employees (${expected})`);
    }
}

// ============================================================================
// SCENARIO E: DELETION AND DEPENDENCY PROTECTION
// ============================================================================
console.log('5. Scenario E: Deletion and Dependency Protection');
{
    const emps = loadEmployees();
    const depts = loadDepartments();
    const branches = loadBranches();
    const roles = loadRoles();
    const addons = loadCustomAddons();

    // 1. Linked master records must block deletion
    assert(!checkDepartmentDeletionEligibility('dep-1', emps).canDelete, 'Scenario E: Linked Department deletion is blocked');
    assert(!checkDesignationDeletionEligibility('des-1', emps).canDelete, 'Scenario E: Linked Designation deletion is blocked');
    assert(!checkBranchDeletionEligibility('brn-1', branches, emps).canDelete, 'Scenario E: HQ / linked Branch deletion is blocked');
    assert(!checkRoleDeletionEligibility('rol-1', emps).canDelete, 'Scenario E: Linked Role deletion is blocked');
    assert(!checkSecurityGroupDeletionEligibility('sec-1', roles, emps).canDelete, 'Scenario E: Linked Security Group deletion is blocked');
    assert(!checkCustomAddonDeletionEligibility('add-1', addons, emps).canDelete, 'Scenario E: Linked Custom Addon deletion is blocked');
    assert(!checkEmployeeDeletionEligibility('emp-1', emps, depts).canDelete, 'Scenario E: Department Head / Direct Manager employee deletion is blocked');

    // Confirm failed deletion checks do not mutate any storage count
    assert(loadEmployees().length === emps.length, 'Scenario E: Blocked deletions did not mutate employee list');

    // 2. Unlinked records can be created and deleted cleanly
    const tempDept = {
        id: 'dep-temp-99',
        code: 'DEP-099',
        nameEn: 'Temporary Research Unit',
        nameAr: 'وحدة أبحاث مؤقتة',
        descriptionEn: 'Temp',
        descriptionAr: 'مؤقت',
        status: 'Active' as const,
        employeeCount: 0,
        createdAt: '2026-10-05',
    };
    saveDepartments([...depts, tempDept]);
    assert(checkDepartmentDeletionEligibility('dep-temp-99', emps).canDelete, 'Scenario E: Unlinked Department is eligible for deletion');
    saveDepartments(loadDepartments().filter((d) => d.id !== 'dep-temp-99'));
    assert(!loadDepartments().some((d) => d.id === 'dep-temp-99'), 'Scenario E: Unlinked Department deleted cleanly');

    // 3. Verify Department Head & Manager references never become orphaned if an unlinked employee is removed
    const leafEmp = emps.find((e) => e.id === 'emp-scenario-a-1')!;
    assert(checkEmployeeDeletionEligibility(leafEmp.id, emps, depts).canDelete, 'Scenario E: Leaf employee with no reports/headed departments can be deleted');
}

// ============================================================================
// SCENARIO F: IMPORT AND RECOVERY (CSV + ZIP PACKAGE + FALLBACK IDS + REPEATED IMPORT)
// ============================================================================
console.log('6. Scenario F: Import and Recovery (CSV, ZIP Package, Fallback IDs, Idempotency)');
resetAndSeedStorage();
{
    const countBeforeImport = loadEmployees().length;

    // 1. Test supported .zip package generation and CSV extraction
    const zipBytes = generateEmployeeSampleZipBytes();
    const extracted = extractCsvFromZipBytes(zipBytes);
    assert(
        extracted.found &&
            extracted.fileName === 'AWN_Employees_Import_Template.csv' &&
            Boolean(extracted.csvContent?.includes('nawaf.qahtani@awn.sa')),
        'Scenario F: Supported .zip package extracts AWN_Employees_Import_Template.csv cleanly'
    );

    // 2. Validate and commit extracted CSV
    const validation1 = validateEmployeeImportBatch(extracted.csvContent!);
    assert(
        validation1.fileValid && validation1.validRowsCount === 2 && validation1.invalidRowsCount === 0,
        'Scenario F: Sample CSV from ZIP validates 2/2 valid rows'
    );

    const commit1 = commitEmployeeImportBatch({
        validationSummary: validation1,
        fileName: extracted.fileName!,
    });
    assert(
        commit1.importedCount === 2 && commit1.rejectedCount === 0 && commit1.skippedCount === 0,
        'Scenario F: First commit imports 2 employees with 0 skipped/rejected'
    );
    assert(
        loadEmployees().length === countBeforeImport + 2,
        'Scenario F: Employee count increased by +2 after batch commit'
    );

    // 3. Repeated import of the exact same file must be idempotent (0 imported, not corrupting existing records)
    const validationRepeat = validateEmployeeImportBatch(extracted.csvContent!);
    assert(
        validationRepeat.invalidRowsCount === 2,
        'Scenario F: Re-validating already-imported CSV flags duplicate emails/Iqamas'
    );
    const commitRepeat = commitEmployeeImportBatch({
        validationSummary: validation1, // Even if someone commits a stale validation summary!
        fileName: extracted.fileName!,
    });
    assert(
        commitRepeat.importedCount === 0 && commitRepeat.skippedCount === 2,
        'Scenario F: Re-committing stale validation summary safely skips already-imported records'
    );

    // 4. Test missing Iqama deterministic fallback uniqueness across multiple imports + mixed valid/invalid rows
    const batchMissingIqama1 = [
        'code,nameEn,nameAr,email,workEmail,phone,branch,department,designation,role,joiningDate,iqamaNumber',
        ',Yasser Al-Harbi,ياسر الحربي,yasser.h1@gmail.com,yasser.h1@awn.sa,0501234561,BRN-001,DEP-001,DES-001,ROL-003,2026-10-05,',
        ',Mona Al-Zahrani,منى الزهراني,mona.z1@gmail.com,mona.z1@awn.sa,0501234562,BRN-002,DEP-002,DES-002,ROL-004,2026-10-05,',
        ',Invalid Row,صف غير صالح,bad-email,bad-work-email,123,INVALID-BRN,DEP-999,DES-999,ROL-999,bad-date,',
    ].join('\r\n');

    const valMissing1 = validateEmployeeImportBatch(batchMissingIqama1);
    assert(
        valMissing1.validRowsCount === 2 && valMissing1.invalidRowsCount === 1,
        'Scenario F: Mixed batch identifies 2 valid rows (with missing Iqama fallback) and 1 invalid row'
    );
    const comMissing1 = commitEmployeeImportBatch({
        validationSummary: valMissing1,
        fileName: 'missing_iqama_batch_1.csv',
    });
    assert(
        comMissing1.importedCount === 2 && comMissing1.rejectedCount === 1,
        'Scenario F: Mixed batch commits 2 valid rows and rejects 1 invalid row without corrupting valid records'
    );

    // Second batch also omitting Iqama on same row numbers (rows 2 and 3)
    const batchMissingIqama2 = [
        'code,nameEn,nameAr,email,workEmail,phone,branch,department,designation,role,joiningDate,iqamaNumber',
        ',Bandar Al-Otaibi,بندر العتيبي,bandar.o2@gmail.com,bandar.o2@awn.sa,0501234563,BRN-001,DEP-001,DES-001,ROL-003,2026-10-06,',
        ',Huda Al-Shehri,هدى الشهري,huda.s2@gmail.com,huda.s2@awn.sa,0501234564,BRN-002,DEP-002,DES-002,ROL-004,2026-10-06,',
    ].join('\r\n');

    const valMissing2 = validateEmployeeImportBatch(batchMissingIqama2);
    const comMissing2 = commitEmployeeImportBatch({
        validationSummary: valMissing2,
        fileName: 'missing_iqama_batch_2.csv',
    });
    assert(comMissing2.importedCount === 2, 'Scenario F: Second batch with missing Iqamas commits 2 records');

    const allEmpsAfterImports = loadEmployees();
    const uniqueIds = new Set(allEmpsAfterImports.map((e) => e.id.toLowerCase()));
    const uniqueCodes = new Set(allEmpsAfterImports.map((e) => e.code.toLowerCase()));
    const uniqueIqamas = new Set(allEmpsAfterImports.map((e) => (e.iqamaNumber || '').toLowerCase()));

    assert(
        uniqueIds.size === allEmpsAfterImports.length,
        `Scenario F: All ${allEmpsAfterImports.length} employee IDs are 100% unique after repeated imports`
    );
    assert(
        uniqueCodes.size === allEmpsAfterImports.length,
        `Scenario F: All ${allEmpsAfterImports.length} employee Codes are 100% unique after repeated imports`
    );
    assert(
        uniqueIqamas.size === allEmpsAfterImports.length,
        `Scenario F: All ${allEmpsAfterImports.length} employee Iqama numbers (including deterministic fallbacks) are 100% unique`
    );
}

// ============================================================================
// SECTION 3: PERSISTENCE AND STATE CONSISTENCY (CORRUPTED JSON & LEGACY RECORDS)
// ============================================================================
console.log('7. Section 3: Persistence, Legacy Normalization & Corrupted Storage Recovery');
{
    // 1. Empty localStorage falls back cleanly to initial seeds
    mockStorage.clear();
    const seededEmps = loadEmployees();
    assert(seededEmps.length === INITIAL_EMPLOYEES.length, 'Section 3: Empty localStorage initializes cleanly with seed records');

    // 2. Legacy records missing id, status, or Arabic names are normalized without crashing
    mockStorage.setItem(
        UMS_DEPARTMENTS_STORAGE_KEY,
        JSON.stringify([
            { code: 'DEP-777', nameEn: 'Legacy Operations' },
            null,
            'malformed-primitive',
        ])
    );
    const legacyDepts = loadDepartments();
    assert(
        legacyDepts.length === 1 &&
            legacyDepts[0].id === 'dep-legacy-DEP-777' &&
            legacyDepts[0].nameAr === 'Legacy Operations' &&
            legacyDepts[0].status === 'Active',
        'Section 3: Legacy department record missing id/nameAr/status is normalized and non-object entries are filtered'
    );
    const healthAfterPartial = inspectUmsStorageHealth();
    assert(
        healthAfterPartial[UMS_DEPARTMENTS_STORAGE_KEY].validRecordCount === 1 &&
            healthAfterPartial[UMS_DEPARTMENTS_STORAGE_KEY].droppedMalformedItemCount === 2,
        'Section 3: inspectUmsStorageHealth reports exact validRecordCount and droppedMalformedItemCount'
    );

    // 3. Corrupted JSON string preserves raw payload in __corrupted_backup instead of silently destroying it
    const corruptedPayload = '{ "brokenJson": [1, 2, ';
    mockStorage.setItem(UMS_EMPLOYEES_STORAGE_KEY, corruptedPayload);
    const recoveredEmps = loadEmployees();
    const backupValue = mockStorage.getItem(`${UMS_EMPLOYEES_STORAGE_KEY}__corrupted_backup`);
    const healthAfterCorrupt = inspectUmsStorageHealth();

    assert(
        recoveredEmps.length === INITIAL_EMPLOYEES.length,
        'Section 3: Corrupted JSON in localStorage falls back safely in memory without crashing'
    );
    assert(
        backupValue === corruptedPayload &&
            healthAfterCorrupt[UMS_EMPLOYEES_STORAGE_KEY].status === 'corrupted_json' &&
            healthAfterCorrupt[UMS_EMPLOYEES_STORAGE_KEY].hasCorruptedBackup === true,
        'Section 3: Corrupted JSON payload is preserved in __corrupted_backup key and reported by inspectUmsStorageHealth()'
    );

    // Restore clean seeded storage
    resetAndSeedStorage();
}

// ============================================================================
// SECTION 4: SECURITY AND DATA EXPOSURE
// ============================================================================
console.log('8. Section 4: Security, CSV Formula Injection & Audit Snapshot Redaction');
{
    // 1. CSV Formula Injection safeguards (=, +, -, @, \t, \r)
    assert(escapeSafeCsvCell('=cmd|\'/C calc\'!A0') === '"\'=cmd|\'/C calc\'!A0"', 'Section 4: = formula prefix neutralized');
    assert(escapeSafeCsvCell('+SUM(A1:A10)') === '"\'+SUM(A1:A10)"', 'Section 4: + formula prefix neutralized');
    assert(escapeSafeCsvCell('-2+3') === '"\'-2+3"', 'Section 4: - formula prefix neutralized');
    assert(escapeSafeCsvCell('@SUM(A1)') === '"\'@SUM(A1)"', 'Section 4: @ formula prefix neutralized');
    assert(escapeSafeCsvCell('\t=1+1') === '"\'\t=1+1"', 'Section 4: Tab prefix neutralized');
    assert(escapeSafeCsvCell('\r=1+1') === '"\'\r=1+1"', 'Section 4: CR prefix neutralized');
    assert(
        escapeSafeCsvCell('data:application/pdf;base64,JVBERi0xLjQK') === '"[Binary Data Redacted]"',
        'Section 4: Data URL in CSV cell is redacted'
    );
    assert(
        escapeSafeCsvCell('برج الرياض "الرئيسي"، الدور 5') === '"برج الرياض ""الرئيسي""، الدور 5"',
        'Section 4: Arabic Unicode and embedded quotes escaped accurately in CSV cell'
    );

    // 2. Audit snapshot sanitization
    assert(
        sanitizeAuditStateSnapshot('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==') ===
            '[Binary Attachment Redacted]',
        'Section 4: Data URL in audit snapshot redacted'
    );
    assert(
        sanitizeAuditStateSnapshot('blob:https://awn.sa/550e8400-e29b-41d4-a716-446655440000') ===
            '[Binary Attachment Redacted]',
        'Section 4: Blob URL in audit snapshot redacted'
    );
    const sensitiveInline = sanitizeAuditStateSnapshot(
        'Updated IBAN: SA4480000000608010167519 | AccountNumber: 608010167519 | token=eyJhbGciOiJIUzI1NiJ9'
    );
    assert(
        Boolean(
            sensitiveInline &&
                !sensitiveInline.includes('SA4480000000608010167519') &&
                !sensitiveInline.includes('608010167519') &&
                !sensitiveInline.includes('eyJhbGciOiJIUzI1NiJ9') &&
                sensitiveInline.includes('[IBAN Redacted]') &&
                sensitiveInline.includes('[Redacted]')
        ),
        'Section 4: Inline IBAN, bank account number, and token are redacted from free-text audit snapshots'
    );
    const jsonWithSecrets = sanitizeAuditStateSnapshot(
        JSON.stringify({
            code: 'EMP-001',
            nameEn: 'Abdulrahman Al-Rajhi',
            status: 'Active',
            iban: 'SA4480000000608010167519',
            accountNumber: '608010167519',
            documentAttachments: { iqama: 'data:application/pdf;base64,AAAA' },
        })
    );
    assert(
        jsonWithSecrets === 'Code: EMP-001 | Name: Abdulrahman Al-Rajhi | Status: Active',
        'Section 4: JSON object audit snapshot extracts safe summary and strips IBAN/accountNumber/attachments'
    );

    // 3. Upload validation and phone validation
    assert(
        !validateUploadFileMeta({ name: 'exploit.exe', size: 1024, type: 'application/x-msdownload' }, 'document').valid,
        'Section 4: Executable upload blocked'
    );
    assert(
        !validateUploadFileMeta({ name: 'huge.pdf', size: 6 * 1024 * 1024, type: 'application/pdf' }, 'document').valid,
        'Section 4: Oversized (>5MB) upload blocked'
    );
    assert(isValidSaudiMobile('+966501234567') && !isValidSaudiMobile('12345'), 'Section 4: Saudi mobile validation enforced');
}

// ============================================================================
// SECTION 5: BILINGUAL EN/AR TRANSLATION PARITY & KEY COVERAGE
// ============================================================================
console.log('9. Section 5: Bilingual EN/AR Translation Key Parity & UMS Component Coverage');
{
    const enPath = path.resolve('src/i18n/en.json');
    const arPath = path.resolve('src/i18n/ar.json');
    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const arJson = JSON.parse(fs.readFileSync(arPath, 'utf-8'));

    function flattenKeys(obj: Record<string, unknown>, prefix = ''): Map<string, string> {
        const result = new Map<string, string>();
        for (const [k, v] of Object.entries(obj)) {
            const nextKey = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                for (const [subK, subV] of flattenKeys(v as Record<string, unknown>, nextKey)) {
                    result.set(subK, subV);
                }
            } else {
                result.set(nextKey, String(v ?? ''));
            }
        }
        return result;
    }

    const enMap = flattenKeys(enJson.ums || {}, 'ums');
    const arMap = flattenKeys(arJson.ums || {}, 'ums');

    const missingInAr = Array.from(enMap.keys()).filter((k) => !arMap.has(k) || !arMap.get(k)?.trim());
    const missingInEn = Array.from(arMap.keys()).filter((k) => !enMap.has(k) || !enMap.get(k)?.trim());

    assert(
        missingInAr.length === 0 && missingInEn.length === 0,
        `Section 5: 100% EN/AR parity across ${enMap.size} UMS translation keys (missingInAr=${missingInAr.length}, missingInEn=${missingInEn.length})`
    );
}

console.log('\n======================================================================');
console.log(`PHASE 4F VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================================');

if (failed > 0) {
    process.exit(1);
}
