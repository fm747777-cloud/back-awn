import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { serviceApi } from "../../api/api";
import { DataTable } from "../DataTable";
import { AddServicePortalModal } from "./AddServicePortalModal";

export interface ServiceTagItem {
    id: string;
    tagCode: string;
    name: string;
    createdBy?: string
    createdAt: string;
}

export const ServicePortalsTab: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceTags", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServicePortals({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });
    console.log('data', data);

    const PortalsList: ServiceTagItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const renderStatusBadge = () => {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                Active
            </span>
        );
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
                accessorKey: "tagCode",
                header: "Portal Code",
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Portal Name",
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "createdBy",
                header: "Created By",
                cell: ({ row }) => {
                    const creator = row.original.createdBy;
                    return creator ? (
                        <div>
                            <div className="font-medium text-[#0D0D0D]">{creator}</div>
                        </div>
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
                cell: () => renderStatusBadge(),
            },
            {
                id: "actions",
                header: () => <div className="text-right">•••</div>,
                cell: () => (
                    <div className="text-right text-[#857E74] cursor-pointer hover:text-[#0D0D0D] font-bold p-1">
                        •••
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
                data={PortalsList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder="Search Service Portals..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => setIsModalOpen(true)}
                title="Service Portals"
                addNewLabel="Add Service Portal"
            />

            <AddServicePortalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};