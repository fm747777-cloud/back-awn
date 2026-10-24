import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Briefcase, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "../../components/DataTable";
import { DesignationForm, type DesignationFormValues } from "../../components/ums/DesignationForm";
import { umsApi } from "../../api/api";

interface DesignationRecord {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
}

interface DesignationResponse {
    data?: DesignationRecord[];
    items?: DesignationRecord[];
    results?: DesignationRecord[];
    totalItems?: number;
    total?: number;
    meta?: {
        total?: number;
    };
}

const DEFAULT_FORM_VALUES: DesignationFormValues = {
    designationName: "",
    description: "",
};

const extractDesignations = (response: DesignationResponse | DesignationRecord[] | undefined): DesignationRecord[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    return [];
};

const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message || error?.message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
};

export const UmsDesignationsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<DesignationRecord | null>(null);
    const [viewingDesignation, setViewingDesignation] = useState<DesignationRecord | null>(null);
    const [deletingDesignation, setDeletingDesignation] = useState<DesignationRecord | null>(null);

    const [formValues, setFormValues] = useState<DesignationFormValues>(DEFAULT_FORM_VALUES);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof DesignationFormValues, string>>>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: designationsResponse, isLoading, isError, refetch } = useQuery({
        queryKey: ["ums", "designations",
            {
                page: currentPage + 1,
                limit: pageSize,
                search: debouncedSearch,
            },
        ],
        queryFn: () => umsApi.getDesignations({
            page: currentPage + 1,
            limit: pageSize,
            search: debouncedSearch || undefined,
        }),
        placeholderData: (previousData) => previousData,
    });

    const designations = useMemo<DesignationRecord[]>(() => {
        return extractDesignations(designationsResponse);
    }, [designationsResponse]);

    const totalCount = designationsResponse?.count;

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) => umsApi.createDesignation(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "designations"] });
            toast.success(t("ums.designations.feedback.created", { defaultValue: "Designation created successfully." }));
            handleCloseForm();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "Something went wrong." })));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) => umsApi.updateDesignation(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "designations"] });
            toast.success(t("ums.designations.feedback.updated", { defaultValue: "Designation updated successfully." }));
            handleCloseForm();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "Something went wrong." })));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteDesignation(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "designations"] });
            toast.success(t("ums.designations.feedback.deleted", { defaultValue: "Designation deleted successfully." }));
            setDeletingDesignation(null);
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("ums.designations.deleteError", { defaultValue: "Failed to delete designation." })));
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const handleOpenCreate = useCallback(() => {
        setEditingDesignation(null);
        setFormValues(DEFAULT_FORM_VALUES);
        setFormErrors({});
        setIsFormOpen(true);
    }, []);

    const handleOpenEdit = useCallback((designation: DesignationRecord) => {
        setEditingDesignation(designation);
        setFormValues({
            designationName: designation.name || "",
            description: designation.description || "",
        });
        setFormErrors({});
        setIsFormOpen(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
        setEditingDesignation(null);
        setFormValues(DEFAULT_FORM_VALUES);
        setFormErrors({});
    }, []);

    const validateForm = useCallback((): boolean => {
        const errors: Partial<Record<keyof DesignationFormValues, string>> = {};
        const name = formValues.designationName.trim();
        const description = formValues.description.trim();

        if (!name) {
            errors.designationName = t("ums.designations.validation.designationNameRequired", { defaultValue: "Designation name is required." });
        }

        if (!description) {
            errors.description = t("ums.designations.validation.descriptionRequired", { defaultValue: "Description is required." });
        }

        const duplicate = designations.find((designation) => {
            const isSameRecord = editingDesignation && designation.id === editingDesignation.id;
            return !isSameRecord && designation.name.trim().toLowerCase() === name.toLowerCase();
        });

        if (duplicate) {
            errors.designationName = t("ums.designations.validation.duplicateTitle", { defaultValue: "A designation with this name already exists." });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [designations, editingDesignation, formValues, t]);

    const handleSubmitForm = useCallback((event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) return;

        const data = {
            name: formValues.designationName.trim(),
            description: formValues.description.trim(),
        };

        if (editingDesignation) {
            updateMutation.mutate({
                id: editingDesignation.id,
                data,
            });
        } else {
            createMutation.mutate(data);
        }
    }, [createMutation, editingDesignation, formValues, updateMutation, validateForm]);

    const handleConfirmDelete = useCallback(() => {
        if (!deletingDesignation) return;

        deleteMutation.mutate(deletingDesignation.id);
    }, [deleteMutation, deletingDesignation]);

    const handleExportCsv = useCallback(() => {
        if (!designations.length) {
            toast.error(t("common.noRecords", { defaultValue: "No records found." }));
            return;
        }

        const headers = ["ID", "Designation Name", "Description", "Created At"];
        const escapeCsvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = designations.map((designation) => [
            designation.id,
            designation.name,
            designation.description || "",
            designation.createdAt || "",
        ]);

        const csvContent = [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((row) => row.map(escapeCsvCell).join(",")),
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `designations-${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }, [designations, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            accessorKey: "codeName",
            header: t("ums.designations.codeName", { defaultValue: "Code Name" }),
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-[#0D0D0D]">
                        {row.original.codeName}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "name",
            header: t("ums.designations.colTitle", { defaultValue: "Designation Name" }),
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Briefcase size={15} />
                    </div>
                    <span className="font-semibold text-[#0D0D0D]">
                        {row.original.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: t("ums.designations.form.descriptionField", { defaultValue: "Description" }),
            cell: ({ row }) => (
                <span className="block max-w-md truncate text-xs text-[#6E6862]">
                    {row.original.description || "—"}
                </span>
            ),
        },
        {
            accessorKey: "createdAt",
            header: t("common.createdAt", { defaultValue: "Created At" }),
            cell: ({ row }) => (
                <span className="font-mono text-xs text-[#6E6862]" dir="ltr">
                    {row.original.createdAt ? String(row.original.createdAt).slice(0, 10) : "—"}
                </span>
            ),
        },
        {
            id: "actions",
            header: t("common.actions", { defaultValue: "Actions" }),
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={() => setViewingDesignation(row.original)}
                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                        title={t("common.view", { defaultValue: "View" })}
                    >
                        <Eye size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={() => handleOpenEdit(row.original)}
                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] cursor-pointer"
                        title={t("common.edit", { defaultValue: "Edit" })}
                    >
                        <Pencil size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={() => setDeletingDesignation(row.original)}
                        className="p-1.5 rounded-md text-[#857E74] hover:text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                        title={t("common.delete", { defaultValue: "Delete" })}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ], [handleOpenEdit, t]);

    return (
        <div className="space-y-6 text-start">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                            {t("ums.designations.title", { defaultValue: "Designations Master" })}
                        </h1>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                            DES-MST
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-[#6E6862]">
                        {t("ums.designations.subtitle", { defaultValue: "Manage organizational designations." })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                        {t("common.export", { defaultValue: "Export" })}
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer"
                    >
                        <Plus size={14} />
                        {t("ums.designations.addDesignation", { defaultValue: "Add Designation" })}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t("ums.designations.kpi.total", { defaultValue: "Total Designations" })}
                        </span>
                        <Briefcase size={18} className="text-[#037F8C]" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#0D0D0D]">
                        {totalCount}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t("ums.designations.kpi.loaded", { defaultValue: "Loaded Records" })}
                        </span>
                        <Eye size={18} className="text-[#037F8C]" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#037F8C]">
                        {designations.length}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6E6862]">
                            {t("ums.designations.kpi.page", { defaultValue: "Current Page" })}
                        </span>
                        <span className="text-xs font-mono text-[#857E74]">
                            {currentPage + 1}
                        </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-[#0D0D0D]">
                        {pageSize}
                    </p>
                </div>
            </div>

            {isError && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-600">
                        {t("common.somethingWentWrong", { defaultValue: "Failed to load designations." })}
                    </p>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="text-sm font-medium text-red-700 underline"
                    >
                        {t("common.retry", { defaultValue: "Retry" })}
                    </button>
                </div>
            )}

            <DataTable
                columns={columns}
                data={designations}
                count={totalCount}
                loading={isLoading}
                pageIndex={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(0);
                }}
                searchValue={searchQuery}
                onSearchChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(0);
                }}
                searchPlaceholder={t("ums.designations.searchPlaceholder", { defaultValue: "Search designations..." })}
                title={t("ums.designations.title", { defaultValue: "Designations Master" })}
                description={t("ums.designations.subtitle", { defaultValue: "Manage organizational designations." })}
                onAddNew={handleOpenCreate}
                addNewLabel={t("ums.designations.addDesignation", { defaultValue: "Add Designation" })}
                onExport={handleExportCsv}
            />

            <DesignationForm
                isOpen={isFormOpen}
                isEditing={Boolean(editingDesignation)}
                values={formValues}
                errors={formErrors}
                isSubmitting={isSubmitting}
                onChange={setFormValues}
                onCancel={handleCloseForm}
                onSubmit={handleSubmitForm}
            />

            {viewingDesignation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#E5E0D8] px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <Briefcase size={18} className="text-[#037F8C]" />
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {viewingDesignation.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewingDesignation(null)}
                                className="rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D] cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div>
                                <span className="text-xs font-semibold text-[#857E74]">
                                    {t("ums.designations.form.descriptionField", { defaultValue: "Description" })}
                                </span>
                                <p className="mt-1 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3 text-sm text-[#45413C]">
                                    {viewingDesignation.description || "—"}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-[#857E74]">
                                    {t("common.createdAt", { defaultValue: "Created At" })}
                                </span>
                                <p className="mt-1 text-sm text-[#45413C]">
                                    {viewingDesignation.createdAt ? String(viewingDesignation.createdAt).slice(0, 10) : "—"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-[#E5E0D8] px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setViewingDesignation(null)}
                                className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] cursor-pointer"
                            >
                                {t("common.close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deletingDesignation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626]">
                                <Trash2 size={19} />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {t("ums.designations.deleteTitle", { defaultValue: "Delete Designation" })}
                                </h2>
                                <p className="text-xs text-[#6E6862]">
                                    {deletingDesignation.name}
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-[#45413C]">
                            {t("ums.designations.deleteConfirmDesc", { defaultValue: "Are you sure you want to delete this designation?" })}
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingDesignation(null)}
                                disabled={deleteMutation.isPending}
                                className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] cursor-pointer disabled:opacity-50"
                            >
                                {t("common.cancel", { defaultValue: "Cancel" })}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={deleteMutation.isPending}
                                className="rounded-lg bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B91C1C] cursor-pointer disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "..." : t("common.delete", { defaultValue: "Delete" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmsDesignationsPage;