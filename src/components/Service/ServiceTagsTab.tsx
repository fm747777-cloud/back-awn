import React, { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { serviceApi } from "../../api/api";
import { AddServiceTagModal, ServiceTagStatus } from "./AddServiceTagModal";
import { DataTable } from "../DataTable";

export interface ServiceTagItem {
    id: string;
    codeName: string;
    description: string;
    name: string;
    createdBy?: string;
    createdAt: string;
    status: ServiceTagStatus;
}

export const ServiceTagsTab: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<ServiceTagItem | null>(null);
    const [viewingTag, setViewingTag] = useState<ServiceTagItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ServiceTagItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["serviceTags", pageIndex, pageSize, searchTerm],
        queryFn: () =>
            serviceApi.getServiceTags({
                page: pageIndex + 1,
                limit: pageSize,
                search: searchTerm,
            }),
    });

    const tagsList: ServiceTagItem[] = useMemo(() => data?.data || [], [data]);
    const totalCount = data?.count || 0;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServiceTag(id),
        onSuccess: () => {
            toast.success(t("common.deleteSuccess", "Deleted successfully"));
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
        },
        onError: (error: any) => {
            console.error("Failed to delete service tag:", error);
            toast.error(
                error?.response?.data?.message ||
                t("common.deleteError", "Failed to delete")
            );
        },
    });

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPageIndex(0);
    };

    // Export the currently loaded table rows to a UTF-8 CSV file.
    const handleExport = useCallback(() => {
        if (!tagsList.length) {
            toast.error(t("common.noDataToExport", "No data available to export"));
            return;
        }

        const headers = [
            "Tag Code",
            "Tag Name",
            "Created By",
            "Created At",
            "Status",
            "ID",
        ];

        const escapeCsvValue = (value: unknown) => {
            const text = value == null ? "" : String(value);
            return `"${text.replace(/"/g, '""')}"`;
        };

        const rows = tagsList.map((tag) => [
            tag.codeName || tag.id,
            tag.name,
            tag.createdBy,
            tag.createdAt ? String(tag.createdAt).split("T")[0] : "",
            tag.status,
            tag.id,
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map(escapeCsvValue).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `service-tags-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }, [tagsList, t]);

    const renderStatusBadge = useCallback(
        (status: ServiceTagStatus) => {
            switch (status) {
                case ServiceTagStatus.ACTIVE:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2D3F2C]/20 bg-[#2D3F2C]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#2D3F2C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2D3F2C]" />
                            {t("common.active")}
                        </span>
                    );
                case ServiceTagStatus.INITIATED:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8C6046]/20 bg-[#8C6046]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#8C6046]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8C6046]" />
                            {t("common.initiated")}
                        </span>
                    );
                case ServiceTagStatus.REJECTED:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-medium text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {t("common.rejected")}
                        </span>
                    );
                case ServiceTagStatus.INACTIVE:
                default:
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#595550]/20 bg-[#595550]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#595550]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#857E74]" />
                            {t("common.inactive")}
                        </span>
                    );
            }
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
                        aria-label="Select all rows"
                        className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        aria-label={`Select ${row.original.name}`}
                        className="cursor-pointer rounded border-[#DCD6CD] text-[#2D3F2C] focus:ring-[#2D3F2C]"
                    />
                ),
            },
            {
                accessorKey: "codeName",
                header: t("tags.tagCode"),
                cell: (info) => (
                    <span className="font-mono text-xs font-semibold text-[#2D3F2C]">
                        {info.row.original.codeName}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: t("tags.tagName"),
                cell: (info) => (
                    <span className="font-medium text-[#0D0D0D]">
                        {info.getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: "createdBy",
                header: t("services.createdBy"),
                cell: ({ row }) => {
                    const creator = row.original.createdBy;
                    const displayCreator =
                        creator === "Admin User"
                            ? t("common.adminUser")
                            : creator === "System Admin"
                                ? t("common.systemAdmin")
                                : creator === "Super Admin"
                                    ? t("common.superAdmin")
                                    : creator;
                    return displayCreator ? (
                        <span className="font-medium text-[#0D0D0D]">{displayCreator}</span>
                    ) : (
                        <span className="italic text-[#857E74]">
                            {t("common.notAvailable")}
                        </span>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: t("services.createDate"),
                cell: (info) => {
                    const value = info.getValue() as string;
                    return (
                        <span className="font-mono text-[#6E6862]">
                            {value ? String(value).split("T")[0] : "—"}
                        </span>
                    );
                },
            },
            {
                accessorKey: "status",
                header: t("common.status"),
                cell: ({ row }) => renderStatusBadge(row.original.status),
            },
            {
                id: "actions",
                header: () => <div className="text-end">{t("common.actions")}</div>,
                cell: ({ row }) => {
                    const tag = row.original;
                    const isMenuOpen = openMenuId === tag.id;
                    return (
                        <div className="relative flex justify-end" onClick={(event) => event.stopPropagation()}>
                            <button
                                type="button"
                                aria-label={t("common.actions")}
                                aria-expanded={isMenuOpen}
                                onClick={() => setOpenMenuId(isMenuOpen ? null : tag.id)}
                                className="rounded-md p-1.5 text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D]"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {isMenuOpen && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Close actions menu"
                                        className="fixed inset-0 z-20 cursor-default"
                                        onClick={() => setOpenMenuId(null)}
                                    />
                                    <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-[#E5E0D8] bg-white p-1 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setViewingTag(tag);
                                                setOpenMenuId(null);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#45413C] hover:bg-[#F8F6F2]"
                                        >
                                            <Eye className="h-4 w-4" />
                                            {t("common.view", "View")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingTag(tag);
                                                setIsModalOpen(true);
                                                setOpenMenuId(null);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[#45413C] hover:bg-[#F8F6F2]"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            {t("common.edit", "Edit")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteTarget(tag);
                                                setOpenMenuId(null);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {t("common.delete", "Delete")}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                },
            },
        ],
        [t, renderStatusBadge, openMenuId]
    );

    return (
        <div className="space-y-4" onClick={() => openMenuId && setOpenMenuId(null)}>
            <DataTable
                columns={columns}
                data={tagsList}
                count={totalCount}
                loading={isLoading}
                searchPlaceholder={t("pages.serviceTags.searchPlaceholder")}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                onAddNew={() => {
                    setEditingTag(null);
                    setIsModalOpen(true);
                }}
                title="Service Tags"
                addNewLabel={t("pages.serviceTags.addLabel")}
                onExport={handleExport}
            />

            <AddServiceTagModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTag(null);
                }}
                initialData={editingTag ?? undefined}
            />

            {/* View only: displays the selected row locally and makes no API request. */}
            {viewingTag && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewingTag(null)}>
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-tag-view-title"
                        className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="flex items-center justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-5 py-4">
                            <h2 id="service-tag-view-title" className="text-lg font-semibold text-[#0D0D0D]">
                                {t("common.view", "View")} {t("tags.tagName", "Service Tag")}
                            </h2>
                            <button type="button" onClick={() => setViewingTag(null)} className="rounded-md p-1.5 text-[#857E74] hover:bg-[#EFECE6]" aria-label={t("common.close", "Close")}>
                                <X className="h-4 w-4" />
                            </button>
                        </header>
                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <Detail label={t("tags.tagCode", "Tag Code")} value={viewingTag.codeName} />
                            <Detail label={t("tags.tagName", "Tag Name")} value={viewingTag.name} />
                            <div>
                                <p className="mb-1 text-xs font-medium text-[#857E74]">{t("common.status", "Status")}</p>
                                {renderStatusBadge(viewingTag.status)}
                            </div>
                            <Detail label={t("services.createdBy", "Created By")} value={viewingTag.createdBy || t("common.notAvailable", "N/A")} />
                            <Detail label={t("services.createDate", "Created At")} value={viewingTag.createdAt ? String(viewingTag.createdAt).split("T")[0] : "—"} />
                            <Detail label={t("common.description", "Description")} value={viewingTag.description} />
                        </div>
                        <footer className="flex justify-end border-t border-[#E5E0D8] bg-[#FAF8F5] px-5 py-3">
                            <button type="button" onClick={() => setViewingTag(null)} className="rounded-lg bg-[#2D3F2C] px-4 py-2 text-sm font-medium text-white hover:bg-[#1F2C1E]">
                                {t("common.close", "Close")}
                            </button>
                        </footer>
                    </section>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => !deleteMutation.isPending && setDeleteTarget(null)}>
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-service-tag-title"
                        className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="delete-service-tag-title" className="text-base font-semibold text-[#0D0D0D]">
                            {t("common.confirmDelete", "Confirm deletion")}
                        </h2>
                        <p className="mt-2 text-sm text-[#6E6862]">
                            {t("common.deleteConfirmation", "Are you sure you want to delete")} <strong className="text-[#0D0D0D]">{deleteTarget.name}</strong>?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-lg border border-[#D6CFC4] px-4 py-2 text-sm text-[#45413C] hover:bg-[#F8F6F2] disabled:opacity-50"
                            >
                                {t("common.cancel", "Cancel")}
                            </button>
                            <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deleteMutation.isPending ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

const Detail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-[#857E74]">{label}</p>
        <p className="break-words text-sm font-medium text-[#0D0D0D]">{value || "—"}</p>
    </div>
);

export default ServiceTagsTab;