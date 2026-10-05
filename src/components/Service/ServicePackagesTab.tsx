import React, { useState, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const [packages, setPackages] = useState<ServicePackageItem[]>(defaultPackages);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackageItem | null>(null);

    const filtered = useMemo(() => {
        if (!searchTerm) return packages;
        const term = searchTerm.toLowerCase();
        return packages.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                t(`packages.packageOptions.${p.name}`, { defaultValue: p.name }).toLowerCase().includes(term) ||
                p.packageCode.toLowerCase().includes(term)
        );
    }, [packages, searchTerm, t]);

    const handleCreateOrUpdatePackage = (dto: CreateServicePackageDto) => {
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
            toast.success(
                t("packages.messages.updated", {
                    name: t(`packages.packageOptions.${dto.package_name}`, { defaultValue: dto.package_name }),
                })
            );
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
        toast.success(
            t("packages.messages.created", {
                name: t(`packages.packageOptions.${dto.package_name}`, { defaultValue: dto.package_name }),
            })
        );
        setIsModalOpen(false);
    };

    const handleDeletePackage = useCallback(
        (pkg: ServicePackageItem) => {
            setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
            toast.success(
                t("packages.messages.deleted", {
                    name: t(`packages.packageOptions.${pkg.name}`, { defaultValue: pkg.name }),
                })
            );
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
                accessorKey: "packageCode",
                header: t("packages.packageCode"),
                cell: (info) => (
                    <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("packages.packageName"),
                cell: (info) => {
                    const rawName = info.getValue() as string;
                    return (
                        <span className="font-medium text-[#0D0D0D]">
                            {t(`packages.packageOptions.${rawName}`, { defaultValue: rawName })}
                        </span>
                    );
                },
            },
            {
                accessorKey: "servicesIncluded",
                header: t("packages.servicesIncluded"),
                cell: (info) => (
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold font-mono bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C]">
                        {t("common.servicesCountBadge", { count: info.getValue() as number })}
                    </span>
                ),
            },
            {
                accessorKey: "billingCycle",
                header: t("packages.billingCycle"),
                cell: (info) => {
                    const val = String(info.getValue() || "");
                    return t(`services.${val.toLowerCase()}`, { defaultValue: val });
                },
            },
            {
                accessorKey: "price",
                header: t("packages.priceSar"),
                cell: (info) => (
                    <span className="font-semibold font-mono text-[#0D0D0D]">
                        {(info.getValue() as number).toLocaleString("en-US")} {t("common.sar")}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => {
                    const isPkgActive = row.original.status !== "inactive";
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                            {isPkgActive ? t("common.active") : t("common.inactive")}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-end">{t("common.actions")}</div>,
                cell: ({ row }) => (
                    <div className="text-end">
                        <TableRowActions
                            recordName={t(`packages.packageOptions.${row.original.name}`, { defaultValue: row.original.name })}
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
        [t, handleDeletePackage]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                count={filtered.length}
                loading={false}
                searchPlaceholder={t("pages.servicePackages.searchPlaceholder")}
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
                addNewLabel={t("pages.servicePackages.addLabel")}
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
