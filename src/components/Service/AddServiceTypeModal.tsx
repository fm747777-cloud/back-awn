import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api";
import { serviceTypeSchema, type ServiceTypeFormValues } from "../../schemas/serviceSchema";

export enum ServiceTypeStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    INITIATED = 'initiated',
    REJECTED = 'rejected',
}

interface AddServiceTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export const AddServiceTypeModal: React.FC<AddServiceTypeModalProps> = ({
    isOpen,
    onClose,
    initialData,
}) => {
    const queryClient = useQueryClient();

    // جلب التصنيفات لاختيار التصنيف المرتبط بنوع الخدمة
    const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["serviceCategoriesDropdown"],
        queryFn: () => serviceApi.getServiceCategories({ page: 1, limit: 100 }),
        enabled: isOpen, // جلب البيانات فقط عند فتح المودال
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceTypeFormValues>({
        resolver: zodResolver(serviceTypeSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            serviceCategory_id: initialData?.serviceCategory?.id || initialData?.serviceCategory_id || "",
            status: initialData?.status || ServiceTypeStatus.ACTIVE,
        },
    });

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                name: initialData.name || "",
                description: initialData.description || "",
                serviceCategory_id: initialData.serviceCategory?.id || initialData.serviceCategory_id || "",
                status: initialData.status || ServiceTypeStatus.ACTIVE,
            });
        } else if (isOpen && !initialData) {
            reset({
                name: "",
                description: "",
                serviceCategory_id: "",
                status: ServiceTypeStatus.ACTIVE,
            });
        }
    }, [isOpen, initialData, reset]);

    const mutation = useMutation({
        mutationFn: (data: ServiceTypeFormValues) =>
            serviceApi.createServiceType({
                ...data,
                ...(initialData?.id ? { id: initialData.id } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceTypes"] });
            reset();
            onClose();
        },
    });

    const onSubmit = (data: ServiceTypeFormValues) => {
        mutation.mutate(data);
    };

    const categories = categoriesData?.data || [];

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
                        {initialData ? "Edit Service Type" : "Add New Service Type"}
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
                        Create a new service type and link it to a service category.
                    </p>

                    <form id="add-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Type Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter type name"
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
                                Service Category
                            </label>
                            <select
                                {...register("serviceCategory_id")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                                disabled={isLoadingCategories}
                            >
                                <option value="">
                                    {isLoadingCategories ? "Loading categories..." : "Select Service Category"}
                                </option>
                                {categories.map((category: any) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {errors.serviceCategory_id && (
                                <span className="text-[10px] text-red-500 mt-1 block">
                                    {errors.serviceCategory_id.message}
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
                                <option value={ServiceTypeStatus.ACTIVE}>Active</option>
                                <option value={ServiceTypeStatus.INITIATED}>Initiated</option>
                                <option value={ServiceTypeStatus.INACTIVE}>Inactive</option>
                                <option value={ServiceTypeStatus.REJECTED}>Rejected</option>
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
                        form="add-type-form"
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {mutation.isPending ? "Submitting..." : "Save Type"}
                    </button>
                </div>
            </div>
        </div>
    );
};