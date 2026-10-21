
import React, { useState, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    Briefcase,
    Building2,
    Truck,
    Wallet,
    ShieldCheck,
    Layers,
    FileText,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "../DataTable";
import {
    GroupType,
    BoardingType,
    ServiceTagStatus,
} from "./serviceGroupTypes";
import { serviceApi } from "../../api/api";
import ServiceGroupDrawer from "./ServiceGroupDrawer";

export interface ServiceGroupItem {
    id: string;
    codeName?: string;
    name: string;
    servicesCount: number;
    description: string;
    createdAt: string;
    status: "active" | "inactive";
    group_icon?: string;
    servicePackage_id?: string;
    group_type?: GroupType;
    boarding_type?: BoardingType;
    service_ids: string[];
}

export type ServiceGroupDrawerMode = "create" | "edit" | "view";

const renderGroupIcon = (iconName?: string) => {
    switch (iconName) {
        case "users":
            return <Users size={13} className="text-[#2D3F2C]" />;
        case "building-2":
            return <Building2 size={13} className="text-[#2D3F2C]" />;
        case "truck":
            return <Truck size={13} className="text-[#2D3F2C]" />;
        case "wallet":
            return <Wallet size={13} className="text-[#2D3F2C]" />;
        case "shield-check":
            return <ShieldCheck size={13} className="text-[#2D3F2C]" />;
        case "layers":
            return <Layers size={13} className="text-[#2D3F2C]" />;
        case "file-text":
            return <FileText size={13} className="text-[#2D3F2C]" />;
        case "briefcase":
        default:
            return <Briefcase size={13} className="text-[#2D3F2C]" />;
    }
};

const normalizeGroupsResponse = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    return [];
};

/**
 * The API may return:
 * 1. ["service-uuid"]
 * 2. [{ id: "service-uuid", name: "Service" }]
 * 3. [{ id: "relation-uuid", service: { id: "service-uuid" } }]
 *
 * For relation objects, use service.id, NOT the relation's id.
 */
const extractServiceIds = (value: any): string[] => {
    if (!Array.isArray(value)) return [];

    return Array.from(
        new Set(
            value
                .map((item: any) => {
                    if (typeof item === "string") {
                        return item;
                    }

                    if (!item || typeof item !== "object") {
                        return null;
                    }

                    return (
                        item.service?.id ??
                        item.serviceId ??
                        item.service_id ??
                        null
                    );
                })
                .filter(
                    (id: unknown): id is string =>
                        typeof id === "string" && id.length > 0
                )
        )
    );
};

const getGroupServiceRelations = (item: any): any[] => {
    if (Array.isArray(item?.service_ids)) return item.service_ids;
    if (Array.isArray(item?.serviceGroups)) return item.serviceGroups;
    if (Array.isArray(item?.services)) return item.services;
    return [];
};

const getErrorMessage = (error: any) => {
    const message = error?.response?.data?.message || error?.message;
    return Array.isArray(message) ? message[0] : message;
};

