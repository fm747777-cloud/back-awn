import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import { AddServiceModal } from './AddServiceModal';
import { serviceApi } from '../../api/api';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';

export type CreatedByUser = {
    name: string;
    email?: string;
};

export type ServiceItem = {
    id: string;
    code: string;
    title: string;
    relatedTo: string;
    category: string;
    type: string;
    tags: string;
    processingTime: number | string;
    frequency: string;
    fee: number;
    delegationRequired: string;
    validity: string;
    sadadAvailable: string;
    portal: string;
    createDate: string;
    createdBy: CreatedByUser | string;
    status: 'Active' | 'Inactive';
};

export const ServicesListTab = () => {
    const { t } = useTranslation();
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['services', pageIndex, pageSize, searchValue],
        queryFn: () =>
            serviceApi.getServices({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchValue,
            }),
    });

    const servicesList = data?.data || [];
    const totalCount = data?.count ?? 0;

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected?.() || false}
                        onChange={table.getToggleAllRowsSelectedHandler?.()}
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected?.() || false}
                        onChange={row.getToggleSelectedHandler?.()}
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
            },
            {
                accessorKey: 'code',
                header: t('services.serviceCode'),
                cell: (info: any) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {info.getValue()}
                    </span>
                ),
            },
            {
                accessorKey: 'title',
                header: t('services.serviceTitle'),
                cell: (info: any) => (
                    <span className="font-medium text-[#0D0D0D] inline-block text-start">
                        {info.getValue()}
                    </span>
                ),
            },
            {
                accessorKey: 'relatedTo',
                header: t('services.relatedTo'),
                cell: (info: any) => {
                    const val = String(info.getValue() || '');
                    if (!val) return '—';
                    return t(`services.entityTypes.${val.toLowerCase()}`, { defaultValue: val });
                },
            },
            {
                accessorKey: 'category',
                header: t('services.category'),
            },
            {
                accessorKey: 'type',
                header: t('services.type'),
            },
            {
                accessorKey: 'tags',
                header: t('services.tags'),
            },
            {
                accessorKey: 'processingTime',
                header: t('services.processingTime'),
                cell: (info: any) => (
                    <span className="text-center font-mono block text-[#595550]">
                        {info.getValue()}
                    </span>
                ),
            },
            {
                accessorKey: 'frequency',
                header: t('services.frequency'),
                cell: (info: any) => {
                    const val = String(info.getValue() || '');
                    if (!val) return '—';
                    return t(`services.${val.toLowerCase()}`, { defaultValue: val });
                },
            },
            {
                accessorKey: 'fee',
                header: t('services.serviceFee'),
                cell: (info: any) => <span className="font-mono">{info.getValue()}</span>,
            },
            {
                accessorKey: 'delegationRequired',
                header: t('services.delegationRequired'),
                cell: (info: any) => {
                    const val = info.getValue();
                    if (val === 'Yes') return t('common.yes');
                    if (val === 'No') return t('common.no');
                    return val;
                },
            },
            {
                accessorKey: 'validity',
                header: t('services.validity'),
                cell: (info: any) => {
                    const val = info.getValue();
                    if (val === 'Recurring' || val === 'recurring') return t('services.recurring');
                    if (val === 'One Time' || val === 'oneTime' || val === 'one_time') return t('services.oneTime');
                    return val;
                },
            },
            {
                accessorKey: 'sadadAvailable',
                header: t('services.sadadAvailable'),
                cell: (info: any) => {
                    const val = info.getValue();
                    if (val === 'Yes') return t('common.yes');
                    if (val === 'No') return t('common.no');
                    return val;
                },
            },
            {
                accessorKey: 'portal',
                header: t('services.servicePortal'),
            },
            {
                accessorKey: 'createDate',
                header: t('services.createDate'),
                cell: (info: any) => <span className="font-mono text-[#6E6862]" dir="ltr">{info.getValue()}</span>,
            },
            {
                accessorKey: 'createdBy',
                header: t('services.createdBy'),
                cell: (info: any) => {
                    const rawVal = info.getValue();
                    const user =
                        typeof rawVal === 'object' && rawVal !== null
                            ? rawVal
                            : { name: rawVal || 'N/A' };
                    const displayName = user?.name || user?.fullName || 'N/A';
                    const localizedCreator =
                        displayName === 'N/A'
                            ? t('common.notAvailable')
                            : displayName === 'System Admin'
                              ? t('common.systemAdmin')
                              : displayName === 'Admin User'
                                ? t('common.adminUser')
                                : displayName;
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-[#0D0D0D]">
                                {localizedCreator}
                            </span>
                            {user?.email && (
                                <span className="text-[10px] text-[#857E74]" dir="ltr">{user.email}</span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: t('common.status'),
                cell: (info: any) => {
                    const rawStatus = String(info.getValue() || 'Active');
                    const isInactive = rawStatus.toLowerCase() === 'inactive';
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                isInactive
                                    ? 'bg-[#595550]/10 text-[#595550] border-[#595550]/20'
                                    : 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isInactive ? 'bg-[#857E74]' : 'bg-[#2D3F2C]'
                                }`}
                            />
                            {isInactive ? t('common.inactive') : t('common.active')}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }: any) => (
                    <button
                        onClick={() => {
                            setEditingService(row.original);
                            setIsModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition cursor-pointer"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                ),
            },
        ],
        [t]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={servicesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t('pages.services.searchPlaceholder')}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setPageIndex(newPageIndex)}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0);
                }}
                onAddNew={() => {
                    setEditingService(null);
                    setIsModalOpen(true);
                }}
                title="Services"
                addNewLabel={t('pages.services.addLabel')}
            />

            <AddServiceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                }}
                initialData={editingService}
            />
        </div>
    );
};
