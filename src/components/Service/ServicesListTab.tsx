import { useState, useMemo } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { AddServiceModal } from "./AddServiceModal";
import { serviceApi } from "../../api/api";
import { DataTable } from "../DataTable";

export type CreatedByUser = {
    name: string;
    email?: string;
};

export type ServiceItem = {
    id: string;
    code?: string;
    codeName?: string;
    title?: string;
    relatedTo?: string;
    category?: string;
    type?: string;
    tags?: string;
    processingTime?: number | string;
    frequency?: string;
    fee?: number | string;
    delegationRequired?: string | boolean;
    validity?: string;
    sadadAvailable?: string | boolean;
    portal?: string;
    createDate?: string;
    createdBy?: CreatedByUser | string;
    status?: "Active" | "Inactive";
    [key: string]: any;
};

const getDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
        return (
            value
                .map((item) =>
                    typeof item === "object" && item !== null
                        ? item.name || item.title || item.id || ""
                        : String(item)
                )
                .filter(Boolean)
                .join(", ") || "—"
        );
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.title ||
            value.fullName ||
            value.id ||
            "—"
        );
    }

    return String(value);
};

const escapeCsvValue = (value: unknown): string => {
    const text = getDisplayValue(value);
    return `"${text.replace(/"/g, '""')}"`;
};

