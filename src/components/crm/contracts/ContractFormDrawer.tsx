import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    FileCheck2,
    Edit3,
    AlertCircle,
    Building2,
    Calculator,
} from 'lucide-react';
import {
    CRM_CONTRACT_STATUS_VALUES,
    CRM_CONTRACT_RENEWAL_VALUES,
    crmContractInputSchema,
    calculateCrmContractAmounts,
    type CrmContractInput,
    type CrmContractRecord,
    type CrmContractStatus,
    type CrmContractRenewal,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmQuotationRecord,
    type CrmContactRecord,
} from '../../../schemas/crmSchema';
import type { CrmSalesEmployee } from '../../../api/api';

export interface ContractFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmContractRecord | null;
    companies: CrmCompanyRecord[];
    deals: CrmDealRecord[];
    quotations: CrmQuotationRecord[];
    contacts: CrmContactRecord[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmContractInput) => Promise<void> | void;
}

export const ContractFormDrawer: React.FC<ContractFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    deals,
    quotations,
    contacts,
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
    const nextYearDate = new Date(todayDate);
    nextYearDate.setDate(nextYearDate.getDate() + 365);
    const nextYearIso = nextYearDate.toISOString().split('T')[0];

    const [taxRate, setTaxRate] = useState<number>(15);
    const [formState, setFormState] = useState<CrmContractInput>({
        contractNumber: '',
        titleEn: '',
        titleAr: '',
        dealId: '',
        quotationId: '',
        companyId: defaultCompany?.id || '',
        contactId: '',
        assignedEmployeeId: defaultEmployeeId,
        contractStatus: 'draft',
        renewalType: 'annual_auto',
        startDate: todayIso,
        endDate: nextYearIso,
        signedDate: '',
        subtotal: 50000,
        discountTotal: 0,
        taxAmount: 7500,
        totalValue: 57500,
        currency: 'SAR',
        termsAndConditions:
            'Annual professional services engagement governed by SOCPA and ZATCA regulatory frameworks.',
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${defaultCompany?.id ?? ''}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                setTaxRate(15);
                setFormState({
                    contractNumber: initialData.contractNumber,
                    titleEn: initialData.titleEn,
                    titleAr: initialData.titleAr || '',
                    dealId: initialData.dealId || '',
                    quotationId: initialData.quotationId || '',
                    companyId: initialData.companyId,
                    contactId: initialData.contactId || '',
                    assignedEmployeeId: initialData.assignedEmployeeId,
                    contractStatus: initialData.contractStatus,
                    renewalType: initialData.renewalType,
                    startDate: initialData.startDate,
                    endDate: initialData.endDate,
                    signedDate: initialData.signedDate || '',
                    subtotal: initialData.subtotal,
                    discountTotal: initialData.discountTotal,
                    taxAmount: initialData.taxAmount,
                    totalValue: initialData.totalValue,
                    currency: initialData.currency || 'SAR',
                    termsAndConditions: initialData.termsAndConditions || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'active',
                });
            } else {
                setTaxRate(15);
                setFormState({
                    contractNumber: '',
                    titleEn: '',
                    titleAr: '',
                    dealId: '',
                    quotationId: '',
                    companyId: defaultCompany?.id || '',
                    contactId: '',
                    assignedEmployeeId: defaultEmployeeId,
                    contractStatus: 'draft',
                    renewalType: 'annual_auto',
                    startDate: todayIso,
                    endDate: nextYearIso,
                    signedDate: '',
                    subtotal: 50000,
                    discountTotal: 0,
                    taxAmount: 7500,
                    totalValue: 57500,
                    currency: 'SAR',
                    termsAndConditions:
                        'Annual professional services engagement governed by SOCPA and ZATCA regulatory frameworks.',
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

    const handleChange = <K extends keyof CrmContractInput>(
        field: K,
        value: CrmContractInput[K]
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

    const eligibleQuotations = quotations.filter((q) => {
        const isApprovedOrLinked =
            q.quotationStatus === 'approved' ||
            (mode === 'edit' && q.id === initialData?.quotationId);
        if (!isApprovedOrLinked) return false;

        if (formState.companyId && q.companyId !== formState.companyId) {
            return false;
        }

        return true;
    });

    const handleCompanyChange = (newCompanyId: string) => {
        setFormState((prev) => {
            const isQuotationIncompatible =
                Boolean(prev.quotationId) &&
                quotations.some(
                    (q) => q.id === prev.quotationId && q.companyId !== newCompanyId
                );

            const isContactIncompatible =
                Boolean(prev.contactId) &&
                contacts.some(
                    (c) => c.id === prev.contactId && c.companyId !== newCompanyId
                );

            return {
                ...prev,
                companyId: newCompanyId,
                quotationId: isQuotationIncompatible ? '' : prev.quotationId,
                contactId: isContactIncompatible ? '' : prev.contactId,
            };
        });

        if (fieldErrors.companyId) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.companyId;
                return next;
            });
        }
        if (fieldErrors.quotationId) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.quotationId;
                return next;
            });
        }
    };

    const handleQuotationSelect = (quotationId: string) => {
        if (!quotationId) {
            handleChange('quotationId', '');
            return;
        }
        const q = quotations.find((item) => item.id === quotationId);
        if (!q) {
            handleChange('quotationId', '');
            return;
        }
        if (q.quotationStatus !== 'approved' && q.id !== initialData?.quotationId) {
            setFieldErrors((prev) => ({
                ...prev,
                quotationId: t('crm.commercial.quotations.validation.mustBeApproved', {
                    defaultValue: 'Only approved quotations can be converted into contracts.',
                }),
            }));
            return;
        }
        setFormState((prev) => ({
            ...prev,
            quotationId: q.id,
            dealId: q.dealId || prev.dealId,
            companyId: q.companyId,
            contactId: q.contactId || prev.contactId,
            assignedEmployeeId:
                q.assignedEmployeeId || prev.assignedEmployeeId,
            titleEn: prev.titleEn.trim() || `${q.titleEn} — Service Agreement`,
            titleAr:
                prev.titleAr?.trim() ||
                (q.titleAr ? `عقد خدمات — ${q.titleAr}` : ''),
            subtotal: q.subtotal,
            discountTotal: q.discountTotal,
            taxAmount: q.taxAmount,
            totalValue: q.grandTotal,
            termsAndConditions:
                q.termsAndConditions || prev.termsAndConditions,
        }));
    };

    const handleFinancialChange = (
        nextSubtotal: number,
        nextDiscount: number,
        nextTaxRate: number
    ) => {
        const computed = calculateCrmContractAmounts({
            subtotal: nextSubtotal,
            discountTotal: nextDiscount,
            taxRate: nextTaxRate,
        });
        setTaxRate(nextTaxRate);
        setFormState((prev) => ({
            ...prev,
            subtotal: computed.subtotal,
            discountTotal: computed.discountTotal,
            taxAmount: computed.taxAmount,
            totalValue: computed.totalValue,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldErrors({});

        if (formState.quotationId && formState.quotationId.trim() !== '') {
            const selectedQ = quotations.find((q) => q.id === formState.quotationId);
            if (!selectedQ) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'Selected quotation does not exist.',
                }));
                return;
            }
            if (
                selectedQ.quotationStatus !== 'approved' &&
                selectedQ.id !== initialData?.quotationId
            ) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'Only approved quotations can be linked to a contract.',
                }));
                return;
            }
            if (selectedQ.companyId !== formState.companyId) {
                setFieldErrors((prev) => ({
                    ...prev,
                    quotationId: 'The selected quotation does not belong to the selected company.',
                }));
                return;
            }
        }

        const parsed = crmContractInputSchema.safeParse({
            ...formState,
            contractNumber: formState.contractNumber?.trim() || undefined,
            dealId: formState.dealId?.trim() || undefined,
            quotationId: formState.quotationId?.trim() || undefined,
            contactId: formState.contactId?.trim() || undefined,
            signedDate: formState.signedDate?.trim() || undefined,
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
            aria-labelledby="contract-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 flex items-center justify-center text-[#2D3F2C] shrink-0">
                            {mode === 'create' ? (
                                <FileCheck2 size={18} />
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
                                    ? initialData.contractNumber
                                    : t('crm.commercial.contracts.badge')}
                            </span>
                            <h2
                                id="contract-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.contracts.form.createTitle'
                                      )
                                    : t(
                                          'crm.commercial.contracts.form.editTitle',
                                          { code: initialData?.code || '' }
                                      )}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.contracts.form.createSubtitle'
                                      )
                                    : t(
                                          'crm.commercial.contracts.form.editSubtitle'
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

                    {/* Section 1: Agreement Identity & Source Quotation */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Building2 size={14} />
                            <span>
                                {t('crm.commercial.contracts.form.companyLabel')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.quotationLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.quotationId || ''}
                                    onChange={(e) =>
                                        handleQuotationSelect(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedQuotation'
                                        )}
                                    </option>
                                    {eligibleQuotations.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.code} —{' '}
                                            {isRtl
                                                ? q.titleAr || q.titleEn
                                                : q.titleEn}{' '}
                                            ({q.grandTotal.toLocaleString()} SAR)
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.quotationId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.quotationId}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.titleEnLabel'
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
                                        'crm.commercial.contracts.form.titleEnPlaceholder'
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
                                        'crm.commercial.contracts.form.titleArLabel'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleAr || ''}
                                    onChange={(e) =>
                                        handleChange('titleAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.contracts.form.titleArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.companyLabel'
                                    )}{' '}
                                    *
                                </label>
                                <select
                                    value={formState.companyId}
                                    onChange={(e) =>
                                        handleCompanyChange(e.target.value)
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
                                    {t('crm.commercial.contracts.form.dealLabel')}
                                </label>
                                <select
                                    value={formState.dealId || ''}
                                    onChange={(e) =>
                                        handleChange('dealId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.common.noLinkedDeal')}
                                    </option>
                                    {deals.map((d) => (
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
                                        'crm.commercial.contracts.form.contactLabel'
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
                                        'crm.commercial.contracts.form.assignedRepLabel'
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
                                        'crm.commercial.contracts.form.startDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.startDate}
                                    onChange={(e) =>
                                        handleChange('startDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.endDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.endDate}
                                    onChange={(e) =>
                                        handleChange('endDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.endDate && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.endDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.renewalTypeLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.renewalType}
                                    onChange={(e) =>
                                        handleChange(
                                            'renewalType',
                                            e.target.value as CrmContractRenewal
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_CONTRACT_RENEWAL_VALUES.map((rt) => (
                                        <option key={rt} value={rt}>
                                            {t(
                                                `crm.commercial.contracts.renewalTypes.${rt}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.contractStatusLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.contractStatus}
                                    onChange={(e) =>
                                        handleChange(
                                            'contractStatus',
                                            e.target.value as CrmContractStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_CONTRACT_STATUS_VALUES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(
                                                `crm.commercial.contracts.statuses.${st}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial Valuation */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Calculator size={14} />
                            <span>
                                {t('crm.commercial.contracts.columns.financials')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.subtotalLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={formState.subtotal}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            Number(e.target.value || 0),
                                            formState.discountTotal,
                                            taxRate
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.discountTotalLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    value={formState.discountTotal}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            formState.subtotal,
                                            Number(e.target.value || 0),
                                            taxRate
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.taxRateLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={taxRate}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            formState.subtotal,
                                            formState.discountTotal,
                                            Number(e.target.value || 0)
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] p-3.5 flex items-center justify-between">
                            <div className="text-xs text-[#6E6862]">
                                {t(
                                    'crm.commercial.contracts.form.taxAmountLabel'
                                )}
                                :{' '}
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {formState.taxAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="text-sm font-bold text-[#0D0D0D]">
                                {t(
                                    'crm.commercial.contracts.form.totalValueLabel'
                                )}
                                :{' '}
                                <span
                                    className="font-mono text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {formState.totalValue.toLocaleString()} SAR
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contractual Clauses */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t('crm.commercial.contracts.form.termsLabel')}
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
                                {t('crm.commercial.contracts.form.notesLabel')}
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
