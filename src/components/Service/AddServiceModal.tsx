import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    addServiceSchema,
    OTHER_PAYMENT_METHODS,
    OUTPUT_DOCUMENT_OPTIONS,
    INPUT_DOCUMENT_PRESETS,
    type AddServiceFormValues,
} from "../../schemas/serviceSchema";
import { serviceApi } from "../../api/api";
import { X } from "lucide-react";

interface AddServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<AddServiceFormValues> & {
        id?: string;
        input_documents?: string[];
        output_documents?: string[];
        [key: string]: any;
    };
}

const SERVICE_GROUPS_OPTIONS = [
    { id: "grp-1", name: "Corporate & Commercial Services" },
    { id: "grp-2", name: "Workforce & Labor Operations" },
    { id: "grp-3", name: "Assets & Fleet Management" },
    { id: "grp-4", name: "Financial & Tax Compliance" },
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
    isOpen,
    onClose,
    initialData,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const queryClient = useQueryClient();
    const editorRef = useRef<HTMLDivElement>(null);
    const [editorDirection, setEditorDirection] = useState<'rtl' | 'ltr'>('rtl');
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isHeading, setIsHeading] = useState(false);
    const [hasEditorContent, setHasEditorContent] = useState(false);

    // 1. Fetching Dynamic Options via React Query
    const { data: portalsData, isLoading: isLoadingPortals } = useQuery({
        queryKey: ["servicePortals"],
        queryFn: () => serviceApi.getServicePortals({}),
        enabled: isOpen,
    });

    const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["serviceCategories"],
        queryFn: () => serviceApi.getServiceCategories({}),
        enabled: isOpen,
    });

    const { data: typesData, isLoading: isLoadingTypes } = useQuery({
        queryKey: ["serviceTypes"],
        queryFn: () => serviceApi.getServiceTypes({}),
        enabled: isOpen,
    });

    const { data: tagsData, isLoading: isLoadingTags } = useQuery({
        queryKey: ["serviceTags"],
        queryFn: () => serviceApi.getServiceTags({}),
        enabled: isOpen,
    });

    const portals = Array.isArray(portalsData) ? portalsData : portalsData?.data || [];
    const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [];
    const types = Array.isArray(typesData) ? typesData : typesData?.data || [];
    const tags = Array.isArray(tagsData) ? tagsData : tagsData?.data || [];

    // Multi-select document states for Step 3
    const [inputDocs, setInputDocs] = useState<string[]>([
        "Commercial Registration (السجل التجاري)",
        "National ID / Iqama (الهوية الوطنية / الإقامة)",
    ]);
    const [selectedInputPreset, setSelectedInputPreset] = useState("");

    const [outputDocs, setOutputDocs] = useState<string[]>([
        "شهادة السجل التجاري (Commercial Registration Certificate)",
    ]);
    const [selectedOutputPreset, setSelectedOutputPreset] = useState("");

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
        defaultValues: {
            group_type: "business",
            service_title: "",
            service_description: "",
            serviceGroup_id: "",
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
            input_documents: [
                "Commercial Registration (السجل التجاري)",
                "National ID / Iqama (الهوية الوطنية / الإقامة)",
            ],
            output_documents: [
                "شهادة السجل التجاري (Commercial Registration Certificate)",
            ],
            process_description: "",
        },
    });

    const serviceValidity = watch("service_validity");
    const sadadPaymentAvailable = watch("sadad_payment_available");

    // Synchronize editor DOM content when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const initDesc = initialData.process_description || (initialData as any).processDescription || "";
                const initInputs = initialData.input_documents || (initialData as any).inputDocuments || [];
                const initOutputs = initialData.output_documents || (initialData as any).outputDocuments || [];
                
                reset({
                    group_type: initialData.group_type || (initialData as any).relatedTo || "business",
                    service_title: initialData.service_title || (initialData as any).title || "",
                    service_description: initialData.service_description || (initialData as any).description || "",
                    serviceGroup_id: initialData.serviceGroup_id || "",
                    servicePortal_id: initialData.servicePortal_id || "",
                    service_category_id: initialData.service_category_id || "",
                    serviceType_id: initialData.serviceType_id || "",
                    service_processing_time: String(initialData.service_processing_time || (initialData as any).processingTime || "1"),
                    service_processing_frequen: initialData.service_processing_frequen || (initialData as any).frequency || "days",
                    serviceTag_id: initialData.serviceTag_id || "",
                    service_validity: initialData.service_validity || ((initialData as any).validity === "Recurring" ? "recurring" : "one_time"),
                    service_period: initialData.service_period || "1",
                    period_type: initialData.period_type || "years",
                    recurring_type: initialData.recurring_type || "yearly",
                    service_responsible_department_id: initialData.service_responsible_department_id || "dept-1",
                    service_submission_mode: initialData.service_submission_mode || "hybrid",
                    confirmation_required: Boolean(initialData.confirmation_required),
                    delegation_required: initialData.delegation_required !== undefined ? initialData.delegation_required : ((initialData as any).delegationRequired === "Yes"),
                    sadad_payment_available: initialData.sadad_payment_available !== undefined ? initialData.sadad_payment_available : ((initialData as any).sadadAvailable === "Yes"),
                    other_payment_method_id: initialData.other_payment_method_id || "",
                    service_fees: String(initialData.service_fees !== undefined ? initialData.service_fees : (initialData as any).fee !== undefined ? (initialData as any).fee : "00"),
                    input_documents: initInputs,
                    output_documents: initOutputs,
                    process_description: initDesc,
                });

                setInputDocs(initInputs);
                setOutputDocs(initOutputs);

                const hasText = Boolean(initDesc && initDesc.replace(/<[^>]*>/g, "").trim().length > 0);
                setHasEditorContent(hasText);

                if (editorRef.current) {
                    editorRef.current.innerHTML = initDesc;
                }
            } else {
                const defaultInputs = [
                    "Commercial Registration (السجل التجاري)",
                    "National ID / Iqama (الهوية الوطنية / الإقامة)",
                ];
                const defaultOutputs = [
                    "شهادة السجل التجاري (Commercial Registration Certificate)",
                ];
                reset({
                    group_type: "business",
                    service_title: "",
                    service_description: "",
                    serviceGroup_id: "",
                    servicePortal_id: "",
                    service_category_id: "",
                    serviceType_id: "",
                    service_processing_time: "1",
                    service_processing_frequen: "days",
                    serviceTag_id: "",
                    service_validity: "recurring",
                    service_period: "1",
                    period_type: "years",
                    recurring_type: "yearly",
                    service_responsible_department_id: "dept-1",
                    service_submission_mode: "hybrid",
                    confirmation_required: false,
                    delegation_required: false,
                    sadad_payment_available: false,
                    other_payment_method_id: "",
                    service_fees: "00",
                    input_documents: defaultInputs,
                    output_documents: defaultOutputs,
                    process_description: "",
                });

                setInputDocs(defaultInputs);
                setOutputDocs(defaultOutputs);
                setHasEditorContent(false);

                if (editorRef.current) {
                    editorRef.current.innerHTML = "";
                }
            }
        }
    }, [isOpen, initialData, reset]);

    // 2. Mutation for Submitting the Form
    const mutation = useMutation({
        mutationFn: (data: AddServiceFormValues) => serviceApi.createService(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            handleClose();
        },
    });

    const handleClose = () => {
        reset();
        setCurrentStep(1);
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setEditorDirection("rtl");
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setIsHeading(false);
        onClose();
    };

    // Field validation rules per step
    const getStep1Fields = (): (keyof AddServiceFormValues)[] => {
        const baseFields: (keyof AddServiceFormValues)[] = [
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
            baseFields.push("service_period");
        }

        return baseFields;
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            const isStep1Valid = await trigger(getStep1Fields());
            if (isStep1Valid) setCurrentStep(2);
        } else if (currentStep === 2) {
            const step2Fields: (keyof AddServiceFormValues)[] = ["sadad_payment_available"];
            if (!sadadPaymentAvailable) {
                step2Fields.push("other_payment_method_id");
            }
            const isStep2Valid = await trigger(step2Fields);
            if (isStep2Valid) setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    // Document Handlers
    const addInputDoc = (docName: string) => {
        const trimmed = docName.trim();
        if (trimmed && !inputDocs.includes(trimmed)) {
            const updated = [...inputDocs, trimmed];
            setInputDocs(updated);
            setValue("input_documents", updated);
            setSelectedInputPreset("");
        }
    };

    const removeInputDoc = (docToRemove: string) => {
        const updated = inputDocs.filter((doc) => doc !== docToRemove);
        setInputDocs(updated);
        setValue("input_documents", updated);
    };

    const addOutputDoc = (docName: string) => {
        const trimmed = docName.trim();
        if (trimmed && !outputDocs.includes(trimmed)) {
            const updated = [...outputDocs, trimmed];
            setOutputDocs(updated);
            setValue("output_documents", updated);
            setSelectedOutputPreset("");
        }
    };

    const removeOutputDoc = (docToRemove: string) => {
        const updated = outputDocs.filter((doc) => doc !== docToRemove);
        setOutputDocs(updated);
        setValue("output_documents", updated);
    };

    const isInsideHeading = (): boolean => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        let node: Node | null = sel.anchorNode;
        while (node && node !== editorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = (node as HTMLElement).tagName.toLowerCase();
                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
                    return true;
                }
            }
            node = node.parentNode;
        }
        return false;
    };

    const checkActiveFormats = () => {
        try {
            setIsBold(document.queryCommandState("bold"));
            setIsItalic(document.queryCommandState("italic"));
            setIsUnderline(document.queryCommandState("underline"));
            const block = document.queryCommandValue("formatBlock");
            const headingActive = block === "h3" || block === "H3" || block === "<h3>" || isInsideHeading();
            setIsHeading(headingActive);
        } catch {
            // ignore
        }
    };

    // Rich Text Editor Commands
    const executeEditorCommand = (command: string, value: string | undefined = undefined) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, value);
        syncEditorContent();
        checkActiveFormats();
    };

    const syncEditorContent = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            const text = (editorRef.current.innerText || editorRef.current.textContent || "").trim();
            const hasText = text.length > 0;
            setHasEditorContent(hasText);
            setValue("process_description", hasText ? html : "", { shouldDirty: true });
        }
    };

    const toggleHeading = () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        if (isInsideHeading()) {
            try {
                document.execCommand("formatBlock", false, "<p>");
            } catch {
                document.execCommand("formatBlock", false, "p");
            }
        } else {
            try {
                document.execCommand("formatBlock", false, "<h3>");
            } catch {
                document.execCommand("formatBlock", false, "h3");
            }
        }
        syncEditorContent();
        checkActiveFormats();
    };

    const handleSetDirection = (dir: "rtl" | "ltr") => {
        setEditorDirection(dir);
        if (editorRef.current) {
            editorRef.current.dir = dir;
            editorRef.current.style.direction = dir;
            editorRef.current.style.textAlign = dir === "rtl" ? "right" : "left";
            
            // Also apply direction to selected block element if inside editor
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node: Node | null = sel.anchorNode;
                while (node && node !== editorRef.current) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;
                        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(el.tagName.toLowerCase())) {
                            el.dir = dir;
                            el.style.direction = dir;
                            el.style.textAlign = dir === "rtl" ? "right" : "left";
                            break;
                        }
                    }
                    node = node.parentNode;
                }
            }
            editorRef.current.focus();
        }
        syncEditorContent();
    };

    const onSubmit = (data: AddServiceFormValues) => {
        const text = editorRef.current ? (editorRef.current.innerText || editorRef.current.textContent || "").trim() : "";
        const finalProcess = text ? (editorRef.current?.innerHTML || data.process_description || "") : "";
        mutation.mutate({
            ...data,
            ...(initialData?.id ? { id: initialData.id } : {}),
            process_description: finalProcess,
            input_documents: inputDocs,
            output_documents: outputDocs,
        });
    };

    const steps = [
        { id: 1, title: "Service Information" },
        { id: 2, title: "Payment Information" },
        { id: 3, title: "Documents Information" },
        { id: 4, title: "Service Process" },
    ];

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
            {/* Drawer Overlay */}
            <div className="fixed inset-0 bg-slate-900/20" onClick={handleClose} />

            {/* Drawer Container */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {initialData?.id ? "Edit Service" : "Add New Service"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {initialData?.id
                                ? "Update service details, documents, and process descriptions."
                                : "Introduce a new service by entering key details to enhance offerings and streamline customer access."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between px-2">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center gap-1.5 z-10">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                            currentStep === step.id
                                                ? "bg-[#2D3F2C] text-white ring-4 ring-[#2D3F2C]/10"
                                                : currentStep > step.id
                                                    ? "bg-[#2D3F2C] text-white"
                                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                        }`}
                                    >
                                        {currentStep > step.id ? "✓" : step.id}
                                    </div>
                                    <span
                                        className={`text-[10px] text-center max-w-[80px] ${
                                            currentStep === step.id
                                                ? "font-semibold text-slate-800"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div
                                        className={`flex-1 h-[2px] -mt-5 mx-1 ${
                                            currentStep > step.id ? "bg-[#2D3F2C]" : "bg-slate-200"
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <form id="add-service-form" onSubmit={handleSubmit(onSubmit)}>
                        {/* STEP 1: Service Information */}
                        <div className={currentStep === 1 ? "space-y-4 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800">
                                Service Information
                            </h3>

                                {/* Group Type Radio */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        Service Related to <span className="text-slate-400 font-normal">(Entity Classification)</span>
                                    </label>
                                    <div className="flex items-center gap-6 text-xs text-slate-600">
                                        {["business", "employee", "asset"].map((item) => (
                                            <label
                                                key={item}
                                                className="flex items-center gap-2 cursor-pointer capitalize font-medium"
                                            >
                                                <input
                                                    type="radio"
                                                    value={item}
                                                    {...register("group_type")}
                                                    className="w-4 h-4 text-[#2D3F2C] focus:ring-[#2D3F2C] border-slate-300"
                                                />
                                                {item}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Service Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Service Title"
                                            {...register("service_title")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        />
                                        {errors.service_title && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.service_title.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Service Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Description <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="Provide general service description and purpose..."
                                            {...register("service_description")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 resize-none"
                                        />
                                    </div>

                                    {/* Linked Service Group */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Group <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <select
                                            {...register("serviceGroup_id")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        >
                                            <option value="">Select Service Group</option>
                                            {SERVICE_GROUPS_OPTIONS.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Service Portal Dropdown */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Portal <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("servicePortal_id")}
                                            disabled={isLoadingPortals}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {isLoadingPortals ? "Loading Portals..." : "Select Service Portal"}
                                            </option>
                                            {portals.map((item: any) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.title || item.name_ar || item.id}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.servicePortal_id && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.servicePortal_id.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Service Category Dropdown */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Category <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <select
                                            {...register("service_category_id")}
                                            disabled={isLoadingCategories}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {isLoadingCategories ? "Loading Categories..." : "Select Service Category"}
                                            </option>
                                            {categories.map((item: any) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.title || item.name_ar || item.id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Service Type Dropdown */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("serviceType_id")}
                                            disabled={isLoadingTypes}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {isLoadingTypes ? "Loading Types..." : "Select Service Type"}
                                            </option>
                                            {types.map((item: any) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.title || item.name_ar || item.id}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.serviceType_id && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.serviceType_id.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Processing Time */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Processing Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Service Processing Time (e.g. 2)"
                                            {...register("service_processing_time")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        />
                                        {errors.service_processing_time && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.service_processing_time.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Processing Frequency */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Processing Frequency <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("service_processing_frequen")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        >
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                        </select>
                                        {errors.service_processing_frequen && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.service_processing_frequen.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Service Tag Dropdown */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Tag <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("serviceTag_id")}
                                            disabled={isLoadingTags}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {isLoadingTags ? "Loading Tags..." : "Select Service Tag"}
                                            </option>
                                            {tags.map((item: any) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name || item.title || item.name_ar || item.id}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.serviceTag_id && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.serviceTag_id.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Service Validity */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Validity / Frequency <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("service_validity")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        >
                                            <option value="recurring">Recurring</option>
                                            <option value="oneTime">One Time</option>
                                        </select>
                                    </div>

                                    {/* Dynamic Recurring Fields */}
                                    {serviceValidity === "recurring" && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    Recurring Type
                                                </label>
                                                <select
                                                    {...register("recurring_type")}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                                >
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    Service Due Date
                                                </label>
                                                <input
                                                    type="date"
                                                    {...register("service_due_date")}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                                        Service Period <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 1"
                                                        {...register("service_period")}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                                    />
                                                    {errors.service_period && (
                                                        <span className="text-[10px] text-red-500 block mt-1">
                                                            {errors.service_period.message}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                                        Period Type
                                                    </label>
                                                    <select
                                                        {...register("period_type")}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                                    >
                                                        <option value="days">Days</option>
                                                        <option value="months">Months</option>
                                                        <option value="years">Years</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                                    Service Event Date
                                                </label>
                                                <input
                                                    type="date"
                                                    {...register("service_event_date")}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Confirmation Required (Default: No) */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Confirmation Required
                                        </label>
                                        <div className="flex items-center gap-4 text-xs mt-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setValue("confirmation_required", true)}
                                                    checked={watch("confirmation_required") === true}
                                                    className="w-4 h-4 text-[#2D3F2C] border-slate-300"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setValue("confirmation_required", false)}
                                                    checked={watch("confirmation_required") === false}
                                                    className="w-4 h-4 text-[#2D3F2C] border-slate-300"
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>

                                    {/* Delegation Required (Default: No) */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Delegation Required
                                        </label>
                                        <div className="flex items-center gap-4 text-xs mt-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setValue("delegation_required", true)}
                                                    checked={watch("delegation_required") === true}
                                                    className="w-4 h-4 text-[#2D3F2C] border-slate-300"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    onChange={() => setValue("delegation_required", false)}
                                                    checked={watch("delegation_required") === false}
                                                    className="w-4 h-4 text-[#2D3F2C] border-slate-300"
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>

                                    {/* Responsible Department */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Responsible Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("service_responsible_department_id")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        >
                                            <option value="dept-1">Human Resources (الموارد البشرية)</option>
                                            <option value="dept-2">Finance & Accounting (المالية)</option>
                                            <option value="dept-3">Operations & Licensing (العمليات والتراخيص)</option>
                                            <option value="dept-4">Government Relations (العلاقات الحكومية)</option>
                                        </select>
                                        {errors.service_responsible_department_id && (
                                            <span className="text-[10px] text-red-500 block mt-1">
                                                {errors.service_responsible_department_id.message}
                                            </span>
                                        )}
                                    </div>

                                    {/* Submission Mode */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Service Submission Mode <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("service_submission_mode")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        >
                                            <option value="hybrid">Hybrid (إلكتروني وحضوري)</option>
                                            <option value="online">Online (إلكتروني بالكامل)</option>
                                            <option value="offline">Offline (ميداني)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                        {/* STEP 2: Payment Information */}
                        <div className={currentStep === 2 ? "space-y-4 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800 mb-3">
                                Payment Information
                            </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Sadad Payment Available (Default: No) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                                            Sadad Payment Available <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-6 text-xs">
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                <input
                                                    type="radio"
                                                    onChange={() => {
                                                        setValue("sadad_payment_available", true);
                                                        setValue("other_payment_method_id", "");
                                                        clearErrors("other_payment_method_id");
                                                    }}
                                                    checked={sadadPaymentAvailable === true}
                                                    className="w-4 h-4 text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                                                <input
                                                    type="radio"
                                                    onChange={() => {
                                                        setValue("sadad_payment_available", false);
                                                    }}
                                                    checked={sadadPaymentAvailable === false}
                                                    className="w-4 h-4 text-[#2D3F2C] focus:ring-[#2D3F2C]"
                                                />
                                                No
                                            </label>
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                            {sadadPaymentAvailable
                                                ? "Sadad bills will be generated automatically for this service."
                                                : "Alternative payment gateway or transfer method is required."}
                                        </span>
                                    </div>

                                    {/* Other Payment Method (Conditional: Required if Sadad is No, Hidden if Sadad is Yes) */}
                                    {!sadadPaymentAvailable && (
                                        <div className="animate-in fade-in duration-200">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                                Other Payment Method <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                {...register("other_payment_method_id")}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                            >
                                                <option value="">Select Other Payment Method</option>
                                                {OTHER_PAYMENT_METHODS.map((pm) => (
                                                    <option key={pm.id} value={pm.id}>
                                                        {pm.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.other_payment_method_id && (
                                                <span className="text-[10px] text-red-500 block mt-1">
                                                    {errors.other_payment_method_id.message}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Service Fees */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Service Fees (SAR)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter Service Fees"
                                            {...register("service_fees")}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                        />
                                    </div>
                                </div>
                            </div>

                        {/* STEP 3: Documents Information */}
                        <div className={currentStep === 3 ? "space-y-6 pt-2" : "hidden"}>
                            <h3 className="text-sm font-bold text-slate-800">
                                Documents Information
                            </h3>

                            {/* Input Document Section */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Input Document <span className="text-slate-400 font-normal">(Required documents submitted by the client)</span>
                                </label>

                                <div className="flex gap-2">
                                    <select
                                        value={selectedInputPreset}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedInputPreset(val);
                                            if (val) addInputDoc(val);
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                    >
                                        <option value="">Select standard input document...</option>
                                        {INPUT_DOCUMENT_PRESETS.map((preset) => (
                                            <option key={preset} value={preset}>
                                                {preset}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tagged input documents (empty message completely removed) */}
                                {inputDocs.length > 0 && (
                                    <div className="min-h-[42px] p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2">
                                        {inputDocs.map((doc) => (
                                            <span
                                                key={doc}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-md text-xs font-medium"
                                            >
                                                {doc}
                                                <button
                                                    type="button"
                                                    onClick={() => removeInputDoc(doc)}
                                                    className="hover:text-amber-950 font-bold ml-1 cursor-pointer"
                                                    title="Remove document"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Output Document Section (Standard dropdown using existing demo data) */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Output Document <span className="text-slate-400 font-normal">(Certificate or deliverable returned upon completion)</span>
                                </label>

                                <div className="flex gap-2">
                                    <select
                                        value={selectedOutputPreset}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedOutputPreset(val);
                                            if (val) addOutputDoc(val);
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20"
                                    >
                                        <option value="">Select standard output document deliverable...</option>
                                        {OUTPUT_DOCUMENT_OPTIONS.map((opt) => (
                                            <option key={opt.id} value={opt.name}>
                                                {opt.code} — {opt.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tagged output documents (empty message completely removed) */}
                                {outputDocs.length > 0 && (
                                    <div className="min-h-[42px] p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2">
                                        {outputDocs.map((doc) => (
                                            <span
                                                key={doc}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-md text-xs font-medium"
                                            >
                                                {doc}
                                                <button
                                                    type="button"
                                                    onClick={() => removeOutputDoc(doc)}
                                                    className="hover:text-emerald-950 font-bold ml-1 cursor-pointer"
                                                    title="Remove document"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STEP 4: Service Process */}
                        <div className={currentStep === 4 ? "space-y-4 pt-2" : "hidden"}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">
                                    Service Process
                                </h3>
                                <span className="text-xs text-slate-400">
                                    Direction: <strong className="uppercase text-slate-700">{editorDirection}</strong>
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-2">
                                    Process Description <span className="text-slate-400 font-normal">(Steps, requirements, or execution flowchart)</span>
                                </label>

                                {/* Rich Text Editor Container */}
                                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                    {/* Functional Toolbar */}
                                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-700">
                                        {/* B: Bold */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                executeEditorCommand("bold");
                                            }}
                                            className={`px-2.5 py-1 border rounded text-xs font-bold transition cursor-pointer ${
                                                isBold
                                                    ? "bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-2xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Bold (Ctrl+B)"
                                        >
                                            B
                                        </button>

                                        {/* I: Italic */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                executeEditorCommand("italic");
                                            }}
                                            className={`px-2.5 py-1 border rounded text-xs italic font-serif transition cursor-pointer ${
                                                isItalic
                                                    ? "bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-2xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Italic (Ctrl+I)"
                                        >
                                            I
                                        </button>

                                        {/* U: Underline */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                executeEditorCommand("underline");
                                            }}
                                            className={`px-2.5 py-1 border rounded text-xs underline transition cursor-pointer ${
                                                isUnderline
                                                    ? "bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-2xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Underline (Ctrl+U)"
                                        >
                                            U
                                        </button>

                                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                                        {/* H: Heading */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                toggleHeading();
                                            }}
                                            className={`px-2.5 py-1 border rounded text-xs font-bold transition cursor-pointer ${
                                                isHeading
                                                    ? "bg-[#2D3F2C] text-white border-[#2D3F2C] shadow-2xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Heading Style"
                                        >
                                            H
                                        </button>

                                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />

                                        {/* RTL direction toggle */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSetDirection("rtl");
                                            }}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                                editorDirection === "rtl"
                                                    ? "bg-[#2D3F2C] text-white"
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                            title="Set Right-to-Left (RTL)"
                                        >
                                            RTL (عربي)
                                        </button>

                                        {/* LTR direction toggle */}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSetDirection("ltr");
                                            }}
                                            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                                                editorDirection === "ltr"
                                                    ? "bg-[#2D3F2C] text-white"
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                            title="Set Left-to-Right (LTR)"
                                        >
                                            LTR (English)
                                        </button>
                                    </div>

                                    {/* Editable Area */}
                                    <div className="relative">
                                        <div
                                            ref={editorRef}
                                            contentEditable
                                            dir={editorDirection}
                                            onInput={syncEditorContent}
                                            onBlur={syncEditorContent}
                                            onKeyUp={checkActiveFormats}
                                            onMouseUp={checkActiveFormats}
                                            onSelect={checkActiveFormats}
                                            data-placeholder="Enter process description details ..."
                                            className={`w-full min-h-[160px] p-3 text-xs focus:outline-none leading-relaxed [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:my-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:my-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:my-2 [&_p]:my-1.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline ${
                                                editorDirection === "rtl" ? "text-right" : "text-left"
                                            }`}
                                        />
                                        {!hasEditorContent && (
                                            <div
                                                onClick={() => editorRef.current?.focus()}
                                                className={`absolute top-3 ${
                                                    editorDirection === "rtl" ? "right-3 text-right" : "left-3 text-left"
                                                } text-slate-400 text-xs pointer-events-none select-none`}
                                            >
                                                Enter process description details ...
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Use formatting toolbar above to style headings and text. Use RTL/LTR to adjust writing direction.
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="add-service-form"
                            disabled={mutation.isPending}
                            className="px-6 py-2 bg-[#2D3F2C] hover:bg-[#233222] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {mutation.isPending ? "Submitting..." : "Submit"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
