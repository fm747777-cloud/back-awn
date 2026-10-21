import React, { useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { serviceApi } from "../../api/api";
import { DataTable } from "../DataTable";
import { AddServicePortalModal } from "./AddServicePortalModal";

export interface ServiceTagItem {
    id: string;
    codeName?: string;
    tagCode?: string;
    name: string;
    createdBy?: string;
    createdAt: string;
    url?: string;
    description?: string;
    contact_number?: string | number;
    email?: string;
    status?: string;
}

type PortalDetails = ServiceTagItem;

export const ServicePortalsTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPortal, setEditingPortal] = useState<PortalDetails | null>(null);
    const [viewingPortal, setViewingPortal] = useState<PortalDetails | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PortalDetails | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["servicePortals", pageIndex, pageSize, searchTerm],
        queryFn: () => serviceApi.getServicePortals({
            page: pageIndex + 1,
            limit: pageSize,
            search: searchTerm,
        }),
    });

    const portals: PortalDetails[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    // Export the currently loaded/filtered table rows to a UTF-8 CSV file.
    const handleExport = useCallback(() => {
        if (!portals.length) {
            toast.info(t("common.noDataToExport", "No data to export"));
            return;
        }

        const headers = [
            "Portal Code",
            "Portal Name",
            "URL",
            "Description",
            "Contact Number",
            "Email",
            "Created By",
            "Created At",
            "Status",
        ];

        const rows = portals.map((portal) => [
            portal.codeName || portal.tagCode || "",
            portal.name || "",
            portal.url || "",
            portal.description || "",
            portal.contact_number ?? "",
            portal.email || "",
            portal.createdBy || "",
            portal.createdAt ? String(portal.createdAt).split("T")[0] : "",
            portal.status || "Active",
        ]);

        const escapeCsv = (value: unknown) => {
            const textValue = String(value ?? "");
            return `"${textValue.replace(/"/g, '""')}"`;
        };

        const csv = [headers, ...rows]
            .map((row) => row.map(escapeCsv).join(","))
            .join("\r\n");
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `service-portals-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success(t("common.exportSuccess", "Export completed"));
    }, [portals, t]);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServicePortal(id),
        onSuccess: () => {
            toast.success(t("common.deleteSuccess", "Deleted successfully"));
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["servicePortals"] });
        },
        onError: (error: any) => {
            console.error("Failed to delete service portal:", error);
            toast.error(error?.response?.data?.message || t("common.deleteError", "Failed to delete"));
        },
    });

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const renderStatusBadge = useCallback(() => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C]" />
            {t("common.active")}
        </span>
    ), [t]);

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            id: "select",
            header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} aria-label={t("common.selectAll", "Select all")} className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer" />,
            cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} aria-label={t("common.selectRow", "Select row")} className="rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer" />,
        },
        {
            accessorKey: "codeName",
            header: t("portals.portalCode"),
            cell: ({ row }) => <span className="font-semibold font-mono text-xs text-[#2D3F2C]" dir="ltr">{row.original.codeName || row.original.tagCode || "—"}</span>,
        },
        {
            accessorKey: "name",
            header: t("portals.portalName"),
            cell: ({ getValue }) => <span className="font-medium text-[#0D0D0D]">{(getValue() as string) || "—"}</span>,
        },
        {
            accessorKey: "createdBy",
            header: t("services.createdBy"),
            cell: ({ row }) => {
                const creator = row.original.createdBy;
                const displayCreator = creator === "Admin User" ? t("common.adminUser")
                    : creator === "System Admin" ? t("common.systemAdmin")
                    : creator === "Super Admin" ? t("common.superAdmin") : creator;
                return displayCreator
                    ? <span className="font-medium text-[#0D0D0D]">{displayCreator}</span>
                    : <span className="text-[#857E74] italic">{t("common.systemAdmin")}</span>;
            },
        },
        {
            accessorKey: "createdAt",
            header: t("services.createDate"),
            cell: ({ getValue }) => {
                const value = getValue() as string | undefined;
                return <span className="font-mono text-[#6E6862]" dir="ltr">{value ? String(value).split("T")[0] : "—"}</span>;
            },
        },
        { accessorKey: "status", header: t("common.status"), cell: () => renderStatusBadge() },
        {
            id: "actions",
            header: () => <div className="text-end">{t("common.actions")}</div>,
            cell: ({ row }) => {
                const portal = row.original;
                const menuOpen = openMenuId === portal.id;
                return <div className="relative flex justify-end">
                    <button type="button" aria-label={t("common.actions")} aria-expanded={menuOpen} onClick={() => setOpenMenuId(current => current === portal.id ? null : portal.id)} className="p-1.5 rounded-md hover:bg-[#F8F6F2] text-[#857E74] hover:text-[#0D0D0D] transition">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen && <>
                        <button type="button" aria-label={t("common.close", "Close menu")} className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute end-0 top-full mt-1 z-30 w-40 rounded-lg border border-[#E5E0D8] bg-white p-1 shadow-lg">
                            <button type="button" onClick={() => { setViewingPortal(portal); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#45413C] hover:bg-[#F8F6F2]"><Eye className="h-4 w-4" />{t("common.view", "View")}</button>
                            <button type="button" onClick={() => { setEditingPortal(portal); setIsModalOpen(true); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#45413C] hover:bg-[#F8F6F2]"><Pencil className="h-4 w-4" />{t("common.edit", "Edit")}</button>
                            <button type="button" onClick={() => { setDeleteTarget(portal); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#B83232] hover:bg-[#FCF2F2]"><Trash2 className="h-4 w-4" />{t("common.delete", "Delete")}</button>
                        </div>
                    </>}
                </div>;
            },
        },
    ], [t, renderStatusBadge, openMenuId]);

    const closeFormModal = () => {
        setIsModalOpen(false);
        setEditingPortal(null);
    };

    return <div className="space-y-4">
        <DataTable
            columns={columns}
            data={portals}
            count={totalCount}
            loading={isLoading}
            searchPlaceholder={t("pages.servicePortals.searchPlaceholder")}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            onAddNew={() => { setEditingPortal(null); setIsModalOpen(true); }}
            title="Service Portals"
            addNewLabel={t("pages.servicePortals.addLabel")}
            onExport={handleExport}
        />

        <AddServicePortalModal isOpen={isModalOpen} onClose={closeFormModal} initialData={editingPortal} />

        {/* View is client-side only and uses the row data already loaded in the table. */}
        {viewingPortal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D0D0D]/40 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="service-portal-view-title" className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                    <div><h2 id="service-portal-view-title" className="text-lg font-bold text-[#0D0D0D]">{t("common.view", "View")} {t("portals.portalName", "Service Portal")}</h2><p className="mt-1 text-xs text-[#6E6862]">{t("portals.subtitle", "Service portal details")}</p></div>
                    <button type="button" onClick={() => setViewingPortal(null)} aria-label={t("common.close", "Close")} className="rounded-md p-1 text-[#8C847A] transition hover:bg-[#EFECE6] hover:text-[#0D0D0D]"><X className="h-5 w-5" /></button>
                </div>
                <div className="grid gap-4 overflow-y-auto p-6 sm:grid-cols-2">
                    {[
                        [t("portals.portalCode", "Portal Code"), viewingPortal.codeName || viewingPortal.tagCode],
                        [t("portals.portalName", "Portal Name"), viewingPortal.name],
                        [t("portals.portalUrl", "Portal URL"), viewingPortal.url],
                        [t("portals.portalDescription", "Description"), viewingPortal.description],
                        [t("portals.contactNumber", "Contact Number"), viewingPortal.contact_number],
                        [t("portals.emailAddress", "Email"), viewingPortal.email],
                        [t("services.createdBy", "Created By"), viewingPortal.createdBy],
                        [t("services.createDate", "Created At"), viewingPortal.createdAt ? String(viewingPortal.createdAt).split("T")[0] : undefined],
                    ].map(([label, value]) => <div key={String(label)} className="min-w-0">
                        <p className="mb-1 text-xs font-medium text-[#857E74]">{label}</p>
                        <p className="break-words text-sm text-[#0D0D0D]" dir={String(label).toLowerCase().includes("url") || String(label).toLowerCase().includes("email") ? "ltr" : undefined}>{value !== undefined && value !== null && String(value).trim() !== "" ? String(value) : "—"}</p>
                    </div>)}
                </div>
                <div className="flex justify-end border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4"><button type="button" onClick={() => setViewingPortal(null)} className="rounded-lg border border-[#D6CFC4] bg-white px-5 py-2 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC]">{t("common.close", "Close")}</button></div>
            </div>
        </div>}

        {deleteTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0D0D0D]/40 p-4 backdrop-blur-sm">
            <div role="alertdialog" aria-modal="true" aria-labelledby="delete-portal-title" className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-2xl">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FCF2F2] text-[#B83232]"><Trash2 className="h-5 w-5" /></div>
                <h2 id="delete-portal-title" className="text-lg font-bold text-[#0D0D0D]">{t("common.confirmDeleteTitle", "Delete service portal?")}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6E6862]">{t("common.confirmDelete", "Are you sure you want to delete")} <span className="font-semibold text-[#0D0D0D]">{deleteTarget.name}</span>?</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-[#D6CFC4] bg-white px-4 py-2 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:opacity-50">{t("common.cancel", "Cancel")}</button>
                    <button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)} className="rounded-lg bg-[#B83232] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#962626] disabled:cursor-not-allowed disabled:opacity-50">{deleteMutation.isPending ? t("common.submitting", "Deleting...") : t("common.delete", "Delete")}</button>
                </div>
            </div>
        </div>}
    </div>;
};