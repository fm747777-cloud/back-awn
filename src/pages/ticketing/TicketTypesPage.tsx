import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable } from '../../components/DataTable';
import { AddTicketTypeForm, type CreateTicketTypeDto } from './AddTicketTypeForm';
import { ticketApi } from '../../api/api';

interface TicketTypeRecord {
    id: string;
    name: string;
    description?: string | null;
    createdBy?: string | null;
    createdAt?: string | null;
    ticketsCount?: number;
}

interface TicketTypesResponse {
    count: number;
    data: TicketTypeRecord[];
    message?: string;
    status?: boolean;
    statusCode?: number;
}

const TICKET_TYPES_QUERY_KEY = ['ticket-types'];

const generateTypeCode = (serialNumber: number): string => {
    return `TYP-${String(serialNumber).padStart(3, '0')}`;
};

export const TicketTypesPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTicketType, setSelectedTicketType] = useState<TicketTypeRecord | null>(null);
    const [ticketTypeToDelete, setTicketTypeToDelete] = useState<TicketTypeRecord | null>(null);

    const {
        data: response,
        isLoading,
        isError,
    } = useQuery<TicketTypesResponse>({
        queryKey: [...TICKET_TYPES_QUERY_KEY, pageIndex, pageSize, searchValue],
        queryFn: () =>
            ticketApi.getTicketTypes({
                page: pageIndex + 1,
                limit: pageSize,
                ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
            }),
    });

    const ticketTypes = response?.data ?? [];
    const totalCount = response?.count ?? 0;

    const createTicketTypeMutation = useMutation({
        mutationFn: (data: CreateTicketTypeDto) => ticketApi.createTicketType(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: TICKET_TYPES_QUERY_KEY,
            });

            toast.success(t('ticketing.ticketTypes.createSuccess'));
            setIsFormOpen(false);
            setSearchValue('');
            setPageIndex(0);
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t('ticketing.ticketTypes.createError', {
                    defaultValue: 'Failed to create ticket type.',
                });

            toast.error(Array.isArray(message) ? message.join(', ') : message);
        },
    });

    const deleteTicketTypeMutation = useMutation({
        mutationFn: (id: string) => ticketApi.deleteTicketType(id),
        onSuccess: async () => {
            toast.success(
                t('ticketing.ticketTypes.deleteSuccess', {
                    defaultValue: 'Ticket type deleted successfully.',
                }),
            );

            setTicketTypeToDelete(null);

            // If the last row on a page was deleted, go back one page.
            const remainingCount = Math.max(0, totalCount - 1);
            const lastPageIndex = Math.max(0, Math.ceil(remainingCount / pageSize) - 1);
            const nextPageIndex = Math.min(pageIndex, lastPageIndex);

            if (nextPageIndex !== pageIndex) {
                setPageIndex(nextPageIndex);
            }

            await queryClient.invalidateQueries({
                queryKey: TICKET_TYPES_QUERY_KEY,
            });
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.message ||
                t('ticketing.ticketTypes.deleteError', {
                    defaultValue: 'Failed to delete ticket type.',
                });

            toast.error(Array.isArray(message) ? message.join(', ') : message);
        },
    });

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'Type Code',
                cell: ({ row }) => {
                    const serialNumber = pageIndex * pageSize + row.index + 1;
                    const typeCode = generateTypeCode(serialNumber);

                    return (
                        <span
                            className="inline-flex items-center rounded-md border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#2D3F2C]"
                            dir="ltr"
                        >
                            {typeCode}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'name',
                header: t('ticketing.ticketTypes.columns.name'),
                cell: ({ row }) => (
                    <span
                        className="block max-w-[220px] truncate text-sm font-medium text-[#0D0D0D]"
                        title={row.original.name}
                    >
                        {row.original.name || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'description',
                header: t('ticketing.ticketTypes.columns.description'),
                cell: ({ row }) => (
                    <span
                        className="block max-w-[300px] truncate text-xs text-[#595550]"
                        title={row.original.description ?? ''}
                    >
                        {row.original.description || '—'}
                    </span>
                ),
            },
            {
                id: 'ticketsCount',
                header: t('ticketing.ticketTypes.columns.ticketsCount'),
                cell: ({ row }) => (
                    <span
                        className="inline-flex items-center rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#2D3F2C]"
                        dir="ltr"
                    >
                        {row.original.ticketsCount ?? 0}
                    </span>
                ),
            },
            {
                accessorKey: 'createdBy',
                header: t('ticketing.ticketTypes.columns.createdBy'),
                cell: ({ row }) => (
                    <span className="text-xs text-[#595550]">
                        {row.original.createdBy || '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: t('ticketing.ticketTypes.columns.createdAt'),
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {row.original.createdAt || '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('ticketing.columns.actions'),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedTicketType(row.original)}
                            title={t('ticketing.actions.view', { defaultValue: 'View' })}
                            aria-label={t('ticketing.actions.view', { defaultValue: 'View' })}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] text-[#595550] transition-colors hover:bg-[#F8F6F2] hover:text-[#2D3F2C]"
                        >
                            <Eye size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setTicketTypeToDelete(row.original)}
                            title={t('ticketing.actions.delete', { defaultValue: 'Delete' })}
                            aria-label={t('ticketing.actions.delete', { defaultValue: 'Delete' })}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ),
            },
        ],
        [t, pageIndex, pageSize],
    );

    const handleCreateTicketType = (data: CreateTicketTypeDto) => {
        // Keep the form closed until the create mutation succeeds.
        createTicketTypeMutation.mutate(data, {
            onSuccess: async () => {
                setIsFormOpen(false);
                setSearchValue('');
                setPageIndex(0);

                await queryClient.invalidateQueries({
                    queryKey: TICKET_TYPES_QUERY_KEY,
                });
            },
        });
    };

    return (
        <div className="space-y-4">
            {isError && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {t('ticketing.ticketTypes.loadError', {
                        defaultValue: 'Failed to load ticket types. Please try again.',
                    })}
                </div>
            )}

            <DataTable
                columns={columns}
                data={ticketTypes}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t('ticketing.ticketTypes.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setPageIndex(newPageIndex)}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPageIndex(0);
                }}
                searchValue={searchValue}
                onSearchChange={(value) => {
                    setSearchValue(value);
                    setPageIndex(0);
                }}
                onAddNew={() => setIsFormOpen(true)}
                title={t('ticketing.ticketTypesTitle')}
                description={t('ticketing.ticketTypesDesc')}
                addNewLabel={t('ticketing.ticketTypes.addLabel')}
            />

            <AddTicketTypeForm
                isOpen={isFormOpen}
                isLoading={createTicketTypeMutation.isPending}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleCreateTicketType}
            />

            {/* View Ticket Type Modal */}
            {selectedTicketType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedTicketType(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ticket-type-view-title"
                        className="w-full max-w-lg rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 id="ticket-type-view-title" className="text-lg font-semibold text-[#0D0D0D]">
                                {t('ticketing.actions.view', { defaultValue: 'View Ticket Type' })}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setSelectedTicketType(null)}
                                aria-label={t('common.close', { defaultValue: 'Close' })}
                                className="rounded-lg p-2 text-[#6E6862] hover:bg-[#F8F6F2]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">Type Code</p>
                                <p className="font-mono text-sm font-semibold text-[#2D3F2C]" dir="ltr">
                                    {generateTypeCode(
                                        pageIndex * pageSize +
                                        ticketTypes.findIndex((item) => item.id === selectedTicketType.id) +
                                        1,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">
                                    {t('ticketing.ticketTypes.columns.id', { defaultValue: 'Type ID' })}
                                </p>
                                <p className="break-all text-sm text-[#0D0D0D]">{selectedTicketType.id}</p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">
                                    {t('ticketing.ticketTypes.columns.name', { defaultValue: 'Name' })}
                                </p>
                                <p className="text-sm text-[#0D0D0D]">{selectedTicketType.name || '—'}</p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">
                                    {t('ticketing.ticketTypes.columns.description', { defaultValue: 'Description' })}
                                </p>
                                <p className="whitespace-pre-wrap text-sm text-[#0D0D0D]">
                                    {selectedTicketType.description || '—'}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">
                                    {t('ticketing.ticketTypes.columns.createdBy', { defaultValue: 'Created By' })}
                                </p>
                                <p className="text-sm text-[#0D0D0D]">{selectedTicketType.createdBy || '—'}</p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[#857E74]">
                                    {t('ticketing.ticketTypes.columns.createdAt', { defaultValue: 'Created At' })}
                                </p>
                                <p className="font-mono text-sm text-[#0D0D0D]" dir="ltr">
                                    {selectedTicketType.createdAt || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedTicketType(null)}
                                className="rounded-lg bg-[#2D3F2C] px-4 py-2 text-sm font-medium text-white hover:bg-[#243323]"
                            >
                                {t('common.close', { defaultValue: 'Close' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {ticketTypeToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => {
                        if (!deleteTicketTypeMutation.isPending) {
                            setTicketTypeToDelete(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ticket-type-delete-title"
                        className="w-full max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="ticket-type-delete-title" className="text-lg font-semibold text-[#0D0D0D]">
                            {t('ticketing.actions.delete', { defaultValue: 'Delete Ticket Type' })}
                        </h2>

                        <p className="mt-3 text-sm text-[#595550]">
                            {t('ticketing.ticketTypes.confirmDelete', {
                                defaultValue: 'Are you sure you want to delete this ticket type?',
                            })}
                        </p>

                        <p className="mt-2 break-words text-sm font-semibold text-[#0D0D0D]">
                            {ticketTypeToDelete.name}
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleteTicketTypeMutation.isPending}
                                onClick={() => setTicketTypeToDelete(null)}
                                className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm text-[#595550] hover:bg-[#F8F6F2] disabled:opacity-50"
                            >
                                {t('common.cancel', { defaultValue: 'Cancel' })}
                            </button>

                            <button
                                type="button"
                                disabled={deleteTicketTypeMutation.isPending}
                                onClick={() => deleteTicketTypeMutation.mutate(ticketTypeToDelete.id)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteTicketTypeMutation.isPending
                                    ? t('common.deleting', { defaultValue: 'Deleting...' })
                                    : t('ticketing.actions.delete', { defaultValue: 'Delete' })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketTypesPage;