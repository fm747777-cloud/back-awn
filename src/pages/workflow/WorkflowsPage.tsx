import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    GitBranch,
    ShieldCheck,
    Mail,
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
    CheckCircle2,
    PauseCircle,
    Layers,
    Calendar,
} from 'lucide-react';
import {
    loadWorkflowRecords,
    saveWorkflowRecords,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_PAGE_SIZE_OPTIONS,
    WORKFLOW_SOURCES,
    type WorkflowRecord,
    type WorkflowType,
    type WorkflowStatus,
    type WorkflowSource,
} from './workflowMockData';

interface WorkflowFormState {
    workflowType: WorkflowType;
    titleEn: string;
    titleAr: string;
    source: WorkflowSource;
    status: WorkflowStatus;
    createDate: string;
    descriptionEn: string;
    descriptionAr: string;
    triggerEventEn: string;
    triggerEventAr: string;
    stagesCount: number;
}

export const WorkflowsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');
    const [searchParams, setSearchParams] = useSearchParams();

    const [records, setRecords] = useState<WorkflowRecord[]>(() => loadWorkflowRecords());
    const [isLoading] = useState<boolean>(false);

    // Support deep link from Audit Trail (?workflowId= or ?highlightId=)
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

    // Pagination (5, 10, 20, 30, 40, 50, 100)
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

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
        setCurrentPage(1);
        setSelectedIds([]);
        setSearchParams({ tab: nextTab }, { replace: true });
    };

    const persistRecords = (next: WorkflowRecord[]) => {
        setRecords(next);
        saveWorkflowRecords(next);
    };

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
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim() !== '' || sourceFilter !== 'ALL' || statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setSourceFilter('ALL');
        setStatusFilter('ALL');
        setCurrentPage(1);
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
        persistRecords(updated);

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
    };

    // Row actions
    const handleToggleRecordStatus = (record: WorkflowRecord) => {
        const nextStatus: WorkflowStatus =
            record.status === 'Enabled' ? 'Disabled' : 'Enabled';
        const updated = records.map((r) =>
            r.id === record.id ? { ...r, status: nextStatus } : r
        );
        persistRecords(updated);

        recordWorkflowAuditEvent({
            action: nextStatus === 'Enabled' ? 'ENABLED' : 'DISABLED',
            resource: 'Workflow',
            recordId: String(record.id),
            resourceData: `${record.titleEn} (#${record.id})`,
            resourceDataAr: `${record.titleAr} (#${record.id})`,
            performedBy: 'Khalifah Alsharabi',
            performedByAr: 'خليفة الشرعبي',
            actorEmail: 'k.alsharabi@awn.sa',
            remarks: `${nextStatus === 'Enabled' ? 'Enabled' : 'Disabled'} ${record.workflowType} workflow "${record.titleEn}" (#${record.id}) for source ${record.source}.`,
            remarksAr: `تم ${nextStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} سير العمل "${record.titleAr}" (#${record.id}) للمصدر ${record.source}.`,
            previousStatus: record.status,
            newStatus: nextStatus,
        });

        toast.success(
            t('workflow.workflows.feedback.statusUpdated', {
                title: isAr ? record.titleAr : record.titleEn,
                status:
                    nextStatus === 'Enabled'
                        ? t('workflow.workflows.statuses.enabled')
                        : t('workflow.workflows.statuses.disabled'),
            })
        );
    };

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
            triggerEventEn: '',
            triggerEventAr: '',
            stagesCount: 2,
        });
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: WorkflowRecord) => {
        setEditingRecord(record);
        setFormState({
            workflowType: record.workflowType,
            titleEn: record.titleEn,
            titleAr: record.titleAr,
            source: record.source,
            status: record.status,
            createDate: record.createDate,
            descriptionEn: record.descriptionEn,
            descriptionAr: record.descriptionAr,
            triggerEventEn: record.triggerEventEn,
            triggerEventAr: record.triggerEventAr,
            stagesCount: record.stagesCount || 2,
        });
        setIsCreateOpen(true);
    };

    const handleSaveWorkflow = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEn = formState.titleEn.trim();
        const trimmedAr = formState.titleAr.trim() || trimmedEn;
        if (!trimmedEn) {
            toast.error(t('workflow.workflows.feedback.titleRequired'));
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
                          createDate: formState.createDate.trim() || r.createDate,
                          descriptionEn:
                              formState.descriptionEn.trim() || r.descriptionEn,
                          descriptionAr:
                              formState.descriptionAr.trim() || r.descriptionAr,
                          triggerEventEn:
                              formState.triggerEventEn.trim() || r.triggerEventEn,
                          triggerEventAr:
                              formState.triggerEventAr.trim() || r.triggerEventAr,
                          stagesCount: Number(formState.stagesCount) || 2,
                      }
                    : r
            );
            persistRecords(updated);

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
                t('workflow.workflows.feedback.workflowUpdated', {
                    title: isAr ? trimmedAr : trimmedEn,
                })
            );
        } else {
            const maxId = records.reduce((max, r) => Math.max(max, r.id), 33);
            const newRecord: WorkflowRecord = {
                id: maxId + 1,
                workflowType: formState.workflowType,
                titleEn: trimmedEn,
                titleAr: trimmedAr,
                source: formState.source,
                status: formState.status,
                createDate: formState.createDate.trim() || formatWorkflowDateToday(),
                descriptionEn:
                    formState.descriptionEn.trim() ||
                    `Enterprise ${formState.workflowType} workflow for ${trimmedEn}.`,
                descriptionAr:
                    formState.descriptionAr.trim() ||
                    `سير عمل مؤسسي خاص بـ ${trimmedAr}.`,
                triggerEventEn:
                    formState.triggerEventEn.trim() || `On ${trimmedEn} Event`,
                triggerEventAr:
                    formState.triggerEventAr.trim() || `عند حدث ${trimmedAr}`,
                stagesCount: Number(formState.stagesCount) || 2,
            };
            persistRecords([newRecord, ...records]);

            recordWorkflowAuditEvent({
                action: 'CREATED',
                resource: 'Workflow',
                recordId: String(newRecord.id),
                resourceData: `${newRecord.titleEn} (#${newRecord.id})`,
                resourceDataAr: `${newRecord.titleAr} (#${newRecord.id})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Created ${newRecord.workflowType} workflow "${newRecord.titleEn}" (#${newRecord.id}) for source ${newRecord.source} with status ${newRecord.status}.`,
                remarksAr: `تم إنشاء سير العمل "${newRecord.titleAr}" (#${newRecord.id}) للمصدر ${newRecord.source} بالحالة ${newRecord.status === 'Enabled' ? 'مفعل' : 'معطل'}.`,
                newStatus: newRecord.status,
            });

            if (formState.workflowType !== activeTab) {
                handleTabChange(formState.workflowType);
            }
            toast.success(
                t('workflow.workflows.feedback.workflowCreated', {
                    title: isAr ? trimmedAr : trimmedEn,
                })
            );
        }

        setIsCreateOpen(false);
        setEditingRecord(null);
    };

    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        const target = deletingRecord;
        const next = records.filter((r) => r.id !== target.id);
        persistRecords(next);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        setDeletingRecord(null);

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
            remarksAr: `تم حذف سير العمل "${target.titleAr}" (#${target.id}) من المصدر ${target.source}.`,
            previousStatus: target.status,
        });

        toast.success(
            t('workflow.workflows.feedback.workflowDeleted', {
                title: isAr ? target.titleAr : target.titleEn,
            })
        );
    };

    const handleExportCsv = () => {
        const headers = ['ID', 'Workflow Type', 'Workflow Title', 'Source', 'Status', 'Create Date'];
        const rows = filteredRecords.map((r) => [
            String(r.id),
            r.workflowType === 'approval' ? 'Approval Workflow' : 'Communication Workflow',
            `"${(isAr ? r.titleAr : r.titleEn).replace(/"/g, '""')}"`,
            r.source,
            r.status,
            r.createDate,
        ]);
        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-${activeTab}-workflows.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(
            t('workflow.workflows.feedback.exportSuccess', {
                count: filteredRecords.length,
            })
        );
    };

    const startEntry = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const endEntry = Math.min(safeCurrentPage * pageSize, totalItems);

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('workflow.workflows.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('workflow.workflows.description')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus size={15} />
                        <span>{t('workflow.workflows.actions.addWorkflow')}</span>
                    </button>
                </div>
            </div>

            {/* Workflow Type Tabs: Approval Workflow | Communication Workflow */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-1.5 shadow-2xs inline-flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'approval'}
                    onClick={() => handleTabChange('approval')}
                    className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'approval'
                            ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-xs'
                            : 'text-[#595550] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]'
                    }`}
                >
                    <ShieldCheck
                        size={15}
                        className={activeTab === 'approval' ? 'text-[#BFAB93]' : 'text-[#857E74]'}
                    />
                    <span>{t('workflow.workflows.tabs.approval')}</span>
                    <span
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md ${
                            activeTab === 'approval'
                                ? 'bg-white/15 text-[#FAF8F5]'
                                : 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]'
                        }`}
                        dir="ltr"
                    >
                        {approvalCount}
                    </span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'communication'}
                    onClick={() => handleTabChange('communication')}
                    className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeTab === 'communication'
                            ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-xs'
                            : 'text-[#595550] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]'
                    }`}
                >
                    <Mail
                        size={15}
                        className={
                            activeTab === 'communication' ? 'text-[#BFAB93]' : 'text-[#857E74]'
                        }
                    />
                    <span>{t('workflow.workflows.tabs.communication')}</span>
                    <span
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md ${
                            activeTab === 'communication'
                                ? 'bg-white/15 text-[#FAF8F5]'
                                : 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]'
                        }`}
                        dir="ltr"
                    >
                        {communicationCount}
                    </span>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search Input */}
                    <div className="md:col-span-6 relative">
                        <Search
                            size={15}
                            className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t('workflow.workflows.filters.searchPlaceholder')}
                            className="w-full ps-9 pe-8 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] focus:bg-white focus:border-[#2D3F2C] focus:outline-none text-xs text-[#0D0D0D] placeholder:text-[#857E74] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                aria-label={t('common.clearAll')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Source Filter */}
                    <div className="md:col-span-3">
                        <select
                            value={sourceFilter}
                            onChange={(e) => {
                                setSourceFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.workflows.filters.sourceLabel')}
                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] focus:bg-white focus:border-[#2D3F2C] focus:outline-none text-xs text-[#0D0D0D] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('workflow.workflows.filters.allSources')}
                            </option>
                            {WORKFLOW_SOURCES.map((src) => (
                                <option key={src} value={src}>
                                    {src}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="md:col-span-3 flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.workflows.filters.statusLabel')}
                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] focus:bg-white focus:border-[#2D3F2C] focus:outline-none text-xs text-[#0D0D0D] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('workflow.workflows.filters.allStatuses')}
                            </option>
                            <option value="Enabled">
                                {t('workflow.workflows.statuses.enabled')}
                            </option>
                            <option value="Disabled">
                                {t('workflow.workflows.statuses.disabled')}
                            </option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                title={t('common.resetFilters')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#595550] hover:text-[#0D0D0D] transition-colors cursor-pointer shrink-0"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden xl:inline">{t('common.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="pt-3 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-[#0D0D0D] font-medium">
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] font-mono font-bold text-[11px]"
                                dir="ltr"
                            >
                                {selectedIds.length}
                            </span>
                            <span>{t('workflow.workflows.selection.selectedCount')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Enabled')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#265938]/10 hover:bg-[#265938]/20 text-xs font-semibold text-[#265938] transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('workflow.workflows.selection.enableSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Disabled')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8C6046]/10 hover:bg-[#8C6046]/20 text-xs font-semibold text-[#8C6046] transition-colors cursor-pointer"
                            >
                                <PauseCircle size={13} />
                                <span>{t('workflow.workflows.selection.disableSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={13} />
                                <span>{t('workflow.workflows.selection.clearSelection')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Enterprise Workflows Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[11px] font-semibold text-[#6E6862] uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={allCurrentPageSelected}
                                        onChange={handleToggleSelectAllPage}
                                        aria-label={t('workflow.workflows.table.selectAll')}
                                        className="w-4 h-4 rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer accent-[#2D3F2C]"
                                    />
                                </th>
                                <th className="py-3.5 px-4 text-start w-24">
                                    {t('workflow.workflows.table.id')}
                                </th>
                                <th className="py-3.5 px-4 text-start">
                                    {t('workflow.workflows.table.workflowTitle')}
                                </th>
                                <th className="py-3.5 px-4 text-start w-36">
                                    {t('workflow.workflows.table.source')}
                                </th>
                                <th className="py-3.5 px-4 text-start w-36">
                                    {t('workflow.workflows.table.status')}
                                </th>
                                <th className="py-3.5 px-4 text-start w-40">
                                    {t('workflow.workflows.table.createDate')}
                                </th>
                                <th className="py-3.5 px-4 text-end w-36">
                                    {t('workflow.workflows.table.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#F0ECE4] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-[#6E6862]">
                                        {t('common.loadingData')}
                                    </td>
                                </tr>
                            ) : paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <GitBranch size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('workflow.workflows.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('workflow.workflows.empty.description')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#2D3F2C] cursor-pointer"
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>{t('common.resetFilters')}</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((record) => {
                                    const isSelected = selectedIds.includes(record.id);
                                    const localizedTitle = isAr ? record.titleAr : record.titleEn;
                                    const isEnabled = record.status === 'Enabled';

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#2D3F2C]/[0.04]'
                                                    : 'hover:bg-[#FAF8F5]/80'
                                            }`}
                                        >
                                            {/* Selection */}
                                            <td className="py-3.5 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectRow(record.id)}
                                                    aria-label={`${t('workflow.workflows.table.selectRow')} ${record.id}`}
                                                    className="w-4 h-4 rounded border-[#D6CFC4] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer accent-[#2D3F2C]"
                                                />
                                            </td>

                                            {/* ID */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                                {record.id}
                                            </td>

                                            {/* Workflow Title */}
                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRecord(record)}
                                                    className="text-start group cursor-pointer"
                                                >
                                                    <span className="font-semibold text-[#0D0D0D] group-hover:text-[#2D3F2C] transition-colors block">
                                                        {localizedTitle}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862] line-clamp-1 mt-0.5">
                                                        {isAr ? record.triggerEventAr : record.triggerEventEn}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Source */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-xs text-[#2D3F2C]"
                                                    dir="ltr"
                                                >
                                                    <Layers size={13} className="text-[#857E74]" />
                                                    <span>{record.source}</span>
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                                                        isEnabled
                                                            ? 'text-[#265938]'
                                                            : 'text-[#8C6046]'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${
                                                            isEnabled
                                                                ? 'bg-[#265938]'
                                                                : 'bg-[#8C6046]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {isEnabled
                                                            ? t('workflow.workflows.statuses.enabled')
                                                            : t('workflow.workflows.statuses.disabled')}
                                                    </span>
                                                </span>
                                            </td>

                                            {/* Create Date */}
                                            <td
                                                className="py-3.5 px-4 font-mono text-[#595550]"
                                                dir="ltr"
                                            >
                                                {record.createDate}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        title={t('workflow.workflows.actions.view')}
                                                        aria-label={t('workflow.workflows.actions.view')}
                                                        className="p-1.5 rounded-lg text-[#595550] hover:bg-[#FAF8F5] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(record)}
                                                        title={t('common.edit')}
                                                        aria-label={t('common.edit')}
                                                        className="p-1.5 rounded-lg text-[#595550] hover:bg-[#FAF8F5] hover:text-[#2D3F2C] transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRecordStatus(record)}
                                                        title={
                                                            isEnabled
                                                                ? t('workflow.workflows.actions.disable')
                                                                : t('workflow.workflows.actions.enable')
                                                        }
                                                        aria-label={
                                                            isEnabled
                                                                ? t('workflow.workflows.actions.disable')
                                                                : t('workflow.workflows.actions.enable')
                                                        }
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            isEnabled
                                                                ? 'text-[#265938] hover:bg-[#265938]/10'
                                                                : 'text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#265938]'
                                                        }`}
                                                    >
                                                        <Power size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingRecord(record)}
                                                        title={t('common.delete')}
                                                        aria-label={t('common.delete')}
                                                        className="p-1.5 rounded-lg text-[#595550] hover:bg-[#8C6046]/10 hover:text-[#8C6046] transition-colors cursor-pointer"
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

                {/* Pagination Footer (5, 10, 20, 30, 40, 50, 100) */}
                <div className="bg-[#FAF8F5] border-t border-[#E5E0D8] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6E6862]">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span>{t('workflow.workflows.pagination.rowsPerPage')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                aria-label={t('workflow.workflows.pagination.rowsPerPage')}
                                className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {WORKFLOW_PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span className="text-[#857E74]">·</span>

                        <span>
                            {t('workflow.workflows.pagination.showing', {
                                from: startEntry,
                                to: endEntry,
                                total: totalItems,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                            type="button"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <ChevronLeft size={14} className="rtl:rotate-180" />
                            <span>{t('common.previous')}</span>
                        </button>

                        <span
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-mono font-semibold text-[#0D0D0D]"
                            dir="ltr"
                        >
                            {safeCurrentPage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <span>{t('common.next')}</span>
                            <ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Workflow Details Drawer */}
            {viewingRecord && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div>
                            {/* Drawer Header */}
                            <div className="px-6 py-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                                        {viewingRecord.workflowType === 'approval' ? (
                                            <ShieldCheck size={18} className="text-[#BFAB93]" />
                                        ) : (
                                            <Mail size={18} className="text-[#BFAB93]" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                                {isAr ? viewingRecord.titleAr : viewingRecord.titleEn}
                                            </h2>
                                            <span
                                                className="text-xs font-mono font-bold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                #{viewingRecord.id}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#6E6862]">
                                            {viewingRecord.workflowType === 'approval'
                                                ? t('workflow.workflows.tabs.approval')
                                                : t('workflow.workflows.tabs.communication')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4">
                                    <div>
                                        <span className="text-[11px] text-[#6E6862] block">
                                            {t('workflow.workflows.table.source')}
                                        </span>
                                        <span
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-0.5 block"
                                            dir="ltr"
                                        >
                                            {viewingRecord.source}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-[#6E6862] block">
                                            {t('workflow.workflows.table.status')}
                                        </span>
                                        <span
                                            className={`text-xs font-semibold mt-0.5 block ${
                                                viewingRecord.status === 'Enabled'
                                                    ? 'text-[#265938]'
                                                    : 'text-[#8C6046]'
                                            }`}
                                        >
                                            {viewingRecord.status === 'Enabled'
                                                ? t('workflow.workflows.statuses.enabled')
                                                : t('workflow.workflows.statuses.disabled')}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-[#6E6862] block">
                                            {t('workflow.workflows.table.createDate')}
                                        </span>
                                        <span
                                            className="text-xs font-mono text-[#0D0D0D] mt-0.5 inline-flex items-center gap-1"
                                            dir="ltr"
                                        >
                                            <Calendar size={12} className="text-[#857E74]" />
                                            {viewingRecord.createDate}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-[#6E6862] block">
                                            {t('workflow.workflows.drawer.stagesCount')}
                                        </span>
                                        <span
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-0.5 block"
                                            dir="ltr"
                                        >
                                            {viewingRecord.stagesCount}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                                        {t('workflow.workflows.drawer.triggerEvent')}
                                    </h3>
                                    <p className="text-xs text-[#595550] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3.5 py-2.5">
                                        {isAr
                                            ? viewingRecord.triggerEventAr
                                            : viewingRecord.triggerEventEn}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-1.5">
                                        {t('workflow.workflows.drawer.description')}
                                    </h3>
                                    <p className="text-xs text-[#595550] leading-relaxed bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-3.5 py-3">
                                        {isAr
                                            ? viewingRecord.descriptionAr
                                            : viewingRecord.descriptionEn}
                                    </p>
                                </div>

                                {viewingRecord.stages && viewingRecord.stages.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-[#0D0D0D] uppercase tracking-wider mb-2">
                                            {t('workflow.workflows.drawer.configuredStages')}
                                        </h3>
                                        <div className="space-y-2">
                                            {viewingRecord.stages.map((st) => (
                                                <div
                                                    key={st.levelOrder}
                                                    className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-[#0D0D0D] block">
                                                            {st.levelOrder}.{' '}
                                                            {isAr
                                                                ? st.statusLevelNameAr
                                                                : st.statusLevelNameEn}
                                                        </span>
                                                        <span className="text-[11px] text-[#6E6862]">
                                                            {isAr
                                                                ? st.approverRoleAr
                                                                : st.approverRoleEn}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className="font-mono text-[11px] text-[#2D3F2C] font-semibold"
                                                        dir="ltr"
                                                    >
                                                        SLA: {st.slaHours}h
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const rec = viewingRecord;
                                    setViewingRecord(null);
                                    openEditDrawer(rec);
                                }}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                            >
                                {t('common.edit')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewingRecord(null)}
                                className="px-4 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Workflow Drawer */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
                    <form
                        onSubmit={handleSaveWorkflow}
                        className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                    >
                        <div>
                            <div className="px-6 py-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between sticky top-0 z-10">
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingRecord
                                            ? t('workflow.workflows.drawer.editTitle')
                                            : t('workflow.workflows.drawer.createTitle')}
                                    </h2>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('workflow.workflows.drawer.formSubtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingRecord(null);
                                    }}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.workflowType')}
                                    </label>
                                    <select
                                        value={formState.workflowType}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                workflowType: e.target.value as WorkflowType,
                                            }))
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                    >
                                        <option value="approval">
                                            {t('workflow.workflows.tabs.approval')}
                                        </option>
                                        <option value="communication">
                                            {t('workflow.workflows.tabs.communication')}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.titleEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.titleEn}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                titleEn: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g., Sector"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.titleAr')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.titleAr}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                titleAr: e.target.value,
                                            }))
                                        }
                                        placeholder="مثال: القطاع"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.workflows.table.source')}
                                        </label>
                                        <select
                                            value={formState.source}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    source: e.target.value as WorkflowSource,
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                        >
                                            {WORKFLOW_SOURCES.map((src) => (
                                                <option key={src} value={src}>
                                                    {src}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.workflows.table.status')}
                                        </label>
                                        <select
                                            value={formState.status}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    status: e.target.value as WorkflowStatus,
                                                }))
                                            }
                                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                        >
                                            <option value="Enabled">
                                                {t('workflow.workflows.statuses.enabled')}
                                            </option>
                                            <option value="Disabled">
                                                {t('workflow.workflows.statuses.disabled')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.workflows.table.createDate')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.createDate}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    createDate: e.target.value,
                                                }))
                                            }
                                            dir="ltr"
                                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.workflows.drawer.stagesCount')}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={formState.stagesCount}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    stagesCount: Number(e.target.value) || 1,
                                                }))
                                            }
                                            dir="ltr"
                                            className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.description')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formState.descriptionEn}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                descriptionEn: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#2D3F2C] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingRecord(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                            >
                                {editingRecord ? t('common.saveChanges') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('common.confirmDeleteTitle', {
                                        name: isAr ? deletingRecord.titleAr : deletingRecord.titleEn,
                                    })}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-1">
                                    {t('common.confirmDeleteMessage')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(null)}
                                className="p-1 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-[#8C6046] hover:bg-[#734E38] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
