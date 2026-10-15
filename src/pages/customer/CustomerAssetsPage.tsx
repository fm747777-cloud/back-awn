import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Grid,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Building2,
    Power,
    Wrench,
    Coins,
    Truck,
    Server,
    Cog,
    Layers,
} from 'lucide-react';

export type AssetCategory = 'heavy_equipment' | 'fleet_vehicle' | 'it_infrastructure' | 'machinery' | 'facility_asset';
export type AssetStatus = 'operational' | 'under_maintenance' | 'reserved' | 'decommissioned';

export interface CustomerAssetItem {
    id: string;
    assetCode: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    nameEn: string;
    nameAr: string;
    category: AssetCategory;
    serialOrPlate: string;
    assignedLocationEn: string;
    assignedLocationAr: string;
    valuationSar: number;
    purchaseDate: string;
    status: AssetStatus;
    notes?: string;
}

const STORAGE_KEY = 'awn_customer_assets_v1';

const DEMO_COMPANIES = [
    { id: 'cmp-1', code: 'CMP-1001', nameEn: 'Al-Wataniya Logistics Co.', nameAr: 'الشركة الوطنية للخدمات اللوجستية' },
    { id: 'cmp-2', code: 'CMP-1002', nameEn: 'Riyadh Industrial Holdings', nameAr: 'القابضة الصناعية بالرياض' },
    { id: 'cmp-3', code: 'CMP-1003', nameEn: 'Tamweel Capital Partners', nameAr: 'تمويل كابيتال المالية' },
    { id: 'cmp-4', code: 'CMP-1004', nameEn: 'Najm Healthcare Network', nameAr: 'شبكة نجم للرعاية الصحية' },
    { id: 'cmp-5', code: 'CMP-1005', nameEn: 'Horizon Digital Technologies', nameAr: 'تقنيات الأفق الرقمية' },
    { id: 'cmp-6', code: 'CMP-1006', nameEn: 'Red Sea Hospitality & Resorts', nameAr: 'الضيافة والمنتجعات بالبحر الأحمر' },
];

const INITIAL_ASSETS: CustomerAssetItem[] = [
    {
        id: 'ast-1',
        assetCode: 'AST-501',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Mercedes-Benz Actros 3340 Prime Mover',
        nameAr: 'شاحنة مرسيدس أكتروس 3340 للنقل الثقيل',
        category: 'fleet_vehicle',
        serialOrPlate: '7821-BTA',
        assignedLocationEn: 'Jeddah Central Logistics Terminal',
        assignedLocationAr: 'محطة جدة المركزية للخدمات اللوجستية',
        valuationSar: 420000,
        purchaseDate: '2024-05-12',
        status: 'operational',
        notes: 'GPS telematics installed; periodic inspection valid until 2027.',
    },
    {
        id: 'ast-2',
        assetCode: 'AST-502',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        nameEn: 'Caterpillar 320D Hydraulic Excavator',
        nameAr: 'حفار كاتربيلر هيدروليكي موديل 320D',
        category: 'heavy_equipment',
        serialOrPlate: 'CAT-320D-98124',
        assignedLocationEn: 'Sudair Industrial City Quarry',
        assignedLocationAr: 'محجر مدينة سدير الصناعية',
        valuationSar: 780000,
        purchaseDate: '2023-11-20',
        status: 'operational',
        notes: 'Full service contract with Zahid Tractor dealership.',
    },
    {
        id: 'ast-3',
        assetCode: 'AST-503',
        companyId: 'cmp-5',
        companyNameEn: 'Horizon Digital Technologies',
        companyNameAr: 'تقنيات الأفق الرقمية',
        nameEn: 'Dell PowerEdge R760 Rack Server Cluster',
        nameAr: 'مصفوفة خوادم ديل باور إيدج R760',
        category: 'it_infrastructure',
        serialOrPlate: 'SRV-DL-882910',
        assignedLocationEn: 'Tier-III Primary Datacenter (Riyadh)',
        assignedLocationAr: 'مركز البيانات الرئيسي (الرياض)',
        valuationSar: 350000,
        purchaseDate: '2025-02-14',
        status: 'operational',
        notes: 'Dual redundant PSU; enterprise NVMe storage arrays.',
    },
    {
        id: 'ast-4',
        assetCode: 'AST-504',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        nameEn: 'Siemens Magnetom Altea 1.5T MRI Scanner',
        nameAr: 'جهاز رنين مغناطيسي سيمنز 1.5 تسلا',
        category: 'machinery',
        serialOrPlate: 'MOH-RAD-449102',
        assignedLocationEn: 'Al-Rayyan Specialist Medical Complex',
        assignedLocationAr: 'مجمع الريان الطبي التخصصي',
        valuationSar: 2400000,
        purchaseDate: '2024-08-30',
        status: 'under_maintenance',
        notes: 'Scheduled helium cryogenic cooling maintenance.',
    },
    {
        id: 'ast-5',
        assetCode: 'AST-505',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        nameEn: 'Caterpillar 500kVA Soundproof Generator',
        nameAr: 'مولد كهربائي كاتربيلر عازل للصوت 500 كيلو فولت',
        category: 'facility_asset',
        serialOrPlate: 'GEN-CAT-500K-01',
        assignedLocationEn: 'Umluj Coral Beach Resort Island',
        assignedLocationAr: 'منتجع شاطئ المرجان بجزر أملج',
        valuationSar: 290000,
        purchaseDate: '2024-01-18',
        status: 'operational',
        notes: 'Primary backup power for island desalination and lighting.',
    },
    {
        id: 'ast-6',
        assetCode: 'AST-506',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Toyota 8FBN25 Electric Forklift (2.5 Ton)',
        nameAr: 'رافعة شوكية كهربائية تويوتا حمولة 2.5 طن',
        category: 'heavy_equipment',
        serialOrPlate: 'TYT-FL-25-1092',
        assignedLocationEn: 'Dammam Dry Port Distribution Hub',
        assignedLocationAr: 'مستودع الميناء الجاف بالدمام',
        valuationSar: 125000,
        purchaseDate: '2023-04-10',
        status: 'decommissioned',
        notes: 'Retired following battery cycle expiration; slated for salvage auction.',
    },
];

