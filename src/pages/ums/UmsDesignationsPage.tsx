import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Briefcase,
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
    Building2,
    ShieldAlert,
    Copy,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadDesignations,
    saveDesignations,
    loadDepartments,
    loadEmployees,
    generateNextDesignationCode,
    checkDesignationDeletionEligibility,
    recordUmsAuditEvent,
    UMS_PAGE_SIZE_OPTIONS,
    type DesignationRecord,
    type DepartmentRecord,
    type EmployeeRecord,
} from './umsMockData';

interface DesignationFormData {
    code: string;
    titleEn: string;
    titleAr: string;
    departmentId: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

const DEFAULT_FORM: DesignationFormData = {
    code: '',
    titleEn: '',
    titleAr: '',
    departmentId: '',
    descriptionEn: '',
    descriptionAr: '',
    status: 'Active',
};

export const UmsDesignationsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Data State
    const [designations, setDesignations] = useState<DesignationRecord[]>(() => loadDesignations());
    const [departments] = useState<DepartmentRecord[]>(() => loadDepartments());
    const [employees] = useState<EmployeeRecord[]>(() => loadEmployees());

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Modals & Drawers State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<DesignationRecord | null>(null);
    const [viewingDesignation, setViewingDesignation] = useState<DesignationRecord | null>(null);
    const [deletingDesignation, setDeletingDesignation] = useState<DesignationRecord | null>(null);
    const [formData, setFormData] = useState<DesignationFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Live count of employees assigned to each designation
    const employeeCountByDesignation = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const emp of employees) {
            if (emp.designationId) {
                counts[emp.designationId] = (counts[emp.designationId] || 0) + 1;
            }
        }
        return counts;
    }, [employees]);

    // Active departments for form selection & filter
    const activeDepartments = useMemo(() => {
        return departments.filter((d) => d.status === 'Active');
    }, [departments]);

    // Sync designations state with localStorage
    const persistDesignations = (updated: DesignationRecord[]) => {
        setDesignations(updated);
        saveDesignations(updated);
    };

    // Summary KPIs
    const kpis = useMemo(() => {
        const total = designations.length;
        const active = designations.filter((d) => d.status === 'Active').length;
        const inactive = total - active;
        const totalAssignedStaff = designations.reduce(
            (acc, d) => acc + (employeeCountByDesignation[d.id] || 0),
            0
        );
        return { total, active, inactive, totalAssignedStaff };
    }, [designations, employeeCountByDesignation]);

    // Filtered & Paginated records
    const filteredDesignations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return designations.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (departmentFilter !== 'ALL' && item.departmentId !== departmentFilter) {
                return false;
            }
            if (!query) return true;
            return (
                item.code.toLowerCase().includes(query) ||
                item.titleEn.toLowerCase().includes(query) ||
                item.titleAr.toLowerCase().includes(query) ||
                (item.departmentName && item.departmentName.toLowerCase().includes(query)) ||
                item.descriptionEn.toLowerCase().includes(query) ||
                item.descriptionAr.toLowerCase().includes(query)
            );
        });
    }, [designations, searchQuery, statusFilter, departmentFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredDesignations.length / pageSize));
    const paginatedDesignations = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDesignations.slice(start, start + pageSize);
    }, [filteredDesignations, currentPage, pageSize]);

    // Selection
    const isAllSelected =
        paginatedDesignations.length > 0 &&
        paginatedDesignations.every((d) => selectedIds.includes(d.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !paginatedDesignations.some((d) => d.id === id))
            );
        } else {
            const pageIds = paginatedDesignations.map((d) => d.id);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Copy Code helper
    const handleCopyCode = (code: string) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(t('common.copiedToClipboard', { defaultValue: `Copied ${code}` }));
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Reset Filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setDepartmentFilter('ALL');
        setCurrentPage(1);
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        const nextCode = generateNextDesignationCode(designations);
        setFormData({
            ...DEFAULT_FORM,
            code: nextCode,
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (designation: DesignationRecord) => {
        setEditingDesignation(designation);
        setFormData({
            code: designation.code,
            titleEn: designation.titleEn,
            titleAr: designation.titleAr,
            departmentId: designation.departmentId || '',
            descriptionEn: designation.descriptionEn,
            descriptionAr: designation.descriptionAr,
            status: designation.status,
        });
        setFormErrors({});
    };

    // Validation
    const validateForm = (isEditing = false, currentId?: string): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.titleEn.trim()) {
            errors.titleEn = t('ums.designations.validation.titleEnRequired', {
                defaultValue: 'English job title is required.',
            });
        }

        if (!formData.titleAr.trim()) {
            errors.titleAr = t('ums.designations.validation.titleArRequired', {
                defaultValue: 'Arabic job title is required.',
            });
        }

        // Duplicate Title check (case-insensitive)
        const duplicateEn = designations.find(
            (d) =>
                (!isEditing || d.id !== currentId) &&
                d.titleEn.trim().toLowerCase() === formData.titleEn.trim().toLowerCase()
        );
        if (duplicateEn) {
            errors.titleEn = t('ums.designations.validation.duplicateTitle', {
                defaultValue: 'A designation with this title already exists.',
            });
        }

        const duplicateAr = designations.find(
            (d) =>
                (!isEditing || d.id !== currentId) &&
                d.titleAr.trim().toLowerCase() === formData.titleAr.trim().toLowerCase()
        );
        if (duplicateAr) {
            errors.titleAr = t('ums.designations.validation.duplicateTitle', {
                defaultValue: 'A designation with this title already exists.',
            });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const linkedDept = departments.find((d) => d.id === formData.departmentId);

        const newDesignation: DesignationRecord = {
            id: `des-${Date.now()}`,
            code: formData.code.trim() || generateNextDesignationCode(designations),
            titleEn: formData.titleEn.trim(),
            titleAr: formData.titleAr.trim(),
            departmentId: formData.departmentId || undefined,
            departmentName: linkedDept ? (isRtl ? linkedDept.nameAr : linkedDept.nameEn) : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: 0,
            createdAt: new Date().toISOString().slice(0, 10),
        };

        const updated = [newDesignation, ...designations];
        persistDesignations(updated);

        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Designation',
            resourceId: newDesignation.id,
            resourceName: newDesignation.titleEn,
            detailsEn: `Created designation ${newDesignation.code} (${newDesignation.titleEn}).`,
            detailsAr: `إنشاء مسمى وظيفي جديد ${newDesignation.code} (${newDesignation.titleAr}).`,
            newState: JSON.stringify(newDesignation),
        });

        toast.success(
            t('ums.designations.feedback.created', {
                defaultValue: `Designation ${newDesignation.titleEn} created successfully.`,
                title: newDesignation.titleEn,
            })
        );
        setIsCreateOpen(false);
    };

    // Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDesignation) return;
        if (!validateForm(true, editingDesignation.id)) return;

        const linkedDept = departments.find((d) => d.id === formData.departmentId);

        const updatedDesignation: DesignationRecord = {
            ...editingDesignation,
            titleEn: formData.titleEn.trim(),
            titleAr: formData.titleAr.trim(),
            departmentId: formData.departmentId || undefined,
            departmentName: linkedDept ? (isRtl ? linkedDept.nameAr : linkedDept.nameEn) : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
        };

        const updated = designations.map((d) =>
            d.id === editingDesignation.id ? updatedDesignation : d
        );
        persistDesignations(updated);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Designation',
            resourceId: updatedDesignation.id,
            resourceName: updatedDesignation.titleEn,
            detailsEn: `Updated designation ${updatedDesignation.code} (${updatedDesignation.titleEn}).`,
            detailsAr: `تحديث بيانات المسمى الوظيفي ${updatedDesignation.code} (${updatedDesignation.titleAr}).`,
            previousState: JSON.stringify(editingDesignation),
            newState: JSON.stringify(updatedDesignation),
        });

        toast.success(
            t('ums.designations.feedback.updated', {
                defaultValue: `Designation ${updatedDesignation.titleEn} updated successfully.`,
                title: updatedDesignation.titleEn,
            })
        );
        setEditingDesignation(null);
    };

    // Quick Status Toggle
    const handleToggleStatus = (designation: DesignationRecord) => {
        const nextStatus: 'Active' | 'Inactive' =
            designation.status === 'Active' ? 'Inactive' : 'Active';
        const updated = designations.map((d) =>
            d.id === designation.id ? { ...d, status: nextStatus } : d
        );
        persistDesignations(updated);

        const actionType = nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED';
        recordUmsAuditEvent({
            action: actionType,
            resource: 'Designation',
            resourceId: designation.id,
            resourceName: designation.titleEn,
            detailsEn: `Changed status of ${designation.code} to ${nextStatus}.`,
            detailsAr: `تغيير حالة المسمى الوظيفي ${designation.code} إلى ${nextStatus === 'Active' ? 'نشط' : 'معطل'}.`,
        });

        toast.success(
            t('ums.designations.feedback.statusChanged', {
                defaultValue: `Designation ${designation.titleEn} is now ${nextStatus}.`,
                title: designation.titleEn,
                status: nextStatus,
            })
        );
    };

    // Delete check & action
    const handleDeleteClick = (designation: DesignationRecord) => {
        setDeletingDesignation(designation);
    };

    const handleConfirmDelete = () => {
        if (!deletingDesignation) return;

        const check = checkDesignationDeletionEligibility(deletingDesignation.id, employees);
        if (!check.canDelete) {
            toast.error(isRtl ? check.reasonAr : check.reasonEn);
            return;
        }

        const updated = designations.filter((d) => d.id !== deletingDesignation.id);
        persistDesignations(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== deletingDesignation.id));

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Designation',
            resourceId: deletingDesignation.id,
            resourceName: deletingDesignation.titleEn,
            detailsEn: `Deleted designation ${deletingDesignation.code} (${deletingDesignation.titleEn}).`,
            detailsAr: `حذف المسمى الوظيفي ${deletingDesignation.code} (${deletingDesignation.titleAr}).`,
            previousState: JSON.stringify(deletingDesignation),
        });

        toast.success(
            t('ums.designations.feedback.deleted', {
                defaultValue: `Designation ${deletingDesignation.titleEn} deleted successfully.`,
                title: deletingDesignation.titleEn,
            })
        );
        setDeletingDesignation(null);
    };

    // Export CSV
    const handleExportCsv = () => {
        if (designations.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = [
            'Designation Code',
            'Title (English)',
            'Title (Arabic)',
            'Department',
            'Assigned Employees',
            'Status',
            'Created Date',
            'Description (EN)',
        ];

        const rows = designations.map((d) => [
            d.code,
            `"${d.titleEn.replace(/"/g, '""')}"`,
            `"${d.titleAr.replace(/"/g, '""')}"`,
            `"${(d.departmentName || 'General / Unassigned').replace(/"/g, '""')}"`,
            employeeCountByDesignation[d.id] || 0,
            d.status,
            d.createdAt,
            `"${(d.descriptionEn || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AWN_Designations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Designation',
            resourceId: 'ALL',
            resourceName: 'Designations Catalog',
            detailsEn: `Exported ${designations.length} designation records to CSV.`,
            detailsAr: `تصدير ${designations.length} سجل من المسميات الوظيفية إلى ملف CSV.`,
        });

        toast.success(
            t('ums.designations.feedback.exported', {
                defaultValue: 'Designations exported successfully.',
            })
        );
    };

    // Assigned employees for currently viewed designation
    const viewedEmployees = useMemo(() => {
        if (!viewingDesignation) return [];
        return employees.filter((e) => e.designationId === viewingDesignation.id);
    }, [viewingDesignation, employees]);

    // Deletion eligibility for modal
    const deletionEligibility = useMemo(() => {
        if (!deletingDesignation) return null;
        return checkDesignationDeletionEligibility(deletingDesignation.id, employees);
    }, [deletingDesignation, employees]);

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.designations.title', { defaultValue: 'Designations Master' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            DES-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.designations.subtitle', {
                            defaultValue:
                                'Corporate job titles, grade structures, and departmental allocations.',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('common.export', { defaultValue: 'Export' })}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={14} />
                        <span>{t('ums.designations.addDesignation', { defaultValue: 'Add Designation' })}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.designations.kpi.total', { defaultValue: 'Total Designations' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <Briefcase size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.designations.kpi.units', { defaultValue: 'Positions' })}
                        </span>
                    </div>
                </div>

                {/* Active */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.designations.kpi.active', { defaultValue: 'Active Positions' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-center text-[#265938]">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#265938]">
                            {kpis.active}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.designations.kpi.operating', { defaultValue: 'Operational' })}
                        </span>
                    </div>
                </div>

                {/* Inactive */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.designations.kpi.inactive', { defaultValue: 'Inactive Positions' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#857E74]">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#6E6862]">
                            {kpis.inactive}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.designations.kpi.suspended', { defaultValue: 'Suspended' })}
                        </span>
                    </div>
                </div>

                {/* Assigned Workforce */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.designations.kpi.workforce', { defaultValue: 'Assigned Workforce' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.totalAssignedStaff}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.designations.kpi.employeesTotal', { defaultValue: 'Employees' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none start-3"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('ums.designations.searchPlaceholder', {
                                defaultValue: 'Search designations by code, title, department, or description...',
                            })}
                            className="w-full ps-9 pe-8 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] p-0.5 rounded cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Department Filter */}
                        <div className="min-w-[160px]">
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    setDepartmentFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.designations.filterDepartment', { defaultValue: 'Filter Department' })}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#45413C] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('common.allDepartments', { defaultValue: 'All Departments' })}
                                </option>
                                {activeDepartments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {isRtl ? dept.nameAr : dept.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter Segmented Control */}
                        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg">
                            {(['ALL', 'Active', 'Inactive'] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                        statusFilter === status
                                            ? 'bg-white text-[#0D0D0D] shadow-2xs border border-[#E5E0D8]'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {status === 'ALL'
                                        ? t('common.all', { defaultValue: 'All' })
                                        : status === 'Active'
                                        ? t('common.active', { defaultValue: 'Active' })
                                        : t('common.inactive', { defaultValue: 'Inactive' })}
                                </button>
                            ))}
                        </div>

                        {/* Reset Filters Button */}
                        {(searchQuery || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                title={t('common.resetFilters', { defaultValue: 'Reset Filters' })}
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.reset', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk selection actions bar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs">
                        <span className="font-semibold text-[#2D3F2C]">
                            {t('common.selectedCount', {
                                defaultValue: `${selectedIds.length} item(s) selected`,
                                count: selectedIds.length,
                            })}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                {t('common.clearSelection', { defaultValue: 'Clear' })}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[#6E6862] font-semibold">
                                <th className="w-10 px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        aria-label={t('common.selectAll', { defaultValue: 'Select All' })}
                                        className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.designations.colCode', { defaultValue: 'Code' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.designations.colTitle', { defaultValue: 'Job Title' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.designations.colDepartment', { defaultValue: 'Department' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.designations.colStaff', { defaultValue: 'Staff Count' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('common.status', { defaultValue: 'Status' })}
                                </th>
                                <th className="px-4 py-3 text-end">
                                    {t('common.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFECE6] text-[#45413C]">
                            {paginatedDesignations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-[#857E74]">
                                        <Briefcase size={32} className="mx-auto mb-2 text-[#857E74]/40" />
                                        <p className="font-semibold text-[#0D0D0D]">
                                            {t('common.noRecords', { defaultValue: 'No designations found' })}
                                        </p>
                                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                                            {searchQuery || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                                                ? t('common.tryAdjustingFilters', { defaultValue: 'Try clearing your search query or filters.' })
                                                : t('ums.designations.noDesignationsYet', { defaultValue: 'Get started by creating your first corporate designation.' })}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedDesignations.map((item) => {
                                    const staffCount = employeeCountByDesignation[item.id] || 0;
                                    const isSelected = selectedIds.includes(item.id);

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-[#FAF8F5]/60 transition-colors ${
                                                isSelected ? 'bg-[#FAF8F5]' : ''
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="w-10 px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(item.id)}
                                                    aria-label={`Select ${item.titleEn}`}
                                                    className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            {/* Code */}
                                            <td className="px-4 py-3 font-mono text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-[#0D0D0D]">
                                                        {item.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCode(item.code)}
                                                        className="text-[#857E74] hover:text-[#0D0D0D] p-0.5 rounded cursor-pointer"
                                                        title={t('common.copy', { defaultValue: 'Copy' })}
                                                    >
                                                        {copiedCode === item.code ? (
                                                            <Check size={12} className="text-[#265938]" />
                                                        ) : (
                                                            <Copy size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Title (Bilingual) */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#0D0D0D]">
                                                        {isRtl ? item.titleAr : item.titleEn}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862]">
                                                        {isRtl ? item.titleEn : item.titleAr}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Department */}
                                            <td className="px-4 py-3">
                                                {item.departmentName ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-[#45413C]">
                                                        <Building2 size={13} className="text-[#857E74]" />
                                                        <span>{item.departmentName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#857E74] italic">
                                                        {t('ums.designations.noDepartment', {
                                                            defaultValue: 'General / Unassigned',
                                                        })}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Staff Count */}
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingDesignation(item)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                                    title={t('ums.designations.staffPreview', {
                                                        defaultValue: 'View assigned employees',
                                                    })}
                                                >
                                                    <Users size={13} className="text-[#857E74]" />
                                                    <span>
                                                        {staffCount > 0
                                                            ? `${staffCount} ${t('ums.designations.staffPreview', { defaultValue: 'Employees' })}`
                                                            : t('ums.designations.noStaffAssigned', { defaultValue: 'No Staff' })}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                                                        item.status === 'Active'
                                                            ? 'bg-[#EAF3EC] text-[#265938] border-[#265938]/20 hover:bg-[#EAF3EC]/80'
                                                            : 'bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8] hover:bg-[#E5E0D8]/40'
                                                    }`}
                                                    title={t('common.toggleStatus', { defaultValue: 'Click to toggle status' })}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            item.status === 'Active' ? 'bg-[#265938]' : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {item.status === 'Active'
                                                            ? t('common.active', { defaultValue: 'Active' })
                                                            : t('common.inactive', { defaultValue: 'Inactive' })}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingDesignation(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t('common.view', { defaultValue: 'View Details' })}
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t('common.edit', { defaultValue: 'Edit' })}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    {/* Quick Status Toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(item)}
                                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                                            item.status === 'Active'
                                                                ? 'text-[#265938] hover:bg-[#EAF3EC]'
                                                                : 'text-[#857E74] hover:bg-[#FAF8F5]'
                                                        }`}
                                                        title={t('common.toggleStatus', { defaultValue: 'Toggle Status' })}
                                                    >
                                                        <Power size={14} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                                                        title={t('common.delete', { defaultValue: 'Delete' })}
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

                {/* Pagination footer */}
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
                                    filteredDesignations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
                                } - ${Math.min(
                                    currentPage * pageSize,
                                    filteredDesignations.length
                                )} of ${filteredDesignations.length}`,
                                start: filteredDesignations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                                end: Math.min(currentPage * pageSize, filteredDesignations.length),
                                total: filteredDesignations.length,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.prev', { defaultValue: 'Previous Page' })}
                        >
                            <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>

                        <span className="px-2 font-semibold text-[#0D0D0D]">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.next', { defaultValue: 'Next Page' })}
                        >
                            <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create / Edit Drawer or Modal */}
            {(isCreateOpen || editingDesignation) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {isCreateOpen
                                        ? t('ums.designations.addDesignation', { defaultValue: 'Add Designation' })
                                        : t('ums.designations.editDesignation', { defaultValue: 'Edit Designation' })}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {formData.code}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingDesignation(null);
                                }}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="p-6 space-y-4">
                            {/* Code (Read-Only) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.designations.colCode', { defaultValue: 'Code' })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#6E6862] cursor-not-allowed"
                                />
                            </div>

                            {/* Title EN & AR */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.designations.form.titleEn', { defaultValue: 'Job Title (EN)' })}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleEn}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, titleEn: e.target.value }))
                                        }
                                        placeholder="e.g. Chief Executive Officer"
                                        className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                            formErrors.titleEn
                                                ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.titleEn && (
                                        <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                            {formErrors.titleEn}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.designations.form.titleAr', { defaultValue: 'Job Title (AR)' })}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={formData.titleAr}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, titleAr: e.target.value }))
                                        }
                                        placeholder="مثال: الرئيس التنفيذي"
                                        className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                            formErrors.titleAr
                                                ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.titleAr && (
                                        <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                            {formErrors.titleAr}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Department Association */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.designations.form.department', {
                                        defaultValue: 'Associated Department',
                                    })}
                                </label>
                                <select
                                    value={formData.departmentId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, departmentId: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] cursor-pointer"
                                >
                                    <option value="">
                                        {t('ums.designations.noDepartment', {
                                            defaultValue: '-- General / Unassigned Department --',
                                        })}
                                    </option>
                                    {activeDepartments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.code} — {isRtl ? dept.nameAr : dept.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description EN */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.designations.form.descEn', { defaultValue: 'Description (EN)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))
                                    }
                                    placeholder="Organizational role overview and core competencies..."
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                />
                            </div>

                            {/* Description AR */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.designations.form.descAr', { defaultValue: 'Description (AR)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    dir="rtl"
                                    value={formData.descriptionAr}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, descriptionAr: e.target.value }))
                                    }
                                    placeholder="الوصف الوظيفي والمسؤوليات الرئيسية..."
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1.5">
                                    {t('common.status', { defaultValue: 'Status' })}
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="designationStatus"
                                            value="Active"
                                            checked={formData.status === 'Active'}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, status: 'Active' }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                        />
                                        <span>{t('common.active', { defaultValue: 'Active' })}</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="designationStatus"
                                            value="Inactive"
                                            checked={formData.status === 'Inactive'}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, status: 'Inactive' }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                        />
                                        <span>{t('common.inactive', { defaultValue: 'Inactive' })}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingDesignation(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                >
                                    {t('common.cancel', { defaultValue: 'Cancel' })}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                >
                                    {isCreateOpen
                                        ? t('common.create', { defaultValue: 'Create' })
                                        : t('common.saveChanges', { defaultValue: 'Save Changes' })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Drawer or Modal */}
            {viewingDesignation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {isRtl ? viewingDesignation.titleAr : viewingDesignation.titleEn}
                                    </h2>
                                    <span className="font-mono text-xs text-[#6E6862]">
                                        {viewingDesignation.code}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingDesignation(null)}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 text-xs">
                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.designations.colDepartment', { defaultValue: 'Department' })}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                        {viewingDesignation.departmentName ||
                                            t('ums.designations.noDepartment', { defaultValue: 'General' })}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('common.status', { defaultValue: 'Status' })}
                                    </span>
                                    <span
                                        className={`inline-block font-semibold mt-0.5 ${
                                            viewingDesignation.status === 'Active'
                                                ? 'text-[#265938]'
                                                : 'text-[#857E74]'
                                        }`}
                                    >
                                        {viewingDesignation.status}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('common.createdAt', { defaultValue: 'Created Date' })}
                                    </span>
                                    <span className="font-mono font-medium text-[#45413C] mt-0.5 block">
                                        {viewingDesignation.createdAt}
                                    </span>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.designations.form.descEn', { defaultValue: 'Description (EN)' })}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingDesignation.descriptionEn || 'No English description provided.'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.designations.form.descAr', { defaultValue: 'Description (AR)' })}
                                    </h3>
                                    <p
                                        dir="rtl"
                                        className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]"
                                    >
                                        {viewingDesignation.descriptionAr || 'لا يوجد وصف عربي.'}
                                    </p>
                                </div>
                            </div>

                            {/* Assigned Employees */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-[#0D0D0D]">
                                        {t('ums.designations.staffPreview', { defaultValue: 'Assigned Employees' })}{' '}
                                        <span className="text-[#265938]">({viewedEmployees.length})</span>
                                    </h3>
                                </div>

                                {viewedEmployees.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#857E74]">
                                        {t('ums.designations.noStaffAssigned', {
                                            defaultValue: 'No employees currently assigned to this designation.',
                                        })}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#EFECE6] border border-[#E5E0D8] rounded-lg overflow-hidden">
                                        {viewedEmployees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="flex items-center justify-between p-3 bg-white text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center font-bold text-[11px]">
                                                        {emp.nameEn.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D] block">
                                                            {isRtl ? emp.nameAr : emp.nameEn}
                                                        </span>
                                                        <span className="text-[11px] text-[#6E6862]">
                                                            {emp.code} · {emp.email}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                        emp.status === 'Active'
                                                            ? 'bg-[#EAF3EC] text-[#265938]'
                                                            : 'bg-[#FAF8F5] text-[#857E74]'
                                                    }`}
                                                >
                                                    {emp.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end px-6 py-4 border-t border-[#E5E0D8]">
                            <button
                                type="button"
                                onClick={() => setViewingDesignation(null)}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingDesignation && deletionEligibility && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        {!deletionEligibility.canDelete ? (
                            // Blocked Deletion Notice
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <ShieldAlert size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t('ums.designations.deleteBlockedTitle', {
                                        defaultValue: 'Cannot Delete Designation',
                                    })}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4">
                                    {isRtl ? deletionEligibility.reasonAr : deletionEligibility.reasonEn}
                                </p>
                                <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingDesignation(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.close', { defaultValue: 'Close' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleToggleStatus(deletingDesignation);
                                            setDeletingDesignation(null);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                                    >
                                        {t('common.deactivateInstead', { defaultValue: 'Deactivate Instead' })}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Allowed Delete Confirmation
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <Trash2 size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t('ums.designations.deleteTitle', { defaultValue: 'Delete Designation' })}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4">
                                    {t('ums.designations.deleteConfirmDesc', {
                                        defaultValue:
                                            'Are you sure you want to delete this designation? This action cannot be undone.',
                                    })}
                                    <span className="block font-bold text-[#0D0D0D] mt-2">
                                        {deletingDesignation.code} —{' '}
                                        {isRtl ? deletingDesignation.titleAr : deletingDesignation.titleEn}
                                    </span>
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingDesignation(null)}
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

export default UmsDesignationsPage;
