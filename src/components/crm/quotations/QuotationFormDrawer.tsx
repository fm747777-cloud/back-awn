import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Plus,
    Trash2,
    Calculator,
    AlertCircle,
    Calendar,
    User,
    Layers,
} from 'lucide-react';
import {
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    type CrmQuotationInput,
    type CrmQuotationRecord,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmContactRecord,
    type CrmTaxRecord,
    type CrmLeadRecord,
} from '../../../schemas/crmSchema';
import {
    crmApi,
    type CrmSalesEmployee,
    type CrmServiceCatalogItem,
} from '../../../api/api';

export type SubscriptionPeriod =
    | 'monthly'
    | 'quarterly'
    | 'semi_annual'
    | 'annual';

export interface SubscriptionFormItem {
    id: string;
    packageId?: string;
    packageName: string;
    packageNameAr?: string;
    unitPrice: number; // Price per unit per month
    quantity: number;
    period: SubscriptionPeriod;
}

export interface QuotationFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmQuotationRecord | null;
    preselectedDeal?: CrmDealRecord | null;
    leads?: CrmLeadRecord[];
    companies: CrmCompanyRecord[];
    deals: CrmDealRecord[];
    contacts: CrmContactRecord[];
    taxes: CrmTaxRecord[];
    catalogItems: CrmServiceCatalogItem[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmQuotationInput) => Promise<void> | void;
}

const PREDEFINED_SUBSCRIPTION_PACKAGES = [
    {
        id: 'pkg-1',
        nameEn: 'Enterprise Corporate Bundle',
        nameAr: 'باقة الشركات الكبرى المتكاملة',
        unitPrice: 14500,
    },
    {
        id: 'pkg-2',
        nameEn: 'SME Comprehensive Support',
        nameAr: 'باقة دعم المنشآت الصغيرة والمتوسطة',
        unitPrice: 7800,
    },
    {
        id: 'pkg-3',
        nameEn: 'Workforce & Labor Package',
        nameAr: 'باقة إدارة القوى العاملة والعمل',
        unitPrice: 5400,
    },
    {
        id: 'pkg-4',
        nameEn: 'Premium Investor Concierge',
        nameAr: 'باقة كونسيرج المستثمر المتميز',
        unitPrice: 22000,
    },
    {
        id: 'pkg-5',
        nameEn: 'Digital Transformation & Cloud Retainer',
        nameAr: 'باقة التحول الرقمي والسحابة المدارة',
        unitPrice: 18000,
    },
    {
        id: 'pkg-6',
        nameEn: 'Corporate ZATCA & Tax Advisory',
        nameAr: 'باقة الزكاة والضريبة والامتثال',
        unitPrice: 9500,
    },
    {
        id: 'pkg-7',
        nameEn: 'Logistics & Fleet Operations Retainer',
        nameAr: 'باقة العمليات اللوجستية والأسطول',
        unitPrice: 12000,
    },
];

const PERIOD_MULTIPLIERS: Record<SubscriptionPeriod, number> = {
    monthly: 1,
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
};