export const CustomerAssetsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in localStorage
    const [assets, setAssets] = useState<CustomerAssetItem[]>(() => {
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
        return INITIAL_ASSETS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
            }
        } catch {
            // ignore
        }
    }, [assets]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | AssetStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Modals & Drawer
    const [viewingAsset, setViewingAsset] = useState<CustomerAssetItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        assetCode: '',
        companyId: DEMO_COMPANIES[0].id,
        nameEn: '',
        nameAr: '',
        category: 'heavy_equipment' as AssetCategory,
        serialOrPlate: '',
        assignedLocationEn: '',
        assignedLocationAr: '',
        valuationSar: 100000,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'operational' as AssetStatus,
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        code?: string;
        serial?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered assets
    const filteredAssets = useMemo(() => {
        const query = search.trim().toLowerCase();
        return assets.filter((ast) => {
            const matchesQuery =
                !query ||
                ast.assetCode.toLowerCase().includes(query) ||
                ast.nameEn.toLowerCase().includes(query) ||
                ast.nameAr.includes(search.trim()) ||
                ast.serialOrPlate.toLowerCase().includes(query) ||
                ast.assignedLocationEn.toLowerCase().includes(query) ||
                ast.assignedLocationAr.includes(search.trim()) ||
                ast.companyNameEn.toLowerCase().includes(query) ||
                ast.companyNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || ast.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || ast.category === categoryFilter;
            const matchesCompany = companyFilter === 'all' || ast.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesCategory && matchesCompany;
        });
    }, [assets, search, statusFilter, categoryFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = assets.length;
        const operational = assets.filter((a) => a.status === 'operational').length;
        const maintenance = assets.filter((a) => a.status === 'under_maintenance').length;
        const totalValue = assets.reduce((acc, a) => acc + (a.valuationSar || 0), 0);

        return {
            total,
            operational,
            maintenance,
            totalValue,
        };
    }, [assets]);

    // Status transition helper
    const handleToggleStatus = (id: string) => {
        setAssets((prev) =>
            prev.map((a) => {
                if (a.id === id) {
                    const nextStatus: AssetStatus =
                        a.status === 'operational'
                            ? 'under_maintenance'
                            : a.status === 'under_maintenance'
                            ? 'operational'
                            : 'operational';
                    return { ...a, status: nextStatus };
                }
                return a;
            })
        );
        if (viewingAsset && viewingAsset.id === id) {
            setViewingAsset((prev) =>
                prev
                    ? {
                          ...prev,
                          status: prev.status === 'operational' ? 'under_maintenance' : 'operational',
                      }
                    : null
            );
        }
        showToast(t('customer.pages.assets.feedback.statusToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = assets.length + 501;
        setEditingAssetId(null);
        setFormErrors({});
        setFormData({
            assetCode: `AST-${nextNum}`,
            companyId: DEMO_COMPANIES[0].id,
            nameEn: '',
            nameAr: '',
            category: 'heavy_equipment',
            serialOrPlate: '',
            assignedLocationEn: '',
            assignedLocationAr: '',
            valuationSar: 250000,
            purchaseDate: new Date().toISOString().split('T')[0],
            status: 'operational',
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerAssetItem) => {
        setEditingAssetId(item.id);
        setFormErrors({});
        setFormData({
            assetCode: item.assetCode,
            companyId: item.companyId,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            category: item.category,
            serialOrPlate: item.serialOrPlate,
            assignedLocationEn: item.assignedLocationEn,
            assignedLocationAr: item.assignedLocationAr,
            valuationSar: item.valuationSar,
            purchaseDate: item.purchaseDate,
            status: item.status,
            notes: item.notes || '',
        });
        setViewingAsset(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveAsset = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; code?: string; serial?: string } = {};
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.assets.modal.validationName');
        }
        if (!formData.assetCode.trim()) {
            errors.code = t('customer.pages.assets.modal.validationCode');
        }
        if (!formData.serialOrPlate.trim()) {
            errors.serial = t('customer.pages.assets.modal.validationSerial');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];

        if (editingAssetId) {
            setAssets((prev) =>
                prev.map((a) => {
                    if (a.id === editingAssetId) {
                        return {
                            ...a,
                            assetCode: formData.assetCode.trim() || a.assetCode,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            nameEn: formData.nameEn.trim() || a.nameEn,
                            nameAr: formData.nameAr.trim() || a.nameAr,
                            category: formData.category,
                            serialOrPlate: formData.serialOrPlate.trim(),
                            assignedLocationEn: formData.assignedLocationEn.trim(),
                            assignedLocationAr: formData.assignedLocationAr.trim(),
                            valuationSar: Number(formData.valuationSar) || 0,
                            purchaseDate: formData.purchaseDate,
                            status: formData.status,
                            notes: formData.notes.trim(),
                        };
                    }
                    return a;
                })
            );
            showToast(t('customer.pages.assets.feedback.assetUpdated'));
        } else {
            const newAsset: CustomerAssetItem = {
                id: `ast-${Date.now()}`,
                assetCode: formData.assetCode.trim() || `AST-${assets.length + 501}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                nameEn: formData.nameEn.trim() || formData.nameAr.trim(),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim(),
                category: formData.category,
                serialOrPlate: formData.serialOrPlate.trim(),
                assignedLocationEn: formData.assignedLocationEn.trim(),
                assignedLocationAr: formData.assignedLocationAr.trim(),
                valuationSar: Number(formData.valuationSar) || 0,
                purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
                status: formData.status,
                notes: formData.notes.trim(),
            };
            setAssets((prev) => [newAsset, ...prev]);
            showToast(t('customer.pages.assets.feedback.assetAdded'));
        }

        setIsFormModalOpen(false);
    };

    const getCategoryIcon = (cat: AssetCategory) => {
        switch (cat) {
            case 'fleet_vehicle':
                return <Truck className="w-3.5 h-3.5" />;
            case 'it_infrastructure':
                return <Server className="w-3.5 h-3.5" />;
            case 'machinery':
            case 'heavy_equipment':
                return <Cog className="w-3.5 h-3.5" />;
            default:
                return <Layers className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#265938] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-xl text-[#265938] dark:text-emerald-400">
                            <Grid className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {t('customer.pages.assets.title')}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-AST
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {t('customer.pages.assets.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={handleStartAdd}
                        className="bg-[#265938] hover:bg-[#1E472D] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('customer.pages.assets.addAsset')}</span>
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.assets.kpis.totalAssets')}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#265938] dark:text-emerald-400">
                        <Grid className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.assets.kpis.operationalAssets')}
                        </p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {kpis.operational}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.assets.kpis.underMaintenance')}
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {kpis.maintenance}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Wrench className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t('customer.pages.assets.kpis.totalValueSar')}
                        </p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {kpis.totalValue.toLocaleString()} SAR
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Coins className="w-6 h-6" />
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
                            placeholder={t('customer.pages.assets.searchPlaceholder')}
                            className="w-full ps-9 pe-9 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#265938]"
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
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.assets.statusAll')}</option>
                            <option value="operational">{t('customer.pages.assets.status_operational')}</option>
                            <option value="under_maintenance">{t('customer.pages.assets.status_under_maintenance')}</option>
                            <option value="reserved">{t('customer.pages.assets.status_reserved')}</option>
                            <option value="decommissioned">{t('customer.pages.assets.status_decommissioned')}</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.assets.categoryAll')}</option>
                            <option value="heavy_equipment">{t('customer.pages.assets.categories.heavy_equipment')}</option>
                            <option value="fleet_vehicle">{t('customer.pages.assets.categories.fleet_vehicle')}</option>
                            <option value="it_infrastructure">{t('customer.pages.assets.categories.it_infrastructure')}</option>
                            <option value="machinery">{t('customer.pages.assets.categories.machinery')}</option>
                            <option value="facility_asset">{t('customer.pages.assets.categories.facility_asset')}</option>
                        </select>

                        {/* Company Filter */}
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{t('customer.pages.assets.companyAll')}</option>
                            {DEMO_COMPANIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>

                        {(search || statusFilter !== 'all' || categoryFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setCategoryFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{t('customer.pages.assets.feedback.resetFilters')}</span>
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
                                    {t('customer.pages.assets.table.code')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.assets.table.assetName')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.assets.table.company')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.assets.table.category')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.assets.table.serialPlate')}
                                </th>
                                <th className="px-4 py-3 text-start font-semibold">
                                    {t('customer.pages.assets.table.valuation')}
                                </th>
                                <th className="px-4 py-3 text-center font-semibold">
                                    {t('customer.pages.assets.table.status')}
                                </th>
                                <th className="px-4 py-3 text-end font-semibold">
                                    {t('customer.pages.assets.table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Grid className="w-8 h-8 text-gray-400" />
                                            <p>{t('customer.pages.assets.feedback.noResults')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((ast) => (
                                    <tr
                                        key={ast.id}
                                        className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-xs text-gray-900 dark:text-gray-200">
                                            {ast.assetCode}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? ast.nameAr : ast.nameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                {isRtl ? ast.assignedLocationAr : ast.assignedLocationEn}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate max-w-[170px]">
                                                    {isRtl ? ast.companyNameAr : ast.companyNameEn}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                {getCategoryIcon(ast.category)}
                                                <span>{t(`customer.pages.assets.categories.${ast.category}`)}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                                            {ast.serialOrPlate}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-gray-200 font-semibold">
                                            {ast.valuationSar.toLocaleString()} SAR
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    ast.status === 'operational'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : ast.status === 'under_maintenance'
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : ast.status === 'reserved'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {ast.status === 'operational' ? (
                                                    <CheckCircle2 className="w-3 h-3" />
                                                ) : ast.status === 'under_maintenance' ? (
                                                    <Wrench className="w-3 h-3" />
                                                ) : (
                                                    <XCircle className="w-3 h-3" />
                                                )}
                                                <span>{t(`customer.pages.assets.status_${ast.status}`)}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setViewingAsset(ast)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={t('customer.pages.assets.table.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStartEdit(ast)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title={t('customer.pages.assets.table.edit')}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(ast.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        ast.status === 'operational'
                                                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                    }`}
                                                    title={
                                                        ast.status === 'operational'
                                                            ? t('customer.pages.assets.table.sendMaintenance')
                                                            : t('customer.pages.assets.table.setOperational')
                                                    }
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

            {/* Details Drawer */}
            {viewingAsset && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slideLeft">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#EAF3EC] dark:bg-emerald-950/40 rounded-lg text-[#265938] dark:text-emerald-400">
                                    <Grid className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {t('customer.pages.assets.details.title')}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-mono">{viewingAsset.assetCode}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingAsset(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-5 space-y-5 flex-1">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                    {isRtl ? viewingAsset.nameAr : viewingAsset.nameEn}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isRtl ? viewingAsset.nameEn : viewingAsset.nameAr}
                                </p>
                            </div>

                            <div className="p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.table.company')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {isRtl ? viewingAsset.companyNameAr : viewingAsset.companyNameEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.table.category')}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {t(`customer.pages.assets.categories.${viewingAsset.category}`)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.table.serialPlate')}</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                                        {viewingAsset.serialOrPlate}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.details.location')}</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {isRtl ? viewingAsset.assignedLocationAr : viewingAsset.assignedLocationEn}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.details.valuation')}</span>
                                    <span className="font-mono font-bold text-blue-600">
                                        {viewingAsset.valuationSar.toLocaleString()} SAR
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{t('customer.pages.assets.details.purchaseDate')}</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                                        {viewingAsset.purchaseDate}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-500">{t('customer.pages.assets.table.status')}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            viewingAsset.status === 'operational'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : viewingAsset.status === 'under_maintenance'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {t(`customer.pages.assets.status_${viewingAsset.status}`)}
                                    </span>
                                </div>
                            </div>

                            {viewingAsset.notes && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                                        {t('customer.pages.assets.details.notes')}
                                    </h5>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                                        {viewingAsset.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <button
                                onClick={() => handleStartEdit(viewingAsset)}
                                className="flex-1 bg-[#265938] hover:bg-[#1E472D] text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {t('customer.pages.assets.details.edit')}
                            </button>
                            <button
                                onClick={() => handleToggleStatus(viewingAsset.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                                    viewingAsset.status === 'operational'
                                        ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                                {viewingAsset.status === 'operational'
                                    ? t('customer.pages.assets.table.sendMaintenance')
                                    : t('customer.pages.assets.table.setOperational')}
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
                                    {editingAssetId
                                        ? t('customer.pages.assets.modal.editTitle')
                                        : t('customer.pages.assets.modal.addTitle')}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editingAssetId
                                        ? t('customer.pages.assets.modal.editSubtitle')
                                        : t('customer.pages.assets.modal.addSubtitle')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.code')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assetCode}
                                        onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#265938]"
                                        placeholder="AST-501"
                                    />
                                    {formErrors.code && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.company')} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
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
                                        {t('customer.pages.assets.modal.nameAr')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="شاحنة مرسيدس أكتروس"
                                        dir="rtl"
                                    />
                                    {formErrors.name && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.nameEn')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="Mercedes-Benz Actros Prime Mover"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.category')} *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="heavy_equipment">{t('customer.pages.assets.categories.heavy_equipment')}</option>
                                        <option value="fleet_vehicle">{t('customer.pages.assets.categories.fleet_vehicle')}</option>
                                        <option value="it_infrastructure">{t('customer.pages.assets.categories.it_infrastructure')}</option>
                                        <option value="machinery">{t('customer.pages.assets.categories.machinery')}</option>
                                        <option value="facility_asset">{t('customer.pages.assets.categories.facility_asset')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.serialPlate')} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.serialOrPlate}
                                        onChange={(e) => setFormData({ ...formData, serialOrPlate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-[#265938]"
                                        placeholder="7821-BTA / CAT-320D"
                                    />
                                    {formErrors.serial && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.serial}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.locationAr')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assignedLocationAr}
                                        onChange={(e) => setFormData({ ...formData, assignedLocationAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="محطة جدة المركزية"
                                        dir="rtl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.locationEn')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assignedLocationEn}
                                        onChange={(e) => setFormData({ ...formData, assignedLocationEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                        placeholder="Jeddah Central Terminal"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.valuationSar')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={10000}
                                        value={formData.valuationSar}
                                        onChange={(e) => setFormData({ ...formData, valuationSar: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.purchaseDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        {t('customer.pages.assets.modal.status')}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="operational">{t('customer.pages.assets.status_operational')}</option>
                                        <option value="under_maintenance">{t('customer.pages.assets.status_under_maintenance')}</option>
                                        <option value="reserved">{t('customer.pages.assets.status_reserved')}</option>
                                        <option value="decommissioned">{t('customer.pages.assets.status_decommissioned')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    {t('customer.pages.assets.modal.notes')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-[#265938]"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                                >
                                    {t('customer.pages.assets.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#265938] hover:bg-[#1E472D] text-white text-sm font-medium transition-colors"
                                >
                                    {t('customer.pages.assets.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
