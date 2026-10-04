import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { TableRowActions } from "../TableRowActions";
import { AddServicePackageModal } from "./AddServicePackageModal";
import type { CreateServicePackageDto } from "../../schemas/serviceSchema";

export interface ServicePackageItem {
    id: string;
    packageCode: string;
    name: string;
    servicesIncluded: number;
    billingCycle: string;
    price: number;
    status: 'active' | 'inactive';
}

const defaultPackages: ServicePackageItem[] = [
    {
        id: "pkg-1",
        packageCode: "PKG-001",
        name: "Enterprise Corporate Bundle",
        servicesIncluded: 18,
        billingCycle: "Annual",
        price: 24000,
        status: "active",
    },
    {
        id: "pkg-2",
        packageCode: "PKG-002",
        name: "SME Comprehensive Support",
        servicesIncluded: 10,
        billingCycle: "Annual",
        price: 12000,
        status: "active",
    },
    {
        id: "pkg-3",
        packageCode: "PKG-003",
        name: "Workforce & Labor Package",
        servicesIncluded: 8,
        billingCycle: "Quarterly",
        price: 4500,
        status: "active",
    },
    {
        id: "pkg-4",
        packageCode: "PKG-004",
        name: "Licensing & Permits Essentials",
        servicesIncluded: 5,
        billingCycle: "Monthly",
        price: 1500,
        status: "active",
    },
];

export const ServicePackagesTab: React.FC = () => {
    const [packages, setPackages] = useState<ServicePackageItem[]>(defaultPackages);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackageItem | null>(null);

    const filtered = useMemo(() => {
        if (!searchTerm) return packages;
        return packages.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.packageCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [packages, searchTerm]);

    const handleCreateOrUpdatePackage = (
        dto: CreateServicePackageDto,
        meta?: { service_group_id: string; group_name?: string }
    ) => {
        if (editingPackage) {
            setPackages((prev) =>
                prev.map((item) =>
                    item.id === editingPackage.id
                        ? {
                              ...item,
                              name: dto.package_name,
                              price: dto.unit_price,
                              status: (dto.status?.toLowerCase() as 'active' | 'inactive') || item.status,
                          }
                        : item
                )
            );
            toast.success(`Service package "${dto.package_name}" updated successfully`);
            setEditingPackage(null);
            setIsModalOpen(false);
            return;
        }

        const nextCodeNum = packages.length + 1;
        const newPackage: ServicePackageItem = {
            id: `pkg-${Date.now()}`,
            packageCode: `PKG-00${nextCodeNum}`,
            name: dto.package_name,
            servicesIncluded: 0,
            billingCycle: "Annual",
            price: dto.unit_price,
            status: (dto.status?.toLowerCase() as 'active' | 'inactive') || 'active',
        };

        setPackages((prev) => [newPackage, ...prev]);
        const groupLabel = meta?.group_name ? ` for "${meta.group_name}"` : "";
        toast.success(`Service package "${dto.package_name}" created successfully${groupLabel}`);
        setIsModalOpen(false);
    };

    const handleDeletePackage = (pkg: ServicePackageItem) => {
        setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
        toast.success(`Service package "${pkg.name}" deleted successfully`);
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
                accessorKey: "packageCode",
                header: "Package Code",
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Package Name",
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "servicesIncluded",
                header: "Services Included",
                cell: (info) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C]">
                        {info.getValue() as number} Services
                    </span>
                ),
            },
            {
                accessorKey: "billingCycle",
                header: "Billing Cycle",
            },
            {
                accessorKey: "price",
                header: "Price (SAR)",
                cell: (info) => (
                    <span className="font-semibold font-mono text-[#0D0D0D]">
                        {(info.getValue() as number).toLocaleString()} SAR
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                        Active
                    </span>
                ),
            },
            {
                id: "actions",
                header: () => <div className="text-right">Actions</div>,
                cell: ({ row }) => (
                    <div className="text-right">
                        <TableRowActions
                            recordName={row.original.name}
                            onEdit={() => {
                                setEditingPackage(row.original);
                                setIsModalOpen(true);
                            }}
                            onDelete={() => handleDeletePackage(row.original)}
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
                data={filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                count={filtered.length}
                loading={false}
                searchPlaceholder="Search Service Packages..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onAddNew={() => {
                    setEditingPackage(null);
                    setIsModalOpen(true);
                }}
                title="Service Packages"
                addNewLabel="Add Package"
            />

            <AddServicePackageModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingPackage(null);
                }}
                onSubmit={handleCreateOrUpdatePackage}
                initialData={editingPackage}
            />
        </div>
    );
};
