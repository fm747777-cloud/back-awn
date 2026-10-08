import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    RotateCcw,
    AlertTriangle,
    X,
    Send,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadRequestServices,
    createRequestService,
    updateRequestService,
    deleteRequestService,
    createServiceRequest,
    prependRequestAuditLog,
    REQUEST_SERVICE_GROUPS,
    REQUEST_PORTALS,
    REQUEST_COMPANIES,
    REQUEST_RESOURCES,
    type RequestServiceItem,
    type RequestEntityScope,
    type RequestPriority,
} from './requestMockData';

function escapeCsvCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
}

type ServiceDrawerMode = 'create' | 'edit' | 'view';

interface ServiceActionsMenuProps {
    item: RequestServiceItem;
    onInitiateRequest: (item: RequestServiceItem) => void;
    onView: (item: RequestServiceItem) => void;
    onEdit: (item: RequestServiceItem) => void;
    onDelete: (item: RequestServiceItem) => void;
}

const ServiceActionsMenu: React.FC<ServiceActionsMenuProps> = ({
    item,
    onInitiateRequest,
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
                title={t('common.actions')}
                aria-label={t('common.actions')}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-44 bg-white border border-[#E5E0D8] rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onInitiateRequest(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#2D3F2C] font-semibold hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Send size={14} className="text-[#2D3F2C] shrink-0" />
                        <span>{t('request.services.initiateRequest')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4]" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onView(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Eye size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('request.actions.view')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('request.actions.edit')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4]" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('request.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const RequestServicesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [services, setServices] = useState<RequestServiceItem[]>(() =>
        loadRequestServices()
    );
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filters
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [selectedScope, setSelectedScope] = useState<string>('all');
    const [selectedPortal, setSelectedPortal] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Service Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<ServiceDrawerMode>('create');
    const [activeService, setActiveService] = useState<RequestServiceItem | null>(null);

    // Form fields
    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [serviceGroupId, setServiceGroupId] = useState('GRP-001');
    const [portalEn, setPortalEn] = useState('Ministry of Commerce');
    const [relatedTo, setRelatedTo] = useState<RequestEntityScope>('business');
    const [processingTimeDays, setProcessingTimeDays] = useState('2');
    const [fee, setFee] = useState('0');
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
    const [outputDeliverableEn, setOutputDeliverableEn] = useState('');
    const [outputDeliverableAr, setOutputDeliverableAr] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Delete Modal state
    const [serviceToDelete, setServiceToDelete] = useState<RequestServiceItem | null>(null);

    // Quick Initiate Request Modal state
    const [requestModalService, setRequestModalService] =
        useState<RequestServiceItem | null>(null);
    const [reqCompanyId, setReqCompanyId] = useState('COMP-01');
    const [reqRequesterEn, setReqRequesterEn] = useState('');
    const [reqPriority, setReqPriority] = useState<RequestPriority>('Medium');
    const [reqAssignedToId, setReqAssignedToId] = useState('');
    const [reqNotes, setReqNotes] = useState('');
    const [reqError, setReqError] = useState('');

    useEffect(() => {
        const handleStorage = () => setServices(loadRequestServices());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const hasActiveFilters =
        selectedGroup !== 'all' ||
        selectedScope !== 'all' ||
        selectedPortal !== 'all' ||
        selectedStatus !== 'all';

    const handleResetFilters = () => {
        setSelectedGroup('all');
        setSelectedScope('all');
        setSelectedPortal('all');
        setSelectedStatus('all');
        setPageIndex(0);
    };

    const filteredServices = useMemo(() => {
        return services.filter((srv) => {
            if (selectedGroup !== 'all' && srv.serviceGroupId !== selectedGroup) {
                return false;
            }
            if (selectedScope !== 'all' && srv.relatedTo !== selectedScope) {
                return false;
            }
            if (selectedPortal !== 'all' && srv.portalEn !== selectedPortal) {
                return false;
            }
            if (selectedStatus !== 'all' && srv.status !== selectedStatus) {
                return false;
            }
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const matchCode = srv.code.toLowerCase().includes(q);
                const matchTitle =
                    srv.titleEn.toLowerCase().includes(q) ||
                    srv.titleAr.toLowerCase().includes(q);
                const matchGroup =
                    srv.serviceGroupEn.toLowerCase().includes(q) ||
                    srv.serviceGroupAr.toLowerCase().includes(q);
                const matchPortal =
                    srv.portalEn.toLowerCase().includes(q) ||
                    srv.portalAr.toLowerCase().includes(q);
                if (!matchCode && !matchTitle && !matchGroup && !matchPortal) {
                    return false;
                }
            }
            return true;
        });
    }, [
        services,
        selectedGroup,
        selectedScope,
        selectedPortal,
        selectedStatus,
        searchValue,
    ]);

    const paginatedServices = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredServices.slice(start, start + pageSize);
    }, [filteredServices, pageIndex, pageSize]);

    const openDrawer = useCallback(
        (mode: ServiceDrawerMode, item?: RequestServiceItem) => {
            setDrawerMode(mode);
            setFormErrors({});
            if (item) {
                setActiveService(item);
                setTitleEn(item.titleEn);
                setTitleAr(item.titleAr);
                setDescriptionEn(item.descriptionEn);
                setDescriptionAr(item.descriptionAr);
                setServiceGroupId(item.serviceGroupId);
                setPortalEn(item.portalEn);
                setRelatedTo(item.relatedTo);
                setProcessingTimeDays(String(item.processingTimeDays));
                setFee(String(item.fee));
                setStatus(item.status);
                setOutputDeliverableEn(item.outputDeliverableEn);
                setOutputDeliverableAr(item.outputDeliverableAr);
            } else {
                setActiveService(null);
                setTitleEn('');
                setTitleAr('');
                setDescriptionEn('');
                setDescriptionAr('');
                setServiceGroupId('GRP-001');
                setPortalEn('Ministry of Commerce');
                setRelatedTo('business');
                setProcessingTimeDays('2');
                setFee('0');
                setStatus('Active');
                setOutputDeliverableEn('Official Service Completion Certificate');
                setOutputDeliverableAr('شهادة إتمام الخدمة المعتمدة');
            }
            setDrawerOpen(true);
        },
        []
    );

    const handleSaveService = (e: React.FormEvent) => {
        e.preventDefault();
        if (drawerMode === 'view') {
            setDrawerOpen(false);
            return;
        }

        const errs: Record<string, string> = {};
        if (!titleEn.trim()) {
            errs.titleEn = t('request.services.validation.titleEnRequired');
        }
        if (!titleAr.trim()) {
            errs.titleAr = t('request.services.validation.titleArRequired');
        }
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }

        const matchedGroup =
            REQUEST_SERVICE_GROUPS.find((g) => g.id === serviceGroupId) ||
            REQUEST_SERVICE_GROUPS[0];
        const matchedPortal =
            REQUEST_PORTALS.find((p) => p.en === portalEn) || REQUEST_PORTALS[0];

        if (drawerMode === 'create') {
            const nextList = createRequestService({
                titleEn: titleEn.trim(),
                titleAr: titleAr.trim(),
                descriptionEn: descriptionEn.trim() || titleEn.trim(),
                descriptionAr: descriptionAr.trim() || titleAr.trim(),
                serviceGroupId: matchedGroup.id,
                serviceGroupEn: matchedGroup.nameEn,
                serviceGroupAr: matchedGroup.nameAr,
                portalEn: matchedPortal.en,
                portalAr: matchedPortal.ar,
                categoryEn: matchedGroup.nameEn,
                categoryAr: matchedGroup.nameAr,
                relatedTo,
                processingTimeDays: Math.max(1, parseInt(processingTimeDays, 10) || 1),
                fee: Math.max(0, parseFloat(fee) || 0),
                delegationRequired: true,
                sadadAvailable: true,
                requiredDocuments: ['Commercial Registration Copy', 'National ID / Iqama Copy'],
                outputDeliverableEn:
                    outputDeliverableEn.trim() || 'Official Service Certificate',
                outputDeliverableAr:
                    outputDeliverableAr.trim() || 'شهادة إتمام الخدمة الرسمية',
                createdByEn: 'Karim Wagdi',
                createdByAr: 'كريم وجدي',
                status,
            });
            setServices(nextList);
            const created = nextList[0];
            prependRequestAuditLog({
                action: 'CREATED',
                resource: 'Service',
                resourceData: `${created.code} — ${created.titleEn}`,
                resourceDataAr: `${created.code} — ${created.titleAr}`,
                detailsEn: `Created requestable service ${created.code} (${created.titleEn}).`,
                detailsAr: `تم إنشاء الخدمة ${created.code} (${created.titleAr}).`,
            });
            toast.success(t('request.services.createSuccess'));
        } else if (drawerMode === 'edit' && activeService) {
            const updated: RequestServiceItem = {
                ...activeService,
                titleEn: titleEn.trim(),
                titleAr: titleAr.trim(),
                descriptionEn: descriptionEn.trim() || titleEn.trim(),
                descriptionAr: descriptionAr.trim() || titleAr.trim(),
                serviceGroupId: matchedGroup.id,
                serviceGroupEn: matchedGroup.nameEn,
                serviceGroupAr: matchedGroup.nameAr,
                portalEn: matchedPortal.en,
                portalAr: matchedPortal.ar,
                relatedTo,
                processingTimeDays: Math.max(1, parseInt(processingTimeDays, 10) || 1),
                fee: Math.max(0, parseFloat(fee) || 0),
                outputDeliverableEn:
                    outputDeliverableEn.trim() || activeService.outputDeliverableEn,
                outputDeliverableAr:
                    outputDeliverableAr.trim() || activeService.outputDeliverableAr,
                status,
            };
            const nextList = updateRequestService(updated);
            setServices(nextList);
            prependRequestAuditLog({
                action: 'UPDATED',
                resource: 'Service',
                resourceData: `${updated.code} — ${updated.titleEn}`,
                resourceDataAr: `${updated.code} — ${updated.titleAr}`,
                detailsEn: `Updated service configuration for ${updated.code} (${updated.titleEn}).`,
                detailsAr: `تم تحديث بيانات الخدمة ${updated.code} (${updated.titleAr}).`,
            });
            toast.success(t('request.services.updateSuccess'));
        }

        setDrawerOpen(false);
    };

    const handleConfirmDelete = () => {
        if (!serviceToDelete) return;
        const target = serviceToDelete;
        const nextList = deleteRequestService(target.id);
        setServices(nextList);
        prependRequestAuditLog({
            action: 'DELETED',
            resource: 'Service',
            resourceData: `${target.code} — ${target.titleEn}`,
            resourceDataAr: `${target.code} — ${target.titleAr}`,
            detailsEn: `Deleted service ${target.code} (${target.titleEn}) from Request catalog.`,
            detailsAr: `تم حذف الخدمة ${target.code} (${target.titleAr}) من دليل خدمات الطلبات.`,
        });
        const maxPage = Math.max(0, Math.ceil((filteredServices.length - 1) / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }
        setServiceToDelete(null);
        toast.success(t('request.services.deleteSuccess'));
    };

    const openInitiateRequestModal = useCallback((srv: RequestServiceItem) => {
        setRequestModalService(srv);
        setReqCompanyId('COMP-01');
        setReqRequesterEn('');
        setReqPriority('Medium');
        setReqAssignedToId('');
        setReqNotes('');
        setReqError('');
    }, []);

    const handleQuickCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestModalService) return;
        if (!reqRequesterEn.trim()) {
            setReqError(t('request.requests.validation.requesterRequired'));
            return;
        }

        const company =
            REQUEST_COMPANIES.find((c) => c.id === reqCompanyId) || REQUEST_COMPANIES[0];
        const resource = REQUEST_RESOURCES.find((r) => r.id === reqAssignedToId);

        const now = new Date();
        const due = new Date(
            now.getTime() + requestModalService.processingTimeDays * 86400000
        );
        const dueDate = due.toISOString().split('T')[0];

        const { created } = createServiceRequest({
            serviceId: requestModalService.id,
            serviceCode: requestModalService.code,
            serviceTitleEn: requestModalService.titleEn,
            serviceTitleAr: requestModalService.titleAr,
            serviceGroupId: requestModalService.serviceGroupId,
            serviceGroupEn: requestModalService.serviceGroupEn,
            serviceGroupAr: requestModalService.serviceGroupAr,
            portalEn: requestModalService.portalEn,
            portalAr: requestModalService.portalAr,
            companyId: company.id,
            companyEn: company.nameEn,
            companyAr: company.nameAr,
            requesterEn: reqRequesterEn.trim(),
            requesterAr: reqRequesterEn.trim(),
            relatedTo: requestModalService.relatedTo,
            priority: reqPriority,
            assignmentStatus: resource ? 'Assigned' : 'Unassigned',
            executionStatus: resource ? 'In Progress' : 'Initiated',
            assignedToId: resource?.id || '',
            assignedToEn: resource?.nameEn || '',
            assignedToAr: resource?.nameAr || '',
            assignedByEn: resource ? 'Karim Wagdi' : '',
            assignedByAr: resource ? 'كريم وجدي' : '',
            slaDays: requestModalService.processingTimeDays,
            fee: requestModalService.fee,
            paymentStatus: requestModalService.fee > 0 ? 'Pending' : 'Exempt',
            dueDate,
            completedDate: '',
            notesEn: reqNotes.trim() || `Request initiated from service ${requestModalService.code}.`,
            notesAr: reqNotes.trim() || `تم إنشاء الطلب من الخدمة ${requestModalService.code}.`,
        });

        prependRequestAuditLog({
            action: 'CREATED',
            resource: 'Request',
            resourceData: `${created.requestId} — ${created.serviceTitleEn} (${created.companyEn})`,
            resourceDataAr: `${created.requestId} — ${created.serviceTitleAr} (${created.companyAr})`,
            detailsEn: `Initiated service request ${created.requestId} from service catalog.`,
            detailsAr: `تم تقديم طلب الخدمة ${created.requestId} من دليل الخدمات.`,
        });

        setRequestModalService(null);
        toast.success(
            t('request.requests.createSuccess', { id: created.requestId })
        );
        navigate('/request/requests');
    };

    const handleExport = useCallback(() => {
        const headers = [
            t('request.services.columns.code'),
            t('request.services.columns.title'),
            t('request.services.columns.serviceGroup'),
            t('request.services.columns.relatedTo'),
            t('request.services.columns.portal'),
            t('request.services.columns.processingTime'),
            t('request.services.columns.fee'),
            t('request.services.columns.status'),
        ];

        const rows = filteredServices.map((srv) => [
            escapeCsvCell(srv.code),
            escapeCsvCell(isAr ? srv.titleAr : srv.titleEn),
            escapeCsvCell(isAr ? srv.serviceGroupAr : srv.serviceGroupEn),
            escapeCsvCell(t(`request.entityScopes.${srv.relatedTo}`)),
            escapeCsvCell(isAr ? srv.portalAr : srv.portalEn),
            escapeCsvCell(`${srv.processingTimeDays}`),
            escapeCsvCell(`${srv.fee}`),
            escapeCsvCell(
                srv.status === 'Active' ? t('common.active') : t('common.inactive')
            ),
        ]);

        const csvContent =
            '\uFEFF' +
            [headers.map(escapeCsvCell).join(','), ...rows.map((r) => r.join(','))].join(
                '\r\n'
            );

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'request-services-catalog.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('request.services.exportSuccess', { count: filteredServices.length })
        );
    }, [filteredServices, isAr, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'code',
                header: t('request.services.columns.code'),
                cell: ({ row }: any) => (
                    <span className="font-mono font-semibold text-xs text-[#2D3F2C]" dir="ltr">
                        {row.original.code}
                    </span>
                ),
            },
            {
                accessorKey: 'titleEn',
                header: t('request.services.columns.title'),
                cell: ({ row }: any) => {
                    const item: RequestServiceItem = row.original;
                    const title = isAr ? item.titleAr : item.titleEn;
                    return (
                        <button
                            type="button"
                            onClick={() => openDrawer('view', item)}
                            className="font-semibold text-xs text-[#0D0D0D] hover:text-[#2D3F2C] text-start cursor-pointer transition-colors"
                        >
                            {title}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'serviceGroupEn',
                header: t('request.services.columns.serviceGroup'),
                cell: ({ row }: any) => {
                    const item: RequestServiceItem = row.original;
                    return (
                        <span className="text-xs text-[#595550]">
                            {isAr ? item.serviceGroupAr : item.serviceGroupEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'relatedTo',
                header: t('request.services.columns.relatedTo'),
                cell: ({ row }: any) => (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] border border-[#E5E0D8] text-[#595550]">
                        {t(`request.entityScopes.${row.original.relatedTo}`)}
                    </span>
                ),
            },
            {
                accessorKey: 'portalEn',
                header: t('request.services.columns.portal'),
                cell: ({ row }: any) => {
                    const item: RequestServiceItem = row.original;
                    return (
                        <span className="text-xs font-medium text-[#0D0D0D]">
                            {isAr ? item.portalAr : item.portalEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'processingTimeDays',
                header: t('request.services.columns.processingTime'),
                cell: ({ row }: any) => (
                    <span className="font-mono text-xs text-[#595550]">
                        {row.original.processingTimeDays} {t('request.services.daysUnit')}
                    </span>
                ),
            },
            {
                accessorKey: 'fee',
                header: t('request.services.columns.fee'),
                cell: ({ row }: any) => (
                    <span className="font-mono text-xs font-semibold text-[#0D0D0D]">
                        {row.original.fee} {t('common.sar')}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: t('request.services.columns.status'),
                cell: ({ row }: any) => {
                    const isActive = row.original.status === 'Active';
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                                isActive
                                    ? 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20'
                                    : 'bg-[#FAF8F5] text-[#6E6862] border-[#E5E0D8]'
                            }`}
                        >
                            {isActive ? t('common.active') : t('common.inactive')}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }: any) => (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => openInitiateRequestModal(row.original)}
                            className="px-2.5 py-1 rounded-lg bg-[#2D3F2C]/10 hover:bg-[#2D3F2C] text-[#2D3F2C] hover:text-[#FAF8F5] text-[11px] font-semibold transition cursor-pointer"
                        >
                            {t('request.services.requestNowBtn')}
                        </button>
                        <ServiceActionsMenu
                            item={row.original}
                            onInitiateRequest={openInitiateRequestModal}
                            onView={(srv) => openDrawer('view', srv)}
                            onEdit={(srv) => openDrawer('edit', srv)}
                            onDelete={(srv) => setServiceToDelete(srv)}
                        />
                    </div>
                ),
            },
        ],
        [isAr, openDrawer, openInitiateRequestModal, t]
    );

    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.filters.serviceGroup')}
                    </label>
                    <select
                        value={selectedGroup}
                        onChange={(e) => {
                            setSelectedGroup(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allServiceGroups')}</option>
                        {REQUEST_SERVICE_GROUPS.map((g) => (
                            <option key={g.id} value={g.id}>
                                {isAr ? g.nameAr : g.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.services.columns.relatedTo')}
                    </label>
                    <select
                        value={selectedScope}
                        onChange={(e) => {
                            setSelectedScope(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allScopes')}</option>
                        <option value="business">{t('request.entityScopes.business')}</option>
                        <option value="employee">{t('request.entityScopes.employee')}</option>
                        <option value="asset">{t('request.entityScopes.asset')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.services.columns.portal')}
                    </label>
                    <select
                        value={selectedPortal}
                        onChange={(e) => {
                            setSelectedPortal(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allPortals')}</option>
                        {REQUEST_PORTALS.map((p) => (
                            <option key={p.en} value={p.en}>
                                {isAr ? p.ar : p.en}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('common.status')}
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allStatuses')}</option>
                        <option value="Active">{t('common.active')}</option>
                        <option value="Inactive">{t('common.inactive')}</option>
                    </select>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={!hasActiveFilters}
                        className="w-full h-9 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#EFECE6] disabled:opacity-50 text-xs font-semibold text-[#595550] flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                        <RotateCcw size={13} />
                        <span>{t('common.resetFilters')}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <DataTable
                title={t('request.services.title')}
                description={t('request.services.description')}
                columns={columns}
                data={paginatedServices}
                count={filteredServices.length}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                searchPlaceholder={t('request.services.searchPlaceholder')}
                onAddNew={() => openDrawer('create')}
                addNewLabel={t('request.services.addNew')}
                onExport={handleExport}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Service Create / Edit / View Drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between bg-[#FAF8F5] sticky top-0 z-10">
                                <div className="text-start">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {drawerMode === 'create'
                                            ? t('request.services.drawer.createTitle')
                                            : drawerMode === 'edit'
                                              ? t('request.services.drawer.editTitle')
                                              : t('request.services.drawer.viewTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {activeService
                                            ? `${activeService.code}`
                                            : t('request.services.drawer.subtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] transition cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form id="request-service-form" onSubmit={handleSaveService} className="p-6 space-y-4 text-start">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.drawer.titleEn')} *
                                        </label>
                                        <input
                                            type="text"
                                            disabled={drawerMode === 'view'}
                                            value={titleEn}
                                            onChange={(e) => {
                                                setTitleEn(e.target.value);
                                                if (formErrors.titleEn) {
                                                    setFormErrors((prev) => ({ ...prev, titleEn: '' }));
                                                }
                                            }}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] disabled: opacity-75 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                        {formErrors.titleEn && (
                                            <p className="text-[11px] text-[#A23B2A] mt-1">
                                                {formErrors.titleEn}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.drawer.titleAr')} *
                                        </label>
                                        <input
                                            type="text"
                                            disabled={drawerMode === 'view'}
                                            value={titleAr}
                                            onChange={(e) => {
                                                setTitleAr(e.target.value);
                                                if (formErrors.titleAr) {
                                                    setFormErrors((prev) => ({ ...prev, titleAr: '' }));
                                                }
                                            }}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] disabled:opacity-75 text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                        {formErrors.titleAr && (
                                            <p className="text-[11px] text-[#A23B2A] mt-1">
                                                {formErrors.titleAr}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.columns.serviceGroup')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={serviceGroupId}
                                            onChange={(e) => setServiceGroupId(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            {REQUEST_SERVICE_GROUPS.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {isAr ? g.nameAr : g.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.columns.portal')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={portalEn}
                                            onChange={(e) => setPortalEn(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            {REQUEST_PORTALS.map((p) => (
                                                <option key={p.en} value={p.en}>
                                                    {isAr ? p.ar : p.en}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.columns.relatedTo')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={relatedTo}
                                            onChange={(e) =>
                                                setRelatedTo(e.target.value as RequestEntityScope)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="business">
                                                {t('request.entityScopes.business')}
                                            </option>
                                            <option value="employee">
                                                {t('request.entityScopes.employee')}
                                            </option>
                                            <option value="asset">
                                                {t('request.entityScopes.asset')}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.columns.processingTime')}
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            disabled={drawerMode === 'view'}
                                            value={processingTimeDays}
                                            onChange={(e) => setProcessingTimeDays(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.services.columns.fee')} ({t('common.sar')})
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            disabled={drawerMode === 'view'}
                                            value={fee}
                                            onChange={(e) => setFee(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('common.status')}
                                    </label>
                                    <select
                                        disabled={drawerMode === 'view'}
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value as 'Active' | 'Inactive')
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        <option value="Active">{t('common.active')}</option>
                                        <option value="Inactive">{t('common.inactive')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.services.drawer.descriptionEn')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        disabled={drawerMode === 'view'}
                                        value={descriptionEn}
                                        onChange={(e) => setDescriptionEn(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.services.drawer.descriptionAr')}
                                    </label>
                                    <textarea
                                        rows={2}
                                        disabled={drawerMode === 'view'}
                                        value={descriptionAr}
                                        onChange={(e) => setDescriptionAr(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5 sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {drawerMode === 'view' ? t('common.close') : t('common.cancel')}
                            </button>
                            {drawerMode !== 'view' && (
                                <button
                                    type="submit"
                                    form="request-service-form"
                                    className="px-5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] transition cursor-pointer shadow-xs"
                                >
                                    {drawerMode === 'create'
                                        ? t('common.save')
                                        : t('common.saveChanges')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Initiate Request Modal */}
            {requestModalService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-start">
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.services.initiateRequest')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {requestModalService.code} —{' '}
                                    {isAr
                                        ? requestModalService.titleAr
                                        : requestModalService.titleEn}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRequestModalService(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleQuickCreateRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.columns.company')} *
                                </label>
                                <select
                                    value={reqCompanyId}
                                    onChange={(e) => setReqCompanyId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                >
                                    {REQUEST_COMPANIES.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {isAr ? c.nameAr : c.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.columns.requester')} *
                                </label>
                                <input
                                    type="text"
                                    value={reqRequesterEn}
                                    onChange={(e) => {
                                        setReqRequesterEn(e.target.value);
                                        if (reqError) setReqError('');
                                    }}
                                    placeholder={t('request.requests.drawer.requesterPlaceholder')}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                />
                                {reqError && (
                                    <p className="text-[11px] text-[#A23B2A] mt-1">{reqError}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.priority')}
                                    </label>
                                    <select
                                        value={reqPriority}
                                        onChange={(e) =>
                                            setReqPriority(e.target.value as RequestPriority)
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        <option value="Low">{t('request.priorities.low')}</option>
                                        <option value="Medium">{t('request.priorities.medium')}</option>
                                        <option value="High">{t('request.priorities.high')}</option>
                                        <option value="Critical">
                                            {t('request.priorities.critical')}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.assignedTo')}
                                    </label>
                                    <select
                                        value={reqAssignedToId}
                                        onChange={(e) => setReqAssignedToId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        <option value="">
                                            {t('request.assignmentStatuses.unassigned')}
                                        </option>
                                        {REQUEST_RESOURCES.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {isAr ? r.nameAr : r.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.drawer.notes')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={reqNotes}
                                    onChange={(e) => setReqNotes(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRequestModalService(null)}
                                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#FAF8F5] cursor-pointer"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] cursor-pointer"
                                >
                                    {t('common.submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {serviceToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.services.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {serviceToDelete.code}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-[#595550] leading-relaxed mb-6">
                            {t('request.services.deleteModal.message', {
                                name: isAr
                                    ? serviceToDelete.titleAr
                                    : serviceToDelete.titleEn,
                            })}
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setServiceToDelete(null)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-[#A23B2A] text-white text-xs font-semibold hover:bg-[#8B3223] cursor-pointer"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
