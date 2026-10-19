import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Briefcase,
    Edit3,
    AlertCircle,
    Building2,
    TrendingUp,
} from 'lucide-react';
import {
    CRM_DEAL_STAGE_VALUES,
    CRM_DEAL_STAGE_DEFAULT_PROBABILITY,
    crmDealInputSchema,
    type CrmDealInput,
    type CrmDealRecord,
    type CrmDealStage,
    type CrmCompanyRecord,
    type CrmLeadRecord,
    type CrmContactRecord,
    type CrmSectorRecord,
} from '../../../schemas/crmSchema';
import type { CrmSalesEmployee } from '../../../api/api';

export interface DealFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmDealRecord | Partial<CrmDealRecord> | null;
    companies: CrmCompanyRecord[];
    leads: CrmLeadRecord[];
    contacts: CrmContactRecord[];
    sectors: CrmSectorRecord[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmDealInput) => Promise<void> | void;
    onOpenCreateCompany?: (leadId?: string) => void;
}

export const DealFormDrawer: React.FC<DealFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    leads,
    contacts,
    sectors,
    employees,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
    onOpenCreateCompany,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultCompany =
        companies.find((c) => c.status === 'active') || companies[0];
    const defaultEmployeeId = employees[0]?.id || '';
    const defaultCloseDateObj = new Date();
    defaultCloseDateObj.setDate(defaultCloseDateObj.getDate() + 30);
    const defaultCloseDate = defaultCloseDateObj.toISOString().split('T')[0];

    const isFromLead = Boolean(initialData?.leadId);
    const resolvedInitialCompanyId = initialData?.companyId
        ? initialData.companyId
        : isFromLead
            ? ''
            : defaultCompany?.id || '';

    const [formState, setFormState] = useState<CrmDealInput>({
        titleEn: '',
        titleAr: '',
        leadId: '',
        companyId: resolvedInitialCompanyId,
        contactId: '',
        sectorId:
            (resolvedInitialCompanyId
                ? companies.find((c) => c.id === resolvedInitialCompanyId)?.sectorId
                : undefined) ||
            sectors[0]?.id ||
            '',
        stage: 'qualified',
        probability: 20,
        expectedValue: 50000,
        currency: 'SAR',
        expectedCloseDate: defaultCloseDate,
        assignedEmployeeId: defaultEmployeeId,
        lostReason: '',
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? initialData?.leadId ?? 'new'}-${resolvedInitialCompanyId}-${initialData?.assignedEmployeeId ?? defaultEmployeeId}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                setFormState({
                    titleEn: initialData.titleEn || '',
                    titleAr: initialData.titleAr || '',
                    leadId: initialData.leadId || '',
                    companyId: initialData.companyId || '',
                    contactId: initialData.contactId || '',
                    sectorId:
                        initialData.sectorId ||
                        (initialData.companyId
                            ? companies.find((c) => c.id === initialData.companyId)?.sectorId
                            : undefined) ||
                        sectors[0]?.id ||
                        '',
                    stage: initialData.stage || 'qualified',
                    probability: initialData.probability ?? 20,
                    expectedValue: Number(initialData.expectedValue || 0),
                    currency: initialData.currency || 'SAR',
                    expectedCloseDate: initialData.expectedCloseDate || defaultCloseDate,
                    assignedEmployeeId: initialData.assignedEmployeeId || defaultEmployeeId,
                    lostReason: initialData.lostReason || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'active',
                });
            } else {
                setFormState({
                    titleEn: initialData?.titleEn || '',
                    titleAr: initialData?.titleAr || '',
                    leadId: initialData?.leadId || '',
                    companyId: resolvedInitialCompanyId,
                    contactId: initialData?.contactId || '',
                    sectorId:
                        initialData?.sectorId ||
                        (resolvedInitialCompanyId
                            ? companies.find((c) => c.id === resolvedInitialCompanyId)?.sectorId
                            : undefined) ||
                        sectors[0]?.id ||
                        '',
                    stage: initialData?.stage || 'qualified',
                    probability: initialData?.probability ?? 20,
                    expectedValue:
                        initialData?.expectedValue !== undefined
                            ? Number(initialData.expectedValue)
                            : 50000,
                    currency: initialData?.currency || 'SAR',
                    expectedCloseDate:
                        initialData?.expectedCloseDate || defaultCloseDate,
                    assignedEmployeeId:
                        initialData?.assignedEmployeeId || defaultEmployeeId,
                    lostReason: '',
                    notes: initialData?.notes || '',
                    status: initialData?.status || 'active',
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

    const handleChange = <K extends keyof CrmDealInput>(
        field: K,
        value: CrmDealInput[K]
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

    const handleCompanyChange = (companyId: string) => {
        const company = companies.find((c) => c.id === companyId);
        const companyContacts = contacts.filter(
            (cnt) => cnt.companyId === companyId
        );
        const primaryContact =
            companyContacts.find((cnt) => cnt.isPrimary) || companyContacts[0];
        setFormState((prev) => ({
            ...prev,
            companyId,
            sectorId: company?.sectorId || prev.sectorId,
            contactId: primaryContact?.id || '',
            assignedEmployeeId:
                company?.assignedEmployeeId || prev.assignedEmployeeId,
        }));
    };

    const handleStageChange = (stage: CrmDealStage) => {
        setFormState((prev) => ({
            ...prev,
            stage,
            probability: CRM_DEAL_STAGE_DEFAULT_PROBABILITY[stage],
            lostReason: stage === 'lost' ? prev.lostReason : '',
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldErrors({});
        const parsed = crmDealInputSchema.safeParse({
            ...formState,
            leadId: formState.leadId?.trim() || undefined,
            contactId: formState.contactId?.trim() || undefined,
            sectorId: formState.sectorId?.trim() || undefined,
            expectedValue: Number(formState.expectedValue || 0),
            probability: Number(formState.probability || 0),
            lostReason:
                formState.stage === 'lost'
                    ? formState.lostReason?.trim()
                    : undefined,
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

    const availableContacts = contacts.filter(
        (c) =>
            !formState.companyId ||
            c.companyId === formState.companyId ||
            c.id === formState.contactId
    );

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-form-drawer-title"
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
                                <Briefcase size={18} />
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
                                    ? initialData.code
                                    : t('crm.commercial.deals.badge')}
                            </span>
                            <h2
                                id="deal-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t('crm.commercial.deals.form.createTitle')
                                    : t('crm.commercial.deals.form.editTitle', {
                                          code: initialData?.code || '',
                                      })}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t('crm.commercial.deals.form.createSubtitle')
                                    : t('crm.commercial.deals.form.editSubtitle')}
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

                    {/* Originating Lead Notification & Company Guidance */}
                    {formState.leadId && (
                        <div className="rounded-xl border border-[#2D3F2C]/20 bg-[#2D3F2C]/5 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] font-mono text-[11px] font-bold text-[#2D3F2C] shrink-0"
                                    dir="ltr"
                                >
                                    {leads.find((l) => l.id === formState.leadId)?.code || 'LEAD'}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] truncate">
                                    {leads.find((l) => l.id === formState.leadId)?.title}
                                </span>
                            </div>
                            {!formState.companyId && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] text-[#A63A3A] font-semibold shrink-0 flex items-center gap-1 bg-[#FCECE9] px-2 py-0.5 rounded border border-[#A63A3A]/20">
                                        <AlertCircle size={12} className="text-[#A63A3A]" />
                                        {t(
                                            'crm.commercial.deals.form.selectCompanyToLink',
                                            'Select an active client company to complete Deal creation'
                                        )}
                                    </span>
                                    {onOpenCreateCompany && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenCreateCompany(formState.leadId)}
                                            className="px-2.5 py-1 rounded bg-[#2D3F2C] hover:bg-[#233122] text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                                        >
                                            {t(
                                                'crm.commercial.deals.form.preOnboardCompanyForLead',
                                                'Pre-Onboard Company for this Lead'
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Section 1: Deal Identity & Customer Link */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-[#2D3F2C]">
                            <div className="flex items-center gap-2">
                                <Building2 size={14} />
                                <span>{t('crm.commercial.deals.form.companyLabel')}</span>
                            </div>
                            {onOpenCreateCompany && formState.leadId && !formState.companyId && (
                                <button
                                    type="button"
                                    onClick={() => onOpenCreateCompany(formState.leadId)}
                                    className="text-[11px] font-semibold text-[#2D3F2C] hover:underline cursor-pointer"
                                >
                                    + {t(
                                        'crm.commercial.deals.form.preOnboardCompanyForLead',
                                        'Pre-Onboard Company'
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.titleEnLabel')} *
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleEn}
                                    onChange={(e) =>
                                        handleChange('titleEn', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.deals.form.titleEnPlaceholder'
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
                                    {t('crm.commercial.deals.form.titleArLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.titleAr || ''}
                                    onChange={(e) =>
                                        handleChange('titleAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.commercial.deals.form.titleArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.companyLabel')} *
                                </label>
                                <select
                                    value={formState.companyId}
                                    onChange={(e) =>
                                        handleCompanyChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.deals.form.selectCompany')}
                                    </option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} — {isRtl ? c.nameAr : c.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.companyId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {fieldErrors.companyId}
                                    </p>
                                )}
                                {!formState.companyId && formState.leadId && !fieldErrors.companyId && (
                                    <p className="text-[11px] text-[#B45309] mt-1">
                                        {t(
                                            'crm.commercial.deals.form.leadWithoutCompanyWarning',
                                            'The originating Lead does not have a linked company. A deal requires an active client company.'
                                        )}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.sectorLabel')}
                                </label>
                                <select
                                    value={formState.sectorId || ''}
                                    onChange={(e) =>
                                        handleChange('sectorId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {sectors.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {isRtl ? sec.nameAr : sec.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.leadLabel')}
                                </label>
                                <select
                                    value={formState.leadId || ''}
                                    onChange={(e) =>
                                        handleChange('leadId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.common.noLinkedLead')}
                                    </option>
                                    {leads.map((lead) => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.code} — {lead.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.contactLabel')}
                                </label>
                                <select
                                    value={formState.contactId || ''}
                                    onChange={(e) =>
                                        handleChange('contactId', e.target.value)
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.commercial.common.noLinkedContact')}
                                    </option>
                                    {availableContacts.map((cnt) => (
                                        <option key={cnt.id} value={cnt.id}>
                                            {isRtl
                                                ? cnt.fullNameAr || cnt.fullNameEn
                                                : cnt.fullNameEn}{' '}
                                            ({cnt.jobTitle || cnt.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Commercial Valuation & Pipeline Stage */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#2D3F2C]">
                            <TrendingUp size={14} />
                            <span>
                                {t('crm.commercial.deals.columns.stageAndProbability')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.stageLabel')} *
                                </label>
                                <select
                                    value={formState.stage}
                                    onChange={(e) =>
                                        handleStageChange(
                                            e.target.value as CrmDealStage
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    {CRM_DEAL_STAGE_VALUES.map((st) => (
                                        <option key={st} value={st}>
                                            {t(`crm.commercial.deals.stages.${st}`)} (
                                            {CRM_DEAL_STAGE_DEFAULT_PROBABILITY[st]}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.probabilityLabel')} *
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={formState.probability}
                                    onChange={(e) =>
                                        handleChange(
                                            'probability',
                                            Number(e.target.value || 0)
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.expectedValueLabel')} *
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={formState.expectedValue}
                                    onChange={(e) =>
                                        handleChange(
                                            'expectedValue',
                                            Number(e.target.value || 0)
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.expectedValue && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.expectedValue}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t(
                                        'crm.commercial.deals.form.expectedCloseDateLabel'
                                    )}{' '}
                                    *
                                </label>
                                <input
                                    type="date"
                                    value={formState.expectedCloseDate}
                                    onChange={(e) =>
                                        handleChange(
                                            'expectedCloseDate',
                                            e.target.value
                                        )
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                />
                                {fieldErrors.expectedCloseDate && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.expectedCloseDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.assignedRepLabel')} *
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
                                    <option value="">
                                        {t('crm.commercial.deals.form.selectRep')}
                                    </option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.assignedEmployeeId && (
                                    <p className="text-[11px] text-[#A63A3A] mt-1">
                                        {fieldErrors.assignedEmployeeId}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.statusLabel')}
                                </label>
                                <select
                                    value={formState.status}
                                    onChange={(e) =>
                                        handleChange(
                                            'status',
                                            e.target.value as 'active' | 'inactive'
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                >
                                    <option value="active">
                                        {t('crm.commercial.common.active')}
                                    </option>
                                    <option value="inactive">
                                        {t('crm.commercial.common.inactive')}
                                    </option>
                                </select>
                            </div>

                            {formState.stage === 'lost' && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-[#A63A3A] mb-1">
                                        {t('crm.commercial.deals.form.lostReasonLabel')}{' '}
                                        *
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.lostReason || ''}
                                        onChange={(e) =>
                                            handleChange(
                                                'lostReason',
                                                e.target.value
                                            )
                                        }
                                        placeholder={t(
                                            'crm.commercial.deals.form.lostReasonPlaceholder'
                                        )}
                                        className="w-full px-3.5 py-2 rounded-xl border border-[#A63A3A]/40 bg-white text-xs text-[#0D0D0D]"
                                    />
                                    {fieldErrors.lostReason && (
                                        <p className="text-[11px] text-[#A63A3A] mt-1">
                                            {fieldErrors.lostReason}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('crm.commercial.deals.form.notesLabel')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formState.notes || ''}
                                    onChange={(e) =>
                                        handleChange('notes', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                />
                            </div>
                        </div>
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