export const QuotationFormDrawer: React.FC<QuotationFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    preselectedDeal,
    leads: externalLeads,
    companies,
    deals: _deals,
    contacts,
    taxes: _taxes,
    catalogItems,
    employees,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultCompany =
        companies.find((c) => c.status === 'active') || companies[0];
    const defaultEmployeeId = employees[0]?.id || 'emp-1';

    // Lead fallback state if not supplied via props
    const [internalLeads, setInternalLeads] = useState<CrmLeadRecord[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        if (externalLeads && externalLeads.length > 0) return;
        let isMounted = true;
        crmApi.leads
            .getAll({ limit: 200 })
            .then((res) => {
                if (isMounted && res?.data) {
                    setInternalLeads(res.data);
                }
            })
            .catch(() => {
                // Ignore fallback failure
            });
        return () => {
            isMounted = false;
        };
    }, [isOpen, externalLeads]);

    const leads = useMemo(() => {
        if (externalLeads && externalLeads.length > 0) return externalLeads;
        return internalLeads;
    }, [externalLeads, internalLeads]);

    // Available packages dropdown list
    const availablePackages = useMemo(() => {
        const list: Array<{
            id: string;
            nameEn: string;
            nameAr: string;
            unitPrice: number;
        }> = [...PREDEFINED_SUBSCRIPTION_PACKAGES];

        if (Array.isArray(catalogItems)) {
            catalogItems.forEach((ci) => {
                if (!list.some((existing) => existing.id === ci.id)) {
                    list.push({
                        id: ci.id,
                        nameEn: ci.nameEn,
                        nameAr: ci.nameAr,
                        unitPrice: ci.unitPrice || 10000,
                    });
                }
            });
        }
        return list;
    }, [catalogItems]);

    // Form fields
    const todayIso = new Date().toISOString().split('T')[0];
    const validUntilObj = new Date();
    validUntilObj.setDate(validUntilObj.getDate() + 30);
    const validUntilIso = validUntilObj.toISOString().split('T')[0];

    // Section 1: Quotation Details
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [quotationDate, setQuotationDate] = useState(todayIso);
    const [quotationExpiryDate, setQuotationExpiryDate] = useState(validUntilIso);

    // Section 2: Customer Details
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Hidden linkages for CRM downstream workflows
    const [companyId, setCompanyId] = useState(defaultCompany?.id || '');
    const [contactId, setContactId] = useState('');
    const [dealId, setDealId] = useState('');

    // Section 3: Subscription Details
    const [subscriptionItems, setSubscriptionItems] = useState<
        SubscriptionFormItem[]
    >([
        {
            id: 'sub-item-1',
            packageId: PREDEFINED_SUBSCRIPTION_PACKAGES[0].id,
            packageName: PREDEFINED_SUBSCRIPTION_PACKAGES[0].nameEn,
            packageNameAr: PREDEFINED_SUBSCRIPTION_PACKAGES[0].nameAr,
            unitPrice: PREDEFINED_SUBSCRIPTION_PACKAGES[0].unitPrice,
            quantity: 1,
            period: 'monthly',
        },
    ]);

    // Section 4: Additional Details
    const [discountApplied, setDiscountApplied] = useState<number>(0);
    const [taxAppliedRate, setTaxAppliedRate] = useState<number>(15);
    const [contractDurationMonths, setContractDurationMonths] =
        useState<number>(12);

    // Validation errors
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Synchronize form on drawer open / mode changes
    const [prevSyncKey, setPrevSyncKey] = useState('');
    const syncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${preselectedDeal?.id ?? 'none'}-${leads.length}`;

    if (syncKey !== prevSyncKey) {
        setPrevSyncKey(syncKey);
        if (isOpen) {
            setFieldErrors({});

            if (mode === 'edit' && initialData) {
                // Populate existing record
                setSelectedLeadId(initialData.leadId || '');
                setQuotationDate(initialData.issueDate || todayIso);
                setQuotationExpiryDate(initialData.validUntil || validUntilIso);
                setCustomerName(
                    initialData.customerName ||
                        (isRtl
                            ? initialData.companyNameAr || initialData.companyNameEn
                            : initialData.companyNameEn) ||
                        initialData.contactName ||
                        ''
                );
                setCustomerEmail(
                    initialData.customerEmail ||
                        contacts.find((c) => c.id === initialData.contactId)
                            ?.email ||
                        ''
                );
                setCustomerPhone(
                    initialData.customerPhone ||
                        contacts.find((c) => c.id === initialData.contactId)
                            ?.phone ||
                        ''
                );
                setCompanyId(initialData.companyId);
                setContactId(initialData.contactId || '');
                setDealId(initialData.dealId || '');

                // Parse line items into subscription items
                if (
                    Array.isArray(initialData.lineItems) &&
                    initialData.lineItems.length > 0
                ) {
                    const parsedItems: SubscriptionFormItem[] =
                        initialData.lineItems.map((li, idx) => {
                            let itemPeriod: SubscriptionPeriod = 'monthly';
                            if (li.period === 3) itemPeriod = 'quarterly';
                            else if (li.period === 6) itemPeriod = 'semi_annual';
                            else if (li.period === 12) itemPeriod = 'annual';
                            else if (li.periodUnit === 'years') itemPeriod = 'annual';

                            return {
                                id: li.id || `sub-item-${idx + 1}`,
                                packageId: li.packageId || li.serviceId || undefined,
                                packageName:
                                    li.descriptionEn || 'Subscription Package',
                                packageNameAr: li.descriptionAr,
                                unitPrice: li.unitPrice || 0,
                                quantity: li.quantity || 1,
                                period: itemPeriod,
                            };
                        });
                    setSubscriptionItems(parsedItems);
                }

                // Discount & Tax rates
                const derivedDiscount =
                    initialData.discountPercent !== undefined
                        ? initialData.discountPercent
                        : initialData.subtotal > 0
                          ? Math.round(
                                (initialData.discountTotal /
                                    initialData.subtotal) *
                                    100
                            )
                          : 0;
                setDiscountApplied(derivedDiscount);

                const firstItemTaxRate = initialData.lineItems?.[0]?.taxRate;
                setTaxAppliedRate(
                    initialData.taxRate !== undefined
                        ? initialData.taxRate
                        : firstItemTaxRate !== undefined
                          ? firstItemTaxRate
                          : 15
                );

                setContractDurationMonths(
                    initialData.contractDurationMonths || 12
                );
            } else if (preselectedDeal) {
                // Populate from deal
                setDealId(preselectedDeal.id);
                setCompanyId(preselectedDeal.companyId);
                setContactId(preselectedDeal.contactId || '');

                const linkedLead = leads.find(
                    (l) => l.id === preselectedDeal.leadId
                );
                if (linkedLead) {
                    setSelectedLeadId(linkedLead.id);
                    setCustomerName(
                        linkedLead.companyNameEn ||
                            linkedLead.temporaryCompanyName ||
                            linkedLead.contactName ||
                            ''
                    );
                    setCustomerEmail(linkedLead.contactEmail || '');
                    setCustomerPhone(linkedLead.contactPhone || '');
                } else {
                    const matchedCompany = companies.find(
                        (c) => c.id === preselectedDeal.companyId
                    );
                    const matchedContact = contacts.find(
                        (c) => c.id === preselectedDeal.contactId
                    );
                    setCustomerName(
                        matchedCompany?.nameEn ||
                            preselectedDeal.titleEn ||
                            ''
                    );
                    setCustomerEmail(matchedContact?.email || '');
                    setCustomerPhone(matchedContact?.phone || '');
                }

                setQuotationDate(todayIso);
                setQuotationExpiryDate(validUntilIso);
                setSubscriptionItems([
                    {
                        id: 'sub-item-1',
                        packageId: PREDEFINED_SUBSCRIPTION_PACKAGES[0].id,
                        packageName: preselectedDeal.titleEn,
                        packageNameAr: preselectedDeal.titleAr,
                        unitPrice: preselectedDeal.expectedValue || 15000,
                        quantity: 1,
                        period: 'monthly',
                    },
                ]);
                setDiscountApplied(0);
                setTaxAppliedRate(15);
                setContractDurationMonths(12);
            } else {
                // Default fresh create form
                setSelectedLeadId('');
                setQuotationDate(todayIso);
                setQuotationExpiryDate(validUntilIso);
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
                setCompanyId(defaultCompany?.id || '');
                setContactId('');
                setDealId('');
                setSubscriptionItems([
                    {
                        id: 'sub-item-1',
                        packageId: PREDEFINED_SUBSCRIPTION_PACKAGES[0].id,
                        packageName: PREDEFINED_SUBSCRIPTION_PACKAGES[0].nameEn,
                        packageNameAr:
                            PREDEFINED_SUBSCRIPTION_PACKAGES[0].nameAr,
                        unitPrice:
                            PREDEFINED_SUBSCRIPTION_PACKAGES[0].unitPrice,
                        quantity: 1,
                        period: 'monthly',
                    },
                ]);
                setDiscountApplied(0);
                setTaxAppliedRate(15);
                setContractDurationMonths(12);
            }
        }
    }

    // Escape key listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle lead selection & auto-population
    const handleLeadChange = (leadId: string) => {
        setSelectedLeadId(leadId);
        if (fieldErrors.leadId) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.leadId;
                return next;
            });
        }

        if (!leadId) {
            return;
        }

        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;

        // Auto-populate customer details from selected lead
        const resolvedName =
            (isRtl
                ? lead.companyNameAr || lead.companyNameEn
                : lead.companyNameEn) ||
            lead.temporaryCompanyName ||
            lead.contactName ||
            lead.title;

        setCustomerName(resolvedName);
        setCustomerEmail(lead.contactEmail || '');
        setCustomerPhone(lead.contactPhone || '');

        if (lead.companyId) {
            setCompanyId(lead.companyId);
        } else if (!companyId) {
            setCompanyId(defaultCompany?.id || 'crm-comp-1');
        }

        if (fieldErrors.customerName) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.customerName;
                return next;
            });
        }
        if (fieldErrors.customerEmail) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.customerEmail;
                return next;
            });
        }
        if (fieldErrors.customerPhone) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.customerPhone;
                return next;
            });
        }
    };

    // Subscription item actions
    const handleAddNewItem = () => {
        const nextId = `sub-item-${Date.now()}-${subscriptionItems.length + 1}`;
        const defaultPkg =
            availablePackages[subscriptionItems.length % availablePackages.length] ||
            availablePackages[0];

        setSubscriptionItems((prev) => [
            ...prev,
            {
                id: nextId,
                packageId: defaultPkg?.id,
                packageName: defaultPkg?.nameEn || '',
                packageNameAr: defaultPkg?.nameAr,
                unitPrice: defaultPkg?.unitPrice || 5000,
                quantity: 1,
                period: 'monthly',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (subscriptionItems.length <= 1) return;
        setSubscriptionItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleUpdateItem = (
        index: number,
        patch: Partial<SubscriptionFormItem>
    ) => {
        setSubscriptionItems((prev) => {
            const next = [...prev];
            const current = next[index];
            if (!current) return prev;

            const updated = { ...current, ...patch };

            // If package changed, auto-update price & names
            if (patch.packageId !== undefined) {
                const foundPkg = availablePackages.find(
                    (p) => p.id === patch.packageId
                );
                if (foundPkg) {
                    updated.packageName = foundPkg.nameEn;
                    updated.packageNameAr = foundPkg.nameAr;
                    updated.unitPrice = foundPkg.unitPrice;
                }
            }

            next[index] = updated;
            return next;
        });

        if (fieldErrors[`item_${index}`]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[`item_${index}`];
                return next;
            });
        }
    };

    // Line item calculated totals
    const lineItemCalculations = useMemo(() => {
        return subscriptionItems.map((item) => {
            const qty = Math.max(0.01, Number(item.quantity) || 0);
            const price = Math.max(0, Number(item.unitPrice) || 0);
            const periodMultiplier = PERIOD_MULTIPLIERS[item.period] || 1;

            const totalMonthlyWithoutVat = Math.round(qty * price * 100) / 100;
            const lineTotalWithoutVat =
                Math.round(qty * price * periodMultiplier * 100) / 100;

            return {
                totalMonthlyWithoutVat,
                lineTotalWithoutVat,
                periodMultiplier,
            };
        });
    }, [subscriptionItems]);

    // Section 3: Summary Total (Without VAT)
    const totalWithoutVat = useMemo(() => {
        const sum = lineItemCalculations.reduce(
            (acc, curr) => acc + curr.lineTotalWithoutVat,
            0
        );
        return Math.round(sum * 100) / 100;
    }, [lineItemCalculations]);

    const totalMonthlyWithoutVat = useMemo(() => {
        const sum = lineItemCalculations.reduce(
            (acc, curr) => acc + curr.totalMonthlyWithoutVat,
            0
        );
        return Math.round(sum * 100) / 100;
    }, [lineItemCalculations]);

    // Section 4 Calculations
    const discountRate = Math.min(100, Math.max(0, Number(discountApplied) || 0));
    const discountAmount =
        Math.round(totalWithoutVat * (discountRate / 100) * 100) / 100;

    const netAfterDiscount =
        Math.round(Math.max(0, totalWithoutVat - discountAmount) * 100) / 100;

    const effectiveTaxRate = Math.min(
        100,
        Math.max(0, Number(taxAppliedRate) || 0)
    );
    const vatAmount =
        Math.round(netAfterDiscount * (effectiveTaxRate / 100) * 100) / 100;

    const totalAmountWithVat =
        Math.round((netAfterDiscount + vatAmount) * 100) / 100;

    // Handle Form Submit
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const errors: Record<string, string> = {};

        if (!selectedLeadId) {
            errors.leadId = t('crm.commercial.quotations.form.leadRequired');
        }
        if (!customerName.trim()) {
            errors.customerName = t(
                'crm.commercial.quotations.form.customerNameRequired'
            );
        }
        if (!customerEmail.trim()) {
            errors.customerEmail = t(
                'crm.commercial.quotations.form.customerEmailRequired'
            );
        }
        if (!customerPhone.trim()) {
            errors.customerPhone = t(
                'crm.commercial.quotations.form.customerPhoneRequired'
            );
        }

        if (subscriptionItems.length === 0) {
            errors.lineItems = t(
                'crm.commercial.quotations.form.atLeastOneItem'
            );
        }

        subscriptionItems.forEach((item, idx) => {
            if (!item.packageName.trim()) {
                errors[`item_${idx}`] = t(
                    'crm.commercial.quotations.form.packageRequired'
                );
            }
        });

        if (Number(contractDurationMonths) <= 0) {
            errors.contractDuration = t(
                'crm.commercial.quotations.form.positiveDurationRequired'
            );
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Convert subscription items into CRM line items
        const rawLineItems = subscriptionItems.map((item, idx) => {
            const periodMultiplier = PERIOD_MULTIPLIERS[item.period] || 1;
            return calculateCrmQuotationLineItem({
                id: item.id || `crm-qli-${idx + 1}`,
                itemType: 'package',
                packageId: item.packageId,
                descriptionEn: item.packageName,
                descriptionAr: item.packageNameAr || item.packageName,
                quantity: Math.max(1, Number(item.quantity) || 1),
                unitPrice: Math.max(0, Number(item.unitPrice) || 0),
                period: periodMultiplier,
                periodUnit: 'months',
                discountPercent: discountRate,
                taxRate: effectiveTaxRate,
            });
        });

        const totals = calculateCrmQuotationTotals(rawLineItems);
        const selectedLead = leads.find((l) => l.id === selectedLeadId);

        const proposalTitleEn =
            customerName.trim()
                ? `${customerName.trim()} — Subscription Quotation`
                : `${selectedLead?.title || 'Commercial'} — Subscription Quotation`;

        const proposalTitleAr = customerName.trim()
            ? `عرض سعر اشتراك — ${customerName.trim()}`
            : `عرض سعر اشتراك — ${selectedLead?.title || ''}`;

        const payload: CrmQuotationInput = {
            titleEn: proposalTitleEn,
            titleAr: proposalTitleAr,
            leadId: selectedLeadId,
            leadCode: selectedLead?.code,
            leadTitle: selectedLead?.title,
            dealId: dealId || undefined,
            companyId: companyId || defaultCompany?.id || 'crm-comp-1',
            companyNameEn: customerName,
            contactId: contactId || undefined,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim(),
            contractDurationMonths: Number(contractDurationMonths) || 12,
            contractDuration: Number(contractDurationMonths) || 12,
            discountPercent: discountRate,
            taxRate: effectiveTaxRate,
            assignedEmployeeId: defaultEmployeeId,
            quotationStatus: mode === 'edit' && initialData ? initialData.quotationStatus : 'draft',
            issueDate: quotationDate,
            validUntil: quotationExpiryDate,
            currency: 'SAR',
            lineItems: totals.lineItems,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            totalDiscount: totals.discountTotal,
            taxableAmount: totals.taxableAmount,
            taxAmount: totals.taxAmount,
            totalTax: totals.taxAmount,
            totalVat: totals.taxAmount,
            grandTotal: totals.grandTotal,
            status: 'active',
        };

        await onSubmit(payload);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quotation-form-drawer-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Drawer Container */}
            <div className="relative z-10 w-full max-w-3xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header: Title + Close (X) button */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <div>
                        <h2
                            id="quotation-form-drawer-title"
                            className="text-base font-bold text-[#0D0D0D] tracking-tight"
                        >
                            {mode === 'create'
                                ? t('crm.commercial.quotations.form.createTitle')
                                : `${t('crm.commercial.quotations.form.editTitle')}${initialData?.code ? `: ${initialData.code}` : ''}`}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {mode === 'create'
                                ? t('crm.commercial.quotations.form.createSubtitle')
                                : t('crm.commercial.quotations.form.editSubtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.quotations.form.cancel')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                    {serverError && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION 1: Quotation Details                                              */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]/60">
                            <Calendar size={15} className="text-[#037F8C]" />
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                {t(
                                    'crm.commercial.quotations.form.sectionQuotationDetails'
                                )}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 1. Select Lead * */}
                            <div className="md:col-span-3">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.selectLead'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <select
                                    value={selectedLeadId}
                                    onChange={(e) =>
                                        handleLeadChange(e.target.value)
                                    }
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                        fieldErrors.leadId
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.quotations.form.selectLeadPlaceholder'
                                        )}
                                    </option>
                                    {leads.map((lead) => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.code} —{' '}
                                            {isRtl
                                                ? lead.companyNameAr ||
                                                  lead.title
                                                : lead.title}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.leadId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.leadId}
                                    </p>
                                )}
                            </div>

                            {/* 2. Quotation Date */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.quotationDate'
                                    )}
                                </label>
                                <input
                                    type="date"
                                    value={quotationDate}
                                    onChange={(e) =>
                                        setQuotationDate(e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors"
                                />
                            </div>

                            {/* 3. Quotation Expiry Date */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.quotationExpiryDate'
                                    )}
                                </label>
                                <input
                                    type="date"
                                    value={quotationExpiryDate}
                                    onChange={(e) =>
                                        setQuotationExpiryDate(e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SECTION 2: Customer Details                                               */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]/60">
                            <User size={15} className="text-[#037F8C]" />
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                {t(
                                    'crm.commercial.quotations.form.sectionCustomerDetails'
                                )}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 1. Customer Name * */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.customerName'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        if (fieldErrors.customerName) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.customerName;
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder={t(
                                        'crm.commercial.quotations.form.customerNamePlaceholder'
                                    )}
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                        fieldErrors.customerName
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.customerName && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.customerName}
                                    </p>
                                )}
                            </div>

                            {/* 2. Customer Email * */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.customerEmail'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value);
                                        if (fieldErrors.customerEmail) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.customerEmail;
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder={t(
                                        'crm.commercial.quotations.form.customerEmailPlaceholder'
                                    )}
                                    dir="ltr"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                        fieldErrors.customerEmail
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.customerEmail && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.customerEmail}
                                    </p>
                                )}
                            </div>

                            {/* 3. Customer Phone * */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.customerPhone'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => {
                                        setCustomerPhone(e.target.value);
                                        if (fieldErrors.customerPhone) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.customerPhone;
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder={t(
                                        'crm.commercial.quotations.form.customerPhonePlaceholder'
                                    )}
                                    dir="ltr"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] transition-colors ${
                                        fieldErrors.customerPhone
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.customerPhone && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.customerPhone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SECTION 3: Subscription Details                                           */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E5E0D8]">
                            <div className="flex items-center gap-2">
                                <Layers size={15} className="text-[#037F8C]" />
                                <h3 className="text-xs font-bold text-[#0D0D0D]">
                                    {t(
                                        'crm.commercial.quotations.form.sectionSubscriptionDetails'
                                    )}
                                </h3>
                            </div>

                            {/* + New Item Action */}
                            <button
                                type="button"
                                onClick={handleAddNewItem}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>
                                    {t(
                                        'crm.commercial.quotations.form.newItem'
                                    )}
                                </span>
                            </button>
                        </div>

                        {fieldErrors.lineItems && (
                            <p className="text-xs text-[#A63A3A]">
                                {fieldErrors.lineItems}
                            </p>
                        )}

                        {/* List of subscription line items */}
                        <div className="space-y-4">
                            {subscriptionItems.map((item, idx) => {
                                const calc = lineItemCalculations[idx] || {
                                    totalMonthlyWithoutVat: 0,
                                    lineTotalWithoutVat: 0,
                                    periodMultiplier: 1,
                                };

                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-3 relative group"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-[#037F8C]">
                                                #{idx + 1}
                                            </span>
                                            {subscriptionItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveItem(idx)
                                                    }
                                                    aria-label="Remove Item"
                                                    className="w-7 h-7 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FCECE9] hover:border-[#A63A3A]/40 text-[#6E6862] hover:text-[#A63A3A] flex items-center justify-center transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
                                            {/* 1. Subscription Package Name * */}
                                            <div className="sm:col-span-2 lg:col-span-2">
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    {t(
                                                        'crm.commercial.quotations.form.subscriptionPackageName'
                                                    )}{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={item.packageId || ''}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            packageId:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                                >
                                                    <option value="">
                                                        {t(
                                                            'crm.commercial.quotations.form.selectPackageName'
                                                        )}
                                                    </option>
                                                    {availablePackages.map(
                                                        (pkg) => (
                                                            <option
                                                                key={pkg.id}
                                                                value={pkg.id}
                                                            >
                                                                {isRtl
                                                                    ? pkg.nameAr ||
                                                                      pkg.nameEn
                                                                    : pkg.nameEn}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {fieldErrors[`item_${idx}`] && (
                                                    <p className="text-[10px] text-[#A63A3A] mt-0.5">
                                                        {
                                                            fieldErrors[
                                                                `item_${idx}`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* 2. Price Per Unit Per Month * */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    {t(
                                                        'crm.commercial.quotations.form.pricePerUnitPerMonth'
                                                    )}{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            unitPrice: Math.max(
                                                                0,
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0
                                                            ),
                                                        })
                                                    }
                                                    placeholder={t(
                                                        'crm.commercial.quotations.form.priceEachUnitPlaceholder'
                                                    )}
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                                />
                                            </div>

                                            {/* 3. Quantity * */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    {t(
                                                        'crm.commercial.quotations.form.quantity'
                                                    )}{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            quantity: Math.max(
                                                                1,
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                    10
                                                                ) || 1
                                                            ),
                                                        })
                                                    }
                                                    placeholder={t(
                                                        'crm.commercial.quotations.form.enterQuantityPlaceholder'
                                                    )}
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                                />
                                            </div>

                                            {/* 6. Period * (Dropdown, default: Monthly) */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    {t(
                                                        'crm.commercial.quotations.form.period'
                                                    )}{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={item.period}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            period: e.target
                                                                .value as SubscriptionPeriod,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                                >
                                                    <option value="monthly">
                                                        {t(
                                                            'crm.commercial.quotations.form.periodMonthly'
                                                        )}
                                                    </option>
                                                    <option value="quarterly">
                                                        {t(
                                                            'crm.commercial.quotations.form.periodQuarterly'
                                                        )}
                                                    </option>
                                                    <option value="semi_annual">
                                                        {t(
                                                            'crm.commercial.quotations.form.periodSemiAnnual'
                                                        )}
                                                    </option>
                                                    <option value="annual">
                                                        {t(
                                                            'crm.commercial.quotations.form.periodAnnual'
                                                        )}
                                                    </option>
                                                </select>
                                            </div>

                                            {/* 4. Total * (Auto-calculated, SAR) */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    {t(
                                                        'crm.commercial.quotations.form.lineTotal'
                                                    )}{' '}
                                                    *
                                                </label>
                                                <div
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#F4EFEA] text-xs font-mono tabular-nums font-bold text-[#037F8C] flex items-center justify-between"
                                                    dir="ltr"
                                                >
                                                    <span>
                                                        {calc.lineTotalWithoutVat.toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] font-sans font-medium text-[#6E6862]">
                                                        {t(
                                                            'crm.commercial.quotations.form.currencySar'
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. Total Monthly (Without VAT) * */}
                                        <div className="pt-2 border-t border-[#E5E0D8]/60 flex items-center justify-between text-xs">
                                            <span className="text-[11px] font-medium text-[#6E6862]">
                                                {t(
                                                    'crm.commercial.quotations.form.totalMonthlyWithoutVat'
                                                )}
                                                :
                                            </span>
                                            <span
                                                className="font-mono tabular-nums font-semibold text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {calc.totalMonthlyWithoutVat.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}{' '}
                                                {t(
                                                    'crm.commercial.quotations.form.sarPerMonth'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Separate Total (Without VAT) summary in SAR */}
                        <div className="rounded-xl border border-[#037F8C]/20 bg-[#037F8C]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-[#037F8C] block">
                                    {t(
                                        'crm.commercial.quotations.form.totalWithoutVatSummary'
                                    )}
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t(
                                        'crm.commercial.quotations.form.totalMonthlyWithoutVat'
                                    )}
                                    :{' '}
                                    <strong
                                        className="font-mono tabular-nums text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {totalMonthlyWithoutVat.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}{' '}
                                        {t(
                                            'crm.commercial.quotations.form.sarPerMonth'
                                        )}
                                    </strong>
                                </span>
                            </div>

                            <div
                                className="text-end font-mono tabular-nums font-bold text-lg text-[#037F8C]"
                                dir="ltr"
                            >
                                {totalWithoutVat.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-xs font-sans font-medium text-[#6E6862]">
                                    {t(
                                        'crm.commercial.quotations.form.currencySar'
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SECTION 4: Additional Details                                             */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]/60">
                            <Calculator size={15} className="text-[#037F8C]" />
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                {t(
                                    'crm.commercial.quotations.form.sectionAdditionalDetails'
                                )}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            {/* 1. Discount Applied * */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.discountApplied'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={discountApplied}
                                        onChange={(e) =>
                                            setDiscountApplied(
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                )
                                            )
                                        }
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 pe-8 rounded-xl border border-[#E5E0D8] bg-white font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                    />
                                    <span
                                        className="absolute inset-y-0 end-3 flex items-center text-[#6E6862] font-semibold text-xs pointer-events-none"
                                        dir="ltr"
                                    >
                                        %
                                    </span>
                                </div>
                            </div>

                            {/* 2. Discount Amount * (Calculated in SAR) */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.discountAmount'
                                    )}{' '}
                                    *
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#B45309] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>
                                        {discountAmount.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        {t(
                                            'crm.commercial.quotations.form.currencySar'
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Net After Discount * (Calculated in SAR) */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.netAfterDiscount'
                                    )}{' '}
                                    *
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>
                                        {netAfterDiscount.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        {t(
                                            'crm.commercial.quotations.form.currencySar'
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 4. Tax Applied * (Dropdown, default VAT 15%) */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.taxApplied'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <select
                                    value={taxAppliedRate}
                                    onChange={(e) =>
                                        setTaxAppliedRate(
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                >
                                    <option value="15">
                                        {t(
                                            'crm.commercial.quotations.form.taxVat15'
                                        )}
                                    </option>
                                    <option value="0">
                                        {t(
                                            'crm.commercial.quotations.form.taxVat0'
                                        )}
                                    </option>
                                </select>
                            </div>

                            {/* 5. VAT Amount * (Calculated in SAR) */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.vatAmount'
                                    )}{' '}
                                    *
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>
                                        {vatAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        {t(
                                            'crm.commercial.quotations.form.currencySar'
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* 7. Contract Duration (In Months) * */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.commercial.quotations.form.contractDurationMonths'
                                    )}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    step="1"
                                    value={contractDurationMonths}
                                    onChange={(e) => {
                                        setContractDurationMonths(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value, 10) || 1
                                            )
                                        );
                                        if (fieldErrors.contractDuration) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.contractDuration;
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder={t(
                                        'crm.commercial.quotations.form.contractDurationPlaceholder'
                                    )}
                                    dir="ltr"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                        fieldErrors.contractDuration
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.contractDuration && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.contractDuration}
                                    </p>
                                )}
                            </div>

                            {/* 6. Total Amount (Including VAT) (Full-width prominent banner) */}
                            <div className="sm:col-span-2 lg:col-span-3 pt-2">
                                <div className="rounded-xl border-2 border-[#037F8C] bg-[#037F8C]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs font-bold text-[#0D0D0D] block">
                                            {t(
                                                'crm.commercial.quotations.form.totalAmountWithVat'
                                            )}
                                        </span>
                                        <span className="text-[11px] text-[#6E6862]">
                                            {t(
                                                'crm.commercial.quotations.form.netAfterDiscount'
                                            )}
                                            :{' '}
                                            <span
                                                className="font-mono tabular-nums text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {netAfterDiscount.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}{' '}
                                                SAR
                                            </span>{' '}
                                            •{' '}
                                            {t(
                                                'crm.commercial.quotations.form.vatAmount'
                                            )}
                                            :{' '}
                                            <span
                                                className="font-mono tabular-nums text-[#0D0D0D]"
                                                dir="ltr"
                                            >
                                                {vatAmount.toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}{' '}
                                                SAR
                                            </span>
                                        </span>
                                    </div>

                                    <div
                                        className="font-mono tabular-nums font-bold text-xl text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        {totalAmountWithVat.toLocaleString(
                                            undefined,
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}{' '}
                                        <span className="text-xs font-sans font-semibold text-[#037F8C]">
                                            {t(
                                                'crm.commercial.quotations.form.currencySar'
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions: Cancel and Submit */}
                    <div className="pt-2 pb-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.commercial.quotations.form.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                            {isSubmitting
                                ? t('crm.commercial.common.saving')
                                : t('crm.commercial.quotations.form.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
