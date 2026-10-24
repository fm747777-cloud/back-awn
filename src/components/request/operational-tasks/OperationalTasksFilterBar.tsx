import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import {
    OPERATIONAL_TASK_PRIORITIES,
    OPERATIONAL_TASK_STATUSES,
    OPERATIONAL_UNITS,
    REQUEST_ACCOUNT_MANAGERS,
} from '../../../pages/request/operationalTasksMockData';
import type { RequestRecord } from '../../../pages/request/requestsMockData';
import type { OperationalTaskKpiCounts } from './operationalTaskConstants';

interface OperationalTasksFilterBarProps {
    isAr: boolean;
    statusFilter: string;
    priorityFilter: string;
    specialistFilter: string;
    unitFilter: string;
    relatedRequestFilter: string;
    availableRequests: RequestRecord[];
    kpiCounts: OperationalTaskKpiCounts;
    shownCount: number;
    filteredTotalCount: number;
    onStatusChange: (val: string) => void;
    onPriorityChange: (val: string) => void;
    onSpecialistChange: (val: string) => void;
    onUnitChange: (val: string) => void;
    onRelatedRequestChange: (val: string) => void;
    onResetAllFilters: () => void;
}

export const OperationalTasksFilterBar = ({
    isAr,
    statusFilter,
    priorityFilter,
    specialistFilter,
    unitFilter,
    relatedRequestFilter,
    availableRequests,
    kpiCounts,
    shownCount,
    filteredTotalCount,
    onStatusChange,
    onPriorityChange,
    onSpecialistChange,
    onUnitChange,
    onRelatedRequestChange,
    onResetAllFilters,
}: OperationalTasksFilterBarProps) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
            <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0D0D0D]">
                        {t('request.operationalTasks.table.showingOutOf', {
                            shown: shownCount,
                            total: filteredTotalCount,
                        })}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[11px] text-[#6E6862]">
                            {t('request.operationalTasks.kpis.completed')}: {kpiCounts.completed} /{' '}
                            {kpiCounts.total}
                        </span>
                        <button
                            type="button"
                            onClick={onResetAllFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#F0ECE4] text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            {t('request.operationalTasks.filters.resetFilters')}
                        </button>
                    </div>
                </div>

                {/* Secondary Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('request.operationalTasks.filters.status')}
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="ALL">
                                {t('request.operationalTasks.filters.allStatuses')}
                            </option>
                            {OPERATIONAL_TASK_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                    {t(`request.operationalTasks.statuses.${st}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('request.operationalTasks.filters.priority')}
                        </label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => onPriorityChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="ALL">
                                {t('request.operationalTasks.filters.allPriorities')}
                            </option>
                            {OPERATIONAL_TASK_PRIORITIES.map((pr) => (
                                <option key={pr} value={pr}>
                                    {t(`request.operationalTasks.priorities.${pr}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Specialist Filter */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('request.operationalTasks.filters.assignedSpecialist')}
                        </label>
                        <select
                            value={specialistFilter}
                            onChange={(e) => onSpecialistChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="ALL">
                                {t('request.operationalTasks.filters.allSpecialists')}
                            </option>
                            <option value="unassigned">
                                {t('request.operationalTasks.filters.unassigned')}
                            </option>
                            {REQUEST_ACCOUNT_MANAGERS.map((mgr) => (
                                <option key={mgr.id} value={mgr.id}>
                                    {isAr ? mgr.nameAr : mgr.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Operational Unit Filter */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('request.operationalTasks.filters.operationalUnit')}
                        </label>
                        <select
                            value={unitFilter}
                            onChange={(e) => onUnitChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="ALL">
                                {t('request.operationalTasks.filters.allUnits')}
                            </option>
                            {OPERATIONAL_UNITS.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {isAr ? unit.nameAr : unit.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Related Request Filter */}
                    <div>
                        <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                            {t('request.operationalTasks.filters.relatedRequest')}
                        </label>
                        <select
                            value={relatedRequestFilter}
                            onChange={(e) => onRelatedRequestChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D]"
                        >
                            <option value="ALL">
                                {t('request.operationalTasks.filters.allRequests')}
                            </option>
                            {availableRequests.map((req) => (
                                <option key={req.id} value={req.id}>
                                    #{req.id} —{' '}
                                    {isAr
                                        ? req.businessNameAr || req.businessName
                                        : req.businessName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
