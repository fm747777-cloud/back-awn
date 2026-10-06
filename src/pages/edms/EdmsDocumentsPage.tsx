import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Search as SearchIcon, X, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_DOCUMENTS,
    EDMS_COMPANY_OPTIONS,
    EDMS_EMPLOYEE_OPTIONS,
    type EdmsDemoDocument,
    type EdmsFilterOption,
} from './edmsMockData';

interface SearchableMultiSelectProps {
    label: string;
    placeholder: string;
    options: EdmsFilterOption[];
    selectedIds: string[];
    onChange: (nextSelectedIds: string[]) => void;
    isAr: boolean;
    noOptionsText: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
    label,
    placeholder,
    options,
    selectedIds,
    onChange,
    isAr,
    noOptionsText,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            (opt) =>
                opt.labelEn.toLowerCase().includes(q) ||
                opt.labelAr.toLowerCase().includes(q) ||
                (opt.companyEn && opt.companyEn.toLowerCase().includes(q)) ||
                (opt.companyAr && opt.companyAr.toLowerCase().includes(q))
        );
    }, [options, query]);

    const toggleOption = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((item) => item !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const removeOption = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter((item) => item !== id));
    };

    const selectedOptions = useMemo(
        () => options.filter((opt) => selectedIds.includes(opt.id)),
        [options, selectedIds]
    );

    return (
        <div ref={containerRef} className="relative text-start">
            <label className="block text-[11px] font-semibold text-[#595550] dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <div
                onClick={() => setIsOpen(true)}
                className={`min-h-[38px] w-full px-3 py-1.5 bg-[#FAF8F5] dark:bg-slate-800/80 border rounded-lg flex flex-wrap items-center gap-1.5 cursor-text transition ${
                    isOpen
                        ? 'border-[#2D3F2C] bg-white dark:bg-slate-800 ring-2 ring-[#2D3F2C]/15'
                        : 'border-[#E5E0D8] dark:border-slate-700 hover:border-[#BFAB93]'
                }`}
            >
                <SearchIcon size={14} className="text-[#857E74] shrink-0 me-0.5" />

                {selectedOptions.map((opt) => (
                    <span
                        key={opt.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2D3F2C] text-[#FAF8F5] shadow-2xs"
                    >
                        <span className="truncate max-w-[180px]">
                            {isAr ? opt.labelAr : opt.labelEn}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => removeOption(opt.id, e)}
                            className="hover:text-[#BFAB93] transition cursor-pointer"
                            aria-label={`Remove ${isAr ? opt.labelAr : opt.labelEn}`}
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    placeholder={selectedOptions.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[160px] bg-transparent text-xs text-[#0D0D0D] dark:text-slate-100 placeholder-[#857E74] focus:outline-none py-0.5"
                />

                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange([]);
                            setQuery('');
                        }}
                        className="p-0.5 text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 transition cursor-pointer"
                        aria-label="Clear selection"
                    >
                        <X size={13} />
                    </button>
                )}

                <ChevronDown
                    size={14}
                    className={`text-[#857E74] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </div>

            {isOpen && (
                <div className="absolute z-30 mt-1.5 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1.5">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3.5 py-3 text-xs text-[#857E74] text-center">
                            {noOptionsText}
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = selectedIds.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleOption(opt.id)}
                                    className={`w-full px-3.5 py-2 text-xs flex items-center justify-between gap-2 text-start transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#2D3F2C]/8 dark:bg-slate-800 font-semibold text-[#2D3F2C] dark:text-emerald-300'
                                            : 'text-[#0D0D0D] dark:text-slate-200 hover:bg-[#FAF8F5] dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="truncate">
                                            {isAr ? opt.labelAr : opt.labelEn}
                                        </div>
                                        {(opt.companyEn || opt.companyAr) && (
                                            <div className="text-[10px] text-[#6E6862] dark:text-slate-400 truncate">
                                                {isAr ? opt.companyAr : opt.companyEn}
                                            </div>
                                        )}
                                    </div>
                                    <span
                                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition ${
                                            isSelected
                                                ? 'bg-[#2D3F2C] border-[#2D3F2C] text-[#FAF8F5]'
                                                : 'border-[#DCD6CD] dark:border-slate-600 bg-white dark:bg-slate-800'
                                        }`}
                                    >
                                        {isSelected && <Check size={11} />}
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export const EdmsDocumentsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [searchValue, setSearchValue] = useState('');
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Filter dataset locally using search + Companies multi-select + Employees multi-select
    const filteredDocuments = useMemo(() => {
        const q = searchValue.trim().toLowerCase();

        return EDMS_DEMO_DOCUMENTS.filter((doc) => {
            if (selectedCompanyIds.length > 0 && !selectedCompanyIds.includes(doc.companyId)) {
                return false;
            }

            if (selectedEmployeeIds.length > 0) {
                if (!doc.employeeId || !selectedEmployeeIds.includes(doc.employeeId)) {
                    return false;
                }
            }

            if (q) {
                const matchesSearch =
                    doc.code.toLowerCase().includes(q) ||
                    doc.titleEn.toLowerCase().includes(q) ||
                    doc.titleAr.toLowerCase().includes(q) ||
                    doc.documentForEn.toLowerCase().includes(q) ||
                    doc.documentForAr.toLowerCase().includes(q) ||
                    doc.typeEn.toLowerCase().includes(q) ||
                    doc.typeAr.toLowerCase().includes(q) ||
                    doc.categoryAr.toLowerCase().includes(q) ||
                    doc.categoryEn.toLowerCase().includes(q) ||
                    doc.createdByEn.toLowerCase().includes(q) ||
                    doc.createdByAr.toLowerCase().includes(q);
                if (!matchesSearch) return false;
            }

            return true;
        });
    }, [searchValue, selectedCompanyIds, selectedEmployeeIds]);

    // Paginate locally
    const paginatedDocuments = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredDocuments.slice(start, start + pageSize);
    }, [filteredDocuments, pageIndex, pageSize]);

    const handleCompanyFilterChange = useCallback((nextIds: string[]) => {
        setSelectedCompanyIds(nextIds);
        setPageIndex(0);
    }, []);

    const handleEmployeeFilterChange = useCallback((nextIds: string[]) => {
        setSelectedEmployeeIds(nextIds);
        setPageIndex(0);
    }, []);

    const handleSearchChange = useCallback((val: string) => {
        setSearchValue(val);
        setPageIndex(0);
    }, []);

    // Local CSV Export following existing AWN export pattern
    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documents.columns.documentCode'),
            t('edms.documents.columns.documentTitle'),
            t('edms.documents.columns.documentFor'),
            t('edms.documents.columns.documentType'),
            t('edms.documents.columns.documentCategory'),
            t('edms.documents.columns.createdBy'),
            t('edms.documents.columns.status'),
        ];

        const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredDocuments.map((doc) => [
            escapeCsv(doc.code),
            escapeCsv(isAr ? doc.titleAr : doc.titleEn),
            escapeCsv(isAr ? doc.documentForAr : doc.documentForEn),
            escapeCsv(isAr ? doc.typeAr : doc.typeEn),
            escapeCsv(doc.categoryAr),
            escapeCsv(isAr ? doc.createdByAr : doc.createdByEn),
            escapeCsv(t('common.active')),
        ]);

        const csvContent =
            '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'edms-documents.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('edms.documents.exportSuccess', {
                count: filteredDocuments.length,
            })
        );
    }, [filteredDocuments, isAr, t]);

    // Columns in exact required order:
    // Checkbox, 1. Document Code, 2. Document Title, 3. Document For, 4. Document Type, 5. Document Category, 6. Created By, 7. Status, 8. Actions
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }: any) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected?.() || false}
                        onChange={table.getToggleAllRowsSelectedHandler?.()}
                        aria-label="Select all documents"
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
                cell: ({ row }: any) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected?.() || false}
                        onChange={row.getToggleSelectedHandler?.()}
                        aria-label={`Select ${row.original.code}`}
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
            },
            {
                accessorKey: 'code',
                header: t('edms.documents.columns.documentCode'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <span
                        className="font-semibold font-mono text-xs text-[#2D3F2C] dark:text-emerald-300"
                        dir="ltr"
                    >
                        {row.original.code}
                    </span>
                ),
            },
            {
                id: 'documentTitle',
                header: t('edms.documents.columns.documentTitle'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100 inline-block text-start">
                        {isAr ? row.original.titleAr : row.original.titleEn}
                    </span>
                ),
            },
            {
                id: 'documentFor',
                header: t('edms.documents.columns.documentFor'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <span className="text-[#0D0D0D] dark:text-slate-200 font-medium inline-block text-start">
                        {isAr ? row.original.documentForAr : row.original.documentForEn}
                    </span>
                ),
            },
            {
                id: 'documentType',
                header: t('edms.documents.columns.documentType'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <span className="text-[#595550] dark:text-slate-300 font-medium">
                        {isAr ? row.original.typeAr : row.original.typeEn}
                    </span>
                ),
            },
            {
                id: 'documentCategory',
                header: t('edms.documents.columns.documentCategory'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-slate-200 border border-[#E5E0D8] dark:border-slate-700">
                        {row.original.categoryAr}
                    </span>
                ),
            },
            {
                id: 'createdBy',
                header: t('edms.documents.columns.createdBy'),
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <div className="flex flex-col text-start">
                        <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                            {isAr ? row.original.createdByAr : row.original.createdByEn}
                        </span>
                        <span className="text-[10px] text-[#857E74] font-mono" dir="ltr">
                            {row.original.createdByEmail}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: t('edms.documents.columns.status'),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border border-[#2D3F2C]/20 dark:border-emerald-700/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                        {t('common.active')}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('edms.documents.columns.actions'),
                cell: () => (
                    <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-100 transition cursor-pointer"
                        title={t('edms.documents.columns.actions')}
                        aria-label={t('edms.documents.columns.actions')}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                ),
            },
        ],
        [isAr, t]
    );

    const filtersPanel = (
        <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SearchableMultiSelect
                    label={t('edms.documents.filters.companies')}
                    placeholder={t('edms.documents.filters.companiesPlaceholder')}
                    options={EDMS_COMPANY_OPTIONS}
                    selectedIds={selectedCompanyIds}
                    onChange={handleCompanyFilterChange}
                    isAr={isAr}
                    noOptionsText={t('edms.documents.filters.noOptionsMatch')}
                />

                <SearchableMultiSelect
                    label={t('edms.documents.filters.employees')}
                    placeholder={t('edms.documents.filters.employeesPlaceholder')}
                    options={EDMS_EMPLOYEE_OPTIONS}
                    selectedIds={selectedEmployeeIds}
                    onChange={handleEmployeeFilterChange}
                    isAr={isAr}
                    noOptionsText={t('edms.documents.filters.noOptionsMatch')}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedDocuments}
                count={filteredDocuments.length}
                loading={false}
                title={t('edms.documents.title')}
                description={t('edms.documents.description')}
                searchPlaceholder={t('edms.documents.searchPlaceholder')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                onExport={handleExportCsv}
                isFiltersOpen={true}
                filtersContent={filtersPanel}
            />
        </div>
    );
};
