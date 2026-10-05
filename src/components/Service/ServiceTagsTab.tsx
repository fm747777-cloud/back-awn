import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { serviceApi } from "../../api/api";
import { AddServiceTagModal, ServiceTagStatus } from "./AddServiceTagModal";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";

export interface ServiceTagItem {
    id: string;
    tagCode: string;
    name: string;
    createdBy?: string;
    createdAt: string;
    status: ServiceTagStatus;
}

export const ServiceTagsTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<ServiceTagItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceTags", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServiceTags({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const tagsList: ServiceTagItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const handleDeleteTag = useCallback(
        async (tag: ServiceTagItem) => {
            await serviceApi.deleteServiceTag(tag.id);
            queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
            toast.success(t("tags.messages.deleted", { name: tag.name }));
        },
        [queryClient, t]
    );

    const renderStatusBadge = useCallback(
        (status: ServiceTagStatus) => {
            switch (status) {
                case ServiceTagStatus.ACTIVE:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            {t("common.active")}
                        </span>
                    );
                case ServiceTagStatus.INITIATED:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C6046]" />
                            {t("common.initiated")}
                        </span>
                    );
                case ServiceTagStatus.REJECTED:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {t("common.rejected")}
                        </span>
                    );
                case ServiceTagStatus.INACTIVE:
                default:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#595550]/10 text-[#595550] border border-[#595550]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#857E74]" />
                            {t("common.inactive")}
                        </span>
                    );
            }
        },
        [t]
    );

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
                header: t("tags.tagCode"),
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {(info.getValue() as string) || (info.row.original.id ? String(info.row.original.id).slice(0, 8).toUpperCase() : "—")}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("tags.tagName"),
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "createdBy",
                header: t("services.createdBy"),
                cell: ({ row }) => {
                    const creator = row.original.createdBy;
                    const displayCreator =
                        creator === "Admin User"
                            ? t("common.adminUser")
                            : creator === "System Admin"
                            ? t("common.systemAdmin")
                            : creator === "Super Admin"
                            ? t("common.superAdmin")
                            : creator;
                    return displayCreator ? (
                        <div>
                            <div className="font-medium text-[#0D0D0D]">{displayCreator}</div>
                        </div>
                    ) : (
                        <span className="text-[#857E74] italic">{t("common.notAvailable")}</span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: t("services.createDate"),
                cell: (info) => {
                    const val = info.getValue() as string;
                    return (
                        <span className="font-mono text-[#6E6862]" dir="ltr">
                            {val ? String(val).split("T")[0] : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => renderStatusBadge(row.original.status),
            },
            {
                id: "actions",
                header: () => <div className="text-end">{t("common.actions")}</div>,
                cell: ({ row }) => (
                    <div className="text-end">
                        <TableRowActions
                            recordName={row.original.name}
                            onEdit={() => {
                                setEditingTag(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeleteTag(row.original)}
                        />
                    </div>
                ),
            },
        ],
        [t, renderStatusBadge, handleDeleteTag]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={tagsList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t("pages.serviceTags.searchPlaceholder")}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => {
                    setEditingTag(null);
                    setIsModalOpen(true);
                }}
                title="Service Tags"
                addNewLabel={t("pages.serviceTags.addLabel")}
            />

            <AddServiceTagModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTag(null);
                }}
                initialData={editingTag}
            />
        </div>
    );
};
