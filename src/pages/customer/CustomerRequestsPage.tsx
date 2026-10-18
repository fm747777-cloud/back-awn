import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ClipboardList,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    Clock,
    AlertCircle,
    RotateCcw,
    Building2,
    Calendar,
    CheckCircle,
    Layers,
    FileText,
} from 'lucide-react';

export type RequestStatus = 'pending' | 'in_progress' | 'under_review' | 'completed' | 'cancelled';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestType = 'government' | 'workforce' | 'licensing' | 'compliance' | 'technical';

export interface CustomerRequestItem {
    id: string;
    code: string;
    titleEn: string;
    titleAr: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    serviceId: string;
    serviceCode: string;
    serviceNameEn: string;
    serviceNameAr: string;
    requestType: RequestType;
    priority: RequestPriority;
    status: RequestStatus;
    submissionDate: string;
    dueDate: string;
    descriptionEn: string;
    descriptionAr: string;
    govReferenceNo?: string;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'awn_customer_requests_v1';

import { CUSTOMER_COMPANIES_DEMO_OPTIONS } from './customerMockData';

const DEMO_COMPANIES = CUSTOMER_COMPANIES_DEMO_OPTIONS;


const DEMO_SERVICES = [
    { id: 'srv-1', code: 'SRV-GA-01', nameEn: 'Commercial Registration Issuance & Renewal', nameAr: 'إصدار وتجديد السجل التجاري والأنشطة' },
    { id: 'srv-2', code: 'SRV-WL-02', nameEn: 'Workforce Iqama Renewal & Labor Quota', nameAr: 'تجديد الإقامات المهنية وتدقيق نطاقات العمل' },
    { id: 'srv-3', code: 'SRV-TL-03', nameEn: 'Fleet GPS Telematics & SLA Monitoring', nameAr: 'تتبع أسطول النقل اللوجستي والربط مع وصل' },
    { id: 'srv-4', code: 'SRV-CA-04', nameEn: 'Zakat, Tax & Customs Regulatory Compliance', nameAr: 'الامتثال الضريبي والزكوي والفوترة الإلكترونية' },
    { id: 'srv-5', code: 'SRV-IT-05', nameEn: 'Cloud Infrastructure & 24/7 Server SLA', nameAr: 'البنية السحابية ودعم الخوادم على مدار الساعة' },
    { id: 'srv-6', code: 'SRV-LM-06', nameEn: 'Executive Legal & Municipal Licensing', nameAr: 'الاستشارات القانونية والتراخيص البلدية التنفيذية' },
];

const INITIAL_REQUESTS: CustomerRequestItem[] = [
    {
        id: 'req-1',
        code: 'REQ-2026-081',
        titleEn: 'Annual Commercial Registration Renewal & Chamber Attestation',
        titleAr: 'تجديد السجل التجاري السنوي وتصديق الغرفة التجارية',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        serviceId: 'srv-1',
        serviceCode: 'SRV-GA-01',
        serviceNameEn: 'Commercial Registration Issuance & Renewal',
        serviceNameAr: 'إصدار وتجديد السجل التجاري والأنشطة',
        requestType: 'government',
        priority: 'high',
        status: 'in_progress',
        submissionDate: '2026-03-01',
        dueDate: '2026-03-15',
        descriptionEn: 'Renewal of primary commercial registration with economic activities update and Riyadh Chamber certified attestation.',
        descriptionAr: 'تجديد السجل التجاري الرئيسي وتحديث الأنشطة الاقتصادية وتصديق الغرفة التجارية بمدينة الرياض.',
        govReferenceNo: 'MC-2026-948102',
        notes: 'Chamber fees settled. Pending final commercial certificate generation.',
        createdAt: '2026-03-01',
    },
    {
        id: 'req-2',
        code: 'REQ-2026-082',
        titleEn: 'Fleet WASL Platform Direct Sensor Integration',
        titleAr: 'الربط المباشر لأجهزة تتبع الأسطول مع منصة وصل',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Wataniya Logistics Co.',
        companyNameAr: 'الشركة الوطنية للخدمات اللوجستية',
        serviceId: 'srv-3',
        serviceCode: 'SRV-TL-03',
        serviceNameEn: 'Fleet GPS Telematics & SLA Monitoring',
        serviceNameAr: 'تتبع أسطول النقل اللوجستي والربط مع وصل',
        requestType: 'technical',
        priority: 'urgent',
        status: 'under_review',
        submissionDate: '2026-03-03',
        dueDate: '2026-03-12',
        descriptionEn: 'Configuration of 45 heavy vehicle telematics units with statutory WASL regulatory endpoints and temperature sensor probes.',
        descriptionAr: 'تهيئة وبرمجة 45 جهاز تتبع شاحنات مع نقاط ربط منصة وصل الحكومية وحساسات مراقبة درجات الحرارة.',
        govReferenceNo: 'WASL-FL-83011',
        notes: 'API tokens validated. Testing live stream payloads with Transport Authority.',
        createdAt: '2026-03-03',
    },
    {
        id: 'req-3',
        code: 'REQ-2026-083',
        titleEn: 'Workforce Qiwa Digital Contract Attestation & Nitaqat Audit',
        titleAr: 'توثيق عقود الكوادر عبر منصة قوى وتدقيق نطاقات العمل',
        companyId: 'cmp-2',
        companyNameEn: 'Riyadh Industrial Holdings',
        companyNameAr: 'القابضة الصناعية بالرياض',
        serviceId: 'srv-2',
        serviceCode: 'SRV-WL-02',
        serviceNameEn: 'Workforce Iqama Renewal & Labor Quota',
        serviceNameAr: 'تجديد الإقامات المهنية وتدقيق نطاقات العمل',
        requestType: 'workforce',
        priority: 'medium',
        status: 'pending',
        submissionDate: '2026-03-05',
        dueDate: '2026-03-20',
        descriptionEn: 'Quarterly review of 120 professional contracts on Qiwa portal, balancing Platinum tier Nitaqat workforce requirements.',
        descriptionAr: 'المراجعة الربع سنوية لـ 120 عقداً عبر منصة قوى وضمان الحفاظ على النطاق البلاتيني وفق متطلبات التوطين.',
        govReferenceNo: 'QIWA-CR-554109',
        notes: 'Awaiting client approval of updated standard labor contracts.',
        createdAt: '2026-03-05',
    },
    {
        id: 'req-4',
        code: 'REQ-2026-084',
        titleEn: 'Q1 ZATCA Phase 2 E-Invoicing Verification & Audit Clearance',
        titleAr: 'تدقيق منظومة الفوترة الإلكترونية المرحلة الثانية وإقرار الربع الأول',
        companyId: 'cmp-3',
        companyNameEn: 'Tamweel Capital Partners',
        companyNameAr: 'تمويل كابيتال المالية',
        serviceId: 'srv-4',
        serviceCode: 'SRV-CA-04',
        serviceNameEn: 'Zakat, Tax & Customs Regulatory Compliance',
        serviceNameAr: 'الامتثال الضريبي والزكوي والفوترة الإلكترونية',
        requestType: 'compliance',
        priority: 'urgent',
        status: 'in_progress',
        submissionDate: '2026-02-28',
        dueDate: '2026-03-18',
        descriptionEn: 'Cryptographic stamp audit and XML ledger clearance certificate issuance for Zakat & Tax Authority quarterly filing.',
        descriptionAr: 'مراجعة الأختام الرقمية والتأكد من توافق دفاتر الفواتير بصيغة XML وشهادة براءة الذمة الضريبية للربع الأول.',
        govReferenceNo: 'ZATCA-TX-109283',
        notes: 'Compliance dry run passed with 100% adherence to FATOORA standards.',
        createdAt: '2026-02-28',
    },
    {
        id: 'req-5',
        code: 'REQ-2026-085',
        titleEn: 'Executive Municipal Health & Safety Licensing Renewal',
        titleAr: 'تجديد رخصة بلدي للأنشطة والامتثال للمعايير الصحية',
        companyId: 'cmp-4',
        companyNameEn: 'Najm Healthcare Network',
        companyNameAr: 'شبكة نجم للرعاية الصحية',
        serviceId: 'srv-6',
        serviceCode: 'SRV-LM-06',
        serviceNameEn: 'Executive Legal & Municipal Licensing',
        serviceNameAr: 'الاستشارات القانونية والتراخيص البلدية التنفيذية',
        requestType: 'licensing',
        priority: 'high',
        status: 'completed',
        submissionDate: '2026-02-15',
        dueDate: '2026-03-02',
        descriptionEn: 'Field inspection clearance and municipal license renewal via Balady platform for specialized healthcare clinic centers.',
        descriptionAr: 'إنهاء التفتيش الميداني وتجديد رخصة بلدي الفورية للمراكز والعيادات الطبية التخصصية.',
        govReferenceNo: 'BALADY-LIC-77412',
        notes: 'License renewed and issued successfully. Valid until March 2027.',
        createdAt: '2026-02-15',
    },
    {
        id: 'req-6',
        code: 'REQ-2026-086',
        titleEn: 'Hospitality Enterprise Dedicated Cloud Server SLA Provisioning',
        titleAr: 'تخصيص الخوادم السحابية واتفاقية مستوى الخدمة لمشروع الضيافة',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        serviceId: 'srv-5',
        serviceCode: 'SRV-IT-05',
        serviceNameEn: 'Cloud Infrastructure & 24/7 Server SLA',
        serviceNameAr: 'البنية السحابية ودعم الخوادم على مدار الساعة',
        requestType: 'technical',
        priority: 'low',
        status: 'completed',
        submissionDate: '2026-02-20',
        dueDate: '2026-03-05',
        descriptionEn: 'Provisioning redundant cloud cluster with 99.95% uptime SLA guarantee and 24/7 proactive incident monitoring.',
        descriptionAr: 'تجهيز خوادم سحابية متبادلة مع ضمان استمرارية الخدمة بنسبة 99.95% ومراقبة فنية على مدار الساعة.',
        govReferenceNo: 'CLOUD-SLA-9021',
        notes: 'Cluster live in Saudi Cloud Region. Monitoring dashboard delivered.',
        createdAt: '2026-02-20',
    },
];

export const CustomerRequestsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // Persistence in awn_customer_requests_v1
    const [requests, setRequests] = useState<CustomerRequestItem[]>(() => {
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
        return INITIAL_REQUESTS;
    });

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
            }
        } catch {
            // ignore
        }
    }, [requests]);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | RequestPriority>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | RequestType>('all');

    // Drawer and Modal states
    const [viewingRequest, setViewingRequest] = useState<CustomerRequestItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        code: '',
        titleEn: '',
        titleAr: '',
        companyId: DEMO_COMPANIES[0].id,
        serviceId: DEMO_SERVICES[0].id,
        requestType: 'government' as RequestType,
        priority: 'medium' as RequestPriority,
        status: 'pending' as RequestStatus,
        submissionDate: '2026-03-12',
        dueDate: '2026-03-26',
        descriptionEn: '',
        descriptionAr: '',
        govReferenceNo: '',
        notes: '',
    });

    const [formErrors, setFormErrors] = useState<{
        title?: string;
        companyId?: string;
        serviceId?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered requests
    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase();
        return requests.filter((req) => {
            const matchesQuery =
                !query ||
                req.code.toLowerCase().includes(query) ||
                req.titleEn.toLowerCase().includes(query) ||
                req.titleAr.includes(search.trim()) ||
                req.companyNameEn.toLowerCase().includes(query) ||
                req.companyNameAr.includes(search.trim()) ||
                req.serviceCode.toLowerCase().includes(query) ||
                req.serviceNameEn.toLowerCase().includes(query) ||
                req.serviceNameAr.includes(search.trim()) ||
                (req.govReferenceNo && req.govReferenceNo.toLowerCase().includes(query));

            const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
            const matchesType = typeFilter === 'all' || req.requestType === typeFilter;

            return matchesQuery && matchesStatus && matchesPriority && matchesType;
        });
    }, [requests, search, statusFilter, priorityFilter, typeFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = requests.length;
        const pendingCount = requests.filter((r) => r.status === 'pending' || r.status === 'under_review').length;
        const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
        const completedCount = requests.filter((r) => r.status === 'completed').length;

        return {
            total,
            pendingCount,
            inProgressCount,
            completedCount,
        };
    }, [requests]);

    // Priority badge
    const getPriorityBadge = (priority: RequestPriority) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FCECE9] text-[#A63A3A] border border-[#F3C4BE]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{t('customer.pages.requests.priorities.urgent')}</span>
                    </span>
                );
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#F6D8B6]">
                        <span>{t('customer.pages.requests.priorities.high')}</span>
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FA] text-[#285799] border border-[#C6D5EE]">
                        <span>{t('customer.pages.requests.priorities.medium')}</span>
                    </span>
                );
            case 'low':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                        <span>{t('customer.pages.requests.priorities.low')}</span>
                    </span>
                );
        }
    };

    // Status badge
    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('customer.pages.requests.statuses.completed')}</span>
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FA] text-[#285799] border border-[#C6D5EE]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.requests.statuses.in_progress')}</span>
                    </span>
                );
            case 'under_review':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3EEFA] text-[#6B21A8] border border-[#DDD0F3]">
                        <FileText className="w-3 h-3" />
                        <span>{t('customer.pages.requests.statuses.under_review')}</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF3E7] text-[#B45309] border border-[#F6D8B6]">
                        <Clock className="w-3 h-3" />
                        <span>{t('customer.pages.requests.statuses.pending')}</span>
                    </span>
                );
            case 'cancelled':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F2ED] text-[#857E74] border border-[#DDD6CC]">
                        <X className="w-3 h-3" />
                        <span>{t('customer.pages.requests.statuses.cancelled')}</span>
                    </span>
                );
        }
    };

    // Type label
    const getTypeLabel = (type: RequestType) => {
        switch (type) {
            case 'government':
                return t('customer.pages.requests.types.government');
            case 'workforce':
                return t('customer.pages.requests.types.workforce');
            case 'licensing':
                return t('customer.pages.requests.types.licensing');
            case 'compliance':
                return t('customer.pages.requests.types.compliance');
            case 'technical':
                return t('customer.pages.requests.types.technical');
            default:
                return type;
        }
    };

    // Open Add Modal
    const handleStartAdd = () => {
        const nextNum = requests.length + 81;
        const generatedCode = `REQ-2026-0${nextNum}`;
        setEditingRequestId(null);
        setFormErrors({});
        setFormData({
            code: generatedCode,
            titleEn: '',
            titleAr: '',
            companyId: DEMO_COMPANIES[0].id,
            serviceId: DEMO_SERVICES[0].id,
            requestType: 'government',
            priority: 'medium',
            status: 'pending',
            submissionDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            descriptionEn: '',
            descriptionAr: '',
            govReferenceNo: '',
            notes: '',
        });
        setIsFormModalOpen(true);
    };

    // Open Edit Modal
    const handleStartEdit = (req: CustomerRequestItem) => {
        setEditingRequestId(req.id);
        setFormErrors({});
        setFormData({
            code: req.code,
            titleEn: req.titleEn,
            titleAr: req.titleAr,
            companyId: req.companyId,
            serviceId: req.serviceId,
            requestType: req.requestType,
            priority: req.priority,
            status: req.status,
            submissionDate: req.submissionDate,
            dueDate: req.dueDate,
            descriptionEn: req.descriptionEn,
            descriptionAr: req.descriptionAr,
            govReferenceNo: req.govReferenceNo || '',
            notes: req.notes || '',
        });
        setViewingRequest(null);
        setIsFormModalOpen(true);
    };

    // Advance status progression
    const handleAdvanceStatus = (reqId: string) => {
        const statusCycle: RequestStatus[] = ['pending', 'under_review', 'in_progress', 'completed'];
        setRequests((prev) =>
            prev.map((r) => {
                if (r.id === reqId) {
                    const currentIndex = statusCycle.indexOf(r.status);
                    const nextStatus = currentIndex !== -1 && currentIndex < statusCycle.length - 1
                        ? statusCycle[currentIndex + 1]
                        : 'completed';
                    return { ...r, status: nextStatus };
                }
                return r;
            })
        );
        if (viewingRequest && viewingRequest.id === reqId) {
            const currentIndex = statusCycle.indexOf(viewingRequest.status);
            const nextStatus = currentIndex !== -1 && currentIndex < statusCycle.length - 1
                ? statusCycle[currentIndex + 1]
                : 'completed';
            setViewingRequest({ ...viewingRequest, status: nextStatus });
        }
        showToast(t('customer.pages.requests.feedback.statusAdvanced'));
    };

    // Save request
    const handleSaveRequest = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: { title?: string; companyId?: string; serviceId?: string } = {};

        if (!formData.titleEn.trim() && !formData.titleAr.trim()) {
            errors.title = t('customer.pages.requests.modal.validationTitle');
        }

        if (!formData.companyId) {
            errors.companyId = t('customer.pages.requests.modal.validationCompany');
        }

        if (!formData.serviceId) {
            errors.serviceId = t('customer.pages.requests.modal.validationService');
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const selectedCompany = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];
        const selectedService = DEMO_SERVICES.find((s) => s.id === formData.serviceId) || DEMO_SERVICES[0];

        if (editingRequestId) {
            setRequests((prev) =>
                prev.map((r) => {
                    if (r.id === editingRequestId) {
                        return {
                            ...r,
                            code: formData.code.trim() || r.code,
                            titleEn: formData.titleEn.trim() || r.titleEn,
                            titleAr: formData.titleAr.trim() || r.titleAr,
                            companyId: selectedCompany.id,
                            companyNameEn: selectedCompany.nameEn,
                            companyNameAr: selectedCompany.nameAr,
                            serviceId: selectedService.id,
                            serviceCode: selectedService.code,
                            serviceNameEn: selectedService.nameEn,
                            serviceNameAr: selectedService.nameAr,
                            requestType: formData.requestType,
                            priority: formData.priority,
                            status: formData.status,
                            submissionDate: formData.submissionDate,
                            dueDate: formData.dueDate,
                            descriptionEn: formData.descriptionEn.trim(),
                            descriptionAr: formData.descriptionAr.trim(),
                            govReferenceNo: formData.govReferenceNo.trim(),
                            notes: formData.notes.trim(),
                        };
                    }
                    return r;
                })
            );
            setIsFormModalOpen(false);
            showToast(t('customer.pages.requests.feedback.requestUpdated'));
        } else {
            const newReq: CustomerRequestItem = {
                id: `req-${Date.now()}`,
                code: formData.code.trim() || `REQ-${Date.now().toString().slice(-4)}`,
                titleEn: formData.titleEn.trim() || (isRtl ? 'طلب خدمة عملاء جديد' : 'New Customer Request'),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim() || 'طلب خدمة عملاء جديد',
                companyId: selectedCompany.id,
                companyNameEn: selectedCompany.nameEn,
                companyNameAr: selectedCompany.nameAr,
                serviceId: selectedService.id,
                serviceCode: selectedService.code,
                serviceNameEn: selectedService.nameEn,
                serviceNameAr: selectedService.nameAr,
                requestType: formData.requestType,
                priority: formData.priority,
                status: formData.status,
                submissionDate: formData.submissionDate,
                dueDate: formData.dueDate,
                descriptionEn: formData.descriptionEn.trim(),
                descriptionAr: formData.descriptionAr.trim(),
                govReferenceNo: formData.govReferenceNo.trim(),
                notes: formData.notes.trim(),
                createdAt: new Date().toISOString().split('T')[0],
            };
            setRequests([newReq, ...requests]);
            setIsFormModalOpen(false);
            showToast(t('customer.pages.requests.feedback.requestAdded'));
        }
    };

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setTypeFilter('all');
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
                                {t('customer.pages.requests.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-REQ
                            </span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                {t('customer.pages.requests.phase')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-2 max-w-3xl leading-relaxed">
                            {t('customer.pages.requests.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleStartAdd}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-[#BFAB93]" />
                            <span>{t('customer.pages.requests.addRequest')}</span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
                    {/* 1. Total Requests */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.requests.kpis.totalRequests')}
                            </span>
                            <ClipboardList className="w-4 h-4 text-[#2D3F2C]" />
                        </div>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-2">{kpis.total}</p>
                    </div>

                    {/* 2. New / Pending */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.requests.kpis.pendingRequests')}
                            </span>
                            <Clock className="w-4 h-4 text-[#B45309]" />
                        </div>
                        <p className="text-2xl font-bold text-[#B45309] mt-2">{kpis.pendingCount}</p>
                    </div>

                    {/* 3. In Progress */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#857E74]">
                                {t('customer.pages.requests.kpis.inProgressRequests')}
                            </span>
                            <Layers className="w-4 h-4 text-[#285799]" />
                        </div>
                        <p className="text-2xl font-bold text-[#285799] mt-2">{kpis.inProgressCount}</p>
                    </div>

                    {/* 4. Completed */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#2D3F2C]">
                                {t('customer.pages.requests.kpis.completedRequests')}
                            </span>
                            <CheckCircle className="w-4 h-4 text-[#265938]" />
                        </div>
                        <p className="text-2xl font-bold text-[#265938] mt-2">{kpis.completedCount}</p>
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
                        placeholder={t('customer.pages.requests.searchPlaceholder')}
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

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | RequestStatus)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.requests.statusAll')}</option>
                        <option value="pending">{t('customer.pages.requests.statuses.pending')}</option>
                        <option value="under_review">{t('customer.pages.requests.statuses.under_review')}</option>
                        <option value="in_progress">{t('customer.pages.requests.statuses.in_progress')}</option>
                        <option value="completed">{t('customer.pages.requests.statuses.completed')}</option>
                        <option value="cancelled">{t('customer.pages.requests.statuses.cancelled')}</option>
                    </select>

                    {/* Priority */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as 'all' | RequestPriority)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.requests.priorityAll')}</option>
                        <option value="urgent">{t('customer.pages.requests.priorities.urgent')}</option>
                        <option value="high">{t('customer.pages.requests.priorities.high')}</option>
                        <option value="medium">{t('customer.pages.requests.priorities.medium')}</option>
                        <option value="low">{t('customer.pages.requests.priorities.low')}</option>
                    </select>

                    {/* Type */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'all' | RequestType)}
                        className="px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                    >
                        <option value="all">{t('customer.pages.requests.typeAll')}</option>
                        <option value="government">{t('customer.pages.requests.types.government')}</option>
                        <option value="workforce">{t('customer.pages.requests.types.workforce')}</option>
                        <option value="licensing">{t('customer.pages.requests.types.licensing')}</option>
                        <option value="compliance">{t('customer.pages.requests.types.compliance')}</option>
                        <option value="technical">{t('customer.pages.requests.types.technical')}</option>
                    </select>

                    {(search || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#857E74] hover:text-[#0D0D0D] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg transition-colors cursor-pointer"
                            title={t('customer.pages.requests.feedback.resetFilters')}
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer.pages.requests.feedback.resetFilters')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Responsive Table */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#857E74] font-semibold">
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.code')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.title')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.company')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.service')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.priority')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.status')}</th>
                                <th className="py-3 px-4 text-start font-medium">{t('customer.pages.requests.table.dueDate')}</th>
                                <th className="py-3 px-4 text-end font-medium">{t('customer.pages.requests.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0ECE6]">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[#857E74]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ClipboardList className="w-8 h-8 text-[#D6CFC4]" />
                                            <p className="text-sm font-medium">{t('customer.pages.requests.feedback.noResults')}</p>
                                            <button
                                                type="button"
                                                onClick={resetFilters}
                                                className="text-xs text-[#2D3F2C] hover:underline font-semibold cursor-pointer mt-1"
                                            >
                                                {t('customer.pages.requests.feedback.resetFilters')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                        {/* Code */}
                                        <td className="py-3.5 px-4 font-mono font-semibold text-[#2D3F2C]">
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8]" dir="ltr">
                                                {req.code}
                                            </span>
                                        </td>

                                        {/* Title & Scope */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <p className="font-bold text-[#0D0D0D]">
                                                {isRtl ? req.titleAr : req.titleEn}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[#857E74] border border-[#E5E0D8]">
                                                    {getTypeLabel(req.requestType)}
                                                </span>
                                                {req.govReferenceNo && (
                                                    <span className="text-[10px] font-mono text-[#857E74]" dir="ltr">
                                                        #{req.govReferenceNo}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Company */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-3.5 h-3.5 text-[#857E74] shrink-0" />
                                                <span className="font-medium text-[#0D0D0D]">
                                                    {isRtl ? req.companyNameAr : req.companyNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Service */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] text-[#857E74]" dir="ltr">
                                                    {req.serviceCode}
                                                </span>
                                                <span className="truncate max-w-[140px] text-[#595550]">
                                                    {isRtl ? req.serviceNameAr : req.serviceNameEn}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Priority */}
                                        <td className="py-3.5 px-4">
                                            {getPriorityBadge(req.priority)}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            {getStatusBadge(req.status)}
                                        </td>

                                        {/* Due Date */}
                                        <td className="py-3.5 px-4 text-[#595550] whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-[#857E74]" />
                                                <span className="font-mono text-[11px]" dir="ltr">{req.dueDate}</span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View */}
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRequest(req)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.requests.table.view')}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(req)}
                                                    className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                                                    title={t('customer.pages.requests.table.edit')}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>

                                                {/* Advance Status Progression */}
                                                {req.status !== 'completed' && req.status !== 'cancelled' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdvanceStatus(req.id)}
                                                        className="p-1.5 rounded-lg text-[#265938] hover:text-[#1E5631] hover:bg-[#EAF3EC] border border-transparent hover:border-[#C5DFCC] transition-colors cursor-pointer"
                                                        title={t('customer.pages.requests.table.advanceStatus')}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Details Drawer / Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingRequest.titleAr : viewingRequest.titleEn}
                                        </h2>
                                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]" dir="ltr">
                                            {viewingRequest.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {isRtl ? viewingRequest.companyNameAr : viewingRequest.companyNameEn}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingRequest(null)}
                                className="p-2 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Status Progression Stepper */}
                            <div>
                                <h4 className="text-xs font-bold text-[#0D0D0D] mb-3">
                                    {t('customer.pages.requests.details.progressionTitle')}
                                </h4>
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <div className="flex items-center justify-between relative">
                                        {['pending', 'under_review', 'in_progress', 'completed'].map((st, idx, arr) => {
                                            const statusOrder = ['pending', 'under_review', 'in_progress', 'completed'];
                                            const currentIdx = statusOrder.indexOf(viewingRequest.status);
                                            const isDone = currentIdx >= idx;
                                            const isCurrent = currentIdx === idx;

                                            return (
                                                <div key={st} className="flex-1 flex flex-col items-center relative z-10">
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                                            isDone
                                                                ? 'bg-[#2D3F2C] text-white'
                                                                : 'bg-[#E5E0D8] text-[#857E74]'
                                                        } ${isCurrent ? 'ring-2 ring-[#BFAB93] ring-offset-2' : ''}`}
                                                    >
                                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                                    </div>
                                                    <span className={`text-[10px] mt-1.5 font-medium text-center ${isCurrent ? 'text-[#0D0D0D] font-bold' : 'text-[#857E74]'}`}>
                                                        {t(`customer.pages.requests.statuses.${st}`)}
                                                    </span>
                                                    {idx < arr.length - 1 && (
                                                        <div
                                                            className={`absolute top-3.5 -end-1/2 w-full h-0.5 -z-10 ${
                                                                currentIdx > idx ? 'bg-[#2D3F2C]' : 'bg-[#E5E0D8]'
                                                            }`}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.requests.table.priority')}
                                    </span>
                                    <div className="mt-1">{getPriorityBadge(viewingRequest.priority)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.requests.table.status')}
                                    </span>
                                    <div className="mt-1">{getStatusBadge(viewingRequest.status)}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.requests.details.submissionDate')}
                                    </span>
                                    <p className="text-xs font-mono font-bold text-[#0D0D0D] mt-1" dir="ltr">
                                        {viewingRequest.submissionDate}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-medium text-[#857E74]">
                                        {t('customer.pages.requests.details.dueDate')}
                                    </span>
                                    <p className="text-xs font-mono font-bold text-[#2D3F2C] mt-1" dir="ltr">
                                        {viewingRequest.dueDate}
                                    </p>
                                </div>
                            </div>

                            {/* Linked Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                    <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.requests.table.company')}
                                    </span>
                                    <p className="text-xs font-bold text-[#0D0D0D]">
                                        {isRtl ? viewingRequest.companyNameAr : viewingRequest.companyNameEn}
                                    </p>
                                </div>
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                    <span className="text-[11px] font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.requests.table.service')}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#2D3F2C] border border-[#E5E0D8]" dir="ltr">
                                            {viewingRequest.serviceCode}
                                        </span>
                                        <p className="text-xs font-bold text-[#0D0D0D]">
                                            {isRtl ? viewingRequest.serviceNameAr : viewingRequest.serviceNameEn}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Descriptions */}
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.requests.modal.descriptionAr')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingRequest.descriptionAr || '-'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-[#857E74] uppercase tracking-wider">
                                        {t('customer.pages.requests.modal.descriptionEn')}
                                    </h4>
                                    <p className="text-xs text-[#0D0D0D] mt-1 leading-relaxed bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                                        {viewingRequest.descriptionEn || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Reference number and notes */}
                            {(viewingRequest.govReferenceNo || viewingRequest.notes) && (
                                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                    {viewingRequest.govReferenceNo && (
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[#857E74]">
                                                {t('customer.pages.requests.details.govReference')}
                                            </span>
                                            <span className="font-mono font-semibold text-[#2D3F2C]" dir="ltr">
                                                {viewingRequest.govReferenceNo}
                                            </span>
                                        </div>
                                    )}
                                    {viewingRequest.notes && (
                                        <div className="text-xs pt-1 border-t border-[#E5E0D8]">
                                            <span className="text-[#857E74] block mb-1">
                                                {t('customer.pages.requests.details.notes')}
                                            </span>
                                            <p className="text-[#0D0D0D] leading-relaxed">{viewingRequest.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-between">
                            {viewingRequest.status !== 'completed' && viewingRequest.status !== 'cancelled' ? (
                                <button
                                    type="button"
                                    onClick={() => handleAdvanceStatus(viewingRequest.id)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#EAF3EC] hover:bg-[#D5EAD8] text-[#265938] border border-[#C5DFCC] transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{t('customer.pages.requests.details.advanceNextStatus')}</span>
                                </button>
                            ) : (
                                <span className="text-xs text-[#857E74] font-medium">
                                    {t('customer.pages.requests.details.terminalStatus')}
                                </span>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStartEdit(viewingRequest)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    <Edit3 className="w-3.5 h-3.5 text-[#857E74]" />
                                    <span>{t('customer.pages.requests.details.edit')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewingRequest(null)}
                                    className="px-4 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.requests.details.close')}
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
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#F0ECE6] flex items-center justify-between bg-[#FAF8F5]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2D3F2C] text-white flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-[#BFAB93]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {editingRequestId
                                            ? t('customer.pages.requests.modal.editTitle')
                                            : t('customer.pages.requests.modal.addTitle')}
                                    </h2>
                                    <p className="text-xs text-[#857E74] mt-0.5">
                                        {editingRequestId
                                            ? t('customer.pages.requests.modal.editSubtitle')
                                            : t('customer.pages.requests.modal.addSubtitle')}
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
                        <form onSubmit={handleSaveRequest} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {/* Code & Request Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.code')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="REQ-2026-001"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.requestType')}
                                        </label>
                                        <select
                                            value={formData.requestType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, requestType: e.target.value as RequestType })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                        >
                                            <option value="government">{t('customer.pages.requests.types.government')}</option>
                                            <option value="workforce">{t('customer.pages.requests.types.workforce')}</option>
                                            <option value="licensing">{t('customer.pages.requests.types.licensing')}</option>
                                            <option value="compliance">{t('customer.pages.requests.types.compliance')}</option>
                                            <option value="technical">{t('customer.pages.requests.types.technical')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Titles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.titleAr')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.titleAr}
                                            onChange={(e) => {
                                                setFormData({ ...formData, titleAr: e.target.value });
                                                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                                            }}
                                            placeholder="عنوان طلب الخدمة بالعربية"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.titleEn')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.titleEn}
                                            onChange={(e) => {
                                                setFormData({ ...formData, titleEn: e.target.value });
                                                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                                            }}
                                            placeholder="Request title in English"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                {formErrors.title && (
                                    <p className="text-[11px] text-red-600 font-medium -mt-2">{formErrors.title}</p>
                                )}

                                {/* Company & Linked Service */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.company')} <span className="text-red-500">*</span>
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

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.service')} <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.serviceId}
                                            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                        >
                                            {DEMO_SERVICES.map((srv) => (
                                                <option key={srv.id} value={srv.id}>
                                                    [{srv.code}] {isRtl ? srv.nameAr : srv.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Priority & Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.priority')}
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) =>
                                                setFormData({ ...formData, priority: e.target.value as RequestPriority })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                        >
                                            <option value="urgent">{t('customer.pages.requests.priorities.urgent')}</option>
                                            <option value="high">{t('customer.pages.requests.priorities.high')}</option>
                                            <option value="medium">{t('customer.pages.requests.priorities.medium')}</option>
                                            <option value="low">{t('customer.pages.requests.priorities.low')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.status')}
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) =>
                                                setFormData({ ...formData, status: e.target.value as RequestStatus })
                                            }
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C] cursor-pointer"
                                        >
                                            <option value="pending">{t('customer.pages.requests.statuses.pending')}</option>
                                            <option value="under_review">{t('customer.pages.requests.statuses.under_review')}</option>
                                            <option value="in_progress">{t('customer.pages.requests.statuses.in_progress')}</option>
                                            <option value="completed">{t('customer.pages.requests.statuses.completed')}</option>
                                            <option value="cancelled">{t('customer.pages.requests.statuses.cancelled')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Submission Date & Due Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.submissionDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.submissionDate}
                                            onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.dueDate')}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                {/* Description Arabic & English */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.descriptionAr')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionAr}
                                            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                            placeholder="وصف تفصيلي للإجراء والوثائق المرفقة..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.descriptionEn')}
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.descriptionEn}
                                            onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                            placeholder="Detailed scope of the requested delivery..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Gov Reference & Notes */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.govReference')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.govReferenceNo}
                                            onChange={(e) => setFormData({ ...formData, govReferenceNo: e.target.value })}
                                            placeholder="BALADY-9481 / QIWA-8401"
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-mono text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('customer.pages.requests.modal.notes')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="ملاحظات المتابعة والتدقيق..."
                                            className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#2D3F2C]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-[#F0ECE6] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.requests.modal.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                    {t('customer.pages.requests.modal.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
