import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { SecurityGroupForm, type SecurityGroupFormData, type SecurityGroupMemberOption } from '../../components/ums/SecurityGroupForm';
import { umsApi, userApi } from '../../api/api';

interface SecurityGroupRecord {
    id: string;
    codeName?: string | null;
    name: string;
    description?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    members?: UserRecord[] | null;
}

interface UserRecord extends SecurityGroupMemberOption {
    id: string;
    codeName?: string | null;
    email?: string | null;
    phone_number?: string | null;
    securityGroup?: SecurityGroupRecord | null;
    userAttach?: {
        first_name_Ar?: string | null;
        first_name_En?: string | null;
        secend_name_Ar?: string | null;
        secend_name_En?: string | null;
        last_name_Ar?: string | null;
        last_name_En?: string | null;
    } | null;
}

const EMPTY_FORM: SecurityGroupFormData = { members_ids: [], name: '', description: '' };

const extractItems = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const extractCount = (response: any): number => Number(response?.count ?? response?.totalItems ?? response?.total ?? response?.data?.count ?? extractItems(response).length);

const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message ?? error?.message;
    return Array.isArray(message) ? message.join(', ') : message || fallback;
};

const getUserName = (user: UserRecord): string => {
    const attach = user.userAttach;
    const englishName = [attach?.first_name_En, attach?.secend_name_En, attach?.last_name_En].filter(Boolean).join(' ');
    const arabicName = [attach?.first_name_Ar, attach?.secend_name_Ar, attach?.last_name_Ar].filter(Boolean).join(' ');
    return englishName || arabicName || user.email || user.codeName || '—';
};

