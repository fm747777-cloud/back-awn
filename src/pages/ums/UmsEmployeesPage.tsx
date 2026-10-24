import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
    Users,
    UserCheck,
    UserX,
    FileEdit,
    CalendarPlus,
    Clock,
    MailCheck,
    MailWarning,
    RotateCcw,
    Eye,
    Pencil,
    Trash2,
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
import { DataTable } from '../../components/DataTable';
import { umsApi, userApi } from '../../api/api';
// import { EmployeeForm } from './UmsEmployeeWizardPage';
import EmployeeForm, { EmployeeFormMode } from '../../components/ums/EmployeeForm';

type EmployeeStatus = 'Active' | 'Inactive' | 'Draft';
type ContractType = 'Permanent' | 'Fixed Term' | 'Probation' | 'Seasonal' | 'Remote';
type ApiEntity = { id: string; name?: string; description?: string; codeName?: string; status?: string;[key: string]: any };
type DepartmentRecord = ApiEntity & { nameEn: string; nameAr: string; code: string };
type DesignationRecord = ApiEntity & { titleEn: string; titleAr: string; code: string };
type BranchRecord = ApiEntity & { nameEn: string; nameAr: string; cityEn: string; cityAr: string; code: string };
type RoleRecord = ApiEntity & { nameEn: string; nameAr: string; code: string; securityGroupId: string };
type SecurityGroupRecord = ApiEntity & { nameEn: string; nameAr: string; code: string };
type CustomAddonRecord = ApiEntity & { nameEn: string; nameAr: string; code: string; type: string };
type EmployeeRecord = { id: string; codeName?: string; email?: string; personal_email?: string; phone_number?: string; isActive?: boolean; branch?: ApiEntity | null; role?: ApiEntity | null; securityGroup?: ApiEntity | null; userAttach?: Record<string, any> | null; employeeContract?: Record<string, any> | null;[key: string]: any };

const UMS_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const extractItems = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const extractCount = (response: any): number => Number(response?.count ?? response?.totalItems ?? response?.total ?? response?.data?.count ?? extractItems(response).length);
const extractOne = (response: any): any => response?.data?.data ?? response?.data ?? response;

const entityName = (entity: any): string => entity?.name ?? entity?.title ?? entity?.nameEn ?? entity?.nameAr ?? '';

const fullName = (attach: any, language: 'en' | 'ar'): string => {
    const fields = language === 'ar' ? [attach?.first_name_Ar, attach?.secend_name_Ar, attach?.third_name_Ar, attach?.last_name_Ar] : [attach?.first_name_En, attach?.secend_name_En, attach?.third_name_En, attach?.last_name_En];
    return fields.filter(Boolean).join(' ').trim();
};

const computeEmployeeProfileCompletion = (employee: EmployeeRecord) => {
    const attach = employee.userAttach;
    const contract = employee.employeeContract;
    const fields = [
        { value: fullName(attach, 'en') || fullName(attach, 'ar'), en: 'Employee name', ar: 'اسم الموظف' },
        { value: employee.email, en: 'Work email', ar: 'البريد الوظيفي' },
        { value: employee.phone_number, en: 'Phone number', ar: 'رقم الهاتف' },
        { value: contract?.department?.id, en: 'Department', ar: 'القسم' },
        { value: contract?.designation?.id, en: 'Designation', ar: 'المسمى الوظيفي' },
        { value: employee.role?.id, en: 'Role', ar: 'الدور' },
        { value: contract?.joining_date, en: 'Joining date', ar: 'تاريخ الانضمام' },
        { value: contract?.contract_type, en: 'Contract type', ar: 'نوع العقد' },
        { value: contract?.job_title, en: 'Job title', ar: 'الوظيفة' },
        { value: attach?.nationality, en: 'Nationality', ar: 'الجنسية' },
        { value: contract?.iqama_ID, en: 'Iqama number', ar: 'رقم الإقامة' },
        { value: contract?.bank_name, en: 'Bank details', ar: 'بيانات البنك' },
    ];
    const completedCount = fields.filter((field) => Boolean(field.value)).length;
    const missing = fields.filter((field) => !field.value);
    return { completedCount, totalCount: fields.length, percentage: Math.round((completedCount / fields.length) * 100), missingFieldsEn: missing.map((field) => field.en), missingFieldsAr: missing.map((field) => field.ar) };
};

