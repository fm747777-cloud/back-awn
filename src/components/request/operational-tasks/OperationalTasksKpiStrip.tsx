import { useTranslation } from 'react-i18next';
import type { OperationalTaskKpiCounts } from './operationalTaskConstants';

interface OperationalTasksKpiStripProps {
    kpiCounts: OperationalTaskKpiCounts;
    statusFilter: string;
    assignmentFilter: string;
    onSelectKpiFilter: (nextStatusFilter: string, nextAssignmentFilter: string) => void;
}

export const OperationalTasksKpiStrip = ({
    kpiCounts,
    statusFilter,
    assignmentFilter,
    onSelectKpiFilter,
}: OperationalTasksKpiStripProps) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total / All Tasks */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('ALL', 'ALL')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'ALL' && assignmentFilter === 'ALL'
                        ? 'bg-[#037F8C] text-white border-[#037F8C] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#037F8C]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        statusFilter === 'ALL' && assignmentFilter === 'ALL'
                            ? 'text-white/80'
                            : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.allTasks')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.total}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        statusFilter === 'ALL' && assignmentFilter === 'ALL'
                            ? 'text-white/75'
                            : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.allTasksSub')}
                </p>
            </button>

            {/* Pending / Not Assigned */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('Pending', 'ALL')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'Pending'
                        ? 'bg-[#B45309] text-white border-[#B45309] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#B45309]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        statusFilter === 'Pending' ? 'text-white/80' : 'text-[#B45309]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.pending')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.pending}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        statusFilter === 'Pending' ? 'text-white/75' : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.notAssigned')}: {kpiCounts.notAssigned}
                </p>
            </button>

            {/* Assigned */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('ALL', 'ASSIGNED')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    assignmentFilter === 'ASSIGNED'
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#1D4ED8]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        assignmentFilter === 'ASSIGNED' ? 'text-white/80' : 'text-[#1D4ED8]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.assigned')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.assigned}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        assignmentFilter === 'ASSIGNED' ? 'text-white/75' : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.assignedSub')}
                </p>
            </button>

            {/* In Progress */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('In Progress', 'ALL')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'In Progress'
                        ? 'bg-[#15803D] text-white border-[#15803D] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#15803D]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        statusFilter === 'In Progress' ? 'text-white/80' : 'text-[#15803D]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.inProgress')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.inProgress}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        statusFilter === 'In Progress' ? 'text-white/75' : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.inProgressSub')}
                </p>
            </button>

            {/* Completed */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('Completed', 'ALL')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'Completed'
                        ? 'bg-[#037F8C] text-white border-[#037F8C] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#037F8C]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        statusFilter === 'Completed' ? 'text-white/80' : 'text-[#037F8C]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.completed')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.completed}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        statusFilter === 'Completed' ? 'text-white/75' : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.completedSub')}
                </p>
            </button>

            {/* Blocked */}
            <button
                type="button"
                onClick={() => onSelectKpiFilter('Blocked', 'ALL')}
                className={`text-start p-4 rounded-xl border transition-all cursor-pointer ${
                    statusFilter === 'Blocked'
                        ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-sm'
                        : 'bg-white text-[#0D0D0D] border-[#E5E0D8] hover:border-[#C2410C]/40'
                }`}
            >
                <p
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                        statusFilter === 'Blocked' ? 'text-white/80' : 'text-[#C2410C]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.blocked')}
                </p>
                <p className="text-2xl font-bold mt-1">{kpiCounts.blocked}</p>
                <p
                    className={`text-[11px] mt-1 truncate ${
                        statusFilter === 'Blocked' ? 'text-white/75' : 'text-[#6E6862]'
                    }`}
                >
                    {t('request.operationalTasks.kpis.blockedSub')}
                </p>
            </button>
        </div>
    );
};
