import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, RotateCcw } from 'lucide-react';
import { CRM_SALES_EMPLOYEES } from '../../../api/api';
import {
    CRM_AUDIT_ACTION_VALUES,
    CRM_AUDIT_RESOURCE_TYPE_VALUES,
    type CrmAuditAction,
    type CrmAuditResourceType,
} from '../../../schemas/crmSchema';

export interface AuditTrailFiltersProps {
    search: string;
    onSearchChange: (val: string) => void;
    actionFilter: CrmAuditAction | 'all';
    onActionFilterChange: (val: CrmAuditAction | 'all') => void;
    resourceTypeFilter: CrmAuditResourceType | 'all';
    onResourceTypeFilterChange: (val: CrmAuditResourceType | 'all') => void;
    actorFilter: string;
    onActorFilterChange: (val: string) => void;
    dateFrom: string;
    onDateFromChange: (val: string) => void;
    dateTo: string;
    onDateToChange: (val: string) => void;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export const AuditTrailFilters: React.FC<AuditTrailFiltersProps> = ({
    search,
    onSearchChange,
    actionFilter,
    onActionFilterChange,
    resourceTypeFilter,
    onResourceTypeFilterChange,
    actorFilter,
    onActorFilterChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    hasActiveFilters,
    onResetFilters,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    return (
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#E5E0D8] pb-3">
                <div
                    className="flex items-center gap-2 flex-wrap"
                    role="tablist"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={actionFilter === 'all'}
                        onClick={() => onActionFilterChange('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            actionFilter === 'all'
                                ? 'bg-[#037F8C] text-white'
                                : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                        }`}
                    >
                        {t('crm.workflow.auditTrails.filters.allEvents')}
                    </button>
                    {CRM_AUDIT_ACTION_VALUES.map((act) => (
                        <button
                            key={act}
                            type="button"
                            role="tab"
                            aria-selected={actionFilter === act}
                            onClick={() => onActionFilterChange(act)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                actionFilter === act
                                    ? 'bg-[#037F8C] text-white'
                                    : 'bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] border border-[#E5E0D8]'
                            }`}
                        >
                            {t(`crm.workflow.auditTrails.actions.${act}`)}
                        </button>
                    ))}
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        {t('crm.commercial.common.resetFilters')}
                    </button>
                )}
            </div>

            {/* Search & Select Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="relative lg:col-span-2">
                    <Search
                        size={15}
                        className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[#6E6862]"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t(
                            'crm.workflow.auditTrails.filters.searchPlaceholder'
                        )}
                        className="w-full ps-9 pe-8 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] focus:bg-white text-xs text-[#0D0D0D] focus:outline-none focus:border-[#037F8C]"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            aria-label={t('crm.commercial.common.clear')}
                            className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#6E6862] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Resource Type Filter */}
                <select
                    value={resourceTypeFilter}
                    onChange={(e) =>
                        onResourceTypeFilterChange(
                            e.target.value as CrmAuditResourceType | 'all'
                        )
                    }
                    aria-label={t(
                        'crm.workflow.auditTrails.filters.allResourceTypes'
                    )}
                    className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.workflow.auditTrails.filters.allResourceTypes')}
                    </option>
                    {CRM_AUDIT_RESOURCE_TYPE_VALUES.map((rt) => (
                        <option key={rt} value={rt}>
                            {t(`crm.workflow.auditTrails.resourceTypes.${rt}`)}
                        </option>
                    ))}
                </select>

                {/* Actor Filter */}
                <select
                    value={actorFilter}
                    onChange={(e) => onActorFilterChange(e.target.value)}
                    aria-label={t('crm.workflow.auditTrails.filters.allActors')}
                    className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-medium text-[#0D0D0D]"
                >
                    <option value="all">
                        {t('crm.workflow.auditTrails.filters.allActors')}
                    </option>
                    {CRM_SALES_EMPLOYEES.map((emp) => (
                        <option key={emp.id} value={emp.nameEn}>
                            {isRtl ? emp.nameAr : emp.nameEn}
                        </option>
                    ))}
                </select>

                {/* Date From */}
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    aria-label={t('crm.workflow.auditTrails.filters.dateFrom')}
                    dir="ltr"
                    className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                />

                {/* Date To */}
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    aria-label={t('crm.workflow.auditTrails.filters.dateTo')}
                    dir="ltr"
                    className="px-3 py-2 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] text-xs font-mono text-[#0D0D0D]"
                />
            </div>
        </div>
    );
};
