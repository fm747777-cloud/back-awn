import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AssetType {
    id: string;
    type: string;
    name: string;
    description?: string | null;
    assetsCategoryId: string;
    service_package_ids?: string[];
    assetsCategory?: {
        id: string;
        name?: string;
    };
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { id?: string; name?: string } | string | null;
}

export interface AssetTypeFormData {
    type: string;
    name: string;
    description: string;
    assetsCategoryId: string;
    service_package_ids: string[];
}

interface Option {
    id: string;
    name: string;
}

interface AssetTypeFormProps {
    isOpen: boolean;
    editingItem: AssetType | null;
    isSubmitting: boolean;
    categories: Option[];
    servicePackages: Option[];
    onClose: () => void;
    onSubmit: (data: AssetTypeFormData) => void;
}

const DEFAULT_FORM: AssetTypeFormData = {
    type: '',
    name: '',
    description: '',
    assetsCategoryId: '',
    service_package_ids: [],
};

const INPUT_CLASS =
    'w-full rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 px-3 py-2.5 text-sm text-[#0D0D0D] dark:text-slate-100 outline-none focus:border-[#2D3F2C] disabled:opacity-60';

const LABEL_CLASS =
    'mb-1.5 block text-sm font-semibold text-[#0D0D0D] dark:text-slate-100';

