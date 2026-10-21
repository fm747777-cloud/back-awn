
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { toast } from "sonner";

import { serviceApi } from "../../api/api";
import { CreateServicePackageDto } from "../../schemas/serviceSchema";

interface ServiceGroupOption {
    id: string;
    name: string;
    codeName: string;
}

export interface PackageInitialData {
    id?: string;
    codeName?: string;
    name?: string;
    package_name?: string;
    group_type?: string;
    package_type?: string;
    billingCycle?: string;
    price?: number;
    unit_price?: string | number;
    status?: "active" | "inactive" | string;
    description?: string;
    servicesIncluded?: number;

    // IDs used to preselect groups when editing.
    service_group_ids?: string[];

    // Kept as a fallback for older callers.
    group_ids?: string[];
}

interface AddServicePackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (dto: any) => Promise<unknown>;
    mode?: "create" | "edit" | "view";
    initialData?: PackageInitialData | null;
    isSaving?: boolean;
}

interface ApiGroup {
    id?: string | number;
    name?: string;
    group_name?: string;
    groupName?: string;
    codeName?: string;
    groupCode?: string;
    group_code?: string;
    code?: string;
}

interface GroupsResponse {
    data?: ApiGroup[];
}

const extractGroups = (response: unknown): ServiceGroupOption[] => {
    const result = response as GroupsResponse | ApiGroup[] | undefined;

    const items = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
            ? result.data
            : [];

    return items
        .filter((item) => item?.id !== undefined && item?.id !== null)
        .map((item) => ({
            id: String(item.id),
            name:
                item.name ||
                item.group_name ||
                item.groupName ||
                "Unnamed Group",
            codeName:
                item.codeName ||
                item.groupCode ||
                item.group_code ||
                item.code ||
                `GRP-${String(item.id).slice(0, 6)}`,
        }));
};

export const AddServicePackageModal: React.FC<
    AddServicePackageModalProps
