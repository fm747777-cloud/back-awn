import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MapPin,
    CheckCircle2,
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
    Phone,
    Mail,
    ShieldAlert,
    Landmark,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadBranches,
    saveBranches,
    loadEmployees,
    generateNextBranchCode,
    checkBranchDeletionEligibility,
    recordUmsAuditEvent,
    UMS_PAGE_SIZE_OPTIONS,
    type BranchRecord,
    type EmployeeRecord,
} from './umsMockData';

interface BranchFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    cityEn: string;
    cityAr: string;
    crNumber: string;
    addressEn: string;
    addressAr: string;
    phone: string;
    email: string;
    isHeadquarter: boolean;
    status: 'Active' | 'Inactive';
}

const DEFAULT_FORM: BranchFormData = {
    code: '',
    nameEn: '',
    nameAr: '',
    cityEn: '',
    cityAr: '',
    crNumber: '',
    addressEn: '',
    addressAr: '',
    phone: '',
    email: '',
    isHeadquarter: false,
    status: 'Active',
};

export const UmsBranchesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Data State
    const [branches, setBranches] = useState<BranchRecord[]>(() => loadBranches());
    const [employees] = useState<EmployeeRecord[]>(() => loadEmployees());

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [cityFilter, setCityFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modals & Drawers State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
    const [viewingBranch, setViewingBranch] = useState<BranchRecord | null>(null);
    const [deletingBranch, setDeletingBranch] = useState<BranchRecord | null>(null);
    const [formData, setFormData] = useState<BranchFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Live count of employees assigned to each branch
    const employeeCountByBranch = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const emp of employees) {
            if (emp.branchId) {
                counts[emp.branchId] = (counts[emp.branchId] || 0) + 1;
            }
        }
        return counts;
    }, [employees]);

    // Unique cities for filter dropdown
    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        for (const b of branches) {
            if (b.cityEn) cities.add(b.cityEn);
        }
        return Array.from(cities);
    }, [branches]);

    // Sync branches state with localStorage
    const persistBranches = (updated: BranchRecord[]) => {
        setBranches(updated);
        saveBranches(updated);
    };

    // Summary KPIs
    const kpis = useMemo(() => {
        const total = branches.length;
        const active = branches.filter((b) => b.status === 'Active').length;
        const hqBranch = branches.find((b) => b.isHeadquarter);
        const totalAssignedStaff = branches.reduce(
            (acc, b) => acc + (employeeCountByBranch[b.id] || 0),
            0
        );
        return { total, active, hqBranch, totalAssignedStaff };
    }, [branches, employeeCountByBranch]);

    // Filtered & Paginated records
    const filteredBranches = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return branches.filter((branch) => {
            if (statusFilter !== 'ALL' && branch.status !== statusFilter) {
                return false;
            }
            if (cityFilter !== 'ALL' && branch.cityEn !== cityFilter) {
                return false;
            }
            if (!query) return true;
            return (
                branch.code.toLowerCase().includes(query) ||
                branch.nameEn.toLowerCase().includes(query) ||
                branch.nameAr.toLowerCase().includes(query) ||
                branch.cityEn.toLowerCase().includes(query) ||
                branch.cityAr.toLowerCase().includes(query) ||
                branch.crNumber.toLowerCase().includes(query) ||
                branch.phone.toLowerCase().includes(query) ||
                branch.email.toLowerCase().includes(query) ||
                branch.addressEn.toLowerCase().includes(query) ||
                branch.addressAr.toLowerCase().includes(query)
            );
        });
    }, [branches, searchQuery, statusFilter, cityFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredBranches.length / pageSize));
    const paginatedBranches = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBranches.slice(start, start + pageSize);
    }, [filteredBranches, currentPage, pageSize]);

    // Select-all logic
    const isAllSelected =
        paginatedBranches.length > 0 && paginatedBranches.every((b) => selectedIds.includes(b.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            const pageIds = new Set(paginatedBranches.map((b) => b.id));
            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
        } else {
            const pageIds = paginatedBranches.map((b) => b.id);
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
            code: generateNextBranchCode(branches),
            isHeadquarter: branches.length === 0, // First branch defaults to HQ
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Drawer
    const handleOpenEdit = (branch: BranchRecord) => {
        setEditingBranch(branch);
        setFormData({
            code: branch.code,
            nameEn: branch.nameEn,
            nameAr: branch.nameAr,
            cityEn: branch.cityEn,
            cityAr: branch.cityAr,
            crNumber: branch.crNumber,
            addressEn: branch.addressEn,
            addressAr: branch.addressAr,
            phone: branch.phone,
            email: branch.email,
            isHeadquarter: Boolean(branch.isHeadquarter),
            status: branch.status,
        });
        setFormErrors({});
    };

    // Form Validation
    const validateForm = (isEditing = false, editId?: string) => {
        const errors: Record<string, string> = {};
        if (!formData.nameEn.trim()) {
            errors.nameEn = t('ums.branches.validation.nameEnRequired', {
                defaultValue: 'English branch name is required.',
            });
        }
        if (!formData.nameAr.trim()) {
            errors.nameAr = t('ums.branches.validation.nameArRequired', {
                defaultValue: 'Arabic branch name is required.',
            });
        }
        if (!formData.cityEn.trim()) {
            errors.cityEn = t('ums.branches.validation.cityEnRequired', {
                defaultValue: 'English city is required.',
            });
        }
        if (!formData.cityAr.trim()) {
            errors.cityAr = t('ums.branches.validation.cityArRequired', {
                defaultValue: 'Arabic city is required.',
            });
        }
        if (!formData.crNumber.trim()) {
            errors.crNumber = t('ums.branches.validation.crRequired', {
                defaultValue: 'Commercial Registration (CR) number is required.',
            });
        }
        if (!formData.addressEn.trim()) {
            errors.addressEn = t('ums.branches.validation.addressEnRequired', {
                defaultValue: 'Address in English is required.',
            });
        }
        if (!formData.phone.trim()) {
            errors.phone = t('ums.branches.validation.phoneRequired', {
                defaultValue: 'Contact phone number is required.',
            });
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            errors.email = t('ums.branches.validation.validEmail', {
                defaultValue: 'A valid email address is required.',
            });
        }

        // Duplicate name / code / CR check
        const lowerNameEn = formData.nameEn.trim().toLowerCase();
        const crClean = formData.crNumber.trim();
        const duplicate = branches.find(
            (b) =>
                (!isEditing || b.id !== editId) &&
                (b.nameEn.toLowerCase() === lowerNameEn || b.crNumber === crClean)
        );
        if (duplicate) {
            if (duplicate.crNumber === crClean) {
                errors.crNumber = t('ums.branches.validation.duplicateCr', {
                    defaultValue: 'Another branch is already registered with this CR number.',
                });
            } else {
                errors.nameEn = t('ums.branches.validation.duplicateName', {
                    defaultValue: 'A branch with this name already exists.',
                });
            }
        }

        // Headquarters verification: if editing and trying to UNCHECK HQ when it's the only HQ
        if (isEditing && editingBranch?.isHeadquarter && !formData.isHeadquarter) {
            const otherHq = branches.some((b) => b.id !== editId && b.isHeadquarter);
            if (!otherHq) {
                errors.isHeadquarter = t('ums.branches.validation.onlyHqRemovalBlocked', {
                    defaultValue: 'You cannot uncheck Headquarters for the only active HQ branch. Designate another branch as HQ first.',
                });
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const willBeHq = formData.isHeadquarter || branches.length === 0;

        const newBranch: BranchRecord = {
            id: `brn-${Date.now()}`,
            code: formData.code.trim() || generateNextBranchCode(branches),
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            cityEn: formData.cityEn.trim(),
            cityAr: formData.cityAr.trim(),
            crNumber: formData.crNumber.trim(),
            addressEn: formData.addressEn.trim(),
            addressAr: formData.addressAr.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            isHeadquarter: willBeHq,
            status: formData.status,
            employeeCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
        };

        // If setting this as HQ, remove HQ from existing branches
        let updatedList: BranchRecord[];
        if (willBeHq) {
            updatedList = [
                newBranch,
                ...branches.map((b) => ({ ...b, isHeadquarter: false })),
            ];
        } else {
            updatedList = [newBranch, ...branches];
        }

        persistBranches(updatedList);

        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Branch',
            resourceId: newBranch.id,
            resourceName: newBranch.nameEn,
            detailsEn: `Registered new branch ${newBranch.nameEn} (${newBranch.code}) in ${newBranch.cityEn} [CR: ${newBranch.crNumber}]${
                willBeHq ? ' designated as Headquarters' : ''
            }.`,
            detailsAr: `تسجيل فرع جديد ${newBranch.nameAr} (${newBranch.code}) في ${newBranch.cityAr} [س.ت: ${newBranch.crNumber}]${
                willBeHq ? ' وتعيينه كمقر رئيسي' : ''
            }.`,
        });

        toast.success(
            t('ums.branches.feedback.created', {
                defaultValue: `Branch ${newBranch.nameEn} created successfully.`,
                name: newBranch.nameEn,
            })
        );
        setIsCreateOpen(false);
    };

    // Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch) return;
        if (!validateForm(true, editingBranch.id)) return;

        const willBeHq = formData.isHeadquarter;

        const updatedBranch: BranchRecord = {
            ...editingBranch,
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            cityEn: formData.cityEn.trim(),
            cityAr: formData.cityAr.trim(),
            crNumber: formData.crNumber.trim(),
            addressEn: formData.addressEn.trim(),
            addressAr: formData.addressAr.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            isHeadquarter: willBeHq,
            status: formData.status,
            employeeCount: employeeCountByBranch[editingBranch.id] || 0,
        };

        let updatedList: BranchRecord[];
        if (willBeHq) {
            // Transfer HQ designation to this branch
            updatedList = branches.map((b) =>
                b.id === editingBranch.id
                    ? updatedBranch
                    : { ...b, isHeadquarter: false }
            );
        } else {
            updatedList = branches.map((b) =>
                b.id === editingBranch.id ? updatedBranch : b
            );
        }

        persistBranches(updatedList);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Branch',
            resourceId: updatedBranch.id,
            resourceName: updatedBranch.nameEn,
            detailsEn: `Updated branch details for ${updatedBranch.nameEn} (${updatedBranch.code})${
                willBeHq ? ' - updated as Headquarters' : ''
            }.`,
            detailsAr: `تحديث بيانات الفرع ${updatedBranch.nameAr} (${updatedBranch.code})${
                willBeHq ? ' - وتعيينه كمقر رئيسي' : ''
            }.`,
        });

        toast.success(
            t('ums.branches.feedback.updated', {
                defaultValue: `Branch ${updatedBranch.nameEn} updated successfully.`,
                name: updatedBranch.nameEn,
            })
        );
        setEditingBranch(null);
    };

    // Toggle Status (Active / Inactive)
    const handleToggleStatus = (branch: BranchRecord) => {
        const nextStatus: 'Active' | 'Inactive' = branch.status === 'Active' ? 'Inactive' : 'Active';
        const updated = branches.map((b) =>
            b.id === branch.id ? { ...b, status: nextStatus } : b
        );
        persistBranches(updated);

        recordUmsAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Branch',
            resourceId: branch.id,
            resourceName: branch.nameEn,
            detailsEn: `Changed branch status of ${branch.nameEn} to ${nextStatus}.`,
            detailsAr: `تغيير حالة الفرع ${branch.nameAr} إلى ${nextStatus === 'Active' ? 'مفعّل' : 'معطّل'}.`,
        });

        toast.info(
            t('ums.branches.feedback.statusChanged', {
                defaultValue: `Branch status changed to ${nextStatus}.`,
                status: nextStatus,
            })
        );
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingBranch) return;

        const eligibility = checkBranchDeletionEligibility(
            deletingBranch.id,
            branches,
            employees
        );

        if (!eligibility.canDelete) {
            toast.error(isRtl ? eligibility.reasonAr : eligibility.reasonEn);
            setDeletingBranch(null);
            return;
        }

        const updated = branches.filter((b) => b.id !== deletingBranch.id);
        persistBranches(updated);

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Branch',
            resourceId: deletingBranch.id,
            resourceName: deletingBranch.nameEn,
            detailsEn: `Deleted branch ${deletingBranch.nameEn} (${deletingBranch.code}).`,
            detailsAr: `حذف الفرع ${deletingBranch.nameAr} (${deletingBranch.code}) نهائياً.`,
        });

        toast.success(
            t('ums.branches.feedback.deleted', {
                defaultValue: `Branch ${deletingBranch.nameEn} deleted successfully.`,
                name: deletingBranch.nameEn,
            })
        );
        setDeletingBranch(null);
    };

    // Export to CSV
    const handleExportCsv = () => {
        if (branches.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = [
            'Branch Code',
            'Name (English)',
            'Name (Arabic)',
            'City (English)',
            'City (Arabic)',
            'CR Number',
            'Is Headquarters',
            'Phone',
            'Email',
            'Assigned Headcount',
            'Status',
            'Created Date',
            'Address (English)',
        ];

        const rows = branches.map((b) => [
            b.code,
            `"${b.nameEn.replace(/"/g, '""')}"`,
            `"${b.nameAr.replace(/"/g, '""')}"`,
            b.cityEn,
            b.cityAr,
            b.crNumber,
            b.isHeadquarter ? 'YES' : 'NO',
            b.phone,
            b.email,
            employeeCountByBranch[b.id] || 0,
            b.status,
            b.createdAt,
            `"${(b.addressEn || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AWN_Branches_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Branch',
            resourceId: 'ALL',
            resourceName: 'Branches Registry',
            detailsEn: `Exported ${branches.length} branch records to CSV.`,
            detailsAr: `تصدير ${branches.length} سجل من سجلات الفروع إلى ملف CSV.`,
        });

        toast.success(t('ums.branches.feedback.exported', { defaultValue: 'Branches exported successfully.' }));
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {t('ums.branches.title', { defaultValue: 'Branches & Locations' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] dark:bg-[#1C2521] text-[#2D3F2C] dark:text-[#84C799] border border-[#E5E0D8] dark:border-[#2A3630]"
                            dir="ltr"
                        >
                            BRN-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] dark:text-[#A8A298] mt-1 font-normal">
                        {t('ums.branches.subtitle', {
                            defaultValue:
                                'Corporate headquarters, regional branches, commercial registrations, and site contacts.',
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
                        <span>{t('ums.branches.addBranch', { defaultValue: 'Add Branch' })}</span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.branches.kpi.total', { defaultValue: 'Total Locations' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#2D3F2C] dark:text-[#84C799]">
                            <MapPin size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-[#F3F0EA]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.branches.kpi.operatingSites', { defaultValue: 'operating sites' })}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.branches.kpi.active', { defaultValue: 'Active Sites' })}
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
                            {t('ums.branches.kpi.hq', { defaultValue: 'Main Headquarters' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#8C6046]">
                            <Landmark size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-base font-bold text-[#0D0D0D] dark:text-[#F3F0EA] truncate">
                            {kpis.hqBranch ? (isRtl ? kpis.hqBranch.cityAr : kpis.hqBranch.cityEn) : 'Not Set'}
                        </span>
                        <span className="text-[11px] font-mono text-[#265938] dark:text-[#84C799]">
                            {kpis.hqBranch?.code || '—'}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-[#A8A298]">
                            {t('ums.branches.kpi.workforce', { defaultValue: 'Branch Workforce' })}
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
                            {t('ums.branches.kpi.totalHeadcount', { defaultValue: 'deployed staff' })}
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
                            placeholder={t('ums.branches.searchPlaceholder', {
                                defaultValue: 'Search by branch name, code, city, CR number, phone, email...',
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

                    {/* City & Status Filters */}
                    <div className="flex items-center gap-2">
                        <select
                            value={cityFilter}
                            onChange={(e) => {
                                setCityFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('ums.branches.filterCity', { defaultValue: 'Filter by City' })}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">{t('common.allCities', { defaultValue: 'All Cities' })}</option>
                            {availableCities.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

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

                        {(searchQuery || statusFilter !== 'ALL' || cityFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
                                    setCityFilter('ALL');
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
                                        aria-label="Select all branches"
                                        className="rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 text-start">{t('ums.branches.colCode', { defaultValue: 'Code' })}</th>
                                <th className="p-3 text-start">{t('ums.branches.colName', { defaultValue: 'Branch Name' })}</th>
                                <th className="p-3 text-start">{t('ums.branches.colCity', { defaultValue: 'City & Location' })}</th>
                                <th className="p-3 text-start">{t('ums.branches.colCr', { defaultValue: 'CR Number' })}</th>
                                <th className="p-3 text-start">{t('ums.branches.colContact', { defaultValue: 'Contact Info' })}</th>
                                <th className="p-3 text-center">{t('ums.branches.colStaff', { defaultValue: 'Staff' })}</th>
                                <th className="p-3 text-center">{t('common.status', { defaultValue: 'Status' })}</th>
                                <th className="p-3 text-end">{t('common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] dark:divide-[#2A3630]">
                            {paginatedBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-[#857E74]">
                                        <MapPin size={28} className="mx-auto mb-2 text-[#C9C2B8]" />
                                        <p className="font-medium text-sm">
                                            {t('common.noRecordsMatch', { defaultValue: 'No records found matching criteria.' })}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBranches.map((branch) => {
                                    const assignedCount = employeeCountByBranch[branch.id] || 0;
                                    const isSelected = selectedIds.includes(branch.id);

                                    return (
                                        <tr
                                            key={branch.id}
                                            className={`transition-colors hover:bg-[#FAF8F5]/80 dark:hover:bg-[#232E29]/50 ${
                                                isSelected ? 'bg-[#FAF8F5] dark:bg-[#1C2521]' : ''
                                            }`}
                                        >
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(branch.id)}
                                                    aria-label={`Select branch ${branch.nameEn}`}
                                                    className="rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-3 font-mono font-semibold text-[#2D3F2C] dark:text-[#84C799] whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630]" dir="ltr">
                                                    {branch.code}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5 font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                                    <span>{isRtl ? branch.nameAr : branch.nameEn}</span>
                                                    {branch.isHeadquarter && (
                                                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-[#BFAB93]/20 text-[#8C6046] border border-[#BFAB93]/40">
                                                            {t('ums.branches.hqBadge', { defaultValue: 'HQ' })}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-[#857E74] font-normal">
                                                    {isRtl ? branch.nameEn : branch.nameAr}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-[#0D0D0D] dark:text-[#F3F0EA]">
                                                    {isRtl ? branch.cityAr : branch.cityEn}
                                                </div>
                                                <div className="text-[11px] text-[#857E74] truncate max-w-xs">
                                                    {isRtl ? branch.addressAr : branch.addressEn}
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-[#0D0D0D] dark:text-[#F3F0EA] whitespace-nowrap">
                                                <span dir="ltr">{branch.crNumber}</span>
                                            </td>
                                            <td className="p-3 text-[11px] space-y-0.5 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-[#45413C] dark:text-[#A8A298]">
                                                    <Phone size={11} className="text-[#857E74]" />
                                                    <span dir="ltr">{branch.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[#45413C] dark:text-[#A8A298]">
                                                    <Mail size={11} className="text-[#857E74]" />
                                                    <span dir="ltr">{branch.email}</span>
                                                </div>
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
                                                        branch.status === 'Active'
                                                            ? 'bg-[#EAF3EC] dark:bg-[#265938]/30 text-[#265938] dark:text-[#84C799] border-[#265938]/25'
                                                            : 'bg-[#F4F1EA] dark:bg-[#1C2521] text-[#6E6862] dark:text-[#A8A298] border-[#E5E0D8] dark:border-[#2A3630]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            branch.status === 'Active' ? 'bg-[#265938] dark:bg-[#84C799]' : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    {branch.status === 'Active'
                                                        ? t('common.active', { defaultValue: 'Active' })
                                                        : t('common.inactive', { defaultValue: 'Inactive' })}
                                                </span>
                                            </td>
                                            <td className="p-3 text-end whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingBranch(branch)}
                                                        title={t('common.view', { defaultValue: 'View Details' })}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(branch)}
                                                        title={t('common.edit', { defaultValue: 'Edit' })}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(branch)}
                                                        title={branch.status === 'Active' ? t('common.deactivate') : t('common.activate')}
                                                        className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29] transition-colors"
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingBranch(branch)}
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
                                    filteredBranches.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
                                } to ${Math.min(currentPage * pageSize, filteredBranches.length)} of ${
                                    filteredBranches.length
                                } entries`,
                                start: filteredBranches.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                                end: Math.min(currentPage * pageSize, filteredBranches.length),
                                total: filteredBranches.length,
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

            {/* Create / Edit Branch Drawer Modal */}
            {(isCreateOpen || editingBranch) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#2A3630] mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] flex items-center justify-center text-[#2D3F2C] dark:text-[#84C799]">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                        {editingBranch
                                            ? t('ums.branches.editBranch', { defaultValue: 'Edit Branch' })
                                            : t('ums.branches.addBranch', { defaultValue: 'Register New Branch' })}
                                    </h3>
                                    <p className="text-[11px] text-[#6E6862] dark:text-[#A8A298]">
                                        {formData.code || 'BRN-NEW'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingBranch(null);
                                }}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] dark:hover:bg-[#232E29]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={editingBranch ? handleSaveEdit : handleSaveCreate}
                            className="space-y-4"
                        >
                            {/* Code, CR Number & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.colCode', { defaultValue: 'Branch Code' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        readOnly={Boolean(editingBranch)}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        dir="ltr"
                                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#2D3F2C] dark:text-[#84C799] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.colCr', { defaultValue: 'CR Number' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.crNumber}
                                        onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                                        placeholder="e.g. 1010892019"
                                        dir="ltr"
                                        className={`w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.crNumber
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.crNumber && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.crNumber}</p>
                                    )}
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
                                        {t('ums.branches.form.nameEn', { defaultValue: 'Branch Name (English)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        placeholder="e.g. Riyadh Main Headquarters"
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
                                        {t('ums.branches.form.nameAr', { defaultValue: 'Branch Name (Arabic)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: المقر الرئيسي - الرياض"
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

                            {/* City (En / Ar) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.form.cityEn', { defaultValue: 'City (English)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cityEn}
                                        onChange={(e) => setFormData({ ...formData, cityEn: e.target.value })}
                                        placeholder="e.g. Riyadh"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.cityEn
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.cityEn && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.cityEn}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.form.cityAr', { defaultValue: 'City (Arabic)' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cityAr}
                                        onChange={(e) => setFormData({ ...formData, cityAr: e.target.value })}
                                        placeholder="مثال: الرياض"
                                        dir="rtl"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.cityAr
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.cityAr && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.cityAr}</p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Phone & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.form.phone', { defaultValue: 'Phone Number' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+966 11 450 8899"
                                        dir="ltr"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.phone
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.phone && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                        {t('ums.branches.form.email', { defaultValue: 'Contact Email' })} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="branch@awn.sa"
                                        dir="ltr"
                                        className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                            formErrors.email
                                                ? 'border-red-500'
                                                : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                        } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                    />
                                    {formErrors.email && (
                                        <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Addresses */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                    {t('ums.branches.form.addressEn', { defaultValue: 'Physical Address (English)' })} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.addressEn}
                                    onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                                    placeholder="Street, District, Building No, Postal Code..."
                                    className={`w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border ${
                                        formErrors.addressEn
                                            ? 'border-red-500'
                                            : 'border-[#E5E0D8] dark:border-[#2A3630]'
                                    } text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none`}
                                />
                                {formErrors.addressEn && (
                                    <p className="text-[11px] text-red-500 mt-1">{formErrors.addressEn}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] mb-1">
                                    {t('ums.branches.form.addressAr', { defaultValue: 'Physical Address (Arabic)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.addressAr}
                                    onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                                    placeholder="الشارع، الحي، رقم المبنى، الرمز البريدي..."
                                    dir="rtl"
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] focus:outline-none"
                                />
                            </div>

                            {/* Is Headquarter Checkbox */}
                            <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630]">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isHeadquarter}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isHeadquarter: e.target.checked })
                                        }
                                        className="mt-0.5 rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-0 cursor-pointer"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold text-[#0D0D0D] dark:text-[#F3F0EA] block">
                                            {t('ums.branches.form.designateHq', { defaultValue: 'Set as Primary Corporate Headquarters' })}
                                        </span>
                                        <span className="text-[11px] text-[#6E6862] dark:text-[#A8A298]">
                                            {t('ums.branches.form.designateHqNote', {
                                                defaultValue:
                                                    'Designating this branch will automatically transfer main enterprise headquarters governance from any previous HQ.',
                                            })}
                                        </span>
                                    </div>
                                </label>
                                {formErrors.isHeadquarter && (
                                    <p className="text-[11px] text-red-500 mt-2 font-medium">{formErrors.isHeadquarter}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D8] dark:border-[#2A3630]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingBranch(null);
                                    }}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    {t('common.cancel', { defaultValue: 'Cancel' })}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] dark:bg-[#265938] hover:bg-[#223121] text-white transition-colors"
                                >
                                    {editingBranch
                                        ? t('common.saveChanges', { defaultValue: 'Save Changes' })
                                        : t('common.create', { defaultValue: 'Register Branch' })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Drawer */}
            {viewingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#161D1A] border border-[#E5E0D8] dark:border-[#2A3630] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] dark:border-[#2A3630] mb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#2D3F2C] dark:text-[#84C799]">
                                    {viewingBranch.code}
                                </span>
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-[#F3F0EA]">
                                    {isRtl ? viewingBranch.nameAr : viewingBranch.nameEn}
                                </h3>
                                {viewingBranch.isHeadquarter && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#BFAB93]/20 text-[#8C6046] border border-[#BFAB93]/40">
                                        HQ
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingBranch(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.colNameEn', { defaultValue: 'English Name' })}:</span>
                                    <span className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">{viewingBranch.nameEn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.colNameAr', { defaultValue: 'Arabic Name' })}:</span>
                                    <span className="font-semibold text-[#0D0D0D] dark:text-[#F3F0EA]">{viewingBranch.nameAr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.colCity', { defaultValue: 'City' })}:</span>
                                    <span className="font-semibold">{isRtl ? viewingBranch.cityAr : viewingBranch.cityEn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.colCr', { defaultValue: 'CR Number' })}:</span>
                                    <span className="font-mono font-semibold" dir="ltr">{viewingBranch.crNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.form.phone', { defaultValue: 'Phone' })}:</span>
                                    <span className="font-mono" dir="ltr">{viewingBranch.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.form.email', { defaultValue: 'Email' })}:</span>
                                    <span dir="ltr">{viewingBranch.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('common.status', { defaultValue: 'Status' })}:</span>
                                    <span className="font-semibold">{viewingBranch.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">{t('ums.branches.colStaff', { defaultValue: 'Deployed Workforce' })}:</span>
                                    <span className="font-mono font-bold text-[#2D3F2C] dark:text-[#84C799]">
                                        {employeeCountByBranch[viewingBranch.id] || 0} employees
                                    </span>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('ums.branches.form.addressEn', { defaultValue: 'English Address' })}
                                </span>
                                <p className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] text-[#0D0D0D] dark:text-[#F3F0EA] text-[11px] leading-relaxed">
                                    {viewingBranch.addressEn}
                                </p>
                            </div>

                            {viewingBranch.addressAr && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.branches.form.addressAr', { defaultValue: 'Arabic Address' })}
                                    </span>
                                    <p className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] text-[#0D0D0D] dark:text-[#F3F0EA] text-[11px] leading-relaxed" dir="rtl">
                                        {viewingBranch.addressAr}
                                    </p>
                                </div>
                            )}

                            {/* Assigned Staff Preview */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1.5">
                                    {t('ums.branches.staffPreview', { defaultValue: 'Stationed Personnel' })} (
                                    {employeeCountByBranch[viewingBranch.id] || 0})
                                </span>
                                <div className="max-h-36 overflow-y-auto rounded-lg border border-[#E5E0D8] dark:border-[#2A3630] divide-y divide-[#F0ECE4] dark:divide-[#2A3630]">
                                    {employees.filter((e) => e.branchId === viewingBranch.id).length === 0 ? (
                                        <p className="p-3 text-[11px] text-center text-[#857E74] italic">
                                            {t('ums.branches.noStaffAssigned', { defaultValue: 'No employees currently registered at this location.' })}
                                        </p>
                                    ) : (
                                        employees
                                            .filter((e) => e.branchId === viewingBranch.id)
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
                                onClick={() => setViewingBranch(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF8F5] dark:bg-[#1C2521] border border-[#E5E0D8] dark:border-[#2A3630] text-[#0D0D0D] dark:text-[#F3F0EA] hover:bg-[#EFECE6]"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation / Dependency Warning Dialog */}
            {deletingBranch && (() => {
                const eligibility = checkBranchDeletionEligibility(
                    deletingBranch.id,
                    branches,
                    employees
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
                                            ? t('ums.branches.deleteTitle', { defaultValue: 'Delete Branch' })
                                            : t('ums.branches.deleteBlockedTitle', { defaultValue: 'Branch Deletion Blocked' })}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] dark:text-[#A8A298]">
                                        {deletingBranch.nameEn} ({deletingBranch.code})
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-[#45413C] dark:text-[#DCD6CD] mb-5 leading-relaxed">
                                {eligibility.canDelete
                                    ? t('ums.branches.deleteConfirmDesc', {
                                          defaultValue:
                                              'Are you sure you want to delete this branch? This location and its Commercial Registration record will be permanently deleted.',
                                      })
                                    : isRtl
                                    ? eligibility.reasonAr
                                    : eligibility.reasonEn}
                            </p>

                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeletingBranch(null)}
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
                                            handleToggleStatus(deletingBranch);
                                            setDeletingBranch(null);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white transition-colors"
                                    >
                                        {t('common.deactivateInstead', { defaultValue: 'Deactivate Branch' })}
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
