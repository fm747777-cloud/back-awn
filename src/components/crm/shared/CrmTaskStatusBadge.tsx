import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    XCircle,
    Clock,
    PlayCircle,
    ClipboardList,
    AlertTriangle,
} from 'lucide-react';
import type {
    CrmApprovalTaskStatus,
    CrmOperationalTaskStatus,
} from '../../../schemas/crmSchema';

export interface CrmTaskStatusBadgeProps {
    status: CrmApprovalTaskStatus | CrmOperationalTaskStatus;
    variant?: 'approval' | 'operational';
}

export const CrmTaskStatusBadge: React.FC<CrmTaskStatusBadgeProps> = ({
    status,
    variant = 'operational',
}) => {
    const { i18n } = useTranslation();
    const isArabic = i18n.language.startsWith('ar');

    if (variant === 'approval' || status === 'Approved') {
        if (status === 'Approved') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isArabic ? 'معتمد' : 'Approved'}
                </span>
            );
        }
        if (status === 'Rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <XCircle className="h-3.5 w-3.5" />
                    {isArabic ? 'مرفوض' : 'Rejected'}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Clock className="h-3.5 w-3.5" />
                {isArabic ? 'بانتظار الاعتماد' : 'Pending'}
            </span>
        );
    }

    if (status === 'Completed') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isArabic ? 'مكتمل' : 'Completed'}
            </span>
        );
    }

    if (status === 'In Progress') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                <PlayCircle className="h-3.5 w-3.5" />
                {isArabic ? 'قيد التنفيذ' : 'In Progress'}
            </span>
        );
    }

    if (status === 'Under Review') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                <Clock className="h-3.5 w-3.5" />
                {isArabic ? 'قيد المراجعة' : 'Under Review'}
            </span>
        );
    }

    if (status === 'Blocked') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                {isArabic ? 'متوقف' : 'Blocked'}
            </span>
        );
    }

    if (status === 'Rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                {isArabic ? 'مرفوض' : 'Rejected'}
            </span>
        );
    }

    if (status === 'Pending') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Clock className="h-3.5 w-3.5" />
                {isArabic ? 'بانتظار الإسناد' : 'Pending'}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            <ClipboardList className="h-3.5 w-3.5" />
            {isArabic ? 'مسند' : 'Assigned'}
        </span>
    );
};
