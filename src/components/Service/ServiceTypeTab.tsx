import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { serviceApi } from "../../api/api";
import { ServiceTypeStatus, AddServiceTypeModal } from "./AddServiceTypeModal";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";

export interface ServiceTypeItem {
    id: string;
    typeCode: string;
    name: string;
    serviceCategory?: {
        id: string;
        name: string;
    };
    createdBy?: string;
    createdAt: string;
    status: ServiceTypeStatus;
}

export const ServiceTypeTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<ServiceTypeItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceTypes", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServiceTypes({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const typesList: ServiceTypeItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const handleDeleteType = async (type: ServiceTypeItem) => {
        await serviceApi.deleteServiceType(type.id);
        queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
        toast.success(`Service Type "${type.name}" deleted successfully`);
    };

    const renderStatusBadge = (status: ServiceTypeStatus) => {
        switch (status) {
            case ServiceTypeStatus.ACTIVE:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                        Active
                    </span>
                );
            case ServiceTypeStatus.INITIATED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8C6046]" />
                        Initiated
                    </span>
                );
            case ServiceTypeStatus.REJECTED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Rejected
                    </span>
                );
            case ServiceTypeStatus.INACTIVE:
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#595550]/10 text-[#595550] border border-[#595550]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#857E74]" />
                        Inactive
                    </span>
                );
        }
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                    />
                ),
            },
            {
                accessorKey: "typeCode",
                header: "Type Code",
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Type Name",
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "serviceCategory",
                header: "Service Category",
                cell: ({ row }) => {
                    const categoryName = row.original.serviceCategory?.name;
                    return categoryName ? (
                        <span className="font-medium text-[#595550]">{categoryName}</span>
                    ) : (
                        <span className="text-[#857E74] italic">N/A</span>
                    );
                },
            },
            {
                accessorKey: "createdBy",
                header: "Created By",
                cell: ({ row }) => {
                    const creator = row.original.createdBy;
                    return creator ? (
                        <div className="font-medium text-[#0D0D0D]">{creator}</div>
                    ) : (
                        <span className="text-[#857E74] italic">undefined</span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: "Create Date",
                cell: (info) => (
                    <span className="text-[#6E6862]">{info.getValue() as string}</span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => renderStatusBadge(row.original.status),
            },
            {
                id: "actions",
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <TableRowActions
                            recordName={row.original.name}
                            onEdit={() => {
                                setEditingType(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeleteType(row.original)}
                        />
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={typesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder="Search Service Types..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => {
                    setEditingType(null);
                    setIsModalOpen(true);
                }}
                title="Service Types"
                addNewLabel="Add Service Type"
            />

            <AddServiceTypeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingType(null);
                }}
                initialData={editingType}
            />
        </div>
    );
};