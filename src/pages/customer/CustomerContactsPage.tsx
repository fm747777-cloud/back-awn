import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
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
    Star,
    Power,
    UserCheck,
} from 'lucide-react';

export type ContactStatus = 'active' | 'inactive';

export interface CustomerContactItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    nameEn: string;
    nameAr: string;
    jobTitleEn: string;
    jobTitleAr: string;
    departmentEn: string;
    departmentAr: string;
    phone: string;
    email: string;
    isPrimary: boolean;
    status: ContactStatus;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_contacts_v1';

const DEMO_COMPANIES = [
    { id: 'cmp-1', code: 'CMP-1001', nameEn: 'Al-Wataniya Logistics Co.', nameAr: 'الشركة الوطنية للخدمات اللوجستية' },
    { id: 'cmp-2', code: 'CMP-1002', nameEn: 'Riyadh Industrial Holdings', nameAr: 'القابضة الصناعية بالرياض' },
    { id: 'cmp-3', code: 'CMP-1003', nameEn: 'Tamweel Capital Partners', nameAr: 'تمويل كابيتال المالية' },
    { id: 'cmp-4', code: 'CMP-1004', nameEn: 'Najm Healthcare Network', nameAr: 'شبكة نجم للرعاية الصحية' },
    { id: 'cmp-5', code: 'CMP-1005', nameEn: 'Horizon Digital Technologies', nameAr: 'تقنيات الأفق الرقمية' },
    { id: 'cmp-6', code: 'CMP-1006', nameEn: 'Red Sea Hospitality & Resorts', nameAr: 'الضيافة والمنتجعات بالبحر الأحمر' },
];

const INITIAL_CONTACTS: CustomerContactItem[] = [
    {
        id: 'ctc-1',
        code: 'CTC-101',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Eng. Mansour Al-Qahtani',
        nameAr: 'م. منصور القحطاني',
        jobTitleEn: 'Chief Operations Officer (COO)',
        jobTitleAr: 'المدير التنفيذي للعمليات',
        departmentEn: 'Executive Management',
        departmentAr: 'الإدارة التنفيذية',
        phone: '+966 50 123 4567',
        email: 'm.qahtani@alwataniya-log.sa',
        isPrimary: true,
        status: 'active',
        notes: 'Primary executive signatory for logistics concessions and SLA contracts.',
        createdAt: '2026-01-10',
    },
    {
        id: 'ctc-2',
        code: 'CTC-102',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        nameEn: 'Lama Al-Ghamdi',
        nameAr: 'لمى الغامدي',
        jobTitleEn: 'Government Relations Manager',
        jobTitleAr: 'مديرة العلاقات الحكومية والتراخيص',
        departmentEn: 'Government Affairs',
        departmentAr: 'الشؤون الحكومية',
        phone: '+966 54 881 2930',
        email: 'l.ghamdi@alwataniya-log.sa',
        isPrimary: false,
        status: 'active',
        notes: 'Authorised representative on WASL transport platform and chamber attestation portal.',
        createdAt: '2026-01-15',
    },
    {
        id: 'ctc-3',
        code: 'CTC-103',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        nameEn: 'Dr. Fahad Al-Subaie',
        nameAr: 'د. فهد السبيعي',
        jobTitleEn: 'Head of Human Resources & Labor Quotas',
        jobTitleAr: 'رئيس الموارد البشرية وتوطين الكوادر',
        departmentEn: 'Human Resources',
        departmentAr: 'الموارد البشرية',
        phone: '+966 55 901 3412',
        email: 'f.subaie@riyadh-industrial.sa',
        isPrimary: true,
        status: 'active',
        notes: 'Lead liaison for Qiwa digital contracts and Nitaqat workforce audits.',
        createdAt: '2026-01-20',
    },
    {
        id: 'ctc-4',
        code: 'CTC-104',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        nameEn: 'Abdullah Al-Kaltham',
        nameAr: 'عبدالله الكلثم',
        jobTitleEn: 'Chief Financial Officer (CFO)',
        jobTitleAr: 'المدير المالي التنفيذي',
        departmentEn: 'Finance & Compliance',
        departmentAr: 'المالية والامتثال',
        phone: '+966 56 472 9018',
        email: 'a.kaltham@tamweel-cap.sa',
        isPrimary: true,
        status: 'active',
        notes: 'Authorised signatory for ZATCA Phase 2 clearance and quarterly financial declarations.',
        createdAt: '2026-02-01',
    },
    {
        id: 'ctc-5',
        code: 'CTC-105',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        nameEn: 'Dr. Reem Al-Dosari',
        nameAr: 'د. ريم الدوسري',
        jobTitleEn: 'Healthcare Facilities Director',
        jobTitleAr: 'مديرة المنشآت الطبية والتراخيص',
        departmentEn: 'Clinical Operations',
        departmentAr: 'العمليات الطبية',
        phone: '+966 53 610 8294',
        email: 'r.dosari@najm-health.sa',
        isPrimary: true,
        status: 'active',
        notes: 'Manages municipal Balady medical facility permits and civil defense safety audits.',
        createdAt: '2026-02-10',
    },
    {
        id: 'ctc-6',
        code: 'CTC-106',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        nameEn: 'Sultan Al-Otaibi',
        nameAr: 'سلطان العتيبي',
        jobTitleEn: 'Senior Legal Counsel & Secretary',
        jobTitleAr: 'المستشار القانوني وأمين مجلس الإدارة',
        departmentEn: 'Legal & Governance',
        departmentAr: 'الشؤون القانونية والحوكمة',
        phone: '+966 59 341 5502',
        email: 's.otaibi@redsea-hospitality.sa',
        isPrimary: false,
        status: 'inactive',
        notes: 'Former primary signatory; transitioned to advisory role on corporate structure.',
        createdAt: '2026-02-25',
    },
];

