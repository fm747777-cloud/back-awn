import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ShieldCheck,
    Mail,
    Eye,
    Pencil,
    Trash2,
    Power,
    CheckCircle2,
    XCircle,
    Calendar,
} from 'lucide-react';
import {
    loadWorkflowRecords,
    saveWorkflowRecords,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_SOURCES,
    type WorkflowRecord,
    type WorkflowType,
    type WorkflowStatus,
} from './workflowMockData';
import { DataTable } from '../../components/DataTable';
import {
    WorkflowFormDrawer,
    type WorkflowFormState,
} from '../../components/workflow/WorkflowFormDrawer';
import { WorkflowViewDrawer } from '../../components/workflow/WorkflowViewDrawer';
import { WorkflowDeleteModal } from '../../components/workflow/WorkflowDeleteModal';

export const WorkflowsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // TanStack Query for server state
    const { data: records = [], isLoading } = useQuery<WorkflowRecord[]>({
        queryKey: ['workflows'],
        queryFn: async () => loadWorkflowRecords(),
    });

    // Deep link support from Audit Trail (?workflowId= or ?highlightId=)
    const targetWorkflowIdParam =
        searchParams.get('workflowId') || searchParams.get('highlightId');
    const deepLinkedRecord = useMemo(
        () =>
            targetWorkflowIdParam
                ? records.find((r) => String(r.id) === String(targetWorkflowIdParam)) || null
                : null,
        [targetWorkflowIdParam, records]
    );

    const initialTab: WorkflowType =
        searchParams.get('tab') === 'communication'
            ? 'communication'
            : deepLinkedRecord?.workflowType || 'approval';

    const [manualTab, setManualTab] = useState<WorkflowType>(initialTab);
    const urlTab = searchParams.get('tab');
    const activeTab: WorkflowType =
        urlTab === 'communication'
            ? 'communication'
            : urlTab === 'approval'
            ? 'approval'
            : manualTab;

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Pagination
    const [pageSize, setPageSize] = useState<number>(10);
    const [pageIndex, setPageIndex] = useState<number>(0);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Drawers / Modals state
    const [viewingRecord, setViewingRecord] = useState<WorkflowRecord | null>(
        () => deepLinkedRecord
    );
    const [editingRecord, setEditingRecord] = useState<WorkflowRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowRecord | null>(null);

    const [formState, setFormState] = useState<WorkflowFormState>({
        workflowType: 'approval',
        titleEn: '',
        titleAr: '',
        source: 'CRM',
        status: 'Enabled',
        createDate: '05.04.2026',
        descriptionEn: '',
        descriptionAr: '',
        triggerEventEn: '',
        triggerEventAr: '',
        stagesCount: 2,
    });

    const handleTabChange = (nextTab: WorkflowType) => {
        setManualTab(nextTab);
        setPageIndex(0);
        setSelectedIds([]);
        setSearchParams({ tab: nextTab }, { replace: true });
    };

    // TanStack Mutation for save/update
    const saveWorkflowMutation = useMutation({
        mutationFn: async (updatedList: WorkflowRecord[]) => {
            saveWorkflowRecords(updatedList);
            return updatedList;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
        },
    });

    // Counts per tab
    const approvalCount = useMemo(
        () => records.filter((r) => r.workflowType === 'approval').length,
        [records]
    );
    const communicationCount = useMemo(
        () => records.filter((r) => r.workflowType === 'communication').length,
        [records]
    );

    // Filtered records for active tab
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter((item) => {
            if (item.workflowType !== activeTab) return false;
            if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

            if (q) {
                const matchId = String(item.id).toLowerCase().includes(q);
                const matchTitleEn = item.titleEn.toLowerCase().includes(q);
                const matchTitleAr = item.titleAr.toLowerCase().includes(q);
                const matchSource = item.source.toLowerCase().includes(q);
                const matchStatus = item.status.toLowerCase().includes(q);
                const matchDate = item.createDate.toLowerCase().includes(q);
                return (
                    matchId ||
                    matchTitleEn ||
                    matchTitleAr ||
                    matchSource ||
                    matchStatus ||
                    matchDate
                );
            }
            return true;
        });
    }, [records, activeTab, sourceFilter, statusFilter, searchQuery]);

    const totalItems = filteredRecords.length;

    const paginatedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, pageIndex, pageSize]);

    const hasActiveFilters = sourceFilter !== 'ALL' || statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setSourceFilter('ALL');
        setStatusFilter('ALL');
        setPageIndex(0);
    };

    // Selection handlers
    const currentPageIds = useMemo(
        () => paginatedRecords.map((r) => r.id),
        [paginatedRecords]
    );

    const allCurrentPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAllPage = () => {
        if (allCurrentPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleToggleSelectRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkStatusChange = (nextStatus: WorkflowStatus) => {
        if (selectedIds.length === 0) return;
        const affectedRecords = records.filter(
            (r) => selectedIds.includes(r.id) && r.status !== nextStatus
        );
        const updated = records.map((r) =>
            selectedIds.includes(r.id) ? { ...r, status: nextStatus } : r
        );

        saveWorkflowMutation.mutate(updated, {
            onSuccess: () => {
                for (const rec of affectedRecords) {
                    recordWorkflowAuditEvent({
                        action: nextStatus === 'Enabled' ? 'ENABLED' : 'DISABLED',
                        resource: 'Workflow',
                        recordId: String(rec.id),
                        resourceData: `${rec.titleEn} (#${rec.id})`,
                        resourceDataAr: `${rec.titleAr} (#${rec.id})`,
                        performedBy: 'Khalifah Alsharabi',
                        performedByAr: 'خليفة الشرعبي',
                        actorEmail: 'k.alsharabi@awn.sa',
                        remarks: `Bulk ${nextStatus === 'Enabled' ? 'enabled' : 'disabled'} ${rec.workflowType} workflow "${rec.titleEn}" (#${rec.id}) for source ${rec.source}.`,
                        remarksAr: `تم ${nextStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} سير العمل "${rec.titleAr}" (#${rec.id}) للمصدر ${rec.source} ضمن إجراء جماعي.`,
                        previousStatus: rec.status,
                        newStatus: nextStatus,
                    });
                }

                toast.success(
                    t('workflow.workflows.feedback.bulkStatusUpdated', {
                        count: selectedIds.length,
                        status:
                            nextStatus === 'Enabled'
                                ? t('workflow.workflows.statuses.enabled')
                                : t('workflow.workflows.statuses.disabled'),
                    })
                );
                setSelectedIds([]);
            },
        });
    };

    // Toggle single status
    const handleToggleStatus = (record: WorkflowRecord) => {
        const nextStatus: WorkflowStatus =
            record.status === 'Enabled' ? 'Disabled' : 'Enabled';
        const updated = records.map((item) =>
            item.id === record.id ? { ...item, status: nextStatus } : item
        );

        saveWorkflowMutation.mutate(updated, {
            onSuccess: () => {
                if (viewingRecord && viewingRecord.id === record.id) {
                    setViewingRecord({ ...viewingRecord, status: nextStatus });
                }

                recordWorkflowAuditEvent({
                    action: nextStatus === 'Enabled' ? 'ENABLED' : 'DISABLED',
                    resource: 'Workflow',
                    recordId: String(record.id),
                    resourceData: `${record.titleEn} (#${record.id})`,
                    resourceDataAr: `${record.titleAr} (#${record.id})`,
                    performedBy: 'Khalifah Alsharabi',
                    performedByAr: 'خليفة الشرعبي',
                    actorEmail: 'k.alsharabi@awn.sa',
                    remarks: `Status changed from ${record.status} to ${nextStatus} for ${record.workflowType} workflow "${record.titleEn}" (#${record.id}).`,
                    remarksAr: `تم تغيير حالة سير العمل "${record.titleAr}" (#${record.id}) من ${record.status === 'Enabled' ? 'مفعل' : 'معطل'} إلى ${nextStatus === 'Enabled' ? 'مفعل' : 'معطل'}.`,
                    previousStatus: record.status,
                    newStatus: nextStatus,
                });

                toast.success(
                    t('workflow.workflows.feedback.statusUpdated', {
                        name: isAr ? record.titleAr : record.titleEn,
                        status:
                            nextStatus === 'Enabled'
                                ? t('workflow.workflows.statuses.enabled')
                                : t('workflow.workflows.statuses.disabled'),
                    })
                );
            },
        });
    };

    // Open create / edit
    const openCreateDrawer = () => {
        setEditingRecord(null);
        setFormState({
            workflowType: activeTab,
            titleEn: '',
            titleAr: '',
            source: 'CRM',
            status: 'Enabled',
            createDate: formatWorkflowDateToday(),
            descriptionEn: '',
            descriptionAr: '',
            triggerEventEn:
                activeTab === 'approval'
                    ? 'Submit record for validation'
                    : 'Dispatch notification email',
            triggerEventAr:
                activeTab === 'approval'
                    ? 'إرسال السجل للمطابقة والتحقق'
                    : 'إرسال إشعار بريدي للمستفيد',
            stagesCount: 2,
        });
        setIsCreateOpen(true);
    };

    const openEditDrawer = (rec: WorkflowRecord) => {
        setEditingRecord(rec);
        setFormState({
            workflowType: rec.workflowType,
            titleEn: rec.titleEn,
            titleAr: rec.titleAr,
            source: rec.source,
            status: rec.status,
            createDate: rec.createDate,
            descriptionEn: rec.descriptionEn || '',
            descriptionAr: rec.descriptionAr || '',
            triggerEventEn: rec.triggerEventEn || '',
            triggerEventAr: rec.triggerEventAr || '',
            stagesCount: rec.stagesCount,
        });
        setIsCreateOpen(true);
    };

    const handleSaveWorkflow = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEn = formState.titleEn.trim();
        const trimmedAr = formState.titleAr.trim() || trimmedEn;

        if (!trimmedEn) {
            toast.error(t('workflow.workflows.drawer.titleEnRequired'));
            return;
        }

        if (editingRecord) {
            const updated = records.map((r) =>
                r.id === editingRecord.id
                    ? {
                          ...r,
                          workflowType: formState.workflowType,
                          titleEn: trimmedEn,
                          titleAr: trimmedAr,
                          source: formState.source,
                          status: formState.status,
                          createDate: formState.createDate,
                          descriptionEn: formState.descriptionEn.trim(),
                          descriptionAr: formState.descriptionAr.trim(),
                          triggerEventEn: formState.triggerEventEn.trim(),
                          triggerEventAr: formState.triggerEventAr.trim(),
                          stagesCount: formState.stagesCount,
                      }
                    : r
            );

            saveWorkflowMutation.mutate(updated, {
                onSuccess: () => {
                    recordWorkflowAuditEvent({
                        action: 'UPDATED',
                        resource: 'Workflow',
                        recordId: String(editingRecord.id),
                        resourceData: `${trimmedEn} (#${editingRecord.id})`,
                        resourceDataAr: `${trimmedAr} (#${editingRecord.id})`,
                        performedBy: 'Khalifah Alsharabi',
                        performedByAr: 'خليفة الشرعبي',
                        actorEmail: 'k.alsharabi@awn.sa',
                        remarks: `Updated ${formState.workflowType} workflow "${trimmedEn}" (#${editingRecord.id}) under source ${formState.source} (Status: ${formState.status}).`,
                        remarksAr: `تم تحديث سير العمل "${trimmedAr}" (#${editingRecord.id}) ضمن المصدر ${formState.source} (الحالة: ${formState.status === 'Enabled' ? 'مفعل' : 'معطل'}).`,
                        previousStatus: editingRecord.status,
                        newStatus: formState.status,
                    });

                    toast.success(
                        t('workflow.workflows.feedback.updatedSuccess', {
                            name: isAr ? trimmedAr : trimmedEn,
                        })
                    );
                    setIsCreateOpen(false);
                    setEditingRecord(null);
                },
            });
        } else {
            const nextId =
                records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
            const newRecord: WorkflowRecord = {
                id: nextId,
                workflowType: formState.workflowType,
                titleEn: trimmedEn,
                titleAr: trimmedAr,
                source: formState.source,
                status: formState.status,
                createDate: formState.createDate || formatWorkflowDateToday(),
                descriptionEn: formState.descriptionEn.trim(),
                descriptionAr: formState.descriptionAr.trim(),
                triggerEventEn: formState.triggerEventEn.trim(),
                triggerEventAr: formState.triggerEventAr.trim(),
                stagesCount: formState.stagesCount,
            };

            const updated = [newRecord, ...records];
            saveWorkflowMutation.mutate(updated, {
                onSuccess: () => {
                    recordWorkflowAuditEvent({
                        action: 'CREATED',
                        resource: 'Workflow',
                        recordId: String(nextId),
                        resourceData: `${trimmedEn} (#${nextId})`,
                        resourceDataAr: `${trimmedAr} (#${nextId})`,
                        performedBy: 'Khalifah Alsharabi',
                        performedByAr: 'خليفة الشرعبي',
                        actorEmail: 'k.alsharabi@awn.sa',
                        remarks: `Created new ${formState.workflowType} workflow "${trimmedEn}" (#${nextId}) with source ${formState.source} and ${formState.stagesCount} stages.`,
                        remarksAr: `تم إنشاء سير عمل جديد من نوع ${formState.workflowType === 'approval' ? 'اعتماد' : 'تواصل'} باسم "${trimmedAr}" (#${nextId}) للمصدر ${formState.source}.`,
                        newStatus: formState.status,
                    });

                    toast.success(
                        t('workflow.workflows.feedback.createdSuccess', {
                            name: isAr ? trimmedAr : trimmedEn,
                        })
                    );
                    setIsCreateOpen(false);
                },
            });
        }
    };

    // Delete single record
    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        const target = deletingRecord;
        const updated = records.filter((r) => r.id !== target.id);

        saveWorkflowMutation.mutate(updated, {
            onSuccess: () => {
                setSelectedIds((prev) => prev.filter((id) => id !== target.id));
                if (viewingRecord?.id === target.id) {
                    setViewingRecord(null);
                }

                recordWorkflowAuditEvent({
                    action: 'DELETED',
                    resource: 'Workflow',
                    recordId: String(target.id),
                    resourceData: `${target.titleEn} (#${target.id})`,
                    resourceDataAr: `${target.titleAr} (#${target.id})`,
                    performedBy: 'Khalifah Alsharabi',
                    performedByAr: 'خليفة الشرعبي',
                    actorEmail: 'k.alsharabi@awn.sa',
                    remarks: `Deleted ${target.workflowType} workflow "${target.titleEn}" (#${target.id}) from source ${target.source}.`,
                    remarksAr: `تم حذف سير العمل "${target.titleAr}" (#${target.id}) للمصدر ${target.source}.`,
                    previousStatus: target.status,
                });

                toast.success(
                    t('workflow.workflows.feedback.deletedSuccess', {
                        name: isAr ? target.titleAr : target.titleEn,
                    })
                );
                setDeletingRecord(null);
            },
        });
    };

    // Export CSV
    const handleExportCsv = () => {
        if (filteredRecords.length === 0) return;
        const headers = [
            'ID',
            'Type',
            'Title (EN)',
            'Title (AR)',
            'Source',
            'Status',
            'Create Date',
            'Stages Count',
        ];
        const rows = filteredRecords.map((r) => [
            `#${r.id}`,
            r.workflowType,
            `"${r.titleEn.replace(/"/g, '""')}"`,
            `"${r.titleAr.replace(/"/g, '""')}"`,
            r.source,
            r.status,
            r.createDate,
            r.stagesCount,
        ]);
        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `awn_workflows_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workflow.workflows.feedback.exportedSuccess'));
    };

    // Columns for DataTable
    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={handleToggleSelectAllPage}
                        className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                        aria-label={t('common.selectAll')}
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(row.original.id)}
                        onChange={() => handleToggleSelectRow(row.original.id)}
                        className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                        aria-label={`Select row ${row.original.id}`}
                    />
                ),
            },
            {
                accessorKey: 'id',
                header: t('workflow.workflows.table.id'),
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-bold text-[#037F8C]" dir="ltr">
                        #{row.original.id}
                    </span>
                ),
            },
            {
                accessorKey: 'titleEn',
                header: t('workflow.workflows.table.title'),
                cell: ({ row }) => {
                    const isHighlighted = targetWorkflowIdParam === String(row.original.id);
                    return (
                        <div
                            className={`flex flex-col text-xs ${
                                isHighlighted ? 'font-bold text-[#037F8C]' : ''
                            }`}
                        >
                            <span className="font-semibold text-[#0D0D0D]">
                                {isAr ? row.original.titleAr : row.original.titleEn}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">
                                {isAr ? row.original.titleEn : row.original.titleAr}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'source',
                header: t('workflow.workflows.table.source'),
                cell: ({ row }) => (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                        dir="ltr"
                    >
                        {row.original.source}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: t('workflow.workflows.table.status'),
                cell: ({ row }) => {
                    const isEnabled = row.original.status === 'Enabled';
                    return (
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                isEnabled
                                    ? 'bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]'
                                    : 'bg-[#FDF4E7] text-[#8C6046] border border-[#F2D7B3]'
                            }`}
                        >
                            {isEnabled ? (
                                <CheckCircle2 size={11} className="text-[#037F8C]" />
                            ) : (
                                <XCircle size={11} className="text-[#8C6046]" />
                            )}
                            <span>
                                {isEnabled
                                    ? t('workflow.workflows.statuses.enabled')
                                    : t('workflow.workflows.statuses.disabled')}
                            </span>
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: t('workflow.workflows.table.createDate'),
                cell: ({ row }) => (
                    <span
                        className="font-mono text-xs text-[#595550] inline-flex items-center gap-1.5"
                        dir="ltr"
                    >
                        <Calendar size={13} className="text-[#857E74]" />
                        {row.original.createDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }) => {
                    const rec = row.original;
                    return (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setViewingRecord(rec)}
                                title={t('common.view')}
                                className="p-1 rounded-md text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => openEditDrawer(rec)}
                                title={t('common.edit')}
                                className="p-1 rounded-md text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(rec)}
                                title={
                                    rec.status === 'Enabled'
                                        ? t('workflow.workflows.actions.disable')
                                        : t('workflow.workflows.actions.enable')
                                }
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    rec.status === 'Enabled'
                                        ? 'text-[#037F8C] hover:bg-[#EAF3EC]'
                                        : 'text-[#8C6046] hover:bg-[#FDF4E7]'
                                }`}
                            >
                                <Power size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(rec)}
                                title={t('common.delete')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#A63A3A] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [
            allCurrentPageSelected,
            selectedIds,
            targetWorkflowIdParam,
            isAr,
            t,
            handleToggleSelectAllPage,
            handleToggleStatus,
        ]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                {t('workflow.workflows.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                WFL-001
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('workflow.workflows.subtitle')}
                        </p>
                    </div>

                    {/* Tabs switcher */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => handleTabChange('approval')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'approval'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <ShieldCheck size={14} />
                            <span>{t('workflow.workflows.tabs.approval')}</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                    activeTab === 'approval'
                                        ? 'bg-white/20 text-[#FAF8F5]'
                                        : 'bg-[#EFECE6] text-[#6E6862]'
                                }`}
                                dir="ltr"
                            >
                                {approvalCount}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('communication')}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'communication'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Mail size={14} />
                            <span>{t('workflow.workflows.tabs.communication')}</span>
                            <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                    activeTab === 'communication'
                                        ? 'bg-white/20 text-[#FAF8F5]'
                                        : 'bg-[#EFECE6] text-[#6E6862]'
                                }`}
                                dir="ltr"
                            >
                                {communicationCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Banner */}
                {selectedIds.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                        <span className="text-xs font-semibold text-[#0D0D0D]">
                            {t('workflow.workflows.feedback.selectedCount', {
                                count: selectedIds.length,
                            })}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Enabled')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#1E472D] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('workflow.workflows.actions.enable')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Disabled')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C6046] hover:bg-[#734E39] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>{t('workflow.workflows.actions.disable')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Content */}
            {isFiltersOpen && (
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.workflows.table.source')}
                        </label>
                        <select
                            value={sourceFilter}
                            onChange={(e) => {
                                setSourceFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {WORKFLOW_SOURCES.map((src) => (
                                <option key={src} value={src}>
                                    {src}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.workflows.table.status')}
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            <option value="Enabled">{t('workflow.workflows.statuses.enabled')}</option>
                            <option value="Disabled">{t('workflow.workflows.statuses.disabled')}</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="w-full px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('common.resetFilters')}
                        </button>
                    </div>
                </div>
            )}

            {/* DataTable Component */}
            <DataTable
                columns={columns}
                data={paginatedRecords}
                count={totalItems}
                loading={isLoading || saveWorkflowMutation.isPending}
                searchPlaceholder={t('workflow.workflows.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newIdx) => setPageIndex(newIdx)}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPageIndex(0);
                }}
                searchValue={searchQuery}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onAddNew={openCreateDrawer}
                onExport={handleExportCsv}
                title={
                    activeTab === 'approval'
                        ? t('workflow.workflows.tabs.approval')
                        : t('workflow.workflows.tabs.communication')
                }
                addNewLabel={t('workflow.workflows.actions.create')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
            />

            {/* Dedicated Components */}
            <WorkflowFormDrawer
                isOpen={isCreateOpen}
                onClose={() => {
                    setIsCreateOpen(false);
                    setEditingRecord(null);
                }}
                onSubmit={handleSaveWorkflow}
                formState={formState}
                setFormState={setFormState}
                editingRecord={editingRecord}
            />

            <WorkflowViewDrawer
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={(rec) => {
                    setViewingRecord(null);
                    openEditDrawer(rec);
                }}
            />

            <WorkflowDeleteModal
                record={deletingRecord}
                isOpen={Boolean(deletingRecord)}
                onClose={() => setDeletingRecord(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};
