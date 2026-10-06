import { tableFeatures, useTable, rowPaginationFeature, rowSelectionFeature, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import { useTranslation, Trans } from "react-i18next";

import Search from "./Search";
import Pagination from "./Pagination";

type DataTableProps<TData> = {
    columns: Array<ColumnDef<any, any>>;
    data: TData[];
    count: number;
    loading?: boolean;
    searchPlaceholder?: string;

    pageIndex: number;
    pageSize: number;
    onPageChange: (newPageIndex: number) => void;
    onPageSizeChange?: (newPageSize: number) => void;

    searchValue?: string;
    onSearchChange?: (val: string) => void;
    onAddNew?: () => void;
    onExport?: () => void;
    title: string;
    description?: string;
    addNewLabel?: string;
    onToggleFilters?: () => void;
    isFiltersOpen?: boolean;
    hasActiveFilters?: boolean;
    filtersContent?: React.ReactNode;
};

export const DataTable = <TData,>({
    columns = [],
    data = [],
    count = 0,
    loading = false,
    searchPlaceholder,
    pageIndex,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchValue = "",
    onSearchChange,
    onAddNew,
    onExport,
    title,
    description,
    addNewLabel,
    onToggleFilters,
    isFiltersOpen,
    hasActiveFilters,
    filtersContent,
}: DataTableProps<TData>) => {
    const { t } = useTranslation();

    const features = tableFeatures({
        rowPaginationFeature,
        rowSelectionFeature,
    });

    const pagination: PaginationState = {
        pageIndex,
        pageSize,
    };

    const table = useTable({
        key: "data-table",
        features,
        data,
        columns,

        manualPagination: true,
        pageCount: Math.max(1, Math.ceil(count / pageSize)),
        enableRowSelection: true,

        state: {
            pagination: {
                pageIndex,
                pageSize,
            },
        },

        onPaginationChange: (updater) => {
            const newState =
                typeof updater === "function" ? updater(pagination) : updater;

            onPageChange(newState.pageIndex);
            if (newState.pageSize !== pageSize && onPageSizeChange) {
                onPageSizeChange(newState.pageSize);
            }
        },
    });

    const startItem = count === 0 ? 0 : pageIndex * pageSize + 1;
    const endItem = Math.min((pageIndex + 1) * pageSize, count);

    const handlePageSizeChange = (newPageSize: number) => {
        if (!newPageSize || newPageSize <= 0) return;
        if (onPageSizeChange) {
            onPageSizeChange(newPageSize);
        }
        onPageChange(0);
    };

    return (
        <div className="w-full space-y-4">
            {/* Header / Search / Filters Controls */}
            <Search
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                totalCount={count}
                pageSize={pageSize}
                pageIndex={pageIndex}
                onPageSizeChange={handlePageSizeChange}
                onAddNew={onAddNew}
                onExport={onExport}
                title={title}
                description={description}
                addNewLabel={addNewLabel}
                onToggleFilters={onToggleFilters}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
            />

            {/* Optional Collapsible Filter Panel */}
            {isFiltersOpen && filtersContent && (
                <div className="animate-in fade-in duration-150">
                    {filtersContent}
                </div>
            )}

            {/* Table Area */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs whitespace-nowrap">
                        <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#595550]">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3.5 font-semibold text-[#595550] border-e border-[#F0ECE4] last:border-none tracking-wide text-xs text-start"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender header={header} />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-y divide-[#EFECE6] text-[#0D0D0D]">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center py-16 text-[#857E74]"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#2D3F2C] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-medium">{t('common.loadingData')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center py-16 text-[#857E74]"
                                    >
                                        <p className="text-xs font-medium">{t('common.noRecordsMatch')}</p>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-[#F8F6F2]/75 transition-colors"
                                    >
                                        {row.getAllCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3.5 text-start">
                                                <table.FlexRender cell={cell} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Bar: Showing counter on Start + Pagination on End */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-1 text-xs text-[#6E6862] select-none">
                <div>
                    <Trans
                        i18nKey="pagination.showingEntries"
                        values={{ start: startItem, end: endItem, total: count }}
                        components={{
                            1: <span className="font-semibold font-mono text-[#0D0D0D]" />,
                            3: <span className="font-semibold font-mono text-[#0D0D0D]" />,
                            5: <span className="font-semibold font-mono text-[#0D0D0D]" />,
                        }}
                    />
                </div>

                <Pagination
                    table={table}
                    count={count}
                    pageIndex={pageIndex}
                    loading={loading}
                />
            </div>
        </div>
    );
};
