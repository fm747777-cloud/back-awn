import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api";
import { toast } from "sonner";

interface ServiceGroupDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any | null;
    isEdit?: boolean;
}

interface ServiceItem {
    id: string;
    name?: string;
    service_title?: string;
    title?: string;
    description?: string;
    serviceType?: {
        id: string;
        name?: string;
    };
    serviceType_id?: string;
    service_category_id?: string;
    serviceCategory?: {
        id: string;
        name?: string;
    };
    [key: string]: any;
}

interface CreateServiceGroupDto {
    service_ids?: string[];
    name: string;
    description?: string;
    group_icon?: string;
    group_type?: string;
    boarding_type?: string;
    status?: string;
}

const ServiceGroupDrawer: React.FC<ServiceGroupDrawerProps> = ({
    isOpen,
    onClose,
    initialData = null,
    isEdit = Boolean(initialData?.id),
}) => {
    const queryClient = useQueryClient();

    // =========================================================
    // FORM STATE
    // =========================================================

    const [name, setName] = useState("");
    const [description, setDescription] =
        useState("");

    const [groupIcon, setGroupIcon] =
        useState("");

    const [groupType, setGroupType] =
        useState("employee");

    const [boardingType, setBoardingType] =
        useState("other");

    const [status, setStatus] =
        useState("active");

    const [nameError, setNameError] =
        useState("");

    // =========================================================
    // SERVICES STATE
    // =========================================================

    const [selectedServiceIds, setSelectedServiceIds] =
        useState<string[]>([]);

    const [serviceSearch, setServiceSearch] =
        useState("");

    const [serviceTypeFilter, setServiceTypeFilter] =
        useState("");

    const [serviceCategoryFilter, setServiceCategoryFilter] =
        useState("");

    // =========================================================
    // LOAD SERVICES
    // =========================================================

    const {
        data: servicesResponse,
        isLoading: isLoadingServices,
        isFetching: isFetchingServices,
        isError: isServicesError,
        refetch: refetchServices,
    } = useQuery({
        queryKey: [
            "services",
            {
                search: serviceSearch,
                serviceType_id:
                    serviceTypeFilter,
                service_category_id:
                    serviceCategoryFilter,
            },
        ],

        queryFn: async () => {
            return serviceApi.getServices({
                search:
                    serviceSearch.trim() ||
                    undefined,

                serviceType_id:
                    serviceTypeFilter ||
                    undefined,

                service_category_id:
                    serviceCategoryFilter ||
                    undefined,
            });
        },

        enabled: isOpen,

        staleTime: 30_000,
    });

    // =========================================================
    // NORMALIZE SERVICES RESPONSE
    // =========================================================

    const services: ServiceItem[] =
        useMemo(() => {
            if (
                Array.isArray(
                    servicesResponse
                )
            ) {
                return servicesResponse;
            }

            if (
                Array.isArray(
                    servicesResponse?.data
                )
            ) {
                return servicesResponse.data;
            }

            if (
                Array.isArray(
                    servicesResponse?.data?.data
                )
            ) {
                return servicesResponse.data
                    .data;
            }

            if (
                Array.isArray(
                    servicesResponse?.items
                )
            ) {
                return servicesResponse.items;
            }

            if (
                Array.isArray(
                    servicesResponse?.data?.items
                )
            ) {
                return servicesResponse.data
                    .items;
            }

            return [];
        }, [servicesResponse]);

    // =========================================================
    // SERVICE TYPES
    // =========================================================

    const serviceTypes = useMemo(() => {
        const map = new Map<
            string,
            {
                id: string;
                name: string;
            }
        >();

        services.forEach(
            (service) => {
                const id =
                    service.serviceType_id ||
                    service.serviceType?.id;

                const name =
                    service.serviceType
                        ?.name;

                if (id) {
                    map.set(id, {
                        id,
                        name:
                            name ||
                            "Unknown Type",
                    });
                }
            }
        );

        return Array.from(
            map.values()
        );
    }, [services]);

    // =========================================================
    // SERVICE CATEGORIES
    // =========================================================

    const serviceCategories =
        useMemo(() => {
            const map = new Map<
                string,
                {
                    id: string;
                    name: string;
                }
            >();

            services.forEach(
                (service) => {
                    const id =
                        service.service_category_id ||
                        service
                            .serviceCategory
                            ?.id;

                    const name =
                        service
                            .serviceCategory
                            ?.name;

                    if (id) {
                        map.set(id, {
                            id,
                            name:
                                name ||
                                "Unknown Category",
                        });
                    }
                }
            );

            return Array.from(
                map.values()
            );
        }, [services]);

    // =========================================================
    // CLIENT SIDE FILTER
    // =========================================================

    const filteredServices =
        useMemo(() => {
            const search =
                serviceSearch
                    .trim()
                    .toLowerCase();

            return services.filter(
                (service) => {
                    const serviceName =
                        service.name ||
                        service.service_title ||
                        service.title ||
                        "";

                    const matchesSearch =
                        !search ||
                        serviceName
                            .toLowerCase()
                            .includes(
                                search
                            );

                    const typeId =
                        service.serviceType_id ||
                        service.serviceType
                            ?.id;

                    const categoryId =
                        service.service_category_id ||
                        service
                            .serviceCategory
                            ?.id;

                    const matchesType =
                        !serviceTypeFilter ||
                        typeId ===
                        serviceTypeFilter;

                    const matchesCategory =
                        !serviceCategoryFilter ||
                        categoryId ===
                        serviceCategoryFilter;

                    return (
                        matchesSearch &&
                        matchesType &&
                        matchesCategory
                    );
                }
            );
        }, [
            services,
            serviceSearch,
            serviceTypeFilter,
            serviceCategoryFilter,
        ]);

    // =========================================================
    // SELECTED SERVICES
    // =========================================================

    const selectedServices =
        useMemo(() => {
            return selectedServiceIds
                .map((id) =>
                    services.find(
                        (service) =>
                            service.id ===
                            id
                    )
                )
                .filter(
                    Boolean
                ) as ServiceItem[];
        }, [
            services,
            selectedServiceIds,
        ]);

    // =========================================================
    // RESET
    // =========================================================

    const resetForm = () => {
        setName("");
        setDescription("");
        setGroupIcon("");
        setGroupType("employee");
        setBoardingType("other");
        setStatus("active");

        setNameError("");

        setSelectedServiceIds([]);

        setServiceSearch("");
        setServiceTypeFilter("");
        setServiceCategoryFilter("");
    };

    // =========================================================
    // INITIAL DATA
    // =========================================================

    const [prevSyncKey, setPrevSyncKey] = useState("");
    const currentSyncKey = `${isOpen}-${isEdit}-${initialData?.id ?? "new"}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            if (isEdit && initialData) {
                setName(initialData.name || "");
                setDescription(initialData.description || "");
                setGroupIcon(initialData.group_icon || "");
                setGroupType(initialData.group_type || "employee");
                setBoardingType(initialData.boarding_type || "other");
                setStatus(initialData.status || "active");
                setSelectedServiceIds(
                    Array.isArray(initialData.service_ids)
                        ? initialData.service_ids
                        : Array.isArray(initialData.services)
                            ? initialData.services.map((service: ServiceItem) => service.id)
                            : []
                );
            } else {
                resetForm();
            }
        }
    }

    // =========================================================
    // REMOVE SERVICE
    // =========================================================

    const handleRemoveService = (
        serviceId: string
    ) => {
        setSelectedServiceIds(
            (prev) =>
                prev.filter(
                    (id) =>
                        id !==
                        serviceId
                )
        );
    };

    // =========================================================
    // TOGGLE SERVICE
    // =========================================================

    const handleToggleService = (
        serviceId: string
    ) => {
        setSelectedServiceIds(
            (prev) => {
                if (
                    prev.includes(
                        serviceId
                    )
                ) {
                    return prev.filter(
                        (id) =>
                            id !==
                            serviceId
                    );
                }

                return [
                    ...prev,
                    serviceId,
                ];
            }
        );
    };

    // =========================================================
    // CREATE
    // =========================================================

    const createMutation =
        useMutation({
            mutationFn: (
                data: CreateServiceGroupDto
            ) =>
                serviceApi.createServiceGroup(
                    data
                ),

            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["serviceGroups"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["service-groups"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["services"],
                });

                resetForm();

                onClose();
            },
        });

    // =========================================================
    // UPDATE
    // =========================================================

    const updateMutation =
        useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: string;
                data: CreateServiceGroupDto;
            }) =>
                serviceApi.updateServiceGroup(
                    id,
                    data
                ),

            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["serviceGroups"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["service-groups"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["services"],
                });

                resetForm();

                onClose();
            },
        });

    // =========================================================
    // DELETE
    // =========================================================

    const deleteMutation =
        useMutation({
            mutationFn: (
                id: string
            ) =>
                serviceApi.deleteServiceGroup(
                    id
                ),

            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ["serviceGroups"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["service-groups"],
                });

                resetForm();

                onClose();
            },
            onError: (error: any) => {
                const message = error?.response?.data?.message;
                toast.error(Array.isArray(message) ? message[0] : message);
            }
        });

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName =
            name.trim();

        if (!trimmedName) {
            setNameError(
                "Group name is required"
            );
            return;
        }

        setNameError("");

        const payload: CreateServiceGroupDto =
        {
            name: trimmedName,

            description:
                description.trim() ||
                undefined,

            group_icon:
                groupIcon.trim() ||
                undefined,

            group_type:
                groupType ||
                undefined,

            boarding_type:
                boardingType ||
                undefined,

            status:
                status ||
                undefined,

            service_ids:
                selectedServiceIds,
        };

        if (isEdit && initialData?.id) {
            updateMutation.mutate(
                {
                    id: initialData.id,
                    data: payload,
                }
            );

            return;
        }
        console.log('payload', payload);

        createMutation.mutate(payload);
    };

    // =========================================================
    // DELETE HANDLER
    // =========================================================

    const handleDelete = () => {
        if (
            !initialData?.id ||
            deleteMutation.isPending
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this service group?"
            );

        if (!confirmed) {
            return;
        }

        deleteMutation.mutate(
            initialData.id
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    const isSaving =
        createMutation.isPending ||
        updateMutation.isPending;

    const isDeleting =
        deleteMutation.isPending;

    // =========================================================
    // ERROR
    // =========================================================

    const mutationError =
        createMutation.error ||
        updateMutation.error ||
        deleteMutation.error;

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <>
            {/* OVERLAY */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => {
                        if (
                            !isSaving &&
                            !isDeleting
                        ) {
                            onClose();
                        }
                    }}
                />
            )}

            {/* DRAWER */}
            <div
                className={`
                    fixed top-0 right-0
                    h-full
                    w-full
                    max-w-2xl
                    bg-white
                    z-50
                    shadow-2xl
                    transition-transform
                    duration-300
                    flex
                    flex-col
                    ${isOpen
                        ? "translate-x-0"
                        : "translate-x-full"
                    }
                `}
            >
                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {isEdit
                                ? "Edit Service Group"
                                : "Add Service Group"}
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            Manage service group
                            information and
                            associated services.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        disabled={
                            isSaving ||
                            isDeleting
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* =================================================
                    BODY
                ================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="flex flex-col flex-1 min-h-0"
                >
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* =============================================
                            BASIC INFORMATION
                        ============================================== */}

                        <div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">
                                Group Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* NAME */}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Group Name
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            name
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setName(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter group name"
                                        className={`
                                            w-full
                                            h-10
                                            px-3
                                            rounded-lg
                                            border
                                            text-sm
                                            outline-none
                                            transition
                                            ${nameError
                                                ? "border-red-400 focus:ring-2 focus:ring-red-100"
                                                : "border-slate-200 focus:border-[#b5925a] focus:ring-2 focus:ring-[#b5925a]/10"
                                            }
                                        `}
                                    />

                                    {nameError && (
                                        <p className="text-[11px] text-red-500 mt-1">
                                            {
                                                nameError
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* GROUP TYPE */}

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Group Type
                                    </label>

                                    <select
                                        value={
                                            groupType
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setGroupType(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#b5925a]"
                                    >
                                        <option value="employee">
                                            Employee
                                        </option>

                                        <option value="business">
                                            Business
                                        </option>

                                        <option value="assets">
                                            Asset
                                        </option>
                                    </select>
                                </div>

                                {/* BOARDING TYPE */}

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Boarding Type
                                    </label>

                                    <select
                                        value={
                                            boardingType
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setBoardingType(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#b5925a]"
                                    >
                                        <option value="other">
                                            Other
                                        </option>

                                        <option value="onboarding">
                                            On boarding
                                        </option>

                                        <option value="offboarding">
                                            Off boarding
                                        </option>

                                        <option value="renewal">
                                            Renewal
                                        </option>
                                    </select>
                                </div>

                                {/* STATUS */}

                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Status
                                    </label>

                                    <select
                                        value={
                                            status
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setStatus(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#b5925a]"
                                    >
                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                {/* ICON */}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Group Icon
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            groupIcon
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setGroupIcon(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Icon URL or path"
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#b5925a]"
                                    />
                                </div>

                                {/* DESCRIPTION */}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            description
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setDescription(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Enter group description"
                                        rows={
                                            4
                                        }
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none resize-none focus:border-[#b5925a]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* =============================================
                            SERVICES
                        ============================================== */}

                        <div className="border-t border-slate-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Services
                                    </h3>

                                    <p className="text-xs text-slate-500 mt-1">
                                        Select one or
                                        more services
                                        to associate
                                        with this group.
                                    </p>
                                </div>

                                <span className="px-2.5 py-1 rounded-full bg-[#b5925a]/10 text-[#8f713f] text-xs font-semibold">
                                    {
                                        selectedServiceIds.length
                                    }{" "}
                                    selected
                                </span>
                            </div>

                            {/* SEARCH */}

                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={
                                            serviceSearch
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setServiceSearch(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Search services..."
                                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-[#b5925a]"
                                    />

                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={
                                                2
                                            }
                                            d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
                                        />
                                    </svg>

                                    {isFetchingServices &&
                                        !isLoadingServices && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#b5925a] rounded-full animate-spin" />
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* FILTERS */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <select
                                    value={
                                        serviceTypeFilter
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setServiceTypeFilter(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b5925a]"
                                >
                                    <option value="">
                                        All Service Types
                                    </option>

                                    {serviceTypes.map(
                                        (
                                            type
                                        ) => (
                                            <option
                                                key={
                                                    type.id
                                                }
                                                value={
                                                    type.id
                                                }
                                            >
                                                {
                                                    type.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        serviceCategoryFilter
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setServiceCategoryFilter(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-[#b5925a]"
                                >
                                    <option value="">
                                        All Categories
                                    </option>

                                    {serviceCategories.map(
                                        (
                                            category
                                        ) => (
                                            <option
                                                key={
                                                    category.id
                                                }
                                                value={
                                                    category.id
                                                }
                                            >
                                                {
                                                    category.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* SELECTED SERVICES */}

                            {selectedServices.length >
                                0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-slate-700 mb-2">
                                            Selected
                                            Services
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {selectedServices.map(
                                                (
                                                    service
                                                ) => {
                                                    const serviceName =
                                                        service.name ||
                                                        service.service_title ||
                                                        service.title ||
                                                        "Unnamed Service";

                                                    return (
                                                        <div
                                                            key={
                                                                service.id
                                                            }
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#b5925a]/10 border border-[#b5925a]/20 text-xs text-[#7d6237]"
                                                        >
                                                            <span>
                                                                {
                                                                    serviceName
                                                                }
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveService(
                                                                        service.id
                                                                    )
                                                                }
                                                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* SERVICES LIST */}

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700">
                                        Available
                                        Services
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            refetchServices()
                                        }
                                        disabled={
                                            isFetchingServices
                                        }
                                        className="text-xs text-[#9a7a48] hover:text-[#765b35] disabled:opacity-50"
                                    >
                                        Refresh
                                    </button>
                                </div>

                                <div className="max-h-72 overflow-y-auto">
                                    {isLoadingServices ? (
                                        <div className="py-10 flex flex-col items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#b5925a] rounded-full animate-spin" />

                                            <p className="text-xs text-slate-400 mt-3">
                                                Loading
                                                services...
                                            </p>
                                        </div>
                                    ) : isServicesError ? (
                                        <div className="py-10 text-center">
                                            <p className="text-xs text-red-500 mb-2">
                                                Failed
                                                to load
                                                services.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    refetchServices()
                                                }
                                                className="text-xs text-[#9a7a48] underline"
                                            >
                                                Try
                                                again
                                            </button>
                                        </div>
                                    ) : filteredServices.length ===
                                        0 ? (
                                        <div className="py-10 text-center">
                                            <p className="text-xs text-slate-400">
                                                No
                                                services
                                                found.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredServices.map(
                                            (
                                                service
                                            ) => {
                                                const serviceName =
                                                    service.name ||
                                                    service.service_title ||
                                                    service.title ||
                                                    "Unnamed Service";

                                                const isSelected =
                                                    selectedServiceIds.includes(
                                                        service.id
                                                    );

                                                const typeName =
                                                    service
                                                        .serviceType
                                                        ?.name ||
                                                    "";

                                                const categoryName =
                                                    service
                                                        .serviceCategory
                                                        ?.name ||
                                                    "";

                                                return (
                                                    <button
                                                        key={
                                                            service.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleService(
                                                                service.id
                                                            )
                                                        }
                                                        className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${isSelected
                                                            ? "bg-[#b5925a]/5"
                                                            : "hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSelected
                                                                    ? "bg-[#b5925a] border-[#b5925a] text-white"
                                                                    : "border-slate-300 bg-white"
                                                                    }`}
                                                            >
                                                                {isSelected && (
                                                                    <svg
                                                                        width="12"
                                                                        height="12"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                    >
                                                                        <path d="m5 12 4 4L19 6" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-medium text-slate-800 truncate">
                                                                    {
                                                                        serviceName
                                                                    }
                                                                </p>

                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {typeName && (
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {
                                                                                typeName
                                                                            }
                                                                        </span>
                                                                    )}

                                                                    {typeName &&
                                                                        categoryName && (
                                                                            <span className="text-slate-300">
                                                                                •
                                                                            </span>
                                                                        )}

                                                                    {categoryName && (
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {
                                                                                categoryName
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {isSelected && (
                                                                <span className="text-[10px] font-medium text-[#9a7a48]">
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            }
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* =============================================
                            ERROR
                        ============================================== */}

                        {mutationError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-xs text-red-600">
                                    {(
                                        mutationError as any
                                    )?.response
                                        ?.data
                                        ?.message ||
                                        (
                                            mutationError as any
                                        )?.message ||
                                        "Something went wrong. Please try again."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                        <div>
                            {isEdit &&
                                initialData?.id && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleDelete
                                        }
                                        disabled={
                                            isSaving ||
                                            isDeleting
                                        }
                                        className="px-4 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {isDeleting
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                disabled={
                                    isSaving ||
                                    isDeleting
                                }
                                className="px-5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    isSaving ||
                                    isDeleting
                                }
                                className="px-6 py-2.5 rounded-lg bg-[#b5925a] text-white text-xs font-medium hover:bg-[#a1804c] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving
                                    ? "Saving..."
                                    : isEdit
                                        ? "Update Group"
                                        : "Create Group"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ServiceGroupDrawer;