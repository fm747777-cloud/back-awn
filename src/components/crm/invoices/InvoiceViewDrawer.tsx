import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    CreditCard,
    Send,
    AlertTriangle,
    Building2,
} from 'lucide-react';
import type {
    CrmInvoiceRecord,
    CrmInvoiceStatus,
} from '../../../schemas/crmSchema';

export interface InvoiceViewDrawerProps {
    isOpen: boolean;
    record: CrmInvoiceRecord | null;
    onClose: () => void;
    onEdit: (record: CrmInvoiceRecord) => void;
    onOpenPaymentModal: (record: CrmInvoiceRecord) => void;
    onTransitionStatus: (id: string, status: CrmInvoiceStatus) => void;
}

export const InvoiceViewDrawer: React.FC<InvoiceViewDrawerProps> = ({
    isOpen,
    record,
    onClose,
    onEdit,
    onOpenPaymentModal,
    onTransitionStatus,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    const collectionPct =
        record.totalAmount > 0
            ? Math.min(
                  100,
                  Math.round((record.paidAmount / record.totalAmount) * 100)
              )
            : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {record.invoiceNumber}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                    record.invoiceStatus === 'paid'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E]'
                                        : record.invoiceStatus ===
                                            'partially_paid'
                                          ? 'bg-cyan-50 text-[#0891B2]'
                                          : record.invoiceStatus === 'overdue'
                                            ? 'bg-[#FCECE9] text-[#A63A3A]'
                                            : 'bg-[#FDF3E7] text-[#B45309]'
                                }`}
                            >
                                {t(
                                    `crm.commercial.invoices.statuses.${record.invoiceStatus}`
                                )}
                            </span>
                        </div>
                        <h2
                            id="invoice-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.commercial.invoices.viewDrawer.subtitle')}
                        </p>
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Quick Collection & Status Controls */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            {record.remainingAmount > 0 &&
                                record.invoiceStatus !== 'cancelled' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onOpenPaymentModal(record)
                                        }
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2E6B4E] hover:bg-[#23533C] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <CreditCard size={14} />
                                        {t(
                                            'crm.commercial.invoices.viewDrawer.recordPaymentCta'
                                        )}
                                    </button>
                                )}

                            <div className="flex items-center gap-2">
                                {record.invoiceStatus === 'draft' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'issued'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <Send size={13} />
                                        {t(
                                            'crm.commercial.invoices.viewDrawer.markIssued'
                                        )}
                                    </button>
                                )}
                                {(record.invoiceStatus === 'issued' ||
                                    record.invoiceStatus ===
                                        'partially_paid') && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'overdue'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A63A3A]/30 bg-[#FCECE9] text-[#A63A3A] text-xs font-semibold cursor-pointer"
                                    >
                                        <AlertTriangle size={13} />
                                        {t(
                                            'crm.commercial.invoices.viewDrawer.markOverdue'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Collection Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-[#6E6862]">
                                <span>
                                    {t(
                                        'crm.commercial.invoices.paymentModal.alreadyPaid'
                                    )}
                                    : {record.paidAmount.toLocaleString()} SAR (
                                    {collectionPct}%)
                                </span>
                                <span>
                                    {t(
                                        'crm.commercial.invoices.paymentModal.currentBalance'
                                    )}
                                    : {record.remainingAmount.toLocaleString()}{' '}
                                    SAR
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white border border-[#E5E0D8] overflow-hidden">
                                <div
                                    className="h-full bg-[#2E6B4E] transition-all"
                                    style={{ width: `${collectionPct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#2D3F2C]" />
                            <span>
                                {t('crm.commercial.invoices.viewDrawer.title')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.companyLabel'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.companyNameAr ||
                                          record.companyNameEn
                                        : record.companyNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.totalAmountLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {record.totalAmount.toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.columns.dates'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {record.issueDate} → {record.dueDate}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.invoices.form.contractLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {record.contractNumber ||
                                        record.quotationCode ||
                                        record.dealCode ||
                                        t(
                                            'crm.commercial.common.noLinkedContract'
                                        )}
                                </span>
                            </div>
                        </div>

                        {record.paymentReference && (
                            <div className="p-2.5 rounded-lg bg-[#E9F5EE]/50 border border-[#2E6B4E]/20 text-xs">
                                <span className="text-[11px] text-[#2E6B4E] font-semibold block">
                                    {t(
                                        'crm.commercial.invoices.form.paymentReferenceLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono text-[#0D0D0D]"
                                    dir="ltr"
                                >
                                    {record.paymentMethod
                                        ? `${record.paymentMethod} • `
                                        : ''}
                                    {record.paymentReference}
                                    {record.paidAt ? ` (${record.paidAt})` : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.commercial.common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.commercial.common.edit')}
                    </button>
                </div>
            </div>
        </div>
    );
};
