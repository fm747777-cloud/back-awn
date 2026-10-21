import React, { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { serviceApi } from "../../api/api";
import { AddServiceCategoryModal, ServiceCategoryStatus } from "./AddServiceCategoryModal";
import { DataTable } from "../DataTable";

export interface ServiceCategoryItem {
    id: string;
    codeName: string;
    name: string;
    description?: string;
    createdBy?: string;
    createdAt: string;
    status: ServiceCategoryStatus;
}

export const ServiceCategoryTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ServiceCategoryItem | null>(null);
    const [viewingCategory, setViewingCategory] = useState<ServiceCategoryItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceCategoryItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceCategories", pageIndex, pageSize, searchTerm],
        queryFn: () => serviceApi.getServiceCategories({ page: pageIndex + 1, limit: pageSize, search: searchTerm }),
    });

    const categoryList: ServiceCategoryItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    const handleExport = useCallback(() => {
        if (!categoryList.length) {
            toast.error(t("common.noDataToExport", "No data available to export"));
            return;
        }
        const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const headers = ["Category Code", "Category Name", "Description", "Created By", "Created At", "Status", "ID"];
        const rows = categoryList.map((item) => [
            item.codeName,
            item.name,
            item.description,
            item.createdBy,
            item.createdAt ? String(item.createdAt).split("T")[0] : "",
            item.status,
            item.id,
        ]);
        const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `service-categories-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }, [categoryList, t]);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServiceCategory(id),
        onSuccess: () => {
            toast.success(t("common.deleteSuccess", "Deleted successfully"));
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
        },
        onError: (error: any) => {
            console.error("Failed to delete service category:", error);
            toast.error(error?.response?.data?.message || t("common.deleteError", "Failed to delete"));
        },
    });

    const renderStatusBadge = useCallback((status: ServiceCategoryStatus) => {
        switch (status) {
            case ServiceCategoryStatus.ACTIVE:
                return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#2D3F2C]"><span className="h-1.5 w-1.5 rounded-full bg-[#2D3F2C]" />{t("common.active")}</span>;
            case ServiceCategoryStatus.INITIATED:
                return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8C6046]/20 bg-[#8C6046]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#8C6046]"><span className="h-1.5 w-1.5 rounded-full bg-[#8C6046]" />{t("common.initiated")}</span>;
            case ServiceCategoryStatus.REJECTED:
                return <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{t("common.rejected")}</span>;
            case ServiceCategoryStatus.INACTIVE:
            default:
                return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#595550]/20 bg-[#595550]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#595550]"><span className="h-1.5 w-1.5 rounded-full bg-[#857E74]" />{t("common.inactive")}</span>;
        }
    }, [t]);

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            id: "select",
            header: ({ table }) => <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} aria-label="Select all rows" className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]" />,
            cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} aria-label={`Select ${row.original.name}`} className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]" />,
        },
        {
            accessorKey: "codeName",
            header: t("categories.categoryCode"),
            cell: (info) => <span className="font-mono text-xs font-semibold text-[#2D3F2C]">{info.row.original.codeName}</span>,
        },
        { accessorKey: "name", header: t("categories.categoryName"), cell: (info) => <span className="font-medium text-[#0D0D0D]">{info.getValue() as string}</span> },
        {
            accessorKey: "createdBy", header: t("services.createdBy"),
            cell: ({ row }) => {
                const creator = row.original.createdBy;
                const displayCreator = creator === "Admin User" ? t("common.adminUser") : creator === "System Admin" ? t("common.systemAdmin") : creator === "Super Admin" ? t("common.superAdmin") : creator;
                return displayCreator ? <span className="font-medium text-[#0D0D0D]">{displayCreator}</span> : <span className="italic text-[#857E74]">{t("common.notAvailable")}</span>;
            },
        },
        { accessorKey: "createdAt", header: t("services.createDate"), cell: (info) => <span className="font-mono text-[#6E6862]" dir="ltr">{info.getValue() ? String(info.getValue()).split("T")[0] : "—"}</span> },
        { accessorKey: "status", header: t("common.status"), cell: ({ row }) => renderStatusBadge(row.original.status) },
        {
            id: "actions", header: () => <div className="text-end">{t("common.actions")}</div>,
            cell: ({ row }) => {
                const category = row.original;
                const menuOpen = openMenuId === category.id;
                return <div className="relative flex justify-end" onClick={(event) => event.stopPropagation()}>
                    <button type="button" aria-label={t("common.actions")} aria-expanded={menuOpen} onClick={() => setOpenMenuId(menuOpen ? null : category.id)} className="rounded-md p-1.5 text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D]"><MoreHorizontal className="h-4 w-4" /></button>
                    {menuOpen && <>
                        <button type="button" aria-label="Close actions menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-[#E5E0D8] bg-white p-1 shadow-xl">
                            <button type="button" onClick={() => { setViewingCategory(category); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#45413C] hover:bg-[#F8F6F2]"><Eye className="h-4 w-4" />{t("common.view", "View")}</button>
                            <button type="button" onClick={() => { setEditingCategory(category); setIsModalOpen(true); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#45413C] hover:bg-[#F8F6F2]"><Pencil className="h-4 w-4" />{t("common.edit", "Edit")}</button>
                            <button type="button" onClick={() => { setDeleteTarget(category); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" />{t("common.delete", "Delete")}</button>
                        </div>
                    </>}
                </div>;
            },
        },
    ], [t, renderStatusBadge, openMenuId]);

    return <div className="space-y-4" onClick={() => openMenuId && setOpenMenuId(null)}>
        <DataTable
            columns={columns}
            data={categoryList}
            count={totalCount}
            loading={isLoading}
            searchPlaceholder={t("pages.serviceCategories.searchPlaceholder")}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            onAddNew={() => { setEditingCategory(null); setIsModalOpen(true); }}
            title="Service Categories"
            addNewLabel={t("pages.serviceCategories.addLabel")}
            onExport={handleExport}
        />

        <AddServiceCategoryModal
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
            initialData={editingCategory ?? undefined}
        />

        {viewingCategory && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewingCategory(null)}>
            <section role="dialog" aria-modal="true" aria-labelledby="service-category-view-title" className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <header className="flex items-center justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-5 py-4"><h2 id="service-category-view-title" className="text-lg font-semibold text-[#0D0D0D]">{t("common.view", "View")} {t("categories.categoryName", "Service Category")}</h2><button type="button" onClick={() => setViewingCategory(null)} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#EFECE6]" aria-label={t("common.close", "Close")}><X className="h-4 w-4" /></button></header>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <Detail label={t("categories.categoryCode", "Category Code")} value={viewingCategory.codeName} />
                    <Detail label={t("categories.categoryName", "Category Name")} value={viewingCategory.name} />
                    <Detail label={t("categories.description", "Description")} value={viewingCategory.description} />
                    <div><p className="mb-1 text-xs font-medium text-[#857E74]">{t("common.status", "Status")}</p>{renderStatusBadge(viewingCategory.status)}</div>
                    <Detail label={t("services.createdBy", "Created By")} value={viewingCategory.createdBy || t("common.notAvailable", "N/A")} />
                    <Detail label={t("services.createDate", "Created At")} value={viewingCategory.createdAt ? String(viewingCategory.createdAt).split("T")[0] : "—"} />
                    <Detail label={t("common.id", "ID")} value={viewingCategory.id} />
                </div>
                <footer className="flex justify-end border-t border-[#E5E0D8] bg-[#FAF8F5] px-5 py-3"><button type="button" onClick={() => setViewingCategory(null)} className="rounded-lg bg-[#2D3F2C] px-4 py-2 text-sm font-medium text-white hover:bg-[#1F2C1E]">{t("common.close", "Close")}</button></footer>
            </section>
        </div>}

        {deleteTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => !deleteMutation.isPending && setDeleteTarget(null)}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="delete-service-category-title" className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <h2 id="delete-service-category-title" className="text-base font-semibold text-[#0D0D0D]">{t("common.confirmDelete", "Confirm deletion")}</h2>
                <p className="mt-2 text-sm text-[#6E6862]">{t("common.deleteConfirmation", "Are you sure you want to delete")} <strong className="text-[#0D0D0D]">{deleteTarget.name}</strong>?</p>
                <div className="mt-6 flex justify-end gap-3"><button type="button" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-[#D6CFC4] px-4 py-2 text-sm text-[#45413C] hover:bg-[#F8F6F2] disabled:opacity-50">{t("common.cancel", "Cancel")}</button><button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deleteMutation.isPending ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}</button></div>
            </section>
        </div>}
    </div>;
};

const Detail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => <div className="min-w-0"><p className="mb-1 text-xs font-medium text-[#857E74]">{label}</p><p className="break-words text-sm font-medium text-[#0D0D0D]">{value || "—"}</p></div>;

export default ServiceCategoryTab;