import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PackageCheck,
    CheckCircle2,
    XCircle,
    Building2,
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
    Mail,
    Hash,
    Tag,
    Layers,
    Grid,
    AlertTriangle,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    loadAssets,
    saveAssets,
    loadAssetCategories,
    loadAssetTypes,
    loadAssetStatuses,
    generateNextAssetId,
    formatAssetDateToday,
    recordAssetAuditEvent,
    ASSET_PAGE_SIZE_OPTIONS,
    ASSET_CUSTOMER_OPTIONS,
    ASSET_COMPANY_OPTIONS,
    type AssetRecord,
    type AssetCategoryRecord,
    type AssetTypeRecord,
    type AssetStatusRecord,
    type AssetRecordLifecycleStatus,
} from './assetManagementMockData';

interface AssetFormState {
    customerNameEn: string;
    customerNameAr: string;
    companyNameEn: string;
    companyNameAr: string;
    categoryId: string;
    typeId: string;
    assetStatusId: string;
    assignedOwnerEn: string;
    assignedOwnerAr: string;
    brandEn: string;
    brandAr: string;
    serialNumber: string;
    manufacturerYear: string;
    registrationValidityDate: string;
    creatorNameEn: string;
    creatorNameAr: string;
    creatorEmail: string;
    notesEn: string;
    status: 'Active' | 'Inactive';
}

function isValidValidityDate(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) return false;

    // Support D/M/YYYY, DD/MM/YYYY, DD.MM.YYYY, or YYYY-MM-DD
    const dmyMatch = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (dmyMatch) {
        const day = Number.parseInt(dmyMatch[1], 10);
        const month = Number.parseInt(dmyMatch[2], 10);
        const year = Number.parseInt(dmyMatch[3], 10);
        if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        const maxDays = new Date(year, month, 0).getDate();
        return day <= maxDays;
    }

    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const year = Number.parseInt(isoMatch[1], 10);
        const month = Number.parseInt(isoMatch[2], 10);
        const day = Number.parseInt(isoMatch[3], 10);
        if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1) {
            return false;
        }
        const maxDays = new Date(year, month, 0).getDate();
        return day <= maxDays;
    }

    return false;
}

function normalizeValidityDateDisplay(raw: string): string {
    const trimmed = raw.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const year = isoMatch[1];
        const month = Number.parseInt(isoMatch[2], 10);
        const day = Number.parseInt(isoMatch[3], 10);
        return `${day}/${month}/${year}`;
    }
    return trimmed;
}

