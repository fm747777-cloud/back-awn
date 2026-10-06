import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import { DEMO_TABLE_TICKETS, type TableTicket } from './ticketingMockData';

// --- Actions Dropdown Component (View, Edit, Delete) ---
interface TicketActionsMenuProps {
    ticket: TableTicket;
}

const TicketActionsMenu: React.FC<TicketActionsMenuProps> = ({ ticket }) => {
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

    const handleAction = (actionName: 'view' | 'edit' | 'delete') => {
        setIsOpen(false);
        if (actionName === 'view') {
            toast.info(t('ticketing.actions.viewPrompt', { id: ticket.ticketId }));
        } else if (actionName === 'edit') {
            toast.info(t('ticketing.actions.editPrompt', { id: ticket.ticketId }));
        } else if (actionName === 'delete') {
            toast.error(t('ticketing.actions.deletePrompt', { id: ticket.ticketId }));
        }
    };

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
                        : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] hover:text-[#0D0D0D]'
                }`}
                title={t('ticketing.columns.actions')}
                aria-label={t('ticketing.columns.actions')}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-36 bg-white border border-[#E5E0D8] rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    {/* 1. View */}
                    <button
                        type="button"
                        onClick={() => handleAction('view')}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Eye size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('ticketing.actions.view')}</span>
                    </button>

                    {/* 2. Edit */}
                    <button
                        type="button"
                        onClick={() => handleAction('edit')}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('ticketing.actions.edit')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4]" />

                    {/* 3. Delete */}
                    <button
                        type="button"
                        onClick={() => handleAction('delete')}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('ticketing.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Main Tickets Page Component ---
export const TicketsPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    // State
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedResource, setSelectedResource] = useState<string>('all');

    const hasActiveFilters =
        selectedStatus !== 'all' ||
        selectedPriority !== 'all' ||
        selectedType !== 'all' ||
        selectedCompany !== 'all' ||
        selectedResource !== 'all';

    const handleResetFilters = () => {
        setSelectedStatus('all');
        setSelectedPriority('all');
        setSelectedType('all');
        setSelectedCompany('all');
        setSelectedResource('all');
        setPageIndex(0);
    };

    // Filter and search computation
    const filteredTickets = useMemo(() => {
        return DEMO_TABLE_TICKETS.filter((ticket) => {
            // Search filter
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const matchId = ticket.ticketId.toLowerCase().includes(q);
                const matchSubject =
                    ticket.subject.toLowerCase().includes(q) ||
                    ticket.subjectEn.toLowerCase().includes(q);
                const matchCustomer =
                    ticket.customer.toLowerCase().includes(q) ||
                    ticket.customerEn.toLowerCase().includes(q);
                const matchCompany =
                    ticket.company.toLowerCase().includes(q) ||
                    ticket.companyEn.toLowerCase().includes(q);

                if (!matchId && !matchSubject && !matchCustomer && !matchCompany) {
                    return false;
                }
            }

            // Status filter
            if (selectedStatus !== 'all' && ticket.status !== selectedStatus) {
                return false;
            }

            // Priority filter (must strictly match High, Medium, Low)
            if (selectedPriority !== 'all' && ticket.priority !== selectedPriority) {
                return false;
            }

            // Type filter
            if (selectedType !== 'all') {
                if (
                    ticket.ticketType !== selectedType &&
                    ticket.ticketTypeEn !== selectedType
                ) {
                    return false;
                }
            }

            // Company filter
            if (selectedCompany !== 'all') {
                if (
                    ticket.company !== selectedCompany &&
                    ticket.companyEn !== selectedCompany
                ) {
                    return false;
                }
            }

            // Resource filter
            if (selectedResource !== 'all') {
                if (selectedResource === 'unassigned') {
                    if (ticket.assignedTo !== null) return false;
                } else if (
                    ticket.assignedTo !== selectedResource &&
                    ticket.assignedToEn !== selectedResource
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [
        searchValue,
        selectedStatus,
        selectedPriority,
        selectedType,
        selectedCompany,
        selectedResource,
    ]);

    // Paginated slice
    const paginatedTickets = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTickets.slice(start, start + pageSize);
    }, [filteredTickets, pageIndex, pageSize]);

    // --- Columns in Exact Required Order ---
    // 1. Ticket ID
    // 2. Subject
    // 3. Ticket Type
    // 4. Customer
    // 5. Company
    // 6. Assigned To
    // 7. Assigned By
    // 8. Reply Status
    // 9. Status
    // 10. Closed Date
    // 11. Priority
    // 12. Created Date
    // 13. Actions
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            // 1. Ticket ID
            {
                accessorKey: 'ticketId',
                header: t('ticketing.columns.ticketId'),
                cell: ({ getValue }: any) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {getValue()}
                    </span>
                ),
            },
            // 2. Subject
            {
                accessorKey: 'subject',
                header: t('ticketing.columns.subject'),
                cell: ({ row }: any) => {
                    const text = isAr ? row.original.subject : row.original.subjectEn;
                    return (
                        <span
                            className="font-medium text-[#0D0D0D] block max-w-[260px] truncate text-start"
                            title={text}
                        >
                            {text}
                        </span>
                    );
                },
            },
            // 3. Ticket Type
            {
                accessorKey: 'ticketType',
                header: t('ticketing.columns.ticketType'),
                cell: ({ row }: any) => {
                    const text = isAr ? row.original.ticketType : row.original.ticketTypeEn;
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8] text-[#595550]">
                            {text}
                        </span>
                    );
                },
            },
            // 4. Customer
            {
                accessorKey: 'customer',
                header: t('ticketing.columns.customer'),
                cell: ({ row }: any) => {
                    const name = isAr ? row.original.customer : row.original.customerEn;
                    return <span className="text-[#0D0D0D] font-medium">{name}</span>;
                },
            },
            // 5. Company
            {
                accessorKey: 'company',
                header: t('ticketing.columns.company'),
                cell: ({ row }: any) => {
                    const companyName = isAr ? row.original.company : row.original.companyEn;
                    return <span className="text-[#595550]">{companyName}</span>;
                },
            },
            // 6. Assigned To
            {
                accessorKey: 'assignedTo',
                header: t('ticketing.columns.assignedTo'),
                cell: ({ row }: any) => {
                    const val = isAr ? row.original.assignedTo : row.original.assignedToEn;
                    if (!val) {
                        return (
                            <span className="text-[#857E74] italic text-[11px]">
                                {t('ticketing.labels.unassigned')}
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#0D0D0D] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            <span>{val}</span>
                        </span>
                    );
                },
            },
            // 7. Assigned By
            {
                accessorKey: 'assignedBy',
                header: t('ticketing.columns.assignedBy'),
                cell: ({ row }: any) => {
                    const by = isAr ? row.original.assignedBy : row.original.assignedByEn;
                    return <span className="text-[#6E6862] text-xs">{by}</span>;
                },
            },
            // 8. Reply Status
            {
                accessorKey: 'replyStatus',
                header: t('ticketing.columns.replyStatus'),
                cell: ({ getValue }: any) => {
                    const replyStatus = getValue();
                    if (replyStatus === 'replied') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                                {t('ticketing.replyStatuses.replied')}
                            </span>
                        );
                    }
                    if (replyStatus === 'waiting_customer') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#BFAB93]/20 text-[#6A5A43] border border-[#BFAB93]/40">
                                {t('ticketing.replyStatuses.waitingCustomer')}
                            </span>
                        );
                    }
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                            {t('ticketing.replyStatuses.pendingAgent')}
                        </span>
                    );
                },
            },
            // 9. Status
            {
                accessorKey: 'status',
                header: t('ticketing.columns.status'),
                cell: ({ getValue }: any) => {
                    const status = getValue();
                    if (status === 'open') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                                {t('ticketing.labels.open')}
                            </span>
                        );
                    }
                    if (status === 'closed') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#6A7358]/10 text-[#6A7358] border border-[#6A7358]/20">
                                {t('ticketing.labels.closed')}
                            </span>
                        );
                    }
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                            {t('ticketing.labels.reopened')}
                        </span>
                    );
                },
            },
            // 10. Closed Date
            {
                accessorKey: 'closedDate',
                header: t('ticketing.columns.closedDate'),
                cell: ({ getValue }: any) => {
                    const val = getValue();
                    if (!val) return <span className="text-[#857E74]">—</span>;
                    return (
                        <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                            {val}
                        </span>
                    );
                },
            },
            // 11. Priority (High, Medium, Low only)
            {
                accessorKey: 'priority',
                header: t('ticketing.columns.priority'),
                cell: ({ getValue }: any) => {
                    const priority = getValue();
                    if (priority === 'High') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                                {t('ticketing.priorities.high')}
                            </span>
                        );
                    }
                    if (priority === 'Medium') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                                {t('ticketing.priorities.medium')}
                            </span>
                        );
                    }
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#6E6862] border border-[#E5E0D8]">
                            {t('ticketing.priorities.low')}
                        </span>
                    );
                },
            },
            // 12. Created Date
            {
                accessorKey: 'createdDate',
                header: t('ticketing.columns.createdDate'),
                cell: ({ getValue }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {getValue()}
                    </span>
                ),
            },
            // 13. Actions
            {
                id: 'actions',
                header: t('ticketing.columns.actions'),
                cell: ({ row }: any) => <TicketActionsMenu ticket={row.original} />,
            },
        ],
        [t, isAr]
    );

    // Collapsible Filters Panel
    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3.5 mb-1">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE4]">
                <span className="text-xs font-bold text-[#0D0D0D]">
                    {t('ticketing.filters.showFilters')}
                </span>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 text-xs text-[#8C6046] hover:text-[#0D0D0D] font-medium transition cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        <span>{t('ticketing.filters.resetFilters')}</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Status Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.filters.status')}
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">{t('ticketing.filters.allStatuses')}</option>
                        <option value="open">{t('ticketing.labels.open')}</option>
                        <option value="closed">{t('ticketing.labels.closed')}</option>
                        <option value="reopened">{t('ticketing.labels.reopened')}</option>
                    </select>
                </div>

                {/* 2. Priority Filter (High, Medium, Low) */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.filters.priority')}
                    </label>
                    <select
                        value={selectedPriority}
                        onChange={(e) => {
                            setSelectedPriority(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">{t('ticketing.filters.allPriorities')}</option>
                        <option value="High">{t('ticketing.priorities.high')}</option>
                        <option value="Medium">{t('ticketing.priorities.medium')}</option>
                        <option value="Low">{t('ticketing.priorities.low')}</option>
                    </select>
                </div>

                {/* 3. Ticket Type Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.filters.ticketType')}
                    </label>
                    <select
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">{t('ticketing.filters.allTypes')}</option>
                        <option value="Technical Support">
                            {isAr ? 'الدعم الفني' : 'Technical Support'}
                        </option>
                        <option value="Administrative Request">
                            {isAr ? 'طلب إداري' : 'Administrative Request'}
                        </option>
                        <option value="Billing & Payments">
                            {isAr ? 'الفواتير والمدفوعات' : 'Billing & Payments'}
                        </option>
                        <option value="Compliance Inquiry">
                            {isAr ? 'استفسار امتثال' : 'Compliance Inquiry'}
                        </option>
                    </select>
                </div>

                {/* 4. Company Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.filters.company')}
                    </label>
                    <select
                        value={selectedCompany}
                        onChange={(e) => {
                            setSelectedCompany(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">{t('ticketing.filters.allCompanies')}</option>
                        <option value="Al Rajhi Industries">
                            {isAr ? 'شركة الراجحي للصناعات' : 'Al Rajhi Industries'}
                        </option>
                        <option value="Al Fozan Holding">
                            {isAr ? 'مجموعة الفوزان القابضة' : 'Al Fozan Holding'}
                        </option>
                        <option value="Almarai Trading">
                            {isAr ? 'شركة المراعي للتجارة' : 'Almarai Trading'}
                        </option>
                        <option value="Dar Al Arkan Dev">
                            {isAr ? 'شركة دار الأركان للتطوير' : 'Dar Al Arkan Dev'}
                        </option>
                        <option value="Riyadh Tech Solutions">
                            {isAr ? 'مؤسسة الرياض للحلول التقنية' : 'Riyadh Tech Solutions'}
                        </option>
                        <option value="Elm Info Security">
                            {isAr ? 'شركة علم لأمن المعلومات' : 'Elm Info Security'}
                        </option>
                    </select>
                </div>

                {/* 5. Assigned Resource Filter */}
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1 text-start">
                        {t('ticketing.filters.assignedTo')}
                    </label>
                    <select
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C] focus:bg-white cursor-pointer"
                    >
                        <option value="all">{t('ticketing.filters.allResources')}</option>
                        <option value="Eng. Karim Wagdi">
                            {isAr ? 'م. كريم وجدي' : 'Eng. Karim Wagdi'}
                        </option>
                        <option value="Fatima Abdelfattah">
                            {isAr ? 'فاطمة عبدالفتاح' : 'Fatima Abdelfattah'}
                        </option>
                        <option value="Ahmed Al-Salem">
                            {isAr ? 'أحمد السالم' : 'Ahmed Al-Salem'}
                        </option>
                        <option value="Omar Al-Dossary">
                            {isAr ? 'عمر الدوسري' : 'Omar Al-Dossary'}
                        </option>
                        <option value="unassigned">
                            {t('ticketing.labels.unassigned')}
                        </option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedTickets}
                count={filteredTickets.length}
                loading={false}
                searchPlaceholder={t('pages.tickets.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setPageIndex(newPageIndex)}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPageIndex(0);
                }}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                onAddNew={() => {
                    toast.info(t('ticketing.newTicketModalPrompt'));
                }}
                title="Tickets"
                addNewLabel={t('pages.tickets.addLabel')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />
        </div>
    );
};
