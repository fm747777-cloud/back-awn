import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    RotateCcw,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadTickets,
    saveCustomTicket,
    updateTicket,
    deleteTicket,
    prependTicketAuditLog,
    getActiveTicketTypeOptions,
    normalizeTicketStatus,
    TICKET_CUSTOMER_OPTIONS,
    TICKET_COMPANY_OPTIONS,
    TICKET_STATUS_OPTIONS,
    type TableTicket,
    type TicketLifecycleStatus,
} from './ticketingMockData';
import {
    TicketDrawer,
    type TicketDrawerMode,
    type TicketFormSubmitData,
} from './TicketDrawer';

function escapeCsvCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
}

// --- Actions Dropdown Component (View, Edit, Delete) ---
interface TicketActionsMenuProps {
    ticket: TableTicket;
    onView: (ticket: TableTicket) => void;
    onEdit: (ticket: TableTicket) => void;
    onDelete: (ticket: TableTicket) => void;
}

const TicketActionsMenu: React.FC<TicketActionsMenuProps> = ({
    ticket,
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

    const handleAction = (actionName: 'view' | 'edit' | 'delete') => {
        setIsOpen(false);
        if (actionName === 'view') {
            onView(ticket);
        } else if (actionName === 'edit') {
            onEdit(ticket);
        } else if (actionName === 'delete') {
            onDelete(ticket);
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

    // Persisted Tickets State
    const [tickets, setTickets] = useState<TableTicket[]>(() => loadTickets());

    // Table Controls State
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Drawer & Delete Modal State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<TicketDrawerMode>('create');
    const [activeTicket, setActiveTicket] = useState<TableTicket | null>(null);
    const [ticketToDelete, setTicketToDelete] = useState<TableTicket | null>(null);

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedPriority, setSelectedPriority] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedResource, setSelectedResource] = useState<string>('all');

    // Sync tickets across tabs
    useEffect(() => {
        const handleStorage = () => {
            setTickets(loadTickets());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const ticketTypeOptions = getActiveTicketTypeOptions();

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

    const getStatusLabel = useCallback(
        (statusVal: string) => {
            const normalized = normalizeTicketStatus(statusVal);
            switch (normalized) {
                case 'NEW':
                    return t('ticketing.statuses.new');
                case 'OPEN':
                    return t('ticketing.statuses.open');
                case 'IN PROGRESS':
                    return t('ticketing.statuses.inProgress');
                case 'SOLVED':
                    return t('ticketing.statuses.solved');
                case 'CLOSED':
                    return t('ticketing.statuses.closed');
                default:
                    return statusVal;
            }
        },
        [t]
    );

    // Filter and search computation
    const filteredTickets = useMemo(() => {
        return tickets.filter((ticket) => {
            const normalizedStatus = normalizeTicketStatus(ticket);

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
                const matchType =
                    ticket.ticketType.toLowerCase().includes(q) ||
                    ticket.ticketTypeEn.toLowerCase().includes(q);

                if (
                    !matchId &&
                    !matchSubject &&
                    !matchCustomer &&
                    !matchCompany &&
                    !matchType
                ) {
                    return false;
                }
            }

            // Status filter
            if (selectedStatus !== 'all' && normalizedStatus !== selectedStatus) {
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
        tickets,
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

    // Handlers for Create / View / Edit / Delete
    const handleOpenCreate = useCallback(() => {
        setActiveTicket(null);
        setDrawerMode('create');
        setDrawerOpen(true);
    }, []);

    const handleOpenView = useCallback((ticket: TableTicket) => {
        setActiveTicket(ticket);
        setDrawerMode('view');
        setDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((ticket: TableTicket) => {
        setActiveTicket(ticket);
        setDrawerMode('edit');
        setDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((ticket: TableTicket) => {
        setTicketToDelete(ticket);
    }, []);

    const handleDrawerSubmit = useCallback(
        (data: TicketFormSubmitData, existingTicket?: TableTicket | null) => {
            const customerOpt = TICKET_CUSTOMER_OPTIONS.find(
                (o) => o.value === data.customerValue
            );
            const companyOpt = TICKET_COMPANY_OPTIONS.find(
                (o) => o.value === data.companyValue
            );
            const allTypeOpts = getActiveTicketTypeOptions();
            const typeOpt = allTypeOpts.find((o) => o.value === data.ticketTypeValue);

            const customerEn = customerOpt?.en || data.customerValue;
            const customerAr = customerOpt?.ar || data.customerValue;
            const companyEn = companyOpt?.en || data.companyValue;
            const companyAr = companyOpt?.ar || data.companyValue;
            const ticketTypeEn =
                typeOpt?.en || data.ticketTypeValue || 'General Inquiry';
            const ticketTypeAr =
                typeOpt?.ar || data.ticketTypeValue || 'استفسار عام';

            const todayStr = new Date().toISOString().slice(0, 10);

            if (drawerMode === 'edit' && existingTicket) {
                const prevStatus = normalizeTicketStatus(existingTicket);
                const nextStatus: TicketLifecycleStatus =
                    data.status || prevStatus;

                const isNowClosedOrSolved =
                    nextStatus === 'CLOSED' || nextStatus === 'SOLVED';

                const updatedRecord: TableTicket = {
                    ...existingTicket,
                    customer: customerAr,
                    customerEn,
                    company: companyAr,
                    companyEn,
                    ticketType: ticketTypeAr,
                    ticketTypeEn,
                    priority: data.priority,
                    status: nextStatus,
                    closedDate: isNowClosedOrSolved
                        ? existingTicket.closedDate || todayStr
                        : null,
                    subject: isAr ? data.subject : existingTicket.subject || data.subject,
                    subjectEn: !isAr
                        ? data.subject
                        : existingTicket.subjectEn || data.subject,
                    message: isAr ? data.message : existingTicket.message || data.message,
                    messageEn: !isAr
                        ? data.message
                        : existingTicket.messageEn || data.message,
                    attachment: data.attachment,
                };

                const nextTickets = updateTicket(updatedRecord);
                setTickets(nextTickets);

                const statusNoteEn =
                    prevStatus !== nextStatus
                        ? `Status updated from ${prevStatus} to ${nextStatus}.`
                        : 'Ticket details updated.';
                const statusNoteAr =
                    prevStatus !== nextStatus
                        ? `تم تحديث حالة التذكرة من ${prevStatus} إلى ${nextStatus}.`
                        : 'تم تحديث بيانات التذكرة.';

                prependTicketAuditLog({
                    action: 'UPDATED',
                    resource: 'Ticket',
                    resourceAr: 'تذكرة',
                    resourceData: `${updatedRecord.ticketId} — ${updatedRecord.subjectEn}`,
                    resourceDataAr: `${updatedRecord.ticketId} — ${updatedRecord.subject}`,
                    details: statusNoteEn,
                    detailsAr: statusNoteAr,
                });

                toast.success(
                    t('ticketing.tickets.updateSuccess', {
                        id: updatedRecord.ticketId,
                    })
                );
            } else {
                // Create new ticket
                const maxNum = tickets.reduce((acc, item) => {
                    const match = item.ticketId.match(/(\d+)$/);
                    const num = match ? parseInt(match[1], 10) : 0;
                    return num > acc ? num : acc;
                }, 25);
                const nextNum = maxNum + 1;
                const nextTicketId = `TCK-2026-${String(nextNum).padStart(3, '0')}`;

                const newRecord: TableTicket = {
                    id: `tb-${Date.now()}`,
                    ticketId: nextTicketId,
                    subject: data.subject,
                    subjectEn: data.subject,
                    ticketType: ticketTypeAr,
                    ticketTypeEn,
                    customer: customerAr,
                    customerEn,
                    company: companyAr,
                    companyEn,
                    assignedTo: null,
                    assignedToEn: null,
                    assignedBy: 'مدير النظام',
                    assignedByEn: 'System Admin',
                    replyStatus: 'pending_agent',
                    status: 'NEW',
                    closedDate: null,
                    priority: data.priority,
                    createdDate: todayStr,
                    message: data.message,
                    messageEn: data.message,
                    attachment: data.attachment,
                };

                const nextTickets = saveCustomTicket(newRecord);
                setTickets(nextTickets);
                setPageIndex(0);

                prependTicketAuditLog({
                    action: 'CREATED',
                    resource: 'Ticket',
                    resourceAr: 'تذكرة',
                    resourceData: `${newRecord.ticketId} — ${newRecord.subjectEn}`,
                    resourceDataAr: `${newRecord.ticketId} — ${newRecord.subject}`,
                    details: `Created ticket for ${companyEn} (${data.priority} Priority).`,
                    detailsAr: `تم إنشاء تذكرة لصالح ${companyAr} (أولوية ${data.priority}).`,
                });

                toast.success(
                    t('ticketing.tickets.createSuccess', {
                        id: newRecord.ticketId,
                    })
                );
            }

            setDrawerOpen(false);
            setActiveTicket(null);
        },
        [drawerMode, isAr, t, tickets]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!ticketToDelete) return;
        const deleted = ticketToDelete;
        const nextTickets = deleteTicket(deleted.id);
        setTickets(nextTickets);

        const newTotalCount = Math.max(0, filteredTickets.length - 1);
        const maxPageIndex = Math.max(0, Math.ceil(newTotalCount / pageSize) - 1);
        if (pageIndex > maxPageIndex) {
            setPageIndex(maxPageIndex);
        }

        prependTicketAuditLog({
            action: 'DELETED',
            resource: 'Ticket',
            resourceAr: 'تذكرة',
            resourceData: `${deleted.ticketId} — ${deleted.subjectEn || deleted.subject}`,
            resourceDataAr: `${deleted.ticketId} — ${deleted.subject || deleted.subjectEn}`,
            details: `Deleted ticket ${deleted.ticketId}.`,
            detailsAr: `تم حذف التذكرة ${deleted.ticketId}.`,
        });

        toast.success(
            t('ticketing.tickets.deleteSuccess', {
                id: deleted.ticketId,
            })
        );
        setTicketToDelete(null);
    }, [filteredTickets.length, pageIndex, pageSize, t, ticketToDelete]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('ticketing.columns.ticketId'),
            t('ticketing.columns.subject'),
            t('ticketing.columns.customer'),
            t('ticketing.columns.company'),
            t('ticketing.columns.ticketType'),
            t('ticketing.columns.priority'),
            t('ticketing.columns.status'),
            t('ticketing.columns.createdDate'),
            t('ticketing.columns.assignedBy'),
        ];

        const rows = filteredTickets.map((ticket) => {
            const subjectText = isAr ? ticket.subject : ticket.subjectEn;
            const customerText = isAr ? ticket.customer : ticket.customerEn;
            const companyText = isAr ? ticket.company : ticket.companyEn;
            const typeText = isAr ? ticket.ticketType : ticket.ticketTypeEn;
            const priorityText =
                ticket.priority === 'High'
                    ? t('ticketing.priorities.high')
                    : ticket.priority === 'Medium'
                      ? t('ticketing.priorities.medium')
                      : t('ticketing.priorities.low');
            const statusText = getStatusLabel(ticket.status);
            const createdByText = isAr ? ticket.assignedBy : ticket.assignedByEn;

            return [
                escapeCsvCell(ticket.ticketId),
                escapeCsvCell(subjectText),
                escapeCsvCell(customerText),
                escapeCsvCell(companyText),
                escapeCsvCell(typeText),
                escapeCsvCell(priorityText),
                escapeCsvCell(statusText),
                escapeCsvCell(ticket.createdDate),
                escapeCsvCell(createdByText),
            ].join(',');
        });

        const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `awn-tickets-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('ticketing.tickets.exportSuccess', {
                count: filteredTickets.length,
            })
        );
    }, [filteredTickets, getStatusLabel, isAr, t]);

    // --- Columns in Exact Required Order ---
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            // 1. Ticket ID
            {
                accessorKey: 'ticketId',
                header: t('ticketing.columns.ticketId'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => handleOpenView(row.original)}
                        className="font-semibold font-mono text-xs text-[#2D3F2C] hover:underline cursor-pointer"
                        dir="ltr"
                    >
                        {row.original.ticketId}
                    </button>
                ),
            },
            // 2. Subject
            {
                accessorKey: 'subject',
                header: t('ticketing.columns.subject'),
                cell: ({ row }: any) => {
                    const text = isAr ? row.original.subject : row.original.subjectEn;
                    return (
                        <button
                            type="button"
                            onClick={() => handleOpenView(row.original)}
                            className="font-medium text-[#0D0D0D] hover:text-[#2D3F2C] block max-w-[260px] truncate text-start cursor-pointer transition-colors"
                            title={text}
                        >
                            {text}
                        </button>
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
                cell: ({ row }: any) => {
                    const normalized = normalizeTicketStatus(row.original);
                    if (normalized === 'NEW') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                                {t('ticketing.statuses.new')}
                            </span>
                        );
                    }
                    if (normalized === 'OPEN') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#265938]/10 text-[#265938] border border-[#265938]/20">
                                {t('ticketing.statuses.open')}
                            </span>
                        );
                    }
                    if (normalized === 'IN PROGRESS') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                                {t('ticketing.statuses.inProgress')}
                            </span>
                        );
                    }
                    if (normalized === 'SOLVED') {
                        return (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#6A7358]/15 text-[#4E563F] border border-[#6A7358]/30">
                                {t('ticketing.statuses.solved')}
                            </span>
                        );
                    }
                    return (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#6E6862] border border-[#E5E0D8]">
                            {t('ticketing.statuses.closed')}
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
                cell: ({ row }: any) => (
                    <TicketActionsMenu
                        ticket={row.original}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [t, isAr, handleOpenView, handleOpenEdit, handleOpenDelete]
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
                        {TICKET_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                                {getStatusLabel(st)}
                            </option>
                        ))}
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
                        {ticketTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {isAr ? opt.ar : opt.en}
                            </option>
                        ))}
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
                        {TICKET_COMPANY_OPTIONS.map((comp) => (
                            <option key={comp.value} value={comp.value}>
                                {isAr ? comp.ar : comp.en}
                            </option>
                        ))}
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
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
                title={t('pages.tickets.title')}
                addNewLabel={t('pages.tickets.addLabel')}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Create / Edit / View Ticket Drawer */}
            <TicketDrawer
                isOpen={drawerOpen}
                mode={drawerMode}
                ticket={activeTicket}
                onClose={() => {
                    setDrawerOpen(false);
                    setActiveTicket(null);
                }}
                onSubmit={handleDrawerSubmit}
            />

            {/* Delete Confirmation Modal */}
            {ticketToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-xl max-w-md w-full p-6 text-start space-y-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('ticketing.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] leading-relaxed">
                                    {t('ticketing.deleteModal.message', {
                                        id: ticketToDelete.ticketId,
                                        subject: isAr
                                            ? ticketToDelete.subject
                                            : ticketToDelete.subjectEn,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0ECE4]">
                            <button
                                type="button"
                                onClick={() => setTicketToDelete(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] bg-white border border-[#E5E0D8] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer"
                            >
                                {t('ticketing.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('ticketing.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
