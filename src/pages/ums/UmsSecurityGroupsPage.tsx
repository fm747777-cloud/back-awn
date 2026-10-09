import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ShieldCheck,
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
    Shield,
    ShieldAlert,
    Copy,
    Check,
    FileText,
    Globe,
    GitFork,
    ClipboardCheck,
    Box,
    LifeBuoy,
    CheckSquare,
    Square,
    Lock,
    KeyRound,
    Layers,
    type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadSecurityGroups,
    saveSecurityGroups,
    loadRoles,
    loadEmployees,
    loadDepartments,
    generateNextSecurityGroupCode,
    checkSecurityGroupDeletionEligibility,
    recordUmsAuditEvent,
    UMS_PAGE_SIZE_OPTIONS,
    type SecurityGroupRecord,
    type SecurityGroupPermissions,
    type ModulePermission,
    type RoleRecord,
    type EmployeeRecord,
    type DepartmentRecord,
} from './umsMockData';

// Module definitions and metadata
const MODULE_KEYS: (keyof SecurityGroupPermissions)[] = [
    'ums',
    'edms',
    'service',
    'workflow',
    'request',
    'asset',
    'ticketing',
];

interface ModuleMetadata {
    nameEn: string;
    nameAr: string;
    descEn: string;
    descAr: string;
    icon: LucideIcon;
}

const MODULE_INFO: Record<keyof SecurityGroupPermissions, ModuleMetadata> = {
    ums: {
        nameEn: 'User Management (UMS)',
        nameAr: 'إدارة المستخدمين والصلاحيات',
        descEn: 'Employees, designations, departments, roles & groups',
        descAr: 'الموظفون، المسميات، الأقسام، والأدوار ومجموعات الأمان',
        icon: Users,
    },
    edms: {
        nameEn: 'Document Management (EDMS)',
        nameAr: 'إدارة الوثائق والملفات',
        descEn: 'Company records, contracts, licenses, certificates',
        descAr: 'السجلات النظامية، العقود، الرخص، والشهادات',
        icon: FileText,
    },
    service: {
        nameEn: 'Government & Enterprise Services',
        nameAr: 'الخدمات والبوابات الحكومية',
        descEn: 'Muqeem, Qiwa, Balady, ZATCA, commercial registrations',
        descAr: 'مقيم، قوى، بلدي، زاتكا، وتجديد السجلات التجارية',
        icon: Globe,
    },
    workflow: {
        nameEn: 'Workflow Automation',
        nameAr: 'مسارات العمل المؤتمتة',
        descEn: 'Business approvals, sequential transitions, SLA engine',
        descAr: 'الموافقات الإدارية، الانتقالات التلقائية، ومتابعة الالتزام',
        icon: GitFork,
    },
    request: {
        nameEn: 'Requests & Approvals',
        nameAr: 'الطلبات والاعتمادات',
        descEn: 'Leave requests, salary certificates, business expenses',
        descAr: 'الإجازات، شهادات التعريف بالراتب، وعهد ومصروفات الأعمال',
        icon: ClipboardCheck,
    },
    asset: {
        nameEn: 'Asset Management',
        nameAr: 'إدارة الأصول والعهد',
        descEn: 'Custody tracking, equipment, IT devices, vehicles',
        descAr: 'تتبع العهد، الأجهزة التقنية، المعدات، وأسطول المركبات',
        icon: Box,
    },
    ticketing: {
        nameEn: 'Support Ticketing',
        nameAr: 'الدعم والمساعدات الفنية',
        descEn: 'Internal requests, helpdesk issues, SLA escalations',
        descAr: 'التذاكر الداخلية، قضايا الدعم الفني، ومستويات الخدمة',
        icon: LifeBuoy,
    },
};

const DEFAULT_PERMISSIONS: SecurityGroupPermissions = {
    ums: { read: false, write: false, delete: false, export: false },
    edms: { read: false, write: false, delete: false, export: false },
    service: { read: false, write: false, delete: false, export: false },
    workflow: { read: false, write: false, delete: false, export: false },
    request: { read: false, write: false, delete: false, export: false },
    asset: { read: false, write: false, delete: false, export: false },
    ticketing: { read: false, write: false, delete: false, export: false },
};

interface SecurityGroupFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
    permissions: SecurityGroupPermissions;
}

const DEFAULT_FORM: SecurityGroupFormData = {
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    status: 'Active',
    permissions: DEFAULT_PERMISSIONS,
};

// Count active permissions out of 28
function countActivePermissions(permissions: SecurityGroupPermissions): number {
    let count = 0;
    MODULE_KEYS.forEach((mKey) => {
        const p = permissions[mKey];
        if (p.read) count++;
        if (p.write) count++;
        if (p.delete) count++;
        if (p.export) count++;
    });
    return count;
}

