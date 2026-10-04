import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api"; // اضبط المسار حسب مشروعك
import { servicePortalSchema, type ServicePortalFormValues } from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";

interface AddServicePortalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
}

export const AddServicePortalModal: React.FC<AddServicePortalModalProps> = ({
    isOpen,
    onClose,
    initialData,
}) => {
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        trigger,
        reset,
        formState: { errors },
    } = useForm<ServicePortalFormValues>({
        resolver: zodResolver(servicePortalSchema),
        mode: "onSubmit",
        defaultValues: {
            name: initialData?.name || "",
            url: initialData?.url || "",
            description: initialData?.description || "",
            contact_number: initialData?.contact_number || undefined,
            email: initialData?.email || "",
        },
    });

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                name: initialData.name || "",
                url: initialData.url || "",
                description: initialData.description || "",
                contact_number: initialData.contact_number || undefined,
                email: initialData.email || "",
            });
        } else if (isOpen && !initialData) {
            reset({
                name: "",
                url: "",
                description: "",
                contact_number: undefined,
                email: "",
            });
        }
    }, [isOpen, initialData, reset]);

    const mutation = useMutation({
        mutationFn: (data: ServicePortalFormValues) =>
            serviceApi.createServicePortal({
                ...data,
                ...(initialData?.id ? { id: initialData.id } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["servicePortals"] });
            queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
            handleClose();
        },
    });

    const handleClose = () => {
        reset();
        setCurrentStep(1);
        onClose();
    };

    // Validate Step 1 fields before advancing
    const handleNext = async () => {
        const isStepOneValid = await trigger(["name", "url"]);
        if (isStepOneValid) {
            setCurrentStep(2);
        } else {
            setTimeout(() => {
                const el = document.querySelector('[name="name"], [name="url"]') as HTMLElement;
                if (el) {
                    el.focus({ preventScroll: true });
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 60);
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
    };

    const onSubmit = (data: ServicePortalFormValues) => {
        mutation.mutate(data);
    };

    const onInvalid = (formErrors: any) => {
        if (formErrors.name || formErrors.url) {
            setCurrentStep(1);
            setTimeout(() => {
                const first = formErrors.name ? "name" : "url";
                const el = document.querySelector(`[name="${first}"]`) as HTMLElement;
                if (el) {
                    el.focus({ preventScroll: true });
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 80);
        } else {
            focusAndScrollToFirstError(formErrors, ["contact_number", "email"]);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
        >
            {/* Overlay Backdrop */}
            <div
                className={`fixed inset-0 duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                    }`}
                onClick={handleClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-50 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 bg-white border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-800">
                        {initialData ? "Edit Service Portal" : "Add Service Portal"}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-8 overflow-y-auto flex-1 space-y-6">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Define and create a new portal tag to categorize and streamline
                        portal organization for better management.
                    </p>

                    {/* Stepper Progress Bar */}
                    <div className="relative flex items-center justify-between max-w-md mx-auto py-4">
                        {/* Dashed Connecting Line */}
                        <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 border-t-2 border-dashed border-slate-300 -z-0" />

                        {/* Step 1 Indicator */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center transition-colors">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <span
                                className={`text-xs font-semibold ${currentStep === 1 ? "text-[#2D3F2C]" : "text-slate-400"
                                    }`}
                            >
                                Portal Details
                            </span>
                        </div>

                        {/* Step 2 Indicator */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-medium text-sm transition-colors ${currentStep === 2
                                    ? "border-[#2D3F2C] text-[#2D3F2C] bg-white border-dashed"
                                    : "border-slate-300 text-slate-400 bg-white border-dashed"
                                    }`}
                            >
                                2
                            </div>
                            <span
                                className={`text-xs font-semibold ${currentStep === 2 ? "text-[#2D3F2C]" : "text-slate-300"
                                    }`}
                            >
                                Portal Contact Details
                            </span>
                        </div>
                    </div>

                    {/* Form Card Container */}
                    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                        <form id="portal-form" onSubmit={handleSubmit(onSubmit, onInvalid)}>
                            {/* STEP 1: Portal Details */}
                            <div className={currentStep === 1 ? "space-y-5" : "hidden"}>
                                <h3 className="text-base font-bold text-slate-800 mb-4">
                                    Portal Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Portal Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Portal Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Portal Name"
                                            {...register("name")}
                                            className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                                                errors.name
                                                    ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
                                                    : "border-slate-200 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                                            }`}
                                        />
                                        {errors.name && (
                                            <span className="text-[10px] text-red-500 mt-1 block">
                                                {errors.name.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Portal URL */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Portal URL <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Portal URL"
                                            {...register("url")}
                                            className={`w-full px-3.5 py-2.5 bg-slate-50/60 border rounded-lg text-xs focus:outline-none focus:ring-2 ${
                                                errors.url
                                                    ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
                                                    : "border-slate-200 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                                            }`}
                                        />
                                        {errors.url && (
                                            <span className="text-[10px] text-red-500 mt-1 block">
                                                {errors.url.message}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Portal Description */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Portal Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Enter Portal Description"
                                        {...register("description")}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] resize-none"
                                    />
                                    {errors.description && (
                                        <span className="text-[10px] text-red-500 mt-1 block">
                                            {errors.description.message}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* STEP 2: Portal Contact Details */}
                            <div className={currentStep === 2 ? "space-y-5" : "hidden"}>
                                <h3 className="text-base font-bold text-slate-800 mb-4">
                                    Portal Contact Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Contact Number */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Contact Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Contact Number"
                                            {...register("contact_number", { valueAsNumber: true })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                                        />
                                        {errors.contact_number && (
                                            <span className="text-[10px] text-red-500 mt-1 block">
                                                {String(errors.contact_number.message || '')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Email Address */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Enter Email Address"
                                            {...register("email")}
                                            className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]"
                                        />
                                        {errors.email && (
                                            <span className="text-[10px] text-red-500 mt-1 block">
                                                {errors.email.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end items-center gap-3 px-8 py-4 border-t border-slate-100 bg-white">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors"
                    >
                        Cancel
                    </button>

                    {currentStep === 2 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                        >
                            Back
                        </button>
                    )}

                    {currentStep === 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="portal-form"
                            disabled={mutation.isPending}
                            className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            {mutation.isPending ? "Submitting..." : "Submit"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};