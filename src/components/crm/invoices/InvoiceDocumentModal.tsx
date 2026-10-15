import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    Printer,
    Download,
    Building2,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRightLeft,
    ExternalLink,
    ShieldAlert,
} from 'lucide-react';
import { crmApi } from '../../../api/api';
import type { CrmInvoiceRecord } from '../../../schemas/crmSchema';

export interface InvoiceDocumentModalProps {
    isOpen: boolean;
    invoice: CrmInvoiceRecord | null;
    onClose: () => void;
    onNavigateToInvoice?: (invoiceId: string) => void;
}

export type DocumentLanguageMode = 'bilingual' | 'ar' | 'en';

export const InvoiceDocumentModal: React.FC<InvoiceDocumentModalProps> = ({
    isOpen,
    invoice,
    onClose,
    onNavigateToInvoice,
}) => {
    const { t, i18n } = useTranslation();
    const isAppRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [langMode, setLangMode] = useState<DocumentLanguageMode>('bilingual');
    const [downloadHint, setDownloadHint] = useState<string | null>(null);

    // Fetch the client company details to show available CR, VAT number, and contact info without inventing
    const { data: company } = useQuery({
        queryKey: ['crm', 'company', invoice?.companyId],
        queryFn: () => (invoice?.companyId ? crmApi.companies.getById(invoice.companyId) : null),
        enabled: isOpen && !!invoice?.companyId,
    });

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !invoice) return null;

    const isProforma =
        invoice.invoiceType === 'proforma' ||
        invoice.code?.startsWith('PI-') ||
        invoice.invoiceNumber?.startsWith('PI-');

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        setDownloadHint(
            t(
                'crm.commercial.invoices.document.savePdfHint',
                'Opening browser print dialog. Choose "Save as PDF" to download.'
            )
        );
        setTimeout(() => {
            window.print();
        }, 150);
        setTimeout(() => {
            setDownloadHint(null);
        }, 6000);
    };

    // Determine direction and labels according to selected language mode
    const docDir = langMode === 'ar' ? 'rtl' : langMode === 'en' ? 'ltr' : isAppRtl ? 'rtl' : 'ltr';

    // Fallback line items if none defined (for legacy invoices)
    const displayLineItems =
        invoice.lineItems && invoice.lineItems.length > 0
            ? invoice.lineItems
            : [
                  {
                      id: 'legacy-item-1',
                      descriptionEn: invoice.titleEn,
                      descriptionAr: invoice.titleAr || undefined,
                      quantity: 1,
                      unitPrice: invoice.subtotal,
                      discountPercent:
                          invoice.subtotal > 0
                              ? Math.round((invoice.discountTotal / invoice.subtotal) * 100)
                              : 0,
                      discountAmount: invoice.discountTotal,
                      taxableAmount: Math.max(0, invoice.subtotal - invoice.discountTotal),
                      taxRate: invoice.taxRate ?? 15,
                      taxAmount: invoice.taxAmount,
                      lineTotal: invoice.totalAmount,
                  },
              ];

    const hasAnyDiscount =
        invoice.discountTotal > 0 || displayLineItems.some((item) => (item.discountAmount ?? 0) > 0);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-document-title"
        >
            {/* Inline Print Stylesheet */}
            <style>
                {`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 14mm 14mm 14mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #0d0d0d !important;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-invoice-document,
                    #printable-invoice-document * {
                        visibility: visible !important;
                    }
                    #printable-invoice-document {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        background: #ffffff !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    table tr {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
                `}
            </style>

            {/* Floating Top Controls (Screen Only) */}
            <div className="no-print sticky top-2 z-20 w-full max-w-4xl mb-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isProforma
                                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
                                : 'bg-[#E9F5EE] text-[#2E6B4E] border border-[#2E6B4E]/30'
                        }`}
                    >
                        <FileText size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2
                                id="invoice-document-title"
                                className="text-sm font-bold text-[#0D0D0D]"
                            >
                                {t('crm.commercial.invoices.document.modalTitle')}
                            </h2>
                            <span
                                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    isProforma
                                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
                                        : 'bg-[#E9F5EE] text-[#2E6B4E] border border-[#2E6B4E]/30'
                                }`}
                                dir="ltr"
                            >
                                {invoice.invoiceNumber}
                            </span>
                        </div>
                        <p className="text-[11px] text-[#6E6862]">
                            {isProforma
                                ? t('crm.commercial.invoices.types.proforma')
                                : t('crm.commercial.invoices.types.final_tax')}
                        </p>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Language Switcher */}
                    <div className="inline-flex rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-1 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setLangMode('bilingual')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                langMode === 'bilingual'
                                    ? 'bg-white text-[#0D0D0D] shadow-xs font-semibold'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            {t('crm.commercial.invoices.document.langBilingual')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLangMode('ar')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                langMode === 'ar'
                                    ? 'bg-white text-[#0D0D0D] shadow-xs font-semibold'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            العربية
                        </button>
                        <button
                            type="button"
                            onClick={() => setLangMode('en')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                langMode === 'en'
                                    ? 'bg-white text-[#0D0D0D] shadow-xs font-semibold'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            English
                        </button>
                    </div>

                    {/* Print Button */}
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#2D3F2C] bg-[#2D3F2C] text-white hover:bg-[#233122] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        title={t('crm.commercial.invoices.document.printAction')}
                    >
                        <Printer size={15} />
                        <span>{t('crm.commercial.invoices.document.printAction')}</span>
                    </button>

                    {/* PDF Export Button (Native Print-to-PDF workflow) */}
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] bg-white text-[#0D0D0D] hover:bg-[#FAF8F5] text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        title={t('crm.commercial.invoices.document.savePdfHint')}
                    >
                        <Download size={15} className="text-[#2E6B4E]" />
                        <span>{t('crm.commercial.invoices.document.savePdfAction')}</span>
                    </button>

                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {downloadHint && (
                    <div className="w-full text-xs text-[#2E6B4E] bg-[#E9F5EE] border border-[#2E6B4E]/20 rounded-lg p-2 flex items-center gap-2">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <span>{downloadHint}</span>
                    </div>
                )}
            </div>

            {/* Document Paper Container */}
            <div
                id="printable-invoice-document"
                dir={docDir}
                className="w-full max-w-4xl bg-white text-[#0D0D0D] border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 sm:p-10 md:p-12 mb-8 print:p-0 print:border-none print:shadow-none print:rounded-none print:m-0"
            >
                {/* Document Header */}
                <div className="border-b-2 border-[#2D3F2C] pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Supplier Identity */}
                        <div className="flex items-start gap-3.5">
                            <div className="w-13 h-13 rounded-2xl bg-[#2D3F2C] text-white flex flex-col items-center justify-center font-bold tracking-wider shadow-sm shrink-0 border border-[#233122]">
                                <span className="text-base leading-none font-black">AWN</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#A8BCA1]">
                                    عون
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <h1 className="text-lg font-black tracking-tight text-[#0D0D0D]">
                                    {langMode === 'en'
                                        ? 'AWN Holding Ltd.'
                                        : langMode === 'ar'
                                          ? 'شركة عون القابضة'
                                          : 'شركة عون القابضة • AWN Holding Ltd.'}
                                </h1>
                                <p className="text-xs text-[#6E6862]">
                                    {langMode === 'en'
                                        ? 'AWN Enterprise Commercial & Administrative Platform'
                                        : langMode === 'ar'
                                          ? 'منصة عون الإدارية والتجارية للشركات'
                                          : 'منصة عون الإدارية والتجارية • Commercial & Enterprise Platform'}
                                </p>
                                {invoice.assignedEmployeeNameEn && (
                                    <p className="text-[11px] text-[#8C8479]">
                                        <span className="font-semibold">
                                            {langMode === 'ar'
                                                ? 'مسؤول الفوترة: '
                                                : 'Account Executive: '}
                                        </span>
                                        {langMode === 'ar'
                                            ? invoice.assignedEmployeeNameAr ||
                                              invoice.assignedEmployeeNameEn
                                            : invoice.assignedEmployeeNameEn}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Document Title & Invoice Number */}
                        <div className="text-start sm:text-end space-y-1">
                            <div
                                className={`inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase ${
                                    isProforma
                                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30'
                                        : 'bg-[#2D3F2C] text-white'
                                }`}
                            >
                                {isProforma ? (
                                    <span>
                                        {langMode === 'en'
                                            ? 'PROFORMA INVOICE'
                                            : langMode === 'ar'
                                              ? 'فاتورة أولية (شكلية)'
                                              : 'فاتورة أولية (شكلية) | PROFORMA INVOICE'}
                                    </span>
                                ) : (
                                    <span>
                                        {langMode === 'en'
                                            ? 'FINAL TAX INVOICE'
                                            : langMode === 'ar'
                                              ? 'فاتورة ضريبية نهائية'
                                              : 'فاتورة ضريبية نهائية | FINAL TAX INVOICE'}
                                    </span>
                                )}
                            </div>

                            <div className="font-mono text-xl font-black text-[#0D0D0D]" dir="ltr">
                                {invoice.invoiceNumber}
                            </div>

                            <div className="flex items-center sm:justify-end gap-2 text-xs font-medium text-[#6E6862]">
                                <span>
                                    {langMode === 'ar' ? 'الحالة: ' : 'Status: '}
                                    <strong
                                        className={
                                            invoice.invoiceStatus === 'paid'
                                                ? 'text-[#2E6B4E]'
                                                : invoice.invoiceStatus === 'partially_paid'
                                                  ? 'text-[#0891B2]'
                                                  : invoice.invoiceStatus === 'overdue'
                                                    ? 'text-[#A63A3A]'
                                                    : 'text-[#B45309]'
                                        }
                                    >
                                        {t(`crm.commercial.invoices.statuses.${invoice.invoiceStatus}`)}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prominent Distinction Notice */}
                {isProforma ? (
                    <div className="mb-6 rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-3.5 text-xs text-[#92400E] flex items-start gap-2.5 print-break-inside-avoid">
                        <ShieldAlert size={17} className="shrink-0 mt-0.5 text-[#D97706]" />
                        <div className="space-y-1">
                            <p className="font-bold">
                                {langMode === 'en'
                                    ? 'PRELIMINARY PROFORMA INVOICE'
                                    : langMode === 'ar'
                                      ? 'تنبيه: فاتورة شكلية مبدئية'
                                      : 'فاتورة شكلية مبدئية | PROFORMA INVOICE NOTICE'}
                            </p>
                            <p className="text-[11px] leading-relaxed text-[#78350F]">
                                {langMode === 'en'
                                    ? t('crm.commercial.invoices.document.proformaNoticeEn')
                                    : langMode === 'ar'
                                      ? t('crm.commercial.invoices.document.proformaNoticeAr')
                                      : `${t('crm.commercial.invoices.document.proformaNoticeAr')} • ${t('crm.commercial.invoices.document.proformaNoticeEn')}`}
                            </p>
                            {invoice.convertedToInvoiceNumber && (
                                <div className="mt-2 pt-2 border-t border-[#F59E0B]/30 flex items-center justify-between">
                                    <span className="font-semibold text-[#92400E]">
                                        {langMode === 'ar'
                                            ? `تم تحويل هذه الفاتورة الشكلية إلى فاتورة ضريبية رسمية: ${invoice.convertedToInvoiceNumber}`
                                            : `Converted to Final Tax Invoice: ${invoice.convertedToInvoiceNumber}`}
                                    </span>
                                    {invoice.convertedToInvoiceId && onNavigateToInvoice && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onNavigateToInvoice(invoice.convertedToInvoiceId!)
                                            }
                                            className="no-print inline-flex items-center gap-1 text-[11px] text-[#6D28D9] font-bold hover:underline cursor-pointer"
                                        >
                                            <ExternalLink size={12} />
                                            <span>
                                                {t(
                                                    'crm.commercial.invoices.viewDrawer.viewFinalInvoice'
                                                )}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 rounded-xl border border-[#2E6B4E]/20 bg-[#F4FAF6] p-3.5 text-xs text-[#2E6B4E] flex items-start gap-2.5 print-break-inside-avoid">
                        <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-[#2E6B4E]" />
                        <div className="space-y-1">
                            <p className="font-bold">
                                {langMode === 'en'
                                    ? 'OFFICIAL FINAL TAX INVOICE'
                                    : langMode === 'ar'
                                      ? 'فاتورة ضريبية تجارية رسمية'
                                      : 'فاتورة ضريبية تجارية رسمية | FINAL TAX INVOICE'}
                            </p>
                            <p className="text-[11px] leading-relaxed text-[#1F4B36]">
                                {langMode === 'en'
                                    ? t('crm.commercial.invoices.document.finalTaxNoticeEn')
                                    : langMode === 'ar'
                                      ? t('crm.commercial.invoices.document.finalTaxNoticeAr')
                                      : `${t('crm.commercial.invoices.document.finalTaxNoticeAr')} • ${t('crm.commercial.invoices.document.finalTaxNoticeEn')}`}
                            </p>
                            {invoice.sourceProformaInvoiceNumber && (
                                <div className="mt-2 pt-2 border-t border-[#2E6B4E]/20 flex items-center justify-between">
                                    <span className="font-semibold text-[#1F4B36]">
                                        {langMode === 'ar'
                                            ? `صادرة استناداً إلى الفاتورة الشكلية المعتمدة: ${invoice.sourceProformaInvoiceNumber}`
                                            : `Issued based on approved Proforma reference: ${invoice.sourceProformaInvoiceNumber}`}
                                    </span>
                                    {invoice.sourceProformaInvoiceId && onNavigateToInvoice && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onNavigateToInvoice(
                                                    invoice.sourceProformaInvoiceId!
                                                )
                                            }
                                            className="no-print inline-flex items-center gap-1 text-[11px] text-[#2E6B4E] font-bold hover:underline cursor-pointer"
                                        >
                                            <ExternalLink size={12} />
                                            <span>
                                                {t(
                                                    'crm.commercial.invoices.viewDrawer.viewSourceProforma'
                                                )}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Metadata 3-Column Box */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] mb-6 text-xs print-break-inside-avoid">
                    {/* Billed Customer */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6862] block border-b border-[#E5E0D8] pb-1">
                            {langMode === 'ar'
                                ? 'العميل المفوتر'
                                : langMode === 'en'
                                  ? 'BILLED CUSTOMER'
                                  : 'العميل المفوتر • BILLED CUSTOMER'}
                        </span>
                        <div className="font-bold text-[#0D0D0D] text-sm">
                            {langMode === 'ar'
                                ? invoice.companyNameAr || invoice.companyNameEn
                                : invoice.companyNameEn}
                        </div>
                        {company?.businessName && (
                            <div className="text-[11px] text-[#6E6862]">
                                {company.businessName}
                            </div>
                        )}
                        {company?.crNumber && (
                            <div className="text-[11px] font-mono">
                                <span className="text-[#6E6862] font-sans">
                                    {langMode === 'ar' ? 'السجل التجاري: ' : 'CR #: '}
                                </span>
                                <span className="font-bold text-[#0D0D0D]" dir="ltr">
                                    {company.crNumber}
                                </span>
                            </div>
                        )}
                        {company?.taxNumber && (
                            <div className="text-[11px] font-mono">
                                <span className="text-[#6E6862] font-sans">
                                    {langMode === 'ar' ? 'الرقم الضريبي: ' : 'VAT ID: '}
                                </span>
                                <span className="font-bold text-[#0D0D0D]" dir="ltr">
                                    {company.taxNumber}
                                </span>
                            </div>
                        )}
                        {company?.address && (
                            <div className="text-[11px] text-[#6E6862]">
                                {company.address}
                                {company.city ? `, ${company.city}` : ''}
                                {company.country ? `, ${company.country}` : ''}
                            </div>
                        )}
                        {(company?.phone || company?.email) && (
                            <div className="text-[11px] text-[#6E6862] font-mono" dir="ltr">
                                {company.phone ? company.phone : ''}
                                {company.phone && company.email ? ' • ' : ''}
                                {company.email ? company.email : ''}
                            </div>
                        )}
                    </div>

                    {/* Invoice Dates & Settlement Schedule */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6862] block border-b border-[#E5E0D8] pb-1">
                            {langMode === 'ar'
                                ? 'تواريخ الفوترة'
                                : langMode === 'en'
                                  ? 'INVOICE DATES'
                                  : 'تواريخ الفوترة • INVOICE DATES'}
                        </span>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#6E6862]">
                                {langMode === 'ar' ? 'تاريخ الإصدار:' : 'Issue Date:'}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                {invoice.issueDate}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#6E6862]">
                                {langMode === 'ar' ? 'تاريخ الاستحقاق:' : 'Payment Due Date:'}
                            </span>
                            <span className="font-mono font-bold text-[#A63A3A]" dir="ltr">
                                {invoice.dueDate}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#6E6862]">
                                {langMode === 'ar' ? 'العملة:' : 'Currency:'}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                {invoice.currency || 'SAR'}
                            </span>
                        </div>
                        {invoice.paymentMethod && (
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#6E6862]">
                                    {langMode === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}
                                </span>
                                <span className="text-[#0D0D0D] font-medium">
                                    {invoice.paymentMethod}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Commercial References */}
                    <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6862] block border-b border-[#E5E0D8] pb-1">
                            {langMode === 'ar'
                                ? 'المراجع والمستندات'
                                : langMode === 'en'
                                  ? 'REFERENCES'
                                  : 'المراجع والمستندات • REFERENCES'}
                        </span>
                        {invoice.contractNumber && (
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#6E6862]">
                                    {langMode === 'ar' ? 'رقم العقد:' : 'Contract Ref:'}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                    {invoice.contractNumber}
                                </span>
                            </div>
                        )}
                        {invoice.quotationCode && (
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#6E6862]">
                                    {langMode === 'ar' ? 'عرض السعر:' : 'Quotation Ref:'}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                    {invoice.quotationCode}
                                </span>
                            </div>
                        )}
                        {invoice.dealTitle && (
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#6E6862]">
                                    {langMode === 'ar' ? 'الصفقة:' : 'Deal:'}
                                </span>
                                <span className="text-[#0D0D0D] truncate max-w-[150px]">
                                    {invoice.dealTitle}
                                </span>
                            </div>
                        )}
                        {invoice.contactName && (
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[#6E6862]">
                                    {langMode === 'ar' ? 'المسؤول:' : 'Contact:'}
                                </span>
                                <span className="text-[#0D0D0D] font-medium">
                                    {invoice.contactName}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6 overflow-hidden rounded-xl border border-[#E5E0D8]">
                    <table className="w-full text-xs text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#0D0D0D] font-bold">
                                <th className="py-2.5 px-3 text-start w-10">
                                    {langMode === 'ar' ? 'م' : '#'}
                                </th>
                                <th className="py-2.5 px-3 text-start">
                                    {langMode === 'ar'
                                        ? 'الوصف والخدمة'
                                        : langMode === 'en'
                                          ? 'Item & Description'
                                          : 'الوصف والخدمة • Item & Description'}
                                </th>
                                <th className="py-2.5 px-3 text-center w-16">
                                    {langMode === 'ar' ? 'الكمية' : 'Qty'}
                                </th>
                                <th className="py-2.5 px-3 text-end w-24">
                                    {langMode === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                                </th>
                                {hasAnyDiscount && (
                                    <th className="py-2.5 px-3 text-end w-20">
                                        {langMode === 'ar' ? 'الخصم' : 'Discount'}
                                    </th>
                                )}
                                <th className="py-2.5 px-3 text-end w-24">
                                    {langMode === 'ar' ? 'الخاضع للضريبة' : 'Taxable'}
                                </th>
                                <th className="py-2.5 px-3 text-end w-20">
                                    {langMode === 'ar' ? 'الضريبة' : 'VAT'}
                                </th>
                                <th className="py-2.5 px-3 text-end w-28">
                                    {langMode === 'ar' ? 'الإجمالي (ر.س)' : 'Total (SAR)'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E0D8]">
                            {displayLineItems.map((item, idx) => (
                                <tr
                                    key={item.id || idx}
                                    className="hover:bg-[#FAF8F5]/60 transition-colors"
                                >
                                    <td className="py-3 px-3 font-mono text-[#6E6862] text-start">
                                        {idx + 1}
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="font-semibold text-[#0D0D0D] text-[13px] leading-snug">
                                            {langMode === 'ar'
                                                ? item.descriptionAr || item.descriptionEn
                                                : langMode === 'en'
                                                  ? item.descriptionEn
                                                  : item.descriptionAr &&
                                                      item.descriptionAr !== item.descriptionEn
                                                    ? `${item.descriptionAr} (${item.descriptionEn})`
                                                    : item.descriptionEn}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono font-bold text-[#0D0D0D]">
                                        {item.quantity}
                                    </td>
                                    <td
                                        className="py-3 px-3 text-end font-mono text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {item.unitPrice.toLocaleString()}
                                    </td>
                                    {hasAnyDiscount && (
                                        <td
                                            className="py-3 px-3 text-end font-mono text-[#A63A3A]"
                                            dir="ltr"
                                        >
                                            {item.discountAmount && item.discountAmount > 0
                                                ? `-${item.discountAmount.toLocaleString()}`
                                                : '—'}
                                        </td>
                                    )}
                                    <td
                                        className="py-3 px-3 text-end font-mono text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {item.taxableAmount.toLocaleString()}
                                    </td>
                                    <td
                                        className="py-3 px-3 text-end font-mono text-[#6E6862]"
                                        dir="ltr"
                                    >
                                        {item.taxRate}%
                                        <div className="text-[10px] text-[#2E6B4E]">
                                            +{item.taxAmount.toLocaleString()}
                                        </div>
                                    </td>
                                    <td
                                        className="py-3 px-3 text-end font-mono font-bold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {item.lineTotal.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Summary & Settlement Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print-break-inside-avoid">
                    {/* Notes & Settlement details */}
                    <div className="space-y-3">
                        {invoice.notes && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1 text-xs">
                                <span className="font-bold text-[#0D0D0D] block">
                                    {langMode === 'ar'
                                        ? 'ملاحظات الفوترة والشروط:'
                                        : 'Billing Notes & Terms:'}
                                </span>
                                <p className="text-[#6E6862] leading-relaxed whitespace-pre-wrap">
                                    {invoice.notes}
                                </p>
                            </div>
                        )}

                        {/* Payment Settlement Information (For Final Tax Invoice) */}
                        {!isProforma && (
                            <div className="p-3.5 rounded-xl bg-[#E9F5EE]/40 border border-[#2E6B4E]/20 space-y-2 text-xs">
                                <div className="flex items-center justify-between border-b border-[#2E6B4E]/20 pb-1.5">
                                    <span className="font-bold text-[#2E6B4E]">
                                        {langMode === 'ar'
                                            ? 'حالة السداد والتحصيل'
                                            : 'Settlement Status'}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                            invoice.remainingAmount === 0
                                                ? 'bg-[#2E6B4E] text-white'
                                                : invoice.paidAmount > 0
                                                  ? 'bg-[#0891B2] text-white'
                                                  : 'bg-[#B45309] text-white'
                                        }`}
                                    >
                                        {t(
                                            `crm.commercial.invoices.statuses.${invoice.invoiceStatus}`
                                        )}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <div>
                                        <span className="text-[#6E6862] block">
                                            {langMode === 'ar'
                                                ? 'المبلغ المسدد:'
                                                : 'Paid to Date:'}
                                        </span>
                                        <span
                                            className="font-mono font-bold text-[#2E6B4E] text-sm"
                                            dir="ltr"
                                        >
                                            {invoice.paidAmount.toLocaleString()} SAR
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[#6E6862] block">
                                            {langMode === 'ar'
                                                ? 'المتبقي المستحق:'
                                                : 'Balance Due:'}
                                        </span>
                                        <span
                                            className={`font-mono font-bold text-sm ${
                                                invoice.remainingAmount > 0
                                                    ? 'text-[#A63A3A]'
                                                    : 'text-[#2E6B4E]'
                                            }`}
                                            dir="ltr"
                                        >
                                            {invoice.remainingAmount.toLocaleString()} SAR
                                        </span>
                                    </div>
                                </div>
                                {invoice.paymentReference && (
                                    <div className="text-[11px] font-mono pt-1 text-[#0D0D0D]" dir="ltr">
                                        <span className="text-[#6E6862] font-sans">Ref: </span>
                                        {invoice.paymentReference}
                                        {invoice.paidAt ? ` (${invoice.paidAt})` : ''}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Totals Table */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#6E6862]">
                            <span>
                                {langMode === 'ar'
                                    ? 'المجموع الفرعي (قبل الضريبة):'
                                    : 'Subtotal (Excl. VAT):'}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                {invoice.subtotal.toLocaleString()} SAR
                            </span>
                        </div>

                        {invoice.discountTotal > 0 && (
                            <div className="flex items-center justify-between text-[#A63A3A]">
                                <span>
                                    {langMode === 'ar' ? 'إجمالي الخصم:' : 'Total Discount:'}
                                </span>
                                <span className="font-mono font-bold" dir="ltr">
                                    -{invoice.discountTotal.toLocaleString()} SAR
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-[#6E6862]">
                            <span>
                                {langMode === 'ar'
                                    ? 'المبلغ الخاضع للضريبة:'
                                    : 'Taxable Amount:'}
                            </span>
                            <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                {Math.max(
                                    0,
                                    invoice.subtotal - invoice.discountTotal
                                ).toLocaleString()}{' '}
                                SAR
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-[#2E6B4E]">
                            <span>
                                {langMode === 'ar'
                                    ? `ضريبة القيمة المضافة (${invoice.taxRate ?? 15}%):`
                                    : `Value Added Tax (${invoice.taxRate ?? 15}%):`}
                            </span>
                            <span className="font-mono font-bold" dir="ltr">
                                +{invoice.taxAmount.toLocaleString()} SAR
                            </span>
                        </div>

                        <div className="border-t-2 border-[#2D3F2C] pt-2 mt-2 flex items-center justify-between">
                            <span className="text-sm font-black text-[#0D0D0D]">
                                {langMode === 'ar'
                                    ? 'الإجمالي المستحق (شامل الضريبة):'
                                    : 'Grand Total (Incl. VAT):'}
                            </span>
                            <span
                                className="font-mono text-base font-black text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {invoice.totalAmount.toLocaleString()} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Authentication Stamp */}
                <div className="pt-6 border-t border-[#E5E0D8] grid grid-cols-2 gap-8 text-xs text-[#6E6862] print-break-inside-avoid">
                    <div className="space-y-8">
                        <div>
                            <span className="font-bold text-[#0D0D0D] block">
                                {langMode === 'ar'
                                    ? 'جهة الإصدار المعتمدة (شركة عون القابضة)'
                                    : 'Authorized Issuer (AWN Holding Ltd.)'}
                            </span>
                            <span className="text-[11px]">
                                {langMode === 'ar'
                                    ? 'التوقيع والختم الإداري الرسمي'
                                    : 'Official Signature & Corporate Seal'}
                            </span>
                        </div>
                        <div className="pt-4 border-b border-dashed border-[#8C8479] w-48"></div>
                    </div>

                    <div className="space-y-8 text-end">
                        <div>
                            <span className="font-bold text-[#0D0D0D] block">
                                {langMode === 'ar'
                                    ? 'اعتماد واستلام العميل'
                                    : 'Customer Acknowledgment & Acceptance'}
                            </span>
                            <span className="text-[11px]">
                                {invoice.companyNameEn}
                            </span>
                        </div>
                        <div className="pt-4 border-b border-dashed border-[#8C8479] w-48 ms-auto"></div>
                    </div>
                </div>

                {/* Footer Legal & Generation Notice */}
                <div className="mt-8 pt-4 border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#8C8479] text-center sm:text-start print-break-inside-avoid">
                    <div>
                        {t('crm.commercial.invoices.document.electronicDocumentNotice')}
                    </div>
                    <div className="font-mono" dir="ltr">
                        AWN-INV-DOC • Generated: {new Date().toISOString().split('T')[0]}
                    </div>
                </div>
            </div>
        </div>
    );
};
