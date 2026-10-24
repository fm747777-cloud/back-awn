import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    loadWorkflowRecords,
    saveWorkflowRecords,
    recordWorkflowAuditEvent,
    type WorkflowRecord,
    type WorkflowType,
    type WorkflowStatus,
} from './workflowMockData';
import {
    DEFAULT_WORKFLOW_ACTOR,
    exportWorkflowCsv,
    useWorkflowPaginationAndSelection,
} from './workflowUtils';
import {
    WorkflowFormDrawer,
    type WorkflowFormState,
} from '../../components/workflow/WorkflowFormDrawer';
import { WorkflowViewDrawer } from '../../components/workflow/WorkflowViewDrawer';
import { WorkflowDeleteModal } from '../../components/workflow/WorkflowDeleteModal';
import { WorkflowsHeader } from '../../components/workflow/workflows/WorkflowsHeader';
import { WorkflowsFilterBar } from '../../components/workflow/workflows/WorkflowsFilterBar';
import { WorkflowsTable } from '../../components/workflow/workflows/WorkflowsTable';

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

    // Drawers / Modals state
    const [viewingRecord, setViewingRecord] = useState<WorkflowRecord | null>(
        () => deepLinkedRecord
    );
    const [editingRecord, setEditingRecord] = useState<WorkflowRecord | null>(null);
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

    const {
        pageIndex,
        setPageIndex,
        pageSize,
        handlePageSizeChange,
        paginatedRecords,
        selectedIds,
        setSelectedIds,
        isAllCurrentPageSelected: allCurrentPageSelected,
        handleToggleSelectAll: handleToggleSelectAllPage,
        handleToggleSelectOne: handleToggleSelectRow,
        clearSelection,
    } = useWorkflowPaginationAndSelection(filteredRecords);

    const handleTabChange = (nextTab: WorkflowType) => {
        setManualTab(nextTab);
        setPageIndex(0);
        clearSelection();
        setSearchParams({ tab: nextTab }, { replace: true });
    };

    const hasActiveFilters = sourceFilter !== 'ALL' || statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setSourceFilter('ALL');
        setStatusFilter('ALL');
        setPageIndex(0);
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
                        performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                        performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                        actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
                clearSelection();
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
                    performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                    performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                    actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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

    // Open edit drawer
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
    };

    const handleSaveWorkflow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;

        const trimmedEn = formState.titleEn.trim();
        const trimmedAr = formState.titleAr.trim() || trimmedEn;

        if (!trimmedEn) {
            toast.error(t('workflow.workflows.drawer.titleEnRequired'));
            return;
        }

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
                    performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                    performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                    actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
                setEditingRecord(null);
            },
        });
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
                    performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                    performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                    actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
        exportWorkflowCsv(
            `awn_workflows_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`,
            [
                'ID',
                'Type',
                'Title (EN)',
                'Title (AR)',
                'Source',
                'Status',
                'Create Date',
                'Stages Count',
            ],
            filteredRecords.map((r) => [
                `#${r.id}`,
                r.workflowType,
                r.titleEn,
                r.titleAr,
                r.source,
                r.status,
                r.createDate,
                r.stagesCount,
            ])
        );
        toast.success(t('workflow.workflows.feedback.exportedSuccess'));
    };

    return (
        <div className="space-y-6">
            <WorkflowsHeader
                activeTab={activeTab}
                approvalCount={approvalCount}
                communicationCount={communicationCount}
                selectedCount={selectedIds.length}
                onTabChange={handleTabChange}
                onBulkStatusChange={handleBulkStatusChange}
                onClearSelection={clearSelection}
            />

            <WorkflowsFilterBar
                isOpen={isFiltersOpen}
                sourceFilter={sourceFilter}
                statusFilter={statusFilter}
                onSourceFilterChange={(value) => {
                    setSourceFilter(value);
                    setPageIndex(0);
                }}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    setPageIndex(0);
                }}
                onResetFilters={handleResetFilters}
            />

            <WorkflowsTable
                activeTab={activeTab}
                data={paginatedRecords}
                totalCount={totalItems}
                loading={isLoading || saveWorkflowMutation.isPending}
                isAr={isAr}
                pageIndex={pageIndex}
                pageSize={pageSize}
                searchValue={searchQuery}
                selectedIds={selectedIds}
                allCurrentPageSelected={allCurrentPageSelected}
                targetWorkflowIdParam={targetWorkflowIdParam}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                onPageChange={(newIdx) => setPageIndex(newIdx)}
                onPageSizeChange={handlePageSizeChange}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onToggleSelectAllPage={handleToggleSelectAllPage}
                onToggleSelectRow={handleToggleSelectRow}
                onView={(rec) => setViewingRecord(rec)}
                onEdit={openEditDrawer}
                onToggleStatus={handleToggleStatus}
                onDelete={(rec) => setDeletingRecord(rec)}
                onExportCsv={handleExportCsv}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
            />

            {/* Dedicated Components */}
            <WorkflowFormDrawer
                isOpen={editingRecord !== null}
                onClose={() => {
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
