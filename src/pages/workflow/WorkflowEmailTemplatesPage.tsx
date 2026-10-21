import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Mail,
    CheckCircle2,
    XCircle,
    Eye,
    Pencil,
    Trash2,
    Power,
    GitBranch,
} from 'lucide-react';
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
import { DataTable } from '../../components/DataTable';
import {
    WorkflowEmailTemplateFormDrawer,
    type EmailTemplateFormState,
    type FormValidationErrors,
    DEFAULT_EMAIL_TEMPLATE_FORM_STATE,
} from '../../components/workflow/WorkflowEmailTemplateFormDrawer';
import { WorkflowEmailTemplateViewDrawer } from '../../components/workflow/WorkflowEmailTemplateViewDrawer';
import { WorkflowEmailTemplateDeleteModal } from '../../components/workflow/WorkflowEmailTemplateDeleteModal';

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
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

    // KPI Summary Cards
    const kpiStats = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'Active').length;
        const inactive = records.filter((r) => r.status === 'Inactive').length;
        const distinctWorkflows = new Set(records.map((r) => r.communicationWorkflowKey)).size;
        return { total, active, inactive, distinctWorkflows };
    }, [records]);

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

    const paginatedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, pageIndex, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || statusFilter !== 'ALL' || workflowFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setWorkflowFilter('ALL');
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

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
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
            performedBy: record.creatorNameEn || 'Khalifah Alsharabi',
            performedByAr: record.creatorNameAr || 'خليفة الشرعبي',
            actorEn: record.creatorNameEn || 'Khalifah Alsharabi',
            actorAr: record.creatorNameAr || 'خليفة الشرعبي',
            actorEmail: record.email || 'k.alsharabi@awn.sa',
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
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEn: 'Khalifah Alsharabi',
                actorAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
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
        setSelectedIds([]);
    };

    // Open Create / Edit drawers
    const openCreateDrawer = () => {
        setEditingRecord(null);
        setFormErrors({});
        setWorkflowSearchTerm('');
        setFormState({
            ...DEFAULT_EMAIL_TEMPLATE_FORM_STATE,
            communicationWorkflowKey: communicationWorkflowOptions[0]?.key || 'CW-GOSI-RENEW',
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
        const trimmedCreatorEn = formState.creatorNameEn.trim() || 'Khalifah Alsharabi';
        const trimmedCreatorAr = formState.creatorNameAr.trim() || 'خليفة الشرعبي';
        const trimmedEmail = formState.email.trim() || 'k.alsharabi@awn.sa';

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
            performedBy: target.creatorNameEn || 'Khalifah Alsharabi',
            performedByAr: target.creatorNameAr || 'خليفة الشرعبي',
            actorEn: target.creatorNameEn || 'Khalifah Alsharabi',
            actorAr: target.creatorNameAr || 'خليفة الشرعبي',
            actorEmail: target.email || 'k.alsharabi@awn.sa',
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
        const headers = [
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
        ];
        const rows = filteredRecords.map((r) => [
            `"${r.id}"`,
            `"${r.templateNameEn.replace(/"/g, '""')}"`,
            `"${r.templateNameAr.replace(/"/g, '""')}"`,
            `"${r.communicationWorkflowNameEn.replace(/"/g, '""')}"`,
            r.source,
            `"${r.subjectEn.replace(/"/g, '""')}"`,
            `"${r.creatorNameEn.replace(/"/g, '""')}"`,
            r.email,
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
            `awn_workflow_email_templates_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workflow.emailTemplates.feedback.exportedSuccess'));
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
                accessorKey: 'id',
                header: () => <span>{t('workflow.emailTemplates.table.id')}</span>,
                cell: ({ row }) => (
                    <span
                        className="font-mono text-xs font-semibold text-[#037F8C] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E5E0D8]"
                        dir="ltr"
                    >
                        {row.original.id}
                    </span>
                ),
            },
            {
                id: 'templateName',
                header: () => <span>{t('workflow.emailTemplates.table.templateName')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {isRtl ? record.templateNameAr : record.templateNameEn}
                            </span>
                            <span className="text-[10px] text-[#6E6862] font-mono">
                                [{record.source}]
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'communicationWorkflow',
                header: () => (
                    <span>{t('workflow.emailTemplates.table.communicationWorkflow')}</span>
                ),
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex items-center gap-1.5 text-xs text-[#0D0D0D]">
                            <GitBranch size={13} className="text-[#857E74] shrink-0" />
                            <span>
                                {isRtl
                                    ? record.communicationWorkflowNameAr
                                    : record.communicationWorkflowNameEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'subject',
                header: () => <span>{t('workflow.emailTemplates.table.subject')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <span className="text-xs text-[#6E6862] line-clamp-1 max-w-xs">
                            {isRtl ? record.subjectAr : record.subjectEn}
                        </span>
                    );
                },
            },
            {
                id: 'creator',
                header: () => <span>{t('workflow.emailTemplates.table.creator')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    return (
                        <div className="flex flex-col text-xs">
                            <span className="font-semibold text-[#0D0D0D]">
                                {isRtl ? record.creatorNameAr : record.creatorNameEn}
                            </span>
                            <span className="text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                {record.email}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                header: () => <span>{t('workflow.emailTemplates.table.status')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowEmailTemplateRecord;
                    const isActive = record.status === 'Active';
                    return (
                        <button
                            type="button"
                            onClick={() => handleToggleStatus(record)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isActive
                                    ? 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25 hover:bg-[#037F8C]/18'
                                    : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-[#037F8C]' : 'bg-[#857E74]'
                                }`}
                            />
                            <span>
                                {isActive
                                    ? t('workflow.emailTemplates.statuses.active')
                                    : t('workflow.emailTemplates.statuses.inactive')}
                            </span>
                        </button>
                    );
                },
            },
            {
                accessorKey: 'createDate',
                header: () => <span>{t('workflow.emailTemplates.table.createdDate')}</span>,
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
                    const record = row.original as WorkflowEmailTemplateRecord;
                    const isActive = record.status === 'Active';
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
                                    isActive
                                        ? t('workflow.emailTemplates.actions.deactivate')
                                        : t('workflow.emailTemplates.actions.activate')
                                }
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    isActive
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
            openEditDrawer,
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
                                {t('workflow.emailTemplates.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                WFE-003
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('workflow.emailTemplates.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D]">
                            <Mail size={13} className="text-[#037F8C]" />
                            <span>
                                {kpiStats.total} {t('workflow.emailTemplates.labels.totalTemplates')}
                            </span>
                        </span>
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
                                onClick={() => handleBulkStatusChange('Active')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#1E472D] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('workflow.emailTemplates.actions.activate')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C6046] hover:bg-[#734E39] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>{t('workflow.emailTemplates.actions.deactivate')}</span>
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
                            {t('workflow.emailTemplates.table.communicationWorkflow')}
                        </label>
                        <select
                            value={workflowFilter}
                            onChange={(e) => {
                                setWorkflowFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {communicationWorkflowOptions.map((wf) => (
                                <option key={wf.key} value={wf.key}>
                                    {isRtl ? wf.nameAr : wf.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.emailTemplates.table.status')}
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
                            <option value="Active">
                                {t('workflow.emailTemplates.statuses.active')}
                            </option>
                            <option value="Inactive">
                                {t('workflow.emailTemplates.statuses.inactive')}
                            </option>
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
                searchPlaceholder={t('workflow.emailTemplates.searchPlaceholder')}
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
                title={t('workflow.emailTemplates.title')}
                description={t('workflow.emailTemplates.subtitle')}
                addNewLabel={t('workflow.emailTemplates.actions.newTemplate')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
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