export const ServiceGroupsTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] =
        useState<ServiceGroupDrawerMode>("create");
    const [selectedGroup, setSelectedGroup] =
        useState<ServiceGroupItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // FETCH GROUPS
    const {
        data: rawGroups = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["service-groups"],
        queryFn: async () => {
            const response = await serviceApi.getServiceGroup();
            return normalizeGroupsResponse(response);
        },
    });

    // NORMALIZE API RESPONSE
    const groups: ServiceGroupItem[] = useMemo(() => {
        return rawGroups.map((item: any) => {
            const relations = getGroupServiceRelations(item);
            const serviceIds = extractServiceIds(relations);

            // Prefer the actual relation count over a stale servicesCount.
            const servicesCount = relations.length > 0
                ? relations.length
                : Number(item.servicesCount ?? 0);

            const createdAt = item.createdAt
                ? String(item.createdAt).slice(0, 10)
                : "";

            return {
                id: String(item.id),
                codeName:
                    item.codeName ||
                    item.groupCode ||
                    `GRP-${String(item.id || "").substring(0, 4) || "000"}`,
                name: item.name || "",
                servicesCount,
                description: item.description || "",
                createdAt,
                status:
                    String(item.status || "active").toLowerCase() === "inactive"
                        ? "inactive"
                        : "active",
                group_icon: item.group_icon,
                servicePackage_id:
                    item.servicePackage?.id ??
                    item.servicePackage_id ??
                    undefined,
                group_type: item.group_type,
                boarding_type: item.boarding_type,
                service_ids: serviceIds,
            };
        });
    }, [rawGroups]);

    // SEARCH
    const filtered = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return groups;

        return groups.filter((group) => {
            const translatedName = t(`groups.groupOptions.${group.name}`, {
                defaultValue: group.name,
            });

            const translatedDescription = t(
                `groups.groupDescriptions.${group.description}`,
                { defaultValue: group.description }
            );

            return (
                group.name.toLowerCase().includes(term) ||
                translatedName.toLowerCase().includes(term) ||
                (group.codeName || "").toLowerCase().includes(term) ||
                group.description.toLowerCase().includes(term) ||
                translatedDescription.toLowerCase().includes(term)
            );
        });
    }, [groups, searchTerm, t]);

    const pageCount = Math.ceil(filtered.length / pageSize);
    const currentPageIndex =
        pageCount > 0 ? Math.min(pageIndex, pageCount - 1) : 0;

    const paginatedGroups = useMemo(() => {
        const start = currentPageIndex * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPageIndex, pageSize]);

    // DRAWER
    const openDrawer = useCallback(
        (
            mode: ServiceGroupDrawerMode,
            group: ServiceGroupItem | null = null
        ) => {
            setSelectedGroup(group);
            setDrawerMode(mode);
            setOpenMenuId(null);
            setIsDrawerOpen(true);
        },
        []
    );

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setSelectedGroup(null);
        setDrawerMode("create");
    }, []);

    const handleOpenCreate = useCallback(() => {
        openDrawer("create");
    }, [openDrawer]);

    const handleOpenEdit = useCallback(
        (group: ServiceGroupItem) => {
            openDrawer("edit", group);
        },
        [openDrawer]
    );

    const handleOpenView = useCallback(
        (group: ServiceGroupItem) => {
            openDrawer("view", group);
        },
        [openDrawer]
    );

    // DELETE
    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServiceGroup(id),

        onSuccess: async () => {
            toast.success(
                t("groups.messages.deleted", {
                    defaultValue: "Service group deleted successfully",
                })
            );

            setOpenMenuId(null);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["service-groups"],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["serviceGroups"],
                }),
            ]);
        },

        onError: (error: any) => {
            console.error("Failed to delete service group:", error);

            toast.error(
                getErrorMessage(error) ||
                t("groups.messages.deleteError", {
                    defaultValue: "Failed to delete service group",
                })
            );
        },
    });

    const handleDelete = useCallback(
        (group: ServiceGroupItem) => {
            setOpenMenuId(null);

            if (deleteMutation.isPending) return;

            const confirmed = window.confirm(
                `Are you sure you want to delete "${group.name}"?`
            );

            if (confirmed) {
                deleteMutation.mutate(group.id);
            }
        },
        [deleteMutation]
    );

    // EXPORT CSV
    const handleExport = useCallback(() => {
        if (filtered.length === 0) {
            toast.error(
                t("common.noDataToExport", {
                    defaultValue: "No service groups to export",
                })
            );
            return;
        }

        const headers = [
            "Group Code",
            "Group Name",
            "Group Type",
            "Boarding Type",
            "Description",
            "Services Count",
            "Status",
            "Created At",
        ];

        const escapeCsv = (value: unknown) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = filtered.map((group) => [
            group.codeName,
            group.name,
            group.group_type,
            group.boarding_type,
            group.description,
            group.servicesCount,
            group.status,
            group.createdAt,
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
        link.download = "service-groups.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success(
            t("common.exportSuccess", {
                defaultValue: "Service groups exported successfully",
            })
        );
    }, [filtered, t]);

    // TABLE COLUMNS
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: "codeName",
                header: t("groups.groupCode"),
                cell: ({ row }) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {row.original.codeName}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("groups.groupName"),
                cell: ({ row }) => {
                    const item = row.original;

                    return (
                        <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[#6A7358] flex items-center justify-center shrink-0 shadow-2xs">
                                {renderGroupIcon(item.group_icon)}
                            </span>

                            <span className="font-medium text-[#0D0D0D]">
                                {t(`groups.groupOptions.${item.name}`, {
                                    defaultValue: item.name,
                                })}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "servicesCount",
                header: t("groups.linkedServices"),
                cell: (info) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C]">
                        {t("common.servicesCountBadge", {
                            count: info.getValue() as number,
                        })}
                    </span>
                ),
            },
            {
                accessorKey: "description",
                header: t("groups.description"),
                cell: (info) => {
                    const description = info.getValue() as string;

                    return (
                        <span className="text-[#6E6862] max-w-xs truncate block">
                            {description
                                ? t(`groups.groupDescriptions.${description}`, {
                                    defaultValue: description,
                                })
                                : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: t("services.createDate"),
                cell: (info) => (
                    <span className="font-mono text-[#6E6862]" dir="ltr">
                        {(info.getValue() as string) || "—"}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => {
                    const active = row.original.status !== "inactive";

                    return active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            {t("common.active")}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#595550]/10 text-[#595550] border border-[#595550]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#857E74]" />
                            {t("common.inactive")}
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
                    const group = row.original;
                    const menuOpen = openMenuId === group.id;

                    return (
                        <div className="relative flex justify-end">
                            <button
                                type="button"
                                aria-label="Open service group actions"
                                aria-expanded={menuOpen}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId((current) =>
                                        current === group.id ? null : group.id
                                    );
                                }}
                                className="p-1.5 rounded-md hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition cursor-pointer"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {menuOpen && (
                                <div
                                    className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-[#E5E0D8] bg-white shadow-lg z-30 py-1"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleOpenView(group)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3F3B36] hover:bg-[#FAF8F5] transition"
                                    >
                                        <Eye size={15} />
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(group)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#3F3B36] hover:bg-[#FAF8F5] transition"
                                    >
                                        <Pencil size={15} />
                                        Edit
                                    </button>

                                    <div className="my-1 border-t border-[#F0ECE6]" />

                                    <button
                                        type="button"
                                        disabled={deleteMutation.isPending}
                                        onClick={() => handleDelete(group)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50"
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
            handleOpenView,
            handleOpenEdit,
            handleDelete,
            deleteMutation.isPending,
        ]
    );

    // DRAWER INITIAL DATA
    const drawerInitialData = useMemo(() => {
        if (!selectedGroup) return null;

        return {
            id: selectedGroup.id,
            name: selectedGroup.name,
            description: selectedGroup.description,
            group_icon: selectedGroup.group_icon || "briefcase",
            servicePackage_id: selectedGroup.servicePackage_id || "",
            group_type: selectedGroup.group_type || GroupType.EMPLOYEE,
            boarding_type:
                selectedGroup.boarding_type || BoardingType.OTHER,
            status:
                selectedGroup.status === "active"
                    ? ServiceTagStatus.ACTIVE
                    : ServiceTagStatus.INACTIVE,

            // These are actual service UUIDs, not relation UUIDs.
            service_ids: selectedGroup.service_ids,
        };
    }, [selectedGroup]);

    return (
        <div className="space-y-4">
            {isError && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-600">
                        Failed to load service groups.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="text-sm font-medium text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            <DataTable
                columns={columns}
                data={paginatedGroups}
                count={filtered.length}
                loading={isLoading}
                searchPlaceholder={t(
                    "pages.serviceGroups.searchPlaceholder"
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
                onAddNew={handleOpenCreate}
                title="Service Groups"
                addNewLabel={t("pages.serviceGroups.addLabel")}
                onExport={handleExport}
            />

            <ServiceGroupDrawer
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                initialData={drawerInitialData}
                mode={drawerMode}
                isEdit={drawerMode === "edit"}
            />
        </div>
    );
};

export default ServiceGroupsTab;