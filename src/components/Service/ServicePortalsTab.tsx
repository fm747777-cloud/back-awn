import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { serviceApi } from "../../api/api";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";
import { AddServicePortalModal } from "./AddServicePortalModal";

export interface ServiceTagItem {
    id: string;
    tagCode: string;
    name: string;
    createdBy?: string;
    createdAt: string;
    url?: string;
    description?: string;
    contact_number?: string;
    email?: string;
}

export const ServicePortalsTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPortal, setEditingPortal] = useState<any | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["servicePortals", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServicePortals({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const PortalsList: ServiceTagItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const handleDeletePortal = async (portal: any) => {
        await serviceApi.deleteServicePortal(portal.id);
        queryClient.invalidateQueries({ queryKey: ["servicePortals"] });
        queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
        toast.success(`Service Portal "${portal.name}" deleted successfully`);
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
                        <span className="text-[#857E74] italic">System Admin</span>
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
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }: any) => (
                    <div className="text-right">
                        <TableRowActions
                            recordName={row.original.name}
                            onEdit={() => {
                                setEditingPortal(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeletePortal(row.original)}
                        />
                    </div>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                onAddNew={() => {
                    setEditingPortal(null);
                    setIsModalOpen(true);
                }}
                title="Service Portals"
                addNewLabel="Add Service Portal"
            />

            <AddServicePortalModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingPortal(null);
                }}
                initialData={editingPortal}
            />
        </div>
    );
};
