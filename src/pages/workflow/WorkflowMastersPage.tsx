import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import {
    FolderKanban,
    Database,
    GitBranch,
    CheckCircle2,
    XCircle,
    Zap,
    Eye,
    Pencil,
    Trash2,
    Power,
    ShieldCheck,
} from 'lucide-react';
import {
    loadWorkflowMasters,
    saveWorkflowMasters,
    recordWorkflowAuditEvent,
    formatWorkflowDateToday,
    WORKFLOW_SOURCES,
    type WorkflowMasterCategory,
    type WorkflowMasterRecord,
    type WorkflowSource,
    type WorkflowStatus,
} from './workflowMockData';
import { DataTable } from '../../components/DataTable';
import {
    WorkflowMasterFormDrawer,
    type MasterFormState,
    DEFAULT_MASTER_FORM_STATE,
} from '../../components/workflow/WorkflowMasterFormDrawer';
import { WorkflowMasterViewDrawer } from '../../components/workflow/WorkflowMasterViewDrawer';
import { WorkflowMasterDeleteModal } from '../../components/workflow/WorkflowMasterDeleteModal';

const SOURCE_BADGE_STYLES: Record<WorkflowSource | 'GLOBAL', string> = {
    GLOBAL: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    CRM: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    ASSET: 'bg-[#037F8C]/10 text-[#037F8C] border-[#037F8C]/25',
    REQUEST: 'bg-[#8C6046]/12 text-[#8C6046] border-[#8C6046]/25',
    SERVICE: 'bg-[#6A7358]/12 text-[#6A7358] border-[#6A7358]/25',
    TICKETING: 'bg-[#BFAB93]/25 text-[#5C4938] border-[#BFAB93]/50',
    EDMS: 'bg-[#857E74]/15 text-[#524D46] border-[#857E74]/30',
};

const VALID_CATEGORIES: WorkflowMasterCategory[] = ['sources', 'types', 'statuses', 'actions'];

