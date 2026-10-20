import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
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
    User,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    DepartmentForm,
    type DepartmentFormData,
} from '../../components/ums/DepartmentForm';
import { umsApi } from '../../api/umsApi';
import {
    loadDepartments,
    loadEmployees,
    loadDesignations,
    generateNextDepartmentCode,
    checkDepartmentDeletionEligibility,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    type DepartmentRecord,
    type EmployeeRecord,
} from './umsMockData';

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
    const queryClient = useQueryClient();

    // Server / Persisted State via TanStack Query & umsApi
    const { data: departments = [] } = useQuery<DepartmentRecord[]>({
        queryKey: ['ums', 'departments'],
        queryFn: async () => {
            const res = await umsApi.listDepartments();
            return res.ok && res.data ? res.data : loadDepartments();
        },
        initialData: () => loadDepartments(),
    });

    const { data: employees = [] } = useQuery<EmployeeRecord[]>({
        queryKey: ['ums', 'employees'],
        queryFn: async () => {
            const res = await umsApi.listEmployees();
            return res.ok && res.data ? res.data : loadEmployees();
        },
        initialData: () => loadEmployees(),
    });

    const { data: designations = [] } = useQuery({
        queryKey: ['ums', 'designations'],
        queryFn: async () => umsApi.listDesignations(),
        initialData: () => loadDesignations(),
    });

    // Mutations via TanStack Mutation & umsApi
    const upsertDepartmentMutation = useMutation({
        mutationFn: async (department: DepartmentRecord) => {
            const res = await umsApi.upsertDepartment(department);
            if (!res.ok) {
                throw new Error(
                    (isRtl ? res.messageAr || res.messageEn : res.messageEn) ||
                        'Failed to save department.'
                );
            }
            return res.data || department;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'departments'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
        },
    });

    const deleteDepartmentMutation = useMutation({
        mutationFn: async (deptId: string) => {
            const res = await umsApi.deleteDepartment(deptId);
            if (!res.ok) {
                throw new Error(
                    (isRtl ? res.messageAr || res.messageEn : res.messageEn) ||
                        'Failed to delete department.'
                );
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'departments'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
        },
    });

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

    // Resolve live Department Head display name in active language
    const resolveHeadDisplayName = useCallback(
        (dept: DepartmentRecord): string | undefined => {
            if (dept.headEmployeeId) {
                const headEmp = employees.find((e) => e.id === dept.headEmployeeId);
                if (headEmp) {
                    return isRtl ? headEmp.nameAr || headEmp.nameEn : headEmp.nameEn;
                }
            }
            return dept.headEmployeeName;
        },
        [employees, isRtl]
    );

    // Filtered & Paginated records
    const filteredDepartments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return departments.filter((dept) => {
            if (statusFilter !== 'ALL' && dept.status !== statusFilter) {
                return false;
            }
            if (!query) return true;
            const headEmp = dept.headEmployeeId
                ? employees.find((e) => e.id === dept.headEmployeeId)
                : undefined;
            return (
                dept.code.toLowerCase().includes(query) ||
                dept.nameEn.toLowerCase().includes(query) ||
                dept.nameAr.toLowerCase().includes(query) ||
                (dept.headEmployeeName && dept.headEmployeeName.toLowerCase().includes(query)) ||
                (headEmp &&
                    (headEmp.nameEn.toLowerCase().includes(query) ||
                        headEmp.nameAr.toLowerCase().includes(query))) ||
                dept.descriptionEn.toLowerCase().includes(query) ||
                dept.descriptionAr.toLowerCase().includes(query)
            );
        });
    }, [departments, employees, searchQuery, statusFilter]);

    const paginatedDepartments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDepartments.slice(start, start + pageSize);
    }, [filteredDepartments, currentPage, pageSize]);

    // Select-all logic
    const isAllSelected =
        paginatedDepartments.length > 0 &&
        paginatedDepartments.every((d) => selectedIds.includes(d.id));

    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            const pageIds = new Set(paginatedDepartments.map((d) => d.id));
            setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
        } else {
            const pageIds = paginatedDepartments.map((d) => d.id);
            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    }, [isAllSelected, paginatedDepartments]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

    // Open Create Modal
    const handleOpenCreate = () => {
        setFormData({
            ...DEFAULT_FORM,
            code: generateNextDepartmentCode(departments),
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = useCallback((dept: DepartmentRecord) => {
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
    }, []);

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingDepartment(null);
        setFormErrors({});
    };

    // Form Validation
    const validateForm = (isEditing = false, editId?: string) => {
        const errors: Record<string, string> = {};
        if (!formData.nameEn.trim() || formData.nameEn.trim().length < 2) {
            errors.nameEn = t('ums.departments.validation.nameEnRequired', {
                defaultValue: 'English department name is required.',
            });
        }
        if (!formData.nameAr.trim() || formData.nameAr.trim().length < 2) {
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
        const rawCode = formData.code.trim();
        const resolvedCode = /^DEP-\d{3,}$/i.test(rawCode)
            ? rawCode.toUpperCase()
            : generateNextDepartmentCode(departments);

        const newDept: DepartmentRecord = {
            id: `dep-${Date.now()}`,
            code: resolvedCode,
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            headEmployeeId: headEmp ? headEmp.id : undefined,
            headEmployeeName: headEmp ? headEmp.nameEn : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
        };

        upsertDepartmentMutation.mutate(newDept, {
            onSuccess: () => {
                recordUmsAuditEvent({
                    action: 'CREATED',
                    resource: 'Department',
                    resourceId: newDept.id,
                    resourceName: newDept.nameEn,
                    detailsEn: `Created department ${newDept.nameEn} (${newDept.code}) with head: ${newDept.headEmployeeName || 'None'}.`,
                    detailsAr: `إنشاء قسم جديد ${newDept.nameAr} (${newDept.code}) برئاسة: ${headEmp ? headEmp.nameAr : 'غير محدد'}.`,
                });

                toast.success(
                    t('ums.departments.feedback.created', {
                        defaultValue: `Department ${newDept.nameEn} created successfully.`,
                        name: newDept.nameEn,
                    })
                );
                setIsCreateOpen(false);
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : 'Failed to create department.');
            },
        });
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
            headEmployeeName: headEmp ? headEmp.nameEn : undefined,
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: employeeCountByDept[editingDepartment.id] || 0,
        };

        upsertDepartmentMutation.mutate(updatedDept, {
            onSuccess: () => {
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
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : 'Failed to update department.');
            },
        });
    };

    // Toggle Status (Active / Inactive)
    const handleToggleStatus = useCallback(
        (dept: DepartmentRecord) => {
            const nextStatus: 'Active' | 'Inactive' =
                dept.status === 'Active' ? 'Inactive' : 'Active';
            const updatedDept: DepartmentRecord = {
                ...dept,
                status: nextStatus,
            };

            upsertDepartmentMutation.mutate(updatedDept, {
                onSuccess: () => {
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
                },
                onError: (err) => {
                    toast.error(
                        err instanceof Error ? err.message : 'Failed to change department status.'
                    );
                },
            });
        },
        [t, upsertDepartmentMutation]
    );

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

        const target = deletingDepartment;
        deleteDepartmentMutation.mutate(target.id, {
            onSuccess: () => {
                recordUmsAuditEvent({
                    action: 'DELETED',
                    resource: 'Department',
                    resourceId: target.id,
                    resourceName: target.nameEn,
                    detailsEn: `Permanently removed department ${target.nameEn} (${target.code}).`,
                    detailsAr: `حذف القسم ${target.nameAr} (${target.code}) نهائياً.`,
                });

                toast.success(
                    t('ums.departments.feedback.deleted', {
                        defaultValue: `Department ${target.nameEn} deleted successfully.`,
                        name: target.nameEn,
                    })
                );
                setDeletingDepartment(null);
            },
            onError: (err) => {
                toast.error(err instanceof Error ? err.message : 'Failed to delete department.');
                setDeletingDepartment(null);
            },
        });
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
            escapeSafeCsvCell(d.code),
            escapeSafeCsvCell(d.nameEn),
            escapeSafeCsvCell(d.nameAr),
            escapeSafeCsvCell(d.headEmployeeName || 'N/A'),
            employeeCountByDept[d.id] || 0,
            escapeSafeCsvCell(d.status),
            escapeSafeCsvCell(d.createdAt),
            escapeSafeCsvCell(d.descriptionEn || ''),
        ]);

        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `AWN_Departments_${new Date().toISOString().slice(0, 10)}.csv`
        );
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

        toast.success(
            t('ums.departments.feedback.exported', {
                defaultValue: 'Departments exported successfully.',
            })
        );
    };

    // Shared DataTable column definitions
    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <div className="text-center">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            aria-label="Select all departments"
                            className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer"
                        />
                    </div>
                ),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    const isSelected = selectedIds.includes(dept.id);
                    return (
                        <div className="text-center">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(dept.id)}
                                aria-label={`Select department ${dept.nameEn}`}
                                className="rounded border-[#D6CFC4] text-[#037F8C] focus:ring-0 cursor-pointer"
                            />
                        </div>
                    );
                },
            },
            {
                accessorKey: 'code',
                header: t('ums.departments.colCode', { defaultValue: 'Code' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    return (
                        <span
                            className="font-mono font-semibold text-xs text-[#037F8C] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            {dept.code}
                        </span>
                    );
                },
            },
            {
                id: 'name',
                header: t('ums.departments.colName', { defaultValue: 'Department Name' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    return (
                        <div>
                            <div className="font-semibold text-xs text-[#0D0D0D]">
                                {isRtl ? dept.nameAr : dept.nameEn}
                            </div>
                            <div className="text-[11px] text-[#857E74] font-normal">
                                {isRtl ? dept.nameEn : dept.nameAr}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'head',
                header: t('ums.departments.colHead', { defaultValue: 'Department Head' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    const headDisplayName = resolveHeadDisplayName(dept);
                    return headDisplayName ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#037F8C]">
                            <User size={12} className="text-[#857E74]" />
                            <span className="font-medium">{headDisplayName}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-[#857E74] italic">
                            {t('common.notAssigned', { defaultValue: 'Not Assigned' })}
                        </span>
                    );
                },
            },
            {
                id: 'headcount',
                header: t('ums.departments.colStaff', { defaultValue: 'Headcount' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    const assignedCount = employeeCountByDept[dept.id] || 0;
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                            <Users size={11} />
                            <span>{assignedCount}</span>
                        </span>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: t('common.status', { defaultValue: 'Status' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    return (
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                dept.status === 'Active'
                                    ? 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25'
                                    : 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    dept.status === 'Active' ? 'bg-[#037F8C]' : 'bg-[#857E74]'
                                }`}
                            />
                            {dept.status === 'Active'
                                ? t('common.active', { defaultValue: 'Active' })
                                : t('common.inactive', { defaultValue: 'Inactive' })}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: t('common.actions', { defaultValue: 'Actions' }),
                cell: ({ row }) => {
                    const dept = row.original as DepartmentRecord;
                    return (
                        <div className="inline-flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setViewingDepartment(dept)}
                                title={t('common.view', { defaultValue: 'View Details' })}
                                className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenEdit(dept)}
                                title={t('common.edit', { defaultValue: 'Edit' })}
                                className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(dept)}
                                title={
                                    dept.status === 'Active'
                                        ? t('common.deactivate')
                                        : t('common.activate')
                                }
                                className="p-1.5 rounded-md text-[#595550] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                            >
                                <Power size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingDepartment(dept)}
                                title={t('common.delete', { defaultValue: 'Delete' })}
                                className="p-1.5 rounded-md text-[#A63A3A] hover:bg-[#FDF2F2] transition-colors"
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
            isAllSelected,
            selectedIds,
            employeeCountByDept,
            handleSelectAll,
            handleToggleSelect,
            handleOpenEdit,
            handleToggleStatus,
            resolveHeadDisplayName,
        ]
    );

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.departments.title', { defaultValue: 'Departments Master' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            DEP-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
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
                        <span>
                            {t('ums.departments.addDepartment', {
                                defaultValue: 'Add Department',
                            })}
                        </span>
                    </button>
                </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.departments.kpi.total', { defaultValue: 'Total Departments' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <Building2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#0D0D0D]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.departments.kpi.units', { defaultValue: 'active divisions' })}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.departments.kpi.active', { defaultValue: 'Active Divisions' })}
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
                            {kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}%
                            operational
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.departments.kpi.inactive', {
                                defaultValue: 'Inactive Divisions',
                            })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] border border-[#A63A3A]/25 flex items-center justify-center text-[#A63A3A]">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[#6E6862]">
                            {kpis.inactive}
                        </span>
                        <span className="text-[11px] text-[#857E74]">
                            {t('ums.departments.kpi.suspended', { defaultValue: 'deactivated' })}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.departments.kpi.workforce', {
                                defaultValue: 'Assigned Workforce',
                            })}
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
                            {t('ums.departments.kpi.employeesTotal', {
                                defaultValue: 'total headcount',
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
                            placeholder={t('ums.departments.searchPlaceholder', {
                                defaultValue:
                                    'Search by department name, code, leader, or description...',
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

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'ALL' | 'Active' | 'Inactive');
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

                        {(searchQuery || statusFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('ALL');
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

            {/* Table Card using Shared DataTable */}
            <DataTable
                columns={columns}
                data={paginatedDepartments}
                count={filteredDepartments.length}
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
                searchPlaceholder={t('ums.departments.searchPlaceholder', {
                    defaultValue:
                        'Search by department name, code, leader, or description...',
                })}
                title={t('ums.departments.title', { defaultValue: 'Departments Master' })}
                description={t('ums.departments.subtitle', {
                    defaultValue:
                        'Organizational departments, assigned leadership, and workforce allocations.',
                })}
                onAddNew={handleOpenCreate}
                addNewLabel={t('ums.departments.addDepartment', {
                    defaultValue: 'Add Department',
                })}
                onExport={handleExportCsv}
            />

            {/* Extracted Standalone Department Form Modal */}
            <DepartmentForm
                isOpen={isCreateOpen || Boolean(editingDepartment)}
                isEditing={Boolean(editingDepartment)}
                formData={formData}
                formErrors={formErrors}
                eligibleHeads={eligibleHeads}
                isSubmitting={upsertDepartmentMutation.isPending}
                onChange={setFormData}
                onClose={handleCloseForm}
                onSubmit={editingDepartment ? handleSaveEdit : handleSaveCreate}
            />

            {/* View Details Drawer */}
            {viewingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#037F8C]">
                                    {viewingDepartment.code}
                                </span>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
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
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.departments.colNameEn', {
                                            defaultValue: 'English Name',
                                        })}
                                        :
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {viewingDepartment.nameEn}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.departments.colNameAr', {
                                            defaultValue: 'Arabic Name',
                                        })}
                                        :
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {viewingDepartment.nameAr}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.departments.colHead', {
                                            defaultValue: 'Department Head',
                                        })}
                                        :
                                    </span>
                                    <span className="font-semibold text-[#037F8C]">
                                        {resolveHeadDisplayName(viewingDepartment) ||
                                            t('common.notAssigned', {
                                                defaultValue: 'Not Assigned',
                                            })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('common.status', { defaultValue: 'Status' })}:
                                    </span>
                                    <span className="font-semibold">
                                        {viewingDepartment.status === 'Active'
                                            ? t('common.active', { defaultValue: 'Active' })
                                            : t('common.inactive', { defaultValue: 'Inactive' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#857E74]">
                                        {t('ums.departments.colStaff', {
                                            defaultValue: 'Assigned Headcount',
                                        })}
                                        :
                                    </span>
                                    <span className="font-mono font-bold text-[#037F8C]">
                                        {employeeCountByDept[viewingDepartment.id] || 0}{' '}
                                        {t('ums.departments.staffCountSuffix', {
                                            defaultValue: 'employees',
                                        })}
                                    </span>
                                </div>
                            </div>

                            {viewingDepartment.descriptionEn && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.departments.form.descEn', {
                                            defaultValue: 'Description (English)',
                                        })}
                                    </span>
                                    <p className="p-2.5 rounded-lg bg-[#FAF8F5] text-[#0D0D0D] text-[11px] leading-relaxed">
                                        {viewingDepartment.descriptionEn}
                                    </p>
                                </div>
                            )}

                            {viewingDepartment.descriptionAr && (
                                <div>
                                    <span className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('ums.departments.form.descAr', {
                                            defaultValue: 'Description (Arabic)',
                                        })}
                                    </span>
                                    <p
                                        className="p-2.5 rounded-lg bg-[#FAF8F5] text-[#0D0D0D] text-[11px] leading-relaxed"
                                        dir="rtl"
                                    >
                                        {viewingDepartment.descriptionAr}
                                    </p>
                                </div>
                            )}

                            {/* Assigned Staff List Preview */}
                            <div>
                                <span className="block text-[11px] font-semibold text-[#857E74] mb-1.5">
                                    {t('ums.departments.staffPreview', {
                                        defaultValue: 'Assigned Personnel',
                                    })}{' '}
                                    ({employeeCountByDept[viewingDepartment.id] || 0})
                                </span>
                                <div className="max-h-36 overflow-y-auto rounded-lg border border-[#E5E0D8] divide-y divide-[#F0ECE4]">
                                    {employees.filter(
                                        (e) => e.departmentId === viewingDepartment.id
                                    ).length === 0 ? (
                                        <p className="p-3 text-[11px] text-center text-[#857E74] italic">
                                            {t('ums.departments.noStaffAssigned', {
                                                defaultValue:
                                                    'No employees currently assigned to this department.',
                                            })}
                                        </p>
                                    ) : (
                                        employees
                                            .filter((e) => e.departmentId === viewingDepartment.id)
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
                                                                ? emp.designationTitleAr ||
                                                                  emp.designationTitle
                                                                : emp.designationTitle}
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
                                onClick={() => setViewingDepartment(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] hover:bg-[#EFECE6]"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation / Dependency Warning Dialog */}
            {deletingDepartment &&
                (() => {
                    const eligibility = checkDepartmentDeletionEligibility(
                        deletingDepartment.id,
                        employees,
                        designations
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
                                                ? t('ums.departments.deleteTitle', {
                                                      defaultValue: 'Delete Department',
                                                  })
                                                : t('ums.departments.deleteBlockedTitle', {
                                                      defaultValue: 'Deletion Blocked',
                                                  })}
                                        </h3>
                                        <p className="text-xs text-[#6E6862]">
                                            {deletingDepartment.nameEn} ({deletingDepartment.code})
                                        </p>
                                    </div>
                                </div>

                                <p className="text-xs text-[#45413C] mb-5 leading-relaxed">
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
                                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E5E0D8] text-[#6E6862] hover:bg-[#FAF8F5] transition-colors"
                                    >
                                        {t('common.cancel', { defaultValue: 'Cancel' })}
                                    </button>
                                    {eligibility.canDelete ? (
                                        <button
                                            type="button"
                                            disabled={deleteDepartmentMutation.isPending}
                                            onClick={handleConfirmDelete}
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#A63A3A] hover:bg-[#882b2b] text-white transition-colors disabled:opacity-50"
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
                                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white transition-colors"
                                        >
                                            {t('common.deactivateInstead', {
                                                defaultValue: 'Deactivate Department',
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
