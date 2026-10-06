import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { MoreHorizontal } from "lucide-react";
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
    const { t } = useTranslation();
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

    const renderStatusBadge = useCallback(
        (status: ServiceTypeStatus) => {
            switch (status) {
                case ServiceTypeStatus.ACTIVE:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            {t("common.active")}
                        </span>
                    );
                case ServiceTypeStatus.INITIATED:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#8C6046]/10 text-[#8C6046] border border-[#8C6046]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C6046]" />
                            {t("common.initiated")}
                        </span>
                    );
                case ServiceTypeStatus.REJECTED:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {t("common.rejected")}
                        </span>
                    );
                case ServiceTypeStatus.INACTIVE:
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
                accessorKey: "typeCode",
                header: t("types.typeCode"),
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {(info.getValue() as string) || (info.row.original.id ? String(info.row.original.id).slice(0, 8).toUpperCase() : "—")}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("types.typeName"),
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "serviceCategory",
                header: t("types.serviceCategory"),
                cell: ({ row }) => {
                    const categoryName = row.original.serviceCategory?.name;
                    return categoryName ? (
                        <span className="font-medium text-[#595550]">{categoryName}</span>
                    ) : (
                        <span className="text-[#857E74] italic">{t("common.notAvailable")}</span>
                    );
                },
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
                        <div className="font-medium text-[#0D0D0D]">{displayCreator}</div>
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
                        <button
                            onClick={() => {
                                setEditingType(row.original);
                                setIsModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition cursor-pointer"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [t, renderStatusBadge]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={typesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t("pages.serviceTypes.searchPlaceholder")}
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
                addNewLabel={t("pages.serviceTypes.addLabel")}
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
