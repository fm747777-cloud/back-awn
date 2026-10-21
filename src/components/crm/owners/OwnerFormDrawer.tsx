import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    UserPlus,
    Edit3,
    CheckCircle2,
    AlertCircle,
    Crown,
} from 'lucide-react';
import {
    crmOwnerInputSchema,
    type CrmOwnerInput,
    type CrmOwnerRecord,
    type CrmOwnershipTypeRecord,
    type CrmCompanyRecord,
} from '../../../schemas/crmSchema';

export interface OwnerFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmOwnerRecord | null;
    ownershipTypes: CrmOwnershipTypeRecord[];
    companies: CrmCompanyRecord[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmOwnerInput) => Promise<void> | void;
}

export const OwnerFormDrawer: React.FC<OwnerFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    ownershipTypes,
    companies,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultOwnTypeId =
        ownershipTypes.find((o) => o.status === 'active')?.id ||
        ownershipTypes[0]?.id ||
        '';

    const [formState, setFormState] = useState<CrmOwnerInput>({
        firstName: '',
        lastName: '',
        fullNameEn: '',
        fullNameAr: '',
        gender: 'male',
        nationality: 'Saudi',
        ownershipTypeId: defaultOwnTypeId,
        companyId: '',
        nationalIdOrIqama: '',
        phone: '',
        email: '',
        ownershipPercentage: 100,
        isMainOwner: true,
        notes: '',
        status: 'active',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${defaultOwnTypeId}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            if (mode === 'edit' && initialData) {
                setFormState({
                    firstName:
                        initialData.firstName ||
                        initialData.fullNameEn.split(' ')[0] ||
                        '',
                    lastName:
                        initialData.lastName ||
                        initialData.fullNameEn.split(' ').slice(1).join(' ') ||
                        '',
                    fullNameEn: initialData.fullNameEn,
                    fullNameAr: initialData.fullNameAr || '',
                    gender: initialData.gender || 'male',
                    nationality: initialData.nationality || 'Saudi',
                    ownershipTypeId: initialData.ownershipTypeId,
                    companyId: initialData.companyId || '',
                    nationalIdOrIqama: initialData.nationalIdOrIqama || '',
                    phone: initialData.phone,
                    email: initialData.email || '',
                    ownershipPercentage: Number(
                        initialData.ownershipPercentage ?? 100
                    ),
                    isMainOwner: Boolean(initialData.isMainOwner),
                    notes: initialData.notes || '',
                    status: initialData.status,
                });
            } else {
                setFormState({
                    firstName: '',
                    lastName: '',
                    fullNameEn: '',
                    fullNameAr: '',
                    gender: 'male',
                    nationality: 'Saudi',
                    ownershipTypeId: defaultOwnTypeId,
                    companyId: '',
                    nationalIdOrIqama: '',
                    phone: '',
                    email: '',
                    ownershipPercentage: 100,
                    isMainOwner: true,
                    notes: '',
                    status: 'active',
                });
            }
        }
    }

    if (!isOpen) return null;

    const handleChange = <K extends keyof CrmOwnerInput>(
        field: K,
        value: CrmOwnerInput[K]
    ) => {
        setFormState((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'firstName' || field === 'lastName') {
                const composed = [
                    field === 'firstName' ? String(value) : next.firstName,
                    field === 'lastName' ? String(value) : next.lastName,
                ]
                    .map((s) => (s || '').trim())
                    .filter(Boolean)
                    .join(' ');
                if (composed) {
                    next.fullNameEn = composed;
                }
            }
            return next;
        });
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
        const composedFullNameEn =
            formState.fullNameEn?.trim() ||
            [formState.firstName?.trim(), formState.lastName?.trim()]
                .filter(Boolean)
                .join(' ');

        const parsed = crmOwnerInputSchema.safeParse({
            ...formState,
            fullNameEn: composedFullNameEn,
            companyId: formState.companyId?.trim() || undefined,
            ownershipPercentage: Number(formState.ownershipPercentage ?? 100),
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
            aria-labelledby="owner-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C] shrink-0">
                            {mode === 'create' ? <UserPlus size={18} /> : <Edit3 size={18} />}
                        </div>
                        <div className="min-w-0">
                            <span
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#037F8C]"
                                dir="ltr"
                            >
                                {mode === 'edit' && initialData
                                    ? initialData.code
                                    : t('crm.customer.owners.badge')}
                            </span>
                            <h2
                                id="owner-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t('crm.customer.owners.form.createTitle')
                                    : t('crm.customer.owners.form.editTitle', {
                                          code: initialData?.code || '',
                                      })}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t('crm.customer.owners.form.createSubtitle')
                                    : t('crm.customer.owners.form.editSubtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer"
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
                                {t('crm.customer.owners.form.firstNameLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.firstName || ''}
                                onChange={(e) =>
                                    handleChange('firstName', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.firstNamePlaceholder'
                                )}
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.lastNameLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.lastName || ''}
                                onChange={(e) =>
                                    handleChange('lastName', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.lastNamePlaceholder'
                                )}
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.fullNameEnLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={formState.fullNameEn || ''}
                                onChange={(e) =>
                                    handleChange('fullNameEn', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.fullNameEnPlaceholder'
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
                                {t('crm.customer.owners.form.fullNameArLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.fullNameAr || ''}
                                onChange={(e) =>
                                    handleChange('fullNameAr', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.fullNameArPlaceholder'
                                )}
                                dir="rtl"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.genderLabel')}
                            </label>
                            <select
                                value={formState.gender || 'male'}
                                onChange={(e) =>
                                    handleChange(
                                        'gender',
                                        e.target.value as 'male' | 'female'
                                    )
                                }
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                <option value="male">
                                    {t('crm.customer.common.male')}
                                </option>
                                <option value="female">
                                    {t('crm.customer.common.female')}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.nationalityLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.nationality || ''}
                                onChange={(e) =>
                                    handleChange('nationality', e.target.value)
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.nationalityPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.nationalIdLabel')}
                            </label>
                            <input
                                type="text"
                                value={formState.nationalIdOrIqama || ''}
                                onChange={(e) =>
                                    handleChange(
                                        'nationalIdOrIqama',
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    'crm.customer.owners.form.nationalIdPlaceholder'
                                )}
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.ownershipTypeLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <select
                                value={formState.ownershipTypeId}
                                onChange={(e) =>
                                    handleChange(
                                        'ownershipTypeId',
                                        e.target.value
                                    )
                                }
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                {ownershipTypes.map((ot) => (
                                    <option key={ot.id} value={ot.id}>
                                        {isRtl ? ot.nameAr : ot.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.customer.owners.form.ownershipPercentageLabel'
                                )}
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={formState.ownershipPercentage ?? 100}
                                onChange={(e) =>
                                    handleChange(
                                        'ownershipPercentage',
                                        Number(e.target.value || 0)
                                    )
                                }
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.companyLabel')}
                            </label>
                            <select
                                value={formState.companyId || ''}
                                onChange={(e) =>
                                    handleChange('companyId', e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t('crm.customer.owners.form.noCompany')}
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
                                {t('crm.customer.owners.form.phoneLabel')}{' '}
                                <span className="text-[#A63A3A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={formState.phone}
                                onChange={(e) =>
                                    handleChange('phone', e.target.value)
                                }
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
                                {t('crm.customer.owners.form.emailLabel')}
                            </label>
                            <input
                                type="email"
                                value={formState.email || ''}
                                onChange={(e) =>
                                    handleChange('email', e.target.value)
                                }
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

                        <div className="sm:col-span-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5">
                                    <Crown size={13} className="text-[#037F8C]" />
                                    {t('crm.customer.owners.form.isMainOwnerLabel')}
                                </div>
                                <div className="text-[11px] text-[#6E6862]">
                                    {t('crm.customer.owners.form.isMainOwnerHelper')}
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formState.isMainOwner}
                                onChange={(e) =>
                                    handleChange('isMainOwner', e.target.checked)
                                }
                                className="w-4 h-4 accent-[#037F8C] cursor-pointer"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.customer.owners.form.notesLabel')}
                            </label>
                            <textarea
                                rows={3}
                                value={formState.notes || ''}
                                onChange={(e) =>
                                    handleChange('notes', e.target.value)
                                }
                                className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                            />
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
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
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
export default OwnerFormDrawer;
