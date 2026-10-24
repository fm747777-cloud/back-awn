import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Layers,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Clock,
    Tag,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';

export type CustomerServiceStatus = 'active' | 'inactive';

export type CustomerServiceCategory =
    | 'government_affairs'
    | 'workforce_licensing'
    | 'telematics_logistics'
    | 'compliance_audit'
    | 'it_infrastructure';

export interface CustomerServiceItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    category: CustomerServiceCategory;
    descriptionEn: string;
    descriptionAr: string;
    slaHours: number;
    status: CustomerServiceStatus;
    defaultPrice?: number;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_services_v1';

const INITIAL_SERVICES: CustomerServiceItem[] = [];

const CATEGORIES: { id: CustomerServiceCategory; labelEn: string; labelAr: string }[] = [
    { id: 'government_affairs', labelEn: 'Government Affairs', labelAr: 'الشؤون الحكومية' },
    { id: 'workforce_licensing', labelEn: 'Workforce & Licensing', labelAr: 'الكوادر والتراخيص' },
    { id: 'telematics_logistics', labelEn: 'Telematics & Logistics', labelAr: 'التتبع واللوجستيات' },
    { id: 'compliance_audit', labelEn: 'Compliance & Audit', labelAr: 'الامتثال والتدقيق' },
    { id: 'it_infrastructure', labelEn: 'IT & Infrastructure', labelAr: 'تقنية المعلومات والبنية التحتية' },
];

