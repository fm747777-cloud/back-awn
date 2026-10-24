import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FolderKanban,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Building2,
    Users,
    Power,
} from 'lucide-react';

export type DepartmentStatus = 'active' | 'inactive';

export interface CustomerDepartmentItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    nameEn: string;
    nameAr: string;
    managerNameEn: string;
    managerNameAr: string;
    headcount: number;
    budgetSar: number;
    status: DepartmentStatus;
    descriptionEn: string;
    descriptionAr: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_departments_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const INITIAL_DEPARTMENTS: CustomerDepartmentItem[] = [];

export const CustomerDepartmentsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in localStorage
    const [departments, setDepartments] = useState<CustomerDepartmentItem[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
            const clean = parsed.filter((item: any) => item && typeof item === "object" && !(typeof item.id === "string" && /^cst-(dep|srv|deal|cnt|emp|pkg|ast|req|con|inv|own|opt|quo|brn|appr|adt|doc|tck|wfl)-/.test(item.id)));
            return clean;
        }
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_DEPARTMENTS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(departments));
            }
        } catch {
            // ignore
        }
    }, [departments]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DepartmentStatus>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Modals & Drawer
    const [viewingDepartment, setViewingDepartment] = useState<CustomerDepartmentItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0]?.id || '',
        nameEn: '',
        nameAr: '',
        managerNameEn: '',
        managerNameAr: '',
        headcount: 10,
        budgetSar: 500000,
        status: 'active' as DepartmentStatus,
        descriptionEn: '',
        descriptionAr: '',
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        code?: string;
        manager?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered items
    const filteredDepartments = useMemo(() => {
        const query = search.trim().toLowerCase();
        return departments.filter((dept) => {
            const matchesQuery =
                !query ||
                dept.code.toLowerCase().includes(query) ||
                dept.nameEn.toLowerCase().includes(query) ||
                dept.nameAr.includes(search.trim()) ||
                dept.managerNameEn.toLowerCase().includes(query) ||
                dept.managerNameAr.includes(search.trim()) ||
                dept.companyNameEn.toLowerCase().includes(query) ||
                dept.companyNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
            const matchesCompany = companyFilter === 'all' || dept.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesCompany;
        });
    }, [departments, search, statusFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = departments.length;
        const active = departments.filter((d) => d.status === 'active').length;
        const totalHeadcount = departments.reduce((acc, d) => acc + (d.headcount || 0), 0);
        const distinctCompanies = new Set(departments.map((d) => d.companyId)).size;

        return {
            total,
            active,
            totalHeadcount,
            distinctCompanies,
        };
    }, [departments]);

    // Status toggle
    const handleToggleStatus = (id: string) => {
        setDepartments((prev) =>
            prev.map((d) => {
                if (d.id === id) {
                    const newStatus: DepartmentStatus = d.status === 'active' ? 'inactive' : 'active';
                    return { ...d, status: newStatus };
                }
                return d;
            })
        );
        if (viewingDepartment && viewingDepartment.id === id) {
            setViewingDepartment((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.departments.feedback.statusToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = departments.length + 101;
        setEditingDepartmentId(null);
        setFormErrors({});
        setFormData({
            code: `DEP-${nextNum}`,
            companyId: DEMO_COMPANIES[0]?.id || '',
            nameEn: '',
            nameAr: '',
            managerNameEn: '',
            managerNameAr: '',
            headcount: 12,
            budgetSar: 750000,
            status: 'active',
            descriptionEn: '',
            descriptionAr: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerDepartmentItem) => {
        setEditingDepartmentId(item.id);
        setFormErrors({});
        setFormData({
            code: item.code,
            companyId: item.companyId,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            managerNameEn: item.managerNameEn,
            managerNameAr: item.managerNameAr,
            headcount: item.headcount,
            budgetSar: item.budgetSar,
            status: item.status,
            descriptionEn: item.descriptionEn || '',
            descriptionAr: item.descriptionAr || '',
        });
        setViewingDepartment(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveDepartment = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; code?: string; manager?: string } = {};
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.departments.modal.validationName');
        }
        if (!formData.code.trim()) {
            errors.code = t('customer.pages.departments.modal.validationCode');
        }
        if (!formData.managerNameEn.trim() && !formData.managerNameAr.trim()) {
            errors.manager = t('customer.pages.departments.modal.validationManager');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) ||
            DEMO_COMPANIES[0] || { id: formData.companyId || '', nameEn: '—', nameAr: '—', code: 'CMP' };

        if (editingDepartmentId) {
            setDepartments((prev) =>
                prev.map((d) => {
                    if (d.id === editingDepartmentId) {
                        return {
                            ...d,
                            code: formData.code.trim() || d.code,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            nameEn: formData.nameEn.trim() || d.nameEn,
                            nameAr: formData.nameAr.trim() || d.nameAr,
                            managerNameEn: formData.managerNameEn.trim() || d.managerNameEn,
                            managerNameAr: formData.managerNameAr.trim() || d.managerNameAr,
                            headcount: Number(formData.headcount) || 0,
                            budgetSar: Number(formData.budgetSar) || 0,
                            status: formData.status,
                            descriptionEn: formData.descriptionEn.trim(),
                            descriptionAr: formData.descriptionAr.trim(),
                        };
                    }
                    return d;
                })
            );
            showToast(t('customer.pages.departments.feedback.departmentUpdated'));
        } else {
            const newDept: CustomerDepartmentItem = {
                id: `dep-${Date.now()}`,
                code: formData.code.trim() || `DEP-${departments.length + 101}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
                managerNameEn: formData.managerNameEn.trim() || formData.managerNameAr.trim(),
                managerNameAr: formData.managerNameAr.trim() || formData.managerNameEn.trim(),
                headcount: Number(formData.headcount) || 1,
                budgetSar: Number(formData.budgetSar) || 0,
                status: formData.status,
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
                createdAt: new Date().toISOString().split('T')[0],
            };
            setDepartments((prev) => [newDept, ...prev]);
            showToast(t('customer.pages.departments.feedback.departmentAdded'));
        }

        setIsFormModalOpen(false);
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#037F8C] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-xl text-[#037F8C] dark:text-emerald-400">
                            <FolderKanban className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('customer.pages.departments.title')}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-DEP
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {t('customer.pages.departments.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                        <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                        <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                    </span>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.departments.kpis.totalDepartments')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#037F8C] dark:text-emerald-400">
                        <FolderKanban className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.departments.kpis.activeUnits')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.active}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.departments.kpis.totalHeadcount')}
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {kpis.totalHeadcount}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.departments.kpis.companiesCount')}
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {kpis.distinctCompanies}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Building2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('customer.pages.departments.searchPlaceholder')}
                            className="w-full ps-9 pe-9 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{t('customer.pages.departments.statusAll')}</option>
                            <option value="active">{t('customer.pages.departments.statusActive')}</option>
                            <option value="inactive">{t('customer.pages.departments.statusInactive')}</option>
                        </select>

                        {/* Company Filter */}
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#037F8C]"
                        >
                            <option value="all">{t('customer.pages.departments.companyAll')}</option>
                            {DEMO_COMPANIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>

                        {(search || statusFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t('customer.pages.departments.feedback.resetFilters')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs">
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.departments.table.code')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.departments.table.departmentName')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.departments.table.company')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.departments.table.manager')}
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    {t('customer.pages.departments.table.headcount')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.departments.table.budget')}
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    {t('customer.pages.departments.table.status')}
                                </th>
                                <th className="px-4 py-3 text-end font-semibold">
                                    {t('customer.pages.departments.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FolderKanban className="w-8 h-8 text-gray-400" />
                                            <p>{t('customer.pages.departments.feedback.noResults')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map((dept) => (
                                    <tr
                                        key={dept.id}
                                        className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-xs text-gray-900 dark:text-gray-200">
                                            {dept.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? dept.nameAr : dept.nameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {isRtl ? dept.nameEn : dept.nameAr}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[180px]">
                                                    {isRtl ? dept.companyNameAr : dept.companyNameEn}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="font-medium">
                                                {isRtl ? dept.managerNameAr : dept.managerNameEn}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {isRtl ? dept.managerNameEn : dept.managerNameAr}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                <Users className="w-3 h-3" />
                                                <span>{dept.headcount}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                            {dept.budgetSar.toLocaleString()} SAR
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    dept.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {dept.status === 'active' ? (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                ) : (
                                                    <XCircle className="w-3 h-3" />
                                                )}
                                                <span>
                                                    {dept.status === 'active'
                                                        ? t('customer.pages.departments.statusActive')
                                                        : t('customer.pages.departments.statusInactive')}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setViewingDepartment(dept)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={t('customer.pages.departments.table.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Drawer */}
            {viewingDepartment && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slideLeft">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-lg text-[#037F8C] dark:text-emerald-400">
                                    <FolderKanban className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {t('customer.pages.departments.details.title')}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-mono">{viewingDepartment.code}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingDepartment(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-5 space-y-5 flex-1">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                    {isRtl ? viewingDepartment.nameAr : viewingDepartment.nameEn}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isRtl ? viewingDepartment.nameEn : viewingDepartment.nameAr}
                                </p>
                            </div>

                            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.departments.table.company')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {isRtl ? viewingDepartment.companyNameAr : viewingDepartment.companyNameEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.departments.table.manager')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {isRtl ? viewingDepartment.managerNameAr : viewingDepartment.managerNameEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.departments.table.headcount')}</span>
                                    <span className="font-bold text-blue-600">
                                        {viewingDepartment.headcount} {t('customer.pages.departments.details.staffMembers')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.departments.table.budget')}</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                                        {viewingDepartment.budgetSar.toLocaleString()} SAR
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500">{t('customer.pages.departments.table.status')}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            viewingDepartment.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {viewingDepartment.status === 'active'
                                            ? t('customer.pages.departments.statusActive')
                                            : t('customer.pages.departments.statusInactive')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    {t('customer.pages.departments.details.scopeAndObjectives')}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {(isRtl ? viewingDepartment.descriptionAr : viewingDepartment.descriptionEn) ||
                                        t('customer.pages.departments.details.noDescription')}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
                            <button
                                onClick={() => setViewingDepartment(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                            >
                                {t('customer.pages.departments.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleUp">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {editingDepartmentId
                                        ? t('customer.pages.departments.modal.editTitle')
                                        : t('customer.pages.departments.modal.addTitle')}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editingDepartmentId
                                        ? t('customer.pages.departments.modal.editSubtitle')
                                        : t('customer.pages.departments.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDepartment} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.code')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="DEP-101"
                                    />
                                    {formErrors.code && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.company')} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        {DEMO_COMPANIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isRtl ? c.nameAr : c.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="إدارة سلاسل الإمداد"
                                        dir="rtl"
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="Supply Chain Operations"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.managerAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.managerNameAr}
                                        onChange={(e) => setFormData({ ...formData, managerNameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="سعد الغامدي"
                                        dir="rtl"
                                    />
                                    {formErrors.manager && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.manager}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.managerEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.managerNameEn}
                                        onChange={(e) => setFormData({ ...formData, managerNameEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        placeholder="Saad Al-Ghamdi"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.headcount')}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.headcount}
                                        onChange={(e) => setFormData({ ...formData, headcount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.budgetSar')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={50000}
                                        value={formData.budgetSar}
                                        onChange={(e) => setFormData({ ...formData, budgetSar: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as DepartmentStatus })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                    >
                                        <option value="active">{t('customer.pages.departments.statusActive')}</option>
                                        <option value="inactive">{t('customer.pages.departments.statusInactive')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.descAr')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.descriptionAr}
                                        onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.departments.modal.descEn')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.descriptionEn}
                                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#037F8C]"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                                >
                                    {t('customer.pages.departments.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#1E472D] text-white text-sm font-medium transition-colors"
                                >
                                    {t('customer.pages.departments.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
