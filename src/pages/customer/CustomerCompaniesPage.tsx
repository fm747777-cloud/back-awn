import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    Search,
    Plus,
    X,
    Eye,
    Power,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    Phone,
    Mail,
} from 'lucide-react';

export interface CustomerCompanyItem {
    id: string;
    code: string;
    nameEn: string;
    nameAr: string;
    crNumber: string;
    taxNumber: string;
    sectorKey: string;
    sectorEn: string;
    sectorAr: string;
    cityEn: string;
    cityAr: string;
    status: 'active' | 'inactive' | 'pending';
    activeContractsCount: number;
    activeRequestsCount: number;
    primaryContactName: string;
    primaryContactPhone: string;
    primaryContactEmail: string;
    establishedYear: number;
    createdAt: string;
}

const INITIAL_COMPANIES: CustomerCompanyItem[] = [
    {
        id: 'cmp-1',
        code: 'CMP-1001',
        nameEn: 'Al-Wataniya Logistics Co.',
        nameAr: 'الشركة الوطنية للخدمات اللوجستية',
        crNumber: '1010482910',
        taxNumber: '300482918200003',
        sectorKey: 'logistics',
        sectorEn: 'Logistics & Supply Chain',
        sectorAr: 'الخدمات اللوجستية والإمداد',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 12,
        activeRequestsCount: 5,
        primaryContactName: 'Eng. Fahad Al-Otaibi',
        primaryContactPhone: '+966 50 123 4567',
        primaryContactEmail: 'f.otaibi@wataniya-log.sa',
        establishedYear: 2014,
        createdAt: '2024-01-15',
    },
    {
        id: 'cmp-2',
        code: 'CMP-1002',
        nameEn: 'Riyadh Tech Solutions',
        nameAr: 'شركة حلول الرياض التقنية',
        crNumber: '1010928472',
        taxNumber: '300928471200003',
        sectorKey: 'technology',
        sectorEn: 'Technology & Cloud Systems',
        sectorAr: 'التقنية والأنظمة السحابية',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 8,
        activeRequestsCount: 3,
        primaryContactName: 'Sara Al-Ghamdi',
        primaryContactPhone: '+966 55 987 6543',
        primaryContactEmail: 'sara@riyadhtech.com.sa',
        establishedYear: 2018,
        createdAt: '2024-03-20',
    },
    {
        id: 'cmp-3',
        code: 'CMP-1003',
        nameEn: 'Gulf Energy Trading Corp',
        nameAr: 'مؤسسة طاقة الخليج التجارية',
        crNumber: '2050198273',
        taxNumber: '300198273400003',
        sectorKey: 'energy',
        sectorEn: 'Energy & Petrochemicals',
        sectorAr: 'الطاقة والبتروكيماويات',
        cityEn: 'Khobar',
        cityAr: 'الخبر',
        status: 'pending',
        activeContractsCount: 2,
        activeRequestsCount: 4,
        primaryContactName: 'Khalid Al-Dossary',
        primaryContactPhone: '+966 53 456 7890',
        primaryContactEmail: 'khalid@gulfenergy.com.sa',
        establishedYear: 2016,
        createdAt: '2025-06-10',
    },
    {
        id: 'cmp-4',
        code: 'CMP-1004',
        nameEn: 'Najm Financial Advisory Group',
        nameAr: 'مجموعة نجم للاستشارات المالية',
        crNumber: '1010372849',
        taxNumber: '300372849100003',
        sectorKey: 'financial',
        sectorEn: 'Financial Services & Investment',
        sectorAr: 'الخدمات المالية والاستثمار',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        status: 'active',
        activeContractsCount: 15,
        activeRequestsCount: 2,
        primaryContactName: 'Abdullah Al-Shehri',
        primaryContactPhone: '+966 54 321 0987',
        primaryContactEmail: 'a.shehri@najmfinancial.sa',
        establishedYear: 2011,
        createdAt: '2023-11-05',
    },
    {
        id: 'cmp-5',
        code: 'CMP-1005',
        nameEn: 'Arabian Horizon Contracting',
        nameAr: 'شركة الأفق العربي للمقاولات',
        crNumber: '4030283746',
        taxNumber: '300283746500003',
        sectorKey: 'contracting',
        sectorEn: 'Construction & Real Estate',
        sectorAr: 'المقاولات والتطوير العقاري',
        cityEn: 'Jeddah',
        cityAr: 'جدة',
        status: 'active',
        activeContractsCount: 6,
        activeRequestsCount: 8,
        primaryContactName: 'Majed Al-Harbi',
        primaryContactPhone: '+966 56 789 0123',
        primaryContactEmail: 'majed@arabianhorizon.com',
        establishedYear: 2009,
        createdAt: '2024-02-18',
    },
    {
        id: 'cmp-6',
        code: 'CMP-1006',
        nameEn: 'Modern Infrastructure LLC',
        nameAr: 'شركة البنية التحتية الحديثة',
        crNumber: '4030594837',
        taxNumber: '300594837200003',
        sectorKey: 'infrastructure',
        sectorEn: 'Infrastructure & Engineering',
        sectorAr: 'البنية التحتية والهندسة',
        cityEn: 'Dammam',
        cityAr: 'الدمام',
        status: 'inactive',
        activeContractsCount: 0,
        activeRequestsCount: 0,
        primaryContactName: 'Tariq Al-Zahrani',
        primaryContactPhone: '+966 59 876 5432',
        primaryContactEmail: 'tariq@moderninfra.sa',
        establishedYear: 2017,
        createdAt: '2024-08-12',
    },
];

