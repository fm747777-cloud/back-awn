
import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { serviceApi } from "../../api/api";
import {
    ServiceTypeStatus,
    AddServiceTypeModal,
    type ServiceTypeDrawerMode,
} from "./AddServiceTypeModal";
import { DataTable } from "../DataTable";

export interface ServiceTypeItem {
    id: string;
    codeName: string;
    name: string;
    description?: string;
    serviceCategory?: {
        id: string;
        name: string;
    };
    serviceCategory_id?: string;
    createdBy?: string;
    createdAt: string;
    status: ServiceTypeStatus;
}

export const ServiceTypeTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] =
        useState<ServiceTypeDrawerMode>("create");
    const [selectedType, setSelectedType] =
        useState<ServiceTypeItem | null>(null);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] =
        useState<ServiceTypeItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceTypes", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServiceTypes({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const typesList: ServiceTypeItem[] = useMemo(
        () => data?.data ?? [],
        [data],
    );

    const totalCount = data?.count ?? 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const openDrawer = (
        mode: ServiceTypeDrawerMode,
        item?: ServiceTypeItem,
    ) => {
        setOpenMenuId(null);
        setSelectedType(item ?? null);
        setDrawerMode(mode);
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedType(null);
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServiceType(id),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["serviceTypes"],
            });

            setDeleteTarget(null);
            setOpenMenuId(null);
            toast.success(
                t("common.deletedSuccessfully", {
                    defaultValue: "Service type deleted successfully",
                }),
            );
        },

        onError: (error) => {
            console.error("Failed to delete service type:", error);
            toast.error(
                t("common.deleteFailed", {
                    defaultValue: "Failed to delete service type",
                }),
            );
        },
    });

    const renderStatusBadge = useCallback(
        (status: ServiceTypeStatus) => {
            switch (status) {
                case ServiceTypeStatus.ACTIVE:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#2D3F2C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2D3F2C]" />
                            {t("common.active")}
                        </span>
                    );

                case ServiceTypeStatus.INITIATED:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8C6046]/20 bg-[#8C6046]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#8C6046]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8C6046]" />
                            {t("common.initiated")}
                        </span>
                    );

                case ServiceTypeStatus.REJECTED:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {t("common.rejected")}
                        </span>
                    );

                default:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#595550]/20 bg-[#595550]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#595550]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#857E74]" />
                            {t("common.inactive")}
                        </span>
                    );
            }
        },
        [t],
    );

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            // {
            //     id: "select",
            //     header: ({ table }) => (
            //         <input
            //             type="checkbox"
            //             checked={table.getIsAllRowsSelected()}
            //             onChange={table.getToggleAllRowsSelectedHandler()}
            //             aria-label="Select all rows"
            //             className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
            //         />
            //     ),
            //     cell: ({ row }) => (
            //         <input
            //             type="checkbox"
            //             checked={row.getIsSelected()}
            //             onChange={row.getToggleSelectedHandler()}
            //             aria-label={`Select ${row.original.name}`}
            //             className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
            //         />
            //     ),
            // },
            {
                accessorKey: "codeName",
                header: t("types.typeCode"),
                cell: (info: any) => (
                    <span className="font-mono text-xs font-semibold text-[#2D3F2C]">
                        {info.row.original.codeName}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("types.typeName"),
                cell: (info: any) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "serviceCategory",
                header: t("types.serviceCategory"),
                cell: ({ row }) => {
                    const categoryName =
                        row.original.serviceCategory?.name;

                    return categoryName ? (
                        <span className="font-medium text-[#595550]">
                            {categoryName}
                        </span>
                    ) : (
                        <span className="italic text-[#857E74]">
                            {t("common.notAvailable")}
                        </span>
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
                        <span className="font-medium text-[#0D0D0D]">
                            {displayCreator}
                        </span>
                    ) : (
                        <span className="italic text-[#857E74]">
                            {t("common.notAvailable")}
                        </span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: t("services.createDate"),
                cell: (info) => {
                    const value = info.getValue() as string;

                    return (
                        <span className="font-mono text-[#6E6862]" dir="ltr">
                            {value ? String(value).split("T")[0] : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) =>
                    renderStatusBadge(row.original.status),
            },
            {
                id: "actions",
                header: () => (
                    <div className="text-end">{t("common.actions")}</div>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    const isMenuOpen = openMenuId === item.id;

                    return (
                        <div className="relative flex justify-end">
                            <button
                                type="button"
                                aria-label={t("common.actions")}
                                aria-haspopup="menu"
                                aria-expanded={isMenuOpen}
                                onClick={() =>
                                    setOpenMenuId((current) =>
                                        current === item.id
                                            ? null
                                            : item.id,
                                    )
                                }
                                className="rounded-lg p-2 text-[#857E74] transition hover:bg-[#F5F2EC] hover:text-[#0D0D0D]"
                            >
                                <MoreHorizontal size={18} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close actions menu"
                                        className="fixed inset-0 z-40 cursor-default"
                                        onClick={() => setOpenMenuId(null)}
                                    />

                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white p-1.5 shadow-xl"
                                    >
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() =>
                                                openDrawer("view", item)
                                            }
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm text-[#45413C] transition hover:bg-[#F5F2EC]"
                                        >
                                            <Eye
                                                size={16}
                                                className="text-[#6E6862]"
                                            />
                                            {t("common.view", {
                                                defaultValue: "View",
                                            })}
                                        </button>

                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() =>
                                                openDrawer("edit", item)
                                            }
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm text-[#45413C] transition hover:bg-[#F5F2EC]"
                                        >
                                            <Pencil
                                                size={16}
                                                className="text-[#2D3F2C]"
                                            />
                                            {t("common.edit", {
                                                defaultValue: "Edit",
                                            })}
                                        </button>

                                        <div className="my-1 border-t border-[#F0ECE6]" />

                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                                setOpenMenuId(null);
                                                setDeleteTarget(item);
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-start text-sm text-[#B83232] transition hover:bg-rose-50"
                                        >
                                            <Trash2 size={16} />
                                            {t("common.delete", {
                                                defaultValue: "Delete",
                                            })}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                },
            },
        ],
        [t, renderStatusBadge, openMenuId],
    );

    const handleExport = useCallback(() => {
        if (!typesList.length) {
            toast.error("No service types to export");
            return;
        }

        const headers = [
            "Type Code",
            "Type Name",
            "Service Category",
            "Created By",
            "Created At",
            "Status",
        ];

        const escapeCsv = (value: unknown) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = typesList.map((item) => [
            item.codeName,
            item.name,
            item.serviceCategory?.name,
            item.createdBy,
            item.createdAt
                ? String(item.createdAt).split("T")[0]
                : "",
            item.status,
        ]);

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\r\n");

        // UTF-8 BOM for correct Arabic display in Excel.
        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "service-types.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }, [typesList]);

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={typesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t(
                    "pages.serviceTypes.searchPlaceholder",
                )}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => openDrawer("create")}
                title="Service Types"
                addNewLabel={t("pages.serviceTypes.addLabel")}
                onExport={handleExport}
            />

            <AddServiceTypeModal
                isOpen={isDrawerOpen}
                mode={drawerMode}
                initialData={selectedType}
                onClose={closeDrawer}
            />

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0D0D0D]/40 p-4 backdrop-blur-[2px]"
                    role="presentation"
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-service-type-title"
                        className="w-full max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#B83232]">
                                <AlertTriangle size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3
                                    id="delete-service-type-title"
                                    className="text-base font-bold text-[#0D0D0D]"
                                >
                                    {t("common.confirmDelete", {
                                        defaultValue: "Confirm deletion",
                                    })}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-[#6E6862]">
                                    {t("common.deleteConfirmation", {
                                        defaultValue:
                                            "Are you sure you want to delete this service type?",
                                    })}
                                </p>

                                <p className="mt-2 break-words text-sm font-semibold text-[#0D0D0D]">
                                    {deleteTarget.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label={t("common.close")}
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg p-1.5 text-[#857E74] transition hover:bg-[#F5F2EC]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-[#D6CFC4] bg-white px-4 py-2.5 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:opacity-50"
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                    if (
                                        !deleteTarget?.id ||
                                        deleteMutation.isPending
                                    ) {
                                        return;
                                    }

                                    deleteMutation.mutate(deleteTarget.id);
                                }}
                                className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg bg-[#B83232] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#982626] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteMutation.isPending && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                )}

                                {deleteMutation.isPending
                                    ? t("common.submitting")
                                    : t("common.delete", {
                                        defaultValue: "Delete",
                                    })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};