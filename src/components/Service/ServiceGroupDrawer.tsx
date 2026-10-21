import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceApi } from "../../api/api";
import { toast } from "sonner";
import { Search, RefreshCw, X, Check } from "lucide-react";

type DrawerMode = "create" | "edit" | "view";

interface ServiceGroupDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any | null;
    isEdit?: boolean;
    mode?: DrawerMode;
}

interface ServiceItem {
    id: string;
    name?: string;
    service_title?: string;
    title?: string;
    description?: string;
    serviceType?: { id: string; name?: string };
    serviceType_id?: string;
    service_category_id?: string;
    serviceCategory?: { id: string; name?: string };
    [key: string]: any;
}

interface CreateServiceGroupDto {
    service_ids: string[];
    name: string;
    description?: string;
    group_icon?: string;
    group_type?: string;
    boarding_type?: string;
    status?: string;
}

const normalizeServices = (response: any): ServiceItem[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    return [];
};

const getServiceId = (item: any): string | null => {
    if (typeof item === "string") return item || null;
    if (!item || typeof item !== "object") return null;

    // A relation object has its own ID. Prefer the actual service ID.
    if (item.service?.id) return String(item.service.id);
    if (item.serviceId) return String(item.serviceId);
    if (item.service_id) return String(item.service_id);

    // Direct service objects have their own service ID.
    if (
        item.id &&
        (item.name || item.service_title || item.title || item.serviceType)
    ) {
        return String(item.id);
    }

    return null;
};

const getInitialServiceIds = (data: any): string[] => {
    if (!data) return [];

    const candidates = [
        data.service_ids,
        data.services,
        data.serviceGroups,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return Array.from(
                new Set(
                    candidate
                        .map(getServiceId)
                        .filter((id): id is string => Boolean(id))
                )
            );
        }
    }

    return [];
};

const getErrorMessage = (error: any) => {
    const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";

    return Array.isArray(message) ? message[0] : message;
};

