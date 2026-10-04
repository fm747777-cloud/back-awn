import { Search as SearchIcon, Download, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

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
};

const PAGE_CONFIGS: Record<string, { title: string; description: string; addLabel: string }> = {
    'Services': {
        title: 'Services',
        description: 'Manage and monitor government and enterprise administrative services.',
        addLabel: 'Add Service',
    },
    'Add New Service': {
        title: 'Services',
        description: 'Manage and monitor government and enterprise administrative services.',
        addLabel: 'Add Service',
    },
    'Service Groups': {
        title: 'Service Groups',
        description: 'Organize services into operational and functional business clusters.',
        addLabel: 'New Service Group',
    },
    'New Service Group': {
        title: 'Service Groups',
        description: 'Organize services into operational and functional business clusters.',
        addLabel: 'New Service Group',
    },
    'Service Packages': {
        title: 'Service Packages',
        description: 'Manage bundled service packages and customer subscription offerings.',
        addLabel: 'Add Package',
    },
    'Service Types': {
        title: 'Service Types',
        description: 'Define service classifications, execution rules, and workflow types.',
        addLabel: 'Add Service Type',
    },
    'Add Service Type': {
        title: 'Service Types',
        description: 'Define service classifications, execution rules, and workflow types.',
        addLabel: 'Add Service Type',
    },
    'Service Categories': {
        title: 'Service Categories',
        description: 'Structure service taxonomy and categorical groupings.',
        addLabel: 'Add Category',
    },
    'Add Service Category': {
        title: 'Service Categories',
        description: 'Structure service taxonomy and categorical groupings.',
        addLabel: 'Add Category',
    },
    'Service Tags': {
        title: 'Service Tags',
        description: 'Manage discovery tags, metadata badges, and search identifiers.',
        addLabel: 'Add Service Tag',
    },
    'Add Service Tag': {
        title: 'Service Tags',
        description: 'Manage discovery tags, metadata badges, and search identifiers.',
        addLabel: 'Add Service Tag',
    },
    'Service Portals': {
        title: 'Service Portals',
        description: 'Configure external government integrations and administrative portals.',
        addLabel: 'Add Service Portal',
    },
    'Add Service Portal': {
        title: 'Service Portals',
        description: 'Configure external government integrations and administrative portals.',
        addLabel: 'Add Service Portal',
    },
    'Services Audit Trail': {
        title: 'Audit Trail',
        description: 'Track operational logs, system modifications, and administrative activities.',
        addLabel: '',
    },
    'Audit Trail': {
        title: 'Audit Trail',
        description: 'Track operational logs, system modifications, and administrative activities.',
        addLabel: '',
    },
};

const Search = ({
    searchValue,
    title,
    description,
    onSearchChange,
    searchPlaceholder = 'Search records...',
    delay = 400,
    pageSize,
    onPageSizeChange,
    onAddNew,
    onExport,
    addNewLabel,
}: SearchProps) => {
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

    const pageCfg = PAGE_CONFIGS[title];
    const displayTitle = pageCfg?.title || title.replace(/^(Add |New |Add New )/i, '').trim();
    const displayDesc = description || pageCfg?.description || 'Manage, organize, and monitor records within this administrative module.';
    const addBtnText = addNewLabel || pageCfg?.addLabel || (title.startsWith('Add') || title.startsWith('New') ? title : `Add ${displayTitle}`);

    return (
        <div className="space-y-5 mb-5 select-none">
            {/* 1. Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
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
                        <span>Export</span>
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
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none">
                        <SearchIcon size={15} />
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-9 pr-3.5 py-2 bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] focus:bg-white border border-[#E5E0D8] focus:border-[#2D3F2C] rounded-lg text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/15 transition"
                    />
                </div>

                {/* Show Page Size Controls */}
                <div className="flex items-center gap-2 text-xs text-[#6E6862] shrink-0 self-end sm:self-center">
                    <span>Show</span>
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
                            aria-label="Show entries per page"
                            className="w-11 pl-2.5 pr-1 py-1.5 text-xs text-[#0D0D0D] font-medium text-center focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                            aria-label="Choose entries per page"
                            className="bg-transparent border-l border-[#E5E0D8] pl-1 pr-1.5 py-1.5 text-xs text-[#595550] hover:text-[#0D0D0D] focus:outline-none cursor-pointer"
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
                    <span>entries</span>
                </div>
            </div>
        </div>
    );
};

export default Search;
