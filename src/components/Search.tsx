import { SearchIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

type SearchProps = {
    searchValue: string;
    title: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    delay?: number;
    totalCount: number;
    pageSize: number;
    pageIndex: number;
    onPageSizeChange?: (size: number) => void;
    onAddNew?: () => void;
    onExport?: () => void;
};

const Search = ({
    searchValue,
    title,
    onSearchChange,
    searchPlaceholder = 'Search Services',
    delay = 500,
    totalCount,
    pageSize,
    pageIndex,
    onPageSizeChange,
    onAddNew,
    onExport,
}: SearchProps) => {
    const [query, setQuery] = useState(searchValue);
    const [prevSearchValue, setPrevSearchValue] = useState(searchValue);

    if (searchValue !== prevSearchValue) {
        setPrevSearchValue(searchValue);
        setQuery(searchValue);
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearchChange && query !== searchValue) {
                onSearchChange(query);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [query, delay, onSearchChange, searchValue]);

    const startItem = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
    const endItem = Math.min((pageIndex + 1) * pageSize, totalCount);

    return (
        <div className="mb-4 bg-white px-5 pb-2 rounded-lg">
            {/* Top Bar: Title & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                    {title ? title.replace(/^(Add |New |Add New )/i, '').trim() : 'Services'}
                </h1>

                <div className="flex items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-64 pl-9 pr-4 py-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                    </div>

                    {/* Export Dropdown */}
                    <button
                        type="button"
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Export
                        <span className="text-xs text-slate-400">▼</span>
                    </button>

                    {/* Add New Button */}
                    <button
                        type="button"
                        onClick={onAddNew}
                        className="flex items-center gap-1.5 px-4 py-4 bg-[#b5925a] hover:bg-[#a1804c] text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
                    >
                        <span>+</span> {title}
                    </button>
                </div>
            </div>

            {/* Controls Bar: Entries counter & Page Size dropdown */}
            <div className="flex items-center justify-between text-sm text-slate-600 pt-2">
                <div>
                    Showing <span className="font-semibold text-slate-900">{totalCount === 0 ? 0 : (endItem - startItem + 1)}</span> out of <span className="font-semibold text-slate-900">{totalCount}</span> entries
                </div>

                <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                </div>
            </div>
        </div>
    );
};

export default Search;