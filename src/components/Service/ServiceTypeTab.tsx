import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { serviceApi } from "../../api/api";
import { ServiceTypeStatus, AddServiceTypeModal } from "./AddServiceTypeModal";
import { DataTable } from "../DataTable";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const renderStatusBadge = (status: ServiceTypeStatus) => {
        switch (status) {
            case ServiceTypeStatus.ACTIVE:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                    </span>
                );
            case ServiceTypeStatus.INITIATED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Initiated
                    </span>
                );
            case ServiceTypeStatus.REJECTED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Rejected
                    </span>
                );
            case ServiceTypeStatus.INACTIVE:
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
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
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20"
                    />
                ),
            },
            {
                accessorKey: "typeCode",
                header: "Type Code",
                cell: (info) => (
                    <span className="font-medium text-slate-800">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Type Name",
                cell: (info) => (
                    <span className="font-medium text-slate-700">
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
                        <span className="font-medium text-slate-700">{categoryName}</span>
                    ) : (
                        <span className="text-slate-400 italic">N/A</span>
                    );
                },
            },
            {
                accessorKey: "createdBy",
                header: "Created By",
                cell: ({ row }) => {
                    const creator = row.original.createdBy;
                    return creator ? (
                        <div className="font-medium text-slate-800">{creator}</div>
                    ) : (
                        <span className="text-slate-400 italic">undefined</span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: "Create Date",
                cell: (info) => (
                    <span className="text-slate-500">{info.getValue() as string}</span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => renderStatusBadge(row.original.status),
            },
            {
                id: "actions",
                header: () => <div className="text-right">•••</div>,
                cell: () => (
                    <div className="text-right text-slate-400 cursor-pointer hover:text-slate-600 font-bold">
                        •••
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="p-6 bg-slate-100/60 min-h-screen">
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
                onAddNew={() => setIsModalOpen(true)}
                title="Add Service Type"
            />

            <AddServiceTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};