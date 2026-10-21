
import React, { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    Eye,
    MoreHorizontal,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "../DataTable";
import { AddServicePackageModal } from "./AddServicePackageModal";
import { serviceApi } from "../../api/api";
import type { CreateServicePackageDto } from "../../schemas/serviceSchema";

export type ServicePackageMode = "create" | "edit" | "view";

export interface ServicePackageItem {
    id: string;
    codeName: string;
    name: string;
    servicesIncluded: number;
    billingCycle: string;
    price: number;
    status: "active" | "inactive";
    description?: string;
    group_type?: string;
    service_group_ids: string[];
}

const extractItems = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const getErrorMessage = (error: any, fallback: string) => {
    const message = error?.response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
};

export const ServicePackagesTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ServicePackageMode>("create");
    const [selectedPackage, setSelectedPackage] =
        useState<ServicePackageItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const {
        data: packagesResponse,
        isLoading: isLoadingPackages,
        isError: isPackagesError,
        refetch,
    } = useQuery({
        queryKey: ["service-packages"],
        queryFn: async () => serviceApi.getServicePackages(),
    });

    console.log("packagesResponse", packagesResponse);

    const packages = useMemo<ServicePackageItem[]>(() => {
        return extractItems(packagesResponse).map((item: any) => {
            // The API returns groups inside groupPackages[].group.
            const groups = Array.isArray(item.groupPackages)
                ? item.groupPackages
                    .map((groupPackage: any) => groupPackage?.group)
                    .filter((group: any) => group?.id != null)
                : Array.isArray(item.serviceGroups)
                    ? item.serviceGroups.filter(
                        (group: any) => group?.id != null,
                    )
                    : Array.isArray(item.service_groups)
                        ? item.service_groups.filter(
                            (group: any) => group?.id != null,
                        )
                        : [];

            // Preserve IDs from the response and remove duplicates.
            const serviceGroupIds = Array.from(
                new Set<string>([
                    ...groups.map((group: any) => String(group.id)),
                    ...(Array.isArray(item.service_group_ids)
                        ? item.service_group_ids.map(String)
                        : []),
                ]),
            );

            return {
                id: String(item.id ?? ""),
                codeName:
                    item.codeName ||
                    item.packageCode ||
                    item.package_code ||
                    item.code ||
                    `PKG-${String(item.id ?? "").slice(0, 6)}`,
                name: item.package_name || item.name || "",
                servicesIncluded: serviceGroupIds.length,
                billingCycle:
                    item.billingCycle ||
                    item.billing_cycle ||
                    item.package_type ||
                    item.group_type ||
                    item.groupType ||
                    "Annual",
                price: Number(item.unit_price ?? item.price ?? 0),
                status:
                    String(item.status || "active").toLowerCase() === "inactive"
                        ? "inactive"
                        : "active",
                description: item.description || "",
                group_type:
                    item.package_type ||
                    item.group_type ||
                    item.groupType ||
                    "",
                service_group_ids: serviceGroupIds,
            };
        });
    }, [packagesResponse]);

    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return packages;

        return packages.filter((pkg) => {
            const translatedName = t(
                `packages.packageOptions.${pkg.name}`,
                { defaultValue: pkg.name },
            );

            return (
                pkg.name.toLowerCase().includes(term) ||
                translatedName.toLowerCase().includes(term) ||
                pkg.codeName.toLowerCase().includes(term)
            );
        });
    }, [packages, searchTerm, t]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const currentPageIndex =
        pageCount > 0 ? Math.min(pageIndex, pageCount - 1) : 0;

    const paginatedPackages = useMemo(() => {
        const start = currentPageIndex * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPageIndex, pageSize]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedPackage(null);
        setModalMode("create");
    }, []);

    const openCreate = useCallback(() => {
        setSelectedPackage(null);
        setModalMode("create");
        setOpenMenuId(null);
        setIsModalOpen(true);
    }, []);

    const openEdit = useCallback((pkg: ServicePackageItem) => {
        setSelectedPackage(pkg);
        setModalMode("edit");
        setOpenMenuId(null);
        setIsModalOpen(true);
    }, []);

    const openView = useCallback((pkg: ServicePackageItem) => {
        // Uses the row data already loaded. No details API call is made.
        setSelectedPackage(pkg);
        setModalMode("view");
        setOpenMenuId(null);
        setIsModalOpen(true);
    }, []);

    const refreshPackages = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["service-packages"],
            }),
            queryClient.invalidateQueries({
                queryKey: ["servicePackages"],
            }),
        ]);
    }, [queryClient]);

    const saveMutation = useMutation({
        mutationFn: async ({
            dto,
            id,
        }: {
            dto: CreateServicePackageDto;
            id?: string;
        }) => {
            if (id) {
                return serviceApi.updateServicePackage(id, dto);
            }

            return serviceApi.createServicePackage(dto);
        },
        onSuccess: async (_, variables) => {
            await refreshPackages();

            toast.success(
                variables.id
                    ? t("packages.messages.updated", {
                        defaultValue: "Service package updated successfully",
                    })
                    : t("packages.messages.created", {
                        name: variables.dto.package_name,
                        defaultValue: "Service package created successfully",
                    }),
            );

            closeModal();
        },
        onError: (error: any) => {
            toast.error(
                getErrorMessage(
                    error,
                    t("common.somethingWentWrong", {
                        defaultValue: "Something went wrong",
                    }),
                ),
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServicePackage(id),
        onSuccess: async () => {
            await refreshPackages();

            toast.success(
                t("packages.messages.deleted", {
                    defaultValue: "Service package deleted successfully",
                }),
            );

            setOpenMenuId(null);

            if (selectedPackage) {
                closeModal();
            }
        },
        onError: (error: any) => {
            toast.error(
                getErrorMessage(
                    error,
                    t("packages.messages.deleteError", {
                        defaultValue: "Failed to delete service package",
                    }),
                ),
            );
        },
    });

    const handleDelete = useCallback(
        (pkg: ServicePackageItem) => {
            setOpenMenuId(null);

            const confirmed = window.confirm(
                `Are you sure you want to delete "${pkg.name}"?`,
            );

            if (!confirmed) return;

            deleteMutation.mutate(pkg.id);
        },
        [deleteMutation],
    );

    const handleSubmitPackage = useCallback(async (dto: CreateServicePackageDto) => {
        await saveMutation.mutateAsync({
            dto,
            id: modalMode === "edit" ? selectedPackage?.id : undefined,
        });
    },
        [saveMutation, modalMode, selectedPackage],
    );

    const handleExport = useCallback(() => {
        if (!filtered.length) {
            toast.error(
                t("common.noDataToExport", {
                    defaultValue: "No service packages to export",
                }),
            );
            return;
        }

        const headers = [
            "Package Code",
            "Package Name",
            "Group Type",
            "Service Groups Count",
            "Billing Cycle",
            "Price",
            "Status",
            "Description",
        ];

        const escapeCsv = (value: unknown) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = filtered.map((pkg) => [
            pkg.codeName,
            pkg.name,
            pkg.group_type,
            pkg.servicesIncluded,
            pkg.billingCycle,
            pkg.price,
            pkg.status,
            pkg.description,
        ]);

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "service-packages.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success(
            t("common.exportSuccess", {
                defaultValue: "Service packages exported successfully",
            }),
        );
    }, [filtered, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: "codeName",
                header: t("packages.packageCode"),
                cell: ({ row }) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {row.original.codeName}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("packages.packageName"),
                cell: ({ row }) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {t(`packages.packageOptions.${row.original.name}`, {
                            defaultValue: row.original.name,
                        })}
                    </span>
                ),
            },
            {
                accessorKey: "servicesIncluded",
                header: t("packages.servicesIncluded"),
                cell: ({ row }) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C]">
                        {t("common.servicesCountBadge", {
                            count: row.original.servicesIncluded,
                        })}
                    </span>
                ),
            },
            {
                accessorKey: "billingCycle",
                header: t("packages.billingCycle"),
                cell: ({ row }) => {
                    const value = row.original.billingCycle;

                    return t(`services.${value.toLowerCase()}`, {
                        defaultValue: value,
                    });
                },
            },
            {
                accessorKey: "price",
                header: t("packages.priceSar"),
                cell: ({ row }) => (
                    <span className="font-semibold font-mono text-[#0D0D0D]">
                        {row.original.price.toLocaleString("en-US")}{" "}
                        {t("common.sar")}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => {
                    const active = row.original.status === "active";

                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${active
                                ? "bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/20"
                                : "bg-[#595550]/10 text-[#595550] border-[#595550]/20"
                                }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${active
                                    ? "bg-[#2D3F2C]"
                                    : "bg-[#857E74]"
                                    }`}
                            />
                            {active
                                ? t("common.active")
                                : t("common.inactive")}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: () => (
                    <div className="text-end">{t("common.actions")}</div>
                ),
                cell: ({ row }) => {
                    const pkg = row.original as ServicePackageItem;
                    const menuOpen = openMenuId === pkg.id;

                    return (
                        <div className="relative flex justify-end">
                            <button
                                type="button"
                                aria-label="Open service package actions"
                                aria-expanded={menuOpen}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId((current) =>
                                        current === pkg.id ? null : pkg.id,
                                    );
                                }}
                                className="p-1.5 rounded-md hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition cursor-pointer"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {menuOpen && (
                                <div
                                    className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-[#E5E0D8] bg-white shadow-lg z-30 py-1"
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={() => openView(pkg)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3F3B36] hover:bg-[#FAF8F5]"
                                    >
                                        <Eye size={15} />
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => openEdit(pkg)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3F3B36] hover:bg-[#FAF8F5]"
                                    >
                                        <Pencil size={15} />
                                        Edit
                                    </button>

                                    <div className="my-1 border-t border-[#F0ECE6]" />

                                    <button
                                        type="button"
                                        disabled={deleteMutation.isPending}
                                        onClick={() => handleDelete(pkg)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                },
            },
        ],
        [
            t,
            openMenuId,
            openView,
            openEdit,
            handleDelete,
            deleteMutation.isPending,
        ],
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedPackages}
                count={filtered.length}
                loading={isLoadingPackages}
                searchPlaceholder={t(
                    "pages.servicePackages.searchPlaceholder",
                )}
                pageIndex={currentPageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
                searchValue={searchTerm}
                onSearchChange={(value) => {
                    setSearchTerm(value);
                    setPageIndex(0);
                }}
                onAddNew={openCreate}
                title="Service Packages"
                addNewLabel={t("pages.servicePackages.addLabel")}
                onExport={handleExport}
            />

            {isPackagesError && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <span className="text-xs text-[#B83232]">
                        {t("common.somethingWentWrong", {
                            defaultValue: "Failed to load service packages",
                        })}
                    </span>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="text-xs font-medium text-[#2D3F2C] underline"
                    >
                        {t("common.retry", { defaultValue: "Retry" })}
                    </button>
                </div>
            )}

                <AddServicePackageModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSubmit={handleSubmitPackage}
                    mode={modalMode}
                    initialData={selectedPackage}
                    isSaving={saveMutation.isPending}
                />
        </div>
    );
};

export default ServicePackagesTab;