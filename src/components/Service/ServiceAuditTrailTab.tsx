import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { DataTable } from "../DataTable";

export interface AuditTrailItem {
    id: string;
    action: string;
    entityType: string;
    entityName: string;
    performedBy: string;
    timestamp: string;
    ipAddress: string;
    status: 'Success' | 'Warning' | 'Failed';
}

const defaultAudit: AuditTrailItem[] = [
    {
        id: "adt-1",
        action: "Create Service",
        entityType: "Service",
        entityName: "تجديد رخصة القيادة للمركبات التجارية",
        performedBy: "Karim Wagdi",
        timestamp: "2026-03-20 14:32:10",
        ipAddress: "192.168.1.45",
        status: "Success",
    },
    {
        id: "adt-2",
        action: "Update Portal",
        entityType: "Service Portal",
        entityName: "Absher Business",
        performedBy: "Karim Wagdi",
        timestamp: "2026-03-20 11:15:02",
        ipAddress: "192.168.1.45",
        status: "Success",
    },
    {
        id: "adt-3",
        action: "Add Tag",
        entityType: "Service Tag",
        entityName: "Urgent",
        performedBy: "Admin User",
        timestamp: "2026-03-19 16:48:33",
        ipAddress: "10.0.0.12",
        status: "Success",
    },
    {
        id: "adt-4",
        action: "Create Service Category",
        entityType: "Service Category",
        entityName: "Labor & Employment",
        performedBy: "Karim Wagdi",
        timestamp: "2026-03-18 09:22:15",
        ipAddress: "192.168.1.45",
        status: "Success",
    },
];

export const ServiceAuditTrailTab: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        if (!searchTerm) return defaultAudit;
        return defaultAudit.filter(
            (a) =>
                a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: "timestamp",
                header: t("audit.timestamp"),
                cell: (info) => (
                    <span className="font-mono text-xs text-[#2D3F2C] font-semibold">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "action",
                header: t("audit.action"),
                cell: (info) => {
                    const raw = info.getValue() as string;
                    return (
                        <span className="font-semibold text-[#0D0D0D]">
                            {t(`audit.actions.${raw}`, { defaultValue: raw })}
                        </span>
                    );
                },
            },
            {
                accessorKey: "entityType",
                header: t("audit.moduleEntity"),
                cell: (info) => {
                    const raw = info.getValue() as string;
                    return (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#FAF8F5] border border-[#E5E0D8] text-[#2D3F2C] font-medium">
                            {t(`audit.entities.${raw}`, { defaultValue: raw })}
                        </span>
                    );
                },
            },
            {
                accessorKey: "entityName",
                header: t("audit.targetRecord"),
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D] inline-block text-start">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "performedBy",
                header: t("audit.performedBy"),
                cell: (info) => (
                    <span className="text-[#0D0D0D] font-medium">{info.getValue() as string}</span>
                ),
            },
            {
                accessorKey: "ipAddress",
                header: t("audit.ipAddress"),
                cell: (info) => (
                    <span className="font-mono text-xs text-[#6E6862]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
                        {t("common.success")}
                    </span>
                ),
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
                loading={false}
                searchPlaceholder={t("pages.auditTrail.searchPlaceholder")}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                title="Audit Trail"
            />
        </div>
    );
};
