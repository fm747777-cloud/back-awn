import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type UmsDashboardMetrics, type UmsAuditEvent } from '../../pages/ums/umsMockData';

interface DashboardAnalyticsGridProps {
    metrics: UmsDashboardMetrics;
    auditEvents: UmsAuditEvent[];
    isRtl: boolean;
}

export const DashboardAnalyticsGrid: React.FC<DashboardAnalyticsGridProps> = ({
    metrics,
    auditEvents,
    isRtl,
}) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Department Allocation */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {isRtl ? 'توزيع الموظفين حسب القسم' : 'Workforce by Department'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => navigate('/ums/departments')}
                        className="text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer"
                    >
                        {isRtl ? 'عرض الأقسام' : 'Manage Departments'}
                    </button>
                </div>
                <div className="space-y-3">
                    {metrics.departmentStats.map((dept) => {
                        const pct =
                            metrics.totalEmployees > 0
                                ? Math.round((dept.count / metrics.totalEmployees) * 100)
                                : 0;
                        return (
                            <div key={dept.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#0D0D0D]">
                                        {isRtl ? dept.nameAr : dept.nameEn}
                                    </span>
                                    <span className="text-[#6E6862] font-mono">
                                        {dept.count} ({pct}%)
                                    </span>
                                </div>
                                <progress
                                    value={dept.count}
                                    max={Math.max(metrics.totalEmployees, 1)}
                                    className="w-full h-2 rounded-full overflow-hidden bg-[#FAF8F5] border border-[#E5E0D8] accent-[#037F8C]"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Audit Events */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                        {isRtl ? 'أحدث عمليات التدقيق' : 'Recent UMS Audit Activity'}
                    </h2>
                    <button
                        type="button"
                        onClick={() => navigate('/ums/audit-trail')}
                        className="text-xs font-semibold text-[#037F8C] hover:underline cursor-pointer"
                    >
                        {isRtl ? 'عرض السجل الكامل' : 'View Full Audit Trail'}
                    </button>
                </div>

                <div className="divide-y divide-[#EFECE6]">
                    {auditEvents.map((ev) => (
                        <div
                            key={ev.id}
                            className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[10px] font-semibold text-[#037F8C]">
                                        {ev.action}
                                    </span>
                                    <span className="font-bold text-[#0D0D0D]">
                                        {ev.resourceName}
                                    </span>
                                </div>
                                <p className="text-[#6E6862] line-clamp-1">
                                    {isRtl ? ev.detailsAr : ev.detailsEn}
                                </p>
                            </div>
                            <span
                                className="text-[11px] font-mono text-[#857E74] whitespace-nowrap"
                                dir="ltr"
                            >
                                {ev.timestamp.slice(0, 10)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
