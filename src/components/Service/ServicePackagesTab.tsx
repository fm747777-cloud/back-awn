import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
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

    const filtered = useMemo(() => {
        if (!searchTerm) return packages;
        return packages.filter(
            (p) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.packageCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [packages, searchTerm]);

    const handleCreatePackage = (
        dto: CreateServicePackageDto,
        meta?: { service_group_id: string; group_name?: string }
    ) => {
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

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        className="rounded border-slate-300 text-[#126b71]"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="rounded border-slate-300 text-[#126b71]"
                    />
                ),
            },
            {
                accessorKey: "packageCode",
                header: "Package Code",
                cell: (info) => (
                    <span className="font-semibold text-slate-800">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "Package Name",
                cell: (info) => (
                    <span className="font-medium text-slate-800">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "servicesIncluded",
                header: "Services Included",
                cell: (info) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
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
                    <span className="font-semibold text-slate-900">
                        {(info.getValue() as number).toLocaleString()} SAR
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                    </span>
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
                onAddNew={() => setIsModalOpen(true)}
                title="Service Packages"
            />

            <AddServicePackageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreatePackage}
            />
        </div>
    );
};
