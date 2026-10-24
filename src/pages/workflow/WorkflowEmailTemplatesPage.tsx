import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    loadWorkflowEmailTemplates,
    saveWorkflowEmailTemplates,
    appendWorkflowAuditEvent,
    COMMUNICATION_WORKFLOW_DEFINITIONS,
    getVariablesForCommunicationWorkflow,
    formatWorkflowDateToday,
    type WorkflowEmailTemplateRecord,
    type WorkflowEmailTemplateStatus,
    type CommunicationWorkflowDefinition,
} from './workflowMockData';
import {
    DEFAULT_WORKFLOW_ACTOR,
    DEFAULT_EMAIL_TEMPLATE_FORM_STATE,
    exportWorkflowCsv,
    useWorkflowPaginationAndSelection,
    type EmailTemplateFormState,
} from './workflowUtils';
import {
    WorkflowEmailTemplateFormDrawer,
    type FormValidationErrors,
} from '../../components/workflow/WorkflowEmailTemplateFormDrawer';
import { WorkflowEmailTemplateViewDrawer } from '../../components/workflow/WorkflowEmailTemplateViewDrawer';
import { WorkflowEmailTemplateDeleteModal } from '../../components/workflow/WorkflowEmailTemplateDeleteModal';
import { WorkflowBulkActionBar } from '../../components/workflow/shared/WorkflowBulkActionBar';
import { WorkflowEmailTemplatesFilterBar } from '../../components/workflow/email-templates/WorkflowEmailTemplatesFilterBar';
import { WorkflowEmailTemplatesTable } from '../../components/workflow/email-templates/WorkflowEmailTemplatesTable';

export const WorkflowEmailTemplatesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;
    const queryClient = useQueryClient();

    // TanStack Query for server state
    const { data: records = [], isLoading } = useQuery<WorkflowEmailTemplateRecord[]>({
        queryKey: ['workflow-email-templates'],
        queryFn: async () => loadWorkflowEmailTemplates(),
    });

    // TanStack Mutation for persisting updates
    const saveMutation = useMutation({
        mutationFn: async (updated: WorkflowEmailTemplateRecord[]) => {
            saveWorkflowEmailTemplates(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['workflow-email-templates'], updated);
        },
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [workflowFilter, setWorkflowFilter] = useState<string>('ALL');
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);

    // Form State & Searchable Communication Workflow Dropdown State
    const [formState, setFormState] = useState<EmailTemplateFormState>(DEFAULT_EMAIL_TEMPLATE_FORM_STATE);
    const [formErrors, setFormErrors] = useState<FormValidationErrors>({});
    const [workflowSearchTerm, setWorkflowSearchTerm] = useState<string>('');

    const persistRecords = (updated: WorkflowEmailTemplateRecord[]) => {
        saveMutation.mutate(updated);
    };

    const communicationWorkflowOptions: CommunicationWorkflowDefinition[] = useMemo(
        () => COMMUNICATION_WORKFLOW_DEFINITIONS,
        []
    );

    const searchableWorkflowOptions = useMemo(() => {
        const q = workflowSearchTerm.trim().toLowerCase();
        if (!q) return communicationWorkflowOptions;
        return communicationWorkflowOptions.filter(
            (w) =>
                w.key.toLowerCase().includes(q) ||
                w.nameEn.toLowerCase().includes(q) ||
                w.nameAr.toLowerCase().includes(q) ||
                w.source.toLowerCase().includes(q)
        );
    }, [communicationWorkflowOptions, workflowSearchTerm]);

    const currentWorkflowVariables = useMemo(() => {
        if (!formState.communicationWorkflowKey) return [];
        return getVariablesForCommunicationWorkflow(formState.communicationWorkflowKey);
    }, [formState.communicationWorkflowKey]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records
            .filter((item) => {
                if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
                if (
                    workflowFilter !== 'ALL' &&
                    item.communicationWorkflowKey !== workflowFilter
                ) {
                    return false;
                }
                if (!q) return true;
                return (
                    item.id.toLowerCase().includes(q) ||
                    item.templateNameEn.toLowerCase().includes(q) ||
                    item.templateNameAr.toLowerCase().includes(q) ||
                    item.communicationWorkflowNameEn.toLowerCase().includes(q) ||
                    item.communicationWorkflowNameAr.toLowerCase().includes(q) ||
                    item.subjectEn.toLowerCase().includes(q) ||
                    item.subjectAr.toLowerCase().includes(q) ||
                    item.creatorNameEn.toLowerCase().includes(q) ||
                    item.creatorNameAr.toLowerCase().includes(q) ||
                    item.email.toLowerCase().includes(q) ||
                    item.source.toLowerCase().includes(q) ||
                    item.createDate.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => b.id.localeCompare(a.id));
    }, [records, statusFilter, workflowFilter, searchQuery]);

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
    } = useWorkflowPaginationAndSelection<WorkflowEmailTemplateRecord, string>(filteredRecords);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || statusFilter !== 'ALL' || workflowFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setWorkflowFilter('ALL');
        setPageIndex(0);
    };

    // Activate / Deactivate single record + Audit Trail event
    const handleToggleStatus = (record: WorkflowEmailTemplateRecord) => {
        const nextStatus: WorkflowEmailTemplateStatus =
            record.status === 'Active' ? 'Inactive' : 'Active';
        const updated = records.map((item) =>
            item.id === record.id ? { ...item, status: nextStatus } : item
        );
        persistRecords(updated);

        if (viewingRecord?.id === record.id) {
            setViewingRecord({ ...record, status: nextStatus });
        }

        appendWorkflowAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Email Template',
            recordId: record.id,
            resourceData: `${record.templateNameEn} (${record.id})`,
            resourceDataAr: `${record.templateNameAr} (${record.id})`,
            performedBy: record.creatorNameEn || DEFAULT_WORKFLOW_ACTOR.nameEn,
            performedByAr: record.creatorNameAr || DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEn: record.creatorNameEn || DEFAULT_WORKFLOW_ACTOR.nameEn,
            actorAr: record.creatorNameAr || DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEmail: record.email || DEFAULT_WORKFLOW_ACTOR.email,
            remarks: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} email template "${record.templateNameEn}" (${record.id}).`,
            remarksAr: `تم ${nextStatus === 'Active' ? 'تفعيل' : 'تعطيل'} قالب البريد الإلكتروني "${record.templateNameAr}" (${record.id}).`,
            summaryEn: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} email template "${record.templateNameEn}" (${record.id}).`,
            summaryAr: `تم ${nextStatus === 'Active' ? 'تفعيل' : 'تعطيل'} قالب البريد الإلكتروني "${record.templateNameAr}" (${record.id}).`,
            previousStatus: record.status,
            newStatus: nextStatus,
        });

        toast.success(
            t('workflow.emailTemplates.feedback.statusUpdated', {
                title: isRtl ? record.templateNameAr : record.templateNameEn,
                status:
                    nextStatus === 'Active'
                        ? t('workflow.emailTemplates.statuses.active')
                        : t('workflow.emailTemplates.statuses.inactive'),
            })
        );
    };

    // Bulk Activate / Deactivate + Audit Trail events
    const handleBulkStatusChange = (targetStatus: WorkflowEmailTemplateStatus) => {
        if (selectedIds.length === 0) return;
        const affectedRecords = records.filter(
            (item) => selectedIds.includes(item.id) && item.status !== targetStatus
        );
        const updated = records.map((item) =>
            selectedIds.includes(item.id) ? { ...item, status: targetStatus } : item
        );
        persistRecords(updated);

        for (const rec of affectedRecords) {
            appendWorkflowAuditEvent({
                action: targetStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
                resource: 'Email Template',
                recordId: rec.id,
                resourceData: `${rec.templateNameEn} (${rec.id})`,
                resourceDataAr: `${rec.templateNameAr} (${rec.id})`,
                performedBy: DEFAULT_WORKFLOW_ACTOR.nameEn,
                performedByAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                actorEn: DEFAULT_WORKFLOW_ACTOR.nameEn,
                actorAr: DEFAULT_WORKFLOW_ACTOR.nameAr,
                actorEmail: DEFAULT_WORKFLOW_ACTOR.email,
                remarks: `Bulk ${targetStatus === 'Active' ? 'activated' : 'deactivated'} email template "${rec.templateNameEn}" (${rec.id}).`,
                remarksAr: `تم ${targetStatus === 'Active' ? 'تفعيل' : 'تعطيل'} قالب البريد الإلكتروني "${rec.templateNameAr}" (${rec.id}) ضمن إجراء جماعي.`,
                summaryEn: `Bulk ${targetStatus === 'Active' ? 'activated' : 'deactivated'} email template "${rec.templateNameEn}" (${rec.id}).`,
                summaryAr: `تم ${targetStatus === 'Active' ? 'تفعيل' : 'تعطيل'} قالب البريد الإلكتروني "${rec.templateNameAr}" (${rec.id}) ضمن إجراء جماعي.`,
                previousStatus: rec.status,
                newStatus: targetStatus,
            });
        }

        toast.success(
            t('workflow.emailTemplates.feedback.bulkStatusUpdated', {
                count: selectedIds.length,
                status:
                    targetStatus === 'Active'
                        ? t('workflow.emailTemplates.statuses.active')
                        : t('workflow.emailTemplates.statuses.inactive'),
            })
        );
        clearSelection();
    };

    // Open Create / Edit drawers
    const openCreateDrawer = () => {
        setEditingRecord(null);
        setFormErrors({});
        setWorkflowSearchTerm('');
        setFormState({
            ...DEFAULT_EMAIL_TEMPLATE_FORM_STATE,
        });
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: WorkflowEmailTemplateRecord) => {
        setViewingRecord(null);
        setIsCreateOpen(false);
        setFormErrors({});
        setWorkflowSearchTerm('');
        setEditingRecord(record);
        setFormState({
            templateNameEn: isRtl ? record.templateNameAr : record.templateNameEn,
            templateNameAr: record.templateNameAr,
            communicationWorkflowKey: record.communicationWorkflowKey,
            subjectEn: isRtl ? record.subjectAr : record.subjectEn,
            subjectAr: record.subjectAr,
            contentEn: isRtl ? record.contentAr : record.contentEn,
            contentAr: record.contentAr,
            creatorNameEn: record.creatorNameEn,
            creatorNameAr: record.creatorNameAr,
            email: record.email,
            status: record.status,
        });
    };

    const closeFormDrawer = () => {
        setIsCreateOpen(false);
        setEditingRecord(null);
        setFormErrors({});
        setWorkflowSearchTerm('');
    };

    // Insert variable chip into email content
    const handleInsertVariable = (variableToken: string) => {
        setFormState((prev) => {
            const spacer =
                prev.contentEn.length > 0 && !prev.contentEn.endsWith(' ') ? ' ' : '';
            const nextContent = `${prev.contentEn}${spacer}${variableToken}`;
            return {
                ...prev,
                contentEn: nextContent,
                contentAr: nextContent,
            };
        });
        if (formErrors.content) {
            setFormErrors((prev) => ({ ...prev, content: undefined }));
        }
        toast.info(
            t('workflow.emailTemplates.feedback.variableInserted', { variable: variableToken })
        );
    };

    // Validate required fields
    const validateForm = (): boolean => {
        const nextErrors: FormValidationErrors = {};
        if (!formState.templateNameEn.trim()) {
            nextErrors.templateName = t(
                'workflow.emailTemplates.validation.templateNameRequired'
            );
        }
        if (!formState.communicationWorkflowKey.trim()) {
            nextErrors.communicationWorkflow = t(
                'workflow.emailTemplates.validation.workflowRequired'
            );
        }
        if (!formState.subjectEn.trim()) {
            nextErrors.subject = t('workflow.emailTemplates.validation.subjectRequired');
        }
        if (!formState.contentEn.trim()) {
            nextErrors.content = t('workflow.emailTemplates.validation.contentRequired');
        }
        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            toast.error(t('workflow.emailTemplates.validation.fixErrors'));
            return false;
        }
        return true;
    };

    const generateNextTemplateId = (): string => {
        const numericIds = records
            .map((r) => {
                const match = r.id.match(/(\d+)$/);
                return match ? Number(match[1]) : 0;
            })
            .filter((n) => !Number.isNaN(n));
        const maxNum = numericIds.length > 0 ? Math.max(...numericIds) : 8;
        return `WFEMA${String(maxNum + 1).padStart(3, '0')}`;
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const matchedWf =
            communicationWorkflowOptions.find(
                (w) => w.key === formState.communicationWorkflowKey
            ) || communicationWorkflowOptions[0];

        const trimmedName = formState.templateNameEn.trim();
        const trimmedSubject = formState.subjectEn.trim();
        const trimmedContent = formState.contentEn.trim();
        const trimmedCreatorEn = formState.creatorNameEn.trim() || DEFAULT_WORKFLOW_ACTOR.nameEn;
        const trimmedCreatorAr = formState.creatorNameAr.trim() || DEFAULT_WORKFLOW_ACTOR.nameAr;
        const trimmedEmail = formState.email.trim() || DEFAULT_WORKFLOW_ACTOR.email;

        if (editingRecord) {
            const updatedRecord: WorkflowEmailTemplateRecord = {
                ...editingRecord,
                templateNameEn: trimmedName,
                templateNameAr: trimmedName,
                communicationWorkflowKey: matchedWf.key,
                communicationWorkflowNameEn: matchedWf.nameEn,
                communicationWorkflowNameAr: matchedWf.nameAr,
                source: matchedWf.source,
                creatorNameEn: trimmedCreatorEn,
                creatorNameAr: trimmedCreatorAr,
                email: trimmedEmail,
                status: formState.status,
                subjectEn: trimmedSubject,
                subjectAr: trimmedSubject,
                contentEn: trimmedContent,
                contentAr: trimmedContent,
                availableVariables: [...matchedWf.variables],
            };

            const updatedList = records.map((item) =>
                item.id === editingRecord.id ? updatedRecord : item
            );
            persistRecords(updatedList);

            appendWorkflowAuditEvent({
                action: 'UPDATED',
                resource: 'Email Template',
                recordId: editingRecord.id,
                resourceData: `${trimmedName} (${editingRecord.id})`,
                resourceDataAr: `${trimmedName} (${editingRecord.id})`,
                performedBy: trimmedCreatorEn,
                performedByAr: trimmedCreatorAr,
                actorEn: trimmedCreatorEn,
                actorAr: trimmedCreatorAr,
                actorEmail: trimmedEmail,
                remarks: `Updated email template "${trimmedName}" (${editingRecord.id}) for communication workflow "${matchedWf.nameEn}".`,
                remarksAr: `تم تحديث قالب البريد الإلكتروني "${trimmedName}" (${editingRecord.id}) لسير العمل "${matchedWf.nameAr}".`,
                summaryEn: `Updated email template "${trimmedName}" (${editingRecord.id}) for communication workflow "${matchedWf.nameEn}".`,
                summaryAr: `تم تحديث قالب البريد الإلكتروني "${updatedRecord.templateNameAr}" (${editingRecord.id}) المرتبط بـ "${matchedWf.nameAr}".`,
                previousStatus: editingRecord.status,
                newStatus: updatedRecord.status,
            });

            toast.success(
                t('workflow.emailTemplates.feedback.templateUpdated', {
                    title: trimmedName,
                })
            );
            closeFormDrawer();
        } else {
            const newId = generateNextTemplateId();
            const newRecord: WorkflowEmailTemplateRecord = {
                id: newId,
                templateNameEn: trimmedName,
                templateNameAr: trimmedName,
                communicationWorkflowKey: matchedWf.key,
                communicationWorkflowNameEn: matchedWf.nameEn,
                communicationWorkflowNameAr: matchedWf.nameAr,
                source: matchedWf.source,
                creatorNameEn: trimmedCreatorEn,
                creatorNameAr: trimmedCreatorAr,
                email: trimmedEmail,
                createDate: formatWorkflowDateToday(),
                status: formState.status,
                subjectEn: trimmedSubject,
                subjectAr: trimmedSubject,
                contentEn: trimmedContent,
                contentAr: trimmedContent,
                availableVariables: [...matchedWf.variables],
            };

            persistRecords([newRecord, ...records]);

            appendWorkflowAuditEvent({
                action: 'CREATED',
                resource: 'Email Template',
                recordId: newId,
                resourceData: `${trimmedName} (${newId})`,
                resourceDataAr: `${trimmedName} (${newId})`,
                performedBy: trimmedCreatorEn,
                performedByAr: trimmedCreatorAr,
                actorEn: trimmedCreatorEn,
                actorAr: trimmedCreatorAr,
                actorEmail: trimmedEmail,
                remarks: `Created email template "${trimmedName}" (${newId}) for workflow "${matchedWf.nameEn}".`,
                remarksAr: `تم إنشاء قالب البريد الإلكتروني "${trimmedName}" (${newId}) لسير العمل "${matchedWf.nameAr}".`,
                summaryEn: `Created email template "${trimmedName}" (${newId}) for workflow "${matchedWf.nameEn}".`,
                summaryAr: `تم إنشاء قالب البريد الإلكتروني "${trimmedName}" (${newId}) لسير العمل "${matchedWf.nameAr}".`,
                newStatus: newRecord.status,
            });

            toast.success(
                t('workflow.emailTemplates.feedback.templateCreated', {
                    title: trimmedName,
                })
            );
            closeFormDrawer();
        }
    };

    // Delete confirmation + Audit Trail event
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

        appendWorkflowAuditEvent({
            action: 'DELETED',
            resource: 'Email Template',
            recordId: target.id,
            resourceData: `${target.templateNameEn} (${target.id})`,
            resourceDataAr: `${target.templateNameAr} (${target.id})`,
            performedBy: target.creatorNameEn || DEFAULT_WORKFLOW_ACTOR.nameEn,
            performedByAr: target.creatorNameAr || DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEn: target.creatorNameEn || DEFAULT_WORKFLOW_ACTOR.nameEn,
            actorAr: target.creatorNameAr || DEFAULT_WORKFLOW_ACTOR.nameAr,
            actorEmail: target.email || DEFAULT_WORKFLOW_ACTOR.email,
            remarks: `Deleted email template "${target.templateNameEn}" (${target.id}) from system.`,
            remarksAr: `تم حذف قالب البريد الإلكتروني "${target.templateNameAr}" (${target.id}) من النظام.`,
            summaryEn: `Deleted email template "${target.templateNameEn}" (${target.id}) from system.`,
            summaryAr: `تم حذف قالب البريد الإلكتروني "${target.templateNameAr}" (${target.id}) من النظام.`,
            previousStatus: target.status,
        });

        toast.success(
            t('workflow.emailTemplates.feedback.templateDeleted', {
                title: isRtl ? target.templateNameAr : target.templateNameEn,
            })
        );
    };

    // Export CSV
    const handleExportCsv = () => {
        exportWorkflowCsv(
            `awn_workflow_email_templates_${new Date().toISOString().slice(0, 10)}.csv`,
            [
                'ID',
                'Template Name (EN)',
                'Template Name (AR)',
                'Communication Workflow',
                'Source Module',
                'Subject',
                'Creator',
                'Email',
                'Status',
                'Create Date',
            ],
            filteredRecords.map((r) => [
                r.id,
                r.templateNameEn,
                r.templateNameAr,
                r.communicationWorkflowNameEn,
                r.source,
                r.subjectEn,
                r.creatorNameEn,
                r.email,
                r.status,
                r.createDate,
            ])
        );
        toast.success(
            t('workflow.emailTemplates.feedback.exportSuccess', {
                count: filteredRecords.length,
            })
        );
    };

    return (
        <div className="space-y-6">
            <WorkflowBulkActionBar
                selectedCount={selectedIds.length}
                enableLabel={t('workflow.emailTemplates.actions.activate')}
                disableLabel={t('workflow.emailTemplates.actions.deactivate')}
                onEnableSelected={() => handleBulkStatusChange('Active')}
                onDisableSelected={() => handleBulkStatusChange('Inactive')}
                onClearSelection={clearSelection}
            />

            <WorkflowEmailTemplatesFilterBar
                isOpen={isFiltersOpen}
                workflowFilter={workflowFilter}
                statusFilter={statusFilter}
                communicationWorkflowOptions={communicationWorkflowOptions}
                onWorkflowFilterChange={(value) => {
                    setWorkflowFilter(value);
                    setPageIndex(0);
                }}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    setPageIndex(0);
                }}
                onResetFilters={handleResetFilters}
            />

            <WorkflowEmailTemplatesTable
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
                onAddNew={openCreateDrawer}
                onExportCsv={handleExportCsv}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
            />

            {/* View Drawer */}
            <WorkflowEmailTemplateViewDrawer
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={openEditDrawer}
                onToggleStatus={handleToggleStatus}
            />

            {/* Create / Edit Form Drawer */}
            <WorkflowEmailTemplateFormDrawer
                isOpen={isCreateOpen || editingRecord !== null}
                onClose={closeFormDrawer}
                onSubmit={handleFormSubmit}
                formState={formState}
                setFormState={setFormState}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                editingRecord={editingRecord}
                workflowSearchTerm={workflowSearchTerm}
                setWorkflowSearchTerm={setWorkflowSearchTerm}
                searchableWorkflowOptions={searchableWorkflowOptions}
                currentWorkflowVariables={currentWorkflowVariables}
                onInsertVariable={handleInsertVariable}
            />

            {/* Delete Confirmation Modal */}
            <WorkflowEmailTemplateDeleteModal
                record={deletingRecord}
                onClose={() => setDeletingRecord(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};
