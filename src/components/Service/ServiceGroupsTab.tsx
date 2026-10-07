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
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import {
    GroupType,
    BoardingType,
    ServiceTagStatus,
    type CreateServiceGroupDto,
} from "./serviceGroupTypes";
import { serviceApi } from "../../api/api";
import ServiceGroupDrawer from "./ServiceGroupDrawer";

export interface ServiceGroupItem {
    id: string;
    groupCode?: string;
    name: string;
    servicesCount: number;
    description: string;
    createdAt: string;
    status: 'active' | 'inactive';
    group_icon?: string;
    servicePackage_id?: string;
    group_type?: GroupType;
    boarding_type?: BoardingType;
    service_ids?: string[];
}

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

export const ServiceGroupsTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ServiceGroupItem | null>(null);

    // 1. Fetching Data using TanStack Query
    const { data: rawGroups = [], isLoading } = useQuery({
        queryKey: ["service-groups"],
        queryFn: async () => {
            const res = await serviceApi.getServiceGroup();
            return Array.isArray(res) ? res : res?.data || [];
        },
    });

    // Transform backend data to match ServiceGroupItem interface
    const groups: ServiceGroupItem[] = useMemo(() => {
        return rawGroups.map((item: any) => ({
            id: item.id,
            groupCode: item.groupCode || `GRP-${item.id?.substring(0, 4) || '000'}`,
            name: item.name,
            servicesCount: Array.isArray(item.services) ? item.services.length : 0,
            description: item.description || "",
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "",
            status: item.status === ServiceTagStatus.ACTIVE ? 'active' : 'inactive',
            group_icon: item.group_icon,
            servicePackage_id: item.servicePackage?.id || item.servicePackage_id,
            group_type: item.group_type,
            boarding_type: item.boarding_type,
            service_ids: item.services ? item.services.map((s: any) => s.id) : [],
        }));
    }, [rawGroups]);

    // 2. Create Mutation
    const createMutation = useMutation({
        mutationFn: (dto: CreateServiceGroupDto) => serviceApi.createServiceGroup(dto),
        onSuccess: () => {
            toast.success(t("groups.messages.created"));
            queryClient.invalidateQueries({ queryKey: ["service-groups"] });
            setIsDrawerOpen(false);
            setEditingGroup(null);
        },
        onError: (error) => {
            console.error("Failed to create service group:", error);
            toast.error(t("groups.messages.createError", { defaultValue: "Failed to create group" }));
        },
    });

    // 3. Update Mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: CreateServiceGroupDto }) => {
            return serviceApi.updateServiceGroup(id, dto)
        }
        ,
        onSuccess: () => {
            toast.success(t("groups.messages.updated"));
            queryClient.invalidateQueries({ queryKey: ["service-groups"] });
            setIsDrawerOpen(false);
            setEditingGroup(null);
        },
        onError: (error) => {
            console.error("Failed to update service group:", error);
            toast.error(t("groups.messages.updateError", { defaultValue: "Failed to update group" }));
        },
    });

    const filtered = useMemo(() => {
        if (!searchTerm) return groups;
        const term = searchTerm.toLowerCase();
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(term) ||
                t(`groups.groupOptions.${g.name}`, { defaultValue: g.name }).toLowerCase().includes(term) ||
                (g.groupCode && g.groupCode.toLowerCase().includes(term)) ||
                g.description.toLowerCase().includes(term) ||
                t(`groups.groupDescriptions.${g.description}`, { defaultValue: g.description }).toLowerCase().includes(term)
        );
    }, [groups, searchTerm, t]);

    const handleOpenCreate = () => {
        setEditingGroup(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = useCallback((group: ServiceGroupItem) => {
        setEditingGroup(group);
        setIsDrawerOpen(true);
    }, []);

    const handleDrawerSubmit = (dto: CreateServiceGroupDto, id?: string) => {
        if (id) {
            updateMutation.mutate({ id, dto });
        } else {
            createMutation.mutate(dto);
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
                accessorKey: "groupCode",
                header: t("groups.groupCode"),
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {(info.getValue() as string) || "—"}
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
                                {t(`groups.groupOptions.${item.name}`, { defaultValue: item.name })}
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
                        {t("common.servicesCountBadge", { count: info.getValue() as number })}
                    </span>
                ),
            },
            {
                accessorKey: "description",
                header: t("groups.description"),
                cell: (info) => {
                    const desc = info.getValue() as string;
                    return (
                        <span className="text-[#6E6862] max-w-xs truncate block">
                            {desc ? t(`groups.groupDescriptions.${desc}`, { defaultValue: desc }) : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: t("services.createDate"),
                cell: (info) => (
                    <span className="font-mono text-[#6E6862]" dir="ltr">{(info.getValue() as string) || "—"}</span>
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => {
                    const isGroupActive = true;
                    return isGroupActive ? (
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
                header: () => <div className="text-end">{t("common.actions")}</div>,
                cell: ({ row }) => (
                    <div className="text-end">
                        <button
                            onClick={() => handleOpenEdit(row.original)}
                            className="p-1 rounded hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition cursor-pointer"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [t, handleOpenEdit]
    );

    const drawerInitialData: (CreateServiceGroupDto & { id: string }) | null = editingGroup
        ? {
            id: editingGroup.id,
            name: editingGroup.name,
            description: editingGroup.description,
            group_icon: editingGroup.group_icon || "briefcase",
            servicePackage_id: editingGroup.servicePackage_id || "",
            group_type: editingGroup.group_type || GroupType.EMPLOYEE,
            boarding_type: editingGroup.boarding_type || BoardingType.OTHER,
            status:
                editingGroup.status === "active"
                    ? ServiceTagStatus.ACTIVE
                    : ServiceTagStatus.INACTIVE,
            service_ids: editingGroup.service_ids || [],
        }
        : null;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                count={filtered.length}
                loading={isLoading}
                searchPlaceholder={t("pages.serviceGroups.searchPlaceholder")}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={(val) => {
                    setSearchTerm(val);
                    setPageIndex(0);
                }}
                onAddNew={handleOpenCreate}
                title="Service Groups"
                addNewLabel={t("pages.serviceGroups.addLabel")}
            />

            <ServiceGroupDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    if (!isSubmitting) {
                        setIsDrawerOpen(false);
                        setEditingGroup(null);
                    }
                }}
                // onSubmit={handleDrawerSubmit}
                initialData={drawerInitialData}
            />
        </div>
    );
};