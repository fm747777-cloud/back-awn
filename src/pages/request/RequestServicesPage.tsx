import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Layers,
    Search as SearchIcon,
    Plus,
    Download,
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    Send,
    X,
    Check,
    ChevronDown,
    AlertTriangle,
    Building2,
    UserCheck,
    PackageCheck,
    RotateCcw,
    Link2,
    Calendar,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    REQUEST_BUSINESS_OWNERS,
    REQUEST_COMPANIES,
    REQUEST_PACKAGE_PRESETS,
    REQUEST_SERVICE_GROUPS,
    REQUEST_CATALOG_SERVICES,
    loadRequestServices,
    createRequestServiceRecord,
    updateRequestServiceRecord,
    deleteRequestServiceRecord,
    loadInitiatedRequests,
    saveInitiatedRequest,
    type RequestServiceRecord,
    type RequestServiceStatus,
    type RequestPriority,
    type InitiatedRequestPayload,
} from './requestServicesMockData';
import { appendRequestAuditEntry } from './requestsMockData';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100, 500] as const;

// ============================================================================
// Searchable Multi-Select Dropdown for Interconnected Top Filter
// ============================================================================

interface InterconnectedOption {
    id: string;
    labelEn: string;
    labelAr: string;
    subLabelEn?: string;
    subLabelAr?: string;
}

