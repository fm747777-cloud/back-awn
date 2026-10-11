import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Receipt,
    Edit3,
    AlertCircle,
    Building2,
    Calculator,
} from 'lucide-react';
import {
    CRM_INVOICE_STATUS_VALUES,
    crmInvoiceInputSchema,
    calculateCrmInvoiceAmounts,
    type CrmInvoiceInput,
    type CrmInvoiceRecord,
    type CrmInvoiceStatus,
    type CrmCompanyRecord,
    type CrmDealRecord,
    type CrmQuotationRecord,
    type CrmContractRecord,
} from '../../../schemas/crmSchema';
import type { CrmSalesEmployee } from '../../../api/api';

export interface InvoiceFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmInvoiceRecord | null;
    companies: CrmCompanyRecord[];
    deals: CrmDealRecord[];
    quotations: CrmQuotationRecord[];
    contracts: CrmContractRecord[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmInvoiceInput) => Promise<void> | void;
}

export const InvoiceFormDrawer: React.FC<InvoiceFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    deals,
    quotations,
    contracts,
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
    const dueDateObj = new Date(todayDate);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDateIso = dueDateObj.toISOString().split('T')[0];

    const [taxRate, setTaxRate] = useState<number>(15);
    const [formState, setFormState] = useState<CrmInvoiceInput>({
        invoiceNumber: '',
        titleEn: '',
        titleAr: '',
        dealId: '',
        quotationId: '',
        contractId: '',
        companyId: defaultCompany?.id || '',
        assignedEmployeeId: defaultEmployeeId,
        invoiceStatus: 'issued',
        issueDate: todayIso,
        dueDate: dueDateIso,
        paidAt: '',
        subtotal: 50000,
        discountTotal: 0,
        taxAmount: 7500,
        totalAmount: 57500,
        paidAmount: 0,
        remainingAmount: 57500,
        currency: 'SAR',
        paymentMethod: 'bank_transfer',
        paymentReference: '',
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
                    invoiceNumber: initialData.invoiceNumber,
                    titleEn: initialData.titleEn,
                    titleAr: initialData.titleAr || '',
                    dealId: initialData.dealId || '',
                    quotationId: initialData.quotationId || '',
                    contractId: initialData.contractId || '',
                    companyId: initialData.companyId,
                    assignedEmployeeId: initialData.assignedEmployeeId,
                    invoiceStatus: initialData.invoiceStatus,
                    issueDate: initialData.issueDate,
                    dueDate: initialData.dueDate,
                    paidAt: initialData.paidAt || '',
                    subtotal: initialData.subtotal,
                    discountTotal: initialData.discountTotal,
                    taxAmount: initialData.taxAmount,
                    totalAmount: initialData.totalAmount,
                    paidAmount: initialData.paidAmount,
                    remainingAmount: initialData.remainingAmount,
                    currency: initialData.currency || 'SAR',
                    paymentMethod: initialData.paymentMethod || 'bank_transfer',
                    paymentReference: initialData.paymentReference || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'active',
                });
            } else {
                setTaxRate(15);
                setFormState({
                    invoiceNumber: '',
                    titleEn: '',
                    titleAr: '',
                    dealId: '',
                    quotationId: '',
                    contractId: '',
                    companyId: defaultCompany?.id || '',
                    assignedEmployeeId: defaultEmployeeId,
                    invoiceStatus: 'issued',
                    issueDate: todayIso,
                    dueDate: dueDateIso,
                    paidAt: '',
                    subtotal: 50000,
                    discountTotal: 0,
                    taxAmount: 7500,
                    totalAmount: 57500,
                    paidAmount: 0,
                    remainingAmount: 57500,
                    currency: 'SAR',
                    paymentMethod: 'bank_transfer',
                    paymentReference: '',
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

    const handleChange = <K extends keyof CrmInvoiceInput>(
        field: K,
        value: CrmInvoiceInput[K]
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

    const handleContractSelect = (contractId: string) => {
        const contract = contracts.find((c) => c.id === contractId);
        if (!contract) {
            handleChange('contractId', '');
            return;
        }
        const computed = calculateCrmInvoiceAmounts({
            subtotal: contract.subtotal,
            discountTotal: contract.discountTotal,
            taxAmount: contract.taxAmount,
            paidAmount: formState.paidAmount,
        });
        setFormState((prev) => ({
            ...prev,
            contractId: contract.id,
            quotationId: contract.quotationId || prev.quotationId,
            dealId: contract.dealId || prev.dealId,
            companyId: contract.companyId,
            assignedEmployeeId:
                contract.assignedEmployeeId || prev.assignedEmployeeId,
            titleEn:
                prev.titleEn.trim() || `${contract.titleEn} — Tax Invoice`,
            titleAr:
                prev.titleAr?.trim() ||
                (contract.titleAr
                    ? `فاتورة ضريبية — ${contract.titleAr}`
                    : ''),
            subtotal: computed.subtotal,
            discountTotal: computed.discountTotal,
            taxAmount: computed.taxAmount,
            totalAmount: computed.totalAmount,
            paidAmount: computed.paidAmount,
            remainingAmount: computed.remainingAmount,
        }));
    };

    const handleFinancialChange = (
        nextSubtotal: number,
        nextDiscount: number,
        nextTaxRate: number,
        nextPaidAmount: number
    ) => {
        const computed = calculateCrmInvoiceAmounts({
            subtotal: nextSubtotal,
            discountTotal: nextDiscount,
            taxRate: nextTaxRate,
            paidAmount: nextPaidAmount,
        });
        setTaxRate(nextTaxRate);
        setFormState((prev) => ({
            ...prev,
            subtotal: computed.subtotal,
            discountTotal: computed.discountTotal,
            taxAmount: computed.taxAmount,
            totalAmount: computed.totalAmount,
            paidAmount: computed.paidAmount,
            remainingAmount: computed.remainingAmount,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldErrors({});
        const parsed = crmInvoiceInputSchema.safeParse({
            ...formState,
            invoiceNumber: formState.invoiceNumber?.trim() || undefined,
            dealId: formState.dealId?.trim() || undefined,
            quotationId: formState.quotationId?.trim() || undefined,
            contractId: formState.contractId?.trim() || undefined,
            paidAt: formState.paidAt?.trim() || undefined,
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

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-form-drawer-title"
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
                                <Receipt size={18} />
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
                                    ? initialData.invoiceNumber
                                    : t('crm.commercial.invoices.badge')}
                            </span>
                            <h2
                                id="invoice-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.invoices.form.createTitle'
                                      )
                                    : t(
                                          'crm.commercial.invoices.form.editTitle',
                                          { code: initialData?.code || '' }
                                      )}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t(
                                          'crm.commercial.invoices.form.createSubtitle'
                                      )
                                    : t(
                                          'crm.commercial.invoices.form.editSubtitle'
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

                    {/* Section 1: Invoice Identity & Commercial Links */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Building2 size={14} />
                            <span>
                                {t('crm.commercial.invoices.form.companyLabel')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.contractLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.contractId || ''}
                                    onChange={(e) =>
                                        handleContractSelect(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedContract'
                                        )}
                                    </option>
                                    {contracts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.contractNumber} —{' '}
                                            {isRtl
                                                ? c.titleAr || c.titleEn
                                                : c.titleEn}{' '}
                                            ({c.totalValue.toLocaleString()} SAR)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.titleEnLabel'
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
                                        'crm.commercial.invoices.form.titleEnPlaceholder'
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
                                        'crm.commercial.invoices.form.titleArLabel'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleAr || ''}
                                    onChange={(e) =>
                                        handleChange('titleAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.invoices.form.titleArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.companyLabel'
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
                                    {t('crm.commercial.invoices.form.dealLabel')}
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
                                        'crm.commercial.invoices.form.quotationLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.quotationId || ''}
                                    onChange={(e) =>
                                        handleChange(
                                            'quotationId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t(
                                            'crm.commercial.common.noLinkedQuotation'
                                        )}
                                    </option>
                                    {quotations.map((q) => (
                                        <option key={q.id} value={q.id}>
                                            {q.code} —{' '}
                                            {isRtl
                                                ? q.titleAr || q.titleEn
                                                : q.titleEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.assignedRepLabel'
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
                                        'crm.commercial.invoices.form.issueDateLabel'
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
                                        'crm.commercial.invoices.form.dueDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.dueDate}
                                    onChange={(e) =>
                                        handleChange('dueDate', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.dueDate && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.dueDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.invoiceStatusLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.invoiceStatus}
                                    onChange={(e) =>
                                        handleChange(
                                            'invoiceStatus',
                                            e.target.value as CrmInvoiceStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_INVOICE_STATUS_VALUES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(
                                                `crm.commercial.invoices.statuses.${st}`
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial & Settlement Amounts */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <Calculator size={14} />
                            <span>
                                {t(
                                    'crm.commercial.invoices.columns.totalAndPaid'
                                )}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.subtotalLabel'
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
                                            taxRate,
                                            formState.paidAmount
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.discountTotalLabel'
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
                                            taxRate,
                                            formState.paidAmount
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.taxRateLabel'
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
                                            Number(e.target.value || 0),
                                            formState.paidAmount
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.invoices.form.paidAmountLabel'
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={formState.paidAmount}
                                    onChange={(e) =>
                                        handleFinancialChange(
                                            formState.subtotal,
                                            formState.discountTotal,
                                            taxRate,
                                            Number(e.target.value || 0)
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.taxAmountLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {formState.taxAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.totalAmountLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {formState.totalAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.remainingAmountLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#B45309]"
                                    dir="ltr"
                                >
                                    {formState.remainingAmount.toLocaleString()}{' '}
                                    SAR
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4">
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t('crm.commercial.invoices.form.notesLabel')}
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
