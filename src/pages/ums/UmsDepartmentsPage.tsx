import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    CheckCircle2,
    XCircle,
    Users,
    Search,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Power,
    ChevronLeft,
    ChevronRight,
    User,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadDepartments,
    saveDepartments,
    loadEmployees,
    loadDesignations,
    generateNextDepartmentCode,
    checkDepartmentDeletionEligibility,
    recordUmsAuditEvent,
    UMS_PAGE_SIZE_OPTIONS,
    type DepartmentRecord,
    type EmployeeRecord,
} from './umsMockData';

interface DepartmentFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    headEmployeeId: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

const DEFAULT_FORM: DepartmentFormData = {
    code: '',
    nameEn: '',
    nameAr: '',
    headEmployeeId: '',
    descriptionEn: '',
    descriptionAr: '',
    status: 'Active',
};

export const UmsDepartmentsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Data State
    const [departments, setDepartments] = useState<DepartmentRecord[]>(() => loadDepartments());
    const [employees] = useState<EmployeeRecord[]>(() => loadEmployees());
    const designations = useMemo(() => loadDesignations(), []);

    // Filters & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modals & Drawers State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentRecord | null>(null);
    const [viewingDepartment, setViewingDepartment] = useState<DepartmentRecord | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<DepartmentRecord | null>(null);
    const [formData, setFormData] = useState<DepartmentFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Live count of employees assigned to each department
    const employeeCountByDept = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const emp of employees) {
            if (emp.departmentId) {
                counts[emp.departmentId] = (counts[emp.departmentId] || 0) + 1;
            }
        }
        return counts;
    }, [employees]);

    // Active employees available for Department Head selection
    const eligibleHeads = useMemo(() => {
        return employees.filter((e) => e.status === 'Active');
    }, [employees]);

    // Sync departments state with localStorage
    const persistDepartments = (updated: DepartmentRecord[]) => {
        setDepartments(updated);
        saveDepartments(updated);
    };

    // Summary KPIs
    const kpis = useMemo(() => {
        const total = departments.length;
        const active = departments.filter((d) => d.status === 'Active').length;
        const inactive = total - active;
        const totalAssignedStaff = departments.reduce(
            (acc, d) => acc + (employeeCountByDept[d.id] || 0),
            0
        );
        return { total, active, inactive, totalAssignedStaff };
    }, [departments, employeeCountByDept]);

    // Filtered & Paginated records
    const filteredDepartments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return departments.filter((dept) => {
            if (statusFilter !== 'ALL' && dept.status !== statusFilter) {
                return false;
            }
            if (!query) return true;
            return (
                dept.code.toLowerCase().includes(query) ||
                dept.nameEn.toLowerCase().includes(query) ||
                dept.nameAr.toLowerCase().includes(query) ||
                (dept.headEmployeeName && dept.headEmployeeName.toLowerCase().includes(query)) ||
                dept.descriptionEn.toLowerCase().includes(query) ||
                dept.descriptionAr.toLowerCase().includes(query)
            );
        });
    }, [departments, searchQuery, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
    const paginatedDepartments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDepartments.slice(start, start + pageSize);
    }, [filteredDepartments, currentPage, pageSize]);

    // Select-all logic
    const isAllSelected =
        paginatedDepartments.length > 0 &&
        paginatedDepartments.every((d) => selectedIds.includes(d.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            const pageIds = new Set(paginatedDepartments.map((d) => d.id));
            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
        } else {
            const pageIds = paginatedDepartments.map((d) => d.id);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Open Create Drawer
    const handleOpenCreate = () => {
        setFormData({
            ...DEFAULT_FORM,
            code: generateNextDepartmentCode(departments),
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Drawer
    const handleOpenEdit = (dept: DepartmentRecord) => {
        setEditingDepartment(dept);
        setFormData({
            code: dept.code,
            nameEn: dept.nameEn,
            nameAr: dept.nameAr,
            headEmployeeId: dept.headEmployeeId || '',
            descriptionEn: dept.descriptionEn || '',
            descriptionAr: dept.descriptionAr || '',
            status: dept.status,
        });
        setFormErrors({});
    };

    // Form Validation
    const validateForm = (isEditing = false, editId?: string) => {
        const errors: Record<string, string> = {};
        if (!formData.nameEn.trim()) {
            errors.nameEn = t('ums.departments.validation.nameEnRequired', {
                defaultValue: 'English department name is required.',
            });
        }
        if (!formData.nameAr.trim()) {
            errors.nameAr = t('ums.departments.validation.nameArRequired', {
                defaultValue: 'Arabic department name is required.',
            });
        }

        // Duplicate name check
        const lowerEn = formData.nameEn.trim().toLowerCase();
        const lowerAr = formData.nameAr.trim().toLowerCase();
        const duplicate = departments.find(
            (d) =>
                (!isEditing || d.id !== editId) &&
                (d.nameEn.toLowerCase() === lowerEn || d.nameAr.toLowerCase() === lowerAr)
        );
        if (duplicate) {
            errors.nameEn = t('ums.departments.validation.duplicateName', {
                defaultValue: 'A department with this name already exists.',
            });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const headEmp = employees.find((emp) => emp.id === formData.headEmployeeId);
        const newDept: DepartmentRecord = {
            id: `dep-${Date.now()}`,
            code: formData.code.trim() || generateNextDepartmentCode(departments),
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            headEmployeeId: headEmp ? headEmp.id : undefined,
            headEmployeeName: headEmp ? (isRtl ? headEmp.nameAr : headEmp.nameEn) : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
        };

        const updated = [newDept, ...departments];
        persistDepartments(updated);

        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Department',
            resourceId: newDept.id,
            resourceName: newDept.nameEn,
            detailsEn: `Created department ${newDept.nameEn} (${newDept.code}) with head: ${newDept.headEmployeeName || 'None'}.`,
            detailsAr: `إنشاء قسم جديد ${newDept.nameAr} (${newDept.code}) برئاسة: ${newDept.headEmployeeName || 'غير محدد'}.`,
        });

        toast.success(
            t('ums.departments.feedback.created', {
                defaultValue: `Department ${newDept.nameEn} created successfully.`,
                name: newDept.nameEn,
            })
        );
        setIsCreateOpen(false);
    };

    // Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDepartment) return;
        if (!validateForm(true, editingDepartment.id)) return;

        const headEmp = employees.find((emp) => emp.id === formData.headEmployeeId);
        const updatedDept: DepartmentRecord = {
            ...editingDepartment,
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            headEmployeeId: headEmp ? headEmp.id : undefined,
            headEmployeeName: headEmp ? (isRtl ? headEmp.nameAr : headEmp.nameEn) : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: employeeCountByDept[editingDepartment.id] || 0,
        };

        const updated = departments.map((d) => (d.id === editingDepartment.id ? updatedDept : d));
        persistDepartments(updated);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Department',
            resourceId: updatedDept.id,
            resourceName: updatedDept.nameEn,
            detailsEn: `Updated department details for ${updatedDept.nameEn} (${updatedDept.code}).`,
            detailsAr: `تحديث بيانات القسم ${updatedDept.nameAr} (${updatedDept.code}).`,
        });

        toast.success(
            t('ums.departments.feedback.updated', {
                defaultValue: `Department ${updatedDept.nameEn} updated successfully.`,
                name: updatedDept.nameEn,
            })
        );
        setEditingDepartment(null);
    };

    // Toggle Status (Active / Inactive)
    const handleToggleStatus = (dept: DepartmentRecord) => {
        const nextStatus: 'Active' | 'Inactive' = dept.status === 'Active' ? 'Inactive' : 'Active';
        const updated = departments.map((d) =>
            d.id === dept.id ? { ...d, status: nextStatus } : d
        );
        persistDepartments(updated);

        recordUmsAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Department',
            resourceId: dept.id,
            resourceName: dept.nameEn,
            detailsEn: `Changed status of ${dept.nameEn} to ${nextStatus}.`,
            detailsAr: `تغيير حالة القسم ${dept.nameAr} إلى ${nextStatus === 'Active' ? 'مفعّل' : 'معطّل'}.`,
        });

        toast.info(
            t('ums.departments.feedback.statusChanged', {
                defaultValue: `Department status changed to ${nextStatus}.`,
                status: nextStatus,
            })
        );
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingDepartment) return;

        const eligibility = checkDepartmentDeletionEligibility(
            deletingDepartment.id,
            employees,
            designations
        );

        if (!eligibility.canDelete) {
            toast.error(isRtl ? eligibility.reasonAr : eligibility.reasonEn);
            setDeletingDepartment(null);
            return;
        }

        const updated = departments.filter((d) => d.id !== deletingDepartment.id);
        persistDepartments(updated);

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Department',
            resourceId: deletingDepartment.id,
            resourceName: deletingDepartment.nameEn,
            detailsEn: `Permanently removed department ${deletingDepartment.nameEn} (${deletingDepartment.code}).`,
            detailsAr: `حذف القسم ${deletingDepartment.nameAr} (${deletingDepartment.code}) نهائياً.`,
        });

        toast.success(
            t('ums.departments.feedback.deleted', {
                defaultValue: `Department ${deletingDepartment.nameEn} deleted successfully.`,
                name: deletingDepartment.nameEn,
            })
        );
        setDeletingDepartment(null);
    };

    // Export to CSV
    const handleExportCsv = () => {
        if (departments.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = [
            'Department Code',
            'Name (English)',
            'Name (Arabic)',
            'Department Head',
            'Assigned Employees',
            'Status',
            'Created Date',
            'Description (EN)',
        ];

        const rows = departments.map((d) => [
            d.code,
            `"${d.nameEn.replace(/"/g, '""')}"`,
            `"${d.nameAr.replace(/"/g, '""')}"`,
            `"${(d.headEmployeeName || 'N/A').replace(/"/g, '""')}"`,
            employeeCountByDept[d.id] || 0,
            d.status,
            d.createdAt,
            `"${(d.descriptionEn || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AWN_Departments_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Department',
            resourceId: 'ALL',
            resourceName: 'Departments Catalog',
            detailsEn: `Exported ${departments.length} department records to CSV.`,
            detailsAr: `تصدير ${departments.length} سجل من سجلات الأقسام إلى ملف CSV.`,
        });

        toast.success(t('ums.departments.feedback.exported', { defaultValue: 'Departments exported successfully.' }));
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {t('ums.departments.title', { defaultValue: 'Departments Master' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] dark:bg-[#1C2521] text-[#2D3F2C] dark:text-[#84C799] border border-[#E5E0D8] dark:border-[#2A3630]"
                            dir="ltr"
                        >
                            DEP-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] dark:text-[#A8A298] mt-1 font-normal">
                        {t('ums.departments.subtitle', {
                            defaultValue:
                                'Organizational departments, assigned leadership, and workforce allocations.',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] border border-[#E5E0D8] dark:border-[#2A3630] text-xs font-semibold text-[#45413C] dark:text-[#F3F0EA] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('common.export', { defaultValue: 'Export' })}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] dark:bg-[#265938] hover:bg-[#223121] dark:hover:bg-[#1e462c] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>{t('ums.departments.addDepartment', { defaultValue: 'Add Department' })}</span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.departments.kpi.total', { defaultValue: 'Total Departments' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#2D3F2C] dark:text-[#84C799]">
                            <Building2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.departments.kpi.units', { defaultValue: 'active divisions' })}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.departments.kpi.active', { defaultValue: 'Active Divisions' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] dark:bg-[#265938]/20 border border-[#265938]/25 flex items-center justify-center text-[#265938] dark:text-[#84C799]">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#265938] dark:text-[#84C799]">
                            {kpis.active}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% operational
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.departments.kpi.inactive', { defaultValue: 'Inactive Divisions' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] dark:bg-[#7F1D1D]/20 border border-[#A63A3A]/25 flex items-center justify-center text-[#A63A3A]">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#6E6862] dark:text-[#A8A298]">
                            {kpis.inactive}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.departments.kpi.suspended', { defaultValue: 'deactivated' })}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.departments.kpi.workforce', { defaultValue: 'Assigned Workforce' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#2D3F2C] dark:text-[#84C799]">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {kpis.totalAssignedStaff}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.departments.kpi.employeesTotal', { defaultValue: 'total headcount' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute start-3 top-1/2 -translate-y-1/2 text-[#857E74]"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('ums.departments.searchPlaceholder', {
                                defaultValue: 'Search by department name, code, leader, or description...',
                            })}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] dark:focus:ring-[#84C799]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D]"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as any);
                                setCurrentPage(1);
                            }}
                            aria-label={t('common.status', { defaultValue: 'Status' })}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">{t('common.allStatus', { defaultValue: 'All Statuses' })}</option>
                            <option value="Active">{t('common.active', { defaultValue: 'Active' })}</option>
                            <option value="Inactive">{t('common.inactive', { defaultValue: 'Inactive' })}</option>
                        </select>

                        {(searchQuery || statusFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                    setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] rounded-lg transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.resetFilters', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E0D8] dark:border-[#2A3630] bg-[#FAF8F5] dark:bg-[#1C2521] text-[#6E6862] dark:text-[#A8A298] font-semibold select-none">
                                <th className="p-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        aria-label="Select all departments"
                                        className="rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 text-start">{t('ums.departments.colCode', { defaultValue: 'Code' })}</th>
                                <th className="p-3 text-start">{t('ums.departments.colName', { defaultValue: 'Department Name' })}</th>
                                <th className="p-3 text-start">{t('ums.departments.colHead', { defaultValue: 'Department Head' })}</th>
                                <th className="p-3 text-center">{t('ums.departments.colStaff', { defaultValue: 'Headcount' })}</th>
                                <th className="p-3 text-center">{t('common.status', { defaultValue: 'Status' })}</th>
                                <th className="p-3 text-end">{t('common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] dark:divide-[#2A3630]">
                            {paginatedDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-[#857E74]">
                                        <Building2 size={28} className="mx-auto mb-2 text-[#C9C2B8]" />
                                        <p className="font-medium text-sm">
                                            {t('common.noRecordsMatch', { defaultValue: 'No records found matching criteria.' })}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedDepartments.map((dept) => {
                                    const assignedCount = employeeCountByDept[dept.id] || 0;
                                    const isSelected = selectedIds.includes(dept.id);

                                    return (
                                        <tr
                                            key={dept.id}
                                            className={`transition-colors hover:bg-[#FAF8F5]/80 dark:hover:bg-[#232E29]/50 ${
                                                isSelected ? 'bg-[#FAF8F5] dark:bg-[#1C2521]' : ''
                                            }`}
                                        >
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(dept.id)}
                                                    aria-label={`Select department ${dept.nameEn}`}
                                                    className="rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-3 font-mono font-semibold text-[#2D3F2C] dark:text-[#84C799] whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630]" dir="ltr">
                                                    {dept.code}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                                    {isRtl ? dept.nameAr : dept.nameEn}
                                                </div>
                                                <div className="text-[11px] text-[#857E74] font-normal">
                                                    {isRtl ? dept.nameEn : dept.nameAr}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {dept.headEmployeeName ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#2D3F2C] dark:text-[#84C799]">
                                                        <User size={12} className="text-[#857E74]" />
                                                        <span className="font-medium">{dept.headEmployeeName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[#857E74] italic">
                                                        {t('common.notAssigned', { defaultValue: 'Not Assigned' })}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] dark:bg-[#1C2521] text-[#2D3F2C] dark:text-[#84C799] border border-[#E5E0D8] dark:border-[#2A3630]">
                                                    <Users size={11} />
                                                    <span>{assignedCount}</span>
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                        dept.status === 'Active'
                                                            ? 'bg-[#EAF3EC] dark:bg-[#265938]/30 text-[#265938] dark:text-[#84C799] border-[#265938]/25'
                                                            : 'bg-[#F4F1EA] dark:bg-[#1C2521] text-[#6E6862] dark:text-[#A8A298] border-[#E5E0D8] dark:border-[#2A3630]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            dept.status === 'Active' ? 'bg-[#265938] dark:bg-[#84C799]' : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    {dept.status === 'Active'
                                                        ? t('common.active', { defaultValue: 'Active' })
                                                        : t('common.inactive', { defaultValue: 'Inactive' })}
                                                </span>
                                            </td>
                                            <td className="p-3 text-end whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingDepartment(dept)}
                                                        title={t('common.view', { defaultValue: 'View Details' })}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(dept)}
                                                        title={t('common.edit', { defaultValue: 'Edit' })}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(dept)}
                                                        title={dept.status === 'Active' ? t('common.deactivate') : t('common.activate')}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingDepartment(dept)}
                                                        title={t('common.delete', { defaultValue: 'Delete' })}
                                                        className="p-1.5 rounded-md text-[#A63A3A] hover:bg-[#FDF2F2] dark:hover:bg-[#7F1D1D]/30 transition-colors"
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

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E0D8] dark:border-[#2A3630] bg-[#FAF8F5] dark:bg-[#1C2521] text-xs text-[#6E6862] dark:text-[#A8A298]">
                    <div className="flex items-center gap-2">
                        <span>{t('pagination.show', { defaultValue: 'Show' })}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label={t('pagination.chooseEntriesAria', { defaultValue: 'Choose entries per page' })}
                            className="px-2 py-1 rounded bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none"
                        >
                            {UMS_PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span>
                            {t('pagination.showingEntries', {
                                defaultValue: `Showing ${
                                    filteredDepartments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
                                } to ${Math.min(currentPage * pageSize, filteredDepartments.length)} of ${
                                    filteredDepartments.length
                                } entries`,
                                start: filteredDepartments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                                end: Math.min(currentPage * pageSize, filteredDepartments.length),
                                total: filteredDepartments.length,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={14} className="rtl:rotate-180" />
                        </button>
                        <span className="px-3 py-1 font-mono font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create / Edit Department Modal/Drawer */}
            {(isCreateOpen || editingDepartment) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="w-full max-w-xl bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#2A3630] mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#2D3F2C] dark:text-[#84C799]">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                        {editingDepartment
                                            ? t('ums.departments.editDepartment', { defaultValue: 'Edit Department' })
                                            : t('ums.departments.addDepartment', { defaultValue: 'Add New Department' })}
                                    </h3>
                                    <p className="text-[11px] text-[#6E6862] dark:text-[#A8A298]">
                                        {formData.code || 'DEP-NEW'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingDepartment(null);
                                }}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={editingDepartment ? handleSaveEdit : handleSaveCreate}
                            className="space-y-4"
                        >
                            {/* Code & Status Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.departments.colCode', { defaultValue: 'Department Code' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        readOnly={Boolean(editingDepartment)}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        dir="ltr"
                                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#2D3F2C] dark:text-[#84C799] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('common.status', { defaultValue: 'Status' })}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none"
                                    >
                                        <option value="Active">{t('common.active', { defaultValue: 'Active' })}</option>
                                        <option value="Inactive">{t('common.inactive', { defaultValue: 'Inactive' })}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Bilingual Names */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.departments.form.nameEn', { defaultValue: 'Department Name (English)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        placeholder="e.g. Legal & Corporate Affairs"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.nameEn
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.nameEn && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.nameEn}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.departments.form.nameAr', { defaultValue: 'Department Name (Arabic)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: الشؤون القانونية والمؤسسية"
                                        dir="rtl"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.nameAr
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.nameAr && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.nameAr}</p>
                                    )}
                                </div>
                            </div>

                            {/* Department Head */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                    {t('ums.departments.colHead', { defaultValue: 'Department Head' })}
                                </label>
                                <select
                                    value={formData.headEmployeeId}
                                    onChange={(e) => setFormData({ ...formData, headEmployeeId: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none cursor-pointer"
                                >
                                    <option value="">{t('common.selectHead', { defaultValue: '-- Select Department Head (Optional) --' })}</option>
                                    {eligibleHeads.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nameEn} ({emp.nameAr}) — {emp.code}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Descriptions */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                    {t('ums.departments.form.descEn', { defaultValue: 'Description (English)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                    placeholder="Brief operational purpose and functional scope..."
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                    {t('ums.departments.form.descAr', { defaultValue: 'Description (Arabic)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionAr}
                                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                    placeholder="الوصف التشغيلي ونطاق المهام الإدارية..."
                                    dir="rtl"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D8] dark:border-[#2A3630]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingDepartment(null);
                                    }}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    {t('common.cancel', { defaultValue: 'Cancel' })}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] dark:bg-[#265938] hover:bg-[#223121] text-white transition-colors"
                                >
                                    {editingDepartment
                                        ? t('common.saveChanges', { defaultValue: 'Save Changes' })
                                        : t('common.create', { defaultValue: 'Create Department' })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Drawer */}
            {viewingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#2A3630] mb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#2D3F2C] dark:text-[#84C799]">
                                    {viewingDepartment.code}
                                </span>
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                    {isRtl ? viewingDepartment.nameAr : viewingDepartment.nameEn}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingDepartment(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.departments.colNameEn', { defaultValue: 'English Name' })}:</span>
                                    <span className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">{viewingDepartment.nameEn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.departments.colNameAr', { defaultValue: 'Arabic Name' })}:</span>
                                    <span className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">{viewingDepartment.nameAr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.departments.colHead', { defaultValue: 'Department Head' })}:</span>
                                    <span className="font-semibold text-[#2D3F2C] dark:text-[#84C799]">
                                        {viewingDepartment.headEmployeeName || t('common.notAssigned', { defaultValue: 'Not Assigned' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('common.status', { defaultValue: 'Status' })}:</span>
                                    <span className="font-semibold">{viewingDepartment.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.departments.colStaff', { defaultValue: 'Assigned Headcount' })}:</span>
                                    <span className="font-mono font-bold text-[#2D3F2C] dark:text-[#84C799]">
                                        {employeeCountByDept[viewingDepartment.id] || 0} employees
                                    </span>
                                </div>
                            </div>

                            {viewingDepartment.descriptionEn && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.departments.form.descEn', { defaultValue: 'Description (English)' })}
                                    </span>
                                    <p className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] text-[#0D0D0D] dark:text-[#F3F0EA] text-[11px] leading-relaxed">
                                        {viewingDepartment.descriptionEn}
                                    </p>
                                </div>
                            )}

                            {viewingDepartment.descriptionAr && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.departments.form.descAr', { defaultValue: 'Description (Arabic)' })}
                                    </span>
                                    <p className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] text-[#0D0D0D] dark:text-[#F3F0EA] text-[11px] leading-relaxed" dir="rtl">
                                        {viewingDepartment.descriptionAr}
                                    </p>
                                </div>
                            )}

                            {/* Assigned Staff List Preview */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1.5">
                                    {t('ums.departments.staffPreview', { defaultValue: 'Assigned Personnel' })} (
                                    {employeeCountByDept[viewingDepartment.id] || 0})
                                </span>
                                <div className="max-h-36 overflow-y-auto rounded-lg border border-[#E5E0D8] dark:border-[#2A3630] divide-y divide-[#F0ECE4] dark:divide-[#2A3630]">
                                    {employees.filter((e) => e.departmentId === viewingDepartment.id).length === 0 ? (
                                        <p className="p-3 text-[11px] text-center text-[#857E74] italic">
                                            {t('ums.departments.noStaffAssigned', { defaultValue: 'No employees currently assigned to this department.' })}
                                        </p>
                                    ) : (
                                        employees
                                            .filter((e) => e.departmentId === viewingDepartment.id)
                                            .map((emp) => (
                                                <div key={emp.id} className="p-2 flex items-center justify-between text-[11px]">
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                                            {isRtl ? emp.nameAr : emp.nameEn}
                                                        </span>
                                                        <span className="ms-2 font-mono text-[10px] text-[#857E74]">
                                                            {emp.code}
                                                        </span>
                                                    </div>
                                                    <span className="text-[#6E6862] dark:text-[#A8A298]">{emp.phone}</span>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-[#E5E0D8] dark:border-[#2A3630] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingDepartment(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] hover:bg-[#EFECE6]"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation / Dependency Warning Dialog */}
            {deletingDepartment && (() => {
                const eligibility = checkDepartmentDeletionEligibility(
                    deletingDepartment.id,
                    employees,
                    designations
                );

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        eligibility.canDelete
                                            ? 'bg-[#FDF2F2] text-[#A63A3A]'
                                            : 'bg-[#FFFBEB] text-[#D97706]'
                                    }`}
                                >
                                    {eligibility.canDelete ? (
                                        <Trash2 size={20} />
                                    ) : (
                                        <ShieldAlert size={20} />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                        {eligibility.canDelete
                                            ? t('ums.departments.deleteTitle', { defaultValue: 'Delete Department' })
                                            : t('ums.departments.deleteBlockedTitle', { defaultValue: 'Deletion Blocked' })}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] dark:text-[#A8A298]">
                                        {deletingDepartment.nameEn} ({deletingDepartment.code})
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-[#45413C] dark:text-[#DCD6CD] mb-5 leading-relaxed">
                                {eligibility.canDelete
                                    ? t('ums.departments.deleteConfirmDesc', {
                                          defaultValue:
                                              'Are you sure you want to delete this department? This operational record will be permanently removed.',
                                      })
                                    : isRtl
                                    ? eligibility.reasonAr
                                    : eligibility.reasonEn}
                            </p>

                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeletingDepartment(null)}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    {t('common.cancel', { defaultValue: 'Cancel' })}
                                </button>
                                {eligibility.canDelete ? (
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#A63A3A] hover:bg-[#882b2b] text-white transition-colors"
                                    >
                                        {t('common.delete', { defaultValue: 'Confirm Delete' })}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleToggleStatus(deletingDepartment);
                                            setDeletingDepartment(null);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white transition-colors"
                                    >
                                        {t('common.deactivateInstead', { defaultValue: 'Deactivate Department' })}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
