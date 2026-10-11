import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    UserPlus,
    Edit3,
    CheckCircle2,
    AlertCircle,
    Star,
} from 'lucide-react';
import {
    crmContactInputSchema,
    type CrmContactInput,
    type CrmContactRecord,
    type CrmCompanyRecord,
    type CrmLeadRecord,
} from '../../../schemas/crmSchema';

export interface ContactFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmContactRecord | null;
    companies: CrmCompanyRecord[];
    leads: CrmLeadRecord[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmContactInput) => Promise<void> | void;
}

export const ContactFormDrawer: React.FC<ContactFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    companies,
    leads,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [formState, setFormState] = useState<CrmContactInput>({
        fullNameEn: '',
        fullNameAr: '',
        contactType: 'primary',
        jobTitle: '',
        department: '',
        email: '',
        phone: '',
        secondaryPhone: '',
        companyId: '',
        leadId: '',
        isPrimary: true,
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                setFormState({
                    fullNameEn: initialData.fullNameEn,
                    fullNameAr: initialData.fullNameAr,
                    contactType: initialData.contactType || 'primary',
                    jobTitle: initialData.jobTitle || '',
                    department: initialData.department || '',
                    email: initialData.email,
                    phone: initialData.phone,
                    secondaryPhone: initialData.secondaryPhone || '',
                    companyId: initialData.companyId || '',
                    leadId: initialData.leadId || '',
                    isPrimary: Boolean(initialData.isPrimary),
                    notes: initialData.notes || '',
                    status: initialData.status,
                });
            } else {
                setFormState({
                    fullNameEn: '',
                    fullNameAr: '',
                    contactType: 'primary',
                    jobTitle: '',
                    department: '',
                    email: '',
                    phone: '',
                    secondaryPhone: '',
                    companyId: '',
                    leadId: '',
                    isPrimary: true,
                    notes: '',
                    status: 'active',
                });
            }
        }
    }

    if (!isOpen) return null;

    const handleChange = <K extends keyof CrmContactInput>(
        field: K,
        value: CrmContactInput[K]
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        const parsed = crmContactInputSchema.safeParse({
            ...formState,
            companyId: formState.companyId?.trim() || undefined,
            leadId: formState.leadId?.trim() || undefined,
        });
        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) errors[key] = issue.message;
            }
            setFieldErrors(errors);
            return;
        }
        await onSubmit(parsed.data);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 flex items-center justify-center text-[#2D3F2C] shrink-0">
                            {mode === 'create' ? <UserPlus size={18} /> : <Edit3 size={18} />}
                        </div>
                        <div className="min-w-0">
                            <span
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#2D3F2C]"
                                dir="ltr"
                            >
                                {mode === 'edit' && initialData
                                    ? initialData.code
                                    : t('crm.customer.contacts.badge')}
                            </span>
                            <h2
                                id="contact-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t('crm.customer.contacts.form.createTitle')
                                    : t('crm.customer.contacts.form.editTitle', {
                                          code: initialData?.code || '',
                                      })}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t('crm.customer.contacts.form.createSubtitle')
                                    : t('crm.customer.contacts.form.editSubtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-4"
                    noValidate
                >
                    {serverError && (
                        <div className="rounded-xl border border-[#F5C6C6] bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{serverError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.fullNameEnLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={formState.fullNameEn}
                                onChange={(e) =>
                                    handleChange('fullNameEn', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.contacts.form.fullNameEnPlaceholder'
                                )}
                                dir="ltr"
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] ${
                                    fieldErrors.fullNameEn
                                        ? 'border-[#A63A3A]'
                                        : 'border-[#E5E0D8]'
                                }`}
                            />
                            {fieldErrors.fullNameEn && (
                                <p className="mt-1 text-[11px] text-[#A63A3A]">
                                    {fieldErrors.fullNameEn}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.fullNameArLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={formState.fullNameAr}
                                onChange={(e) =>
                                    handleChange('fullNameAr', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.contacts.form.fullNameArPlaceholder'
                                )}
                                dir="rtl"
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] ${
                                    fieldErrors.fullNameAr
                                        ? 'border-[#A63A3A]'
                                        : 'border-[#E5E0D8]'
                                }`}
                            />
                            {fieldErrors.fullNameAr && (
                                <p className="mt-1 text-[11px] text-[#A63A3A]">
                                    {fieldErrors.fullNameAr}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.contactTypeLabel')}
                            </label>
                            <select
                                value={formState.contactType}
                                onChange={(e) =>
                                    handleChange(
                                        'contactType',
                                        e.target.value as CrmContactInput['contactType']
                                    )
                                }
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                <option value="primary">
                                    {t('crm.customer.contacts.typePrimary')}
                                </option>
                                <option value="decision_maker">
                                    {t('crm.customer.contacts.typeDecisionMaker')}
                                </option>
                                <option value="billing">
                                    {t('crm.customer.contacts.typeBilling')}
                                </option>
                                <option value="technical">
                                    {t('crm.customer.contacts.typeTechnical')}
                                </option>
                                <option value="general">
                                    {t('crm.customer.contacts.typeGeneral')}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.jobTitleLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.jobTitle || ''}
                                onChange={(e) =>
                                    handleChange('jobTitle', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.contacts.form.jobTitlePlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.departmentLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.department || ''}
                                onChange={(e) =>
                                    handleChange('department', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.contacts.form.departmentPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.emailLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="email"
                                value={formState.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                dir="ltr"
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] ${
                                    fieldErrors.email
                                        ? 'border-[#A63A3A]'
                                        : 'border-[#E5E0D8]'
                                }`}
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-[11px] text-[#A63A3A]">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.phoneLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={formState.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                dir="ltr"
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] ${
                                    fieldErrors.phone
                                        ? 'border-[#A63A3A]'
                                        : 'border-[#E5E0D8]'
                                }`}
                            />
                            {fieldErrors.phone && (
                                <p className="mt-1 text-[11px] text-[#A63A3A]">
                                    {fieldErrors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.secondaryPhoneLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.secondaryPhone || ''}
                                onChange={(e) =>
                                    handleChange('secondaryPhone', e.target.value)
                                }
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.companyLabel')}
                            </label>
                            <select
                                value={formState.companyId || ''}
                                onChange={(e) =>
                                    handleChange('companyId', e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t('crm.customer.contacts.form.noCompany')}
                                </option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} — {isRtl ? c.nameAr : c.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.leadLabel')}
                            </label>
                            <select
                                value={formState.leadId || ''}
                                onChange={(e) => handleChange('leadId', e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t('crm.customer.contacts.form.noLead')}
                                </option>
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.code} — {l.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                    <Star size={13} className="text-[#B45309]" />
                                    {t('crm.customer.contacts.form.isPrimaryLabel')}
                                </div>
                                <div className="text-[11px] text-[#6E6862]">
                                    {t('crm.customer.contacts.form.isPrimaryHelper')}
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formState.isPrimary}
                                onChange={(e) =>
                                    handleChange('isPrimary', e.target.checked)
                                }
                                className="w-4 h-4 accent-[#2D3F2C] cursor-pointer"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.contacts.form.notesLabel')}
                            </label>
                            <textarea
                                rows={3}
                                value={formState.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
                            <span className="text-xs font-semibold text-[#0D0D0D]">
                                {t('crm.master.form.statusLabel')}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleChange('status', 'active')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                        formState.status === 'active'
                                            ? 'bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E]'
                                            : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                    }`}
                                >
                                    {t('crm.customer.common.active')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleChange('status', 'inactive')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                        formState.status === 'inactive'
                                            ? 'bg-[#FCECE9] border-[#A63A3A]/30 text-[#A63A3A]'
                                            : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                    }`}
                                >
                                    {t('crm.customer.common.inactive')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            {t('crm.customer.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            {isSubmitting
                                ? t('crm.customer.common.saving')
                                : mode === 'create'
                                  ? t('crm.customer.common.createRecord')
                                  : t('crm.customer.common.saveChanges')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ContactFormDrawer;
