import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileText,
    Search,
    Plus,
    X,
    Eye,
    Edit3,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Calendar,
    Download,
    FileCheck,
    AlertTriangle,
    Clock,
    RefreshCw,
} from 'lucide-react';

export type DocumentType =
    | 'commercial_registration'
    | 'tax_certificate'
    | 'gosi_certificate'
    | 'iso_certificate'
    | 'sla_contract'
    | 'power_of_attorney'
    | 'compliance_audit';

export type DocumentStatus =
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'under_review'
    | 'archived';

export interface CustomerDocumentItem {
    id: string;
    code: string;
    companyId: string;
    companyNameEn: string;
    companyNameAr: string;
    titleEn: string;
    titleAr: string;
    documentType: DocumentType;
    linkedEntityType: 'company' | 'request' | 'contract';
    linkedEntityRef: string;
    version: string;
    fileName: string;
    fileSize: string;
    uploadDate: string;
    expiryDate: string;
    status: DocumentStatus;
    notesEn?: string;
    notesAr?: string;
}

const STORAGE_KEY = 'awn_customer_documents_v1';

const DEMO_COMPANIES = [
    { id: 'cmp-1', nameEn: 'Al-Fursan Logistics Co.', nameAr: 'شركة الفرسان اللوجستية', crNumber: '1010345678' },
    { id: 'cmp-2', nameEn: 'Rawabi Energy Services', nameAr: 'خدمات الروابي للطاقة', crNumber: '2050123456' },
    { id: 'cmp-3', nameEn: 'Madaen Real Estate Group', nameAr: 'مجموعة مدائن العقارية', crNumber: '4030654321' },
    { id: 'cmp-4', nameEn: 'Safwa Medical Healthcare', nameAr: 'صفوة الرعاية الطبية', crNumber: '1010987654' },
    { id: 'cmp-5', nameEn: 'Horizon Digital Technologies', nameAr: 'تقنيات الأفق الرقمية', crNumber: '7001234567' },
    { id: 'cmp-6', nameEn: 'Red Sea Hospitality & Resorts', nameAr: 'الضيافة والمنتجعات بالبحر الأحمر', crNumber: '4031987654' },
];

