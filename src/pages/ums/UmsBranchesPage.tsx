import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
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
    Phone,
    Mail,
    ShieldAlert,
    Landmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    BranchForm,
    type BranchFormData,
} from '../../components/ums/BranchForm';
import { umsApi } from '../../api/umsApi';
import {
    loadBranches,
    loadEmployees,
    generateNextBranchCode,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    syncMasterEntityEmployeeCounts,
    type BranchRecord,
    type EmployeeRecord,
} from './umsMockData';

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
    const queryClient = useQueryClient();

    // Server / Persisted State via TanStack Query & umsApi
    const { data: branches = [] } = useQuery<BranchRecord[]>({
        queryKey: ['ums', 'branches'],
        queryFn: async () => umsApi.listBranches(),
        initialData: () => loadBranches(),
    });

    const { data: employees = [] } = useQuery<EmployeeRecord[]>({
        queryKey: ['ums', 'employees'],
        queryFn: async () => {
            const res = await umsApi.listEmployees();
            return res.ok && res.data ? res.data : loadEmployees();
        },
        initialData: () => loadEmployees(),
    });

    //Filter & Pagination State
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
        const map = new Map<string, { cityEn: string; cityAr: string }>();
        for (const b of branches) {
            if (b.cityEn && !map.has(b.cityEn)) {
                map.set(b.cityEn, { cityEn: b.cityEn, cityAr: b.cityAr || b.cityEn });
            }
        }
        return Array.from(map.values());
    }, [branches]);

    const invalidateBranchQueries = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['ums', 'branches'] });
        queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
    }, [queryClient]);

    // Mutations via TanStack Mutation & umsApi
    const saveBranchMutation = useMutation({
        mutationFn: async ({
            branch,
            isEditing,
        }: {
            branch: BranchRecord;
            isEditing: boolean;
        }) => {
            const currentBranches = umsApi.listBranches();
            let updatedList: BranchRecord[];

            if (isEditing) {
                if (branch.isHeadquarter) {
                    updatedList = currentBranches.map((b) =>
                        b.id === branch.id ? branch : { ...b, isHeadquarter: false }
                    );
                } else {
                    updatedList = currentBranches.map((b) =>
                        b.id === branch.id ? branch : b
                    );
                }
            } else {
                if (branch.isHeadquarter) {
                    updatedList = [
                        branch,
                        ...currentBranches.map((b) => ({ ...b, isHeadquarter: false })),
                    ];
                } else {
                    updatedList = [branch, ...currentBranches];
                }
            }

            umsApi.saveBranches(updatedList);
            syncMasterEntityEmployeeCounts(loadEmployees());
            return { branch, isEditing };
        },
        onSuccess: ({ branch, isEditing }) => {
            invalidateBranchQueries();

            if (isEditing) {
                recordUmsAuditEvent({
                    action: 'UPDATED',
                    resource: 'Branch',
                    resourceId: branch.id,
                    resourceName: branch.nameEn,
                    detailsEn: `Updated branch details for ${branch.nameEn} (${branch.code})${
                        branch.isHeadquarter ? ' - updated as Headquarters' : ''
                    }.`,
                    detailsAr: `تحديث بيانات الفرع ${branch.nameAr} (${branch.code})${
                        branch.isHeadquarter ? ' - وتعيينه كمقر رئيسي' : ''
                    }.`,
                });

                toast.success(
                    t('ums.branches.feedback.updated', {
                        defaultValue: `Branch ${branch.nameEn} updated successfully.`,
                        name: branch.nameEn,
                    })
                );
                setEditingBranch(null);
            } else {
                recordUmsAuditEvent({
                    action: 'CREATED',
                    resource: 'Branch',
                    resourceId: branch.id,
                    resourceName: branch.nameEn,
                    detailsEn: `Registered new branch ${branch.nameEn} (${branch.code}) in ${branch.cityEn} [CR: ${branch.crNumber}]${
                        branch.isHeadquarter ? ' designated as Headquarters' : ''
                    }.`,
                    detailsAr: `تسجيل فرع جديد ${branch.nameAr} (${branch.code}) في ${branch.cityAr} [س.ت: ${branch.crNumber}]${
                        branch.isHeadquarter ? ' وتعيينه كمقر رئيسي' : ''
                    }.`,
                });

                toast.success(
                    t('ums.branches.feedback.created', {
                        defaultValue: `Branch ${branch.nameEn} created successfully.`,
                        name: branch.nameEn,
                    })
                );
                setIsCreateOpen(false);
            }
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (branch: BranchRecord) => {
            const nextStatus: 'Active' | 'Inactive' =
                branch.status === 'Active' ? 'Inactive' : 'Active';
            const currentBranches = umsApi.listBranches();
            const updated = currentBranches.map((b) =>
                b.id === branch.id ? { ...b, status: nextStatus } : b
            );
            umsApi.saveBranches(updated);
            syncMasterEntityEmployeeCounts(loadEmployees());
            return { branch, nextStatus };
        },
        onSuccess: ({ branch, nextStatus }) => {
            invalidateBranchQueries();

            recordUmsAuditEvent({
                action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
                resource: 'Branch',
                resourceId: branch.id,
                resourceName: branch.nameEn,
                detailsEn: `Changed branch status of ${branch.nameEn} to ${nextStatus}.`,
                detailsAr: `تغيير حالة الفرع ${branch.nameAr} إلى ${
                    nextStatus === 'Active' ? 'مفعّل' : 'معطّل'
                }.`,
            });

            toast.info(
                t('ums.branches.feedback.statusChanged', {
                    defaultValue: `Branch status changed to ${nextStatus}.`,
                    status: nextStatus,
                })
            );
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const deleteBranchMutation = useMutation({
        mutationFn: async (branch: BranchRecord) => {
            const eligibility = umsApi.checkBranchDeletionEligibility(
                branch.id,
                branches,
                employees
            );
            if (!eligibility.canDelete) {
                throw new Error(
                    (isRtl ? eligibility.reasonAr : eligibility.reasonEn) ||
                        'Cannot delete branch with active dependencies.'
                );
            }
            const updated = umsApi.listBranches().filter((b) => b.id !== branch.id);
            umsApi.saveBranches(updated);
            syncMasterEntityEmployeeCounts(loadEmployees());
            return branch;
        },
        onSuccess: (deleted) => {
            invalidateBranchQueries();

            recordUmsAuditEvent({
                action: 'DELETED',
                resource: 'Branch',
                resourceId: deleted.id,
                resourceName: deleted.nameEn,
                detailsEn: `Deleted branch ${deleted.nameEn} (${deleted.code}).`,
                detailsAr: `حذف الفرع ${deleted.nameAr} (${deleted.code}) نهائياً.`,
            });

            toast.success(
                t('ums.branches.feedback.deleted', {
                    defaultValue: `Branch ${deleted.nameEn} deleted successfully.`,
                    name: deleted.nameEn,
                })
            );
            setDeletingBranch(null);
        },
        onError: (err: Error) => {
            toast.error(err.message);
            setDeletingBranch(null);
        },
    });

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

    const paginatedBranches = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredBranches.slice(start, start + pageSize);
    }, [filteredBranches, currentPage, pageSize]);

    // Select-all logic
    const isAllSelected =
        paginatedBranches.length > 0 &&
        paginatedBranches.every((b) => selectedIds.includes(b.id));

    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            const pageIds = new Set(paginatedBranches.map((b) => b.id));
            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
        } else {
            const pageIds = paginatedBranches.map((b) => b.id);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    }, [isAllSelected, paginatedBranches]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

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
    const handleOpenEdit = useCallback((branch: BranchRecord) => {
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
    }, []);

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingBranch(null);
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
                    defaultValue:
                        'You cannot uncheck Headquarters for the only active HQ branch. Designate another branch as HQ first.',
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

        saveBranchMutation.mutate({ branch: newBranch, isEditing: false });
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

        saveBranchMutation.mutate({ branch: updatedBranch, isEditing: true });
    };

    // Toggle Status (Active / Inactive)
    const handleToggleStatus = useCallback(
        (branch: BranchRecord) => {
            toggleStatusMutation.mutate(branch);
        },
        [toggleStatusMutation]
    );

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingBranch) return;
        deleteBranchMutation.mutate(deletingBranch);
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
            escapeSafeCsvCell(b.code),
            escapeSafeCsvCell(b.nameEn),
            escapeSafeCsvCell(b.nameAr),
            escapeSafeCsvCell(b.cityEn),
            escapeSafeCsvCell(b.cityAr),
            escapeSafeCsvCell(b.crNumber),
            escapeSafeCsvCell(b.isHeadquarter ? 'YES' : 'NO'),
            escapeSafeCsvCell(b.phone),
            escapeSafeCsvCell(b.email),
            employeeCountByBranch[b.id] || 0,
            escapeSafeCsvCell(b.status),
            escapeSafeCsvCell(b.createdAt),
            escapeSafeCsvCell(b.addressEn || ''),
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

        toast.success(
            t('ums.branches.feedback.exported', {
                defaultValue: 'Branches exported successfully.',
            })
        );
    };

    // Shared DataTable Column Definitions
    const columns: ColumnDef<any, BranchRecord>[] = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <div className="flex justify-center">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            aria-label="Select all branches"
                            className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer"
                        />
                    </div>
                ),
                cell: ({ row }) => {
                    const branch = row.original;
                    const isSelected = selectedIds.includes(branch.id);
                    return (
                        <div className="flex justify-center">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(branch.id)}
                                aria-label={`Select branch ${branch.nameEn}`}
                                className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer"
                            />
                        </div>
                    );
                },
            },
            {
                id: 'code',
                header: () => t('ums.branches.colCode', { defaultValue: 'Code' }),
                cell: ({ row }) => (
                    <span
                        className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono font-semibold text-xs text-[#037F8C] whitespace-nowrap"
                        dir="ltr"
                    >
                        {row.original.code}
                    </span>
                ),
            },
            {
                id: 'name',
                header: () => t('ums.branches.colName', { defaultValue: 'Branch Name' }),
                cell: ({ row }) => {
                    const branch = row.original;
                    return (
                        <div>
                            <div className="flex items-center gap-1.5 font-semibold text-[#0D0D0D]">
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
                        </div>
                    );
                },
            },
            {
                id: 'city',
                header: () => t('ums.branches.colCity', { defaultValue: 'City & Location' }),
                cell: ({ row }) => {
                    const branch = row.original;
                    return (
                        <div>
                            <div className="font-medium text-[#0D0D0D]">
                                {isRtl ? branch.cityAr : branch.cityEn}
                            </div>
                            <div className="text-[11px] text-[#857E74] truncate max-w-xs">
                                {isRtl ? branch.addressAr : branch.addressEn}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'crNumber',
                header: () => t('ums.branches.colCr', { defaultValue: 'CR Number' }),
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#0D0D0D] whitespace-nowrap" dir="ltr">
                        {row.original.crNumber}
                    </span>
                ),
            },
            {
                id: 'contact',
                header: () => t('ums.branches.colContact', { defaultValue: 'Contact Info' }),
                cell: ({ row }) => {
                    const branch = row.original;
                    return (
                        <div className="text-[11px] space-y-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[#45413C]">
                                <Phone size={11} className="text-[#857E74]" />
                                <span dir="ltr">{branch.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#45413C]">
                                <Mail size={11} className="text-[#857E74]" />
                                <span dir="ltr">{branch.email}</span>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'staff',
                header: () => (
                    <div className="text-center">
                        {t('ums.branches.colStaff', { defaultValue: 'Staff' })}
                    </div>
                ),
                cell: ({ row }) => {
                    const assignedCount = employeeCountByBranch[row.original.id] || 0;
                    return (
                        <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                                <Users size={11} />
                                <span>{assignedCount}</span>
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                header: () => (
                    <div className="text-center">
                        {t('common.status', { defaultValue: 'Status' })}
                    </div>
                ),
                cell: ({ row }) => {
                    const branch = row.original;
                    return (
                        <div className="flex justify-center">
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    branch.status === 'Active'
                                        ? 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25'
                                        : 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        branch.status === 'Active'
                                            ? 'bg-[#037F8C]'
                                            : 'bg-[#857E74]'
                                    }`}
                                />
                                {branch.status === 'Active'
                                    ? t('common.active', { defaultValue: 'Active' })
                                    : t('common.inactive', { defaultValue: 'Inactive' })}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">
                        {t('common.actions', { defaultValue: 'Actions' })}
                    </div>
                ),
                cell: ({ row }) => {
                    const branch = row.original;
                    return (
                        <div className="flex justify-end whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setViewingBranch(branch)}
                                    title={t('common.view', { defaultValue: 'View Details' })}
                                    className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenEdit(branch)}
                                    title={t('common.edit', { defaultValue: 'Edit' })}
                                    className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleStatus(branch)}
                                    title={
                                        branch.status === 'Active'
                                            ? t('common.deactivate')
                                            : t('common.activate')
                                    }
                                    className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                                >
                                    <Power size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingBranch(branch)}
                                    title={t('common.delete', { defaultValue: 'Delete' })}
                                    className="p-1.5 rounded-md text-[#A63A3A] hover:bg-[#FDF2F2] transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                },
            },
        ],
        [
            t,
            isRtl,
            isAllSelected,
            selectedIds,
            employeeCountByBranch,
            handleSelectAll,
            handleToggleSelect,
            handleOpenEdit,
            handleToggleStatus,
        ]
    );

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.branches.title', { defaultValue: 'Branches & Locations' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            BRN-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('common.export', { defaultValue: 'Export' })}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={15} />
                        <span>{t('ums.branches.addBranch', { defaultValue: 'Add Branch' })}</span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.branches.kpi.total', { defaultValue: 'Total Locations' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <MapPin size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.branches.kpi.operatingSites', {
                                defaultValue: 'operating sites',
                            })}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.branches.kpi.active', { defaultValue: 'Active Sites' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/25 flex items-center justify-center text-[#037F8C]">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#037F8C]">
                            {kpis.active}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% operational
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.branches.kpi.hq', { defaultValue: 'Main Headquarters' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#8C6046]">
                            <Landmark size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-base font-bold text-[#0D0D0D] truncate">
                            {kpis.hqBranch
                                ? isRtl
                                    ? kpis.hqBranch.cityAr
                                    : kpis.hqBranch.cityEn
                                : 'Not Set'}
                        </span>
                        <span className="text-[11px] font-mono text-[#037F8C]">
                            {kpis.hqBranch?.code || '—'}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.branches.kpi.workforce', { defaultValue: 'Branch Workforce' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                            {kpis.totalAssignedStaff}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.branches.kpi.totalHeadcount', {
                                defaultValue: 'deployed staff',
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
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
                                defaultValue:
                                    'Search by branch name, code, city, CR number, phone, email...',
                            })}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
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
                            aria-label={t('ums.branches.filterCity', {
                                defaultValue: 'Filter by City',
                            })}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">
                                {t('common.allCities', { defaultValue: 'All Cities' })}
                            </option>
                            {availableCities.map((c) => (
                                <option key={c.cityEn} value={c.cityEn}>
                                    {isRtl ? c.cityAr : c.cityEn}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(
                                    e.target.value as 'ALL' | 'Active' | 'Inactive'
                                );
                                setCurrentPage(1);
                            }}
                            aria-label={t('common.status', { defaultValue: 'Status' })}
                            className="px-3 py-2 text-xs rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] focus:outline-none cursor-pointer"
                        >
                            <option value="ALL">
                                {t('common.allStatus', { defaultValue: 'All Statuses' })}
                            </option>
                            <option value="Active">
                                {t('common.active', { defaultValue: 'Active' })}
                            </option>
                            <option value="Inactive">
                                {t('common.inactive', { defaultValue: 'Inactive' })}
                            </option>
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
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.resetFilters', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Card via Shared DataTable */}
            <DataTable
                columns={columns}
                data={paginatedBranches}
                count={filteredBranches.length}
                pageIndex={currentPage - 1}
                pageSize={pageSize}
                onPageChange={(newPageIdx) => setCurrentPage(newPageIdx + 1)}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                }}
                searchValue={searchQuery}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder={t('ums.branches.searchPlaceholder', {
                    defaultValue:
                        'Search by branch name, code, city, CR number, phone, email...',
                })}
                title={t('ums.branches.title', { defaultValue: 'Branches & Locations' })}
                description={t('ums.branches.subtitle', {
                    defaultValue:
                        'Corporate headquarters, regional branches, commercial registrations, and site contacts.',
                })}
                onAddNew={handleOpenCreate}
                addNewLabel={t('ums.branches.addBranch', { defaultValue: 'Add Branch' })}
                onExport={handleExportCsv}
            />

            {/* Standalone Create / Edit Branch Form Component */}
            <BranchForm
                isOpen={isCreateOpen || Boolean(editingBranch)}
                isEditing={Boolean(editingBranch)}
                formData={formData}
                formErrors={formErrors}
                isSubmitting={saveBranchMutation.isPending}
                onChange={setFormData}
                onClose={handleCloseForm}
                onSubmit={editingBranch ? handleSaveEdit : handleSaveCreate}
            />

            {/* View Details Drawer */}
            {viewingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C]">
                                    {viewingBranch.code}
                                </span>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
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
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.colNameEn', {
                                            defaultValue: 'English Name',
                                        })}
                                        :
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {viewingBranch.nameEn}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.colNameAr', {
                                            defaultValue: 'Arabic Name',
                                        })}
                                        :
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {viewingBranch.nameAr}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.colCity', { defaultValue: 'City' })}:
                                    </span>
                                    <span className="font-semibold">
                                        {isRtl ? viewingBranch.cityAr : viewingBranch.cityEn}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.colCr', { defaultValue: 'CR Number' })}:
                                    </span>
                                    <span className="font-mono font-semibold" dir="ltr">
                                        {viewingBranch.crNumber}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.form.phone', { defaultValue: 'Phone' })}:
                                    </span>
                                    <span className="font-mono" dir="ltr">
                                        {viewingBranch.phone}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.form.email', { defaultValue: 'Email' })}:
                                    </span>
                                    <span dir="ltr">{viewingBranch.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('common.status', { defaultValue: 'Status' })}:
                                    </span>
                                    <span className="font-semibold">
                                        {viewingBranch.status === 'Active'
                                            ? t('common.active', { defaultValue: 'Active' })
                                            : t('common.inactive', { defaultValue: 'Inactive' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.branches.colStaff', {
                                            defaultValue: 'Deployed Workforce',
                                        })}
                                        :
                                    </span>
                                    <span className="font-mono font-bold text-[#037F8C]">
                                        {employeeCountByBranch[viewingBranch.id] || 0}{' '}
                                        {t('ums.departments.staffCountSuffix', {
                                            defaultValue: 'employees',
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('ums.branches.form.addressEn', {
                                        defaultValue: 'English Address',
                                    })}
                                </span>
                                <p className="p-2.5 rounded-lg bg-[#FAF8F5] text-[#0D0D0D] text-[11px] leading-relaxed">
                                    {viewingBranch.addressEn}
                                </p>
                            </div>

                            {viewingBranch.addressAr && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.branches.form.addressAr', {
                                            defaultValue: 'Arabic Address',
                                        })}
                                    </span>
                                    <p
                                        className="p-2.5 rounded-lg bg-[#FAF8F5] text-[#0D0D0D] text-[11px] leading-relaxed"
                                        dir="rtl"
                                    >
                                        {viewingBranch.addressAr}
                                    </p>
                                </div>
                            )}

                            {/* Assigned Staff Preview */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1.5">
                                    {t('ums.branches.staffPreview', {
                                        defaultValue: 'Stationed Personnel',
                                    })}{' '}
                                    ({employeeCountByBranch[viewingBranch.id] || 0})
                                </span>
                                <div className="max-h-36 overflow-y-auto rounded-lg border border-[#E5E0D8] divide-y divide-[#F0ECE4]">
                                    {employees.filter((e) => e.branchId === viewingBranch.id)
                                        .length === 0 ? (
                                        <p className="p-3 text-[11px] text-center text-[#857E74] italic">
                                            {t('ums.branches.noStaffAssigned', {
                                                defaultValue:
                                                    'No employees currently registered at this location.',
                                            })}
                                        </p>
                                    ) : (
                                        employees
                                            .filter((e) => e.branchId === viewingBranch.id)
                                            .map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="p-2 flex items-center justify-between text-[11px]"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D]">
                                                            {isRtl ? emp.nameAr : emp.nameEn}
                                                        </span>
                                                        <span className="ms-2 font-mono text-[10px] text-[#857E74]">
                                                            {emp.code}
                                                        </span>
                                                        <span className="block text-[10px] text-[#6E6862]">
                                                            {isRtl
                                                                ? emp.departmentNameAr ||
                                                                  emp.departmentName
                                                                : emp.departmentName}
                                                        </span>
                                                    </div>
                                                    <span className="text-[#6E6862]">
                                                        {emp.phone}
                                                    </span>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingBranch(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] hover:bg-[#EFECE6]"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation / Dependency Warning Dialog */}
            {deletingBranch &&
                (() => {
                    const eligibility = umsApi.checkBranchDeletionEligibility(
                        deletingBranch.id,
                        branches,
                        employees
                    );

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                            <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
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
                                        <h3 className="text-sm font-bold text-[#0D0D0D]">
                                            {eligibility.canDelete
                                                ? t('ums.branches.deleteTitle', {
                                                      defaultValue: 'Delete Branch',
                                                  })
                                                : t('ums.branches.deleteBlockedTitle', {
                                                      defaultValue: 'Branch Deletion Blocked',
                                                  })}
                                        </h3>
                                        <p className="text-xs text-[#6E6862]">
                                            {deletingBranch.nameEn} ({deletingBranch.code})
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-[#45413C] mb-5 leading-relaxed">
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
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E5E0D8] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors"
                                    >
                                        {t('common.cancel', { defaultValue: 'Cancel' })}
                                    </button>
                                    {eligibility.canDelete ? (
                                        <button
                                            type="button"
                                            disabled={deleteBranchMutation.isPending}
                                            onClick={handleConfirmDelete}
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#A63A3A] hover:bg-[#882b2b] text-white transition-colors disabled:opacity-50"
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
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white transition-colors"
                                        >
                                            {t('common.deactivateInstead', {
                                                defaultValue: 'Deactivate Branch',
                                            })}
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
