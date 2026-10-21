import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    ShieldCheck,
    UserCheck,
    FileText,
    Clock,
    ExternalLink,
    Code2,
    Database,
} from 'lucide-react';
import { CRM_SALES_EMPLOYEES } from '../../../api/api';
import type {
    CrmAuditTrailEntry,
    CrmAuditAction,
} from '../../../schemas/crmSchema';

export interface AuditTrailViewDrawerProps {
    isOpen: boolean;
    entry: CrmAuditTrailEntry | null;
    onClose: () => void;
    onNavigateToResource?: (entry: CrmAuditTrailEntry) => void;
}

function formatAuditStatePayload(raw?: string): string {
    if (!raw) return '';
    try {
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return raw;
    }
}

export const AuditTrailViewDrawer: React.FC<AuditTrailViewDrawerProps> = ({
    isOpen,
    entry,
    onClose,
    onNavigateToResource,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !entry) return null;

    const getActionBadgeClasses = (action: CrmAuditAction) => {
        switch (action) {
            case 'CREATED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'UPDATED':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'STATUS_CHANGED':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'REJECTED':
            case 'DELETED':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatTimestamp = (iso: string) => {
        if (!iso) return '—';
        return iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    };

    const matchedEmp = CRM_SALES_EMPLOYEES.find(
        (emp) => emp.nameEn.toLowerCase() === entry.actorName.toLowerCase()
    );
    const actorDisplayName = isRtl
        ? matchedEmp?.nameAr || entry.actorName
        : entry.actorName;
    const actorRoleDisplay = isRtl
        ? matchedEmp?.roleAr || 'إدارة علاقات العملاء'
        : matchedEmp?.roleEn || 'CRM Operations';

    const hasStateDiff =
        Boolean(entry.previousState && entry.previousState.trim()) ||
        Boolean(entry.newState && entry.newState.trim());

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-trail-view-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-xs font-mono font-bold text-[#037F8C]"
                                dir="ltr"
                            >
                                {entry.code}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md border text-xs font-semibold ${getActionBadgeClasses(
                                    entry.action
                                )}`}
                            >
                                {t(
                                    `crm.workflow.auditTrails.actions.${entry.action}`
                                )}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-[#037F8C]/10 text-[#037F8C] text-xs font-semibold">
                                {t(
                                    `crm.workflow.auditTrails.resourceTypes.${entry.resourceType}`,
                                    { defaultValue: entry.resourceType }
                                )}
                            </span>
                        </div>
                        <h2
                            id="audit-trail-view-drawer-title"
                            className="text-lg font-bold text-[#0D0D0D] leading-snug pt-0.5"
                        >
                            {isRtl
                                ? entry.resourceNameAr || entry.resourceNameEn
                                : entry.resourceNameEn}
                        </h2>
                        <p className="text-xs text-[#6E6862]">
                            {t('crm.workflow.auditTrails.viewDrawer.subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Event Summary Banner */}
                    <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <FileText size={14} />
                                {t(
                                    'crm.workflow.auditTrails.viewDrawer.summarySection'
                                )}
                            </h3>
                            <span
                                className="text-[11px] font-mono text-[#6E6862] inline-flex items-center gap-1"
                                dir="ltr"
                            >
                                <Clock size={12} />
                                {formatTimestamp(entry.timestamp)}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-[#0D0D0D] leading-relaxed">
                            {isRtl
                                ? entry.detailsAr || entry.detailsEn
                                : entry.detailsEn}
                        </p>
                    </div>

                    {/* Target Resource Card */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <Database size={14} />
                                {t(
                                    'crm.workflow.auditTrails.viewDrawer.resourceSection'
                                )}
                            </h3>
                            {onNavigateToResource && (
                                <button
                                    type="button"
                                    onClick={() => onNavigateToResource(entry)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#037F8C] hover:text-white hover:border-[#037F8C] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                                >
                                    <ExternalLink size={12} />
                                    {t(
                                        'crm.workflow.auditTrails.viewDrawer.openResourceModule'
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.auditTrails.fields.resourceType'
                                    )}
                                </span>
                                <span className="font-bold text-[#0D0D0D] mt-0.5 block">
                                    {t(
                                        `crm.workflow.auditTrails.resourceTypes.${entry.resourceType}`,
                                        { defaultValue: entry.resourceType }
                                    )}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.auditTrails.fields.resourceCode'
                                    )}
                                </span>
                                <span
                                    className="font-mono font-bold text-[#037F8C] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {entry.resourceCode || entry.resourceId}
                                </span>
                            </div>

                            <div className="sm:col-span-2">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.auditTrails.fields.resourceNameEn'
                                    )}
                                </span>
                                <span
                                    className="font-semibold text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {entry.resourceNameEn}
                                </span>
                            </div>

                            {entry.resourceNameAr && (
                                <div className="sm:col-span-2">
                                    <span className="text-[#6E6862] block">
                                        {t(
                                            'crm.workflow.auditTrails.fields.resourceNameAr'
                                        )}
                                    </span>
                                    <span
                                        className="font-semibold text-[#0D0D0D] mt-0.5 block"
                                        dir="rtl"
                                    >
                                        {entry.resourceNameAr}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actor & Governance Card */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                            <UserCheck size={14} />
                            {t(
                                'crm.workflow.auditTrails.viewDrawer.actorSection'
                            )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-[#6E6862] block">
                                    {t('crm.workflow.auditTrails.fields.actor')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {actorDisplayName}
                                </span>
                            </div>

                            <div>
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.auditTrails.fields.actorRole'
                                    )}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] mt-0.5 block">
                                    {actorRoleDisplay}
                                </span>
                            </div>

                            <div className="sm:col-span-2">
                                <span className="text-[#6E6862] block">
                                    {t(
                                        'crm.workflow.auditTrails.fields.actorEmail'
                                    )}
                                </span>
                                <span
                                    className="font-mono text-[#0D0D0D] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {entry.actorEmail || matchedEmp?.email || 'crm@awn.sa'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bilingual Audit Log Descriptions */}
                    <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                        <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                            <ShieldCheck size={14} />
                            {t(
                                'crm.workflow.auditTrails.viewDrawer.bilingualLogSection'
                            )}
                        </h3>
                        <div className="space-y-2.5 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                    English Description
                                </span>
                                <p
                                    className="text-[#0D0D0D] leading-relaxed"
                                    dir="ltr"
                                >
                                    {entry.detailsEn}
                                </p>
                            </div>
                            {entry.detailsAr && (
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                    <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                        الوصف بالعربية
                                    </span>
                                    <p
                                        className="text-[#0D0D0D] leading-relaxed"
                                        dir="rtl"
                                    >
                                        {entry.detailsAr}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* State Snapshots (Previous / New State) */}
                    {hasStateDiff && (
                        <div className="rounded-xl border border-[#E5E0D8] p-4 space-y-3">
                            <h3 className="text-xs font-bold text-[#037F8C] flex items-center gap-1.5">
                                <Code2 size={14} />
                                {t(
                                    'crm.workflow.auditTrails.viewDrawer.statePayloadSection'
                                )}
                            </h3>

                            {entry.previousState &&
                                entry.previousState.trim() !== '' && (
                                    <div>
                                        <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                            {t(
                                                'crm.workflow.auditTrails.viewDrawer.previousState'
                                            )}
                                        </span>
                                        <pre
                                            className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-48"
                                            dir="ltr"
                                        >
                                            {formatAuditStatePayload(
                                                entry.previousState
                                            )}
                                        </pre>
                                    </div>
                                )}

                            {entry.newState &&
                                entry.newState.trim() !== '' && (
                                    <div>
                                        <span className="text-[11px] font-semibold text-[#6E6862] block mb-1">
                                            {t(
                                                'crm.workflow.auditTrails.viewDrawer.newState'
                                            )}
                                        </span>
                                        <pre
                                            className="p-3 rounded-lg bg-slate-900 text-emerald-100 text-[11px] font-mono overflow-x-auto max-h-48"
                                            dir="ltr"
                                        >
                                            {formatAuditStatePayload(
                                                entry.newState
                                            )}
                                        </pre>
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('crm.commercial.common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
