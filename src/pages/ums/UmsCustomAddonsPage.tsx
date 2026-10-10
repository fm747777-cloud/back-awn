import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Landmark,
    HeartHandshake,
    Briefcase,
    Award,
    CheckCircle2,
    XCircle,
    Users,
    Search,
    X,
    RotateCcw,
    Download,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Power,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Copy,
    Check,
    User,
    Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import {
    loadCustomAddons,
    saveCustomAddons,
    loadEmployees,
    generateNextCustomAddonCode,
    normalizeCustomAddonText,
    getCustomAddonLinkedEmployees,
    checkCustomAddonDeletionEligibility,
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    syncMasterEntityEmployeeCounts,
    UMS_PAGE_SIZE_OPTIONS,
    type CustomAddonRecord,
    type CustomAddonType,
    type EmployeeRecord,
} from './umsMockData';

interface CustomAddonFormData {
    code: string;
    type: CustomAddonType;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    gradeLevel: number;
    status: 'Active' | 'Inactive';
}

const DEFAULT_FORM: CustomAddonFormData = {
    code: '',
    type: 'bank',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    gradeLevel: 1,
    status: 'Active',
};

const TAB_ORDER: CustomAddonType[] = ['bank', 'religion', 'job_title', 'job_grade'];

export const UmsCustomAddonsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const currentUser = useAuthStore((state) => state.user);

    // Master Data State
    const [addons, setAddons] = useState<CustomAddonRecord[]>(() => loadCustomAddons());
    const [employees, setEmployees] = useState<EmployeeRecord[]>(() => loadEmployees());

    // Active Category Tab
    const [activeTab, setActiveTab] = useState<CustomAddonType>('bank');

    // Isolated Per-Tab Filter, Search, Pagination & Selection State
    const [searchByTab, setSearchByTab] = useState<Record<CustomAddonType, string>>({
        bank: '',
        religion: '',
        job_title: '',
        job_grade: '',
    });

    const [statusFilterByTab, setStatusFilterByTab] = useState<
        Record<CustomAddonType, 'ALL' | 'Active' | 'Inactive'>
    >({
        bank: 'ALL',
        religion: 'ALL',
        job_title: 'ALL',
        job_grade: 'ALL',
    });

    const [pageByTab, setPageByTab] = useState<Record<CustomAddonType, number>>({
        bank: 1,
        religion: 1,
        job_title: 1,
        job_grade: 1,
    });

    const [pageSizeByTab, setPageSizeByTab] = useState<Record<CustomAddonType, number>>({
        bank: 10,
        religion: 10,
        job_title: 10,
        job_grade: 10,
    });

    const [selectedIdsByTab, setSelectedIdsByTab] = useState<Record<CustomAddonType, string[]>>({
        bank: [],
        religion: [],
        job_title: [],
        job_grade: [],
    });

    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Drawers & Modals State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState<CustomAddonRecord | null>(null);
    const [viewingAddon, setViewingAddon] = useState<CustomAddonRecord | null>(null);
    const [deletingAddon, setDeletingAddon] = useState<CustomAddonRecord | null>(null);
    const [formData, setFormData] = useState<CustomAddonFormData>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Close drawers/modals on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (deletingAddon) {
                    setDeletingAddon(null);
                } else if (viewingAddon) {
                    setViewingAddon(null);
                } else if (isCreateOpen || editingAddon) {
                    setIsCreateOpen(false);
                    setEditingAddon(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deletingAddon, viewingAddon, isCreateOpen, editingAddon]);

    // Persist helper
    const persistAddons = (updated: CustomAddonRecord[]) => {
        saveCustomAddons(updated);
        syncMasterEntityEmployeeCounts(employees);
        setEmployees(loadEmployees());
        setAddons(loadCustomAddons());
    };

    // Category label helpers
    const getCategoryLabel = (type: CustomAddonType) =>
        t(`ums.customAddons.tabs.${type}`, {
            defaultValue:
                type === 'bank'
                    ? 'Bank'
                    : type === 'religion'
                    ? 'Religion'
                    : type === 'job_title'
                    ? 'Job Title'
                    : 'Job Grade',
        });

    const getCategoryIcon = (type: CustomAddonType, size = 16) => {
        switch (type) {
            case 'bank':
                return <Landmark size={size} />;
            case 'religion':
                return <HeartHandshake size={size} />;
            case 'job_title':
                return <Briefcase size={size} />;
            case 'job_grade':
                return <Award size={size} />;
        }
    };

    // Linked Employees Map by Addon ID (for modeled dependencies: bank, religion, job_grade)
    const linkedEmployeesByAddonId = useMemo(() => {
        const map: Record<string, EmployeeRecord[]> = {};
        for (const addon of addons) {
            map[addon.id] = getCustomAddonLinkedEmployees(addon, employees);
        }
        return map;
    }, [addons, employees]);

    // Records grouped by tab
    const recordsByTab = useMemo(() => {
        const grouped: Record<CustomAddonType, CustomAddonRecord[]> = {
            bank: [],
            religion: [],
            job_title: [],
            job_grade: [],
        };
        for (const item of addons) {
            if (grouped[item.type]) {
                grouped[item.type].push(item);
            }
        }
        // Sort job_grade by gradeLevel ascending, then code
        grouped.job_grade.sort((a, b) => {
            const levelA = a.gradeLevel ?? 99;
            const levelB = b.gradeLevel ?? 99;
            if (levelA !== levelB) return levelA - levelB;
            return a.code.localeCompare(b.code);
        });
        return grouped;
    }, [addons]);

    // Current tab state getters
    const currentTabRecords = recordsByTab[activeTab];
    const searchQuery = searchByTab[activeTab];
    const statusFilter = statusFilterByTab[activeTab];
    const currentPage = pageByTab[activeTab];
    const pageSize = pageSizeByTab[activeTab];
    const selectedIds = selectedIdsByTab[activeTab];

    // Current tab state updaters
    const updateSearchQuery = (val: string) => {
        setSearchByTab((prev) => ({ ...prev, [activeTab]: val }));
        setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
    };

    const updateStatusFilter = (val: 'ALL' | 'Active' | 'Inactive') => {
        setStatusFilterByTab((prev) => ({ ...prev, [activeTab]: val }));
        setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
    };

    const updateCurrentPage = (page: number) => {
        setPageByTab((prev) => ({ ...prev, [activeTab]: page }));
    };

    const updatePageSize = (size: number) => {
        setPageSizeByTab((prev) => ({ ...prev, [activeTab]: size }));
        setPageByTab((prev) => ({ ...prev, [activeTab]: 1 }));
    };

    const updateSelectedIds = (updater: (prevIds: string[]) => string[]) => {
        setSelectedIdsByTab((prev) => ({
            ...prev,
            [activeTab]: updater(prev[activeTab]),
        }));
    };

    // Dynamic KPI calculations for active tab
    const kpis = useMemo(() => {
        const total = currentTabRecords.length;
        const active = currentTabRecords.filter((r) => r.status === 'Active').length;
        const inactive = total - active;

        const uniqueEmpIds = new Set<string>();
        for (const rec of currentTabRecords) {
            const emps = linkedEmployeesByAddonId[rec.id] || [];
            for (const emp of emps) {
                uniqueEmpIds.add(emp.id);
            }
        }
        const extraValue = uniqueEmpIds.size;

        return {
            total,
            active,
            inactive,
            extraValue,
        };
    }, [currentTabRecords, linkedEmployeesByAddonId]);

    // Filtered records for active tab
    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const normQueryAr = normalizeCustomAddonText(searchQuery, 'ar');

        return currentTabRecords.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            if (!query) return true;

            const matchesCode = item.code.toLowerCase().includes(query);
            const matchesNameEn = item.nameEn.toLowerCase().includes(query);
            const matchesNameAr =
                item.nameAr.toLowerCase().includes(query) ||
                (normQueryAr.length > 0 &&
                    normalizeCustomAddonText(item.nameAr, 'ar').includes(normQueryAr));

            if (activeTab === 'religion') {
                return matchesCode || matchesNameEn || matchesNameAr;
            }

            const matchesDescEn = (item.descriptionEn || '').toLowerCase().includes(query);
            const matchesDescAr =
                (item.descriptionAr || '').toLowerCase().includes(query) ||
                (normQueryAr.length > 0 &&
                    normalizeCustomAddonText(item.descriptionAr || '', 'ar').includes(normQueryAr));
            const matchesCreator = (item.createdBy || '').toLowerCase().includes(query);
            const matchesGrade =
                activeTab === 'job_grade' &&
                item.gradeLevel !== undefined &&
                (`rank ${item.gradeLevel}`.includes(query) ||
                    String(item.gradeLevel) === query);

            return (
                matchesCode ||
                matchesNameEn ||
                matchesNameAr ||
                matchesDescEn ||
                matchesDescAr ||
                matchesCreator ||
                matchesGrade
            );
        });
    }, [currentTabRecords, searchQuery, statusFilter, activeTab]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedRecords = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, safePage, pageSize]);

    // Row Selection
    const isAllSelected =
        paginatedRecords.length > 0 &&
        paginatedRecords.every((r) => selectedIds.includes(r.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            updateSelectedIds((prev) =>
                prev.filter((id) => !paginatedRecords.some((r) => r.id === id))
            );
        } else {
            const pageIds = paginatedRecords.map((r) => r.id);
            updateSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleSelect = (id: string) => {
        updateSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Copy Code
    const handleCopyCode = (code: string) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        toast.success(t('common.copiedToClipboard', { defaultValue: `Copied ${code}` }));
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Reset Filters for Active Tab
    const handleResetFilters = () => {
        updateSearchQuery('');
        updateStatusFilter('ALL');
    };

    // Open Create Drawer
    const handleOpenCreate = () => {
        const nextCode = generateNextCustomAddonCode(addons);
        const existingGrades = recordsByTab.job_grade;
        const maxLevel = existingGrades.reduce(
            (max, g) => Math.max(max, g.gradeLevel || 0),
            0
        );
        setEditingAddon(null);
        setFormData({
            ...DEFAULT_FORM,
            code: nextCode,
            type: activeTab,
            gradeLevel: maxLevel + 1,
            status: 'Active',
        });
        setFormErrors({});
        setIsCreateOpen(true);
    };

    // Open Edit Drawer
    const handleOpenEdit = (addon: CustomAddonRecord) => {
        setIsCreateOpen(false);
        setEditingAddon(addon);
        setFormData({
            code: addon.code,
            type: addon.type,
            nameEn: addon.nameEn,
            nameAr: addon.nameAr || '',
            descriptionEn: addon.descriptionEn || '',
            descriptionAr: addon.descriptionAr || '',
            gradeLevel: addon.gradeLevel ?? 1,
            status: addon.status,
        });
        setFormErrors({});
    };

    // Form Validation per Category
    const validateForm = (isEditing = false, currentId?: string): boolean => {
        const errors: Record<string, string> = {};
        const categoryType = formData.type;
        const trimmedEn = formData.nameEn.trim();
        const trimmedAr = formData.nameAr.trim();

        if (categoryType === 'bank') {
            if (!trimmedEn && !trimmedAr) {
                errors.nameEn = t('ums.customAddons.validation.bankNameRequired', {
                    defaultValue: 'Bank name is required.',
                });
            }
        } else if (categoryType === 'religion') {
            if (!trimmedEn) {
                errors.nameEn = t('ums.customAddons.validation.nameEnRequired', {
                    defaultValue: 'English name is required.',
                });
            }
            if (!trimmedAr) {
                errors.nameAr = t('ums.customAddons.validation.nameArRequired', {
                    defaultValue: 'Arabic name is required.',
                });
            }
        } else if (categoryType === 'job_title') {
            if (!trimmedEn) {
                errors.nameEn = t('ums.customAddons.validation.titleEnRequired', {
                    defaultValue: 'English job title is required.',
                });
            }
            if (!trimmedAr) {
                errors.nameAr = t('ums.customAddons.validation.titleArRequired', {
                    defaultValue: 'Arabic job title is required.',
                });
            }
        } else if (categoryType === 'job_grade') {
            if (!trimmedEn) {
                errors.nameEn = t('ums.customAddons.validation.gradeEnRequired', {
                    defaultValue: 'English job grade name is required.',
                });
            }
            if (!trimmedAr) {
                errors.nameAr = t('ums.customAddons.validation.gradeArRequired', {
                    defaultValue: 'Arabic job grade name is required.',
                });
            }
            if (
                !formData.gradeLevel ||
                isNaN(Number(formData.gradeLevel)) ||
                Number(formData.gradeLevel) < 1 ||
                Number(formData.gradeLevel) > 20
            ) {
                errors.gradeLevel = t('ums.customAddons.validation.gradeLevelRequired', {
                    defaultValue: 'A valid grade level/rank (1–20) is required.',
                });
            }
        }

        // Duplicate Check within the same category using normalized text
        const categoryPeers = addons.filter(
            (a) => a.type === categoryType && (!isEditing || a.id !== currentId)
        );

        if (trimmedEn) {
            const normEn = normalizeCustomAddonText(trimmedEn, 'en');
            const duplicateEn = categoryPeers.find(
                (a) => normalizeCustomAddonText(a.nameEn, 'en') === normEn
            );
            if (duplicateEn) {
                errors.nameEn = t('ums.customAddons.validation.duplicateNameEn', {
                    defaultValue: 'A record with this English name already exists in this category.',
                });
            }
        }

        if (trimmedAr) {
            const normAr = normalizeCustomAddonText(trimmedAr, 'ar');
            const duplicateAr = categoryPeers.find(
                (a) =>
                    a.nameAr &&
                    normalizeCustomAddonText(a.nameAr, 'ar') === normAr
            );
            if (duplicateAr) {
                errors.nameAr = t('ums.customAddons.validation.duplicateNameAr', {
                    defaultValue: 'A record with this Arabic name already exists in this category.',
                });
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle Save Create
    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm(false)) return;

        const categoryType = formData.type;
        const resolvedNameEn = formData.nameEn.trim() || formData.nameAr.trim();
        const resolvedNameAr = formData.nameAr.trim() || formData.nameEn.trim();
        const actorName = currentUser?.fullName || 'Karim Wagdi';
        const todayIso = new Date().toISOString().slice(0, 10);

        const newRecord: CustomAddonRecord = {
            id: `add-${Date.now()}`,
            code: formData.code.trim() || generateNextCustomAddonCode(addons),
            type: categoryType,
            nameEn: resolvedNameEn,
            nameAr: resolvedNameAr,
            ...(categoryType !== 'religion'
                ? {
                      descriptionEn: formData.descriptionEn.trim(),
                      descriptionAr: formData.descriptionAr.trim(),
                  }
                : {}),
            ...(categoryType === 'job_grade'
                ? { gradeLevel: Number(formData.gradeLevel) }
                : {}),
            status: formData.status,
            usageCount: 0,
            createdAt: todayIso,
            createdBy: actorName,
            updatedAt: todayIso,
        };

        const updated = [newRecord, ...addons];
        persistAddons(updated);

        const catLabel = getCategoryLabel(categoryType);
        recordUmsAuditEvent({
            action: 'CREATED',
            resource: 'Custom Addon',
            resourceId: newRecord.id,
            resourceName: newRecord.nameEn,
            detailsEn: `Created ${categoryType.replace('_', ' ')} custom addon ${newRecord.code} (${newRecord.nameEn}).`,
            detailsAr: `إضافة سجل جديد (${newRecord.code} - ${newRecord.nameAr}) ضمن فئة ${catLabel}.`,
            newState: `Code: ${newRecord.code} | Name: ${newRecord.nameEn} | Status: ${newRecord.status}`,
        });

        toast.success(
            t('ums.customAddons.feedback.created', {
                defaultValue: `${catLabel} "${isRtl ? newRecord.nameAr : newRecord.nameEn}" created successfully.`,
                category: catLabel,
                name: isRtl ? newRecord.nameAr : newRecord.nameEn,
            })
        );
        setIsCreateOpen(false);
    };

    // Handle Save Edit
    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAddon) return;
        if (!validateForm(true, editingAddon.id)) return;

        const categoryType = editingAddon.type;
        const resolvedNameEn = formData.nameEn.trim() || formData.nameAr.trim();
        const resolvedNameAr = formData.nameAr.trim() || formData.nameEn.trim();
        const todayIso = new Date().toISOString().slice(0, 10);

        const updatedRecord: CustomAddonRecord = {
            ...editingAddon,
            nameEn: resolvedNameEn,
            nameAr: resolvedNameAr,
            ...(categoryType !== 'religion'
                ? {
                      descriptionEn: formData.descriptionEn.trim(),
                      descriptionAr: formData.descriptionAr.trim(),
                  }
                : {}),
            ...(categoryType === 'job_grade'
                ? { gradeLevel: Number(formData.gradeLevel) }
                : {}),
            status: formData.status,
            updatedAt: todayIso,
        };

        const updated = addons.map((a) => (a.id === editingAddon.id ? updatedRecord : a));
        persistAddons(updated);

        const catLabel = getCategoryLabel(categoryType);
        recordUmsAuditEvent({
            action: 'UPDATED',
            resource: 'Custom Addon',
            resourceId: updatedRecord.id,
            resourceName: updatedRecord.nameEn,
            detailsEn: `Updated ${categoryType.replace('_', ' ')} custom addon ${updatedRecord.code} (${updatedRecord.nameEn}).`,
            detailsAr: `تحديث بيانات السجل ${updatedRecord.code} (${updatedRecord.nameAr}) في فئة ${catLabel}.`,
            previousState: `Code: ${editingAddon.code} | Name: ${editingAddon.nameEn} | Status: ${editingAddon.status}`,
            newState: `Code: ${updatedRecord.code} | Name: ${updatedRecord.nameEn} | Status: ${updatedRecord.status}`,
        });

        toast.success(
            t('ums.customAddons.feedback.updated', {
                defaultValue: `${catLabel} "${isRtl ? updatedRecord.nameAr : updatedRecord.nameEn}" updated successfully.`,
                category: catLabel,
                name: isRtl ? updatedRecord.nameAr : updatedRecord.nameEn,
            })
        );
        setEditingAddon(null);
    };

    // Single Record Status Toggle
    const handleToggleStatus = (addon: CustomAddonRecord) => {
        const nextStatus: 'Active' | 'Inactive' =
            addon.status === 'Active' ? 'Inactive' : 'Active';
        const todayIso = new Date().toISOString().slice(0, 10);

        const updated = addons.map((a) =>
            a.id === addon.id ? { ...a, status: nextStatus, updatedAt: todayIso } : a
        );
        persistAddons(updated);

        const actionType = nextStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED';
        const catLabel = getCategoryLabel(addon.type);

        recordUmsAuditEvent({
            action: actionType,
            resource: 'Custom Addon',
            resourceId: addon.id,
            resourceName: addon.nameEn,
            detailsEn: `Changed status of ${addon.type.replace('_', ' ')} ${addon.code} (${addon.nameEn}) to ${nextStatus}.`,
            detailsAr: `تغيير حالة السجل ${addon.code} (${addon.nameAr}) إلى ${nextStatus === 'Active' ? 'نشط' : 'غير نشط'}.`,
        });

        toast.success(
            t('ums.customAddons.feedback.statusChanged', {
                defaultValue: `${catLabel} "${isRtl ? addon.nameAr : addon.nameEn}" is now ${nextStatus}.`,
                category: catLabel,
                name: isRtl ? addon.nameAr : addon.nameEn,
                status:
                    nextStatus === 'Active'
                        ? t('common.active', { defaultValue: 'Active' })
                        : t('common.inactive', { defaultValue: 'Inactive' }),
            })
        );
    };

    // Bulk Status Update
    const handleBulkStatusChange = (targetStatus: 'Active' | 'Inactive') => {
        if (selectedIds.length === 0) return;
        const selectedSet = new Set(selectedIds);
        const todayIso = new Date().toISOString().slice(0, 10);

        const updated = addons.map((a) =>
            selectedSet.has(a.id) ? { ...a, status: targetStatus, updatedAt: todayIso } : a
        );
        persistAddons(updated);

        const catLabel = getCategoryLabel(activeTab);
        recordUmsAuditEvent({
            action: targetStatus === 'Active' ? 'ACTIVATED' : 'DEACTIVATED',
            resource: 'Custom Addon',
            resourceId: 'BULK',
            resourceName: `${catLabel} (${selectedIds.length})`,
            detailsEn: `Bulk updated ${selectedIds.length} ${activeTab.replace('_', ' ')} record(s) to ${targetStatus}.`,
            detailsAr: `تحديث جماعي لحالة ${selectedIds.length} سجل في ${catLabel} إلى ${targetStatus === 'Active' ? 'نشط' : 'غير نشط'}.`,
        });

        toast.success(
            t('ums.customAddons.feedback.bulkStatusChanged', {
                defaultValue: `Updated status for ${selectedIds.length} ${catLabel} record(s) to ${targetStatus}.`,
                count: selectedIds.length,
                category: catLabel,
                status:
                    targetStatus === 'Active'
                        ? t('common.active', { defaultValue: 'Active' })
                        : t('common.inactive', { defaultValue: 'Inactive' }),
            })
        );
        updateSelectedIds(() => []);
    };

    // Delete Confirmation
    const handleConfirmDelete = () => {
        if (!deletingAddon) return;

        const eligibility = checkCustomAddonDeletionEligibility(
            deletingAddon.id,
            addons,
            employees
        );
        if (!eligibility.canDelete) {
            toast.error(isRtl ? eligibility.reasonAr : eligibility.reasonEn);
            return;
        }

        const updated = addons.filter((a) => a.id !== deletingAddon.id);
        persistAddons(updated);
        updateSelectedIds((prev) => prev.filter((id) => id !== deletingAddon.id));

        const catLabel = getCategoryLabel(deletingAddon.type);
        recordUmsAuditEvent({
            action: 'DELETED',
            resource: 'Custom Addon',
            resourceId: deletingAddon.id,
            resourceName: deletingAddon.nameEn,
            detailsEn: `Deleted ${deletingAddon.type.replace('_', ' ')} custom addon ${deletingAddon.code} (${deletingAddon.nameEn}).`,
            detailsAr: `حذف السجل ${deletingAddon.code} (${deletingAddon.nameAr}) من فئة ${catLabel}.`,
            previousState: `Code: ${deletingAddon.code} | Name: ${deletingAddon.nameEn} | Status: ${deletingAddon.status}`,
        });

        toast.success(
            t('ums.customAddons.feedback.deleted', {
                defaultValue: `${catLabel} "${isRtl ? deletingAddon.nameAr : deletingAddon.nameEn}" deleted successfully.`,
                category: catLabel,
                name: isRtl ? deletingAddon.nameAr : deletingAddon.nameEn,
            })
        );
        setDeletingAddon(null);
    };

    // Export CSV (either all filtered records in active tab or selected records)
    const handleExportCsv = (onlySelected = false) => {
        const sourceRecords = onlySelected
            ? currentTabRecords.filter((r) => selectedIds.includes(r.id))
            : filteredRecords;

        if (sourceRecords.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        let headers: string[];
        let rows: Array<Array<string | number>>;

        if (activeTab === 'bank') {
            headers = [
                'Code',
                'Bank Name (EN)',
                'Bank Name (AR)',
                'Description (EN)',
                'Description (AR)',
                'Linked Employees',
                'Created By',
                'Created Date',
                'Status',
            ];
            rows = sourceRecords.map((r) => [
                escapeSafeCsvCell(r.code),
                escapeSafeCsvCell(r.nameEn || ''),
                escapeSafeCsvCell(r.nameAr || ''),
                escapeSafeCsvCell(r.descriptionEn || ''),
                escapeSafeCsvCell(r.descriptionAr || ''),
                (linkedEmployeesByAddonId[r.id] || []).length,
                escapeSafeCsvCell(r.createdBy || 'Karim Wagdi'),
                escapeSafeCsvCell(r.createdAt),
                escapeSafeCsvCell(r.status),
            ]);
        } else if (activeTab === 'religion') {
            headers = [
                'Code',
                'English Name',
                'Arabic Name',
                'Linked Employees',
                'Created Date',
                'Status',
            ];
            rows = sourceRecords.map((r) => [
                escapeSafeCsvCell(r.code),
                escapeSafeCsvCell(r.nameEn || ''),
                escapeSafeCsvCell(r.nameAr || ''),
                (linkedEmployeesByAddonId[r.id] || []).length,
                escapeSafeCsvCell(r.createdAt),
                escapeSafeCsvCell(r.status),
            ]);
        } else if (activeTab === 'job_title') {
            headers = [
                'Code',
                'English Title',
                'Arabic Title',
                'Description (EN)',
                'Description (AR)',
                'Linked Employees',
                'Created Date',
                'Status',
            ];
            rows = sourceRecords.map((r) => [
                escapeSafeCsvCell(r.code),
                escapeSafeCsvCell(r.nameEn || ''),
                escapeSafeCsvCell(r.nameAr || ''),
                escapeSafeCsvCell(r.descriptionEn || ''),
                escapeSafeCsvCell(r.descriptionAr || ''),
                (linkedEmployeesByAddonId[r.id] || []).length,
                escapeSafeCsvCell(r.createdAt),
                escapeSafeCsvCell(r.status),
            ]);
        } else {
            headers = [
                'Code',
                'Grade Name (EN)',
                'Grade Name (AR)',
                'Grade Level / Rank',
                'Description (EN)',
                'Description (AR)',
                'Linked Employees',
                'Created Date',
                'Status',
            ];
            rows = sourceRecords.map((r) => [
                escapeSafeCsvCell(r.code),
                escapeSafeCsvCell(r.nameEn || ''),
                escapeSafeCsvCell(r.nameAr || ''),
                r.gradeLevel ?? '',
                escapeSafeCsvCell(r.descriptionEn || ''),
                escapeSafeCsvCell(r.descriptionAr || ''),
                (linkedEmployeesByAddonId[r.id] || []).length,
                escapeSafeCsvCell(r.createdAt),
                escapeSafeCsvCell(r.status),
            ]);
        }

        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `AWN_CustomAddons_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const catLabel = getCategoryLabel(activeTab);
        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Custom Addon',
            resourceId: activeTab.toUpperCase(),
            resourceName: `${catLabel} Dictionary`,
            detailsEn: `Exported ${sourceRecords.length} ${activeTab.replace('_', ' ')} record(s) to CSV.`,
            detailsAr: `تصدير ${sourceRecords.length} سجل من فئة ${catLabel} إلى ملف CSV.`,
        });

        toast.success(
            t('ums.customAddons.feedback.exported', {
                defaultValue: `Exported ${sourceRecords.length} ${catLabel} record(s) to CSV.`,
                count: sourceRecords.length,
                category: catLabel,
            })
        );
    };

    // Deletion eligibility for currently selected delete target
    const deletionEligibility = useMemo(() => {
        if (!deletingAddon) return null;
        return checkCustomAddonDeletionEligibility(deletingAddon.id, addons, employees);
    }, [deletingAddon, addons, employees]);

    // Linked employees for currently viewed addon
    const viewedLinkedEmployees = useMemo(() => {
        if (!viewingAddon) return [];
        return linkedEmployeesByAddonId[viewingAddon.id] || [];
    }, [viewingAddon, linkedEmployeesByAddonId]);

    return (
        <div className="space-y-6 text-start">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('ums.customAddons.title', { defaultValue: 'Custom Addons Master' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            UMS-ADD
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.customAddons.subtitle', {
                            defaultValue:
                                'Configurable lookup dictionaries for banks, religions, job titles, and job grades.',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => handleExportCsv(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>
                            {t('ums.customAddons.exportCsv', { defaultValue: 'Export CSV' })}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={14} />
                        <span>
                            {t(`ums.customAddons.addButton.${activeTab}`, {
                                defaultValue: `Add ${getCategoryLabel(activeTab)}`,
                            })}
                        </span>
                    </button>
                </div>
            </div>

            {/* Unified 4-Tab Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1.5" role="tablist">
                {TAB_ORDER.map((tabKey) => {
                    const isActive = activeTab === tabKey;
                    const tabCount = recordsByTab[tabKey].length;
                    return (
                        <button
                            key={tabKey}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(tabKey)}
                            className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                    ? 'bg-[#2D3F2C] text-white shadow-xs'
                                    : 'bg-transparent text-[#45413C] hover:bg-[#FAF8F5] hover:text-[#0D0D0D]'
                            }`}
                        >
                            <span className={isActive ? 'text-white' : 'text-[#857E74]'}>
                                {getCategoryIcon(tabKey, 15)}
                            </span>
                            <span>{getCategoryLabel(tabKey)}</span>
                            <span
                                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]'
                                }`}
                            >
                                {tabCount}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Category KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.total`)}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                            {getCategoryIcon(activeTab, 16)}
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.total}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.totalSub`)}
                        </span>
                    </div>
                </div>

                {/* Active */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.active`)}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] border border-[#265938]/20 flex items-center justify-center text-[#265938]">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#265938]">
                            {kpis.active}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.activeSub`)}
                        </span>
                    </div>
                </div>

                {/* Inactive */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.inactive`)}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#857E74]">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.inactive}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.inactiveSub`)}
                        </span>
                    </div>
                </div>

                {/* Category-Specific 4th KPI */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.extra`)}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#C28E3A]">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {kpis.extraValue}
                        </span>
                        <span className="text-[11px] font-normal text-[#6E6862]">
                            {t(`ums.customAddons.kpi.${activeTab}.extraSub`)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search, Filter & Bulk Actions Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none start-3"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => updateSearchQuery(e.target.value)}
                            placeholder={t(`ums.customAddons.searchPlaceholder.${activeTab}`)}
                            className="w-full ps-9 pe-8 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => updateSearchQuery('')}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] p-0.5 rounded cursor-pointer"
                                title={t('common.clear', { defaultValue: 'Clear' })}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status Filter Segmented Control */}
                        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg">
                            {(['ALL', 'Active', 'Inactive'] as const).map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => updateStatusFilter(status)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                        statusFilter === status
                                            ? 'bg-white text-[#0D0D0D] shadow-2xs border border-[#E5E0D8]'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {status === 'ALL'
                                        ? t('common.all', { defaultValue: 'All' })
                                        : status === 'Active'
                                        ? t('common.active', { defaultValue: 'Active' })
                                        : t('common.inactive', { defaultValue: 'Inactive' })}
                                </button>
                            ))}
                        </div>

                        {/* Reset Filters */}
                        {(searchQuery || statusFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.reset', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs">
                        <span className="font-semibold text-[#2D3F2C]">
                            {t('ums.customAddons.bulk.selectedCount', {
                                defaultValue: `${selectedIds.length} record(s) selected`,
                                count: selectedIds.length,
                            })}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Active')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EAF3EC] text-[#265938] border border-[#265938]/20 font-semibold hover:bg-[#EAF3EC]/80 transition-colors cursor-pointer"
                            >
                                <CheckCircle2 size={12} />
                                <span>
                                    {t('ums.customAddons.bulk.activateSelected', {
                                        defaultValue: 'Activate Selected',
                                    })}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleBulkStatusChange('Inactive')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#45413C] border border-[#E5E0D8] font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Power size={12} />
                                <span>
                                    {t('ums.customAddons.bulk.deactivateSelected', {
                                        defaultValue: 'Deactivate Selected',
                                    })}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleExportCsv(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#2D3F2C] border border-[#E5E0D8] font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Download size={12} />
                                <span>
                                    {t('ums.customAddons.bulk.exportSelected', {
                                        defaultValue: 'Export Selected',
                                    })}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => updateSelectedIds(() => [])}
                                className="px-2 py-1 text-xs text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                {t('ums.customAddons.bulk.clearSelection', {
                                    defaultValue: 'Clear Selection',
                                })}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Category-Specific Data Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="border-b border-[#E5E0D8] bg-[#FAF8F5] text-[#6E6862] font-semibold">
                                <th className="w-10 px-4 py-3 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        aria-label={t('common.selectAll', { defaultValue: 'Select All' })}
                                        className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 text-start">
                                    {t('ums.customAddons.columns.code', { defaultValue: 'Code' })}
                                </th>

                                {/* Category-specific primary name columns */}
                                {activeTab === 'bank' && (
                                    <>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.bankName', {
                                                defaultValue: 'Bank Name',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.description', {
                                                defaultValue: 'Description',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.linkedEmployees', {
                                                defaultValue: 'Linked Employees',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.createdBy', {
                                                defaultValue: 'Created By',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.createdAt', {
                                                defaultValue: 'Created Date',
                                            })}
                                        </th>
                                    </>
                                )}

                                {activeTab === 'religion' && (
                                    <>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.nameEn', {
                                                defaultValue: 'English Name',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.nameAr', {
                                                defaultValue: 'Arabic Name',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.linkedEmployees', {
                                                defaultValue: 'Linked Employees',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.createdAt', {
                                                defaultValue: 'Created Date',
                                            })}
                                        </th>
                                    </>
                                )}

                                {activeTab === 'job_title' && (
                                    <>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.titleEn', {
                                                defaultValue: 'English Title',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.titleAr', {
                                                defaultValue: 'Arabic Title',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.description', {
                                                defaultValue: 'Description',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.linkedEmployees', {
                                                defaultValue: 'Linked Employees',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.createdAt', {
                                                defaultValue: 'Created Date',
                                            })}
                                        </th>
                                    </>
                                )}

                                {activeTab === 'job_grade' && (
                                    <>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.gradeName', {
                                                defaultValue: 'Job Grade',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.gradeLevel', {
                                                defaultValue: 'Grade Rank / Level',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.description', {
                                                defaultValue: 'Description',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.linkedEmployees', {
                                                defaultValue: 'Linked Employees',
                                            })}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t('ums.customAddons.columns.createdAt', {
                                                defaultValue: 'Created Date',
                                            })}
                                        </th>
                                    </>
                                )}

                                <th className="px-4 py-3 text-start">
                                    {t('ums.customAddons.columns.status', { defaultValue: 'Status' })}
                                </th>
                                <th className="px-4 py-3 text-end">
                                    {t('ums.customAddons.columns.actions', { defaultValue: 'Actions' })}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EFECE6] text-[#45413C]">
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={activeTab === 'religion' ? 8 : 9}
                                        className="px-4 py-12 text-center text-[#857E74]"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto mb-2.5 text-[#857E74]">
                                            {getCategoryIcon(activeTab, 20)}
                                        </div>
                                        <p className="font-semibold text-[#0D0D0D]">
                                            {searchQuery || statusFilter !== 'ALL'
                                                ? t('ums.customAddons.empty.noSearchMatch', {
                                                      category: getCategoryLabel(activeTab),
                                                  })
                                                : t('ums.customAddons.empty.noRecordsYet', {
                                                      category: getCategoryLabel(activeTab),
                                                  })}
                                        </p>
                                        {(searchQuery || statusFilter !== 'ALL') && (
                                            <button
                                                type="button"
                                                onClick={handleResetFilters}
                                                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] cursor-pointer"
                                            >
                                                <RotateCcw size={12} />
                                                <span>{t('common.reset', { defaultValue: 'Reset Filters' })}</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    const linkedEmployees = linkedEmployeesByAddonId[item.id] || [];
                                    const linkedCount = linkedEmployees.length;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-[#FAF8F5]/60 transition-colors ${
                                                isSelected ? 'bg-[#FAF8F5]' : ''
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="w-10 px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(item.id)}
                                                    aria-label={`Select ${item.nameEn}`}
                                                    className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                />
                                            </td>

                                            {/* Code */}
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-semibold text-[#2D3F2C]"
                                                        dir="ltr"
                                                    >
                                                        {item.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCode(item.code)}
                                                        className="text-[#857E74] hover:text-[#0D0D0D] p-0.5 rounded cursor-pointer"
                                                        title={t('common.copy', { defaultValue: 'Copy' })}
                                                    >
                                                        {copiedCode === item.code ? (
                                                            <Check size={12} className="text-[#265938]" />
                                                        ) : (
                                                            <Copy size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* BANK COLUMNS */}
                                            {activeTab === 'bank' && (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#0D0D0D]">
                                                                {isRtl ? item.nameAr || item.nameEn : item.nameEn}
                                                            </span>
                                                            {item.nameAr && item.nameAr !== item.nameEn && (
                                                                <span className="text-[11px] text-[#6E6862]">
                                                                    {isRtl ? item.nameEn : item.nameAr}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs">
                                                        {item.descriptionEn || item.descriptionAr ? (
                                                            <span className="text-xs text-[#45413C] line-clamp-2">
                                                                {isRtl
                                                                    ? item.descriptionAr || item.descriptionEn
                                                                    : item.descriptionEn || item.descriptionAr}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] italic text-[#857E74]">
                                                                {t('ums.customAddons.badges.noDescription')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingAddon(item)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                                                        >
                                                            <Users size={12} className="text-[#857E74]" />
                                                            <span>
                                                                {linkedCount > 0
                                                                    ? t('ums.customAddons.badges.employeesCount', {
                                                                          count: linkedCount,
                                                                      })
                                                                    : t('ums.customAddons.badges.noEmployees')}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="inline-flex items-center gap-1.5 text-xs text-[#45413C]">
                                                            <User size={12} className="text-[#857E74]" />
                                                            <span>{item.createdBy || 'Karim Wagdi'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#6E6862] whitespace-nowrap">
                                                        {item.createdAt}
                                                    </td>
                                                </>
                                            )}

                                            {/* RELIGION COLUMNS */}
                                            {activeTab === 'religion' && (
                                                <>
                                                    <td className="px-4 py-3 font-bold text-[#0D0D0D]">
                                                        {item.nameEn}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-[#2D3F2C]" dir="rtl">
                                                        {item.nameAr}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingAddon(item)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                                                        >
                                                            <Users size={12} className="text-[#857E74]" />
                                                            <span>
                                                                {linkedCount > 0
                                                                    ? t('ums.customAddons.badges.employeesCount', {
                                                                          count: linkedCount,
                                                                      })
                                                                    : t('ums.customAddons.badges.noEmployees')}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#6E6862] whitespace-nowrap">
                                                        {item.createdAt}
                                                    </td>
                                                </>
                                            )}

                                            {/* JOB TITLE COLUMNS */}
                                            {activeTab === 'job_title' && (
                                                <>
                                                    <td className="px-4 py-3 font-bold text-[#0D0D0D]">
                                                        {item.nameEn}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-[#2D3F2C]" dir="rtl">
                                                        {item.nameAr}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs">
                                                        {item.descriptionEn || item.descriptionAr ? (
                                                            <span className="text-xs text-[#45413C] line-clamp-2">
                                                                {isRtl
                                                                    ? item.descriptionAr || item.descriptionEn
                                                                    : item.descriptionEn || item.descriptionAr}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] italic text-[#857E74]">
                                                                {t('ums.customAddons.badges.noDescription')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingAddon(item)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                                                        >
                                                            <Users size={12} className="text-[#857E74]" />
                                                            <span>
                                                                {linkedCount > 0
                                                                    ? t('ums.customAddons.badges.employeesCount', {
                                                                          count: linkedCount,
                                                                      })
                                                                    : t('ums.customAddons.badges.noEmployees')}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#6E6862] whitespace-nowrap">
                                                        {item.createdAt}
                                                    </td>
                                                </>
                                            )}

                                            {/* JOB GRADE COLUMNS */}
                                            {activeTab === 'job_grade' && (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#0D0D0D]">
                                                                {isRtl ? item.nameAr : item.nameEn}
                                                            </span>
                                                            <span className="text-[11px] text-[#6E6862]">
                                                                {isRtl ? item.nameEn : item.nameAr}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C28E3A]" />
                                                            <span>
                                                                {t('ums.customAddons.badges.rankLevel', {
                                                                    level: item.gradeLevel ?? 1,
                                                                })}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-xs">
                                                        {item.descriptionEn || item.descriptionAr ? (
                                                            <span className="text-xs text-[#45413C] line-clamp-2">
                                                                {isRtl
                                                                    ? item.descriptionAr || item.descriptionEn
                                                                    : item.descriptionEn || item.descriptionAr}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] italic text-[#857E74]">
                                                                {t('ums.customAddons.badges.noDescription')}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingAddon(item)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] hover:bg-[#EFECE6] cursor-pointer transition-colors"
                                                        >
                                                            <Users size={12} className="text-[#857E74]" />
                                                            <span>
                                                                {linkedCount > 0
                                                                    ? t('ums.customAddons.badges.employeesCount', {
                                                                          count: linkedCount,
                                                                      })
                                                                    : t('ums.customAddons.badges.noEmployees')}
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#6E6862] whitespace-nowrap">
                                                        {item.createdAt}
                                                    </td>
                                                </>
                                            )}

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                                                        item.status === 'Active'
                                                            ? 'bg-[#EAF3EC] text-[#265938] border-[#265938]/20 hover:bg-[#EAF3EC]/80'
                                                            : 'bg-[#FAF8F5] text-[#857E74] border-[#E5E0D8] hover:bg-[#E5E0D8]/40'
                                                    }`}
                                                    title={t('common.toggleStatus', {
                                                        defaultValue: 'Click to toggle status',
                                                    })}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            item.status === 'Active'
                                                                ? 'bg-[#265938]'
                                                                : 'bg-[#857E74]'
                                                        }`}
                                                    />
                                                    <span>
                                                        {item.status === 'Active'
                                                            ? t('common.active', { defaultValue: 'Active' })
                                                            : t('common.inactive', { defaultValue: 'Inactive' })}
                                                    </span>
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-end whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingAddon(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t('common.view', { defaultValue: 'View Details' })}
                                                    >
                                                        <Eye size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                                        title={t('common.edit', { defaultValue: 'Edit' })}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(item)}
                                                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                                            item.status === 'Active'
                                                                ? 'text-[#265938] hover:bg-[#EAF3EC]'
                                                                : 'text-[#857E74] hover:bg-[#FAF8F5]'
                                                        }`}
                                                        title={t('common.toggleStatus', {
                                                            defaultValue: 'Toggle Status',
                                                        })}
                                                    >
                                                        <Power size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingAddon(item)}
                                                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                                                        title={t('common.delete', { defaultValue: 'Delete' })}
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

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E0D8] bg-[#FAF8F5]/50 text-xs text-[#6E6862]">
                    <div className="flex items-center gap-2">
                        <span>{t('common.rowsPerPage', { defaultValue: 'Rows per page:' })}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => updatePageSize(Number(e.target.value))}
                            aria-label={t('common.rowsPerPage', { defaultValue: 'Rows per page:' })}
                            className="px-2 py-1 rounded bg-white border border-[#E5E0D8] text-xs text-[#45413C] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                        >
                            {UMS_PAGE_SIZE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <span className="ms-2">
                            {t('common.showingPagination', {
                                defaultValue: `Showing ${
                                    filteredRecords.length === 0 ? 0 : (safePage - 1) * pageSize + 1
                                } - ${Math.min(
                                    safePage * pageSize,
                                    filteredRecords.length
                                )} of ${filteredRecords.length}`,
                                start:
                                    filteredRecords.length === 0
                                        ? 0
                                        : (safePage - 1) * pageSize + 1,
                                end: Math.min(safePage * pageSize, filteredRecords.length),
                                total: filteredRecords.length,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => updateCurrentPage(Math.max(1, safePage - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.prev', { defaultValue: 'Previous Page' })}
                        >
                            <ChevronLeft size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>

                        <span className="px-2 font-semibold text-[#0D0D0D]">
                            {safePage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => updateCurrentPage(Math.min(totalPages, safePage + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-md border border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            title={t('common.next', { defaultValue: 'Next Page' })}
                        >
                            <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================================ */}
            {/* SLIDE-OVER DRAWER FOR ADD & EDIT                                             */}
            {/* ============================================================================ */}
            {(isCreateOpen || editingAddon) && (
                <div
                    className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="w-full max-w-lg bg-white h-full border-s border-[#E5E0D8] shadow-2xl flex flex-col justify-between overflow-y-auto">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/60 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] text-white flex items-center justify-center shrink-0">
                                    {getCategoryIcon(formData.type, 18)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isCreateOpen
                                                ? t(`ums.customAddons.addButton.${formData.type}`)
                                                : t(`ums.customAddons.editTitle.${formData.type}`)}
                                        </h2>
                                        <span
                                            className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-white text-[#2D3F2C] border border-[#E5E0D8]"
                                            dir="ltr"
                                        >
                                            {formData.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {isCreateOpen
                                            ? t('ums.customAddons.form.drawerSubtitleCreate', {
                                                  category: getCategoryLabel(formData.type),
                                              })
                                            : t('ums.customAddons.form.drawerSubtitleEdit', {
                                                  code: formData.code,
                                                  category: getCategoryLabel(formData.type),
                                              })}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setEditingAddon(null);
                                }}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Form Body */}
                        <form
                            onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit}
                            className="p-6 space-y-5 flex-1"
                        >
                            {/* Automatically Generated Code */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                    {t('ums.customAddons.form.code', {
                                        defaultValue: 'Addon Code (Auto-generated)',
                                    })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono font-semibold text-[#6E6862] cursor-not-allowed"
                                />
                            </div>

                            {/* Category 1: BANK FORM */}
                            {formData.type === 'bank' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.bankNameEn')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.bankNameEnPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameEn
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameEn && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameEn}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.bankNameAr')}
                                        </label>
                                        <input
                                            type="text"
                                            dir="rtl"
                                            value={formData.nameAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.bankNameArPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameAr
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameAr && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameAr}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.bankDescEnPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            dir="rtl"
                                            value={formData.descriptionAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.bankDescArPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Category 2: RELIGION FORM (No description fields - strictly relevant fields only) */}
                            {formData.type === 'religion' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.religionNameEn')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.religionNameEnPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameEn
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameEn && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameEn}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.religionNameAr')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            dir="rtl"
                                            value={formData.nameAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.religionNameArPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameAr
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameAr && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameAr}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Category 3: JOB TITLE FORM */}
                            {formData.type === 'job_title' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.jobTitleEn')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobTitleEnPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameEn
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameEn && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameEn}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.jobTitleAr')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            dir="rtl"
                                            value={formData.nameAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobTitleArPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameAr
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameAr && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameAr}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobTitleDescEnPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            dir="rtl"
                                            value={formData.descriptionAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobTitleDescArPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Category 4: JOB GRADE FORM */}
                            {formData.type === 'job_grade' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.jobGradeEn')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobGradeEnPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameEn
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameEn && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameEn}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.jobGradeAr')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            dir="rtl"
                                            value={formData.nameAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    nameAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobGradeArPlaceholder'
                                            )}
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.nameAr
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        {formErrors.nameAr && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.nameAr}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.gradeLevel')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={formData.gradeLevel}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    gradeLevel: Number(e.target.value),
                                                }))
                                            }
                                            className={`w-full px-3 py-2 rounded-lg bg-white border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] ${
                                                formErrors.gradeLevel
                                                    ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                    : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                            }`}
                                        />
                                        <p className="text-[11px] text-[#857E74] mt-1">
                                            {t('ums.customAddons.form.gradeLevelHint')}
                                        </p>
                                        {formErrors.gradeLevel && (
                                            <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                                {formErrors.gradeLevel}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionEn: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobGradeDescEnPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            dir="rtl"
                                            value={formData.descriptionAr}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    descriptionAr: e.target.value,
                                                }))
                                            }
                                            placeholder={t(
                                                'ums.customAddons.form.jobGradeDescArPlaceholder'
                                            )}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Status Radio Controls */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] mb-1.5">
                                    {t('ums.customAddons.form.status', { defaultValue: 'Status' })}
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="addonStatus"
                                            value="Active"
                                            checked={formData.status === 'Active'}
                                            onChange={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: 'Active',
                                                }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                        />
                                        <span>{t('common.active', { defaultValue: 'Active' })}</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-[#45413C] cursor-pointer">
                                        <input
                                            type="radio"
                                            name="addonStatus"
                                            value="Inactive"
                                            checked={formData.status === 'Inactive'}
                                            onChange={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: 'Inactive',
                                                }))
                                            }
                                            className="text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                        />
                                        <span>
                                            {t('common.inactive', { defaultValue: 'Inactive' })}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="flex items-center justify-end gap-2 pt-5 border-t border-[#E5E0D8]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setEditingAddon(null);
                                    }}
                                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                >
                                    {t('common.cancel', { defaultValue: 'Cancel' })}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                                >
                                    {isCreateOpen
                                        ? t('common.create', { defaultValue: 'Create' })
                                        : t('common.saveChanges', { defaultValue: 'Save Changes' })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================================ */}
            {/* VIEW DETAILS MODAL / DRAWER                                                  */}
            {/* ============================================================================ */}
            {viewingAddon && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C]">
                                    {getCategoryIcon(viewingAddon.type, 18)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {t(`ums.customAddons.viewTitle.${viewingAddon.type}`)}
                                        </h2>
                                        <span
                                            className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]"
                                            dir="ltr"
                                        >
                                            {viewingAddon.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {viewingAddon.nameEn} · {viewingAddon.nameAr}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewingAddon(null)}
                                className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Metadata Summary Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 text-xs">
                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.customAddons.details.category')}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                        {getCategoryLabel(viewingAddon.type)}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.customAddons.columns.status')}
                                    </span>
                                    <span
                                        className={`inline-block font-semibold mt-0.5 ${
                                            viewingAddon.status === 'Active'
                                                ? 'text-[#265938]'
                                                : 'text-[#857E74]'
                                        }`}
                                    >
                                        {viewingAddon.status === 'Active'
                                            ? t('common.active', { defaultValue: 'Active' })
                                            : t('common.inactive', { defaultValue: 'Inactive' })}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.customAddons.details.createdBy')}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                        {viewingAddon.createdBy || 'Karim Wagdi'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[#857E74] block">
                                        {t('ums.customAddons.details.createdAt')}
                                    </span>
                                    <span className="font-mono font-medium text-[#45413C] mt-0.5 flex items-center gap-1">
                                        <Calendar size={12} className="text-[#857E74]" />
                                        {viewingAddon.createdAt}
                                    </span>
                                </div>
                            </div>

                            {/* Bilingual Names */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[#857E74] block mb-1">
                                        {viewingAddon.type === 'job_title'
                                            ? t('ums.customAddons.columns.titleEn')
                                            : t('ums.customAddons.columns.nameEn')}
                                    </span>
                                    <span className="font-bold text-[#0D0D0D]">
                                        {viewingAddon.nameEn}
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]" dir="rtl">
                                    <span className="text-[#857E74] block mb-1">
                                        {viewingAddon.type === 'job_title'
                                            ? t('ums.customAddons.columns.titleAr')
                                            : t('ums.customAddons.columns.nameAr')}
                                    </span>
                                    <span className="font-bold text-[#0D0D0D]">
                                        {viewingAddon.nameAr}
                                    </span>
                                </div>
                            </div>

                            {/* Grade Level for job_grade */}
                            {viewingAddon.type === 'job_grade' && (
                                <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#45413C]">
                                        {t('ums.customAddons.columns.gradeLevel')}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono font-semibold bg-white text-[#2D3F2C] border border-[#E5E0D8]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#C28E3A]" />
                                        {t('ums.customAddons.badges.rankLevel', {
                                            level: viewingAddon.gradeLevel ?? 1,
                                        })}
                                    </span>
                                </div>
                            )}

                            {/* Descriptions (only for bank, job_title, job_grade) */}
                            {viewingAddon.type !== 'religion' && (
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionEn')}
                                        </h3>
                                        <p className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                            {viewingAddon.descriptionEn ||
                                                t('ums.customAddons.badges.noDescription')}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-semibold text-[#45413C] mb-1">
                                            {t('ums.customAddons.form.descriptionAr')}
                                        </h3>
                                        <p
                                            dir="rtl"
                                            className="text-xs text-[#6E6862] bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]"
                                        >
                                            {viewingAddon.descriptionAr ||
                                                t('ums.customAddons.badges.noDescription')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Referencing Employees Section (for modeled categories: bank, religion, job_grade, job_title) */}
                            {(viewingAddon.type === 'bank' ||
                                viewingAddon.type === 'religion' ||
                                viewingAddon.type === 'job_grade' ||
                                viewingAddon.type === 'job_title') && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold text-[#0D0D0D]">
                                            {t('ums.customAddons.details.linkedEmployeesTitle')}{' '}
                                            <span className="text-[#265938]">
                                                ({viewedLinkedEmployees.length})
                                            </span>
                                        </h3>
                                    </div>

                                    {viewedLinkedEmployees.length === 0 ? (
                                        <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center text-xs text-[#857E74]">
                                            {t('ums.customAddons.details.noLinkedEmployees')}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-[#EFECE6] border border-[#E5E0D8] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                            {viewedLinkedEmployees.map((emp) => (
                                                <div
                                                    key={emp.id}
                                                    className="flex items-center justify-between p-3 bg-white text-xs"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center font-bold text-[11px]">
                                                            {emp.nameEn.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-[#0D0D0D] block">
                                                                {isRtl ? emp.nameAr : emp.nameEn}
                                                            </span>
                                                            <span className="text-[11px] text-[#6E6862]">
                                                                {emp.code} · {isRtl ? emp.departmentNameAr || emp.departmentName : emp.departmentName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                            emp.status === 'Active'
                                                                ? 'bg-[#EAF3EC] text-[#265938]'
                                                                : 'bg-[#FAF8F5] text-[#857E74]'
                                                        }`}
                                                    >
                                                        {t(`ums.employees.statuses.${emp.status}`, { defaultValue: emp.status })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5]/40">
                            <button
                                type="button"
                                onClick={() => {
                                    const target = viewingAddon;
                                    setViewingAddon(null);
                                    handleOpenEdit(target);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#2D3F2C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <Pencil size={13} />
                                <span>{t('common.edit', { defaultValue: 'Edit' })}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewingAddon(null)}
                                className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================================ */}
            {/* DELETE CONFIRMATION & DEPENDENCY PROTECTION DIALOG                           */}
            {/* ============================================================================ */}
            {deletingAddon && deletionEligibility && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-md p-6">
                        {!deletionEligibility.canDelete ? (
                            // Blocked Deletion View
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <ShieldAlert size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t(`ums.customAddons.deleteBlockedTitle.${deletingAddon.type}`)}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4 leading-relaxed">
                                    {isRtl
                                        ? deletionEligibility.reasonAr
                                        : deletionEligibility.reasonEn}
                                </p>

                                {/* Linked Employees Preview */}
                                {deletionEligibility.linkedEmployees.length > 0 && (
                                    <div className="mb-4 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] max-h-28 overflow-y-auto space-y-1">
                                        {deletionEligibility.linkedEmployees.map((emp) => (
                                            <div
                                                key={emp.id}
                                                className="flex items-center justify-between text-[11px] text-[#45413C]"
                                            >
                                                <span className="font-semibold">
                                                    {isRtl ? emp.nameAr : emp.nameEn}
                                                </span>
                                                <span className="font-mono text-[#857E74]">
                                                    {emp.code}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-2 pt-3 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingAddon(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.close', { defaultValue: 'Close' })}
                                    </button>
                                    {deletingAddon.status === 'Active' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleToggleStatus(deletingAddon);
                                                setDeletingAddon(null);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                                        >
                                            {t('ums.customAddons.deleteModal.deactivateAlternative')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Allowed Deletion Confirmation
                            <div>
                                <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-3">
                                    <Trash2 size={20} />
                                </div>
                                <h2 className="text-base font-bold text-[#0D0D0D] text-center mb-1">
                                    {t(`ums.customAddons.deleteTitle.${deletingAddon.type}`)}
                                </h2>
                                <p className="text-xs text-[#6E6862] text-center mb-4 leading-relaxed">
                                    {t('ums.customAddons.deleteModal.confirmDesc', {
                                        category: getCategoryLabel(deletingAddon.type),
                                    })}
                                    <span className="block font-bold text-[#0D0D0D] mt-2">
                                        {deletingAddon.code} —{' '}
                                        {isRtl
                                            ? deletingAddon.nameAr || deletingAddon.nameEn
                                            : deletingAddon.nameEn}
                                    </span>
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E0D8]">
                                    <button
                                        type="button"
                                        onClick={() => setDeletingAddon(null)}
                                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('common.cancel', { defaultValue: 'Cancel' })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        {t('common.delete', { defaultValue: 'Delete' })}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsCustomAddonsPage;
