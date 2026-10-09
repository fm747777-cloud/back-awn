import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Mail,
    CheckCircle2,
    XCircle,
    GitBranch,
    Braces,
    Search,
    RotateCcw,
    Plus,
    Download,
    Eye,
    Pencil,
    Trash2,
    Power,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    AtSign,
    Calendar,
    FileText,
    AlertCircle,
} from 'lucide-react';
import {
    loadWorkflowEmailTemplates,
    saveWorkflowEmailTemplates,
    loadWorkflowRecords,
    appendWorkflowAuditEvent,
    COMMUNICATION_WORKFLOW_DEFINITIONS,
    getVariablesForCommunicationWorkflow,
    formatWorkflowDateToday,
    WORKFLOW_PAGE_SIZE_OPTIONS,
    type WorkflowEmailTemplateRecord,
    type WorkflowEmailTemplateStatus,
    type CommunicationWorkflowDefinition,
} from './workflowMockData';

interface EmailTemplateFormState {
    templateNameEn: string;
    templateNameAr: string;
    communicationWorkflowKey: string;
    subjectEn: string;
    subjectAr: string;
    contentEn: string;
    contentAr: string;
    creatorNameEn: string;
    creatorNameAr: string;
    email: string;
    status: WorkflowEmailTemplateStatus;
}

interface FormValidationErrors {
    templateName?: string;
    communicationWorkflow?: string;
    subject?: string;
    content?: string;
}

const DEFAULT_FORM_STATE: EmailTemplateFormState = {
    templateNameEn: '',
    templateNameAr: '',
    communicationWorkflowKey: '',
    subjectEn: '',
    subjectAr: '',
    contentEn: '',
    contentAr: '',
    creatorNameEn: 'Khalifah Alsharabi',
    creatorNameAr: 'خليفة الشرعبي',
    email: 'k.alsharabi@awn.sa',
    status: 'Active',
};

export const WorkflowEmailTemplatesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    const [records, setRecords] = useState<WorkflowEmailTemplateRecord[]>(() =>
        loadWorkflowEmailTemplates()
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [workflowFilter, setWorkflowFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowEmailTemplateRecord | null>(null);

    // Form State & Searchable Communication Workflow Dropdown State
    const [formState, setFormState] = useState<EmailTemplateFormState>(DEFAULT_FORM_STATE);
    const [formErrors, setFormErrors] = useState<FormValidationErrors>({});
    const [workflowSearchTerm, setWorkflowSearchTerm] = useState<string>('');
    const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Merge built-in communication workflow definitions with any newly created communication workflows
    const communicationWorkflowOptions = useMemo<CommunicationWorkflowDefinition[]>(() => {
        const baseList = [...COMMUNICATION_WORKFLOW_DEFINITIONS];
        const existingNames = new Set(baseList.map((w) => w.nameEn.toLowerCase()));
        const storedWorkflows = loadWorkflowRecords().filter(
            (w) => w.workflowType === 'communication'
        );

        for (const wf of storedWorkflows) {
            if (!existingNames.has(wf.titleEn.toLowerCase())) {
                baseList.push({
                    key: `CW-CUSTOM-${wf.id}`,
                    nameEn: wf.titleEn,
                    nameAr: wf.titleAr,
                    source: wf.source,
                    variables:
                        wf.source === 'REQUEST'
                            ? [
                                  '{{requestId}}',
                                  '{{companyName}}',
                                  '{{serviceName}}',
                                  '{{requestStatus}}',
                                  '{{assignedResource}}',
                                  '{{dueDate}}',
                                  '{{workflowName}}',
                              ]
                            : ['{{companyName}}', '{{assignedResource}}', '{{workflowName}}'],
                });
            }
        }
        return baseList;
    }, []);

    // Filtered options inside the drawer's searchable Communication Workflow selector
    const searchableWorkflowOptions = useMemo(() => {
        const q = workflowSearchTerm.trim().toLowerCase();
        if (!q) return communicationWorkflowOptions;
        return communicationWorkflowOptions.filter(
            (opt) =>
                opt.nameEn.toLowerCase().includes(q) ||
                opt.nameAr.toLowerCase().includes(q) ||
                opt.source.toLowerCase().includes(q) ||
                opt.key.toLowerCase().includes(q)
        );
    }, [communicationWorkflowOptions, workflowSearchTerm]);

    // Dynamic variables for currently selected Communication Workflow in form
    const currentWorkflowVariables = useMemo<string[]>(() => {
        if (!formState.communicationWorkflowKey) return [];
        const matched = communicationWorkflowOptions.find(
            (w) => w.key === formState.communicationWorkflowKey
        );
        if (matched) return matched.variables;
        return getVariablesForCommunicationWorkflow(formState.communicationWorkflowKey);
    }, [formState.communicationWorkflowKey, communicationWorkflowOptions]);

    const persistRecords = (updated: WorkflowEmailTemplateRecord[]) => {
        setRecords(updated);
        saveWorkflowEmailTemplates(updated);
    };

    // KPI counts
    const kpiCounts = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'Active').length;
        const inactive = records.filter((r) => r.status === 'Inactive').length;
        const linkedWorkflows = new Set(records.map((r) => r.communicationWorkflowKey)).size;
        return { total, active, inactive, linkedWorkflows };
    }, [records]);

    // Filtered records
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (workflowFilter !== 'ALL' && item.communicationWorkflowKey !== workflowFilter) {
                return false;
            }
            if (!q) return true;
            return (
                item.id.toLowerCase().includes(q) ||
                item.templateNameEn.toLowerCase().includes(q) ||
                item.templateNameAr.toLowerCase().includes(q) ||
                item.creatorNameEn.toLowerCase().includes(q) ||
                item.creatorNameAr.toLowerCase().includes(q) ||
                item.email.toLowerCase().includes(q) ||
                item.communicationWorkflowNameEn.toLowerCase().includes(q) ||
                item.communicationWorkflowNameAr.toLowerCase().includes(q) ||
                item.subjectEn.toLowerCase().includes(q) ||
                item.subjectAr.toLowerCase().includes(q) ||
                item.createDate.toLowerCase().includes(q) ||
                item.status.toLowerCase().includes(q)
            );
        });
    }, [records, statusFilter, workflowFilter, searchQuery]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || statusFilter !== 'ALL' || workflowFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setWorkflowFilter('ALL');
        setCurrentPage(1);
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
            ...DEFAULT_FORM_STATE,
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
        const textarea = contentTextareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart ?? formState.contentEn.length;
            const end = textarea.selectionEnd ?? formState.contentEn.length;
            const currentText = formState.contentEn;
            const updatedText =
                currentText.slice(0, start) + variableToken + currentText.slice(end);
            setFormState((prev) => ({
                ...prev,
                contentEn: updatedText,
                contentAr: updatedText,
            }));
            if (formErrors.content) {
                setFormErrors((prev) => ({ ...prev, content: undefined }));
            }
            setTimeout(() => {
                textarea.focus();
                const nextPos = start + variableToken.length;
                textarea.setSelectionRange(nextPos, nextPos);
            }, 0);
        } else {
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
                templateNameEn: isRtl ? editingRecord.templateNameEn || trimmedName : trimmedName,
                templateNameAr: isRtl ? trimmedName : formState.templateNameAr.trim() || trimmedName,
                communicationWorkflowKey: matchedWf.key,
                communicationWorkflowNameEn: matchedWf.nameEn,
                communicationWorkflowNameAr: matchedWf.nameAr,
                source: matchedWf.source,
                creatorNameEn: trimmedCreatorEn,
                creatorNameAr: trimmedCreatorAr,
                email: trimmedEmail,
                status: formState.status,
                subjectEn: isRtl ? editingRecord.subjectEn || trimmedSubject : trimmedSubject,
                subjectAr: isRtl ? trimmedSubject : formState.subjectAr.trim() || trimmedSubject,
                contentEn: isRtl ? editingRecord.contentEn || trimmedContent : trimmedContent,
                contentAr: isRtl ? trimmedContent : formState.contentAr.trim() || trimmedContent,
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
                resourceData: `${updatedRecord.templateNameEn} (${editingRecord.id})`,
                resourceDataAr: `${updatedRecord.templateNameAr} (${editingRecord.id})`,
                performedBy: trimmedCreatorEn,
                performedByAr: trimmedCreatorAr,
                actorEn: trimmedCreatorEn,
                actorAr: trimmedCreatorAr,
                actorEmail: trimmedEmail,
                remarks: `Updated email template "${updatedRecord.templateNameEn}" (${editingRecord.id}) linked to "${matchedWf.nameEn}".`,
                remarksAr: `تم تحديث قالب البريد الإلكتروني "${updatedRecord.templateNameAr}" (${editingRecord.id}) المرتبط بـ "${matchedWf.nameAr}".`,
                summaryEn: `Updated email template "${updatedRecord.templateNameEn}" (${editingRecord.id}) linked to "${matchedWf.nameEn}".`,
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
            remarks: `Deleted email template "${target.templateNameEn}" (${target.id}).`,
            remarksAr: `تم حذف قالب البريد الإلكتروني "${target.templateNameAr}" (${target.id}).`,
            summaryEn: `Deleted email template "${target.templateNameEn}" (${target.id}).`,
            summaryAr: `تم حذف قالب البريد الإلكتروني "${target.templateNameAr}" (${target.id}).`,
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
            'Creator / Author',
            'Email',
            'Create Date',
            'Status',
            'Email Subject',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            `"${r.templateNameEn.replace(/"/g, '""')}"`,
            `"${r.templateNameAr.replace(/"/g, '""')}"`,
            `"${r.communicationWorkflowNameEn.replace(/"/g, '""')}"`,
            `"${r.creatorNameEn.replace(/"/g, '""')}"`,
            `"${r.email.replace(/"/g, '""')}"`,
            r.createDate,
            r.status,
            `"${r.subjectEn.replace(/"/g, '""')}"`,
        ]);
        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awn-workflow-email-templates-${formatWorkflowDateToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(
            t('workflow.emailTemplates.feedback.exportSuccess', {
                count: filteredRecords.length,
            })
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('workflow.emailTemplates.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            WFL-TPL
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('workflow.emailTemplates.description')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('workflow.workflows.actions.exportCsv')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={openCreateDrawer}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus size={14} />
                        <span>{t('workflow.emailTemplates.actions.newTemplate')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.emailTemplates.kpis.totalTemplates')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                            <Mail className="w-4 h-4 text-[#BFAB93]" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpiCounts.total}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.emailTemplates.kpis.activeTemplates')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#265938]/12 text-[#265938] flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#265938] tabular-nums"
                            dir="ltr"
                        >
                            {kpiCounts.active}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.emailTemplates.kpis.inactiveTemplates')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#857E74]/15 text-[#857E74] flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#6E6862] tabular-nums"
                            dir="ltr"
                        >
                            {kpiCounts.inactive}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.emailTemplates.kpis.connectedWorkflows')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <GitBranch className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpiCounts.linkedWorkflows}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Search & Filters Bar */}
                <div className="p-4 border-b border-[#E5E0D8] bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('workflow.emailTemplates.filters.searchPlaceholder')}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                                aria-label={t('common.clear', 'Clear')}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Filter Selects */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Communication Workflow Filter */}
                        <select
                            value={workflowFilter}
                            onChange={(e) => {
                                setWorkflowFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.emailTemplates.filters.workflowLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer max-w-xs"
                        >
                            <option value="ALL">
                                {t('workflow.emailTemplates.filters.allWorkflows')}
                            </option>
                            {communicationWorkflowOptions.map((wf) => (
                                <option key={wf.key} value={wf.key}>
                                    {isRtl ? wf.nameAr : wf.nameEn}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.emailTemplates.filters.statusLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('workflow.emailTemplates.filters.allStatuses')}
                            </option>
                            <option value="Active">
                                {t('workflow.emailTemplates.statuses.active')}
                            </option>
                            <option value="Inactive">
                                {t('workflow.emailTemplates.statuses.inactive')}
                            </option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.resetFilters', 'Reset Filters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-5 py-2.5 bg-[#2D3F2C]/8 border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3F2C]">
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] font-mono"
                                dir="ltr"
                            >
                                {selectedIds.length}
                            </span>
                            <span>{t('workflow.emailTemplates.selection.selectedCount')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Active')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#265938] hover:bg-[#1f492e] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>
                                    {t('workflow.emailTemplates.selection.activateSelected')}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#857E74] hover:bg-[#6E6862] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>
                                    {t('workflow.emailTemplates.selection.deactivateSelected')}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('workflow.workflows.selection.clearSelection')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8]">
                                <th className="w-11 py-3.5 px-4 text-start">
                                    <input
                                        type="checkbox"
                                        checked={isAllCurrentPageSelected}
                                        onChange={handleToggleSelectAll}
                                        aria-label={t('workflow.workflows.table.selectAll')}
                                        className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.id')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.templateName')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.creator')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.email')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.createDate')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.emailTemplates.table.status')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-end">
                                    {t('workflow.emailTemplates.table.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E5E0D8]">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <Mail size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('workflow.emailTemplates.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('workflow.emailTemplates.empty.description')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>
                                                        {t('common.resetFilters', 'Reset Filters')}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => {
                                    const isSelected = selectedIds.includes(record.id);
                                    const isActive = record.status === 'Active';

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#2D3F2C]/5'
                                                    : 'hover:bg-[#FAF8F5]/70'
                                            }`}
                                        >
                                            <td className="py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        handleToggleSelectOne(record.id)
                                                    }
                                                    aria-label={`${t('workflow.workflows.table.selectRow')} ${record.id}`}
                                                    className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-bold text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    {record.id}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        className="text-xs font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] transition-colors text-start cursor-pointer"
                                                    >
                                                        {isRtl
                                                            ? record.templateNameAr
                                                            : record.templateNameEn}
                                                    </button>
                                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-[#6E6862]">
                                                            <GitBranch size={11} />
                                                            {isRtl
                                                                ? record.communicationWorkflowNameAr
                                                                : record.communicationWorkflowNameEn}
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-sm text-[#6E6862]"
                                                            dir="ltr"
                                                        >
                                                            {record.availableVariables.length} vars
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="text-xs font-medium text-[#0D0D0D]">
                                                    {isRtl
                                                        ? record.creatorNameAr
                                                        : record.creatorNameEn}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono text-[#6E6862]"
                                                    dir="ltr"
                                                >
                                                    {record.email}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono text-[#6E6862] tabular-nums"
                                                    dir="ltr"
                                                >
                                                    {record.createDate}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(record)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                                        isActive
                                                            ? 'bg-[#265938]/10 text-[#265938] border-[#265938]/25 hover:bg-[#265938]/18'
                                                            : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            isActive
                                                                ? 'bg-[#265938]'
                                                                : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {isActive
                                                            ? t(
                                                                  'workflow.emailTemplates.statuses.active'
                                                              )
                                                            : t(
                                                                  'workflow.emailTemplates.statuses.inactive'
                                                              )}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4 text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        title={t(
                                                            'workflow.emailTemplates.actions.view'
                                                        )}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(record)}
                                                        title={t('common.edit', 'Edit')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(record)}
                                                        title={
                                                            isActive
                                                                ? t(
                                                                      'workflow.emailTemplates.actions.deactivate'
                                                                  )
                                                                : t(
                                                                      'workflow.emailTemplates.actions.activate'
                                                                  )
                                                        }
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            isActive
                                                                ? 'text-[#265938] hover:bg-[#265938]/10'
                                                                : 'text-[#857E74] hover:bg-[#857E74]/15'
                                                        }`}
                                                    >
                                                        <Power size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingRecord(record)}
                                                        title={t('common.delete', 'Delete')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#A63A3A] hover:bg-[#A63A3A]/10 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={15} />
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

                {/* Pagination Bar */}
                <div className="px-5 py-3.5 bg-[#FAF8F5]/60 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-[#6E6862]">
                        <span>{t('workflow.workflows.pagination.rowsPerPage')}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.workflows.pagination.rowsPerPage')}
                            className="px-2.5 py-1 rounded-md border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            {WORKFLOW_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span>
                            {t('workflow.emailTemplates.pagination.showing', {
                                from:
                                    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1,
                                to: Math.min(safeCurrentPage * pageSize, totalRecords),
                                total: totalRecords,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            aria-label={t('common.previous', 'Previous')}
                        >
                            <ChevronLeft size={14} className="rtl:rotate-180" />
                        </button>

                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                                    pageNum === safeCurrentPage
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-white border border-[#E5E0D8] text-[#0D0D0D] hover:bg-[#FAF8F5]'
                                }`}
                                dir="ltr"
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#0D0D0D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            aria-label={t('common.next', 'Next')}
                        >
                            <ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Email Template Details Drawer */}
            {viewingRecord && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div
                        className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-[#BFAB93]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-mono font-bold text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                {viewingRecord.id}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                                    viewingRecord.status === 'Active'
                                                        ? 'bg-[#265938]/12 text-[#265938]'
                                                        : 'bg-[#857E74]/15 text-[#6E6862]'
                                                }`}
                                            >
                                                {viewingRecord.status === 'Active'
                                                    ? t('workflow.emailTemplates.statuses.active')
                                                    : t(
                                                          'workflow.emailTemplates.statuses.inactive'
                                                      )}
                                            </span>
                                        </div>
                                        <h2 className="text-base font-bold text-[#0D0D0D] truncate mt-0.5">
                                            {isRtl
                                                ? viewingRecord.templateNameAr
                                                : viewingRecord.templateNameEn}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 space-y-5">
                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <GitBranch size={13} />
                                            <span>
                                                {t(
                                                    'workflow.emailTemplates.drawer.communicationWorkflow'
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingRecord.communicationWorkflowNameAr
                                                : viewingRecord.communicationWorkflowNameEn}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Calendar size={13} />
                                            <span>
                                                {t('workflow.emailTemplates.table.createDate')}
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-1"
                                            dir="ltr"
                                        >
                                            {viewingRecord.createDate}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <User size={13} />
                                            <span>
                                                {t('workflow.emailTemplates.table.creator')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingRecord.creatorNameAr
                                                : viewingRecord.creatorNameEn}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <AtSign size={13} />
                                            <span>{t('workflow.emailTemplates.table.email')}</span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-1 truncate"
                                            dir="ltr"
                                        >
                                            {viewingRecord.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Email Subject */}
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                        {t('workflow.emailTemplates.drawer.emailSubject')}
                                    </span>
                                    <p className="text-xs font-semibold text-[#0D0D0D]">
                                        {isRtl ? viewingRecord.subjectAr : viewingRecord.subjectEn}
                                    </p>
                                </div>

                                {/* Available Variables */}
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                        <Braces size={13} />
                                        <span>
                                            {t('workflow.emailTemplates.drawer.availableVariables')}
                                        </span>
                                    </div>
                                    {viewingRecord.availableVariables.length === 0 ? (
                                        <p className="text-xs text-[#6E6862] italic">
                                            {t(
                                                'workflow.emailTemplates.drawer.noAvailableVariables'
                                            )}
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {viewingRecord.availableVariables.map((v) => (
                                                <span
                                                    key={v}
                                                    className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Email Content */}
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                        <FileText size={13} />
                                        <span>
                                            {t('workflow.emailTemplates.drawer.emailContent')}
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] whitespace-pre-wrap leading-relaxed font-sans">
                                        {isRtl ? viewingRecord.contentAr : viewingRecord.contentEn}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(viewingRecord)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <Power size={14} />
                                <span>
                                    {viewingRecord.status === 'Active'
                                        ? t('workflow.emailTemplates.actions.deactivate')
                                        : t('workflow.emailTemplates.actions.activate')}
                                </span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEditDrawer(viewingRecord)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    <span>{t('common.edit', 'Edit')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    {t('common.close', 'Close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Email Template Drawer */}
            {(isCreateOpen || editingRecord) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleFormSubmit}
                        noValidate
                        className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingRecord
                                            ? t('workflow.emailTemplates.drawer.editTitle')
                                            : t('workflow.emailTemplates.drawer.createTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {t('workflow.emailTemplates.drawer.formSubtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeFormDrawer}
                                    className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Template Name * */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.emailTemplates.drawer.templateName')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.templateNameEn}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormState((prev) => ({
                                                ...prev,
                                                templateNameEn: val,
                                            }));
                                            if (formErrors.templateName && val.trim()) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    templateName: undefined,
                                                }));
                                            }
                                        }}
                                        placeholder={t(
                                            'workflow.emailTemplates.drawer.templateNamePlaceholder'
                                        )}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors ${
                                            formErrors.templateName
                                                ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.templateName && (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                            <AlertCircle size={12} />
                                            <span>{formErrors.templateName}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Communication Workflow * (Searchable + Select Dropdown) */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-[#0D0D0D]">
                                        {t('workflow.emailTemplates.drawer.communicationWorkflow')}{' '}
                                        *
                                    </label>
                                    <div className="relative">
                                        <Search
                                            size={13}
                                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                                        />
                                        <input
                                            type="text"
                                            value={workflowSearchTerm}
                                            onChange={(e) => setWorkflowSearchTerm(e.target.value)}
                                            placeholder={t(
                                                'workflow.emailTemplates.drawer.searchWorkflowPlaceholder'
                                            )}
                                            className="w-full ps-8 pe-3 py-1.5 text-xs rounded-t-lg border border-b-0 border-[#E5E0D8] bg-[#FAF8F5]/70 text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-hidden focus:bg-white"
                                        />
                                    </div>
                                    <select
                                        value={formState.communicationWorkflowKey}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormState((prev) => ({
                                                ...prev,
                                                communicationWorkflowKey: val,
                                            }));
                                            if (formErrors.communicationWorkflow && val.trim()) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    communicationWorkflow: undefined,
                                                }));
                                            }
                                        }}
                                        aria-label={t(
                                            'workflow.emailTemplates.drawer.communicationWorkflow'
                                        )}
                                        className={`w-full px-3 py-2 text-xs rounded-b-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white cursor-pointer ${
                                            formErrors.communicationWorkflow
                                                ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    >
                                        <option value="">
                                            {t(
                                                'workflow.emailTemplates.drawer.selectWorkflowOption'
                                            )}
                                        </option>
                                        {searchableWorkflowOptions.map((wf) => (
                                            <option key={wf.key} value={wf.key}>
                                                {isRtl ? wf.nameAr : wf.nameEn} ({wf.source})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.communicationWorkflow && (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                            <AlertCircle size={12} />
                                            <span>{formErrors.communicationWorkflow}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Available Variables Box (Dynamic based on selected Communication Workflow) */}
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                            <Braces size={14} className="text-[#2D3F2C]" />
                                            <span>
                                                {t(
                                                    'workflow.emailTemplates.drawer.availableVariables'
                                                )}
                                            </span>
                                        </span>
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t('workflow.emailTemplates.drawer.clickToInsertHint')}
                                        </span>
                                    </div>

                                    {currentWorkflowVariables.length === 0 ? (
                                        <div className="py-2 px-3 rounded-lg bg-white border border-dashed border-[#E5E0D8] text-xs font-medium text-[#6E6862] text-center">
                                            {t(
                                                'workflow.emailTemplates.drawer.noAvailableVariables'
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {currentWorkflowVariables.map((variableToken) => (
                                                <button
                                                    key={variableToken}
                                                    type="button"
                                                    onClick={() =>
                                                        handleInsertVariable(variableToken)
                                                    }
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-[#2D3F2C] text-[#2D3F2C] hover:text-[#FAF8F5] border border-[#E5E0D8] hover:border-[#2D3F2C] text-[11px] font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
                                                    dir="ltr"
                                                >
                                                    <Plus size={11} />
                                                    <span>{variableToken}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Email Subject * */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.emailTemplates.drawer.emailSubject')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.subjectEn}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormState((prev) => ({
                                                ...prev,
                                                subjectEn: val,
                                            }));
                                            if (formErrors.subject && val.trim()) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    subject: undefined,
                                                }));
                                            }
                                        }}
                                        placeholder={t(
                                            'workflow.emailTemplates.drawer.emailSubjectPlaceholder'
                                        )}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors ${
                                            formErrors.subject
                                                ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.subject && (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                            <AlertCircle size={12} />
                                            <span>{formErrors.subject}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Email Template / Content * */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.emailTemplates.drawer.emailContent')} *
                                    </label>
                                    <textarea
                                        ref={contentTextareaRef}
                                        rows={6}
                                        value={formState.contentEn}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormState((prev) => ({
                                                ...prev,
                                                contentEn: val,
                                            }));
                                            if (formErrors.content && val.trim()) {
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    content: undefined,
                                                }));
                                            }
                                        }}
                                        placeholder={t(
                                            'workflow.emailTemplates.drawer.emailContentPlaceholder'
                                        )}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors leading-relaxed ${
                                            formErrors.content
                                                ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {formErrors.content && (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                            <AlertCircle size={12} />
                                            <span>{formErrors.content}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Creator, Email & Active Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.emailTemplates.table.creator')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.creatorNameEn}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    creatorNameEn: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.emailTemplates.table.email')}
                                        </label>
                                        <input
                                            type="email"
                                            dir="ltr"
                                            value={formState.email}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.emailTemplates.table.status')}
                                        </label>
                                        <select
                                            value={formState.status}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    status: e.target
                                                        .value as WorkflowEmailTemplateStatus,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
                                        >
                                            <option value="Active">
                                                {t('workflow.emailTemplates.statuses.active')}
                                            </option>
                                            <option value="Inactive">
                                                {t('workflow.emailTemplates.statuses.inactive')}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeFormDrawer}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                {editingRecord
                                    ? t('common.saveChanges', 'Save Changes')
                                    : t('common.create', 'Create')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
                    <div
                        className="w-full max-w-md bg-white rounded-xl border border-[#E5E0D8] shadow-xl p-6 space-y-4"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#A63A3A]/12 text-[#A63A3A] flex items-center justify-center shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('common.confirmDeleteTitle', 'Confirm Deletion')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                    {t(
                                        'common.confirmDeleteDesc',
                                        'Are you sure you want to delete this record?'
                                    )}{' '}
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {deletingRecord.id} —{' '}
                                        {isRtl
                                            ? deletingRecord.templateNameAr
                                            : deletingRecord.templateNameEn}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(null)}
                                className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-3.5 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8e3030] text-xs font-medium text-white transition-colors cursor-pointer"
                            >
                                {t('common.delete', 'Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