const SEED_DOCUMENTS: CustomerDocumentItem[] = [
    {
        id: 'doc-1',
        code: 'DOC-101',
        companyId: 'cmp-1',
        companyNameEn: 'Al-Fursan Logistics Co.',
        companyNameAr: 'شركة الفرسان اللوجستية',
        titleEn: 'Commercial Registration Certificate',
        titleAr: 'شهادة السجل التجاري الرئيسي',
        documentType: 'commercial_registration',
        linkedEntityType: 'company',
        linkedEntityRef: 'CR-1010345678',
        version: 'v2.0',
        fileName: 'fursan_cr_2026.pdf',
        fileSize: '1.8 MB',
        uploadDate: '2025-11-15',
        expiryDate: '2026-11-14',
        status: 'active',
        notesEn: 'Verified through Ministry of Commerce Wathq gateway.',
        notesAr: 'تم التحقق والاعتماد عبر بوابة واثق التابعة لوزارة التجارة.',
    },
    {
        id: 'doc-2',
        code: 'DOC-102',
        companyId: 'cmp-2',
        companyNameEn: 'Rawabi Energy Services',
        companyNameAr: 'خدمات الروابي للطاقة',
        titleEn: 'Zakat, Tax & Customs Authority (ZATCA) Certificate',
        titleAr: 'شهادة الزكاة والضريبة والجمارك (ZATCA)',
        documentType: 'tax_certificate',
        linkedEntityType: 'contract',
        linkedEntityRef: 'CTR-2025-019',
        version: 'v1.1',
        fileName: 'rawabi_zatca_tax_2026.pdf',
        fileSize: '2.4 MB',
        uploadDate: '2026-01-10',
        expiryDate: '2026-04-30',
        status: 'expiring_soon',
        notesEn: 'Zakat clearance renewal required before Q2 close.',
        notesAr: 'يتطلب تجديد شهادة الزكاة قبل نهاية الربع المالي الثاني.',
    },
    {
        id: 'doc-3',
        code: 'DOC-103',
        companyId: 'cmp-3',
        companyNameEn: 'Madaen Real Estate Group',
        companyNameAr: 'مجموعة مدائن العقارية',
        titleEn: 'Master Service Level Agreement (SLA)',
        titleAr: 'اتفاقية مستوى الخدمة الإطارية المعتمدة',
        documentType: 'sla_contract',
        linkedEntityType: 'contract',
        linkedEntityRef: 'CTR-2024-88',
        version: 'v3.2',
        fileName: 'madaen_sla_master_v3.pdf',
        fileSize: '4.6 MB',
        uploadDate: '2025-08-01',
        expiryDate: '2027-07-31',
        status: 'active',
        notesEn: 'Executed SLA agreement covering facility services.',
        notesAr: 'عقد مستوى الخدمة التنفيذي لإدارة المرافق والتأجير.',
    },
    {
        id: 'doc-4',
        code: 'DOC-104',
        companyId: 'cmp-4',
        companyNameEn: 'Safwa Medical Healthcare',
        companyNameAr: 'صفوة الرعاية الطبية',
        titleEn: 'MOH Healthcare Operating License',
        titleAr: 'ترخيص تشغيل المنشأة الطبية (وزارة الصحة)',
        documentType: 'compliance_audit',
        linkedEntityType: 'company',
        linkedEntityRef: 'MOH-MED-4481',
        version: 'v1.0',
        fileName: 'safwa_moh_license.pdf',
        fileSize: '3.1 MB',
        uploadDate: '2025-03-12',
        expiryDate: '2026-03-11',
        status: 'expired',
        notesEn: 'Annual operating inspection report pending renewal.',
        notesAr: 'تقرير التفتيش السنوي منتهي الصلاحية ويتطلب التجديد.',
    },
    {
        id: 'doc-5',
        code: 'DOC-105',
        companyId: 'cmp-5',
        companyNameEn: 'Horizon Digital Technologies',
        companyNameAr: 'تقنيات الأفق الرقمية',
        titleEn: 'ISO/IEC 27001 Information Security Certification',
        titleAr: 'شهادة الآيزو لأمن المعلومات ISO 27001',
        documentType: 'iso_certificate',
        linkedEntityType: 'request',
        linkedEntityRef: 'REQ-2026-081',
        version: 'v2.1',
        fileName: 'horizon_iso27001_cert.pdf',
        fileSize: '1.2 MB',
        uploadDate: '2026-02-05',
        expiryDate: '2028-02-04',
        status: 'under_review',
        notesEn: 'Submitted for annual compliance audit review.',
        notesAr: 'تم الرفع للمراجعة السنوية للامتثال والحوكمة الرقمية.',
    },
    {
        id: 'doc-6',
        code: 'DOC-106',
        companyId: 'cmp-6',
        companyNameEn: 'Red Sea Hospitality & Resorts',
        companyNameAr: 'الضيافة والمنتجعات بالبحر الأحمر',
        titleEn: 'Commercial Power of Attorney & Authorization',
        titleAr: 'وكالة تجارية شرعية وتفويض معتمد',
        documentType: 'power_of_attorney',
        linkedEntityType: 'company',
        linkedEntityRef: 'POA-99820-2025',
        version: 'v1.0',
        fileName: 'redsea_legal_poa.pdf',
        fileSize: '0.9 MB',
        uploadDate: '2025-09-20',
        expiryDate: '2026-09-19',
        status: 'active',
        notesEn: 'Authorized signatory representation authenticated by Najiz.',
        notesAr: 'توثيق رسمي للمفوض بالتوقيع صادر عبر منصة ناجز.',
    },
];

