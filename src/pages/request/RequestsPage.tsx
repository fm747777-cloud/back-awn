import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    UserPlus,
    RotateCcw,
    AlertTriangle,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/DataTable';
import {
    loadRequests,
    createServiceRequest,
    updateServiceRequest,
    deleteServiceRequest,
    loadRequestServices,
    createOperationalTask,
    prependRequestAuditLog,
    REQUEST_COMPANIES,
    REQUEST_SERVICE_GROUPS,
    REQUEST_RESOURCES,
    type ServiceRequestRecord,
    type RequestServiceItem,
    type RequestPriority,
    type RequestAssignmentStatus,
    type RequestExecutionStatus,
} from './requestMockData';

function escapeCsvCell(value: string): string {
    const safe = (value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
}

type RequestDrawerMode = 'create' | 'edit' | 'view';

interface RequestActionsMenuProps {
    record: ServiceRequestRecord;
    onView: (r: ServiceRequestRecord) => void;
    onEdit: (r: ServiceRequestRecord) => void;
    onAssign: (r: ServiceRequestRecord) => void;
    onDelete: (r: ServiceRequestRecord) => void;
}

const RequestActionsMenu: React.FC<RequestActionsMenuProps> = ({
    record,
    onView,
    onEdit,
    onAssign,
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
                            onView(record);
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
                            onEdit(record);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] shrink-0" />
                        <span>{t('request.actions.edit')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onAssign(record);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#2D3F2C] font-medium hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <UserPlus size={14} className="text-[#2D3F2C] shrink-0" />
                        <span>{t('request.actions.assign')}</span>
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
                        <span>{t('request.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const RequestsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [requests, setRequests] = useState<ServiceRequestRecord[]>(() =>
        loadRequests()
    );
    const [servicesCatalog, setServicesCatalog] = useState<RequestServiceItem[]>(
        () => loadRequestServices()
    );

    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filter state
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedAssignment, setSelectedAssignment] = useState('all');
    const [selectedExecution, setSelectedExecution] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedResource, setSelectedResource] = useState('all');

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<RequestDrawerMode>('create');
    const [activeRequest, setActiveRequest] =
        useState<ServiceRequestRecord | null>(null);

    // Form fields
    const [serviceId, setServiceId] = useState('');
    const [companyId, setCompanyId] = useState('COMP-01');
    const [requesterEn, setRequesterEn] = useState('');
    const [requesterAr, setRequesterAr] = useState('');
    const [priority, setPriority] = useState<RequestPriority>('Medium');
    const [assignmentStatus, setAssignmentStatus] =
        useState<RequestAssignmentStatus>('Unassigned');
    const [executionStatus, setExecutionStatus] =
        useState<RequestExecutionStatus>('Initiated');
    const [assignedToId, setAssignedToId] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Exempt'>(
        'Paid'
    );
    const [dueDate, setDueDate] = useState('2026-02-25');
    const [notesEn, setNotesEn] = useState('');
    const [notesAr, setNotesAr] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Assign Specialist Modal state
    const [assigningRecord, setAssigningRecord] =
        useState<ServiceRequestRecord | null>(null);
    const [assignResourceId, setAssignResourceId] = useState('');
    const [assignStatusValue, setAssignStatusValue] =
        useState<RequestAssignmentStatus>('Assigned');
    const [assignExecStatusValue, setAssignExecStatusValue] =
        useState<RequestExecutionStatus>('In Progress');
    const [createLinkedTask, setCreateLinkedTask] = useState(true);

    // Delete Modal state
    const [requestToDelete, setRequestToDelete] =
        useState<ServiceRequestRecord | null>(null);

    useEffect(() => {
        const refresh = () => {
            setRequests(loadRequests());
            setServicesCatalog(loadRequestServices());
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, []);

    const hasActiveFilters =
        selectedCompany !== 'all' ||
        selectedGroup !== 'all' ||
        selectedAssignment !== 'all' ||
        selectedExecution !== 'all' ||
        selectedPriority !== 'all' ||
        selectedResource !== 'all';

    const handleResetFilters = () => {
        setSelectedCompany('all');
        setSelectedGroup('all');
        setSelectedAssignment('all');
        setSelectedExecution('all');
        setSelectedPriority('all');
        setSelectedResource('all');
        setPageIndex(0);
    };

    const filteredRequests = useMemo(() => {
        return requests.filter((req) => {
            if (selectedCompany !== 'all' && req.companyId !== selectedCompany) {
                return false;
            }
            if (selectedGroup !== 'all' && req.serviceGroupId !== selectedGroup) {
                return false;
            }
            if (
                selectedAssignment !== 'all' &&
                req.assignmentStatus !== selectedAssignment
            ) {
                return false;
            }
            if (
                selectedExecution !== 'all' &&
                req.executionStatus !== selectedExecution
            ) {
                return false;
            }
            if (selectedPriority !== 'all' && req.priority !== selectedPriority) {
                return false;
            }
            if (selectedResource !== 'all') {
                if (selectedResource === 'unassigned') {
                    if (req.assignedToId) return false;
                } else if (req.assignedToId !== selectedResource) {
                    return false;
                }
            }
            if (searchValue.trim()) {
                const q = searchValue.toLowerCase();
                const matchId = req.requestId.toLowerCase().includes(q);
                const matchService =
                    req.serviceTitleEn.toLowerCase().includes(q) ||
                    req.serviceTitleAr.toLowerCase().includes(q) ||
                    req.serviceCode.toLowerCase().includes(q);
                const matchCompany =
                    req.companyEn.toLowerCase().includes(q) ||
                    req.companyAr.toLowerCase().includes(q);
                const matchRequester =
                    req.requesterEn.toLowerCase().includes(q) ||
                    req.requesterAr.toLowerCase().includes(q);
                const matchResource =
                    req.assignedToEn.toLowerCase().includes(q) ||
                    req.assignedToAr.toLowerCase().includes(q);

                if (
                    !matchId &&
                    !matchService &&
                    !matchCompany &&
                    !matchRequester &&
                    !matchResource
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [
        requests,
        selectedCompany,
        selectedGroup,
        selectedAssignment,
        selectedExecution,
        selectedPriority,
        selectedResource,
        searchValue,
    ]);

    const paginatedRequests = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredRequests.slice(start, start + pageSize);
    }, [filteredRequests, pageIndex, pageSize]);

    const openDrawer = useCallback(
        (mode: RequestDrawerMode, record?: ServiceRequestRecord) => {
            const latestServices = loadRequestServices();
            setServicesCatalog(latestServices);
            setDrawerMode(mode);
            setFormErrors({});

            if (record) {
                setActiveRequest(record);
                setServiceId(record.serviceId);
                setCompanyId(record.companyId);
                setRequesterEn(record.requesterEn);
                setRequesterAr(record.requesterAr);
                setPriority(record.priority);
                setAssignmentStatus(record.assignmentStatus);
                setExecutionStatus(record.executionStatus);
                setAssignedToId(record.assignedToId);
                setPaymentStatus(record.paymentStatus);
                setDueDate(record.dueDate);
                setNotesEn(record.notesEn);
                setNotesAr(record.notesAr);
            } else {
                const defaultService = latestServices[0];
                setActiveRequest(null);
                setServiceId(defaultService?.id || 'r-srv-01');
                setCompanyId('COMP-01');
                setRequesterEn('');
                setRequesterAr('');
                setPriority('Medium');
                setAssignmentStatus('Unassigned');
                setExecutionStatus('Initiated');
                setAssignedToId('');
                setPaymentStatus('Paid');
                const nextDue = new Date(
                    Date.now() + (defaultService?.processingTimeDays || 2) * 86400000
                )
                    .toISOString()
                    .split('T')[0];
                setDueDate(nextDue);
                setNotesEn('');
                setNotesAr('');
            }
            setDrawerOpen(true);
        },
        []
    );

    const handleSaveRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (drawerMode === 'view') {
            setDrawerOpen(false);
            return;
        }

        const errs: Record<string, string> = {};
        if (!requesterEn.trim() && !requesterAr.trim()) {
            errs.requester = t('request.requests.validation.requesterRequired');
        }
        if (!serviceId) {
            errs.service = t('request.requests.validation.serviceRequired');
        }
        if (Object.keys(errs).length > 0) {
            setFormErrors(errs);
            return;
        }

        const selectedService =
            servicesCatalog.find((s) => s.id === serviceId) || servicesCatalog[0];
        const selectedComp =
            REQUEST_COMPANIES.find((c) => c.id === companyId) || REQUEST_COMPANIES[0];
        const selectedRes = REQUEST_RESOURCES.find((r) => r.id === assignedToId);

        const resolvedAssignmentStatus: RequestAssignmentStatus =
            executionStatus === 'Completed'
                ? 'Completed'
                : executionStatus === 'Rejected'
                  ? 'Rejected'
                  : selectedRes
                    ? assignmentStatus === 'Unassigned'
                        ? 'Assigned'
                        : assignmentStatus
                    : 'Unassigned';

        const cleanRequesterEn = requesterEn.trim() || requesterAr.trim();
        const cleanRequesterAr = requesterAr.trim() || requesterEn.trim();

        if (drawerMode === 'create') {
            const { list, created } = createServiceRequest({
                serviceId: selectedService.id,
                serviceCode: selectedService.code,
                serviceTitleEn: selectedService.titleEn,
                serviceTitleAr: selectedService.titleAr,
                serviceGroupId: selectedService.serviceGroupId,
                serviceGroupEn: selectedService.serviceGroupEn,
                serviceGroupAr: selectedService.serviceGroupAr,
                portalEn: selectedService.portalEn,
                portalAr: selectedService.portalAr,
                companyId: selectedComp.id,
                companyEn: selectedComp.nameEn,
                companyAr: selectedComp.nameAr,
                requesterEn: cleanRequesterEn,
                requesterAr: cleanRequesterAr,
                relatedTo: selectedService.relatedTo,
                priority,
                assignmentStatus: resolvedAssignmentStatus,
                executionStatus,
                assignedToId: selectedRes?.id || '',
                assignedToEn: selectedRes?.nameEn || '',
                assignedToAr: selectedRes?.nameAr || '',
                assignedByEn: selectedRes ? 'Karim Wagdi' : '',
                assignedByAr: selectedRes ? 'كريم وجدي' : '',
                slaDays: selectedService.processingTimeDays,
                fee: selectedService.fee,
                paymentStatus,
                dueDate,
                completedDate:
                    resolvedAssignmentStatus === 'Completed' ||
                    executionStatus === 'Completed'
                        ? new Date().toISOString().split('T')[0]
                        : '',
                notesEn: notesEn.trim() || notesAr.trim(),
                notesAr: notesAr.trim() || notesEn.trim(),
            });

            setRequests(list);
            prependRequestAuditLog({
                action: 'CREATED',
                resource: 'Request',
                resourceData: `${created.requestId} — ${created.serviceTitleEn} (${created.companyEn})`,
                resourceDataAr: `${created.requestId} — ${created.serviceTitleAr} (${created.companyAr})`,
                detailsEn: `Created service request ${created.requestId} for ${created.companyEn}.`,
                detailsAr: `تم إنشاء طلب الخدمة ${created.requestId} لصالح ${created.companyAr}.`,
            });
            toast.success(
                t('request.requests.createSuccess', { id: created.requestId })
            );
        } else if (drawerMode === 'edit' && activeRequest) {
            const updated: ServiceRequestRecord = {
                ...activeRequest,
                serviceId: selectedService.id,
                serviceCode: selectedService.code,
                serviceTitleEn: selectedService.titleEn,
                serviceTitleAr: selectedService.titleAr,
                serviceGroupId: selectedService.serviceGroupId,
                serviceGroupEn: selectedService.serviceGroupEn,
                serviceGroupAr: selectedService.serviceGroupAr,
                portalEn: selectedService.portalEn,
                portalAr: selectedService.portalAr,
                companyId: selectedComp.id,
                companyEn: selectedComp.nameEn,
                companyAr: selectedComp.nameAr,
                requesterEn: cleanRequesterEn,
                requesterAr: cleanRequesterAr,
                relatedTo: selectedService.relatedTo,
                priority,
                assignmentStatus: resolvedAssignmentStatus,
                executionStatus,
                assignedToId: selectedRes?.id || '',
                assignedToEn: selectedRes?.nameEn || '',
                assignedToAr: selectedRes?.nameAr || '',
                assignedByEn: selectedRes
                    ? activeRequest.assignedByEn || 'Karim Wagdi'
                    : '',
                assignedByAr: selectedRes
                    ? activeRequest.assignedByAr || 'كريم وجدي'
                    : '',
                paymentStatus,
                dueDate,
                notesEn: notesEn.trim() || notesAr.trim(),
                notesAr: notesAr.trim() || notesEn.trim(),
            };

            const nextList = updateServiceRequest(updated);
            setRequests(nextList);

            const auditAction =
                resolvedAssignmentStatus === 'Completed' ||
                executionStatus === 'Completed'
                    ? 'COMPLETED'
                    : resolvedAssignmentStatus === 'Rejected' ||
                        executionStatus === 'Rejected'
                      ? 'REJECTED'
                      : 'UPDATED';

            prependRequestAuditLog({
                action: auditAction,
                resource: 'Request',
                resourceData: `${updated.requestId} — ${updated.serviceTitleEn} (${updated.executionStatus})`,
                resourceDataAr: `${updated.requestId} — ${updated.serviceTitleAr} (${updated.executionStatus})`,
                detailsEn: `Updated request ${updated.requestId}: status=${updated.executionStatus}, assignment=${updated.assignmentStatus}.`,
                detailsAr: `تم تحديث الطلب ${updated.requestId}: الحالة=${updated.executionStatus}.`,
            });
            toast.success(
                t('request.requests.updateSuccess', { id: updated.requestId })
            );
        }

        setDrawerOpen(false);
    };

    const openAssignModal = useCallback((record: ServiceRequestRecord) => {
        setAssigningRecord(record);
        setAssignResourceId(record.assignedToId || 'RES-01');
        setAssignStatusValue(
            record.assignmentStatus === 'Unassigned'
                ? 'Assigned'
                : record.assignmentStatus
        );
        setAssignExecStatusValue(
            record.executionStatus === 'Initiated'
                ? 'In Progress'
                : record.executionStatus
        );
        setCreateLinkedTask(false);
    }, []);

    const handleConfirmAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningRecord) return;

        const resource = REQUEST_RESOURCES.find((r) => r.id === assignResourceId);
        const resolvedAssignment: RequestAssignmentStatus = resource
            ? assignStatusValue === 'Unassigned'
                ? 'Assigned'
                : assignStatusValue
            : 'Unassigned';

        const updated: ServiceRequestRecord = {
            ...assigningRecord,
            assignedToId: resource?.id || '',
            assignedToEn: resource?.nameEn || '',
            assignedToAr: resource?.nameAr || '',
            assignedByEn: resource ? 'Karim Wagdi' : '',
            assignedByAr: resource ? 'كريم وجدي' : '',
            assignmentStatus: resolvedAssignment,
            executionStatus: assignExecStatusValue,
        };

        const nextList = updateServiceRequest(updated);
        setRequests(nextList);

        prependRequestAuditLog({
            action: 'ASSIGNED',
            resource: 'Request',
            resourceData: `${updated.requestId} — ${
                resource ? `Assigned to ${resource.nameEn}` : 'Unassigned'
            }`,
            resourceDataAr: `${updated.requestId} — ${
                resource ? `تم الإسناد إلى ${resource.nameAr}` : 'غير مسند'
            }`,
            detailsEn: `Updated specialist assignment for ${updated.requestId}.`,
            detailsAr: `تم تحديث إسناد المختص للطلب ${updated.requestId}.`,
        });

        if (createLinkedTask && resource) {
            const { created: newTask } = createOperationalTask({
                titleEn: `Execute ${updated.serviceTitleEn} (${updated.requestId})`,
                titleAr: `تنفيذ ${updated.serviceTitleAr} (${updated.requestId})`,
                requestId: updated.requestId,
                serviceTitleEn: updated.serviceTitleEn,
                serviceTitleAr: updated.serviceTitleAr,
                serviceGroupId: updated.serviceGroupId,
                serviceGroupEn: updated.serviceGroupEn,
                serviceGroupAr: updated.serviceGroupAr,
                companyId: updated.companyId,
                companyEn: updated.companyEn,
                companyAr: updated.companyAr,
                assignedToId: resource.id,
                assignedToEn: resource.nameEn,
                assignedToAr: resource.nameAr,
                priority: updated.priority,
                status: 'In Progress',
                executionStageEn: 'Portal Submission',
                executionStageAr: 'التقديم عبر البوابة الحكومية',
                estimatedHours: 2,
                dueDate: updated.dueDate,
                completedDate: '',
                notesEn: `Auto-generated operational task from request ${updated.requestId}.`,
                notesAr: `مهمة تشغيلية منشأة تلقائياً من الطلب ${updated.requestId}.`,
            });

            prependRequestAuditLog({
                action: 'CREATED',
                resource: 'Operational Task',
                resourceData: `${newTask.taskCode} — ${newTask.titleEn}`,
                resourceDataAr: `${newTask.taskCode} — ${newTask.titleAr}`,
            });
        }

        setAssigningRecord(null);
        toast.success(
            t('request.requests.assignSuccess', { id: updated.requestId })
        );
    };

    const handleConfirmDelete = () => {
        if (!requestToDelete) return;
        const target = requestToDelete;
        const nextList = deleteServiceRequest(target.id);
        setRequests(nextList);

        prependRequestAuditLog({
            action: 'DELETED',
            resource: 'Request',
            resourceData: `${target.requestId} — ${target.serviceTitleEn} (${target.companyEn})`,
            resourceDataAr: `${target.requestId} — ${target.serviceTitleAr} (${target.companyAr})`,
            detailsEn: `Deleted service request ${target.requestId}.`,
            detailsAr: `تم حذف طلب الخدمة ${target.requestId}.`,
        });

        const maxPage = Math.max(
            0,
            Math.ceil((filteredRequests.length - 1) / pageSize) - 1
        );
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }
        setRequestToDelete(null);
        toast.success(
            t('request.requests.deleteSuccess', { id: target.requestId })
        );
    };

    const handleExport = useCallback(() => {
        const headers = [
            t('request.requests.columns.requestId'),
            t('request.requests.columns.service'),
            t('request.requests.columns.company'),
            t('request.requests.columns.serviceGroup'),
            t('request.requests.columns.requester'),
            t('request.requests.columns.assignedTo'),
            t('request.requests.columns.assignmentStatus'),
            t('request.requests.columns.executionStatus'),
            t('request.requests.columns.priority'),
            t('request.requests.columns.dueDate'),
            t('request.requests.columns.createdDate'),
        ];

        const rows = filteredRequests.map((r) => [
            escapeCsvCell(r.requestId),
            escapeCsvCell(isAr ? r.serviceTitleAr : r.serviceTitleEn),
            escapeCsvCell(isAr ? r.companyAr : r.companyEn),
            escapeCsvCell(isAr ? r.serviceGroupAr : r.serviceGroupEn),
            escapeCsvCell(isAr ? r.requesterAr : r.requesterEn),
            escapeCsvCell(
                r.assignedToId
                    ? isAr
                        ? r.assignedToAr
                        : r.assignedToEn
                    : t('request.assignmentStatuses.unassigned')
            ),
            escapeCsvCell(r.assignmentStatus),
            escapeCsvCell(r.executionStatus),
            escapeCsvCell(r.priority),
            escapeCsvCell(r.dueDate),
            escapeCsvCell(r.createdDate),
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
        link.setAttribute('download', 'service-requests.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('request.requests.exportSuccess', { count: filteredRequests.length })
        );
    }, [filteredRequests, isAr, t]);

    const getAssignmentBadge = useCallback(
        (st: RequestAssignmentStatus) => {
            const labelMap: Record<RequestAssignmentStatus, string> = {
                Assigned: t('request.assignmentStatuses.assigned'),
                Unassigned: t('request.assignmentStatuses.unassigned'),
                Completed: t('request.assignmentStatuses.completed'),
                Rejected: t('request.assignmentStatuses.rejected'),
            };
            const styleMap: Record<RequestAssignmentStatus, string> = {
                Assigned: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20',
                Unassigned: 'bg-[#B87D14]/10 text-[#B87D14] border-[#B87D14]/25',
                Completed: 'bg-[#265938]/10 text-[#265938] border-[#265938]/20',
                Rejected: 'bg-[#A23B2A]/10 text-[#A23B2A] border-[#A23B2A]/20',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styleMap[st]}`}
                >
                    {labelMap[st]}
                </span>
            );
        },
        [t]
    );

    const getExecutionBadge = useCallback(
        (st: RequestExecutionStatus) => {
            const labelMap: Record<RequestExecutionStatus, string> = {
                Initiated: t('request.executionStatuses.initiated'),
                'In Progress': t('request.executionStatuses.inProgress'),
                'Under Review': t('request.executionStatuses.underReview'),
                Completed: t('request.executionStatuses.completed'),
                Rejected: t('request.executionStatuses.rejected'),
            };
            const styleMap: Record<RequestExecutionStatus, string> = {
                Initiated: 'bg-[#FAF8F5] text-[#595550] border-[#E5E0D8]',
                'In Progress': 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20',
                'Under Review': 'bg-[#B87D14]/10 text-[#B87D14] border-[#B87D14]/25',
                Completed: 'bg-[#265938]/10 text-[#265938] border-[#265938]/20',
                Rejected: 'bg-[#A23B2A]/10 text-[#A23B2A] border-[#A23B2A]/20',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styleMap[st]}`}
                >
                    {labelMap[st]}
                </span>
            );
        },
        [t]
    );

    const getPriorityBadge = useCallback(
        (p: RequestPriority) => {
            const labelMap: Record<RequestPriority, string> = {
                Low: t('request.priorities.low'),
                Medium: t('request.priorities.medium'),
                High: t('request.priorities.high'),
                Critical: t('request.priorities.critical'),
            };
            const styleMap: Record<RequestPriority, string> = {
                Low: 'bg-[#6A7358]/15 text-[#2D3F2C] border-[#6A7358]/30',
                Medium: 'bg-[#BFAB93]/25 text-[#595550] border-[#BFAB93]/50',
                High: 'bg-[#B87D14]/15 text-[#B87D14] border-[#B87D14]/30',
                Critical: 'bg-[#A23B2A]/15 text-[#A23B2A] border-[#A23B2A]/30',
            };
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${styleMap[p]}`}
                >
                    {labelMap[p]}
                </span>
            );
        },
        [t]
    );

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'requestId',
                header: t('request.requests.columns.requestId'),
                cell: ({ row }: any) => (
                    <button
                        type="button"
                        onClick={() => openDrawer('view', row.original)}
                        className="font-mono font-bold text-xs text-[#2D3F2C] hover:underline cursor-pointer"
                        dir="ltr"
                    >
                        {row.original.requestId}
                    </button>
                ),
            },
            {
                accessorKey: 'serviceTitleEn',
                header: t('request.requests.columns.service'),
                cell: ({ row }: any) => {
                    const r: ServiceRequestRecord = row.original;
                    return (
                        <div className="text-start">
                            <button
                                type="button"
                                onClick={() => openDrawer('view', r)}
                                className="font-semibold text-xs text-[#0D0D0D] hover:text-[#2D3F2C] block cursor-pointer"
                            >
                                {isAr ? r.serviceTitleAr : r.serviceTitleEn}
                            </button>
                            <span className="text-[10px] font-mono text-[#6E6862]" dir="ltr">
                                {r.serviceCode} • {isAr ? r.portalAr : r.portalEn}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'companyEn',
                header: t('request.requests.columns.company'),
                cell: ({ row }: any) => {
                    const r: ServiceRequestRecord = row.original;
                    return (
                        <span className="text-xs font-medium text-[#0D0D0D]">
                            {isAr ? r.companyAr : r.companyEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'serviceGroupEn',
                header: t('request.requests.columns.serviceGroup'),
                cell: ({ row }: any) => {
                    const r: ServiceRequestRecord = row.original;
                    return (
                        <span className="text-xs text-[#595550]">
                            {isAr ? r.serviceGroupAr : r.serviceGroupEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'requesterEn',
                header: t('request.requests.columns.requester'),
                cell: ({ row }: any) => {
                    const r: ServiceRequestRecord = row.original;
                    return (
                        <span className="text-xs text-[#0D0D0D]">
                            {isAr ? r.requesterAr : r.requesterEn}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'assignedToEn',
                header: t('request.requests.columns.assignedTo'),
                cell: ({ row }: any) => {
                    const r: ServiceRequestRecord = row.original;
                    if (!r.assignedToId) {
                        return (
                            <button
                                type="button"
                                onClick={() => openAssignModal(r)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B87D14]/10 hover:bg-[#B87D14]/20 text-[#B87D14] text-[11px] font-semibold transition cursor-pointer"
                            >
                                <UserPlus size={12} />
                                <span>{t('request.actions.assignNow')}</span>
                            </button>
                        );
                    }
                    return (
                        <button
                            type="button"
                            onClick={() => openAssignModal(r)}
                            className="text-xs font-medium text-[#2D3F2C] hover:underline cursor-pointer"
                        >
                            {isAr ? r.assignedToAr : r.assignedToEn}
                        </button>
                    );
                },
            },
            {
                accessorKey: 'assignmentStatus',
                header: t('request.requests.columns.assignmentStatus'),
                cell: ({ row }: any) =>
                    getAssignmentBadge(row.original.assignmentStatus),
            },
            {
                accessorKey: 'executionStatus',
                header: t('request.requests.columns.executionStatus'),
                cell: ({ row }: any) =>
                    getExecutionBadge(row.original.executionStatus),
            },
            {
                accessorKey: 'priority',
                header: t('request.requests.columns.priority'),
                cell: ({ row }: any) => getPriorityBadge(row.original.priority),
            },
            {
                accessorKey: 'dueDate',
                header: t('request.requests.columns.dueDate'),
                cell: ({ row }: any) => (
                    <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                        {row.original.dueDate}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('common.actions'),
                cell: ({ row }: any) => (
                    <RequestActionsMenu
                        record={row.original}
                        onView={(r) => openDrawer('view', r)}
                        onEdit={(r) => openDrawer('edit', r)}
                        onAssign={openAssignModal}
                        onDelete={(r) => setRequestToDelete(r)}
                    />
                ),
            },
        ],
        [
            getAssignmentBadge,
            getExecutionBadge,
            getPriorityBadge,
            isAr,
            openAssignModal,
            openDrawer,
            t,
        ]
    );

    const filtersContent = (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.filters.company')}
                    </label>
                    <select
                        value={selectedCompany}
                        onChange={(e) => {
                            setSelectedCompany(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allCompanies')}</option>
                        {REQUEST_COMPANIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isAr ? c.nameAr : c.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

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
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">
                            {t('request.filters.allServiceGroups')}
                        </option>
                        {REQUEST_SERVICE_GROUPS.map((g) => (
                            <option key={g.id} value={g.id}>
                                {isAr ? g.nameAr : g.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.requests.columns.assignmentStatus')}
                    </label>
                    <select
                        value={selectedAssignment}
                        onChange={(e) => {
                            setSelectedAssignment(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allStatuses')}</option>
                        <option value="Assigned">
                            {t('request.assignmentStatuses.assigned')}
                        </option>
                        <option value="Unassigned">
                            {t('request.assignmentStatuses.unassigned')}
                        </option>
                        <option value="Completed">
                            {t('request.assignmentStatuses.completed')}
                        </option>
                        <option value="Rejected">
                            {t('request.assignmentStatuses.rejected')}
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.requests.columns.priority')}
                    </label>
                    <select
                        value={selectedPriority}
                        onChange={(e) => {
                            setSelectedPriority(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allPriorities')}</option>
                        <option value="Low">{t('request.priorities.low')}</option>
                        <option value="Medium">{t('request.priorities.medium')}</option>
                        <option value="High">{t('request.priorities.high')}</option>
                        <option value="Critical">
                            {t('request.priorities.critical')}
                        </option>
                    </select>
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-[#595550] mb-1.5 text-start">
                        {t('request.requests.columns.assignedTo')}
                    </label>
                    <select
                        value={selectedResource}
                        onChange={(e) => {
                            setSelectedResource(e.target.value);
                            setPageIndex(0);
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                    >
                        <option value="all">{t('request.filters.allResources')}</option>
                        <option value="unassigned">
                            {t('request.assignmentStatuses.unassigned')}
                        </option>
                        {REQUEST_RESOURCES.map((r) => (
                            <option key={r.id} value={r.id}>
                                {isAr ? r.nameAr : r.nameEn}
                            </option>
                        ))}
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
                title={t('request.requests.title')}
                description={t('request.requests.description')}
                columns={columns}
                data={paginatedRequests}
                count={filteredRequests.length}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                searchPlaceholder={t('request.requests.searchPlaceholder')}
                onAddNew={() => openDrawer('create')}
                addNewLabel={t('request.requests.addNew')}
                onExport={handleExport}
                onToggleFilters={() => setIsFiltersOpen((prev) => !prev)}
                isFiltersOpen={isFiltersOpen}
                hasActiveFilters={hasActiveFilters}
                filtersContent={filtersContent}
            />

            {/* Create / Edit / View Request Drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
                    <div className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
                        <div>
                            <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between bg-[#FAF8F5] sticky top-0 z-10">
                                <div className="text-start">
                                    <h2 className="text-base font-bold text-[#0D0D0D]">
                                        {drawerMode === 'create'
                                            ? t('request.requests.drawer.createTitle')
                                            : drawerMode === 'edit'
                                              ? t('request.requests.drawer.editTitle')
                                              : t('request.requests.drawer.viewTitle')}
                                    </h2>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {activeRequest
                                            ? activeRequest.requestId
                                            : t('request.requests.drawer.subtitle')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form
                                id="service-request-form"
                                onSubmit={handleSaveRequest}
                                className="p-6 space-y-4 text-start"
                            >
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.service')} *
                                    </label>
                                    <select
                                        disabled={drawerMode === 'view'}
                                        value={serviceId}
                                        onChange={(e) => setServiceId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        {servicesCatalog.map((srv) => (
                                            <option key={srv.id} value={srv.id}>
                                                {srv.code} — {isAr ? srv.titleAr : srv.titleEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.company')} *
                                    </label>
                                    <select
                                        disabled={drawerMode === 'view'}
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        {REQUEST_COMPANIES.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {isAr ? c.nameAr : c.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.drawer.requesterEn')} *
                                        </label>
                                        <input
                                            type="text"
                                            disabled={drawerMode === 'view'}
                                            value={requesterEn}
                                            onChange={(e) => {
                                                setRequesterEn(e.target.value);
                                                if (formErrors.requester) {
                                                    setFormErrors((prev) => ({
                                                        ...prev,
                                                        requester: '',
                                                    }));
                                                }
                                            }}
                                            placeholder={t(
                                                'request.requests.drawer.requesterPlaceholder'
                                            )}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                        {formErrors.requester && (
                                            <p className="text-[11px] text-[#A23B2A] mt-1">
                                                {formErrors.requester}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.drawer.requesterAr')}
                                        </label>
                                        <input
                                            type="text"
                                            disabled={drawerMode === 'view'}
                                            value={requesterAr}
                                            onChange={(e) => setRequesterAr(e.target.value)}
                                            placeholder="الاسم بالعربية..."
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.columns.priority')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={priority}
                                            onChange={(e) =>
                                                setPriority(e.target.value as RequestPriority)
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Low">
                                                {t('request.priorities.low')}
                                            </option>
                                            <option value="Medium">
                                                {t('request.priorities.medium')}
                                            </option>
                                            <option value="High">
                                                {t('request.priorities.high')}
                                            </option>
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
                                            disabled={drawerMode === 'view'}
                                            value={assignedToId}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAssignedToId(val);
                                                if (val && assignmentStatus === 'Unassigned') {
                                                    setAssignmentStatus('Assigned');
                                                } else if (!val) {
                                                    setAssignmentStatus('Unassigned');
                                                }
                                            }}
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.columns.assignmentStatus')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={assignmentStatus}
                                            onChange={(e) =>
                                                setAssignmentStatus(
                                                    e.target.value as RequestAssignmentStatus
                                                )
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Assigned">
                                                {t('request.assignmentStatuses.assigned')}
                                            </option>
                                            <option value="Unassigned">
                                                {t('request.assignmentStatuses.unassigned')}
                                            </option>
                                            <option value="Completed">
                                                {t('request.assignmentStatuses.completed')}
                                            </option>
                                            <option value="Rejected">
                                                {t('request.assignmentStatuses.rejected')}
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.columns.executionStatus')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={executionStatus}
                                            onChange={(e) =>
                                                setExecutionStatus(
                                                    e.target.value as RequestExecutionStatus
                                                )
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Initiated">
                                                {t('request.executionStatuses.initiated')}
                                            </option>
                                            <option value="In Progress">
                                                {t('request.executionStatuses.inProgress')}
                                            </option>
                                            <option value="Under Review">
                                                {t('request.executionStatuses.underReview')}
                                            </option>
                                            <option value="Completed">
                                                {t('request.executionStatuses.completed')}
                                            </option>
                                            <option value="Rejected">
                                                {t('request.executionStatuses.rejected')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.columns.dueDate')}
                                        </label>
                                        <input
                                            type="date"
                                            disabled={drawerMode === 'view'}
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] font-mono focus:outline-none focus:border-[#2D3F2C]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            {t('request.requests.drawer.paymentStatus')}
                                        </label>
                                        <select
                                            disabled={drawerMode === 'view'}
                                            value={paymentStatus}
                                            onChange={(e) =>
                                                setPaymentStatus(
                                                    e.target.value as 'Paid' | 'Pending' | 'Exempt'
                                                )
                                            }
                                            className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                        >
                                            <option value="Paid">
                                                {t('request.paymentStatuses.paid')}
                                            </option>
                                            <option value="Pending">
                                                {t('request.paymentStatuses.pending')}
                                            </option>
                                            <option value="Exempt">
                                                {t('request.paymentStatuses.exempt')}
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {drawerMode === 'view' && activeRequest?.completedDate && (
                                    <div className="p-3 rounded-lg bg-[#265938]/10 border border-[#265938]/20 text-xs flex items-center justify-between">
                                        <span className="font-semibold text-[#265938]">
                                            {t('request.requests.drawer.completedDate')}
                                        </span>
                                        <span className="font-mono font-bold text-[#265938]" dir="ltr">
                                            {activeRequest.completedDate}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.drawer.notes')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        disabled={drawerMode === 'view'}
                                        value={isAr ? notesAr || notesEn : notesEn || notesAr}
                                        onChange={(e) => {
                                            setNotesEn(e.target.value);
                                            setNotesAr(e.target.value);
                                        }}
                                        className="w-full p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5 sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#F8F6F2] cursor-pointer"
                            >
                                {drawerMode === 'view' ? t('common.close') : t('common.cancel')}
                            </button>
                            {drawerMode !== 'view' && (
                                <button
                                    type="submit"
                                    form="service-request-form"
                                    className="px-5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] cursor-pointer shadow-xs"
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

            {/* Assign / Reassign Resource Modal */}
            {assigningRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl overflow-hidden text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.requests.assignModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5 font-mono" dir="ltr">
                                    {assigningRecord.requestId}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAssigningRecord(null)}
                                className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmAssign} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('request.requests.columns.assignedTo')}
                                </label>
                                <select
                                    value={assignResourceId}
                                    onChange={(e) => setAssignResourceId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                >
                                    <option value="">
                                        {t('request.assignmentStatuses.unassigned')}
                                    </option>
                                    {REQUEST_RESOURCES.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {isAr
                                                ? `${r.nameAr} — ${r.roleAr}`
                                                : `${r.nameEn} — ${r.roleEn}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.assignmentStatus')}
                                    </label>
                                    <select
                                        value={assignStatusValue}
                                        onChange={(e) =>
                                            setAssignStatusValue(
                                                e.target.value as RequestAssignmentStatus
                                            )
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        <option value="Assigned">
                                            {t('request.assignmentStatuses.assigned')}
                                        </option>
                                        <option value="Unassigned">
                                            {t('request.assignmentStatuses.unassigned')}
                                        </option>
                                        <option value="Completed">
                                            {t('request.assignmentStatuses.completed')}
                                        </option>
                                        <option value="Rejected">
                                            {t('request.assignmentStatuses.rejected')}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('request.requests.columns.executionStatus')}
                                    </label>
                                    <select
                                        value={assignExecStatusValue}
                                        onChange={(e) =>
                                            setAssignExecStatusValue(
                                                e.target.value as RequestExecutionStatus
                                            )
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                    >
                                        <option value="Initiated">
                                            {t('request.executionStatuses.initiated')}
                                        </option>
                                        <option value="In Progress">
                                            {t('request.executionStatuses.inProgress')}
                                        </option>
                                        <option value="Under Review">
                                            {t('request.executionStatuses.underReview')}
                                        </option>
                                        <option value="Completed">
                                            {t('request.executionStatuses.completed')}
                                        </option>
                                        <option value="Rejected">
                                            {t('request.executionStatuses.rejected')}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {assignResourceId && (
                                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createLinkedTask}
                                        onChange={(e) =>
                                            setCreateLinkedTask(e.target.checked)
                                        }
                                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                    />
                                    <span className="text-xs font-medium text-[#0D0D0D]">
                                        {t('request.requests.assignModal.createTaskCheckbox')}
                                    </span>
                                </label>
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssigningRecord(null)}
                                    className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#595550] hover:bg-[#FAF8F5] cursor-pointer"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233122] cursor-pointer"
                                >
                                    {t('common.saveChanges')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {requestToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('request.requests.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5 font-mono" dir="ltr">
                                    {requestToDelete.requestId}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-[#595550] leading-relaxed mb-6">
                            {t('request.requests.deleteModal.message', {
                                id: requestToDelete.requestId,
                                service: isAr
                                    ? requestToDelete.serviceTitleAr
                                    : requestToDelete.serviceTitleEn,
                            })}
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setRequestToDelete(null)}
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
