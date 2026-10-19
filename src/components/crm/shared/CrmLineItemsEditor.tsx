import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Package, Briefcase, Calculator } from 'lucide-react';
import {
    calculateCrmQuotationLineItem,
    calculateCrmQuotationTotals,
    type CrmQuotationLineItem,
    type CrmTaxRecord,
} from '../../../schemas/crmSchema';
import type { CrmServiceCatalogItem } from '../../../api/api';

export interface CrmLineItemsEditorProps {
    lineItems: CrmQuotationLineItem[];
    catalogItems: CrmServiceCatalogItem[];
    taxes: CrmTaxRecord[];
    onChange: (items: CrmQuotationLineItem[]) => void;
    error?: string;
}

export const CrmLineItemsEditor: React.FC<CrmLineItemsEditorProps> = ({
    lineItems,
    catalogItems,
    taxes,
    onChange,
    error,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultVatRate =
        taxes.find((tx) => tx.isDefault && tx.status === 'active')?.rate ??
        taxes.find((tx) => tx.status === 'active')?.rate ??
        15;

    const services = catalogItems.filter((item) => item.itemType === 'service');
    const packages = catalogItems.filter((item) => item.itemType === 'package');

    const updateItemAt = (
        index: number,
        patch: Partial<CrmQuotationLineItem>
    ) => {
        const current = lineItems[index];
        if (!current) return;
        const merged = { ...current, ...patch };
        const recalculated = calculateCrmQuotationLineItem({
            id: merged.id,
            itemType: merged.itemType,
            serviceId: merged.serviceId,
            packageId: merged.packageId,
            descriptionEn: merged.descriptionEn,
            descriptionAr: merged.descriptionAr,
            quantity: Number(merged.quantity || 1),
            unitPrice: Number(merged.unitPrice || 0),
            discountPercent: Number(merged.discountPercent || 0),
            taxRate: Number(merged.taxRate ?? defaultVatRate),
        });
        const next = [...lineItems];
        next[index] = recalculated;
        onChange(next);
    };

    const handleCatalogSelect = (index: number, catalogId: string) => {
        const current = lineItems[index];
        if (!current) return;
        if (!catalogId) {
            updateItemAt(index, {
                serviceId: undefined,
                packageId: undefined,
            });
            return;
        }
        const found = catalogItems.find((c) => c.id === catalogId);
        if (!found) return;
        updateItemAt(index, {
            itemType: found.itemType,
            serviceId: found.itemType === 'service' ? found.id : undefined,
            packageId: found.itemType === 'package' ? found.id : undefined,
            descriptionEn: found.nameEn,
            descriptionAr: found.nameAr,
            unitPrice: found.unitPrice,
        });
    };

    const handleAddLineItem = (itemType: 'service' | 'package' = 'service') => {
        const defaultCatalog = catalogItems.find((c) => c.itemType === itemType);
        const newItem = calculateCrmQuotationLineItem({
            id: `crm-qli-draft-${Date.now()}-${lineItems.length + 1}`,
            itemType,
            serviceId:
                itemType === 'service' ? defaultCatalog?.id : undefined,
            packageId:
                itemType === 'package' ? defaultCatalog?.id : undefined,
            descriptionEn: defaultCatalog?.nameEn || '',
            descriptionAr: defaultCatalog?.nameAr || '',
            quantity: 1,
            unitPrice: defaultCatalog?.unitPrice ?? 15000,
            discountPercent: 0,
            taxRate: defaultVatRate,
        });
        onChange([...lineItems, newItem]);
    };

    const handleRemoveLineItem = (index: number) => {
        if (lineItems.length <= 1) return;
        onChange(lineItems.filter((_, idx) => idx !== index));
    };

    const summary = calculateCrmQuotationTotals(lineItems);

    return (
        <div className="space-y-4">
            {/* Header & Add Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5">
                        <Calculator size={14} className="text-[#037F8C]" />
                        {t('crm.commercial.common.lineItems.sectionTitle')}
                    </h3>
                    <p className="text-[11px] text-[#6E6862]">
                        {t('crm.commercial.common.lineItems.sectionSubtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleAddLineItem('service')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#037F8C]/25 bg-[#037F8C]/10 hover:bg-[#037F8C]/15 text-[11px] font-semibold text-[#037F8C] transition-colors cursor-pointer"
                    >
                        <Briefcase size={12} />
                        <Plus size={12} />
                        {t('crm.commercial.common.lineItems.typeService')}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddLineItem('package')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[11px] font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <Package size={12} className="text-[#037F8C]" />
                        <Plus size={12} />
                        {t('crm.commercial.common.lineItems.typePackage')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-[#A63A3A]/30 bg-[#FCECE9] px-3.5 py-2.5 text-xs font-medium text-[#A63A3A]">
                    {error}
                </div>
            )}

            {/* Line Item Cards */}
            <div className="space-y-3">
                {lineItems.map((item, idx) => {
                    const selectedCatalogId =
                        item.itemType === 'package'
                            ? item.packageId || ''
                            : item.serviceId || '';
                    const availableCatalog =
                        item.itemType === 'package' ? packages : services;

                    return (
                        <div
                            key={item.id || idx}
                            className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-3.5 space-y-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        #{idx + 1}
                                    </span>
                                    <select
                                        value={item.itemType}
                                        onChange={(e) => {
                                            const nextType = e.target.value as
                                                | 'service'
                                                | 'package';
                                            const firstMatch = catalogItems.find(
                                                (c) => c.itemType === nextType
                                            );
                                            updateItemAt(idx, {
                                                itemType: nextType,
                                                serviceId:
                                                    nextType === 'service'
                                                        ? firstMatch?.id
                                                        : undefined,
                                                packageId:
                                                    nextType === 'package'
                                                        ? firstMatch?.id
                                                        : undefined,
                                                descriptionEn:
                                                    firstMatch?.nameEn ||
                                                    item.descriptionEn,
                                                descriptionAr:
                                                    firstMatch?.nameAr ||
                                                    item.descriptionAr,
                                                unitPrice:
                                                    firstMatch?.unitPrice ??
                                                    item.unitPrice,
                                            });
                                        }}
                                        className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D]"
                                    >
                                        <option value="service">
                                            {t('crm.commercial.common.lineItems.typeService')}
                                        </option>
                                        <option value="package">
                                            {t('crm.commercial.common.lineItems.typePackage')}
                                        </option>
                                    </select>

                                    <select
                                        value={selectedCatalogId}
                                        onChange={(e) =>
                                            handleCatalogSelect(idx, e.target.value)
                                        }
                                        className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] max-w-[260px]"
                                    >
                                        <option value="">
                                            {t('crm.commercial.common.lineItems.customEntry')}
                                        </option>
                                        {availableCatalog.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {isRtl ? cat.nameAr : cat.nameEn} (
                                                {cat.unitPrice.toLocaleString()} SAR)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {lineItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLineItem(idx)}
                                        aria-label={t(
                                            'crm.commercial.common.lineItems.removeItem'
                                        )}
                                        className="p-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FCECE9] text-[#6E6862] hover:text-[#A63A3A] transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Bilingual Descriptions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t(
                                            'crm.commercial.common.lineItems.descriptionEnLabel'
                                        )}{' '}
                                        *
                                    </label>
                                    <input
                                        type="text"
                                        value={item.descriptionEn}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                descriptionEn: e.target.value,
                                            })
                                        }
                                        dir="ltr"
                                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t(
                                            'crm.commercial.common.lineItems.descriptionArLabel'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={item.descriptionAr || ''}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                descriptionAr: e.target.value,
                                            })
                                        }
                                        dir="rtl"
                                        className="w-full px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                                    />
                                </div>
                            </div>

                            {/* Numeric Pricing Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t('crm.commercial.common.lineItems.quantityLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                quantity: Math.max(
                                                    1,
                                                    Number(e.target.value || 1)
                                                ),
                                            })
                                        }
                                        dir="ltr"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t(
                                            'crm.commercial.common.lineItems.unitPriceLabel'
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                unitPrice: Math.max(
                                                    0,
                                                    Number(e.target.value || 0)
                                                ),
                                            })
                                        }
                                        dir="ltr"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t(
                                            'crm.commercial.common.lineItems.discountPercentLabel'
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={item.discountPercent}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                discountPercent: Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        Number(e.target.value || 0)
                                                    )
                                                ),
                                            })
                                        }
                                        dir="ltr"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t('crm.commercial.common.lineItems.taxRateLabel')}
                                    </label>
                                    <select
                                        value={item.taxRate}
                                        onChange={(e) =>
                                            updateItemAt(idx, {
                                                taxRate: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                                    >
                                        {taxes.map((tx) => (
                                            <option key={tx.id} value={tx.rate}>
                                                {tx.rate}% —{' '}
                                                {isRtl ? tx.nameAr : tx.nameEn}
                                            </option>
                                        ))}
                                        {!taxes.some(
                                            (tx) => tx.rate === item.taxRate
                                        ) && (
                                            <option value={item.taxRate}>
                                                {item.taxRate}%
                                            </option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                        {t(
                                            'crm.commercial.common.lineItems.lineTotalLabel'
                                        )}
                                    </label>
                                    <div
                                        className="px-2.5 py-1.5 rounded-lg border border-[#037F8C]/20 bg-[#037F8C]/5 text-xs font-mono font-bold text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        {item.lineTotal.toLocaleString()} SAR
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Financial Totals Summary Box */}
            <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#6E6862]">
                    <span>{t('crm.commercial.common.lineItems.subtotal')}</span>
                    <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                        {summary.subtotal.toLocaleString()} SAR
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6E6862]">
                    <span>{t('crm.commercial.common.lineItems.discountTotal')}</span>
                    <span className="font-mono font-semibold text-[#B45309]" dir="ltr">
                        - {summary.discountTotal.toLocaleString()} SAR
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6E6862]">
                    <span>{t('crm.commercial.common.lineItems.taxableAmount')}</span>
                    <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                        {summary.taxableAmount.toLocaleString()} SAR
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#6E6862]">
                    <span>{t('crm.commercial.common.lineItems.taxAmount')}</span>
                    <span className="font-mono font-semibold text-[#0D0D0D]" dir="ltr">
                        + {summary.taxAmount.toLocaleString()} SAR
                    </span>
                </div>
                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0D0D0D]">
                        {t('crm.commercial.common.lineItems.grandTotal')}
                    </span>
                    <span
                        className="text-base font-mono font-bold text-[#037F8C]"
                        dir="ltr"
                    >
                        {summary.grandTotal.toLocaleString()} SAR
                    </span>
                </div>
            </div>
        </div>
    );
};