export const CustomerContactsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in localStorage
    const [contacts, setContacts] = useState<CustomerContactItem[]>(() => {
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
        return INITIAL_CONTACTS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
            }
        } catch {
            // ignore
        }
    }, [contacts]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
    const [primaryFilter, setPrimaryFilter] = useState<'all' | 'primary' | 'secondary'>('all');
    const [companyFilter, setCompanyFilter] = useState<'all' | string>('all');

    // Modal & Drawer
    const [viewingContact, setViewingContact] = useState<CustomerContactItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0].id,
        nameEn: '',
        nameAr: '',
        jobTitleEn: '',
        jobTitleAr: '',
        departmentEn: '',
        departmentAr: '',
        phone: '',
        email: '',
        isPrimary: false,
        status: 'active' as ContactStatus,
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        name?: string;
        companyId?: string;
        phone?: string;
        email?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered Contacts
    const filteredContacts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return contacts.filter((c) => {
            const matchesQuery =
                !query ||
                c.code.toLowerCase().includes(query) ||
                c.nameEn.toLowerCase().includes(query) ||
                c.nameAr.includes(search.trim()) ||
                c.companyNameEn.toLowerCase().includes(query) ||
                c.companyNameAr.includes(search.trim()) ||
                c.jobTitleEn.toLowerCase().includes(query) ||
                c.jobTitleAr.includes(search.trim()) ||
                c.email.toLowerCase().includes(query) ||
                c.phone.includes(query);

            const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            const matchesPrimary =
                primaryFilter === 'all' ||
                (primaryFilter === 'primary' && c.isPrimary) ||
                (primaryFilter === 'secondary' && !c.isPrimary);
            const matchesCompany = companyFilter === 'all' || c.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesPrimary && matchesCompany;
        });
    }, [contacts, search, statusFilter, primaryFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = contacts.length;
        const primaryCount = contacts.filter((c) => c.isPrimary).length;
        const activeCount = contacts.filter((c) => c.status === 'active').length;
        const uniqueCompanies = new Set(contacts.map((c) => c.companyId)).size;

        return {
            total,
            primaryCount,
            activeCount,
            uniqueCompanies,
        };
    }, [contacts]);

    // Toggle Status
    const handleToggleStatus = (id: string) => {
        setContacts((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    const nextStatus: ContactStatus = c.status === 'active' ? 'inactive' : 'active';
                    return { ...c, status: nextStatus };
                }
                return c;
            })
        );
        if (viewingContact && viewingContact.id === id) {
            setViewingContact((prev) =>
                prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
            );
        }
        showToast(t('customer.pages.contacts.feedback.statusToggled'));
    };

    // Toggle Primary
    const handleTogglePrimary = (id: string) => {
        setContacts((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    return { ...c, isPrimary: !c.isPrimary };
                }
                return c;
            })
        );
        if (viewingContact && viewingContact.id === id) {
            setViewingContact((prev) => (prev ? { ...prev, isPrimary: !prev.isPrimary } : null));
        }
        showToast(t('customer.pages.contacts.feedback.primaryToggled'));
    };

    // Start Add
    const handleStartAdd = () => {
        const nextNum = contacts.length + 101;
        setEditingContactId(null);
        setFormErrors({});
        setFormData({
            code: `CTC-${nextNum}`,
            companyId: DEMO_COMPANIES[0].id,
            nameEn: '',
            nameAr: '',
            jobTitleEn: '',
            jobTitleAr: '',
            departmentEn: '',
            departmentAr: '',
            phone: '+966 5',
            email: '',
            isPrimary: false,
            status: 'active',
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (item: CustomerContactItem) => {
        setEditingContactId(item.id);
        setFormErrors({});
        setFormData({
            code: item.code,
            companyId: item.companyId,
            nameEn: item.nameEn,
            nameAr: item.nameAr,
            jobTitleEn: item.jobTitleEn,
            jobTitleAr: item.jobTitleAr,
            departmentEn: item.departmentEn,
            departmentAr: item.departmentAr,
            phone: item.phone,
            email: item.email,
            isPrimary: item.isPrimary,
            status: item.status,
            notes: item.notes || '',
        });
        setViewingContact(null);
        setIsFormModalOpen(true);
    };

    // Save Form
    const handleSaveContact = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { name?: string; phone?: string; email?: string } = {};
        if (!formData.nameEn.trim() && !formData.nameAr.trim()) {
            errors.name = t('customer.pages.contacts.modal.validationName');
        }
        if (!formData.phone.trim()) {
            errors.phone = t('customer.pages.contacts.modal.validationPhone');
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            errors.email = t('customer.pages.contacts.modal.validationEmail');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];

        if (editingContactId) {
            setContacts((prev) =>
                prev.map((c) => {
                    if (c.id === editingContactId) {
                        return {
                            ...c,
                            code: formData.code.trim() || c.code,
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            nameEn: formData.nameEn.trim() || c.nameEn,
                            nameAr: formData.nameAr.trim() || c.nameAr,
                            jobTitleEn: formData.jobTitleEn.trim(),
                            jobTitleAr: formData.jobTitleAr.trim(),
                            departmentEn: formData.departmentEn.trim(),
                            departmentAr: formData.departmentAr.trim(),
                            phone: formData.phone.trim(),
                            email: formData.email.trim(),
                            isPrimary: formData.isPrimary,
                            status: formData.status,
                            notes: formData.notes.trim(),
                        };
                    }
                    return c;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.contacts.feedback.contactUpdated'));
        } else {
            const newContact: CustomerContactItem = {
                id: `ctc-${Date.now()}`,
                code: formData.code.trim() || `CTC-${Date.now().toString().slice(-3)}`,
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                nameEn: formData.nameEn.trim() || (isRtl ? 'مسؤول اتصال جديد' : 'New Contact Person'),
                nameAr: formData.nameAr.trim() || formData.nameEn.trim() || 'مسؤول اتصال جديد',
                jobTitleEn: formData.jobTitleEn.trim() || 'Representative',
                jobTitleAr: formData.jobTitleAr.trim() || 'ممثل مفوض',
                departmentEn: formData.departmentEn.trim() || 'Operations',
                departmentAr: formData.departmentAr.trim() || 'العمليات',
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                isPrimary: formData.isPrimary,
                status: formData.status,
                notes: formData.notes.trim(),
                createdAt: '2026-03-12',
            };
            setContacts([newContact, ...contacts]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.contacts.feedback.contactAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPrimaryFilter('all');
        setCompanyFilter('all');
    };

    return (
        <div className="space-y-6 text-start">
            {/* Toast */}
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
                                {t('customer.pages.contacts.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-CTC
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.contacts.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.contacts.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleStartAdd}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-[#BFAB93]" />
                            <span>{t('customer.pages.contacts.addContact')}</span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Contacts */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contacts.kpis.totalContacts')}
                            </span>
                            <Users className="w-4 h-4 text-[#2D3F2C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. Primary Contacts */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contacts.kpis.primaryContacts')}
                            </span>
                            <Star className="w-4 h-4 text-[#B45309]" />
                        </div>
                        <p className="text-2xl font-bold text-[#B45309] mt-2">{kpis.primaryCount}</p>
                    </div>

                    {/* 3. Active Contacts */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.contacts.kpis.activeContacts')}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-[#265938]" />
                        </div>
                        <p className="text-2xl font-bold text-[#265938] mt-2">{kpis.activeCount}</p>
                    </div>

                    {/* 4. Companies Represented */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#2D3F2C]">
                                {t('customer.pages.contacts.kpis.companiesCount')}
                            </span>
                            <Building2 className="w-4 h-4 text-[#8C6D3B]" />
                        </div>
                        <p className="text-2xl font-bold text-[#2D3F2C] mt-2">{kpis.uniqueCompanies}</p>
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
                        placeholder={t('customer.pages.contacts.searchPlaceholder')}
                        className="w-full ps-10 pe-9 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
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
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | ContactStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.contacts.statusAll')}</option>
                        <option value="active">{t('customer.pages.contacts.statusActive')}</option>
                        <option value="inactive">{t('customer.pages.contacts.statusInactive')}</option>
                    </select>

                    {/* Primary Role */}
                    <select
                        value={primaryFilter}
                        onChange={(e) => setPrimaryFilter(e.target.value as 'all' | 'primary' | 'secondary')}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.contacts.roleAll')}</option>
                        <option value="primary">{t('customer.pages.contacts.rolePrimaryOnly')}</option>
                        <option value="secondary">{t('customer.pages.contacts.roleSecondaryOnly')}</option>
                    </select>

                    {/* Company */}
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.contacts.companyAll')}</option>
                        {DEMO_COMPANIES.map((cmp) => (
                            <option key={cmp.id} value={cmp.id}>
                                {isRtl ? cmp.nameAr : cmp.nameEn}
                            </option>
                        ))}
                    </select>

                    {(search || statusFilter !== 'all' || primaryFilter !== 'all' || companyFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#857E74] hover:text-[#0D0D0D] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                            title={t('customer.pages.contacts.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.contacts.feedback.resetFilters')}</span>
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
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.contactName')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.company')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.phone')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.email')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.primary')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.contacts.table.status')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.contacts.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Users className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.contacts.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#2D3F2C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.contacts.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((c) => (
                                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#2D3F2C]">
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                {c.code}
                                            </span>
                                        </td>

                                        {/* Contact Name & Job Title */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="font-bold text-[#0D0D0D]">
                                                {isRtl ? c.nameAr : c.nameEn}
                                            </p>
                                            <p className="text-[11px] text-[#857E74] truncate mt-0.5">
                                                {isRtl ? c.jobTitleAr : c.jobTitleEn}
                                            </p>
                                        </td>

                                        {/* Company */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span className="font-medium text-[#0D0D0D] truncate max-w-[140px]">
                                                    {isRtl ? c.companyNameAr : c.companyNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Phone */}
                                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#0D0D0D]" dir="ltr">
                                            {c.phone}
                                        </td>

                                        {/* Email */}
                                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#595550] truncate max-w-[150px]" dir="ltr">
                                            {c.email}
                                        </td>

                                        {/* Primary Badge */}
                                        <td className="py-3.5 px-4">
                                            {c.isPrimary ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#F6D8B6]">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{t('customer.pages.contacts.primaryBadge')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-[#857E74] bg-[#FAF8F5] border border-[#E5E0D8]">
                                                    <span>{t('customer.pages.contacts.secondaryBadge')}</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            {c.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC]">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{t('customer.pages.contacts.statusActive')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>{t('customer.pages.contacts.statusInactive')}</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingContact(c)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.contacts.table.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(c)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.contacts.table.edit')}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>

                                                {/* Toggle Status */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(c.id)}
                                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                                        c.status === 'active'
                                                            ? 'text-[#265938] hover:text-[#1E5631] hover:bg-[#EAF3EC] border-transparent hover:border-[#C5DFCC]'
                                                            : 'text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border-transparent hover:border-[#E5E0D8]'
                                                    }`}
                                                    title={
                                                        c.status === 'active'
                                                            ? t('customer.pages.contacts.table.deactivate')
                                                            : t('customer.pages.contacts.table.activate')
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

            {/* View Details Drawer */}
            {viewingContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center">
                                    <UserCheck className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingContact.nameAr : viewingContact.nameEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingContact.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingContact.jobTitleAr : viewingContact.jobTitleEn}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingContact(null)}
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
                                        {t('customer.pages.contacts.table.company')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                        {isRtl ? viewingContact.companyNameAr : viewingContact.companyNameEn}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.contacts.details.department')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                                        {isRtl ? viewingContact.departmentAr : viewingContact.departmentEn}
                                    </p>
                                </div>
                            </div>

                            {/* Direct Contact Methods */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-3">
                                <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider block">
                                    {t('customer.pages.contacts.details.contactChannels')}
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <Phone className="w-4 h-4 text-[#2D3F2C]" />
                                        <span className="text-xs font-mono font-medium" dir="ltr">
                                            {viewingContact.phone}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#E5E0D8]">
                                        <Mail className="w-4 h-4 text-[#2D3F2C]" />
                                        <span className="text-xs font-mono font-medium truncate" dir="ltr">
                                            {viewingContact.email}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Primary Role */}
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#857E74]">
                                        {t('customer.pages.contacts.table.primary')}:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleTogglePrimary(viewingContact.id)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                                            viewingContact.isPrimary
                                                ? 'bg-[#FDF3E7] text-[#B45309] border-[#F6D8B6]'
                                                : 'bg-white text-[#857E74] border-[#E5E0D8]'
                                        }`}
                                    >
                                        {viewingContact.isPrimary
                                            ? t('customer.pages.contacts.primaryBadge')
                                            : t('customer.pages.contacts.secondaryBadge')}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#857E74]">
                                        {t('customer.pages.contacts.table.status')}:
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold">
                                        {viewingContact.status === 'active' ? (
                                            <span className="text-[#265938]">{t('customer.pages.contacts.statusActive')}</span>
                                        ) : (
                                            <span className="text-[#857E74]">{t('customer.pages.contacts.statusInactive')}</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            {viewingContact.notes && (
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-xs font-semibold text-[#857E74] block mb-1">
                                        {t('customer.pages.contacts.details.notes')}
                                    </span>
                                    <p className="text-xs text-[#0D0D0D] leading-relaxed">{viewingContact.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => handleToggleStatus(viewingContact.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                    viewingContact.status === 'active'
                                        ? 'bg-white text-[#857E74] border-[#DDD6CC] hover:bg-[#FAF8F5]'
                                        : 'bg-[#EAF3EC] text-[#265938] border-[#C5DFCC] hover:bg-[#D5EAD8]'
                                }`}
                            >
                                <Power className="w-3.5 h-3.5" />
                                <span>
                                    {viewingContact.status === 'active'
                                        ? t('customer.pages.contacts.table.deactivate')
                                        : t('customer.pages.contacts.table.activate')}
                                </span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStartEdit(viewingContact)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <Edit3 className="w-3.5 h-3.5 text-[#857E74]" />
                                    <span>{t('customer.pages.contacts.details.edit')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingContact(null)}
                                    className="px-4 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.contacts.details.close')}
                                </button>
                            </div>
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
                                <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingContactId
                                            ? t('customer.pages.contacts.modal.editTitle')
                                            : t('customer.pages.contacts.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingContactId
                                            ? t('customer.pages.contacts.modal.editSubtitle')
                                            : t('customer.pages.contacts.modal.addSubtitle')}
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
                        <form onSubmit={handleSaveContact} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Company */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="CTC-101"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.company')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.companyId}
                                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
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
                                            {t('customer.pages.contacts.modal.nameAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameAr: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="الاسم بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.nameEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nameEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, nameEn: e.target.value });
                                                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                                            }}
                                            placeholder="Full name in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.name && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.name}</p>
                                )}

                                {/* Job Titles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.jobTitleAr')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.jobTitleAr}
                                            onChange={(e) => setFormData({ ...formData, jobTitleAr: e.target.value })}
                                            placeholder="المسمى الوظيفي بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.jobTitleEn')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.jobTitleEn}
                                            onChange={(e) => setFormData({ ...formData, jobTitleEn: e.target.value })}
                                            placeholder="Job Title in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Phone & Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.phone')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => {
                                                setFormData({ ...formData, phone: e.target.value });
                                                if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                                            }}
                                            placeholder="+966 50 123 4567"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                        {formErrors.phone && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.email')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                                            }}
                                            placeholder="contact@company.sa"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                        {formErrors.email && (
                                            <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.email}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Status & Primary Flag */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.contacts.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as ContactStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                        >
                                            <option value="active">{t('customer.pages.contacts.statusActive')}</option>
                                            <option value="inactive">{t('customer.pages.contacts.statusInactive')}</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-[#0D0D0D] cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPrimary}
                                                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                                                className="w-4 h-4 rounded text-[#2D3F2C] focus:ring-[#2D3F2C] border-[#D6CFC4] cursor-pointer"
                                            />
                                            <span>{t('customer.pages.contacts.modal.isPrimaryLabel')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Internal Notes */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('customer.pages.contacts.modal.notes')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="صلاحيات التوقيع والتفويضات..."
                                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
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
                                    {t('customer.pages.contacts.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.contacts.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