const ServiceGroupDrawer: React.FC<ServiceGroupDrawerProps> = ({
    isOpen,
    onClose,
    initialData = null,
    isEdit = Boolean(initialData?.id),
    mode,
}) => {
    const queryClient = useQueryClient();

    const drawerMode: DrawerMode =
        mode || (isEdit ? "edit" : "create");

    const isView = drawerMode === "view";
    const editing = drawerMode === "edit";
    const isReadOnly = isView;

    // FORM STATE
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [groupIcon, setGroupIcon] = useState("briefcase");
    const [groupType, setGroupType] = useState("employee");
    const [boardingType, setBoardingType] = useState("other");
    const [status, setStatus] = useState("active");
    const [nameError, setNameError] = useState("");

    // SERVICE SELECTION
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [serviceSearch, setServiceSearch] = useState("");
    const [serviceTypeFilter, setServiceTypeFilter] = useState("");
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState("");

    // LOAD SERVICES
    const {
        data: servicesResponse,
        isLoading: isLoadingServices,
        isFetching: isFetchingServices,
        isError: isServicesError,
        refetch: refetchServices,
    } = useQuery({
        queryKey: ["services", { search: serviceSearch.trim() }],
        queryFn: () =>
            serviceApi.getServices({
                page: 1,
                limit: 100,
                search: serviceSearch.trim(),
            }),
        enabled: isOpen,
        staleTime: 30_000,
    });

    const services = useMemo(
        () => normalizeServices(servicesResponse),
        [servicesResponse]
    );

    // SERVICE TYPES
    const serviceTypes = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();

        services.forEach((service) => {
            const id = service.serviceType_id || service.serviceType?.id;
            const typeName = service.serviceType?.name;

            if (id) {
                map.set(id, {
                    id,
                    name: typeName || "Unknown Type",
                });
            }
        });

        return Array.from(map.values());
    }, [services]);

    // SERVICE CATEGORIES
    const serviceCategories = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();

        services.forEach((service) => {
            const id =
                service.service_category_id ||
                service.serviceCategory?.id;
            const categoryName = service.serviceCategory?.name;

            if (id) {
                map.set(id, {
                    id,
                    name: categoryName || "Unknown Category",
                });
            }
        });

        return Array.from(map.values());
    }, [services]);

    // FILTER SERVICES
    const filteredServices = useMemo(() => {
        const search = serviceSearch.trim().toLowerCase();

        return services.filter((service) => {
            const serviceName =
                service.name ||
                service.service_title ||
                service.title ||
                "";

            const matchesSearch =
                !search || serviceName.toLowerCase().includes(search);

            const typeId =
                service.serviceType_id || service.serviceType?.id;

            const categoryId =
                service.service_category_id ||
                service.serviceCategory?.id;

            const matchesType =
                !serviceTypeFilter || typeId === serviceTypeFilter;

            const matchesCategory =
                !serviceCategoryFilter ||
                categoryId === serviceCategoryFilter;

            return matchesSearch && matchesType && matchesCategory;
        });
    }, [
        services,
        serviceSearch,
        serviceTypeFilter,
        serviceCategoryFilter,
    ]);

    // KEEP SELECTED IDS EVEN WHEN THEY ARE NOT IN THE CURRENT SEARCH RESULTS.
    const selectedServices = useMemo(() => {
        const serviceMap = new Map(
            services.map((service) => [String(service.id), service])
        );

        return selectedServiceIds
            .map((id) => serviceMap.get(id))
            .filter((service): service is ServiceItem => Boolean(service));
    }, [services, selectedServiceIds]);

    // RESET FORM
    const resetForm = () => {
        setName("");
        setDescription("");
        setGroupIcon("briefcase");
        setGroupType("employee");
        setBoardingType("other");
        setStatus("active");
        setNameError("");
        setSelectedServiceIds([]);
        setServiceSearch("");
        setServiceTypeFilter("");
        setServiceCategoryFilter("");
    };

    // INITIALIZE FORM WHEN OPENING OR CHANGING RECORD/MODE.
    useEffect(() => {
        if (!isOpen) return;

        if (drawerMode === "create" || !initialData) {
            resetForm();
            return;
        }

        setName(initialData.name || "");
        setDescription(initialData.description || "");
        setGroupIcon(initialData.group_icon || "briefcase");
        setGroupType(initialData.group_type || "employee");
        setBoardingType(initialData.boarding_type || "other");
        setStatus(
            String(initialData.status || "active").toLowerCase()
        );
        setNameError("");
        setSelectedServiceIds(getInitialServiceIds(initialData));
        setServiceSearch("");
        setServiceTypeFilter("");
        setServiceCategoryFilter("");

        // Only initialize when opening, changing mode, or changing record.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, drawerMode, initialData?.id]);

    // SERVICE SELECTION
    const handleRemoveService = (serviceId: string) => {
        if (isReadOnly) return;

        setSelectedServiceIds((previous) =>
            previous.filter((id) => id !== serviceId)
        );
    };

    const handleToggleService = (serviceId: string) => {
        if (isReadOnly) return;

        setSelectedServiceIds((previous) =>
            previous.includes(serviceId)
                ? previous.filter((id) => id !== serviceId)
                : [...previous, serviceId]
        );
    };

    // REFRESH GROUP LISTS AFTER SAVING.
    const refreshGroupQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["serviceGroups"],
            }),
            queryClient.invalidateQueries({
                queryKey: ["service-groups"],
            }),
        ]);
    };

    // CREATE
    const createMutation = useMutation({
        mutationFn: (data: CreateServiceGroupDto) =>
            serviceApi.createServiceGroup(data),

        onSuccess: async () => {
            await refreshGroupQueries();
            toast.success("Service group created successfully");
            resetForm();
            onClose();
        },

        onError: (error: any) => {
            toast.error(getErrorMessage(error));
        },
    });

    // UPDATE
    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: CreateServiceGroupDto;
        }) => serviceApi.updateServiceGroup(id, data),

        onSuccess: async () => {
            await refreshGroupQueries();
            toast.success("Service group updated successfully");
            resetForm();
            onClose();
        },

        onError: (error: any) => {
            toast.error(getErrorMessage(error));
        },
    });

    // DELETE
    const deleteMutation = useMutation({
        mutationFn: (id: string) => serviceApi.deleteServiceGroup(id),

        onSuccess: async () => {
            await refreshGroupQueries();
            toast.success("Service group deleted successfully");
            resetForm();
            onClose();
        },

        onError: (error: any) => {
            toast.error(getErrorMessage(error));
        },
    });

    // SUBMIT
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (isReadOnly) return;

        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError("Group name is required");
            return;
        }

        setNameError("");

        const payload: CreateServiceGroupDto = {
            name: trimmedName,
            description: description.trim() || undefined,
            group_icon: groupIcon.trim() || undefined,
            group_type: groupType || undefined,
            boarding_type: boardingType || undefined,
            status: status || undefined,

            // Send actual service UUIDs, not relation IDs.
            service_ids: [...new Set(selectedServiceIds)],
        };

        if (editing && initialData?.id) {
            updateMutation.mutate({
                id: String(initialData.id),
                data: payload,
            });
            return;
        }

        createMutation.mutate(payload);
    };

    const handleDelete = () => {
        if (!initialData?.id || deleteMutation.isPending || isView) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this service group?"
        );

        if (confirmed) {
            deleteMutation.mutate(String(initialData.id));
        }
    };

    const isSaving =
        createMutation.isPending || updateMutation.isPending;
    const isDeleting = deleteMutation.isPending;
    const isBusy = isSaving || isDeleting;

    const inputClass =
        "w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-[#b5925a] focus:ring-2 focus:ring-[#b5925a]/10 disabled:bg-slate-50 disabled:text-slate-600";

    const labelClass =
        "block text-xs font-medium text-slate-700 mb-1.5";

    const displayedError =
        createMutation.error ||
        updateMutation.error ||
        deleteMutation.error;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => {
                        if (!isBusy) onClose();
                    }}
                />
            )}

            <div
                aria-hidden={!isOpen}
                aria-label={
                    isView
                        ? "View Service Group"
                        : editing
                          ? "Edit Service Group"
                          : "Add Service Group"
                }
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {isView
                                ? "View Service Group"
                                : editing
                                  ? "Edit Service Group"
                                  : "Add Service Group"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {isView
                                ? "View group information and associated services."
                                : "Manage service group information and associated services."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBusy}
                        aria-label="Close drawer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col flex-1 min-h-0"
                >
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* GROUP INFORMATION */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-800 mb-4">
                                Group Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Group Name
                                        {!isView && (
                                            <span className="text-red-500 ml-1">
                                                *
                                            </span>
                                        )}
                                    </label>

                                    <input
                                        type="text"
                                        value={name}
                                        readOnly={isReadOnly}
                                        onChange={(event) => {
                                            setName(event.target.value);
                                            if (nameError) setNameError("");
                                        }}
                                        placeholder="Enter group name"
                                        className={`${inputClass} ${
                                            nameError
                                                ? "border-red-400"
                                                : ""
                                        } ${
                                            isReadOnly
                                                ? "bg-slate-50 cursor-default"
                                                : ""
                                        }`}
                                    />

                                    {nameError && (
                                        <p className="text-[11px] text-red-500 mt-1">
                                            {nameError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Group Type
                                    </label>
                                    <select
                                        value={groupType}
                                        disabled={isReadOnly}
                                        onChange={(event) =>
                                            setGroupType(event.target.value)
                                        }
                                        className={inputClass}
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

                                <div>
                                    <label className={labelClass}>
                                        Boarding Type
                                    </label>
                                    <select
                                        value={boardingType}
                                        disabled={isReadOnly}
                                        onChange={(event) =>
                                            setBoardingType(event.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="other">Other</option>
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

                                <div>
                                    <label className={labelClass}>
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        disabled={isReadOnly}
                                        onChange={(event) =>
                                            setStatus(event.target.value)
                                        }
                                        className={inputClass}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Group Icon
                                    </label>
                                    <input
                                        type="text"
                                        value={groupIcon}
                                        readOnly={isReadOnly}
                                        onChange={(event) =>
                                            setGroupIcon(event.target.value)
                                        }
                                        placeholder="Icon name, URL or path"
                                        className={inputClass}
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Example: briefcase, users, building-2
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        readOnly={isReadOnly}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                        placeholder="Enter group description"
                                        rows={4}
                                        className={`w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none resize-none focus:border-[#b5925a] ${
                                            isReadOnly
                                                ? "bg-slate-50 text-slate-600"
                                                : ""
                                        }`}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* SERVICES */}
                        <section className="border-t border-slate-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Services
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {isView
                                            ? "Services associated with this group."
                                            : "Select one or more services to associate with this group."}
                                    </p>
                                </div>

                                <span className="px-2.5 py-1 rounded-full bg-[#b5925a]/10 text-[#8f713f] text-xs font-semibold">
                                    {selectedServiceIds.length} selected
                                </span>
                            </div>

                            {/* SEARCH */}
                            <div className="mb-4 relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={serviceSearch}
                                    disabled={isReadOnly}
                                    onChange={(event) =>
                                        setServiceSearch(event.target.value)
                                    }
                                    placeholder="Search services..."
                                    className={`${inputClass} pl-10 pr-10`}
                                />

                                {isFetchingServices && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <RefreshCw
                                            size={14}
                                            className="animate-spin text-slate-400"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* FILTERS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <select
                                    value={serviceTypeFilter}
                                    disabled={isReadOnly}
                                    onChange={(event) =>
                                        setServiceTypeFilter(
                                            event.target.value
                                        )
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        All Service Types
                                    </option>
                                    {serviceTypes.map((type) => (
                                        <option
                                            key={type.id}
                                            value={type.id}
                                        >
                                            {type.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={serviceCategoryFilter}
                                    disabled={isReadOnly}
                                    onChange={(event) =>
                                        setServiceCategoryFilter(
                                            event.target.value
                                        )
                                    }
                                    className={inputClass}
                                >
                                    <option value="">All Categories</option>
                                    {serviceCategories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECTED SERVICES */}
                            {selectedServices.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-slate-700 mb-2">
                                        Selected Services
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {selectedServices.map((service) => {
                                            const serviceName =
                                                service.name ||
                                                service.service_title ||
                                                service.title ||
                                                "Unnamed Service";

                                            return (
                                                <div
                                                    key={service.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#b5925a]/10 border border-[#b5925a]/20 text-xs text-[#7d6237]"
                                                >
                                                    <span>{serviceName}</span>

                                                    {!isReadOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveService(
                                                                    String(
                                                                        service.id
                                                                    )
                                                                )
                                                            }
                                                            aria-label={`Remove ${serviceName}`}
                                                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* AVAILABLE SERVICES */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700">
                                        Available Services
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => refetchServices()}
                                        disabled={isFetchingServices}
                                        className="flex items-center gap-1.5 text-xs text-[#9a7a48] hover:text-[#765b35] disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} />
                                        Refresh
                                    </button>
                                </div>

                                <div className="max-h-72 overflow-y-auto">
                                    {isLoadingServices ? (
                                        <div className="py-10 flex flex-col items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#b5925a] rounded-full animate-spin" />
                                            <p className="text-xs text-slate-400 mt-3">
                                                Loading services...
                                            </p>
                                        </div>
                                    ) : isServicesError ? (
                                        <div className="py-10 text-center">
                                            <p className="text-xs text-red-500 mb-2">
                                                Failed to load services.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    refetchServices()
                                                }
                                                className="text-xs text-[#9a7a48] underline"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : filteredServices.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <p className="text-xs text-slate-400">
                                                No services found.
                                            </p>
                                        </div>
                                    ) : (
                                        filteredServices.map((service) => {
                                            const serviceName =
                                                service.name ||
                                                service.service_title ||
                                                service.title ||
                                                "Unnamed Service";

                                            const isSelected =
                                                selectedServiceIds.includes(
                                                    String(service.id)
                                                );

                                            const typeName =
                                                service.serviceType?.name || "";

                                            const categoryName =
                                                service.serviceCategory?.name ||
                                                "";

                                            return (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() =>
                                                        handleToggleService(
                                                            String(service.id)
                                                        )
                                                    }
                                                    className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 transition-colors disabled:cursor-default ${
                                                        isSelected
                                                            ? "bg-[#b5925a]/5"
                                                            : "hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                                                isSelected
                                                                    ? "bg-[#b5925a] border-[#b5925a] text-white"
                                                                    : "border-slate-300 bg-white"
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <Check
                                                                    size={13}
                                                                    strokeWidth={3}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-medium text-slate-800 truncate">
                                                                {serviceName}
                                                            </p>

                                                            <div className="flex items-center gap-2 mt-1">
                                                                {typeName && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {typeName}
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
                                                                        {categoryName}
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
                                        })
                                    )}
                                </div>
                            </div>

                            {selectedServiceIds.length >
                                selectedServices.length && (
                                <p className="text-xs text-slate-500 mt-2">
                                    {selectedServiceIds.length -
                                        selectedServices.length}{" "}
                                    selected service(s) are not in the current
                                    results. Their IDs will be preserved when
                                    saving.
                                </p>
                            )}
                        </section>

                        {displayedError && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-xs text-red-600">
                                    {getErrorMessage(displayedError)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
                        <div>
                            {editing && initialData?.id && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isBusy}
                                    className="px-4 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isBusy}
                                className="px-5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                {isView ? "Close" : "Cancel"}
                            </button>

                            {!isView && (
                                <button
                                    type="submit"
                                    disabled={isBusy}
                                    className="px-6 py-2.5 rounded-lg bg-[#b5925a] text-white text-xs font-medium hover:bg-[#a1804c] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : editing
                                          ? "Update Group"
                                          : "Create Group"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ServiceGroupDrawer;