export const WorkflowMastersPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const isRtl = i18n.language?.startsWith('ar') ?? false;
    const queryClient = useQueryClient();

    const rawUrlTab = searchParams.get('tab') as WorkflowMasterCategory | null;
    const initialTab: WorkflowMasterCategory =
        rawUrlTab && VALID_CATEGORIES.includes(rawUrlTab) ? rawUrlTab : 'sources';

    const [activeTab, setActiveTab] = useState<WorkflowMasterCategory>(initialTab);

    // TanStack Query for server state
    const { data: records = [], isLoading } = useQuery<WorkflowMasterRecord[]>({
        queryKey: ['workflow-masters'],
        queryFn: async () => loadWorkflowMasters(),
    });

    // TanStack Mutation for persisting updates
    const saveMutation = useMutation({
        mutationFn: async (updated: WorkflowMasterRecord[]) => {
            saveWorkflowMasters(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['workflow-masters'], updated);
        },
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [scopeFilter, setScopeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

    // Drawers & Modals
    const [viewingRecord, setViewingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
    const [deletingRecord, setDeletingRecord] = useState<WorkflowMasterRecord | null>(null);
    const [formState, setFormState] = useState<MasterFormState>(DEFAULT_MASTER_FORM_STATE);

    const persistRecords = (updated: WorkflowMasterRecord[]) => {
        saveMutation.mutate(updated);
    };

    const handleTabChange = (newTab: WorkflowMasterCategory) => {
        setActiveTab(newTab);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', newTab);
            return next;
        });
        setPageIndex(0);
        setSelectedIds([]);
    };

    // Category KPI counts
    const categoryCounts = useMemo(() => {
        const counts: Record<WorkflowMasterCategory, number> = {
            sources: 0,
            types: 0,
            statuses: 0,
            actions: 0,
        };
        for (const r of records) {
            if (counts[r.category] !== undefined) {
                counts[r.category]++;
            }
        }
        return counts;
    }, [records]);

    // Filtered records by active tab, search, scope, and status
    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records
            .filter((item) => {
                if (item.category !== activeTab) return false;
                if (scopeFilter !== 'ALL' && item.moduleScope !== scopeFilter) return false;
                if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
                if (!q) return true;
                return (
                    String(item.id).includes(q) ||
                    item.code.toLowerCase().includes(q) ||
                    item.nameEn.toLowerCase().includes(q) ||
                    item.nameAr.toLowerCase().includes(q) ||
                    item.moduleScope.toLowerCase().includes(q) ||
                    item.descriptionEn.toLowerCase().includes(q) ||
                    item.descriptionAr.toLowerCase().includes(q) ||
                    item.createDate.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => b.id - a.id);
    }, [records, activeTab, scopeFilter, statusFilter, searchQuery]);

    const totalRecords = filteredRecords.length;

    const paginatedRecords = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, pageIndex, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 || scopeFilter !== 'ALL' || statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setScopeFilter('ALL');
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
            ...DEFAULT_MASTER_FORM_STATE,
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
            'Module Scope',
            'Linked Workflows',
            'System Default',
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
            r.isSystemDefault ? 'Yes' : 'No',
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
            `awn_workflow_masters_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workflow.masters.feedback.exportedSuccess'));
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
                id: 'colorDot',
                header: () => '',
                cell: ({ row }) => {
                    const record = row.original as WorkflowMasterRecord;
                    return (
                        <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: record.color }}
                            title={record.color}
                        />
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
                id: 'name',
                header: () => <span>{t('workflow.masters.table.name')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowMasterRecord;
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {isRtl ? record.nameAr : record.nameEn}
                            </span>
                            {record.isSystemDefault && (
                                <span
                                    title={t('workflow.masters.labels.systemCore')}
                                    className="inline-flex items-center text-[#037F8C]"
                                >
                                    <ShieldCheck size={12} />
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'scope',
                header: () => <span>{t('workflow.masters.table.scope')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowMasterRecord;
                    return (
                        <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                                SOURCE_BADGE_STYLES[record.moduleScope]
                            }`}
                        >
                            {record.moduleScope}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'linkedWorkflowsCount',
                header: () => <span>{t('workflow.masters.drawer.linkedWorkflows')}</span>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#6E6862]">
                        {row.original.linkedWorkflowsCount}
                    </span>
                ),
            },
            {
                id: 'status',
                header: () => <span>{t('workflow.masters.table.status')}</span>,
                cell: ({ row }) => {
                    const record = row.original as WorkflowMasterRecord;
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
                    const record = row.original as WorkflowMasterRecord;
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
                            {!record.isSystemDefault && (
                                <button
                                    type="button"
                                    onClick={() => setDeletingRecord(record)}
                                    title={t('common.delete', 'Delete')}
                                    className="p-1 rounded-md text-[#857E74] hover:text-[#A63A3A] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
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
                                {t('workflow.masters.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                MST-004
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('workflow.masters.subtitle')}
                        </p>
                    </div>

                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl self-start sm:self-auto flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleTabChange('sources')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'sources'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <FolderKanban size={13} />
                            <span>{t('workflow.masters.tabs.sources')}</span>
                            <span className="font-mono text-[10px]">
                                ({categoryCounts.sources})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('types')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'types'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <GitBranch size={13} />
                            <span>{t('workflow.masters.tabs.types')}</span>
                            <span className="font-mono text-[10px]">
                                ({categoryCounts.types})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('statuses')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'statuses'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Database size={13} />
                            <span>{t('workflow.masters.tabs.statuses')}</span>
                            <span className="font-mono text-[10px]">
                                ({categoryCounts.statuses})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('actions')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'actions'
                                    ? 'bg-[#037F8C] text-[#FAF8F5] shadow-xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <Zap size={13} />
                            <span>{t('workflow.masters.tabs.actions')}</span>
                            <span className="font-mono text-[10px]">
                                ({categoryCounts.actions})
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
                            {t('workflow.masters.table.scope')}
                        </label>
                        <select
                            value={scopeFilter}
                            onChange={(e) => {
                                setScopeFilter(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-hidden focus:border-[#037F8C]"
                        >
                            <option value="ALL">{t('common.all')}</option>
                            <option value="GLOBAL">GLOBAL</option>
                            {WORKFLOW_SOURCES.map((src) => (
                                <option key={src} value={src}>
                                    {src}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('workflow.masters.table.status')}
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
                searchPlaceholder={t('workflow.masters.searchPlaceholder')}
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
                title={t(`workflow.masters.tabs.${activeTab}`)}
                description={t('workflow.masters.subtitle')}
                addNewLabel={t('workflow.masters.actions.newMaster')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
            />

            {/* View Drawer */}
            <WorkflowMasterViewDrawer
                record={viewingRecord}
                onClose={() => setViewingRecord(null)}
                onEdit={openEditDrawer}
                onToggleStatus={handleToggleStatus}
            />

            {/* Create / Edit Form Drawer */}
            <WorkflowMasterFormDrawer
                isOpen={isCreateOpen || editingRecord !== null}
                onClose={closeFormDrawer}
                onSubmit={handleFormSubmit}
                formState={formState}
                setFormState={setFormState}
                editingRecord={editingRecord}
            />

            {/* Delete Confirmation Modal */}
            <WorkflowMasterDeleteModal
                record={deletingRecord}
                onClose={() => setDeletingRecord(null)}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};
