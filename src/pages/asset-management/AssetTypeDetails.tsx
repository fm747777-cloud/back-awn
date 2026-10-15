import React, { useEffect } from 'react';
import {
    Edit2,
    X,
    Package,
    Calendar,
    Layers,
} from 'lucide-react';

import type { AssetType } from './AssetTypeForm';

export interface Option {
    id: string;
    name: string;
}

interface AssetTypeDetailsProps {
    item: AssetType | null;
    packages: Option[];
    isRtl: boolean;
    onClose: () => void;
    onEdit: (item: AssetType) => void;
}

const getLinkedPackages = (
    item: AssetType,
    allPackages: Option[],
): Option[] => {
    const raw = item as any;

    const related =
        raw.servicePackage ??
        raw.servicePackages ??
        raw.service_packages ??
        raw.servicePackagesList ??
        raw.service_packages_list ??
        raw.service_package ??
        [];

    const relations = Array.isArray(related)
        ? related
        : related
            ? [related]
            : [];

    const linked: Option[] = relations
        .map((pkg: any): Option | null => {
            if (typeof pkg === 'string') {
                return (
                    allPackages.find((p) => p.id === pkg) ?? {
                        id: pkg,
                        name: pkg,
                    }
                );
            }

            const id = String(
                pkg?.id ??
                pkg?.service_package_id ??
                pkg?.servicePackageId ??
                '',
            );

            if (!id) return null;

            return {
                id,
                name:
                    pkg?.package_name ??
                    pkg?.packageName ??
                    pkg?.name ??
                    allPackages.find((p) => p.id === id)?.name ??
                    id,
            };
        })
        .filter((pkg): pkg is Option => pkg !== null);

    const ids = Array.isArray(raw.service_package_ids)
        ? raw.service_package_ids
        : [];

    linked.push(
        ...ids
            .map((value: any) => {
                const id =
                    typeof value === 'string'
                        ? value
                        : String(value?.id ?? '');

                if (!id) return null;

                return (
                    allPackages.find((pkg) => pkg.id === id) ?? {
                        id,
                        name: id,
                    }
                );
            })
            .filter((pkg: Option | null): pkg is Option => pkg !== null),
    );

    return Array.from(
        new Map(linked.map((pkg) => [pkg.id, pkg])).values(),
    );
};

