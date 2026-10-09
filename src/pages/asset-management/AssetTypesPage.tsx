import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Layers,
    CheckCircle2,
    Grid,
    FileText,
    Search,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Power,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    AlertTriangle,
    XCircle,
    Check,
    Box,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadAssetTypes,
    saveAssetTypes,
    loadAssetCategories,
    generateNextAssetTypeId,
    formatAssetDateToday,
    recordAssetAuditEvent,
    getAvailableAssetTemplateOptions,
    getAllKnownAssetTemplates,
    ASSET_PAGE_SIZE_OPTIONS,
    ASSET_SUBTYPE_OPTIONS,
    type AssetTypeRecord,
    type AssetCategoryRecord,
    type AssetTemplateOption,
    type AssetRecordLifecycleStatus,
} from './assetManagementMockData';

interface TypeFormState {
    nameEn: string;
    nameAr: string;
    categoryId: string;
    subTypeEn: string;
    subTypeAr: string;
    templatesEn: string[];
    descriptionEn: string;
    descriptionAr: string;
    status: 'Active' | 'Inactive';
}

export const AssetTypesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [records, setRecords] = useState<AssetTypeRecord[]>(() => loadAssetTypes());
    const [categories, setCategories] = useState<AssetCategoryRecord[]>(() =>
        loadAssetCategories()
    );
    const availableTemplates = useMemo(() => getAvailableAssetTemplateOptions(), []);
    const allKnownTemplates = useMemo(() => getAllKnownAssetTemplates(), []);

    // Search, Filters & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [subTypeFilter, setSubTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Drawers & Modals State
    const [viewingRecord, setViewingRecord] = useState<AssetTypeRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AssetTypeRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<AssetTypeRecord | null>(null);

    const defaultCategoryId =
        categories.find((c) => c.status === 'Active')?.id ||
        categories[0]?.id ||
        'ASTCAT001';

    const [formState, setFormState] = useState<TypeFormState>({
        nameEn: '',
        nameAr: '',
        categoryId: defaultCategoryId,
        subTypeEn: 'General Asset',
        subTypeAr: 'أصل عام',
        templatesEn: [],
        descriptionEn: '',
        descriptionAr: '',
        status: 'Active',
    });
    const [customTemplateInput, setCustomTemplateInput] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const persistRecords = (next: AssetTypeRecord[]) => {
        setRecords(next);
        saveAssetTypes(next);
    };

    const filterCategories = useMemo(() => {
        const map = new Map<
            string,
            { id: string; nameEn: string; nameAr: string; status: AssetRecordLifecycleStatus }
        >();
        for (const cat of categories) {
            map.set(cat.id, {
                id: cat.id,
                nameEn: cat.nameEn,
                nameAr: cat.nameAr,
                status: cat.status,
            });
        }
        for (const rec of records) {
            if (rec.categoryId && !map.has(rec.categoryId)) {
                map.set(rec.categoryId, {
                    id: rec.categoryId,
                    nameEn: rec.categoryNameEn || 'Category Asset',
                    nameAr: rec.categoryNameAr || 'تصنيف الأصل',
                    status: 'Inactive',
                });
            }
        }
        return Array.from(map.values());
    }, [categories, records]);

    const drawerCategories = useMemo(() => {
        const list = [...filterCategories];
        if (list.length === 0) {
            list.push({
                id: 'ASTCAT001',
                nameEn: 'Category Asset',
                nameAr: 'تصنيف الأصل',
                status: 'Active',
            });
        }
        if (formState.categoryId && !list.some((c) => c.id === formState.categoryId)) {
            list.push({
                id: formState.categoryId,
                nameEn: editingRecord?.categoryNameEn || 'Category Asset',
                nameAr: editingRecord?.categoryNameAr || 'تصنيف الأصل',
                status: 'Inactive',
            });
        }
        return list;
    }, [filterCategories, formState.categoryId, editingRecord]);

    const drawerTemplates = useMemo<AssetTemplateOption[]>(() => {
        const map = new Map<string, AssetTemplateOption>();
        for (const tpl of availableTemplates) {
            map.set(tpl.nameEn.toLowerCase(), tpl);
        }
        formState.templatesEn.forEach((tplName, idx) => {
            const key = tplName.trim().toLowerCase();
            if (key && !map.has(key)) {
                const known = allKnownTemplates.find(
                    (k) => k.nameEn.toLowerCase() === key
                );
                const fallbackAr =
                    known?.nameAr ||
                    (editingRecord &&
                    editingRecord.templatesEn[idx]?.toLowerCase() === key
                        ? editingRecord.templatesAr[idx]
                        : undefined) ||
                    tplName;
                map.set(key, {
                    nameEn: tplName.trim(),
                    nameAr: fallbackAr,
                    code: known?.code,
                    status: known?.status || 'Inactive',
                });
            }
        });
        return Array.from(map.values());
    }, [availableTemplates, allKnownTemplates, formState.templatesEn, editingRecord]);

    const kpis = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'Active').length;
        const uniqueCategories = new Set(records.map((r) => r.categoryId)).size;
        const totalLinkedTemplates = new Set(records.flatMap((r) => r.templatesEn)).size;
        return {
            total,
            active,
            uniqueCategories,
            totalLinkedTemplates,
        };
    }, [records]);

    const subTypeFilterOptions = useMemo(() => {
        const map = new Map<string, { valueEn: string; valueAr: string }>();
        for (const opt of ASSET_SUBTYPE_OPTIONS) {
            map.set(opt.valueEn.toLowerCase(), opt);
        }
        for (const rec of records) {
            const key = rec.subTypeEn.toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    valueEn: rec.subTypeEn,
                    valueAr: rec.subTypeAr || rec.subTypeEn,
                });
            }
        }
        return Array.from(map.values());
    }, [records]);

    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter((item) => {
            if (categoryFilter !== 'ALL' && item.categoryId !== categoryFilter) {
                return false;
            }
            if (
                subTypeFilter !== 'ALL' &&
                item.subTypeEn.toLowerCase() !== subTypeFilter.toLowerCase()
            ) {
                return false;
            }
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (!q) return true;
            const templatesStr = [...item.templatesEn, ...item.templatesAr]
                .join(' ')
                .toLowerCase();
            return (
                item.id.toLowerCase().includes(q) ||
                item.nameEn.toLowerCase().includes(q) ||
                item.nameAr.toLowerCase().includes(q) ||
                item.categoryNameEn.toLowerCase().includes(q) ||
                item.categoryNameAr.toLowerCase().includes(q) ||
                item.subTypeEn.toLowerCase().includes(q) ||
                item.subTypeAr.toLowerCase().includes(q) ||
                item.descriptionEn.toLowerCase().includes(q) ||
                item.descriptionAr.toLowerCase().includes(q) ||
                templatesStr.includes(q) ||
                item.creatorNameEn.toLowerCase().includes(q) ||
                item.creatorNameAr.toLowerCase().includes(q) ||
                item.createDate.toLowerCase().includes(q)
            );
        });
    }, [records, searchQuery, categoryFilter, subTypeFilter, statusFilter]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        categoryFilter !== 'ALL' ||
        subTypeFilter !== 'ALL' ||
        statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setCategoryFilter('ALL');
        setSubTypeFilter('ALL');
        setStatusFilter('ALL');
        setCurrentPage(1);
    };

    // Selection Handlers
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

    // Activate / Deactivate Single Record
    const handleToggleStatus = (record: AssetTypeRecord) => {
        const nextStatus: AssetRecordLifecycleStatus =
            record.status === 'Active' ? 'Inactive' : 'Active';
        const nextList = records.map((r) =>
            r.id === record.id ? { ...r, status: nextStatus } : r
        );
        persistRecords(nextList);

        if (viewingRecord?.id === record.id) {
            setViewingRecord({ ...record, status: nextStatus });
        }

        recordAssetAuditEvent({
            action: nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Asset Type',
            recordId: record.id,
            resourceData: `${record.nameEn} (${record.id})`,
            resourceDataAr: `${record.nameAr} (${record.id})`,
            remarks: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} asset type "${record.nameEn}" (${record.id}).`,
            remarksAr: `تم ${nextStatus === 'Active' ? 'تفعيل' : 'تعطيل'} نوع الأصل "${record.nameAr}" (${record.id}).`,
        });

        const localizedStatus =
            nextStatus === 'Active'
                ? t('assetManagement.common.active')
                : t('assetManagement.common.inactive');
        toast.success(
            t('assetManagement.types.feedback.statusUpdated', {
                name: isRtl ? record.nameAr : record.nameEn,
                status: localizedStatus,
            })
        );
    };

    // Bulk Activate / Deactivate
    const handleBulkStatusChange = (targetStatus: 'Active' | 'Inactive') => {
        if (selectedIds.length === 0) return;
        const affected = records.filter(
            (r) => selectedIds.includes(r.id) && r.status !== targetStatus
        );
        const nextList = records.map((r) =>
            selectedIds.includes(r.id) ? { ...r, status: targetStatus } : r
        );
        persistRecords(nextList);

        for (const item of affected) {
            recordAssetAuditEvent({
                action: targetStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
                resource: 'Asset Type',
                recordId: item.id,
                resourceData: `${item.nameEn} (${item.id})`,
                resourceDataAr: `${item.nameAr} (${item.id})`,
                remarks: `Bulk ${targetStatus === 'Active' ? 'activated' : 'deactivated'} asset type "${item.nameEn}" (${item.id}).`,
                remarksAr: `تم ${targetStatus === 'Active' ? 'تفعيل' : 'تعطيل'} نوع الأصل "${item.nameAr}" (${item.id}) ضمن إجراء جماعي.`,
            });
        }

        const localizedStatus =
            targetStatus === 'Active'
                ? t('assetManagement.common.active')
                : t('assetManagement.common.inactive');
        toast.success(
            t('assetManagement.types.feedback.bulkStatusUpdated', {
                count: selectedIds.length,
                status: localizedStatus,
            })
        );
        setSelectedIds([]);
    };

    // Open Create / Edit Drawer
    const openCreateDrawer = () => {
        const latestCategories = loadAssetCategories();
        setCategories(latestCategories);
        const preferredCategory =
            latestCategories.find((c) => c.status === 'Active') || latestCategories[0];
        setEditingRecord(null);
        setFormState({
            nameEn: '',
            nameAr: '',
            categoryId: preferredCategory?.id || 'ASTCAT001',
            subTypeEn: 'General Asset',
            subTypeAr: 'أصل عام',
            templatesEn: [],
            descriptionEn: '',
            descriptionAr: '',
            status: 'Active',
        });
        setCustomTemplateInput('');
        setFormError(null);
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: AssetTypeRecord) => {
        const latestCategories = loadAssetCategories();
        setCategories(latestCategories);
        setViewingRecord(null);
        setIsCreateOpen(false);
        setEditingRecord(record);
        setFormState({
            nameEn: record.nameEn,
            nameAr: record.nameAr,
            categoryId: record.categoryId,
            subTypeEn: record.subTypeEn,
            subTypeAr: record.subTypeAr,
            templatesEn: [...record.templatesEn],
            descriptionEn: record.descriptionEn,
            descriptionAr: record.descriptionAr,
            status: record.status === 'Inactive' ? 'Inactive' : 'Active',
        });
        setCustomTemplateInput('');
        setFormError(null);
    };

    const closeFormDrawer = () => {
        setIsCreateOpen(false);
        setEditingRecord(null);
        setFormError(null);
    };

    const handleToggleTemplateSelection = (templateNameEn: string) => {
        setFormState((prev) => {
            const exists = prev.templatesEn.some(
                (tName) => tName.toLowerCase() === templateNameEn.toLowerCase()
            );
            return {
                ...prev,
                templatesEn: exists
                    ? prev.templatesEn.filter(
                          (tName) => tName.toLowerCase() !== templateNameEn.toLowerCase()
                      )
                    : [...prev.templatesEn, templateNameEn],
            };
        });
    };

    const handleAddCustomTemplate = () => {
        const trimmed = customTemplateInput.trim();
        if (!trimmed) return;
        const alreadySelected = formState.templatesEn.some(
            (tName) => tName.toLowerCase() === trimmed.toLowerCase()
        );
        if (!alreadySelected) {
            setFormState((prev) => ({
                ...prev,
                templatesEn: [...prev.templatesEn, trimmed],
            }));
        }
        setCustomTemplateInput('');
    };

    const handleSubTypeSelectChange = (valueEn: string) => {
        const matched = ASSET_SUBTYPE_OPTIONS.find(
            (opt) => opt.valueEn.toLowerCase() === valueEn.toLowerCase()
        );
        setFormState((prev) => ({
            ...prev,
            subTypeEn: valueEn,
            subTypeAr: matched?.valueAr || valueEn,
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedNameEn = formState.nameEn.trim();
        const trimmedNameAr = formState.nameAr.trim() || trimmedNameEn;
        const trimmedSubTypeEn = formState.subTypeEn.trim() || 'General Asset';
        const matchedSubType = ASSET_SUBTYPE_OPTIONS.find(
            (opt) => opt.valueEn.toLowerCase() === trimmedSubTypeEn.toLowerCase()
        );
        const trimmedSubTypeAr =
            formState.subTypeAr.trim() || matchedSubType?.valueAr || trimmedSubTypeEn;
        const trimmedDescEn = formState.descriptionEn.trim();
        const trimmedDescAr = formState.descriptionAr.trim() || trimmedDescEn;

        if (!trimmedNameEn) {
            setFormError(t('assetManagement.types.validation.nameRequired'));
            return;
        }
        if (!formState.categoryId) {
            setFormError(t('assetManagement.types.validation.categoryRequired'));
            return;
        }

        const isDuplicate = records.some(
            (r) =>
                r.id !== editingRecord?.id &&
                r.nameEn.trim().toLowerCase() === trimmedNameEn.toLowerCase()
        );
        if (isDuplicate) {
            setFormError(
                t(
                    'assetManagement.types.validation.nameDuplicate',
                    'An asset type with this name already exists.'
                )
            );
            return;
        }

        const selectedCategory =
            categories.find((c) => c.id === formState.categoryId) ||
            drawerCategories.find((c) => c.id === formState.categoryId);
        const categoryNameEn =
            selectedCategory?.nameEn ||
            (editingRecord && editingRecord.categoryId === formState.categoryId
                ? editingRecord.categoryNameEn
                : 'Category Asset');
        const categoryNameAr =
            selectedCategory?.nameAr ||
            (editingRecord && editingRecord.categoryId === formState.categoryId
                ? editingRecord.categoryNameAr
                : 'تصنيف الأصل');

        const templatesEn = formState.templatesEn;
        const templatesAr = templatesEn.map((tplName, idx) => {
            const found =
                drawerTemplates.find(
                    (opt) => opt.nameEn.toLowerCase() === tplName.toLowerCase()
                ) ||
                allKnownTemplates.find(
                    (opt) => opt.nameEn.toLowerCase() === tplName.toLowerCase()
                );
            if (found) return found.nameAr;
            if (
                editingRecord &&
                editingRecord.templatesEn[idx]?.toLowerCase() === tplName.toLowerCase() &&
                editingRecord.templatesAr[idx]
            ) {
                return editingRecord.templatesAr[idx];
            }
            return tplName;
        });

        if (editingRecord) {
            const updated: AssetTypeRecord = {
                ...editingRecord,
                nameEn: trimmedNameEn,
                nameAr: trimmedNameAr,
                categoryId: formState.categoryId,
                categoryNameEn,
                categoryNameAr,
                subTypeEn: trimmedSubTypeEn,
                subTypeAr: trimmedSubTypeAr,
                templatesEn,
                templatesAr,
                descriptionEn: trimmedDescEn,
                descriptionAr: trimmedDescAr,
                status: formState.status,
            };
            const nextList = records.map((r) => (r.id === editingRecord.id ? updated : r));
            persistRecords(nextList);

            recordAssetAuditEvent({
                action: 'UPDATED',
                resource: 'Asset Type',
                recordId: updated.id,
                resourceData: `${updated.nameEn} (${updated.id})`,
                resourceDataAr: `${updated.nameAr} (${updated.id})`,
                remarks: `Updated asset type "${updated.nameEn}" (${updated.id}) [Category: ${updated.categoryNameEn}, Subtype: ${updated.subTypeEn}, Templates: ${updated.templatesEn.join(', ') || 'None'}].`,
                remarksAr: `تم تحديث نوع الأصل "${updated.nameAr}" (${updated.id}) [التصنيف: ${updated.categoryNameAr}، النوع الفرعي: ${updated.subTypeAr}].`,
            });

            toast.success(
                t('assetManagement.types.feedback.updated', {
                    name: isRtl ? updated.nameAr : updated.nameEn,
                })
            );
        } else {
            const newId = generateNextAssetTypeId(records);
            const created: AssetTypeRecord = {
                id: newId,
                nameEn: trimmedNameEn,
                nameAr: trimmedNameAr,
                categoryId: formState.categoryId,
                categoryNameEn,
                categoryNameAr,
                subTypeEn: trimmedSubTypeEn,
                subTypeAr: trimmedSubTypeAr,
                templatesEn,
                templatesAr,
                descriptionEn: trimmedDescEn,
                descriptionAr: trimmedDescAr,
                creatorNameEn: 'Khalifah Alsharabi',
                creatorNameAr: 'خليفة الشرعبي',
                creatorEmail: 'k.alsharabi@awn.sa',
                createDate: formatAssetDateToday(),
                status: formState.status,
            };
            const nextList = [created, ...records];
            persistRecords(nextList);

            recordAssetAuditEvent({
                action: 'CREATED',
                resource: 'Asset Type',
                recordId: created.id,
                resourceData: `${created.nameEn} (${created.id})`,
                resourceDataAr: `${created.nameAr} (${created.id})`,
                remarks: `Created asset type "${created.nameEn}" (${created.id}) under ${created.categoryNameEn} (${created.categoryId}).`,
                remarksAr: `تم إنشاء نوع الأصل "${created.nameAr}" (${created.id}) ضمن ${created.categoryNameAr} (${created.categoryId}).`,
            });

            toast.success(
                t('assetManagement.types.feedback.created', {
                    name: isRtl ? created.nameAr : created.nameEn,
                })
            );
        }

        closeFormDrawer();
    };

    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        const target = deletingRecord;
        const nextList = records.filter((r) => r.id !== target.id);
        persistRecords(nextList);
        setSelectedIds((prev) => prev.filter((id) => id !== target.id));
        if (viewingRecord?.id === target.id) {
            setViewingRecord(null);
        }

        recordAssetAuditEvent({
            action: 'DELETED',
            resource: 'Asset Type',
            recordId: target.id,
            resourceData: `${target.nameEn} (${target.id})`,
            resourceDataAr: `${target.nameAr} (${target.id})`,
            remarks: `Deleted asset type "${target.nameEn}" (${target.id}).`,
            remarksAr: `تم حذف نوع الأصل "${target.nameAr}" (${target.id}).`,
        });

        toast.success(
            t('assetManagement.types.feedback.deleted', {
                name: isRtl ? target.nameAr : target.nameEn,
            })
        );
        setDeletingRecord(null);
    };

    const handleExportCsv = () => {
        const headers = [
            'Type ID',
            'Type Name (EN)',
            'Type Name (AR)',
            'Category',
            'Asset Subtype',
            'Description',
            'Templates',
            'Creator',
            'Create Date',
            'Status',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            `"${r.nameEn.replace(/"/g, '""')}"`,
            `"${r.nameAr.replace(/"/g, '""')}"`,
            `"${isRtl ? r.categoryNameAr : r.categoryNameEn}"`,
            `"${isRtl ? r.subTypeAr : r.subTypeEn}"`,
            `"${(isRtl ? r.descriptionAr : r.descriptionEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.templatesAr : r.templatesEn).join('; ')}"`,
            `"${isRtl ? r.creatorNameAr : r.creatorNameEn}"`,
            r.createDate,
            r.status,
        ]);
        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-asset-types-${formatAssetDateToday()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('assetManagement.common.exportedCsv', { count: filteredRecords.length })
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] dark:text-slate-100">
                            {t('assetManagement.types.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-emerald-400 border border-[#E5E0D8] dark:border-slate-700"
                            dir="ltr"
                        >
                            AST-TYP
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1 font-normal">
                        {t('assetManagement.types.description')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-medium text-[#0D0D0D] dark:text-slate-100 transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('assetManagement.common.exportCsv')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={openCreateDrawer}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Plus size={14} />
                        <span>{t('assetManagement.types.actions.newType')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.types.kpis.totalTypes')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-400 flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-slate-100 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.total}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.types.kpis.activeTypes')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#265938]/12 text-[#265938] dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#265938] dark:text-emerald-400 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.active}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.types.kpis.linkedCategories')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#6A7358]/15 text-[#6A7358] flex items-center justify-center">
                            <Grid className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-slate-100 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.uniqueCategories}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.types.kpis.linkedTemplates')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-slate-100 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.totalLinkedTemplates}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
                {/* Search & Filters Bar */}
                <div className="p-4 border-b border-[#E5E0D8] dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                            placeholder={t('assetManagement.types.filters.searchPlaceholder')}
                            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 placeholder:text-[#857E74] focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-100 cursor-pointer"
                                aria-label={t('common.clear', 'Clear')}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.types.filters.categoryLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.types.filters.allCategories')}
                            </option>
                            {filterCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {isRtl ? cat.nameAr : cat.nameEn} ({cat.id})
                                </option>
                            ))}
                        </select>

                        <select
                            value={subTypeFilter}
                            onChange={(e) => {
                                setSubTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.types.filters.subTypeLabel')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.types.filters.allSubTypes')}
                            </option>
                            {subTypeFilterOptions.map((opt) => (
                                <option key={opt.valueEn} value={opt.valueEn}>
                                    {isRtl ? opt.valueAr : opt.valueEn}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.common.filterByStatus')}
                            className="px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">{t('assetManagement.common.allStatuses')}</option>
                            <option value="Active">{t('assetManagement.common.active')}</option>
                            <option value="Inactive">{t('assetManagement.common.inactive')}</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 text-xs font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('assetManagement.common.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-5 py-2.5 bg-[#2D3F2C]/8 border-b border-[#E5E0D8] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3F2C] dark:text-emerald-400">
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#2D3F2C] text-[#FAF8F5] font-mono"
                                dir="ltr"
                            >
                                {selectedIds.length}
                            </span>
                            <span>{t('assetManagement.common.selectedCount')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Active')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#265938] hover:bg-[#1f492e] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('assetManagement.common.activateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#857E74] hover:bg-[#6E6862] text-[11px] font-semibold text-white transition-colors cursor-pointer"
                            >
                                <XCircle size={13} />
                                <span>{t('assetManagement.common.deactivateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[11px] font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('assetManagement.common.clearSelection')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800">
                                <th className="w-11 py-3.5 px-4 text-start">
                                    <input
                                        type="checkbox"
                                        checked={isAllCurrentPageSelected}
                                        onChange={handleToggleSelectAll}
                                        aria-label={t('assetManagement.common.selectAll')}
                                        className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.id')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.name')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.category')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.assetSubtype')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.description')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.templates')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.creator')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.createDate')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-start">
                                    {t('assetManagement.types.table.status')}
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 text-end">
                                    {t('assetManagement.types.table.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#E5E0D8] dark:divide-slate-800">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 flex items-center justify-center mx-auto text-[#857E74]">
                                                <Layers size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                                                {t('assetManagement.types.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862] dark:text-slate-400">
                                                {t('assetManagement.types.empty.description')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>
                                                        {t('assetManagement.common.resetFilters')}
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
                                    const displayTemplates = isRtl
                                        ? record.templatesAr
                                        : record.templatesEn;
                                    const displayDescription = isRtl
                                        ? record.descriptionAr
                                        : record.descriptionEn;

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#2D3F2C]/5'
                                                    : 'hover:bg-[#FAF8F5]/70 dark:hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <td className="py-3.5 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectOne(record.id)}
                                                    aria-label={`${t('assetManagement.common.selectRow')} ${record.id}`}
                                                    className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono font-bold text-[#2D3F2C] dark:text-emerald-400 tabular-nums"
                                                    dir="ltr"
                                                >
                                                    {record.id}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRecord(record)}
                                                    className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 hover:text-[#2D3F2C] transition-colors text-start cursor-pointer"
                                                >
                                                    {isRtl ? record.nameAr : record.nameEn}
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-200">
                                                    <Grid size={12} className="text-[#2D3F2C] shrink-0" />
                                                    <span>
                                                        {isRtl
                                                            ? record.categoryNameAr
                                                            : record.categoryNameEn}
                                                    </span>
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#2D3F2C]/8 text-[#2D3F2C] dark:text-emerald-400 border border-[#2D3F2C]/20">
                                                    <Box size={12} className="shrink-0" />
                                                    <span>
                                                        {isRtl ? record.subTypeAr : record.subTypeEn}
                                                    </span>
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <p className="text-xs text-[#6E6862] dark:text-slate-400 max-w-[200px] truncate">
                                                    {displayDescription || '—'}
                                                </p>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {displayTemplates.length === 0 ? (
                                                    <span className="text-[11px] text-[#857E74] italic">
                                                        {t(
                                                            'assetManagement.types.labels.noTemplates'
                                                        )}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                                                        {displayTemplates.map((tpl, i) => (
                                                            <span
                                                                key={`${record.id}-tpl-${i}`}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/25"
                                                            >
                                                                <FileText size={11} />
                                                                <span>{tpl}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-[#2D3F2C]/12 text-[#2D3F2C] dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                        KA
                                                    </div>
                                                    <span className="text-xs font-medium text-[#0D0D0D] dark:text-slate-200 whitespace-nowrap">
                                                        {isRtl
                                                            ? record.creatorNameAr
                                                            : record.creatorNameEn}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="text-xs font-mono text-[#6E6862] dark:text-slate-400 tabular-nums"
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
                                                            ? t('assetManagement.common.active')
                                                            : t('assetManagement.common.inactive')}
                                                    </span>
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-4 text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        title={t('assetManagement.common.view')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] dark:hover:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(record)}
                                                        title={t('assetManagement.common.edit')}
                                                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#2D3F2C] hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(record)}
                                                        title={
                                                            isActive
                                                                ? t('assetManagement.common.deactivate')
                                                                : t('assetManagement.common.activate')
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
                                                        title={t('assetManagement.common.delete')}
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
                <div className="px-5 py-3.5 bg-[#FAF8F5]/60 dark:bg-slate-800/40 border-t border-[#E5E0D8] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-[#6E6862] dark:text-slate-400">
                        <span>{t('assetManagement.common.rowsPerPage')}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.common.rowsPerPage')}
                            className="px-2.5 py-1 rounded-md border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            {ASSET_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span>
                            {t('assetManagement.common.showingCount', {
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
                            className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] transition-colors cursor-pointer"
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
                                        : 'bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5]'
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
                            className="p-1.5 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            aria-label={t('common.next', 'Next')}
                        >
                            <ChevronRight size={14} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            {/* View Asset Type Drawer */}
            {viewingRecord && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div
                        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-[#E5E0D8] dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] dark:border-slate-800 flex items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-slate-800/50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs font-mono font-bold text-[#6E6862] dark:text-slate-400"
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
                                                    ? t('assetManagement.common.active')
                                                    : t('assetManagement.common.inactive')}
                                            </span>
                                        </div>
                                        <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100 truncate mt-0.5">
                                            {isRtl ? viewingRecord.nameAr : viewingRecord.nameEn}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862] dark:text-slate-400">
                                            <Grid size={13} />
                                            <span>{t('assetManagement.types.table.category')}</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] dark:text-slate-100 mt-1.5">
                                            {isRtl
                                                ? viewingRecord.categoryNameAr
                                                : viewingRecord.categoryNameEn}{' '}
                                            <span
                                                className="font-mono text-[11px] text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                ({viewingRecord.categoryId})
                                            </span>
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862] dark:text-slate-400">
                                            <Box size={13} />
                                            <span>
                                                {t('assetManagement.types.table.assetSubtype')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] dark:text-slate-100 mt-1.5">
                                            {isRtl
                                                ? viewingRecord.subTypeAr
                                                : viewingRecord.subTypeEn}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862] dark:text-slate-400">
                                            <User size={13} />
                                            <span>{t('assetManagement.types.table.creator')}</span>
                                        </div>
                                        <p className="text-xs font-bold text-[#0D0D0D] dark:text-slate-100 mt-1.5">
                                            {isRtl
                                                ? viewingRecord.creatorNameAr
                                                : viewingRecord.creatorNameEn}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6862] dark:text-slate-400">
                                            <Calendar size={13} />
                                            <span>
                                                {t('assetManagement.types.table.createDate')}
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-bold text-[#0D0D0D] dark:text-slate-100 mt-1.5"
                                            dir="ltr"
                                        >
                                            {viewingRecord.createDate}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800 space-y-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.types.table.templates')}
                                    </span>
                                    {(isRtl
                                        ? viewingRecord.templatesAr
                                        : viewingRecord.templatesEn
                                    ).length === 0 ? (
                                        <p className="text-xs text-[#6E6862] dark:text-slate-400 italic">
                                            {t('assetManagement.types.labels.noTemplates')}
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {(isRtl
                                                ? viewingRecord.templatesAr
                                                : viewingRecord.templatesEn
                                            ).map((tpl, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100"
                                                >
                                                    <FileText
                                                        size={13}
                                                        className="text-[#8C6046]"
                                                    />
                                                    <span>{tpl}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-800 space-y-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.types.table.description')}
                                    </span>
                                    <p className="text-xs text-[#0D0D0D] dark:text-slate-200 leading-relaxed">
                                        {(isRtl
                                            ? viewingRecord.descriptionAr
                                            : viewingRecord.descriptionEn) ||
                                            t('assetManagement.common.noDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/50 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(viewingRecord)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D] dark:text-slate-100 transition-colors cursor-pointer"
                            >
                                <Power size={14} />
                                <span>
                                    {viewingRecord.status === 'Active'
                                        ? t('assetManagement.common.deactivate')
                                        : t('assetManagement.common.activate')}
                                </span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEditDrawer(viewingRecord)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    <span>{t('assetManagement.common.edit')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    {t('common.close', 'Close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Asset Type Drawer */}
            {(isCreateOpen || editingRecord) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleFormSubmit}
                        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-[#E5E0D8] dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] dark:border-slate-800 flex items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                        {editingRecord
                                            ? t('assetManagement.types.drawer.editTitle')
                                            : t('assetManagement.types.drawer.createTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                                        {t('assetManagement.types.drawer.subtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeFormDrawer}
                                    className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {formError && (
                                    <div className="p-3 rounded-lg bg-[#A63A3A]/10 border border-[#A63A3A]/30 text-xs font-medium text-[#A63A3A] flex items-center gap-2">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                        {t('assetManagement.types.drawer.nameEn')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.nameEn}
                                        onChange={(e) => {
                                            setFormState((prev) => ({
                                                ...prev,
                                                nameEn: e.target.value,
                                            }));
                                            if (formError) setFormError(null);
                                        }}
                                        placeholder={t(
                                            'assetManagement.types.drawer.nameEnPlaceholder'
                                        )}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                        {t('assetManagement.types.drawer.nameAr')}
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
                                        placeholder={t(
                                            'assetManagement.types.drawer.nameArPlaceholder'
                                        )}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                            {t('assetManagement.types.drawer.category')}{' '}
                                            <span className="text-[#A63A3A]">*</span>
                                        </label>
                                        <select
                                            value={formState.categoryId}
                                            onChange={(e) =>
                                                setFormState((prev) => ({
                                                    ...prev,
                                                    categoryId: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                        >
                                            {drawerCategories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {isRtl ? cat.nameAr : cat.nameEn} ({cat.id})
                                                    {cat.status === 'Inactive'
                                                        ? ` — ${t('assetManagement.common.inactive')}`
                                                        : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                            {t('assetManagement.types.drawer.assetSubtype')}
                                        </label>
                                        <select
                                            value={formState.subTypeEn}
                                            onChange={(e) =>
                                                handleSubTypeSelectChange(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                        >
                                            {subTypeFilterOptions.map((opt) => (
                                                <option key={opt.valueEn} value={opt.valueEn}>
                                                    {isRtl ? opt.valueAr : opt.valueEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Document Templates Multi-Select */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                            {t('assetManagement.types.drawer.templates')}
                                        </label>
                                        {formState.templatesEn.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        templatesEn: [],
                                                    }))
                                                }
                                                className="text-[11px] font-medium text-[#A63A3A] hover:underline cursor-pointer"
                                            >
                                                {t('assetManagement.types.drawer.clearTemplates')}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[#6E6862] dark:text-slate-400 mb-2">
                                        {t('assetManagement.types.drawer.templatesHint')}
                                    </p>

                                    <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/70 border border-[#E5E0D8] dark:border-slate-700 max-h-44 overflow-y-auto flex flex-wrap gap-1.5">
                                        {drawerTemplates.map((tpl) => {
                                            const isSelected = formState.templatesEn.some(
                                                (name) =>
                                                    name.toLowerCase() ===
                                                    tpl.nameEn.toLowerCase()
                                            );
                                            return (
                                                <button
                                                    key={tpl.nameEn}
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleTemplateSelection(tpl.nameEn)
                                                    }
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                                                            : 'bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-200 border-[#E5E0D8] dark:border-slate-700 hover:border-[#2D3F2C]'
                                                    }`}
                                                >
                                                    {isSelected ? (
                                                        <Check size={12} />
                                                    ) : (
                                                        <FileText
                                                            size={12}
                                                            className="text-[#857E74]"
                                                        />
                                                    )}
                                                    <span>
                                                        {isRtl ? tpl.nameAr : tpl.nameEn}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Optional Custom Template Input */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={customTemplateInput}
                                            onChange={(e) =>
                                                setCustomTemplateInput(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomTemplate();
                                                }
                                            }}
                                            placeholder={t(
                                                'assetManagement.types.drawer.addCustomTemplatePlaceholder'
                                            )}
                                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomTemplate}
                                            className="px-3 py-1.5 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5] text-xs font-semibold text-[#2D3F2C] dark:text-emerald-400 transition-colors cursor-pointer"
                                        >
                                            {t('assetManagement.types.drawer.addTemplateBtn')}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                        {t('assetManagement.types.drawer.descriptionEn')}
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
                                        placeholder={t(
                                            'assetManagement.types.drawer.descriptionPlaceholder'
                                        )}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C] resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                        {t('assetManagement.types.table.status')}
                                    </label>
                                    <select
                                        value={formState.status}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                status: e.target.value as 'Active' | 'Inactive',
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                    >
                                        <option value="Active">
                                            {t('assetManagement.common.active')}
                                        </option>
                                        <option value="Inactive">
                                            {t('assetManagement.common.inactive')}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/50 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeFormDrawer}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                {editingRecord
                                    ? t('common.saveChanges', 'Save Changes')
                                    : t('assetManagement.types.actions.newType')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-[#E5E0D8] dark:border-slate-800 shadow-2xl p-6 space-y-4"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#A63A3A]/12 text-[#A63A3A] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('assetManagement.types.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1 leading-relaxed">
                                    {t('assetManagement.types.deleteModal.message', {
                                        name: isRtl
                                            ? deletingRecord.nameAr
                                            : deletingRecord.nameEn,
                                        id: deletingRecord.id,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingRecord(null)}
                                className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-3.5 py-2 rounded-lg bg-[#A63A3A] hover:bg-[#8f3030] text-xs font-medium text-white transition-colors cursor-pointer"
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
