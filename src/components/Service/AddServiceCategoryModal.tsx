import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { serviceApi } from "../../api/api";
import { serviceCategorySchema, type ServiceCategoryFormValues } from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

export enum ServiceCategoryStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    INITIATED = 'initiated',
    REJECTED = 'rejected',
}

interface AddServiceCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export const AddServiceCategoryModal: React.FC<AddServiceCategoryModalProps> = ({
    isOpen,
    onClose,
    initialData,
}) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceCategoryFormValues>({
        resolver: zodResolver(serviceCategorySchema),
        mode: "onSubmit",
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            status: initialData?.status || ServiceCategoryStatus.ACTIVE,
        },
    });

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                name: initialData.name || "",
                description: initialData.description || "",
                status: initialData.status || ServiceCategoryStatus.ACTIVE,
            });
        } else if (isOpen && !initialData) {
            reset({
                name: "",
                description: "",
                status: ServiceCategoryStatus.ACTIVE,
            });
        }
    }, [isOpen, initialData, reset]);

    const handleCloseModal = () => {
        reset({ name: "", description: "", status: ServiceCategoryStatus.ACTIVE });
        onClose();
    };

    const mutation = useMutation({
        mutationFn: (data: ServiceCategoryFormValues) =>
            serviceApi.createServiceCategory({
                ...data,
                ...(initialData?.id ? { id: initialData.id } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
            handleCloseModal();
        },
        onError: (error) => {
            console.error("Failed to save service category:", error);
        },
    });

    const onSubmit = (data: ServiceCategoryFormValues) => {
        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E5E0D8] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] text-start">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                            {initialData ? t("categories.editTitle") : t("categories.addTitle")}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t("categories.subtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={mutation.isPending}
                        aria-label={t("common.close")}
                        className="text-[#8C847A] hover:text-[#0D0D0D] text-xl font-bold leading-none focus:outline-none p-1 rounded-md hover:bg-[#EFECE6]"
                    >
                        ×
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form
                        id="service-category-form"
                        noValidate
                        onSubmit={handleSubmit(onSubmit, (errs) => focusAndScrollToFirstError(errs))}
                        className="space-y-4"
                    >
                        {/* Category Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                {t("categories.categoryName")} <span className="text-[#B83232]">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder={t("categories.categoryNamePlaceholder")}
                                {...register("name")}
                                className={`w-full border rounded-lg p-2.5 text-sm outline-none transition ${
                                    errors.name
                                        ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                        : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                }`}
                            />
                            {errors.name && (
                                <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.name.message)}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                {t("common.status")} <span className="text-[#B83232]">*</span>
                            </label>
                            <select
                                {...register("status")}
                                className={`w-full border rounded-lg p-2.5 text-sm outline-none transition bg-white ${
                                    errors.status
                                        ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                        : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                }`}
                            >
                                <option value={ServiceCategoryStatus.ACTIVE}>{t("common.active")}</option>
                                <option value={ServiceCategoryStatus.INACTIVE}>{t("common.inactive")}</option>
                                <option value={ServiceCategoryStatus.INITIATED}>{t("common.initiated")}</option>
                                <option value={ServiceCategoryStatus.REJECTED}>{t("common.rejected")}</option>
                            </select>
                            {errors.status && (
                                <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.status.message)}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                {t("categories.description")}
                            </label>
                            <textarea
                                rows={3}
                                placeholder={t("categories.descriptionPlaceholder")}
                                {...register("description")}
                                className="w-full border border-[#D6CFC4] rounded-lg p-2.5 text-sm outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 transition resize-none bg-white"
                            ></textarea>
                            {errors.description && (
                                <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.description.message)}</p>
                            )}
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] flex justify-end gap-3 bg-[#FAF8F5]">
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-white border border-[#D6CFC4] text-[#45413C] text-sm font-medium rounded-lg hover:bg-[#F5F2EC] transition"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        type="submit"
                        form="service-category-form"
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-[#2D3F2C] text-[#FAF8F5] text-sm font-medium rounded-lg hover:bg-[#1F2C1E] transition disabled:opacity-50"
                    >
                        {mutation.isPending ? t("common.submitting") : t("categories.saveBtn")}
                    </button>
                </div>
            </div>
        </div>
    );
};
