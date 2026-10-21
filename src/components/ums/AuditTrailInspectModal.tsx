import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Calendar } from 'lucide-react';
import { sanitizeAuditStateSnapshot, type UmsAuditEvent, type UmsAuditAction } from '../../pages/ums/umsMockData';

interface AuditTrailInspectModalProps {
    event: UmsAuditEvent | null;
    isRtl: boolean;
    onClose: () => void;
}

export const AuditTrailInspectModal: React.FC<AuditTrailInspectModalProps> = ({
    event,
    isRtl,
    onClose,
}) => {
    const { t } = useTranslation();

    if (!event) return null;

    const getActionBadgeStyle = (action: UmsAuditAction): string => {
        switch (action) {
            case 'CREATED':
            case 'ACTIVATED':
                return 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/20';
            case 'IMPORTED':
                return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
            case 'UPDATED':
            case 'EXPORTED':
                return 'bg-[#FAF8F5] text-[#037F8C] border-[#E5E0D8]';
            case 'DEACTIVATED':
                return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
            case 'DELETED':
                return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
            default:
                return 'bg-[#FAF8F5] text-[#45413C] border-[#E5E0D8]';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xl w-full max-w-lg p-6 space-y-4 text-start">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                    <div className="flex items-center gap-2">
                        <span
                            className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-xs font-bold text-[#037F8C]"
                            dir="ltr"
                        >
                            {event.id}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${getActionBadgeStyle(
                                event.action
                            )}`}
                        >
                            {event.action}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-lg border border-[#E5E0D8]">
                    <div>
                        <p className="text-[#857E74] flex items-center gap-1">
                            <User size={12} />
                            <span>{isRtl ? 'المنفّذ' : 'Actor'}</span>
                        </p>
                        <p className="font-bold text-[#0D0D0D] mt-0.5">{event.actorName}</p>
                        <p className="text-[11px] text-[#6E6862]" dir="ltr">
                            {event.actorEmail}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#857E74] flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{isRtl ? 'التوقيت' : 'Timestamp'}</span>
                        </p>
                        <p className="font-mono font-semibold text-[#0D0D0D] mt-0.5" dir="ltr">
                            {event.timestamp.replace('T', ' ').slice(0, 19)}
                        </p>
                        <p className="text-[11px] text-[#6E6862]">
                            {event.resource} · {event.resourceName}
                        </p>
                    </div>
                </div>

                <div className="space-y-2 text-xs">
                    <div>
                        <p className="font-semibold text-[#45413C] mb-1">
                            {isRtl ? 'التفاصيل (EN)' : 'Summary (English)'}
                        </p>
                        <p className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]">
                            {event.detailsEn}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-[#45413C] mb-1">
                            {isRtl ? 'التفاصيل (AR)' : 'Summary (Arabic)'}
                        </p>
                        <p
                            dir="rtl"
                            className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D]"
                        >
                            {event.detailsAr}
                        </p>
                    </div>
                </div>

                {(event.previousState || event.newState) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {event.previousState && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="font-semibold text-[#857E74] mb-1">
                                    {isRtl ? 'الحالة السابقة' : 'Previous State'}
                                </p>
                                <p className="font-mono text-[11px] text-[#45413C] break-words">
                                    {sanitizeAuditStateSnapshot(event.previousState)}
                                </p>
                            </div>
                        )}
                        {event.newState && (
                            <div className="p-3 rounded-lg bg-[#EAF3EC]/50 border border-[#037F8C]/20">
                                <p className="font-semibold text-[#037F8C] mb-1">
                                    {isRtl ? 'الحالة الجديدة' : 'New State'}
                                </p>
                                <p className="font-mono text-[11px] text-[#037F8C] break-words">
                                    {sanitizeAuditStateSnapshot(event.newState)}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t border-[#E5E0D8]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer"
                    >
                        {t('common.close', { defaultValue: 'Close' })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditTrailInspectModal;
