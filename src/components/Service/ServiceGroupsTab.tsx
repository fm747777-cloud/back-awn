import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
    Edit2,
    Users,
    Briefcase,
    Building2,
    Truck,
    Wallet,
    ShieldCheck,
    Layers,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";
import { ServiceGroupDrawer } from "./ServiceGroupDrawer";
import {
    GroupType,
    BoardingType,
    ServiceTagStatus,
    type CreateServiceGroupDto,
} from "./serviceGroupTypes";

export interface ServiceGroupItem {
    id: string;
    groupCode: string;
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

const defaultGroups: ServiceGroupItem[] = [
    {
        id: "grp-1",
        groupCode: "GRP-001",
        name: "Corporate & Commercial Services",
        servicesCount: 3,
        description: "Core commercial licenses, registrations and permits",
        createdAt: "2026-01-10",
        status: "active",
        group_icon: "building-2",
        servicePackage_id: "pkg-1",
        group_type: GroupType.BUSINESS,
        boarding_type: BoardingType.OTHER,
        service_ids: ["srv-5", "srv-7", "srv-8"],
    },
    {
        id: "grp-2",
        groupCode: "GRP-002",
        name: "Workforce & Labor Operations",
        servicesCount: 3,
        description: "Labor contracts, Iqama, visa allocations, and Qiwa operations",
        createdAt: "2026-01-12",
        status: "active",
        group_icon: "users",
        servicePackage_id: "pkg-3",
        group_type: GroupType.EMPLOYEE,
        boarding_type: BoardingType.ONBOARDING,
        service_ids: ["srv-1", "srv-2", "srv-4"],
    },
    {
        id: "grp-3",
        groupCode: "GRP-003",
        name: "Assets & Fleet Management",
        servicesCount: 2,
        description: "Vehicle registrations, asset permits, and logistical services",
        createdAt: "2026-01-20",
        status: "active",
        group_icon: "truck",
        servicePackage_id: "pkg-5",
        group_type: GroupType.ASSET,
        boarding_type: BoardingType.TRANSITION,
        service_ids: ["srv-9", "srv-10"],
    },
    {
        id: "grp-4",
        groupCode: "GRP-004",
        name: "Financial & Tax Compliance",
        servicesCount: 2,
        description: "ZATCA, GOSI, wages protection, and bank clearances",
        createdAt: "2026-02-05",
        status: "active",
        group_icon: "wallet",
        servicePackage_id: "pkg-2",
        group_type: GroupType.BUSINESS,
        boarding_type: BoardingType.OTHER,
        service_ids: ["srv-3", "srv-6"],
    },
];

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
    const [groups, setGroups] = useState<ServiceGroupItem[]>(defaultGroups);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ServiceGroupItem | null>(null);

    const filtered = useMemo(() => {
        if (!searchTerm) return groups;
        const term = searchTerm.toLowerCase();
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(term) ||
                g.groupCode.toLowerCase().includes(term) ||
                g.description.toLowerCase().includes(term)
        );
    }, [groups, searchTerm]);

    const handleOpenCreate = () => {
        setEditingGroup(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = (group: ServiceGroupItem) => {
        setEditingGroup(group);
        setIsDrawerOpen(true);
    };

    const handleDeleteGroup = (group: ServiceGroupItem) => {
        setGroups((prev) => prev.filter((g) => g.id !== group.id));
        toast.success(`Service Group "${group.name}" deleted successfully`);
    };

    const handleDrawerSubmit = (dto: CreateServiceGroupDto, id?: string) => {
        const statusValue: 'active' | 'inactive' =
            dto.status === ServiceTagStatus.INACTIVE || dto.status === ServiceTagStatus.REJECTED
                ? 'inactive'
                : 'active';

        if (id) {
            // Edit mode
            setGroups((prev) =>
                prev.map((item) => {
                    if (item.id === id) {
                        const updatedServices = dto.service_ids !== undefined ? dto.service_ids : (item.service_ids || []);
                        return {
                            ...item,
                            name: dto.name,
                            description: dto.description || "",
                            status: statusValue,
                            group_icon: dto.group_icon,
                            servicePackage_id: dto.servicePackage_id,
                            group_type: dto.group_type,
                            boarding_type: dto.boarding_type,
                            service_ids: updatedServices,
                            servicesCount: updatedServices.length,
                        };
                    }
                    return item;
                })
            );
            toast.success("Service Group updated successfully");
        } else {
            // Create mode
            const newGroupNumber = groups.length + 1;
            const initialServices = dto.service_ids || [];
            const newGroup: ServiceGroupItem = {
                id: `grp-${Date.now()}`,
                groupCode: `GRP-${String(newGroupNumber).padStart(3, "0")}`,
                name: dto.name,
                servicesCount: initialServices.length,
                description: dto.description || "",
                createdAt: new Date().toISOString().split("T")[0],
                status: statusValue,
                group_icon: dto.group_icon,
                servicePackage_id: dto.servicePackage_id,
                group_type: dto.group_type,
                boarding_type: dto.boarding_type,
                service_ids: initialServices,
            };
            setGroups((prev) => [newGroup, ...prev]);
            toast.success("Service Group created successfully");
        }

        setIsDrawerOpen(false);
        setEditingGroup(null);
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
                header: "Group Code",
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Group Name",
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[#6A7358] flex items-center justify-center shrink-0 shadow-2xs">
                                {renderGroupIcon(item.group_icon)}
                            </span>
                            <span className="font-medium text-[#0D0D0D]">
                                {item.name}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "servicesCount",
                header: "Linked Services",
                cell: (info) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C]">
                        {info.getValue() as number} Services
                    </span>
                ),
            },
            {
                accessorKey: "description",
                header: "Description",
                cell: (info) => (
                    <span className="text-[#6E6862] max-w-xs truncate block">
                        {(info.getValue() as string) || "—"}
                    </span>
                ),
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
                cell: ({ row }) => {
                    const isGroupActive = row.original.status === 'active';
                    return isGroupActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#595550]/10 text-[#595550] border border-[#595550]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#857E74]" />
                            Inactive
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <TableRowActions
                            recordName={row.original.name}
                            onEdit={() => handleOpenEdit(row.original)}
                            onDelete={() => handleDeleteGroup(row.original)}
                        />
                    </div>
                ),
            },
        ],
        []
    );

    // Initial data for drawer if editing
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

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                count={filtered.length}
                loading={false}
                searchPlaceholder="Search Service Groups..."
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
                addNewLabel="New Service Group"
            />

            {/* Create / Edit Drawer */}
            <ServiceGroupDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingGroup(null);
                }}
                onSubmit={handleDrawerSubmit}
                initialData={drawerInitialData}
            />
        </div>
    );
};
