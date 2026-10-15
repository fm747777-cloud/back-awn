import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Palette, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AssetStatus {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { id?: string; name?: string; email?: string } | string | null;
}

interface AssetStatusFormProps {
    isOpen: boolean;
    editingItem: AssetStatus | null;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; color: string }) => void;
}

const PRESET_COLORS = [
    '#2D3F2C',
    '#265938',
    '#2563EB',
    '#7C3AED',
    '#DB2777',
    '#DC2626',
    '#EA580C',
    '#CA8A04',
    '#0891B2',
    '#6B7280',
];

const DEFAULT_FORM = { name: '', description: '', color: '#2D3F2C' };

const AssetStatusForm: React.FC<AssetStatusFormProps> = ({
    isOpen,
    editingItem,
    isSubmitting,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [form, setForm] = useState(DEFAULT_FORM);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setForm(
            editingItem
                ? {
                    name: editingItem.name || '',
                    description: editingItem.description || '',
                    color: editingItem.color || '#2D3F2C',
                }
                : DEFAULT_FORM,
        );
        setError('');
    }, [isOpen, editingItem]);

    if (!isOpen) return null;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = form.name.trim();
        const description = form.description.trim();
        const color = form.color.trim();

        if (!name) {
            setError(isRtl ? 'اسم الحالة مطلوب' : 'Status name is required');
            return;
        }

        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            setError(isRtl ? 'كود اللون غير صحيح' : 'Invalid color code');
            return;
        }

        setError('');
        onSubmit({ name, description, color });
    };

    const inputClass =
        'w-full rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 px-3 py-2.5 text-sm text-[#0D0D0D] dark:text-slate-100 outline-none focus:border-[#2D3F2C]';

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <form
                onSubmit={handleSubmit}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-s border-[#E5E0D8] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                            {editingItem
                                ? isRtl
                                    ? 'تعديل حالة الأصل'
                                    : 'Edit Asset Status'
                                : isRtl
                                    ? 'إضافة حالة أصل'
                                    : 'Create Asset Status'}
                        </h2>
                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">
                            {isRtl
                                ? 'أدخل بيانات حالة الأصل'
                                : 'Enter the asset status information'}
                        </p>
                    </div>

                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-[#6E6862] hover:bg-white dark:hover:bg-slate-700" aria-label={isRtl ? 'إغلاق' : 'Close'}>
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-5 p-6">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl ? 'اسم الحالة' : 'Status Name'} *
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder={isRtl ? 'أدخل اسم الحالة' : 'Enter status name'}
                            className={inputClass}
                            maxLength={150}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl ? 'الوصف' : 'Description'}
                        </label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder={isRtl ? 'أدخل وصف الحالة' : 'Enter status description'}
                            className={`${inputClass} resize-none`}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                            <Palette size={15} className="me-1 inline" />
                            {isRtl ? 'اللون' : 'Color'}
                        </label>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    title={preset}
                                    onClick={() => setForm((prev) => ({ ...prev, color: preset }))}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${form.color.toLowerCase() === preset.toLowerCase() ? 'scale-110 border-black ring-2 ring-[#2D3F2C]/30' : 'border-black/10'}`}
                                    style={{ backgroundColor: preset }}
                                    disabled={isSubmitting}
                                >
                                    {form.color.toLowerCase() === preset.toLowerCase() && <Check size={15} className="text-white" />}
                                </button>
                            ))}

                            <input
                                type="color"
                                value={/^#([A-Fa-f0-9]{6})$/.test(form.color) ? form.color : '#2D3F2C'}
                                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                                className="h-9 w-10 cursor-pointer rounded-lg border border-[#E5E0D8] p-1"
                                disabled={isSubmitting}
                                aria-label={isRtl ? 'اختيار اللون' : 'Choose color'}
                            />
                        </div>

                        <input
                            value={form.color}
                            onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                            dir="ltr"
                            placeholder="#2D3F2C"
                            className={`${inputClass} mt-3 font-mono`}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#6E6862] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900">
                        {t('common.cancel', isRtl ? 'إلغاء' : 'Cancel')}
                    </button>

                    <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#233122] disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting
                            ? isRtl ? 'جاري الحفظ...' : 'Saving...'
                            : editingItem
                                ? t('common.saveChanges', isRtl ? 'حفظ التعديلات' : 'Save Changes')
                                : isRtl ? 'إنشاء الحالة' : 'Create Status'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssetStatusForm;