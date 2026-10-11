import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CrmTaskPriority } from '../../../schemas/crmSchema';

export interface CrmTaskPriorityBadgeProps {
    priority: CrmTaskPriority;
}

const PRIORITY_STYLES: Record<CrmTaskPriority, string> = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-sky-50 text-sky-700 border-sky-200',
    High: 'bg-amber-50 text-amber-800 border-amber-200',
    Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PRIORITY_LABELS: Record<CrmTaskPriority, { en: string; ar: string }> = {
    Low: { en: 'Low', ar: 'منخفض' },
    Medium: { en: 'Medium', ar: 'متوسط' },
    High: { en: 'High', ar: 'مرتفع' },
    Urgent: { en: 'Urgent', ar: 'عاجل' },
};

export const CrmTaskPriorityBadge: React.FC<CrmTaskPriorityBadgeProps> = ({
    priority,
}) => {
    const { i18n } = useTranslation();
    const isArabic = i18n.language.startsWith('ar');

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
        >
            {isArabic ? PRIORITY_LABELS[priority].ar : PRIORITY_LABELS[priority].en}
        </span>
    );
};
