import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadTicketTypes,
    saveTicketTypes,
    loadTickets,
    prependTicketAuditLog,
    formatNowTimestamp,
    type TicketTypeRecord,
} from './ticketingMockData';

type DrawerMode = 'create' | 'edit' | 'view';

interface TicketTypeActionsMenuProps {
    record: TicketTypeRecord;
    onView: (record: TicketTypeRecord) => void;
    onEdit: (record: TicketTypeRecord) => void;
    onDelete: (record: TicketTypeRecord) => void;
}

const TicketTypeActionsMenu: React.FC<TicketTypeActionsMenuProps> = ({
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

export const TicketTypesPage = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const [ticketTypes, setTicketTypes] = useState<TicketTypeRecord[]>(() =>
        loadTicketTypes()
    );
    const [tickets, setTickets] = useState(() => loadTickets());

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('create');
    const [activeRecord, setActiveRecord] = useState<TicketTypeRecord | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [errors, setErrors] = useState<{ name?: string; nameAr?: string }>({});

    // Delete modal state
    const [recordToDelete, setRecordToDelete] = useState<TicketTypeRecord | null>(
        null
    );

    useEffect(() => {
        const handleStorage = () => {
            setTicketTypes(loadTicketTypes());
            setTickets(loadTickets());
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Dynamically calculate tickets count per Ticket Type
    const dynamicCountsMap = useMemo(() => {
        const counts = new Map<string, number>();
        for (const typeItem of ticketTypes) {
            const count = tickets.filter((tck) => {
                const tEn = (tck.ticketTypeEn || '').trim().toLowerCase();
                const tAr = (tck.ticketType || '').trim().toLowerCase();
                const matchEn = typeItem.name.trim().toLowerCase();
                const matchAr = typeItem.nameAr.trim().toLowerCase();
                return (
                    tEn === matchEn ||
                    tAr === matchAr ||
                    tEn === matchAr ||
                    tAr === matchEn
                );
            }).length;
            counts.set(typeItem.id, count);
        }
        return counts;
    }, [ticketTypes, tickets]);

    const filteredTypes = useMemo(() => {
        if (!searchValue.trim()) return ticketTypes;
        const q = searchValue.toLowerCase();
        return ticketTypes.filter(
            (item) =>
                item.id.toLowerCase().includes(q) ||
                item.name.toLowerCase().includes(q) ||
                item.nameAr.toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                (item.descriptionAr || '').toLowerCase().includes(q) ||
                item.createdBy.toLowerCase().includes(q) ||
                (item.createdByAr || '').toLowerCase().includes(q)
        );
    }, [ticketTypes, searchValue]);

    const paginatedTypes = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTypes.slice(start, start + pageSize);
    }, [filteredTypes, pageIndex, pageSize]);

    const handleOpenCreate = useCallback(() => {
        setActiveRecord(null);
        setDrawerMode('create');
        setName('');
        setNameAr('');
        setDescription('');
        setDescriptionAr('');
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenView = useCallback((record: TicketTypeRecord) => {
        setActiveRecord(record);
        setDrawerMode('view');
        setName(record.name);
        setNameAr(record.nameAr);
        setDescription(record.description || '');
        setDescriptionAr(record.descriptionAr || '');
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((record: TicketTypeRecord) => {
        setActiveRecord(record);
        setDrawerMode('edit');
        setName(record.name);
        setNameAr(record.nameAr);
        setDescription(record.description || '');
        setDescriptionAr(record.descriptionAr || '');
        setErrors({});
        setDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((record: TicketTypeRecord) => {
        setRecordToDelete(record);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (drawerMode === 'view') return;

        const nextErrors: { name?: string; nameAr?: string } = {};
        if (!name.trim()) {
            nextErrors.name = t('ticketing.ticketTypes.validation.nameRequired');
        }
        if (!nameAr.trim()) {
            nextErrors.nameAr = t('ticketing.ticketTypes.validation.nameArRequired');
        }
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (drawerMode === 'edit' && activeRecord) {
            const updatedRecord: TicketTypeRecord = {
                ...activeRecord,
                name: name.trim(),
                nameAr: nameAr.trim(),
                description: description.trim(),
                descriptionAr: descriptionAr.trim(),
            };
            const nextList = ticketTypes.map((item) =>
                item.id === activeRecord.id ? updatedRecord : item
            );
            const saved = saveTicketTypes(nextList);
            setTicketTypes(saved);

            prependTicketAuditLog({
                action: 'UPDATED',
                resource: 'Ticket Type',
                resourceAr: 'نوع تذكرة',
                resourceData: `${updatedRecord.name} (${updatedRecord.nameAr})`,
                resourceDataAr: `${updatedRecord.nameAr} (${updatedRecord.name})`,
                details: `Updated ticket type "${updatedRecord.name}".`,
                detailsAr: `تم تحديث نوع التذكرة "${updatedRecord.nameAr}".`,
            });

            toast.success(t('ticketing.ticketTypes.updateSuccess'));
        } else {
            const maxNum = ticketTypes.reduce((acc, item) => {
                const m = item.id.match(/(\d+)$/);
                const n = m ? parseInt(m[1], 10) : 0;
                return n > acc ? n : acc;
            }, ticketTypes.length);
            const nextId = `tt-${String(maxNum + 1).padStart(2, '0')}`;

            const newRecord: TicketTypeRecord = {
                id: nextId,
                name: name.trim(),
                nameAr: nameAr.trim(),
                description: description.trim(),
                descriptionAr: descriptionAr.trim(),
                ticketsCount: 0,
                status: 'active',
                createdBy: 'System Admin',
                createdByAr: 'مدير النظام',
                createdAt: formatNowTimestamp(),
            };

            const nextList = [newRecord, ...ticketTypes];
            const saved = saveTicketTypes(nextList);
            setTicketTypes(saved);
            setPageIndex(0);

            prependTicketAuditLog({
                action: 'CREATED',
                resource: 'Ticket Type',
                resourceAr: 'نوع تذكرة',
                resourceData: `${newRecord.name} (${newRecord.nameAr})`,
                resourceDataAr: `${newRecord.nameAr} (${newRecord.name})`,
                details: `Created new ticket type "${newRecord.name}".`,
                detailsAr: `تم إنشاء نوع تذكرة جديد "${newRecord.nameAr}".`,
            });

            toast.success(t('ticketing.ticketTypes.createSuccess'));
        }

        setDrawerOpen(false);
        setActiveRecord(null);
    };

    const handleConfirmDelete = () => {
        if (!recordToDelete) return;
        const deleted = recordToDelete;
        const nextList = ticketTypes.filter((item) => item.id !== deleted.id);
        const saved = saveTicketTypes(nextList);
        setTicketTypes(saved);

        const newTotalCount = Math.max(0, filteredTypes.length - 1);
        const maxPageIndex = Math.max(0, Math.ceil(newTotalCount / pageSize) - 1);
        if (pageIndex > maxPageIndex) {
            setPageIndex(maxPageIndex);
        }

        prependTicketAuditLog({
            action: 'DELETED',
            resource: 'Ticket Type',
            resourceAr: 'نوع تذكرة',
            resourceData: `${deleted.name} (${deleted.nameAr})`,
            resourceDataAr: `${deleted.nameAr} (${deleted.name})`,
            details: `Deleted ticket type "${deleted.name}".`,
            detailsAr: `تم حذف نوع التذكرة "${deleted.nameAr}".`,
        });

        toast.success(t('ticketing.ticketTypes.deleteSuccess'));
        setRecordToDelete(null);
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'id',
                header: t('ticketing.ticketTypes.columns.id'),
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
                accessorKey: 'name',
                header: t('ticketing.ticketTypes.columns.name'),
                cell: ({ row }: any) => {
                    const primary = isAr ? row.original.nameAr : row.original.name;
                    const secondary = isAr ? row.original.name : row.original.nameAr;
                    return (
                        <button
                            type="button"
                            onClick={() => handleOpenView(row.original)}
                            className="text-start group cursor-pointer"
                        >
                            <span className="inline-flex items-center gap-2 font-semibold text-[#0D0D0D] group-hover:text-[#2D3F2C] transition-colors">
                                <Tag size={13} className="text-[#857E74] shrink-0" />
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
                accessorKey: 'description',
                header: t('ticketing.ticketTypes.columns.description'),
                cell: ({ row }: any) => {
                    const desc = isAr
                        ? row.original.descriptionAr || row.original.description
                        : row.original.description || row.original.descriptionAr;
                    return (
                        <span
                            className="text-xs text-[#595550] block max-w-[300px] truncate"
                            title={desc || ''}
                        >
                            {desc || '—'}
                        </span>
                    );
                },
            },
            {
                id: 'ticketsCount',
                header: t('ticketing.ticketTypes.columns.ticketsCount'),
                cell: ({ row }: any) => {
                    const count = dynamicCountsMap.get(row.original.id) ?? 0;
                    return (
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20"
                            dir="ltr"
                        >
                            {count}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'createdBy',
                header: t('ticketing.ticketTypes.columns.createdBy'),
                cell: ({ row }: any) => {
                    const by = isAr
                        ? row.original.createdByAr || row.original.createdBy
                        : row.original.createdBy;
                    return <span className="text-xs text-[#595550]">{by}</span>;
                },
            },
            {
                accessorKey: 'createdAt',
                header: t('ticketing.ticketTypes.columns.createdAt'),
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
                    <TicketTypeActionsMenu
                        record={row.original}
                        onView={handleOpenView}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [t, isAr, dynamicCountsMap, handleOpenView, handleOpenEdit, handleOpenDelete]
    );

    const isView = drawerMode === 'view';
    const isEdit = drawerMode === 'edit';

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedTypes}
                count={filteredTypes.length}
                loading={false}
                searchPlaceholder={t('ticketing.ticketTypes.searchPlaceholder')}
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
                title={t('ticketing.ticketTypesTitle')}
                description={t('ticketing.ticketTypesDesc')}
                addNewLabel={t('ticketing.ticketTypes.addLabel')}
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
                                    ? t('ticketing.ticketTypes.drawer.viewTitle')
                                    : isEdit
                                      ? t('ticketing.ticketTypes.drawer.editTitle')
                                      : t('ticketing.ticketTypes.drawer.createTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isView
                                    ? t('ticketing.ticketTypes.drawer.viewSubtitle')
                                    : isEdit
                                      ? t('ticketing.ticketTypes.drawer.editSubtitle')
                                      : t('ticketing.ticketTypes.drawer.createSubtitle')}
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
                        id="ticket-type-form"
                        onSubmit={handleSubmit}
                        noValidate
                        className="p-6 overflow-y-auto flex-1 space-y-5"
                    >
                        {isView && activeRecord && (
                            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-[#6E6862] block">
                                        {t('ticketing.ticketTypes.columns.id')}
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
                                        {t('ticketing.ticketTypes.columns.ticketsCount')}
                                    </span>
                                    <span
                                        className="font-mono font-bold text-[#0D0D0D]"
                                        dir="ltr"
                                    >
                                        {dynamicCountsMap.get(activeRecord.id) ?? 0}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* English Name */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.ticketTypes.drawer.name')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <input
                                type="text"
                                readOnly={isView}
                                disabled={isView}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, name: undefined }));
                                    }
                                }}
                                placeholder={t('ticketing.ticketTypes.drawer.namePlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.name
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.name && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        {/* Arabic Name */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.ticketTypes.drawer.nameAr')}{' '}
                                {!isView && <span className="text-[#A23B2A]">*</span>}
                            </label>
                            <input
                                type="text"
                                readOnly={isView}
                                disabled={isView}
                                value={nameAr}
                                onChange={(e) => {
                                    setNameAr(e.target.value);
                                    if (errors.nameAr && e.target.value.trim()) {
                                        setErrors((prev) => ({ ...prev, nameAr: undefined }));
                                    }
                                }}
                                placeholder={t('ticketing.ticketTypes.drawer.nameArPlaceholder')}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    isView
                                        ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] cursor-default'
                                        : errors.nameAr
                                          ? 'bg-white border-red-400 text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                          : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {errors.nameAr && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {errors.nameAr}
                                </span>
                            )}
                        </div>

                        {/* Description (English) */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.ticketTypes.drawer.description')}{' '}
                                {!isView && (
                                    <span className="text-[#857E74] font-normal">
                                        {t('common.optional')}
                                    </span>
                                )}
                            </label>
                            <textarea
                                rows={3}
                                readOnly={isView}
                                disabled={isView}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t(
                                    'ticketing.ticketTypes.drawer.descriptionPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] resize-y"
                            />
                        </div>

                        {/* Description (Arabic) */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('ticketing.ticketTypes.drawer.descriptionAr')}{' '}
                                {!isView && (
                                    <span className="text-[#857E74] font-normal">
                                        {t('common.optional')}
                                    </span>
                                )}
                            </label>
                            <textarea
                                rows={3}
                                readOnly={isView}
                                disabled={isView}
                                value={descriptionAr}
                                onChange={(e) => setDescriptionAr(e.target.value)}
                                placeholder={t(
                                    'ticketing.ticketTypes.drawer.descriptionArPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] resize-y"
                            />
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
                                    form="ticket-type-form"
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
                                    {t('ticketing.ticketTypes.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] leading-relaxed">
                                    {t('ticketing.ticketTypes.deleteModal.message', {
                                        name: isAr
                                            ? recordToDelete.nameAr
                                            : recordToDelete.name,
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
