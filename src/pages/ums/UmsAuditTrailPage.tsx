import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
    History,
    FileSpreadsheet,
    Activity,
    ShieldCheck,
    Search,
    X,
    RotateCcw,
    Download,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import { AuditTrailInspectModal } from '../../components/ums/AuditTrailInspectModal';
import { umsApi } from '../../api/api';
import {
    recordUmsAuditEvent,
    escapeSafeCsvCell,
    sanitizeAuditStateSnapshot,
    type UmsAuditEvent,
    type UmsAuditAction,
    type UmsAuditResource,
} from './umsMockData';

const AUDIT_RESOURCES: UmsAuditResource[] = [
    'Employee',
    'Department',
    'Designation',
    'Branch',
    'Role',
    'Security Group',
    'Custom Addon',
];

const AUDIT_ACTIONS: UmsAuditAction[] = [
    'CREATED',
    'UPDATED',
    'DELETED',
    'ACTIVATED',
    'DEACTIVATED',
    'IMPORTED',
    'EXPORTED',
];

export const UmsAuditTrailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // TanStack Query for Audit Trail via umsApi
    const { data: events = [] } = useQuery<UmsAuditEvent[]>({
        queryKey: ['ums', 'audit-trail'],
        queryFn: () => umsApi.listAuditTrail(),
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [resourceFilter, setResourceFilter] = useState<'ALL' | UmsAuditResource>('ALL');
    const [actionFilter, setActionFilter] = useState<'ALL' | UmsAuditAction>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [viewingEvent, setViewingEvent] = useState<UmsAuditEvent | null>(null);

    const kpis = useMemo(() => {
        const total = events.length;
        const employeeAndImport = events.filter(
            (e) => e.resource === 'Employee' || e.action === 'IMPORTED'
        ).length;
        const masterDataChanges = events.filter(
            (e) => e.resource !== 'Employee' && (e.action === 'CREATED' || e.action === 'UPDATED')
        ).length;
        const statusAndSecurity = events.filter(
            (e) =>
                e.action === 'ACTIVATED' ||
                e.action === 'DEACTIVATED' ||
                e.action === 'DELETED' ||
                e.resource === 'Security Group' ||
                e.resource === 'Role'
        ).length;
        return { total, employeeAndImport, masterDataChanges, statusAndSecurity };
    }, [events]);

    const filteredEvents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return events.filter((ev) => {
            if (resourceFilter !== 'ALL' && ev.resource !== resourceFilter) return false;
            if (actionFilter !== 'ALL' && ev.action !== actionFilter) return false;
            if (!q) return true;
            return (
                ev.id.toLowerCase().includes(q) ||
                ev.actorName.toLowerCase().includes(q) ||
                ev.actorEmail.toLowerCase().includes(q) ||
                ev.resourceName.toLowerCase().includes(q) ||
                ev.detailsEn.toLowerCase().includes(q) ||
                ev.detailsAr.toLowerCase().includes(q) ||
                ev.resource.toLowerCase().includes(q) ||
                ev.action.toLowerCase().includes(q)
            );
        });
    }, [events, searchQuery, resourceFilter, actionFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedEvents = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filteredEvents.slice(start, start + pageSize);
    }, [filteredEvents, safePage, pageSize]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setResourceFilter('ALL');
        setActionFilter('ALL');
        setCurrentPage(1);
    };

    const getActionBadgeStyle = (action: UmsAuditAction): string => {
        switch (action) {
            case 'CREATED':
            case 'ACTIVATED':
                return 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/20';
            case 'IMPORTED':
                return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
            case 'UPDATED':
            case 'EXPORTED':
                return 'bg-[#FAF8F5] text-[#037F8C] border-[#E5E0D8]';
            case 'DEACTIVATED':
                return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
            case 'DELETED':
                return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
            default:
                return 'bg-[#FAF8F5] text-[#45413C] border-[#E5E0D8]';
        }
    };

    const handleExportCsv = () => {
        if (filteredEvents.length === 0) {
            toast.error(t('common.noRecords', { defaultValue: 'No records found to export' }));
            return;
        }

        const headers = [
            'Audit ID',
            'Timestamp',
            'Actor Name',
            'Actor Email',
            'Action',
            'Resource Module',
            'Target Record',
            'Details (EN)',
            'Details (AR)',
            'Previous State Summary',
            'New State Summary',
        ];

        const rows = filteredEvents.map((ev) => [
            escapeSafeCsvCell(ev.id),
            escapeSafeCsvCell(ev.timestamp),
            escapeSafeCsvCell(ev.actorName),
            escapeSafeCsvCell(ev.actorEmail),
            escapeSafeCsvCell(ev.action),
            escapeSafeCsvCell(ev.resource),
            escapeSafeCsvCell(ev.resourceName),
            escapeSafeCsvCell(ev.detailsEn),
            escapeSafeCsvCell(ev.detailsAr),
            escapeSafeCsvCell(sanitizeAuditStateSnapshot(ev.previousState) || ''),
            escapeSafeCsvCell(sanitizeAuditStateSnapshot(ev.newState) || ''),
        ]);

        const csvContent =
            '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
            'download',
            `AWN_UMS_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        recordUmsAuditEvent({
            action: 'EXPORTED',
            resource: 'Employee',
            resourceId: 'AUDIT-LOG',
            resourceName: 'UMS Audit Trail',
            detailsEn: `Exported ${filteredEvents.length} UMS audit event(s) to CSV.`,
            detailsAr: `تصدير ${filteredEvents.length} سجل من سجل تدقيق نظام إدارة المستخدمين إلى ملف CSV.`,
        });

        toast.success(
            isRtl
                ? 'تم تصدير سجل التدقيق بنجاح.'
                : 'UMS audit trail exported successfully.'
        );
    };

    // Shared DataTable columns for Audit Trail
    const columns = useMemo<ColumnDef<any, UmsAuditEvent>[]>(
        () => [
            {
                id: 'id',
                header: () => (isRtl ? 'رقم العملية' : 'Event ID'),
                cell: ({ row }) => (
                    <span className="font-mono font-semibold text-[#037F8C] whitespace-nowrap" dir="ltr">
                        {row.original.id}
                    </span>
                ),
            },
            {
                id: 'timestamp',
                header: () => (isRtl ? 'التاريخ والوقت' : 'Timestamp'),
                cell: ({ row }) => (
                    <span className="font-mono text-[#6E6862] whitespace-nowrap" dir="ltr">
                        {row.original.timestamp.replace('T', ' ').slice(0, 16)}
                    </span>
                ),
            },
            {
                id: 'actor',
                header: () => (isRtl ? 'المنفّذ' : 'Actor'),
                cell: ({ row }) => {
                    const ev = row.original;
                    return (
                        <div className="whitespace-nowrap">
                            <div className="font-semibold text-[#0D0D0D]">{ev.actorName}</div>
                            <div className="text-[11px] text-[#857E74]" dir="ltr">
                                {ev.actorEmail}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'action',
                header: () => (isRtl ? 'العملية' : 'Action'),
                cell: ({ row }) => {
                    const ev = row.original;
                    return (
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase whitespace-nowrap ${getActionBadgeStyle(
                                ev.action
                            )}`}
                        >
                            {ev.action}
                        </span>
                    );
                },
            },
            {
                id: 'resource',
                header: () => (isRtl ? 'الوحدة / السجل' : 'Module & Target'),
                cell: ({ row }) => {
                    const ev = row.original;
                    return (
                        <div className="whitespace-nowrap">
                            <div className="font-bold text-[#0D0D0D]">{ev.resourceName}</div>
                            <div className="text-[11px] text-[#6E6862]">{ev.resource}</div>
                        </div>
                    );
                },
            },
            {
                id: 'details',
                header: () => (isRtl ? 'التفاصيل' : 'Audit Summary'),
                cell: ({ row }) => {
                    const ev = row.original;
                    return (
                        <p className="text-xs text-[#45413C] line-clamp-2 max-w-md">
                            {isRtl ? ev.detailsAr : ev.detailsEn}
                        </p>
                    );
                },
            },
            {
                id: 'actions',
                header: () => (
                    <div className="text-end">{isRtl ? 'عرض' : 'Inspect'}</div>
                ),
                cell: ({ row }) => {
                    const ev = row.original;
                    return (
                        <div className="text-end whitespace-nowrap">
                            <button
                                type="button"
                                onClick={() => setViewingEvent(ev)}
                                className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                title={isRtl ? 'عرض التفاصيل' : 'View Audit Details'}
                            >
                                <Eye size={14} />
                            </button>
                        </div>
                    );
                },
            },
        ],
        [isRtl]
    );

    return (
        <div className="space-y-6 text-start">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t('nav.auditTrail', { defaultValue: 'UMS Audit Trail' })}
                        </h1>
                        <span
                            className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]"
                            dir="ltr"
                        >
                            UMS-AUD
                        </span>
                    </div>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('ums.auditTrail.subtitle', {
                            defaultValue:
                                'Immutable governance log of employee onboarding, batch imports, role assignments, and master-data changes.',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download size={14} className="text-[#857E74]" />
                        <span>{t('common.export', { defaultValue: 'Export CSV' })}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'إجمالي سجلات التدقيق' : 'Total Audit Events'}
                            </p>
                            <p className="text-2xl font-bold text-[#0D0D0D] mt-1">{kpis.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <History size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'عمليات الموظفين والاستيراد' : 'Employee & Import Events'}
                            </p>
                            <p className="text-2xl font-bold text-[#037F8C] mt-1">
                                {kpis.employeeAndImport}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                            <FileSpreadsheet size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'تحديثات البيانات الأساسية' : 'Master Data Changes'}
                            </p>
                            <p className="text-2xl font-bold text-[#037F8C] mt-1">
                                {kpis.masterDataChanges}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                            <Activity size={18} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[#6E6862]">
                                {isRtl ? 'عمليات الأمان والحالة' : 'Security & Status Actions'}
                            </p>
                            <p className="text-2xl font-bold text-[#B45309] mt-1">
                                {kpis.statusAndSecurity}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74]"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={
                                isRtl
                                    ? 'بحث بالمعرف، اسم الموظف، المسؤول، أو تفاصيل العملية...'
                                    : 'Search by event ID, employee code, actor, or description...'
                            }
                            className="w-full ps-9 pe-8 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 focus:border-[#037F8C]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setCurrentPage(1);
                                }}
                                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={resourceFilter}
                            onChange={(e) => {
                                setResourceFilter(e.target.value as 'ALL' | UmsAuditResource);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by Resource Module"
                            className="px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#037F8C] cursor-pointer"
                        >
                            <option value="ALL">
                                {isRtl ? 'جميع الوحدات (All Modules)' : 'All Modules'}
                            </option>
                            {AUDIT_RESOURCES.map((res) => (
                                <option key={res} value={res}>
                                    {res}
                                </option>
                            ))}
                        </select>

                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value as 'ALL' | UmsAuditAction);
                                setCurrentPage(1);
                            }}
                            aria-label="Filter by Action Type"
                            className="px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] focus:outline-none focus:border-[#037F8C] cursor-pointer"
                        >
                            <option value="ALL">
                                {isRtl ? 'جميع العمليات (All Actions)' : 'All Actions'}
                            </option>
                            {AUDIT_ACTIONS.map((act) => (
                                <option key={act} value={act}>
                                    {act}
                                </option>
                            ))}
                        </select>

                        {(searchQuery || resourceFilter !== 'ALL' || actionFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                            >
                                <RotateCcw size={13} />
                                <span>{t('common.reset', { defaultValue: 'Reset' })}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Shared DataTable for Audit Trail */}
            <DataTable
                columns={columns}
                data={paginatedEvents}
                count={filteredEvents.length}
                pageIndex={safePage}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                }}
                searchValue={searchQuery}
                onSearchChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                }}
                searchPlaceholder={
                    isRtl
                        ? 'بحث بالمعرف، اسم الموظف، المسؤول، أو تفاصيل العملية...'
                        : 'Search by event ID, employee code, actor, or description...'
                }
                title={isRtl ? 'سجل التدقيق' : 'Audit Trail Logs'}
            />

            {/* Audit Event Inspection Modal */}
            <AuditTrailInspectModal
                event={viewingEvent}
                isRtl={isRtl}
                onClose={() => setViewingEvent(null)}
            />
        </div>
    );
};

export default UmsAuditTrailPage;
