import React, { useState } from 'react';
import {
    X,
    UserPlus,
    AlertCircle,
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
    companies: _companies,
    leads: _leads,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    void _companies;
    void _leads;

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
                    fullNameAr: initialData.fullNameAr || initialData.fullNameEn,
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

        const trimmedName = formState.fullNameEn.trim();
        const trimmedPhone = formState.phone.trim();
        const trimmedEmail = formState.email.trim();

        const payloadToValidate = {
            ...formState,
            fullNameEn: trimmedName,
            fullNameAr: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            companyId: formState.companyId?.trim() || undefined,
            leadId: formState.leadId?.trim() || undefined,
        };

        const parsed = crmContactInputSchema.safeParse(payloadToValidate);
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
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C] shrink-0">
                            <UserPlus size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="contact-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate"
                            >
                                Add New Contact
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

                    {/* 1. Contact Name* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Contact Name <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formState.fullNameEn}
                            onChange={(e) => {
                                handleChange('fullNameEn', e.target.value);
                                handleChange('fullNameAr', e.target.value);
                            }}
                            placeholder="Enter Contact Name"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
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

                    {/* 2. Contact Number* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Contact Number <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={formState.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
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

                    {/* 3. Email Address* */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            Email Address <span className="text-[#A63A3A]">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formState.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Enter Email Address"
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
export default ContactFormDrawer;