export const CustomerDocumentsPage: React.FC = () => {
    const { i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');

    // State & persistence
    const [documents, setDocuments] = useState<CustomerDocumentItem[]>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch {
            // fallback
        }
        return SEED_DOCUMENTS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
        } catch {
            // handle quota
        }
    }, [documents]);

    // Search and filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
    const [companyFilter, setCompanyFilter] = useState('all');

    // UI states
    const [viewingDoc, setViewingDoc] = useState<CustomerDocumentItem | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form fields
    const [formData, setFormData] = useState({
        code: '',
        companyId: DEMO_COMPANIES[0].id,
        titleEn: '',
        titleAr: '',
        documentType: 'commercial_registration' as DocumentType,
        linkedEntityType: 'company' as 'company' | 'request' | 'contract',
        linkedEntityRef: '',
        version: 'v1.0',
        expiryDate: '',
        status: 'active' as DocumentStatus,
        notesEn: '',
        notesAr: '',
    });

    const [formErrors, setFormErrors] = useState<{
        title?: string;
        code?: string;
        expiryDate?: string;
    }>({});

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Filtered records
    const filteredDocuments = useMemo(() => {
        const query = search.trim().toLowerCase();
        return documents.filter((doc) => {
            const matchesQuery =
                !query ||
                doc.code.toLowerCase().includes(query) ||
                doc.titleEn.toLowerCase().includes(query) ||
                doc.titleAr.includes(search.trim()) ||
                doc.linkedEntityRef.toLowerCase().includes(query) ||
                doc.companyNameEn.toLowerCase().includes(query) ||
                doc.companyNameAr.includes(search.trim());

            const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
            const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
            const matchesCompany = companyFilter === 'all' || doc.companyId === companyFilter;

            return matchesQuery && matchesStatus && matchesType && matchesCompany;
        });
    }, [documents, search, statusFilter, typeFilter, companyFilter]);

    // 4 KPI Cards
    const kpis = useMemo(() => {
        const total = documents.length;
        const active = documents.filter((d) => d.status === 'active').length;
        const expiringOrExpired = documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired').length;
        const underReview = documents.filter((d) => d.status === 'under_review').length;

        return {
            total,
            active,
            expiringOrExpired,
            underReview,
        };
    }, [documents]);

    // Start Add
    const handleStartAdd = () => {
        const nextCode = `DOC-${documents.length + 101}`;
        setEditingDocId(null);
        setFormErrors({});
        setFormData({
            code: nextCode,
            companyId: DEMO_COMPANIES[0].id,
            titleEn: '',
            titleAr: '',
            documentType: 'commercial_registration',
            linkedEntityType: 'company',
            linkedEntityRef: 'CR-1010345678',
            version: 'v1.0',
            expiryDate: '2027-12-31',
            status: 'active',
            notesEn: '',
            notesAr: '',
        });
        setIsFormModalOpen(true);
    };

    // Start Edit
    const handleStartEdit = (doc: CustomerDocumentItem) => {
        setEditingDocId(doc.id);
        setFormErrors({});
        setFormData({
            code: doc.code,
            companyId: doc.companyId,
            titleEn: doc.titleEn,
            titleAr: doc.titleAr,
            documentType: doc.documentType,
            linkedEntityType: doc.linkedEntityType,
            linkedEntityRef: doc.linkedEntityRef,
            version: doc.version,
            expiryDate: doc.expiryDate,
            status: doc.status,
            notesEn: doc.notesEn || '',
            notesAr: doc.notesAr || '',
        });
        setViewingDoc(null);
        setIsFormModalOpen(true);
    };

    // Save
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: { title?: string; code?: string; expiryDate?: string } = {};

        if (!formData.titleEn.trim() && !formData.titleAr.trim()) {
            errors.title = isRtl ? 'عنوان الوثيقة مطلوب بالعربية أو الإنجليزية' : 'Document title is required in English or Arabic';
        }
        if (!formData.code.trim()) {
            errors.code = isRtl ? 'رمز الوثيقة مطلوب' : 'Document code is required';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const comp = DEMO_COMPANIES.find((c) => c.id === formData.companyId) || DEMO_COMPANIES[0];

        if (editingDocId) {
            setDocuments((prev) =>
                prev.map((d) => {
                    if (d.id === editingDocId) {
                        return {
                            ...d,
                            code: formData.code.trim(),
                            companyId: comp.id,
                            companyNameEn: comp.nameEn,
                            companyNameAr: comp.nameAr,
                            titleEn: formData.titleEn.trim() || formData.titleAr.trim(),
                            titleAr: formData.titleAr.trim() || formData.titleEn.trim(),
                            documentType: formData.documentType,
                            linkedEntityType: formData.linkedEntityType,
                            linkedEntityRef: formData.linkedEntityRef.trim() || d.linkedEntityRef,
                            version: formData.version.trim() || d.version,
                            expiryDate: formData.expiryDate || d.expiryDate,
                            status: formData.status,
                            notesEn: formData.notesEn.trim(),
                            notesAr: formData.notesAr.trim(),
                        };
                    }
                    return d;
                })
            );
            showToast(isRtl ? 'تم تحديث بيانات الوثيقة بنجاح' : 'Document updated successfully');
        } else {
            const newDoc: CustomerDocumentItem = {
                id: `doc-${Date.now()}`,
                code: formData.code.trim(),
                companyId: comp.id,
                companyNameEn: comp.nameEn,
                companyNameAr: comp.nameAr,
                titleEn: formData.titleEn.trim() || formData.titleAr.trim(),
                titleAr: formData.titleAr.trim() || formData.titleEn.trim(),
                documentType: formData.documentType,
                linkedEntityType: formData.linkedEntityType,
                linkedEntityRef: formData.linkedEntityRef.trim() || `REF-${Date.now().toString().slice(-4)}`,
                version: formData.version.trim() || 'v1.0',
                fileName: `${formData.code.toLowerCase()}_file.pdf`,
                fileSize: '1.5 MB',
                uploadDate: new Date().toISOString().split('T')[0],
                expiryDate: formData.expiryDate || '2027-12-31',
                status: formData.status,
                notesEn: formData.notesEn.trim(),
                notesAr: formData.notesAr.trim(),
            };
            setDocuments((prev) => [newDoc, ...prev]);
            showToast(isRtl ? 'تم إضافة الوثيقة واعتمادها بنجاح' : 'Document added successfully');
        }

        setIsFormModalOpen(false);
    };

    // Quick Status Action (Renew / Expire)
    const handleRenewDocument = (id: string) => {
        setDocuments((prev) =>
            prev.map((d) => {
                if (d.id === id) {
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    return {
                        ...d,
                        status: 'active',
                        expiryDate: nextYear.toISOString().split('T')[0],
                    };
                }
                return d;
            })
        );
        if (viewingDoc && viewingDoc.id === id) {
            setViewingDoc((prev) => (prev ? { ...prev, status: 'active' } : null));
        }
        showToast(isRtl ? 'تم تجديد الوثيقة وتمديد صلاحيتها لمدة عام' : 'Document renewed for 1 year');
    };

    const handleMarkExpired = (id: string) => {
        setDocuments((prev) =>
            prev.map((d) => (d.id === id ? { ...d, status: 'expired' } : d))
        );
        if (viewingDoc && viewingDoc.id === id) {
            setViewingDoc((prev) => (prev ? { ...prev, status: 'expired' } : null));
        }
        showToast(isRtl ? 'تم وضع علامة منتهي الصلاحية على الوثيقة' : 'Document marked as expired');
    };

    // Status Badge Helper
    const renderStatusBadge = (status: DocumentStatus) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'سارية / معتمدة' : 'Active / Valid'}</span>
                    </span>
                );
            case 'expiring_soon':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تنتهي قريباً' : 'Expiring Soon'}</span>
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'منتهية الصلاحية' : 'Expired'}</span>
                    </span>
                );
            case 'under_review':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'قيد المراجعة' : 'Under Review'}</span>
                    </span>
                );
            case 'archived':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مؤرشفة' : 'Archived'}</span>
                    </span>
                );
        }
    };

    // Document Type Label
    const getDocTypeLabel = (type: DocumentType) => {
        switch (type) {
            case 'commercial_registration':
                return isRtl ? 'سجل تجاري' : 'Commercial Registration';
            case 'tax_certificate':
                return isRtl ? 'شهادة الزكاة والضريبة' : 'Tax & Zakat Certificate';
            case 'gosi_certificate':
                return isRtl ? 'شهادة التأمينات (GOSI)' : 'GOSI Compliance';
            case 'iso_certificate':
                return isRtl ? 'شهادة آيزو معتمدة' : 'ISO Certificate';
            case 'sla_contract':
                return isRtl ? 'اتفاقية مستوى الخدمة' : 'SLA Agreement';
            case 'power_of_attorney':
                return isRtl ? 'وكالة وتفويض رسمي' : 'Power of Attorney';
            case 'compliance_audit':
                return isRtl ? 'ترخيص وتدقيق نظامي' : 'Compliance License';
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
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    {isRtl ? 'وثائق ومستندات العملاء' : 'Customer Documents'}
                                </h1>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono">
                                    CST-DOC
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {isRtl
                                    ? 'إدارة التراخيص الرسمية والسجلات التجارية وعقود الخدمة وتتبع تواريخ الصلاحية والامتثال.'
                                    : 'Manage statutory licenses, commercial certificates, agreements, and track expiration & compliance.'}
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
                        <span>{isRtl ? 'وثيقة جديدة' : 'Add Document'}</span>
                    </button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'إجمالي الوثائق' : 'Total Documents'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {kpis.total}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/50 flex items-center justify-center text-[#265938] dark:text-emerald-400">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'الوثائق السارية' : 'Active Documents'}
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
                            {isRtl ? 'تنتهي قريباً / منتهية' : 'Expiring / Expired'}
                        </p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {kpis.expiringOrExpired}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {isRtl ? 'قيد المراجعة والتدقيق' : 'Under Review'}
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {kpis.underReview}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 start-3" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? 'البحث بالرمز، عنوان الوثيقة، المنشأة، أو المرجع...' : 'Search by code, title, company, or reference...'}
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
                            <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                            <option value="active">{isRtl ? 'سارية / معتمدة' : 'Active'}</option>
                            <option value="expiring_soon">{isRtl ? 'تنتهي قريباً' : 'Expiring Soon'}</option>
                            <option value="expired">{isRtl ? 'منتهية الصلاحية' : 'Expired'}</option>
                            <option value="under_review">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                            <option value="archived">{isRtl ? 'مؤرشفة' : 'Archived'}</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Types'}</option>
                            <option value="commercial_registration">{isRtl ? 'سجل تجاري' : 'Commercial Registration'}</option>
                            <option value="tax_certificate">{isRtl ? 'شهادة الزكاة والضريبة' : 'Tax & Zakat'}</option>
                            <option value="sla_contract">{isRtl ? 'اتفاقية مستوى الخدمة' : 'SLA Contract'}</option>
                            <option value="iso_certificate">{isRtl ? 'شهادة آيزو' : 'ISO Certificate'}</option>
                            <option value="power_of_attorney">{isRtl ? 'وكالة وتفويض' : 'Power of Attorney'}</option>
                            <option value="compliance_audit">{isRtl ? 'ترخيص وتدقيق' : 'Compliance Audit'}</option>
                        </select>

                        {/* Company Filter */}
                        <select
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#265938]"
                        >
                            <option value="all">{isRtl ? 'جميع الشركات' : 'All Companies'}</option>
                            {DEMO_COMPANIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>

                        {(search || statusFilter !== 'all' || typeFilter !== 'all' || companyFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                    setCompanyFilter('all');
                                }}
                                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الرمز' : 'Code'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'عنوان الوثيقة والملف' : 'Document & File'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'المنشأة والارتباط' : 'Company & Reference'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'التصنيف' : 'Category'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                                <th className="px-4 py-3.5 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3.5 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
                            {filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm font-medium">{isRtl ? 'لا توجد وثائق مطابقة لخيارات البحث' : 'No documents found matching search criteria'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-gray-900 dark:text-white">
                                            {doc.code}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {isRtl ? doc.titleAr : doc.titleEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                                <span className="font-mono">{doc.fileName}</span>
                                                <span>•</span>
                                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.2 rounded text-[11px] font-mono">{doc.version}</span>
                                                <span>•</span>
                                                <span>{doc.fileSize}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium text-gray-800 dark:text-gray-200">
                                                {isRtl ? doc.companyNameAr : doc.companyNameEn}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                {doc.linkedEntityRef}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {getDocTypeLabel(doc.documentType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-mono">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{doc.expiryDate}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {renderStatusBadge(doc.status)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setViewingDoc(doc)}
                                                    title={isRtl ? 'عرض التفاصيل' : 'View Details'}
                                                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStartEdit(doc)}
                                                    title={isRtl ? 'تعديل' : 'Edit'}
                                                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                {doc.status !== 'active' ? (
                                                    <button
                                                        onClick={() => handleRenewDocument(doc.id)}
                                                        title={isRtl ? 'تجديد الوثيقة' : 'Renew Document'}
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleMarkExpired(doc.id)}
                                                        title={isRtl ? 'تعيين كمنتهي' : 'Mark Expired'}
                                                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
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

            {/* Details Drawer */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
                    <div
                        className="w-full max-w-lg bg-white dark:bg-gray-800 h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#EAF3EC] dark:bg-emerald-950/50 rounded-xl text-[#265938] dark:text-emerald-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {isRtl ? viewingDoc.titleAr : viewingDoc.titleEn}
                                        </h2>
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                            {viewingDoc.code} • {viewingDoc.version}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingDoc(null)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Status and Type */}
                            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'الحالة الحالية' : 'Current Status'}</p>
                                    <div className="mt-1">{renderStatusBadge(viewingDoc.status)}</div>
                                </div>
                                <div className="text-end">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{isRtl ? 'التصنيف النظامي' : 'Category'}</p>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                        {getDocTypeLabel(viewingDoc.documentType)}
                                    </p>
                                </div>
                            </div>

                            {/* Document File Card */}
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{viewingDoc.fileName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{viewingDoc.fileSize} • PDF Document</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => showToast(isRtl ? 'تم تنزيل نسخة المعاينة بنجاح' : 'Preview download initiated')}
                                    className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>{isRtl ? 'تنزيل' : 'Download'}</span>
                                </button>
                            </div>

                            {/* Details List */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'المنشأة العميلة' : 'Customer Entity'}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {isRtl ? viewingDoc.companyNameAr : viewingDoc.companyNameEn}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'الارتباط المرجعي' : 'Linked Reference'}</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">{viewingDoc.linkedEntityRef}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'تاريخ الرفع' : 'Upload Date'}</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{viewingDoc.uploadDate}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500 dark:text-gray-400">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{viewingDoc.expiryDate}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            {(viewingDoc.notesEn || viewingDoc.notesAr) && (
                                <div className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                        {isRtl ? 'ملاحظات الامتثال والحوكمة' : 'Compliance & Audit Notes'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {isRtl ? viewingDoc.notesAr || viewingDoc.notesEn : viewingDoc.notesEn || viewingDoc.notesAr}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <button
                                onClick={() => handleStartEdit(viewingDoc)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>{isRtl ? 'تعديل البيانات' : 'Edit Metadata'}</span>
                            </button>
                            {viewingDoc.status !== 'active' ? (
                                <button
                                    onClick={() => handleRenewDocument(viewingDoc.id)}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#265938] hover:bg-[#1E472D] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>{isRtl ? 'تجديد الوثيقة' : 'Renew Document'}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleMarkExpired(viewingDoc.id)}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{isRtl ? 'تعيين كمنتهي' : 'Mark Expired'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
                    <div
                        className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden my-8"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingDocId
                                    ? isRtl ? 'تعديل بيانات الوثيقة' : 'Edit Document Metadata'
                                    : isRtl ? 'إضافة وثيقة جديدة' : 'Add New Document'}
                            </h3>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'رمز الوثيقة' : 'Document Code'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                        placeholder="DOC-107"
                                    />
                                    {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الشركة العميلة' : 'Customer Entity'} *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
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
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'عنوان الوثيقة (بالعربية)' : 'Title (Arabic)'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleAr}
                                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                        placeholder="مثال: شهادة التأهيل الفني"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'عنوان الوثيقة (بالإنجليزية)' : 'Title (English)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                        placeholder="e.g. Technical Accreditation Cert"
                                    />
                                </div>
                            </div>
                            {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'التصنيف النظامي' : 'Document Type'}
                                    </label>
                                    <select
                                        value={formData.documentType}
                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="commercial_registration">{isRtl ? 'سجل تجاري' : 'Commercial Registration'}</option>
                                        <option value="tax_certificate">{isRtl ? 'شهادة الزكاة والضريبة' : 'Tax & Zakat Certificate'}</option>
                                        <option value="gosi_certificate">{isRtl ? 'شهادة التأمينات الاجتماعية' : 'GOSI Certificate'}</option>
                                        <option value="iso_certificate">{isRtl ? 'شهادة آيزو' : 'ISO Certificate'}</option>
                                        <option value="sla_contract">{isRtl ? 'اتفاقية مستوى الخدمة' : 'SLA Contract'}</option>
                                        <option value="power_of_attorney">{isRtl ? 'وكالة وتفويض رسمي' : 'Power of Attorney'}</option>
                                        <option value="compliance_audit">{isRtl ? 'ترخيص وتدقيق نظامي' : 'Compliance Audit'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الرقم المرجعي / العقد' : 'Reference Number'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.linkedEntityRef}
                                        onChange={(e) => setFormData({ ...formData, linkedEntityRef: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                        placeholder="CR-1010345678"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الإصدار / النسخة' : 'Version'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                        placeholder="v1.0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {isRtl ? 'الحالة' : 'Status'}
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as DocumentStatus })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                    >
                                        <option value="active">{isRtl ? 'سارية / معتمدة' : 'Active'}</option>
                                        <option value="expiring_soon">{isRtl ? 'تنتهي قريباً' : 'Expiring Soon'}</option>
                                        <option value="expired">{isRtl ? 'منتهية الصلاحية' : 'Expired'}</option>
                                        <option value="under_review">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                                        <option value="archived">{isRtl ? 'مؤرشفة' : 'Archived'}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {isRtl ? 'ملاحظات الامتثال (بالعربية)' : 'Notes (Arabic)'}
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notesAr}
                                    onChange={(e) => setFormData({ ...formData, notesAr: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#265938]"
                                    placeholder="ملاحظات المراجعة والاعتماد..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#265938] hover:bg-[#1E472D] text-white text-sm font-medium transition-colors"
                                >
                                    {editingDocId ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الوثيقة' : 'Add Document')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
