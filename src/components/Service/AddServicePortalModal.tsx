import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { serviceApi } from "../../api/api";
import { servicePortalSchema, type ServicePortalFormValues } from "../../schemas/serviceSchema";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

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
    const { t } = useTranslation();
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

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        setCurrentStep(1);
    }

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

    const handleCloseModal = () => {
        reset({
            name: "",
            url: "",
            description: "",
            contact_number: undefined,
            email: "",
        });
        setCurrentStep(1);
        onClose();
    };

    const mutation = useMutation({
        mutationFn: (data: ServicePortalFormValues) =>
            serviceApi.createServicePortal({
                ...data,
                ...(initialData?.id ? { id: initialData.id } : {}),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["servicePortals"] });
            queryClient.invalidateQueries({ queryKey: ["serviceTags"] });
            handleCloseModal();
        },
        onError: (error) => {
            console.error("Failed to save service portal:", error);
        },
    });

    const handleNextStep = async () => {
        const isStep1Valid = await trigger(["name", "url", "description"]);
        if (isStep1Valid) {
            setCurrentStep(2);
        } else {
            focusAndScrollToFirstError(errors);
        }
    };

    const onSubmit = (data: ServicePortalFormValues) => {
        mutation.mutate(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E5E0D8] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-start">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                            {initialData ? t("portals.editTitle") : t("portals.addTitle")}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t("portals.subtitle")}
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
                    {/* Stepper UI */}
                    <div className="flex items-center justify-center mb-8">
                        {/* Step 1 */}
                        <div className="flex items-center">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    currentStep >= 1
                                        ? "bg-[#2D3F2C] text-white"
                                        : "bg-[#EFECE6] text-[#8C847A]"
                                }`}
                            >
                                1
                            </div>
                            <span
                                className={`ms-2 text-xs font-medium ${
                                    currentStep >= 1
                                        ? "text-[#2D3F2C] font-semibold"
                                        : "text-[#8C847A]"
                                }`}
                            >
                                {t("portals.step1")}
                            </span>
                        </div>

                        {/* Line */}
                        <div className="w-16 h-px bg-[#D6CFC4] mx-4"></div>

                        {/* Step 2 */}
                        <div className="flex items-center">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    currentStep === 2
                                        ? "bg-[#2D3F2C] text-white"
                                        : "bg-[#EFECE6] text-[#8C847A]"
                                }`}
                            >
                                2
                            </div>
                            <span
                                className={`ms-2 text-xs font-medium ${
                                    currentStep === 2
                                        ? "text-[#2D3F2C] font-semibold"
                                        : "text-[#8C847A]"
                                }`}
                            >
                                {t("portals.step2")}
                            </span>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form
                        id="service-portal-form"
                        noValidate
                        onSubmit={handleSubmit(onSubmit, (errs) => focusAndScrollToFirstError(errs))}
                        className="space-y-4"
                    >
                        {/* STEP 1 FIELDS */}
                        <div className={currentStep === 1 ? "block space-y-4" : "hidden"}>
                            {/* Portal Name */}
                            <div>
                                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                    {t("portals.portalName")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={t("portals.portalNamePlaceholder")}
                                    {...register("name")}
                                    className={`w-full border rounded-lg p-2.5 text-sm outline-none transition ${
                                        errors.name
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                    }`}
                                />
                                {errors.name && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.name.message)}
                                    </p>
                                )}
                            </div>

                            {/* Portal URL */}
                            <div>
                                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                    {t("portals.portalUrl")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input
                                    type="url"
                                    dir="ltr"
                                    placeholder={t("portals.portalUrlPlaceholder")}
                                    {...register("url")}
                                    className={`w-full border rounded-lg p-2.5 text-sm outline-none transition text-start ${
                                        errors.url
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                    }`}
                                />
                                {errors.url && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.url.message)}
                                    </p>
                                )}
                            </div>

                            {/* Portal Description */}
                            <div>
                                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                    {t("portals.portalDescription")}
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder={t("portals.portalDescriptionPlaceholder")}
                                    {...register("description")}
                                    className="w-full border border-[#D6CFC4] rounded-lg p-2.5 text-sm outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 transition resize-none bg-white"
                                ></textarea>
                                {errors.description && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.description.message)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* STEP 2 FIELDS */}
                        <div className={currentStep === 2 ? "block space-y-4" : "hidden"}>
                            {/* Contact Number */}
                            <div>
                                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                    {t("portals.contactNumber")}
                                </label>
                                <input
                                    type="number"
                                    dir="ltr"
                                    placeholder={t("portals.contactNumberPlaceholder")}
                                    {...register("contact_number", {
                                        setValueAs: (v) =>
                                            v === "" || v === null || isNaN(Number(v))
                                                ? undefined
                                                : Number(v),
                                    })}
                                    className={`w-full border rounded-lg p-2.5 text-sm outline-none transition text-start ${
                                        errors.contact_number
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                    }`}
                                />
                                {errors.contact_number && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.contact_number.message)}
                                    </p>
                                )}
                            </div>

                            {/* Email Address */}
                            <div>
                                <label className="block text-sm font-medium text-[#0D0D0D] mb-1">
                                    {t("portals.emailAddress")}
                                </label>
                                <input
                                    type="email"
                                    dir="ltr"
                                    placeholder={t("portals.emailAddressPlaceholder")}
                                    {...register("email")}
                                    className={`w-full border rounded-lg p-2.5 text-sm outline-none transition text-start ${
                                        errors.email
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                    }`}
                                />
                                {errors.email && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.email.message)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] flex justify-end gap-3 bg-[#FAF8F5]">
                    {currentStep === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-2 bg-white border border-[#D6CFC4] text-[#45413C] text-sm font-medium rounded-lg hover:bg-[#F5F2EC] transition"
                            >
                                {t("common.cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="px-6 py-2 bg-[#2D3F2C] text-[#FAF8F5] text-sm font-medium rounded-lg hover:bg-[#1F2C1E] transition"
                            >
                                {t("common.next")}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                disabled={mutation.isPending}
                                className="px-6 py-2 bg-white border border-[#D6CFC4] text-[#45413C] text-sm font-medium rounded-lg hover:bg-[#F5F2EC] transition"
                            >
                                {t("common.back")}
                            </button>
                            <button
                                type="submit"
                                form="service-portal-form"
                                disabled={mutation.isPending}
                                className="px-6 py-2 bg-[#2D3F2C] text-[#FAF8F5] text-sm font-medium rounded-lg hover:bg-[#1F2C1E] transition disabled:opacity-50"
                            >
                                {mutation.isPending ? t("common.submitting") : t("common.submit")}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
