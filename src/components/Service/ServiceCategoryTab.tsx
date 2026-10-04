import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { serviceApi } from "../../api/api";
import { AddServiceCategoryModal, ServiceCategoryStatus } from "./AddServiceCategoryModal";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";

export interface ServiceCategoryItem {
    id: string;
    tagCode: string;
    name: string;
    createdBy?: string;
    createdAt: string;
    status: ServiceCategoryStatus;
}

export const ServiceCategoryTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ServiceCategoryItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceCategories", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServiceCategories({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const categoryList: ServiceCategoryItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const handleDeleteCategory = async (category: ServiceCategoryItem) => {
        await serviceApi.deleteServiceCategory(category.id);
        queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
        toast.success(`Service Category "${category.name}" deleted successfully`);
    };

    const renderStatusBadge = (status: ServiceCategoryStatus) => {
        switch (status) {
            case ServiceCategoryStatus.ACTIVE:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                        Active
                    </span>
                );
            case ServiceCategoryStatus.INITIATED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8C6046]" />
                        Initiated
                    </span>
                );
            case ServiceCategoryStatus.REJECTED:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Rejected
                    </span>
                );
            case ServiceCategoryStatus.INACTIVE:
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
                accessorKey: "tagCode",
                header: "Category Code",
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Category Name",
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
                                setEditingCategory(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeleteCategory(row.original)}
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
                data={categoryList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder="Search Service Categories..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => {
                    setEditingCategory(null);
                    setIsModalOpen(true);
                }}
                title="Service Categories"
                addNewLabel="Add Category"
            />

            <AddServiceCategoryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                }}
                initialData={editingCategory}
            />
        </div>
    );
};