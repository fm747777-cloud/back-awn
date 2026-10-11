import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Receipt,
    CheckCircle2,
    Clock,
    Ban,
    Building2,
} from 'lucide-react';
import type {
    CrmContractRecord,
    CrmContractStatus,
} from '../../../schemas/crmSchema';

export interface ContractViewDrawerProps {
    isOpen: boolean;
    record: CrmContractRecord | null;
    isGeneratingInvoice?: boolean;
    onClose: () => void;
    onEdit: (record: CrmContractRecord) => void;
    onTransitionStatus: (id: string, status: CrmContractStatus) => void;
    onGenerateInvoice: (contractId: string) => void;
}

export const ContractViewDrawer: React.FC<ContractViewDrawerProps> = ({
    isOpen,
    record,
    isGeneratingInvoice = false,
    onClose,
    onEdit,
    onTransitionStatus,
    onGenerateInvoice,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-view-drawer-title"
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
                                {record.contractNumber}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                                    record.contractStatus === 'active'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E]'
                                        : record.contractStatus === 'under_review'
                                          ? 'bg-[#FDF3E7] text-[#B45309]'
                                          : record.contractStatus ===
                                                  'terminated' ||
                                              record.contractStatus === 'expired'
                                            ? 'bg-[#FCECE9] text-[#A63A3A]'
                                            : 'bg-slate-100 text-slate-700'
                                }`}
                            >
                                {t(
                                    `crm.commercial.contracts.statuses.${record.contractStatus}`
                                )}
                            </span>
                        </div>
                        <h2
                            id="contract-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl
                                ? record.titleAr || record.titleEn
                                : record.titleEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.commercial.contracts.viewDrawer.subtitle')}
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
                    {/* Quick Lifecycle & Invoice Generation */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                {record.contractStatus === 'draft' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'under_review'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <Clock size={13} />
                                        {t(
                                            'crm.commercial.contracts.viewDrawer.sendToReview'
                                        )}
                                    </button>
                                )}

                                {(record.contractStatus === 'draft' ||
                                    record.contractStatus ===
                                        'under_review') && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'active'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E6B4E] hover:bg-[#23533C] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <CheckCircle2 size={13} />
                                        {t(
                                            'crm.commercial.contracts.viewDrawer.activateContract'
                                        )}
                                    </button>
                                )}

                                {record.contractStatus === 'active' && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onTransitionStatus(
                                                record.id,
                                                'terminated'
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A63A3A]/30 bg-[#FCECE9] text-[#A63A3A] text-xs font-semibold cursor-pointer"
                                    >
                                        <Ban size={13} />
                                        {t(
                                            'crm.commercial.contracts.viewDrawer.terminateContract'
                                        )}
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={isGeneratingInvoice}
                                onClick={() => onGenerateInvoice(record.id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                                <Receipt size={14} />
                                {t(
                                    'crm.commercial.contracts.viewDrawer.generateInvoiceCta'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Contract Summary */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#2D3F2C]" />
                            <span>
                                {t('crm.commercial.contracts.viewDrawer.title')}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.contracts.form.companyLabel'
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
                                        'crm.commercial.contracts.form.totalValueLabel'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {record.totalValue.toLocaleString()} SAR
                                </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.contracts.columns.periodAndRenewal'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-semibold text-[#0D0D0D] block"
                                    dir="ltr"
                                >
                                    {record.startDate} → {record.endDate}
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t(
                                        `crm.commercial.contracts.renewalTypes.${record.renewalType}`
                                    )}
                                </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.commercial.contracts.form.quotationLabel'
                                    )}
                                </span>
                                <span className="font-mono font-semibold text-[#0D0D0D]">
                                    {record.quotationCode ||
                                        t(
                                            'crm.commercial.common.noLinkedQuotation'
                                        )}
                                </span>
                            </div>
                        </div>

                        {record.termsAndConditions && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D]">
                                <span className="font-bold block text-[11px] text-[#6E6862] mb-1">
                                    {t(
                                        'crm.commercial.contracts.form.termsLabel'
                                    )}
                                </span>
                                {record.termsAndConditions}
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
