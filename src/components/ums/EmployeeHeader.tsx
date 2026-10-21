import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, Upload, Plus, Download, RotateCcw } from 'lucide-react';
import { type EmployeeRecord } from '../../pages/ums/umsMockData';

interface EmployeeHeaderProps {
    totalCount: number;
    filteredCount: number;
    selectedCount: number;
    isRtl: boolean;
    onExportCsv: () => void;
    onResetFilters: () => void;
    hasActiveFilters: boolean;
}

export const EmployeeHeader: React.FC<EmployeeHeaderProps> = ({
    totalCount,
    filteredCount,
    selectedCount,
    isRtl,
    onExportCsv,
    onResetFilters,
    hasActiveFilters,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('ums.employees.title', { defaultValue: 'Employees Directory & Governance' })}
                    </h1>
                    <span
                        className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                        dir="ltr"
                    >
                        EMP-MST
                    </span>
                    {filteredCount !== totalCount && (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#EAF3EC] text-[#037F8C]">
                            {isRtl ? `مصفى: ${filteredCount} من ${totalCount}` : `Filtered: ${filteredCount} of ${totalCount}`}
                        </span>
                    )}
                </div>
                <p className="text-xs text-[#6E6862] mt-1 font-normal">
                    {t('ums.employees.subtitle', {
                        defaultValue: 'Manage employee profiles, contracts, Iqama compliance, and system roles securely.',
                    })}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                        title={isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                    >
                        <RotateCcw size={14} className="text-[#857E74]" />
                        <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};
