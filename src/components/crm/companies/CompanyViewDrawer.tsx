import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    Edit3,
    Building2,
    FileText,
    Users,
    Crown,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    ShieldAlert,
    Link2,
} from 'lucide-react';
import type { CrmCompanyRecord } from '../../../schemas/crmSchema';
import { crmApi, type CrmDeletionEligibilityResult } from '../../../api/api';

export interface CompanyViewDrawerProps {
    isOpen: boolean;
    record: CrmCompanyRecord | null;
    eligibility?: CrmDeletionEligibilityResult | null;
    onClose: () => void;
    onEdit: (record: CrmCompanyRecord) => void;
}

export const CompanyViewDrawer: React.FC<CompanyViewDrawerProps> = ({
    isOpen,
    record,
    eligibility,
    onClose,
    onEdit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');
    const navigate = useNavigate();

    const { data: originatingLead, isLoading: isLeadLoading } = useQuery({
        queryKey: ['crm', 'leads', record?.leadId],
        queryFn: () => (record?.leadId ? crmApi.leads.getById(record.leadId) : null),
        enabled: Boolean(isOpen && record?.leadId),
        retry: false,
    });

    if (!isOpen || !record) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-semibold text-[#037F8C]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                    record.status === 'active'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                        : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                }`}
                            >
                                {record.status === 'active'
                                    ? t('crm.customer.common.active')
                                    : t('crm.customer.common.inactive')}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#EEF2FF] text-[#3730A3] border border-[#3730A3]/20 text-xs font-semibold">
                                {t(
                                    `crm.customer.companies.onboardingStatuses.${record.onboardingStatus}`,
                                    { defaultValue: record.onboardingStatus }
                                )}
                            </span>
                            {record.leadId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        navigate(
                                            `/crm/leads?search=${originatingLead?.code || record.leadId}`
                                        );
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#037F8C]/10 border border-[#037F8C]/20 text-xs font-mono font-bold text-[#037F8C] hover:bg-[#037F8C]/20 transition-colors cursor-pointer"
                                    title={t(
                                        'crm.customer.companies.viewDrawer.viewOriginatingLead'
                                    )}
                                >
                                    <Link2 size={11} className="text-[#037F8C]" />
                                    <span>
                                        {originatingLead?.code ||
                                            (isLeadLoading ? '...' : record.leadId)}
                                    </span>
                                </button>
                            )}
                        </div>
                        <h2
                            id="company-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {isRtl ? record.nameAr : record.nameEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {isRtl ? record.nameEn : record.nameAr}{' '}
                            {record.businessName ? `• ${record.businessName}` : ''}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Originating Lead Card */}
                    {record.leadId && (
                        <div className="rounded-xl border border-[#037F8C]/20 bg-[#037F8C]/5 p-3.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Link2 size={15} className="text-[#037F8C] shrink-0" />
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-[#6E6862]">
                                            {t(
                                                'crm.customer.companies.viewDrawer.originatingLeadTitle'
                                            )}:
                                        </span>
                                        {originatingLead ? (
                                            <span
                                                className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] font-mono text-[11px] font-bold text-[#037F8C] shrink-0"
                                                dir="ltr"
                                            >
                                                {originatingLead.code}
                                            </span>
                                        ) : isLeadLoading ? (
                                            <span className="font-mono text-[11px] text-[#6E6862] animate-pulse">
                                                ...
                                            </span>
                                        ) : (
                                            <span
                                                className="font-mono text-[11px] text-[#6E6862]"
                                                dir="ltr"
                                            >
                                                {record.leadId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[#0D0D0D] font-semibold truncate">
                                        {originatingLead
                                            ? originatingLead.title
                                            : isLeadLoading
                                              ? t('crm.customer.common.loading', 'Loading...')
                                              : t(
                                                    'crm.customer.companies.viewDrawer.leadArchivedNotice',
                                                    { leadId: record.leadId }
                                                )}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate(
                                        `/crm/leads?search=${originatingLead?.code || record.leadId}`
                                    );
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] hover:bg-[#FAF8F5] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer shrink-0 shadow-xs"
                            >
                                <Link2 size={12} />
                                <span>
                                    {t(
                                        'crm.customer.companies.viewDrawer.viewOriginatingLead'
                                    )}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Step 1 Summary: Basic Info */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                            <Building2 size={14} />
                            <span>{t('crm.customer.companies.wizard.step1Title')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.companies.wizard.orgTypeLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.organizationalTypeNameAr ||
                                          record.organizationalTypeNameEn
                                        : record.organizationalTypeNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.companies.wizard.sectorLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.sectorNameAr || record.sectorNameEn
                                        : record.sectorNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center gap-1.5 font-mono" dir="ltr">
                                <Phone size={12} className="text-[#037F8C]" />
                                <span>{record.phone}</span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center gap-1.5 font-mono" dir="ltr">
                                <Mail size={12} className="text-[#037F8C]" />
                                <span className="truncate">{record.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 Summary: Business & Legal Info */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                            <FileText size={14} />
                            <span>{t('crm.customer.companies.wizard.step2Title')}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.companies.wizard.crNumberLabel')}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                    {record.crNumber || t('crm.customer.common.notProvided')}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t(
                                        'crm.customer.companies.wizard.unifiedNumberLabel'
                                    )}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                    {record.unifiedNumber ||
                                        t('crm.customer.common.notProvided')}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.companies.wizard.taxNumberLabel')}
                                </span>
                                <span className="font-mono font-bold text-[#0D0D0D]" dir="ltr">
                                    {record.taxNumber ||
                                        t('crm.customer.common.notProvided')}
                                </span>
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs flex items-center gap-2">
                            <MapPin size={13} className="text-[#037F8C] shrink-0" />
                            <span>
                                {[
                                    record.address,
                                    record.city,
                                    record.state,
                                    record.country,
                                ]
                                    .filter(Boolean)
                                    .join(' • ') || t('crm.customer.common.notProvided')}
                            </span>
                        </div>
                    </div>

                    {/* Step 3 Summary: Owners & Shareholders */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                                <Users size={14} />
                                <span>
                                    {t('crm.customer.companies.wizard.step3Title')} (
                                    {record.owners.length})
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {record.owners.map((owner, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 text-xs"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#0D0D0D]">
                                                {isRtl
                                                    ? owner.fullNameAr || owner.fullNameEn
                                                    : owner.fullNameEn}
                                            </span>
                                            {owner.isMainOwner && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#037F8C] text-white text-[10px] font-semibold">
                                                    <Crown size={10} />
                                                    {t(
                                                        'crm.customer.companies.wizard.mainOwnerBadge'
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[#6E6862] mt-0.5">
                                            {isRtl
                                                ? owner.ownershipTypeNameAr ||
                                                  owner.ownershipTypeNameEn
                                                : owner.ownershipTypeNameEn}{' '}
                                            • {owner.nationality || 'Saudi'} •{' '}
                                            <span className="font-mono" dir="ltr">
                                                {owner.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E0D8] font-mono font-bold text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        {owner.ownershipPercentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Referential Integrity */}
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
                                            <Link2 size={11} className="text-[#037F8C]" />
                                            {ref}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.customer.common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.customer.common.editRecord')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default CompanyViewDrawer;
