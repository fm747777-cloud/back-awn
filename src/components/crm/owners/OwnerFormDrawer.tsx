import React, { useState } from 'react';
import {
    X,
    UserPlus,
    AlertCircle,
} from 'lucide-react';
import {
    crmOwnerInputSchema,
    type CrmOwnerInput,
    type CrmOwnerRecord,
    type CrmOwnershipTypeRecord,
    type CrmCompanyRecord,
} from '../../../schemas/crmSchema';
import { NATIONALITY_OPTIONS } from '../../../pages/ums/umsMockData';

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
    companies: _companies,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    void _companies;

    const defaultOwnTypeId =
        ownershipTypes.find((o) => o.status === 'active')?.id ||
        ownershipTypes[0]?.id ||
        'crm-own-type-1';

    const [formState, setFormState] = useState<CrmOwnerInput>({
        firstName: '',
        lastName: '',
        fullNameEn: '',
        fullNameAr: '',
        gender: 'male',
        nationality: '',
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
                    nationality: initialData.nationality || '',
                    ownershipTypeId: initialData.ownershipTypeId || defaultOwnTypeId,
                    companyId: initialData.companyId || '',
                    nationalIdOrIqama: initialData.nationalIdOrIqama || '',
                    phone: initialData.phone || '',
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
                    nationality: '',
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
                next.fullNameEn = composed;
                next.fullNameAr = composed;
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

        const errors: Record<string, string> = {};
        const trimmedFirstName = (formState.firstName || '').trim();
        const trimmedLastName = (formState.lastName || '').trim();
        const trimmedEmail = (formState.email || '').trim();
        const trimmedPhone = (formState.phone || '').trim();

        if (!trimmedFirstName) {
            errors.firstName = 'First name is required';
        }

        if (!trimmedEmail) {
            errors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            errors.email = 'Valid email address is required';
        }

        const composedFullNameEn = [trimmedFirstName, trimmedLastName]
            .filter(Boolean)
            .join(' ');

        const parsed = crmOwnerInputSchema.safeParse({
            ...formState,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            fullNameEn: composedFullNameEn,
            fullNameAr: formState.fullNameAr?.trim() || composedFullNameEn,
            phone: trimmedPhone,
            email: trimmedEmail,
            ownershipTypeId: formState.ownershipTypeId || defaultOwnTypeId,
            companyId: formState.companyId?.trim() || undefined,
            ownershipPercentage: Number(formState.ownershipPercentage ?? 100),
        });

        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) errors[key] = issue.message;
            }
        }

        if (Object.keys(errors).length > 0 || !parsed.success) {
            setFieldErrors(errors);
            return;
        }

        await onSubmit(parsed.data);
    };

    const hasCustomNationality =
        Boolean(formState.nationality) &&
        !NATIONALITY_OPTIONS.some((opt) => opt.value === formState.nationality);

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
                            <UserPlus size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="owner-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate"
                            >
                                Add New Owner Details
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
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

                    {/* 1. First Name* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            First Name <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formState.firstName || ''}
                            onChange={(e) =>
                                handleChange('firstName', e.target.value)
                            }
                            placeholder="Enter First Name"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                fieldErrors.firstName
                                    ? 'border-[#A63A3A]'
                                    : 'border-[#E5E0D8]'
                            }`}
                        />
                        {fieldErrors.firstName && (
                            <p className="mt-1 text-[11px] text-[#A63A3A]">
                                {fieldErrors.firstName}
                            </p>
                        )}
                    </div>

                    {/* 2. Last Name */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Last Name
                        </label>
                        <input
                            type="text"
                            value={formState.lastName || ''}
                            onChange={(e) =>
                                handleChange('lastName', e.target.value)
                            }
                            placeholder="Enter Last Name"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                        />
                    </div>

                    {/* 3. Contact Number */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Contact Number
                        </label>
                        <input
                            type="tel"
                            value={formState.phone || ''}
                            onChange={(e) =>
                                handleChange('phone', e.target.value)
                            }
                            placeholder="Enter Contact Number"
                            dir="ltr"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
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

                    {/* 4. Email Address* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Email Address <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formState.email || ''}
                            onChange={(e) =>
                                handleChange('email', e.target.value)
                            }
                            placeholder="Enter Email"
                            dir="ltr"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
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

                    {/* 5. Gender */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Gender
                        </label>
                        <div className="flex items-center gap-4">
                            <label
                                className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                    formState.gender === 'male'
                                        ? 'border-[#037F8C] bg-[#037F8C]/5 text-[#037F8C]'
                                        : 'border-[#E5E0D8] bg-white text-[#0D0D0D]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={formState.gender === 'male'}
                                    onChange={() =>
                                        handleChange('gender', 'male')
                                    }
                                    className="accent-[#037F8C]"
                                />
                                <span>Male</span>
                            </label>
                            <label
                                className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                    formState.gender === 'female'
                                        ? 'border-[#037F8C] bg-[#037F8C]/5 text-[#037F8C]'
                                        : 'border-[#E5E0D8] bg-white text-[#0D0D0D]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={formState.gender === 'female'}
                                    onChange={() =>
                                        handleChange('gender', 'female')
                                    }
                                    className="accent-[#037F8C]"
                                />
                                <span>Female</span>
                            </label>
                        </div>
                    </div>

                    {/* 6. Nationality */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Nationality
                        </label>
                        <select
                            value={formState.nationality || ''}
                            onChange={(e) =>
                                handleChange('nationality', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                        >
                            <option value="">Select Nationality</option>
                            {hasCustomNationality && (
                                <option value={formState.nationality}>
                                    {formState.nationality}
                                </option>
                            )}
                            {NATIONALITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.labelEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default OwnerFormDrawer;

