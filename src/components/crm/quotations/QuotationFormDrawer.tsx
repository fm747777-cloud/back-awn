import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    FileText,
    Edit3,
    AlertCircle,
    Building2,
} from 'lucide-react';
import {
    CRM_QUOTATION_STATUS_VALUES,
    crmQuotationInputSchema,
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    type CrmQuotationInput,
    type CrmQuotationRecord,
    type CrmQuotationStatus,
    type CrmQuotationLineItem,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmContactRecord,
    type CrmTaxRecord,
} from '../../../schemas/crmSchema';
import type {
    CrmSalesEmployee,
    CrmServiceCatalogItem,
} from '../../../api/api';
import { CrmLineItemsEditor } from '../shared/CrmLineItemsEditor';

export interface QuotationFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmQuotationRecord | null;
    preselectedDeal?: CrmDealRecord | null;
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

export const QuotationFormDrawer: React.FC<QuotationFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    preselectedDeal,
    companies,
    deals,
    contacts,
    taxes,
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
    const defaultEmployeeId = employees[0]?.id || '';
    const todayDate = new Date();
    const todayIso = todayDate.toISOString().split('T')[0];
    const validUntilObj = new Date(todayDate);
    validUntilObj.setDate(validUntilObj.getDate() + 30);
    const validUntilIso = validUntilObj.toISOString().split('T')[0];

    const defaultCatalog = catalogItems[0];
    const defaultLineItem: CrmQuotationLineItem = calculateCrmQuotationLineItem({
        id: 'crm-qli-init-1',
        itemType: defaultCatalog?.itemType || 'service',
        serviceId:
            defaultCatalog?.itemType === 'service'
                ? defaultCatalog.id
                : undefined,
        packageId:
            defaultCatalog?.itemType === 'package'
                ? defaultCatalog.id
                : undefined,
        descriptionEn:
            defaultCatalog?.nameEn || 'Annual Statutory Financial Audit',
        descriptionAr:
            defaultCatalog?.nameAr || 'المراجعة القانونية السنوية للقوائم المالية',
        quantity: 1,
        unitPrice: defaultCatalog?.unitPrice ?? 25000,
        discountPercent: 0,
        taxRate: 15,
    });

    const [formState, setFormState] = useState<CrmQuotationInput>({
        titleEn: '',
        titleAr: '',
        dealId: '',
        companyId: defaultCompany?.id || '',
        contactId: '',
        assignedEmployeeId: defaultEmployeeId,
        quotationStatus: 'draft',
        issueDate: todayIso,
        validUntil: validUntilIso,
        currency: 'SAR',
        lineItems: [defaultLineItem],
        subtotal: defaultLineItem.quantity * defaultLineItem.unitPrice,
        discountTotal: defaultLineItem.discountAmount,
        taxableAmount:
            defaultLineItem.quantity * defaultLineItem.unitPrice -
            defaultLineItem.discountAmount,
        taxAmount: defaultLineItem.taxAmount,
        grandTotal: defaultLineItem.lineTotal,
        termsAndConditions:
            '50% advance upon agreement signature, 50% upon final deliverable submission. Subject to 15% ZATCA VAT.',
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${preselectedDeal?.id ?? 'none'}-${defaultCompany?.id ?? ''}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                setFormState({
                    titleEn: initialData.titleEn,
                    titleAr: initialData.titleAr || '',
                    dealId: initialData.dealId || '',
                    companyId: initialData.companyId,
                    contactId: initialData.contactId || '',
                    assignedEmployeeId: initialData.assignedEmployeeId,
                    quotationStatus: initialData.quotationStatus,
                    issueDate: initialData.issueDate,
                    validUntil: initialData.validUntil,
                    currency: initialData.currency || 'SAR',
                    lineItems: initialData.lineItems,
                    subtotal: initialData.subtotal,
                    discountTotal: initialData.discountTotal,
                    taxableAmount: initialData.taxableAmount,
                    taxAmount: initialData.taxAmount,
                    grandTotal: initialData.grandTotal,
                    termsAndConditions: initialData.termsAndConditions || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'active',
                });
            } else if (preselectedDeal) {
                const dealItem = calculateCrmQuotationLineItem({
                    id: 'crm-qli-deal-1',
                    itemType: defaultCatalog?.itemType || 'service',
                    serviceId:
                        defaultCatalog?.itemType === 'service'
                            ? defaultCatalog.id
                            : undefined,
                    packageId:
                        defaultCatalog?.itemType === 'package'
                            ? defaultCatalog.id
                            : undefined,
                    descriptionEn: preselectedDeal.titleEn,
                    descriptionAr:
                        preselectedDeal.titleAr || preselectedDeal.titleEn,
                    quantity: 1,
                    unitPrice: preselectedDeal.expectedValue || 50000,
                    discountPercent: 0,
                    taxRate: 15,
                });
                const totals = calculateCrmQuotationTotals([dealItem]);
                setFormState({
                    titleEn: `${preselectedDeal.titleEn} — Commercial Proposal`,
                    titleAr: preselectedDeal.titleAr
                        ? `عرض فني ومالي — ${preselectedDeal.titleAr}`
                        : '',
                    dealId: preselectedDeal.id,
                    companyId: preselectedDeal.companyId,
                    contactId: preselectedDeal.contactId || '',
                    assignedEmployeeId:
                        preselectedDeal.assignedEmployeeId || defaultEmployeeId,
                    quotationStatus: 'draft',
                    issueDate: todayIso,
                    validUntil: validUntilIso,
                    currency: 'SAR',
                    lineItems: totals.lineItems,
                    subtotal: totals.subtotal,
                    discountTotal: totals.discountTotal,
                    taxableAmount: totals.taxableAmount,
                    taxAmount: totals.taxAmount,
                    grandTotal: totals.grandTotal,
                    termsAndConditions:
                        '50% advance upon agreement signature, 50% upon final deliverable submission. Subject to 15% ZATCA VAT.',
                    notes: '',
                    status: 'active',
                });
            } else {
                const totals = calculateCrmQuotationTotals([defaultLineItem]);
                setFormState({
                    titleEn: '',
                    titleAr: '',
                    dealId: '',
                    companyId: defaultCompany?.id || '',
                    contactId: '',
                    assignedEmployeeId: defaultEmployeeId,
                    quotationStatus: 'draft',
                    issueDate: todayIso,
                    validUntil: validUntilIso,
                    currency: 'SAR',
                    lineItems: totals.lineItems,
                    subtotal: totals.subtotal,
                    discountTotal: totals.discountTotal,
                    taxableAmount: totals.taxableAmount,
                    taxAmount: totals.taxAmount,
                    grandTotal: totals.grandTotal,
                    termsAndConditions:
                        '50% advance upon agreement signature, 50% upon final deliverable submission. Subject to 15% ZATCA VAT.',
                    notes: '',
                    status: 'active',
                });
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

    if (!isOpen) return null;

    const handleChange = <K extends keyof CrmQuotationInput>(
        field: K,
        value: CrmQuotationInput[K]
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field as string]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field as string];
                return next;
            });
        }
    };

    const handleDealSelect = (dealId: string) => {
        const selectedDeal = deals.find((d) => d.id === dealId);
        if (!selectedDeal) {
            handleChange('dealId', '');
            return;
        }
        setFormState((prev) => ({
            ...prev,
            dealId: selectedDeal.id,
            companyId: selectedDeal.companyId,
            contactId: selectedDeal.contactId || prev.contactId,
            assignedEmployeeId:
                selectedDeal.assignedEmployeeId || prev.assignedEmployeeId,
            titleEn:
                prev.titleEn.trim() ||
                `${selectedDeal.titleEn} — Commercial Proposal`,
            titleAr:
                prev.titleAr?.trim() ||
                (selectedDeal.titleAr
                    ? `عرض سعر — ${selectedDeal.titleAr}`
                    : ''),
        }));
    };

    const handleLineItemsChange = (items: CrmQuotationLineItem[]) => {
        const totals = calculateCrmQuotationTotals(items);
        setFormState((prev) => ({
            ...prev,
            lineItems: totals.lineItems,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxableAmount: totals.taxableAmount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldErrors({});
        const totals = calculateCrmQuotationTotals(formState.lineItems);
        const parsed = crmQuotationInputSchema.safeParse({
            ...formState,
            dealId: formState.dealId?.trim() || undefined,
            contactId: formState.contactId?.trim() || undefined,
            lineItems: totals.lineItems,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxableAmount: totals.taxableAmount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
        });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) {
                    errors[key] = issue.message;
                }
            }
            setFieldErrors(errors);
            return;
        }
        await onSubmit(parsed.data);
    };

    const availableDeals = deals.filter(
        (d) =>
            !formState.companyId ||
            d.companyId === formState.companyId ||
            d.id === formState.dealId
    );
    const availableContacts = contacts.filter(
        (c) =>
            !formState.companyId ||
            c.companyId === formState.companyId ||
            c.id === formState.contactId
    );

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
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 flex items-center justify-center text-[#2D3F2C] shrink-0">
                            {mode === 'create' ? (
                                <FileText size={18} />
                            ) : (
                                <Edit3 size={18} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <span
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {mode === 'edit' && initialData
                                    ? initialData.code
                                    : t('crm.commercial.quotations.badge')}
                            </span>
                            <h2
                                id="quotation-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.quotations.form.createTitle'
                                      )
                                    : t(
                                          'crm.commercial.quotations.form.editTitle',
                                          { code: initialData?.code || '' }
                                      )}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.quotations.form.createSubtitle'
                                      )
                                    : t(
                                          'crm.commercial.quotations.form.editSubtitle'
                                      )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                >
                    {serverError && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Section 1: Quotation Header & Client Linkage */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Building2 size={14} />
                            <span>
                                {t('crm.commercial.quotations.form.companyLabel')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.titleEnLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleEn}
                                    onChange={(e) =>
                                        handleChange('titleEn', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.quotations.form.titleEnPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                                {fieldErrors.titleEn && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.titleEn}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.titleArLabel'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleAr || ''}
                                    onChange={(e) =>
                                        handleChange('titleAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.quotations.form.titleArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.companyLabel'
                                    )}{' '}
                                    *
                                </label>
                                <select
                                    value={formState.companyId}
                                    onChange={(e) =>
                                        handleChange('companyId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} —{' '}
                                            {isRtl ? c.nameAr : c.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.quotations.form.dealLabel')}
                                </label>
                                <select
                                    value={formState.dealId || ''}
                                    onChange={(e) =>
                                        handleDealSelect(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.common.noLinkedDeal')}
                                    </option>
                                    {availableDeals.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.code} —{' '}
                                            {isRtl
                                                ? d.titleAr || d.titleEn
                                                : d.titleEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.contactLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.contactId || ''}
                                    onChange={(e) =>
                                        handleChange('contactId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedContact'
                                        )}
                                    </option>
                                    {availableContacts.map((cnt) => (
                                        <option key={cnt.id} value={cnt.id}>
                                            {isRtl
                                                ? cnt.fullNameAr || cnt.fullNameEn
                                                : cnt.fullNameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.assignedRepLabel'
                                    )}{' '}
                                    *
                                </label>
                                <select
                                    value={formState.assignedEmployeeId}
                                    onChange={(e) =>
                                        handleChange(
                                            'assignedEmployeeId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.issueDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.issueDate}
                                    onChange={(e) =>
                                        handleChange('issueDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.validUntilLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.validUntil}
                                    onChange={(e) =>
                                        handleChange('validUntil', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.validUntil && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.validUntil}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.quotations.form.quotationStatusLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.quotationStatus}
                                    onChange={(e) =>
                                        handleChange(
                                            'quotationStatus',
                                            e.target.value as CrmQuotationStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_QUOTATION_STATUS_VALUES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(
                                                `crm.commercial.quotations.statuses.${st}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Interactive Line Items Editor */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
                        <CrmLineItemsEditor
                            lineItems={formState.lineItems as CrmQuotationLineItem[]}
                            catalogItems={catalogItems}
                            taxes={taxes}
                            onChange={handleLineItemsChange}
                            error={fieldErrors.lineItems}
                        />
                    </div>

                    {/* Section 3: Terms & Notes */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t('crm.commercial.quotations.form.termsLabel')}
                            </label>
                            <textarea
                                rows={2}
                                value={formState.termsAndConditions || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'termsAndConditions',
                                        e.target.value
                                    )
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t('crm.commercial.quotations.form.notesLabel')}
                            </label>
                            <textarea
                                rows={2}
                                value={formState.notes || ''}
                                onChange={(e) =>
                                    handleChange('notes', e.target.value)
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting
                                ? t('crm.commercial.common.saving')
                                : mode === 'create'
                                  ? t('crm.commercial.common.create')
                                  : t('crm.commercial.common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
