
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X, Eye, Pencil, Plus } from "lucide-react";

import { serviceApi } from "../../api/api";
import {
    serviceTypeSchema,
    type ServiceTypeFormValues,
} from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

export enum ServiceTypeStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    INITIATED = "initiated",
    REJECTED = "rejected",
}

export type ServiceTypeDrawerMode = "create" | "edit" | "view";

interface AddServiceTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    mode?: ServiceTypeDrawerMode;
}

const EMPTY_VALUES: ServiceTypeFormValues = {
    name: "",
    description: "",
    status: ServiceTypeStatus.ACTIVE,
    serviceCategory_id: "",
};

export const AddServiceTypeModal: React.FC<AddServiceTypeModalProps> = ({ isOpen, onClose, initialData, mode }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const resolvedMode: ServiceTypeDrawerMode =
        mode ?? (initialData?.id ? "edit" : "create");

    const isViewMode = resolvedMode === "view";
    const isEditMode = resolvedMode === "edit";

    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    const isClosingRef = useRef(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceTypeFormValues>({
        resolver: zodResolver(serviceTypeSchema),
        mode: "onSubmit",
        defaultValues: EMPTY_VALUES,
    });

    const {
        data: categoriesData,
        isLoading: isLoadingCategories,
    } = useQuery({
        queryKey: ["serviceCategoriesDropdown"],
        queryFn: () =>
            serviceApi.getServiceCategories({
                page: 1,
                limit: 100,
            }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const categoriesList = categoriesData?.data ?? [];

    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }

            isClosingRef.current = false;
            setShouldRender(true);

            reset(
                initialData
                    ? {
                        name: initialData.name ?? "",
                        description: initialData.description ?? "",
                        status:
                            initialData.status ??
                            ServiceTypeStatus.ACTIVE,
                        serviceCategory_id:
                            initialData.serviceCategory?.id ??
                            initialData.serviceCategory_id ??
                            "",
                    }
                    : EMPTY_VALUES,
            );

            return;
        }

        setIsVisible(false);

        closeTimerRef.current = setTimeout(() => {
            setShouldRender(false);
            closeTimerRef.current = null;
        }, 300);

        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [isOpen, initialData, reset]);

    useEffect(() => {
        if (!shouldRender || !isOpen) return;

        const frame = requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => cancelAnimationFrame(frame);
    }, [shouldRender, isOpen]);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    const handleClose = () => {
        if (mutation.isPending || isClosingRef.current) return;

        isClosingRef.current = true;
        setIsVisible(false);
        onClose();
    };

    const mutation = useMutation({
        mutationFn: async ({ data, id, editMode }: {
            data: ServiceTypeFormValues;
            id?: string;
            editMode: boolean;
        }) => {
            const payload = {
                name: data.name.trim(),
                description: data.description?.trim() ?? "",
                status: data.status,
                serviceCategory_id:
                    data.serviceCategory_id || undefined,
            };

            if (editMode) {
                if (!id) {
                    throw new Error(
                        "Service type ID is required for update",
                    );
                }

                return serviceApi.updateServiceType(id, payload);
            }

            return serviceApi.createServiceType(payload);
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["serviceTypes"],
            });
            handleClose();
            onClose()
        },

        onError: (error) => {
            console.error(
                `Failed to ${isEditMode ? "update" : "create"} service type:`,
                error,
            );
        },
    });

    const onSubmit = (data: ServiceTypeFormValues) => {
        if (
            mutation.isPending ||
            isClosingRef.current ||
            isViewMode
        ) {
            return;
        }

        mutation.mutate({
            data,
            id: initialData?.id,
            editMode: isEditMode,
        });
    };

    if (!shouldRender) return null;

    const title = isViewMode
        ? t("common.view", { defaultValue: "View" })
        : isEditMode
            ? t("types.editTitle")
            : t("types.addTitle");

    const inputClass =
        "w-full rounded-lg border border-[#D6CFC4] bg-white p-2.5 text-sm text-[#0D0D0D] outline-none transition focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 disabled:cursor-default disabled:bg-[#F5F2EC] disabled:text-[#595550]";
    return (
        <div
            className="fixed inset-0 z-[100]"
            role="presentation"
            dir="ltr"
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label={t("common.close")}
                onClick={handleClose}
                disabled={mutation.isPending}
                tabIndex={isVisible ? 0 : -1}
                className={`absolute inset-0 h-full w-full bg-[#0D0D0D]/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${isVisible
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                    }`}
            />

            {/* Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-type-drawer-title"
                aria-hidden={!isVisible}
                className={`absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-[#E5E0D8] bg-white text-start shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2">
                            {isViewMode ? (
                                <Eye size={18} className="text-[#2D3F2C]" />
                            ) : isEditMode ? (
                                <Pencil size={18} className="text-[#2D3F2C]" />
                            ) : (
                                <Plus size={18} className="text-[#2D3F2C]" />
                            )}

                            <h2
                                id="service-type-drawer-title"
                                className="text-lg font-bold text-[#0D0D0D]"
                            >
                                {title}
                            </h2>
                        </div>

                        <p className="mt-1 text-xs text-[#6E6862]">
                            {t("types.subtitle")}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={mutation.isPending}
                        aria-label={t("common.close")}
                        className="rounded-lg p-2 text-[#8C847A] transition hover:bg-[#EFECE6] hover:text-[#0D0D0D] disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form
                        id="service-type-form"
                        noValidate
                        onSubmit={handleSubmit(onSubmit, (errs) =>
                            focusAndScrollToFirstError(errs),
                        )}
                        className="space-y-5"
                    >
                        {/* Type Name */}
                        <div>
                            <label
                                htmlFor="service-type-name"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("types.typeName")}
                                <span className="ml-1 text-[#B83232]">*</span>
                            </label>

                            <input
                                id="service-type-name"
                                type="text"
                                placeholder={t("types.typeNamePlaceholder")}
                                {...register("name")}
                                disabled={isViewMode || mutation.isPending}
                                aria-invalid={Boolean(errors.name)}
                                className={`${inputClass} ${errors.name
                                    ? "border-[#B83232] bg-[#FCF2F2]"
                                    : ""
                                    }`}
                            />

                            {errors.name && (
                                <p className="mt-1 text-xs text-[#B83232]">
                                    {translateError(t, errors.name.message)}
                                </p>
                            )}
                        </div>

                        {/* Service Category */}
                        <div>
                            <label
                                htmlFor="service-type-category"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("types.serviceCategory")}
                            </label>

                            <select
                                id="service-type-category"
                                {...register("serviceCategory_id")}
                                disabled={
                                    isViewMode ||
                                    isLoadingCategories ||
                                    mutation.isPending
                                }
                                className={`${inputClass} ${errors.serviceCategory_id
                                    ? "border-[#B83232] bg-[#FCF2F2]"
                                    : ""
                                    }`}
                            >
                                <option value="">
                                    {isLoadingCategories
                                        ? t("types.loadingCategories")
                                        : t("types.selectCategory")}
                                </option>

                                {categoriesList.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            {errors.serviceCategory_id && (
                                <p className="mt-1 text-xs text-[#B83232]">
                                    {translateError(
                                        t,
                                        errors.serviceCategory_id.message,
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="service-type-status"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("common.status")}
                                <span className="ml-1 text-[#B83232]">*</span>
                            </label>

                            <select
                                id="service-type-status"
                                {...register("status")}
                                disabled={isViewMode || mutation.isPending}
                                aria-invalid={Boolean(errors.status)}
                                className={`${inputClass} ${errors.status
                                    ? "border-[#B83232] bg-[#FCF2F2]"
                                    : ""
                                    }`}
                            >
                                <option value={ServiceTypeStatus.ACTIVE}>
                                    {t("common.active")}
                                </option>
                                <option value={ServiceTypeStatus.INACTIVE}>
                                    {t("common.inactive")}
                                </option>
                                <option value={ServiceTypeStatus.INITIATED}>
                                    {t("common.initiated")}
                                </option>
                                <option value={ServiceTypeStatus.REJECTED}>
                                    {t("common.rejected")}
                                </option>
                            </select>

                            {errors.status && (
                                <p className="mt-1 text-xs text-[#B83232]">
                                    {translateError(t, errors.status.message)}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="service-type-description"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("types.description")}
                            </label>

                            <textarea
                                id="service-type-description"
                                rows={4}
                                placeholder={t("types.descriptionPlaceholder")}
                                {...register("description")}
                                disabled={isViewMode || mutation.isPending}
                                aria-invalid={Boolean(errors.description)}
                                className={`${inputClass} resize-y ${errors.description
                                    ? "border-[#B83232] bg-[#FCF2F2]"
                                    : ""
                                    }`}
                            />

                            {errors.description && (
                                <p className="mt-1 text-xs text-[#B83232]">
                                    {translateError(
                                        t,
                                        errors.description.message,
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Read-only metadata */}
                        {isViewMode && (
                            <div className="space-y-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-4">
                                <div>
                                    <p className="text-xs text-[#857E74]">
                                        {t("types.typeCode", {
                                            defaultValue: "Type Code",
                                        })}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-[#2D3F2C]">
                                        {initialData?.codeName}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-[#857E74]">
                                        {t("services.createdBy")}
                                    </p>
                                    <p className="mt-1 text-sm text-[#0D0D0D]">
                                        {initialData?.createdBy || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-[#857E74]">
                                        {t("services.createDate")}
                                    </p>
                                    <p className="mt-1 text-sm text-[#0D0D0D]" dir="ltr">
                                        {initialData?.createdAt
                                            ? String(initialData.createdAt).split("T")[0]
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={mutation.isPending}
                        className="rounded-lg border border-[#D6CFC4] bg-white px-5 py-2.5 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:opacity-50"
                    >
                        {isViewMode
                            ? t("common.close")
                            : t("common.cancel")}
                    </button>

                    {!isViewMode && (
                        <button
                            type="submit"
                            form="service-type-form"
                            disabled={mutation.isPending}
                            className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#1F2C1E] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mutation.isPending && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            )}

                            {mutation.isPending
                                ? t("common.submitting")
                                : t("types.saveBtn")}
                        </button>
                    )}
                </div>
            </aside>
        </div>
    );
};