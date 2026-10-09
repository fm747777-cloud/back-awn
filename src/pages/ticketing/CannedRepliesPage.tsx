
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import { ticketApi } from '../../api/api';
import { CannedReply, CannedReplyForm } from './AddCannedReplyForm';

const QUERY_KEY = ['canned-replies'];

interface ApiResponse {
    data?: CannedReply[] | { data?: CannedReply[]; count?: number };
    count?: number;
    status?: boolean;
    message?: string;
}

interface MenuPosition {
    top: number;
    left: number;
}

const getApiRecords = (response: ApiResponse | CannedReply[] | undefined): CannedReply[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (response?.data && !Array.isArray(response.data) && Array.isArray(response.data.data)) return response.data.data;
    return [];
};

interface ActionsMenuProps {
    record: CannedReply;
    onView: (record: CannedReply) => void;
    onEdit: (record: CannedReply) => void;
    onDelete: (record: CannedReply) => void;
}

const CannedReplyActionsMenu = ({ record, onView, onEdit, onDelete }: ActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const closeMenu = useCallback(() => setIsOpen(false), []);

    const updatePosition = useCallback(() => {
        const button = buttonRef.current;
        if (!button) return;
        const rect = button.getBoundingClientRect();
        const menuWidth = 176;
        const menuHeight = 142;
        const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
        const top = rect.bottom + menuHeight > window.innerHeight - 8 ? Math.max(8, rect.top - menuHeight - 6) : rect.bottom + 6;
        setPosition({ top, left });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();
        const handleOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            closeMenu();
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMenu();
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleKey);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, closeMenu, updatePosition]);

    const menuItemClass = 'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-[13px] text-[#45413C] transition-colors hover:bg-[#F6F4EF]';

    return (
        <>
            <button ref={buttonRef} type="button" aria-label="Open actions" aria-expanded={isOpen} onClick={(event) => { event.stopPropagation(); setIsOpen((previous) => !previous); }} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${isOpen ? 'border-[#D6CFC4] bg-[#F5F3EF] text-[#2D3F2C]' : 'border-transparent text-[#777168] hover:border-[#E5E0D8] hover:bg-[#F8F6F2] hover:text-[#0D0D0D]'}`}>
                <MoreHorizontal size={19} />
            </button>
            {isOpen && createPortal(
                <div ref={menuRef} style={{ position: 'fixed', top: position.top, left: position.left, width: 176, zIndex: 9999 }} className="rounded-xl border border-[#E7E2D9] bg-white p-1.5 shadow-[0_12px_35px_rgba(20,20,15,0.14)]">
                    <button type="button" className={menuItemClass} onClick={() => { closeMenu(); onView(record); }}><Eye size={15} className="text-[#777168]" /><span>View details</span></button>
                    <button type="button" className={menuItemClass} onClick={() => { closeMenu(); onEdit(record); }}><Pencil size={15} className="text-[#777168]" /><span>Edit reply</span></button>
                    <div className="my-1 border-t border-[#F0ECE5]" />
                    <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-[13px] text-[#B42318] transition-colors hover:bg-red-50" onClick={() => { closeMenu(); onDelete(record); }}><Trash2 size={15} /><span>Delete reply</span></button>
                </div>,
                document.body,
            )}
        </>
    );
};

export const CannedRepliesPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [activeReply, setActiveReply] = useState<CannedReply | null>(null);
    const [replyToDelete, setReplyToDelete] = useState<CannedReply | null>(null);

    const { data: repliesResponse, isLoading, isError, refetch } = useQuery({
        queryKey: [...QUERY_KEY, pageIndex + 1, pageSize, searchValue],
        queryFn: () => ticketApi.getReplies({ page: pageIndex + 1, limit: pageSize, search: searchValue.trim() || undefined }),
    });

    const replies = useMemo(() => getApiRecords(repliesResponse as ApiResponse | CannedReply[] | undefined), [repliesResponse]);
    const responseObject = repliesResponse as ApiResponse | undefined;
    const nestedData = responseObject?.data && !Array.isArray(responseObject.data) ? responseObject.data : undefined;
    const totalCount = nestedData?.count ?? responseObject?.count ?? replies.length;

    const createMutation = useMutation({
        mutationFn: (data: { subject: string; message: string }) => ticketApi.createReply(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Canned reply created successfully.');
            setIsFormOpen(false);
            setActiveReply(null);
        },
        onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to create canned reply.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { subject: string; message: string } }) => ticketApi.updateReply(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Canned reply updated successfully.');
            setIsFormOpen(false);
            setActiveReply(null);
        },
        onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update canned reply.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => ticketApi.deleteReply(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Canned reply deleted successfully.');
            setReplyToDelete(null);
        },
        onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to delete canned reply.'),
    });

    const generateCode = (index: number) => `CR-${String(index + 1 + pageIndex * pageSize).padStart(3, '0')}`;

    const openForm = (mode: 'create' | 'edit' | 'view', reply: CannedReply | null = null) => {
        setFormMode(mode);
        setActiveReply(reply);
        setIsFormOpen(true);
    };

    const handleFormSubmit = (data: { subject: string; message: string }) => {
        if (formMode === 'edit' && activeReply) {
            updateMutation.mutate({ id: activeReply.id, data });
            return;
        }
        createMutation.mutate(data);
    };

    const handleDelete = () => {
        if (!replyToDelete) return;
        deleteMutation.mutate(replyToDelete.id);
    };

    const columns = useMemo<ColumnDef<any, unknown>[]>(() => [
        {
            id: 'code',
            header: 'Canned Reply Code',
            cell: ({ row }: { row: any }) => {
                const index = replies.findIndex((item) => item.id === row.original.id);
                return <span className="inline-flex rounded-md border border-[#2D3F2C]/15 bg-[#2D3F2C]/[0.07] px-2.5 py-1 font-mono text-xs font-bold text-[#2D3F2C]" dir="ltr">{generateCode(Math.max(index, 0))}</span>;
            },
        },
        {
            accessorKey: 'subject',
            header: 'Subject',
            cell: ({ row }: { row: any }) => <button type="button" onClick={() => openForm('view', row.original)} className="block max-w-[260px] truncate text-start text-sm font-semibold text-[#20231F] transition hover:text-[#2D3F2C] hover:underline" title={row.original.subject}>{row.original.subject}</button>,
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }: { row: any }) => <span className="block max-w-[360px] truncate text-xs leading-5 text-[#625E57]" title={row.original.message}>{row.original.message}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ row }: { row: any }) => <span className="whitespace-nowrap font-mono text-xs text-[#777168]" dir="ltr">{row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}</span>,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: any }) => <CannedReplyActionsMenu record={row.original} onView={(record) => openForm('view', record)} onEdit={(record) => openForm('edit', record)} onDelete={setReplyToDelete} />,
        },
    ], [replies, pageIndex, pageSize]);

    return (
        <div className="space-y-4">
            {isError && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>Failed to load canned replies.</span><button type="button" onClick={() => refetch()} className="font-semibold underline">Retry</button></div>}
            <DataTable columns={columns} data={replies} count={totalCount} loading={isLoading} searchPlaceholder="Search canned replies..." pageIndex={pageIndex} pageSize={pageSize} onPageChange={setPageIndex} onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }} searchValue={searchValue} onSearchChange={(value) => { setSearchValue(value); setPageIndex(0); }} onAddNew={() => openForm('create')} title={t('ticketing.cannedRepliesTitle', { defaultValue: 'Canned Replies' })} description={t('ticketing.cannedRepliesDesc', { defaultValue: 'Manage reusable ticket responses.' })} addNewLabel={t('ticketing.cannedReplies.addLabel', { defaultValue: 'Add Canned Reply' })} />
            <CannedReplyForm isOpen={isFormOpen} mode={formMode} reply={activeReply} isLoading={createMutation.isPending || updateMutation.isPending} onClose={() => { setIsFormOpen(false); }} onSubmit={handleFormSubmit} />
            {replyToDelete && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"><div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-2xl"><div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><Trash2 size={19} /></div><h3 className="text-base font-bold text-[#0D0D0D]">Delete canned reply?</h3><p className="mt-2 text-sm leading-6 text-[#6E6862]">Are you sure you want to delete <strong className="text-[#0D0D0D]">{replyToDelete.subject}</strong>? This action cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button type="button" disabled={deleteMutation.isPending} onClick={() => setReplyToDelete(null)} className="rounded-lg border border-[#D6CFC4] px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#F8F6F2]">Cancel</button><button type="button" disabled={deleteMutation.isPending} onClick={handleDelete} className="rounded-lg bg-[#B42318] px-4 py-2 text-xs font-semibold text-white hover:bg-[#921D14] disabled:opacity-50">{deleteMutation.isPending ? 'Deleting...' : 'Delete Reply'}</button></div></div></div>}
        </div>
    );
};

export default CannedRepliesPage;