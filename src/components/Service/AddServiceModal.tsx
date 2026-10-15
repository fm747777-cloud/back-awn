import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
    addServiceSchema,
    OTHER_PAYMENT_METHODS,
    type AddServiceFormValues,
} from "../../schemas/serviceSchema";
import { serviceApi } from "../../api/api";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

interface AddServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<AddServiceFormValues> & {
        id?: string;
        [key: string]: any;
    };
}

interface ServiceDoc {
    id: string;
    name?: string;
    title?: string;
    code?: string;
    type?: string;
    document_type?: string;
    documentType?: string | { id?: string; name?: string; type?: string };
    [key: string]: any;
}

const extractItems = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
};

const getDocType = (doc: ServiceDoc): string => {
    const relationType =
        typeof doc.documentType === "object"
            ? doc.documentType?.type || doc.documentType?.name
            : doc.documentType;

    return String(
        doc.type ?? doc.document_type ?? relationType ?? ""
    ).trim().toUpperCase();
};

const getDocName = (doc: ServiceDoc): string =>
    doc.name || doc.title || doc.code || doc.id;

const getInitialDocIds = (source: any): string[] => {
    const ids = source?.serviceDoc_ids;

    if (Array.isArray(ids)) {
        return ids.filter(
            (id: unknown): id is string => typeof id === "string"
        );
    }

    const relatedDocs =
        source?.serviceDocs ??
        source?.serviceDoc ??
        source?.service_docs ??
        [];

    if (!Array.isArray(relatedDocs)) return [];

    return relatedDocs
        .map((doc: any) => (typeof doc === "string" ? doc : doc?.id))
        .filter(
            (id: unknown): id is string => typeof id === "string"
        );
};

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
    isOpen,
    onClose,
    initialData,
}) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const editorRef = useRef<HTMLDivElement>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [editorDirection, setEditorDirection] = useState<"rtl" | "ltr">("rtl");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isHeading, setIsHeading] = useState(false);
    const [hasEditorContent, setHasEditorContent] = useState(false);
    const [selectedServiceDocIds, setSelectedServiceDocIds] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        trigger,
        setValue,
        watch,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm<AddServiceFormValues>({
        resolver: zodResolver(addServiceSchema),
        mode: "onSubmit",
        defaultValues: {
            group_type: "business",
            service_title: "",
            service_description: "",
            serviceGroup_id: "",
            servicePortal_id: "",
            service_category_id: "",
            serviceType_id: "",
            serviceTag_id: "",
            confirmation_required: false,
            delegation_required: false,
            service_submission_mode: "hybrid",
            sadad_payment_available: false,
            other_payment_method_id: "",
            service_fees: "00",
            service_validity: "recurring",
            service_processing_time: "1",
            service_processing_frequen: "days",
            service_period: "1",
            period_type: "years",
            recurring_type: "yearly",
            service_responsible_department_id: "dept-1",
            service_due_date: "",
            service_event_date: "",
            process_description: "",
            serviceDoc_ids: [],
        },
    });

    // Service groups: API instead of hardcoded mock data.
    const {
        data: serviceGroupsResponse,
        isLoading: isLoadingServiceGroups,
        isError: isServiceGroupsError,
        refetch: refetchServiceGroups,
    } = useQuery({
        queryKey: ["serviceGroups"],
        queryFn: () => serviceApi.getServiceGroup({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: portalsResponse,
        isLoading: isLoadingPortals,
    } = useQuery({
        queryKey: ["servicePortals"],
        queryFn: () => serviceApi.getServicePortals({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: categoriesResponse,
        isLoading: isLoadingCategories,
    } = useQuery({
        queryKey: ["serviceCategories"],
        queryFn: () => serviceApi.getServiceCategories({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: typesResponse,
        isLoading: isLoadingTypes,
    } = useQuery({
        queryKey: ["serviceTypes"],
        queryFn: () => serviceApi.getServiceTypes({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: tagsResponse,
        isLoading: isLoadingTags,
    } = useQuery({
        queryKey: ["serviceTags"],
        queryFn: () => serviceApi.getServiceTags({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: serviceDocsResponse,
        isLoading: isLoadingServiceDocs,
        isError: isServiceDocsError,
        refetch: refetchServiceDocs,
    } = useQuery({
        queryKey: ["serviceDocs"],
        queryFn: () => serviceApi.getServiceDocs({}),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: serviceDetailResponse,
        isLoading: isLoadingServiceDetail,
    } = useQuery({
        queryKey: ["service", initialData?.id],
        queryFn: () => serviceApi.getServiceById(initialData!.id!),
        enabled: isOpen && Boolean(initialData?.id),
    });

    const serviceGroups = extractItems<any>(serviceGroupsResponse);
    const portals = extractItems<any>(portalsResponse);
    const categories = extractItems<any>(categoriesResponse);
    const types = extractItems<any>(typesResponse);
    const tags = extractItems<any>(tagsResponse);
    const serviceDocs = extractItems<ServiceDoc>(serviceDocsResponse);

    const inputServiceDocs = useMemo(
        () =>
            serviceDocs.filter((doc) =>
                ["INPUT", "INPUT_DOCUMENT"].includes(getDocType(doc))
            ),
        [serviceDocs]
    );

    const outputServiceDocs = useMemo(
        () =>
            serviceDocs.filter((doc) =>
                ["OUTPUT", "OUTPUT_DOCUMENT"].includes(getDocType(doc))
            ),
        [serviceDocs]
    );

    const serviceValidity = watch("service_validity");
    const sadadPaymentAvailable = watch("sadad_payment_available");

    // Initialize the form for create/edit.
    useEffect(() => {
        if (!isOpen) return;

        if (initialData?.id && isLoadingServiceDetail) return;

        const detail =
            serviceDetailResponse?.data ?? serviceDetailResponse;

        const sourceData = initialData?.id
            ? detail && typeof detail === "object"
                ? { ...initialData, ...detail }
                : initialData
            : initialData;

        if (!sourceData) {
            reset({
                group_type: "business",
                service_title: "",
                service_description: "",
                serviceGroup_id: "",
                servicePortal_id: "",
                service_category_id: "",
                serviceType_id: "",
                serviceTag_id: "",
                confirmation_required: false,
                delegation_required: false,
                service_submission_mode: "hybrid",
                sadad_payment_available: false,
                other_payment_method_id: "",
                service_fees: "00",
                service_validity: "recurring",
                service_processing_time: "1",
                service_processing_frequen: "days",
                service_period: "1",
                period_type: "years",
                recurring_type: "yearly",
                service_responsible_department_id: "dept-1",
                service_due_date: "",
                service_event_date: "",
                process_description: "",
                serviceDoc_ids: [],
            });

            setSelectedServiceDocIds([]);
            setHasEditorContent(false);

            if (editorRef.current) editorRef.current.innerHTML = "";
            return;
        }

        const resolvedTypeId =
            sourceData.serviceType_id ||
            sourceData.serviceType?.id ||
            "";

        const matchedType = types.find(
            (item: any) => item.id === resolvedTypeId
        );

        const resolvedCategoryId =
            sourceData.service_category_id ||
            sourceData.serviceCategory?.id ||
            sourceData.serviceType?.serviceCategory?.id ||
            matchedType?.serviceCategory?.id ||
            "";

        const rawValidity = sourceData.service_validity ?? sourceData.validity ?? "recurring";

        const resolvedValidity = [
            "oneTime",
            "one_time",
            "One Time",
            "one-time",
        ].includes(rawValidity)
            ? "oneTime"
            : "recurring";

        const resolvedSadad =
            sourceData.sadad_payment_available !== undefined
                ? Boolean(sourceData.sadad_payment_available)
                : sourceData.servicePayment?.sadad_payment_available !== undefined
                    ? String(sourceData.servicePayment.sadad_payment_available) === "true"
                    : sourceData.sadadAvailable === "Yes";

        const resolvedOtherPaymentMethod =
            sourceData.other_payment_method_id ||
            sourceData.servicePayment?.other_payment_method ||
            (!resolvedSadad ? OTHER_PAYMENT_METHODS[0]?.id || "bank_transfer" : "");

        const serviceDocIds = getInitialDocIds(sourceData);
        const processDescription =
            sourceData.process_description ??
            sourceData.processDescription ??
            "";

        reset({
            group_type: sourceData.group_type || sourceData.relatedTo || "business",
            service_title: sourceData.service_title ?? sourceData.title ?? "",
            service_description:
                sourceData.service_description ?? sourceData.description ?? "",
            serviceGroup_id:
                sourceData.serviceGroup_id || sourceData.serviceGroup?.id || "",
            servicePortal_id:
                sourceData.servicePortal_id || sourceData.servicePortal?.id || "",
            service_category_id: resolvedCategoryId,
            serviceType_id: resolvedTypeId,
            serviceTag_id:
                sourceData.serviceTag_id || sourceData.serviceTag?.id || "",
            service_processing_time: String(
                sourceData.service_processing_time ??
                sourceData.processingTime ??
                "1"
            ),
            service_processing_frequen:
                sourceData.service_processing_frequen ||
                sourceData.frequency ||
                "days",
            service_validity: resolvedValidity,
            service_period: String(sourceData.service_period ?? "1"),
            period_type: sourceData.period_type || "years",
            recurring_type: sourceData.recurring_type || "yearly",
            service_due_date: sourceData.service_due_date
                ? String(sourceData.service_due_date).split("T")[0]
                : "",
            service_event_date: sourceData.service_event_date
                ? String(sourceData.service_event_date).split("T")[0]
                : "",
            service_responsible_department_id:
                sourceData.service_responsible_department_id || "dept-1",
            service_submission_mode:
                sourceData.service_submission_mode || "hybrid",
            confirmation_required: Boolean(sourceData.confirmation_required),
            delegation_required: Boolean(
                sourceData.delegation_required ??
                sourceData.delegationRequired === "Yes"
            ),
            sadad_payment_available: resolvedSadad,
            other_payment_method_id: resolvedOtherPaymentMethod,
            service_fees: String(
                sourceData.service_fees ??
                sourceData.servicePayment?.fees ??
                sourceData.fee ??
                "00"
            ),
            process_description: processDescription,
            serviceDoc_ids: serviceDocIds,
        });

        setSelectedServiceDocIds(serviceDocIds);
        setHasEditorContent(
            Boolean(processDescription.replace(/<[^>]*>/g, "").trim())
        );

        if (editorRef.current) {
            editorRef.current.innerHTML = processDescription;
        }
    }, [
        isOpen,
        initialData,
        serviceDetailResponse,
        isLoadingServiceDetail,
        reset,
        types,
    ]);

    // Keep serviceDoc_ids synchronized with the selected documents.
    useEffect(() => {
        setValue("serviceDoc_ids", selectedServiceDocIds, {
            shouldDirty: true,
        });
    }, [selectedServiceDocIds, setValue]);

    const mutation = useMutation({
        mutationFn: (data: AddServiceFormValues & { id?: string }) => {
            const { ...payload } = data as AddServiceFormValues;

            // return payload.id
            //     ? serviceApi.updateService(payload.id, payload)
            //     :
            return serviceApi.createService(payload);
        },
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ["services"] });

            if (initialData?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["service", initialData.id],
                });
            }

            toast.success(
                response?.message ||
                (initialData?.id
                    ? t("services.messages.updated")
                    : t("services.messages.created"))
            );

            handleClose();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message;

            toast.error(
                Array.isArray(message)
                    ? message[0]
                    : message || t("services.messages.saveFailed")
            );
        },
    });

    const handleClose = () => {
        reset();
        setCurrentStep(1);
        setSelectedServiceDocIds([]);
        setHasEditorContent(false);
        setEditorDirection("rtl");
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setIsHeading(false);

        if (editorRef.current) editorRef.current.innerHTML = "";

        onClose();
    };

    const getStep1Fields = (): (keyof AddServiceFormValues)[] => {
        const fields: (keyof AddServiceFormValues)[] = [
            "service_title",
            "servicePortal_id",
            "serviceType_id",
            "service_processing_time",
            "service_processing_frequen",
            "serviceTag_id",
            "service_validity",
            "service_responsible_department_id",
            "service_submission_mode",
        ];

        if (serviceValidity === "recurring") {
            fields.push("service_period");
        }

        return fields;
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            const fields = getStep1Fields();
            const valid = await trigger(fields);

            if (valid) {
                setCurrentStep(2);
            } else {
                setTimeout(
                    () => focusAndScrollToFirstError(errors, fields as string[]),
                    50
                );
            }

            return;
        }

        if (currentStep === 2) {
            const fields: (keyof AddServiceFormValues)[] = [
                "sadad_payment_available",
            ];

            if (!sadadPaymentAvailable) {
                fields.push("other_payment_method_id");
            }

            const valid = await trigger(fields);

            if (valid) {
                setCurrentStep(3);
            } else {
                setTimeout(
                    () => focusAndScrollToFirstError(errors, fields as string[]),
                    50
                );
            }

            return;
        }

        if (currentStep === 3) setCurrentStep(4);
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((previous) => previous - 1);
        }
    };

    const toggleServiceDoc = (docId: string) => {
        setSelectedServiceDocIds((previous) =>
            previous.includes(docId)
                ? previous.filter((id) => id !== docId)
                : [...previous, docId]
        );
    };

    const syncEditorContent = () => {
        if (!editorRef.current) return;

        const html = editorRef.current.innerHTML;
        const text = (
            editorRef.current.innerText ||
            editorRef.current.textContent ||
            ""
        ).trim();

        setHasEditorContent(text.length > 0);

        setValue("process_description", text ? html : "", {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    const checkActiveFormats = () => {
        try {
            setIsBold(document.queryCommandState("bold"));
            setIsItalic(document.queryCommandState("italic"));
            setIsUnderline(document.queryCommandState("underline"));

            const block = document.queryCommandValue("formatBlock");
            setIsHeading(["h1", "h2", "h3", "<h3>", "H3"].includes(block));
        } catch {
            // Browser formatting state may be unavailable.
        }
    };

    const executeEditorCommand = (command: string) => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        document.execCommand(command, false);
        syncEditorContent();
        checkActiveFormats();
    };

    const toggleHeading = () => {
        if (!editorRef.current) return;

        editorRef.current.focus();
        document.execCommand("formatBlock", false, isHeading ? "p" : "h3");
        syncEditorContent();
        checkActiveFormats();
    };

    const handleSetDirection = (direction: "rtl" | "ltr") => {
        setEditorDirection(direction);

        if (editorRef.current) {
            editorRef.current.dir = direction;
            editorRef.current.style.direction = direction;
            editorRef.current.style.textAlign =
                direction === "rtl" ? "right" : "left";
            editorRef.current.focus();
        }

        syncEditorContent();
    };

    const onInvalid = (formErrors: any) => {
        const keys = Object.keys(formErrors);
        if (!keys.length) return;

        const step1Keys = [
            "service_title",
            "servicePortal_id",
            "service_category_id",
            "serviceType_id",
            "service_processing_time",
            "service_processing_frequen",
            "serviceTag_id",
            "service_validity",
            "service_period",
            "period_type",
            "recurring_type",
            "service_responsible_department_id",
            "service_submission_mode",
            "confirmation_required",
            "delegation_required",
            "group_type",
            "serviceGroup_id",
        ];

        const step2Keys = [
            "sadad_payment_available",
            "other_payment_method_id",
            "service_fees",
        ];

        let targetStep = 1;

        if (keys.some((key) => step1Keys.includes(key))) {
            targetStep = 1;
        } else if (keys.some((key) => step2Keys.includes(key))) {
            targetStep = 2;
        } else if (keys.includes("serviceDoc_ids")) {
            targetStep = 3;
        } else if (keys.includes("process_description")) {
            targetStep = 4;
        }

        setCurrentStep(targetStep);

        setTimeout(
            () => focusAndScrollToFirstError(formErrors, keys),
            50
        );
    };

    const onSubmit = (data: AddServiceFormValues) => {
        const editorText = editorRef.current
            ? (
                editorRef.current.innerText ||
                editorRef.current.textContent ||
                ""
            ).trim()
            : "";

        const processDescription = editorText
            ? editorRef.current?.innerHTML || data.process_description || ""
            : "";

        const {
            input_documents: _oldInputs,
            output_documents: _oldOutputs,
            ...cleanData
        } = data as AddServiceFormValues & {
            input_documents?: unknown;
            output_documents?: unknown;
        };

        mutation.mutate({
            ...cleanData,
            ...(initialData?.id ? { id: initialData.id } : {}),
            process_description: processDescription,
            serviceDoc_ids: [...new Set(selectedServiceDocIds)],
        });
    };

    const steps = [
        { id: 1, title: t("services.modal.step1") },
        { id: 2, title: t("services.modal.step2") },
        { id: 3, title: t("services.modal.step3") },
        { id: 4, title: t("services.modal.step4") },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="fixed inset-0 bg-slate-900/20"
                onClick={handleClose}
            />

            <div className="fixed end-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white text-start shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {initialData?.id
                                ? t("services.modal.editTitle")
                                : t("services.modal.addTitle")}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label={t("common.close")}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <div className="flex items-center justify-between px-2">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="z-10 flex flex-col items-center gap-1.5">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${currentStep === step.id
                                            ? "bg-[#2D3F2C] text-white ring-4 ring-[#2D3F2C]/10"
                                            : currentStep > step.id
                                                ? "bg-[#2D3F2C] text-white"
                                                : "border border-slate-200 bg-slate-100 text-slate-400"
                                            }`}
                                    >
                                        {currentStep > step.id ? "✓" : step.id}
                                    </div>
                                    <span className="max-w-[90px] text-center text-[10px] text-slate-500">
                                        {step.title}
                                    </span>
                                </div>

                                {index < steps.length - 1 && (
                                    <div
                                        className={`mx-1 -mt-5 h-[2px] flex-1 ${currentStep > step.id
                                            ? "bg-[#2D3F2C]"
                                            : "bg-slate-200"
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <form
                        id="add-service-form"
                        onSubmit={handleSubmit(onSubmit, onInvalid)}
                    >
                        {/* STEP 1 */}
                        <div className={currentStep === 1 ? "space-y-4 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800">
                                {t("services.modal.step1")}
                            </h3>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                    {t("services.relatedTo")}
                                </label>

                                <div className="flex flex-wrap gap-6 text-xs text-slate-600">
                                    {["business", "employee", "asset"].map((item) => (
                                        <label key={item} className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                value={item}
                                                {...register("group_type")}
                                                className="h-4 w-4 accent-[#2D3F2C]"
                                            />
                                            {t(`services.entityTypes.${item}`, item)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.serviceTitle")} *
                                    </label>
                                    <input
                                        {...register("service_title")}
                                        placeholder={t("services.modal.serviceTitlePlaceholder")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    />
                                    {errors.service_title && (
                                        <p className="mt-1 text-[10px] text-red-500">
                                            {translateError(t, errors.service_title.message)}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.serviceDescription")}
                                    </label>
                                    <textarea
                                        rows={2}
                                        {...register("service_description")}
                                        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    />
                                </div>

                                {/* Service group API */}
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.serviceGroup")}
                                    </label>
                                    <select
                                        {...register("serviceGroup_id")}
                                        disabled={isLoadingServiceGroups}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs disabled:opacity-50"
                                    >
                                        <option value="">
                                            {isLoadingServiceGroups
                                                ? "Loading service groups..."
                                                : "Select service group"}
                                        </option>

                                        {serviceGroups.map((group: any) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name || group.group_name || group.title || group.id}
                                            </option>
                                        ))}
                                    </select>

                                    {isServiceGroupsError && (
                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <p className="text-[10px] text-red-500">
                                                Failed to load service groups.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => refetchServiceGroups()}
                                                className="text-[10px] font-semibold text-red-600 underline"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.servicePortal")} *
                                    </label>
                                    <select
                                        {...register("servicePortal_id")}
                                        disabled={isLoadingPortals}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="">
                                            {isLoadingPortals
                                                ? "Loading..."
                                                : t("services.modal.selectServicePortal")}
                                        </option>
                                        {portals.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name || item.title || item.name_ar || item.id}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.servicePortal_id && (
                                        <p className="mt-1 text-[10px] text-red-500">
                                            {translateError(t, errors.servicePortal_id.message)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.serviceCategory")}
                                    </label>
                                    <select
                                        {...register("service_category_id")}
                                        disabled={isLoadingCategories}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="">
                                            {isLoadingCategories
                                                ? "Loading..."
                                                : t("services.modal.selectServiceCategory")}
                                        </option>
                                        {categories.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name || item.title || item.name_ar || item.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.serviceType")} *
                                    </label>
                                    <select
                                        {...register("serviceType_id")}
                                        disabled={isLoadingTypes}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="">
                                            {isLoadingTypes
                                                ? "Loading..."
                                                : t("services.modal.selectServiceType")}
                                        </option>
                                        {types.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name || item.title || item.name_ar || item.id}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.serviceType_id && (
                                        <p className="mt-1 text-[10px] text-red-500">
                                            {translateError(t, errors.serviceType_id.message)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.processingTimeLabel")} *
                                    </label>
                                    <input
                                        dir="ltr"
                                        {...register("service_processing_time")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs"
                                    />
                                    {errors.service_processing_time && (
                                        <p className="mt-1 text-[10px] text-red-500">
                                            {translateError(t, errors.service_processing_time.message)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.processingFrequencyLabel")} *
                                    </label>
                                    <select
                                        {...register("service_processing_frequen")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="hours">{t("services.hours")}</option>
                                        <option value="days">{t("services.days")}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.serviceTag")} *
                                    </label>
                                    <select
                                        {...register("serviceTag_id")}
                                        disabled={isLoadingTags}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="">
                                            {isLoadingTags
                                                ? "Loading..."
                                                : t("services.modal.selectServiceTag")}
                                        </option>
                                        {tags.map((item: any) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name || item.title || item.name_ar || item.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.validity")} *
                                    </label>
                                    <select
                                        {...register("service_validity")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="recurring">{t("services.recurring")}</option>
                                        <option value="oneTime">{t("services.oneTime")}</option>
                                    </select>
                                </div>

                                {serviceValidity === "recurring" && (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                                {t("services.modal.recurringType")}
                                            </label>
                                            <select
                                                {...register("recurring_type")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                            >
                                                <option value="monthly">{t("services.monthly")}</option>
                                                <option value="yearly">{t("services.yearly")}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                                {t("services.modal.serviceDueDate")}
                                            </label>
                                            <input
                                                type="date"
                                                dir="ltr"
                                                {...register("service_due_date")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                                {t("services.modal.servicePeriod")} *
                                            </label>
                                            <input
                                                dir="ltr"
                                                {...register("service_period")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs"
                                            />
                                            {errors.service_period && (
                                                <p className="mt-1 text-[10px] text-red-500">
                                                    {translateError(t, errors.service_period.message)}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                                {t("services.modal.periodType")}
                                            </label>
                                            <select
                                                {...register("period_type")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                            >
                                                <option value="days">{t("services.days")}</option>
                                                <option value="months">{t("services.months")}</option>
                                                <option value="years">{t("services.years")}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-slate-700">
                                                {t("services.modal.serviceEventDate")}
                                            </label>
                                            <input
                                                type="date"
                                                dir="ltr"
                                                {...register("service_event_date")}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-700">
                                        {t("services.modal.confirmationRequired")}
                                    </label>
                                    <div className="flex gap-4 text-xs">
                                        {[true, false].map((value) => (
                                            <label key={String(value)} className="flex items-center gap-1.5">
                                                <input
                                                    type="radio"
                                                    checked={watch("confirmation_required") === value}
                                                    onChange={() =>
                                                        setValue("confirmation_required", value, {
                                                            shouldDirty: true,
                                                        })
                                                    }
                                                    className="h-4 w-4 accent-[#2D3F2C]"
                                                />
                                                {value ? t("common.yes") : t("common.no")}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-700">
                                        {t("services.delegationRequired")}
                                    </label>
                                    <div className="flex gap-4 text-xs">
                                        {[true, false].map((value) => (
                                            <label key={String(value)} className="flex items-center gap-1.5">
                                                <input
                                                    type="radio"
                                                    checked={watch("delegation_required") === value}
                                                    onChange={() =>
                                                        setValue("delegation_required", value, {
                                                            shouldDirty: true,
                                                        })
                                                    }
                                                    className="h-4 w-4 accent-[#2D3F2C]"
                                                />
                                                {value ? t("common.yes") : t("common.no")}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.responsibleDepartment")} *
                                    </label>
                                    <select
                                        {...register("service_responsible_department_id")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        {["dept-1", "dept-2", "dept-3", "dept-4"].map((id) => (
                                            <option key={id} value={id}>
                                                {t(`services.departments.${id}`)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-700">
                                        {t("services.modal.submissionMode")} *
                                    </label>
                                    <select
                                        {...register("service_submission_mode")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                    >
                                        <option value="hybrid">{t("services.submissionModes.hybrid")}</option>
                                        <option value="online">{t("services.submissionModes.online")}</option>
                                        <option value="offline">{t("services.submissionModes.offline")}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2 */}
                        <div className={currentStep === 2 ? "space-y-4 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800">
                                {t("services.modal.step2")}
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        {t("services.sadadAvailable")} *
                                    </label>
                                    <div className="flex gap-6 text-xs">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={sadadPaymentAvailable === true}
                                                onChange={() => {
                                                    setValue("sadad_payment_available", true, {
                                                        shouldDirty: true,
                                                    });
                                                    setValue("other_payment_method_id", "");
                                                    clearErrors("other_payment_method_id");
                                                }}
                                                className="h-4 w-4 accent-[#2D3F2C]"
                                            />
                                            {t("common.yes")}
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={sadadPaymentAvailable === false}
                                                onChange={() =>
                                                    setValue("sadad_payment_available", false, {
                                                        shouldDirty: true,
                                                    })
                                                }
                                                className="h-4 w-4 accent-[#2D3F2C]"
                                            />
                                            {t("common.no")}
                                        </label>
                                    </div>
                                </div>

                                {!sadadPaymentAvailable && (
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                                            {t("services.modal.otherPaymentMethod")} *
                                        </label>
                                        <select
                                            {...register("other_payment_method_id")}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                                        >
                                            <option value="">
                                                {t("services.modal.selectOtherPaymentMethod")}
                                            </option>
                                            {OTHER_PAYMENT_METHODS.map((method) => (
                                                <option key={method.id} value={method.id}>
                                                    {t(`services.paymentMethods.${method.id}`, method.name)}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.other_payment_method_id && (
                                            <p className="mt-1 text-[10px] text-red-500">
                                                {translateError(t, errors.other_payment_method_id.message)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                                        {t("services.modal.serviceFeesSar")}
                                    </label>
                                    <input
                                        dir="ltr"
                                        {...register("service_fees")}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-start text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: Service documents */}
                        <div className={currentStep === 3 ? "space-y-6 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800">
                                {t("services.modal.step3")}
                            </h3>

                            {isLoadingServiceDocs && (
                                <p className="text-xs text-slate-500">
                                    Loading service documents...
                                </p>
                            )}

                            {isServiceDocsError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                    <p className="text-xs text-red-600">
                                        Failed to load documents.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => refetchServiceDocs()}
                                        className="mt-2 text-xs font-semibold text-red-700 underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {!isLoadingServiceDocs && !isServiceDocsError && (
                                <>
                                    {[
                                        {
                                            title: "Input Documents",
                                            docs: inputServiceDocs,
                                        },
                                        {
                                            title: "Output Documents",
                                            docs: outputServiceDocs,
                                        },
                                    ].map(({ title, docs }) => (
                                        <div key={title} className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-700">
                                                {title}
                                            </label>

                                            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                                                {docs.length === 0 ? (
                                                    <p className="p-2 text-xs text-slate-400">
                                                        No documents available.
                                                    </p>
                                                ) : (
                                                    docs.map((doc) => (
                                                        <label
                                                            key={doc.id}
                                                            className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-xs text-slate-700 hover:bg-white"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedServiceDocIds.includes(doc.id)}
                                                                onChange={() => toggleServiceDoc(doc.id)}
                                                                className="h-4 w-4 accent-[#2D3F2C]"
                                                            />
                                                            <span className="min-w-0 flex-1">
                                                                {getDocName(doc)}
                                                            </span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                        <p className="text-xs font-semibold text-slate-700">
                                            Selected documents: {selectedServiceDocIds.length}
                                        </p>

                                        {selectedServiceDocIds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {selectedServiceDocIds.map((id) => {
                                                    const doc = serviceDocs.find(
                                                        (item) => item.id === id
                                                    );

                                                    return (
                                                        <span
                                                            key={id}
                                                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-700"
                                                        >
                                                            {doc ? getDocName(doc) : id}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleServiceDoc(id)}
                                                                aria-label="Remove document"
                                                                className="text-slate-400 hover:text-red-500"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* STEP 4: Process description */}
                        <div className={currentStep === 4 ? "space-y-4 pt-2" : "hidden"}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">
                                    {t("services.modal.step4")}
                                </h3>
                                <span className="text-xs text-slate-400">
                                    {t("services.modal.direction")}: {editorDirection.toUpperCase()}
                                </span>
                            </div>

                            <label className="block text-xs font-medium text-slate-700">
                                {t("services.modal.processDescription")}
                            </label>

                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
                                    {[
                                        {
                                            label: "B",
                                            active: isBold,
                                            command: "bold",
                                            style: "font-bold",
                                        },
                                        {
                                            label: "I",
                                            active: isItalic,
                                            command: "italic",
                                            style: "italic",
                                        },
                                        {
                                            label: "U",
                                            active: isUnderline,
                                            command: "underline",
                                            style: "underline",
                                        },
                                    ].map((item) => (
                                        <button
                                            key={item.command}
                                            type="button"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                executeEditorCommand(item.command);
                                            }}
                                            className={`rounded border px-2.5 py-1 text-xs ${item.style} ${item.active
                                                ? "border-[#2D3F2C] bg-[#2D3F2C] text-white"
                                                : "border-slate-200 bg-white text-slate-700"
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            toggleHeading();
                                        }}
                                        className={`rounded border px-2.5 py-1 text-xs font-bold ${isHeading
                                            ? "border-[#2D3F2C] bg-[#2D3F2C] text-white"
                                            : "border-slate-200 bg-white text-slate-700"
                                            }`}
                                    >
                                        H
                                    </button>

                                    <span className="mx-1 h-4 w-px bg-slate-200" />

                                    {(["rtl", "ltr"] as const).map((direction) => (
                                        <button
                                            key={direction}
                                            type="button"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                handleSetDirection(direction);
                                            }}
                                            className={`rounded px-2.5 py-1 text-xs font-semibold ${editorDirection === direction
                                                ? "bg-[#2D3F2C] text-white"
                                                : "border border-slate-200 bg-white text-slate-700"
                                                }`}
                                        >
                                            {direction.toUpperCase()}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        dir={editorDirection}
                                        onInput={syncEditorContent}
                                        onBlur={syncEditorContent}
                                        onKeyUp={checkActiveFormats}
                                        onMouseUp={checkActiveFormats}
                                        className={`min-h-[160px] w-full p-3 text-xs leading-relaxed outline-none ${editorDirection === "rtl"
                                            ? "text-right"
                                            : "text-left"
                                            } [&_h1]:my-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-base [&_h3]:font-bold [&_p]:my-1.5`}
                                    />

                                    {!hasEditorContent && (
                                        <div
                                            onClick={() => editorRef.current?.focus()}
                                            className={`pointer-events-none absolute top-3 select-none text-xs text-slate-400 ${editorDirection === "rtl"
                                                ? "right-3 text-right"
                                                : "left-3 text-left"
                                                }`}
                                        >
                                            {t("services.modal.processPlaceholder")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="rounded-lg bg-slate-100 px-5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                            {t("common.back")}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg bg-slate-100 px-5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                        {t("common.cancel")}
                    </button>

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="rounded-lg bg-[#2D3F2C] px-6 py-2 text-xs font-medium text-white hover:bg-[#233222]"
                        >
                            {t("common.next")}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="add-service-form"
                            disabled={mutation.isPending}
                            className="rounded-lg bg-[#2D3F2C] px-6 py-2 text-xs font-medium text-white hover:bg-[#233222] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mutation.isPending
                                ? t("common.submitting")
                                : t("common.submit")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};