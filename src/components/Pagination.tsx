import { useTranslation } from 'react-i18next';

type PaginationProps = {
    table: any;
    count: number;
    pageIndex: number;
    loading: boolean;
};

const Pagination = ({ table, pageIndex, loading }: PaginationProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2 text-xs select-none">
            <button
                type="button"
                onClick={() => {
                    if (table.getCanPreviousPage()) {
                        table.previousPage();
                    }
                }}
                disabled={!table.getCanPreviousPage() || loading}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD6CD] hover:border-[#BFAB93] hover:bg-[#F8F6F2] font-medium text-[#2D3F2C] disabled:opacity-40 disabled:hover:border-[#DCD6CD] disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            >
                {t('common.previous')}
            </button>

            <span className="px-3 py-1.5 bg-[#2D3F2C] text-[#FAF8F5] rounded-lg font-mono font-semibold min-w-8 text-center shadow-2xs">
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
                className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD6CD] hover:border-[#BFAB93] hover:bg-[#F8F6F2] font-medium text-[#2D3F2C] disabled:opacity-40 disabled:hover:border-[#DCD6CD] disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
            >
                {t('common.next')}
            </button>
        </div>
    );
};

export default Pagination;