const SECTORS_LIST = [
    { key: 'logistics', en: 'Logistics & Supply Chain', ar: 'الخدمات اللوجستية والإمداد' },
    { key: 'technology', en: 'Technology & Cloud Systems', ar: 'التقنية والأنظمة السحابية' },
    { key: 'energy', en: 'Energy & Petrochemicals', ar: 'الطاقة والبتروكيماويات' },
    { key: 'financial', en: 'Financial Services & Investment', ar: 'الخدمات المالية والاستثمار' },
    { key: 'contracting', en: 'Construction & Real Estate', ar: 'المقاولات والتطوير العقاري' },
    { key: 'infrastructure', en: 'Infrastructure & Engineering', ar: 'البنية التحتية والهندسة' },
];

export const CustomerCompaniesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // State
    const [companies, setCompanies] = useState<CustomerCompanyItem[]>(INITIAL_COMPANIES);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
    const [sectorFilter, setSectorFilter] = useState<string>('all');

    // Drawer / Modal states
    const [viewingCompany, setViewingCompany] = useState<CustomerCompanyItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Add Form State
    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        crNumber: '',
        taxNumber: '',
        sectorKey: 'logistics',
        cityEn: '',
        cityAr: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
    });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filter logic
    const filteredCompanies = useMemo(() => {
        return companies.filter((c) => {
            const matchesSearch =
                !search.trim() ||
                c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
                c.nameAr.includes(search) ||
                c.code.toLowerCase().includes(search.toLowerCase()) ||
                c.crNumber.includes(search) ||
                c.primaryContactName.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesSector = sectorFilter === 'all' || c.sectorKey === sectorFilter;

            return matchesSearch && matchesStatus && matchesSector;
        });
    }, [companies, search, statusFilter, sectorFilter]);

    // Statistics
    const stats = useMemo(() => {
        const total = companies.length;
        const active = companies.filter((c) => c.status === 'active').length;
        const pending = companies.filter((c) => c.status === 'pending').length;
        const inactive = companies.filter((c) => c.status === 'inactive').length;
        return { total, active, pending, inactive };
    }, [companies]);

    // Toggle Status
    const handleToggleStatus = (id: string) => {
        setCompanies((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    const nextStatus = c.status === 'active' ? 'inactive' : 'active';
                    return { ...c, status: nextStatus };
                }
                return c;
            })
        );
        if (viewingCompany?.id === id) {
            setViewingCompany((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.companies.feedback.statusUpdated'));
    };

    // Handle Add Company Submit
    const handleAddCompany = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) return;

        const nextCodeNum = companies.length + 1001;
        const chosenSector = SECTORS_LIST.find((s) => s.key === formData.sectorKey) || SECTORS_LIST[0];

        const newCompany: CustomerCompanyItem = {
            id: `cmp-${Date.now()}`,
            code: `CMP-${nextCodeNum}`,
            nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
            nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
            crNumber: formData.crNumber.trim() || '1010000000',
            taxNumber: formData.taxNumber.trim() || '300000000000003',
            sectorKey: chosenSector.key,
            sectorEn: chosenSector.en,
            sectorAr: chosenSector.ar,
            cityEn: formData.cityEn.trim() || (isRtl ? 'الرياض' : 'Riyadh'),
            cityAr: formData.cityAr.trim() || (isRtl ? 'الرياض' : 'Riyadh'),
            status: 'active',
            activeContractsCount: 1,
            activeRequestsCount: 1,
            primaryContactName: formData.contactName.trim() || (isRtl ? 'مسؤول جديد' : 'New Representative'),
            primaryContactPhone: formData.contactPhone.trim() || '+966 50 000 0000',
            primaryContactEmail: formData.contactEmail.trim() || 'contact@client.sa',
            establishedYear: new Date().getFullYear(),
            createdAt: new Date().toISOString().split('T')[0],
        };

        setCompanies([newCompany, ...companies]);
        setIsAddModalOpen(false);
        setFormData({
            nameEn: '',
            nameAr: '',
            crNumber: '',
            taxNumber: '',
            sectorKey: 'logistics',
            cityEn: '',
            cityAr: '',
            contactName: '',
            contactPhone: '',
            contactEmail: '',
        });
        showToast(t('customer.pages.companies.feedback.companyAdded'));
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setSectorFilter('all');
    };

    const getStatusBadge = (status: CustomerCompanyItem['status']) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('customer.pages.companies.statusActive')}</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF6ED] text-[#8C6D3B] border border-[#EADFCB]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t('customer.pages.companies.statusPending')}</span>
                    </span>
                );
            case 'inactive':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFECE6] text-[#6E6862] border border-[#D6CFC4]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{t('customer.pages.companies.statusInactive')}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-5 end-5 z-50 bg-[#2D3F2C] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in border border-[#BFAB93]/30">
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
                                {t('customer.pages.companies.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-CMP
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1 max-w-2xl leading-relaxed">
                            {t('customer.pages.companies.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer self-start sm:self-center shrink-0"
                    >
                        <Plus className="w-4 h-4 text-[#BFAB93]" />
                        <span>{t('customer.pages.companies.addCompany')}</span>
                    </button>
                </div>

                {/* KPI Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#F0ECE6]">
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold text-[#857E74]">
                            {t('customer.pages.companies.totalCompanies')}
                        </p>
                        <p className="text-lg font-bold text-[#0D0D0D] mt-0.5">{stats.total}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold text-[#265938]">
                            {t('customer.pages.companies.activeCompanies')}
                        </p>
                        <p className="text-lg font-bold text-[#265938] mt-0.5">{stats.active}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold text-[#8C6D3B]">
                            {t('customer.pages.companies.pendingCompanies')}
                        </p>
                        <p className="text-lg font-bold text-[#8C6D3B] mt-0.5">{stats.pending}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                        <p className="text-[11px] font-semibold text-[#6E6862]">
                            {t('customer.pages.companies.inactiveCompanies')}
                        </p>
                        <p className="text-lg font-bold text-[#6E6862] mt-0.5">{stats.inactive}</p>
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
                        placeholder={t('customer.pages.companies.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] focus:border-[#2D3F2C]"
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

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        aria-label={t('customer.pages.companies.statusAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.companies.statusAll')}</option>
                        <option value="active">{t('customer.pages.companies.statusActive')}</option>
                        <option value="pending">{t('customer.pages.companies.statusPending')}</option>
                        <option value="inactive">{t('customer.pages.companies.statusInactive')}</option>
                    </select>

                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        aria-label={t('customer.pages.companies.sectorAll')}
                        className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-2 text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.companies.sectorAll')}</option>
                        {SECTORS_LIST.map((s) => (
                            <option key={s.key} value={s.key}>
                                {isRtl ? s.ar : s.en}
                            </option>
                        ))}
                    </select>

                    {(search || statusFilter !== 'all' || sectorFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('customer.pages.companies.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Companies Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold text-[11px] uppercase tracking-wider">
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.companies.table.company')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.companies.table.crNumber')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.companies.table.sector')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.companies.table.operations')}</th>
                                <th className="px-5 py-3.5 text-start">{t('customer.pages.companies.table.status')}</th>
                                <th className="px-5 py-3.5 text-end">{t('customer.pages.companies.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-xs text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Building2 className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="font-medium text-[#0D0D0D]">
                                                {t('customer.pages.companies.feedback.noResults')}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="mt-2 text-xs font-semibold text-[#2D3F2C] hover:underline"
                                            >
                                                {t('customer.pages.companies.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((c) => (
                                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Company Name & Code */}
                                        <td className="px-5 py-3.5 font-medium text-[#0D0D0D]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#2D3F2C] shrink-0">
                                                    <Building2 className="w-4 h-4 text-[#2D3F2C]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#0D0D0D]">
                                                        {isRtl ? c.nameAr : c.nameEn}
                                                    </p>
                                                    <span className="font-mono text-[11px] text-[#857E74]" dir="ltr">
                                                        {c.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* CR & Location */}
                                        <td className="px-5 py-3.5 text-[#6E6862]">
                                            <p className="font-mono text-xs font-semibold text-[#0D0D0D]" dir="ltr">
                                                {c.crNumber}
                                            </p>
                                            <p className="text-[11px] text-[#857E74]">
                                                {isRtl ? c.cityAr : c.cityEn}
                                            </p>
                                        </td>

                                        {/* Sector */}
                                        <td className="px-5 py-3.5 text-[#0D0D0D]">
                                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8] text-[#4A443C]">
                                                {isRtl ? c.sectorAr : c.sectorEn}
                                            </span>
                                        </td>

                                        {/* Operations */}
                                        <td className="px-5 py-3.5 text-[#6E6862]">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-semibold text-[#0D0D0D]">
                                                    {c.activeContractsCount}
                                                </span>
                                                <span className="text-[11px] text-[#857E74]">
                                                    {isRtl ? 'عقود' : 'contracts'}
                                                </span>
                                                <span className="text-[#D6CFC4]">·</span>
                                                <span className="font-semibold text-[#0D0D0D]">
                                                    {c.activeRequestsCount}
                                                </span>
                                                <span className="text-[11px] text-[#857E74]">
                                                    {isRtl ? 'طلبات' : 'requests'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingCompany(c)}
                                                    title={t('customer.pages.companies.table.viewDetails')}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(c.id)}
                                                    title={
                                                        c.status === 'active'
                                                            ? t('customer.pages.companies.table.deactivate')
                                                            : t('customer.pages.companies.table.activate')
                                                    }
                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                                        c.status === 'active'
                                                            ? 'text-[#265938] hover:bg-[#EAF3EC]'
                                                            : 'text-[#857E74] hover:bg-[#EFECE6]'
                                                    }`}
                                                >
                                                    <Power className="w-4 h-4" />
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

            {/* Company Details Slide-over Drawer / Modal */}
            {viewingCompany && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Drawer Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Building2 className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingCompany.nameAr : viewingCompany.nameEn}
                                        </h2>
                                        <span className="font-mono text-xs px-2 py-0.5 bg-[#EFECE6] text-[#2D3F2C] rounded-md font-semibold" dir="ltr">
                                            {viewingCompany.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingCompany.nameEn : viewingCompany.nameAr}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingCompany(null)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Strip */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#857E74] font-medium">
                                    {t('customer.pages.companies.table.status')}:
                                </span>
                                {getStatusBadge(viewingCompany.status)}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(viewingCompany.id)}
                                className="text-xs font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                            >
                                {viewingCompany.status === 'active'
                                    ? t('customer.pages.companies.details.deactivate')
                                    : t('customer.pages.companies.details.activate')}
                            </button>
                        </div>

                        {/* Legal & Registration Grid */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {t('customer.pages.companies.details.registrationDetails')}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[#857E74] block">{t('customer.pages.companies.table.crNumber')}</span>
                                    <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                        {viewingCompany.crNumber}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[#857E74] block">{t('customer.pages.companies.details.taxNumber')}</span>
                                    <span className="font-mono font-bold text-[#0D0D0D] mt-0.5 block" dir="ltr">
                                        {viewingCompany.taxNumber}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[#857E74] block">{t('customer.pages.companies.table.sector')}</span>
                                    <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                        {isRtl ? viewingCompany.sectorAr : viewingCompany.sectorEn}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[#857E74] block">{t('customer.pages.companies.modal.city')}</span>
                                    <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                        {isRtl ? viewingCompany.cityAr : viewingCompany.cityEn}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact Person */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {t('customer.pages.companies.details.primaryContact')}
                            </h3>
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2 text-xs">
                                <p className="font-bold text-[#0D0D0D] text-sm">{viewingCompany.primaryContactName}</p>
                                <div className="flex flex-wrap items-center gap-4 text-[#6E6862] pt-1">
                                    <div className="flex items-center gap-1.5" dir="ltr">
                                        <Phone className="w-3.5 h-3.5 text-[#857E74]" />
                                        <span>{viewingCompany.primaryContactPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" dir="ltr">
                                        <Mail className="w-3.5 h-3.5 text-[#857E74]" />
                                        <span>{viewingCompany.primaryContactEmail}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operational Portfolio Stats */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {t('customer.pages.companies.details.operations')}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                                    <span className="text-[#6E6862]">
                                        {isRtl ? 'العقود المعتمدة' : 'Active Contracts'}
                                    </span>
                                    <span className="font-bold text-[#2D3F2C] text-sm">
                                        {viewingCompany.activeContractsCount}
                                    </span>
                                </div>
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                                    <span className="text-[#6E6862]">
                                        {isRtl ? 'الطلبات الجارية' : 'In-flight Requests'}
                                    </span>
                                    <span className="font-bold text-[#8C6D3B] text-sm">
                                        {viewingCompany.activeRequestsCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingCompany(null)}
                                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('customer.pages.companies.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Company Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 text-start">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#F0ECE6] pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D0D0D]">
                                    {t('customer.pages.companies.modal.addTitle')}
                                </h2>
                                <p className="text-xs text-[#857E74] mt-0.5">
                                    {t('customer.pages.companies.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddCompany} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        placeholder="مثال: شركة الرواد للتجارة"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        placeholder="e.g. Al-Rowad Trading Co."
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.cr')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        value={formData.crNumber}
                                        onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                                        placeholder="1010XXXXXX"
                                        dir="ltr"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.tax')}
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={15}
                                        value={formData.taxNumber}
                                        onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                        placeholder="300XXXXXXXXXXXX"
                                        dir="ltr"
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.sector')}
                                    </label>
                                    <select
                                        value={formData.sectorKey}
                                        onChange={(e) => setFormData({ ...formData, sectorKey: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                    >
                                        {SECTORS_LIST.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {isRtl ? s.ar : s.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                        {t('customer.pages.companies.modal.city')}
                                    </label>
                                    <input
                                        type="text"
                                        value={isRtl ? formData.cityAr : formData.cityEn}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                cityEn: e.target.value,
                                                cityAr: e.target.value,
                                            })
                                        }
                                        placeholder={isRtl ? 'الرياض' : 'Riyadh'}
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[#F0ECE6]">
                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#857E74] mb-2">
                                    {t('customer.pages.companies.details.primaryContact')}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                            {t('customer.pages.companies.modal.contactName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.contactName}
                                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                            placeholder="Eng. Ahmed..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                                {t('customer.pages.companies.modal.contactPhone')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.contactPhone}
                                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                                placeholder="+966 5X XXX XXXX"
                                                dir="ltr"
                                                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-[#857E74] mb-1">
                                                {t('customer.pages.companies.modal.contactEmail')}
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.contactEmail}
                                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                                placeholder="representative@domain.sa"
                                                dir="ltr"
                                                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-[#F0ECE6] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#6E6862] transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.companies.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.companies.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
