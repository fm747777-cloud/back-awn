import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    CheckCircle2,
    RotateCcw,
    Users,
    X,
} from 'lucide-react';
import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
} from '../../../pages/request/operationalTasksMockData';

interface OperationalTasksTopFilterProps {
    isAr: boolean;
    selectedOwnerIds: string[];
    selectedCompanyIds: string[];
    onToggleOwner: (ownerId: string) => void;
    onToggleCompany: (companyId: string) => void;
    onClearTopSelection: () => void;
    feedbackBanner: string | null;
    onDismissFeedback: () => void;
}

export const OperationalTasksTopFilter = ({
    isAr,
    selectedOwnerIds,
    selectedCompanyIds,
    onToggleOwner,
    onToggleCompany,
    onClearTopSelection,
    feedbackBanner,
    onDismissFeedback,
}: OperationalTasksTopFilterProps) => {
    const { t } = useTranslation();
    const [ownerSearch, setOwnerSearch] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
    const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

    const filteredOwnerOptions = useMemo(() => {
        const q = ownerSearch.trim().toLowerCase();
        return REQUEST_BUSINESS_OWNERS.filter(
            (o) =>
                !q ||
                o.nameEn.toLowerCase().includes(q) ||
                o.nameAr.toLowerCase().includes(q)
        );
    }, [ownerSearch]);

    const availableCompaniesForSelectedOwners = useMemo(() => {
        const base =
            selectedOwnerIds.length > 0
                ? REQUEST_COMPANIES.filter((c) => selectedOwnerIds.includes(c.ownerId))
                : REQUEST_COMPANIES;
        const q = companySearch.trim().toLowerCase();
        return base.filter(
            (c) =>
                !q ||
                c.nameEn.toLowerCase().includes(q) ||
                c.nameAr.toLowerCase().includes(q) ||
                c.crNumber.includes(q)
        );
    }, [selectedOwnerIds, companySearch]);

    const handleClearSelections = () => {
        setOwnerSearch('');
        setCompanySearch('');
        setOwnerDropdownOpen(false);
        setCompanyDropdownOpen(false);
        onClearTopSelection();
    };

    return (
        <div className="space-y-6">
            {/* Feedback Banner */}
            {feedbackBanner && (
                <div className="bg-[#EAF3EC] border border-[#037F8C]/25 text-[#037F8C] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{feedbackBanner}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onDismissFeedback}
                        className="p-1 hover:bg-[#037F8C]/10 rounded-md cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Top Filter: Select Business Owners & Companies */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#0D0D0D]">
                                {t('request.operationalTasks.topFilter.title')}
                            </h2>
                            <span className="text-[11px] font-semibold text-[#8C6046]">
                                · {t('request.operationalTasks.topFilter.interconnectedBadge')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('request.operationalTasks.topFilter.helperText')}
                        </p>
                    </div>
                    {(selectedOwnerIds.length > 0 || selectedCompanyIds.length > 0) && (
                        <button
                            type="button"
                            onClick={handleClearSelections}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6046] hover:text-[#6B4833] cursor-pointer self-start sm:self-auto"
                        >
                            <RotateCcw size={13} />
                            {t('request.operationalTasks.topFilter.clearSelections')}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Owners Multi-Select */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.operationalTasks.topFilter.businessOwners')}
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setOwnerDropdownOpen((prev) => !prev);
                                setCompanyDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] hover:border-[#8C6046]/50 transition-colors cursor-pointer"
                        >
                            <span className="truncate flex items-center gap-2">
                                <Users size={14} className="text-[#8C6046] shrink-0" />
                                {selectedOwnerIds.length === 0
                                    ? t('request.operationalTasks.topFilter.selectBusinessOwners')
                                    : `${selectedOwnerIds.length} ${t('request.operationalTasks.topFilter.businessOwners')}`}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">▼</span>
                        </button>
                        {ownerDropdownOpen && (
                            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-2.5 space-y-2">
                                <input
                                    type="text"
                                    value={ownerSearch}
                                    onChange={(e) => setOwnerSearch(e.target.value)}
                                    placeholder={t(
                                        'request.operationalTasks.topFilter.selectBusinessOwners'
                                    )}
                                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-hidden focus:border-[#037F8C]"
                                />
                                <div className="max-h-48 overflow-y-auto divide-y divide-[#F0ECE4]">
                                    {filteredOwnerOptions.map((owner) => {
                                        const checked = selectedOwnerIds.includes(owner.id);
                                        return (
                                            <label
                                                key={owner.id}
                                                className="flex items-center gap-2.5 px-2 py-2 hover:bg-[#FAF8F5] rounded-md cursor-pointer text-xs"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => onToggleOwner(owner.id)}
                                                    className="accent-[#037F8C] rounded-xs"
                                                />
                                                <span className="font-medium text-[#0D0D0D]">
                                                    {isAr ? owner.nameAr : owner.nameEn}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {filteredOwnerOptions.length === 0 && (
                                        <p className="text-xs text-[#6E6862] py-3 text-center">
                                            {t('request.operationalTasks.topFilter.noMatchingOptions')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Companies Multi-Select */}
                    <div className="relative">
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('request.operationalTasks.topFilter.companies')}
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setCompanyDropdownOpen((prev) => !prev);
                                setOwnerDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs text-[#0D0D0D] hover:border-[#8C6046]/50 transition-colors cursor-pointer"
                        >
                            <span className="truncate flex items-center gap-2">
                                <Building2 size={14} className="text-[#037F8C] shrink-0" />
                                {selectedCompanyIds.length === 0
                                    ? t('request.operationalTasks.topFilter.selectCompanies')
                                    : `${selectedCompanyIds.length} ${t('request.operationalTasks.topFilter.companies')}`}
                            </span>
                            <span className="text-[11px] text-[#6E6862]">▼</span>
                        </button>
                        {companyDropdownOpen && (
                            <div className="absolute z-30 mt-1 w-full bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-2.5 space-y-2">
                                <input
                                    type="text"
                                    value={companySearch}
                                    onChange={(e) => setCompanySearch(e.target.value)}
                                    placeholder={t(
                                        'request.operationalTasks.topFilter.selectCompanies'
                                    )}
                                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-hidden focus:border-[#037F8C]"
                                />
                                <div className="max-h-48 overflow-y-auto divide-y divide-[#F0ECE4]">
                                    {availableCompaniesForSelectedOwners.map((comp) => {
                                        const checked = selectedCompanyIds.includes(comp.id);
                                        return (
                                            <label
                                                key={comp.id}
                                                className="flex items-center justify-between gap-2 px-2 py-2 hover:bg-[#FAF8F5] rounded-md cursor-pointer text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => onToggleCompany(comp.id)}
                                                        className="accent-[#037F8C] rounded-xs"
                                                    />
                                                    <span className="font-medium text-[#0D0D0D] truncate">
                                                        {isAr ? comp.nameAr : comp.nameEn}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-[#6E6862] font-mono shrink-0">
                                                    CR: {comp.crNumber}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {availableCompaniesForSelectedOwners.length === 0 && (
                                        <p className="text-xs text-[#6E6862] py-3 text-center">
                                            {t('request.operationalTasks.topFilter.noMatchingOptions')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
