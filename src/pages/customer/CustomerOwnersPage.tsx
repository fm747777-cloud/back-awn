import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    UserCheck,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Building2,
    PieChart,
    Shield,
    Phone,
    Mail,
    Power,
    Percent,
} from 'lucide-react';

export type OwnerType = 'individual' | 'corporate' | 'foreign_investor' | 'institutional';
export type OwnerStatus = 'active' | 'inactive';

export interface CustomerOwnerItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    ownerNameEn: string;
    ownerNameAr: string;
    ownerType: OwnerType;
    ownershipPercentage: number;
    nationalIdOrCr: string;
    nationalityEn: string;
    nationalityAr: string;
    phone: string;
    email: string;
    status: OwnerStatus;
    votingPower: boolean;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_owners_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const INITIAL_OWNERS: CustomerOwnerItem[] = [
    {
        id: 'own-1',
        code: 'OWN-201',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        ownerNameEn: 'Sheikh Abdulaziz Al-Muqrin',
        ownerNameAr: 'الشيخ عبدالعزيز المقرن',
        ownerType: 'individual',
        ownershipPercentage: 55.0,
        nationalIdOrCr: '1018928401',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        phone: '+966 50 541 2288',
        email: 'a.muqrin@alwataniya.sa',
        status: 'active',
        votingPower: true,
        notes: 'Founding majority shareholder with full commercial governance authority.',
        createdAt: '2026-01-05',
    },
    {
        id: 'own-2',
        code: 'OWN-202',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        ownerNameEn: 'Olayan Logistics Capital Ltd.',
        ownerNameAr: 'شركة العليان للاستثمار اللوجستي',
        ownerType: 'corporate',
        ownershipPercentage: 45.0,
        nationalIdOrCr: '7001928401',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودية (كيان تجاري)',
        phone: '+966 11 498 7700',
        email: 'investments@olayan-capital.sa',
        status: 'active',
        votingPower: true,
        notes: 'Institutional strategic partner holding representative board seat.',
        createdAt: '2026-01-12',
    },
    {
        id: 'own-3',
        code: 'OWN-203',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        ownerNameEn: 'Al-Khereiji Industrial Fund',
        ownerNameAr: 'صندوق الخريجي للاستثمار الصناعي',
        ownerType: 'institutional',
        ownershipPercentage: 65.0,
        nationalIdOrCr: '7028192048',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'صندوق استثماري مرخص',
        phone: '+966 11 210 5000',
        email: 'directors@khereiji-fund.sa',
        status: 'active',
        votingPower: true,
        notes: 'CMA licensed private equity vehicle funding regional manufacturing expansion.',
        createdAt: '2026-01-18',
    },
    {
        id: 'own-4',
        code: 'OWN-204',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        ownerNameEn: 'Sultan Bin Khalid Al-Saud',
        ownerNameAr: 'سلطان بن خالد آل سعود',
        ownerType: 'individual',
        ownershipPercentage: 51.0,
        nationalIdOrCr: '1004928172',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        phone: '+966 55 491 8000',
        email: 'sultan@tamweel-cap.sa',
        status: 'active',
        votingPower: true,
        notes: 'Managing partner and registered beneficial owner with ZATCA filings.',
        createdAt: '2026-02-01',
    },
    {
        id: 'own-5',
        code: 'OWN-205',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        ownerNameEn: 'Gulf Medical Horizons Co.',
        ownerNameAr: 'شركة آفاق الخليج الطبية',
        ownerType: 'corporate',
        ownershipPercentage: 40.0,
        nationalIdOrCr: '1010398291',
        nationalityEn: 'Kuwait / GCC',
        nationalityAr: 'خليجي (الكويت)',
        phone: '+965 22 901 400',
        email: 'governance@gulfmed.com',
        status: 'active',
        votingPower: true,
        notes: 'MISA licensed regional healthcare group with verified beneficial owner disclosures.',
        createdAt: '2026-02-15',
    },
    {
        id: 'own-6',
        code: 'OWN-206',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        ownerNameEn: 'Global Coastal Resorts S.A.',
        ownerNameAr: 'مجموعة المنتجعات الساحلية العالمية',
        ownerType: 'foreign_investor',
        ownershipPercentage: 25.0,
        nationalIdOrCr: '7091823901',
        nationalityEn: 'Switzerland',
        nationalityAr: 'أجنبي (سويسرا)',
        phone: '+41 22 710 8820',
        email: 'legal@globalcoastal.ch',
        status: 'inactive',
        votingPower: false,
        notes: 'Restructuring ownership share via Ministry of Investment foreign investor portal.',
        createdAt: '2026-02-28',
    },
];

export const CustomerOwnersPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence
    const [owners, setOwners] = useState<CustomerOwnerItem[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch {
            // fallback
        }
        return INITIAL_OWNERS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(owners));
            }
        } catch {
            // ignore
        }
    }, [owners]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OwnerStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | OwnerType>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Drawer and Modal
    const [viewingOwner, setViewingOwner] = useState<CustomerOwnerItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0].id,
        ownerNameEn: '',
        ownerNameAr: '',
        ownerType: 'individual' as OwnerType,
        ownershipPercentage: 25.0,
        nationalIdOrCr: '',
        nationalityEn: 'Saudi Arabia',
        nationalityAr: 'سعودي',
        phone: '+966 5',
        email: '',
        status: 'active' as OwnerStatus,
        votingPower: true,
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        percentage?: string;
        nationalId?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered Owners
    const filteredOwners = useMemo(() => {
        const query = search.trim().toLowerCase();
        return owners.filter((item) => {
            const matchesQuery =
                !query ||
                item.code.toLowerCase().includes(query) ||
                item.ownerNameEn.toLowerCase().includes(query) ||
                item.ownerNameAr.includes(search.trim()) ||
                item.companyNameEn.toLowerCase().includes(query) ||
                item.companyNameAr.includes(search.trim()) ||
                item.nationalIdOrCr.includes(query) ||
                item.email.toLowerCase().includes(query) ||
                item.phone.includes(query);

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesType = typeFilter === 'all' || item.ownerType === typeFilter;
            const matchesCompany = companyFilter === 'all' || item.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesType && matchesCompany;
        });
    }, [owners, search, statusFilter, typeFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = owners.length;
        const corporateCount = owners.filter((o) => o.ownerType === 'corporate' || o.ownerType === 'institutional').length;
        const activeCount = owners.filter((o) => o.status === 'active').length;
        const avgStake = total > 0 ? (owners.reduce((acc, o) => acc + o.ownershipPercentage, 0) / total).toFixed(1) : '0';

        return {
            total,
            corporateCount,
            activeCount,
            avgStake,
        };
    }, [owners]);

    // Type label
    const getTypeLabel = (type: OwnerType) => {
        switch (type) {
            case 'individual':
                return t('customer.pages.owners.types.individual');
            case 'corporate':
                return t('customer.pages.owners.types.corporate');
            case 'institutional':
                return t('customer.pages.owners.types.institutional');
            case 'foreign_investor':
                return t('customer.pages.owners.types.foreign_investor');
            default:
                return type;
        }
    };

    // Toggle Status
    const handleToggleStatus = (id: string) => {
        setOwners((prev) =>
            prev.map((o) => {
                if (o.id === id) {
                    const nextStatus: OwnerStatus = o.status === 'active' ? 'inactive' : 'active';
                    return { ...o, status: nextStatus };
                }
                return o;
            })
        );
        if (viewingOwner && viewingOwner.id === id) {
            setViewingOwner((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.owners.feedback.statusToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = owners.length + 201;
        setEditingOwnerId(null);
        setFormErrors({});
        setFormData({
            code: `OWN-${nextNum}`,
            companyId: DEMO_COMPANIES[0].id,
            ownerNameEn: '',
            ownerNameAr: '',
            ownerType: 'individual',
            ownershipPercentage: 20.0,
            nationalIdOrCr: '',
            nationalityEn: 'Saudi Arabia',
            nationalityAr: 'سعودي',
            phone: '+966 5',
            email: '',
            status: 'active',
            votingPower: true,
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerOwnerItem) => {
        setEditingOwnerId(item.id);
        setFormErrors({});
        setFormData({
            code: item.code,
            companyId: item.companyId,
            ownerNameEn: item.ownerNameEn,
            ownerNameAr: item.ownerNameAr,
            ownerType: item.ownerType,
            ownershipPercentage: item.ownershipPercentage,
            nationalIdOrCr: item.nationalIdOrCr,
            nationalityEn: item.nationalityEn,
            nationalityAr: item.nationalityAr,
            phone: item.phone,
            email: item.email,
            status: item.status,
            votingPower: item.votingPower,
            notes: item.notes || '',
        });
        setViewingOwner(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveOwner = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; percentage?: string; nationalId?: string } = {};
        if (!formData.ownerNameEn.trim() && !formData.ownerNameAr.trim()) {
            errors.name = t('customer.pages.owners.modal.validationName');
        }
        const pct = Number(formData.ownershipPercentage);
        if (isNaN(pct) || pct <= 0 || pct > 100) {
            errors.percentage = t('customer.pages.owners.modal.validationPercentage');
        }
        if (!formData.nationalIdOrCr.trim()) {
            errors.nationalId = t('customer.pages.owners.modal.validationNationalId');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];

        if (editingOwnerId) {
            setOwners((prev) =>
                prev.map((o) => {
                    if (o.id === editingOwnerId) {
                        return {
                            ...o,
                            code: formData.code.trim() || o.code,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            ownerNameEn: formData.ownerNameEn.trim() || o.ownerNameEn,
                            ownerNameAr: formData.ownerNameAr.trim() || o.ownerNameAr,
                            ownerType: formData.ownerType,
                            ownershipPercentage: Number(formData.ownershipPercentage),
                            nationalIdOrCr: formData.nationalIdOrCr.trim(),
                            nationalityEn: formData.nationalityEn.trim(),
                            nationalityAr: formData.nationalityAr.trim(),
                            phone: formData.phone.trim(),
                            email: formData.email.trim(),
                            status: formData.status,
                            votingPower: formData.votingPower,
                            notes: formData.notes.trim(),
                        };
                    }
                    return o;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.owners.feedback.ownerUpdated'));
        } else {
            const newOwner: CustomerOwnerItem = {
                id: `own-${Date.now()}`,
                code: formData.code.trim() || `OWN-${Date.now().toString().slice(-3)}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                ownerNameEn: formData.ownerNameEn.trim() || (isRtl ? 'شريك جديد' : 'New Shareholder'),
                ownerNameAr: formData.ownerNameAr.trim() || formData.ownerNameEn.trim() || 'شريك جديد',
                ownerType: formData.ownerType,
                ownershipPercentage: Number(formData.ownershipPercentage),
                nationalIdOrCr: formData.nationalIdOrCr.trim(),
                nationalityEn: formData.nationalityEn.trim() || 'Saudi Arabia',
                nationalityAr: formData.nationalityAr.trim() || 'سعودي',
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                status: formData.status,
                votingPower: formData.votingPower,
                notes: formData.notes.trim(),
                createdAt: '2026-03-12',
            };
            setOwners([newOwner, ...owners]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.owners.feedback.ownerAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setTypeFilter('all');
        setCompanyFilter('all');
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast */}
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
                                {t('customer.pages.owners.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-OWN
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.owners.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.owners.subtitle')}
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                        <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                        <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                    </span>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Owners */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.owners.kpis.totalOwners')}
                            </span>
                            <UserCheck className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Institutional Entities */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.owners.kpis.corporateOwners')}
                            </span>
                            <Building2 className="w-4 h-4 text-[#285799]" />
                        </div>
                        <p className="text-2xl font-bold text-[#285799] mt-2">{kpis.corporateCount}</p>
                    </div>

                    {/* 3. Average Equity Stake */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.owners.kpis.avgStake')}
                            </span>
                            <Percent className="w-4 h-4 text-[#B45309]" />
                        </div>
                        <p className="text-2xl font-bold text-[#B45309] mt-2">{kpis.avgStake}%</p>
                    </div>

                    {/* 4. Active Owners */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.owners.kpis.activeOwners')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.activeCount}</p>
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
                        placeholder={t('customer.pages.owners.searchPlaceholder')}
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

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | OwnerStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.owners.statusAll')}</option>
                        <option value="active">{t('customer.pages.owners.statusActive')}</option>
                        <option value="inactive">{t('customer.pages.owners.statusInactive')}</option>
                    </select>

                    {/* Owner Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'all' | OwnerType)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.owners.typeAll')}</option>
                        <option value="individual">{t('customer.pages.owners.types.individual')}</option>
                        <option value="corporate">{t('customer.pages.owners.types.corporate')}</option>
                        <option value="institutional">{t('customer.pages.owners.types.institutional')}</option>
                        <option value="foreign_investor">{t('customer.pages.owners.types.foreign_investor')}</option>
                    </select>

                    {/* Company */}
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.owners.companyAll')}</option>
                        {DEMO_COMPANIES.map((cmp) => (
                            <option key={cmp.id} value={cmp.id}>
                                {isRtl ? cmp.nameAr : cmp.nameEn}
                            </option>
                        ))}
                    </select>

                    {(search || statusFilter !== 'all' || typeFilter !== 'all' || companyFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#857E74] hover:text-[#0D0D0D] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                            title={t('customer.pages.owners.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.owners.feedback.resetFilters')}</span>
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
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.ownerName')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.company')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.type')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.stake')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.nationalId')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.owners.table.status')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.owners.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredOwners.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <UserCheck className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.owners.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#037F8C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.owners.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOwners.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]">
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                {item.code}
                                            </span>
                                        </td>

                                        {/* Owner Name & Nationality */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="font-bold text-[#0D0D0D]">
                                                {isRtl ? item.ownerNameAr : item.ownerNameEn}
                                            </p>
                                            <p className="text-[11px] text-[#857E74] mt-0.5">
                                                {isRtl ? item.nationalityAr : item.nationalityEn}
                                            </p>
                                        </td>

                                        {/* Company */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span className="font-medium text-[#0D0D0D] truncate max-w-[140px]">
                                                    {isRtl ? item.companyNameAr : item.companyNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Type */}
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                                                {getTypeLabel(item.ownerType)}
                                            </span>
                                        </td>

                                        {/* Stake % */}
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-[#0D0D0D] font-mono">
                                                    {item.ownershipPercentage}%
                                                </span>
                                                <div className="w-16 h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#037F8C] rounded-full"
                                                        style={{ width: `${Math.min(item.ownershipPercentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* National ID / CR */}
                                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#595550]" dir="ltr">
                                            {item.nationalIdOrCr}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            {item.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{t('customer.pages.owners.statusActive')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>{t('customer.pages.owners.statusInactive')}</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingOwner(item)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.owners.table.view')}
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

            {/* View Details Drawer */}
            {viewingOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <PieChart className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingOwner.ownerNameAr : viewingOwner.ownerNameEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingOwner.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingOwner.companyNameAr : viewingOwner.companyNameEn}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingOwner(null)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Ownership Stake Card */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-[#857E74]">
                                        {t('customer.pages.owners.table.stake')}
                                    </span>
                                    <span className="text-lg font-bold font-mono text-[#037F8C]">
                                        {viewingOwner.ownershipPercentage}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-[#EFECE6] rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-[#037F8C] rounded-full"
                                        style={{ width: `${Math.min(viewingOwner.ownershipPercentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.owners.table.type')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                        {getTypeLabel(viewingOwner.ownerType)}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.owners.details.nationalId')}
                                    </span>
                                    <p className="text-xs font-mono font-bold text-[#0D0D0D] mt-1" dir="ltr">
                                        {viewingOwner.nationalIdOrCr}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Channels */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                                <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider block">
                                    {t('customer.pages.owners.details.contactChannels')}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <Phone className="w-4 h-4 text-[#037F8C]" />
                                        <span className="text-xs font-mono font-medium" dir="ltr">
                                            {viewingOwner.phone}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <Mail className="w-4 h-4 text-[#037F8C]" />
                                        <span className="text-xs font-mono font-medium truncate" dir="ltr">
                                            {viewingOwner.email}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Governance & Voting Power */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[#037F8C]" />
                                    <span className="text-xs font-semibold text-[#0D0D0D]">
                                        {t('customer.pages.owners.details.votingRights')}:
                                    </span>
                                    <span className="text-xs font-bold text-[#037F8C]">
                                        {viewingOwner.votingPower ? t('customer.pages.owners.details.authorized') : t('customer.pages.owners.details.silent')}
                                    </span>
                                </div>

                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold">
                                    {viewingOwner.status === 'active' ? (
                                        <span className="text-[#037F8C]">{t('customer.pages.owners.statusActive')}</span>
                                    ) : (
                                        <span className="text-[#857E74]">{t('customer.pages.owners.statusInactive')}</span>
                                    )}
                                </span>
                            </div>

                            {/* Internal Notes */}
                            {viewingOwner.notes && (
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-xs font-semibold text-[#857E74] block mb-1">
                                        {t('customer.pages.owners.details.notes')}
                                    </span>
                                    <p className="text-xs text-[#0D0D0D] leading-relaxed">{viewingOwner.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingOwner(null)}
                                className="px-4 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {t('customer.pages.owners.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal (Disabled in view-only Customer Portal) */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingOwnerId
                                            ? t('customer.pages.owners.modal.editTitle')
                                            : t('customer.pages.owners.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingOwnerId
                                            ? t('customer.pages.owners.modal.editSubtitle')
                                            : t('customer.pages.owners.modal.addSubtitle')}
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

                        {/* Form */}
                        <form onSubmit={handleSaveOwner} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Company */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="OWN-201"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.company')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.companyId}
                                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            {DEMO_COMPANIES.map((cmp) => (
                                                <option key={cmp.id} value={cmp.id}>
                                                    {isRtl ? cmp.nameAr : cmp.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Names */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.nameAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ownerNameAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, ownerNameAr: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="اسم الشريك بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.nameEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.ownerNameEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, ownerNameEn: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="Owner name in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.name && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.name}</p>
                                )}

                                {/* Owner Type & Stake % */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.type')}
                                        </label>
                                        <select
                                            value={formData.ownerType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, ownerType: e.target.value as OwnerType })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="individual">{t('customer.pages.owners.types.individual')}</option>
                                            <option value="corporate">{t('customer.pages.owners.types.corporate')}</option>
                                            <option value="institutional">{t('customer.pages.owners.types.institutional')}</option>
                                            <option value="foreign_investor">{t('customer.pages.owners.types.foreign_investor')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.percentage')} <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="100"
                                                step="0.1"
                                                value={formData.ownershipPercentage}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, ownershipPercentage: Number(e.target.value) });
                                                    if (formErrors.percentage) setFormErrors({ ...formErrors, percentage: undefined });
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            />
                                            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#857E74]">
                                                %
                                            </span>
                                        </div>
                                        {formErrors.percentage && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.percentage}</p>
                                        )}
                                    </div>
                                </div>

                                {/* National ID / CR & Nationality */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.nationalId')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nationalIdOrCr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nationalIdOrCr: e.target.value });
                                                if (formErrors.nationalId) setFormErrors({ ...formErrors, nationalId: undefined });
                                            }}
                                            placeholder="1018928401 / 7001928401"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                        {formErrors.nationalId && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.nationalId}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.nationality')}
                                        </label>
                                        <input
                                            type="text"
                                            value={isRtl ? formData.nationalityAr : formData.nationalityEn}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    nationalityEn: e.target.value,
                                                    nationalityAr: e.target.value,
                                                })
                                            }
                                            placeholder="Saudi Arabia / سعودي"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                        />
                                    </div>
                                </div>

                                {/* Phone & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.phone')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+966 50 123 4567"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.email')}
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="owner@company.sa"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Status & Voting Rights */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.owners.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as OwnerStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="active">{t('customer.pages.owners.statusActive')}</option>
                                            <option value="inactive">{t('customer.pages.owners.statusInactive')}</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.votingPower}
                                                onChange={(e) => setFormData({ ...formData, votingPower: e.target.checked })}
                                                className="w-4 h-4 rounded text-[#037F8C] focus:ring-[#037F8C] border-[#D6CFC4] cursor-pointer"
                                            />
                                            <span>{t('customer.pages.owners.modal.votingPowerLabel')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('customer.pages.owners.modal.notes')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="تفاصيل عقد التأسيس ومحضر الجمعية..."
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.owners.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.owners.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
