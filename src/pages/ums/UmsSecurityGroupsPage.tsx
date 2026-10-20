import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Users,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Power,
    Shield,
    ShieldAlert,
    Copy,
    Check,
    CheckSquare,
    Square,
    Lock,
    KeyRound,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { umsApi } from '../../api/api';
import {
    SecurityGroupForm,
    MODULE_KEYS,
    MODULE_INFO,
    DEFAULT_PERMISSIONS,
    clonePermissions,
    countActivePermissions,
    type SecurityGroupFormValues,
    type SecurityGroupFormErrors,
    type InvitedMemberItem,
} from '../../components/ums/SecurityGroupForm';
import {
    loadSecurityGroups,
    saveSecurityGroups,
    loadEmployees,
    saveEmployees,
    loadDepartments,
    generateNextSecurityGroupCode,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    syncMasterEntityEmployeeCounts,
    UMS_PAGE_SIZE_OPTIONS,
    type SecurityGroupRecord,
    type RoleRecord,
    type EmployeeRecord,
    type DepartmentRecord,
} from './umsMockData';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_FORM_VALUES: SecurityGroupFormValues = {
    groupName: '',
    description: '',
    emailInput: '',
    invitedMembers: [],
    permissions: clonePermissions(DEFAULT_PERMISSIONS),
};

