import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AddServiceModal } from './AddServiceModal';
import { serviceApi } from '../../api/api';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';
import { TableRowActions } from '../TableRowActions';

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
    const queryClient = useQueryClient();
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    // React Query لجلب البيانات تلقائياً عند تغيير الصفحة أو البحث
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
    const totalCount = data?.total || 0;

    const handleDeleteService = async (service: ServiceItem) => {
        await serviceApi.deleteService(service.id);
        queryClient.invalidateQueries({ queryKey: ['services'] });
        toast.success(`Service "${service.title}" deleted successfully`);
    };

    // تعريف أعمدة TanStack Table
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
                header: 'Service Code',
                cell: (info: any) => <span className="font-semibold font-mono text-xs text-[#2D3F2C]">{info.getValue()}</span>,
            },
            {
                accessorKey: 'title',
                header: 'Service Title',
                cell: (info: any) => (
                    <span className="font-medium text-[#0D0D0D] dir-rtl inline-block text-right">
                        {info.getValue()}
                    </span>
                ),
            },
            {
                accessorKey: 'relatedTo',
                header: 'Service Related To',
            },
            {
                accessorKey: 'category',
                header: 'Category',
            },
            {
                accessorKey: 'type',
                header: 'Type',
            },
            {
                accessorKey: 'tags',
                header: 'Tags',
            },
            {
                accessorKey: 'processingTime',
                header: 'Processing Time',
                cell: (info: any) => <span className="text-center block text-[#595550]">{info.getValue()}</span>,
            },
            {
                accessorKey: 'frequency',
                header: 'Frequency',
            },
            {
                accessorKey: 'fee',
                header: 'Service Fee',
            },
            {
                accessorKey: 'delegationRequired',
                header: 'Delegation Required',
            },
            {
                accessorKey: 'validity',
                header: 'Service Validity / Frequency',
            },
            {
                accessorKey: 'sadadAvailable',
                header: 'Sadad Payment Available',
            },
            {
                accessorKey: 'portal',
                header: 'Service Portal',
            },
            {
                accessorKey: 'createDate',
                header: 'Create Date',
            },
            {
                accessorKey: 'createdBy',
                header: 'Created By',
                cell: (info: any) => {
                    const rawVal = info.getValue();
                    const user = typeof rawVal === 'object' && rawVal !== null ? rawVal : { name: rawVal || 'N/A' };
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-[#0D0D0D]">{user?.name || user?.fullName || 'N/A'}</span>
                            {user?.email && <span className="text-[10px] text-[#857E74]">{user.email}</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: (info: any) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]"></span>
                        {info.getValue()}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }: any) => (
                    <div className="text-right">
                        <TableRowActions
                            recordName={row.original.title}
                            onEdit={() => {
                                setEditingService(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeleteService(row.original)}
                        />
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-4">
            {/* TanStack Table Integration */}
            <DataTable
                columns={columns}
                data={servicesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder="Search Services..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(newPageIndex) => setPageIndex(newPageIndex)}
                searchValue={searchValue}
                onSearchChange={(val) => {
                    setSearchValue(val);
                    setPageIndex(0); // إعادة ضبط الصفحة إلى 0 عند إجراء بحث جديد
                }}
                onAddNew={() => {
                    setEditingService(null);
                    setIsModalOpen(true);
                }}
                title="Services"
                addNewLabel="Add Service"
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