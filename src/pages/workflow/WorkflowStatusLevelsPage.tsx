import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    loadWorkflowStatusLevels,
    saveWorkflowStatusLevels,
    loadWorkflowRecords,
    recordWorkflowAuditEvent,
    type WorkflowStatusLevelRecord,
    type WorkflowStatus,
    type WorkflowType,
} from './workflowMockData';
import {
    DEFAULT_WORKFLOW_ACTOR,
    DEFAULT_STATUS_LEVEL_FORM_STATE,
    exportWorkflowCsv,
    useWorkflowPaginationAndSelection,
    type StatusLevelFormState,
} from './workflowUtils';
import { WorkflowStatusLevelFormDrawer } from '../../components/workflow/WorkflowStatusLevelFormDrawer';
import { WorkflowStatusLevelViewDrawer } from '../../components/workflow/WorkflowStatusLevelViewDrawer';
import { WorkflowStatusLevelDeleteModal } from '../../components/workflow/WorkflowStatusLevelDeleteModal';
import { WorkflowStatusLevelsHeader } from '../../components/workflow/status-levels/WorkflowStatusLevelsHeader';
import { WorkflowStatusLevelsFilterBar } from '../../components/workflow/status-levels/WorkflowStatusLevelsFilterBar';
import { WorkflowStatusLevelsTable } from '../../components/workflow/status-levels/WorkflowStatusLevelsTable';

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
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
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

    const {
        pageIndex,
        setPageIndex,
        pageSize,
        handlePageSizeChange,
        paginatedRecords,
        selectedIds,
        setSelectedIds,
        isAllCurrentPageSelected,
        handleToggleSelectAll,
        handleToggleSelectOne,
        clearSelection,
    } = useWorkflowPaginationAndSelection(filteredRecords);

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
            performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
            performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
                performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
        clearSelection();
    };

    // Edit handlers
    const openEditDrawer = (record: WorkflowStatusLevelRecord) => {
        setViewingRecord(null);
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
        setEditingRecord(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;

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
            performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
            performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
            performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
            performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
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
        exportWorkflowCsv(
            `awn_workflow_status_levels_${new Date().toISOString().slice(0, 10)}.csv`,
            [
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
            ],
            filteredRecords.map((r) => [
                r.id,
                r.code,
                r.levelNameEn,
                r.levelNameAr,
                r.levelOrder,
                r.stageCategory,
                r.workflowTitleEn,
                r.source,
                r.approverRoleEn,
                r.slaHours,
                r.status,
                r.createDate,
            ])
        );
        toast.success(t('workflow.statusLevels.feedback.exportedSuccess'));
    };

    return (
        <div className="space-y-6">
            <WorkflowStatusLevelsHeader
                typeTab={typeTab}
                kpiStats={kpiStats}
                selectedCount={selectedIds.length}
                onTypeTabChange={(nextTab) => {
                    setTypeTab(nextTab);
                    setPageIndex(0);
                }}
                onBulkStatusChange={handleBulkStatusChange}
                onClearSelection={clearSelection}
            />

            <WorkflowStatusLevelsFilterBar
                isOpen={isFiltersOpen}
                sourceFilter={sourceFilter}
                stageFilter={stageFilter}
                statusFilter={statusFilter}
                onSourceFilterChange={(value) => {
                    setSourceFilter(value);
                    setPageIndex(0);
                }}
                onStageFilterChange={(value) => {
                    setStageFilter(value);
                    setPageIndex(0);
                }}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    setPageIndex(0);
                }}
                onResetFilters={handleResetFilters}
            />

            <WorkflowStatusLevelsTable
                records={paginatedRecords}
                totalRecords={totalRecords}
                loading={isLoading || saveMutation.isPending}
                pageIndex={pageIndex}
                pageSize={pageSize}
                searchQuery={searchQuery}
                selectedIds={selectedIds}
                isAllCurrentPageSelected={isAllCurrentPageSelected}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                onPageChange={(newIdx) => setPageIndex(newIdx)}
                onPageSizeChange={handlePageSizeChange}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setPageIndex(0);
                }}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelectOne={handleToggleSelectOne}
                onViewRecord={(record) => setViewingRecord(record)}
                onEditRecord={openEditDrawer}
                onToggleStatus={handleToggleStatus}
                onDeleteRecord={(record) => setDeletingRecord(record)}
                onExportCsv={handleExportCsv}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
            />

            {/* View Drawer */}
            <WorkflowStatusLevelViewDrawer
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={openEditDrawer}
                onToggleStatus={handleToggleStatus}
            />

            {/* Edit Form Drawer */}
            <WorkflowStatusLevelFormDrawer
                isOpen={editingRecord !== null}
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