export const CustomerServicesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_services_v1
    const [services, setServices] = useState<CustomerServiceItem[]>(() => {
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
        return INITIAL_SERVICES;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
            }
        } catch {
            // ignore
        }
    }, [services]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerServiceStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | CustomerServiceCategory>('all');

    // Drawer & Modal States
    const [viewingService, setViewingService] = useState<CustomerServiceItem | null>(null);
    const [editingService, setEditingService] = useState<CustomerServiceItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        nameEn: '',
        nameAr: '',
        category: 'government_affairs' as CustomerServiceCategory,
        descriptionEn: '',
        descriptionAr: '',
        slaHours: 24,
        status: 'active' as CustomerServiceStatus,
        defaultPrice: 2000,
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered Services
    const filteredServices = useMemo(() => {
        return services.filter((srv) => {
            const matchesSearch =
                !search.trim() ||
                srv.code.toLowerCase().includes(search.toLowerCase()) ||
                srv.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                srv.nameAr.includes(search) ||
                srv.descriptionEn.toLowerCase().includes(search.toLowerCase()) ||
                srv.descriptionAr.includes(search);

            const matchesStatus = statusFilter === 'all' || srv.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || srv.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [services, search, statusFilter, categoryFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = services.length;
        const activeCount = services.filter((s) => s.status === 'active').length;
        const inactiveCount = services.filter((s) => s.status === 'inactive').length;
        const uniqueCategories = new Set(services.map((s) => s.category)).size;

        return {
            total,
            activeCount,
            inactiveCount,
            categoryCount: uniqueCategories,
        };
    }, [services]);

    // Format currency helper
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Category label helper
    const getCategoryLabel = (cat: CustomerServiceCategory) => {
        const found = CATEGORIES.find((c) => c.id === cat);
        if (!found) return cat;
        return isRtl ? found.labelAr : found.labelEn;
    };

    // Toggle Active / Inactive
    const handleToggleStatus = (id: string) => {
        setServices((prev) =>
            prev.map((s) => {
                if (s.id === id) {
                    const nextStatus: CustomerServiceStatus = s.status === 'active' ? 'inactive' : 'active';
                    return { ...s, status: nextStatus };
                }
                return s;
            })
        );
        if (viewingService?.id === id) {
            setViewingService((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.services.feedback.statusToggled'));
    };

    // Open Edit modal
    const handleStartEdit = (item: CustomerServiceItem) => {
        setEditingService(item);
        setFormData({
            code: item.code,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            category: item.category,
            descriptionEn: item.descriptionEn,
            descriptionAr: item.descriptionAr,
            slaHours: item.slaHours,
            status: item.status,
            defaultPrice: item.defaultPrice || 0,
        });
        setViewingService(null);
    };

    // Open Add modal
    const handleStartAdd = () => {
        const nextNum = services.length + 1;
        const generatedCode = `SRV-CST-0${nextNum}`;
        setFormData({
            code: generatedCode,
            nameEn: '',
            nameAr: '',
            category: 'government_affairs',
            descriptionEn: '',
            descriptionAr: '',
            slaHours: 24,
            status: 'active',
            defaultPrice: 2500,
        });
        setIsAddModalOpen(true);
    };

    // Save (Add or Edit) Service
    const handleSaveService = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingService) {
            setServices((prev) =>
                prev.map((s) =>
                    s.id === editingService.id
                        ? {
                              ...s,
                              code: formData.code.trim() || editingService.code,
                              nameEn: formData.nameEn.trim() || editingService.nameEn,
                              nameAr: formData.nameAr.trim() || editingService.nameAr,
                              category: formData.category,
                              descriptionEn: formData.descriptionEn.trim(),
                              descriptionAr: formData.descriptionAr.trim(),
                              slaHours: Number(formData.slaHours) || 24,
                              status: formData.status,
                              defaultPrice: Number(formData.defaultPrice) || 0,
                          }
                        : s
                )
            );
            setEditingService(null);
            showToast(t('customer.pages.services.feedback.serviceUpdated'));
        } else {
            const newService: CustomerServiceItem = {
                id: `srv-${Date.now()}`,
                code: formData.code.trim() || `SRV-${Date.now().toString().slice(-4)}`,
                nameEn: formData.nameEn.trim() || (isRtl ? 'خدمة عملاء جديدة' : 'New Customer Service'),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim() || 'خدمة عملاء جديدة',
                category: formData.category,
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
                slaHours: Number(formData.slaHours) || 24,
                status: formData.status,
                defaultPrice: Number(formData.defaultPrice) || 0,
                createdAt: new Date().toISOString().split('T')[0],
            };

            setServices([newService, ...services]);
            setIsAddModalOpen(false);
            showToast(t('customer.pages.services.feedback.serviceAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCategoryFilter('all');
    };

    const getStatusBadge = (status: CustomerServiceStatus) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('customer.pages.services.statusActive')}</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                <XCircle className="w-3 h-3" />
                <span>{t('customer.pages.services.statusInactive')}</span>
            </span>
        );
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 end-5 z-50 bg-[#037F8C] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in border border-[#BFAB93]/30">
                    <CheckCircle2 className="w-4 h-4 text-[#BFAB93]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                {t('customer.pages.services.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-SRV
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.services.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.services.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                            <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                            <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                        </span>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Services */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.services.kpis.totalServices')}
                            </span>
                            <Layers className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Active Services */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.services.kpis.activeServices')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.activeCount}</p>
                    </div>

                    {/* 3. Inactive Services */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.services.kpis.inactiveServices')}
                            </span>
                            <XCircle className="w-4 h-4 text-[#857E74]" />
                        </div>
                        <p className="text-2xl font-bold text-[#857E74] mt-2">{kpis.inactiveCount}</p>
                    </div>

                    {/* 4. Service Categories */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.services.kpis.serviceCategories')}
                            </span>
                            <Tag className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.categoryCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#857E74] absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('customer.pages.services.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D]"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Category & Status Filter Selects */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as any)}
                        aria-label={t('customer.pages.services.categoryAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.services.categoryAll')}</option>
                        {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl ? c.labelAr : c.labelEn}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.services.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.services.statusAll')}</option>
                        <option value="active">{t('customer.pages.services.statusActive')}</option>
                        <option value="inactive">{t('customer.pages.services.statusInactive')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.services.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Services Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.code')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.serviceName')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.category')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.sla')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.defaultPrice')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.services.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.services.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Layers className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.services.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#037F8C] hover:underline"
                                            >
                                                {t('customer.pages.services.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map((srv) => (
                                    <tr key={srv.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono font-semibold text-[#037F8C] bg-[#EFECE6] px-1.5 py-0.5 rounded text-[11px]" dir="ltr">
                                                {srv.code}
                                            </span>
                                        </td>

                                        {/* Bilingual Service Name & Description snippet */}
                                        <td className="px-5 py-3.5 max-w-xs">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#0D0D0D]">
                                                    {isRtl ? srv.nameAr : srv.nameEn}
                                                </span>
                                                <span className="text-[11px] text-[#857E74] mt-0.5 line-clamp-1">
                                                    {isRtl ? srv.descriptionAr : srv.descriptionEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Category Badge */}
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8] text-[#6E6862]">
                                                <Tag className="w-3 h-3 text-[#8C6D3B]" />
                                                <span>{getCategoryLabel(srv.category)}</span>
                                            </span>
                                        </td>

                                        {/* SLA */}
                                        <td className="px-5 py-3.5">
                                            <div className="inline-flex items-center gap-1 font-mono text-xs text-[#037F8C]">
                                                <Clock className="w-3.5 h-3.5 text-[#857E74]" />
                                                <span>{srv.slaHours} {t('customer.pages.services.hours')}</span>
                                            </div>
                                        </td>

                                        {/* Default Price */}
                                        <td className="px-5 py-3.5 font-mono font-semibold text-[#0D0D0D]">
                                            {srv.defaultPrice ? formatCurrency(srv.defaultPrice) : '—'}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">{getStatusBadge(srv.status)}</td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingService(srv)}
                                                    title={t('customer.pages.services.table.view')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#EFECE6] transition-colors cursor-pointer"
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

            {/* Service Details Drawer / Modal */}
            {viewingService && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Layers className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingService.nameAr : viewingService.nameEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#037F8C] rounded-md font-semibold" dir="ltr">
                                            {viewingService.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingService.nameEn : viewingService.nameAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingService(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Category & Status Strip */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div>
                                <span className="text-xs text-[#857E74] block">{t('customer.pages.services.table.category')}</span>
                                <span className="font-bold text-[#0D0D0D] text-xs mt-0.5 block">
                                    {getCategoryLabel(viewingService.category)}
                                </span>
                            </div>
                            <div>
                                {getStatusBadge(viewingService.status)}
                            </div>
                        </div>

                        {/* SLA & Price */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.services.table.sla')}</span>
                                <span className="font-mono font-bold text-base text-[#037F8C] mt-1 block">
                                    {viewingService.slaHours} {t('customer.pages.services.hours')}
                                </span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[#857E74] block">{t('customer.pages.services.table.defaultPrice')}</span>
                                <span className="font-mono font-bold text-base text-[#0D0D0D] mt-1 block">
                                    {viewingService.defaultPrice ? formatCurrency(viewingService.defaultPrice) : '—'}
                                </span>
                            </div>
                        </div>

                        {/* Scope Descriptions */}
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.services.modal.descriptionAr')}
                                </span>
                                <p className="text-[#0D0D0D] leading-relaxed">{viewingService.descriptionAr}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#857E74]">
                                    {t('customer.pages.services.modal.descriptionEn')}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed">{viewingService.descriptionEn}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 flex items-center justify-end border-t border-[#F0ECE6]">
                            <button
                                type="button"
                                onClick={() => setViewingService(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.services.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Service Modal */}
            {(isAddModalOpen || editingService) && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {editingService
                                        ? t('customer.pages.services.modal.editTitle')
                                        : t('customer.pages.services.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {editingService
                                        ? t('customer.pages.services.modal.editSubtitle')
                                        : t('customer.pages.services.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingService(null);
                                }}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveService} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.table.code')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="SRV-GA-01"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.table.category')} *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                category: e.target.value as CustomerServiceCategory,
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isRtl ? c.labelAr : c.labelEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: تجديد رخص العمل والمهن"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        placeholder="e.g. Labor Residency Renewals"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.table.sla')} ({t('customer.pages.services.hours')}) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        step={1}
                                        value={formData.slaHours}
                                        onChange={(e) => setFormData({ ...formData, slaHours: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.table.defaultPrice')} (SAR)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        value={formData.defaultPrice}
                                        onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.services.table.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as CustomerServiceStatus,
                                            })
                                        }
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                    >
                                        <option value="active">{t('customer.pages.services.statusActive')}</option>
                                        <option value="inactive">{t('customer.pages.services.statusInactive')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.services.modal.descriptionAr')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionAr}
                                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                    placeholder="نطاق تقديم الخدمة والمتطلبات الحكومية..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                    {t('customer.pages.services.modal.descriptionEn')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.descriptionEn}
                                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                    placeholder="Operational delivery scope and statutory portal obligations..."
                                    className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingService(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.services.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.services.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