export const AssetsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [records, setRecords] = useState<AssetRecord[]>(() => loadAssets());
    const [categories, setCategories] = useState<AssetCategoryRecord[]>(() =>
        loadAssetCategories()
    );
    const [assetTypes, setAssetTypes] = useState<AssetTypeRecord[]>(() => loadAssetTypes());
    const [assetStatuses, setAssetStatuses] = useState<AssetStatusRecord[]>(() =>
        loadAssetStatuses()
    );

    // Search, Filters & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [customerFilter, setCustomerFilter] = useState<string>('ALL');
    const [companyFilter, setCompanyFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Drawers & Modals State
    const [viewingRecord, setViewingRecord] = useState<AssetRecord | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<AssetRecord | null>(null);

    const defaultCategoryId =
        categories.find((c) => c.status === 'Active')?.id ||
        categories[0]?.id ||
        'ASTCAT001';
    const defaultTypeId =
        assetTypes.find((tp) => tp.categoryId === defaultCategoryId && tp.status === 'Active')
            ?.id ||
        assetTypes.find((tp) => tp.status === 'Active')?.id ||
        assetTypes[0]?.id ||
        'ASTTYP001';
    const defaultAssetStatusId =
        assetStatuses.find((s) => s.status === 'Active')?.id ||
        assetStatuses[0]?.id ||
        'AST001';

    const [formState, setFormState] = useState<AssetFormState>({
        customerNameEn: 'mohd',
        customerNameAr: 'محمد (mohd)',
        companyNameEn: 'dezen company',
        companyNameAr: 'شركة ديزن (dezen company)',
        categoryId: defaultCategoryId,
        typeId: defaultTypeId,
        assetStatusId: defaultAssetStatusId,
        assignedOwnerEn: 'dezen company',
        assignedOwnerAr: 'شركة ديزن (dezen company)',
        brandEn: 'nexus',
        brandAr: 'نيكسس (nexus)',
        serialNumber: '',
        manufacturerYear: '2025',
        registrationValidityDate: '10/10/2028',
        creatorNameEn: 'Dezen Team',
        creatorNameAr: 'فريق ديزن (Dezen Team)',
        creatorEmail: 'abdul.basith@dezensolutions.org',
        notesEn: '',
        status: 'Active',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const persistRecords = (next: AssetRecord[]) => {
        setRecords(next);
        saveAssets(next);
    };

    // Dynamic Filter Options
    const customerFilterOptions = useMemo(() => {
        const map = new Map<string, { nameEn: string; nameAr: string }>();
        for (const rec of records) {
            const key = rec.customerNameEn.trim().toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: rec.customerNameEn,
                    nameAr: rec.customerNameAr || rec.customerNameEn,
                });
            }
        }
        for (const opt of ASSET_CUSTOMER_OPTIONS) {
            const key = opt.nameEn.trim().toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: opt.nameEn,
                    nameAr: opt.nameAr || opt.nameEn,
                });
            }
        }
        return Array.from(map.values());
    }, [records]);

    const companyFilterOptions = useMemo(() => {
        const map = new Map<string, { nameEn: string; nameAr: string }>();
        for (const rec of records) {
            const key = rec.companyNameEn.trim().toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: rec.companyNameEn,
                    nameAr: rec.companyNameAr || rec.companyNameEn,
                });
            }
        }
        for (const opt of ASSET_COMPANY_OPTIONS) {
            const key = opt.nameEn.trim().toLowerCase();
            if (key && !map.has(key)) {
                map.set(key, {
                    nameEn: opt.nameEn,
                    nameAr: opt.nameAr || opt.nameEn,
                });
            }
        }
        return Array.from(map.values());
    }, [records]);

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

    const filterTypes = useMemo(() => {
        const map = new Map<
            string,
            {
                id: string;
                nameEn: string;
                nameAr: string;
                categoryId: string;
                status: AssetRecordLifecycleStatus;
            }
        >();
        for (const tp of assetTypes) {
            if (categoryFilter !== 'ALL' && tp.categoryId !== categoryFilter) continue;
            map.set(tp.id, {
                id: tp.id,
                nameEn: tp.nameEn,
                nameAr: tp.nameAr,
                categoryId: tp.categoryId,
                status: tp.status,
            });
        }
        for (const rec of records) {
            if (categoryFilter !== 'ALL' && rec.categoryId !== categoryFilter) continue;
            if (rec.typeId && !map.has(rec.typeId)) {
                map.set(rec.typeId, {
                    id: rec.typeId,
                    nameEn: rec.typeNameEn || 'New Type Asset',
                    nameAr: rec.typeNameAr || 'نوع أصل جديد',
                    categoryId: rec.categoryId,
                    status: 'Inactive',
                });
            }
        }
        return Array.from(map.values());
    }, [assetTypes, records, categoryFilter]);

    // Drawer Selectors (handling deactivated or removed Categories / Asset Types / Statuses)
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

    const drawerTypes = useMemo(() => {
        const matchingByCategory = assetTypes.filter(
            (tp) => !formState.categoryId || tp.categoryId === formState.categoryId
        );
        const baseList = matchingByCategory.length > 0 ? matchingByCategory : assetTypes;
        const map = new Map<
            string,
            {
                id: string;
                nameEn: string;
                nameAr: string;
                categoryId: string;
                status: AssetRecordLifecycleStatus;
            }
        >();
        for (const tp of baseList) {
            map.set(tp.id, {
                id: tp.id,
                nameEn: tp.nameEn,
                nameAr: tp.nameAr,
                categoryId: tp.categoryId,
                status: tp.status,
            });
        }
        if (map.size === 0) {
            map.set('ASTTYP001', {
                id: 'ASTTYP001',
                nameEn: 'New Type Asset',
                nameAr: 'نوع أصل جديد',
                categoryId: formState.categoryId || 'ASTCAT001',
                status: 'Active',
            });
        }
        if (formState.typeId && !map.has(formState.typeId)) {
            const inAllTypes = assetTypes.find((tp) => tp.id === formState.typeId);
            map.set(formState.typeId, {
                id: formState.typeId,
                nameEn:
                    inAllTypes?.nameEn ||
                    editingRecord?.typeNameEn ||
                    'New Type Asset',
                nameAr:
                    inAllTypes?.nameAr ||
                    editingRecord?.typeNameAr ||
                    'نوع أصل جديد',
                categoryId:
                    inAllTypes?.categoryId ||
                    editingRecord?.categoryId ||
                    formState.categoryId ||
                    'ASTCAT001',
                status: inAllTypes?.status || 'Inactive',
            });
        }
        return Array.from(map.values());
    }, [assetTypes, formState.categoryId, formState.typeId, editingRecord]);

    const drawerAssetStatuses = useMemo(() => {
        const map = new Map<
            string,
            {
                id: string;
                nameEn: string;
                nameAr: string;
                color: string;
                status: AssetRecordLifecycleStatus;
            }
        >();
        for (const st of assetStatuses) {
            map.set(st.id, {
                id: st.id,
                nameEn: st.nameEn,
                nameAr: st.nameAr,
                color: st.color,
                status: st.status,
            });
        }
        if (map.size === 0) {
            map.set('AST001', {
                id: 'AST001',
                nameEn: 'New Assets',
                nameAr: 'أصول جديدة',
                color: '#2D3F2C',
                status: 'Active',
            });
        }
        if (formState.assetStatusId && !map.has(formState.assetStatusId)) {
            map.set(formState.assetStatusId, {
                id: formState.assetStatusId,
                nameEn: editingRecord?.assetStatusNameEn || 'New Assets',
                nameAr: editingRecord?.assetStatusNameAr || 'أصول جديدة',
                color: '#2D3F2C',
                status: 'Inactive',
            });
        }
        return Array.from(map.values());
    }, [assetStatuses, formState.assetStatusId, editingRecord]);

    const kpis = useMemo(() => {
        const total = records.length;
        const active = records.filter((r) => r.status === 'Active').length;
        const inactive = records.filter((r) => r.status !== 'Active').length;
        const linkedCompanies = new Set(
            records.map((r) => r.companyNameEn.trim().toLowerCase()).filter(Boolean)
        ).size;
        return {
            total,
            active,
            inactive,
            linkedCompanies,
        };
    }, [records]);

    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter((item) => {
            if (
                customerFilter !== 'ALL' &&
                item.customerNameEn.trim().toLowerCase() !== customerFilter.toLowerCase()
            ) {
                return false;
            }
            if (
                companyFilter !== 'ALL' &&
                item.companyNameEn.trim().toLowerCase() !== companyFilter.toLowerCase()
            ) {
                return false;
            }
            if (categoryFilter !== 'ALL' && item.categoryId !== categoryFilter) {
                return false;
            }
            if (typeFilter !== 'ALL' && item.typeId !== typeFilter) {
                return false;
            }
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (!q) return true;
            return (
                item.id.toLowerCase().includes(q) ||
                item.customerNameEn.toLowerCase().includes(q) ||
                item.customerNameAr.toLowerCase().includes(q) ||
                item.companyNameEn.toLowerCase().includes(q) ||
                item.companyNameAr.toLowerCase().includes(q) ||
                item.categoryNameEn.toLowerCase().includes(q) ||
                item.categoryNameAr.toLowerCase().includes(q) ||
                item.categoryId.toLowerCase().includes(q) ||
                item.typeNameEn.toLowerCase().includes(q) ||
                item.typeNameAr.toLowerCase().includes(q) ||
                item.typeId.toLowerCase().includes(q) ||
                item.assignedOwnerEn.toLowerCase().includes(q) ||
                item.assignedOwnerAr.toLowerCase().includes(q) ||
                item.brandEn.toLowerCase().includes(q) ||
                item.brandAr.toLowerCase().includes(q) ||
                item.serialNumber.toLowerCase().includes(q) ||
                item.manufacturerYear.toLowerCase().includes(q) ||
                item.registrationValidityDate.toLowerCase().includes(q) ||
                item.creatorNameEn.toLowerCase().includes(q) ||
                item.creatorNameAr.toLowerCase().includes(q) ||
                (item.creatorEmail || '').toLowerCase().includes(q) ||
                item.status.toLowerCase().includes(q)
            );
        });
    }, [
        records,
        searchQuery,
        customerFilter,
        companyFilter,
        categoryFilter,
        typeFilter,
        statusFilter,
    ]);

    const totalRecords = filteredRecords.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safeCurrentPage, pageSize]);

    const hasActiveFilters =
        searchQuery.trim().length > 0 ||
        customerFilter !== 'ALL' ||
        companyFilter !== 'ALL' ||
        categoryFilter !== 'ALL' ||
        typeFilter !== 'ALL' ||
        statusFilter !== 'ALL';

    const handleResetFilters = () => {
        setSearchQuery('');
        setCustomerFilter('ALL');
        setCompanyFilter('ALL');
        setCategoryFilter('ALL');
        setTypeFilter('ALL');
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

    // Activate / Deactivate Single Asset
    const handleToggleStatus = (record: AssetRecord) => {
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
            resource: 'Asset',
            recordId: record.id,
            resourceData: `${record.typeNameEn} — ${record.brandEn} (${record.id})`,
            resourceDataAr: `${record.typeNameAr} — ${record.brandAr} (${record.id})`,
            performedBy: record.creatorNameEn || 'Dezen Team',
            performedByAr: record.creatorNameAr || 'فريق ديزن',
            remarks: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} asset "${record.id}" (Serial: ${record.serialNumber}).`,
            remarksAr: `تم ${nextStatus === 'Active' ? 'تفعيل' : 'تعطيل'} الأصل "${record.id}" (الرقم التسلسلي: ${record.serialNumber}).`,
        });

        const localizedStatus =
            nextStatus === 'Active'
                ? t('assetManagement.common.active')
                : t('assetManagement.common.inactive');
        toast.success(
            t('assetManagement.assets.feedback.statusUpdated', {
                id: record.id,
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
                resource: 'Asset',
                recordId: item.id,
                resourceData: `${item.typeNameEn} — ${item.brandEn} (${item.id})`,
                resourceDataAr: `${item.typeNameAr} — ${item.brandAr} (${item.id})`,
                performedBy: item.creatorNameEn || 'Dezen Team',
                performedByAr: item.creatorNameAr || 'فريق ديزن',
                remarks: `Bulk ${targetStatus === 'Active' ? 'activated' : 'deactivated'} asset "${item.id}" (Serial: ${item.serialNumber}).`,
                remarksAr: `تم ${targetStatus === 'Active' ? 'تفعيل' : 'تعطيل'} الأصل "${item.id}" (الرقم التسلسلي: ${item.serialNumber}) ضمن إجراء جماعي.`,
            });
        }

        const localizedStatus =
            targetStatus === 'Active'
                ? t('assetManagement.common.active')
                : t('assetManagement.common.inactive');
        toast.success(
            t('assetManagement.assets.feedback.bulkStatusUpdated', {
                count: selectedIds.length,
                status: localizedStatus,
            })
        );
        setSelectedIds([]);
    };

    // Open Create / Edit Drawer
    const refreshMasters = () => {
        const latestCategories = loadAssetCategories();
        const latestTypes = loadAssetTypes();
        const latestStatuses = loadAssetStatuses();
        setCategories(latestCategories);
        setAssetTypes(latestTypes);
        setAssetStatuses(latestStatuses);
        return { latestCategories, latestTypes, latestStatuses };
    };

    const openCreateDrawer = () => {
        const { latestCategories, latestTypes, latestStatuses } = refreshMasters();
        const preferredCategory =
            latestCategories.find((c) => c.status === 'Active') || latestCategories[0];
        const catId = preferredCategory?.id || 'ASTCAT001';
        const preferredType =
            latestTypes.find((tp) => tp.categoryId === catId && tp.status === 'Active') ||
            latestTypes.find((tp) => tp.status === 'Active') ||
            latestTypes[0];
        const preferredStatus =
            latestStatuses.find((s) => s.status === 'Active') || latestStatuses[0];

        setEditingRecord(null);
        setFormState({
            customerNameEn: 'mohd',
            customerNameAr: 'محمد (mohd)',
            companyNameEn: 'dezen company',
            companyNameAr: 'شركة ديزن (dezen company)',
            categoryId: catId,
            typeId: preferredType?.id || 'ASTTYP001',
            assetStatusId: preferredStatus?.id || 'AST001',
            assignedOwnerEn: 'dezen company',
            assignedOwnerAr: 'شركة ديزن (dezen company)',
            brandEn: 'nexus',
            brandAr: 'نيكسس (nexus)',
            serialNumber: '',
            manufacturerYear: '2025',
            registrationValidityDate: '10/10/2028',
            creatorNameEn: 'Dezen Team',
            creatorNameAr: 'فريق ديزن (Dezen Team)',
            creatorEmail: 'abdul.basith@dezensolutions.org',
            notesEn: '',
            status: 'Active',
        });
        setFormError(null);
        setIsCreateOpen(true);
    };

    const openEditDrawer = (record: AssetRecord) => {
        refreshMasters();
        setViewingRecord(null);
        setIsCreateOpen(false);
        setEditingRecord(record);
        setFormState({
            customerNameEn: record.customerNameEn,
            customerNameAr: record.customerNameAr,
            companyNameEn: record.companyNameEn,
            companyNameAr: record.companyNameAr,
            categoryId: record.categoryId,
            typeId: record.typeId,
            assetStatusId: record.assetStatusId || 'AST001',
            assignedOwnerEn: record.assignedOwnerEn,
            assignedOwnerAr: record.assignedOwnerAr,
            brandEn: record.brandEn,
            brandAr: record.brandAr,
            serialNumber: record.serialNumber,
            manufacturerYear: record.manufacturerYear,
            registrationValidityDate: record.registrationValidityDate,
            creatorNameEn: record.creatorNameEn,
            creatorNameAr: record.creatorNameAr,
            creatorEmail: record.creatorEmail || 'abdul.basith@dezensolutions.org',
            notesEn: record.notesEn || '',
            status: record.status === 'Inactive' ? 'Inactive' : 'Active',
        });
        setFormError(null);
    };

    const closeFormDrawer = () => {
        setIsCreateOpen(false);
        setEditingRecord(null);
        setFormError(null);
    };

    // Keep Category and Asset Type selections consistent in the Drawer
    const handleDrawerCategoryChange = (nextCategoryId: string) => {
        const typesForCat = assetTypes.filter((tp) => tp.categoryId === nextCategoryId);
        const currentTypeStillMatches = typesForCat.some((tp) => tp.id === formState.typeId);
        const nextType = currentTypeStillMatches
            ? formState.typeId
            : (typesForCat.find((tp) => tp.status === 'Active') || typesForCat[0])?.id ||
              formState.typeId;

        setFormState((prev) => ({
            ...prev,
            categoryId: nextCategoryId,
            typeId: nextType,
        }));
        if (formError) setFormError(null);
    };

    const handleDrawerTypeChange = (nextTypeId: string) => {
        const selectedType = assetTypes.find((tp) => tp.id === nextTypeId);
        setFormState((prev) => ({
            ...prev,
            typeId: nextTypeId,
            categoryId: selectedType?.categoryId || prev.categoryId,
        }));
        if (formError) setFormError(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCustomerEn = formState.customerNameEn.trim();
        const trimmedCompanyEn = formState.companyNameEn.trim();
        const trimmedOwnerEn = formState.assignedOwnerEn.trim();
        const trimmedBrandEn = formState.brandEn.trim();
        const trimmedSerial = formState.serialNumber.trim();
        const trimmedYear = formState.manufacturerYear.trim();
        const trimmedValidity = formState.registrationValidityDate.trim();
        const trimmedCreatorEn = formState.creatorNameEn.trim();
        const trimmedEmail = formState.creatorEmail.trim();
        const trimmedNotes = formState.notesEn.trim();

        if (!trimmedCustomerEn) {
            setFormError(t('assetManagement.assets.validation.customerRequired'));
            return;
        }
        if (!trimmedCompanyEn) {
            setFormError(t('assetManagement.assets.validation.companyRequired'));
            return;
        }
        if (!formState.categoryId) {
            setFormError(t('assetManagement.assets.validation.categoryRequired'));
            return;
        }
        if (!formState.typeId) {
            setFormError(t('assetManagement.assets.validation.typeRequired'));
            return;
        }
        if (!trimmedOwnerEn) {
            setFormError(t('assetManagement.assets.validation.ownerRequired'));
            return;
        }
        if (!trimmedBrandEn) {
            setFormError(t('assetManagement.assets.validation.brandRequired'));
            return;
        }
        if (!trimmedSerial) {
            setFormError(t('assetManagement.assets.validation.serialRequired'));
            return;
        }

        // Duplicate Serial Number check
        const duplicateSerial = records.some(
            (r) =>
                r.id !== editingRecord?.id &&
                r.serialNumber.trim().toLowerCase() === trimmedSerial.toLowerCase()
        );
        if (duplicateSerial) {
            setFormError(t('assetManagement.assets.validation.serialDuplicate'));
            return;
        }

        // Year validation (4 digits, 1950..2030)
        if (!trimmedYear) {
            setFormError(t('assetManagement.assets.validation.yearRequired'));
            return;
        }
        const parsedYear = Number.parseInt(trimmedYear, 10);
        if (!/^\d{4}$/.test(trimmedYear) || parsedYear < 1950 || parsedYear > 2030) {
            setFormError(t('assetManagement.assets.validation.yearInvalid'));
            return;
        }

        // Registration Validity Date validation
        if (!trimmedValidity) {
            setFormError(t('assetManagement.assets.validation.validityRequired'));
            return;
        }
        if (!isValidValidityDate(trimmedValidity)) {
            setFormError(t('assetManagement.assets.validation.validityInvalid'));
            return;
        }
        const normalizedValidity = normalizeValidityDateDisplay(trimmedValidity);

        // Creator & Email validation
        if (!trimmedCreatorEn) {
            setFormError(t('assetManagement.assets.validation.createdByRequired'));
            return;
        }
        if (!trimmedEmail) {
            setFormError(t('assetManagement.assets.validation.emailRequired'));
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setFormError(t('assetManagement.assets.validation.emailInvalid'));
            return;
        }

        // Resolve Category, Asset Type, and Asset Status safely (preserving existing if removed/deactivated)
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

        const selectedType =
            assetTypes.find((tp) => tp.id === formState.typeId) ||
            drawerTypes.find((tp) => tp.id === formState.typeId);
        const typeNameEn =
            selectedType?.nameEn ||
            (editingRecord && editingRecord.typeId === formState.typeId
                ? editingRecord.typeNameEn
                : 'New Type Asset');
        const typeNameAr =
            selectedType?.nameAr ||
            (editingRecord && editingRecord.typeId === formState.typeId
                ? editingRecord.typeNameAr
                : 'نوع أصل جديد');

        const fullTypeRecord = assetTypes.find((tp) => tp.id === formState.typeId);
        const selectedAssetStatus =
            assetStatuses.find((s) => s.id === formState.assetStatusId) ||
            drawerAssetStatuses.find((s) => s.id === formState.assetStatusId);
        const assetStatusNameEn =
            selectedAssetStatus?.nameEn ||
            editingRecord?.assetStatusNameEn ||
            'New Assets';
        const assetStatusNameAr =
            selectedAssetStatus?.nameAr ||
            editingRecord?.assetStatusNameAr ||
            'أصول جديدة';

        const matchedCustomerOpt = ASSET_CUSTOMER_OPTIONS.find(
            (c) =>
                c.nameEn.toLowerCase() === trimmedCustomerEn.toLowerCase() ||
                c.nameAr.toLowerCase() === trimmedCustomerEn.toLowerCase()
        );
        const matchedCompanyOpt = ASSET_COMPANY_OPTIONS.find(
            (c) =>
                c.nameEn.toLowerCase() === trimmedCompanyEn.toLowerCase() ||
                c.nameAr.toLowerCase() === trimmedCompanyEn.toLowerCase()
        );
        const matchedOwnerCompanyOpt = ASSET_COMPANY_OPTIONS.find(
            (c) =>
                c.nameEn.toLowerCase() === trimmedOwnerEn.toLowerCase() ||
                c.nameAr.toLowerCase() === trimmedOwnerEn.toLowerCase()
        );
        const matchedOwnerCustomerOpt = ASSET_CUSTOMER_OPTIONS.find(
            (c) =>
                c.nameEn.toLowerCase() === trimmedOwnerEn.toLowerCase() ||
                c.nameAr.toLowerCase() === trimmedOwnerEn.toLowerCase()
        );

        const resolvedCustomerAr =
            matchedCustomerOpt?.nameAr ||
            (editingRecord &&
            editingRecord.customerNameEn.toLowerCase() === trimmedCustomerEn.toLowerCase()
                ? editingRecord.customerNameAr
                : trimmedCustomerEn);

        const resolvedCompanyAr =
            matchedCompanyOpt?.nameAr ||
            (editingRecord &&
            editingRecord.companyNameEn.toLowerCase() === trimmedCompanyEn.toLowerCase()
                ? editingRecord.companyNameAr
                : trimmedCompanyEn);

        const resolvedOwnerAr =
            matchedOwnerCompanyOpt?.nameAr ||
            matchedOwnerCustomerOpt?.nameAr ||
            (editingRecord &&
            editingRecord.assignedOwnerEn.toLowerCase() === trimmedOwnerEn.toLowerCase()
                ? editingRecord.assignedOwnerAr
                : trimmedOwnerEn);

        const resolvedBrandAr =
            trimmedBrandEn.toLowerCase() === 'nexus'
                ? 'نيكسس (nexus)'
                : editingRecord &&
                  editingRecord.brandEn.toLowerCase() === trimmedBrandEn.toLowerCase()
                ? editingRecord.brandAr
                : trimmedBrandEn;

        const resolvedCreatorAr =
            trimmedCreatorEn.toLowerCase() === 'dezen team'
                ? 'فريق ديزن (Dezen Team)'
                : trimmedCreatorEn.toLowerCase() === 'khalifah alsharabi'
                ? 'خليفة الشرعبي'
                : editingRecord &&
                  editingRecord.creatorNameEn.toLowerCase() === trimmedCreatorEn.toLowerCase()
                ? editingRecord.creatorNameAr
                : trimmedCreatorEn;

        if (editingRecord) {
            const updated: AssetRecord = {
                ...editingRecord,
                assetNameEn: typeNameEn,
                assetNameAr: typeNameAr,
                customerId: matchedCustomerOpt?.id || editingRecord.customerId || 'cust-dezen',
                customerNameEn: trimmedCustomerEn,
                customerNameAr: resolvedCustomerAr,
                companyId: matchedCompanyOpt?.id || editingRecord.companyId || 'comp-dezen',
                companyNameEn: trimmedCompanyEn,
                companyNameAr: resolvedCompanyAr,
                categoryId: formState.categoryId,
                categoryNameEn,
                categoryNameAr,
                typeId: formState.typeId,
                typeNameEn,
                typeNameAr,
                subTypeEn: fullTypeRecord?.subTypeEn || editingRecord.subTypeEn || 'General Asset',
                subTypeAr: fullTypeRecord?.subTypeAr || editingRecord.subTypeAr || 'أصل عام',
                assetStatusId: formState.assetStatusId || 'AST001',
                assetStatusNameEn,
                assetStatusNameAr,
                templatesEn: fullTypeRecord?.templatesEn || editingRecord.templatesEn || [],
                templatesAr: fullTypeRecord?.templatesAr || editingRecord.templatesAr || [],
                assignedOwnerEn: trimmedOwnerEn,
                assignedOwnerAr: resolvedOwnerAr,
                brandEn: trimmedBrandEn,
                brandAr: resolvedBrandAr,
                serialNumber: trimmedSerial,
                manufacturerYear: trimmedYear,
                registrationValidityDate: normalizedValidity,
                creatorNameEn: trimmedCreatorEn,
                creatorNameAr: resolvedCreatorAr,
                creatorEmail: trimmedEmail,
                notesEn: trimmedNotes,
                notesAr: trimmedNotes || editingRecord.notesAr || '',
                status: formState.status,
            };

            const nextList = records.map((r) => (r.id === editingRecord.id ? updated : r));
            persistRecords(nextList);

            recordAssetAuditEvent({
                action: 'UPDATED',
                resource: 'Asset',
                recordId: updated.id,
                resourceData: `${updated.typeNameEn} — ${updated.brandEn} (${updated.id})`,
                resourceDataAr: `${updated.typeNameAr} — ${updated.brandAr} (${updated.id})`,
                performedBy: updated.creatorNameEn,
                performedByAr: updated.creatorNameAr,
                remarks: `Updated asset "${updated.id}" (Serial: ${updated.serialNumber}, Customer: ${updated.customerNameEn}, Business: ${updated.companyNameEn}).`,
                remarksAr: `تم تحديث الأصل "${updated.id}" (الرقم التسلسلي: ${updated.serialNumber}، العميل: ${updated.customerNameAr}، الشركة: ${updated.companyNameAr}).`,
            });

            toast.success(
                t('assetManagement.assets.feedback.updated', {
                    id: updated.id,
                })
            );
        } else {
            const newId = generateNextAssetId(records);
            const created: AssetRecord = {
                id: newId,
                assetNameEn: typeNameEn,
                assetNameAr: typeNameAr,
                customerId: matchedCustomerOpt?.id || 'cust-dezen',
                customerNameEn: trimmedCustomerEn,
                customerNameAr: resolvedCustomerAr,
                companyId: matchedCompanyOpt?.id || 'comp-dezen',
                companyNameEn: trimmedCompanyEn,
                companyNameAr: resolvedCompanyAr,
                categoryId: formState.categoryId,
                categoryNameEn,
                categoryNameAr,
                typeId: formState.typeId,
                typeNameEn,
                typeNameAr,
                subTypeEn: fullTypeRecord?.subTypeEn || 'General Asset',
                subTypeAr: fullTypeRecord?.subTypeAr || 'أصل عام',
                assetStatusId: formState.assetStatusId || 'AST001',
                assetStatusNameEn,
                assetStatusNameAr,
                tagIds: ['ASTTAG001'],
                tagNamesEn: ['Tag Asset'],
                tagNamesAr: ['وسم الأصل'],
                templatesEn: fullTypeRecord?.templatesEn || [],
                templatesAr: fullTypeRecord?.templatesAr || [],
                assignedOwnerEn: trimmedOwnerEn,
                assignedOwnerAr: resolvedOwnerAr,
                brandEn: trimmedBrandEn,
                brandAr: resolvedBrandAr,
                serialNumber: trimmedSerial,
                manufacturerYear: trimmedYear,
                registrationValidityDate: normalizedValidity,
                creatorNameEn: trimmedCreatorEn,
                creatorNameAr: resolvedCreatorAr,
                creatorEmail: trimmedEmail,
                createDate: formatAssetDateToday(),
                status: formState.status,
                notesEn: trimmedNotes,
                notesAr: trimmedNotes,
            };

            const nextList = [created, ...records];
            persistRecords(nextList);

            recordAssetAuditEvent({
                action: 'CREATED',
                resource: 'Asset',
                recordId: created.id,
                resourceData: `${created.typeNameEn} — ${created.brandEn} (${created.id})`,
                resourceDataAr: `${created.typeNameAr} — ${created.brandAr} (${created.id})`,
                performedBy: created.creatorNameEn,
                performedByAr: created.creatorNameAr,
                remarks: `Created asset "${created.id}" (Serial: ${created.serialNumber}, Brand: ${created.brandEn}) for customer ${created.customerNameEn} / ${created.companyNameEn}.`,
                remarksAr: `تم إنشاء الأصل "${created.id}" (الرقم التسلسلي: ${created.serialNumber}، العلامة: ${created.brandAr}) للعميل ${created.customerNameAr} / ${created.companyNameAr}.`,
            });

            toast.success(
                t('assetManagement.assets.feedback.created', {
                    id: created.id,
                    serial: created.serialNumber,
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
            resource: 'Asset',
            recordId: target.id,
            resourceData: `${target.typeNameEn} — ${target.brandEn} (${target.id})`,
            resourceDataAr: `${target.typeNameAr} — ${target.brandAr} (${target.id})`,
            performedBy: target.creatorNameEn || 'Dezen Team',
            performedByAr: target.creatorNameAr || 'فريق ديزن',
            remarks: `Deleted asset "${target.id}" (Serial: ${target.serialNumber}, Customer: ${target.customerNameEn}).`,
            remarksAr: `تم حذف الأصل "${target.id}" (الرقم التسلسلي: ${target.serialNumber}، العميل: ${target.customerNameAr}).`,
        });

        toast.success(
            t('assetManagement.assets.feedback.deleted', {
                id: target.id,
            })
        );
        setDeletingRecord(null);
    };

    const handleExportCsv = () => {
        const headers = [
            'Asset ID',
            'Customer',
            'Business / Company',
            'Category',
            'Asset Type',
            'Owner',
            'Brand',
            'Serial Number',
            'Year',
            'Registration Validity',
            'Created By',
            'Email',
            'Status',
        ];
        const rows = filteredRecords.map((r) => [
            r.id,
            `"${(isRtl ? r.customerNameAr : r.customerNameEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.companyNameAr : r.companyNameEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.categoryNameAr : r.categoryNameEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.typeNameAr : r.typeNameEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.assignedOwnerAr : r.assignedOwnerEn).replace(/"/g, '""')}"`,
            `"${(isRtl ? r.brandAr : r.brandEn).replace(/"/g, '""')}"`,
            `"${r.serialNumber.replace(/"/g, '""')}"`,
            r.manufacturerYear,
            r.registrationValidityDate,
            `"${(isRtl ? r.creatorNameAr : r.creatorNameEn).replace(/"/g, '""')}"`,
            `"${(r.creatorEmail || '').replace(/"/g, '""')}"`,
            r.status,
        ]);
        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `awn-assets-${formatAssetDateToday()}.csv`;
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
                            {t('assetManagement.assets.title')}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-emerald-400 border border-[#E5E0D8] dark:border-slate-700"
                            dir="ltr"
                        >
                            AST-REG
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1 font-normal">
                        {t('assetManagement.assets.description')}
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
                        <span>{t('assetManagement.assets.actions.newAsset')}</span>
                    </button>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.assets.kpis.totalAssets')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-400 flex items-center justify-center">
                            <PackageCheck className="w-4 h-4" />
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
                            {t('assetManagement.assets.kpis.activeAssets')}
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
                            {t('assetManagement.assets.kpis.inactiveAssets')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#857E74]/12 text-[#6E6862] dark:text-slate-400 flex items-center justify-center">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#6E6862] dark:text-slate-300 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.inactive}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                            {t('assetManagement.assets.kpis.linkedCompanies')}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#8C6046]/12 text-[#8C6046] flex items-center justify-center">
                            <Building2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span
                            className="text-2xl font-bold font-mono text-[#0D0D0D] dark:text-slate-100 tabular-nums"
                            dir="ltr"
                        >
                            {kpis.linkedCompanies}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
                {/* Search & Filters Bar */}
                <div className="p-4 border-b border-[#E5E0D8] dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
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
                            placeholder={t('assetManagement.assets.filters.searchPlaceholder')}
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

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={customerFilter}
                            onChange={(e) => {
                                setCustomerFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.assets.filters.customerLabel')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.assets.filters.allCustomers')}
                            </option>
                            {customerFilterOptions.map((cust) => (
                                <option key={cust.nameEn} value={cust.nameEn}>
                                    {isRtl ? cust.nameAr : cust.nameEn}
                                </option>
                            ))}
                        </select>

                        <select
                            value={companyFilter}
                            onChange={(e) => {
                                setCompanyFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.assets.filters.companyLabel')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.assets.filters.allCompanies')}
                            </option>
                            {companyFilterOptions.map((comp) => (
                                <option key={comp.nameEn} value={comp.nameEn}>
                                    {isRtl ? comp.nameAr : comp.nameEn}
                                </option>
                            ))}
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setTypeFilter('ALL');
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.assets.filters.categoryLabel')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.assets.filters.allCategories')}
                            </option>
                            {filterCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {isRtl ? cat.nameAr : cat.nameEn} ({cat.id})
                                </option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            aria-label={t('assetManagement.assets.filters.typeLabel')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">
                                {t('assetManagement.assets.filters.allTypes')}
                            </option>
                            {filterTypes.map((tp) => (
                                <option key={tp.id} value={tp.id}>
                                    {isRtl ? tp.nameAr : tp.nameEn} ({tp.id})
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
                            className="px-2.5 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                        >
                            <option value="ALL">{t('assetManagement.common.allStatuses')}</option>
                            <option value="Active">{t('assetManagement.common.active')}</option>
                            <option value="Inactive">{t('assetManagement.common.inactive')}</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 text-xs font-medium text-[#6E6862] dark:text-slate-300 hover:text-[#0D0D0D] dark:hover:text-slate-100 transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('assetManagement.common.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-slate-800/80 border-b border-[#E5E0D8] dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#0D0D0D] dark:text-slate-200">
                            <strong className="font-mono">{selectedIds.length}</strong>{' '}
                            {t('assetManagement.common.selectedCount')}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Active')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#265938] text-white text-xs font-medium hover:bg-[#1e472c] transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={13} />
                                <span>{t('assetManagement.common.activateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#857E74] text-white text-xs font-medium hover:bg-[#6E6862] transition-colors cursor-pointer"
                            >
                                <Power size={13} />
                                <span>{t('assetManagement.common.deactivateSelected')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-2.5 py-1 text-xs font-medium text-[#6E6862] dark:text-slate-400 hover:text-[#0D0D0D] dark:hover:text-slate-100 cursor-pointer"
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
                            <tr className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                <th className="py-3 px-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllCurrentPageSelected}
                                        onChange={handleToggleSelectAll}
                                        aria-label={t('assetManagement.common.selectAll')}
                                        className="w-3.5 h-3.5 rounded-xs border-[#D4CEC3] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.id')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.customer')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.company')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.category')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.assetType')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.owner')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.brand')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.serialNumber')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.year')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.registrationValidity')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.createdBy')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.email')}
                                </th>
                                <th className="py-3 px-3 text-start whitespace-nowrap">
                                    {t('assetManagement.assets.table.status')}
                                </th>
                                <th className="py-3 px-3 text-end whitespace-nowrap">
                                    {t('assetManagement.assets.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE4] dark:divide-slate-800 text-xs">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="py-14 px-6 text-center">
                                        <div className="max-w-sm mx-auto space-y-2">
                                            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 flex items-center justify-center mx-auto text-[#857E74]">
                                                <PackageCheck size={18} />
                                            </div>
                                            <p className="text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                                                {t('assetManagement.assets.empty.title')}
                                            </p>
                                            <p className="text-xs text-[#6E6862] dark:text-slate-400">
                                                {t('assetManagement.assets.empty.description')}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium hover:bg-[#233122] transition-colors cursor-pointer"
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
                                    const resolvedCat = categories.find(
                                        (c) => c.id === record.categoryId
                                    );
                                    const resolvedType = assetTypes.find(
                                        (tp) => tp.id === record.typeId
                                    );
                                    const displayCatName = isRtl
                                        ? resolvedCat?.nameAr || record.categoryNameAr
                                        : resolvedCat?.nameEn || record.categoryNameEn;
                                    const displayTypeName = isRtl
                                        ? resolvedType?.nameAr || record.typeNameAr
                                        : resolvedType?.nameEn || record.typeNameEn;

                                    return (
                                        <tr
                                            key={record.id}
                                            className={`transition-colors ${
                                                isSelected
                                                    ? 'bg-[#2D3F2C]/5 dark:bg-emerald-950/20'
                                                    : 'hover:bg-[#FAF8F5]/70 dark:hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <td className="py-3.5 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectOne(record.id)}
                                                    aria-label={t('assetManagement.common.selectRow')}
                                                    className="w-3.5 h-3.5 rounded-xs border-[#D4CEC3] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRecord(record)}
                                                    className="font-mono font-semibold text-xs text-[#2D3F2C] dark:text-emerald-400 hover:underline cursor-pointer"
                                                    dir="ltr"
                                                >
                                                    {record.id}
                                                </button>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap font-medium text-[#0D0D0D] dark:text-slate-100">
                                                {isRtl ? record.customerNameAr : record.customerNameEn}
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap text-[#0D0D0D] dark:text-slate-200">
                                                {isRtl ? record.companyNameAr : record.companyNameEn}
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[11px] font-medium text-[#0D0D0D] dark:text-slate-200">
                                                    <Grid size={11} className="text-[#857E74]" />
                                                    <span>{displayCatName}</span>
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#2D3F2C]/8 dark:bg-emerald-950/30 text-[11px] font-medium text-[#2D3F2C] dark:text-emerald-300">
                                                    <Layers size={11} />
                                                    <span>{displayTypeName}</span>
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap text-[#6E6862] dark:text-slate-300">
                                                {isRtl
                                                    ? record.assignedOwnerAr
                                                    : record.assignedOwnerEn}
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap font-medium text-[#0D0D0D] dark:text-slate-100">
                                                {isRtl ? record.brandAr : record.brandEn}
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className="font-mono text-xs text-[#0D0D0D] dark:text-slate-200 px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700"
                                                    dir="ltr"
                                                >
                                                    {record.serialNumber}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className="font-mono text-xs text-[#6E6862] dark:text-slate-300 tabular-nums"
                                                    dir="ltr"
                                                >
                                                    {record.manufacturerYear}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className="font-mono text-xs text-[#6E6862] dark:text-slate-300 tabular-nums"
                                                    dir="ltr"
                                                >
                                                    {record.registrationValidityDate}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap text-[#0D0D0D] dark:text-slate-200">
                                                {isRtl ? record.creatorNameAr : record.creatorNameEn}
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className="font-mono text-[11px] text-[#6E6862] dark:text-slate-400"
                                                    dir="ltr"
                                                >
                                                    {record.creatorEmail || '—'}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                        isActive
                                                            ? 'bg-[#265938]/12 text-[#265938] dark:bg-emerald-950/50 dark:text-emerald-400'
                                                            : 'bg-[#857E74]/15 text-[#6E6862] dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            isActive
                                                                ? 'bg-[#265938] dark:bg-emerald-400'
                                                                : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    {isActive
                                                        ? t('assetManagement.common.active')
                                                        : t('assetManagement.common.inactive')}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-3 whitespace-nowrap text-end">
                                                <div className="inline-flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRecord(record)}
                                                        title={t('assetManagement.common.view')}
                                                        className="p-1.5 rounded-md text-[#6E6862] dark:text-slate-400 hover:text-[#0D0D0D] dark:hover:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditDrawer(record)}
                                                        title={t('assetManagement.common.edit')}
                                                        className="p-1.5 rounded-md text-[#6E6862] dark:text-slate-400 hover:text-[#2D3F2C] dark:hover:text-emerald-400 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(record)}
                                                        title={
                                                            isActive
                                                                ? t('assetManagement.common.deactivate')
                                                                : t('assetManagement.common.activate')
                                                        }
                                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                                            isActive
                                                                ? 'text-[#265938] dark:text-emerald-400 hover:bg-[#265938]/10'
                                                                : 'text-[#857E74] hover:text-[#265938] hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        <Power size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingRecord(record)}
                                                        title={t('assetManagement.common.delete')}
                                                        className="p-1.5 rounded-md text-[#6E6862] dark:text-slate-400 hover:text-[#A63A3A] hover:bg-[#A63A3A]/10 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
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
                <div className="px-4 py-3 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5]/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6E6862] dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span>{t('assetManagement.common.rowsPerPage')}:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 rounded-md border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 font-mono text-xs focus:outline-hidden focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {ASSET_PAGE_SIZE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span>
                            {t('assetManagement.common.showingCount', {
                                from:
                                    totalRecords === 0
                                        ? 0
                                        : (safeCurrentPage - 1) * pageSize + 1,
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
                            className="p-1.5 rounded-md border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label={t('common.previous', 'Previous')}
                        >
                            {isRtl ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .slice(
                                Math.max(0, safeCurrentPage - 3),
                                Math.min(totalPages, safeCurrentPage + 2)
                            )
                            .map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-[28px] h-7 px-2 rounded-md font-mono text-xs font-medium transition-colors cursor-pointer ${
                                        pageNum === safeCurrentPage
                                            ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                            : 'border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                        <button
                            type="button"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 rounded-md border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0D0D0D] dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label={t('common.next', 'Next')}
                        >
                            {isRtl ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* View Details Drawer */}
            {viewingRecord && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <div
                        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-[#E5E0D8] dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] dark:border-slate-800 flex items-center justify-between bg-[#FAF8F5] dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-400 flex items-center justify-center">
                                        <PackageCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                                {t('assetManagement.assets.drawer.viewTitle')}
                                            </h2>
                                            <span
                                                className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-400"
                                                dir="ltr"
                                            >
                                                {viewingRecord.id}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                                            {isRtl
                                                ? viewingRecord.typeNameAr
                                                : viewingRecord.typeNameEn}{' '}
                                            ·{' '}
                                            {isRtl ? viewingRecord.brandAr : viewingRecord.brandEn}
                                        </p>
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
                                {/* Status & Master Lifecycle Status */}
                                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-[#6E6862] dark:text-slate-400">
                                            {t('assetManagement.assets.table.status')}:
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                viewingRecord.status === 'Active'
                                                    ? 'bg-[#265938]/12 text-[#265938] dark:bg-emerald-950/50 dark:text-emerald-400'
                                                    : 'bg-[#857E74]/15 text-[#6E6862] dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    viewingRecord.status === 'Active'
                                                        ? 'bg-[#265938] dark:bg-emerald-400'
                                                        : 'bg-[#857E74]'
                                                }`}
                                            />
                                            {viewingRecord.status === 'Active'
                                                ? t('assetManagement.common.active')
                                                : t('assetManagement.common.inactive')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-[#6E6862] dark:text-slate-300">
                                        <Tag size={13} className="text-[#857E74]" />
                                        <span>
                                            {isRtl
                                                ? viewingRecord.assetStatusNameAr
                                                : viewingRecord.assetStatusNameEn}{' '}
                                            ({viewingRecord.assetStatusId})
                                        </span>
                                    </div>
                                </div>

                                {/* Customer & Company Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.customer')}
                                        </span>
                                        <p className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.customerNameAr
                                                : viewingRecord.customerNameEn}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.company')}
                                        </span>
                                        <p className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.companyNameAr
                                                : viewingRecord.companyNameEn}
                                        </p>
                                    </div>
                                </div>

                                {/* Category & Asset Type Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.category')}
                                        </span>
                                        <p className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.categoryNameAr
                                                : viewingRecord.categoryNameEn}{' '}
                                            <span className="font-mono text-[11px] text-[#857E74]">
                                                ({viewingRecord.categoryId})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.assetType')}
                                        </span>
                                        <p className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.typeNameAr
                                                : viewingRecord.typeNameEn}{' '}
                                            <span className="font-mono text-[11px] text-[#857E74]">
                                                ({viewingRecord.typeId})
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Technical Specs Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.owner')}
                                        </span>
                                        <p className="text-xs font-medium text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.assignedOwnerAr
                                                : viewingRecord.assignedOwnerEn}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('assetManagement.assets.table.brand')}
                                        </span>
                                        <p className="text-xs font-medium text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl ? viewingRecord.brandAr : viewingRecord.brandEn}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#857E74]">
                                            <Hash size={12} />
                                            <span>
                                                {t('assetManagement.assets.table.serialNumber')}
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-semibold text-[#0D0D0D] dark:text-slate-100"
                                            dir="ltr"
                                        >
                                            {viewingRecord.serialNumber}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#857E74]">
                                            <Calendar size={12} />
                                            <span>
                                                {t('assetManagement.assets.table.year')} /{' '}
                                                {t(
                                                    'assetManagement.assets.table.registrationValidity'
                                                )}
                                            </span>
                                        </div>
                                        <p
                                            className="text-xs font-mono font-medium text-[#0D0D0D] dark:text-slate-100"
                                            dir="ltr"
                                        >
                                            {viewingRecord.manufacturerYear} ·{' '}
                                            {viewingRecord.registrationValidityDate}
                                        </p>
                                    </div>
                                </div>

                                {/* Creator & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#857E74]">
                                            <User size={12} />
                                            <span>
                                                {t('assetManagement.assets.table.createdBy')}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-[#0D0D0D] dark:text-slate-100">
                                            {isRtl
                                                ? viewingRecord.creatorNameAr
                                                : viewingRecord.creatorNameEn}
                                        </p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-[#857E74]">
                                            <Mail size={12} />
                                            <span>{t('assetManagement.assets.table.email')}</span>
                                        </div>
                                        <p
                                            className="text-xs font-mono text-[#0D0D0D] dark:text-slate-100 break-all"
                                            dir="ltr"
                                        >
                                            {viewingRecord.creatorEmail || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Linked Templates */}
                                {viewingRecord.templatesEn.length > 0 && (
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                            {t('assetManagement.types.table.templates')}
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(isRtl
                                                ? viewingRecord.templatesAr
                                                : viewingRecord.templatesEn
                                            ).map((tpl, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-200"
                                                >
                                                    <FileText
                                                        size={11}
                                                        className="text-[#857E74]"
                                                    />
                                                    <span>{tpl}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes / Description */}
                                {(viewingRecord.notesEn || viewingRecord.notesAr) && (
                                    <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-1.5">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                            {t('assetManagement.assets.drawer.notesEn')}
                                        </span>
                                        <p className="text-xs text-[#6E6862] dark:text-slate-300 leading-relaxed">
                                            {isRtl
                                                ? viewingRecord.notesAr || viewingRecord.notesEn
                                                : viewingRecord.notesEn}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/50 flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(viewingRecord)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Power size={13} />
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
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Form Drawer */}
            {(isCreateOpen || editingRecord) && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleFormSubmit}
                        className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-s border-[#E5E0D8] dark:border-slate-800 flex flex-col justify-between overflow-y-auto"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] dark:border-slate-800 flex items-center justify-between bg-[#FAF8F5] dark:bg-slate-800/50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                            {editingRecord
                                                ? t('assetManagement.assets.drawer.editTitle')
                                                : t('assetManagement.assets.drawer.createTitle')}
                                        </h2>
                                        <span
                                            className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-400"
                                            dir="ltr"
                                        >
                                            {editingRecord
                                                ? editingRecord.id
                                                : generateNextAssetId(records)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                                        {t('assetManagement.assets.drawer.subtitle')}
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

                            <div className="p-6 space-y-5">
                                {formError && (
                                    <div className="p-3 rounded-lg bg-[#A63A3A]/10 border border-[#A63A3A]/30 text-xs font-medium text-[#A63A3A] flex items-center gap-2">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {/* Datalists for Customer and Company suggestions */}
                                <datalist id="asset-customer-options-list">
                                    {customerFilterOptions.map((c) => (
                                        <option key={c.nameEn} value={c.nameEn} />
                                    ))}
                                </datalist>
                                <datalist id="asset-company-options-list">
                                    {companyFilterOptions.map((c) => (
                                        <option key={c.nameEn} value={c.nameEn} />
                                    ))}
                                </datalist>

                                {/* Customer & Business Assignment */}
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.assets.drawer.sectionAssignment')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.customerEn')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                list="asset-customer-options-list"
                                                value={formState.customerNameEn}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        customerNameEn: val,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.customerEnPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.companyEn')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                list="asset-company-options-list"
                                                value={formState.companyNameEn}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        companyNameEn: val,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.companyEnPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Master Classification (Category, Asset Type, Asset Lifecycle Status) */}
                                <div className="space-y-3 pt-2 border-t border-[#F0ECE4] dark:border-slate-800">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.assets.drawer.sectionClassification')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.category')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <select
                                                value={formState.categoryId}
                                                onChange={(e) =>
                                                    handleDrawerCategoryChange(e.target.value)
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
                                                {t('assetManagement.assets.drawer.assetType')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <select
                                                value={formState.typeId}
                                                onChange={(e) =>
                                                    handleDrawerTypeChange(e.target.value)
                                                }
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                            >
                                                {drawerTypes.map((tp) => (
                                                    <option key={tp.id} value={tp.id}>
                                                        {isRtl ? tp.nameAr : tp.nameEn} ({tp.id})
                                                        {tp.status === 'Inactive'
                                                            ? ` — ${t('assetManagement.common.inactive')}`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t(
                                                    'assetManagement.assets.drawer.assetStatusMaster'
                                                )}
                                            </label>
                                            <select
                                                value={formState.assetStatusId}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        assetStatusId: e.target.value,
                                                    }))
                                                }
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:border-[#2D3F2C]"
                                            >
                                                {drawerAssetStatuses.map((st) => (
                                                    <option key={st.id} value={st.id}>
                                                        {isRtl ? st.nameAr : st.nameEn} ({st.id})
                                                        {st.status === 'Inactive'
                                                            ? ` — ${t('assetManagement.common.inactive')}`
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.table.status')}
                                            </label>
                                            <select
                                                value={formState.status}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        status: e.target.value as
                                                            | 'Active'
                                                            | 'Inactive',
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

                                {/* Technical & Registration Details */}
                                <div className="space-y-3 pt-2 border-t border-[#F0ECE4] dark:border-slate-800">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.assets.drawer.sectionSpecs')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.ownerEn')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formState.assignedOwnerEn}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        assignedOwnerEn: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.ownerEnPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.brandEn')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formState.brandEn}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        brandEn: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.brandEnPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.serialNumber')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={formState.serialNumber}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        serialNumber: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.serialNumberPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.year')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={formState.manufacturerYear}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        manufacturerYear: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.yearPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t(
                                                    'assetManagement.assets.drawer.registrationValidity'
                                                )}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={formState.registrationValidityDate}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        registrationValidityDate: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.registrationValidityPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Creator & Governance */}
                                <div className="space-y-3 pt-2 border-t border-[#F0ECE4] dark:border-slate-800">
                                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400">
                                        {t('assetManagement.assets.drawer.sectionCreator')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.createdByEn')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formState.creatorNameEn}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        creatorNameEn: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.createdByEnPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.email')}{' '}
                                                <span className="text-[#A63A3A]">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                dir="ltr"
                                                value={formState.creatorEmail}
                                                onChange={(e) => {
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        creatorEmail: e.target.value,
                                                    }));
                                                    if (formError) setFormError(null);
                                                }}
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.emailPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C]"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 mb-1.5">
                                                {t('assetManagement.assets.drawer.notesEn')}
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={formState.notesEn}
                                                onChange={(e) =>
                                                    setFormState((prev) => ({
                                                        ...prev,
                                                        notesEn: e.target.value,
                                                    }))
                                                }
                                                placeholder={t(
                                                    'assetManagement.assets.drawer.notesPlaceholder'
                                                )}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#0D0D0D] dark:text-slate-100 focus:outline-hidden focus:bg-white dark:focus:bg-slate-900 focus:border-[#2D3F2C] resize-none"
                                            />
                                        </div>
                                    </div>
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
                                    : t('assetManagement.assets.actions.newAsset')}
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
                                    {t('assetManagement.assets.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1 leading-relaxed">
                                    {t('assetManagement.assets.deleteModal.message', {
                                        id: deletingRecord.id,
                                        serial: deletingRecord.serialNumber,
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
