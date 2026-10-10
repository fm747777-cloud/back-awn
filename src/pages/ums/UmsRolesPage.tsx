import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    UserCheck,
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
    Shield,
    ShieldAlert,
    Copy,
    Check,
    Layers,
    CheckSquare,
    Square,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadRoles,
    saveRoles,
    loadSecurityGroups,
    loadEmployees,
    generateNextRoleCode,
    checkRoleDeletionEligibility,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    syncMasterEntityEmployeeCounts,
    UMS_PAGE_SIZE_OPTIONS,
    type RoleRecord,
    type SecurityGroupRecord,
    type EmployeeRecord,
} from './umsMockData';

interface RoleFormData {
    code: string;
    nameEn: string;
    nameAr: string;
    securityGroupId: string;
    level: number;
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

const DEFAULT_FORM: RoleFormData = {
    code: '',
    nameEn: '',
    nameAr: '',
    securityGroupId: '',
    level: 3,
    descriptionEn: '',
    descriptionAr: '',
    status: 'Active',
};

export const UmsRolesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Data State
    const [roles, setRoles] = useState<RoleRecord[]>(() => loadRoles());
    const [securityGroups] = useState<SecurityGroupRecord[]>(() => loadSecurityGroups());
    const [employees, setEmployees] = useState<EmployeeRecord[]>(() => loadEmployees());

    // Resolve live Security Group display name in active language
    const resolveSecurityGroupDisplayName = (item: RoleRecord): string => {
        if (item.securityGroupId) {
            const grp = securityGroups.find((g) => g.id === item.securityGroupId);
            if (grp) {
                return isRtl ? grp.nameAr || grp.nameEn : grp.nameEn;
            }
        }
        return item.securityGroupName;
    };

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
    const [securityGroupFilter, setSecurityGroupFilter] = useState<string>('ALL');
    const [levelFilter, setLevelFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Modals & Drawers State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [viewingRole, setViewingRole] = useState<RoleRecord | null>(null);
    const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null);
    const [formData, setFormData] = useState<RoleFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Live count of employees assigned to each role
    const employeeCountByRole = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const emp of employees) {
            if (emp.roleId) {
                counts[emp.roleId] = (counts[emp.roleId] || 0) + 1;
            }
        }
        return counts;
    }, [employees]);

    // Active security groups for form selection & filter
    const activeSecurityGroups = useMemo(() => {
        return securityGroups.filter((g) => g.status === 'Active');
    }, [securityGroups]);

    // Sync roles state with localStorage
    const persistRoles = (updated: RoleRecord[]) => {
        saveRoles(updated);
        syncMasterEntityEmployeeCounts(employees);
        setEmployees(loadEmployees());
        setRoles(loadRoles());
    };

    // Summary KPIs
    const kpis = useMemo(() => {
        const total = roles.length;
        const active = roles.filter((r) => r.status === 'Active').length;
        const inactive = total - active;
        const totalAssignedStaff = roles.reduce(
            (acc, r) => acc + (employeeCountByRole[r.id] || 0),
            0
        );

        // Tier distribution
        const tier1Count = roles.filter((r) => r.level === 1).length;
        const tier2to3Count = roles.filter((r) => r.level >= 2 && r.level <= 3).length;

        return {
            total,
            active,
            inactive,
            totalAssignedStaff,
            tier1Count,
            tier2to3Count,
        };
    }, [roles, employeeCountByRole]);

    // Filtered & Paginated records
    const filteredRoles = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return roles.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (securityGroupFilter !== 'ALL' && item.securityGroupId !== securityGroupFilter) {
                return false;
            }
            if (levelFilter !== 'ALL' && String(item.level) !== levelFilter) {
                return false;
            }
            if (!query) return true;
            const linkedGroup = item.securityGroupId
                ? securityGroups.find((g) => g.id === item.securityGroupId)
                : undefined;
            return (
                item.code.toLowerCase().includes(query) ||
                item.nameEn.toLowerCase().includes(query) ||
                item.nameAr.toLowerCase().includes(query) ||
                (linkedGroup &&
                    (linkedGroup.nameEn.toLowerCase().includes(query) ||
                        linkedGroup.nameAr.toLowerCase().includes(query))) ||
                item.securityGroupName.toLowerCase().includes(query) ||
                String(item.level).includes(query) ||
                item.descriptionEn.toLowerCase().includes(query) ||
                item.descriptionAr.toLowerCase().includes(query)
            );
        });
    }, [roles, searchQuery, statusFilter, securityGroupFilter, levelFilter, securityGroups]);

    const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
    const paginatedRoles = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRoles.slice(start, start + pageSize);
    }, [filteredRoles, currentPage, pageSize]);

    // Selection
    const isAllSelected =
        paginatedRoles.length > 0 &&
        paginatedRoles.every((r) => selectedIds.includes(r.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !paginatedRoles.some((r) => r.id === id))
            );
        } else {
            const pageIds = paginatedRoles.map((r) => r.id);
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
        setSecurityGroupFilter('ALL');
        setLevelFilter('ALL');
        setCurrentPage(1);
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        const nextCode = generateNextRoleCode(roles);
        const defaultSecGroup = activeSecurityGroups[0]?.id || '';
        setFormData({
            ...DEFAULT_FORM,
            code: nextCode,
            securityGroupId: defaultSecGroup,
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (role: RoleRecord) => {
        setEditingRole(role);
        setFormData({
            code: role.code,
            nameEn: role.nameEn,
            nameAr: role.nameAr,
            securityGroupId: role.securityGroupId,
            level: role.level,
            descriptionEn: role.descriptionEn,
            descriptionAr: role.descriptionAr,
            status: role.status,
        });
        setFormErrors({});
    };

    // Validation
    const validateForm = (isEditing = false, currentId?: string): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.nameEn.trim()) {
            errors.nameEn = t('ums.roles.validation.nameEnRequired', {
                defaultValue: 'English role name is required.',
            });
        }

        if (!formData.nameAr.trim()) {
            errors.nameAr = t('ums.roles.validation.nameArRequired', {
                defaultValue: 'Arabic role name is required.',
            });
        }

        if (!formData.securityGroupId) {
            errors.securityGroupId = t('ums.roles.validation.securityGroupRequired', {
                defaultValue: 'Security group selection is required.',
            });
        }

        if (!formData.level || formData.level < 1 || formData.level > 5) {
            errors.level = t('ums.roles.validation.levelRequired', {
                defaultValue: 'Role level (1-5) is required.',
            });
        }

        // Duplicate Name check (case-insensitive)
        const duplicateEn = roles.find(
            (r) =>
                (!isEditing || r.id !== currentId) &&
                r.nameEn.trim().toLowerCase() === formData.nameEn.trim().toLowerCase()
        );
        if (duplicateEn) {
            errors.nameEn = t('ums.roles.validation.duplicateName', {
                defaultValue: 'A role with this name already exists.',
            });
        }

        const duplicateAr = roles.find(
            (r) =>
                (!isEditing || r.id !== currentId) &&
                r.nameAr.trim().toLowerCase() === formData.nameAr.trim().toLowerCase()
        );
        if (duplicateAr) {
            errors.nameAr = t('ums.roles.validation.duplicateName', {
                defaultValue: 'A role with this name already exists.',
            });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const linkedGroup = securityGroups.find((g) => g.id === formData.securityGroupId);
        const groupName = linkedGroup ? linkedGroup.nameEn : 'Custom Security Group';

        const newRole: RoleRecord = {
            id: `rol-${Date.now()}`,
            code: formData.code.trim() || generateNextRoleCode(roles),
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            securityGroupId: formData.securityGroupId,
            securityGroupName: groupName,
            level: Number(formData.level),
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
            employeeCount: 0,
            createdAt: new Date().toISOString().slice(0, 10),
        };

        const updated = [newRole, ...roles];
        persistRoles(updated);

        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Role',
            resourceId: newRole.id,
            resourceName: newRole.nameEn,
            detailsEn: `Created role ${newRole.code} (${newRole.nameEn}) at authorization Level ${newRole.level}.`,
            detailsAr: `إنشاء دور جديد ${newRole.code} (${newRole.nameAr}) بمستوى صلاحية ${newRole.level}.`,
            newState: JSON.stringify(newRole),
        });

        toast.success(
            t('ums.roles.feedback.created', {
                defaultValue: `Role ${newRole.nameEn} created successfully.`,
                name: newRole.nameEn,
            })
        );
        setIsCreateOpen(false);
    };

    // Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;
        if (!validateForm(true, editingRole.id)) return;

        const linkedGroup = securityGroups.find((g) => g.id === formData.securityGroupId);
        const groupName = linkedGroup ? linkedGroup.nameEn : editingRole.securityGroupName;

        const updatedRole: RoleRecord = {
            ...editingRole,
            nameEn: formData.nameEn.trim(),
            nameAr: formData.nameAr.trim(),
            securityGroupId: formData.securityGroupId,
            securityGroupName: groupName,
            level: Number(formData.level),
            descriptionEn: formData.descriptionEn.trim(),
            descriptionAr: formData.descriptionAr.trim(),
            status: formData.status,
        };

        const updated = roles.map((r) => (r.id === editingRole.id ? updatedRole : r));
        persistRoles(updated);

        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Role',
            resourceId: updatedRole.id,
            resourceName: updatedRole.nameEn,
            detailsEn: `Updated role ${updatedRole.code} (${updatedRole.nameEn}).`,
            detailsAr: `تحديث بيانات الدور ${updatedRole.code} (${updatedRole.nameAr}).`,
            previousState: JSON.stringify(editingRole),
            newState: JSON.stringify(updatedRole),
        });

        toast.success(
            t('ums.roles.feedback.updated', {
                defaultValue: `Role ${updatedRole.nameEn} updated successfully.`,
                name: updatedRole.nameEn,
            })
        );
        setEditingRole(null);
    };

    // Quick Status Toggle
    const handleToggleStatus = (role: RoleRecord) => {
        const nextStatus: 'Active' | 'Inactive' =
            role.status === 'Active' ? 'Inactive' : 'Active';
        const updated = roles.map((r) =>
            r.id === role.id ? { ...r, status: nextStatus } : r
        );
        persistRoles(updated);

        const actionType = nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED';
        recordUmsAuditEvent({
            action: actionType,
            resource: 'Role',
            resourceId: role.id,
            resourceName: role.nameEn,
            detailsEn: `Changed status of ${role.code} to ${nextStatus}.`,
            detailsAr: `تغيير حالة الدور ${role.code} إلى ${nextStatus === 'Active' ? 'نشط' : 'معطل'}.`,
        });

        toast.success(
            t('ums.roles.feedback.statusChanged', {
                defaultValue: `Role ${role.nameEn} is now ${nextStatus}.`,
                name: role.nameEn,
                status: nextStatus,
            })
        );
    };

    // Delete check & action
    const handleDeleteClick = (role: RoleRecord) => {
        setDeletingRole(role);
    };

    const handleConfirmDelete = () => {
        if (!deletingRole) return;

        const check = checkRoleDeletionEligibility(deletingRole.id, employees);
        if (!check.canDelete) {
            toast.error(isRtl ? check.reasonAr : check.reasonEn);
            return;
        }

        const updated = roles.filter((r) => r.id !== deletingRole.id);
        persistRoles(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== deletingRole.id));

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Role',
            resourceId: deletingRole.id,
            resourceName: deletingRole.nameEn,
            detailsEn: `Deleted role ${deletingRole.code} (${deletingRole.nameEn}).`,
            detailsAr: `حذف الدور ${deletingRole.code} (${deletingRole.nameAr}).`,
            previousState: JSON.stringify(deletingRole),
        });

        toast.success(
            t('ums.roles.feedback.deleted', {
                defaultValue: `Role ${deletingRole.nameEn} deleted successfully.`,
                name: deletingRole.nameEn,
            })
        );
        setDeletingRole(null);
    };

    // Export CSV
    const handleExportCsv = () => {
        if (roles.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found' }));
            return;
        }

        const headers = [
            'Role Code',
            'Name (English)',
            'Name (Arabic)',
            'Security Group',
            'Level',
            'Assigned Users',
            'Status',
            'Created Date',
            'Description (EN)',
        ];

        const rows = roles.map((r) => [
            escapeSafeCsvCell(r.code),
            escapeSafeCsvCell(r.nameEn),
            escapeSafeCsvCell(r.nameAr),
            escapeSafeCsvCell(resolveSecurityGroupDisplayName(r)),
            r.level,
            employeeCountByRole[r.id] || 0,
            escapeSafeCsvCell(r.status),
            escapeSafeCsvCell(r.createdAt),
            escapeSafeCsvCell(r.descriptionEn || ''),
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `AWN_Roles_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Role',
            resourceId: 'ALL',
            resourceName: 'Roles Catalog',
            detailsEn: `Exported ${roles.length} role records to CSV.`,
            detailsAr: `تصدير ${roles.length} سجل من سجلات الأدوار إلى ملف CSV.`,
        });

        toast.success(
            t('ums.roles.feedback.exported', { defaultValue: 'Roles exported successfully.' })
        );
    };

    // Assigned employees for currently viewed role
    const viewedEmployees = useMemo(() => {
        if (!viewingRole) return [];
        return employees.filter((e) => e.roleId === viewingRole.id);
    }, [viewingRole, employees]);

    // Attached security group for currently viewed role
    const viewedSecurityGroup = useMemo(() => {
        if (!viewingRole) return null;
        return securityGroups.find((g) => g.id === viewingRole.securityGroupId);
    }, [viewingRole, securityGroups]);

    // Deletion eligibility for modal
    const deletionEligibility = useMemo(() => {
        if (!deletingRole) return null;
        return checkRoleDeletionEligibility(deletingRole.id, employees);
    }, [deletingRole, employees]);

    // Helper: Level description badge
    const renderLevelBadge = (level: number) => {
        switch (level) {
            case 1:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C28E3A]" />
                        <span>{t('ums.roles.level1', { defaultValue: 'Level 1 · Super Admin' })}</span>
                    </span>
                );
            case 2:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#265938]" />
                        <span>{t('ums.roles.level2', { defaultValue: 'Level 2 · Managerial' })}</span>
                    </span>
                );
            case 3:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#45413C] border border-[#E5E0D8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4A6B53]" />
                        <span>{t('ums.roles.level3', { defaultValue: 'Level 3 · Operational' })}</span>
                    </span>
                );
            case 4:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#6E6862] border border-[#E5E0D8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#857E74]" />
                        <span>{t('ums.roles.level4', { defaultValue: 'Level 4 · Specialist' })}</span>
                    </span>
                );
            case 5:
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A8A298]" />
                        <span>{t('ums.roles.level5', { defaultValue: 'Level 5 · Basic' })}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.roles.title', { defaultValue: 'Roles Master' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            ROL-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.roles.subtitle', {
                            defaultValue:
                                'Organizational hierarchy, job levels, and assigned security policies.',
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
                        <span>{t('ums.roles.addRole', { defaultValue: 'Add Role' })}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.roles.kpi.total', { defaultValue: 'Total Roles' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            <UserCheck size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.roles.kpi.units', { defaultValue: 'Roles' })}
                        </span>
                    </div>
                </div>

                {/* Active */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.roles.kpi.active', { defaultValue: 'Active Roles' })}
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
                            {t('ums.roles.kpi.operating', { defaultValue: 'Operational' })}
                        </span>
                    </div>
                </div>

                {/* Tier Breakdown */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.roles.kpi.avgLevel', { defaultValue: 'Tier Breakdown' })}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#C28E3A]">
                            <Layers size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            L1–L3
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t('ums.roles.kpi.tierDesc', { defaultValue: 'Hierarchical' })}
                        </span>
                    </div>
                </div>

                {/* Assigned Workforce */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('ums.roles.kpi.workforce', { defaultValue: 'Assigned Users' })}
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
                            {t('ums.roles.kpi.employeesTotal', { defaultValue: 'Users' })}
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
                            placeholder={t('ums.roles.searchPlaceholder', {
                                defaultValue: 'Search roles by code, name, security group, level, or description...',
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
                        {/* Security Group Filter */}
                        <div className="min-w-[170px]">
                            <select
                                value={securityGroupFilter}
                                onChange={(e) => {
                                    setSecurityGroupFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.roles.filterSecurityGroup', { defaultValue: 'Filter Security Group' })}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#45413C] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">
                                    {t('common.allSecurityGroups', { defaultValue: 'All Security Groups' })}
                                </option>
                                {activeSecurityGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {isRtl ? group.nameAr : group.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Level Filter */}
                        <div className="min-w-[130px]">
                            <select
                                value={levelFilter}
                                onChange={(e) => {
                                    setLevelFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                aria-label={t('ums.roles.filterLevel', { defaultValue: 'Filter Level' })}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#45413C] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] cursor-pointer"
                            >
                                <option value="ALL">{t('ums.roles.allLevels', { defaultValue: 'All Levels' })}</option>
                                <option value="1">Level 1 (Admin)</option>
                                <option value="2">Level 2 (Managerial)</option>
                                <option value="3">Level 3 (Operational)</option>
                                <option value="4">Level 4 (Specialist)</option>
                                <option value="5">Level 5 (Basic)</option>
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

                        {/* Reset Filters */}
                        {(searchQuery ||
                            statusFilter !== 'ALL' ||
                            securityGroupFilter !== 'ALL' ||
                            levelFilter !== 'ALL') && (
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

                {/* Bulk selection action bar */}
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
                                    {t('ums.roles.colCode', { defaultValue: 'Code' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.roles.colName', { defaultValue: 'Role Name' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.roles.colSecurityGroup', { defaultValue: 'Security Group' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.roles.colLevel', { defaultValue: 'Level' })}
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.roles.colStaff', { defaultValue: 'Assigned Users' })}
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
                            {paginatedRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-[#857E74]">
                                        <UserCheck size={32} className="mx-auto mb-2 text-[#857E74]/40" />
                                        <p className="font-semibold text-[#0D0D0D]">
                                            {t('common.noRecords', { defaultValue: 'No roles found' })}
                                        </p>
                                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                                            {searchQuery ||
                                            statusFilter !== 'ALL' ||
                                            securityGroupFilter !== 'ALL' ||
                                            levelFilter !== 'ALL'
                                                ? t('common.tryAdjustingFilters', { defaultValue: 'Try clearing your search query or filters.' })
                                                : t('ums.roles.noRolesYet', { defaultValue: 'Get started by creating your first corporate role.' })}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRoles.map((item) => {
                                    const staffCount = employeeCountByRole[item.id] || 0;
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
                                                    aria-label={`Select ${item.nameEn}`}
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

                                            {/* Name (Bilingual) */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#0D0D0D]">
                                                        {isRtl ? item.nameAr : item.nameEn}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862]">
                                                        {isRtl ? item.nameEn : item.nameAr}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Security Group */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs text-[#45413C]">
                                                    <Shield size={13} className="text-[#2D3F2C]" />
                                                    <span className="font-medium">
                                                        {resolveSecurityGroupDisplayName(item)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Level Badge */}
                                            <td className="px-4 py-3">
                                                {renderLevelBadge(item.level)}
                                            </td>

                                            {/* Assigned Staff */}
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRole(item)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                                    title={t('ums.roles.staffPreview', {
                                                        defaultValue: 'View assigned users',
                                                    })}
                                                >
                                                    <Users size={13} className="text-[#857E74]" />
                                                    <span>
                                                        {staffCount > 0
                                                            ? `${staffCount} ${t('ums.roles.staffPreview', { defaultValue: 'Users' })}`
                                                            : t('ums.roles.noStaffAssigned', { defaultValue: 'No Users' })}
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
                                                        onClick={() => setViewingRole(item)}
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
                                    filteredRoles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
                                } - ${Math.min(
                                    currentPage * pageSize,
                                    filteredRoles.length
                                )} of ${filteredRoles.length}`,
                                start: filteredRoles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                                end: Math.min(currentPage * pageSize, filteredRoles.length),
                                total: filteredRoles.length,
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
            {(isCreateOpen || editingRole) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {isCreateOpen
                                        ? t('ums.roles.addRole', { defaultValue: 'Add Role' })
                                        : t('ums.roles.editRole', { defaultValue: 'Edit Role' })}
                                </h2>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {formData.code}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingRole(null);
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
                                    {t('ums.roles.colCode', { defaultValue: 'Code' })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#6E6862] cursor-not-allowed"
                                />
                            </div>

                            {/* Name EN & AR */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.roles.form.nameEn', { defaultValue: 'Role Name (EN)' })}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                                        }
                                        placeholder="e.g. Operations Specialist"
                                        className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                            formErrors.nameEn
                                                ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.nameEn && (
                                        <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                            {formErrors.nameEn}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.roles.form.nameAr', { defaultValue: 'Role Name (AR)' })}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={formData.nameAr}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, nameAr: e.target.value }))
                                        }
                                        placeholder="مثال: أخصائي عمليات تنفيذية"
                                        className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                            formErrors.nameAr
                                                ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.nameAr && (
                                        <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                            {formErrors.nameAr}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Security Group Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.roles.form.securityGroup', { defaultValue: 'Security Group' })}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={formData.securityGroupId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, securityGroupId: e.target.value }))
                                    }
                                    className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer ${
                                        formErrors.securityGroupId
                                            ? 'border-[#DC2626] focus:border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('common.selectSecurityGroup', { defaultValue: '-- Select Security Group --' })}
                                    </option>
                                    {activeSecurityGroups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.code} — {isRtl ? g.nameAr : g.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.securityGroupId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                        {formErrors.securityGroupId}
                                    </p>
                                )}
                            </div>

                            {/* Role Authorization Level */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.roles.form.level', { defaultValue: 'Authorization Level' })}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={formData.level}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, level: Number(e.target.value) }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] cursor-pointer"
                                >
                                    <option value={1}>
                                        {t('ums.roles.level1', { defaultValue: 'Level 1 — Executive / Super Admin' })}
                                    </option>
                                    <option value={2}>
                                        {t('ums.roles.level2', { defaultValue: 'Level 2 — Departmental / Managerial' })}
                                    </option>
                                    <option value={3}>
                                        {t('ums.roles.level3', { defaultValue: 'Level 3 — Operational / Supervisory' })}
                                    </option>
                                    <option value={4}>
                                        {t('ums.roles.level4', { defaultValue: 'Level 4 — Specialist / Staff' })}
                                    </option>
                                    <option value={5}>
                                        {t('ums.roles.level5', { defaultValue: 'Level 5 — Basic / Read-Only' })}
                                    </option>
                                </select>
                            </div>

                            {/* Description EN */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.roles.form.descEn', { defaultValue: 'Description (EN)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))
                                    }
                                    placeholder="Scope of authority, access policies, and responsibilities..."
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                />
                            </div>

                            {/* Description AR */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.roles.form.descAr', { defaultValue: 'Description (AR)' })}
                                </label>
                                <textarea
                                    rows={2}
                                    dir="rtl"
                                    value={formData.descriptionAr}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, descriptionAr: e.target.value }))
                                    }
                                    placeholder="نطاق الصلاحيات، سياسات الوصول والمسؤوليات..."
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
                                            name="roleStatus"
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
                                            name="roleStatus"
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
                                        setEditingRole(null);
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
            {viewingRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                                    <UserCheck size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {isRtl ? viewingRole.nameAr : viewingRole.nameEn}
                                    </h2>
                                    <span className="font-mono text-xs text-[#6E6862]">
                                        {viewingRole.code}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingRole(null)}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 text-xs">
                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.roles.colSecurityGroup', { defaultValue: 'Security Group' })}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                        {resolveSecurityGroupDisplayName(viewingRole)}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.roles.colLevel', { defaultValue: 'Level' })}
                                    </span>
                                    <div className="mt-1">{renderLevelBadge(viewingRole.level)}</div>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('common.status', { defaultValue: 'Status' })}
                                    </span>
                                    <span
                                        className={`inline-block font-semibold mt-0.5 ${
                                            viewingRole.status === 'Active'
                                                ? 'text-[#265938]'
                                                : 'text-[#857E74]'
                                        }`}
                                    >
                                        {viewingRole.status}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('common.createdAt', { defaultValue: 'Created Date' })}
                                    </span>
                                    <span className="font-mono font-medium text-[#45413C] mt-0.5 block">
                                        {viewingRole.createdAt}
                                    </span>
                                </div>
                            </div>

                            {/* Security Group Permissions Matrix */}
                            {viewedSecurityGroup && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield size={14} className="text-[#2D3F2C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.roles.permissionsPreview', {
                                                defaultValue: 'Security Group Permissions Matrix',
                                            })}{' '}
                                            <span className="font-normal text-[#6E6862]">
                                                ({viewedSecurityGroup.code} — {isRtl ? viewedSecurityGroup.nameAr : viewedSecurityGroup.nameEn})
                                            </span>
                                        </h3>
                                    </div>

                                    <div className="border border-[#E5E0D8] rounded-lg overflow-hidden bg-white">
                                        <table className="w-full text-start text-[11px]">
                                            <thead>
                                                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                                    <th className="px-3 py-2 text-start">Module</th>
                                                    <th className="px-3 py-2 text-center">Read</th>
                                                    <th className="px-3 py-2 text-center">Write</th>
                                                    <th className="px-3 py-2 text-center">Delete</th>
                                                    <th className="px-3 py-2 text-center">Export</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#EFECE6] text-[#45413C]">
                                                {Object.entries(viewedSecurityGroup.permissions).map(
                                                    ([modKey, perm]) => (
                                                        <tr key={modKey} className="hover:bg-[#FAF8F5]/50">
                                                            <td className="px-3 py-1.5 font-semibold uppercase font-mono text-[#0D0D0D]">
                                                                {modKey}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center">
                                                                {perm.read ? (
                                                                    <CheckSquare size={13} className="inline text-[#265938]" />
                                                                ) : (
                                                                    <Square size={13} className="inline text-[#857E74]/40" />
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center">
                                                                {perm.write ? (
                                                                    <CheckSquare size={13} className="inline text-[#265938]" />
                                                                ) : (
                                                                    <Square size={13} className="inline text-[#857E74]/40" />
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center">
                                                                {perm.delete ? (
                                                                    <CheckSquare size={13} className="inline text-[#DC2626]" />
                                                                ) : (
                                                                    <Square size={13} className="inline text-[#857E74]/40" />
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-1.5 text-center">
                                                                {perm.export ? (
                                                                    <CheckSquare size={13} className="inline text-[#2D3F2C]" />
                                                                ) : (
                                                                    <Square size={13} className="inline text-[#857E74]/40" />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Descriptions */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.roles.form.descEn', { defaultValue: 'Description (EN)' })}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingRole.descriptionEn || 'No English description provided.'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                        {t('ums.roles.form.descAr', { defaultValue: 'Description (AR)' })}
                                    </h3>
                                    <p
                                        dir="rtl"
                                        className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]"
                                    >
                                        {viewingRole.descriptionAr || 'لا يوجد وصف عربي.'}
                                    </p>
                                </div>
                            </div>

                            {/* Assigned Employees */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-[#0D0D0D]">
                                        {t('ums.roles.staffPreview', { defaultValue: 'Assigned Users' })}{' '}
                                        <span className="text-[#265938]">({viewedEmployees.length})</span>
                                    </h3>
                                </div>

                                {viewedEmployees.length === 0 ? (
                                    <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#857E74]">
                                        {t('ums.roles.noStaffAssigned', {
                                            defaultValue: 'No users currently assigned to this role.',
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
                                                            {emp.code} · {isRtl ? emp.departmentNameAr || emp.departmentName : emp.departmentName}
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
                                                    {t(`ums.employees.statuses.${emp.status}`, { defaultValue: emp.status })}
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
                                onClick={() => setViewingRole(null)}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingRole && deletionEligibility && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        {!deletionEligibility.canDelete ? (
                            // Blocked Deletion Notice
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <ShieldAlert size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t('ums.roles.deleteBlockedTitle', {
                                        defaultValue: 'Cannot Delete Role',
                                    })}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4">
                                    {isRtl ? deletionEligibility.reasonAr : deletionEligibility.reasonEn}
                                </p>
                                <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingRole(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.close', { defaultValue: 'Close' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleToggleStatus(deletingRole);
                                            setDeletingRole(null);
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
                                    {t('ums.roles.deleteTitle', { defaultValue: 'Delete Role' })}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4">
                                    {t('ums.roles.deleteConfirmDesc', {
                                        defaultValue:
                                            'Are you sure you want to delete this role? This action cannot be undone.',
                                    })}
                                    <span className="block font-bold text-[#0D0D0D] mt-2">
                                        {deletingRole.code} —{' '}
                                        {isRtl ? deletingRole.nameAr : deletingRole.nameEn}
                                    </span>
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingRole(null)}
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

export default UmsRolesPage;
