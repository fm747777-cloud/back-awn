import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { serviceApi } from "../../api/api";
import {
    serviceCategorySchema,
    type ServiceCategoryFormValues,
} from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

export enum ServiceCategoryStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    INITIATED = "initiated",
    REJECTED = "rejected",
}

interface AddServiceCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

const EMPTY_VALUES: ServiceCategoryFormValues = {
    name: "",
    description: "",
    status: ServiceCategoryStatus.ACTIVE,
};

export const AddServiceCategoryModal: React.FC<
    AddServiceCategoryModalProps
> = ({ isOpen, onClose, initialData }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const isEditMode = Boolean(initialData?.id);
    const isClosingRef = useRef(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceCategoryFormValues>({
        resolver: zodResolver(serviceCategorySchema),
        mode: "onSubmit",
        defaultValues: EMPTY_VALUES,
    });

    useEffect(() => {
        if (!isOpen) return;

        isClosingRef.current = false;

        reset(
            initialData
                ? {
                      name: initialData.name ?? "",
                      description: initialData.description ?? "",
                      status:
                          initialData.status ?? ServiceCategoryStatus.ACTIVE,
                  }
                : EMPTY_VALUES,
        );
    }, [isOpen, initialData, reset]);

    const handleCloseModal = () => {
        if (mutation.isPending || isClosingRef.current) return;

        isClosingRef.current = true;
        onClose();
    };

    const mutation = useMutation({
        mutationFn: async (data: ServiceCategoryFormValues) => {
            const payload = {
                name: data.name.trim(),
                description: data.description?.trim() ?? "",
                status: data.status,
            };

            if (isEditMode) {
                return serviceApi.updateServiceCategory(
                    initialData.id,
                    payload,
                );
            }

            return serviceApi.createServiceCategory(payload);
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["serviceCategories"],
            });

            reset(EMPTY_VALUES);
            isClosingRef.current = true;
            onClose();
        },

        onError: (error) => {
            console.error(
                `Failed to ${isEditMode ? "update" : "create"} service category:`,
                error,
            );
        },
    });

    const onSubmit = (data: ServiceCategoryFormValues) => {
        if (mutation.isPending || isClosingRef.current) return;

        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50"
            role="presentation"
        >
            {/* Overlay */}
            <button
                type="button"
                aria-label={t("common.close")}
                onClick={handleCloseModal}
                disabled={mutation.isPending}
                className="absolute inset-0 h-full w-full cursor-default bg-[#0D0D0D]/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            />

            {/* Right Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-category-title"
                dir="ltr"
                className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-[#E5E0D8] bg-white text-start shadow-2xl animate-in slide-in-from-right duration-300 ease-out"
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#E5E0D8] bg-[#FAF8F5] px-6 py-5">
                    <div>
                        <h2
                            id="service-category-title"
                            className="text-lg font-bold text-[#0D0D0D]"
                        >
                            {isEditMode
                                ? t("categories.editTitle")
                                : t("categories.addTitle")}
                        </h2>

                        <p className="mt-1 text-xs text-[#6E6862]">
                            {t("categories.subtitle")}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={mutation.isPending}
                        aria-label={t("common.close")}
                        className="rounded-lg p-2 text-[#8C847A] transition hover:bg-[#EFECE6] hover:text-[#0D0D0D] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form
                        id="service-category-form"
                        noValidate
                        onSubmit={(e) => {
                            void handleSubmit(onSubmit, (errs) =>
                                focusAndScrollToFirstError(errs),
                            )(e);
                        }}
                        className="space-y-5"
                    >
                        {/* Category Name */}
                        <div>
                            <label
                                htmlFor="service-category-name"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("categories.categoryName")}
                                <span className="ml-1 text-[#B83232]">*</span>
                            </label>

                            <input
                                id="service-category-name"
                                type="text"
                                autoFocus
                                placeholder={t(
                                    "categories.categoryNamePlaceholder",
                                )}
                                {...register("name")}
                                aria-invalid={Boolean(errors.name)}
                                className={`w-full rounded-lg border p-2.5 text-sm outline-none transition ${
                                    errors.name
                                        ? "border-[#B83232] bg-[#FCF2F2] focus:ring-2 focus:ring-[#B83232]/15"
                                        : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                }`}
                            />

                            {errors.name && (
                                <p className="mt-1 text-xs text-[#B83232]">
                                    {translateError(t, errors.name.message)}
                                </p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="service-category-status"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("common.status")}
                                <span className="ml-1 text-[#B83232]">*</span>
                            </label>

                            <select
                                id="service-category-status"
                                {...register("status")}
                                aria-invalid={Boolean(errors.status)}
                                className={`w-full rounded-lg border bg-white p-2.5 text-sm outline-none transition ${
                                    errors.status
                                        ? "border-[#B83232] bg-[#FCF2F2] focus:ring-2 focus:ring-[#B83232]/15"
                                        : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                }`}
                            >
                                <option value={ServiceCategoryStatus.ACTIVE}>
                                    {t("common.active")}
                                </option>
                                <option value={ServiceCategoryStatus.INACTIVE}>
                                    {t("common.inactive")}
                                </option>
                                <option value={ServiceCategoryStatus.INITIATED}>
                                    {t("common.initiated")}
                                </option>
                                <option value={ServiceCategoryStatus.REJECTED}>
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
                                htmlFor="service-category-description"
                                className="mb-1.5 block text-sm font-medium text-[#0D0D0D]"
                            >
                                {t("categories.description")}
                            </label>

                            <textarea
                                id="service-category-description"
                                rows={4}
                                placeholder={t(
                                    "categories.descriptionPlaceholder",
                                )}
                                {...register("description")}
                                aria-invalid={Boolean(errors.description)}
                                className={`w-full resize-y rounded-lg border p-2.5 text-sm outline-none transition ${
                                    errors.description
                                        ? "border-[#B83232] bg-[#FCF2F2] focus:ring-2 focus:ring-[#B83232]/15"
                                        : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
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
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4">
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={mutation.isPending}
                        className="rounded-lg border border-[#D6CFC4] bg-white px-5 py-2.5 text-sm font-medium text-[#45413C] transition hover:bg-[#F5F2EC] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t("common.cancel")}
                    </button>

                    <button
                        type="submit"
                        form="service-category-form"
                        disabled={mutation.isPending}
                        className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-sm font-medium text-[#FAF8F5] transition hover:bg-[#1F2C1E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {mutation.isPending && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        )}

                        {mutation.isPending
                            ? t("common.submitting")
                            : isEditMode
                              ? t("common.save")
                              : t("categories.saveBtn")}
                    </button>
                </div>
            </aside>
        </div>
    );
};