export const UmsSecurityGroupsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<SecurityGroupRecord | null>(null);
    const [viewingGroup, setViewingGroup] = useState<SecurityGroupRecord | null>(null);
    const [deletingGroup, setDeletingGroup] = useState<SecurityGroupRecord | null>(null);
    const [formData, setFormData] = useState<SecurityGroupFormData>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof SecurityGroupFormData, string>>>({});

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const queryParams = useMemo(() => ({ page, limit, ...(search && { search }) }), [page, limit, search]);

    const { data: groupsResponse, isLoading: isGroupsLoading, isFetching: isGroupsFetching } = useQuery({
        queryKey: ['ums', 'security-groups', queryParams],
        queryFn: () => umsApi.getSecurityGroups(queryParams),
        placeholderData: (previousData) => previousData,
    });

    const { data: usersResponse, isLoading: isUsersLoading } = useQuery({
        queryKey: ['ums', 'security-group-users'],
        queryFn: () => userApi.getUsers({ page: 1, limit: 1000 }),
    });

    const groups = useMemo(() => extractItems<SecurityGroupRecord>(groupsResponse), [groupsResponse]);
    const users = useMemo(() => extractItems<UserRecord>(usersResponse), [usersResponse]);
    const totalItems = extractCount(groupsResponse);

    const usersByGroup = useMemo(() => {
        const result = new Map<string, UserRecord[]>();

        groups.forEach((group) => {
            if (Array.isArray(group.members)) result.set(group.id, group.members);
        });

        users.forEach((user) => {
            const groupId = user.securityGroup?.id;
            if (!groupId) return;
            const groupUsers = result.get(groupId) ?? [];
            if (!groupUsers.some((member) => member.id === user.id)) result.set(groupId, [...groupUsers, user]);
        });
        return result;
    }, [groups, users]);

    const createMutation = useMutation({
        mutationFn: (data: SecurityGroupFormData) => umsApi.createSecurityGroup(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-groups'] });
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-group-users'] });
            toast.success(t('ums.securityGroups.feedback.created', { defaultValue: 'Security group created successfully' }));
            closeForm();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('ums.securityGroups.feedback.createFailed', { defaultValue: 'Failed to create security group' }))),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SecurityGroupFormData }) => umsApi.updateSecurityGroup(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-groups'] });
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-group-users'] });
            toast.success(t('ums.securityGroups.feedback.updated', { defaultValue: 'Security group updated successfully' }));
            closeForm();
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('ums.securityGroups.feedback.updateFailed', { defaultValue: 'Failed to update security group' }))),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteSecurityGroup(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-groups'] });
            await queryClient.invalidateQueries({ queryKey: ['ums', 'security-group-users'] });
            toast.success(t('ums.securityGroups.feedback.deleted', { defaultValue: 'Security group deleted successfully' }));
            setDeletingGroup(null);
        },
        onError: (error: any) => toast.error(getErrorMessage(error, t('ums.securityGroups.feedback.deleteFailed', { defaultValue: 'Failed to delete security group' }))),
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    function closeForm() {
        setIsCreateOpen(false);
        setEditingGroup(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
    }

    const openCreate = () => {
        setEditingGroup(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setIsCreateOpen(true);
    };

    const openEdit = (group: SecurityGroupRecord) => {
        setIsCreateOpen(false);
        setEditingGroup(group);
        setFormData({ members_ids: (usersByGroup.get(group.id) ?? []).map((user) => user.id), name: group.name ?? '', description: group.description ?? '' });
        setFormErrors({});
    };

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof SecurityGroupFormData, string>> = {};
        if (!formData.name.trim()) errors.name = t('ums.securityGroups.validation.nameRequired', { defaultValue: 'Group name is required' });
        if (!formData.description.trim()) errors.description = t('ums.securityGroups.validation.descriptionRequired', { defaultValue: 'Description is required' });
        if (formData.description.trim().length > 500) errors.description = t('ums.securityGroups.validation.descriptionLength', { defaultValue: 'Description cannot exceed 500 characters' });
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        const payload: SecurityGroupFormData = { members_ids: [...new Set(formData.members_ids)], name: formData.name.trim(), description: formData.description.trim() };
        if (editingGroup) {
            updateMutation.mutate({ id: editingGroup.id, data: payload });
            return;
        }
        createMutation.mutate(payload);
    };

    const handleExport = () => {
        if (groups.length === 0) {
            toast.info(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        const escapeCsvValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = groups.map((group) => [group.codeName, group.name, group.description, usersByGroup.get(group.id)?.length ?? 0, group.createdAt]);
        const csvContent = [['Code', 'Name', 'Description', 'Assigned Users', 'Created At'], ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-groups-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        { accessorKey: 'codeName', header: t('ums.securityGroups.columns.code', { defaultValue: 'Code' }), cell: ({ row }) => <span className="font-mono text-xs font-bold text-[#037F8C]">{row.original.codeName || '—'}</span> },
        { accessorKey: 'name', header: t('ums.securityGroups.columns.name', { defaultValue: 'Group Name' }), cell: ({ row }) => <span className="font-semibold text-[#0D0D0D]">{row.original.name}</span> },
        { accessorKey: 'description', header: t('ums.securityGroups.columns.description', { defaultValue: 'Description' }), cell: ({ row }) => <span className="block max-w-md truncate text-xs text-[#6E6862]">{row.original.description || '—'}</span> },
        { id: 'usersCount', header: t('ums.securityGroups.columns.users', { defaultValue: 'Users' }), cell: ({ row }) => <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-[#EAF3EC] px-2 py-0.5 text-xs font-bold text-[#037F8C]">{usersByGroup.get(row.original.id)?.length ?? 0}</span> },
        { accessorKey: 'createdAt', header: t('ums.securityGroups.columns.createdAt', { defaultValue: 'Created At' }), cell: ({ row }) => <span className="font-mono text-xs text-[#6E6862]">{row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}</span> },
        {
            id: 'actions',
            header: t('ums.securityGroups.columns.actions', { defaultValue: 'Actions' }),
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => setViewingGroup(row.original)} title={t('common.view', { defaultValue: 'View' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]"><Eye size={14} /></button>
                    <button type="button" onClick={() => openEdit(row.original)} title={t('common.edit', { defaultValue: 'Edit' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#037F8C]"><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeletingGroup(row.original)} title={t('common.delete', { defaultValue: 'Delete' })} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#FEE2E2] hover:text-[#DC2626]"><Trash2 size={14} /></button>
                </div>
            ),
        },
    ], [t, usersByGroup]);

    const viewingUsers = viewingGroup ? usersByGroup.get(viewingGroup.id) ?? [] : [];

    return (
        <div className="space-y-6 text-start">
            <DataTable columns={columns} data={groups} count={totalItems} loading={isGroupsLoading || isGroupsFetching || isUsersLoading} pageIndex={page - 1} pageSize={limit} onPageChange={(pageIndex) => setPage(pageIndex + 1)} onPageSizeChange={(pageSize) => { setLimit(pageSize); setPage(1); }} searchValue={searchInput} onSearchChange={setSearchInput} searchPlaceholder={t('ums.securityGroups.searchPlaceholder', { defaultValue: 'Search security groups...' })} onAddNew={openCreate} addNewLabel={t('ums.securityGroups.actions.add', { defaultValue: 'Add Security Group' })} onExport={handleExport} title={t('ums.securityGroups.title', { defaultValue: 'Security Groups' })} description={t('ums.securityGroups.subtitle', { defaultValue: 'Manage security groups and review their assigned users.' })} />

            {(isCreateOpen || editingGroup) && <SecurityGroupForm isEditing={Boolean(editingGroup)} formData={formData} formErrors={formErrors} users={users} isSubmitting={isSubmitting} onChange={setFormData} onSubmit={handleSubmit} onCancel={closeForm} />}

            {viewingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">{viewingGroup.name}</h2>
                                    {viewingGroup.codeName && <span className="rounded-md bg-[#FAF8F5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#037F8C]">{viewingGroup.codeName}</span>}
                                </div>
                                <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-[#6E6862]">{viewingGroup.description || '—'}</p>
                            </div>
                            <button type="button" onClick={() => setViewingGroup(null)} className="rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]"><X size={17} /></button>
                        </div>

                        <div className="mt-5 border-t border-[#E5E0D8] pt-4">
                            <h3 className="mb-3 text-xs font-bold text-[#0D0D0D]">{t('ums.securityGroups.assignedUsers', { defaultValue: 'Assigned Users' })} ({viewingUsers.length})</h3>
                            {viewingUsers.length === 0 ? <p className="text-xs text-[#857E74]">{t('ums.securityGroups.noAssignedUsers', { defaultValue: 'No users are assigned to this group.' })}</p> : <div className="divide-y divide-[#EFECE6] overflow-hidden rounded-lg border border-[#E5E0D8]">{viewingUsers.map((user) => <div key={user.id} className="flex items-center justify-between gap-3 px-3 py-2.5"><div><p className="text-xs font-semibold text-[#0D0D0D]">{getUserName(user)}</p><p className="mt-0.5 text-[11px] text-[#857E74]">{user.email || user.phone_number || '—'}</p></div><span className="font-mono text-[10px] text-[#037F8C]">{user.codeName || '—'}</span></div>)}</div>}
                        </div>

                        <div className="mt-5 flex justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                            <button type="button" onClick={() => setViewingGroup(null)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5]">{t('common.close', { defaultValue: 'Close' })}</button>
                            <button type="button" onClick={() => { const group = viewingGroup; setViewingGroup(null); openEdit(group); }} className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121]">{t('common.edit', { defaultValue: 'Edit' })}</button>
                        </div>
                    </div>
                </div>
            )}

            {deletingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <h2 className="text-base font-bold text-[#0D0D0D]">{t('ums.securityGroups.delete.title', { defaultValue: 'Delete Security Group' })}</h2>
                        <p className="mt-2 text-xs leading-relaxed text-[#6E6862]">{t('ums.securityGroups.delete.message', { name: deletingGroup.name, defaultValue: `Are you sure you want to delete ${deletingGroup.name}?` })}</p>
                        {(usersByGroup.get(deletingGroup.id)?.length ?? 0) > 0 && <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs text-[#DC2626]">{t('ums.securityGroups.delete.assignedUsersWarning', { count: usersByGroup.get(deletingGroup.id)?.length ?? 0, defaultValue: 'This group has assigned users. The server may reject deletion until they are reassigned.' })}</p>}
                        <div className="mt-5 flex justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                            <button type="button" onClick={() => setDeletingGroup(null)} disabled={deleteMutation.isPending} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50">{t('common.cancel', { defaultValue: 'Cancel' })}</button>
                            <button type="button" onClick={() => deleteMutation.mutate(deletingGroup.id)} disabled={deleteMutation.isPending} className="rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-50">{deleteMutation.isPending ? t('common.loading', { defaultValue: 'Loading...' }) : t('common.delete', { defaultValue: 'Delete' })}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsSecurityGroupsPage;