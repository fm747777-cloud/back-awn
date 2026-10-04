type PaginationProps = {
    table: any;
    count: number;
    pageIndex: number;
    loading: boolean;
};

const Pagination = ({ table, pageIndex, loading }: PaginationProps) => {
    return (
        <div className="flex justify-end items-center mt-4 gap-2 text-xs">
            <button
                type="button"
                onClick={() => {
                    if (table.getCanPreviousPage()) {
                        table.previousPage();
                    }
                }}
                disabled={!table.getCanPreviousPage() || loading}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
                Previous
            </button>

            <span className="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-medium">
                {pageIndex + 1}
            </span>

            <button
                type="button"
                onClick={() => {
                    if (table.getCanNextPage()) {
                        table.nextPage();
                    }
                }}
                disabled={!table.getCanNextPage() || loading}
                className="px-3 py-1.5 rounded bg-white border border-slate-200 font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-sm"
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;