const computeEmployeeInvitationStatus = (employee: EmployeeRecord): 'Not Sent' | 'Pending' | 'Accepted' => employee.invitationStatus ?? 'Not Sent';

const computeIqamaStatus = (expiryDate?: string): 'Valid' | 'Warning' | 'Expired' | 'Missing' => {
    if (!expiryDate) return 'Missing';
    const expiry = new Date(expiryDate).getTime();
    const now = Date.now();
    if (Number.isNaN(expiry)) return 'Missing';
    if (expiry < now) return 'Expired';
    return expiry - now <= 90 * 24 * 60 * 60 * 1000 ? 'Warning' : 'Valid';
};

const computeEmployeeDirectoryKpis = (employees: EmployeeRecord[]) => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    return {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((item) => item.isActive !== false).length,
        inactiveEmployees: employees.filter((item) => item.isActive === false).length,
        draftEmployees: 0,
        joinedThisMonth: employees.filter((item) => String(item.employeeContract?.joining_date || '').startsWith(monthPrefix)).length,
        underProbation: employees.filter((item) => Boolean(item.employeeContract?.probation_period)).length,
        pendingInvitations: employees.filter((item) => computeEmployeeInvitationStatus(item) === 'Pending').length,
        invitedEmployees: employees.filter((item) => computeEmployeeInvitationStatus(item) !== 'Not Sent').length,
    };
};


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
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Search & Debounced Search State
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);

    // Filter State
    const [statusFilter, setStatusFilter] = useState<'ALL' | EmployeeStatus>('ALL');
    const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
    const [designationFilter, setDesignationFilter] = useState<string>('ALL');
    const [branchFilter, setBranchFilter] = useState<string>('ALL');
    const [contractTypeFilter, setContractTypeFilter] = useState<'ALL' | ContractType>('ALL');
    const [probationFilter, setProbationFilter] = useState<'ALL' | 'UNDER_PROBATION' | 'CONFIRMED'>('ALL');

    // Pagination & Selection State
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    // Deletion Dialog State
    const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRecord | null>(null);
    const [employeeForm, setEmployeeForm] = useState<{ isOpen: boolean; mode: EmployeeFormMode; employee: EmployeeRecord | null }>({ isOpen: false, mode: 'create', employee: null });

    const openCreateEmployeeForm = useCallback(() => setEmployeeForm({ isOpen: true, mode: 'create', employee: null }), []);
    const openViewEmployeeForm = useCallback((employee: EmployeeRecord) => setEmployeeForm({ isOpen: true, mode: 'view', employee }), []);
    const openUpdateEmployeeForm = useCallback((employee: EmployeeRecord) => setEmployeeForm({ isOpen: true, mode: 'update', employee }), []);
    const closeEmployeeForm = useCallback(() => setEmployeeForm({ isOpen: false, mode: 'create', employee: null }), []);

    const employeeQueryParams = useMemo(() => ({
        page: currentPage,
        limit: pageSize,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(departmentFilter !== 'ALL' && { department_id: departmentFilter }),
        ...(designationFilter !== 'ALL' && { designation_id: designationFilter }),
        ...(branchFilter !== 'ALL' && { branch_id: branchFilter }),
        ...(contractTypeFilter !== 'ALL' && { contract_type: contractTypeFilter }),
        ...(probationFilter !== 'ALL' && { probation: probationFilter }),
    }), [currentPage, pageSize, debouncedSearch, statusFilter, departmentFilter, designationFilter, branchFilter, contractTypeFilter, probationFilter]);

    const { data: employeesResponse, isLoading: isEmployeesLoading, isFetching: isEmployeesFetching } = useQuery({
        queryKey: ['ums', 'employees', employeeQueryParams],
        queryFn: () => userApi.getEmployees(employeeQueryParams),
        placeholderData: (previousData) => previousData,
    });

    const { data: departmentsResponse } = useQuery({ queryKey: ['ums', 'departments', 'options'], queryFn: () => umsApi.getDepartments({ page: 1, limit: 1000 }) });
    const { data: designationsResponse } = useQuery({ queryKey: ['ums', 'designations', 'options'], queryFn: () => umsApi.getDesignations({ page: 1, limit: 1000 }) });
    const { data: branchesResponse } = useQuery({ queryKey: ['ums', 'branches', 'options'], queryFn: () => umsApi.getBranchs({ page: 1, limit: 1000 }) });

    const employeesCount = extractCount(employeesResponse);
    const employees = useMemo(() => extractItems(employeesResponse) as EmployeeRecord[], [employeesResponse]);
    const departments = useMemo(() => extractItems(departmentsResponse), [departmentsResponse]);
    const designations = useMemo(() => extractItems(designationsResponse), [designationsResponse]);
    const branches = useMemo(() => extractItems(branchesResponse), [branchesResponse]);

    // Debounce search input (250ms)
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchInput);
            setCurrentPage(1);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    // Profile completion map for all employees
    const completionByEmployeeId = useMemo(() => {
        const map: Record<string, ReturnType<typeof computeEmployeeProfileCompletion>> = {};
        for (const emp of employees) {
            map[emp.id] = computeEmployeeProfileCompletion(emp);
        }
        return map;
    }, [employees]);

    // Dynamic 8 KPI Cards derived from live employee dataset
    const kpis = useMemo(() => ({ ...computeEmployeeDirectoryKpis(employees), totalEmployees: employeesCount }), [employees, employeesCount]);

    // Filtered Employees
    const filteredEmployees = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();

        return employees.filter((emp) => {
            const status: EmployeeStatus = emp.isActive === false ? 'Inactive' : 'Active';
            const attach = emp.userAttach;
            const contract = emp.employeeContract;
            const nameEn = fullName(attach, 'en');
            const nameAr = fullName(attach, 'ar');

            if (statusFilter !== 'ALL' && status !== statusFilter) {
                return false;
            }
            if (departmentFilter !== 'ALL' && contract?.department?.id !== departmentFilter) {
                return false;
            }
            if (designationFilter !== 'ALL' && contract?.designation?.id !== designationFilter) {
                return false;
            }
            if (branchFilter !== 'ALL' && emp.branch?.id !== branchFilter) {
                return false;
            }
            if (contractTypeFilter !== 'ALL' && contract?.contract_type !== contractTypeFilter) {
                return false;
            }
            if (probationFilter !== 'ALL') {
                const isProbation = Boolean(contract?.probation_period) || contract?.contract_type === 'Probation';
                if (probationFilter === 'UNDER_PROBATION' && !isProbation) return false;
                if (probationFilter === 'CONFIRMED' && isProbation) return false;
            }

            if (!query) return true;

            return (
                String(emp.codeName || '').toLowerCase().includes(query) ||
                nameEn.toLowerCase().includes(query) ||
                nameAr.toLowerCase().includes(query) ||
                String(emp.email || '').toLowerCase().includes(query) ||
                String(emp.personal_email || '').toLowerCase().includes(query) ||
                String(emp.phone_number || '').toLowerCase().includes(query) ||
                entityName(contract?.designation).toLowerCase().includes(query) ||
                entityName(contract?.department).toLowerCase().includes(query) ||
                entityName(emp.branch).toLowerCase().includes(query) ||
                entityName(emp.role).toLowerCase().includes(query) ||
                String(contract?.job_title || '').toLowerCase().includes(query) ||
                String(contract?.job_grade || '').toLowerCase().includes(query) ||
                String(contract?.bank_name || '').toLowerCase().includes(query) ||
                String(attach?.religion || '').toLowerCase().includes(query) ||
                fullName(contract?.reportingTo?.userAttach, 'en').toLowerCase().includes(query) ||
                fullName(contract?.reportingTo?.userAttach, 'ar').toLowerCase().includes(query)
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

    // Server pagination calculation
    const totalPages = Math.max(1, Math.ceil(employeesCount / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedEmployees = filteredEmployees;

    const handleExport = useCallback(() => {
        if (filteredEmployees.length === 0) {
            toast.info(t('ums.employees.feedback.noDataToExport', { defaultValue: 'لا توجد بيانات للتصدير' }));
            return;
        }

        const escapeCsvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const headers = ['Code', 'English Name', 'Arabic Name', 'Work Email', 'Personal Email', 'Phone Number', 'Department', 'Designation', 'Role', 'Branch', 'Job Title', 'Contract Type', 'Joining Date', 'Nationality', 'Status'];
        const rows = filteredEmployees.map((employee) => [
            employee.codeName,
            fullName(employee.userAttach, 'en'),
            fullName(employee.userAttach, 'ar'),
            employee.email,
            employee.personal_email,
            employee.phone_number,
            entityName(employee.employeeContract?.department),
            entityName(employee.employeeContract?.designation),
            entityName(employee.role),
            entityName(employee.branch),
            employee.employeeContract?.job_title,
            employee.employeeContract?.contract_type,
            employee.employeeContract?.joining_date,
            employee.userAttach?.nationality,
            employee.isActive === false ? 'Inactive' : 'Active',
        ]);
        const csvContent = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        downloadLink.href = downloadUrl;
        downloadLink.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);

        toast.success(t('ums.employees.feedback.exported', { count: filteredEmployees.length, defaultValue: `تم تصدير ${filteredEmployees.length} موظف بنجاح` }));
    }, [filteredEmployees, t]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const deleteEmployeeMutation = useMutation({
        mutationFn: (id: string) => userApi.deleteEmployee(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
        },
    });

    const handleConfirmDelete = async () => {
        if (!deletingEmployee) return;

        try {
            await deleteEmployeeMutation.mutateAsync(deletingEmployee.id);
            toast.success(t('ums.employees.feedback.deleted', { name: fullName(deletingEmployee.userAttach, isRtl ? 'ar' : 'en') || deletingEmployee.email, code: deletingEmployee.codeName }));
            setDeletingEmployee(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? error?.message ?? t('common.error', { defaultValue: 'Something went wrong' }));
        }
    };

    // Columns for shared DataTable
    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            {
                accessorKey: 'codeName',
                header: t('ums.employees.table.colCode'),
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <button
                            type="button"
                            onClick={() => openViewEmployeeForm(emp)}
                            className="font-mono font-bold text-[#037F8C] hover:underline cursor-pointer"
                        >
                            {emp.codeName || '—'}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'userAttach',
                header: t('ums.employees.table.colEmployee'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const nameEn = fullName(emp.userAttach, 'en');
                    const nameAr = fullName(emp.userAttach, 'ar');
                    return (
                        <div className="flex items-center gap-3">
                            {emp.userAttach?.profile_picture ? (
                                <img
                                    src={emp.userAttach.profile_picture}
                                    alt={isRtl ? nameAr || nameEn : nameEn || nameAr}
                                    className="w-8 h-8 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-[#037F8C] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                    {getInitials(nameEn, nameAr)}
                                </div>
                            )}
                            <div className="min-w-0">
                                <button
                                    type="button"
                                    onClick={() => openViewEmployeeForm(emp)}
                                    className="font-bold text-[#0D0D0D] hover:text-[#037F8C] transition-colors text-start block truncate cursor-pointer"
                                >
                                    {isRtl ? nameAr || nameEn : nameEn || nameAr}
                                </button>
                                <span className="text-[11px] text-[#6E6862] block truncate">
                                    {isRtl ? nameEn : nameAr} · {emp.userAttach?.nationality || '—'}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'email',
                header: t('ums.employees.table.colEmail'),
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <div className="space-y-0.5">
                            <span
                                className="font-mono text-[#0D0D0D] block truncate max-w-[190px]"
                                dir="ltr"
                            >
                                {emp.email || (
                                    <span className="italic text-[#857E74]">
                                        {t('ums.employees.table.noEmail')}
                                    </span>
                                )}
                            </span>
                            {emp.personal_email && emp.personal_email !== emp.email && (
                                <span
                                    className="text-[11px] text-[#857E74] block truncate max-w-[190px]"
                                    dir="ltr"
                                >
                                    {emp.personal_email}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'employeeContract.designation',
                header: t('ums.employees.table.colDesignation'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const desig = emp.employeeContract?.designation;
                    return desig ? (
                        <div>
                            <span className="font-semibold text-[#0D0D0D] block">
                                {entityName(desig)}
                            </span>
                            <span className="text-[11px] font-mono text-[#857E74]">
                                {desig.codeName || '—'}
                            </span>
                        </div>
                    ) : (
                        <span className="text-[#857E74] italic">
                            {t('ums.employees.table.unassigned')}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'role',
                header: t('ums.employees.table.colRole'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const role = emp.role;
                    const secGroup = emp.securityGroup || role?.securityGroup;
                    return role ? (
                        <div>
                            <span className="font-semibold text-[#037F8C] block">
                                {entityName(role)}
                            </span>
                            {secGroup && (
                                <span className="text-[11px] text-[#6E6862] block truncate max-w-[160px]">
                                    {entityName(secGroup)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[#857E74] italic">
                            {t('ums.employees.table.unassigned')}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'employeeContract.department',
                header: t('ums.employees.table.colDepartment'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const dept = emp.employeeContract?.department;
                    const branch = emp.branch;
                    return dept ? (
                        <div>
                            <span className="font-semibold text-[#0D0D0D] block">
                                {entityName(dept)}
                            </span>
                            {branch && (
                                <span className="text-[11px] text-[#6E6862] block">
                                    {branch.city || entityName(branch)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-[#857E74] italic">
                            {t('ums.employees.table.unassigned')}
                        </span>
                    );
                },
            },
            {
                id: 'completion',
                header: t('ums.employees.table.colCompletion'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const completion =
                        completionByEmployeeId[emp.id] || computeEmployeeProfileCompletion(emp);
                    return (
                        <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono font-bold text-[#0D0D0D]">
                                    {completion.percentage}%
                                </span>
                                <span className="text-[#857E74]">
                                    {t('ums.employees.table.completeFieldsCount', {
                                        completed: completion.completedCount,
                                        total: completion.totalCount,
                                    })}
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
                                            ? 'fill-[#037F8C]'
                                            : completion.percentage >= 75
                                                ? 'fill-[#037F8C]'
                                                : 'fill-[#C28E3A]'
                                    }
                                />
                            </svg>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'isActive',
                header: t('ums.employees.table.colStatus'),
                cell: ({ row }) => {
                    const emp = row.original;
                    const status: EmployeeStatus = emp.isActive === false ? 'Inactive' : 'Active';
                    const isProbation = Boolean(emp.employeeContract?.probation_period) || emp.employeeContract?.contract_type === 'Probation';
                    return (
                        <div className="flex flex-col items-start gap-1">
                            <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${status === 'Active'
                                    ? 'text-[#037F8C] hover:text-[#1B4D3E]'
                                    : status === 'Inactive'
                                        ? 'text-[#C28E3A] hover:text-[#0D0D0D]'
                                        : 'text-[#857E74] hover:text-[#0D0D0D]'
                                    }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${status === 'Active'
                                        ? 'bg-[#037F8C]'
                                        : status === 'Inactive'
                                            ? 'bg-[#C28E3A]'
                                            : 'bg-[#857E74]'
                                        }`}
                                />
                                <span>{t(`ums.employees.statuses.${status}`)}</span>
                            </span>
                            {isProbation && (
                                <span className="text-[10px] font-medium text-[#C28E3A]">
                                    {t('ums.employees.table.probationTag')}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: t('ums.employees.table.colActions'),
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <button
                                type="button"
                                onClick={() => openViewEmployeeForm(emp)}
                                className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                title={t('ums.employees.actions.viewDetails')}
                            >
                                <Eye size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={() => openUpdateEmployeeForm(emp)}
                                className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                title={t('ums.employees.actions.editEmployee')}
                            >
                                <Pencil size={14} />
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
                    );
                },
            },
        ],
        [
            t,
            isRtl,
            openViewEmployeeForm,
            openUpdateEmployeeForm,
            completionByEmployeeId,
        ]
    );

    const filtersPanel = (
        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center p-1 rounded-lg bg-[#EFECE6] border border-[#E5E0D8]">
                    {(['ALL', 'Active', 'Inactive', 'Draft'] as const).map((statusOption) => {
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
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${isActive
                                    ? 'bg-[#037F8C] text-white shadow-2xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
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
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="ALL">{t('ums.employees.filters.allDepartments')}</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {entityName(dept)}
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
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="ALL">{t('ums.employees.filters.allDesignations')}</option>
                        {designations.map((desig) => (
                            <option key={desig.id} value={desig.id}>
                                {entityName(desig)}
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
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="ALL">{t('ums.employees.filters.allBranches')}</option>
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {entityName(branch)}
                                {branch.status === 'Inactive'
                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                    : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

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
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
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
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
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
                            <span className="text-2xl font-bold font-mono text-[#037F8C]">
                                {kpis.activeEmployees}
                            </span>
                            <span className="text-[11px] text-[#037F8C] font-medium">
                                {t('ums.employees.kpis.activeSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
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
                            <span className="text-2xl font-bold font-mono text-[#037F8C]">
                                {kpis.invitedEmployees}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {t('ums.employees.kpis.invitedSub')}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
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
            {/* SHARED DATATABLE WITH SEARCH, FILTERS & PAGINATION                           */}
            {/* ============================================================================ */}
            <DataTable
                columns={columns}
                data={paginatedEmployees}
                count={employeesCount}
                loading={isEmployeesLoading || isEmployeesFetching}
                searchPlaceholder={t('ums.employees.filters.searchPlaceholder')}
                pageIndex={safePage - 1}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setCurrentPage(newPageIndex + 1)}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                }}
                searchValue={searchInput}
                onSearchChange={(val) => setSearchInput(val)}
                onAddNew={openCreateEmployeeForm}
                addNewLabel={t('ums.employees.actions.addEmployee')}
                onExport={handleExport}
                title={t('ums.employees.title')}
                description={t('ums.employees.subtitle')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersPanel}
            />

            {/* ============================================================================ */}
            {/* DELETE CONFIRMATION & DEPENDENCY PROTECTION DIALOG                           */}
            {/* ============================================================================ */}
            {deletingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={20} />
                        </div>
                        <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">{t('ums.employees.deleteModal.title')}</h2>
                        <p className="text-xs text-[#6E6862] text-center mb-4 leading-relaxed">
                            {t('ums.employees.deleteModal.confirmMessage')}
                            <span className="block font-bold text-[#0D0D0D] mt-2">{deletingEmployee.codeName || '—'} — {fullName(deletingEmployee.userAttach, isRtl ? 'ar' : 'en') || deletingEmployee.email || '—'}</span>
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                            <button type="button" onClick={() => setDeletingEmployee(null)} disabled={deleteEmployeeMutation.isPending} className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50">{t('common.cancel', { defaultValue: 'Cancel' })}</button>
                            <button type="button" onClick={handleConfirmDelete} disabled={deleteEmployeeMutation.isPending} className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">{deleteEmployeeMutation.isPending ? t('common.loading', { defaultValue: 'Loading...' }) : t('common.delete', { defaultValue: 'Delete' })}</button>
                        </div>
                    </div>
                </div>
            )}

            <EmployeeForm
                isOpen={employeeForm.isOpen}
                mode={employeeForm.mode}
                employee={employeeForm.employee}
                onClose={closeEmployeeForm}
                onModeChange={(mode) => setEmployeeForm((current) => ({ ...current, mode }))}
                onSuccess={async () => {
                    await queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
                }}
            />
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

    const employeeResponse = null;
    const isEmployeeLoading = false;
    const apiEmployee = useMemo(() => {
        const item = extractOne(employeeResponse);
        return item?.id ? item as EmployeeRecord : null;
    }, [employeeResponse]);
    const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
    const employees = useMemo(() => employee ? [employee] : [], [employee]);
    const departments = useMemo<DepartmentRecord[]>(() => employee?.employeeContract?.department ? [employee.employeeContract.department] : [], [employee]);
    const designations = useMemo<DesignationRecord[]>(() => employee?.employeeContract?.designation ? [employee.employeeContract.designation] : [], [employee]);
    const branches = useMemo<any[]>(() => employee?.branch ? [employee.branch] : [], [employee]);
    const roles = useMemo<any[]>(() => employee?.role ? [employee.role] : [], [employee]);
    const securityGroups = useMemo<SecurityGroupRecord[]>(() => [], []);
    const customAddons = useMemo<CustomAddonRecord[]>(() => [], []);

    useEffect(() => {
        setEmployee(apiEmployee);
    }, [apiEmployee]);

    if (isEmployeeLoading) {
        return <div className="py-16 text-center text-sm text-[#857E74]">{t('common.loading', { defaultValue: 'Loading...' })}</div>;
    }

    if (!employee) {
        return (
            <div className="space-y-6 text-start">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
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
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer"
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
    const employeeAuditEvents: any[] = [];
    const attachedDocumentsList = Object.entries(employee.documentAttachments || {}).filter(
        (entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[1])
    );

    const completion = computeEmployeeProfileCompletion(employee);
    const invitationStatus = computeEmployeeInvitationStatus(employee);
    const iqamaStatus = computeIqamaStatus(employee.iqamaExpiryDate);
    const isProbation =
        Boolean(employee.isUnderProbation) || employee.contractType === 'Probation';
    const notProvidedText = t('ums.employees.details.fields.notProvided');

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
                                className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
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
                        onClick={() => navigate(`/ums/employees/${employee.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors shrink-0 cursor-pointer"
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
                        <div className="w-14 h-14 rounded-full bg-[#037F8C] text-white flex items-center justify-center font-bold text-base shrink-0">
                            {getInitials(employee.nameEn, employee.nameAr)}
                        </div>
                    )}
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {employee.nameEn}
                            </h2>
                            <span className="text-sm font-semibold text-[#037F8C]" dir="rtl">
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
                        <span className="font-mono font-bold text-[#037F8C]">
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
                                    ? 'fill-[#037F8C]'
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
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                                    onClick={() => navigate(`/ums/employees/${manager.id}/view`)}
                                    className="font-semibold text-[#037F8C] hover:underline mt-0.5 block cursor-pointer"
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
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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

                    <div className="p-3.5 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-[#037F8C] block">
                                {t('ums.employees.details.fields.grossSalary')}
                            </span>
                            <span className="text-[11px] text-[#037F8C]/80">
                                {t('ums.employees.details.fields.currencySar')}
                            </span>
                        </div>
                        <span className="text-lg font-mono font-bold text-[#037F8C]">
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
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                                    className={`font-semibold ${iqamaStatus === 'Valid'
                                        ? 'text-[#037F8C]'
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
                </div>

                {/* SECTION 5: DEPENDENTS */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                                        className={`text-[11px] font-semibold ${dep.insuranceIncluded
                                            ? 'text-[#037F8C]'
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
                            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                                            ? 'text-[#037F8C]'
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
                                className={`font-bold mt-0.5 block ${invitationStatus === 'Accepted'
                                    ? 'text-[#037F8C]'
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
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
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
                                        <span className="font-mono font-bold text-[#037F8C]">
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