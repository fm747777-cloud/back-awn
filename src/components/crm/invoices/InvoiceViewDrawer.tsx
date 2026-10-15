import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    CreditCard,
    Send,
    AlertTriangle,
    Building2,
    Calculator,
    ArrowRightLeft,
    CheckCircle2,
    Receipt,
    Printer,
} from 'lucide-react';
import type {
    CrmInvoiceRecord,
    CrmInvoiceStatus,
} from '../../../schemas/crmSchema';

export interface InvoiceViewDrawerProps {
    isOpen: boolean;
    record: CrmInvoiceRecord | null;
    isConverting?: boolean;
    onClose: () => void;
    onEdit: (record: CrmInvoiceRecord) => void;
    onOpenPaymentModal: (record: CrmInvoiceRecord) => void;
    onTransitionStatus: (id: string, status: CrmInvoiceStatus) => void;
    onConvertToFinal?: (record: CrmInvoiceRecord) => void;
    onViewLinkedInvoice?: (invoiceId: string) => void;
    onPrintDocument?: (record: CrmInvoiceRecord) => void;
}

export const InvoiceViewDrawer: React.FC<InvoiceViewDrawerProps> = ({
    isOpen,
    record,
    isConverting = false,
    onClose,
    onEdit,
    onOpenPaymentModal,
    onTransitionStatus,
    onConvertToFinal,
    onViewLinkedInvoice,
    onPrintDocument,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    const isProforma =
        record.invoiceType === 'proforma' ||
        record.code?.startsWith('PI-') ||
        record.invoiceNumber?.startsWith('PI-');

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
                                    isProforma
                                        ? 'bg-[#F3EEFA] text-[#5B21B6] border border-[#DDD6FE]'
                                        : 'bg-[#FAF8F5] text-[#2D3F2C] border border-[#E5E0D8]'
                                }`}
                            >
                                {t(
                                    isProforma
                                        ? 'crm.commercial.invoices.types.proforma'
                                        : 'crm.commercial.invoices.types.final_tax'
                                )}
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

                    <div className="flex items-center gap-2 shrink-0">
                        {onPrintDocument && (
                            <button
                                type="button"
                                onClick={() => onPrintDocument(record)}
                                title={t('crm.commercial.invoices.actions.printDocument')}
                                aria-label={t('crm.commercial.invoices.actions.printDocument')}
                                className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#2D3F2C] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <Printer size={16} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('crm.commercial.common.close')}
                            className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Proforma Conversion Status & Actions */}
                    {isProforma && record.convertedToInvoiceId ? (
                        <div className="rounded-xl border border-[#DDD6FE] bg-[#F5F0FF] p-4 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-[#6D28D9] shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-[#4C1D95]">
                                        {t('crm.commercial.invoices.viewDrawer.convertedToBanner', {
                                            code:
                                                record.convertedToInvoiceNumber ||
                                                record.convertedToInvoiceId,
                                        })}
                                    </p>
                                    {record.convertedAt && (
                                        <p className="text-[11px] text-[#6D28D9]/80 font-mono">
                                            {record.convertedAt}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {onViewLinkedInvoice && record.convertedToInvoiceId && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onViewLinkedInvoice(record.convertedToInvoiceId!)
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DDD6FE] text-[#5B21B6] hover:bg-[#EDE9FE] text-xs font-semibold cursor-pointer shadow-xs"
                                >
                                    <Receipt size={13} />
                                    {t('crm.commercial.invoices.viewDrawer.viewFinalInvoice')}
                                </button>
                            )}
                        </div>
                    ) : isProforma ? (
                        <div className="rounded-xl border border-[#DDD6FE] bg-[#FAF7FD] p-4 flex items-center justify-between gap-3 flex-wrap">
                            <div className="space-y-1 max-w-sm">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#F3EEFA] text-[#5B21B6] border border-[#DDD6FE]">
                                        {t('crm.commercial.invoices.types.proforma')}
                                    </span>
                                </div>
                                <p className="text-xs text-[#5B21B6] font-medium leading-relaxed">
                                    {t('crm.commercial.invoices.viewDrawer.proformaInfo')}
                                </p>
                            </div>
                            {onConvertToFinal && (
                                <button
                                    type="button"
                                    disabled={isConverting}
                                    onClick={() => onConvertToFinal(record)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
                                >
                                    <ArrowRightLeft
                                        size={14}
                                        className={isConverting ? 'animate-spin' : ''}
                                    />
                                    {isConverting
                                        ? t('crm.commercial.invoices.viewDrawer.converting')
                                        : t('crm.commercial.invoices.viewDrawer.convertAction')}
                                </button>
                            )}
                        </div>
                    ) : record.sourceProformaInvoiceId ? (
                        <div className="rounded-xl border border-[#C5DFCC] bg-[#F4FAF6] p-4 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-[#2E6B4E] shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-[#14532D]">
                                        {t('crm.commercial.invoices.viewDrawer.convertedFromBanner', {
                                            code:
                                                record.sourceProformaInvoiceNumber ||
                                                record.sourceProformaInvoiceId,
                                        })}
                                    </p>
                                </div>
                            </div>
                            {onViewLinkedInvoice && record.sourceProformaInvoiceId && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onViewLinkedInvoice(record.sourceProformaInvoiceId!)
                                    }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#C5DFCC] text-[#2E6B4E] hover:bg-[#EAF3EC] text-xs font-semibold cursor-pointer shadow-xs"
                                >
                                    <Receipt size={13} />
                                    {t('crm.commercial.invoices.viewDrawer.viewSourceProforma')}
                                </button>
                            )}
                        </div>
                    ) : null}

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

                    {/* Line Items Table */}
                    {record.lineItems && record.lineItems.length > 0 && (
                        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                                <Calculator size={14} className="text-[#2D3F2C]" />
                                <span>
                                    {t('crm.commercial.common.lineItems.sectionTitle')}{' '}
                                    ({record.lineItems.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {record.lineItems.map((li, idx) => (
                                    <div
                                        key={li.id || idx}
                                        className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5 text-xs"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-[#0D0D0D]">
                                                {idx + 1}.{' '}
                                                {isRtl
                                                    ? li.descriptionAr || li.descriptionEn
                                                    : li.descriptionEn}
                                            </span>
                                            <span
                                                className="font-mono font-bold text-[#2D3F2C]"
                                                dir="ltr"
                                            >
                                                {li.lineTotal.toLocaleString()} SAR
                                            </span>
                                        </div>
                                        <div
                                            className="flex items-center gap-3 text-[11px] font-mono text-[#6E6862]"
                                            dir="ltr"
                                        >
                                            <span>
                                                Qty: {li.quantity} × {li.unitPrice.toLocaleString()} SAR
                                            </span>
                                            {li.discountAmount > 0 && (
                                                <span>
                                                    Disc: {li.discountPercent > 0 ? `${li.discountPercent}% ` : ''}(-
                                                    {li.discountAmount.toLocaleString()} SAR)
                                                </span>
                                            )}
                                            <span>
                                                VAT {li.taxRate}% (+{li.taxAmount.toLocaleString()} SAR)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    {isProforma && !record.convertedToInvoiceId && onConvertToFinal && (
                        <button
                            type="button"
                            disabled={isConverting}
                            onClick={() => onConvertToFinal(record)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all me-auto"
                        >
                            <ArrowRightLeft
                                size={14}
                                className={isConverting ? 'animate-spin' : ''}
                            />
                            {isConverting
                                ? t('crm.commercial.invoices.viewDrawer.converting')
                                : t('crm.commercial.invoices.viewDrawer.convertAction')}
                        </button>
                    )}
                    {onPrintDocument && (
                        <button
                            type="button"
                            onClick={() => onPrintDocument(record)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2D3F2C] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#2D3F2C] cursor-pointer"
                        >
                            <Printer size={14} />
                            {t('crm.commercial.invoices.actions.printDocument')}
                        </button>
                    )}
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