const AssetTypeDetails: React.FC<AssetTypeDetailsProps> = ({
    item,
    packages,
    isRtl,
    onClose,
    onEdit,
}) => {
    useEffect(() => {
        if (!item) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [item, onClose]);

    if (!item) return null;

    const linkedPackages = getLinkedPackages(item, packages);

    const raw = item as any;

    const categoryName =
        raw.assetsCategory?.name ??
        raw.assets_category?.name ??
        raw.category?.name ??
        item.assetsCategoryId ??
        '—';

    const createdBy =
        typeof item.createdBy === 'string'
            ? item.createdBy
            : (item.createdBy as any)?.name ?? '—';

    const createdDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString(
            isRtl ? 'ar-EG' : 'en-GB',
        )
        : '—';

    const detailClass =
        'rounded-xl border border-[#E5E0D8] bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50';

    const labelClass =
        'mb-1.5 block text-xs font-medium text-[#857E74] dark:text-slate-400';

    const valueClass =
        'break-words text-sm text-[#0D0D0D] dark:text-slate-100';

    const fields = [
        {
            label: isRtl ? 'المعرّف' : 'ID',
            value: item.id || '—',
            mono: true,
        },
        {
            label: isRtl ? 'اسم الكود' : 'Code Name',
            value: raw.codeName || '—',
        },
        {
            label: isRtl ? 'نوع الأصل' : 'Asset Type',
            value: item.type || '—',
        },
        {
            label: isRtl ? 'قسم الأصل' : 'Asset Category',
            value: categoryName,
        },
    ];

    return (
        <div
            className="fixed inset-0 z-[70]"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <button
                type="button"
                aria-label={isRtl ? 'إغلاق التفاصيل' : 'Close details'}
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-label={isRtl ? 'تفاصيل نوع الأصل' : 'Asset Type Details'}
                className="absolute end-0 top-0 flex h-full w-full max-w-lg flex-col border-s border-[#E5E0D8] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
                <header className="flex items-center justify-between gap-3 border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5 dark:border-slate-800 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl ? 'تفاصيل نوع الأصل' : 'Asset Type Details'}
                        </h2>

                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">
                            {isRtl
                                ? 'عرض بيانات الأصل وباقات الخدمات المرتبطة'
                                : 'View asset type information and linked service packages'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={isRtl ? 'إغلاق' : 'Close'}
                        className="rounded-lg p-2 text-[#6E6862] transition-colors hover:bg-white dark:hover:bg-slate-700"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div className="flex items-center gap-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-green-400">
                            <Layers size={23} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#857E74]">
                                {isRtl ? 'اسم نوع الأصل' : 'Asset Type Name'}
                            </p>

                            <h3 className="mt-1 break-words text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                {item.name || '—'}
                            </h3>

                            <span className="mt-2 inline-flex rounded-md bg-[#2D3F2C]/10 px-2 py-1 text-xs font-medium text-[#2D3F2C] dark:text-green-400">
                                {item.type || '—'}
                            </span>
                        </div>
                    </div>

                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl ? 'المعلومات الأساسية' : 'Basic Information'}
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {fields.map((field) => (
                                <div
                                    key={field.label}
                                    className={detailClass}
                                >
                                    <label className={labelClass}>
                                        {field.label}
                                    </label>

                                    <p
                                        className={`${valueClass} ${field.mono
                                                ? 'break-all font-mono text-xs'
                                                : ''
                                            } `}
                                    >
                                        {field.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className={detailClass}>
                            <label className={labelClass}>
                                {isRtl ? 'الوصف' : 'Description'}
                            </label>

                            <p className={`${valueClass} whitespace - pre - wrap`}>
                                {item.description?.trim() ||
                                    (isRtl ? 'لا يوجد وصف' : 'No description')}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                                <Package
                                    size={17}
                                    className="text-[#2D3F2C] dark:text-green-400"
                                />
                                {isRtl ? 'باقات الخدمات' : 'Service Packages'}
                            </h3>

                            <span className="rounded-full bg-[#2D3F2C]/10 px-2.5 py-1 text-xs font-semibold text-[#2D3F2C] dark:text-green-400">
                                {linkedPackages.length}
                            </span>
                        </div>

                        {linkedPackages.length > 0 ? (
                            <div className="space-y-2">
                                {linkedPackages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className="flex items-start gap-3 rounded-xl border border-[#E5E0D8] p-3 dark:border-slate-700"
                                    >
                                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAF8F5] text-[#2D3F2C] dark:bg-slate-800 dark:text-green-400">
                                            <Package size={17} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">
                                                {pkg.name}
                                            </p>

                                            <p className="mt-1 break-all font-mono text-xs text-[#857E74]">
                                                {pkg.id}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-[#E5E0D8] p-6 text-center dark:border-slate-700">
                                <Package
                                    size={26}
                                    className="mx-auto mb-2 text-[#857E74]"
                                />

                                <p className="text-sm text-[#857E74]">
                                    {isRtl
                                        ? 'لا توجد باقات خدمات مرتبطة بهذا النوع'
                                        : 'No service packages linked to this asset type'}
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isRtl ? 'بيانات التسجيل' : 'Record Information'}
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className={detailClass}>
                                <label className={labelClass}>
                                    <Calendar size={13} className="me-1 inline" />
                                    {isRtl ? 'تاريخ الإنشاء' : 'Created Date'}
                                </label>

                                <p className={valueClass}>{createdDate}</p>
                            </div>

                            <div className={detailClass}>
                                <label className={labelClass}>
                                    {isRtl ? 'أنشئ بواسطة' : 'Created By'}
                                </label>

                                <p className={valueClass}>{createdBy}</p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="flex justify-end gap-2 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-sm font-medium text-[#6E6862] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                        {isRtl ? 'إغلاق' : 'Close'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-2 rounded-lg bg-[#2D3F2C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#233122]"
                    >
                        <Edit2 size={15} />
                        {isRtl ? 'تعديل' : 'Edit'}
                    </button>
                </footer>
            </aside>
        </div>
    );
};

export default AssetTypeDetails;