import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Pencil,
    Power,
    Calendar,
    User,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Link2,
} from 'lucide-react';
import type { CrmRecordStatus } from '../../../schemas/crmSchema';
import type { CrmDeletionEligibilityResult } from '../../../api/api';

export interface CrmMasterDetailAttribute {
    label: string;
    value: React.ReactNode;
}

export interface CrmMasterViewDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    record: {
        id: string;
        code: string;
        nameEn: string;
        nameAr: string;
        descriptionEn?: string;
        descriptionAr?: string;
        status: CrmRecordStatus;
        createdAt: string;
        updatedAt?: string;
        createdBy: string;
    } | null;
    entityTitle: string;
    eligibility?: CrmDeletionEligibilityResult;
    extraAttributes?: CrmMasterDetailAttribute[];
    disableStatusToggle?: boolean;
    onEdit: () => void;
    onToggleStatus: () => void;
}

export const CrmMasterViewDrawer: React.FC<CrmMasterViewDrawerProps> = ({
    isOpen,
    onClose,
    record,
    entityTitle,
    eligibility,
    extraAttributes = [],
    disableStatusToggle = false,
    onEdit,
    onToggleStatus,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    const isActive = record.status === 'active';
    const canDelete = eligibility ? eligibility.canDelete : true;
    const referencedBy = eligibility?.referencedBy || [];

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-master-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="fixed top-0 end-0 h-full w-full max-w-lg bg-white border-s border-[#E5E0D8] shadow-2xl flex flex-col text-start z-10">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {record.code}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                    isActive
                                        ? 'bg-[#265938]/10 text-[#265938] border-[#265938]/25'
                                        : 'bg-[#857E74]/12 text-[#6E6862] border-[#857E74]/30'
                                }`}
                            >
                                {isActive ? (
                                    <CheckCircle2 size={12} />
                                ) : (
                                    <XCircle size={12} />
                                )}
                                <span>
                                    {isActive
                                        ? t('crm.master.common.active')
                                        : t('crm.master.common.inactive')}
                                </span>
                            </span>
                        </div>
                        <h2
                            id="crm-master-view-drawer-title"
                            className="text-base font-bold text-[#0D0D0D] mt-1.5"
                        >
                            {isRtl ? record.nameAr : record.nameEn}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {entityTitle} — {t('crm.master.viewDrawer.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.master.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Bilingual Names */}
                    <section className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/60 p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6862]">
                            {t('crm.master.viewDrawer.bilingualNames')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg border border-[#E5E0D8] p-3">
                                <span className="text-[11px] font-medium text-[#857E74] block">
                                    {t('crm.master.columns.nameEn')}
                                </span>
                                <p
                                    className="text-xs font-semibold text-[#0D0D0D] mt-1 break-words"
                                    dir="ltr"
                                >
                                    {record.nameEn}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg border border-[#E5E0D8] p-3">
                                <span className="text-[11px] font-medium text-[#857E74] block">
                                    {t('crm.master.columns.nameAr')}
                                </span>
                                <p
                                    className="text-xs font-semibold text-[#0D0D0D] mt-1 break-words"
                                    dir="rtl"
                                >
                                    {record.nameAr}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Domain Configuration Attributes */}
                    {extraAttributes.length > 0 && (
                        <section className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6862]">
                                {t('crm.master.viewDrawer.configuration')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {extraAttributes.map((attr, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]/60 p-3"
                                    >
                                        <span className="text-[11px] font-medium text-[#857E74] block">
                                            {attr.label}
                                        </span>
                                        <div className="mt-1.5 text-xs font-semibold text-[#0D0D0D]">
                                            {attr.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Bilingual Descriptions */}
                    <section className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6862]">
                            {t('crm.master.viewDrawer.descriptions')}
                        </h3>
                        <div className="space-y-2.5">
                            <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]/50 p-3">
                                <span className="text-[11px] font-medium text-[#857E74] block">
                                    {t('crm.master.form.descriptionEnLabel')}
                                </span>
                                <p
                                    className="text-xs text-[#0D0D0D] mt-1 leading-relaxed"
                                    dir="ltr"
                                >
                                    {record.descriptionEn || t('crm.master.common.noDescription')}
                                </p>
                            </div>
                            <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]/50 p-3">
                                <span className="text-[11px] font-medium text-[#857E74] block">
                                    {t('crm.master.form.descriptionArLabel')}
                                </span>
                                <p
                                    className="text-xs text-[#0D0D0D] mt-1 leading-relaxed"
                                    dir="rtl"
                                >
                                    {record.descriptionAr || t('crm.master.common.noDescription')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Referential Integrity & Usage */}
                    <section className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6862]">
                                {t('crm.master.viewDrawer.referentialIntegrity')}
                            </h3>
                            <span
                                className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {referencedBy.length}
                            </span>
                        </div>

                        <div
                            className={`rounded-lg border p-3 flex items-start gap-2.5 ${
                                canDelete
                                    ? 'bg-[#EAF3EC] border-[#C5DFCC] text-[#265938]'
                                    : 'bg-[#FDF3E7] border-[#E5D0B1] text-[#8C541D]'
                            }`}
                        >
                            {canDelete ? (
                                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            )}
                            <p className="text-xs leading-relaxed">
                                {canDelete
                                    ? t('crm.master.viewDrawer.canBeDeleted')
                                    : isRtl
                                      ? eligibility?.reasonAr ||
                                        t('crm.master.viewDrawer.protectedFromDelete')
                                      : eligibility?.reasonEn ||
                                        t('crm.master.viewDrawer.protectedFromDelete')}
                            </p>
                        </div>

                        {referencedBy.length > 0 && (
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-medium text-[#6E6862] block">
                                    {t('crm.master.viewDrawer.referencedByList')}
                                </span>
                                <ul className="space-y-1 max-h-36 overflow-y-auto">
                                    {referencedBy.map((refItem, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                            dir="ltr"
                                        >
                                            <Link2 size={12} className="text-[#2D3F2C] shrink-0" />
                                            <span className="truncate">{refItem}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Audit & Lifecycle Metadata */}
                    <section className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/60 p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6E6862]">
                            {t('crm.master.viewDrawer.metadata')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2.5 bg-white rounded-lg border border-[#E5E0D8] p-3">
                                <User size={15} className="text-[#2D3F2C] shrink-0" />
                                <div>
                                    <span className="text-[11px] text-[#857E74] block">
                                        {t('crm.master.columns.creator')}
                                    </span>
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {record.createdBy}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 bg-white rounded-lg border border-[#E5E0D8] p-3">
                                <Calendar size={15} className="text-[#2D3F2C] shrink-0" />
                                <div>
                                    <span className="text-[11px] text-[#857E74] block">
                                        {t('crm.master.columns.createdAt')}
                                    </span>
                                    <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                                        {record.createdAt}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3 shrink-0">
                    {!disableStatusToggle ? (
                        <button
                            type="button"
                            onClick={onToggleStatus}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <Power size={14} className="text-[#2D3F2C]" />
                            <span>
                                {isActive
                                    ? t('crm.master.common.deactivate')
                                    : t('crm.master.common.activate')}
                            </span>
                        </button>
                    ) : (
                        <span className="text-[11px] font-medium text-[#6E6862]">
                            {t('crm.master.common.systemProtected')}
                        </span>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.master.common.close')}
                        </button>
                        <button
                            type="button"
                            onClick={onEdit}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] transition-colors cursor-pointer"
                        >
                            <Pencil size={13} />
                            <span>{t('crm.master.common.edit')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
