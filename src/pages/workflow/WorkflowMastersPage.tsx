import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    FolderKanban,
    Database,
    GitBranch,
    CheckCircle2,
    XCircle,
    Zap,
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
    Calendar,
    Layers,
    Hash,
    ShieldCheck,
    ExternalLink,
} from 'lucide-react';
import {
    loadWorkflowMasters,
    saveWorkflowMasters,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_SOURCES,
    WORKFLOW_PAGE_SIZE_OPTIONS,
    type WorkflowMasterCategory,
    type WorkflowMasterRecord,
    type WorkflowSource,
    type WorkflowStatus,
} from './workflowMockData';

const SOURCE_BADGE_STYLES: Record<WorkflowSource | 'GLOBAL', string> = {
    GLOBAL: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/25',
    CRM: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/25',
    ASSET: 'bg-[#265938]/10 text-[#265938] border-[#265938]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

const MASTER_COLOR_OPTIONS = [
    '#2D3F2C',
    '#265938',
    '#8C6046',
    '#6A7358',
    '#BFAB93',
    '#857E74',
    '#A63A3A',
];

const VALID_CATEGORIES: WorkflowMasterCategory[] = ['sources', 'types', 'statuses', 'actions'];

interface MasterFormState {
    category: WorkflowMasterCategory;
    code: string;
    nameEn: string;
    nameAr: string;
    moduleScope: WorkflowSource | 'GLOBAL';
    linkedWorkflowsCount: number;
    color: string;
    status: WorkflowStatus;
    descriptionEn: string;
    descriptionAr: string;
}

const DEFAULT_FORM_STATE: MasterFormState = {
    category: 'sources',
    code: 'SRC-NEW',
    nameEn: '',
    nameAr: '',
    moduleScope: 'CRM',
    linkedWorkflowsCount: 0,
    color: '#2D3F2C',
    status: 'Enabled',
    descriptionEn: '',
    descriptionAr: '',
};

export const WorkflowMastersPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    const rawUrlTab = searchParams.get('tab') as WorkflowMasterCategory | null;
    const initialTab: WorkflowMasterCategory =
        rawUrlTab && VALID_CATEGORIES.includes(rawUrlTab) ? rawUrlTab : 'sources';

    const [manualTab, setManualTab] = useState<WorkflowMasterCategory>(initialTab);
    const activeTab: WorkflowMasterCategory =
        rawUrlTab && VALID_CATEGORIES.includes(rawUrlTab) ? rawUrlTab : manualTab;

    const [records, setRecords] = useState<WorkflowMasterRecord[]>(() => loadWorkflowMasters());
    const [searchQuery, setSearchQuery] = useState('');
    const [scopeFilter, setScopeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [formState, setFormState] = useState<MasterFormState>(DEFAULT_FORM_STATE);

    const handleTabChange = (tab: WorkflowMasterCategory) => {
        setManualTab(tab);
        setSearchParams({ tab }, { replace: true });
        setCurrentPage(1);
        setSelectedIds([]);
    };

    const persistRecords = (updated: WorkflowMasterRecord[]) => {
        setRecords(updated);
        saveWorkflowMasters(updated);
    };

    // Category counts
    const counts = useMemo(() => {
        const sources = records.filter((r) => r.category === 'sources').length;
        const types = records.filter((r) => r.category === 'types').length;
        const statuses = records.filter((r) => r.category === 'statuses').length;
        const actions = records.filter((r) => r.category === 'actions').length;
        const enabled = records.filter((r) => r.status === 'Enabled').length;
        return {
            total: records.length,
            sources,
            types,
            statuses,
            actions,
            enabled,
        };
    }, [records]);

    // Filtered records for active tab
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records
            .filter((item) => item.category === activeTab)
            .filter((item) => {
                if (scopeFilter !== 'ALL' && item.moduleScope !== scopeFilter) {
                    return false;
                }
                if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                    return false;
                }
                if (!q) return true;
                return (
                    String(item.id).includes(q) ||
                    item.code.toLowerCase().includes(q) ||
                    item.nameEn.toLowerCase().includes(q) ||
                    item.nameAr.toLowerCase().includes(q) ||
                    item.moduleScope.toLowerCase().includes(q) ||
                    item.status.toLowerCase().includes(q) ||
                    item.createDate.toLowerCase().includes(q) ||
                    item.descriptionEn.toLowerCase().includes(q) ||
                    item.descriptionAr.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => a.id - b.id);
    }, [records, activeTab, scopeFilter, statusFilter, searchQuery]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || scopeFilter !== 'ALL' || statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setScopeFilter('ALL');
        setStatusFilter('ALL');
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

    const handleToggleSelectOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Toggle status
    const handleToggleStatus = (record: WorkflowMasterRecord) => {
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
            resource: 'Workflow Master',
            recordId: record.code,
            resourceData: `${record.nameEn} (${record.code})`,
            resourceDataAr: `${record.nameAr} (${record.code})`,
            performedBy: 'Khalifah Alsharabi',
            performedByAr: 'خليفة الشرعبي',
            actorEmail: 'k.alsharabi@awn.sa',
            remarks: `${nextStatus === 'Enabled' ? 'Enabled' : 'Disabled'} workflow master "${record.nameEn}" (${record.code}) in category ${record.category}.`,
            remarksAr: `تم ${nextStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} السجل الأساسي "${record.nameAr}" (${record.code}) ضمن فئة ${record.category}.`,
            previousStatus: record.status,
            newStatus: nextStatus,
        });

        toast.success(
            t('workflow.masters.feedback.statusUpdated', {
                title: isRtl ? record.nameAr : record.nameEn,
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
                resource: 'Workflow Master',
                recordId: rec.code,
                resourceData: `${rec.nameEn} (${rec.code})`,
                resourceDataAr: `${rec.nameAr} (${rec.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Bulk ${targetStatus === 'Enabled' ? 'enabled' : 'disabled'} workflow master "${rec.nameEn}" (${rec.code}) in category ${rec.category}.`,
                remarksAr: `تم ${targetStatus === 'Enabled' ? 'تفعيل' : 'تعطيل'} السجل الأساسي "${rec.nameAr}" (${rec.code}) ضمن إجراء جماعي.`,
                previousStatus: rec.status,
                newStatus: targetStatus,
            });
        }

        toast.success(
            t('workflow.masters.feedback.bulkStatusUpdated', {
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
    const defaultPrefixForCategory = (cat: WorkflowMasterCategory): string => {
        if (cat === 'sources') return 'SRC-';
        if (cat === 'types') return 'TYP-';
        if (cat === 'statuses') return 'STS-';
        return 'ACT-';
    };

    const openCreateDrawer = () => {
        setEditingRecord(null);
        setFormState({
            ...DEFAULT_FORM_STATE,
            category: activeTab,
            code: `${defaultPrefixForCategory(activeTab)}${Math.floor(10 + Math.random() * 89)}`,
            moduleScope: activeTab === 'sources' ? 'CRM' : 'GLOBAL',
        });
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: WorkflowMasterRecord) => {
        setViewingRecord(null);
        setIsCreateOpen(false);
        setEditingRecord(record);
        setFormState({
            category: record.category,
            code: record.code,
            nameEn: record.nameEn,
            nameAr: record.nameAr,
            moduleScope: record.moduleScope,
            linkedWorkflowsCount: record.linkedWorkflowsCount,
            color: record.color,
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
        const trimmedEn = formState.nameEn.trim();
        const trimmedAr = formState.nameAr.trim();
        const trimmedCode = formState.code.trim().toUpperCase();

        if (!trimmedEn && !trimmedAr) {
            toast.error(t('workflow.masters.feedback.nameRequired'));
            return;
        }

        const finalNameEn = trimmedEn || trimmedAr;
        const finalNameAr = trimmedAr || trimmedEn;
        const finalCode =
            trimmedCode || `${defaultPrefixForCategory(formState.category)}${Date.now() % 1000}`;

        if (editingRecord) {
            const updatedRecord: WorkflowMasterRecord = {
                ...editingRecord,
                category: formState.category,
                code: finalCode,
                nameEn: finalNameEn,
                nameAr: finalNameAr,
                moduleScope: formState.moduleScope,
                linkedWorkflowsCount: Math.max(0, Number(formState.linkedWorkflowsCount) || 0),
                color: formState.color,
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
                resource: 'Workflow Master',
                recordId: updatedRecord.code,
                resourceData: `${updatedRecord.nameEn} (${updatedRecord.code})`,
                resourceDataAr: `${updatedRecord.nameAr} (${updatedRecord.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Updated workflow master "${updatedRecord.nameEn}" (${updatedRecord.code}) in category ${updatedRecord.category} (Scope: ${updatedRecord.moduleScope}, Status: ${updatedRecord.status}).`,
                remarksAr: `تم تحديث السجل الأساسي "${updatedRecord.nameAr}" (${updatedRecord.code}) في فئة ${updatedRecord.category} (النطاق: ${updatedRecord.moduleScope}، الحالة: ${updatedRecord.status === 'Enabled' ? 'مفعل' : 'معطل'}).`,
                previousStatus: editingRecord.status,
                newStatus: updatedRecord.status,
            });

            toast.success(
                t('workflow.masters.feedback.masterUpdated', {
                    title: isRtl ? finalNameAr : finalNameEn,
                })
            );
            closeFormDrawer();
        } else {
            const nextId =
                records.reduce((maxId, item) => Math.max(maxId, item.id), 400) + 1;
            const newRecord: WorkflowMasterRecord = {
                id: nextId,
                category: formState.category,
                code: finalCode,
                nameEn: finalNameEn,
                nameAr: finalNameAr,
                moduleScope: formState.moduleScope,
                linkedWorkflowsCount: Math.max(0, Number(formState.linkedWorkflowsCount) || 0),
                color: formState.color,
                isSystemDefault: false,
                status: formState.status,
                createDate: formatWorkflowDateToday(),
                descriptionEn:
                    formState.descriptionEn.trim() ||
                    `Configured ${finalNameEn} master definition for ${formState.moduleScope}.`,
                descriptionAr:
                    formState.descriptionAr.trim() ||
                    `تعريف أساسي لـ ${finalNameAr} ضمن نطاق ${formState.moduleScope}.`,
            };
            persistRecords([newRecord, ...records]);

            recordWorkflowAuditEvent({
                action: 'CREATED',
                resource: 'Workflow Master',
                recordId: newRecord.code,
                resourceData: `${newRecord.nameEn} (${newRecord.code})`,
                resourceDataAr: `${newRecord.nameAr} (${newRecord.code})`,
                performedBy: 'Khalifah Alsharabi',
                performedByAr: 'خليفة الشرعبي',
                actorEmail: 'k.alsharabi@awn.sa',
                remarks: `Created workflow master "${newRecord.nameEn}" (${newRecord.code}) in category ${newRecord.category} for scope ${newRecord.moduleScope}.`,
                remarksAr: `تم إنشاء السجل الأساسي "${newRecord.nameAr}" (${newRecord.code}) ضمن فئة ${newRecord.category} للنطاق ${newRecord.moduleScope}.`,
                newStatus: newRecord.status,
            });

            if (formState.category !== activeTab) {
                handleTabChange(formState.category);
            }
            toast.success(
                t('workflow.masters.feedback.masterCreated', {
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
            resource: 'Workflow Master',
            recordId: target.code,
            resourceData: `${target.nameEn} (${target.code})`,
            resourceDataAr: `${target.nameAr} (${target.code})`,
            performedBy: 'Khalifah Alsharabi',
            performedByAr: 'خليفة الشرعبي',
            actorEmail: 'k.alsharabi@awn.sa',
            remarks: `Deleted workflow master "${target.nameEn}" (${target.code}) from category ${target.category}.`,
            remarksAr: `تم حذف السجل الأساسي "${target.nameAr}" (${target.code}) من فئة ${target.category}.`,
            previousStatus: target.status,
        });

        toast.success(
            t('workflow.masters.feedback.masterDeleted', {
                title: isRtl ? target.nameAr : target.nameEn,
            })
        );
    };

    // Export CSV
    const handleExportCsv = () => {
        const headers = [
            'ID',
            'Category',
            'Code',
            'Name (EN)',
            'Name (AR)',
            'Scope',
            'Linked Workflows',
            'Status',
            'Create Date',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            r.category,
            `"${r.code.replace(/"/g, '""')}"`,
            `"${r.nameEn.replace(/"/g, '""')}"`,
            `"${r.nameAr.replace(/"/g, '""')}"`,
            r.moduleScope,
            r.linkedWorkflowsCount,
            r.status,
            r.createDate,
        ]);
        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awn-workflow-masters-${activeTab}-${formatWorkflowDateToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(
            t('workflow.masters.feedback.exportSuccess', { count: filteredRecords.length })
        );
    };

    const getCategoryLabel = (cat: WorkflowMasterCategory): string => {
        return t(`workflow.masters.tabs.${cat}`);
    };

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('workflow.masters.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            WFL-MST
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('workflow.masters.description')}
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
                        <span>{t('workflow.masters.actions.addMaster')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.kpis.totalMasters')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                            <FolderKanban className="w-4 h-4 text-[#BFAB93]" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {counts.total}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleTabChange('sources')}
                    className={`text-start bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${
                        activeTab === 'sources'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/20'
                            : 'border-[#E5E0D8] hover:border-[#857E74]'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.tabs.sources')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                            <Database className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {counts.sources}
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('types')}
                    className={`text-start bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${
                        activeTab === 'types'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/20'
                            : 'border-[#E5E0D8] hover:border-[#857E74]'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.tabs.types')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#265938]/10 text-[#265938] flex items-center justify-center">
                            <GitBranch className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {counts.types}
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('statuses')}
                    className={`text-start bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${
                        activeTab === 'statuses'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/20'
                            : 'border-[#E5E0D8] hover:border-[#857E74]'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.tabs.statuses')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {counts.statuses}
                        </span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('actions')}
                    className={`text-start bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between transition-all cursor-pointer ${
                        activeTab === 'actions'
                            ? 'border-[#2D3F2C] ring-1 ring-[#2D3F2C]/20'
                            : 'border-[#E5E0D8] hover:border-[#857E74]'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.tabs.actions')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#6A7358]/15 text-[#6A7358] flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {counts.actions}
                        </span>
                    </div>
                </button>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.masters.kpis.activeMasters')}
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
                            {counts.enabled}
                        </span>
                    </div>
                </div>
            </div>

            {/* Masters Card: Section Tabs + Filters + Table + Pagination */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Master Category Tabs */}
                <div className="px-5 pt-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleTabChange('sources')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'sources'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Database className="w-4 h-4" />
                            <span>{t('workflow.masters.tabs.sources')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    activeTab === 'sources'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {counts.sources}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('types')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'types'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <GitBranch className="w-4 h-4" />
                            <span>{t('workflow.masters.tabs.types')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    activeTab === 'types'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {counts.types}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('statuses')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'statuses'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>{t('workflow.masters.tabs.statuses')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    activeTab === 'statuses'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {counts.statuses}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleTabChange('actions')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'actions'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Zap className="w-4 h-4" />
                            <span>{t('workflow.masters.tabs.actions')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    activeTab === 'actions'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {counts.actions}
                            </span>
                        </button>
                    </div>
                </div>

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
                            placeholder={t('workflow.masters.filters.searchPlaceholder')}
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
                        {/* Scope Filter */}
                        <select
                            value={scopeFilter}
                            onChange={(e) => {
                                setScopeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.masters.filters.scopeLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">{t('workflow.masters.filters.allScopes')}</option>
                            <option value="GLOBAL">GLOBAL</option>
                            {WORKFLOW_SOURCES.map((src) => (
                                <option key={src} value={src}>
                                    {src}
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
                            aria-label={t('workflow.workflows.filters.statusLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
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
                            <span>{t('workflow.masters.selection.selectedCount')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Enabled')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#265938] hover:bg-[#1f492e] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('workflow.workflows.selection.enableSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Disabled')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#857E74] hover:bg-[#6E6862] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>{t('workflow.workflows.selection.disableSelected')}</span>
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
                                    {t('workflow.masters.table.id')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.code')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.masterName')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.scope')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.linkedWorkflows')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.status')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.masters.table.createDate')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-end">
                                    {t('workflow.masters.table.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E5E0D8]">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <FolderKanban size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('workflow.masters.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('workflow.masters.empty.description')}
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
                                    const isEnabled = record.status === 'Enabled';

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
                                                    onChange={() => handleToggleSelectOne(record.id)}
                                                    aria-label={`${t('workflow.workflows.table.selectRow')} ${record.id}`}
                                                    className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono font-bold text-[#0D0D0D] tabular-nums"
                                                    dir="ltr"
                                                >
                                                    #{record.id}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]"
                                                    dir="ltr"
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: record.color }}
                                                    />
                                                    {record.code}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingRecord(record)}
                                                            className="text-xs font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] transition-colors text-start cursor-pointer"
                                                        >
                                                            {isRtl ? record.nameAr : record.nameEn}
                                                        </button>
                                                        {record.isSystemDefault && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm bg-[#2D3F2C]/10 text-[#2D3F2C]">
                                                                {t('workflow.masters.labels.systemCore')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-[#6E6862] truncate max-w-md mt-0.5">
                                                        {isRtl
                                                            ? record.descriptionAr
                                                            : record.descriptionEn}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${
                                                        SOURCE_BADGE_STYLES[record.moduleScope] ||
                                                        'bg-[#FAF8F5] text-[#0D0D0D] border-[#E5E0D8]'
                                                    }`}
                                                    dir="ltr"
                                                >
                                                    {record.moduleScope}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/workflow/workflows')}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] hover:bg-[#E5E0D8]/50 border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                                                >
                                                    <span dir="ltr">{record.linkedWorkflowsCount}</span>
                                                    <span className="font-sans font-normal text-[#6E6862]">
                                                        {t('workflow.dashboard.labels.workflows')}
                                                    </span>
                                                    <ExternalLink size={11} className="text-[#857E74]" />
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(record)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                                                        isEnabled
                                                            ? 'bg-[#265938]/10 text-[#265938] border-[#265938]/25 hover:bg-[#265938]/18'
                                                            : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30 hover:bg-[#857E74]/20'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            isEnabled
                                                                ? 'bg-[#265938]'
                                                                : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {isEnabled
                                                            ? t('workflow.workflows.statuses.enabled')
                                                            : t('workflow.workflows.statuses.disabled')}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono text-[#6E6862] tabular-nums"
                                                    dir="ltr"
                                                >
                                                    {record.createDate}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        title={t('workflow.workflows.actions.view')}
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
                                                            isEnabled
                                                                ? t('workflow.workflows.actions.disable')
                                                                : t('workflow.workflows.actions.enable')
                                                        }
                                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                            isEnabled
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
                            {t('workflow.masters.pagination.showing', {
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

            {/* View Master Drawer */}
            {viewingRecord && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div
                        className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            {/* Drawer Header */}
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-10 h-10 rounded-xl text-[#FAF8F5] flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: viewingRecord.color }}
                                    >
                                        <FolderKanban className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-mono font-bold text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                #{viewingRecord.id} · {viewingRecord.code}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                                    viewingRecord.status === 'Enabled'
                                                        ? 'bg-[#265938]/12 text-[#265938]'
                                                        : 'bg-[#857E74]/15 text-[#6E6862]'
                                                }`}
                                            >
                                                {viewingRecord.status === 'Enabled'
                                                    ? t('workflow.workflows.statuses.enabled')
                                                    : t('workflow.workflows.statuses.disabled')}
                                            </span>
                                        </div>
                                        <h2 className="text-base font-bold text-[#0D0D0D] truncate mt-0.5">
                                            {isRtl ? viewingRecord.nameAr : viewingRecord.nameEn}
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

                            {/* Drawer Content */}
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Layers size={13} />
                                            <span>{t('workflow.masters.drawer.category')}</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {getCategoryLabel(viewingRecord.category)}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Database size={13} />
                                            <span>{t('workflow.masters.table.scope')}</span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-1"
                                            dir="ltr"
                                        >
                                            {viewingRecord.moduleScope}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Calendar size={13} />
                                            <span>{t('workflow.masters.table.createDate')}</span>
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
                                            <Hash size={13} />
                                            <span>{t('workflow.masters.table.linkedWorkflows')}</span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-1"
                                            dir="ltr"
                                        >
                                            {viewingRecord.linkedWorkflowsCount}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                            {t('workflow.masters.drawer.bilingualNames')}
                                        </span>
                                        {viewingRecord.isSystemDefault && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#265938]">
                                                <ShieldCheck size={13} />
                                                {t('workflow.masters.labels.systemCore')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <span className="text-[11px] text-[#6E6862]">English</span>
                                            <p className="text-xs font-semibold text-[#0D0D0D] mt-0.5">
                                                {viewingRecord.nameEn}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-[#6E6862]">العربية</span>
                                            <p className="text-xs font-semibold text-[#0D0D0D] mt-0.5">
                                                {viewingRecord.nameAr}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862]">
                                        {t('workflow.workflows.drawer.description')}
                                    </span>
                                    <p className="text-xs text-[#0D0D0D] leading-relaxed">
                                        {isRtl
                                            ? viewingRecord.descriptionAr
                                            : viewingRecord.descriptionEn}
                                    </p>
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
                                    {viewingRecord.status === 'Enabled'
                                        ? t('workflow.workflows.actions.disable')
                                        : t('workflow.workflows.actions.enable')}
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

            {/* Create / Edit Master Drawer */}
            {(isCreateOpen || editingRecord) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleFormSubmit}
                        className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingRecord
                                            ? t('workflow.masters.drawer.editTitle')
                                            : t('workflow.masters.drawer.createTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {t('workflow.masters.drawer.formSubtitle')}
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
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.masters.drawer.category')}
                                        </label>
                                        <select
                                            value={formState.category}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    category: e.target.value as WorkflowMasterCategory,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        >
                                            <option value="sources">
                                                {t('workflow.masters.tabs.sources')}
                                            </option>
                                            <option value="types">
                                                {t('workflow.masters.tabs.types')}
                                            </option>
                                            <option value="statuses">
                                                {t('workflow.masters.tabs.statuses')}
                                            </option>
                                            <option value="actions">
                                                {t('workflow.masters.tabs.actions')}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.masters.table.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.code}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    code: e.target.value,
                                                }))
                                            }
                                            dir="ltr"
                                            placeholder="SRC-CRM"
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.masters.drawer.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.nameEn}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                nameEn: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g., Approval Workflow"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.masters.drawer.nameAr')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.nameAr}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                nameAr: e.target.value,
                                            }))
                                        }
                                        placeholder="مثال: سير عمل الاعتمادات"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.masters.table.scope')}
                                        </label>
                                        <select
                                            value={formState.moduleScope}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    moduleScope: e.target.value as
                                                        | WorkflowSource
                                                        | 'GLOBAL',
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        >
                                            <option value="GLOBAL">GLOBAL</option>
                                            {WORKFLOW_SOURCES.map((src) => (
                                                <option key={src} value={src}>
                                                    {src}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.masters.table.status')}
                                        </label>
                                        <select
                                            value={formState.status}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    status: e.target.value as WorkflowStatus,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
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

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.masters.drawer.badgeColor')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {MASTER_COLOR_OPTIONS.map((hex) => (
                                            <button
                                                key={hex}
                                                type="button"
                                                onClick={() =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        color: hex,
                                                    }))
                                                }
                                                className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer ${
                                                    formState.color === hex
                                                        ? 'border-[#0D0D0D] scale-110'
                                                        : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: hex }}
                                                aria-label={hex}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.description')} (EN)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formState.descriptionEn}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                descriptionEn: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.workflows.drawer.description')} (AR)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formState.descriptionAr}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                descriptionAr: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
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
                                        #{deletingRecord.id} (
                                        {isRtl ? deletingRecord.nameAr : deletingRecord.nameEn})
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
