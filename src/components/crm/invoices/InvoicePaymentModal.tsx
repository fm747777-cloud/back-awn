import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CrmInvoiceRecord } from '../../../schemas/crmSchema';

export interface InvoicePaymentModalProps {
    isOpen: boolean;
    invoice: CrmInvoiceRecord | null;
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmitPayment: (payment: {
        amount: number;
        paymentMethod?: string;
        paymentReference?: string;
        paidAt?: string;
        notes?: string;
    }) => Promise<void> | void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
    isOpen,
    invoice,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmitPayment,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const todayIso = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>(
        'Corporate Bank Transfer (SARIE)'
    );
    const [paymentReference, setPaymentReference] = useState<string>('');
    const [paidAt, setPaidAt] = useState<string>(todayIso);
    const [notes, setNotes] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${invoice?.id ?? 'none'}-${invoice?.remainingAmount ?? 0}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen && invoice) {
            setAmount(invoice.remainingAmount);
            setPaymentMethod(
                invoice.paymentMethod || 'Corporate Bank Transfer (SARIE)'
            );
            const refDigits =
                invoice.invoiceNumber.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0') ||
                '1001';
            setPaymentReference(
                `SARIE-TRN-${new Date().getFullYear()}-${refDigits}`
            );
            setPaidAt(todayIso);
            setNotes('');
            setLocalError(null);
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

    if (!isOpen || !invoice) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        const numericAmount = Number(amount || 0);
        if (numericAmount <= 0) {
            setLocalError('Payment amount must be greater than 0 SAR.');
            return;
        }
        if (numericAmount > invoice.remainingAmount + 0.01) {
            setLocalError(
                `Payment cannot exceed remaining balance (${invoice.remainingAmount.toLocaleString()} SAR).`
            );
            return;
        }
        await onSubmitPayment({
            amount: numericAmount,
            paymentMethod,
            paymentReference,
            paidAt,
            notes: notes.trim() || undefined,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-payment-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] border border-[#2E6B4E]/20 text-[#2E6B4E] flex items-center justify-center shrink-0">
                            <CreditCard size={19} />
                        </div>
                        <div className="space-y-1">
                            <span
                                className="inline-block px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#037F8C]"
                                dir="ltr"
                            >
                                {invoice.invoiceNumber}
                            </span>
                            <h2
                                id="invoice-payment-modal-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {t('crm.commercial.invoices.paymentModal.title')}
                            </h2>
                            <p className="text-xs text-[#6E6862]">
                                {t(
                                    'crm.commercial.invoices.paymentModal.subtitle',
                                    {
                                        code: invoice.invoiceNumber,
                                        company: isRtl
                                            ? invoice.companyNameAr ||
                                              invoice.companyNameEn
                                            : invoice.companyNameEn,
                                    }
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {(serverError || localError) && (
                        <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] p-3 flex items-center gap-2 text-xs text-[#A63A3A]">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{serverError || localError}</span>
                        </div>
                    )}

                    {/* Balance Summary */}
                    <div className="grid grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#6E6862] block">
                                {t(
                                    'crm.commercial.invoices.paymentModal.invoiceTotal'
                                )}
                            </span>
                            <span
                                className="font-mono font-bold text-[#0D0D0D]"
                                dir="ltr"
                            >
                                {invoice.totalAmount.toLocaleString()} SAR
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#E9F5EE]/50 border border-[#2E6B4E]/20">
                            <span className="text-[11px] text-[#2E6B4E] block">
                                {t(
                                    'crm.commercial.invoices.paymentModal.alreadyPaid'
                                )}
                            </span>
                            <span
                                className="font-mono font-bold text-[#2E6B4E]"
                                dir="ltr"
                            >
                                {invoice.paidAmount.toLocaleString()} SAR
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FDF3E7]/60 border border-[#B45309]/20">
                            <span className="text-[11px] text-[#B45309] block">
                                {t(
                                    'crm.commercial.invoices.paymentModal.currentBalance'
                                )}
                            </span>
                            <span
                                className="font-mono font-bold text-[#B45309]"
                                dir="ltr"
                            >
                                {invoice.remainingAmount.toLocaleString()} SAR
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-[#0D0D0D]">
                                {t(
                                    'crm.commercial.invoices.paymentModal.paymentAmountLabel'
                                )}{' '}
                                *
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    setAmount(invoice.remainingAmount)
                                }
                                className="text-[11px] font-semibold text-[#037F8C] hover:underline cursor-pointer"
                            >
                                {t(
                                    'crm.commercial.invoices.paymentModal.payFullBalance'
                                )}
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={invoice.remainingAmount}
                            step="any"
                            value={amount}
                            onChange={(e) =>
                                setAmount(Number(e.target.value || 0))
                            }
                            dir="ltr"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-sm font-mono font-bold text-[#0D0D0D]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t(
                                    'crm.commercial.invoices.paymentModal.paymentMethodLabel'
                                )}
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) =>
                                    setPaymentMethod(e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                            >
                                <option value="Corporate Bank Transfer (SARIE)">
                                    {t(
                                        'crm.commercial.invoices.paymentMethods.bank_transfer'
                                    )}
                                </option>
                                <option value="SADAD Biller Payment">
                                    {t(
                                        'crm.commercial.invoices.paymentMethods.sadad'
                                    )}
                                </option>
                                <option value="Certified Corporate Cheque">
                                    {t(
                                        'crm.commercial.invoices.paymentMethods.certified_cheque'
                                    )}
                                </option>
                                <option value="Corporate Card / Mada">
                                    {t(
                                        'crm.commercial.invoices.paymentMethods.credit_card'
                                    )}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                {t(
                                    'crm.commercial.invoices.paymentModal.paidAtLabel'
                                )}
                            </label>
                            <input
                                type="date"
                                value={paidAt}
                                onChange={(e) => setPaidAt(e.target.value)}
                                dir="ltr"
                                className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t(
                                'crm.commercial.invoices.paymentModal.paymentReferenceLabel'
                            )}
                        </label>
                        <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) =>
                                setPaymentReference(e.target.value)
                            }
                            placeholder={t(
                                'crm.commercial.invoices.paymentModal.paymentReferencePlaceholder'
                            )}
                            dir="ltr"
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                            {t(
                                'crm.commercial.invoices.paymentModal.notesLabel'
                            )}
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D]"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E6B4E] hover:bg-[#23533C] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            {isSubmitting
                                ? t(
                                      'crm.commercial.invoices.paymentModal.submitting'
                                  )
                                : t(
                                      'crm.commercial.invoices.paymentModal.submitPayment'
                                  )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
