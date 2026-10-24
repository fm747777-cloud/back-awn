import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "../../components/DataTable";
import { umsApi } from "../../api/api";

interface DepartmentRecord {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
}

interface DepartmentResponse {
    data?: DepartmentRecord[];
    items?: DepartmentRecord[];
    results?: DepartmentRecord[];
    totalItems?: number;
    total?: number;
    meta?: {
        total?: number;
    };
}

interface DepartmentFormValues {
    name: string;
    description: string;
}

const DEFAULT_FORM: DepartmentFormValues = {
    name: "",
    description: "",
};

const extractDepartments = (response: DepartmentResponse | DepartmentRecord[] | undefined): DepartmentRecord[] => {
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

export const UmsDepartmentsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<DepartmentRecord | null>(null);
    const [viewingDepartment, setViewingDepartment] = useState<DepartmentRecord | null>(null);
    const [deletingDepartment, setDeletingDepartment] = useState<DepartmentRecord | null>(null);

    const [formValues, setFormValues] = useState<DepartmentFormValues>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof DepartmentFormValues, string>>>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: departmentsResponse, isLoading, isError, refetch } = useQuery({
        queryKey: [
            "ums",
            "departments",
            {
                page: pageIndex + 1,
                limit: pageSize,
                search: debouncedSearch,
            },
        ],
        queryFn: () => umsApi.getDepartments({
            page: pageIndex + 1,
            limit: pageSize,
            search: debouncedSearch || undefined,
        }),
        placeholderData: (previousData) => previousData,
    });

    const departments = useMemo<DepartmentRecord[]>(() => {
        return extractDepartments(departmentsResponse);
    }, [departmentsResponse]);

    const totalCount = departmentsResponse?.count;

    const createMutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) => umsApi.createDepartment(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "departments"] });
            toast.success(t("ums.departments.feedback.created", { defaultValue: "Department created successfully." }));
            handleCloseForm();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "Something went wrong." })));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) => umsApi.updateDepartment(id, data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "departments"] });
            toast.success(t("ums.departments.feedback.updated", { defaultValue: "Department updated successfully." }));
            handleCloseForm();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "Something went wrong." })));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => umsApi.deleteDepartment(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "departments"] });
            toast.success(t("ums.departments.feedback.deleted", { defaultValue: "Department deleted successfully." }));
            setDeletingDepartment(null);
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("ums.departments.deleteError", { defaultValue: "Failed to delete department." })));
        },
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const handleOpenCreate = useCallback(() => {
        setEditingDepartment(null);
        setFormValues(DEFAULT_FORM);
        setFormErrors({});
        setIsFormOpen(true);
    }, []);

    const handleOpenEdit = useCallback((department: DepartmentRecord) => {
        setEditingDepartment(department);
        setFormValues({
            name: department.name || "",
            description: department.description || "",
        });
        setFormErrors({});
        setIsFormOpen(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
        setEditingDepartment(null);
        setFormValues(DEFAULT_FORM);
        setFormErrors({});
    }, []);

    const validateForm = useCallback((): boolean => {
        const errors: Partial<Record<keyof DepartmentFormValues, string>> = {};
        const name = formValues.name.trim();
        const description = formValues.description.trim();

        if (!name) {
            errors.name = t("ums.departments.validation.nameRequired", { defaultValue: "Department name is required." });
        }

        if (!description) {
            errors.description = t("ums.departments.validation.descriptionRequired", { defaultValue: "Description is required." });
        }

        const duplicate = departments.find((department) => {
            const isSameDepartment = editingDepartment && department.id === editingDepartment.id;
            return !isSameDepartment && department.name.trim().toLowerCase() === name.toLowerCase();
        });

        if (duplicate) {
            errors.name = t("ums.departments.validation.duplicateName", { defaultValue: "A department with this name already exists." });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [departments, editingDepartment, formValues, t]);

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) return;

        const data = {
            name: formValues.name.trim(),
            description: formValues.description.trim(),
        };

        if (editingDepartment) {
            updateMutation.mutate({
                id: editingDepartment.id,
                data,
            });
        } else {
            createMutation.mutate(data);
        }
    }, [createMutation, editingDepartment, formValues, updateMutation, validateForm]);

    const handleConfirmDelete = useCallback(() => {
        if (!deletingDepartment) return;

        deleteMutation.mutate(deletingDepartment.id);
    }, [deleteMutation, deletingDepartment]);

    const handleExportCsv = useCallback(() => {
        if (!departments.length) {
            toast.error(t("common.noRecords", { defaultValue: "No records found." }));
            return;
        }

        const headers = ["ID", "Department Name", "Description", "Created At"];
        const escapeCsvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = departments.map((department) => [
            department.id,
            department.name,
            department.description || "",
            department.createdAt || "",
        ]);

        const csvContent = [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((row) => row.map(escapeCsvCell).join(",")),
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `departments-${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }, [departments, t]);

    const columns = useMemo<ColumnDef<any, any>[]>(() => [
        {
            accessorKey: "name",
            header: t("ums.departments.colName", { defaultValue: "Department Name" }),
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Building2 size={15} />
                    </div>

                    <span className="font-semibold text-[#0D0D0D]">
                        {row.original.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: t("ums.departments.colDescription", { defaultValue: "Description" }),
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
                        onClick={() => setViewingDepartment(row.original)}
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
                        onClick={() => setDeletingDepartment(row.original)}
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
                            {t("ums.departments.title", { defaultValue: "Departments Master" })}
                        </h1>

                        <span className="px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]">
                            DEP-MST
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-[#6E6862]">
                        {t("ums.departments.subtitle", { defaultValue: "Manage organizational departments." })}
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
                        {t("ums.departments.addDepartment", { defaultValue: "Add Department" })}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-medium text-[#6E6862]">
                        {t("ums.departments.kpi.total", { defaultValue: "Total Departments" })}
                    </span>

                    <p className="mt-3 text-2xl font-bold text-[#0D0D0D]">
                        {totalCount}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-medium text-[#6E6862]">
                        {t("ums.departments.kpi.loaded", { defaultValue: "Loaded Records" })}
                    </span>

                    <p className="mt-3 text-2xl font-bold text-[#037F8C]">
                        {departments.length}
                    </p>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                    <span className="text-xs font-medium text-[#6E6862]">
                        {t("ums.departments.kpi.page", { defaultValue: "Current Page" })}
                    </span>

                    <p className="mt-3 text-2xl font-bold text-[#0D0D0D]">
                        {pageIndex + 1}
                    </p>
                </div>
            </div>

            {isError && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-600">
                        {t("common.somethingWentWrong", { defaultValue: "Failed to load departments." })}
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
                data={departments}
                count={totalCount}
                loading={isLoading}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
                searchValue={searchQuery}
                onSearchChange={(value) => {
                    setSearchQuery(value);
                    setPageIndex(0);
                }}
                searchPlaceholder={t("ums.departments.searchPlaceholder", { defaultValue: "Search departments..." })}
                title={t("ums.departments.title", { defaultValue: "Departments Master" })}
                description={t("ums.departments.subtitle", { defaultValue: "Manage organizational departments." })}
                onAddNew={handleOpenCreate}
                addNewLabel={t("ums.departments.addDepartment", { defaultValue: "Add Department" })}
                onExport={handleExportCsv}
            />

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-[#E5E0D8] bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#E5E0D8] px-6 py-4">
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {editingDepartment
                                    ? t("ums.departments.editTitle", { defaultValue: "Edit Department" })
                                    : t("ums.departments.createTitle", { defaultValue: "Add Department" })}
                            </h2>

                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-[#45413C]">
                                    {t("ums.departments.form.name", { defaultValue: "Department Name" })}
                                </label>

                                <input
                                    type="text"
                                    value={formValues.name}
                                    onChange={(event) => setFormValues((previous) => ({ ...previous, name: event.target.value }))}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#037F8C] ${formErrors.name ? "border-red-500" : "border-[#E5E0D8]"}`}
                                    placeholder={t("ums.departments.form.namePlaceholder", { defaultValue: "Enter department name" })}
                                />

                                {formErrors.name && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-[#45413C]">
                                    {t("ums.departments.form.description", { defaultValue: "Description" })}
                                </label>

                                <textarea
                                    rows={4}
                                    value={formValues.description}
                                    onChange={(event) => setFormValues((previous) => ({ ...previous, description: event.target.value }))}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#037F8C] ${formErrors.description ? "border-red-500" : "border-[#E5E0D8]"}`}
                                    placeholder={t("ums.departments.form.descriptionPlaceholder", { defaultValue: "Enter department description" })}
                                />

                                {formErrors.description && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {formErrors.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    disabled={isSubmitting}
                                    className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] cursor-pointer disabled:opacity-50"
                                >
                                    {t("common.cancel", { defaultValue: "Cancel" })}
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : t("common.save", { defaultValue: "Save" })}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl border border-[#E5E0D8] bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-[#E5E0D8] px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <Building2 size={18} className="text-[#037F8C]" />

                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {viewingDepartment.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewingDepartment(null)}
                                className="rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] cursor-pointer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <div>
                                <span className="text-xs font-semibold text-[#857E74]">
                                    {t("ums.departments.form.description", { defaultValue: "Description" })}
                                </span>

                                <p className="mt-1 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3 text-sm text-[#45413C]">
                                    {viewingDepartment.description || "—"}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-semibold text-[#857E74]">
                                    {t("common.createdAt", { defaultValue: "Created At" })}
                                </span>

                                <p className="mt-1 text-sm text-[#45413C]">
                                    {viewingDepartment.createdAt ? String(viewingDepartment.createdAt).slice(0, 10) : "—"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-[#E5E0D8] px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setViewingDepartment(null)}
                                className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] cursor-pointer"
                            >
                                {t("common.close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deletingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl border border-[#E5E0D8] bg-white p-6 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#DC2626]">
                                <Trash2 size={19} />
                            </div>

                            <div>
                                <h2 className="text-base font-bold text-[#0D0D0D]">
                                    {t("ums.departments.deleteTitle", { defaultValue: "Delete Department" })}
                                </h2>

                                <p className="text-xs text-[#6E6862]">
                                    {deletingDepartment.name}
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-[#45413C]">
                            {t("ums.departments.deleteConfirmDesc", { defaultValue: "Are you sure you want to delete this department?" })}
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingDepartment(null)}
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

export default UmsDepartmentsPage;