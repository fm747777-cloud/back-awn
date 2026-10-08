import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    MessageSquareQuote,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadCannedReplies,
    saveCannedReplies,
    prependTicketAuditLog,
    formatNowTimestamp,
    type CannedReplyRecord,
} from './ticketingMockData';

type DrawerMode = 'create' | 'edit' | 'view';

interface CannedReplyActionsMenuProps {
    record: CannedReplyRecord;
    onView: (record: CannedReplyRecord) => void;
    onEdit: (record: CannedReplyRecord) => void;
    onDelete: (record: CannedReplyRecord) => void;
}

const CannedReplyActionsMenu: React.FC<CannedReplyActionsMenuProps> = ({
    record,
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
            if (e.key === 'Escape') setIsOpen(false);
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
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onView(record);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Eye size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('ticketing.actions.view')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(record);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('ticketing.actions.edit')}</span>
                    </button>
                    <div className="my-1 border-t border-[#F0ECE4]" />
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(record);
                        }}
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

interface ValidationErrors {
    title?: string;
    titleAr?: string;
    reply?: string;
    replyAr?: string;
}

export const CannedRepliesPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const [replies, setReplies] = useState<CannedReplyRecord[]>(() =>
        loadCannedReplies()
    );

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
    const [activeRecord, setActiveRecord] = useState<CannedReplyRecord | null>(null);

    // Form fields
    const [title, setTitle] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [reply, setReply] = useState('');
    const [replyAr, setReplyAr] = useState('');
    const [errors, setErrors] = useState<ValidationErrors>({});

    // Delete modal state
    const [recordToDelete, setRecordToDelete] = useState<CannedReplyRecord | null>(
        null
    );

    useEffect(() => {
        const handleStorage = () => {
            setReplies(loadCannedReplies());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const filteredReplies = useMemo(() => {
        if (!searchValue.trim()) return replies;
        const q = searchValue.toLowerCase();
        return replies.filter(
            (item) =>
                item.id.toLowerCase().includes(q) ||
                item.title.toLowerCase().includes(q) ||
                item.titleAr.toLowerCase().includes(q) ||
                item.reply.toLowerCase().includes(q) ||
                item.replyAr.toLowerCase().includes(q) ||
                item.createdBy.toLowerCase().includes(q) ||
                (item.createdByAr || '').toLowerCase().includes(q)
        );
    }, [replies, searchValue]);

    const paginatedReplies = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredReplies.slice(start, start + pageSize);
    }, [filteredReplies, pageIndex, pageSize]);

    const handleOpenCreate = useCallback(() => {
        setActiveRecord(null);
        setDrawerMode('create');
        setTitle('');
        setTitleAr('');
        setReply('');
        setReplyAr('');
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenView = useCallback((record: CannedReplyRecord) => {
        setActiveRecord(record);
        setDrawerMode('view');
        setTitle(record.title);
        setTitleAr(record.titleAr);
        setReply(record.reply);
        setReplyAr(record.replyAr);
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((record: CannedReplyRecord) => {
        setActiveRecord(record);
        setDrawerMode('edit');
        setTitle(record.title);
        setTitleAr(record.titleAr);
        setReply(record.reply);
        setReplyAr(record.replyAr);
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((record: CannedReplyRecord) => {
        setRecordToDelete(record);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (drawerMode === 'view') return;

        const nextErrors: ValidationErrors = {};
        if (!title.trim()) {
            nextErrors.title = t('ticketing.cannedReplies.validation.titleRequired');
        }
        if (!titleAr.trim()) {
            nextErrors.titleAr = t(
                'ticketing.cannedReplies.validation.titleArRequired'
            );
        }
        if (!reply.trim()) {
            nextErrors.reply = t('ticketing.cannedReplies.validation.replyRequired');
        }
        if (!replyAr.trim()) {
            nextErrors.replyAr = t(
                'ticketing.cannedReplies.validation.replyArRequired'
            );
        }
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (drawerMode === 'edit' && activeRecord) {
            const updatedRecord: CannedReplyRecord = {
                ...activeRecord,
                title: title.trim(),
                titleAr: titleAr.trim(),
                reply: reply.trim(),
                replyAr: replyAr.trim(),
            };
            const nextList = replies.map((item) =>
                item.id === activeRecord.id ? updatedRecord : item
            );
            const saved = saveCannedReplies(nextList);
            setReplies(saved);

            prependTicketAuditLog({
                action: 'UPDATED',
                resource: 'Canned Reply',
                resourceAr: 'رد جاهز',
                resourceData: `${updatedRecord.title} (${updatedRecord.titleAr})`,
                resourceDataAr: `${updatedRecord.titleAr} (${updatedRecord.title})`,
                details: `Updated canned reply "${updatedRecord.title}".`,
                detailsAr: `تم تحديث الرد الجاهز "${updatedRecord.titleAr}".`,
            });

            toast.success(t('ticketing.cannedReplies.updateSuccess'));
        } else {
            const maxNum = replies.reduce((acc, item) => {
                const m = item.id.match(/(\d+)$/);
                const n = m ? parseInt(m[1], 10) : 0;
                return n > acc ? n : acc;
            }, replies.length);
            const nextId = `cr-${String(maxNum + 1).padStart(2, '0')}`;

            const newRecord: CannedReplyRecord = {
                id: nextId,
                title: title.trim(),
                titleAr: titleAr.trim(),
                reply: reply.trim(),
                replyAr: replyAr.trim(),
                createdBy: 'System Admin',
                createdByAr: 'مدير النظام',
                createdAt: formatNowTimestamp(),
            };

            const nextList = [newRecord, ...replies];
            const saved = saveCannedReplies(nextList);
            setReplies(saved);
            setPageIndex(0);

            prependTicketAuditLog({
                action: 'CREATED',
                resource: 'Canned Reply',
                resourceAr: 'رد جاهز',
                resourceData: `${newRecord.title} (${newRecord.titleAr})`,
                resourceDataAr: `${newRecord.titleAr} (${newRecord.title})`,
                details: `Created new canned reply "${newRecord.title}".`,
                detailsAr: `تم إنشاء رد جاهز جديد "${newRecord.titleAr}".`,
            });

            toast.success(t('ticketing.cannedReplies.createSuccess'));
        }

        setDrawerOpen(false);
        setActiveRecord(null);
    };

    const handleConfirmDelete = () => {
        if (!recordToDelete) return;
        const deleted = recordToDelete;
        const nextList = replies.filter((item) => item.id !== deleted.id);
        const saved = saveCannedReplies(nextList);
        setReplies(saved);

        const newTotalCount = Math.max(0, filteredReplies.length - 1);
        const maxPageIndex = Math.max(0, Math.ceil(newTotalCount / pageSize) - 1);
        if (pageIndex > maxPageIndex) {
            setPageIndex(maxPageIndex);
        }

        prependTicketAuditLog({
            action: 'DELETED',
            resource: 'Canned Reply',
            resourceAr: 'رد جاهز',
            resourceData: `${deleted.title} (${deleted.titleAr})`,
            resourceDataAr: `${deleted.titleAr} (${deleted.title})`,
            details: `Deleted canned reply "${deleted.title}".`,
            detailsAr: `تم حذف الرد الجاهز "${deleted.titleAr}".`,
        });

        toast.success(t('ticketing.cannedReplies.deleteSuccess'));
        setRecordToDelete(null);
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'id',
                header: t('ticketing.cannedReplies.columns.id'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => handleOpenView(row.original)}
                        className="font-mono font-semibold text-xs text-[#2D3F2C] hover:underline cursor-pointer uppercase"
                        dir="ltr"
                    >
                        {row.original.id}
                    </button>
                ),
            },
            {
                accessorKey: 'title',
                header: t('ticketing.cannedReplies.columns.title'),
                cell: ({ row }: any) => {
                    const primary = isAr ? row.original.titleAr : row.original.title;
                    const secondary = isAr ? row.original.title : row.original.titleAr;
                    return (
                        <button
                            type="button"
                            onClick={() => handleOpenView(row.original)}
                            className="text-start group cursor-pointer"
                        >
                            <span className="inline-flex items-center gap-2 font-semibold text-[#0D0D0D] group-hover:text-[#2D3F2C] transition-colors">
                                <MessageSquareQuote
                                    size={13}
                                    className="text-[#857E74] shrink-0"
                                />
                                <span>{primary}</span>
                            </span>
                            {secondary && secondary !== primary && (
                                <span className="block text-[11px] text-[#857E74] mt-0.5 ps-5">
                                    {secondary}
                                </span>
                            )}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'reply',
                header: t('ticketing.cannedReplies.columns.reply'),
                cell: ({ row }: any) => {
                    const text = isAr ? row.original.replyAr : row.original.reply;
                    return (
                        <span
                            className="text-xs text-[#595550] block max-w-[340px] truncate"
                            title={text}
                        >
                            {text}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createdBy',
                header: t('ticketing.cannedReplies.columns.createdBy'),
                cell: ({ row }: any) => {
                    const by = isAr
                        ? row.original.createdByAr || row.original.createdBy
                        : row.original.createdBy;
                    return <span className="text-xs text-[#595550]">{by}</span>;
                },
            },
            {
                accessorKey: 'createdAt',
                header: t('ticketing.cannedReplies.columns.createdAt'),
                cell: ({ getValue }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {getValue()}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('ticketing.columns.actions'),
                cell: ({ row }: any) => (
                    <CannedReplyActionsMenu
                        record={row.original}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [t, isAr, handleOpenView, handleOpenEdit, handleOpenDelete]
    );

    const isView = drawerMode === 'view';
    const isEdit = drawerMode === 'edit';

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedReplies}
                count={filteredReplies.length}
                loading={false}
                searchPlaceholder={t('ticketing.cannedReplies.searchPlaceholder')}
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
                title={t('ticketing.cannedRepliesTitle')}
                description={t('ticketing.cannedRepliesDesc')}
                addNewLabel={t('ticketing.cannedReplies.addLabel')}
            />

            {/* Right-Side Slide-Over Drawer */}
            <div
                className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                    drawerOpen
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!drawerOpen}
            >
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setDrawerOpen(false)}
                />

                <div
                    className={`fixed top-0 end-0 h-full w-full max-w-lg bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                        drawerOpen
                            ? 'translate-x-0'
                            : 'ltr:translate-x-full rtl:-translate-x-full'
                    }`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] bg-white shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-[#0D0D0D]">
                                {isView
                                    ? t('ticketing.cannedReplies.drawer.viewTitle')
                                    : isEdit
                                      ? t('ticketing.cannedReplies.drawer.editTitle')
                                      : t('ticketing.cannedReplies.drawer.createTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isView
                                    ? t('ticketing.cannedReplies.drawer.viewSubtitle')
                                    : isEdit
                                      ? t('ticketing.cannedReplies.drawer.editSubtitle')
                                      : t('ticketing.cannedReplies.drawer.createSubtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            aria-label={t('ticketing.form.close')}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <form
                        id="canned-reply-form"
                        onSubmit={handleSubmit}
                        noValidate
                        className="p-6 overflow-y-auto flex-1 space-y-5"
                    >
                        {isView && activeRecord && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[#6E6862] block">
                                        {t('ticketing.cannedReplies.columns.id')}
                                    </span>
                                    <span
                                        className="font-mono font-bold text-[#2D3F2C] uppercase"
                                        dir="ltr"
                                    >
                                        {activeRecord.id}
                                    </span>
                                </div>
                                <div className="text-end">
                                    <span className="text-[#6E6862] block">
                                        {t('ticketing.cannedReplies.columns.createdAt')}
                                    </span>
                                    <span
                                        className="font-mono font-semibold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {activeRecord.createdAt}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* English Title */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.cannedReplies.drawer.title')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <input
                                type="text"
                                readOnly={isView}
                                disabled={isView}
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (errors.title && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, title: undefined }));
                                    }
                                }}
                                placeholder={t('ticketing.cannedReplies.drawer.titlePlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.title
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.title && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.title}
                                </span>
                            )}
                        </div>

                        {/* Arabic Title */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.cannedReplies.drawer.titleAr')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <input
                                type="text"
                                readOnly={isView}
                                disabled={isView}
                                value={titleAr}
                                onChange={(e) => {
                                    setTitleAr(e.target.value);
                                    if (errors.titleAr && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, titleAr: undefined }));
                                    }
                                }}
                                placeholder={t(
                                    'ticketing.cannedReplies.drawer.titleArPlaceholder'
                                )}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.titleAr
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.titleAr && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.titleAr}
                                </span>
                            )}
                        </div>

                        {/* English Reply */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.cannedReplies.drawer.reply')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <textarea
                                rows={4}
                                readOnly={isView}
                                disabled={isView}
                                value={reply}
                                onChange={(e) => {
                                    setReply(e.target.value);
                                    if (errors.reply && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, reply: undefined }));
                                    }
                                }}
                                placeholder={t('ticketing.cannedReplies.drawer.replyPlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition resize-y ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.reply
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.reply && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.reply}
                                </span>
                            )}
                        </div>

                        {/* Arabic Reply */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.cannedReplies.drawer.replyAr')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <textarea
                                rows={4}
                                readOnly={isView}
                                disabled={isView}
                                value={replyAr}
                                onChange={(e) => {
                                    setReplyAr(e.target.value);
                                    if (errors.replyAr && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, replyAr: undefined }));
                                    }
                                }}
                                placeholder={t(
                                    'ticketing.cannedReplies.drawer.replyArPlaceholder'
                                )}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition resize-y ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.replyAr
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.replyAr && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.replyAr}
                                </span>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex justify-end gap-2.5 shrink-0">
                        {isView ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-[#595550] bg-white border border-[#E5E0D8] rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                                >
                                    {t('ticketing.form.close')}
                                </button>
                                {activeRecord && (
                                    <button
                                        type="button"
                                        onClick={() => setDrawerMode('edit')}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                                    >
                                        {t('ticketing.actions.edit')}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-[#595550] bg-white border border-[#E5E0D8] rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                                >
                                    {t('ticketing.form.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    form="canned-reply-form"
                                    className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                                >
                                    {isEdit
                                        ? t('ticketing.form.saveEdit')
                                        : t('ticketing.form.saveCreate')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {recordToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-150">
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-xl max-w-md w-full p-6 text-start space-y-4">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-[#0D0D0D]">
                                    {t('ticketing.cannedReplies.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] leading-relaxed">
                                    {t('ticketing.cannedReplies.deleteModal.message', {
                                        title: isAr
                                            ? recordToDelete.titleAr
                                            : recordToDelete.title,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F0ECE4]">
                            <button
                                type="button"
                                onClick={() => setRecordToDelete(null)}
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
