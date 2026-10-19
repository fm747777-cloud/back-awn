import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ListFilter,
    ShieldCheck,
    Mail,
    CheckCircle2,
    XCircle,
    Flag,
    Eye,
    Pencil,
    Trash2,
    Power,
    MessageSquare,
} from 'lucide-react';
import {
    loadWorkflowStatusLevels,
    saveWorkflowStatusLevels,
    loadWorkflowRecords,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_SOURCES,
    type WorkflowStatusLevelRecord,
    type WorkflowSource,
    type WorkflowStatus,
    type WorkflowType,
} from './workflowMockData';
import { DataTable } from '../../components/DataTable';
import {
    WorkflowStatusLevelFormDrawer,
    type StatusLevelFormState,
    DEFAULT_STATUS_LEVEL_FORM_STATE,
    STAGE_CATEGORIES,
} from '../../components/workflow/WorkflowStatusLevelFormDrawer';
import { WorkflowStatusLevelViewDrawer } from '../../components/workflow/WorkflowStatusLevelViewDrawer';
import { WorkflowStatusLevelDeleteModal } from '../../components/workflow/WorkflowStatusLevelDeleteModal';

const SOURCE_BADGE_STYLES: Record<WorkflowSource, string> = {
    CRM: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    ASSET: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

export const WorkflowStatusLevelsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;
    const queryClient = useQueryClient();

    // TanStack Query for server state
    const { data: records = [], isLoading } = useQuery<WorkflowStatusLevelRecord[]>({
        queryKey: ['workflow-status-levels'],
        queryFn: async () => loadWorkflowStatusLevels(),
    });

    const availableWorkflows = useMemo(() => loadWorkflowRecords(), []);

    // TanStack Mutation for persisting records
    const saveMutation = useMutation({
        mutationFn: async (updated: WorkflowStatusLevelRecord[]) => {
            saveWorkflowStatusLevels(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['workflow-status-levels'], updated);
        },
    });

    const [typeTab, setTypeTab] = useState<'ALL' | WorkflowType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [stageFilter, setStageFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [formState, setFormState] = useState<StatusLevelFormState>(DEFAULT_STATUS_LEVEL_FORM_STATE);

    const persistRecords = (updated: WorkflowStatusLevelRecord[]) => {
        saveMutation.mutate(updated);
    };

    // Summary KPIs
    const kpiStats = useMemo(() => {
        const total = records.length;
        const enabled = records.filter((r) => r.status === 'Enabled').length;
        const disabled = records.filter((r) => r.status === 'Disabled').length;
        const approval = records.filter((r) => r.workflowType === 'approval').length;
        const communication = records.filter((r) => r.workflowType === 'communication').length;
        const finalLevels = records.filter((r) => r.isFinalLevel).length;
        return { total, enabled, disabled, approval, communication, finalLevels };
    }, [records]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records
            .filter((item) => {
                if (typeTab !== 'ALL' && item.workflowType !== typeTab) return false;
                if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
                if (stageFilter !== 'ALL' && item.stageCategory !== stageFilter) return false;
                if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
                if (!q) return true;
                return (
                    String(item.id).includes(q) ||
                    item.code.toLowerCase().includes(q) ||
                    item.levelNameEn.toLowerCase().includes(q) ||
                    item.levelNameAr.toLowerCase().includes(q) ||
                    item.workflowTitleEn.toLowerCase().includes(q) ||
                    item.workflowTitleAr.toLowerCase().includes(q) ||
                    item.source.toLowerCase().includes(q) ||
                    item.approverRoleEn.toLowerCase().includes(q) ||
                    item.approverRoleAr.toLowerCase().includes(q) ||
                    item.stageCategory.toLowerCase().includes(q) ||
                    item.status.toLowerCase().includes(q) ||
                    item.createDate.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => b.id - a.id);
    }, [records, typeTab, sourceFilter, stageFilter, statusFilter, searchQuery]);

    const totalRecords = filteredRecords.length;

    const paginatedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, pageIndex, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        sourceFilter !== 'ALL' ||
        stageFilter !== 'ALL' ||
        statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setSourceFilter('ALL');
        setStageFilter('ALL');
        setStatusFilter('ALL');
        setPageIndex(0);
    };

    // Selection helpers
    const currentPageIds = useMemo(() => paginatedRecords.map((r) => r.id), [paginatedRecords]);
    const isAllCurrentPageSelected =
        currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

    const handleToggleSelectAll = () => {
        if (isAllCurrentPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        }
    };

    const handleToggleSelectOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Toggle status
    const handleToggleStatus = (record: WorkflowStatusLevelRecord) => {
        const nextStatus: WorkflowStatus = record.status === 'Enabled' ? 'Disabled' : 'Enabled';
        const updated = records.map((item) =>
            item.id === record.id ? { ...item, status: nextStatus } : item
        );
        persistRecords(updated);
        if (viewingRecord?.id === record.id) {
            setViewingRecord({ ...record, status: nextStatus });
        }

        recordWorkflowAuditEvent({
            action: nextStatus === 'Enabled' ? 'ENABLED' : 'DISABLED',
            resource: 'Status Level',
            recordId: record.code,
            resourceData: `${record.levelNameEn} (${record.code})`,
            resourceDataAr: `${record.levelNameAr} (${record.code})`,
            performedBy: 'Khalifah Alsharabi',
            performedByAr: 'خليفة الشرعبي',
            actorEmail: 'k.alsharabi@awn.sa',
            remarks: `${nextStatus === 'Enabled' ? 'Enabled' : 'Disabled'} status level "${record.levelNameEn}" (${record.code}) at Stage ${record.levelOrder} for workflow "${record.workflowTitleEn}".`,
            remarksAr: `تم ${nextStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} مستوى الحالة "${record.levelNameAr}" (${record.code}) للمرحلة ${record.levelOrder} ضمن سير العمل "${record.workflowTitleAr}".`,
            previousStatus: record.status,
            newStatus: nextStatus,
        });

        toast.success(
            t('workflow.statusLevels.feedback.statusUpdated', {
                title: isRtl ? record.levelNameAr : record.levelNameEn,
                status:
                    nextStatus === 'Enabled'
                        ? t('workflow.workflows.statuses.enabled')
                        : t('workflow.workflows.statuses.disabled'),
            })
        );
    };

    // Bulk status change
    const handleBulkStatusChange = (targetStatus: WorkflowStatus) => {
        if (selectedIds.length === 0) return;
        const affectedRecords = records.filter(
            (item) => selectedIds.includes(item.id) && item.status !== targetStatus
        );
        const updated = records.map((item) =>
            selectedIds.includes(item.id) ? { ...item, status: targetStatus } : item
        );
        persistRecords(updated);

        for (const rec of affectedRecords) {
            recordWorkflowAuditEvent({
                action: targetStatus === 'Enabled' ? 'ENABLED' : 'DISABLED',
                resource: 'Status Level',
                recordId: rec.code,
                resourceData: `${rec.levelNameEn} (${rec.code})`,
                resourceDataAr: `${rec.levelNameAr} (${rec.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Bulk ${targetStatus === 'Enabled' ? 'enabled' : 'disabled'} status level "${rec.levelNameEn}" (${rec.code}) for workflow "${rec.workflowTitleEn}".`,
                remarksAr: `تم ${targetStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} مستوى الحالة "${rec.levelNameAr}" (${rec.code}) ضمن إجراء جماعي.`,
                previousStatus: rec.status,
                newStatus: targetStatus,
            });
        }

        toast.success(
            t('workflow.statusLevels.feedback.bulkStatusUpdated', {
                count: selectedIds.length,
                status:
                    targetStatus === 'Enabled'
                        ? t('workflow.workflows.statuses.enabled')
                        : t('workflow.workflows.statuses.disabled'),
            })
        );
        setSelectedIds([]);
    };

    // Create / Edit handlers
    const openCreateDrawer = () => {
        setEditingRecord(null);
        const defaultWf = availableWorkflows[0];
        setFormState({
            ...DEFAULT_STATUS_LEVEL_FORM_STATE,
            code: `STL-${defaultWf?.source || 'CRM'}-${Math.floor(10 + Math.random() * 89)}`,
            workflowTitleEn: defaultWf?.titleEn || 'Sector',
            workflowTitleAr: defaultWf?.titleAr || 'القطاع',
            workflowType:
                typeTab === 'ALL' ? defaultWf?.workflowType || 'approval' : typeTab,
            source: defaultWf?.source || 'CRM',
        });
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: WorkflowStatusLevelRecord) => {
        setViewingRecord(null);
        setIsCreateOpen(false);
        setEditingRecord(record);
        setFormState({
            code: record.code,
            levelNameEn: record.levelNameEn,
            levelNameAr: record.levelNameAr,
            workflowTitleEn: record.workflowTitleEn,
            workflowTitleAr: record.workflowTitleAr,
            workflowType: record.workflowType,
            source: record.source,
            levelOrder: record.levelOrder,
            stageCategory: record.stageCategory,
            approverRoleEn: record.approverRoleEn,
            approverRoleAr: record.approverRoleAr,
            slaHours: record.slaHours,
            color: record.color,
            isFinalLevel: record.isFinalLevel,
            requireComment: record.requireComment,
            status: record.status,
            descriptionEn: record.descriptionEn,
            descriptionAr: record.descriptionAr,
        });
    };

    const closeFormDrawer = () => {
        setIsCreateOpen(false);
        setEditingRecord(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEn = formState.levelNameEn.trim();
        const trimmedAr = formState.levelNameAr.trim();

        if (!trimmedEn && !trimmedAr) {
            toast.error(t('workflow.statusLevels.feedback.nameRequired'));
            return;
        }

        const finalNameEn = trimmedEn || trimmedAr;
        const finalNameAr = trimmedAr || trimmedEn;
        const finalCode =
            formState.code.trim().toUpperCase() ||
            `STL-${formState.source}-${Date.now() % 100}`;

        if (editingRecord) {
            const updatedRecord: WorkflowStatusLevelRecord = {
                ...editingRecord,
                code: finalCode,
                levelNameEn: finalNameEn,
                levelNameAr: finalNameAr,
                workflowTitleEn: formState.workflowTitleEn.trim() || 'Sector',
                workflowTitleAr: formState.workflowTitleAr.trim() || 'القطاع',
                workflowType: formState.workflowType,
                source: formState.source,
                levelOrder: Math.max(1, Number(formState.levelOrder) || 1),
                stageCategory: formState.stageCategory,
                approverRoleEn: formState.approverRoleEn.trim() || 'Governance Specialist',
                approverRoleAr: formState.approverRoleAr.trim() || 'أخصائي الحوكمة',
                slaHours: Math.max(1, Number(formState.slaHours) || 12),
                color: formState.color,
                isFinalLevel: formState.isFinalLevel,
                requireComment: formState.requireComment,
                status: formState.status,
                descriptionEn: formState.descriptionEn.trim() || editingRecord.descriptionEn,
                descriptionAr: formState.descriptionAr.trim() || editingRecord.descriptionAr,
            };
            const updatedList = records.map((item) =>
                item.id === editingRecord.id ? updatedRecord : item
            );
            persistRecords(updatedList);

            recordWorkflowAuditEvent({
                action: 'UPDATED',
                resource: 'Status Level',
                recordId: updatedRecord.code,
                resourceData: `${updatedRecord.levelNameEn} (${updatedRecord.code})`,
                resourceDataAr: `${updatedRecord.levelNameAr} (${updatedRecord.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Updated status level "${updatedRecord.levelNameEn}" (${updatedRecord.code}) at Stage ${updatedRecord.levelOrder} for workflow "${updatedRecord.workflowTitleEn}" (Status: ${updatedRecord.status}).`,
                remarksAr: `تم تحديث مستوى الحالة "${updatedRecord.levelNameAr}" (${updatedRecord.code}) للمرحلة ${updatedRecord.levelOrder} ضمن سير العمل "${updatedRecord.workflowTitleAr}" (الحالة: ${updatedRecord.status === 'Enabled' ? 'مفعل' : 'معطل'}).`,
                previousStatus: editingRecord.status,
                newStatus: updatedRecord.status,
            });

            toast.success(
                t('workflow.statusLevels.feedback.levelUpdated', {
                    title: isRtl ? finalNameAr : finalNameEn,
                })
            );
            closeFormDrawer();
        } else {
            const nextId =
                records.reduce((maxId, item) => Math.max(maxId, item.id), 500) + 1;
            const newRecord: WorkflowStatusLevelRecord = {
                id: nextId,
                code: finalCode,
                levelNameEn: finalNameEn,
                levelNameAr: finalNameAr,
                workflowTitleEn: formState.workflowTitleEn.trim() || 'Sector',
                workflowTitleAr: formState.workflowTitleAr.trim() || 'القطاع',
                workflowType: formState.workflowType,
                source: formState.source,
                levelOrder: Math.max(1, Number(formState.levelOrder) || 1),
                stageCategory: formState.stageCategory,
                approverRoleEn: formState.approverRoleEn.trim() || 'Governance Specialist',
                approverRoleAr: formState.approverRoleAr.trim() || 'أخصائي الحوكمة',
                slaHours: Math.max(1, Number(formState.slaHours) || 12),
                color: formState.color,
                isFinalLevel: formState.isFinalLevel,
                requireComment: formState.requireComment,
                status: formState.status,
                createDate: formatWorkflowDateToday(),
                descriptionEn:
                    formState.descriptionEn.trim() ||
                    `Stage ${formState.levelOrder} ${formState.stageCategory} level for ${formState.workflowTitleEn}.`,
                descriptionAr:
                    formState.descriptionAr.trim() ||
                    `المرحلة ${formState.levelOrder} ضمن سير عمل ${formState.workflowTitleAr}.`,
            };
            persistRecords([newRecord, ...records]);

            recordWorkflowAuditEvent({
                action: 'CREATED',
                resource: 'Status Level',
                recordId: newRecord.code,
                resourceData: `${newRecord.levelNameEn} (${newRecord.code})`,
                resourceDataAr: `${newRecord.levelNameAr} (${newRecord.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Created status level "${newRecord.levelNameEn}" (${newRecord.code}) at Stage ${newRecord.levelOrder} for workflow "${newRecord.workflowTitleEn}".`,
                remarksAr: `تم إنشاء مستوى الحالة "${newRecord.levelNameAr}" (${newRecord.code}) للمرحلة ${newRecord.levelOrder} ضمن سير العمل "${newRecord.workflowTitleAr}".`,
                newStatus: newRecord.status,
            });

            toast.success(
                t('workflow.statusLevels.feedback.levelCreated', {
                    title: isRtl ? finalNameAr : finalNameEn,
                })
            );
            closeFormDrawer();
        }
    };

    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        const target = deletingRecord;
        const updated = records.filter((item) => item.id !== target.id);
        persistRecords(updated);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        if (viewingRecord?.id === target.id) {
            setViewingRecord(null);
        }
        setDeletingRecord(null);

        recordWorkflowAuditEvent({
            action: 'DELETED',
            resource: 'Status Level',
            recordId: target.code,
            resourceData: `${target.levelNameEn} (${target.code})`,
            resourceDataAr: `${target.levelNameAr} (${target.code})`,
            performedBy: 'Khalifah Alsharabi',
            performedByAr: 'خليفة الشرعبي',
            actorEmail: 'k.alsharabi@awn.sa',
            remarks: `Deleted status level "${target.levelNameEn}" (${target.code}) from workflow "${target.workflowTitleEn}".`,
            remarksAr: `تم حذف مستوى الحالة "${target.levelNameAr}" (${target.code}) من سير العمل "${target.workflowTitleAr}".`,
            previousStatus: target.status,
        });

        toast.success(
            t('workflow.statusLevels.feedback.levelDeleted', {
                title: isRtl ? target.levelNameAr : target.levelNameEn,
            })
        );
    };

    // Export CSV
    const handleExportCsv = () => {
        const headers = [
            'ID',
            'Code',
            'Level Name (EN)',
            'Level Name (AR)',
            'Level Order',
            'Stage Category',
            'Workflow',
            'Source',
            'Approver Role',
            'SLA Hours',
            'Status',
            'Create Date',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            `"${r.code.replace(/"/g, '""')}"`,
            `"${r.levelNameEn.replace(/"/g, '""')}"`,
            `"${r.levelNameAr.replace(/"/g, '""')}"`,
            r.levelOrder,
            r.stageCategory,
            `"${r.workflowTitleEn.replace(/"/g, '""')}"`,
            r.source,
            `"${r.approverRoleEn.replace(/"/g, '""')}"`,
            r.slaHours,
            r.status,
            r.createDate,
        ]);
        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `awn_workflow_status_levels_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workflow.statusLevels.feedback.exportedSuccess'));
    };

    // DataTable columns
    const columns: ColumnDef<any, any>[] = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleSelectAll}
                        className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                        aria-label={t('common.selectAll')}
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(row.original.id)}
                        onChange={() => handleToggleSelectOne(row.original.id)}
                        className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                        aria-label={`Select row ${row.original.id}`}
                    />
                ),
            },
            {
                id: 'order',
                header: () => <span>{t('workflow.statusLevels.table.order')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <span
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs border"
                            style={{
                                backgroundColor: `${record.color}15`,
                                borderColor: `${record.color}40`,
                                color: record.color,
                            }}
                        >
                            #{record.levelOrder}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'code',
                header: () => <span>{t('workflow.masters.table.code')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-semibold text-[#0D0D0D]">
                        {row.original.code}
                    </span>
                ),
            },
            {
                id: 'levelName',
                header: () => <span>{t('workflow.statusLevels.table.levelName')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {isRtl ? record.levelNameAr : record.levelNameEn}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-[#6E6862]">
                                    {record.stageCategory}
                                </span>
                                {record.isFinalLevel && (
                                    <span
                                        title={t('workflow.statusLevels.labels.finalStage')}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-[#037F8C]"
                                    >
                                        <Flag size={10} />
                                    </span>
                                )}
                                {record.requireComment && (
                                    <span
                                        title={t('workflow.statusLevels.labels.commentRequired')}
                                        className="inline-flex items-center gap-0.5 text-[10px] text-[#8C6046]"
                                    >
                                        <MessageSquare size={10} />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'workflow',
                header: () => <span>{t('workflow.statusLevels.drawer.associatedWorkflow')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                                    SOURCE_BADGE_STYLES[record.source]
                                }`}
                            >
                                {record.source}
                            </span>
                            <span className="text-xs text-[#0D0D0D]">
                                {isRtl ? record.workflowTitleAr : record.workflowTitleEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'approverRole',
                header: () => <span>{t('workflow.statusLevels.drawer.approverRole')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    return (
                        <span className="text-xs text-[#6E6862]">
                            {isRtl ? record.approverRoleAr : record.approverRoleEn}
                        </span>
                    );
                },
            },
            {
                id: 'sla',
                header: () => <span>{t('workflow.statusLevels.table.sla')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#6E6862]">
                        {row.original.slaHours}h
                    </span>
                ),
            },
            {
                id: 'status',
                header: () => <span>{t('workflow.statusLevels.table.status')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    const isEnabled = record.status === 'Enabled';
                    return (
                        <button
                            type="button"
                            onClick={() => handleToggleStatus(record)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isEnabled
                                    ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25 hover:bg-[#037F8C]/18'
                                    : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isEnabled ? 'bg-[#037F8C]' : 'bg-[#857E74]'
                                }`}
                            />
                            <span>
                                {isEnabled
                                    ? t('workflow.workflows.statuses.enabled')
                                    : t('workflow.workflows.statuses.disabled')}
                            </span>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: () => <span>{t('workflow.workflows.table.createdDate')}</span>,
                cell: ({ row }) => (
                    <span className="text-xs font-mono text-[#6E6862] tabular-nums" dir="ltr">
                        {row.original.createDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">{t('workflow.workflows.table.actions')}</div>
                ),
                cell: ({ row }) => {
                    const record = row.original as WorkflowStatusLevelRecord;
                    const isEnabled = record.status === 'Enabled';
                    return (
                        <div className="inline-flex items-center justify-end gap-1">
                            <button
                                type="button"
                                onClick={() => setViewingRecord(record)}
                                title={t('workflow.workflows.actions.view')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => openEditDrawer(record)}
                                title={t('common.edit', 'Edit')}
                                className="p-1 rounded-md text-[#857E74] hover:text-[#037F8C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(record)}
                                title={
                                    isEnabled
                                        ? t('workflow.workflows.actions.disable')
                                        : t('workflow.workflows.actions.enable')
                                }
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    isEnabled
                                        ? 'text-[#037F8C] hover:bg-[#037F8C]/10'
                                        : 'text-[#857E74] hover:bg-[#857E74]/15'
                                }`}
                            >
                                <Power size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(record)}
                                title={t('common.delete', 'Delete')}
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
            isAllCurrentPageSelected,
            selectedIds,
            isRtl,
            t,
            handleToggleSelectAll,
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
                                {t('workflow.statusLevels.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                STL-002
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('workflow.statusLevels.subtitle')}
                        </p>
                    </div>

                    {/* Workflow type filter buttons */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('ALL');
                                setPageIndex(0);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                typeTab === 'ALL'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <ListFilter size={13} />
                            <span>{t('workflow.statusLevels.tabs.all')}</span>
                            <span className="font-mono text-[10px]">({kpiStats.total})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('approval');
                                setPageIndex(0);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                typeTab === 'approval'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <ShieldCheck size={13} />
                            <span>{t('workflow.statusLevels.tabs.approval')}</span>
                            <span className="font-mono text-[10px]">({kpiStats.approval})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('communication');
                                setPageIndex(0);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                typeTab === 'communication'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Mail size={13} />
                            <span>{t('workflow.statusLevels.tabs.communication')}</span>
                            <span className="font-mono text-[10px]">
                                ({kpiStats.communication})
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
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
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
                            {t('workflow.statusLevels.table.stageCategory')}
                        </label>
                        <select
                            value={stageFilter}
                            onChange={(e) => {
                                setStageFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {STAGE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
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
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
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

            {/* DataTable */}
            <DataTable
                columns={columns}
                data={paginatedRecords}
                count={totalRecords}
                loading={isLoading || saveMutation.isPending}
                searchPlaceholder={t('workflow.statusLevels.searchPlaceholder')}
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
                title={t('workflow.statusLevels.title')}
                description={t('workflow.statusLevels.subtitle')}
                addNewLabel={t('workflow.statusLevels.actions.newStatusLevel')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
            />

            {/* View Drawer */}
            <WorkflowStatusLevelViewDrawer
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={openEditDrawer}
                onToggleStatus={handleToggleStatus}
            />

            {/* Create / Edit Form Drawer */}
            <WorkflowStatusLevelFormDrawer
                isOpen={isCreateOpen || editingRecord !== null}
                onClose={closeFormDrawer}
                onSubmit={handleFormSubmit}
                formState={formState}
                setFormState={setFormState}
                editingRecord={editingRecord}
                availableWorkflows={availableWorkflows}
            />

            {/* Delete Confirmation Modal */}
            <WorkflowStatusLevelDeleteModal
                record={deletingRecord}
                onClose={() => setDeletingRecord(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};
