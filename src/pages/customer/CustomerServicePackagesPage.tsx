import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PackageCheck,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Power,
    Layers,
    DollarSign,
    Calendar,
} from 'lucide-react';

export type CustomerPackageStatus = 'active' | 'inactive';
export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface LinkedServiceItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
}

export interface CustomerServicePackageItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    price: number;
    billingCycle: BillingCycle;
    status: CustomerPackageStatus;
    linkedServices: LinkedServiceItem[];
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_service_packages_v1';

const CATALOG_SERVICES: LinkedServiceItem[] = [
    {
        id: 'srv-1',
        code: 'SRV-GA-01',
        nameEn: 'Commercial Registration Issuance & Renewal',
        nameAr: 'إصدار وتجديد السجل التجاري والأنشطة',
    },
    {
        id: 'srv-2',
        code: 'SRV-WL-02',
        nameEn: 'Workforce Iqama Renewal & Labor Quota',
        nameAr: 'تجديد الإقامات المهنية وتدقيق نطاقات العمل',
    },
    {
        id: 'srv-3',
        code: 'SRV-TL-03',
        nameEn: 'Fleet GPS Telematics & SLA Monitoring',
        nameAr: 'تتبع أسطول النقل اللوجستي والربط مع وصل',
    },
    {
        id: 'srv-4',
        code: 'SRV-CA-04',
        nameEn: 'Zakat, Tax & Customs Regulatory Compliance',
        nameAr: 'الامتثال الضريبي والزكوي والفوترة الإلكترونية',
    },
    {
        id: 'srv-5',
        code: 'SRV-IT-05',
        nameEn: 'Cloud Infrastructure & 24/7 Server SLA',
        nameAr: 'البنية السحابية ودعم الخوادم على مدار الساعة',
    },
    {
        id: 'srv-6',
        code: 'SRV-LM-06',
        nameEn: 'Executive Legal & Municipal Licensing',
        nameAr: 'الاستشارات القانونية والتراخيص البلدية التنفيذية',
    },
];

const INITIAL_PACKAGES: CustomerServicePackageItem[] = [];

