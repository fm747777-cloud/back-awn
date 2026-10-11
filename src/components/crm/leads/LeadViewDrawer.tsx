import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Edit3,
    Building2,
    Phone,
    Mail,
    MapPin,
    Calendar,
    UserCheck,
    ShieldCheck,
    ShieldAlert,
    Link2,
} from 'lucide-react';
import type {
    CrmLeadRecord,
    CrmLeadStatusRecord,
} from '../../../schemas/crmSchema';
import type {
    CrmDeletionEligibilityResult,
    CrmSalesEmployee,
} from '../../../api/api';

export interface LeadViewDrawerProps {
    isOpen: boolean;
    record: CrmLeadRecord | null;
    leadStatuses: CrmLeadStatusRecord[];
    employees: CrmSalesEmployee[];
    eligibility?: CrmDeletionEligibilityResult | null;
    onClose: () => void;
    onEdit: (record: CrmLeadRecord) => void;
    onTransitionStage: (leadId: string, leadStatusId: string) => void;
    onAssignEmployee: (leadId: string, assignedEmployeeId: string) => void;
}

export const LeadViewDrawer: React.FC<LeadViewDrawerProps> = ({
    isOpen,
    record,
    leadStatuses,
    employees,
    eligibility,
    onClose,
    onEdit,
    onTransitionStage,
    onAssignEmployee,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    if (!isOpen || !record) return null;

    const currentStage = leadStatuses.find((s) => s.id === record.leadStatusId);
    const sortedStages = [...leadStatuses]
        .filter((s) => s.status === 'active' || s.id === record.leadStatusId)
        .sort((a, b) => a.stageOrder - b.stageOrder);

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
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
                                {record.code}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                    record.status === 'active'
                                        ? 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/20'
                                        : 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/20'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        record.status === 'active'
                                            ? 'bg-[#2E6B4E]'
                                            : 'bg-[#A63A3A]'
                                    }`}
                                />
                                {record.status === 'active'
                                    ? t('crm.customer.common.active')
                                    : t('crm.customer.common.inactive')}
                            </span>
                            {currentStage && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-[#E5E0D8] bg-white text-[#0D0D0D]"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                currentStage.colorCode || '#2563EB',
                                        }}
                                    />
                                    {isRtl ? currentStage.nameAr : currentStage.nameEn}
                                </span>
                            )}
                        </div>
                        <h2
                            id="lead-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] truncate pt-0.5"
                        >
                            {record.title}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.customer.leads.viewDrawer.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.customer.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Quick Stage & Assignment Controls */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#2D3F2C]">
                            {t('crm.customer.leads.viewDrawer.quickActions')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                    {t('crm.customer.leads.viewDrawer.changeStage')}
                                </label>
                                <select
                                    value={record.leadStatusId}
                                    onChange={(e) =>
                                        onTransitionStage(record.id, e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                                >
                                    {sortedStages.map((stage) => (
                                        <option key={stage.id} value={stage.id}>
                                            #{stage.stageOrder} —{' '}
                                            {isRtl ? stage.nameAr : stage.nameEn} (
                                            {stage.probability}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                    {t('crm.customer.leads.viewDrawer.assignRep')}
                                </label>
                                <select
                                    value={record.assignedEmployeeId || ''}
                                    onChange={(e) =>
                                        onAssignEmployee(record.id, e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.customer.common.unassigned')}
                                    </option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lead & Company Details */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <Building2 size={14} className="text-[#2D3F2C]" />
                            <span>{t('crm.customer.leads.form.sectionLeadInfo')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.leads.form.leadSourceLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.leadSourceNameAr || record.leadSourceNameEn
                                        : record.leadSourceNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.leads.form.sectorLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {isRtl
                                        ? record.sectorNameAr || record.sectorNameEn
                                        : record.sectorNameEn}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.leads.form.temporaryCompanyLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.companyNameEn
                                        ? isRtl
                                            ? record.companyNameAr || record.companyNameEn
                                            : record.companyNameEn
                                        : record.temporaryCompanyName ||
                                          t('crm.customer.common.notProvided')}
                                </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.leads.form.estimatedValueLabel')}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C]"
                                    dir="ltr"
                                >
                                    {Number(record.estimatedValue || 0).toLocaleString()}{' '}
                                    {t('crm.customer.common.sarCurrency')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Primary Contact Details */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0D0D0D]">
                            <UserCheck size={14} className="text-[#2D3F2C]" />
                            <span>{t('crm.customer.leads.form.sectionContactInfo')}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#6E6862] block">
                                    {t('crm.customer.leads.form.contactNameLabel')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D]">
                                    {record.contactName}
                                </span>
                                {record.contactJobTitle && (
                                    <span className="block text-[11px] text-[#6E6862]">
                                        {record.contactJobTitle}
                                    </span>
                                )}
                            </div>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                                <div className="flex items-center gap-1.5 font-mono text-[#0D0D0D]" dir="ltr">
                                    <Phone size={12} className="text-[#2D3F2C]" />
                                    <span>{record.contactPhone}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[#6E6862]" dir="ltr">
                                    <Mail size={12} className="text-[#2D3F2C]" />
                                    <span className="truncate">{record.contactEmail}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address & Notes */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-[#0D0D0D]">
                            <MapPin size={14} className="text-[#2D3F2C]" />
                            <span>{t('crm.customer.leads.form.sectionAddressInfo')}</span>
                        </div>
                        <p className="text-[#45413C]">
                            {[record.address, record.city, record.state, record.country]
                                .filter(Boolean)
                                .join(' • ') || t('crm.customer.common.notProvided')}
                        </p>
                        {record.notes && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#45413C]">
                                {record.notes}
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8] text-[11px] text-[#6E6862]">
                            <span className="inline-flex items-center gap-1">
                                <Calendar size={12} />
                                {record.createdAt}
                            </span>
                            <span>{record.createdBy}</span>
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
                                            <Link2 size={11} className="text-[#2D3F2C]" />
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
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('crm.customer.common.close')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <Edit3 size={14} />
                        {t('crm.customer.common.editRecord')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default LeadViewDrawer;
