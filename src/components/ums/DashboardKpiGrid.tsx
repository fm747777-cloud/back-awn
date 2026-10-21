import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { type UmsDashboardMetrics } from '../../pages/ums/umsMockData';

interface DashboardKpiGridProps {
    metrics: UmsDashboardMetrics;
    isRtl: boolean;
}

export const DashboardKpiGrid: React.FC<DashboardKpiGridProps> = ({ metrics, isRtl }) => {
    const { t } = useTranslation();

    const iqamaAlertsCount = metrics.iqamaStatusStats
        .filter((s) => s.status !== 'Valid')
        .reduce((sum, s) => sum + s.count, 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'إجمالي الموظفين' : 'Total Workforce'}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">
                            {metrics.totalEmployees}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Users size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl
                        ? `${metrics.activeEmployees} نشط · ${metrics.draftEmployees} مسودة`
                        : `${metrics.activeEmployees} Active · ${metrics.draftEmployees} Draft`}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'نسبة التوطين (السعودة)' : 'Saudization Rate'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">
                            {metrics.saudizationRate}%
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <CheckCircle2 size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl
                        ? `${metrics.saudiNationalCount} سعودي · ${metrics.nonSaudiNationalCount} مقيم`
                        : `${metrics.saudiNationalCount} Saudi · ${metrics.nonSaudiNationalCount} Non-Saudi`}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'تحت فترة التجربة' : 'Under Probation'}
                        </p>
                        <p className="text-2xl font-bold text-[#B45309] mt-1">
                            {metrics.underProbation}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                        <Clock size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'تقييم الأداء خلال 90 يوماً' : 'Active 90-day evaluation window'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'تنبيهات الهوية والإقامة' : 'ID / Iqama Alerts'}
                        </p>
                        <p className="text-2xl font-bold text-[#DC2626] mt-1">
                            {iqamaAlertsCount}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                        <AlertTriangle size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl
                        ? 'تتطلب المتابعة أو التجديد عبر مقيم'
                        : 'Expiring within 90 days or expired'}
                </p>
            </div>
        </div>
    );
};
