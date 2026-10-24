import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Plus,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import {
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    roundCrmCurrency,
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
    unitPriceInput: string;
    quantityInput: string;
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
    taxes: externalTaxes,
    catalogItems: externalCatalogItems,
    employees,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    void _deals;

    const defaultCompany =
        companies.find((c) => c.status === 'active') || companies[0];
    const defaultEmployeeId = employees[0]?.id || 'emp-1';

    const [internalLeads, setInternalLeads] = useState<CrmLeadRecord[]>([]);
    const [internalCatalogItems, setInternalCatalogItems] = useState<
        CrmServiceCatalogItem[]
    >([]);
    const [internalTaxes, setInternalTaxes] = useState<CrmTaxRecord[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        if (!externalLeads || externalLeads.length === 0) {
            crmApi.leads
                .getAll({ limit: 200 })
                .then((res) => {
                    if (isMounted && res?.data) {
                        setInternalLeads(res.data);
                    }
                })
                .catch(() => {});
        }

        if (!externalCatalogItems || externalCatalogItems.length === 0) {
            crmApi.quotations
                .getServiceCatalog()
                .then((res) => {
                    if (isMounted && Array.isArray(res)) {
                        setInternalCatalogItems(res);
                    }
                })
                .catch(() => {});
        }

        if (!externalTaxes || externalTaxes.length === 0) {
            crmApi
                .getTaxes({ limit: 100 })
                .then((res) => {
                    if (isMounted && res?.data) {
                        setInternalTaxes(res.data);
                    }
                })
                .catch(() => {});
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, externalLeads, externalCatalogItems, externalTaxes]);

    const leads = useMemo(() => {
        if (externalLeads && externalLeads.length > 0) return externalLeads;
        return internalLeads;
    }, [externalLeads, internalLeads]);

    const availablePackages = useMemo(() => {
        const source =
            externalCatalogItems && externalCatalogItems.length > 0
                ? externalCatalogItems
                : internalCatalogItems;
        return source.map((item) => ({
            id: item.id,
            nameEn: item.nameEn,
            nameAr: item.nameAr || item.nameEn,
            unitPrice: Number(item.unitPrice ?? item.defaultPrice ?? 0),
        }));
    }, [externalCatalogItems, internalCatalogItems]);

    const taxOptions = useMemo(() => {
        const source =
            externalTaxes && externalTaxes.length > 0
                ? externalTaxes
                : internalTaxes;
        const activeTaxes = source.filter((t) => t.status === 'active');
        const list: Array<{ id?: string; label: string; rate: number }> = [
            {
                id: activeTaxes.find((t) => t.rate === 15)?.id,
                label: 'VAT 15%',
                rate: 15,
            },
        ];
        for (const tax of activeTaxes) {
            if (!list.some((existing) => existing.rate === tax.rate)) {
                list.push({
                    id: tax.id,
                    label: `${tax.nameEn} (${tax.rate}%)`,
                    rate: tax.rate,
                });
            }
        }
        if (!list.some((existing) => existing.rate === 0)) {
            list.push({
                id: activeTaxes.find((t) => t.rate === 0)?.id,
                label: 'VAT 0%',
                rate: 0,
            });
        }
        return list;
    }, [externalTaxes, internalTaxes]);

    const todayIso = new Date().toISOString().split('T')[0];
    const validUntilObj = new Date();
    validUntilObj.setDate(validUntilObj.getDate() + 30);
    const validUntilIso = validUntilObj.toISOString().split('T')[0];

    // 1. Quotation Details
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [quotationDate, setQuotationDate] = useState(todayIso);
    const [quotationExpiryDate, setQuotationExpiryDate] =
        useState(validUntilIso);

    // 2. Customer Details
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Linkages for existing API contract
    const [companyId, setCompanyId] = useState(defaultCompany?.id || '');
    const [contactId, setContactId] = useState('');
    const [dealId, setDealId] = useState('');

    // 3. Subscription Details
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [selectedPackageName, setSelectedPackageName] = useState('');
    const [selectedPackageNameAr, setSelectedPackageNameAr] = useState('');
    const [period, setPeriod] = useState<SubscriptionPeriod>('monthly');
    const [subscriptionItems, setSubscriptionItems] = useState<
        SubscriptionFormItem[]
    >([
        {
            id: 'sub-item-1',
            unitPriceInput: '',
            quantityInput: '',
        },
    ]);

    // 4. Additional Details
    const [discountAppliedInput, setDiscountAppliedInput] =
        useState<string>('0');
    const [taxAppliedRate, setTaxAppliedRate] = useState<number>(15);
    const [contractDurationInput, setContractDurationInput] =
        useState<string>('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const syncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${preselectedDeal?.id ?? 'none'}-${leads.length}`;

    if (syncKey !== prevSyncKey) {
        setPrevSyncKey(syncKey);
        if (isOpen) {
            setFieldErrors({});

            if (mode === 'edit' && initialData) {
                setSelectedLeadId(initialData.leadId || '');
                setQuotationDate(initialData.issueDate || todayIso);
                setQuotationExpiryDate(initialData.validUntil || validUntilIso);
                setCustomerName(
                    initialData.customerName ||
                        initialData.companyNameEn ||
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

                if (
                    Array.isArray(initialData.lineItems) &&
                    initialData.lineItems.length > 0
                ) {
                    const firstLi = initialData.lineItems[0];
                    setSelectedPackageId(
                        firstLi.packageId || firstLi.serviceId || ''
                    );
                    setSelectedPackageName(firstLi.descriptionEn || '');
                    setSelectedPackageNameAr(
                        firstLi.descriptionAr || firstLi.descriptionEn || ''
                    );

                    let itemPeriod: SubscriptionPeriod = 'monthly';
                    if (firstLi.period === 3) itemPeriod = 'quarterly';
                    else if (firstLi.period === 6) itemPeriod = 'semi_annual';
                    else if (
                        firstLi.period === 12 ||
                        firstLi.periodUnit === 'years'
                    )
                        itemPeriod = 'annual';
                    setPeriod(itemPeriod);

                    setSubscriptionItems(
                        initialData.lineItems.map((li, idx) => ({
                            id: li.id || `sub-item-${idx + 1}`,
                            unitPriceInput: String(li.unitPrice ?? 0),
                            quantityInput: String(li.quantity ?? 1),
                        }))
                    );
                }

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
                setDiscountAppliedInput(String(derivedDiscount));

                const firstItemTaxRate = initialData.lineItems?.[0]?.taxRate;
                setTaxAppliedRate(
                    initialData.taxRate !== undefined
                        ? initialData.taxRate
                        : firstItemTaxRate !== undefined
                          ? firstItemTaxRate
                          : 15
                );

                setContractDurationInput(
                    initialData.contractDurationMonths
                        ? String(initialData.contractDurationMonths)
                        : '12'
                );
            } else if (preselectedDeal) {
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
                setSelectedPackageId('');
                setSelectedPackageName(preselectedDeal.titleEn || '');
                setSelectedPackageNameAr(
                    preselectedDeal.titleAr || preselectedDeal.titleEn || ''
                );
                setPeriod('monthly');
                setSubscriptionItems([
                    {
                        id: 'sub-item-1',
                        unitPriceInput: preselectedDeal.expectedValue
                            ? String(preselectedDeal.expectedValue)
                            : '',
                        quantityInput: '1',
                    },
                ]);
                setDiscountAppliedInput('0');
                setTaxAppliedRate(15);
                setContractDurationInput('');
            } else {
                setSelectedLeadId('');
                setQuotationDate(todayIso);
                setQuotationExpiryDate(validUntilIso);
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
                setCompanyId(defaultCompany?.id || '');
                setContactId('');
                setDealId('');
                setSelectedPackageId('');
                setSelectedPackageName('');
                setSelectedPackageNameAr('');
                setPeriod('monthly');
                setSubscriptionItems([
                    {
                        id: 'sub-item-1',
                        unitPriceInput: '',
                        quantityInput: '',
                    },
                ]);
                setDiscountAppliedInput('0');
                setTaxAppliedRate(15);
                setContractDurationInput('');
            }
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleLeadChange = (leadId: string) => {
        setSelectedLeadId(leadId);
        if (fieldErrors.leadId) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.leadId;
                return next;
            });
        }

        if (!leadId) return;

        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return;

        const resolvedName =
            lead.companyNameEn ||
            lead.temporaryCompanyName ||
            lead.contactName ||
            lead.title ||
            '';

        setCustomerName(resolvedName);
        setCustomerEmail(lead.contactEmail || '');
        setCustomerPhone(lead.contactPhone || '');

        if (lead.companyId) {
            setCompanyId(lead.companyId);
        } else if (!companyId) {
            setCompanyId(defaultCompany?.id || 'crm-comp-1');
        }

        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.customerName;
            delete next.customerEmail;
            delete next.customerPhone;
            return next;
        });
    };

    const handlePackageSelect = (pkgId: string) => {
        setSelectedPackageId(pkgId);
        if (fieldErrors.packageName) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.packageName;
                return next;
            });
        }

        const foundPkg = availablePackages.find((p) => p.id === pkgId);
        if (foundPkg) {
            setSelectedPackageName(foundPkg.nameEn);
            setSelectedPackageNameAr(foundPkg.nameAr);
            setSubscriptionItems((prev) => {
                if (prev.length === 0) return prev;
                const first = prev[0];
                if (!first.unitPriceInput && foundPkg.unitPrice > 0) {
                    const next = [...prev];
                    next[0] = {
                        ...first,
                        unitPriceInput: String(foundPkg.unitPrice),
                        quantityInput: first.quantityInput || '1',
                    };
                    return next;
                }
                return prev;
            });
        } else {
            setSelectedPackageName('');
            setSelectedPackageNameAr('');
        }
    };

    const handleAddNewItem = () => {
        const nextId = `sub-item-${Date.now()}-${subscriptionItems.length + 1}`;
        setSubscriptionItems((prev) => [
            ...prev,
            {
                id: nextId,
                unitPriceInput: '',
                quantityInput: '',
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
            next[index] = { ...current, ...patch };
            return next;
        });

        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[`item_price_${index}`];
            delete next[`item_qty_${index}`];
            return next;
        });
    };

    // Calculations
    const itemTotals = useMemo(() => {
        return subscriptionItems.map((item) => {
            const price = Math.max(0, Number(item.unitPriceInput) || 0);
            const qty = Math.max(0, Number(item.quantityInput) || 0);
            return roundCrmCurrency(price * qty);
        });
    }, [subscriptionItems]);

    const totalMonthlyWithoutVat = useMemo(() => {
        return roundCrmCurrency(
            itemTotals.reduce((acc, itemTotal) => acc + itemTotal, 0)
        );
    }, [itemTotals]);

    const periodMultiplier = PERIOD_MULTIPLIERS[period] || 1;

    const totalWithoutVat = useMemo(() => {
        return roundCrmCurrency(totalMonthlyWithoutVat * periodMultiplier);
    }, [totalMonthlyWithoutVat, periodMultiplier]);

    const discountRate = Math.min(
        100,
        Math.max(0, Number(discountAppliedInput) || 0)
    );
    const discountAmount = roundCrmCurrency(
        totalWithoutVat * (discountRate / 100)
    );
    const netAfterDiscount = roundCrmCurrency(
        Math.max(0, totalWithoutVat - discountAmount)
    );
    const effectiveTaxRate = Math.min(
        100,
        Math.max(0, Number(taxAppliedRate) || 0)
    );
    const vatAmount = roundCrmCurrency(
        netAfterDiscount * (effectiveTaxRate / 100)
    );
    const totalAmountWithVat = roundCrmCurrency(netAfterDiscount + vatAmount);

    const formatAmount = (value: number): string =>
        value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const errors: Record<string, string> = {};

        if (!selectedLeadId) {
            errors.leadId = 'Lead selection is required';
        }
        if (!customerName.trim()) {
            errors.customerName = 'Customer name is required';
        }
        if (!customerEmail.trim()) {
            errors.customerEmail = 'Customer email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
            errors.customerEmail = 'Valid customer email is required';
        }
        if (!customerPhone.trim()) {
            errors.customerPhone = 'Customer phone is required';
        }
        if (!selectedPackageId && !selectedPackageName.trim()) {
            errors.packageName = 'Subscription package name is required';
        }

        subscriptionItems.forEach((item, idx) => {
            if (
                item.unitPriceInput.trim() === '' ||
                Number(item.unitPriceInput) < 0
            ) {
                errors[`item_price_${idx}`] =
                    'Price per unit per month is required';
            }
            if (
                item.quantityInput.trim() === '' ||
                Number(item.quantityInput) <= 0
            ) {
                errors[`item_qty_${idx}`] = 'Quantity is required';
            }
        });

        if (discountAppliedInput.trim() === '') {
            errors.discountApplied = 'Discount applied is required';
        }

        const parsedDuration = Number(contractDurationInput);
        if (
            contractDurationInput.trim() === '' ||
            !Number.isFinite(parsedDuration) ||
            parsedDuration <= 0
        ) {
            errors.contractDuration =
                'Contract duration (in months) is required';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const matchedTaxOption = taxOptions.find(
            (t) => t.rate === effectiveTaxRate
        );

        const rawLineItems = subscriptionItems.map((item, idx) => {
            return calculateCrmQuotationLineItem({
                id: item.id || `crm-qli-${idx + 1}`,
                itemType: 'package',
                packageId: selectedPackageId || undefined,
                descriptionEn:
                    selectedPackageName || `Subscription Item ${idx + 1}`,
                descriptionAr:
                    selectedPackageNameAr ||
                    selectedPackageName ||
                    `Subscription Item ${idx + 1}`,
                quantity: Math.max(1, Number(item.quantityInput) || 1),
                unitPrice: Math.max(0, Number(item.unitPriceInput) || 0),
                period: periodMultiplier,
                periodUnit: 'months',
                discountPercent: discountRate,
                taxId: matchedTaxOption?.id,
                taxRate: effectiveTaxRate,
            });
        });

        const totals = calculateCrmQuotationTotals(rawLineItems);
        const selectedLead = leads.find((l) => l.id === selectedLeadId);

        const proposalTitleEn = customerName.trim()
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
            companyNameEn: customerName.trim(),
            contactId: contactId || undefined,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim(),
            contractDurationMonths: Math.max(1, Math.round(parsedDuration)),
            contractDuration: Math.max(1, Math.round(parsedDuration)),
            discountPercent: discountRate,
            taxRate: effectiveTaxRate,
            assignedEmployeeId: defaultEmployeeId,
            quotationStatus:
                mode === 'edit' && initialData
                    ? initialData.quotationStatus
                    : 'draft',
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

    const hasCustomPackage =
        Boolean(selectedPackageId) &&
        !availablePackages.some((pkg) => pkg.id === selectedPackageId);

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quotation-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-3xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <h2
                        id="quotation-form-drawer-title"
                        className="text-base font-bold text-[#0D0D0D] tracking-tight"
                    >
                        Create Quotation
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                    noValidate
                >
                    {serverError && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle
                                size={16}
                                className="shrink-0 mt-0.5"
                            />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 1. Quotation Details                                                      */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="pb-2 border-b border-[#E5E0D8]/60">
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                Quotation Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Select Lead* */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Select Lead{' '}
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
                                    <option value="">Select Lead</option>
                                    {leads.map((lead) => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.code} —{' '}
                                            {lead.title || lead.contactName}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.leadId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.leadId}
                                    </p>
                                )}
                            </div>

                            {/* Quotation Date */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Quotation Date
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

                            {/* Quotation Expiry Date */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Quotation Expiry Date
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
                    {/* 2. Customer Details                                                       */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="pb-2 border-b border-[#E5E0D8]/60">
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                Customer Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Customer Name* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Customer Name{' '}
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
                                    placeholder="Enter Customer Name"
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

                            {/* Customer Email* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Customer Email{' '}
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
                                    placeholder="Enter Customer Email"
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

                            {/* Customer Phone* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Customer Phone{' '}
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
                                    placeholder="Enter Customer Phone Number"
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
                    {/* 3. Subscription Details                                                   */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E5E0D8]">
                            <h3 className="text-xs font-bold text-[#0D0D0D]">
                                Subscription Details
                            </h3>

                            <button
                                type="button"
                                onClick={handleAddNewItem}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Plus size={13} />
                                <span>New Item</span>
                            </button>
                        </div>

                        {/* Subscription Package Name* */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                Subscription Package Name{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <select
                                value={selectedPackageId}
                                onChange={(e) =>
                                    handlePackageSelect(e.target.value)
                                }
                                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                    fieldErrors.packageName
                                        ? 'border-[#A63A3A]'
                                        : 'border-[#E5E0D8]'
                                }`}
                            >
                                <option value="">Select Package Name</option>
                                {hasCustomPackage && (
                                    <option value={selectedPackageId}>
                                        {selectedPackageName ||
                                            selectedPackageId}
                                    </option>
                                )}
                                {availablePackages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.nameEn}
                                    </option>
                                ))}
                            </select>
                            {fieldErrors.packageName && (
                                <p className="text-[11px] text-[#A63A3A] mt-1">
                                    {fieldErrors.packageName}
                                </p>
                            )}
                        </div>

                        {/* Item entries: 1- New Item */}
                        <div className="space-y-4">
                            {subscriptionItems.map((item, idx) => {
                                const itemTotal = itemTotals[idx] ?? 0;

                                return (
                                    <div
                                        key={item.id}
                                        className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-[#037F8C]">
                                                {idx + 1}- New Item
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

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                            {/* Price Per Unit Per Month* */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    Price Per Unit Per Month{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPriceInput}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            unitPriceInput:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Price each unit"
                                                    dir="ltr"
                                                    className={`w-full px-3 py-2 rounded-lg border bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                                        fieldErrors[
                                                            `item_price_${idx}`
                                                        ]
                                                            ? 'border-[#A63A3A]'
                                                            : 'border-[#E5E0D8]'
                                                    }`}
                                                />
                                                {fieldErrors[
                                                    `item_price_${idx}`
                                                ] && (
                                                    <p className="text-[10px] text-[#A63A3A] mt-0.5">
                                                        {
                                                            fieldErrors[
                                                                `item_price_${idx}`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Quantity* */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    Quantity{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.quantityInput}
                                                    onChange={(e) =>
                                                        handleUpdateItem(idx, {
                                                            quantityInput:
                                                                e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter Quantity"
                                                    dir="ltr"
                                                    className={`w-full px-3 py-2 rounded-lg border bg-white text-xs font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                                        fieldErrors[
                                                            `item_qty_${idx}`
                                                        ]
                                                            ? 'border-[#A63A3A]'
                                                            : 'border-[#E5E0D8]'
                                                    }`}
                                                />
                                                {fieldErrors[
                                                    `item_qty_${idx}`
                                                ] && (
                                                    <p className="text-[10px] text-[#A63A3A] mt-0.5">
                                                        {
                                                            fieldErrors[
                                                                `item_qty_${idx}`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Total* */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#0D0D0D] mb-1">
                                                    Total{' '}
                                                    <span className="text-[#A63A3A]">
                                                        *
                                                    </span>
                                                </label>
                                                <div
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#F4EFEA] text-xs font-mono tabular-nums font-bold text-[#037F8C] flex items-center justify-between"
                                                    dir="ltr"
                                                >
                                                    <span>
                                                        {formatAmount(
                                                            itemTotal
                                                        )}
                                                    </span>
                                                    <span className="text-[10px] font-sans font-medium text-[#6E6862]">
                                                        SAR
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary fields in Subscription Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E5E0D8]">
                            {/* Total Monthly (Without VAT)* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Total Monthly (Without VAT){' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] text-xs font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>
                                        {formatAmount(totalMonthlyWithoutVat)}
                                    </span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* Period* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Period{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={period}
                                        onChange={(e) =>
                                            setPeriod(
                                                e.target
                                                    .value as SubscriptionPeriod
                                            )
                                        }
                                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">
                                            Quarterly
                                        </option>
                                        <option value="semi_annual">
                                            Semi-Annual
                                        </option>
                                        <option value="annual">Annual</option>
                                    </select>
                                    <span className="px-2.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] text-[11px] font-semibold text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* Total (Without VAT)* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Total (Without VAT){' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] text-xs font-mono tabular-nums font-bold text-[#037F8C] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>{formatAmount(totalWithoutVat)}</span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* 4. Additional Details                                                     */}
                    {/* ========================================================================= */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-5 space-y-4">
                        <div className="pb-2 border-b border-[#E5E0D8]/60">
                            <h3 className="text-xs font-bold text-[#037F8C] tracking-wide">
                                Additional Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            {/* 1. Discount Applied* */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Discount Applied{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={discountAppliedInput}
                                        onChange={(e) => {
                                            setDiscountAppliedInput(
                                                e.target.value
                                            );
                                            if (fieldErrors.discountApplied) {
                                                setFieldErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next.discountApplied;
                                                    return next;
                                                });
                                            }
                                        }}
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 pe-8 rounded-xl border bg-white font-mono tabular-nums text-[#0D0D0D] focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C] ${
                                            fieldErrors.discountApplied
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    <span
                                        className="absolute inset-y-0 end-3 flex items-center text-[#6E6862] font-semibold text-xs pointer-events-none"
                                        dir="ltr"
                                    >
                                        %
                                    </span>
                                </div>
                                {fieldErrors.discountApplied && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.discountApplied}
                                    </p>
                                )}
                            </div>

                            {/* 2. Discount Amount* */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Discount Amount{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#B45309] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>{formatAmount(discountAmount)}</span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* 3. Net After Discount* */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Net After Discount{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>{formatAmount(netAfterDiscount)}</span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* 4. Tax Applied* */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Tax Applied{' '}
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
                                    {taxOptions.map((taxOpt) => (
                                        <option
                                            key={`${taxOpt.label}-${taxOpt.rate}`}
                                            value={taxOpt.rate}
                                        >
                                            {taxOpt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 5. VAT Amount* */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    VAT Amount{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#F4EFEA] font-mono tabular-nums font-semibold text-[#0D0D0D] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>{formatAmount(vatAmount)}</span>
                                    <span className="text-[11px] font-sans font-normal text-[#6E6862]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* 6. Total Amount (Including VAT) */}
                            <div>
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Total Amount (Including VAT)
                                </label>
                                <div
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#037F8C] bg-[#037F8C]/10 font-mono tabular-nums font-bold text-[#037F8C] flex items-center justify-between"
                                    dir="ltr"
                                >
                                    <span>
                                        {formatAmount(totalAmountWithVat)}
                                    </span>
                                    <span className="text-[11px] font-sans font-semibold text-[#037F8C]">
                                        SAR
                                    </span>
                                </div>
                            </div>

                            {/* 7. Contract Duration (In Months)* */}
                            <div className="sm:col-span-2 lg:col-span-3">
                                <label className="block font-semibold text-[#0D0D0D] mb-1.5">
                                    Contract Duration (In Months){' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    step="1"
                                    value={contractDurationInput}
                                    onChange={(e) => {
                                        setContractDurationInput(
                                            e.target.value
                                        );
                                        if (fieldErrors.contractDuration) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.contractDuration;
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder="Enter Contract Duration In Months"
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
                        </div>
                    </div>

                    {/* Footer buttons: Cancel and Submit only */}
                    <div className="pt-2 pb-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default QuotationFormDrawer;
