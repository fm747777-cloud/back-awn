import React, { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
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
                header: "Timestamp",
                cell: (info) => (
                    <span className="font-mono text-xs text-slate-600">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "action",
                header: "Action",
                cell: (info) => (
                    <span className="font-semibold text-slate-800">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "entityType",
                header: "Module / Entity",
                cell: (info) => (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "entityName",
                header: "Target Record",
                cell: (info) => (
                    <span className="font-medium text-slate-800">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "performedBy",
                header: "Performed By",
            },
            {
                accessorKey: "ipAddress",
                header: "IP Address",
                cell: (info) => (
                    <span className="font-mono text-xs text-slate-500">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: () => (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        Success
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
                searchPlaceholder="Search Audit Trail..."
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                title="Services Audit Trail"
            />
        </div>
    );
};
