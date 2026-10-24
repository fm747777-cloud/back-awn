import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
    crmOrganizationalTypeInputSchema,
    type CrmOrganizationalTypeInput,
    type CrmOrganizationalTypeRecord,
} from '../../../schemas/crmSchema';

interface OrganizationalTypeFormDrawerProps {
    isOpen: boolean;
    editingRecord: CrmOrganizationalTypeRecord | null;
    existingRecords: CrmOrganizationalTypeRecord[];
    isSubmitting: boolean;
    apiError: string | null;
    onClose: () => void;
    onSubmit: (values: CrmOrganizationalTypeInput) => Promise<void> | void;
}

interface FormState {
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
}

const DEFAULT_STATE: FormState = {
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
};

export const OrganizationalTypeFormDrawer: React.FC<OrganizationalTypeFormDrawerProps> = ({
    isOpen,
    editingRecord,
    existingRecords,
    isSubmitting,
    apiError,
    onClose,
    onSubmit,
}) => {
    const [formState, setFormState] = useState<FormState>(DEFAULT_STATE);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;

        if (editingRecord) {
            setFormState({
                nameEn: editingRecord.nameEn,
                nameAr: editingRecord.nameAr,
                descriptionEn: editingRecord.descriptionEn || editingRecord.descriptionAr || '',
            });
        } else {
            setFormState(DEFAULT_STATE);
        }

        setErrors({});
    }, [isOpen, editingRecord]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setErrors({});

        const normalizedPayload: CrmOrganizationalTypeInput = {
            nameEn: formState.nameEn.trim(),
            nameAr: formState.nameAr.trim(),
            descriptionEn: formState.descriptionEn.trim() || undefined,
            descriptionAr: editingRecord?.descriptionAr || undefined,
            status: editingRecord?.status ?? 'active',
        };

        const parsed = crmOrganizationalTypeInputSchema.safeParse(normalizedPayload);
        const nextErrors: Record<string, string> = {};

        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!nextErrors[key]) {
                    nextErrors[key] = issue.message;
                }
            }
        }

        const duplicateEn = existingRecords.some(
            (record) =>
                record.id !== editingRecord?.id &&
                record.nameEn.trim().toLowerCase() === normalizedPayload.nameEn.toLowerCase()
        );
        if (duplicateEn) {
            nextErrors.nameEn = 'An organizational type with this English name already exists.';
        }

        const duplicateAr = existingRecords.some(
            (record) =>
                record.id !== editingRecord?.id &&
                record.nameAr.trim() === normalizedPayload.nameAr
        );
        if (duplicateAr) {
            nextErrors.nameAr =
                'يوجد نوع تنظيمي بنفس الاسم العربي مسبقاً (Arabic organizational type name already exists).';
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (parsed.success) {
            await onSubmit(parsed.data);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => {
                if (!isSubmitting) onClose();
            }}
        >
            <div
                className="relative flex h-full w-full max-w-xl flex-col bg-white dark:bg-[#1E293B] shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="org-type-drawer-title"
            >
                {/* Drawer Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                    <div>
                        <h2
                            id="org-type-drawer-title"
                            className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                        >
                            Add New Organizational Type
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Close drawer"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Drawer Form Body */}
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
                    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                        {apiError && (
                            <div className="rounded-xl border border-red-200 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/40 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
                                {apiError}
                            </div>
                        )}

                        {/* 1. Name (In English)* */}
                        <div>
                            <label
                                htmlFor="org-type-name-en"
                                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                                Name (In English)<span className="text-red-500">*</span>
                            </label>
                            <input
                                id="org-type-name-en"
                                type="text"
                                required
                                maxLength={150}
                                value={formState.nameEn}
                                onChange={(event) => handleChange('nameEn', event.target.value)}
                                placeholder="Enter Name (In English)"
                                disabled={isSubmitting}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900/80 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                    errors.nameEn
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-200 dark:border-slate-700 focus:border-[#0052CC] focus:ring-[#0052CC]/20'
                                }`}
                            />
                            {errors.nameEn && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                                    {errors.nameEn}
                                </p>
                            )}
                        </div>

                        {/* 2. Name (In Arabic)* */}
                        <div>
                            <label
                                htmlFor="org-type-name-ar"
                                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                                Name (In Arabic)<span className="text-red-500">*</span>
                            </label>
                            <input
                                id="org-type-name-ar"
                                type="text"
                                dir="rtl"
                                required
                                maxLength={150}
                                value={formState.nameAr}
                                onChange={(event) => handleChange('nameAr', event.target.value)}
                                placeholder="Enter Name (In Arabic)"
                                disabled={isSubmitting}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900/80 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                    errors.nameAr
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-200 dark:border-slate-700 focus:border-[#0052CC] focus:ring-[#0052CC]/20'
                                }`}
                            />
                            {errors.nameAr && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                                    {errors.nameAr}
                                </p>
                            )}
                        </div>

                        {/* 3. Description */}
                        <div>
                            <label
                                htmlFor="org-type-desc"
                                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                            >
                                Description
                            </label>
                            <textarea
                                id="org-type-desc"
                                rows={3}
                                maxLength={500}
                                value={formState.descriptionEn}
                                onChange={(event) => handleChange('descriptionEn', event.target.value)}
                                placeholder="Type Your Message"
                                disabled={isSubmitting}
                                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900/80 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                                    errors.descriptionEn
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-200 dark:border-slate-700 focus:border-[#0052CC] focus:ring-[#0052CC]/20'
                                }`}
                            />
                            {errors.descriptionEn && (
                                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                                    {errors.descriptionEn}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Drawer Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#0052CC] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0047B3] focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30 transition-all disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>Submit</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
