import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MapPin,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Building2,
    Phone,
    Mail,
    Power,
    MapPinned,
    Users,
    Navigation,
} from 'lucide-react';

export type BranchType = 'headquarters' | 'regional_branch' | 'warehouse_logistics' | 'retail_service';
export type BranchStatus = 'active' | 'inactive';

export interface CustomerBranchItem {
    id: string;
    branchCode: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    nameEn: string;
    nameAr: string;
    branchType: BranchType;
    cityEn: string;
    cityAr: string;
    addressEn: string;
    addressAr: string;
    crNumber: string;
    managerNameEn: string;
    managerNameAr: string;
    phone: string;
    email: string;
    status: BranchStatus;
    activeEmployeesCount: number;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_branches_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const INITIAL_BRANCHES: CustomerBranchItem[] = [
    {
        id: 'brn-1',
        branchCode: 'BRN-RYD-01',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Riyadh Central Logistics Headquarters',
        nameAr: 'المقر الرئيسي اللوجستي بالرياض',
        branchType: 'headquarters',
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        addressEn: 'Al-Sulay Industrial District, Exit 18',
        addressAr: 'حي السلي الصناعي، مخرج 18',
        crNumber: '1010482910-001',
        managerNameEn: 'Sami Al-Ghamdi',
        managerNameAr: 'سامي الغامدي',
        phone: '+966 11 209 8800',
        email: 'riyadh.hq@alwataniya.sa',
        status: 'active',
        activeEmployeesCount: 185,
        createdAt: '2026-01-10',
    },
    {
        id: 'brn-2',
        branchCode: 'BRN-JED-02',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Jeddah Islamic Port Freight Terminal',
        nameAr: 'محطة الشحن بميناء جدة الإسلامي',
        branchType: 'warehouse_logistics',
        cityEn: 'Jeddah',
        cityAr: 'جدة',
        addressEn: 'Customs Bonded Zone, Jeddah Port Gate 4',
        addressAr: 'المنطقة الجمركية المساندة، ميناء جدة بوابة 4',
        crNumber: '1010482910-002',
        managerNameEn: 'Hani Al-Harbi',
        managerNameAr: 'هاني الحربي',
        phone: '+966 12 645 2200',
        email: 'jeddah.port@alwataniya.sa',
        status: 'active',
        activeEmployeesCount: 92,
        createdAt: '2026-01-20',
    },
    {
        id: 'brn-3',
        branchCode: 'BRN-DMM-03',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        nameEn: 'Dammam 2nd Industrial City Plant',
        nameAr: 'مصنع المدينة الصناعية الثانية بالدمام',
        branchType: 'regional_branch',
        cityEn: 'Dammam',
        cityAr: 'الدمام',
        addressEn: 'MODON 2nd Industrial Area, Street 64',
        addressAr: 'المدينة الصناعية الثانية (مدن)، شارع 64',
        crNumber: '2050192841-001',
        managerNameEn: 'Eng. Majed Al-Khaldi',
        managerNameAr: 'م. ماجد الخالدي',
        phone: '+966 13 812 7700',
        email: 'dammam.plant@riyadh-industrial.sa',
        status: 'active',
        activeEmployeesCount: 240,
        createdAt: '2026-02-01',
    },
    {
        id: 'brn-4',
        branchCode: 'BRN-KHB-04',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        nameEn: 'Al-Khobar Financial District Office',
        nameAr: 'فرع مركز الخبر المالي',
        branchType: 'regional_branch',
        cityEn: 'Al-Khobar',
        cityAr: 'الخبر',
        addressEn: 'King Fahd Road, Al-Hizam Al-Thahabi',
        addressAr: 'طريق الملك فهد، حي الحزام الذهبي',
        crNumber: '2051928412-001',
        managerNameEn: 'Waleed Al-Ghamdi',
        managerNameAr: 'وليد الغامدي',
        phone: '+966 13 898 4400',
        email: 'khobar@tamweel-cap.sa',
        status: 'active',
        activeEmployeesCount: 28,
        createdAt: '2026-02-10',
    },
    {
        id: 'brn-5',
        branchCode: 'BRN-MED-05',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        nameEn: 'Madinah Central Polyclinic & Diagnostic Hub',
        nameAr: 'مركز ومجمع عيادات المدينة المنورة',
        branchType: 'retail_service',
        cityEn: 'Madinah',
        cityAr: 'المدينة المنورة',
        addressEn: 'Sultana Commercial Street, Opp. Islamic University',
        addressAr: 'شارع سلطانة التجاري، مقابل الجامعة الإسلامية',
        crNumber: '4650192841-001',
        managerNameEn: 'Dr. Tariq Al-Juhani',
        managerNameAr: 'د. طارق الجهني',
        phone: '+966 14 840 9900',
        email: 'madinah.clinic@najm-health.sa',
        status: 'active',
        activeEmployeesCount: 65,
        createdAt: '2026-02-22',
    },
    {
        id: 'brn-6',
        branchCode: 'BRN-TBK-06',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        nameEn: 'Tabuk Regional Procurement Center',
        nameAr: 'مركز الإمداد والتموين الإقليمي بتبوك',
        branchType: 'warehouse_logistics',
        cityEn: 'Tabuk',
        cityAr: 'تبوك',
        addressEn: 'Prince Fahd Bin Sultan Road, Warehouse City',
        addressAr: 'طريق الأمير فهد بن سلطان، مدينة المستودعات',
        crNumber: '3550192841-001',
        managerNameEn: 'Saud Al-Anazi',
        managerNameAr: 'سعود العنزي',
        phone: '+966 14 428 1100',
        email: 'tabuk.hub@redsea-hospitality.sa',
        status: 'inactive',
        activeEmployeesCount: 14,
        createdAt: '2026-03-01',
    },
];

export const CustomerBranchesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence
    const [branches, setBranches] = useState<CustomerBranchItem[]>(() => {
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
        return INITIAL_BRANCHES;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
            }
        } catch {
            // ignore
        }
    }, [branches]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | BranchStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | BranchType>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Drawer and Modal
    const [viewingBranch, setViewingBranch] = useState<CustomerBranchItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        branchCode: '',
        companyId: DEMO_COMPANIES[0].id,
        nameEn: '',
        nameAr: '',
        branchType: 'regional_branch' as BranchType,
        cityEn: 'Riyadh',
        cityAr: 'الرياض',
        addressEn: '',
        addressAr: '',
        crNumber: '',
        managerNameEn: '',
        managerNameAr: '',
        phone: '+966 11',
        email: '',
        status: 'active' as BranchStatus,
        activeEmployeesCount: 15,
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        code?: string;
        city?: string;
        crNumber?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered branches
    const filteredBranches = useMemo(() => {
        const query = search.trim().toLowerCase();
        return branches.filter((b) => {
            const matchesQuery =
                !query ||
                b.branchCode.toLowerCase().includes(query) ||
                b.nameEn.toLowerCase().includes(query) ||
                b.nameAr.includes(search.trim()) ||
                b.companyNameEn.toLowerCase().includes(query) ||
                b.companyNameAr.includes(search.trim()) ||
                b.cityEn.toLowerCase().includes(query) ||
                b.cityAr.includes(search.trim()) ||
                b.addressEn.toLowerCase().includes(query) ||
                b.addressAr.includes(search.trim()) ||
                b.crNumber.includes(query) ||
                b.managerNameEn.toLowerCase().includes(query) ||
                b.managerNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            const matchesType = typeFilter === 'all' || b.branchType === typeFilter;
            const matchesCompany = companyFilter === 'all' || b.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesType && matchesCompany;
        });
    }, [branches, search, statusFilter, typeFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = branches.length;
        const hqCount = branches.filter((b) => b.branchType === 'headquarters').length;
        const activeCount = branches.filter((b) => b.status === 'active').length;
        const citiesCount = new Set(branches.map((b) => b.cityEn)).size;

        return {
            total,
            hqCount,
            activeCount,
            citiesCount,
        };
    }, [branches]);

    // Branch Type label
    const getTypeLabel = (type: BranchType) => {
        switch (type) {
            case 'headquarters':
                return t('customer.pages.branches.types.headquarters');
            case 'regional_branch':
                return t('customer.pages.branches.types.regional_branch');
            case 'warehouse_logistics':
                return t('customer.pages.branches.types.warehouse_logistics');
            case 'retail_service':
                return t('customer.pages.branches.types.retail_service');
            default:
                return type;
        }
    };

    // Toggle Status
    const handleToggleStatus = (id: string) => {
        setBranches((prev) =>
            prev.map((b) => {
                if (b.id === id) {
                    const nextStatus: BranchStatus = b.status === 'active' ? 'inactive' : 'active';
                    return { ...b, status: nextStatus };
                }
                return b;
            })
        );
        if (viewingBranch && viewingBranch.id === id) {
            setViewingBranch((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.branches.feedback.statusToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = branches.length + 1;
        setEditingBranchId(null);
        setFormErrors({});
        setFormData({
            branchCode: `BRN-CST-0${nextNum}`,
            companyId: DEMO_COMPANIES[0].id,
            nameEn: '',
            nameAr: '',
            branchType: 'regional_branch',
            cityEn: 'Riyadh',
            cityAr: 'الرياض',
            addressEn: '',
            addressAr: '',
            crNumber: '',
            managerNameEn: '',
            managerNameAr: '',
            phone: '+966 11',
            email: '',
            status: 'active',
            activeEmployeesCount: 10,
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerBranchItem) => {
        setEditingBranchId(item.id);
        setFormErrors({});
        setFormData({
            branchCode: item.branchCode,
            companyId: item.companyId,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            branchType: item.branchType,
            cityEn: item.cityEn,
            cityAr: item.cityAr,
            addressEn: item.addressEn,
            addressAr: item.addressAr,
            crNumber: item.crNumber,
            managerNameEn: item.managerNameEn,
            managerNameAr: item.managerNameAr,
            phone: item.phone,
            email: item.email,
            status: item.status,
            activeEmployeesCount: item.activeEmployeesCount,
        });
        setViewingBranch(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveBranch = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; code?: string; city?: string; crNumber?: string } = {};
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.branches.modal.validationName');
        }
        if (!formData.branchCode.trim()) {
            errors.code = t('customer.pages.branches.modal.validationCode');
        }
        if (!formData.cityEn.trim() && !formData.cityAr.trim()) {
            errors.city = t('customer.pages.branches.modal.validationCity');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];

        if (editingBranchId) {
            setBranches((prev) =>
                prev.map((b) => {
                    if (b.id === editingBranchId) {
                        return {
                            ...b,
                            branchCode: formData.branchCode.trim() || b.branchCode,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            nameEn: formData.nameEn.trim() || b.nameEn,
                            nameAr: formData.nameAr.trim() || b.nameAr,
                            branchType: formData.branchType,
                            cityEn: formData.cityEn.trim() || b.cityEn,
                            cityAr: formData.cityAr.trim() || b.cityAr,
                            addressEn: formData.addressEn.trim(),
                            addressAr: formData.addressAr.trim(),
                            crNumber: formData.crNumber.trim() || b.crNumber,
                            managerNameEn: formData.managerNameEn.trim(),
                            managerNameAr: formData.managerNameAr.trim(),
                            phone: formData.phone.trim(),
                            email: formData.email.trim(),
                            status: formData.status,
                            activeEmployeesCount: Number(formData.activeEmployeesCount) || 0,
                        };
                    }
                    return b;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.branches.feedback.branchUpdated'));
        } else {
            const newBranch: CustomerBranchItem = {
                id: `brn-${Date.now()}`,
                branchCode: formData.branchCode.trim() || `BRN-CST-${Date.now().toString().slice(-3)}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                nameEn: formData.nameEn.trim() || (isRtl ? 'فرع تشغيلي جديد' : 'New Operational Branch'),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim() || 'فرع تشغيلي جديد',
                branchType: formData.branchType,
                cityEn: formData.cityEn.trim() || 'Riyadh',
                cityAr: formData.cityAr.trim() || 'الرياض',
                addressEn: formData.addressEn.trim(),
                addressAr: formData.addressAr.trim(),
                crNumber: formData.crNumber.trim() || `${comp.code}-00${branches.length + 1}`,
                managerNameEn: formData.managerNameEn.trim() || 'Branch Supervisor',
                managerNameAr: formData.managerNameAr.trim() || 'مشرف الفرع',
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                status: formData.status,
                activeEmployeesCount: Number(formData.activeEmployeesCount) || 10,
                createdAt: '2026-03-12',
            };
            setBranches([newBranch, ...branches]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.branches.feedback.branchAdded'));
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
                                {t('customer.pages.branches.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-BRN
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.branches.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.branches.subtitle')}
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                        <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                        <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                    </span>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Branches */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.branches.kpis.totalBranches')}
                            </span>
                            <MapPin className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Central HQs */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.branches.kpis.hqBranches')}
                            </span>
                            <Building2 className="w-4 h-4 text-[#285799]" />
                        </div>
                        <p className="text-2xl font-bold text-[#285799] mt-2">{kpis.hqCount}</p>
                    </div>

                    {/* 3. Active Branches */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.branches.kpis.activeBranches')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#037F8C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.activeCount}</p>
                    </div>

                    {/* 4. Cities Covered */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#037F8C]">
                                {t('customer.pages.branches.kpis.citiesCount')}
                            </span>
                            <Navigation className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#037F8C] mt-2">{kpis.citiesCount}</p>
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
                        placeholder={t('customer.pages.branches.searchPlaceholder')}
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
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | BranchStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.branches.statusAll')}</option>
                        <option value="active">{t('customer.pages.branches.statusActive')}</option>
                        <option value="inactive">{t('customer.pages.branches.statusInactive')}</option>
                    </select>

                    {/* Branch Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'all' | BranchType)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.branches.typeAll')}</option>
                        <option value="headquarters">{t('customer.pages.branches.types.headquarters')}</option>
                        <option value="regional_branch">{t('customer.pages.branches.types.regional_branch')}</option>
                        <option value="warehouse_logistics">{t('customer.pages.branches.types.warehouse_logistics')}</option>
                        <option value="retail_service">{t('customer.pages.branches.types.retail_service')}</option>
                    </select>

                    {/* Company */}
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.branches.companyAll')}</option>
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
                            title={t('customer.pages.branches.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.branches.feedback.resetFilters')}</span>
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
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.branchName')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.company')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.cityAddress')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.manager')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.branches.table.status')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.branches.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredBranches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <MapPin className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.branches.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#037F8C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.branches.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBranches.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#037F8C]">
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                {item.branchCode}
                                            </span>
                                        </td>

                                        {/* Branch Name & Type */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="font-bold text-[#0D0D0D]">
                                                {isRtl ? item.nameAr : item.nameEn}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                                    {getTypeLabel(item.branchType)}
                                                </span>
                                                <span className="text-[10px] font-mono text-[#857E74]" dir="ltr">
                                                    CR: {item.crNumber}
                                                </span>
                                            </div>
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

                                        {/* City & Address */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <div className="flex items-center gap-1 text-[#0D0D0D] font-semibold">
                                                <MapPin className="w-3 h-3 text-[#037F8C] shrink-0" />
                                                <span>{isRtl ? item.cityAr : item.cityEn}</span>
                                            </div>
                                            <p className="text-[11px] text-[#857E74] truncate mt-0.5">
                                                {isRtl ? item.addressAr : item.addressEn}
                                            </p>
                                        </td>

                                        {/* Manager & Staff */}
                                        <td className="py-3.5 px-4">
                                            <p className="font-medium text-[#0D0D0D]">
                                                {isRtl ? item.managerNameAr : item.managerNameEn}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-[10px] text-[#857E74] mt-0.5">
                                                <Users className="w-2.5 h-2.5" />
                                                <span>{item.activeEmployeesCount} {isRtl ? 'موظف' : 'staff'}</span>
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            {item.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{t('customer.pages.branches.statusActive')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>{t('customer.pages.branches.statusInactive')}</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingBranch(item)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.branches.table.view')}
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
            {viewingBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <MapPinned className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingBranch.nameAr : viewingBranch.nameEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingBranch.branchCode}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingBranch.companyNameAr : viewingBranch.companyNameEn}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingBranch(null)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.branches.table.type')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                        {getTypeLabel(viewingBranch.branchType)}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.branches.details.crNumber')}
                                    </span>
                                    <p className="text-xs font-mono font-bold text-[#0D0D0D] mt-1" dir="ltr">
                                        {viewingBranch.crNumber}
                                    </p>
                                </div>
                            </div>

                            {/* Location & Address */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider block">
                                    {t('customer.pages.branches.details.locationDetails')}
                                </span>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#037F8C] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingBranch.cityAr : viewingBranch.cityEn}
                                        </p>
                                        <p className="text-xs text-[#6E6862] mt-0.5">
                                            {isRtl ? viewingBranch.addressAr : viewingBranch.addressEn}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Manager & Staffing */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#857E74] block mb-1">
                                        {t('customer.pages.branches.table.manager')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D]">
                                        {isRtl ? viewingBranch.managerNameAr : viewingBranch.managerNameEn}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#857E74] block mb-1">
                                        {t('customer.pages.branches.details.staffing')}
                                    </span>
                                    <p className="text-xs font-bold text-[#037F8C]">
                                        {viewingBranch.activeEmployeesCount} {isRtl ? 'موظفاً مسجلاً' : 'registered personnel'}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <Phone className="w-4 h-4 text-[#037F8C]" />
                                    <span className="text-xs font-mono font-medium" dir="ltr">
                                        {viewingBranch.phone}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <Mail className="w-4 h-4 text-[#037F8C]" />
                                    <span className="text-xs font-mono font-medium truncate" dir="ltr">
                                        {viewingBranch.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingBranch(null)}
                                className="px-4 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {t('customer.pages.branches.details.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingBranchId
                                            ? t('customer.pages.branches.modal.editTitle')
                                            : t('customer.pages.branches.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingBranchId
                                            ? t('customer.pages.branches.modal.editSubtitle')
                                            : t('customer.pages.branches.modal.addSubtitle')}
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
                        <form onSubmit={handleSaveBranch} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Company */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.code')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.branchCode}
                                            onChange={(e) => {
                                                setFormData({ ...formData, branchCode: e.target.value });
                                                if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
                                            }}
                                            placeholder="BRN-RYD-01"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                        {formErrors.code && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.code}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.company')} <span className="text-red-500">*</span>
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
                                            {t('customer.pages.branches.modal.nameAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameAr: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="اسم الفرع أو المقر بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.nameEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameEn: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="Branch name in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.name && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.name}</p>
                                )}

                                {/* Branch Type & Sub-CR Number */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.type')}
                                        </label>
                                        <select
                                            value={formData.branchType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, branchType: e.target.value as BranchType })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="headquarters">{t('customer.pages.branches.types.headquarters')}</option>
                                            <option value="regional_branch">{t('customer.pages.branches.types.regional_branch')}</option>
                                            <option value="warehouse_logistics">{t('customer.pages.branches.types.warehouse_logistics')}</option>
                                            <option value="retail_service">{t('customer.pages.branches.types.retail_service')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.crNumber')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.crNumber}
                                            onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                                            placeholder="1010482910-001"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* City & Addresses */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.cityAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cityAr}
                                            onChange={(e) => setFormData({ ...formData, cityAr: e.target.value })}
                                            placeholder="الرياض / جدة / الدمام"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.cityEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cityEn}
                                            onChange={(e) => setFormData({ ...formData, cityEn: e.target.value })}
                                            placeholder="Riyadh / Jeddah / Dammam"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Detailed Address */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.addressAr')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.addressAr}
                                            onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
                                            placeholder="الحي، الشارع، رقم المبنى..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.addressEn')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.addressEn}
                                            onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                                            placeholder="District, Street, Building Number..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Manager Names */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.managerAr')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.managerNameAr}
                                            onChange={(e) => setFormData({ ...formData, managerNameAr: e.target.value })}
                                            placeholder="اسم مدير الفرع بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.managerEn')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.managerNameEn}
                                            onChange={(e) => setFormData({ ...formData, managerNameEn: e.target.value })}
                                            placeholder="Branch manager in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Phone, Email, Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.phone')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+966 11 200 0000"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.email')}
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="branch@company.sa"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.branches.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as BranchStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#037F8C] cursor-pointer"
                                        >
                                            <option value="active">{t('customer.pages.branches.statusActive')}</option>
                                            <option value="inactive">{t('customer.pages.branches.statusInactive')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.branches.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#037F8C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.branches.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
