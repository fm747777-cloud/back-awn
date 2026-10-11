import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Phone,
    Mail,
    Building2,
    Star,
    ShieldCheck,
    ShieldAlert,
    Link2,
} from 'lucide-react';
import type { CrmContactRecord } from '../../../schemas/crmSchema';
import type { CrmDeletionEligibilityResult } from '../../../api/api';

export interface ContactViewDrawerProps {
    isOpen: boolean;
    record: CrmContactRecord | null;
    eligibility?: CrmDeletionEligibilityResult | null;
    onClose: () => void;
    onEdit: (record: CrmContactRecord) => void;
}

export const ContactViewDrawer: React.FC<ContactViewDrawerProps> = ({
    isOpen,
    record,
    eligibility,
    onClose,
    onEdit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                            {record.isPrimary && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF3E7] text-[#B45309] border border-[#B45309]/20 text-xs font-semibold">
                                    <Star size={11} />
                                    {t('crm.customer.contacts.primaryBadge')}
                                </span>
                            )}
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                    record.status === 'active'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                        : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                }`}
                            >
                                {record.status === 'active'
                                    ? t('crm.customer.common.active')
                                    : t('crm.customer.common.inactive')}
                            </span>
                        </div>
                        <h2
                            id="contact-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl ? record.fullNameAr : record.fullNameEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {isRtl ? record.fullNameEn : record.fullNameAr}{' '}
                            {record.jobTitle ? `• ${record.jobTitle}` : ''}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.contacts.form.contactTypeLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.contactType || 'primary'}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.contacts.form.departmentLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.department ||
                                        t('crm.customer.common.notProvided')}
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <div className="flex items-center gap-2 font-mono text-[#0D0D0D]" dir="ltr">
                                <Mail size={13} className="text-[#2D3F2C]" />
                                <span>{record.email}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[#0D0D0D]" dir="ltr">
                                <Phone size={13} className="text-[#2D3F2C]" />
                                <span>{record.phone}</span>
                                {record.secondaryPhone && (
                                    <span className="text-[#6E6862]">
                                        • {record.secondaryPhone}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[#0D0D0D]">
                                <Building2 size={13} className="text-[#2D3F2C]" />
                                <span>
                                    {isRtl
                                        ? record.companyNameAr || record.companyNameEn
                                        : record.companyNameEn ||
                                          t('crm.customer.contacts.form.noCompany')}
                                </span>
                            </div>
                            {record.leadTitle && (
                                <div className="text-[11px] text-[#6E6862]">
                                    Lead: {record.leadTitle}
                                </div>
                            )}
                        </div>

                        {record.notes && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#45413C]">
                                {record.notes}
                            </div>
                        )}
                    </div>

                    {eligibility && (
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                {eligibility.canDelete ? (
                                    <ShieldCheck size={15} className="text-[#2E6B4E]" />
                                ) : (
                                    <ShieldAlert size={15} className="text-[#B45309]" />
                                )}
                                <span className="text-xs font-semibold text-[#0D0D0D]">
                                    {eligibility.canDelete
                                        ? t('crm.customer.common.safeToDelete')
                                        : t('crm.customer.common.protectedRecord')}
                                </span>
                            </div>
                            {eligibility.referencedBy.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {eligibility.referencedBy.map((ref, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono text-[#0D0D0D]"
                                            dir="ltr"
                                        >
                                            <Link2 size={11} className="text-[#2D3F2C]" />
                                            {ref}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.customer.common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.customer.common.editRecord')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ContactViewDrawer;
