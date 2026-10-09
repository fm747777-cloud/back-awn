import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    ListFilter,
    ShieldCheck,
    Mail,
    CheckCircle2,
    XCircle,
    Flag,
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
    Clock,
    UserCheck,
    Layers,
    Database,
    Calendar,
    MessageSquare,
} from 'lucide-react';
import {
    loadWorkflowStatusLevels,
    saveWorkflowStatusLevels,
    loadWorkflowRecords,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_SOURCES,
    WORKFLOW_PAGE_SIZE_OPTIONS,
    type WorkflowStatusLevelRecord,
    type WorkflowStageCategory,
    type WorkflowSource,
    type WorkflowStatus,
    type WorkflowType,
} from './workflowMockData';

const SOURCE_BADGE_STYLES: Record<WorkflowSource, string> = {
    CRM: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/25',
    ASSET: 'bg-[#265938]/10 text-[#265938] border-[#265938]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

const STAGE_CATEGORIES: WorkflowStageCategory[] = [
    'Initiation',
    'Verification',
    'Compliance',
    'Authorization',
    'Completion',
];

const COLOR_OPTIONS = [
    '#2D3F2C',
    '#265938',
    '#8C6046',
    '#6A7358',
    '#BFAB93',
    '#857E74',
    '#A63A3A',
];

interface StatusLevelFormState {
    code: string;
    levelNameEn: string;
    levelNameAr: string;
    workflowTitleEn: string;
    workflowTitleAr: string;
    workflowType: WorkflowType;
    source: WorkflowSource;
    levelOrder: number;
    stageCategory: WorkflowStageCategory;
    approverRoleEn: string;
    approverRoleAr: string;
    slaHours: number;
    color: string;
    isFinalLevel: boolean;
    requireComment: boolean;
    status: WorkflowStatus;
    descriptionEn: string;
    descriptionAr: string;
}

const DEFAULT_FORM_STATE: StatusLevelFormState = {
    code: 'STL-NEW-01',
    levelNameEn: '',
    levelNameAr: '',
    workflowTitleEn: 'Sector',
    workflowTitleAr: 'القطاع',
    workflowType: 'approval',
    source: 'CRM',
    levelOrder: 1,
    stageCategory: 'Verification',
    approverRoleEn: 'Governance Specialist',
    approverRoleAr: 'أخصائي الحوكمة',
    slaHours: 24,
    color: '#2D3F2C',
    isFinalLevel: false,
    requireComment: true,
    status: 'Enabled',
    descriptionEn: '',
    descriptionAr: '',
};

export const WorkflowStatusLevelsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    const [records, setRecords] = useState<WorkflowStatusLevelRecord[]>(() =>
        loadWorkflowStatusLevels()
    );
    const availableWorkflows = useMemo(() => loadWorkflowRecords(), []);

    const [typeTab, setTypeTab] = useState<'ALL' | WorkflowType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [stageFilter, setStageFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowStatusLevelRecord | null>(null);
    const [formState, setFormState] = useState<StatusLevelFormState>(DEFAULT_FORM_STATE);

    const persistRecords = (updated: WorkflowStatusLevelRecord[]) => {
        setRecords(updated);
        saveWorkflowStatusLevels(updated);
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
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

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
            ...DEFAULT_FORM_STATE,
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

    const handleWorkflowSelectChange = (titleEn: string) => {
        const matched = availableWorkflows.find((w) => w.titleEn === titleEn);
        if (matched) {
            setFormState((prev) => ({
                ...prev,
                workflowTitleEn: matched.titleEn,
                workflowTitleAr: matched.titleAr,
                workflowType: matched.workflowType,
                source: matched.source,
            }));
        } else {
            setFormState((prev) => ({
                ...prev,
                workflowTitleEn: titleEn,
                workflowTitleAr: titleEn,
            }));
        }
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
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `awn-workflow-status-levels-${formatWorkflowDateToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(
            t('workflow.statusLevels.feedback.exportSuccess', { count: filteredRecords.length })
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('workflow.statusLevels.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            WFL-STL
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('workflow.statusLevels.description')}
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
                        <span>{t('workflow.statusLevels.actions.addStatusLevel')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.statusLevels.kpis.totalLevels')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center">
                            <ListFilter className="w-4 h-4 text-[#BFAB93]" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpiStats.total}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.statusLevels.kpis.approvalLevels')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpiStats.approval}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.statusLevels.kpis.communicationLevels')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#6A7358]/15 text-[#2D3F2C] flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] tabular-nums"
                            dir="ltr"
                        >
                            {kpiStats.communication}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.statusLevels.kpis.finalStages')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <Flag className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#8C6046] tabular-nums"
                            dir="ltr"
                        >
                            {kpiStats.finalLevels}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.dashboard.kpis.enabledWorkflows')}
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
                            {kpiStats.enabled}
                        </span>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t('workflow.dashboard.kpis.disabledWorkflows')}
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
                            {kpiStats.disabled}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Levels Card: Tabs + Filters + Table + Pagination */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                {/* Top Tabs */}
                <div className="px-5 pt-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('ALL');
                                setCurrentPage(1);
                                setSelectedIds([]);
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                typeTab === 'ALL'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <ListFilter className="w-4 h-4" />
                            <span>{t('workflow.statusLevels.tabs.all')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    typeTab === 'ALL'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {kpiStats.total}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('approval');
                                setCurrentPage(1);
                                setSelectedIds([]);
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                typeTab === 'approval'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{t('workflow.workflows.tabs.approval')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    typeTab === 'approval'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {kpiStats.approval}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setTypeTab('communication');
                                setCurrentPage(1);
                                setSelectedIds([]);
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                                typeTab === 'communication'
                                    ? 'border-[#2D3F2C] text-[#2D3F2C] bg-white rounded-t-lg'
                                    : 'border-transparent text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Mail className="w-4 h-4" />
                            <span>{t('workflow.workflows.tabs.communication')}</span>
                            <span
                                className={`px-2 py-0.5 text-[11px] font-mono rounded-md ${
                                    typeTab === 'communication'
                                        ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                        : 'bg-[#E5E0D8]/70 text-[#0D0D0D]'
                                }`}
                                dir="ltr"
                            >
                                {kpiStats.communication}
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
                            placeholder={t('workflow.statusLevels.filters.searchPlaceholder')}
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
                        {/* Source Filter */}
                        <select
                            value={sourceFilter}
                            onChange={(e) => {
                                setSourceFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.workflows.filters.sourceLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">{t('workflow.workflows.filters.allSources')}</option>
                            {WORKFLOW_SOURCES.map((src) => (
                                <option key={src} value={src}>
                                    {src}
                                </option>
                            ))}
                        </select>

                        {/* Stage Category Filter */}
                        <select
                            value={stageFilter}
                            onChange={(e) => {
                                setStageFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('workflow.statusLevels.filters.stageLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('workflow.statusLevels.filters.allStages')}
                            </option>
                            {STAGE_CATEGORIES.map((stg) => (
                                <option key={stg} value={stg}>
                                    {t(`workflow.statusLevels.stages.${stg}`)}
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
                            <span>{t('workflow.statusLevels.selection.selectedCount')}</span>
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
                                    {t('workflow.statusLevels.table.id')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.levelName')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.levelOrder')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.workflowAndSource')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.approverAndSla')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.status')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-start">
                                    {t('workflow.statusLevels.table.createDate')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] text-end">
                                    {t('workflow.statusLevels.table.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E5E0D8]">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#857E74]">
                                                <ListFilter size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {t('workflow.statusLevels.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862]">
                                                {t('workflow.statusLevels.empty.description')}
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
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: record.color }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingRecord(record)}
                                                            className="text-xs font-semibold text-[#0D0D0D] hover:text-[#2D3F2C] transition-colors text-start cursor-pointer"
                                                        >
                                                            {isRtl
                                                                ? record.levelNameAr
                                                                : record.levelNameEn}
                                                        </button>
                                                        <span
                                                            className="px-1.5 py-0.5 text-[10px] font-mono rounded-sm bg-[#FAF8F5] text-[#6E6862] border border-[#E5E0D8]"
                                                            dir="ltr"
                                                        >
                                                            {record.code}
                                                        </span>
                                                        {record.isFinalLevel && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm bg-[#265938]/12 text-[#265938]">
                                                                {t(
                                                                    'workflow.statusLevels.labels.finalStage'
                                                                )}
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
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] text-[11px] font-mono font-semibold"
                                                        dir="ltr"
                                                    >
                                                        L{record.levelOrder}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862]">
                                                        {t(
                                                            `workflow.statusLevels.stages.${record.stageCategory}`
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="text-xs font-semibold text-[#0D0D0D]">
                                                        {isRtl
                                                            ? record.workflowTitleAr
                                                            : record.workflowTitleEn}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                                                            SOURCE_BADGE_STYLES[record.source] ||
                                                            'bg-[#FAF8F5] text-[#0D0D0D] border-[#E5E0D8]'
                                                        }`}
                                                        dir="ltr"
                                                    >
                                                        {record.source}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="text-xs font-medium text-[#0D0D0D]">
                                                        {isRtl
                                                            ? record.approverRoleAr
                                                            : record.approverRoleEn}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6E6862]"
                                                            dir="ltr"
                                                        >
                                                            <Clock size={11} />
                                                            {record.slaHours}h SLA
                                                        </span>
                                                        {record.requireComment && (
                                                            <span
                                                                title={t(
                                                                    'workflow.statusLevels.labels.commentRequired'
                                                                )}
                                                                className="inline-flex items-center gap-1 text-[10px] text-[#8C6046]"
                                                            >
                                                                <MessageSquare size={11} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                            {t('workflow.statusLevels.pagination.showing', {
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

            {/* View Status Level Drawer */}
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
                                        className="w-10 h-10 rounded-xl text-[#FAF8F5] flex items-center justify-center shrink-0 font-mono text-xs font-bold"
                                        style={{ backgroundColor: viewingRecord.color }}
                                        dir="ltr"
                                    >
                                        L{viewingRecord.levelOrder}
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
                                            {isRtl
                                                ? viewingRecord.levelNameAr
                                                : viewingRecord.levelNameEn}
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
                                            <Database size={13} />
                                            <span>
                                                {t('workflow.statusLevels.table.workflowAndSource')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingRecord.workflowTitleAr
                                                : viewingRecord.workflowTitleEn}{' '}
                                            <span className="font-mono text-[#6E6862]" dir="ltr">
                                                ({viewingRecord.source})
                                            </span>
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Layers size={13} />
                                            <span>
                                                {t('workflow.statusLevels.drawer.stageCategory')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {t(
                                                `workflow.statusLevels.stages.${viewingRecord.stageCategory}`
                                            )}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <UserCheck size={13} />
                                            <span>
                                                {t('workflow.statusLevels.drawer.approverRole')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                            {isRtl
                                                ? viewingRecord.approverRoleAr
                                                : viewingRecord.approverRoleEn}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862]">
                                            <Clock size={13} />
                                            <span>
                                                {t('workflow.statusLevels.drawer.slaHours')}
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] mt-1"
                                            dir="ltr"
                                        >
                                            {viewingRecord.slaHours}h
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs text-[#0D0D0D]">
                                        <Calendar size={14} className="text-[#857E74]" />
                                        <span className="text-[#6E6862]">
                                            {t('workflow.statusLevels.table.createDate')}:
                                        </span>
                                        <span className="font-mono font-semibold" dir="ltr">
                                            {viewingRecord.createDate}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {viewingRecord.isFinalLevel && (
                                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[#265938]/12 text-[#265938]">
                                                {t('workflow.statusLevels.labels.finalStage')}
                                            </span>
                                        )}
                                        {viewingRecord.requireComment && (
                                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[#8C6046]/12 text-[#8C6046]">
                                                {t('workflow.statusLevels.labels.commentRequired')}
                                            </span>
                                        )}
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

            {/* Create / Edit Status Level Drawer */}
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
                                            ? t('workflow.statusLevels.drawer.editTitle')
                                            : t('workflow.statusLevels.drawer.createTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {t('workflow.statusLevels.drawer.formSubtitle')}
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
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.table.levelOrder')}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={15}
                                            value={formState.levelOrder}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    levelOrder: Number(e.target.value) || 1,
                                                }))
                                            }
                                            dir="ltr"
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.statusLevels.drawer.levelNameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.levelNameEn}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                levelNameEn: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g., Compliance Review"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('workflow.statusLevels.drawer.levelNameAr')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.levelNameAr}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                levelNameAr: e.target.value,
                                            }))
                                        }
                                        placeholder="مثال: مراجعة الامتثال"
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.workflows.table.workflowTitle')}
                                        </label>
                                        <select
                                            value={formState.workflowTitleEn}
                                            onChange={(e) =>
                                                handleWorkflowSelectChange(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        >
                                            {availableWorkflows.map((wf) => (
                                                <option key={wf.id} value={wf.titleEn}>
                                                    {isRtl ? wf.titleAr : wf.titleEn} ({wf.source})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.drawer.stageCategory')}
                                        </label>
                                        <select
                                            value={formState.stageCategory}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    stageCategory: e.target
                                                        .value as WorkflowStageCategory,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        >
                                            {STAGE_CATEGORIES.map((stg) => (
                                                <option key={stg} value={stg}>
                                                    {t(`workflow.statusLevels.stages.${stg}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.drawer.approverRole')} (EN)
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.approverRoleEn}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    approverRoleEn: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.drawer.approverRole')} (AR)
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.approverRoleAr}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    approverRoleAr: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.drawer.slaHours')}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={720}
                                            value={formState.slaHours}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    slaHours: Number(e.target.value) || 12,
                                                }))
                                            }
                                            dir="ltr"
                                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('workflow.statusLevels.table.status')}
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
                                        {COLOR_OPTIONS.map((hex) => (
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

                                <div className="flex flex-wrap items-center gap-5 pt-1">
                                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0D0D0D] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formState.isFinalLevel}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    isFinalLevel: e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                        />
                                        <span>{t('workflow.statusLevels.labels.finalStage')}</span>
                                    </label>

                                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0D0D0D] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formState.requireComment}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    requireComment: e.target.checked,
                                                }))
                                            }
                                            className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                        />
                                        <span>
                                            {t('workflow.statusLevels.labels.commentRequired')}
                                        </span>
                                    </label>
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
                                        {isRtl
                                            ? deletingRecord.levelNameAr
                                            : deletingRecord.levelNameEn}
                                        )
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