export const CustomerServicePackagesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // 1. Persistence in localStorage using 'awn_customer_service_packages_v1'
    const [packages, setPackages] = useState<CustomerServicePackageItem[]>(() => {
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
        return INITIAL_PACKAGES;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
            }
        } catch {
            // ignore
        }
    }, [packages]);

    // 2. Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | CustomerPackageStatus>('all');
    const [cycleFilter, setCycleFilter] = useState<'all' | BillingCycle>('all');

    // 3. Modals and Drawers
    const [viewingPackage, setViewingPackage] = useState<CustomerServicePackageItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 4. Form state and validation
    const [formData, setFormData] = useState({
        code: '',
        nameEn: '',
        nameAr: '',
        descriptionEn: '',
        descriptionAr: '',
        price: 15000,
        billingCycle: 'annual' as BillingCycle,
        status: 'active' as CustomerPackageStatus,
        selectedServiceIds: [CATALOG_SERVICES[0].id] as string[],
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        price?: string;
        services?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered list
    const filteredPackages = useMemo(() => {
        const query = search.trim().toLowerCase();
        return packages.filter((pkg) => {
            const matchesQuery =
                !query ||
                pkg.code.toLowerCase().includes(query) ||
                pkg.nameEn.toLowerCase().includes(query) ||
                pkg.nameAr.includes(search.trim()) ||
                pkg.descriptionEn.toLowerCase().includes(query) ||
                pkg.descriptionAr.includes(search.trim()) ||
                pkg.linkedServices.some(
                    (s) =>
                        s.code.toLowerCase().includes(query) ||
                        s.nameEn.toLowerCase().includes(query) ||
                        s.nameAr.includes(search.trim())
                );

            const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
            const matchesCycle = cycleFilter === 'all' || pkg.billingCycle === cycleFilter;

            return matchesQuery && matchesStatus && matchesCycle;
        });
    }, [packages, search, statusFilter, cycleFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = packages.length;
        const activeCount = packages.filter((p) => p.status === 'active').length;
        const inactiveCount = packages.filter((p) => p.status === 'inactive').length;
        const avgPrice = total > 0 ? Math.round(packages.reduce((acc, p) => acc + p.price, 0) / total) : 0;

        return {
            total,
            activeCount,
            inactiveCount,
            avgPrice,
        };
    }, [packages]);

    // Format currency helper
    const formatCurrency = (val: number) => {
        return `${val.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`;
    };

    // Cycle label helper
    const getCycleLabel = (cycle: BillingCycle) => {
        switch (cycle) {
            case 'monthly':
                return t('customer.pages.servicePackages.cycleMonthly');
            case 'quarterly':
                return t('customer.pages.servicePackages.cycleQuarterly');
            case 'semi_annual':
                return t('customer.pages.servicePackages.cycleSemiAnnual');
            case 'annual':
                return t('customer.pages.servicePackages.cycleAnnual');
            default:
                return cycle;
        }
    };

    // Toggle Active / Inactive
    const handleToggleStatus = (id: string) => {
        let newStatus: CustomerPackageStatus = 'active';
        setPackages((prev) =>
            prev.map((pkg) => {
                if (pkg.id === id) {
                    newStatus = pkg.status === 'active' ? 'inactive' : 'active';
                    return { ...pkg, status: newStatus };
                }
                return pkg;
            })
        );

        if (viewingPackage && viewingPackage.id === id) {
            setViewingPackage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }

        showToast(
            newStatus === 'active'
                ? t('customer.pages.servicePackages.feedback.statusActivated')
                : t('customer.pages.servicePackages.feedback.statusDeactivated')
        );
    };

    // Open Add Modal
    const handleStartAdd = () => {
        const nextNum = packages.length + 1;
        const generatedCode = `PKG-CST-0${nextNum}`;
        setEditingPackageId(null);
        setFormErrors({});
        setFormData({
            code: generatedCode,
            nameEn: '',
            nameAr: '',
            descriptionEn: '',
            descriptionAr: '',
            price: 15000,
            billingCycle: 'annual',
            status: 'active',
            selectedServiceIds: [CATALOG_SERVICES[0].id],
        });
        setIsFormModalOpen(true);
    };

    // Open Edit Modal
    const handleStartEdit = (pkg: CustomerServicePackageItem) => {
        setEditingPackageId(pkg.id);
        setFormErrors({});
        setFormData({
            code: pkg.code,
            nameEn: pkg.nameEn,
            nameAr: pkg.nameAr,
            descriptionEn: pkg.descriptionEn,
            descriptionAr: pkg.descriptionAr,
            price: pkg.price,
            billingCycle: pkg.billingCycle,
            status: pkg.status,
            selectedServiceIds: pkg.linkedServices.map((s) => s.id),
        });
        setViewingPackage(null);
        setIsFormModalOpen(true);
    };

    // Form submit validation & persistence
    const handleSavePackage = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; price?: string; services?: string } = {};

        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.servicePackages.modal.validationName');
        }

        if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            errors.price = t('customer.pages.servicePackages.modal.validationPrice');
        }

        if (formData.selectedServiceIds.length === 0) {
            errors.services = t('customer.pages.servicePackages.modal.validationServices');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const linked = CATALOG_SERVICES.filter((s) => formData.selectedServiceIds.includes(s.id));

        if (editingPackageId) {
            setPackages((prev) =>
                prev.map((pkg) => {
                    if (pkg.id === editingPackageId) {
                        return {
                            ...pkg,
                            code: formData.code.trim() || pkg.code,
                            nameEn: formData.nameEn.trim() || pkg.nameEn,
                            nameAr: formData.nameAr.trim() || pkg.nameAr,
                            descriptionEn: formData.descriptionEn.trim(),
                            descriptionAr: formData.descriptionAr.trim(),
                            price: Number(formData.price),
                            billingCycle: formData.billingCycle,
                            status: formData.status,
                            linkedServices: linked,
                        };
                    }
                    return pkg;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.servicePackages.feedback.packageUpdated'));
        } else {
            const newPkg: CustomerServicePackageItem = {
                id: `pkg-${Date.now()}`,
                code: formData.code.trim() || `PKG-${Date.now().toString().slice(-4)}`,
                nameEn: formData.nameEn.trim() || (isRtl ? 'باقة خدمات جديدة' : 'New Service Package'),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim() || 'باقة خدمات جديدة',
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
                price: Number(formData.price),
                billingCycle: formData.billingCycle,
                status: formData.status,
                linkedServices: linked,
                createdAt: new Date().toISOString().split('T')[0],
            };
            setPackages([newPkg, ...packages]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.servicePackages.feedback.packageAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCycleFilter('all');
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
                                {t('customer.pages.servicePackages.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-PKG
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.servicePackages.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.servicePackages.subtitle')}
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
                    {/* 1. Total Packages */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.servicePackages.kpis.totalPackages')}
                            </span>
                            <PackageCheck className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Active Packages */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.servicePackages.kpis.activePackages')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.activeCount}</p>
                    </div>

                    {/* 3. Inactive Packages */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.servicePackages.kpis.inactivePackages')}
                            </span>
                            <XCircle className="w-4 h-4 text-[#857E74]" />
                        </div>
                        <p className="text-2xl font-bold text-[#857E74] mt-2">{kpis.inactiveCount}</p>
                    </div>

                    {/* 4. Average Price */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.servicePackages.kpis.avgPrice')}
                            </span>
                            <DollarSign className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{formatCurrency(kpis.avgPrice)}</p>
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
                        placeholder={t('customer.pages.servicePackages.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | CustomerPackageStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.servicePackages.statusAll')}</option>
                        <option value="active">{t('customer.pages.servicePackages.statusActive')}</option>
                        <option value="inactive">{t('customer.pages.servicePackages.statusInactive')}</option>
                    </select>

                    {/* Billing Cycle */}
                    <select
                        value={cycleFilter}
                        onChange={(e) => setCycleFilter(e.target.value as 'all' | BillingCycle)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.servicePackages.cycleAll')}</option>
                        <option value="monthly">{t('customer.pages.servicePackages.cycleMonthly')}</option>
                        <option value="quarterly">{t('customer.pages.servicePackages.cycleQuarterly')}</option>
                        <option value="semi_annual">{t('customer.pages.servicePackages.cycleSemiAnnual')}</option>
                        <option value="annual">{t('customer.pages.servicePackages.cycleAnnual')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || cycleFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#857E74] hover:text-[#0D0D0D] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                            title={t('customer.pages.servicePackages.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.servicePackages.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold">
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.packageName')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.linkedServices')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.billingCycle')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.price')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.servicePackages.table.status')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.servicePackages.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredPackages.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <PackageCheck className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.servicePackages.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#037F8C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.servicePackages.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPackages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]">
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                {pkg.code}
                                            </span>
                                        </td>

                                        {/* Name & Scope */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="font-bold text-[#0D0D0D]">
                                                {isRtl ? pkg.nameAr : pkg.nameEn}
                                            </p>
                                            <p className="text-[11px] text-[#857E74] truncate mt-0.5">
                                                {isRtl ? pkg.descriptionAr : pkg.descriptionEn}
                                            </p>
                                        </td>

                                        {/* Linked Services */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                                                {pkg.linkedServices.slice(0, 2).map((srv) => (
                                                    <span
                                                        key={srv.id}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                                                        title={isRtl ? srv.nameAr : srv.nameEn}
                                                    >
                                                        <span className="font-mono text-[10px] text-[#857E74]">{srv.code}</span>
                                                        <span className="truncate max-w-[120px]">{isRtl ? srv.nameAr : srv.nameEn}</span>
                                                    </span>
                                                ))}
                                                {pkg.linkedServices.length > 2 && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]">
                                                        +{pkg.linkedServices.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Billing Cycle */}
                                        <td className="py-3.5 px-4 text-[#595550]">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8]">
                                                <Calendar className="w-3 h-3 text-[#857E74]" />
                                                <span>{getCycleLabel(pkg.billingCycle)}</span>
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="py-3.5 px-4 font-semibold text-[#0D0D0D]">
                                            {formatCurrency(pkg.price)}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            {pkg.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{t('customer.pages.servicePackages.statusActive')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>{t('customer.pages.servicePackages.statusInactive')}</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingPackage(pkg)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.servicePackages.table.view')}
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

            {/* View Details Modal */}
            {viewingPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <PackageCheck className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingPackage.nameAr : viewingPackage.nameEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingPackage.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {t('customer.pages.servicePackages.details.createdOn')}: {viewingPackage.createdAt}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingPackage(null)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.servicePackages.table.price')}
                                    </span>
                                    <p className="text-base font-bold text-[#037F8C] mt-1">
                                        {formatCurrency(viewingPackage.price)}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.servicePackages.table.billingCycle')}
                                    </span>
                                    <p className="text-sm font-bold text-[#0D0D0D] mt-1">
                                        {getCycleLabel(viewingPackage.billingCycle)}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.servicePackages.table.status')}
                                    </span>
                                    <div className="mt-1">
                                        {viewingPackage.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>{t('customer.pages.servicePackages.statusActive')}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                                                <XCircle className="w-3 h-3" />
                                                <span>{t('customer.pages.servicePackages.statusInactive')}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.servicePackages.modal.descriptionAr')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingPackage.descriptionAr || '-'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.servicePackages.modal.descriptionEn')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingPackage.descriptionEn || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Linked Services */}
                            <div>
                                <h4 className="text-xs font-bold text-[#0D0D0D] flex items-center justify-between mb-3">
                                    <span>{t('customer.pages.servicePackages.details.servicesIncluded')}</span>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#037F8C]">
                                        {viewingPackage.linkedServices.length}
                                    </span>
                                </h4>
                                <div className="space-y-2">
                                    {viewingPackage.linkedServices.length === 0 ? (
                                        <p className="text-xs text-[#857E74] italic">
                                            {t('customer.pages.servicePackages.details.noServices')}
                                        </p>
                                    ) : (
                                        viewingPackage.linkedServices.map((srv) => (
                                            <div
                                                key={srv.id}
                                                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Layers className="w-4 h-4 text-[#037F8C] shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#0D0D0D]">
                                                            {isRtl ? srv.nameAr : srv.nameEn}
                                                        </p>
                                                        <p className="text-[11px] text-[#857E74]">
                                                            {isRtl ? srv.nameEn : srv.nameAr}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#E5E0D8] text-[#037F8C]" dir="ltr">
                                                    {srv.code}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingPackage(null)}
                                className="px-4 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {t('customer.pages.servicePackages.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Form Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <PackageCheck className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingPackageId
                                            ? t('customer.pages.servicePackages.modal.editTitle')
                                            : t('customer.pages.servicePackages.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingPackageId
                                            ? t('customer.pages.servicePackages.modal.editSubtitle')
                                            : t('customer.pages.servicePackages.modal.addSubtitle')}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSavePackage} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="PKG-CST-01"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as CustomerPackageStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="active">{t('customer.pages.servicePackages.statusActive')}</option>
                                            <option value="inactive">{t('customer.pages.servicePackages.statusInactive')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Names */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.nameAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameAr: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="باقة الخدمات الشاملة"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.nameEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameEn: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="Comprehensive Enterprise Suite"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.name && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.name}</p>
                                )}

                                {/* Price & Billing Cycle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.price')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                value={formData.price}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, price: Number(e.target.value) });
                                                    if (formErrors.price) setFormErrors({ ...formErrors, price: undefined });
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            />
                                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#857E74]">
                                                {isRtl ? 'ر.س' : 'SAR'}
                                            </span>
                                        </div>
                                        {formErrors.price && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.price}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.billingCycle')}
                                        </label>
                                        <select
                                            value={formData.billingCycle}
                                            onChange={(e) =>
                                                setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="monthly">{t('customer.pages.servicePackages.cycleMonthly')}</option>
                                            <option value="quarterly">{t('customer.pages.servicePackages.cycleQuarterly')}</option>
                                            <option value="semi_annual">{t('customer.pages.servicePackages.cycleSemiAnnual')}</option>
                                            <option value="annual">{t('customer.pages.servicePackages.cycleAnnual')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Descriptions */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionAr}
                                            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                            placeholder="وصف تفصيلي للباقة ونطاق الخدمات المشمولة..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.servicePackages.modal.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                            placeholder="Detailed scope of services and operational deliverables..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Linked Services Multi-Select Checkboxes */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-[#0D0D0D]">
                                            {t('customer.pages.servicePackages.modal.linkedServices')} <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-[#857E74]">
                                            {t('customer.pages.servicePackages.servicesCount', {
                                                count: formData.selectedServiceIds.length,
                                            })}
                                        </span>
                                    </div>
                                    <div className="border border-[#E5E0D8] rounded-xl p-3 bg-[#FAF8F5] max-h-48 overflow-y-auto space-y-2">
                                        {CATALOG_SERVICES.map((srv) => {
                                            const isSelected = formData.selectedServiceIds.includes(srv.id);
                                            return (
                                                <label
                                                    key={srv.id}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-white border-[#037F8C] text-[#0D0D0D] shadow-2xs'
                                                            : 'bg-white/60 hover:bg-white border-[#E5E0D8] text-[#595550]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setFormData((prev) => {
                                                                    const nextIds = checked
                                                                        ? [...prev.selectedServiceIds, srv.id]
                                                                        : prev.selectedServiceIds.filter((id) => id !== srv.id);
                                                                    return { ...prev, selectedServiceIds: nextIds };
                                                                });
                                                                if (formErrors.services) {
                                                                    setFormErrors({ ...formErrors, services: undefined });
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded text-[#037F8C] focus:ring-[#037F8C] border-[#D6CFC4] cursor-pointer"
                                                        />
                                                        <span className="font-medium">
                                                            {isRtl ? srv.nameAr : srv.nameEn}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]" dir="ltr">
                                                        {srv.code}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {formErrors.services && (
                                        <p className="text-[11px] text-red-600 font-medium mt-1.5">{formErrors.services}</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.servicePackages.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.servicePackages.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
