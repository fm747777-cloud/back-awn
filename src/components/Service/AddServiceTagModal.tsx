import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api";
import { serviceTagSchema, type ServiceTagFormValues } from "../../schemas/serviceSchema";

export enum ServiceTagStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    INITIATED = 'initiated',
    REJECTED = 'rejected',
}

interface AddServiceTagModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddServiceTagModal: React.FC<AddServiceTagModalProps> = ({
    isOpen,
    onClose,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ServiceTagFormValues>({
        resolver: zodResolver(serviceTagSchema),
        defaultValues: {
            status: ServiceTagStatus.ACTIVE,
        },
    });

    const mutation = useMutation({
        mutationFn: serviceApi.createServiceTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
            reset();
            onClose();
        },
    });

    const onSubmit = (data: ServiceTagFormValues) => {
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
                        Add New Service Tag
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
                        Create a new service tag to categorize services efficiently across the platform.
                    </p>

                    <form id="add-tag-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Tag Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter tag name"
                                {...register("name")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("status")}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <option value={ServiceTagStatus.ACTIVE}>Active</option>
                                <option value={ServiceTagStatus.INITIATED}>Initiated</option>
                                <option value={ServiceTagStatus.INACTIVE}>Inactive</option>
                                <option value={ServiceTagStatus.REJECTED}>Rejected</option>
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
                        form="add-tag-form"
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-[#b5925a] hover:bg-[#a1804c] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                        {mutation.isPending ? "Submitting..." : "Save Tag"}
                    </button>
                </div>
            </div>
        </div>
    );
};