> = ({
    isOpen,
    onClose,
    onSubmit,
    mode = "create",
    initialData,
    isSaving = false,
}) => {
        const { t } = useTranslation();

        const isView = mode === "view";
        const isEdit = mode === "edit";

        const [packageName, setPackageName] = useState("");
        const [packageType, setPackageType] = useState("");
        const [unitPrice, setUnitPrice] = useState("");
        const [status, setStatus] = useState<"active" | "inactive">("active");
        const [description, setDescription] = useState("");
        const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
        const [groupSearch, setGroupSearch] = useState("");
        const [formError, setFormError] = useState("");

        const groupsQuery = useQuery({
            queryKey: ["service-groups"],
            queryFn: async () => {
                const response = await serviceApi.getServiceGroup();
                return extractGroups(response);
            },
            enabled: isOpen,
        });

        const groups = groupsQuery.data ?? [];

        useEffect(() => {
            if (!isOpen) return;

            setPackageName(
                initialData?.package_name ?? initialData?.name ?? "",
            );
            setPackageType(
                initialData?.package_type ??
                initialData?.group_type ??
                initialData?.billingCycle ??
                "",
            );
            setUnitPrice(
                String(initialData?.unit_price ?? initialData?.price ?? ""),
            );

            setStatus(
                String(initialData?.status ?? "active").toLowerCase() === "inactive"
                    ? "inactive"
                    : "active",
            );

            setDescription(initialData?.description ?? "");

            /*
             * Parent mapping uses service_group_ids.
             * group_ids is retained as a fallback only.
             */
            setSelectedGroupIds(
                Array.from(
                    new Set(
                        (
                            initialData?.service_group_ids ??
                            initialData?.group_ids ??
                            []
                        ).map(String),
                    ),
                ),
            );

            setGroupSearch("");
            setFormError("");
        }, [isOpen, initialData]);

        const filteredGroups = useMemo(() => {
            const search = groupSearch.trim().toLowerCase();

            if (!search) return groups;

            return groups.filter(
                (group) =>
                    group.name.toLowerCase().includes(search) ||
                    group.codeName.toLowerCase().includes(search),
            );
        }, [groups, groupSearch]);

        /*
         * Keep selected IDs even if the API's current group list does not
         * include them, so editing an existing package does not silently
         * remove its existing group relationships.
         */
        const missingSelectedGroups = useMemo(() => {
            const availableIds = new Set(groups.map((group) => group.id));

            return selectedGroupIds
                .filter((id) => !availableIds.has(id))
                .map((id) => ({
                    id,
                    name: `Group ${id.slice(0, 8)}`,
                    codeName: id,
                }));
        }, [groups, selectedGroupIds]);

        const allGroups = useMemo(
            () => [...groups, ...missingSelectedGroups],
            [groups, missingSelectedGroups],
        );

        const toggleGroup = (groupId: string) => {
            if (isView) return;

            setSelectedGroupIds((current) =>
                current.includes(groupId)
                    ? current.filter((id) => id !== groupId)
                    : [...current, groupId],
            );
        };

        const handleClose = () => {
            if (isSaving) return;
            onClose();
        };

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isView || isSaving) return;

            setFormError("");

            if (!packageName.trim()) {
                setFormError(t("Package name is required"));
                return;
            }

            if (!packageType) {
                setFormError(t("Package type is required"));
                return;
            }

            if (
                unitPrice.trim() === "" ||
                !Number.isFinite(Number(unitPrice)) ||
                Number(unitPrice) < 0
            ) {
                setFormError(t("Please enter a valid unit price"));
                return;
            }

            const payload = {
                package_name: packageName.trim(),
                package_type: packageType,
                unit_price: Number(unitPrice),
                status,
                description: description.trim(),

                // API payload field expected by the package form.
                group_ids: selectedGroupIds,
            };

            try {
                await onSubmit(payload);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : t("Failed to save package");

                setFormError(message);
                toast.error(message);
            }
        };

        if (!isOpen) return null;

        return (
            <div
                className="fixed inset-0 z-[100] flex justify-end bg-black/40"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        handleClose();
                    }
                }}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="package-modal-title"
                    className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                        <div>
                            <h2
                                id="package-modal-title"
                                className="text-lg font-semibold text-gray-900"
                            >
                                {isView
                                    ? t("View Package")
                                    : isEdit
                                        ? t("Edit Package")
                                        : t("Add Package")}
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {isView
                                    ? t("View package information and linked groups")
                                    : t("Enter package information and select its groups")}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSaving}
                            aria-label={t("Close")}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                            {formError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="package-name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {t("Package Name")} *
                                </label>

                                <input
                                    id="package-name"
                                    value={packageName}
                                    onChange={(event) =>
                                        setPackageName(event.target.value)
                                    }
                                    disabled={isView || isSaving}
                                    required
                                    placeholder={t("Enter package name")}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:bg-gray-50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="package-type"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {t("Package Type")} *
                                </label>

                                <select
                                    id="package-type"
                                    value={packageType}
                                    onChange={(event) =>
                                        setPackageType(event.target.value)
                                    }
                                    disabled={isView || isSaving}
                                    required
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:bg-gray-50"
                                >
                                    <option value="">
                                        {t("Select package type")}
                                    </option>
                                    <option value="business">
                                        {t("Business")}
                                    </option>
                                    <option value="individual">
                                        {t("Individual")}
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="package-price"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {t("Unit Price")} *
                                </label>

                                <input
                                    id="package-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={unitPrice}
                                    onChange={(event) =>
                                        setUnitPrice(event.target.value)
                                    }
                                    disabled={isView || isSaving}
                                    required
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:bg-gray-50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="package-status"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {t("Status")}
                                </label>

                                <select
                                    id="package-status"
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(
                                            event.target.value as "active" | "inactive",
                                        )
                                    }
                                    disabled={isView || isSaving}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:bg-gray-50"
                                >
                                    <option value="active">{t("Active")}</option>
                                    <option value="inactive">{t("Inactive")}</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="package-description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    {t("Description")}
                                </label>

                                <textarea
                                    id="package-description"
                                    rows={3}
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    disabled={isView || isSaving}
                                    placeholder={t("Enter description")}
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10 disabled:bg-gray-50"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        {t("Service Groups")}
                                    </label>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {t("Select the groups included in this package")}
                                    </p>
                                </div>

                                {!isView && (
                                    <input
                                        type="search"
                                        value={groupSearch}
                                        onChange={(event) =>
                                            setGroupSearch(event.target.value)
                                        }
                                        placeholder={t("Search groups...")}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/10"
                                    />
                                )}

                                {groupsQuery.isLoading ? (
                                    <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
                                        {t("Loading groups...")}
                                    </p>
                                ) : groupsQuery.isError ? (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {t("Failed to load groups")}
                                        <button
                                            type="button"
                                            onClick={() => groupsQuery.refetch()}
                                            className="ml-2 font-semibold underline"
                                        >
                                            {t("Retry")}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                        {filteredGroups.length === 0 ? (
                                            <p className="p-3 text-sm text-gray-500">
                                                {t("No groups found")}
                                            </p>
                                        ) : (
                                            filteredGroups.map((group) => {
                                                const checked =
                                                    selectedGroupIds.includes(group.id);

                                                return (
                                                    <label
                                                        key={group.id}
                                                        className={`flex items-start gap-3 rounded-lg p-3 transition ${isView
                                                            ? "cursor-default"
                                                            : "cursor-pointer hover:bg-gray-50"
                                                            } ${checked
                                                                ? "bg-[#2D3F2C]/5"
                                                                : ""
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={isView || isSaving}
                                                            onChange={() =>
                                                                toggleGroup(group.id)
                                                            }
                                                            className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#2D3F2C]"
                                                        />

                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-medium text-gray-800">
                                                                {group.name}
                                                            </span>
                                                            <span className="mt-0.5 block text-xs text-gray-500">
                                                                {group.codeName}
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        {t("Selected groups")}:{" "}
                                        <strong className="text-gray-800">
                                            {selectedGroupIds.length}
                                        </strong>
                                    </span>

                                    {!isView && selectedGroupIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedGroupIds([])}
                                            disabled={isSaving}
                                            className="font-medium text-red-600 hover:underline disabled:opacity-50"
                                        >
                                            {t("Clear selection")}
                                        </button>
                                    )}
                                </div>

                                {missingSelectedGroups.length > 0 && (
                                    <p className="text-xs text-amber-700">
                                        {t("Some previously selected group IDs are not present in the current groups list. Their IDs will be preserved unless you remove them.")}
                                    </p>
                                )}

                                {missingSelectedGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                                    >
                                        <span className="break-all text-gray-600">
                                            {group.name}
                                        </span>

                                        {!isView && (
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group.id)}
                                                disabled={isSaving}
                                                className="ml-3 shrink-0 text-xs font-medium text-red-600 hover:underline"
                                            >
                                                {t("Remove")}
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isView && selectedGroupIds.length === 0 && (
                                    <p className="text-sm text-gray-500">
                                        {t("No groups assigned")}
                                    </p>
                                )}

                                {isView && selectedGroupIds.length > 0 && (
                                    <div className="space-y-2">
                                        {selectedGroupIds.map((id) => {
                                            const group = allGroups.find(
                                                (item) => item.id === id,
                                            );

                                            return (
                                                <div
                                                    key={id}
                                                    className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                                >
                                                    {group?.name ?? id}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSaving}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                {isView ? t("Close") : t("Cancel")}
                            </button>

                            {!isView && (
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving
                                        ? t("Saving...")
                                        : isEdit
                                            ? t("Save Changes")
                                            : t("Create Package")}
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        );
    };

export default AddServicePackageModal;