export const UmsSecurityGroupsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Server / Repository State via TanStack Query & umsApi
    const { data: groups = [] } = useQuery<SecurityGroupRecord[]>({
        queryKey: ['ums', 'security-groups'],
        queryFn: async () => umsApi.listSecurityGroups(),
    });

    const { data: roles = [] } = useQuery<RoleRecord[]>({
        queryKey: ['ums', 'roles'],
        queryFn: async () => umsApi.listRoles(),
    });

    const { data: employees = [] } = useQuery<EmployeeRecord[]>({
        queryKey: ['ums', 'employees'],
        queryFn: async () => {
            const res = await umsApi.listEmployees();
            return res.data ?? loadEmployees();
        },
    });

    const { data: departments = [] } = useQuery<DepartmentRecord[]>({
        queryKey: ['ums', 'departments'],
        queryFn: async () => {
            const res = await umsApi.listDepartments();
            return res.data ?? loadDepartments();
        },
    });

    // Mutations via umsApi
    const upsertSecurityGroupMutation = useMutation({
        mutationFn: async ( payload: {
            group: SecurityGroupRecord;
            invitedMembers: InvitedMemberItem[];
        }) => {
            const res = await umsApi.upsertSecurityGroup(payload.group);
            if (!res.ok) {
                throw new Error(
                    (isRtl ? res.messageAr : res.messageEn) ||
                        res.messageEn ||
                        'Failed to save security group'
                );
            }

            // Process invited employees and link them to this security group
            if (payload.invitedMembers.length > 0) {
                const currentEmployees = loadEmployees();
                const invitedEmailSet = new Set(
                    payload.invitedMembers.map((m) => m.email.toLowerCase())
                );
                const nowDate = new Date().toISOString().slice(0, 10);
                let anyUpdated = false;

                const updatedEmployees = currentEmployees.map((emp) => {
                    const matchEmail =
                        invitedEmailSet.has(emp.email.toLowerCase()) ||
                        (emp.workEmail && invitedEmailSet.has(emp.workEmail.toLowerCase()));
                    if (!matchEmail) return emp;
                    anyUpdated = true;
                    return {
                        ...emp,
                        securityGroupId: payload.group.id,
                        securityGroupName: payload.group.nameEn,
                        securityGroupNameAr: payload.group.nameAr,
                        invitationStatus:
                            emp.invitationStatus === 'Accepted'
                                ? ('Accepted' as const)
                                : ('Pending' as const),
                        invitedAt: nowDate,
                        updatedAt: nowDate,
                    };
                });

                if (anyUpdated) {
                    saveEmployees(updatedEmployees);
                    syncMasterEntityEmployeeCounts(updatedEmployees);
                }
            }

            return res.data ?? payload.group;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'security-groups'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'roles'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
        },
    });

    const saveSecurityGroupsBulkMutation = useMutation({
        mutationFn: async (nextGroups: SecurityGroupRecord[]) => {
            saveSecurityGroups(nextGroups);
            syncMasterEntityEmployeeCounts(loadEmployees());
            return umsApi.listSecurityGroups();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums', 'security-groups'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'roles'] });
            queryClient.invalidateQueries({ queryKey: ['ums', 'employees'] });
        },
    });

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
    const [formValues, setFormValues] = useState<SecurityGroupFormValues>(DEFAULT_FORM_VALUES);
    const [formErrors, setFormErrors] = useState<SecurityGroupFormErrors>({});
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
            const emps = employees.filter(
                (e) => e.securityGroupId === g.id || roleIdSet.has(e.roleId)
            );
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
            if (statusFilter !== 'All' && g.status !== statusFilter) {
                return false;
            }

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
    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredGroups.slice(start, start + pageSize);
    }, [filteredGroups, currentPage, pageSize]);

    // Selection handlers
    const allVisibleSelected =
        paginatedGroups.length > 0 &&
        paginatedGroups.every((g) => selectedIds.includes(g.id));

    const handleSelectAllVisible = useCallback(() => {
        if (allVisibleSelected) {
            const visibleIds = new Set(paginatedGroups.map((g) => g.id));
            setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
        } else {
            const combined = new Set([...selectedIds, ...paginatedGroups.map((g) => g.id)]);
            setSelectedIds(Array.from(combined));
        }
    }, [allVisibleSelected, paginatedGroups, selectedIds]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

    // Copy group code
    const handleCopyCode = useCallback(
        (code: string) => {
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
        },
        [t]
    );

    // Open Create Modal
    const handleOpenCreate = () => {
        setEditingGroup(null);
        setFormValues({
            groupName: '',
            description: '',
            emailInput: '',
            invitedMembers: [],
            permissions: clonePermissions(DEFAULT_PERMISSIONS),
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Modal
    const handleOpenEdit = useCallback(
        (group: SecurityGroupRecord) => {
            setIsCreateOpen(false);
            setEditingGroup(group);
            const assignedEmps = groupEmployeeMap.get(group.id) || [];
            setFormValues({
                groupName: isRtl ? group.nameAr || group.nameEn : group.nameEn || group.nameAr,
                description: isRtl
                    ? group.descriptionAr || group.descriptionEn
                    : group.descriptionEn || group.descriptionAr,
                emailInput: '',
                invitedMembers: assignedEmps.map((emp) => ({
                    email: emp.email,
                    employeeId: emp.id,
                    employeeName: isRtl ? emp.nameAr || emp.nameEn : emp.nameEn,
                    permissions: clonePermissions(group.permissions || DEFAULT_PERMISSIONS),
                })),
                permissions: clonePermissions(group.permissions || DEFAULT_PERMISSIONS),
            });
            setFormErrors({});
        },
        [groupEmployeeMap, isRtl]
    );

    const handleCloseForm = () => {
        setIsCreateOpen(false);
        setEditingGroup(null);
        setFormErrors({});
    };

    // Validate Form
    const validateForm = (isEditing: boolean, currentId?: string): boolean => {
        const errors: SecurityGroupFormErrors = {};
        const trimmedName = formValues.groupName.trim();
        const trimmedDesc = formValues.description.trim();

        if (!trimmedName) {
            errors.groupName = t('ums.securityGroups.validation.groupNameRequired', {
                defaultValue: 'Group Name is required.',
            });
        } else if (trimmedName.length < 2) {
            errors.groupName = t('ums.securityGroups.validation.groupNameMin', {
                defaultValue: 'Group Name must be at least 2 characters.',
            });
        } else {
            const duplicate = groups.find(
                (g) =>
                    (!isEditing || g.id !== currentId) &&
                    (g.nameEn.trim().toLowerCase() === trimmedName.toLowerCase() ||
                        g.nameAr.trim().toLowerCase() === trimmedName.toLowerCase())
            );
            if (duplicate) {
                errors.groupName = t('ums.securityGroups.validation.duplicateName', {
                    defaultValue: 'A security group with this name already exists.',
                });
            }
        }

        if (!trimmedDesc) {
            errors.description = t('ums.securityGroups.validation.descriptionRequired', {
                defaultValue: 'Description is required.',
            });
        }

        if (formValues.emailInput.trim()) {
            const parts = formValues.emailInput
                .trim()
                .split(/[\s,;]+/)
                .map((e) => e.trim())
                .filter(Boolean);
            const invalidEmail = parts.find((email) => !EMAIL_REGEX.test(email));
            if (invalidEmail) {
                errors.emailInput = t('ums.securityGroups.validation.invalidEmail', {
                    defaultValue: `Invalid email address: ${invalidEmail}`,
                });
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit Create / Edit
    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = Boolean(editingGroup);
        if (!validateForm(isEditing, editingGroup?.id)) return;

        const trimmedName = formValues.groupName.trim();
        const trimmedDesc = formValues.description.trim();

        // Collect any pending valid email(s) still in the input box
        const mergedInvites: InvitedMemberItem[] = [...formValues.invitedMembers];
        if (formValues.emailInput.trim()) {
            const existingSet = new Set(mergedInvites.map((m) => m.email.toLowerCase()));
            const rawEmails = formValues.emailInput
                .trim()
                .split(/[\s,;]+/)
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);

            rawEmails.forEach((email) => {
                if (!existingSet.has(email) && EMAIL_REGEX.test(email)) {
                    existingSet.add(email);
                    const matchedEmp = employees.find(
                        (emp) =>
                            emp.email.toLowerCase() === email ||
                            (emp.workEmail && emp.workEmail.toLowerCase() === email)
                    );
                    mergedInvites.push({
                        email,
                        employeeId: matchedEmp?.id,
                        employeeName: matchedEmp
                            ? isRtl
                                ? matchedEmp.nameAr || matchedEmp.nameEn
                                : matchedEmp.nameEn
                            : undefined,
                        permissions: clonePermissions(formValues.permissions),
                    });
                }
            });
        }

        try {
            if (editingGroup) {
                const updatedGroup: SecurityGroupRecord = {
                    ...editingGroup,
                    nameEn: isRtl ? editingGroup.nameEn || trimmedName : trimmedName,
                    nameAr: isRtl ? trimmedName : editingGroup.nameAr || trimmedName,
                    descriptionEn: isRtl ? editingGroup.descriptionEn || trimmedDesc : trimmedDesc,
                    descriptionAr: isRtl ? trimmedDesc : editingGroup.descriptionAr || trimmedDesc,
                    permissions: formValues.permissions,
                    userCount: Math.max(editingGroup.userCount, mergedInvites.length),
                };

                await upsertSecurityGroupMutation.mutateAsync({
                    group: updatedGroup,
                    invitedMembers: mergedInvites,
                });

                if (viewingGroup && viewingGroup.id === updatedGroup.id) {
                    setViewingGroup(updatedGroup);
                }

                recordUmsAuditEvent({
                    action: 'UPDATED',
                    resource: 'Security Group',
                    resourceId: updatedGroup.id,
                    resourceName: updatedGroup.nameEn,
                    detailsEn: `Updated security group ${updatedGroup.code} (${updatedGroup.nameEn}) with ${mergedInvites.length} member invitation(s).`,
                    detailsAr: `تحديث بيانات مجموعة الأمان ${updatedGroup.code} (${updatedGroup.nameAr}).`,
                    previousState: `Code: ${editingGroup.code} | Name: ${editingGroup.nameEn} | Status: ${editingGroup.status}`,
                    newState: `Code: ${updatedGroup.code} | Name: ${updatedGroup.nameEn} | Status: ${updatedGroup.status}`,
                });

                toast.success(
                    t('ums.securityGroups.feedback.updated', {
                        defaultValue: `Security group ${trimmedName} updated successfully.`,
                    })
                );
                setEditingGroup(null);
                return;
            }

            const newGroup: SecurityGroupRecord = {
                id: `sec-${Date.now()}`,
                code: generateNextSecurityGroupCode(groups),
                nameEn: trimmedName,
                nameAr: trimmedName,
                descriptionEn: trimmedDesc,
                descriptionAr: trimmedDesc,
                permissions: formValues.permissions,
                userCount: mergedInvites.length,
                status: 'Active',
                createdAt: new Date().toISOString().slice(0, 10),
            };

            await upsertSecurityGroupMutation.mutateAsync({
                group: newGroup,
                invitedMembers: mergedInvites,
            });

            recordUmsAuditEvent({
                action: 'CREATED',
                resource: 'Security Group',
                resourceId: newGroup.id,
                resourceName: newGroup.nameEn,
                detailsEn: `Created security group ${newGroup.code} (${newGroup.nameEn}) with ${countActivePermissions(newGroup.permissions)}/28 privileges configured and ${mergedInvites.length} employee invitation(s).`,
                detailsAr: `إنشاء مجموعة أمان جديدة ${newGroup.code} (${newGroup.nameAr}) وتعيين ${countActivePermissions(newGroup.permissions)}/28 صلاحية.`,
                newState: `Code: ${newGroup.code} | Name: ${newGroup.nameEn} | Status: ${newGroup.status}`,
            });

            toast.success(
                t('ums.securityGroups.feedback.created', {
                    defaultValue:
                        mergedInvites.length > 0
                            ? `Security group ${newGroup.nameEn} created and ${mergedInvites.length} invitation(s) sent.`
                            : `Security group ${newGroup.nameEn} created successfully.`,
                })
            );
            setIsCreateOpen(false);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save security group');
        }
    };

    // Quick Status Toggle
    const handleToggleStatus = useCallback(
        async (group: SecurityGroupRecord) => {
            const nextStatus: 'Active' | 'Inactive' =
                group.status === 'Active' ? 'Inactive' : 'Active';
            const updatedGroup: SecurityGroupRecord = {
                ...group,
                status: nextStatus,
            };

            try {
                await upsertSecurityGroupMutation.mutateAsync({
                    group: updatedGroup,
                    invitedMembers: [],
                });

                if (viewingGroup && viewingGroup.id === group.id) {
                    setViewingGroup(updatedGroup);
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
            } catch (err: any) {
                toast.error(err?.message || 'Failed to update status');
            }
        },
        [upsertSecurityGroupMutation, viewingGroup, t]
    );

    // Delete check & execution via umsApi
    const deleteEligibility = useMemo(() => {
        if (!deletingGroup) return null;
        return umsApi.checkSecurityGroupDeletionEligibility(
            deletingGroup.id,
            roles,
            employees
        );
    }, [deletingGroup, roles, employees]);

    const handleConfirmDelete = () => {
        if (!deletingGroup || !deleteEligibility?.canDelete) return;

        const target = deletingGroup;
        const currentList = loadSecurityGroups();
        const updated = currentList.filter((g) => g.id !== target.id);
        saveSecurityGroupsBulkMutation.mutate(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));

        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Security Group',
            resourceId: target.id,
            resourceName: target.nameEn,
            detailsEn: `Permanently deleted security group ${target.code} (${target.nameEn}).`,
            detailsAr: `تم حذف مجموعة الأمان ${target.code} (${target.nameAr}) نهائياً.`,
            previousState: `Code: ${target.code} | Name: ${target.nameEn} | Status: ${target.status}`,
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
        saveSecurityGroupsBulkMutation.mutate(updated);
        toast.success(`${selectedIds.length} security group(s) activated successfully.`);
        setSelectedIds([]);
    };

    const handleBatchDeactivate = () => {
        if (selectedIds.length === 0) return;
        const updated = groups.map((g) =>
            selectedIds.includes(g.id) ? { ...g, status: 'Inactive' as const } : g
        );
        saveSecurityGroupsBulkMutation.mutate(updated);
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
                escapeSafeCsvCell(g.code),
                escapeSafeCsvCell(g.nameEn),
                escapeSafeCsvCell(g.nameAr),
                escapeSafeCsvCell(g.descriptionEn || ''),
                escapeSafeCsvCell(g.descriptionAr || ''),
                roleCount,
                userCount,
                escapeSafeCsvCell(`${activePrivileges} / 28`),
                escapeSafeCsvCell(g.status),
                escapeSafeCsvCell(g.createdAt),
            ].join(',');
        });

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

    // DataTable Columns
    const columns: ColumnDef<any, SecurityGroupRecord>[] = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleSelectAllVisible}
                            className="text-[#037F8C] hover:opacity-80 cursor-pointer"
                            title="Select all on page"
                        >
                            {allVisibleSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#037F8C]" />
                            ) : (
                                <Square className="w-4 h-4 text-[#6E6862]" />
                            )}
                        </button>
                    </div>
                ),
                cell: ({ row }) => {
                    const group = row.original;
                    const isSelected = selectedIds.includes(group.id);
                    return (
                        <div className="flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => handleToggleSelect(group.id)}
                                className="text-[#037F8C] cursor-pointer"
                            >
                                {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-[#037F8C]" />
                                ) : (
                                    <Square className="w-4 h-4 text-[#6E6862]/60" />
                                )}
                            </button>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'code',
                header: () =>
                    t('ums.securityGroups.table.groupCode', { defaultValue: 'Group Code' }),
                cell: ({ row }) => {
                    const group = row.original;
                    return (
                        <div className="flex items-center gap-1.5">
                            <span
                                className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                                dir="ltr"
                            >
                                {group.code}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(group.code)}
                                className="p-1 text-[#6E6862] hover:text-[#0D0D0D] rounded hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                title="Copy code"
                            >
                                {copiedCode === group.code ? (
                                    <Check className="w-3 h-3 text-[#2E7D32]" />
                                ) : (
                                    <Copy className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                    );
                },
            },
            {
                id: 'groupName',
                header: () =>
                    t('ums.securityGroups.table.groupName', { defaultValue: 'Group Name' }),
                cell: ({ row }) => {
                    const group = row.original;
                    return (
                        <div>
                            <div className="font-semibold text-[#0D0D0D]">
                                {isRtl ? group.nameAr : group.nameEn}
                            </div>
                            <div className="text-[11px] text-[#6E6862]">
                                {isRtl ? group.nameEn : group.nameAr}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'description',
                header: () => t('ums.common.description', { defaultValue: 'Description' }),
                cell: ({ row }) => {
                    const group = row.original;
                    return (
                        <div className="max-w-xs truncate text-[#6E6862]">
                            {isRtl
                                ? group.descriptionAr || group.descriptionEn || '—'
                                : group.descriptionEn || group.descriptionAr || '—'}
                        </div>
                    );
                },
            },
            {
                id: 'permissionsSummary',
                header: () =>
                    t('ums.securityGroups.table.permissionsSummary', {
                        defaultValue: 'Permissions',
                    }),
                cell: ({ row }) => {
                    const group = row.original;
                    const activePermissions = countActivePermissions(group.permissions);
                    return (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8]">
                            <KeyRound className="w-3 h-3 text-[#037F8C]" />
                            <span className="font-mono font-semibold text-[#037F8C]">
                                {activePermissions}
                            </span>
                            <span className="text-[10px] text-[#6E6862]">/ 28 active</span>
                        </div>
                    );
                },
            },
            {
                id: 'rolesCount',
                header: () =>
                    t('ums.securityGroups.table.rolesCount', { defaultValue: 'Roles' }),
                cell: ({ row }) => {
                    const group = row.original;
                    const assignedRoles = groupRoleMap.get(group.id) || [];
                    return (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                            {assignedRoles.length}
                        </span>
                    );
                },
            },
            {
                id: 'usersCount',
                header: () =>
                    t('ums.securityGroups.table.usersCount', { defaultValue: 'Users' }),
                cell: ({ row }) => {
                    const group = row.original;
                    const assignedEmployees = groupEmployeeMap.get(group.id) || [];
                    return (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                            {assignedEmployees.length}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: () =>
                    t('ums.securityGroups.table.status', { defaultValue: 'Status' }),
                cell: ({ row }) => {
                    const group = row.original;
                    return (
                        <button
                            type="button"
                            onClick={() => handleToggleStatus(group)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
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
                    );
                },
            },
            {
                accessorKey: 'createdAt',
                header: () =>
                    t('ums.securityGroups.table.createdAt', {
                        defaultValue: 'Created Date',
                    }),
                cell: ({ row }) => (
                    <span className="text-[#6E6862] font-mono text-[11px]">
                        {row.original.createdAt}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => t('ums.common.actions', { defaultValue: 'Actions' }),
                cell: ({ row }) => {
                    const group = row.original;
                    return (
                        <div className="inline-flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setViewingGroup(group)}
                                className="p-1.5 text-[#6E6862] hover:text-[#037F8C] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer"
                                title="View Details"
                            >
                                <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenEdit(group)}
                                className="p-1.5 text-[#6E6862] hover:text-[#037F8C] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer"
                                title="Edit Security Group"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(group)}
                                className="p-1.5 text-[#6E6862] hover:text-[#037F8C] hover:bg-[#FAF8F5] rounded-md transition-colors cursor-pointer"
                                title={group.status === 'Active' ? 'Deactivate' : 'Activate'}
                            >
                                <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingGroup(group)}
                                className="p-1.5 text-[#6E6862] hover:text-[#D32F2F] hover:bg-[#FFEBEE] rounded-md transition-colors cursor-pointer"
                                title="Delete Security Group"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [
            t,
            isRtl,
            allVisibleSelected,
            selectedIds,
            copiedCode,
            groupRoleMap,
            groupEmployeeMap,
            handleSelectAllVisible,
            handleToggleSelect,
            handleCopyCode,
            handleToggleStatus,
            handleOpenEdit,
        ]
    );

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                                    {t('ums.securityGroups.title', {
                                        defaultValue: 'Security Groups',
                                    })}
                                </h1>
                                <span
                                    className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white text-[#037F8C] border border-[#E5E0D8] hover:bg-[#FAF8F5] hover:border-[#037F8C]/30 transition-all shadow-sm cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 text-[#037F8C]" />
                        <span>{t('ums.common.export', { defaultValue: 'Export CSV' })}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>
                            {t('ums.securityGroups.addSecurityGroup', {
                                defaultValue: 'Create New Security Group',
                            })}
                        </span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.total', {
                                defaultValue: 'Total Security Groups',
                            })}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">
                            {totalGroups}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            Configured policy containers
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Shield className="w-5 h-5 text-[#037F8C]" />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.active', { defaultValue: 'Active Groups' })}
                        </p>
                        <p className="text-2xl font-bold text-[#1B4D3E] mt-1 font-mono">
                            {activeGroups}
                        </p>
                        <p className="text-[11px] text-[#1B4D3E] mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 inline" />
                            {totalGroups > 0
                                ? Math.round((activeGroups / totalGroups) * 100)
                                : 0}
                            % operational
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32]">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.inactive', {
                                defaultValue: 'Inactive Groups',
                            })}
                        </p>
                        <p className="text-2xl font-bold text-[#D32F2F] mt-1 font-mono">
                            {inactiveGroups}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            Suspended access policies
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] flex items-center justify-center text-[#D32F2F]">
                        <XCircle className="w-5 h-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {t('ums.securityGroups.kpi.assignedUsers', {
                                defaultValue: 'Total Assigned Users',
                            })}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1 font-mono">
                            {totalAssignedUsers}
                        </p>
                        <p className="text-[11px] text-[#6E6862] mt-0.5">
                            Mapped enterprise staff
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Users className="w-5 h-5 text-[#037F8C]" />
                    </div>
                </div>
            </div>

            {/* Filter Toolbar & Batch Actions */}
            <div className="p-4 rounded-xl bg-white border border-[#E5E0D8] shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                                        statusFilter === s
                                            ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
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

                    {(searchQuery || statusFilter !== 'All') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('All');
                                setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#6E6862] hover:text-[#0D0D0D] rounded-lg border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                            title="Reset filters"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>{t('ums.common.reset', { defaultValue: 'Reset' })}</span>
                        </button>
                    )}
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#037F8C]/20 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#037F8C] font-mono">
                                {selectedIds.length}{' '}
                                {t('ums.common.selected', { defaultValue: 'selected' })}
                            </span>
                            <span className="text-[#6E6862]">|</span>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-[#6E6862] hover:text-[#0D0D0D] underline cursor-pointer"
                            >
                                {t('ums.common.clearSelection', {
                                    defaultValue: 'Clear selection',
                                })}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleBatchActivate}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] hover:bg-[#C8E6C9] transition-all cursor-pointer"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                    {t('ums.common.activate', { defaultValue: 'Activate' })}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={handleBatchDeactivate}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] hover:bg-[#FFCDD2] transition-all cursor-pointer"
                            >
                                <XCircle className="w-3 h-3" />
                                <span>
                                    {t('ums.common.deactivate', { defaultValue: 'Deactivate' })}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const selectedGroups = groups.filter((g) =>
                                        selectedIds.includes(g.id)
                                    );
                                    handleExportCsv(selectedGroups);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-white text-[#037F8C] border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                            >
                                <Download className="w-3 h-3" />
                                <span>
                                    {t('ums.common.exportSelected', {
                                        defaultValue: 'Export Selected',
                                    })}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Shared DataTable */}
            <DataTable
                columns={columns}
                data={paginatedGroups}
                count={filteredGroups.length}
                pageIndex={currentPage - 1}
                pageSize={pageSize}
                onPageChange={(pageIdx) => setCurrentPage(pageIdx + 1)}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                }}
                searchValue={searchQuery}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder={t('ums.securityGroups.searchPlaceholder', {
                    defaultValue: 'Search security groups by code, name, or description...',
                })}
                title={t('ums.securityGroups.title', { defaultValue: 'Security Groups' })}
            />

            {/* Standalone Create / Edit Security Group Form Component */}
            <SecurityGroupForm
                isOpen={isCreateOpen || editingGroup !== null}
                isEditing={Boolean(editingGroup)}
                values={formValues}
                errors={formErrors}
                employees={employees}
                isSubmitting={upsertSecurityGroupMutation.isPending}
                onChange={setFormValues}
                onCancel={handleCloseForm}
                onSubmit={handleSubmitForm}
            />

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
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingGroup.nameAr : viewingGroup.nameEn}
                                        </h2>
                                        <span
                                            className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-white text-[#037F8C] border border-[#E5E0D8]"
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
                                className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
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
                                        <span className="text-[#6E6862] block text-[11px]">
                                            Status
                                        </span>
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
                                        <span className="text-[#6E6862] block text-[11px]">
                                            Privileges
                                        </span>
                                        <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block">
                                            {countActivePermissions(viewingGroup.permissions)} / 28
                                            active
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">
                                            Linked Roles
                                        </span>
                                        <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block">
                                            {(groupRoleMap.get(viewingGroup.id) || []).length} roles
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-[#6E6862] block text-[11px]">
                                            Created Date
                                        </span>
                                        <span className="font-mono text-[#0D0D0D] mt-0.5 block">
                                            {viewingGroup.createdAt}
                                        </span>
                                    </div>
                                </div>

                                {(viewingGroup.descriptionEn || viewingGroup.descriptionAr) && (
                                    <div className="pt-2 border-t border-[#E5E0D8]/60 text-xs text-[#6E6862]">
                                        <p className="italic">
                                            {isRtl
                                                ? viewingGroup.descriptionAr ||
                                                  viewingGroup.descriptionEn
                                                : viewingGroup.descriptionEn ||
                                                  viewingGroup.descriptionAr}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Permissions Matrix Read-Only */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-4 h-4 text-[#037F8C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t(
                                                'ums.securityGroups.details.permissionsMatrixTitle',
                                                {
                                                    defaultValue: 'Configured Module Permissions',
                                                }
                                            )}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#6E6862]">
                                        {countActivePermissions(viewingGroup.permissions)} / 28
                                        active
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
                                                    <tr
                                                        key={mKey}
                                                        className="hover:bg-[#FAF8F5]/60 transition-colors"
                                                    >
                                                        <td className="p-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-3.5 h-3.5 text-[#037F8C]" />
                                                                <span className="font-semibold text-[#0D0D0D]">
                                                                    {isRtl
                                                                        ? meta.nameAr
                                                                        : meta.nameEn}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.read ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.write ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.delete ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {p.export ? (
                                                                <Check className="w-4 h-4 text-[#2E7D32] mx-auto" />
                                                            ) : (
                                                                <span className="text-[#6E6862]/40">
                                                                    —
                                                                </span>
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
                                        <Layers className="w-4 h-4 text-[#037F8C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.securityGroups.details.assignedRolesList', {
                                                defaultValue: 'Assigned Roles',
                                            })}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono font-semibold text-[#037F8C]">
                                        {(groupRoleMap.get(viewingGroup.id) || []).length} Roles
                                    </span>
                                </div>

                                {(() => {
                                    const linkedRoles = groupRoleMap.get(viewingGroup.id) || [];
                                    if (linkedRoles.length === 0) {
                                        return (
                                            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#6E6862]">
                                                {t('ums.securityGroups.details.noRoles', {
                                                    defaultValue:
                                                        'No roles currently linked to this security group.',
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
                                                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                                                                {role.code}
                                                            </span>
                                                            <span className="font-semibold text-[#0D0D0D]">
                                                                {isRtl
                                                                    ? role.nameAr
                                                                    : role.nameEn}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-[#6E6862] mt-0.5 block">
                                                            Level {role.level} • {role.status}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF8F5] text-[#037F8C]">
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
                                        <Users className="w-4 h-4 text-[#037F8C]" />
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.securityGroups.details.assignedEmployeesList', {
                                                defaultValue: 'Assigned Users & Employees',
                                            })}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-mono font-semibold text-[#037F8C]">
                                        {(groupEmployeeMap.get(viewingGroup.id) || []).length}{' '}
                                        Users
                                    </span>
                                </div>

                                {(() => {
                                    const linkedEmps =
                                        groupEmployeeMap.get(viewingGroup.id) || [];
                                    if (linkedEmps.length === 0) {
                                        return (
                                            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#6E6862]">
                                                {t('ums.securityGroups.details.noEmployees', {
                                                    defaultValue:
                                                        'No active employees assigned under this security group.',
                                                })}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="space-y-2">
                                            {linkedEmps.map((emp) => {
                                                const linkedRole = roles.find(
                                                    (r) => r.id === emp.roleId
                                                );
                                                const linkedDept = departments.find(
                                                    (d) => d.id === emp.departmentId
                                                );
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
                                                            <div className="w-7 h-7 rounded-full bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center font-bold text-[10px]">
                                                                {emp.nameEn.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-[#0D0D0D]">
                                                                    {isRtl
                                                                        ? emp.nameAr
                                                                        : emp.nameEn}
                                                                </div>
                                                                <div className="text-[10px] text-[#6E6862] font-mono">
                                                                    {emp.code} • {emp.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="text-[11px] font-medium text-[#037F8C] block">
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6E6862] hover:text-[#0D0D0D] rounded border border-[#E5E0D8] bg-white cursor-pointer"
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
                                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all cursor-pointer"
                                >
                                    {t('ums.common.edit', { defaultValue: 'Edit Group' })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingGroup(null)}
                                    className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
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
                                    Are you sure you want to permanently delete this security
                                    group? This action will permanently remove all module
                                    permissions for this container and cannot be undone.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#795548] leading-relaxed">
                                        {isRtl
                                            ? deleteEligibility.reasonAr
                                            : deleteEligibility.reasonEn}
                                    </div>
                                    <p className="text-xs text-[#6E6862]">
                                        To maintain platform security integrity, you can deactivate
                                        the security group instead, which immediately revokes access
                                        without breaking role relationships.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeletingGroup(null)}
                                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                {t('ums.common.cancel', { defaultValue: 'Cancel' })}
                            </button>

                            {deleteEligibility.canDelete ? (
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#D32F2F] text-white hover:bg-[#B71C1C] transition-all shadow-sm cursor-pointer"
                                >
                                    {t('ums.common.delete', { defaultValue: 'Delete Group' })}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleDeactivateFromDeleteModal}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#037F8C] text-[#FAF8F5] hover:bg-[#1B4D3E] transition-all shadow-sm cursor-pointer"
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
