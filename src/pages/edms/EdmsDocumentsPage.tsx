import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Search as SearchIcon,
    X,
    ChevronDown,
    Check,
    Eye,
    Edit2,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_DOCUMENTS,
    EDMS_COMPANY_OPTIONS,
    EDMS_EMPLOYEE_OPTIONS,
    updateDemoDocument,
    removeDemoDocument,
    type EdmsDemoDocument,
    type EdmsFilterOption,
} from './edmsMockData';

interface DocumentActionsMenuProps {
    item: EdmsDemoDocument;
    onView: (item: EdmsDemoDocument) => void;
    onEdit: (item: EdmsDemoDocument) => void;
    onDelete: (item: EdmsDemoDocument) => void;
}

const DocumentActionsMenu: React.FC<DocumentActionsMenuProps> = ({
    item,
    onView,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-start" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isOpen
                        ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                        : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800 hover:text-[#0D0D0D] dark:hover:text-slate-100'
                }`}
                title={t('edms.documents.columns.actions')}
                aria-label={t('edms.documents.columns.actions')}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onView(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Eye size={14} className="text-[#6E6862] dark:text-slate-400 shrink-0" />
                        <span>{t('edms.documents.actions.view')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] dark:text-slate-400 shrink-0" />
                        <span>{t('edms.documents.actions.edit')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('edms.documents.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

interface DocumentDrawerProps {
    isOpen: boolean;
    mode: 'view' | 'edit';
    item: EdmsDemoDocument | null;
    isAr: boolean;
    onClose: () => void;
    onSwitchToEdit: () => void;
    onSubmitEdit: (
        data: {
            titleEn: string;
            titleAr: string;
            holderNameEn: string;
            holderNameAr: string;
            issueDate: string;
            expiryDate: string;
        },
        existingItem: EdmsDemoDocument
    ) => void;
}

const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
    isOpen,
    mode,
    item,
    isAr,
    onClose,
    onSwitchToEdit,
    onSubmitEdit,
}) => {
    const { t } = useTranslation();

    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [holderNameEn, setHolderNameEn] = useState('');
    const [holderNameAr, setHolderNameAr] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [titleError, setTitleError] = useState<string | null>(null);

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${item?.id ?? 'none'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setTitleError(null);
        if (isOpen && item) {
            setTitleEn(item.titleEn);
            setTitleAr(item.titleAr);
            setHolderNameEn(item.holderNameEn);
            setHolderNameAr(item.holderNameAr);
            setIssueDate(item.issueDate);
            setExpiryDate(item.expiryDate);
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;
        setHasSubmitted(true);

        const activeTitle = (isAr ? titleAr : titleEn).trim();
        if (!activeTitle) {
            setTitleError(t('edms.documents.drawer.titleRequired'));
            return;
        }
        setTitleError(null);

        onSubmitEdit(
            {
                titleEn: titleEn.trim() || activeTitle,
                titleAr: titleAr.trim() || activeTitle,
                holderNameEn: holderNameEn.trim() || item.holderNameEn,
                holderNameAr: holderNameAr.trim() || item.holderNameAr,
                issueDate: issueDate || item.issueDate,
                expiryDate: expiryDate || item.expiryDate,
            },
            item
        );
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div
                className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                    isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                }`}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {mode === 'edit'
                                ? t('edms.documents.drawer.editTitle')
                                : t('edms.documents.drawer.viewTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {t('edms.documents.drawer.subtitle', { code: item?.code || '' })}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer"
                        title={t('common.close')}
                        aria-label={t('common.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {item && mode === 'view' && (
                    <div className="p-6 overflow-y-auto flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700 rounded-xl p-4 text-xs">
                            <div>
                                <span className="text-[11px] text-[#6E6862] dark:text-slate-400 block">
                                    {t('edms.documents.columns.documentCode')}
                                </span>
                                <span className="font-mono font-bold text-[#2D3F2C] dark:text-emerald-300 mt-0.5 inline-block" dir="ltr">
                                    {item.code}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-[#6E6862] dark:text-slate-400 block">
                                    {t('edms.documents.columns.status')}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                                    {t('common.active')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('edms.documents.columns.documentTitle')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                                    {isAr ? item.titleAr : item.titleEn}
                                </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('edms.documents.columns.documentFor')}
                                </span>
                                <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                                    {isAr ? item.documentForAr : item.documentForEn}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                        {t('edms.documents.columns.documentCategory')}
                                    </span>
                                    <span className="font-medium text-[#2D3F2C] dark:text-emerald-300">
                                        {isAr ? item.categoryAr : item.categoryEn}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                        {t('edms.documents.columns.documentType')}
                                    </span>
                                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                                        {isAr ? item.typeAr : item.typeEn}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                        {t('edms.documents.drawer.issueDate')}
                                    </span>
                                    <span className="font-mono text-[#0D0D0D] dark:text-slate-100" dir="ltr">
                                        {item.issueDate}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                    <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                        {t('edms.documents.drawer.expiryDate')}
                                    </span>
                                    <span className="font-mono text-[#0D0D0D] dark:text-slate-100" dir="ltr">
                                        {item.expiryDate}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('edms.documents.columns.createdBy')}
                                </span>
                                <span className="font-medium text-[#0D0D0D] dark:text-slate-100 block">
                                    {isAr ? item.createdByAr : item.createdByEn}
                                </span>
                                <span className="font-mono text-[11px] text-[#857E74]" dir="ltr">
                                    {item.createdByEmail}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {item && mode === 'edit' && (
                    <form
                        id="awn-edms-document-edit-form"
                        onSubmit={handleFormSubmit}
                        noValidate
                        className="p-6 overflow-y-auto flex-1 space-y-4"
                    >
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('edms.documents.columns.documentTitle')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={isAr ? titleAr : titleEn}
                                onChange={(e) => {
                                    if (isAr) {
                                        setTitleAr(e.target.value);
                                    } else {
                                        setTitleEn(e.target.value);
                                    }
                                    if (hasSubmitted && titleError && e.target.value.trim()) {
                                        setTitleError(null);
                                    }
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    hasSubmitted && titleError
                                        ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                        : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {hasSubmitted && titleError && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {titleError}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('edms.documents.drawer.holderName')}
                            </label>
                            <input
                                type="text"
                                value={isAr ? holderNameAr : holderNameEn}
                                onChange={(e) => {
                                    if (isAr) {
                                        setHolderNameAr(e.target.value);
                                    } else {
                                        setHolderNameEn(e.target.value);
                                    }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('edms.documents.drawer.issueDate')}
                                </label>
                                <input
                                    type="date"
                                    dir="ltr"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('edms.documents.drawer.expiryDate')}
                                </label>
                                <input
                                    type="date"
                                    dir="ltr"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                />
                            </div>
                        </div>
                    </form>
                )}

                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                    >
                        {t('common.close')}
                    </button>
                    {mode === 'view' ? (
                        <button
                            type="button"
                            onClick={onSwitchToEdit}
                            className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                        >
                            {t('edms.documents.actions.edit')}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="awn-edms-document-edit-form"
                            className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                        >
                            {t('edms.documents.drawer.saveChanges')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

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

    const [documents, setDocuments] = useState<EdmsDemoDocument[]>(() => [
        ...EDMS_DEMO_DOCUMENTS,
    ]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer & Delete Modal state
    const [drawerState, setDrawerState] = useState<{
        isOpen: boolean;
        mode: 'view' | 'edit';
        item: EdmsDemoDocument | null;
    }>({ isOpen: false, mode: 'view', item: null });
    const [deletingDoc, setDeletingDoc] = useState<EdmsDemoDocument | null>(null);

    const handleOpenView = useCallback((item: EdmsDemoDocument) => {
        setDrawerState({ isOpen: true, mode: 'view', item });
    }, []);

    const handleOpenEdit = useCallback((item: EdmsDemoDocument) => {
        setDrawerState({ isOpen: true, mode: 'edit', item });
    }, []);

    const handleOpenDelete = useCallback((item: EdmsDemoDocument) => {
        setDeletingDoc(item);
    }, []);

    const handleEditSubmit = useCallback(
        (
            formData: {
                titleEn: string;
                titleAr: string;
                holderNameEn: string;
                holderNameAr: string;
                issueDate: string;
                expiryDate: string;
            },
            existingItem: EdmsDemoDocument
        ) => {
            const updated: EdmsDemoDocument = {
                ...existingItem,
                titleEn: formData.titleEn,
                titleAr: formData.titleAr,
                holderNameEn: formData.holderNameEn,
                holderNameAr: formData.holderNameAr,
                issueDate: formData.issueDate,
                expiryDate: formData.expiryDate,
            };
            updateDemoDocument(updated);
            setDocuments([...EDMS_DEMO_DOCUMENTS]);
            setDrawerState({ isOpen: false, mode: 'view', item: null });
            toast.success(t('edms.documents.feedback.editSuccess'));
        },
        [t]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingDoc) return;
        removeDemoDocument(deletingDoc.id);
        const nextList = [...EDMS_DEMO_DOCUMENTS];
        setDocuments(nextList);

        const maxPage = Math.max(0, Math.ceil(nextList.length / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }

        setDeletingDoc(null);
        toast.success(t('edms.documents.feedback.deleteSuccess'));
    }, [deletingDoc, pageIndex, pageSize, t]);

    // Filter dataset locally using search + Companies multi-select + Employees multi-select
    const filteredDocuments = useMemo(() => {
        const q = searchValue.trim().toLowerCase();

        return documents.filter((doc) => {
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
    }, [documents, searchValue, selectedCompanyIds, selectedEmployeeIds]);

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
            escapeCsv(isAr ? doc.categoryAr : doc.categoryEn),
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
                        {isAr ? row.original.categoryAr : row.original.categoryEn}
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
                cell: ({ row }: { row: { original: EdmsDemoDocument } }) => (
                    <DocumentActionsMenu
                        item={row.original}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [handleOpenDelete, handleOpenEdit, handleOpenView, isAr, t]
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

            <DocumentDrawer
                isOpen={drawerState.isOpen}
                mode={drawerState.mode}
                item={drawerState.item}
                isAr={isAr}
                onClose={() => setDrawerState({ isOpen: false, mode: 'view', item: null })}
                onSwitchToEdit={() =>
                    setDrawerState((prev) => ({ ...prev, mode: 'edit' }))
                }
                onSubmitEdit={handleEditSubmit}
            />

            {deletingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('edms.documents.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t('edms.documents.deleteModal.message', {
                                        code: deletingDoc.code,
                                        name: isAr ? deletingDoc.titleAr : deletingDoc.titleEn,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingDoc(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('edms.documents.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('edms.documents.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