interface SearchableMultiSelectProps {
    label: string;
    placeholder: string;
    options: InterconnectedOption[];
    selectedIds: string[];
    onChange: (nextSelectedIds: string[]) => void;
    isAr: boolean;
    noOptionsText: string;
    icon?: React.ReactNode;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
    label,
    placeholder,
    options,
    selectedIds,
    onChange,
    isAr,
    noOptionsText,
    icon,
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
                (opt.subLabelEn && opt.subLabelEn.toLowerCase().includes(q)) ||
                (opt.subLabelAr && opt.subLabelAr.toLowerCase().includes(q))
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
                className={`min-h-[40px] w-full px-3 py-1.5 bg-[#FAF8F5] dark:bg-slate-800/80 border rounded-lg flex flex-wrap items-center gap-1.5 cursor-text transition ${
                    isOpen
                        ? 'border-[#2D3F2C] bg-white dark:bg-slate-800 ring-2 ring-[#2D3F2C]/15'
                        : 'border-[#E5E0D8] dark:border-slate-700 hover:border-[#BFAB93]'
                }`}
            >
                <span className="text-[#857E74] shrink-0 me-0.5">
                    {icon || <SearchIcon size={14} />}
                </span>

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
                    className="flex-1 min-w-[140px] bg-transparent text-xs text-[#0D0D0D] dark:text-slate-100 placeholder-[#857E74] focus:outline-none py-0.5"
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
                                        {(opt.subLabelEn || opt.subLabelAr) && (
                                            <div className="text-[10px] text-[#6E6862] dark:text-slate-400 truncate">
                                                {isAr ? opt.subLabelAr : opt.subLabelEn}
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

// ============================================================================
// Expandable Badges Cell for Service Groups & Selected Services
// ============================================================================

interface ExpandableBadgesCellProps {
    items: string[];
    maxVisible?: number;
    variant?: 'group' | 'service';
}

const ExpandableBadgesCell: React.FC<ExpandableBadgesCellProps> = ({
    items,
    maxVisible = 2,
    variant = 'group',
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    if (!items || items.length === 0) {
        return <span className="text-[#857E74]">—</span>;
    }

    const visibleItems = expanded ? items : items.slice(0, maxVisible);
    const hiddenCount = Math.max(0, items.length - maxVisible);

    const badgeClasses =
        variant === 'group'
            ? 'bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-emerald-300 border-[#E5E0D8] dark:border-slate-700'
            : 'bg-[#2D3F2C]/8 dark:bg-emerald-950/40 text-[#2D3F2C] dark:text-emerald-200 border-[#2D3F2C]/20 dark:border-emerald-800/50';

    return (
        <div className="flex flex-wrap items-center gap-1.5 max-w-[300px] whitespace-normal">
            {visibleItems.map((label, idx) => (
                <span
                    key={`${label}-${idx}`}
                    title={label}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border truncate max-w-[230px] ${badgeClasses}`}
                >
                    <span className="truncate">{label}</span>
                </span>
            ))}

            {hiddenCount > 0 && !expanded && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                    }}
                    title={items.slice(maxVisible).join(' • ')}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#8C6046]/12 text-[#8C6046] dark:text-amber-300 border border-[#8C6046]/25 hover:bg-[#8C6046]/20 transition cursor-pointer"
                >
                    {t('request.services.badges.moreCount', { count: hiddenCount })}
                </button>
            )}

            {expanded && items.length > maxVisible && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                    }}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 hover:text-[#0D0D0D] dark:hover:text-slate-200 underline cursor-pointer"
                >
                    {t('request.services.badges.showLess')}
                </button>
            )}
        </div>
    );
};

// ============================================================================
// Row Actions Menu (Initiate Request, View, Edit, Delete)
// ============================================================================

interface ServiceActionsMenuProps {
    item: RequestServiceRecord;
    onInitiate: (item: RequestServiceRecord) => void;
    onView: (item: RequestServiceRecord) => void;
    onEdit: (item: RequestServiceRecord) => void;
    onDelete: (item: RequestServiceRecord) => void;
}

const ServiceActionsMenu: React.FC<ServiceActionsMenuProps> = ({
    item,
    onInitiate,
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
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onInitiate(item);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#2D3F2C]/10 hover:bg-[#2D3F2C] text-[#2D3F2C] hover:text-[#FAF8F5] dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-700 dark:hover:text-white border border-[#2D3F2C]/20 transition-colors cursor-pointer"
                title={t('request.services.actions.initiateRequest')}
            >
                <Send size={12} className="shrink-0" />
                <span>{t('request.services.actions.initiateRequest')}</span>
            </button>

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
                    title={t('request.services.columns.actions')}
                    aria-label={t('request.services.columns.actions')}
                    aria-expanded={isOpen}
                >
                    <MoreHorizontal size={16} />
                </button>

                {isOpen && (
                    <div className="absolute end-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                onInitiate(item);
                            }}
                            className="w-full text-start px-3.5 py-2 text-[#2D3F2C] dark:text-emerald-300 font-semibold hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <Send size={14} className="shrink-0" />
                            <span>{t('request.services.actions.initiateRequest')}</span>
                        </button>

                        <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                onView(item);
                            }}
                            className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                            <Eye size={14} className="text-[#6E6862] dark:text-slate-400 shrink-0" />
                            <span>{t('request.services.actions.viewService')}</span>
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
                            <span>{t('request.services.actions.editService')}</span>
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
                            <span>{t('request.services.actions.deleteService')}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Add / Edit / View Service Drawer
// ============================================================================

export type ServiceDrawerMode = 'add' | 'edit' | 'view';

interface ServiceFormSubmitPayload {
    ownerId: string;
    companyId: string;
    packageName: string;
    serviceGroups: string[];
    serviceGroupsAr: string[];
    selectedServices: string[];
    selectedServicesAr: string[];
    createdDate: string;
    status: RequestServiceStatus;
}

interface ServiceRecordDrawerProps {
    isOpen: boolean;
    mode: ServiceDrawerMode;
    item: RequestServiceRecord | null;
    isAr: boolean;
    onClose: () => void;
    onSwitchToEdit: () => void;
    onInitiateFromView: (item: RequestServiceRecord) => void;
    onSubmit: (data: ServiceFormSubmitPayload, existingItem: RequestServiceRecord | null) => void;
}

const ServiceRecordDrawer: React.FC<ServiceRecordDrawerProps> = ({
    isOpen,
    mode,
    item,
    isAr,
    onClose,
    onSwitchToEdit,
    onInitiateFromView,
    onSubmit,
}) => {
    const { t } = useTranslation();

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [ownerId, setOwnerId] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [packageName, setPackageName] = useState('');
    const [serviceGroups, setServiceGroups] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [createdDate, setCreatedDate] = useState(todayStr);
    const [status, setStatus] = useState<RequestServiceStatus>('Active');

    const [customGroupInput, setCustomGroupInput] = useState('');
    const [customServiceInput, setCustomServiceInput] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${item?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setCustomGroupInput('');
        setCustomServiceInput('');

        if (isOpen && item && (mode === 'edit' || mode === 'view')) {
            setOwnerId(item.ownerId);
            setCompanyId(item.companyId);
            setPackageName(isAr ? item.packageNameAr || item.packageName : item.packageName);
            setServiceGroups([...item.serviceGroups]);
            setSelectedServices([...item.selectedServices]);
            setCreatedDate(item.createdDate);
            setStatus(item.status);
        } else if (isOpen && mode === 'add') {
            setOwnerId('');
            setCompanyId('');
            setPackageName('');
            setServiceGroups([]);
            setSelectedServices([]);
            setCreatedDate(todayStr);
            setStatus('Active');
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

    // Interconnected Companies inside Drawer based on selected Business Owner
    const availableCompanies = useMemo(() => {
        if (!ownerId) return REQUEST_COMPANIES;
        return REQUEST_COMPANIES.filter((c) => c.ownerId === ownerId);
    }, [ownerId]);

    const handleDrawerOwnerChange = (nextOwnerId: string) => {
        setOwnerId(nextOwnerId);
        if (nextOwnerId && companyId) {
            const comp = REQUEST_COMPANIES.find((c) => c.id === companyId);
            if (comp && comp.ownerId !== nextOwnerId) {
                const firstForOwner = REQUEST_COMPANIES.find((c) => c.ownerId === nextOwnerId);
                setCompanyId(firstForOwner ? firstForOwner.id : '');
            }
        }
    };

    const handleDrawerCompanyChange = (nextCompanyId: string) => {
        setCompanyId(nextCompanyId);
        const comp = REQUEST_COMPANIES.find((c) => c.id === nextCompanyId);
        if (comp && comp.ownerId !== ownerId) {
            setOwnerId(comp.ownerId);
        }
    };

    const toggleGroup = (groupNameEn: string) => {
        setServiceGroups((prev) =>
            prev.includes(groupNameEn)
                ? prev.filter((g) => g !== groupNameEn)
                : [...prev, groupNameEn]
        );
    };

    const toggleService = (serviceNameEn: string) => {
        setSelectedServices((prev) =>
            prev.includes(serviceNameEn)
                ? prev.filter((s) => s !== serviceNameEn)
                : [...prev, serviceNameEn]
        );
    };

    const handleAddCustomGroup = () => {
        const trimmed = customGroupInput.trim();
        if (!trimmed) return;
        if (!serviceGroups.includes(trimmed)) {
            setServiceGroups((prev) => [...prev, trimmed]);
        }
        setCustomGroupInput('');
    };

    const handleAddCustomService = () => {
        const trimmed = customServiceInput.trim();
        if (!trimmed) return;
        if (!selectedServices.includes(trimmed)) {
            setSelectedServices((prev) => [...prev, trimmed]);
        }
        setCustomServiceInput('');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        if (
            !ownerId ||
            !companyId ||
            !packageName.trim() ||
            serviceGroups.length === 0 ||
            selectedServices.length === 0 ||
            !createdDate
        ) {
            return;
        }

        const resolvedGroupsAr = serviceGroups.map((gEn) => {
            const found = REQUEST_SERVICE_GROUPS.find(
                (item) => item.nameEn === gEn || item.nameAr === gEn
            );
            return found ? found.nameAr : gEn;
        });

        const resolvedServicesAr = selectedServices.map((sEn) => {
            const found = REQUEST_CATALOG_SERVICES.find(
                (item) => item.nameEn === sEn || item.nameAr === sEn
            );
            return found ? found.nameAr : sEn;
        });

        onSubmit(
            {
                ownerId,
                companyId,
                packageName: packageName.trim(),
                serviceGroups,
                serviceGroupsAr: resolvedGroupsAr,
                selectedServices,
                selectedServicesAr: resolvedServicesAr,
                createdDate,
                status,
            },
            mode === 'edit' ? item : null
        );
    };

    const allKnownGroups = useMemo(() => {
        const base = REQUEST_SERVICE_GROUPS.map((g) => ({
            nameEn: g.nameEn,
            nameAr: g.nameAr,
        }));
        for (const g of serviceGroups) {
            if (!base.some((b) => b.nameEn === g || b.nameAr === g)) {
                base.push({ nameEn: g, nameAr: g });
            }
        }
        return base;
    }, [serviceGroups]);

    const allKnownServices = useMemo(() => {
        const base = REQUEST_CATALOG_SERVICES.map((s) => ({
            nameEn: s.nameEn,
            nameAr: s.nameAr,
        }));
        for (const s of selectedServices) {
            if (!base.some((b) => b.nameEn === s || b.nameAr === s)) {
                base.push({ nameEn: s, nameAr: s });
            }
        }
        return base;
    }, [selectedServices]);

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            <div
                className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div
                className={`fixed top-0 end-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                    isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                }`}
            >
                {/* Drawer Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {mode === 'add'
                                ? t('request.services.drawer.addTitle')
                                : mode === 'edit'
                                  ? t('request.services.drawer.editTitle')
                                  : t('request.services.drawer.viewTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {mode === 'add'
                                ? t('request.services.drawer.addSubtitle')
                                : mode === 'edit'
                                  ? t('request.services.drawer.editSubtitle', {
                                        code: item?.code || '',
                                    })
                                  : t('request.services.drawer.viewSubtitle', {
                                        code: item?.code || '',
                                    })}
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

                {/* View Mode */}
                {mode === 'view' && item && (
                    <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700 rounded-xl p-4">
                            <div>
                                <span className="text-[11px] text-[#6E6862] dark:text-slate-400 block">
                                    ID / Code
                                </span>
                                <span
                                    className="font-mono font-bold text-[#2D3F2C] dark:text-emerald-300 mt-0.5 inline-block"
                                    dir="ltr"
                                >
                                    {item.code}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-[#6E6862] dark:text-slate-400 block">
                                    {t('request.services.columns.status')}
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                                        item.status === 'Active'
                                            ? 'bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            item.status === 'Active'
                                                ? 'bg-[#2D3F2C] dark:bg-emerald-400'
                                                : 'bg-slate-500'
                                        }`}
                                    />
                                    {item.status === 'Active'
                                        ? t('common.active')
                                        : t('common.inactive')}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('request.services.drawer.businessOwner')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                                    {isAr ? item.ownerNameAr : item.ownerNameEn}
                                </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('request.services.columns.companyName')}
                                </span>
                                <span className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                                    {isAr ? item.companyNameAr || item.companyName : item.companyName}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('request.services.columns.packageName')}
                                </span>
                                <span className="font-semibold text-[#2D3F2C] dark:text-emerald-300">
                                    {isAr ? item.packageNameAr || item.packageName : item.packageName}
                                </span>
                            </div>

                            <div className="p-3.5 rounded-xl border border-[#E5E0D8] dark:border-slate-800">
                                <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('request.services.columns.createdDate')}
                                </span>
                                <span
                                    className="font-mono font-medium text-[#0D0D0D] dark:text-slate-100"
                                    dir="ltr"
                                >
                                    {item.createdDate}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-2">
                            <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block">
                                {t('request.services.columns.serviceGroups')} ({item.serviceGroups.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {(isAr && item.serviceGroupsAr?.length
                                    ? item.serviceGroupsAr
                                    : item.serviceGroups
                                ).map((grp, i) => (
                                    <span
                                        key={`${grp}-${i}`}
                                        className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 font-medium"
                                    >
                                        {grp}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-[#E5E0D8] dark:border-slate-800 space-y-2">
                            <span className="text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 block">
                                {t('request.services.columns.selectedServices')} ({item.selectedServices.length})
                            </span>
                            <div className="flex flex-col gap-1.5">
                                {(isAr && item.selectedServicesAr?.length
                                    ? item.selectedServicesAr
                                    : item.selectedServices
                                ).map((srv, i) => (
                                    <div
                                        key={`${srv}-${i}`}
                                        className="px-3 py-2 rounded-lg bg-[#2D3F2C]/6 dark:bg-slate-800/80 border border-[#2D3F2C]/15 dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 font-medium flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={14} className="text-[#2D3F2C] dark:text-emerald-400 shrink-0" />
                                        <span>{srv}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add / Edit Form Mode */}
                {(mode === 'add' || mode === 'edit') && (
                    <form
                        id="awn-request-service-form"
                        onSubmit={handleFormSubmit}
                        noValidate
                        className="p-6 overflow-y-auto flex-1 space-y-4 text-xs"
                    >
                        {/* Interconnected Business Owner & Company */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('request.services.drawer.businessOwner')}{' '}
                                    <span className="text-[#A23B2A]">*</span>
                                </label>
                                <select
                                    value={ownerId}
                                    onChange={(e) => handleDrawerOwnerChange(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-lg border text-xs transition ${
                                        hasSubmitted && !ownerId
                                            ? 'border-red-400 bg-white dark:bg-slate-800'
                                            : 'border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800'
                                    } text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]`}
                                >
                                    <option value="">
                                        {t('request.services.drawer.selectBusinessOwner')}
                                    </option>
                                    {REQUEST_BUSINESS_OWNERS.map((owner) => (
                                        <option key={owner.id} value={owner.id}>
                                            {isAr ? owner.nameAr : owner.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {hasSubmitted && !ownerId && (
                                    <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                        {t('request.services.drawer.errors.ownerRequired')}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('request.services.drawer.company')}{' '}
                                    <span className="text-[#A23B2A]">*</span>
                                </label>
                                <select
                                    value={companyId}
                                    onChange={(e) => handleDrawerCompanyChange(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-lg border text-xs transition ${
                                        hasSubmitted && !companyId
                                            ? 'border-red-400 bg-white dark:bg-slate-800'
                                            : 'border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800'
                                    } text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]`}
                                >
                                    <option value="">
                                        {t('request.services.drawer.selectCompany')}
                                    </option>
                                    {availableCompanies.map((comp) => (
                                        <option key={comp.id} value={comp.id}>
                                            {comp.name} ({isAr ? comp.ownerNameAr : comp.ownerNameEn})
                                        </option>
                                    ))}
                                </select>
                                {hasSubmitted && !companyId && (
                                    <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                        {t('request.services.drawer.errors.companyRequired')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Package Name + Presets */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.drawer.packageName')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={packageName}
                                onChange={(e) => setPackageName(e.target.value)}
                                placeholder={t('request.services.drawer.packageNamePlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    hasSubmitted && !packageName.trim()
                                        ? 'border-red-400 bg-white dark:bg-slate-800'
                                        : 'border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800'
                                } text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]`}
                            />
                            {hasSubmitted && !packageName.trim() && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {t('request.services.drawer.errors.packageRequired')}
                                </span>
                            )}
                            <div className="mt-2">
                                <span className="text-[10px] text-[#6E6862] dark:text-slate-400 block mb-1">
                                    {t('request.services.drawer.packagePresetsLabel')}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {REQUEST_PACKAGE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.nameEn}
                                            type="button"
                                            onClick={() => setPackageName(preset.nameEn)}
                                            className={`px-2 py-1 rounded-md text-[11px] border transition cursor-pointer ${
                                                packageName === preset.nameEn
                                                    ? 'bg-[#2D3F2C] text-white border-[#2D3F2C]'
                                                    : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#595550] dark:text-slate-300 hover:border-[#BFAB93]'
                                            }`}
                                        >
                                            {preset.nameEn}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Service Groups Multi-Select */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.drawer.serviceGroups')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <div className="max-h-40 overflow-y-auto p-2.5 rounded-xl border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5]/60 dark:bg-slate-800/50 space-y-1.5">
                                {allKnownGroups.map((grp) => {
                                    const checked = serviceGroups.includes(grp.nameEn);
                                    return (
                                        <label
                                            key={grp.nameEn}
                                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleGroup(grp.nameEn)}
                                                className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                            />
                                            <span className="text-xs text-[#0D0D0D] dark:text-slate-200">
                                                {isAr ? grp.nameAr : grp.nameEn}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={customGroupInput}
                                    onChange={(e) => setCustomGroupInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomGroup();
                                        }
                                    }}
                                    placeholder={t('request.services.drawer.customGroupPlaceholder')}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomGroup}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F5] dark:bg-slate-800 border border-[#DCD6CD] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 hover:bg-[#EFECE6] cursor-pointer"
                                >
                                    {t('request.services.drawer.addCustomBtn')}
                                </button>
                            </div>
                            {hasSubmitted && serviceGroups.length === 0 && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {t('request.services.drawer.errors.serviceGroupsRequired')}
                                </span>
                            )}
                        </div>

                        {/* Selected Services Multi-Select */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.drawer.selectedServices')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl border border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5]/60 dark:bg-slate-800/50 space-y-1.5">
                                {allKnownServices.map((srv) => {
                                    const checked = selectedServices.includes(srv.nameEn);
                                    return (
                                        <label
                                            key={srv.nameEn}
                                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleService(srv.nameEn)}
                                                className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                            />
                                            <span className="text-xs text-[#0D0D0D] dark:text-slate-200">
                                                {isAr ? srv.nameAr : srv.nameEn}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="text"
                                    value={customServiceInput}
                                    onChange={(e) => setCustomServiceInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomService();
                                        }
                                    }}
                                    placeholder={t('request.services.drawer.customServicePlaceholder')}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E0D8] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomService}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F5] dark:bg-slate-800 border border-[#DCD6CD] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300 hover:bg-[#EFECE6] cursor-pointer"
                                >
                                    {t('request.services.drawer.addCustomBtn')}
                                </button>
                            </div>
                            {hasSubmitted && selectedServices.length === 0 && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {t('request.services.drawer.errors.selectedServicesRequired')}
                                </span>
                            )}
                        </div>

                        {/* Created Date & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('request.services.drawer.createdDate')}{' '}
                                    <span className="text-[#A23B2A]">*</span>
                                </label>
                                <input
                                    type="date"
                                    dir="ltr"
                                    value={createdDate}
                                    onChange={(e) => setCreatedDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                />
                                {hasSubmitted && !createdDate && (
                                    <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                        {t('request.services.drawer.errors.createdDateRequired')}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                    {t('request.services.drawer.status')}{' '}
                                    <span className="text-[#A23B2A]">*</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) =>
                                        setStatus(e.target.value as RequestServiceStatus)
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                >
                                    <option value="Active">{t('common.active')}</option>
                                    <option value="Inactive">{t('common.inactive')}</option>
                                </select>
                            </div>
                        </div>
                    </form>
                )}

                {/* Drawer Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>

                    {mode === 'view' && item ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onInitiateFromView(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#2D3F2C] dark:text-emerald-300 bg-[#2D3F2C]/10 hover:bg-[#2D3F2C]/20 border border-[#2D3F2C]/25 rounded-lg transition cursor-pointer"
                            >
                                <Send size={13} />
                                <span>{t('request.services.actions.initiateRequest')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={onSwitchToEdit}
                                className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('request.services.actions.editService')}
                            </button>
                        </>
                    ) : (
                        <button
                            type="submit"
                            form="awn-request-service-form"
                            className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                        >
                            {mode === 'add'
                                ? t('request.services.drawer.saveService')
                                : t('request.services.drawer.saveChanges')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Initiate Request Modal (Preselects Company & Service, stores locally)
// ============================================================================

interface InitiateRequestModalProps {
    isOpen: boolean;
    serviceRecord: RequestServiceRecord | null;
    isAr: boolean;
    onClose: () => void;
    onSubmitRequest: (payload: Omit<InitiatedRequestPayload, 'id' | 'requestCode' | 'createdAt' | 'status'>) => void;
}

const InitiateRequestModal: React.FC<InitiateRequestModalProps> = ({
    isOpen,
    serviceRecord,
    isAr,
    onClose,
    onSubmitRequest,
}) => {
    const { t } = useTranslation();

    const defaultDueDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    }, []);

    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [requestTitle, setRequestTitle] = useState('');
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [priority, setPriority] = useState<RequestPriority>('Medium');
    const [requestedDueDate, setRequestedDueDate] = useState(defaultDueDate);
    const [notes, setNotes] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${serviceRecord?.id ?? 'none'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);

        if (isOpen && serviceRecord) {
            const groupsList =
                isAr && serviceRecord.serviceGroupsAr?.length
                    ? serviceRecord.serviceGroupsAr
                    : serviceRecord.serviceGroups;
            const servicesList =
                isAr && serviceRecord.selectedServicesAr?.length
                    ? serviceRecord.selectedServicesAr
                    : serviceRecord.selectedServices;

            const firstGroup = groupsList[0] || '';
            const firstService = servicesList[0] || '';

            setSelectedGroup(firstGroup);
            setSelectedService(firstService);
            setRequestTitle(
                `${firstService} - ${
                    isAr
                        ? serviceRecord.companyNameAr || serviceRecord.companyName
                        : serviceRecord.companyName
                }`
            );
            setBeneficiaryName(isAr ? serviceRecord.ownerNameAr : serviceRecord.ownerNameEn);
            setPriority('Medium');
            setRequestedDueDate(defaultDueDate);
            setNotes('');
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

    if (!isOpen || !serviceRecord) return null;

    const availableGroups =
        isAr && serviceRecord.serviceGroupsAr?.length
            ? serviceRecord.serviceGroupsAr
            : serviceRecord.serviceGroups;

    const availableServices =
        isAr && serviceRecord.selectedServicesAr?.length
            ? serviceRecord.selectedServicesAr
            : serviceRecord.selectedServices;

    const handleServiceSelectionChange = (nextService: string) => {
        setSelectedService(nextService);
        setRequestTitle(
            `${nextService} - ${
                isAr
                    ? serviceRecord.companyNameAr || serviceRecord.companyName
                    : serviceRecord.companyName
            }`
        );
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        if (
            !selectedService.trim() ||
            !requestTitle.trim() ||
            !beneficiaryName.trim() ||
            !requestedDueDate
        ) {
            return;
        }

        onSubmitRequest({
            serviceRecordId: serviceRecord.id,
            ownerId: serviceRecord.ownerId,
            ownerName: isAr ? serviceRecord.ownerNameAr : serviceRecord.ownerNameEn,
            companyId: serviceRecord.companyId,
            companyName: isAr
                ? serviceRecord.companyNameAr || serviceRecord.companyName
                : serviceRecord.companyName,
            packageName: isAr
                ? serviceRecord.packageNameAr || serviceRecord.packageName
                : serviceRecord.packageName,
            serviceGroup: selectedGroup || availableGroups[0] || '',
            serviceName: selectedService,
            requestTitle: requestTitle.trim(),
            beneficiaryName: beneficiaryName.trim(),
            priority,
            requestedDueDate,
            notes: notes.trim(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-start animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shrink-0">
                            <Send size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                {t('request.services.initiateModal.title')}
                            </h3>
                            <p className="text-xs text-[#6E6862] dark:text-slate-400">
                                {t('request.services.initiateModal.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 hover:bg-[#EFECE6] dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-4 text-xs">
                    {/* Preselected Context Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/70 border border-[#E5E0D8] dark:border-slate-700">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                                {t('request.services.initiateModal.company')}
                            </span>
                            <span className="font-bold text-[#0D0D0D] dark:text-slate-100 mt-0.5 block truncate">
                                {isAr
                                    ? serviceRecord.companyNameAr || serviceRecord.companyName
                                    : serviceRecord.companyName}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                                {t('request.services.initiateModal.businessOwner')}
                            </span>
                            <span className="font-semibold text-[#0D0D0D] dark:text-slate-200 mt-0.5 block truncate">
                                {isAr ? serviceRecord.ownerNameAr : serviceRecord.ownerNameEn}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                                {t('request.services.initiateModal.packageName')}
                            </span>
                            <span className="font-semibold text-[#2D3F2C] dark:text-emerald-300 mt-0.5 block truncate">
                                {isAr
                                    ? serviceRecord.packageNameAr || serviceRecord.packageName
                                    : serviceRecord.packageName}
                            </span>
                        </div>
                    </div>

                    {/* Preselected Service Group & Service */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.initiateModal.serviceGroup')}
                            </label>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                            >
                                {availableGroups.map((grp) => (
                                    <option key={grp} value={grp}>
                                        {grp}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.initiateModal.selectedService')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <select
                                value={selectedService}
                                onChange={(e) => handleServiceSelectionChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                            >
                                {availableServices.map((srv) => (
                                    <option key={srv} value={srv}>
                                        {srv}
                                    </option>
                                ))}
                            </select>
                            {hasSubmitted && !selectedService.trim() && (
                                <span className="text-[11px] text-red-500 mt-1 block">
                                    {t('request.services.initiateModal.errors.serviceRequired')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Request Title */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                            {t('request.services.initiateModal.requestTitle')}{' '}
                            <span className="text-[#A23B2A]">*</span>
                        </label>
                        <input
                            type="text"
                            value={requestTitle}
                            onChange={(e) => setRequestTitle(e.target.value)}
                            placeholder={t('request.services.initiateModal.requestTitlePlaceholder')}
                            className={`w-full px-3.5 py-2 rounded-lg border text-xs ${
                                hasSubmitted && !requestTitle.trim()
                                    ? 'border-red-400 bg-white dark:bg-slate-800'
                                    : 'border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800'
                            } text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]`}
                        />
                        {hasSubmitted && !requestTitle.trim() && (
                            <span className="text-[11px] text-red-500 mt-1 block">
                                {t('request.services.initiateModal.errors.titleRequired')}
                            </span>
                        )}
                    </div>

                    {/* Beneficiary, Priority, Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.initiateModal.beneficiaryName')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={beneficiaryName}
                                onChange={(e) => setBeneficiaryName(e.target.value)}
                                placeholder={t('request.services.initiateModal.beneficiaryPlaceholder')}
                                className={`w-full px-3 py-2 rounded-lg border text-xs ${
                                    hasSubmitted && !beneficiaryName.trim()
                                        ? 'border-red-400 bg-white dark:bg-slate-800'
                                        : 'border-[#E5E0D8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800'
                                } text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]`}
                            />
                            {hasSubmitted && !beneficiaryName.trim() && (
                                <span className="text-[11px] text-red-500 mt-1 block">
                                    {t('request.services.initiateModal.errors.beneficiaryRequired')}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.initiateModal.priority')}
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                            >
                                <option value="Low">{t('request.dashboard.priorities.low')}</option>
                                <option value="Medium">{t('request.dashboard.priorities.medium')}</option>
                                <option value="High">{t('request.dashboard.priorities.high')}</option>
                                <option value="Critical">{t('request.dashboard.priorities.critical')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                                {t('request.services.initiateModal.preferredDueDate')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <input
                                type="date"
                                dir="ltr"
                                value={requestedDueDate}
                                onChange={(e) => setRequestedDueDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs font-mono text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5">
                            {t('request.services.initiateModal.notes')}
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('request.services.initiateModal.notesPlaceholder')}
                            className="w-full px-3.5 py-2 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                        />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFECE6] dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                        >
                            {t('request.services.initiateModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                        >
                            <Send size={13} />
                            <span>{t('request.services.initiateModal.submit')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================================
// Main RequestServicesPage Component (/request/services)
// ============================================================================

export const RequestServicesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    // Persisted Services & Initiated Requests
    const [services, setServices] = useState<RequestServiceRecord[]>(() => loadRequestServices());
    const [initiatedRequests, setInitiatedRequests] = useState<InitiatedRequestPayload[]>(() =>
        loadInitiatedRequests()
    );

    // Interconnected Business Owners & Companies Filter State
    const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

    // Additional Table Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedServiceGroup, setSelectedServiceGroup] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Pagination State (Page sizes: 5, 10, 20, 30, 40, 50, 100, 500)
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState<number>(10);

    // Drawer / Modal State
    const [drawerState, setDrawerState] = useState<{
        isOpen: boolean;
        mode: ServiceDrawerMode;
        item: RequestServiceRecord | null;
    }>({ isOpen: false, mode: 'view', item: null });
    const [deletingService, setDeletingService] = useState<RequestServiceRecord | null>(null);
    const [initiatingService, setInitiatingService] = useState<RequestServiceRecord | null>(null);

    useEffect(() => {
        const handleStorage = () => {
            setServices(loadRequestServices());
            setInitiatedRequests(loadInitiatedRequests());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Interconnected Options for Top Filter
    const ownerFilterOptions = useMemo<InterconnectedOption[]>(
        () =>
            REQUEST_BUSINESS_OWNERS.map((owner) => {
                const ownerCompanies = REQUEST_COMPANIES.filter((c) => c.ownerId === owner.id);
                return {
                    id: owner.id,
                    labelEn: owner.nameEn,
                    labelAr: owner.nameAr,
                    subLabelEn: ownerCompanies.map((c) => c.name).join(' • '),
                    subLabelAr: ownerCompanies.map((c) => c.nameAr || c.name).join(' • '),
                };
            }),
        []
    );

    const availableCompaniesForSelectedOwners = useMemo(() => {
        if (selectedOwnerIds.length === 0) {
            return REQUEST_COMPANIES;
        }
        return REQUEST_COMPANIES.filter((comp) => selectedOwnerIds.includes(comp.ownerId));
    }, [selectedOwnerIds]);

    const companyFilterOptions = useMemo<InterconnectedOption[]>(
        () =>
            availableCompaniesForSelectedOwners.map((comp) => ({
                id: comp.id,
                labelEn: comp.name,
                labelAr: comp.nameAr || comp.name,
                subLabelEn: comp.ownerNameEn,
                subLabelAr: comp.ownerNameAr,
            })),
        [availableCompaniesForSelectedOwners]
    );

    // Interconnected Handler 1: Selecting Business Owner(s) filters available Companies
    const handleOwnerSelectionChange = useCallback((nextOwnerIds: string[]) => {
        setSelectedOwnerIds(nextOwnerIds);
        if (nextOwnerIds.length > 0) {
            setSelectedCompanyIds((prevCompIds) =>
                prevCompIds.filter((compId) => {
                    const comp = REQUEST_COMPANIES.find((c) => c.id === compId);
                    return comp ? nextOwnerIds.includes(comp.ownerId) : false;
                })
            );
        }
        setPageIndex(0);
    }, []);

    // Interconnected Handler 2: Selecting Company updates the relevant Business Owner context
    const handleCompanySelectionChange = useCallback((nextCompanyIds: string[]) => {
        setSelectedCompanyIds(nextCompanyIds);
        if (nextCompanyIds.length > 0) {
            const linkedOwnerIds = Array.from(
                new Set(
                    nextCompanyIds
                        .map((compId) => REQUEST_COMPANIES.find((c) => c.id === compId)?.ownerId)
                        .filter((id): id is string => Boolean(id))
                )
            );
            setSelectedOwnerIds((prevOwners) => {
                const combined = new Set([...prevOwners, ...linkedOwnerIds]);
                return Array.from(combined);
            });
        }
        setPageIndex(0);
    }, []);

    // Single-select dropdown handlers in the secondary filter bar (synced with top filter)
    const handleSingleOwnerDropdown = (ownerIdVal: string) => {
        if (ownerIdVal === 'all') {
            handleOwnerSelectionChange([]);
        } else {
            handleOwnerSelectionChange([ownerIdVal]);
        }
    };

    const handleSingleCompanyDropdown = (companyIdVal: string) => {
        if (companyIdVal === 'all') {
            setSelectedCompanyIds([]);
            setPageIndex(0);
        } else {
            const comp = REQUEST_COMPANIES.find((c) => c.id === companyIdVal);
            setSelectedCompanyIds([companyIdVal]);
            if (comp) {
                setSelectedOwnerIds([comp.ownerId]);
            }
            setPageIndex(0);
        }
    };

    const hasAnyActiveFilter =
        selectedOwnerIds.length > 0 ||
        selectedCompanyIds.length > 0 ||
        searchQuery.trim().length > 0 ||
        selectedServiceGroup !== 'all' ||
        selectedStatus !== 'all';

    const handleResetAllFilters = () => {
        setSelectedOwnerIds([]);
        setSelectedCompanyIds([]);
        setSearchQuery('');
        setSelectedServiceGroup('all');
        setSelectedStatus('all');
        setPageIndex(0);
    };

    // Filtered Services
    const filteredServices = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return services.filter((item) => {
            if (selectedOwnerIds.length > 0 && !selectedOwnerIds.includes(item.ownerId)) {
                return false;
            }

            if (selectedCompanyIds.length > 0 && !selectedCompanyIds.includes(item.companyId)) {
                return false;
            }

            if (selectedServiceGroup !== 'all') {
                const matchesGroup =
                    item.serviceGroups.includes(selectedServiceGroup) ||
                    item.serviceGroupsAr.includes(selectedServiceGroup);
                if (!matchesGroup) return false;
            }

            if (selectedStatus !== 'all' && item.status !== selectedStatus) {
                return false;
            }

            if (q) {
                const matchesQuery =
                    item.code.toLowerCase().includes(q) ||
                    item.companyName.toLowerCase().includes(q) ||
                    (item.companyNameAr || '').toLowerCase().includes(q) ||
                    item.ownerNameEn.toLowerCase().includes(q) ||
                    item.ownerNameAr.toLowerCase().includes(q) ||
                    item.packageName.toLowerCase().includes(q) ||
                    (item.packageNameAr || '').toLowerCase().includes(q) ||
                    item.createdDate.toLowerCase().includes(q) ||
                    item.status.toLowerCase().includes(q) ||
                    item.serviceGroups.some((g) => g.toLowerCase().includes(q)) ||
                    item.serviceGroupsAr.some((g) => g.toLowerCase().includes(q)) ||
                    item.selectedServices.some((s) => s.toLowerCase().includes(q)) ||
                    item.selectedServicesAr.some((s) => s.toLowerCase().includes(q));

                if (!matchesQuery) return false;
            }

            return true;
        });
    }, [
        services,
        selectedOwnerIds,
        selectedCompanyIds,
        selectedServiceGroup,
        selectedStatus,
        searchQuery,
    ]);

    // Paginated Services
    const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
    const safePageIndex = Math.min(pageIndex, totalPages - 1);

    const paginatedServices = useMemo(() => {
        const start = safePageIndex * pageSize;
        return filteredServices.slice(start, start + pageSize);
    }, [filteredServices, safePageIndex, pageSize]);

    // Summary Metrics
    const activeServicesCount = useMemo(
        () => services.filter((s) => s.status === 'Active').length,
        [services]
    );
    const uniqueCompaniesCount = useMemo(
        () => new Set(services.map((s) => s.companyId)).size,
        [services]
    );

    // CRUD Handlers
    const handleOpenAdd = () => {
        setDrawerState({ isOpen: true, mode: 'add', item: null });
    };

    const handleOpenView = useCallback((item: RequestServiceRecord) => {
        setDrawerState({ isOpen: true, mode: 'view', item });
    }, []);

    const handleOpenEdit = useCallback((item: RequestServiceRecord) => {
        setDrawerState({ isOpen: true, mode: 'edit', item });
    }, []);

    const handleOpenDelete = useCallback((item: RequestServiceRecord) => {
        setDeletingService(item);
    }, []);

    const handleOpenInitiate = useCallback((item: RequestServiceRecord) => {
        setInitiatingService(item);
    }, []);

    const handleDrawerSubmit = useCallback(
        (formData: ServiceFormSubmitPayload, existingItem: RequestServiceRecord | null) => {
            const ownerObj = REQUEST_BUSINESS_OWNERS.find((o) => o.id === formData.ownerId);
            const compObj = REQUEST_COMPANIES.find((c) => c.id === formData.companyId);

            if (existingItem) {
                const updated: RequestServiceRecord = {
                    ...existingItem,
                    ownerId: formData.ownerId,
                    ownerNameEn: ownerObj?.nameEn || existingItem.ownerNameEn,
                    ownerNameAr: ownerObj?.nameAr || existingItem.ownerNameAr,
                    companyId: formData.companyId,
                    companyName: compObj?.name || existingItem.companyName,
                    companyNameAr: compObj?.nameAr || compObj?.name || existingItem.companyNameAr,
                    packageName: formData.packageName,
                    packageNameAr: formData.packageName,
                    serviceGroups: formData.serviceGroups,
                    serviceGroupsAr: formData.serviceGroupsAr,
                    selectedServices: formData.selectedServices,
                    selectedServicesAr: formData.selectedServicesAr,
                    createdDate: formData.createdDate,
                    status: formData.status,
                };
                const nextList = updateRequestServiceRecord(updated);
                setServices(nextList);
                appendRequestAuditEntry({
                    action: 'Update Service',
                    actionCode: 'UPDATED',
                    resource: 'Service',
                    recordId: updated.code,
                    requestId: updated.code,
                    serviceId: updated.code,
                    requestTitle: updated.packageName,
                    requestTitleAr: updated.packageNameAr || updated.packageName,
                    packageName: updated.packageName,
                    packageNameAr: updated.packageNameAr || updated.packageName,
                    businessName: updated.companyName,
                    businessNameAr: updated.companyNameAr || updated.companyName,
                    performedByEn: 'Operations Admin',
                    performedByAr: 'مدير العمليات',
                    detailsEn: `Updated service package ${updated.code} (${updated.packageName}) for ${updated.companyName}.`,
                    detailsAr: `تم تحديث باقة الخدمة ${updated.code} (${updated.packageNameAr || updated.packageName}) لصالح ${updated.companyNameAr || updated.companyName}.`,
                    previousStatus: existingItem.status,
                    newStatus: updated.status,
                });
                setDrawerState({ isOpen: false, mode: 'view', item: null });
                toast.success(t('request.services.feedback.updateSuccess'));
            } else {
                const nextCodeNum = services.length + 1;
                const newRecord: RequestServiceRecord = {
                    id: `req-srv-${Date.now()}`,
                    code: `RSRV-${String(nextCodeNum).padStart(3, '0')}`,
                    ownerId: formData.ownerId,
                    ownerNameEn: ownerObj?.nameEn || 'Business Owner',
                    ownerNameAr: ownerObj?.nameAr || 'مالك المنشأة',
                    companyId: formData.companyId,
                    companyName: compObj?.name || 'Company',
                    companyNameAr: compObj?.nameAr || compObj?.name || 'الشركة',
                    packageName: formData.packageName,
                    packageNameAr: formData.packageName,
                    serviceGroups: formData.serviceGroups,
                    serviceGroupsAr: formData.serviceGroupsAr,
                    selectedServices: formData.selectedServices,
                    selectedServicesAr: formData.selectedServicesAr,
                    createdDate: formData.createdDate,
                    status: formData.status,
                };
                const nextList = createRequestServiceRecord(newRecord);
                setServices(nextList);
                appendRequestAuditEntry({
                    action: 'Create Service',
                    actionCode: 'CREATED',
                    resource: 'Service',
                    recordId: newRecord.code,
                    requestId: newRecord.code,
                    serviceId: newRecord.code,
                    requestTitle: newRecord.packageName,
                    requestTitleAr: newRecord.packageNameAr || newRecord.packageName,
                    packageName: newRecord.packageName,
                    packageNameAr: newRecord.packageNameAr || newRecord.packageName,
                    businessName: newRecord.companyName,
                    businessNameAr: newRecord.companyNameAr || newRecord.companyName,
                    performedByEn: newRecord.ownerNameEn,
                    performedByAr: newRecord.ownerNameAr,
                    detailsEn: `Created service package ${newRecord.code} (${newRecord.packageName}) for ${newRecord.companyName}.`,
                    detailsAr: `تم إنشاء باقة الخدمة ${newRecord.code} (${newRecord.packageNameAr || newRecord.packageName}) لصالح ${newRecord.companyNameAr || newRecord.companyName}.`,
                    newStatus: newRecord.status,
                });
                setPageIndex(0);
                setDrawerState({ isOpen: false, mode: 'view', item: null });
                toast.success(t('request.services.feedback.createSuccess'));
            }
        },
        [services.length, t]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingService) return;
        const nextList = deleteRequestServiceRecord(deletingService.id);
        setServices(nextList);
        appendRequestAuditEntry({
            action: 'Delete Service',
            actionCode: 'DELETED',
            resource: 'Service',
            recordId: deletingService.code,
            requestId: deletingService.code,
            serviceId: deletingService.code,
            requestTitle: deletingService.packageName,
            requestTitleAr: deletingService.packageNameAr || deletingService.packageName,
            packageName: deletingService.packageName,
            packageNameAr: deletingService.packageNameAr || deletingService.packageName,
            businessName: deletingService.companyName,
            businessNameAr: deletingService.companyNameAr || deletingService.companyName,
            performedByEn: 'Operations Admin',
            performedByAr: 'مدير العمليات',
            detailsEn: `Deleted service package ${deletingService.code} (${deletingService.packageName}) for ${deletingService.companyName}.`,
            detailsAr: `تم حذف باقة الخدمة ${deletingService.code} (${deletingService.packageNameAr || deletingService.packageName}) الخاصة بـ ${deletingService.companyNameAr || deletingService.companyName}.`,
            previousStatus: deletingService.status,
        });
        const maxPage = Math.max(0, Math.ceil(nextList.length / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }
        setDeletingService(null);
        toast.success(t('request.services.feedback.deleteSuccess'));
    }, [deletingService, pageIndex, pageSize, t]);

    const handleInitiateSubmit = useCallback(
        (
            payload: Omit<
                InitiatedRequestPayload,
                'id' | 'requestCode' | 'createdAt' | 'status'
            >
        ) => {
            const nextSeq = initiatedRequests.length + 101;
            const requestCode = `REQ-2026-${nextSeq}`;
            const fullRecord: InitiatedRequestPayload = {
                ...payload,
                id: `init-req-${Date.now()}`,
                requestCode,
                status: 'Initiated',
                createdAt: new Date().toISOString(),
            };
            const updatedInitiated = saveInitiatedRequest(fullRecord);
            setInitiatedRequests(updatedInitiated);
            setInitiatingService(null);
            toast.success(
                t('request.services.feedback.initiateSuccess', {
                    code: requestCode,
                    company: payload.companyName,
                })
            );
        },
        [initiatedRequests.length, t]
    );

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('request.services.columns.companyName'),
            t('request.services.drawer.businessOwner'),
            t('request.services.columns.packageName'),
            t('request.services.columns.serviceGroups'),
            t('request.services.columns.selectedServices'),
            t('request.services.columns.createdDate'),
            t('request.services.columns.status'),
        ];
        const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredServices.map((rec) => [
            escapeCsv(isAr ? rec.companyNameAr || rec.companyName : rec.companyName),
            escapeCsv(isAr ? rec.ownerNameAr : rec.ownerNameEn),
            escapeCsv(isAr ? rec.packageNameAr || rec.packageName : rec.packageName),
            escapeCsv(
                (isAr && rec.serviceGroupsAr?.length ? rec.serviceGroupsAr : rec.serviceGroups).join(
                    ' | '
                )
            ),
            escapeCsv(
                (isAr && rec.selectedServicesAr?.length
                    ? rec.selectedServicesAr
                    : rec.selectedServices
                ).join(' | ')
            ),
            escapeCsv(rec.createdDate),
            escapeCsv(rec.status === 'Active' ? t('common.active') : t('common.inactive')),
        ]);

        const csvContent =
            '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'request-services.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('request.services.feedback.exportSuccess', { count: filteredServices.length })
        );
    }, [filteredServices, isAr, t]);

    return (
        <div className="space-y-5 text-start">
            {/* 1. Page Header */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/60 border border-[#2D3F2C]/15 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Layers size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8C6046] dark:text-amber-400 mb-0.5">
                            {t('request.title')}
                        </p>
                        <h1 className="text-xl font-bold text-[#0D0D0D] dark:text-slate-100 tracking-tight">
                            {t('request.services.title')}
                        </h1>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {t('request.services.description')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-[#DCD6CD] dark:border-slate-700 hover:border-[#BFAB93] text-[#2D3F2C] dark:text-slate-200 hover:bg-[#F8F6F2] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#6A7358]" />
                        <span>{t('request.services.exportCsv')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-[#FAF8F5] text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                        <Plus size={14} className="text-[#BFAB93]" />
                        <span>{t('request.services.addService')}</span>
                    </button>
                </div>
            </div>

            {/* 2. Top Filter: Select Business Owners & Companies (Interconnected) */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F0ECE4] dark:border-slate-800 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                                {t('request.services.topFilter.title')}
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#2D3F2C]/20">
                                <Link2 size={11} />
                                {t('request.services.topFilter.interconnectedBadge')}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {t('request.services.topFilter.helperText')}
                        </p>
                    </div>

                    {(selectedOwnerIds.length > 0 || selectedCompanyIds.length > 0) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedOwnerIds([]);
                                setSelectedCompanyIds([]);
                                setPageIndex(0);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8C6046] hover:bg-[#8C6046]/10 transition cursor-pointer self-start sm:self-center"
                        >
                            <RotateCcw size={13} />
                            <span>{t('request.services.topFilter.clearSelections')}</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableMultiSelect
                        label={t('request.services.topFilter.businessOwners')}
                        placeholder={t('request.services.topFilter.selectBusinessOwners')}
                        options={ownerFilterOptions}
                        selectedIds={selectedOwnerIds}
                        onChange={handleOwnerSelectionChange}
                        isAr={isAr}
                        noOptionsText={t('request.services.topFilter.noMatchingOptions')}
                        icon={<UserCheck size={14} />}
                    />

                    <SearchableMultiSelect
                        label={t('request.services.topFilter.companies')}
                        placeholder={t('request.services.topFilter.selectCompanies')}
                        options={companyFilterOptions}
                        selectedIds={selectedCompanyIds}
                        onChange={handleCompanySelectionChange}
                        isAr={isAr}
                        noOptionsText={t('request.services.topFilter.noMatchingOptions')}
                        icon={<Building2 size={14} />}
                    />
                </div>
            </div>

            {/* 3. Services Summary Bar (Total Services: 24) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                            {t('request.services.summary.totalServicesLabel')}
                        </span>
                        <span className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100 mt-1 block">
                            {t('request.services.summary.totalServices', { count: services.length })}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <PackageCheck size={19} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                            {t('request.services.summary.activeServices')}
                        </span>
                        <span className="text-lg font-bold text-[#2D3F2C] dark:text-emerald-300 mt-1 block font-mono">
                            {activeServicesCount}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#EAF3EC] dark:bg-emerald-950/60 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={19} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                            {t('request.services.summary.companiesCovered')}
                        </span>
                        <span className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100 mt-1 block font-mono">
                            {uniqueCompaniesCount}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#8C6046] dark:text-amber-300 flex items-center justify-center shrink-0">
                        <Building2 size={19} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 block">
                            {t('request.services.summary.initiatedRequests')}
                        </span>
                        <span className="text-lg font-bold text-[#8C6046] dark:text-amber-300 mt-1 block font-mono">
                            {initiatedRequests.length}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#8C6046]/10 text-[#8C6046] dark:text-amber-300 flex items-center justify-center shrink-0">
                        <Send size={18} />
                    </div>
                </div>
            </div>

            {/* 4. Search & Table Filters Bar (Search, Business Owner, Company, Service Group, Status, Page Size) */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xl">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[#857E74] pointer-events-none">
                            <SearchIcon size={15} />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPageIndex(0);
                            }}
                            placeholder={t('request.services.filters.searchPlaceholder')}
                            className="w-full ps-9 pe-8 py-2 bg-[#FAF8F5]/80 dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2D3F2C] rounded-lg text-xs text-[#0D0D0D] dark:text-slate-100 placeholder-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/15 transition"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setPageIndex(0);
                                }}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Show Page Size Selector (5, 10, 20, 30, 40, 50, 100, 500) */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        {hasAnyActiveFilter && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A23B2A] bg-[#A23B2A]/8 hover:bg-[#A23B2A]/15 transition cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('request.services.filters.resetFilters')}</span>
                            </button>
                        )}

                        <div className="flex items-center gap-2 text-xs text-[#6E6862] dark:text-slate-400">
                            <span>{t('request.services.filters.show')}</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPageIndex(0);
                                }}
                                aria-label="Show entries per page"
                                className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#DCD6CD] dark:border-slate-700 text-xs font-mono font-semibold text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] cursor-pointer"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span>{t('request.services.filters.entries')}</span>
                        </div>
                    </div>
                </div>

                {/* Filter Dropdowns Row: Business Owner, Company, Service Group, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#F0ECE4] dark:border-slate-800">
                    <div>
                        <label className="block text-[11px] font-semibold text-[#595550] dark:text-slate-400 mb-1">
                            {t('request.services.filters.businessOwner')}
                        </label>
                        <select
                            value={selectedOwnerIds.length === 1 ? selectedOwnerIds[0] : 'all'}
                            onChange={(e) => handleSingleOwnerDropdown(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">{t('request.services.filters.allOwners')}</option>
                            {REQUEST_BUSINESS_OWNERS.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {isAr ? owner.nameAr : owner.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#595550] dark:text-slate-400 mb-1">
                            {t('request.services.filters.company')}
                        </label>
                        <select
                            value={selectedCompanyIds.length === 1 ? selectedCompanyIds[0] : 'all'}
                            onChange={(e) => handleSingleCompanyDropdown(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">{t('request.services.filters.allCompanies')}</option>
                            {availableCompaniesForSelectedOwners.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {isAr ? comp.nameAr || comp.name : comp.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#595550] dark:text-slate-400 mb-1">
                            {t('request.services.filters.serviceGroup')}
                        </label>
                        <select
                            value={selectedServiceGroup}
                            onChange={(e) => {
                                setSelectedServiceGroup(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">
                                {t('request.services.filters.allServiceGroups')}
                            </option>
                            {REQUEST_SERVICE_GROUPS.map((grp) => (
                                <option key={grp.id} value={grp.nameEn}>
                                    {isAr ? grp.nameAr : grp.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-[#595550] dark:text-slate-400 mb-1">
                            {t('request.services.filters.status')}
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPageIndex(0);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                        >
                            <option value="all">{t('request.services.filters.allStatuses')}</option>
                            <option value="Active">{t('common.active')}</option>
                            <option value="Inactive">{t('common.inactive')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 5. Services Table */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                        <thead className="bg-[#FAF8F5] dark:bg-slate-800/90 border-b border-[#E5E0D8] dark:border-slate-700 text-[#595550] dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.companyName')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.packageName')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.serviceGroups')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.selectedServices')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.createdDate')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold border-e border-[#F0ECE4] dark:border-slate-700 text-start whitespace-nowrap">
                                    {t('request.services.columns.status')}
                                </th>
                                <th className="px-4 py-3.5 font-semibold text-start whitespace-nowrap">
                                    {t('request.services.columns.actions')}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[#EFECE6] dark:divide-slate-800 text-[#0D0D0D] dark:text-slate-100">
                            {paginatedServices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-center py-14 text-[#857E74] dark:text-slate-400"
                                    >
                                        <p className="text-xs font-medium">
                                            {t('common.noRecordsMatch')}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedServices.map((rec) => {
                                    const groupsDisplay =
                                        isAr && rec.serviceGroupsAr?.length
                                            ? rec.serviceGroupsAr
                                            : rec.serviceGroups;
                                    const servicesDisplay =
                                        isAr && rec.selectedServicesAr?.length
                                            ? rec.selectedServicesAr
                                            : rec.selectedServices;

                                    return (
                                        <tr
                                            key={rec.id}
                                            className="hover:bg-[#F8F6F2]/75 dark:hover:bg-slate-800/50 transition-colors align-top"
                                        >
                                            {/* 1. Company Name */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                                                        {isAr
                                                            ? rec.companyNameAr || rec.companyName
                                                            : rec.companyName}
                                                    </span>
                                                    <span className="text-[11px] text-[#6E6862] dark:text-slate-400 mt-0.5">
                                                        {isAr ? rec.ownerNameAr : rec.ownerNameEn}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 2. Package Name */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-[#2D3F2C] dark:text-emerald-300">
                                                    {isAr
                                                        ? rec.packageNameAr || rec.packageName
                                                        : rec.packageName}
                                                </span>
                                            </td>

                                            {/* 3. Service Groups */}
                                            <td className="px-4 py-3.5">
                                                <ExpandableBadgesCell
                                                    items={groupsDisplay}
                                                    maxVisible={2}
                                                    variant="group"
                                                />
                                            </td>

                                            {/* 4. Selected Services */}
                                            <td className="px-4 py-3.5">
                                                <ExpandableBadgesCell
                                                    items={servicesDisplay}
                                                    maxVisible={2}
                                                    variant="service"
                                                />
                                            </td>

                                            {/* 5. Created Date */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span
                                                    className="inline-flex items-center gap-1 font-mono text-xs text-[#595550] dark:text-slate-300"
                                                    dir="ltr"
                                                >
                                                    <Calendar size={12} className="text-[#857E74]" />
                                                    {rec.createdDate}
                                                </span>
                                            </td>

                                            {/* 6. Status */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                        rec.status === 'Active'
                                                            ? 'bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border-[#2D3F2C]/20 dark:border-emerald-700/40'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            rec.status === 'Active'
                                                                ? 'bg-[#2D3F2C] dark:bg-emerald-400'
                                                                : 'bg-slate-400'
                                                        }`}
                                                    />
                                                    {rec.status === 'Active'
                                                        ? t('common.active')
                                                        : t('common.inactive')}
                                                </span>
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <ServiceActionsMenu
                                                    item={rec}
                                                    onInitiate={handleOpenInitiate}
                                                    onView={handleOpenView}
                                                    onEdit={handleOpenEdit}
                                                    onDelete={handleOpenDelete}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. Bottom Pagination Bar: "Showing 10 out of 24 entries" + Page Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-1 text-xs text-[#6E6862] dark:text-slate-400 select-none">
                <div className="font-medium text-[#0D0D0D] dark:text-slate-200">
                    {t('request.services.pagination.showingOutOf', {
                        shown: paginatedServices.length,
                        total: filteredServices.length,
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                        disabled={safePageIndex <= 0}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#DCD6CD] dark:border-slate-700 hover:border-[#BFAB93] hover:bg-[#F8F6F2] font-medium text-[#2D3F2C] dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                    >
                        {t('request.services.pagination.previous')}
                    </button>

                    {Array.from({ length: totalPages }, (_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setPageIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg font-mono font-semibold min-w-8 text-center shadow-2xs transition cursor-pointer ${
                                idx === safePageIndex
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                    : 'bg-white dark:bg-slate-900 border border-[#DCD6CD] dark:border-slate-700 text-[#595550] dark:text-slate-300 hover:bg-[#FAF8F5]'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
                        }
                        disabled={safePageIndex >= totalPages - 1}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#DCD6CD] dark:border-slate-700 hover:border-[#BFAB93] hover:bg-[#F8F6F2] font-medium text-[#2D3F2C] dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                    >
                        {t('request.services.pagination.next')}
                    </button>
                </div>
            </div>

            {/* 7. Add / Edit / View Service Drawer */}
            <ServiceRecordDrawer
                isOpen={drawerState.isOpen}
                mode={drawerState.mode}
                item={drawerState.item}
                isAr={isAr}
                onClose={() => setDrawerState({ isOpen: false, mode: 'view', item: null })}
                onSwitchToEdit={() =>
                    setDrawerState((prev) => ({ ...prev, mode: 'edit' }))
                }
                onInitiateFromView={handleOpenInitiate}
                onSubmit={handleDrawerSubmit}
            />

            {/* 8. Initiate Request Modal */}
            <InitiateRequestModal
                isOpen={Boolean(initiatingService)}
                serviceRecord={initiatingService}
                isAr={isAr}
                onClose={() => setInitiatingService(null)}
                onSubmitRequest={handleInitiateSubmit}
            />

            {/* 9. Delete Confirmation Modal */}
            {deletingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('request.services.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t('request.services.deleteModal.message', {
                                        package: isAr
                                            ? deletingService.packageNameAr ||
                                              deletingService.packageName
                                            : deletingService.packageName,
                                        company: isAr
                                            ? deletingService.companyNameAr ||
                                              deletingService.companyName
                                            : deletingService.companyName,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingService(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('request.services.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('request.services.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
