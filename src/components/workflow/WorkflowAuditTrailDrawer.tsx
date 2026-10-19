import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Calendar,
    User,
    ShieldCheck,
    ArrowUpRight,
} from 'lucide-react';
import {
    normalizeWorkflowAuditAction,
    normalizeWorkflowAuditResource,
    type WorkflowAuditEvent,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from '../../pages/workflow/workflowMockData';

const ACTION_BADGE_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    UPDATED: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/25',
    ENABLED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DISABLED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    ACTIVATED: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    DEACTIVATED: 'bg-[#F4F1EA] text-[#6E6862] border-[#E5E0D8]',
    DELETED: 'bg-[#FDF2F2] text-[#A63A3A] border-[#A63A3A]/25',
};

const ACTION_DOT_STYLES: Record<WorkflowAuditAction, string> = {
    CREATED: 'bg-[#037F8C]',
    UPDATED: 'bg-[#037F8C]',
    ENABLED: 'bg-[#037F8C]',
    DISABLED: 'bg-[#857E74]',
    ACTIVATED: 'bg-[#037F8C]',
    DEACTIVATED: 'bg-[#857E74]',
    DELETED: 'bg-[#A63A3A]',
};

const RESOURCE_BADGE_STYLES: Record<WorkflowAuditResource, string> = {
    Workflow: 'bg-[#FAF8F5] text-[#037F8C] border-[#037F8C]/20',
    'Workflow Master': 'bg-[#FDF7F2] text-[#8C6046] border-[#8C6046]/25',
    'Status Level': 'bg-[#EAF3EC]/70 text-[#037F8C] border-[#037F8C]/20',
    'Email Template': 'bg-[#F8F6F2] text-[#6A7358] border-[#6A7358]/25',
};

export interface LiveEntitySnapshot {
    status: string;
    ownerOrScope: string;
    categoryOrDetail: string;
}

interface WorkflowAuditTrailDrawerProps {
    event: WorkflowAuditEvent | null;
    onClose: () => void;
    onOpenResourcePage: (event: WorkflowAuditEvent) => void;
    liveEntitySnapshot: LiveEntitySnapshot | null;
    getActionLabel: (action: string) => string;
    getResourceLabel: (resource: string) => string;
    renderResourceIcon: (resource: string) => React.ReactNode;
}