export const ServicesListTab = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchValue, setSearchValue] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);

    const [editingService, setEditingService] =
        useState<ServiceItem | null>(null);

    const [viewingService, setViewingService] =
        useState<ServiceItem | null>(null);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deletingServiceId, setDeletingServiceId] =
        useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["services", pageIndex, pageSize, searchValue],
        queryFn: () =>
            serviceApi.getServices({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchValue,
            }),
    });

    const servicesList: ServiceItem[] = data?.data || [];
    const totalCount = data?.count ?? 0;

    // DELETE /service/:id
    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteService(id),

        onSuccess: async () => {
            toast.success(
                t("services.messages.deleted", {
                    defaultValue: "Service deleted successfully",
                })
            );

            setDeletingServiceId(null);
            setOpenMenuId(null);

            await queryClient.invalidateQueries({
                queryKey: ["services"],
            });
        },

        onError: (error: any) => {
            setDeletingServiceId(null);

            const message = error?.response?.data?.message;

            toast.error(
                Array.isArray(message)
                    ? message[0]
                    : message ||
                    t("services.messages.deleteFailed", {
                        defaultValue: "Failed to delete service",
                    })
            );
        },
    });

    const handleDelete = (service: ServiceItem) => {
        if (!service.id || deleteMutation.isPending) return;

        const serviceName =
            service.title || service.codeName || service.id;

        const confirmed = window.confirm(
            t("services.messages.confirmDelete", {
                title: serviceName,
                defaultValue: `Are you sure you want to delete "${serviceName}"?`,
            })
        );

        if (!confirmed) return;

        setDeletingServiceId(service.id);
        deleteMutation.mutate(service.id);
    };

    // Export the currently loaded page to Excel-compatible CSV.
    const handleExport = () => {
        if (!servicesList.length) {
            toast.error(
                t("common.noDataToExport", {
                    defaultValue: "No data available to export",
                })
            );
            return;
        }

        const exportColumns: { key: string; label: string }[] = [
            { key: "codeName", label: t("common.codeName") },
            { key: "title", label: t("services.serviceTitle") },
            { key: "relatedTo", label: t("services.relatedTo") },
            { key: "category", label: t("services.category") },
            { key: "type", label: t("services.type") },
            { key: "tags", label: t("services.tags") },
            {
                key: "processingTime",
                label: t("services.processingTime"),
            },
            { key: "frequency", label: t("services.frequency") },
            { key: "fee", label: t("services.serviceFee") },
            {
                key: "delegationRequired",
                label: t("services.delegationRequired"),
            },
            { key: "validity", label: t("services.validity") },
            {
                key: "sadadAvailable",
                label: t("services.sadadAvailable"),
            },
            { key: "portal", label: t("services.servicePortal") },
            { key: "createDate", label: t("services.createDate") },
            { key: "createdBy", label: t("services.createdBy") },
            { key: "status", label: t("common.status") },
        ];

        const csvRows = [
            exportColumns
                .map((column) => escapeCsvValue(column.label))
                .join(","),

            ...servicesList.map((service) =>
                exportColumns
                    .map((column) => {
                        const value =
                            column.key === "codeName"
                                ? service.codeName || service.code
                                : service[column.key];

                        if (
                            column.key === "createdBy" &&
                            typeof value === "object" &&
                            value !== null
                        ) {
                            return escapeCsvValue(
                                value.name ||
                                value.fullName ||
                                value.email
                            );
                        }

                        return escapeCsvValue(value);
                    })
                    .join(",")
            ),
        ];

        // BOM ensures Arabic text displays correctly in Excel.
        const csvContent = "\uFEFF" + csvRows.join("\r\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `services-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success(
            t("common.exportSuccess", {
                defaultValue: "Export completed successfully",
            })
        );
    };

    // Open the shared form in edit mode.
    const openEditModal = (service: ServiceItem) => {
        setOpenMenuId(null);
        setViewingService(null);
        setEditingService(service);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    // Open the same form in read-only view mode.
    const openViewModal = (service: ServiceItem) => {
        setOpenMenuId(null);
        setEditingService(null);
        setViewingService(service);
        setIsViewMode(true);
        setIsModalOpen(true);
    };

    const closeServiceModal = () => {
        setIsModalOpen(false);
        setIsViewMode(false);
        setEditingService(null);
        setViewingService(null);
    };

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={
                            table.getIsAllRowsSelected?.() || false
                        }
                        onChange={
                            table.getToggleAllRowsSelectedHandler?.()
                        }
                        className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                        aria-label="Select all services"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected?.() || false}
                        onChange={row.getToggleSelectedHandler?.()}
                        className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                        aria-label="Select service"
                    />
                ),
            },
            {
                accessorKey: "codeName",
                header: t("common.codeName"),
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-semibold text-[#2D3F2C]">
                        {row.original.codeName ||
                            row.original.code ||
                            "—"}
                    </span>
                ),
            },
            {
                accessorKey: "title",
                header: t("services.serviceTitle"),
                cell: (info) => (
                    <span className="inline-block text-start font-medium text-[#0D0D0D]">
                        {getDisplayValue(info.getValue())}
                    </span>
                ),
            },
            {
                accessorKey: "relatedTo",
                header: t("services.relatedTo"),
                cell: (info) => {
                    const value = String(info.getValue() || "");

                    if (!value) return "—";

                    return t(
                        `services.entityTypes.${value.toLowerCase()}`,
                        { defaultValue: value }
                    );
                },
            },
            {
                id: "category",
                accessorFn: (row) =>
                    row.serviceType?.serviceCategory?.name ??
                    row.category,
                header: t("services.category"),
                cell: (info) => getDisplayValue(info.getValue()),
            },
            {
                accessorKey: "type",
                header: t("services.type"),
                cell: (info) =>
                    getDisplayValue(
                        info.row.original.serviceType?.name ??
                        info.getValue()
                    ),
            },
            {
                accessorKey: "tags",
                header: t("services.tags"),
                cell: (info) => getDisplayValue(info.getValue()),
            },
            {
                accessorKey: "processingTime",
                header: t("services.processingTime"),
                cell: (info) => (
                    <span className="block text-center font-mono text-[#595550]">
                        {getDisplayValue(
                            info.row.original.service_processing_time ??
                            info.getValue()
                        )}
                    </span>
                ),
            },
            {
                accessorKey: "frequency",
                header: t("services.frequency"),
                cell: (info) => {
                    const value = String(
                        info.row.original.service_processing_frequen ??
                        info.getValue() ??
                        ""
                    );

                    if (!value) return "—";

                    return t(`services.${value.toLowerCase()}`, {
                        defaultValue: value,
                    });
                },
            },
            {
                accessorKey: "fee",
                header: t("services.serviceFee"),
                cell: (info) => (
                    <span className="font-mono">
                        {getDisplayValue(
                            info.row.original.service_fees ??
                            info.getValue()
                        )}
                    </span>
                ),
            },
            {
                accessorKey: "delegationRequired",
                header: t("services.delegationRequired"),
                cell: (info) => {
                    const value =
                        info.row.original.delegation_required ??
                        info.getValue();

                    if (
                        value === "Yes" ||
                        value === true ||
                        value === "yes"
                    ) {
                        return t("common.yes");
                    }

                    if (
                        value === "No" ||
                        value === false ||
                        value === "no"
                    ) {
                        return t("common.no");
                    }

                    return getDisplayValue(value);
                },
            },
            {
                accessorKey: "validity",
                header: t("services.validity"),
                cell: (info) => {
                    const value =
                        info.row.original.service_validity ??
                        info.getValue();

                    if (
                        ["Recurring", "recurring"].includes(
                            String(value)
                        )
                    ) {
                        return t("services.recurring");
                    }

                    if (
                        [
                            "One Time",
                            "oneTime",
                            "one_time",
                            "one-time",
                        ].includes(String(value))
                    ) {
                        return t("services.oneTime");
                    }

                    return getDisplayValue(value);
                },
            },
            {
                accessorKey: "sadadAvailable",
                header: t("services.sadadAvailable"),
                cell: (info) => {
                    const value =
                        info.row.original.sadadAvailable ??
                        info.getValue();

                    if (
                        value === "Yes" ||
                        value === true ||
                        value === "yes"
                    ) {
                        return t("common.yes");
                    }

                    if (
                        value === "No" ||
                        value === false ||
                        value === "no"
                    ) {
                        return t("common.no");
                    }

                    return getDisplayValue(value);
                },
            },
            {
                accessorKey: "portal",
                header: t("services.servicePortal"),
                cell: (info) =>
                    getDisplayValue(
                        info.row.original.servicePortal?.name ??
                        info.getValue()
                    ),
            },
            {
                accessorKey: 'createdAt',
                header: t("services.createDate"),
                cell: ({ row }) => {
                    const rawDate = row.original.createdAt;
                    if (!rawDate) return <span className="text-xs text-[#6E6862]">—</span>;

                    const formattedDate = new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    }).format(new Date(rawDate));

                    return (
                        <span className="text-xs text-[#6E6862]">
                            {formattedDate}
                        </span>
                    );
                },
            },
            {
                accessorKey: "createdBy",
                header: t("services.createdBy"),
                cell: (info) => {
                    const rawValue =
                        info.row.original.createdBy ??
                        info.row.original.created_by ??
                        info.getValue();

                    const user =
                        typeof rawValue === "object" &&
                            rawValue !== null
                            ? rawValue
                            : { name: rawValue };

                    const displayName =
                        user?.name || user?.fullName || "";

                    let localizedCreator =
                        displayName || t("common.notAvailable");

                    if (displayName === "System Admin") {
                        localizedCreator = t("common.systemAdmin");
                    } else if (displayName === "Admin User") {
                        localizedCreator = t("common.adminUser");
                    }

                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-[#0D0D0D]">
                                {localizedCreator}
                            </span>

                            {user?.email && (
                                <span className="text-[10px] text-[#857E74]">
                                    {user.email}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: (info) => {
                    const rawStatus = String(
                        info.getValue() || "Active"
                    );

                    const isInactive =
                        rawStatus.toLowerCase() === "inactive";

                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${isInactive
                                ? "border-[#595550]/20 bg-[#595550]/10 text-[#595550]"
                                : "border-[#2D3F2C]/20 bg-[#2D3F2C]/10 text-[#2D3F2C]"
                                }`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${isInactive
                                    ? "bg-[#857E74]"
                                    : "bg-[#2D3F2C]"
                                    }`}
                            />

                            {isInactive
                                ? t("common.inactive")
                                : t("common.active")}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => {
                    const service = row.original;
                    const isMenuOpen =
                        openMenuId === service.id;

                    const isDeleting =
                        deleteMutation.isPending &&
                        deletingServiceId === service.id;

                    return (
                        <div className="relative flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenMenuId((previous) =>
                                        previous === service.id
                                            ? null
                                            : service.id
                                    )
                                }
                                aria-label="Service actions"
                                aria-expanded={isMenuOpen}
                                className="rounded-lg p-2 text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D]"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close actions menu"
                                        className="fixed inset-0 z-20 cursor-default"
                                        onClick={() =>
                                            setOpenMenuId(null)
                                        }
                                    />

                                    <div className="absolute end-0 top-full z-30 mt-1 w-44 rounded-xl border border-[#EAE5DD] bg-white p-1.5 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openViewModal(service)
                                            }
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs text-[#44403C] transition hover:bg-[#F8F6F2]"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {t("common.view", {
                                                defaultValue: "View",
                                            })}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditModal(service)
                                            }
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs text-[#44403C] transition hover:bg-[#F8F6F2]"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            {t("common.edit", {
                                                defaultValue: "Edit",
                                            })}
                                        </button>

                                        <div className="my-1 border-t border-[#F0ECE6]" />

                                        <button
                                            type="button"
                                            disabled={
                                                deleteMutation.isPending
                                            }
                                            onClick={() =>
                                                handleDelete(service)
                                            }
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {isDeleting
                                                ? t("common.submitting", {
                                                    defaultValue:
                                                        "Deleting...",
                                                })
                                                : t("common.delete", {
                                                    defaultValue:
                                                        "Delete",
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
        [
            t,
            openMenuId,
            deletingServiceId,
            deleteMutation.isPending,
        ]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={servicesList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t(
                    "pages.services.searchPlaceholder"
                )}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchValue}
                onSearchChange={(value) => {
                    setSearchValue(value);
                    setPageIndex(0);
                }}
                onAddNew={() => {
                    setEditingService(null);
                    setViewingService(null);
                    setIsViewMode(false);
                    setIsModalOpen(true);
                }}
                title="Services"
                addNewLabel={t("pages.services.addLabel")}
                onExport={handleExport}
            />

            {/* The same form is used for Create, Edit, and View. */}
            <AddServiceModal
                isOpen={isModalOpen}
                onClose={closeServiceModal}
                initialData={
                    isViewMode
                        ? viewingService || undefined
                        : editingService || undefined
                }
                isView={isViewMode}
            />
        </div>
    );
};