const AssetTypeForm: React.FC<AssetTypeFormProps> = ({
    isOpen,
    editingItem,
    isSubmitting,
    categories,
    servicePackages,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const [form, setForm] = useState<AssetTypeFormData>(DEFAULT_FORM);
    const [error, setError] = useState('');
    const [packageSearch, setPackageSearch] = useState('');
    const [isPackagesOpen, setIsPackagesOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setForm(
            editingItem
                ? {
                    type: editingItem.type || '',
                    name: editingItem.name || '',
                    description: editingItem.description || '',
                    assetsCategoryId: editingItem.assetsCategoryId || '',
                    service_package_ids: editingItem.service_package_ids || [],
                }
                : { ...DEFAULT_FORM },
        );

        setError('');
        setPackageSearch('');
        setIsPackagesOpen(false);
    }, [isOpen, editingItem]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                setIsPackagesOpen(false);
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    const updateField = <K extends keyof AssetTypeFormData>(
        key: K,
        value: AssetTypeFormData[K],
    ) => {
        setForm((previous) => ({ ...previous, [key]: value }));
    };

    const togglePackage = (id: string) => {
        setForm((previous) => ({
            ...previous,
            service_package_ids: previous.service_package_ids.includes(id)
                ? previous.service_package_ids.filter((item) => item !== id)
                : [...previous.service_package_ids, id],
        }));
    };

    const selectedPackages = servicePackages.filter((item) =>
        form.service_package_ids.includes(item.id),
    );

    const filteredPackages = servicePackages.filter((item) =>
        item.name.toLowerCase().includes(packageSearch.toLowerCase()),
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.type) {
            setError(
                isRtl
                    ? 'يرجى اختيار نوع الأصل'
                    : 'Please select an asset type',
            );
            return;
        }

        if (!form.name.trim()) {
            setError(
                isRtl ? 'اسم نوع الأصل مطلوب' : 'Asset type name is required',
            );
            return;
        }

        if (!form.assetsCategoryId) {
            setError(
                isRtl ? 'يرجى اختيار قسم الأصل' : 'Please select an asset category',
            );
            return;
        }

        setError('');

        onSubmit({
            type: form.type,
            name: form.name.trim(),
            description: form.description.trim(),
            assetsCategoryId: form.assetsCategoryId,
            service_package_ids: form.service_package_ids,
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <button
                type="button"
                aria-label={isRtl ? 'إغلاق' : 'Close'}
                onClick={onClose}
                disabled={isSubmitting}
                className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"
            />

            <form
                onSubmit={handleSubmit}
                className="animate-in slide-in-from-right absolute end-0 top-0 flex h-full w-full max-w-lg flex-col overflow-y-auto border-s border-[#E5E0D8] bg-white shadow-2xl duration-300 dark:border-slate-800 dark:bg-slate-900"
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                            {editingItem
                                ? isRtl
                                    ? 'تعديل نوع الأصل'
                                    : 'Edit Asset Type'
                                : isRtl
                                    ? 'إضافة نوع أصل'
                                    : 'Create Asset Type'}
                        </h2>

                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">
                            {isRtl
                                ? 'أدخل بيانات نوع الأصل'
                                : 'Enter the asset type information'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-2 text-[#6E6862] hover:bg-white disabled:opacity-50 dark:hover:bg-slate-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-5 p-6">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Asset Type */}
                    <div>
                        <label className={LABEL_CLASS}>
                            {isRtl ? 'نوع الأصل' : 'Asset Type'} *
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    value: 'Non-Vehicle',
                                    label: isRtl ? 'غير مركبة' : 'Non-Vehicle',
                                },
                                {
                                    value: 'Vehicle',
                                    label: isRtl ? 'مركبة' : 'Vehicle',
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() =>
                                        updateField('type', option.value)
                                    }
                                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${form.type === option.value
                                            ? 'border-[#2D3F2C] bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-green-300'
                                            : 'border-[#E5E0D8] bg-white text-[#6E6862] hover:border-[#2D3F2C] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                >
                                    {option.label}
                                    {form.type === option.value && (
                                        <Check
                                            size={15}
                                            className="ms-2 inline"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className={LABEL_CLASS}>
                            {isRtl ? 'اسم نوع الأصل' : 'Asset Type Name'} *
                        </label>

                        <input
                            value={form.name}
                            onChange={(event) =>
                                updateField('name', event.target.value)
                            }
                            placeholder={
                                isRtl ? 'أدخل الاسم' : 'Enter asset type name'
                            }
                            className={INPUT_CLASS}
                            maxLength={150}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className={LABEL_CLASS}>
                            {isRtl ? 'قسم الأصل' : 'Asset Category'} *
                        </label>

                        <select
                            value={form.assetsCategoryId}
                            onChange={(event) =>
                                updateField(
                                    'assetsCategoryId',
                                    event.target.value,
                                )
                            }
                            className={INPUT_CLASS}
                            disabled={isSubmitting}
                            required
                        >
                            <option value="">
                                {isRtl
                                    ? 'اختر قسم الأصل'
                                    : 'Select asset category'}
                            </option>

                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {categories.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                                {isRtl
                                    ? 'لا توجد أقسام متاحة. أضف قسمًا أولًا.'
                                    : 'No categories available. Create a category first.'}
                            </p>
                        )}
                    </div>

                    {/* Service Packages - Multi Select Dropdown */}
                    <div className="relative">
                        <label className={LABEL_CLASS}>
                            {isRtl ? 'باقات الخدمات' : 'Service Packages'}
                        </label>

                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                                setIsPackagesOpen((previous) => !previous)
                            }
                            className={`${INPUT_CLASS} flex items-center justify-between gap-2 text-start`}
                        >
                            <span className="truncate">
                                {selectedPackages.length > 0
                                    ? isRtl
                                        ? `تم اختيار ${selectedPackages.length} باقة`
                                        : `${selectedPackages.length} package(s) selected`
                                    : isRtl
                                        ? 'اختر باقات الخدمات'
                                        : 'Select service packages'}
                            </span>

                            <ChevronDown
                                size={17}
                                className={`shrink-0 transition-transform ${isPackagesOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* Selected package chips */}
                        {selectedPackages.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedPackages.map((item) => (
                                    <span
                                        key={item.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-[#2D3F2C]/10 px-2.5 py-1.5 text-xs font-medium text-[#2D3F2C] dark:text-green-300"
                                    >
                                        {item.name}

                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                togglePackage(item.id)
                                            }
                                            aria-label={`Remove ${item.name}`}
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {isPackagesOpen && (
                            <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="border-b border-[#E5E0D8] p-2 dark:border-slate-700">
                                    <div className="flex items-center gap-2 rounded-lg border border-[#E5E0D8] px-3 dark:border-slate-700">
                                        <Search
                                            size={15}
                                            className="text-[#857E74]"
                                        />

                                        <input
                                            value={packageSearch}
                                            onChange={(event) =>
                                                setPackageSearch(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                isRtl
                                                    ? 'ابحث عن باقة...'
                                                    : 'Search packages...'
                                            }
                                            className="w-full bg-transparent py-2 text-sm outline-none dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="max-h-52 overflow-y-auto p-1.5">
                                    {filteredPackages.length === 0 ? (
                                        <p className="p-3 text-center text-sm text-[#857E74]">
                                            {isRtl
                                                ? 'لا توجد باقات'
                                                : 'No packages found'}
                                        </p>
                                    ) : (
                                        filteredPackages.map((item) => {
                                            const checked =
                                                form.service_package_ids.includes(
                                                    item.id,
                                                );

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() =>
                                                        togglePackage(item.id)
                                                    }
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm hover:bg-[#FAF8F5] dark:hover:bg-slate-700"
                                                >
                                                    <span
                                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked
                                                                ? 'border-[#2D3F2C] bg-[#2D3F2C] text-white'
                                                                : 'border-gray-300 dark:border-slate-500'
                                                            }`}
                                                    >
                                                        {checked && (
                                                            <Check size={12} />
                                                        )}
                                                    </span>

                                                    <span className="text-[#0D0D0D] dark:text-slate-100">
                                                        {item.name}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-[#E5E0D8] px-3 py-2 dark:border-slate-700">
                                    <span className="text-xs text-[#857E74]">
                                        {isRtl
                                            ? `المحدد: ${selectedPackages.length}`
                                            : `Selected: ${selectedPackages.length}`}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsPackagesOpen(false)
                                        }
                                        className="rounded-md bg-[#2D3F2C] px-3 py-1.5 text-xs font-medium text-white"
                                    >
                                        {isRtl ? 'تم' : 'Done'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className={LABEL_CLASS}>
                            {isRtl ? 'الوصف' : 'Description'}
                        </label>

                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={(event) =>
                                updateField('description', event.target.value)
                            }
                            placeholder={
                                isRtl ? 'أدخل الوصف' : 'Enter description'
                            }
                            className={`${INPUT_CLASS} resize-none`}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#6E6862] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                    >
                        {t('common.cancel', isRtl ? 'إلغاء' : 'Cancel')}
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || categories.length === 0}
                        className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#233122] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting
                            ? isRtl
                                ? 'جاري الحفظ...'
                                : 'Saving...'
                            : editingItem
                                ? isRtl
                                    ? 'حفظ التعديلات'
                                    : 'Save Changes'
                                : isRtl
                                    ? 'إنشاء نوع الأصل'
                                    : 'Create Asset Type'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssetTypeForm;