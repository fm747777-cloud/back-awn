import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users,
    UserCheck,
    UserX,
    FileEdit,
    CalendarPlus,
    Clock,
    MailCheck,
    MailWarning,
    Search,
    X,
    RotateCcw,
    Download,
    Upload,
    Plus,
    Eye,
    Pencil,
    Power,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    ArrowLeft,
    ArrowRight,
    Building2,
    Briefcase,
    MapPin,
    ShieldCheck,
    Award,
    Wallet,
    FileText,
    HeartHandshake,
    Send,
    CheckCircle2,
    AlertTriangle,
    User,
    Mail,
    Phone,
    Landmark,
    History,
    Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import {
    loadEmployees,
    saveEmployees,
    loadDepartments,
    loadDesignations,
    loadBranches,
    loadRoles,
    loadSecurityGroups,
    loadCustomAddons,
    loadUmsAuditTrail,
    syncMasterEntityEmployeeCounts,
    computeIqamaStatus,
    computeEmployeeInvitationStatus,
    computeEmployeeProfileCompletion,
    computeEmployeeDirectoryKpis,
    checkEmployeeDeletionEligibility,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    UMS_PAGE_SIZE_OPTIONS,
    type EmployeeRecord,
    type EmployeeStatus,
    type ContractType,
    type DepartmentRecord,
    type DesignationRecord,
    type BranchRecord,
    type RoleRecord,
    type SecurityGroupRecord,
    type CustomAddonRecord,
} from './umsMockData';

const CONTRACT_TYPES: ContractType[] = [
    'Permanent',
    'Fixed Term',
    'Probation',
    'Seasonal',
    'Remote',
];

function getInitials(nameEn: string, nameAr: string): string {
    const cleanEn = (nameEn || '').trim();
    if (cleanEn) {
        const parts = cleanEn.split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return cleanEn.slice(0, 2).toUpperCase();
    }
    const cleanAr = (nameAr || '').trim();
    if (cleanAr) {
        const parts = cleanAr.split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`;
        }
        return cleanAr.slice(0, 2);
    }
    return 'EM';
}

function formatSarCurrency(amount: number, isRtl: boolean): string {
    const formatted = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return isRtl ? `${formatted} ر.س` : `SAR ${formatted}`;
}

// ============================================================================
// 1. EMPLOYEES MASTER DIRECTORY PAGE (/ums/employees)
// ============================================================================

export const UmsEmployeesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const currentUser = useAuthStore((state) => state.user);

    // Master & Employee Datasets loaded from UMS localStorage helpers
    const [employees, setEmployees] = useState<EmployeeRecord[]>(() => loadEmployees());
    const [departments] = useState<DepartmentRecord[]>(() => loadDepartments());
    const [designations] = useState<DesignationRecord[]>(() => loadDesignations());
    const [branches] = useState<BranchRecord[]>(() => loadBranches());
    const [roles] = useState<RoleRecord[]>(() => loadRoles());
    const [securityGroups] = useState<SecurityGroupRecord[]>(() => loadSecurityGroups());
    const [customAddons] = useState<CustomAddonRecord[]>(() => loadCustomAddons());

    // Search & Debounced Search State
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filter State
    const [statusFilter, setStatusFilter] = useState<'ALL' | EmployeeStatus>('ALL');
    const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
    const [designationFilter, setDesignationFilter] = useState<string>('ALL');
    const [branchFilter, setBranchFilter] = useState<string>('ALL');
    const [contractTypeFilter, setContractTypeFilter] = useState<'ALL' | ContractType>('ALL');
    const [probationFilter, setProbationFilter] = useState<
        'ALL' | 'UNDER_PROBATION' | 'CONFIRMED'
    >('ALL');

    // Pagination & Selection State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Deletion Dialog State
    const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRecord | null>(null);

    // Debounce search input (250ms)
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchInput);
            setCurrentPage(1);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Lookup Maps for O(1) Master-Data Relationship Resolution
    const departmentMap = useMemo(() => {
        const map = new Map<string, DepartmentRecord>();
        for (const d of departments) map.set(d.id, d);
        return map;
    }, [departments]);

    const designationMap = useMemo(() => {
        const map = new Map<string, DesignationRecord>();
        for (const d of designations) map.set(d.id, d);
        return map;
    }, [designations]);

    const branchMap = useMemo(() => {
        const map = new Map<string, BranchRecord>();
        for (const b of branches) map.set(b.id, b);
        return map;
    }, [branches]);

    const roleMap = useMemo(() => {
        const map = new Map<string, RoleRecord>();
        for (const r of roles) map.set(r.id, r);
        return map;
    }, [roles]);

    const securityGroupMap = useMemo(() => {
        const map = new Map<string, SecurityGroupRecord>();
        for (const sg of securityGroups) map.set(sg.id, sg);
        return map;
    }, [securityGroups]);

    const customAddonMap = useMemo(() => {
        const map = new Map<string, CustomAddonRecord>();
        for (const addon of customAddons) map.set(addon.id, addon);
        return map;
    }, [customAddons]);

    // Profile completion map for all employees
    const completionByEmployeeId = useMemo(() => {
        const map: Record<string, ReturnType<typeof computeEmployeeProfileCompletion>> = {};
        for (const emp of employees) {
            map[emp.id] = computeEmployeeProfileCompletion(emp);
        }
        return map;
    }, [employees]);

    // Dynamic 8 KPI Cards derived from live employee dataset
    const kpis = useMemo(() => computeEmployeeDirectoryKpis(employees), [employees]);

    // Persist employees helper
    const persistEmployees = (updated: EmployeeRecord[]) => {
        setEmployees(updated);
        saveEmployees(updated);
        syncMasterEntityEmployeeCounts(updated);
    };

    // Filtered Employees
    const filteredEmployees = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();

        return employees.filter((emp) => {
            if (statusFilter !== 'ALL' && emp.status !== statusFilter) {
                return false;
            }
            if (departmentFilter !== 'ALL' && emp.departmentId !== departmentFilter) {
                return false;
            }
            if (designationFilter !== 'ALL' && emp.designationId !== designationFilter) {
                return false;
            }
            if (branchFilter !== 'ALL' && emp.branchId !== branchFilter) {
                return false;
            }
            if (contractTypeFilter !== 'ALL' && emp.contractType !== contractTypeFilter) {
                return false;
            }
            if (probationFilter !== 'ALL') {
                const isProbation =
                    Boolean(emp.isUnderProbation) || emp.contractType === 'Probation';
                if (probationFilter === 'UNDER_PROBATION' && !isProbation) return false;
                if (probationFilter === 'CONFIRMED' && isProbation) return false;
            }

            if (!query) return true;

            const dept = departmentMap.get(emp.departmentId);
            const desig = designationMap.get(emp.designationId);
            const branch = branchMap.get(emp.branchId);
            const role = roleMap.get(emp.roleId);
            const sg = role
                ? securityGroupMap.get(role.securityGroupId)
                : emp.securityGroupId
                ? securityGroupMap.get(emp.securityGroupId)
                : undefined;
            const jobTitle = emp.jobTitleId ? customAddonMap.get(emp.jobTitleId) : undefined;
            const jobGrade = emp.jobGradeId ? customAddonMap.get(emp.jobGradeId) : undefined;
            const bank = emp.bankId ? customAddonMap.get(emp.bankId) : undefined;
            const religionAddon = emp.religionId ? customAddonMap.get(emp.religionId) : undefined;

            return (
                (emp.code || '').toLowerCase().includes(query) ||
                (emp.nameEn || '').toLowerCase().includes(query) ||
                (emp.nameAr || '').toLowerCase().includes(query) ||
                (emp.email || '').toLowerCase().includes(query) ||
                (emp.workEmail || '').toLowerCase().includes(query) ||
                (emp.phone || '').toLowerCase().includes(query) ||
                (desig?.titleEn || emp.designationTitle || '').toLowerCase().includes(query) ||
                (desig?.titleAr || emp.designationTitleAr || '').toLowerCase().includes(query) ||
                (desig?.code || '').toLowerCase().includes(query) ||
                (dept?.nameEn || emp.departmentName || '').toLowerCase().includes(query) ||
                (dept?.nameAr || emp.departmentNameAr || '').toLowerCase().includes(query) ||
                (dept?.code || '').toLowerCase().includes(query) ||
                (branch?.nameEn || emp.branchName || '').toLowerCase().includes(query) ||
                (branch?.nameAr || emp.branchNameAr || '').toLowerCase().includes(query) ||
                (branch?.code || '').toLowerCase().includes(query) ||
                (branch?.cityEn || '').toLowerCase().includes(query) ||
                (branch?.cityAr || '').toLowerCase().includes(query) ||
                (role?.nameEn || emp.roleName || '').toLowerCase().includes(query) ||
                (role?.nameAr || emp.roleNameAr || '').toLowerCase().includes(query) ||
                (role?.code || '').toLowerCase().includes(query) ||
                (sg?.nameEn || emp.securityGroupName || '').toLowerCase().includes(query) ||
                (sg?.nameAr || emp.securityGroupNameAr || '').toLowerCase().includes(query) ||
                (sg?.code || '').toLowerCase().includes(query) ||
                (jobTitle?.nameEn || emp.jobTitleName || '').toLowerCase().includes(query) ||
                (jobTitle?.nameAr || emp.jobTitleNameAr || '').toLowerCase().includes(query) ||
                (jobTitle?.code || '').toLowerCase().includes(query) ||
                (jobGrade?.nameEn || emp.jobGradeName || '').toLowerCase().includes(query) ||
                (jobGrade?.nameAr || emp.jobGradeNameAr || '').toLowerCase().includes(query) ||
                (jobGrade?.code || '').toLowerCase().includes(query) ||
                (bank?.nameEn || emp.bankName || '').toLowerCase().includes(query) ||
                (bank?.nameAr || emp.bankNameAr || '').toLowerCase().includes(query) ||
                (bank?.code || '').toLowerCase().includes(query) ||
                (religionAddon?.nameEn || emp.religion || '').toLowerCase().includes(query) ||
                (religionAddon?.nameAr || emp.religionAr || '').toLowerCase().includes(query) ||
                (religionAddon?.code || '').toLowerCase().includes(query) ||
                (emp.managerName || '').toLowerCase().includes(query) ||
                (emp.managerNameAr || '').toLowerCase().includes(query)
            );
        });
    }, [
        employees,
        debouncedSearch,
        statusFilter,
        departmentFilter,
        designationFilter,
        branchFilter,
        contractTypeFilter,
        probationFilter,
        departmentMap,
        designationMap,
        branchMap,
        roleMap,
        securityGroupMap,
        customAddonMap,
    ]);

    const hasActiveFilters =
        searchInput.trim().length > 0 ||
        statusFilter !== 'ALL' ||
        departmentFilter !== 'ALL' ||
        designationFilter !== 'ALL' ||
        branchFilter !== 'ALL' ||
        contractTypeFilter !== 'ALL' ||
        probationFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchInput('');
        setDebouncedSearch('');
        setStatusFilter('ALL');
        setDepartmentFilter('ALL');
        setDesignationFilter('ALL');
        setBranchFilter('ALL');
        setContractTypeFilter('ALL');
        setProbationFilter('ALL');
        setCurrentPage(1);
    };

    // Pagination calculation
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedEmployees = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredEmployees.slice(start, start + pageSize);
    }, [filteredEmployees, safePage, pageSize]);

    // Select-all-visible logic
    const visibleIds = useMemo(
        () => paginatedEmployees.map((emp) => emp.id),
        [paginatedEmployees]
    );
    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAllVisible = () => {
        if (allVisibleSelected) {
            setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const handleToggleSelectRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Single Employee Activate / Deactivate
    const handleToggleStatus = (emp: EmployeeRecord) => {
        const nextStatus: EmployeeStatus =
            emp.status === 'Active' ? 'Inactive' : 'Active';
        const todayIso = new Date().toISOString().slice(0, 10);

        const updated = employees.map((item) =>
            item.id === emp.id
                ? {
                      ...item,
                      status: nextStatus,
                      updatedAt: todayIso,
                  }
                : item
        );
        persistEmployees(updated);

        recordUmsAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Employee',
            resourceId: emp.id,
            resourceName: emp.nameEn,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Changed employment status of ${emp.code} (${emp.nameEn}) from ${emp.status} to ${nextStatus}.`,
            detailsAr: `تغيير الحالة الوظيفية للموظف ${emp.code} (${emp.nameAr}) إلى ${nextStatus === 'Active' ? 'نشط' : 'غير نشط'}.`,
        });

        const localizedStatus = t(`ums.employees.statuses.${nextStatus}`);
        toast.success(
            t('ums.employees.feedback.statusChanged', {
                name: isRtl ? emp.nameAr || emp.nameEn : emp.nameEn,
                status: localizedStatus,
            })
        );
    };

    // Bulk Activate / Deactivate
    const handleBulkStatusChange = (targetStatus: 'Active' | 'Inactive') => {
        if (selectedIds.length === 0) return;
        const selectedSet = new Set(selectedIds);
        const todayIso = new Date().toISOString().slice(0, 10);

        const updated = employees.map((emp) =>
            selectedSet.has(emp.id)
                ? {
                      ...emp,
                      status: targetStatus,
                      updatedAt: todayIso,
                  }
                : emp
        );
        persistEmployees(updated);

        recordUmsAuditEvent({
            action: targetStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Employee',
            resourceId: 'BULK',
            resourceName: `Employees (${selectedIds.length})`,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Bulk updated ${selectedIds.length} employee record(s) to ${targetStatus}.`,
            detailsAr: `تحديث جماعي لحالة ${selectedIds.length} موظف إلى ${targetStatus === 'Active' ? 'نشط' : 'غير نشط'}.`,
        });

        const localizedStatus = t(`ums.employees.statuses.${targetStatus}`);
        toast.success(
            t('ums.employees.feedback.bulkStatusChanged', {
                count: selectedIds.length,
                status: localizedStatus,
            })
        );
        setSelectedIds([]);
    };

    // Send / Resend Portal Invitation
    const handleSendInvitation = (emp: EmployeeRecord) => {
        const todayIso = new Date().toISOString().slice(0, 10);
        const updated = employees.map((item) =>
            item.id === emp.id
                ? {
                      ...item,
                      invitationStatus: 'Pending' as const,
                      invitedAt: todayIso,
                      updatedAt: todayIso,
                  }
                : item
        );
        persistEmployees(updated);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Employee',
            resourceId: emp.id,
            resourceName: emp.nameEn,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Sent portal onboarding invitation to ${emp.code} (${emp.workEmail || emp.email}).`,
            detailsAr: `إرسال دعوة الانضمام للبوابة الإلكترونية للموظف ${emp.code} (${emp.workEmail || emp.email}).`,
        });

        toast.success(
            t('ums.employees.feedback.invitationSent', {
                name: isRtl ? emp.nameAr || emp.nameEn : emp.nameEn,
                email: emp.workEmail || emp.email,
            })
        );
    };

    // Delete Confirmation & Dependency Check
    const deletionEligibility = useMemo(() => {
        if (!deletingEmployee) return null;
        return checkEmployeeDeletionEligibility(
            deletingEmployee.id,
            employees,
            departments
        );
    }, [deletingEmployee, employees, departments]);

    const handleConfirmDelete = () => {
        if (!deletingEmployee) return;
        const eligibility = checkEmployeeDeletionEligibility(
            deletingEmployee.id,
            employees,
            departments
        );
        if (!eligibility.canDelete) {
            toast.error(isRtl ? eligibility.reasonAr : eligibility.reasonEn);
            return;
        }

        const updated = employees.filter((e) => e.id !== deletingEmployee.id);
        persistEmployees(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== deletingEmployee.id));

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Employee',
            resourceId: deletingEmployee.id,
            resourceName: deletingEmployee.nameEn,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Deleted employee record ${deletingEmployee.code} (${deletingEmployee.nameEn}).`,
            detailsAr: `حذف سجل الموظف ${deletingEmployee.code} (${deletingEmployee.nameAr}).`,
            previousState: `Code: ${deletingEmployee.code} | Name: ${deletingEmployee.nameEn} | Status: ${deletingEmployee.status}`,
        });

        toast.success(
            t('ums.employees.feedback.deleted', {
                name: isRtl
                    ? deletingEmployee.nameAr || deletingEmployee.nameEn
                    : deletingEmployee.nameEn,
                code: deletingEmployee.code,
            })
        );
        setDeletingEmployee(null);
    };

    // CSV Export with UTF-8 BOM
    const handleExportCsv = (onlySelected = false) => {
        const sourceRecords = onlySelected
            ? employees.filter((e) => selectedIds.includes(e.id))
            : filteredEmployees;

        if (sourceRecords.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        const headers = [
            'Employee ID',
            'Name (EN)',
            'Name (AR)',
            'Work Email',
            'Personal Email',
            'Phone',
            'Department (EN)',
            'Department (AR)',
            'Designation (EN)',
            'Designation (AR)',
            'Role (EN)',
            'Role (AR)',
            'Security Group (EN)',
            'Security Group (AR)',
            'Branch (EN)',
            'Branch (AR)',
            'Job Title (EN)',
            'Job Title (AR)',
            'Job Grade (EN)',
            'Job Grade (AR)',
            'Bank (EN)',
            'Bank (AR)',
            'Religion (EN)',
            'Religion (AR)',
            'Contract Type',
            'Under Probation',
            'Profile Completion (%)',
            'Invitation Status',
            'Employment Status',
            'Joining Date',
        ];

        const rows = sourceRecords.map((emp) => {
            const dept = departmentMap.get(emp.departmentId);
            const desig = designationMap.get(emp.designationId);
            const role = roleMap.get(emp.roleId);
            const sg = role
                ? securityGroupMap.get(role.securityGroupId)
                : emp.securityGroupId
                ? securityGroupMap.get(emp.securityGroupId)
                : undefined;
            const branch = branchMap.get(emp.branchId);
            const jobTitle = emp.jobTitleId ? customAddonMap.get(emp.jobTitleId) : undefined;
            const jobGrade = emp.jobGradeId ? customAddonMap.get(emp.jobGradeId) : undefined;
            const bank = emp.bankId ? customAddonMap.get(emp.bankId) : undefined;
            const religionAddon = emp.religionId ? customAddonMap.get(emp.religionId) : undefined;
            const completion =
                completionByEmployeeId[emp.id]?.percentage ??
                computeEmployeeProfileCompletion(emp).percentage;
            const inviteStatus = computeEmployeeInvitationStatus(emp);

            return [
                escapeSafeCsvCell(emp.code),
                escapeSafeCsvCell(emp.nameEn || ''),
                escapeSafeCsvCell(emp.nameAr || ''),
                escapeSafeCsvCell(emp.workEmail || ''),
                escapeSafeCsvCell(emp.email || ''),
                escapeSafeCsvCell(emp.phone || ''),
                escapeSafeCsvCell(dept?.nameEn || emp.departmentName || ''),
                escapeSafeCsvCell(dept?.nameAr || emp.departmentNameAr || ''),
                escapeSafeCsvCell(desig?.titleEn || emp.designationTitle || ''),
                escapeSafeCsvCell(desig?.titleAr || emp.designationTitleAr || ''),
                escapeSafeCsvCell(role?.nameEn || emp.roleName || ''),
                escapeSafeCsvCell(role?.nameAr || emp.roleNameAr || ''),
                escapeSafeCsvCell(sg?.nameEn || emp.securityGroupName || ''),
                escapeSafeCsvCell(sg?.nameAr || emp.securityGroupNameAr || ''),
                escapeSafeCsvCell(branch?.nameEn || emp.branchName || ''),
                escapeSafeCsvCell(branch?.nameAr || emp.branchNameAr || ''),
                escapeSafeCsvCell(jobTitle?.nameEn || emp.jobTitleName || ''),
                escapeSafeCsvCell(jobTitle?.nameAr || emp.jobTitleNameAr || ''),
                escapeSafeCsvCell(jobGrade?.nameEn || emp.jobGradeName || ''),
                escapeSafeCsvCell(jobGrade?.nameAr || emp.jobGradeNameAr || ''),
                escapeSafeCsvCell(bank?.nameEn || emp.bankName || ''),
                escapeSafeCsvCell(bank?.nameAr || emp.bankNameAr || ''),
                escapeSafeCsvCell(religionAddon?.nameEn || emp.religion || ''),
                escapeSafeCsvCell(religionAddon?.nameAr || emp.religionAr || ''),
                escapeSafeCsvCell(emp.contractType),
                escapeSafeCsvCell(
                    emp.isUnderProbation || emp.contractType === 'Probation' ? 'Yes' : 'No'
                ),
                escapeSafeCsvCell(`${completion}%`),
                escapeSafeCsvCell(inviteStatus),
                escapeSafeCsvCell(emp.status),
                escapeSafeCsvCell(emp.joiningDate || ''),
            ];
        });

        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `awn-employees-directory-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Employee',
            resourceId: 'EXPORT-CSV',
            resourceName: `Employees Directory (${sourceRecords.length})`,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Exported ${sourceRecords.length} employee record(s) to UTF-8 CSV.`,
            detailsAr: `تصدير ${sourceRecords.length} سجل موظف إلى ملف CSV.`,
        });

        toast.success(
            t('ums.employees.feedback.exported', {
                count: sourceRecords.length,
            })
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* ============================================================================ */}
            {/* PAGE HEADER                                                                  */}
            {/* ============================================================================ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.employees.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            UMS-EMP
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.employees.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees/import')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Upload size={14} className="text-[#857E74]" />
                        <span>{t('ums.employees.actions.importEmployees')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleExportCsv(false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('ums.employees.actions.exportCsv')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees/new')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>{t('ums.employees.actions.addEmployee')}</span>
                    </button>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* 8 DYNAMIC KPI CARDS                                                          */}
            {/* ============================================================================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Employees */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.totalEmployees')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                                {kpis.totalEmployees}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.totalSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                        <Users size={18} />
                    </div>
                </div>

                {/* 2. Active Employees */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.activeEmployees')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#265938]">
                                {kpis.activeEmployees}
                            </span>
                            <span className="text-[11px] text-[#265938] font-medium">
                                {t('ums.employees.kpis.activeSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-center text-[#265938]">
                        <UserCheck size={18} />
                    </div>
                </div>

                {/* 3. Inactive Employees */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.inactiveEmployees')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#6E6862]">
                                {kpis.inactiveEmployees}
                            </span>
                            <span className="text-[11px] text-[#857E74]">
                                {t('ums.employees.kpis.inactiveSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#857E74]">
                        <UserX size={18} />
                    </div>
                </div>

                {/* 4. Draft Employees */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.draftEmployees')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#C28E3A]">
                                {kpis.draftEmployees}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.draftSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#C28E3A]">
                        <FileEdit size={18} />
                    </div>
                </div>

                {/* 5. Joined This Month */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.joinedThisMonth')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#1B4D3E]">
                                {kpis.joinedThisMonth}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.joinedSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#1B4D3E]">
                        <CalendarPlus size={18} />
                    </div>
                </div>

                {/* 6. Under Probation */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.underProbation')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#C28E3A]">
                                {kpis.underProbation}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.probationSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#C28E3A]">
                        <Clock size={18} />
                    </div>
                </div>

                {/* 7. Invited Employees */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.invitedEmployees')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#2D3F2C]">
                                {kpis.invitedEmployees}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.invitedSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                        <MailCheck size={18} />
                    </div>
                </div>

                {/* 8. Pending Invitations */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#857E74]">
                            {t('ums.employees.kpis.pendingInvitations')}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-2xl font-bold font-mono text-[#C28E3A]">
                                {kpis.pendingInvitations}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.pendingInvitesSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#C28E3A]">
                        <MailWarning size={18} />
                    </div>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* MAIN CARD: SEARCH, FILTERS, BULK BAR, TABLE & PAGINATION                     */}
            {/* ============================================================================ */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Search & Filters Toolbar */}
                <div className="p-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/60 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Debounced Multilingual Search */}
                        <div className="relative flex-1 max-w-xl">
                            <Search
                                size={15}
                                className="absolute start-3 top-1/2 -translate-y-1/2 text-[#857E74]"
                            />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('ums.employees.filters.searchPlaceholder')}
                                className="w-full ps-9 pe-8 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] transition-all"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput('');
                                        setDebouncedSearch('');
                                        setCurrentPage(1);
                                    }}
                                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                                    aria-label={t('common.clear', { defaultValue: 'Clear' })}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status Segmented Filter + Reset Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center p-1 rounded-lg bg-[#EFECE6] border border-[#E5E0D8]">
                                {(['ALL', 'Active', 'Inactive', 'Draft'] as const).map(
                                    (statusOption) => {
                                        const isActive = statusFilter === statusOption;
                                        const label =
                                            statusOption === 'ALL'
                                                ? t('ums.employees.filters.allStatuses')
                                                : t(`ums.employees.statuses.${statusOption}`);
                                        return (
                                            <button
                                                key={statusOption}
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter(statusOption);
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-[#2D3F2C] text-white shadow-2xs'
                                                        : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    <span>{t('ums.employees.actions.resetFilters')}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Master-Data Dropdown Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                        {/* Department Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#857E74] mb-1">
                                {t('ums.employees.filters.departmentLabel')}
                            </label>
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    setDepartmentFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.employees.filters.departmentLabel')}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('ums.employees.filters.allDepartments')}
                                </option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {isRtl ? dept.nameAr : dept.nameEn}
                                        {dept.status === 'Inactive'
                                            ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Designation Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#857E74] mb-1">
                                {t('ums.employees.filters.designationLabel')}
                            </label>
                            <select
                                value={designationFilter}
                                onChange={(e) => {
                                    setDesignationFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.employees.filters.designationLabel')}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('ums.employees.filters.allDesignations')}
                                </option>
                                {designations.map((desig) => (
                                    <option key={desig.id} value={desig.id}>
                                        {isRtl ? desig.titleAr : desig.titleEn}
                                        {desig.status === 'Inactive'
                                            ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Branch Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#857E74] mb-1">
                                {t('ums.employees.filters.branchLabel')}
                            </label>
                            <select
                                value={branchFilter}
                                onChange={(e) => {
                                    setBranchFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.employees.filters.branchLabel')}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('ums.employees.filters.allBranches')}
                                </option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {isRtl ? branch.nameAr : branch.nameEn}
                                        {branch.status === 'Inactive'
                                            ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Contract Type Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#857E74] mb-1">
                                {t('ums.employees.filters.contractTypeLabel')}
                            </label>
                            <select
                                value={contractTypeFilter}
                                onChange={(e) => {
                                    setContractTypeFilter(
                                        e.target.value as 'ALL' | ContractType
                                    );
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.employees.filters.contractTypeLabel')}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('ums.employees.filters.allContractTypes')}
                                </option>
                                {CONTRACT_TYPES.map((ct) => (
                                    <option key={ct} value={ct}>
                                        {t(`ums.employees.contractTypes.${ct}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Probation Status Filter */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#857E74] mb-1">
                                {t('ums.employees.filters.probationLabel')}
                            </label>
                            <select
                                value={probationFilter}
                                onChange={(e) => {
                                    setProbationFilter(
                                        e.target.value as 'ALL' | 'UNDER_PROBATION' | 'CONFIRMED'
                                    );
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.employees.filters.probationLabel')}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('ums.employees.filters.allProbation')}
                                </option>
                                <option value="UNDER_PROBATION">
                                    {t('ums.employees.filters.underProbationOnly')}
                                </option>
                                <option value="CONFIRMED">
                                    {t('ums.employees.filters.confirmedOnly')}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Bulk Operations Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#EAF3EC] border-b border-[#265938]/20 text-xs">
                        <span className="font-semibold text-[#265938]">
                            {t('ums.employees.table.selectedCount', {
                                count: selectedIds.length,
                            })}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Active')}
                                className="px-2.5 py-1 rounded bg-white text-[#265938] border border-[#265938]/30 font-semibold hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                {t('ums.employees.actions.bulkActivate')}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="px-2.5 py-1 rounded bg-white text-[#6E6862] border border-[#E5E0D8] font-semibold hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                {t('ums.employees.actions.bulkDeactivate')}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExportCsv(true)}
                                className="px-2.5 py-1 rounded bg-white text-[#2D3F2C] border border-[#E5E0D8] font-semibold hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                {t('ums.employees.actions.bulkExport')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                {t('ums.employees.actions.clearSelection')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Employees Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                <th className="py-3 px-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={allVisibleSelected}
                                        onChange={handleToggleSelectAllVisible}
                                        aria-label={t('common.selectAll', {
                                            defaultValue: 'Select all visible rows',
                                        })}
                                        className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colCode')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colEmployee')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colEmail')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colDesignation')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colRole')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colDepartment')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colCompletion')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('ums.employees.table.colStatus')}
                                </th>
                                <th className="py-3 px-4 text-end">
                                    {t('ums.employees.table.colActions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E5E0D8] text-xs">
                            {paginatedEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-14 px-4 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <Users size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {hasActiveFilters
                                                    ? t('ums.employees.empty.noFilteredTitle')
                                                    : t('ums.employees.empty.noEmployeesTitle')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {hasActiveFilters
                                                    ? t('ums.employees.empty.noFilteredDesc')
                                                    : t('ums.employees.empty.noEmployeesDesc')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>
                                                        {t('ums.employees.actions.resetFilters')}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmployees.map((emp) => {
                                    const isSelected = selectedIds.includes(emp.id);
                                    const dept = departmentMap.get(emp.departmentId);
                                    const desig = designationMap.get(emp.designationId);
                                    const branch = branchMap.get(emp.branchId);
                                    const role = roleMap.get(emp.roleId);
                                    const secGroup = role
                                        ? securityGroupMap.get(role.securityGroupId)
                                        : undefined;
                                    const completion =
                                        completionByEmployeeId[emp.id] ||
                                        computeEmployeeProfileCompletion(emp);
                                    const isProbation =
                                        Boolean(emp.isUnderProbation) ||
                                        emp.contractType === 'Probation';

                                    return (
                                        <tr
                                            key={emp.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#EAF3EC]/50'
                                                    : 'hover:bg-[#FAF8F5]/80'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectRow(emp.id)}
                                                    aria-label={emp.code}
                                                    className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            {/* Employee ID */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(`/ums/employees/${emp.id}`)
                                                    }
                                                    className="font-mono font-bold text-[#2D3F2C] hover:underline cursor-pointer"
                                                    dir="ltr"
                                                >
                                                    {emp.code}
                                                </button>
                                            </td>

                                            {/* Employee Name & Initials/Avatar */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {emp.avatarUrl ? (
                                                        <img
                                                            src={emp.avatarUrl}
                                                            alt={
                                                                isRtl
                                                                    ? emp.nameAr || emp.nameEn
                                                                    : emp.nameEn
                                                            }
                                                            className="w-8 h-8 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                                            {getInitials(emp.nameEn, emp.nameAr)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(`/ums/employees/${emp.id}`)
                                                            }
                                                            className="font-bold text-[#0D0D0D] hover:text-[#2D3F2C] transition-colors text-start block truncate cursor-pointer"
                                                        >
                                                            {isRtl
                                                                ? emp.nameAr || emp.nameEn
                                                                : emp.nameEn || emp.nameAr}
                                                        </button>
                                                        <span className="text-[11px] text-[#6E6862] block truncate">
                                                            {isRtl
                                                                ? emp.nameEn
                                                                : emp.nameAr}{' '}
                                                            · {emp.nationality}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td className="py-3 px-4">
                                                <div className="space-y-0.5">
                                                    <span
                                                        className="font-mono text-[#0D0D0D] block truncate max-w-[190px]"
                                                        dir="ltr"
                                                    >
                                                        {emp.workEmail || emp.email || (
                                                            <span className="italic text-[#857E74]">
                                                                {t('ums.employees.table.noEmail')}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {emp.workEmail &&
                                                        emp.email &&
                                                        emp.workEmail !== emp.email && (
                                                            <span
                                                                className="text-[11px] text-[#857E74] block truncate max-w-[190px]"
                                                                dir="ltr"
                                                            >
                                                                {emp.email}
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            {/* Designation */}
                                            <td className="py-3 px-4">
                                                {desig ? (
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D] block">
                                                            {isRtl ? desig.titleAr : desig.titleEn}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-[#857E74]">
                                                            {desig.code}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#857E74] italic">
                                                        {t('ums.employees.table.unassigned')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Role */}
                                            <td className="py-3 px-4">
                                                {role ? (
                                                    <div>
                                                        <span className="font-semibold text-[#2D3F2C] block">
                                                            {isRtl ? role.nameAr : role.nameEn}
                                                        </span>
                                                        {secGroup && (
                                                            <span className="text-[11px] text-[#6E6862] block truncate max-w-[160px]">
                                                                {isRtl
                                                                    ? secGroup.nameAr
                                                                    : secGroup.nameEn}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#857E74] italic">
                                                        {t('ums.employees.table.unassigned')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Department */}
                                            <td className="py-3 px-4">
                                                {dept ? (
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D] block">
                                                            {isRtl ? dept.nameAr : dept.nameEn}
                                                        </span>
                                                        {branch && (
                                                            <span className="text-[11px] text-[#6E6862] block">
                                                                {isRtl
                                                                    ? branch.cityAr
                                                                    : branch.cityEn}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[#857E74] italic">
                                                        {t('ums.employees.table.unassigned')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Profile Completion Percentage */}
                                            <td className="py-3 px-4 min-w-[140px]">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="font-mono font-bold text-[#0D0D0D]">
                                                            {completion.percentage}%
                                                        </span>
                                                        <span className="text-[#857E74]">
                                                            {t(
                                                                'ums.employees.table.completeFieldsCount',
                                                                {
                                                                    completed:
                                                                        completion.completedCount,
                                                                    total: completion.totalCount,
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    <svg
                                                        className="w-full h-1.5 rounded-full bg-[#EFECE6] overflow-hidden block"
                                                        aria-hidden="true"
                                                    >
                                                        <rect
                                                            x="0"
                                                            y="0"
                                                            width={`${completion.percentage}%`}
                                                            height="100%"
                                                            rx="3"
                                                            className={
                                                                completion.percentage === 100
                                                                    ? 'fill-[#265938]'
                                                                    : completion.percentage >= 75
                                                                    ? 'fill-[#2D3F2C]'
                                                                    : 'fill-[#C28E3A]'
                                                            }
                                                        />
                                                    </svg>
                                                </div>
                                            </td>

                                            {/* Employment Status */}
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="flex flex-col items-start gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(emp)}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                                                            emp.status === 'Active'
                                                                ? 'text-[#265938] hover:text-[#1B4D3E]'
                                                                : emp.status === 'Draft'
                                                                ? 'text-[#C28E3A] hover:text-[#0D0D0D]'
                                                                : 'text-[#857E74] hover:text-[#0D0D0D]'
                                                        }`}
                                                        title={
                                                            emp.status === 'Active'
                                                                ? t(
                                                                      'ums.employees.actions.deactivate'
                                                                  )
                                                                : t('ums.employees.actions.activate')
                                                        }
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                emp.status === 'Active'
                                                                    ? 'bg-[#265938]'
                                                                    : emp.status === 'Draft'
                                                                    ? 'bg-[#C28E3A]'
                                                                    : 'bg-[#857E74]'
                                                            }`}
                                                        />
                                                        <span>
                                                            {t(
                                                                `ums.employees.statuses.${emp.status}`
                                                            )}
                                                        </span>
                                                    </button>
                                                    {isProbation && (
                                                        <span className="text-[10px] font-medium text-[#C28E3A]">
                                                            {t('ums.employees.table.probationTag')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Row Actions */}
                                            <td className="py-3 px-4 text-end whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(`/ums/employees/${emp.id}`)
                                                        }
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t(
                                                            'ums.employees.actions.viewDetails'
                                                        )}
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/ums/employees/${emp.id}/edit`
                                                            )
                                                        }
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t(
                                                            'ums.employees.actions.editEmployee'
                                                        )}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendInvitation(emp)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={
                                                            computeEmployeeInvitationStatus(emp) ===
                                                            'Not Sent'
                                                                ? t(
                                                                      'ums.employees.actions.sendInvitation'
                                                                  )
                                                                : t(
                                                                      'ums.employees.actions.resendInvitation'
                                                                  )
                                                        }
                                                    >
                                                        <Send size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(emp)}
                                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                                            emp.status === 'Active'
                                                                ? 'text-[#265938] hover:bg-[#EAF3EC]'
                                                                : 'text-[#857E74] hover:bg-[#FAF8F5]'
                                                        }`}
                                                        title={
                                                            emp.status === 'Active'
                                                                ? t(
                                                                      'ums.employees.actions.deactivate'
                                                                  )
                                                                : t('ums.employees.actions.activate')
                                                        }
                                                    >
                                                        <Power size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingEmployee(emp)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                                                        title={t('ums.employees.actions.delete')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E0D8] bg-[#FAF8F5]/50 text-xs text-[#6E6862]">
                    <div className="flex items-center gap-2">
                        <span>{t('common.rowsPerPage', { defaultValue: 'Rows per page:' })}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label={t('common.rowsPerPage', { defaultValue: 'Rows per page:' })}
                            className="px-2 py-1 rounded bg-white border border-[#E5E0D8] text-xs text-[#45413C] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                        >
                            {UMS_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span className="ms-2">
                            {t('common.showingPagination', {
                                defaultValue: `Showing ${
                                    filteredEmployees.length === 0
                                        ? 0
                                        : (safePage - 1) * pageSize + 1
                                } - ${Math.min(
                                    safePage * pageSize,
                                    filteredEmployees.length
                                )} of ${filteredEmployees.length}`,
                                start:
                                    filteredEmployees.length === 0
                                        ? 0
                                        : (safePage - 1) * pageSize + 1,
                                end: Math.min(safePage * pageSize, filteredEmployees.length),
                                total: filteredEmployees.length,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.prev', { defaultValue: 'Previous Page' })}
                        >
                            <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>

                        <span className="px-2 font-semibold text-[#0D0D0D]">
                            {safePage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.next', { defaultValue: 'Next Page' })}
                        >
                            <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* DELETE CONFIRMATION & DEPENDENCY PROTECTION DIALOG                           */}
            {/* ============================================================================ */}
            {deletingEmployee && deletionEligibility && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        {!deletionEligibility.canDelete ? (
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <ShieldAlert size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t('ums.employees.deleteModal.blockedTitle')}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4 leading-relaxed">
                                    {isRtl
                                        ? deletionEligibility.reasonAr
                                        : deletionEligibility.reasonEn}
                                </p>

                                {/* Referenced Departments & Direct Reports */}
                                <div className="mb-4 p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] max-h-40 overflow-y-auto space-y-2 text-xs">
                                    {deletionEligibility.headedDepartments.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-[#0D0D0D] mb-1">
                                                {t(
                                                    'ums.employees.deleteModal.headedDepartmentsLabel'
                                                )}
                                            </p>
                                            {deletionEligibility.headedDepartments.map((d) => (
                                                <div
                                                    key={d.id}
                                                    className="flex items-center justify-between text-[11px] text-[#45413C] py-0.5"
                                                >
                                                    <span>{isRtl ? d.nameAr : d.nameEn}</span>
                                                    <span className="font-mono text-[#857E74]">
                                                        {d.code}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {deletionEligibility.directReports.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-[#0D0D0D] mb-1">
                                                {t('ums.employees.deleteModal.directReportsLabel')}
                                            </p>
                                            {deletionEligibility.directReports.map((rep) => (
                                                <div
                                                    key={rep.id}
                                                    className="flex items-center justify-between text-[11px] text-[#45413C] py-0.5"
                                                >
                                                    <span>
                                                        {isRtl ? rep.nameAr : rep.nameEn}
                                                    </span>
                                                    <span className="font-mono text-[#857E74]">
                                                        {rep.code}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingEmployee(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.close', { defaultValue: 'Close' })}
                                    </button>
                                    {deletingEmployee.status === 'Active' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleToggleStatus(deletingEmployee);
                                                setDeletingEmployee(null);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                                        >
                                            {t('ums.employees.actions.deactivateInstead')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <Trash2 size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t('ums.employees.deleteModal.title')}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4 leading-relaxed">
                                    {t('ums.employees.deleteModal.confirmMessage')}
                                    <span className="block font-bold text-[#0D0D0D] mt-2">
                                        {deletingEmployee.code} —{' '}
                                        {isRtl
                                            ? deletingEmployee.nameAr || deletingEmployee.nameEn
                                            : deletingEmployee.nameEn}
                                    </span>
                                </p>

                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingEmployee(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.cancel', { defaultValue: 'Cancel' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        {t('common.delete', { defaultValue: 'Delete' })}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// 2. EMPLOYEE DETAILS PAGE (/ums/employees/:id)
// ============================================================================

export const UmsEmployeeDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const currentUser = useAuthStore((state) => state.user);

    const [employees, setEmployees] = useState<EmployeeRecord[]>(() => loadEmployees());
    const [departments] = useState<DepartmentRecord[]>(() => loadDepartments());
    const [designations] = useState<DesignationRecord[]>(() => loadDesignations());
    const [branches] = useState<BranchRecord[]>(() => loadBranches());
    const [roles] = useState<RoleRecord[]>(() => loadRoles());
    const [securityGroups] = useState<SecurityGroupRecord[]>(() => loadSecurityGroups());
    const [customAddons] = useState<CustomAddonRecord[]>(() => loadCustomAddons());

    const employee = useMemo(
        () => employees.find((emp) => emp.id === id || emp.code === id) || null,
        [employees, id]
    );

    const persistEmployees = (updated: EmployeeRecord[]) => {
        setEmployees(updated);
        saveEmployees(updated);
        syncMasterEntityEmployeeCounts(updated);
    };

    if (!employee) {
        return (
            <div className="space-y-6 text-start">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{t('ums.employees.actions.backToList')}</span>
                    </button>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-10 text-center max-w-lg mx-auto shadow-2xs space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto">
                        <ShieldAlert size={22} />
                    </div>
                    <h2 className="text-lg font-bold text-[#0D0D0D]">
                        {t('ums.employees.details.notFoundTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862] leading-relaxed">
                        {t('ums.employees.details.notFoundDesc', { id: id || '—' })}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <span>{t('ums.employees.actions.backToList')}</span>
                    </button>
                </div>
            </div>
        );
    }

    // Resolve Master-Data Relationships
    const department = departments.find((d) => d.id === employee.departmentId);
    const designation = designations.find((d) => d.id === employee.designationId);
    const branch = branches.find((b) => b.id === employee.branchId);
    const role = roles.find((r) => r.id === employee.roleId);
    const securityGroup = role
        ? securityGroups.find((sg) => sg.id === role.securityGroupId)
        : undefined;
    const jobGrade = customAddons.find(
        (a) => a.type === 'job_grade' && a.id === employee.jobGradeId
    );
    const jobTitleAddon = customAddons.find(
        (a) => a.type === 'job_title' && a.id === employee.jobTitleId
    );
    const bankAddon = customAddons.find(
        (a) => a.type === 'bank' && a.id === employee.bankId
    );
    const religionAddon = customAddons.find(
        (a) =>
            a.type === 'religion' &&
            (a.id === employee.religionId ||
                a.id === employee.religion ||
                a.nameEn.toLowerCase() === (employee.religion || '').toLowerCase() ||
                a.nameAr === employee.religion)
    );
    const manager = employee.managerId
        ? employees.find((e) => e.id === employee.managerId)
        : undefined;
    const employeeAuditEvents = loadUmsAuditTrail()
        .filter(
            (ev) =>
                ev.resource === 'Employee' &&
                (ev.resourceId === employee.id ||
                    ev.resourceName.includes(employee.code) ||
                    ev.detailsEn.includes(employee.code))
        )
        .slice(0, 6);
    const attachedDocumentsList = Object.entries(employee.documentAttachments || {}).filter(
        (entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1])
    );

    const completion = computeEmployeeProfileCompletion(employee);
    const invitationStatus = computeEmployeeInvitationStatus(employee);
    const iqamaStatus = computeIqamaStatus(employee.iqamaExpiryDate);
    const isProbation =
        Boolean(employee.isUnderProbation) || employee.contractType === 'Probation';
    const notProvidedText = t('ums.employees.details.fields.notProvided');

    const handleToggleStatus = () => {
        const nextStatus: EmployeeStatus =
            employee.status === 'Active' ? 'Inactive' : 'Active';
        const todayIso = new Date().toISOString().slice(0, 10);

        const updated = employees.map((item) =>
            item.id === employee.id
                ? { ...item, status: nextStatus, updatedAt: todayIso }
                : item
        );
        persistEmployees(updated);

        recordUmsAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Employee',
            resourceId: employee.id,
            resourceName: employee.nameEn,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Changed employment status of ${employee.code} (${employee.nameEn}) to ${nextStatus}.`,
            detailsAr: `تغيير الحالة الوظيفية للموظف ${employee.code} (${employee.nameAr}) إلى ${nextStatus === 'Active' ? 'نشط' : 'غير نشط'}.`,
        });

        toast.success(
            t('ums.employees.feedback.statusChanged', {
                name: isRtl ? employee.nameAr || employee.nameEn : employee.nameEn,
                status: t(`ums.employees.statuses.${nextStatus}`),
            })
        );
    };

    const handleSendInvitation = () => {
        const todayIso = new Date().toISOString().slice(0, 10);
        const updated = employees.map((item) =>
            item.id === employee.id
                ? {
                      ...item,
                      invitationStatus: 'Pending' as const,
                      invitedAt: todayIso,
                      updatedAt: todayIso,
                  }
                : item
        );
        persistEmployees(updated);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Employee',
            resourceId: employee.id,
            resourceName: employee.nameEn,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            detailsEn: `Sent portal onboarding invitation to ${employee.code} (${employee.workEmail || employee.email}).`,
            detailsAr: `إرسال دعوة المنصة الإلكترونية للموظف ${employee.code} (${employee.workEmail || employee.email}).`,
        });

        toast.success(
            t('ums.employees.feedback.invitationSent', {
                name: isRtl ? employee.nameAr || employee.nameEn : employee.nameEn,
                email: employee.workEmail || employee.email,
            })
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* Top Navigation & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{t('ums.employees.actions.backToList')}</span>
                    </button>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[#0D0D0D]">
                                {isRtl
                                    ? employee.nameAr || employee.nameEn
                                    : employee.nameEn || employee.nameAr}
                            </h1>
                            <span
                                className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                dir="ltr"
                            >
                                {employee.code}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {designation
                                ? isRtl
                                    ? designation.titleAr
                                    : designation.titleEn
                                : t('ums.employees.table.unassigned')}{' '}
                            ·{' '}
                            {department
                                ? isRtl
                                    ? department.nameAr
                                    : department.nameEn
                                : t('ums.employees.table.unassigned')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSendInvitation}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        <Send size={13} />
                        <span>
                            {invitationStatus === 'Not Sent'
                                ? t('ums.employees.actions.sendInvitation')
                                : t('ums.employees.actions.resendInvitation')}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleToggleStatus}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                    >
                        <Power size={13} />
                        <span>
                            {employee.status === 'Active'
                                ? t('ums.employees.actions.deactivate')
                                : t('ums.employees.actions.activate')}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(`/ums/employees/${employee.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Pencil size={13} />
                        <span>{t('ums.employees.actions.editEmployee')}</span>
                    </button>
                </div>
            </div>

            {/* Draft / Incomplete Profile Banner */}
            {(employee.status === 'Draft' || completion.percentage < 100) && (
                <div className="bg-[#FAF8F5] border border-[#C28E3A]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] text-[#C28E3A] flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-[#0D0D0D]">
                                {t('ums.employees.details.draftBannerTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('ums.employees.details.draftBannerDesc', {
                                    percentage: completion.percentage,
                                })}
                            </p>
                            {(isRtl
                                ? completion.missingFieldsAr
                                : completion.missingFieldsEn
                            ).length > 0 && (
                                <p className="text-[11px] text-[#45413C] mt-1.5">
                                    <span className="font-semibold">
                                        {t('ums.employees.details.incompleteHint')}{' '}
                                    </span>
                                    {(isRtl
                                        ? completion.missingFieldsAr
                                        : completion.missingFieldsEn
                                    ).join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate(`/ums/employees/${employee.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors shrink-0 cursor-pointer"
                    >
                        <Pencil size={13} />
                        <span>{t('ums.employees.actions.editEmployee')}</span>
                    </button>
                </div>
            )}

            {/* Profile Identity Overview Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {employee.avatarUrl ? (
                        <img
                            src={employee.avatarUrl}
                            alt={employee.nameEn}
                            className="w-14 h-14 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center font-bold text-base shrink-0">
                            {getInitials(employee.nameEn, employee.nameAr)}
                        </div>
                    )}
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {employee.nameEn}
                            </h2>
                            <span className="text-sm font-semibold text-[#2D3F2C]" dir="rtl">
                                ({employee.nameAr})
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6862] mt-1">
                            <span>
                                {t(`ums.employees.statuses.${employee.status}`)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                                {t(`ums.employees.contractTypes.${employee.contractType}`)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                                {t(`ums.employees.employmentTypes.${employee.employmentType}`)}
                            </span>
                            {isProbation && (
                                <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[#C28E3A] font-semibold">
                                        {t('ums.employees.table.probationTag')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Completion Progress Meter */}
                <div className="w-full md:w-64 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-[#45413C]">
                            {t('ums.employees.details.fields.profileCompletion')}
                        </span>
                        <span className="font-mono font-bold text-[#2D3F2C]">
                            {completion.percentage}%
                        </span>
                    </div>
                    <svg
                        className="w-full h-2 rounded-full bg-[#E5E0D8] overflow-hidden block"
                        aria-hidden="true"
                    >
                        <rect
                            x="0"
                            y="0"
                            width={`${completion.percentage}%`}
                            height="100%"
                            rx="4"
                            className={
                                completion.percentage === 100
                                    ? 'fill-[#265938]'
                                    : 'fill-[#C28E3A]'
                            }
                        />
                    </svg>
                    <p className="text-[11px] text-[#857E74] mt-1">
                        {t('ums.employees.table.completeFieldsCount', {
                            completed: completion.completedCount,
                            total: completion.totalCount,
                        })}
                    </p>
                </div>
            </div>

            {/* 6 ORGANIZED DETAIL SECTIONS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SECTION 1: PERSONAL INFORMATION */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <User size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.details.sectionPersonal')}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.details.sectionPersonalDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.fullNameEn')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.nameEn || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.fullNameAr')}
                            </span>
                            <span
                                className="font-semibold text-[#0D0D0D] mt-0.5 block"
                                dir="rtl"
                            >
                                {employee.nameAr || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Mail size={11} />
                                {t('ums.employees.details.fields.workEmail')}
                            </span>
                            <span
                                className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block"
                                dir="ltr"
                            >
                                {employee.workEmail || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Mail size={11} />
                                {t('ums.employees.details.fields.personalEmail')}
                            </span>
                            <span
                                className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block"
                                dir="ltr"
                            >
                                {employee.email || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Phone size={11} />
                                {t('ums.employees.details.fields.phone')}
                            </span>
                            <span
                                className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block"
                                dir="ltr"
                            >
                                {employee.phone || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.dobGregorian')} /{' '}
                                {t('ums.employees.details.fields.dobHijri')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.dobGregorian || notProvidedText} ·{' '}
                                {employee.dobHijri || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.gender')} &{' '}
                                {t('ums.employees.details.fields.maritalStatus')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {t(`ums.employees.genders.${employee.gender}`)} ·{' '}
                                {t(`ums.employees.maritalStatuses.${employee.maritalStatus}`)}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.religion')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {religionAddon
                                    ? isRtl
                                        ? religionAddon.nameAr
                                        : religionAddon.nameEn
                                    : employee.religion || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.citizenship')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {t(`ums.employees.citizenships.${employee.citizenship}`)}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.nationality')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.nationality || notProvidedText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: EMPLOYMENT INFORMATION */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <Briefcase size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.details.sectionEmployment')}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.details.sectionEmploymentDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Building2 size={11} />
                                {t('ums.employees.details.fields.department')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {department
                                    ? `${isRtl ? department.nameAr : department.nameEn} (${department.code})`
                                    : notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Briefcase size={11} />
                                {t('ums.employees.details.fields.designation')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {designation
                                    ? `${isRtl ? designation.titleAr : designation.titleEn} (${designation.code})`
                                    : notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <MapPin size={11} />
                                {t('ums.employees.details.fields.branch')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {branch
                                    ? `${isRtl ? branch.nameAr : branch.nameEn} (${branch.code})`
                                    : notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <ShieldCheck size={11} />
                                {t('ums.employees.details.fields.role')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {role
                                    ? `${isRtl ? role.nameAr : role.nameEn} (${role.code})`
                                    : notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Award size={11} />
                                {t('ums.employees.details.fields.jobGrade')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {jobGrade
                                    ? `${isRtl ? jobGrade.nameAr : jobGrade.nameEn} (${jobGrade.code})`
                                    : employee.jobGradeId || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.directManager')}
                            </span>
                            {manager ? (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/ums/employees/${manager.id}`)}
                                    className="font-semibold text-[#2D3F2C] hover:underline mt-0.5 block cursor-pointer"
                                >
                                    {isRtl ? manager.nameAr : manager.nameEn} ({manager.code})
                                </button>
                            ) : (
                                <span className="font-semibold text-[#6E6862] mt-0.5 block">
                                    {t('ums.employees.details.fields.noManager')}
                                </span>
                            )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.joiningDate')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.joiningDate || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.contractType')} /{' '}
                                {t('ums.employees.details.fields.employmentType')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {t(`ums.employees.contractTypes.${employee.contractType}`)} ·{' '}
                                {t(`ums.employees.employmentTypes.${employee.employmentType}`)}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.wizard.employment.jobTitle')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {jobTitleAddon
                                    ? `${isRtl ? jobTitleAddon.nameAr : jobTitleAddon.nameEn} (${jobTitleAddon.code})`
                                    : employee.jobTitleName || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.probationStatus')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {isProbation
                                    ? t('ums.employees.filters.underProbationOnly')
                                    : t('ums.employees.filters.confirmedOnly')}{' '}
                                ({t('ums.employees.details.fields.probationDays', {
                                    days: employee.probationPeriodDays || 90,
                                })})
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: SALARY DETAILS */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <Wallet size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.details.sectionSalary')}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.details.sectionSalaryDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[10px] text-[#857E74] block">
                                {t('ums.employees.details.fields.basicSalary')}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D] mt-1 block">
                                {formatSarCurrency(
                                    employee.salaryDetails?.basicSalary || 0,
                                    isRtl
                                )}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[10px] text-[#857E74] block">
                                {t('ums.employees.details.fields.housingAllowance')}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D] mt-1 block">
                                {formatSarCurrency(
                                    employee.salaryDetails?.housingAllowance || 0,
                                    isRtl
                                )}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[10px] text-[#857E74] block">
                                {t('ums.employees.details.fields.transportAllowance')}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D] mt-1 block">
                                {formatSarCurrency(
                                    employee.salaryDetails?.transportationAllowance || 0,
                                    isRtl
                                )}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[10px] text-[#857E74] block">
                                {t('ums.employees.details.fields.otherAllowances')}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D] mt-1 block">
                                {formatSarCurrency(
                                    employee.salaryDetails?.otherAllowances || 0,
                                    isRtl
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-[#265938] block">
                                {t('ums.employees.details.fields.grossSalary')}
                            </span>
                            <span className="text-[11px] text-[#265938]/80">
                                {t('ums.employees.details.fields.currencySar')}
                            </span>
                        </div>
                        <span className="text-lg font-mono font-bold text-[#265938]">
                            {formatSarCurrency(
                                employee.salaryDetails?.grossSalary || 0,
                                isRtl
                            )}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] flex items-center gap-1">
                                <Landmark size={11} />
                                {t('ums.employees.details.fields.bankName')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {bankAddon
                                    ? isRtl
                                        ? bankAddon.nameAr
                                        : bankAddon.nameEn
                                    : employee.bankName || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.iban')}
                            </span>
                            <span
                                className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block truncate"
                                dir="ltr"
                            >
                                {employee.iban || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.accountNumber')}
                            </span>
                            <span
                                className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block"
                                dir="ltr"
                            >
                                {employee.accountNumber || notProvidedText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: DOCUMENTS & IQAMA */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <FileText size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.details.sectionDocuments')}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.details.sectionDocumentsDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.iqamaNumber')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.iqamaNumber || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.iqamaExpiry')} &{' '}
                                {t('ums.employees.details.fields.iqamaCompliance')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-semibold text-[#0D0D0D]">
                                    {employee.iqamaExpiryDate || notProvidedText}
                                </span>
                                <span
                                    className={`font-semibold ${
                                        iqamaStatus === 'Valid'
                                            ? 'text-[#265938]'
                                            : iqamaStatus === 'Warning'
                                            ? 'text-[#C28E3A]'
                                            : 'text-[#DC2626]'
                                    }`}
                                >
                                    · {t(`ums.employees.iqamaStatuses.${iqamaStatus}`)}
                                </span>
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.passportNumber')} /{' '}
                                {t('ums.employees.details.fields.passportExpiry')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.passportNumber || notProvidedText} ·{' '}
                                {employee.passportExpiry || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.contractNumber')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.contractNumber || notProvidedText}
                                {employee.contractEndDate
                                    ? ` (${employee.contractEndDate})`
                                    : ''}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.gosiNumber')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.gosiSubscriptionNumber || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.healthPolicy')} /{' '}
                                {t('ums.employees.details.fields.healthExpiry')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.healthInsurancePolicy || notProvidedText} ·{' '}
                                {employee.healthInsuranceExpiry || notProvidedText}
                            </span>
                        </div>
                    </div>

                    {attachedDocumentsList.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E0D8] space-y-2">
                            <span className="text-[11px] font-semibold text-[#45413C] flex items-center gap-1">
                                <Paperclip size={11} />
                                {t('ums.employees.wizard.documents.attachmentLabel')} (
                                {attachedDocumentsList.length})
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {attachedDocumentsList.map(([category, doc]) => (
                                    <div
                                        key={`${category}-${doc.fileName}`}
                                        className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-2 text-xs"
                                    >
                                        <div className="truncate">
                                            <span className="font-semibold text-[#0D0D0D] block truncate">
                                                {doc.fileName}
                                            </span>
                                            <span className="text-[10px] font-mono text-[#6E6862]">
                                                {category} ·{' '}
                                                {Math.max(1, Math.round(doc.fileSize / 1024))} KB
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#265938] shrink-0">
                                            {doc.uploadedAt.slice(0, 10)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 5: DEPENDENTS */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                <HeartHandshake size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.details.sectionDependents')} (
                                    {employee.dependents.length})
                                </h3>
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('ums.employees.details.sectionDependentsDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {employee.dependents.length === 0 ? (
                        <div className="p-6 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center space-y-1">
                            <p className="text-xs font-semibold text-[#45413C]">
                                {t('ums.employees.details.fields.noDependentsTitle')}
                            </p>
                            <p className="text-[11px] text-[#857E74]">
                                {t('ums.employees.details.fields.noDependentsDesc')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {employee.dependents.map((dep) => (
                                <div
                                    key={dep.id}
                                    className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                    <div>
                                        <span className="font-bold text-[#0D0D0D] block">
                                            {isRtl ? dep.nameAr : dep.nameEn}
                                        </span>
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t(
                                                `ums.employees.relationships.${dep.relationship}`
                                            )}{' '}
                                            · {dep.dob} · {dep.nationalIdOrIqama}
                                        </span>
                                    </div>
                                    <span
                                        className={`text-[11px] font-semibold ${
                                            dep.insuranceIncluded
                                                ? 'text-[#265938]'
                                                : 'text-[#857E74]'
                                        }`}
                                    >
                                        {dep.insuranceIncluded
                                            ? t('ums.employees.details.fields.insured')
                                            : t('ums.employees.details.fields.notInsured')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECTION 6: ACCOUNT & INVITATION STATUS */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.details.sectionAccount')}
                                </h3>
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('ums.employees.details.sectionAccountDesc')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSendInvitation}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer shrink-0"
                        >
                            <Send size={12} />
                            <span>
                                {invitationStatus === 'Not Sent'
                                    ? t('ums.employees.actions.sendInvitation')
                                    : t('ums.employees.actions.resendInvitation')}
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.accountStatus')}
                            </span>
                            <span className="font-bold text-[#0D0D0D] mt-0.5 flex items-center gap-1.5">
                                <CheckCircle2
                                    size={13}
                                    className={
                                        employee.status === 'Active'
                                            ? 'text-[#265938]'
                                            : 'text-[#C28E3A]'
                                    }
                                />
                                {t(`ums.employees.statuses.${employee.status}`)}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.invitationStatus')}
                            </span>
                            <span
                                className={`font-bold mt-0.5 block ${
                                    invitationStatus === 'Accepted'
                                        ? 'text-[#265938]'
                                        : invitationStatus === 'Pending'
                                        ? 'text-[#C28E3A]'
                                        : 'text-[#6E6862]'
                                }`}
                            >
                                {t(
                                    `ums.employees.invitationStatuses.${invitationStatus}`
                                )}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.securityGroup')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {securityGroup
                                    ? `${isRtl ? securityGroup.nameAr : securityGroup.nameEn} (${securityGroup.code})`
                                    : notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.invitedAt')} /{' '}
                                {t('ums.employees.details.fields.lastLoginAt')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.invitedAt || notProvidedText} ·{' '}
                                {employee.lastLoginAt || notProvidedText}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.createdBy')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.createdBy || 'Karim Wagdi'}
                            </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#857E74] block">
                                {t('ums.employees.details.fields.createdAt')} /{' '}
                                {t('ums.employees.details.fields.updatedAt')}
                            </span>
                            <span className="font-mono font-semibold text-[#0D0D0D] mt-0.5 block">
                                {employee.createdAt} · {employee.updatedAt}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 7: EMPLOYEE AUDIT TRAIL & LIFECYCLE HISTORY */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                            <History size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D]">
                                {t('ums.employees.auditHistory.title')}
                            </h3>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.auditHistory.subtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/ums/audit-trail')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer shrink-0"
                    >
                        <History size={12} />
                        <span>{t('ums.employees.auditHistory.viewFullAudit')}</span>
                    </button>
                </div>

                {employeeAuditEvents.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#6E6862]">
                        {t('ums.employees.auditHistory.noEvents')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {employeeAuditEvents.map((ev) => (
                            <div
                                key={ev.id}
                                className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-[#2D3F2C]">
                                            {ev.action}
                                        </span>
                                        <span className="text-[#0D0D0D] font-semibold">
                                            {isRtl ? ev.detailsAr : ev.detailsEn}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-[#6E6862]">
                                        {ev.actorName} ({ev.actorEmail})
                                    </div>
                                </div>
                                <span
                                    className="text-[11px] font-mono text-[#857E74] shrink-0"
                                    dir="ltr"
                                >
                                    {ev.timestamp.replace('T', ' ').slice(0, 19)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UmsEmployeesPage;
