import React, { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DataTable } from "../DataTable";
import { AddServicePackageModal } from "./AddServicePackageModal";
import { serviceApi } from "../../api/api";
import type { CreateServicePackageDto } from "../../schemas/serviceSchema";

export interface ServicePackageItem {
    id: string;
    packageCode: string;
    name: string;
    servicesIncluded: number;
    billingCycle: string;
    price: number;
    status: "active" | "inactive";
}

export const ServicePackagesTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: packagesResponse, isLoading: isLoadingPackages, isError: isPackagesError, refetch } = useQuery({
        queryKey: ["service-packages"],
        queryFn: async () => {
            const data = await serviceApi.getServicePackages({
                search: searchTerm,
                page: pageIndex + 1,
                limit: pageSize,
            });
            return data?.data ?? data ?? [];
        }
    });

    const packages: ServicePackageItem[] = useMemo(() => {
        const response = packagesResponse as any;
        const data = Array.isArray(response) ? response : response?.data || response?.items || response?.results || [];
        console.log('data', data);

        return data.map((item: any) => ({
            id: item.id,
            packageCode: item.packageCode || item.package_code || item.code || "",
            name: item.name || item.package_name || "",
            servicesIncluded: item.serviceGroups?.length ?? 0,
            billingCycle: item.billingCycle || item.billing_cycle || "Annual",
            price: Number(item.price ?? item.unit_price ?? 0),
            status: String(item.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
        }));
    }, [packagesResponse]);

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return packages;

        const term = searchTerm.toLowerCase().trim();

        return packages.filter((p) =>
            p.name.toLowerCase().includes(term) ||
            t(`packages.packageOptions.${p.name}`, { defaultValue: p.name }).toLowerCase().includes(term) ||
            p.packageCode.toLowerCase().includes(term)
        );
    }, [packages, searchTerm, t]);

    const handleCreatePackage = async (dto: CreateServicePackageDto) => {
        try {

            await serviceApi.createServicePackage(dto);

            await queryClient.invalidateQueries({ queryKey: ["service-packages"] });

            toast.success(
                t("packages.messages.created", {
                    name: t(`packages.packageOptions.${dto.package_name}`, {
                        defaultValue: dto.package_name,
                    }),
                })
            );

            setIsModalOpen(false);
        } catch (error: any) {
            const message = error?.response?.data?.message;

            toast.error(
                Array.isArray(message)
                    ? message.join(", ")
                    : message || t("common.somethingWentWrong", { defaultValue: "Something went wrong" })
            );
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
                    const isPkgActive =
                        String(row.original?.status || "Active").toLowerCase() !== "inactive";

                    return isPkgActive ? (
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
        ],
        [t]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)}
                count={filtered.length}
                loading={isLoadingPackages}
                searchPlaceholder={t("pages.servicePackages.searchPlaceholder")}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={(value) => {
                    setSearchTerm(value);
                    setPageIndex(0);
                }}
                onAddNew={() => setIsModalOpen(true)}
                title="Service Packages"
                addNewLabel={t("pages.servicePackages.addLabel")}
            />

            {isPackagesError && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <span className="text-xs text-[#B83232]">
                        {t("common.somethingWentWrong", { defaultValue: "Failed to load service packages" })}
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
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreatePackage}
            />
        </div>
    );
};