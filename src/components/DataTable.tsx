import { tableFeatures, useTable, rowPaginationFeature, rowSelectionFeature, type ColumnDef, type PaginationState } from "@tanstack/react-table";

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
    title: string
};

export const DataTable = <TData,>({
    columns = [],
    data = [],
    count = 0,
    loading = false,
    searchPlaceholder = "Search Services...",
    pageIndex,
    pageSize,
    onPageChange,
    onPageSizeChange,
    searchValue = "",
    onSearchChange,
    onAddNew,
    onExport,
    title
}: DataTableProps<TData>) => {
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
        },
    });

    return (
        <div className="w-full bg-slate-50/50 p-6 rounded-xl">
            {/* Header / Search Controls */}
            <Search
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                totalCount={count}
                pageSize={pageSize}
                pageIndex={pageIndex}
                onPageSizeChange={onPageSizeChange}
                onAddNew={onAddNew}
                onExport={onExport}
                title={title}
            />

            {/* Table Area */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-white border-b border-slate-200 text-slate-600">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-3 py-3 font-semibold text-slate-600 border-r border-slate-100 last:border-none"
                                        >
                                            {header.isPlaceholder ? null : (
                                                <table.FlexRender header={header} />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center py-12 text-slate-400"
                                    >
                                        Loading data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="text-center py-12 text-slate-400"
                                    >
                                        No records found.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50/80 transition-colors"
                                    >
                                        {row.getAllCells().map((cell) => (
                                            <td key={cell.id} className="px-3 py-3">
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

            {/* Pagination Controls */}
            <Pagination
                table={table}
                count={count}
                pageIndex={pageIndex}
                loading={loading}
            />
        </div>
    );
};