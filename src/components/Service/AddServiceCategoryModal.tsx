import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api";
import { serviceCategorySchema, type ServiceCategoryFormValues } from "../../schemas/serviceSchema";

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
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceCategoryFormValues>({
        resolver: zodResolver(serviceCategorySchema),
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

    const mutation = useMutation({
        mutationFn: (data: ServiceCategoryFormValues) =>
            serviceApi.createServiceCategory({
                ...data,
                ...(initialData?.id ? { id: initialData.id } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceCategories"] });
            reset();
            onClose();
        },
    });

    const onSubmit = (data: ServiceCategoryFormValues) => {
        mutation.mutate(data);
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
        >
            {/* Overlay Background */}
            <div
                className={`fixed inset-0 bg-slate-900/20 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {initialData ? "Edit Service Category" : "Add New Service Category"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <p className="text-xs text-slate-500">
                        Create a new service category to organize services efficiently across the platform.
                    </p>

                    <form id="add-category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter category name"
                                {...register("name")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                            />
                            {errors.name && (
                                <span className="text-[10px] text-red-500 mt-1 block">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Enter description"
                                {...register("description")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("status")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                            >
                                <option value={ServiceCategoryStatus.ACTIVE}>Active</option>
                                <option value={ServiceCategoryStatus.INITIATED}>Initiated</option>
                                <option value={ServiceCategoryStatus.INACTIVE}>Inactive</option>
                                <option value={ServiceCategoryStatus.REJECTED}>Rejected</option>
                            </select>
                        </div>
                    </form>
                </div>

                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-category-form"
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {mutation.isPending ? "Submitting..." : "Save Category"}
                    </button>
                </div>
            </div>
        </div>
    );
};