export const WorkflowAuditTrailDrawer: React.FC<WorkflowAuditTrailDrawerProps> = ({
    event,
    onClose,
    onOpenResourcePage,
    liveEntitySnapshot,
    getActionLabel,
    getResourceLabel,
    renderResourceIcon,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!event) return null;

    const normalizedAction = normalizeWorkflowAuditAction(event.action);
    const normalizedResource = normalizeWorkflowAuditResource(event.resource);

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            data-testid="workflow-audit-drawer"
        >
            <div
                className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            />
            <div
                className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                {/* Drawer Header */}
                <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-white text-[#037F8C] border border-[#E5E0D8]"
                                dir="ltr"
                            >
                                {event.id}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                    ACTION_BADGE_STYLES[normalizedAction]
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        ACTION_DOT_STYLES[normalizedAction]
                                    }`}
                                />
                                <span>{getActionLabel(event.action)}</span>
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                    RESOURCE_BADGE_STYLES[normalizedResource] ||
                                    RESOURCE_BADGE_STYLES.Workflow
                                }`}
                            >
                                {renderResourceIcon(event.resource)}
                                <span>{getResourceLabel(event.resource)}</span>
                            </span>
                        </div>
                        <h2 className="text-base font-bold text-[#0D0D0D] mt-2">
                            {t('workflow.auditTrail.drawer.title')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('workflow.auditTrail.drawer.subtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#E5E0D8]/50 transition-colors cursor-pointer"
                        aria-label={t('workflow.auditTrail.drawer.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Drawer Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
                    {/* Section 1: Event Metadata & Classification */}
                    <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                            {t('workflow.auditTrail.drawer.sectionMetadata')}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.auditId')}
                                </p>
                                <p
                                    className="font-mono font-bold text-[#037F8C] mt-0.5"
                                    dir="ltr"
                                >
                                    {event.id}
                                </p>
                            </div>

                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.targetRecordId')}
                                </p>
                                <p
                                    className="font-mono font-bold text-[#0D0D0D] mt-0.5"
                                    dir="ltr"
                                >
                                    {event.recordId}
                                </p>
                            </div>

                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.actionPerformed')}
                                </p>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                            ACTION_BADGE_STYLES[normalizedAction]
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                ACTION_DOT_STYLES[normalizedAction]
                                            }`}
                                        />
                                        <span>{getActionLabel(event.action)}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.resourceType')}
                                </p>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                                            RESOURCE_BADGE_STYLES[normalizedResource] ||
                                            RESOURCE_BADGE_STYLES.Workflow
                                        }`}
                                    >
                                        {renderResourceIcon(event.resource)}
                                        <span>{getResourceLabel(event.resource)}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.performedBy')}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <User size={13} className="text-[#037F8C] shrink-0" />
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {isRtl
                                            ? event.performedByAr || event.performedBy
                                            : event.performedBy}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.dateTime')}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold text-[#0D0D0D]">
                                    <Calendar size={12} className="text-[#8C6046]" />
                                    <span dir="ltr">{event.dateTime}</span>
                                </div>
                            </div>
                        </div>

                        {(event.previousStatus || event.newStatus) && (
                            <div className="bg-white border border-[#E5E0D8] rounded-lg p-3 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('workflow.auditTrail.drawer.statusTransition')}
                                </span>
                                <span className="font-mono font-semibold text-xs text-[#0D0D0D]" dir="ltr">
                                    {event.previousStatus || '—'} → {event.newStatus || '—'}
                                </span>
                            </div>
                        )}

                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-3">
                            <p className="text-[11px] text-[#6E6862]">
                                {t('workflow.auditTrail.drawer.isoTimestamp')}
                            </p>
                            <p
                                className="font-mono text-[11px] text-[#595550] mt-0.5 break-all"
                                dir="ltr"
                            >
                                {event.timestamp}
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Target Resource & Entity Data */}
                    <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                            {t('workflow.auditTrail.drawer.sectionResource')}
                        </p>

                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5 space-y-1">
                            <p className="text-[11px] text-[#6E6862]">
                                {t('workflow.auditTrail.drawer.resourceDataPrimary')}
                            </p>
                            <p className="text-sm font-bold text-[#0D0D0D] whitespace-pre-wrap break-words leading-relaxed">
                                {isRtl
                                    ? event.resourceDataAr || event.resourceData
                                    : event.resourceData}
                            </p>
                        </div>

                        {event.resourceDataAr &&
                            event.resourceDataAr !== event.resourceData && (
                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5 space-y-1">
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('workflow.auditTrail.drawer.resourceDataBilingual')}
                                    </p>
                                    <p className="text-xs font-medium text-[#595550] whitespace-pre-wrap break-words">
                                        {isRtl ? event.resourceData : event.resourceDataAr}
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Section 3: Governance Remarks */}
                    <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                            {t('workflow.auditTrail.drawer.sectionRemarks')}
                        </p>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-3.5">
                            <p className="text-xs text-[#0D0D0D] whitespace-pre-wrap break-words leading-relaxed">
                                {(isRtl ? event.remarksAr || event.remarks : event.remarks) || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Live Entity Snapshot */}
                    <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6046]">
                                {t('workflow.auditTrail.drawer.sectionLiveEntity')}
                            </p>
                            <ShieldCheck size={14} className="text-[#037F8C]" />
                        </div>

                        {liveEntitySnapshot ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#6E6862]">
                                        {t('workflow.auditTrail.drawer.liveStatus')}
                                    </p>
                                    <p className="font-semibold text-[#037F8C] mt-0.5">
                                        {liveEntitySnapshot.status}
                                    </p>
                                </div>
                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#6E6862]">
                                        {t('workflow.auditTrail.drawer.liveScopeOrOwner')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5 truncate">
                                        {liveEntitySnapshot.ownerOrScope}
                                    </p>
                                </div>
                                <div className="bg-white border border-[#E5E0D8] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#6E6862]">
                                        {t('workflow.auditTrail.drawer.liveClassification')}
                                    </p>
                                    <p className="font-semibold text-[#0D0D0D] mt-0.5 truncate">
                                        {liveEntitySnapshot.categoryOrDetail}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p
                                className="text-xs text-[#6E6862] bg-white border border-[#E5E0D8] rounded-lg p-3"
                                data-testid="workflow-audit-historical-note"
                            >
                                {t('workflow.auditTrail.drawer.recordNotFoundNote')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        data-testid="workflow-audit-drawer-open-module"
                        onClick={() => onOpenResourcePage(event)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                        <span>
                            {t('workflow.auditTrail.drawer.openModule', {
                                resource: getResourceLabel(event.resource),
                            })}
                        </span>
                        <ArrowUpRight size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#F0ECE4] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('workflow.auditTrail.drawer.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
