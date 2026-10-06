import { useTranslation } from 'react-i18next';
import { MessageSquareQuote } from 'lucide-react';

export const CannedRepliesPage = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Unified Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div className="text-start">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('ticketing.cannedRepliesTitle')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ticketing.cannedRepliesDesc')}
                    </p>
                </div>
            </div>

            {/* Empty Page Shell */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 sm:p-12 shadow-2xs">
                <div className="max-w-md mx-auto text-center py-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#2D3F2C]/10 border border-[#2D3F2C]/20 text-[#2D3F2C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
                        <MessageSquareQuote size={26} className="text-[#2D3F2C]" />
                    </div>
                    <h3 className="text-base font-bold text-[#0D0D0D] mb-1.5">
                        {t('ticketing.cannedRepliesTitle')}
                    </h3>
                    <p className="text-xs text-[#6E6862] leading-relaxed max-w-sm mx-auto">
                        {t('ticketing.cannedRepliesDesc')}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[11px] font-medium text-[#857E74]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BFAB93]" />
                        <span>{t('ticketing.shellStatus')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