export const UmsSecurityGroupsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    // State
    const [groups, setGroups] = useState<SecurityGroupRecord[]>(() => loadSecurityGroups());
    const [roles] = useState<RoleRecord[]>(() => loadRoles());
    const [employees] = useState<EmployeeRecord[]>(() => loadEmployees());
    const [departments] = useState<DepartmentRecord[]>(() => loadDepartments());

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

    // Selection & Pagination
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(UMS_PAGE_SIZE_OPTIONS[0]);

    // Drawers & Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<SecurityGroupRecord | null>(null);
    const [viewingGroup, setViewingGroup] = useState<SecurityGroupRecord | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<SecurityGroupRecord | null>(null);

    // Form state
    const [formData, setFormData] = useState<SecurityGroupFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Synchronize to localStorage
    const persistGroups = (newGroups: SecurityGroupRecord[]) => {
        setGroups(newGroups);
        saveSecurityGroups(newGroups);
    };

    // Calculate dynamic counts
    const groupRoleMap = useMemo(() => {
        const map = new Map<string, RoleRecord[]>();
        groups.forEach((g) => map.set(g.id, []));
        roles.forEach((r) => {
            if (map.has(r.securityGroupId)) {
                map.get(r.securityGroupId)!.push(r);
            }
        });
        return map;
    }, [groups, roles]);

    const groupEmployeeMap = useMemo(() => {
        const map = new Map<string, EmployeeRecord[]>();
        groups.forEach((g) => {
            const groupRoles = groupRoleMap.get(g.id) || [];
            const roleIdSet = new Set(groupRoles.map((r) => r.id));
            const emps = employees.filter((e) => roleIdSet.has(e.roleId));
            map.set(g.id, emps);
        });
        return map;
    }, [groups, groupRoleMap, employees]);

    // Live KPI Calculations
    const totalGroups = groups.length;
    const activeGroups = groups.filter((g) => g.status === 'Active').length;
    const inactiveGroups = groups.filter((g) => g.status === 'Inactive').length;
    const totalAssignedUsers = useMemo(() => {
        let count = 0;
        groups.forEach((g) => {
            const emps = groupEmployeeMap.get(g.id) || [];
            count += emps.length;
        });
        return count;
    }, [groups, groupEmployeeMap]);

    // Filtering
    const filteredGroups = useMemo(() => {
        return groups.filter((g) => {
            // Status filter
            if (statusFilter !== 'All' && g.status !== statusFilter) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchCode = g.code.toLowerCase().includes(q);
                const matchNameEn = g.nameEn.toLowerCase().includes(q);
                const matchNameAr = g.nameAr.toLowerCase().includes(q);
                const matchDescEn = (g.descriptionEn || '').toLowerCase().includes(q);
                const matchDescAr = (g.descriptionAr || '').toLowerCase().includes(q);
                if (!matchCode && !matchNameEn && !matchNameAr && !matchDescEn && !matchDescAr) {
                    return false;
                }
            }

            return true;
        });
    }, [groups, statusFilter, searchQuery]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredGroups.slice(start, start + pageSize);
    }, [filteredGroups, currentPage, pageSize]);

    // Selection handlers
    const allVisibleSelected =
        paginatedGroups.length > 0 &&
        paginatedGroups.every((g) => selectedIds.includes(g.id));

    const handleSelectAllVisible = () => {
        if (allVisibleSelected) {
            const visibleIds = new Set(paginatedGroups.map((g) => g.id));
            setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
        } else {
            const combined = new Set([...selectedIds, ...paginatedGroups.map((g) => g.id)]);
            setSelectedIds(Array.from(combined));
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Copy group code
    const handleCopyCode = (code: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success(
                t('ums.securityGroups.feedback.codeCopied', {
                    defaultValue: `Code ${code} copied to clipboard`,
                })
            );
            setTimeout(() => setCopiedCode(null), 1500);
        }
    };

    // Open Create Drawer
    const handleOpenCreate = () => {
        setFormData({
            ...DEFAULT_FORM,
            code: generateNextSecurityGroupCode(groups),
            permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Drawer
    const handleOpenEdit = (group: SecurityGroupRecord) => {
        setEditingGroup(group);
        setFormData({
            code: group.code,
            nameEn: group.nameEn,
            nameAr: group.nameAr,
            descriptionEn: group.descriptionEn || '',
            descriptionAr: group.descriptionAr || '',
            status: group.status,
            permissions: JSON.parse(JSON.stringify(group.permissions || DEFAULT_PERMISSIONS)),
        });
        setFormErrors({});
    };

    // Validate Form
    const validateForm = (isEditing: boolean, currentId?: string): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.nameEn.trim()) {
            errors.nameEn = t('ums.securityGroups.validation.nameEnRequired', {
                defaultValue: 'English security group name is required.',
            });
        }

        if (!formData.nameAr.trim()) {
            errors.nameAr = t('ums.securityGroups.validation.nameArRequired', {
                defaultValue: 'Arabic security group name is required.',
            });
        }

        // Duplicate Name check (case-insensitive)
        const duplicateEn = groups.find(
            (g) =>
                (!isEditing || g.id !== currentId) &&
                g.nameEn.trim().toLowerCase() === formData.nameEn.trim().toLowerCase()
        );
        if (duplicateEn) {
            errors.nameEn = t('ums.securityGroups.validation.duplicateName', {
                defaultValue: 'A security group with this name already exists.',
            });
        }

        const duplicateAr = groups.find(
            (g) =>
                (!isEditing || g.id !== currentId) &&
                g.nameAr.trim().toLowerCase() === formData.nameAr.trim().toLowerCase()
        );
        if (duplicateAr) {
            errors.nameAr = t('ums.securityGroups.validation.duplicateName', {
                defaultValue: 'A security group with this name already exists.',
            });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const newGroup: SecurityGroupRecord = {
            id: `sec-${Date.now()}`,
            code: formData.code.trim() || generateNextSecurityGroupCode(groups),
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            permissions: formData.permissions,
            userCount: 0,
            status: formData.status,
            createdAt: new Date().toISOString().slice(0, 10),
        };

        const updated = [newGroup, ...groups];
        persistGroups(updated);

        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Security Group',
            resourceId: newGroup.id,
            resourceName: newGroup.nameEn,
            detailsEn: `Created security group ${newGroup.code} (${newGroup.nameEn}) with ${countActivePermissions(newGroup.permissions)}/28 privileges configured.`,
            detailsAr: `إنشاء مجموعة أمان جديدة ${newGroup.code} (${newGroup.nameAr}) وتعيين ${countActivePermissions(newGroup.permissions)}/28 صلاحية.`,
            newState: JSON.stringify(newGroup),
        });

        toast.success(
            t('ums.securityGroups.feedback.created', {
                defaultValue: `Security group ${newGroup.nameEn} created successfully.`,
            })
        );
        setIsCreateOpen(false);
    };

    // Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup) return;
        if (!validateForm(true, editingGroup.id)) return;

        const updatedGroup: SecurityGroupRecord = {
            ...editingGroup,
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            permissions: formData.permissions,
        };

        const updated = groups.map((g) => (g.id === editingGroup.id ? updatedGroup : g));
        persistGroups(updated);

        // Also update any cache or state
        if (viewingGroup && viewingGroup.id === updatedGroup.id) {
            setViewingGroup(updatedGroup);
        }

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Security Group',
            resourceId: updatedGroup.id,
            resourceName: updatedGroup.nameEn,
            detailsEn: `Updated security group ${updatedGroup.code} (${updatedGroup.nameEn}).`,
            detailsAr: `تحديث بيانات مجموعة الأمان ${updatedGroup.code} (${updatedGroup.nameAr}).`,
            previousState: JSON.stringify(editingGroup),
            newState: JSON.stringify(updatedGroup),
        });

        toast.success(
            t('ums.securityGroups.feedback.updated', {
                defaultValue: `Security group ${updatedGroup.nameEn} updated successfully.`,
            })
        );
        setEditingGroup(null);
    };

    // Quick Status Toggle
    const handleToggleStatus = (group: SecurityGroupRecord) => {
        const nextStatus: 'Active' | 'Inactive' =
            group.status === 'Active' ? 'Inactive' : 'Active';
        const updated = groups.map((g) =>
            g.id === group.id ? { ...g, status: nextStatus } : g
        );
        persistGroups(updated);

        if (viewingGroup && viewingGroup.id === group.id) {
            setViewingGroup({ ...viewingGroup, status: nextStatus });
        }

        recordUmsAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Security Group',
            resourceId: group.id,
            resourceName: group.nameEn,
            detailsEn: `Security group ${group.code} status changed to ${nextStatus}.`,
            detailsAr: `تم تغيير حالة مجموعة الأمان ${group.code} إلى ${nextStatus === 'Active' ? 'نشط' : 'معطل'}.`,
        });

        toast.success(
            t('ums.securityGroups.feedback.statusChanged', {
                defaultValue: `Security group ${group.nameEn} is now ${nextStatus}.`,
            })
        );
    };

    // Delete check & execution
    const deleteEligibility = useMemo(() => {
        if (!deletingGroup) return null;
        return checkSecurityGroupDeletionEligibility(deletingGroup.id, roles, employees);
    }, [deletingGroup, roles, employees]);

    const handleConfirmDelete = () => {
        if (!deletingGroup || !deleteEligibility?.canDelete) return;

        const target = deletingGroup;
        const updated = groups.filter((g) => g.id !== target.id);
        persistGroups(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Security Group',
            resourceId: target.id,
            resourceName: target.nameEn,
            detailsEn: `Permanently deleted security group ${target.code} (${target.nameEn}).`,
            detailsAr: `تم حذف مجموعة الأمان ${target.code} (${target.nameAr}) نهائياً.`,
            previousState: JSON.stringify(target),
        });

        toast.success(
            t('ums.securityGroups.feedback.deleted', {
                defaultValue: `Security group ${target.nameEn} deleted successfully.`,
            })
        );
        setDeletingGroup(null);
    };

    // Quick deactivation from inside blocked delete dialog
    const handleDeactivateFromDeleteModal = () => {
        if (!deletingGroup) return;
        handleToggleStatus(deletingGroup);
        setDeletingGroup(null);
    };

    // Batch Actions
    const handleBatchActivate = () => {
        if (selectedIds.length === 0) return;
        const updated = groups.map((g) =>
            selectedIds.includes(g.id) ? { ...g, status: 'Active' as const } : g
        );
        persistGroups(updated);
        toast.success(`${selectedIds.length} security group(s) activated successfully.`);
        setSelectedIds([]);
    };

    const handleBatchDeactivate = () => {
        if (selectedIds.length === 0) return;
        const updated = groups.map((g) =>
            selectedIds.includes(g.id) ? { ...g, status: 'Inactive' as const } : g
        );
        persistGroups(updated);
        toast.success(`${selectedIds.length} security group(s) deactivated successfully.`);
        setSelectedIds([]);
    };

    // CSV Export
    const handleExportCsv = (customItems?: SecurityGroupRecord[]) => {
        const targetList = customItems || filteredGroups;
        if (targetList.length === 0) {
            toast.error('No security group records to export.');
            return;
        }

        const headers = [
            'Group Code',
            'Name (English)',
            'Name (Arabic)',
            'Description (English)',
            'Description (Arabic)',
            'Assigned Roles',
            'Assigned Users',
            'Active Privileges (out of 28)',
            'Status',
            'Created Date',
        ];

        const csvRows = targetList.map((g) => {
            const roleCount = (groupRoleMap.get(g.id) || []).length;
            const userCount = (groupEmployeeMap.get(g.id) || []).length;
            const activePrivileges = countActivePermissions(g.permissions);
            return [
                `"${g.code}"`,
                `"${g.nameEn.replace(/"/g, '""')}"`,
                `"${g.nameAr.replace(/"/g, '""')}"`,
                `"${(g.descriptionEn || '').replace(/"/g, '""')}"`,
                `"${(g.descriptionAr || '').replace(/"/g, '""')}"`,
                roleCount,
                userCount,
                `"${activePrivileges} / 28"`,
                `"${g.status}"`,
                `"${g.createdAt}"`,
            ].join(',');
        });

        // Add UTF-8 BOM for Arabic text support in Microsoft Excel
        const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `awn-security-groups-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Security Group',
            resourceId: 'all',
            resourceName: 'Security Groups Export',
            detailsEn: `Exported ${targetList.length} security group records to CSV format.`,
            detailsAr: `تم تصدير ${targetList.length} سجل من مجموعات الأمان إلى ملف CSV.`,
        });

        toast.success(
            t('ums.securityGroups.feedback.exported', {
                defaultValue: `Exported ${targetList.length} security groups successfully.`,
            })
        );
    };

    // Permission matrix helper handlers in Form
    const handlePermissionChange = (
        moduleKey: keyof SecurityGroupPermissions,
        action: keyof ModulePermission,
        value: boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    ...prev.permissions[moduleKey],
                    [action]: value,
                },
            },
        }));
    };

    const handleGrantAll = () => {
        const granted: SecurityGroupPermissions = { ...DEFAULT_PERMISSIONS };
        MODULE_KEYS.forEach((mKey) => {
            granted[mKey] = { read: true, write: true, delete: true, export: true };
        });
        setFormData((prev) => ({ ...prev, permissions: granted }));
        toast.info(t('ums.securityGroups.form.grantAll', { defaultValue: 'Full access granted to all modules.' }));
    };

    const handleRevokeAll = () => {
        const revoked: SecurityGroupPermissions = { ...DEFAULT_PERMISSIONS };
        MODULE_KEYS.forEach((mKey) => {
            revoked[mKey] = { read: false, write: false, delete: false, export: false };
        });
        setFormData((prev) => ({ ...prev, permissions: revoked }));
        toast.info(t('ums.securityGroups.form.clearAll', { defaultValue: 'All permissions revoked.' }));
    };

    const handleReadOnlyAll = () => {
        const readOnly: SecurityGroupPermissions = { ...DEFAULT_PERMISSIONS };
        MODULE_KEYS.forEach((mKey) => {
            readOnly[mKey] = { read: true, write: false, delete: false, export: false };
        });
        setFormData((prev) => ({ ...prev, permissions: readOnly }));
        toast.info(t('ums.securityGroups.form.readOnlyAll', { defaultValue: 'Read-only access set across all modules.' }));
    };

    const handleToggleModuleRow = (moduleKey: keyof SecurityGroupPermissions) => {
        const curr = formData.permissions[moduleKey];
        const allOn = curr.read && curr.write && curr.delete && curr.export;
        const targetVal = !allOn;
        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleKey]: {
                    read: targetVal,
                    write: targetVal,
                    delete: targetVal,
                    export: targetVal,
                },
            },
        }));
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                                    {t('ums.securityGroups.title', { defaultValue: 'Security Groups' })}
                                </h1>
                                <span
                                    className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                    dir="ltr"
                                >
                                    UMS-SEC
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5 font-normal">
                                {t('ums.securityGroups.subtitle', {
                                    defaultValue:
                                        'Access control policies, module permission matrices, and security governance.',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => handleExportCsv()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white text-[#2D3F2C] border border-[#E5E0D8] hover:bg-[#FAF8F5] hover:border-[#2D3F2C]/30 transition-all shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5 text-[#2D3F2C]" />
                        <span>{t('ums.common.export', { defaultValue: 'Export CSV' })}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all shadow-sm active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('ums.securityGroups.addSecurityGroup', { defaultValue: 'Add Security Group' })}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.total', { defaultValue: 'Total Security Groups' })}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">{totalGroups}</p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">Configured policy containers</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                        <Shield className="w-5 h-5 text-[#2D3F2C]" />
                    </div>
                </div>

                {/* Active */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.active', { defaultValue: 'Active Groups' })}
                        </p>
                        <p className="text-2xl font-bold text-[#1B4D3E] mt-1 font-mono">{activeGroups}</p>
                        <p className="text-[11px] text-[#1B4D3E] mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 inline" />
                            {totalGroups > 0 ? Math.round((activeGroups / totalGroups) * 100) : 0}% operational
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32]">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                {/* Inactive */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.inactive', { defaultValue: 'Inactive Groups' })}
                        </p>
                        <p className="text-2xl font-bold text-[#D32F2F] mt-1 font-mono">{inactiveGroups}</p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">Suspended access policies</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] flex items-center justify-center text-[#D32F2F]">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>

                {/* Total Assigned Users */}
                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.assignedUsers', { defaultValue: 'Total Assigned Users' })}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">{totalAssignedUsers}</p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">Mapped enterprise staff</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                        <Users className="w-5 h-5 text-[#2D3F2C]" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-[#6E6862] absolute start-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('ums.securityGroups.searchPlaceholder', {
                                defaultValue: 'Search security groups by code, name, or description...',
                            })}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] placeholder-[#6E6862] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/30 focus:border-[#2D3F2C] transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#6E6862] hover:text-[#0D0D0D]"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#6E6862]">
                                {t('ums.common.status', { defaultValue: 'Status' })}:
                            </span>
                            <div className="inline-flex rounded-lg border border-[#E5E0D8] p-0.5 bg-[#FAF8F5]">
                                {(['All', 'Active', 'Inactive'] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter(s);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                            statusFilter === s
                                                ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-xs'
                                                : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                        }`}
                                    >
                                        {s === 'All'
                                            ? t('ums.common.all', { defaultValue: 'All' })
                                            : s === 'Active'
                                            ? t('ums.common.active', { defaultValue: 'Active' })
                                            : t('ums.common.inactive', { defaultValue: 'Inactive' })}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reset Filters */}
                        {(searchQuery || statusFilter !== 'All') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('All');
                                    setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#6E6862] hover:text-[#0D0D0D] rounded-lg border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-all"
                                title="Reset filters"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>{t('ums.common.reset', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Batch Actions Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#2D3F2C]/20 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#2D3F2C] font-mono">
                                {selectedIds.length} {t('ums.common.selected', { defaultValue: 'selected' })}
                            </span>
                            <span className="text-[#6E6862]">|</span>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-[#6E6862] hover:text-[#0D0D0D] underline"
                            >
                                {t('ums.common.clearSelection', { defaultValue: 'Clear selection' })}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBatchActivate}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] hover:bg-[#C8E6C9] transition-all"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t('ums.common.activate', { defaultValue: 'Activate' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleBatchDeactivate}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] hover:bg-[#FFCDD2] transition-all"
                            >
                                <XCircle className="w-3 h-3" />
                                <span>{t('ums.common.deactivate', { defaultValue: 'Deactivate' })}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const selectedGroups = groups.filter((g) => selectedIds.includes(g.id));
                                    handleExportCsv(selectedGroups);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-white text-[#2D3F2C] border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-all"
                            >
                                <Download className="w-3 h-3" />
                                <span>{t('ums.common.exportSelected', { defaultValue: 'Export Selected' })}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-xl bg-white border border-[#E5E0D8] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                <th className="p-3 w-10 text-center">
                                    <button
                                        type="button"
                                        onClick={handleSelectAllVisible}
                                        className="text-[#2D3F2C] hover:opacity-80"
                                        title="Select all on page"
                                    >
                                        {allVisibleSelected ? (
                                            <CheckSquare className="w-4 h-4 text-[#2D3F2C]" />
                                        ) : (
                                            <Square className="w-4 h-4 text-[#6E6862]" />
                                        )}
                                    </button>
                                </th>
                                <th className="p-3 text-start">{t('ums.securityGroups.table.groupCode', { defaultValue: 'Group Code' })}</th>
                                <th className="p-3 text-start">{t('ums.securityGroups.table.groupName', { defaultValue: 'Group Name' })}</th>
                                <th className="p-3 text-start hidden md:table-cell">{t('ums.common.description', { defaultValue: 'Description' })}</th>
                                <th className="p-3 text-start">{t('ums.securityGroups.table.permissionsSummary', { defaultValue: 'Permissions' })}</th>
                                <th className="p-3 text-center">{t('ums.securityGroups.table.rolesCount', { defaultValue: 'Roles' })}</th>
                                <th className="p-3 text-center">{t('ums.securityGroups.table.usersCount', { defaultValue: 'Users' })}</th>
                                <th className="p-3 text-center">{t('ums.securityGroups.table.status', { defaultValue: 'Status' })}</th>
                                <th className="p-3 text-start hidden lg:table-cell">{t('ums.securityGroups.table.createdAt', { defaultValue: 'Created Date' })}</th>
                                <th className="p-3 text-end">{t('ums.common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8]">
                            {paginatedGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-[#6E6862]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ShieldAlert className="w-8 h-8 text-[#6E6862]/60" />
                                            <p className="text-sm font-medium text-[#0D0D0D]">No security groups found</p>
                                            <p className="text-xs text-[#6E6862]">
                                                {searchQuery || statusFilter !== 'All'
                                                    ? 'Try clearing your search query or adjusting active filters.'
                                                    : 'Get started by creating your first enterprise security group.'}
                                            </p>
                                            {(searchQuery || statusFilter !== 'All') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setStatusFilter('All');
                                                    }}
                                                    className="mt-2 text-xs font-semibold text-[#2D3F2C] hover:underline"
                                                >
                                                    Clear active filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedGroups.map((group) => {
                                    const isSelected = selectedIds.includes(group.id);
                                    const assignedRoles = groupRoleMap.get(group.id) || [];
                                    const assignedEmployees = groupEmployeeMap.get(group.id) || [];
                                    const activePermissions = countActivePermissions(group.permissions);

                                    return (
                                        <tr
                                            key={group.id}
                                            className={`hover:bg-[#FAF8F5]/60 transition-colors ${
                                                isSelected ? 'bg-[#FAF8F5]' : ''
                                            }`}
                                        >
                                            {/* Selection Checkbox */}
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelect(group.id)}
                                                    className="text-[#2D3F2C]"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-[#2D3F2C]" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-[#6E6862]/60" />
                                                    )}
                                                </button>
                                            </td>

                                            {/* Group Code */}
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                                        dir="ltr"
                                                    >
                                                        {group.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCode(group.code)}
                                                        className="p-1 text-[#6E6862] hover:text-[#0D0D0D] rounded hover:bg-[#FAF8F5] transition-colors"
                                                        title="Copy code"
                                                    >
                                                        {copiedCode === group.code ? (
                                                            <Check className="w-3 h-3 text-[#2E7D32]" />
                                                        ) : (
                                                            <Copy className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Names */}
                                            <td className="p-3">
                                                <div className="font-semibold text-[#0D0D0D]">
                                                    {isRtl ? group.nameAr : group.nameEn}
                                                </div>
                                                <div className="text-[11px] text-[#6E6862]">
                                                    {isRtl ? group.nameEn : group.nameAr}
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="p-3 max-w-xs truncate hidden md:table-cell text-[#6E6862]">
                                                {isRtl
                                                    ? group.descriptionAr || group.descriptionEn || '—'
                                                    : group.descriptionEn || group.descriptionAr || '—'}
                                            </td>

                                            {/* Permissions Summary */}
                                            <td className="p-3">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8]">
                                                    <KeyRound className="w-3 h-3 text-[#2D3F2C]" />
                                                    <span className="font-mono font-semibold text-[#2D3F2C]">
                                                        {activePermissions}
                                                    </span>
                                                    <span className="text-[10px] text-[#6E6862]">/ 28 active</span>
                                                </div>
                                            </td>

                                            {/* Assigned Roles Count */}
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                                                    {assignedRoles.length}
                                                </span>
                                            </td>

                                            {/* Assigned Users Count */}
                                            <td className="p-3 text-center">
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                                                    {assignedEmployees.length}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(group)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                                                        group.status === 'Active'
                                                            ? 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
                                                            : 'bg-[#FFEBEE] text-[#D32F2F] hover:bg-[#FFCDD2]'
                                                    }`}
                                                    title="Click to toggle status"
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            group.status === 'Active' ? 'bg-[#2E7D32]' : 'bg-[#D32F2F]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {group.status === 'Active'
                                                            ? t('ums.common.active', { defaultValue: 'Active' })
                                                            : t('ums.common.inactive', { defaultValue: 'Inactive' })}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Created Date */}
                                            <td className="p-3 hidden lg:table-cell text-[#6E6862] font-mono text-[11px]">
                                                {group.createdAt}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3 text-end">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingGroup(group)}
                                                        className="p-1.5 text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] rounded-md transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(group)}
                                                        className="p-1.5 text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] rounded-md transition-colors"
                                                        title="Edit Security Group"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(group)}
                                                        className="p-1.5 text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] rounded-md transition-colors"
                                                        title={group.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Power className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingGroup(group)}
                                                        className="p-1.5 text-[#6E6862] hover:text-[#D32F2F] hover:bg-[#FFEBEE] rounded-md transition-colors"
                                                        title="Delete Security Group"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
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
                <div className="p-3 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E6862]">
                    <div className="flex items-center gap-2">
                        <span>
                            {t('ums.common.showing', { defaultValue: 'Showing' })}{' '}
                            <strong className="text-[#0D0D0D]">
                                {filteredGroups.length === 0
                                    ? 0
                                    : (currentPage - 1) * pageSize + 1}
                            </strong>{' '}
                            -{' '}
                            <strong className="text-[#0D0D0D]">
                                {Math.min(currentPage * pageSize, filteredGroups.length)}
                            </strong>{' '}
                            {t('ums.common.of', { defaultValue: 'of' })}{' '}
                            <strong className="text-[#0D0D0D]">{filteredGroups.length}</strong>{' '}
                            {t('ums.securityGroups.title', { defaultValue: 'Security Groups' })}
                        </span>

                        <span className="text-[#E5E0D8]">|</span>

                        <div className="flex items-center gap-1.5">
                            <span>{t('ums.common.pageSize', { defaultValue: 'Rows per page' })}:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-0.5 rounded border border-[#E5E0D8] bg-white text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                            >
                                {UMS_PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Previous Page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-mono font-medium text-[#0D0D0D]">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Next Page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* CREATE / EDIT DRAWER */}
            {(isCreateOpen || editingGroup !== null) && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
                    <div
                        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        {/* Drawer Header */}
                        <div className="p-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingGroup
                                            ? t('ums.securityGroups.editSecurityGroup', {
                                                  defaultValue: 'Edit Security Group',
                                              })
                                            : t('ums.securityGroups.addSecurityGroup', {
                                                  defaultValue: 'Add Security Group',
                                              })}
                                    </h2>
                                    <p className="text-xs text-[#6E6862]">
                                        {editingGroup
                                            ? `Updating access configuration for ${editingGroup.code}`
                                            : 'Define a new security container and module authorization policies'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingGroup(null);
                                }}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Form Body */}
                        <form
                            id="security-group-form"
                            onSubmit={editingGroup ? handleSaveEdit : handleSaveCreate}
                            className="p-5 space-y-5 flex-1"
                        >
                            {/* Group Code */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.securityGroups.form.code', { defaultValue: 'Group Code' })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    readOnly
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#6E6862] font-mono font-medium focus:outline-none cursor-not-allowed"
                                />
                                <span className="text-[10px] text-[#6E6862] mt-0.5 block">
                                    Auto-generated sequential security group identifier.
                                </span>
                            </div>

                            {/* Bilingual Names */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.securityGroups.form.nameEn', {
                                            defaultValue: 'Security Group Name (EN)',
                                        })}{' '}
                                        <span className="text-[#D32F2F]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                                        }
                                        placeholder="e.g. Operations & Service Officers"
                                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/30 focus:border-[#2D3F2C] ${
                                            formErrors.nameEn
                                                ? 'border-[#D32F2F] bg-[#FFEBEE]/20'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {formErrors.nameEn && (
                                        <span className="text-[11px] text-[#D32F2F] mt-1 block">
                                            {formErrors.nameEn}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.securityGroups.form.nameAr', {
                                            defaultValue: 'Security Group Name (AR)',
                                        })}{' '}
                                        <span className="text-[#D32F2F]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, nameAr: e.target.value }))
                                        }
                                        placeholder="مثال: أخصائيو العمليات والخدمات المؤسسية"
                                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/30 focus:border-[#2D3F2C] ${
                                            formErrors.nameAr
                                                ? 'border-[#D32F2F] bg-[#FFEBEE]/20'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {formErrors.nameAr && (
                                        <span className="text-[11px] text-[#D32F2F] mt-1 block">
                                            {formErrors.nameAr}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.common.status', { defaultValue: 'Status' })}
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center gap-1.5 text-xs text-[#0D0D0D] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Active"
                                            checked={formData.status === 'Active'}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, status: 'Active' }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                        />
                                        <span>{t('ums.common.active', { defaultValue: 'Active' })}</span>
                                    </label>
                                    <label className="inline-flex items-center gap-1.5 text-xs text-[#0D0D0D] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Inactive"
                                            checked={formData.status === 'Inactive'}
                                            onChange={() =>
                                                setFormData((prev) => ({ ...prev, status: 'Inactive' }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                        />
                                        <span>{t('ums.common.inactive', { defaultValue: 'Inactive' })}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.securityGroups.form.descEn', {
                                            defaultValue: 'Description (EN)',
                                        })}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.descriptionEn}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                descriptionEn: e.target.value,
                                            }))
                                        }
                                        placeholder="Describe the operational mandate and scope of this security group..."
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/30 focus:border-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.securityGroups.form.descAr', {
                                            defaultValue: 'Description (AR)',
                                        })}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.descriptionAr}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                descriptionAr: e.target.value,
                                            }))
                                        }
                                        placeholder="وصف النطاق التشغيلي والصلاحيات الممنوحة لهذه المجموعة..."
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/30 focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {/* PERMISSIONS MATRIX EDITOR */}
                            <div className="pt-2 border-t border-[#E5E0D8]">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <Lock className="w-4 h-4 text-[#2D3F2C]" />
                                            <h3 className="text-xs font-bold text-[#0D0D0D]">
                                                {t('ums.securityGroups.permissionsMatrix', {
                                                    defaultValue: 'Module Permissions Matrix',
                                                })}
                                            </h3>
                                        </div>
                                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                                            Granular CRUD authorization across all 7 AWN subsystems ({countActivePermissions(formData.permissions)}/28 privileges granted)
                                        </p>
                                    </div>

                                    {/* Matrix Quick Actions */}
                                    <div className="flex items-center gap-1 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={handleGrantAll}
                                            className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition-colors"
                                        >
                                            {t('ums.securityGroups.form.grantAll', { defaultValue: 'Grant Full' })}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleReadOnlyAll}
                                            className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-colors"
                                        >
                                            {t('ums.securityGroups.form.readOnlyAll', { defaultValue: 'Read-Only' })}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRevokeAll}
                                            className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#D32F2F] border border-[#E5E0D8] hover:bg-[#FFEBEE] transition-colors"
                                        >
                                            {t('ums.securityGroups.form.clearAll', { defaultValue: 'Revoke All' })}
                                        </button>
                                    </div>
                                </div>

                                {/* Matrix Table */}
                                <div className="border border-[#E5E0D8] rounded-lg overflow-hidden bg-white text-xs">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                                <th className="p-2.5 text-start">Module</th>
                                                <th className="p-2.5 text-center w-16">
                                                    {t('ums.securityGroups.actions.read', { defaultValue: 'Read' })}
                                                </th>
                                                <th className="p-2.5 text-center w-16">
                                                    {t('ums.securityGroups.actions.write', { defaultValue: 'Write' })}
                                                </th>
                                                <th className="p-2.5 text-center w-16">
                                                    {t('ums.securityGroups.actions.delete', { defaultValue: 'Delete' })}
                                                </th>
                                                <th className="p-2.5 text-center w-16">
                                                    {t('ums.securityGroups.actions.export', { defaultValue: 'Export' })}
                                                </th>
                                                <th className="p-2.5 text-center w-16">Toggle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E0D8]">
                                            {MODULE_KEYS.map((mKey) => {
                                                const meta = MODULE_INFO[mKey];
                                                const Icon = meta.icon;
                                                const p = formData.permissions[mKey];
                                                const rowAllChecked = p.read && p.write && p.delete && p.export;

                                                return (
                                                    <tr key={mKey} className="hover:bg-[#FAF8F5]/60 transition-colors">
                                                        {/* Module Name & Icon */}
                                                        <td className="p-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                                                    <Icon className="w-3.5 h-3.5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-[#0D0D0D]">
                                                                        {isRtl ? meta.nameAr : meta.nameEn}
                                                                    </div>
                                                                    <div className="text-[10px] text-[#6E6862]">
                                                                        {isRtl ? meta.descAr : meta.descEn}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Read */}
                                                        <td className="p-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.read}
                                                                onChange={(e) =>
                                                                    handlePermissionChange(mKey, 'read', e.target.checked)
                                                                }
                                                                className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                            />
                                                        </td>

                                                        {/* Write */}
                                                        <td className="p-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.write}
                                                                onChange={(e) =>
                                                                    handlePermissionChange(mKey, 'write', e.target.checked)
                                                                }
                                                                className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                            />
                                                        </td>

                                                        {/* Delete */}
                                                        <td className="p-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.delete}
                                                                onChange={(e) =>
                                                                    handlePermissionChange(mKey, 'delete', e.target.checked)
                                                                }
                                                                className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                            />
                                                        </td>

                                                        {/* Export */}
                                                        <td className="p-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={p.export}
                                                                onChange={(e) =>
                                                                    handlePermissionChange(mKey, 'export', e.target.checked)
                                                                }
                                                                className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                            />
                                                        </td>

                                                        {/* Row Toggle */}
                                                        <td className="p-2.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleModuleRow(mKey)}
                                                                className="p-1 rounded text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5]"
                                                                title={rowAllChecked ? 'Revoke module' : 'Grant module'}
                                                            >
                                                                {rowAllChecked ? (
                                                                    <CheckSquare className="w-3.5 h-3.5 text-[#2E7D32]" />
                                                                ) : (
                                                                    <Square className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </form>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingGroup(null);
                                }}
                                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                            >
                                {t('ums.common.cancel', { defaultValue: 'Cancel' })}
                            </button>
                            <button
                                type="submit"
                                form="security-group-form"
                                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all shadow-sm active:scale-[0.98]"
                            >
                                {editingGroup
                                    ? t('ums.common.saveChanges', { defaultValue: 'Save Changes' })
                                    : t('ums.securityGroups.addSecurityGroup', {
                                          defaultValue: 'Create Security Group',
                                      })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS DRAWER */}
            {viewingGroup && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
                    <div
                        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingGroup.nameAr : viewingGroup.nameEn}
                                        </h2>
                                        <span
                                            className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-white text-[#2D3F2C] border border-[#E5E0D8]"
                                            dir="ltr"
                                        >
                                            {viewingGroup.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {isRtl ? viewingGroup.nameEn : viewingGroup.nameAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingGroup(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-6 flex-1">
                            {/* Metadata Overview */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                                <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
                                    Overview & Status
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">Status</span>
                                        <span
                                            className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                viewingGroup.status === 'Active'
                                                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                                    : 'bg-[#FFEBEE] text-[#D32F2F]'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    viewingGroup.status === 'Active'
                                                        ? 'bg-[#2E7D32]'
                                                        : 'bg-[#D32F2F]'
                                                }`}
                                            />
                                            {viewingGroup.status}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">Privileges</span>
                                        <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block">
                                            {countActivePermissions(viewingGroup.permissions)} / 28 active
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">Linked Roles</span>
                                        <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block">
                                            {(groupRoleMap.get(viewingGroup.id) || []).length} roles
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">Created Date</span>
                                        <span className="font-mono text-[#0D0D0D] mt-0.5 block">
                                            {viewingGroup.createdAt}
                                        </span>
                                    </div>
                                </div>

                                {(viewingGroup.descriptionEn || viewingGroup.descriptionAr) && (
                                    <div className="pt-2 border-t border-[#E5E0D8]/60 text-xs text-[#6E6862]">
                                        <p className="italic">
                                            {isRtl
                                                ? viewingGroup.descriptionAr || viewingGroup.descriptionEn
                                                : viewingGroup.descriptionEn || viewingGroup.descriptionAr}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Permissions Matrix Read-Only */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-4 h-4 text-[#2D3F2C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.securityGroups.details.permissionsMatrixTitle', {
                                                defaultValue: 'Configured Module Permissions',
                                            })}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#6E6862]">
                                        {countActivePermissions(viewingGroup.permissions)} / 28 active
                                    </span>
                                </div>

                                <div className="border border-[#E5E0D8] rounded-lg overflow-hidden bg-white text-xs">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                                <th className="p-2.5 text-start">Module</th>
                                                <th className="p-2.5 text-center w-16">Read</th>
                                                <th className="p-2.5 text-center w-16">Write</th>
                                                <th className="p-2.5 text-center w-16">Delete</th>
                                                <th className="p-2.5 text-center w-16">Export</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E5E0D8]">
                                            {MODULE_KEYS.map((mKey) => {
                                                const meta = MODULE_INFO[mKey];
                                                const Icon = meta.icon;
                                                const p = viewingGroup.permissions[mKey];

                                                return (
                                                    <tr key={mKey} className="hover:bg-[#FAF8F5]/60 transition-colors">
                                                        <td className="p-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-3.5 h-3.5 text-[#2D3F2C]" />
                                                                <span className="font-semibold text-[#0D0D0D]">
                                                                    {isRtl ? meta.nameAr : meta.nameEn}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.read ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.write ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.delete ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.export ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Assigned Roles List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-[#2D3F2C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.securityGroups.details.assignedRolesList', {
                                                defaultValue: 'Assigned Roles',
                                            })}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono font-semibold text-[#2D3F2C]">
                                        {(groupRoleMap.get(viewingGroup.id) || []).length} Roles
                                    </span>
                                </div>

                                {(() => {
                                    const linkedRoles = groupRoleMap.get(viewingGroup.id) || [];
                                    if (linkedRoles.length === 0) {
                                        return (
                                            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#6E6862]">
                                                {t('ums.securityGroups.details.noRoles', {
                                                    defaultValue: 'No roles currently linked to this security group.',
                                                })}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {linkedRoles.map((role) => (
                                                <div
                                                    key={role.id}
                                                    className="p-3 rounded-lg border border-[#E5E0D8] bg-white flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                                                                {role.code}
                                                            </span>
                                                            <span className="font-semibold text-[#0D0D0D]">
                                                                {isRtl ? role.nameAr : role.nameEn}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-[#6E6862] mt-0.5 block">
                                                            Level {role.level} • {role.status}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF8F5] text-[#2D3F2C]">
                                                        {role.employeeCount} staff
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Assigned Employees List */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-[#2D3F2C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.securityGroups.details.assignedEmployeesList', {
                                                defaultValue: 'Assigned Users & Employees',
                                            })}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono font-semibold text-[#2D3F2C]">
                                        {(groupEmployeeMap.get(viewingGroup.id) || []).length} Users
                                    </span>
                                </div>

                                {(() => {
                                    const linkedEmps = groupEmployeeMap.get(viewingGroup.id) || [];
                                    if (linkedEmps.length === 0) {
                                        return (
                                            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#6E6862]">
                                                {t('ums.securityGroups.details.noEmployees', {
                                                    defaultValue: 'No active employees assigned under this security group.',
                                                })}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="space-y-2">
                                            {linkedEmps.map((emp) => {
                                                const linkedRole = roles.find((r) => r.id === emp.roleId);
                                                const linkedDept = departments.find((d) => d.id === emp.departmentId);
                                                const roleTitle = linkedRole
                                                    ? isRtl
                                                        ? linkedRole.nameAr
                                                        : linkedRole.nameEn
                                                    : 'Staff Role';
                                                const deptTitle = linkedDept
                                                    ? isRtl
                                                        ? linkedDept.nameAr
                                                        : linkedDept.nameEn
                                                    : 'General';

                                                return (
                                                    <div
                                                        key={emp.id}
                                                        className="p-3 rounded-lg border border-[#E5E0D8] bg-white flex items-center justify-between text-xs"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center font-bold text-[10px]">
                                                                {emp.nameEn.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-[#0D0D0D]">
                                                                    {isRtl ? emp.nameAr : emp.nameEn}
                                                                </div>
                                                                <div className="text-[10px] text-[#6E6862] font-mono">
                                                                    {emp.code} • {emp.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="text-[11px] font-medium text-[#2D3F2C] block">
                                                                {roleTitle}
                                                            </span>
                                                            <span className="text-[10px] text-[#6E6862]">
                                                                {deptTitle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => handleCopyCode(viewingGroup.code)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6E6862] hover:text-[#0D0D0D] rounded border border-[#E5E0D8] bg-white"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const g = viewingGroup;
                                        setViewingGroup(null);
                                        handleOpenEdit(g);
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all"
                                >
                                    {t('ums.common.edit', { defaultValue: 'Edit Group' })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingGroup(null)}
                                    className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] transition-colors"
                                >
                                    {t('ums.common.close', { defaultValue: 'Close' })}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingGroup && deleteEligibility && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E0D8] overflow-hidden animate-in zoom-in-95 duration-150"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="p-5 text-start space-y-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                        deleteEligibility.canDelete
                                            ? 'bg-[#FFEBEE] text-[#D32F2F]'
                                            : 'bg-[#FFF8E1] text-[#F57F17]'
                                    }`}
                                >
                                    {deleteEligibility.canDelete ? (
                                        <Trash2 className="w-6 h-6" />
                                    ) : (
                                        <ShieldAlert className="w-6 h-6" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-[#0D0D0D]">
                                        {deleteEligibility.canDelete
                                            ? 'Confirm Group Deletion'
                                            : 'Deletion Restricted'}
                                    </h3>
                                    <p className="text-xs text-[#6E6862]">
                                        {deletingGroup.code} —{' '}
                                        {isRtl ? deletingGroup.nameAr : deletingGroup.nameEn}
                                    </p>
                                </div>
                            </div>

                            {deleteEligibility.canDelete ? (
                                <p className="text-xs text-[#6E6862] leading-relaxed">
                                    Are you sure you want to permanently delete this security group? This action will permanently remove all module permissions for this container and cannot be undone.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#795548] leading-relaxed">
                                        {isRtl
                                            ? deleteEligibility.reasonAr
                                            : deleteEligibility.reasonEn}
                                    </div>
                                    <p className="text-xs text-[#6E6862]">
                                        To maintain platform security integrity, you can deactivate the security group instead, which immediately revokes access without breaking role relationships.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeletingGroup(null)}
                                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors"
                            >
                                {t('ums.common.cancel', { defaultValue: 'Cancel' })}
                            </button>

                            {deleteEligibility.canDelete ? (
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#D32F2F] text-white hover:bg-[#B71C1C] transition-all shadow-sm"
                                >
                                    {t('ums.common.delete', { defaultValue: 'Delete Group' })}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleDeactivateFromDeleteModal}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D3F2C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all shadow-sm"
                                >
                                    Deactivate Group Instead
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
