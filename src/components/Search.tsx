import { Search as SearchIcon, Download, Plus, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type SearchProps = {
    searchValue: string;
    title: string;
    description?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    delay?: number;
    totalCount?: number;
    pageSize: number;
    pageIndex?: number;
    onPageSizeChange?: (size: number) => void;
    onAddNew?: () => void;
    onExport?: () => void;
    addNewLabel?: string;
    onToggleFilters?: () => void;
    isFiltersOpen?: boolean;
    hasActiveFilters?: boolean;
};

const PAGE_KEY_MAP: Record<string, string> = {
    'Tickets': 'tickets',
    'Services': 'services',
    'Add New Service': 'services',
    'Service Groups': 'serviceGroups',
    'New Service Group': 'serviceGroups',
    'Service Packages': 'servicePackages',
    'Service Types': 'serviceTypes',
    'Add Service Type': 'serviceTypes',
    'Service Categories': 'serviceCategories',
    'Add Service Category': 'serviceCategories',
    'Service Tags': 'serviceTags',
    'Add Service Tag': 'serviceTags',
    'Service Portals': 'servicePortals',
    'Add Service Portal': 'servicePortals',
    'Services Audit Trail': 'auditTrail',
    'Audit Trail': 'auditTrail',
};

const Search = ({
    searchValue,
    title,
    description,
    onSearchChange,
    searchPlaceholder,
    delay = 400,
    pageSize,
    onPageSizeChange,
    onAddNew,
    onExport,
    addNewLabel,
    onToggleFilters,
    isFiltersOpen,
    hasActiveFilters,
}: SearchProps) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState(searchValue);
    const [prevSearchValue, setPrevSearchValue] = useState(searchValue);
    const [pageSizeInput, setPageSizeInput] = useState(String(pageSize));
    const [prevPageSize, setPrevPageSize] = useState(pageSize);

    if (searchValue !== prevSearchValue) {
        setPrevSearchValue(searchValue);
        setQuery(searchValue);
    }

    if (pageSize !== prevPageSize) {
        setPrevPageSize(pageSize);
        setPageSizeInput(String(pageSize));
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearchChange && query !== searchValue) {
                onSearchChange(query);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [query, delay, onSearchChange, searchValue]);

    const pageKey = PAGE_KEY_MAP[title];
    const displayTitle = pageKey
        ? t(`pages.${pageKey}.title`)
        : title.replace(/^(Add |New |Add New )/i, '').trim();
    const displayDesc =
        description ||
        (pageKey ? t(`pages.${pageKey}.description`) : t('pages.defaultDescription'));
    const addBtnText = pageKey
        ? t(`pages.${pageKey}.addLabel`)
        : addNewLabel || (title.startsWith('Add') || title.startsWith('New') ? title : `${t('common.add')} ${displayTitle}`);
    const resolvedPlaceholder = pageKey
        ? t(`pages.${pageKey}.searchPlaceholder`)
        : searchPlaceholder || t('common.search');

    return (
        <div className="space-y-5 mb-5 select-none">
            {/* 1. Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div className="text-start">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {displayTitle}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {displayDesc}
                    </p>
                </div>

                {/* Header Actions: Export + Add/Create */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onExport}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DCD6CD] hover:border-[#BFAB93] text-[#2D3F2C] hover:bg-[#F8F6F2] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-98"
                    >
                        <Download size={14} className="text-[#6A7358]" />
                        <span>{t('common.export')}</span>
                    </button>

                    {onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-[#FAF8F5] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs active:scale-98"
                        >
                            <Plus size={14} className="text-[#BFAB93]" />
                            <span>{addBtnText}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Search / Filters / Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-2xs">
                {/* Search Input & Optional Filter Toggle */}
                <div className="flex items-center gap-2 flex-1 max-w-lg">
                    <div className="relative flex-1">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none">
                            <SearchIcon size={15} />
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={resolvedPlaceholder}
                            className="w-full ps-9 pe-3.5 py-2 bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] focus:bg-white border border-[#E5E0D8] focus:border-[#2D3F2C] rounded-lg text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/15 transition"
                        />
                    </div>

                    {onToggleFilters && (
                        <button
                            type="button"
                            onClick={onToggleFilters}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shrink-0 shadow-2xs ${
                                isFiltersOpen || hasActiveFilters
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                                    : 'bg-white border-[#DCD6CD] hover:border-[#BFAB93] text-[#595550] hover:text-[#0D0D0D] hover:bg-[#F8F6F2]'
                            }`}
                        >
                            <Filter size={14} className={isFiltersOpen || hasActiveFilters ? 'text-[#BFAB93]' : 'text-[#857E74]'} />
                            <span>{isFiltersOpen ? t('ticketing.filters.hideFilters') : t('ticketing.filters.showFilters')}</span>
                            {hasActiveFilters && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#BFAB93]" />
                            )}
                        </button>
                    )}
                </div>

                {/* Show Page Size Controls */}
                <div className="flex items-center gap-2 text-xs text-[#6E6862] shrink-0 self-end sm:self-center">
                    <span>{t('pagination.show')}</span>
                    <div className="relative inline-flex items-center bg-white border border-[#DCD6CD] hover:border-[#BFAB93] focus-within:border-[#2D3F2C] focus-within:ring-1 focus-within:ring-[#2D3F2C]/20 rounded-lg shadow-2xs transition">
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={pageSizeInput}
                            onChange={(e) => {
                                const valStr = e.target.value;
                                setPageSizeInput(valStr);
                                const num = parseInt(valStr, 10);
                                if (!isNaN(num) && num > 0) {
                                    onPageSizeChange?.(num);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const num = parseInt(pageSizeInput, 10);
                                    if (!isNaN(num) && num > 0) {
                                        onPageSizeChange?.(num);
                                    }
                                }
                            }}
                            onBlur={() => {
                                const num = parseInt(pageSizeInput, 10);
                                if (isNaN(num) || num <= 0) {
                                    setPageSizeInput(String(pageSize));
                                }
                            }}
                            aria-label={t('pagination.showEntriesAria')}
                            className="w-11 ps-2.5 pe-1 py-1.5 text-xs text-[#0D0D0D] font-mono font-medium text-center focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val > 0) {
                                    setPageSizeInput(String(val));
                                    onPageSizeChange?.(val);
                                }
                            }}
                            aria-label={t('pagination.chooseEntriesAria')}
                            className="bg-transparent border-s border-[#E5E0D8] ps-1 pe-1.5 py-1.5 text-xs font-mono text-[#595550] hover:text-[#0D0D0D] focus:outline-none cursor-pointer"
                        >
                            {![10, 25, 50, 100].includes(pageSize) && (
                                <option value={pageSize}>{pageSize}</option>
                            )}
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <span>{t('pagination.entries')}</span>
                </div>
            </div>
        </div>
    );
};

export default Search;
