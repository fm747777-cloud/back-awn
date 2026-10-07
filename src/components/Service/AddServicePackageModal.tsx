import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";
import { servicePackageSchema, type ServicePackageFormValues, type CreateServicePackageDto } from "../../schemas/serviceSchema";
import { GroupType, ServiceTagStatus, type ServiceGroupOption } from "./serviceGroupTypes";
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";
import { serviceApi } from "../../api/api";

interface AddServicePackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateServicePackageDto) => void | Promise<void>;
}

interface ServiceGroupResponse {
    data?: ServiceGroupOption[];
    items?: ServiceGroupOption[];
    results?: ServiceGroupOption[];
}

export const AddServicePackageModal: React.FC<AddServicePackageModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        clearErrors,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ServicePackageFormValues>({
        resolver: zodResolver(servicePackageSchema),
        mode: "onSubmit",
        defaultValues: {
            group_type: GroupType.BUSINESS,
            service_group_ids: [],
            package_name: "",
            unit_price: "" as unknown as number,
            status: ServiceTagStatus.ACTIVE,
            description: "",
        },
    });

    const selectedGroupIds = watch("service_group_ids") || [];

    const { data: serviceGroupsResponse, isLoading: isLoadingGroups, isError: isGroupsError, refetch: refetchGroups } = useQuery({
        queryKey: ["service-groups"],
        queryFn: async () => {
            return await serviceApi.getServiceGroup();
        },
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const serviceGroups = useMemo<ServiceGroupOption[]>(() => {
        const response = serviceGroupsResponse as ServiceGroupResponse | ServiceGroupOption[] | undefined;
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        if (Array.isArray(response?.results)) return response.results;
        return [];
    }, [serviceGroupsResponse]);

    const filteredGroups = useMemo(() => {
        const query = groupSearchQuery.trim().toLowerCase();
        if (!query) return serviceGroups;
        return serviceGroups.filter((group) => group.name.toLowerCase().includes(query) || group.groupCode.toLowerCase().includes(query));
    }, [serviceGroups, groupSearchQuery]);

    const selectedGroups = useMemo(() => {
        return serviceGroups.filter((group) => selectedGroupIds.includes(group.id));
    }, [serviceGroups, selectedGroupIds]);

    const createPackageMutation = useMutation({
        mutationFn: async (payload: CreateServicePackageDto) => {
            return await onSubmit(payload);
        },
        onSuccess: () => {
            reset();
            setGroupSearchQuery("");
            setIsGroupDropdownOpen(false);
            onClose();
        },
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsGroupDropdownOpen(false);
            }
        };
        if (isGroupDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isGroupDropdownOpen]);

    useEffect(() => {
        if (!isOpen) {
            reset();
            setIsGroupDropdownOpen(false);
            setGroupSearchQuery("");
        }
    }, [isOpen, reset]);

    const handleSelectGroup = (group: ServiceGroupOption) => {
        const currentIds = selectedGroupIds || [];
        const alreadySelected = currentIds.includes(group.id);
        const updatedIds = alreadySelected ? currentIds.filter((id) => id !== group.id) : [...currentIds, group.id];
        setValue("service_group_ids", updatedIds, { shouldValidate: true, shouldDirty: true });
        clearErrors("service_group_ids");
    };

    const handleRemoveGroup = (groupId: string) => {
        const updatedIds = selectedGroupIds.filter((id) => id !== groupId);
        setValue("service_group_ids", updatedIds, { shouldValidate: true, shouldDirty: true });
    };

    const handleSelectAll = () => {
        const currentIds = selectedGroupIds || [];
        const filteredIds = filteredGroups.map((group) => group.id);
        const updatedIds = Array.from(new Set([...currentIds, ...filteredIds]));
        setValue("service_group_ids", updatedIds, { shouldValidate: true, shouldDirty: true });
        clearErrors("service_group_ids");
    };

    const handleClearGroups = () => {
        setValue("service_group_ids", [], { shouldValidate: true, shouldDirty: true });
    };

    const handleCloseModal = () => {
        if (createPackageMutation.isPending) return;
        reset();
        setIsGroupDropdownOpen(false);
        setGroupSearchQuery("");
        onClose();
    };

    const handleFormSubmit = async (formValues: ServicePackageFormValues) => {
        const dtoPayload: CreateServicePackageDto = {
            service_group_ids: formValues.service_group_ids,
            package_name: formValues.package_name.trim(),
            description: formValues.description?.trim() || undefined,
            unit_price: Number(formValues.unit_price),
            group_type: formValues.group_type,
            status: formValues.status,
        };
        await createPackageMutation.mutateAsync(dtoPayload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E5E0D8] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] text-start">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">{t("packages.addTitle")}</h2>
                        <p className="text-xs text-[#6E6862] mt-1">{t("packages.subtitle")}</p>
                    </div>
                    <button type="button" onClick={handleCloseModal} disabled={createPackageMutation.isPending} aria-label={t("common.close")} className="text-[#8C847A] hover:text-[#0D0D0D] p-1 rounded-md hover:bg-[#EFECE6] transition focus:outline-none disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-[#EFECE6]">
                        <div className="w-2 h-2 rounded-full bg-[#2D3F2C]"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D3F2C]">{t("packages.detailsSection")}</h3>
                    </div>

                    {createPackageMutation.isError && (
                        <div className="mb-5 rounded-lg border border-[#B83232]/20 bg-[#FCF2F2] px-4 py-3 text-xs text-[#B83232]">
                            {createPackageMutation.error instanceof Error ? createPackageMutation.error.message : "Failed to create service package"}
                        </div>
                    )}

                    <form id="service-package-form" noValidate onSubmit={handleSubmit(handleFormSubmit, (errs) => focusAndScrollToFirstError(errs))} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.groupType")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div className="relative">
                                    <select {...register("group_type")} className={`w-full appearance-none border rounded-lg px-3.5 py-2.5 pe-9 text-sm outline-none transition bg-white text-[#0D0D0D] ${errors.group_type ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15" : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"}`}>
                                        <option value={GroupType.BUSINESS}>{t("services.entityTypes.business")}</option>
                                        <option value={GroupType.EMPLOYEE}>{t("services.entityTypes.employee")}</option>
                                        <option value={GroupType.ASSETS}>{t("services.entityTypes.asset")}</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-[#8C847A] absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.group_type && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.group_type.message)}</p>}
                            </div>

                            <div ref={dropdownRef} className="relative">
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.selectServiceGroup")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input type="hidden" {...register("service_group_ids")} />

                                <button type="button" onClick={() => setIsGroupDropdownOpen((prev) => !prev)} className={`w-full min-h-[44px] flex items-center justify-between border rounded-lg px-3.5 py-2.5 text-sm text-start outline-none transition bg-white ${errors.service_group_ids ? "border-[#B83232] bg-[#FCF2F2]" : isGroupDropdownOpen ? "border-[#2D3F2C] ring-2 ring-[#2D3F2C]/15" : "border-[#D6CFC4] hover:border-[#8C847A]"}`}>
                                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                        {selectedGroups.length > 0 ? selectedGroups.map((group) => (
                                            <span key={group.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#EAF3EC] text-[#2D3F2C] text-xs font-medium max-w-full">
                                                <span className="truncate max-w-[140px]">{group.name}</span>
                                                <span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); handleRemoveGroup(group.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); handleRemoveGroup(group.id); } }} className="cursor-pointer hover:text-[#B83232] shrink-0">
                                                    <X className="w-3 h-3" />
                                                </span>
                                            </span>
                                        )) : <span className="text-[#8C847A]">{t("packages.searchServiceGroup")}</span>}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-[#8C847A] shrink-0 ms-2 transition-transform ${isGroupDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isGroupDropdownOpen && (
                                    <div className="absolute z-30 mt-1.5 w-full bg-white border border-[#D6CFC4] rounded-lg shadow-xl overflow-hidden">
                                        <div className="p-2 border-b border-[#EFECE6] bg-[#FAF8F5]">
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-[#8C847A] absolute start-2.5 top-1/2 -translate-y-1/2" />
                                                <input ref={searchInputRef} type="text" value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} placeholder={t("packages.searchServiceGroup")} className="w-full ps-8 pe-3 py-1.5 text-xs bg-white border border-[#D6CFC4] rounded-md outline-none focus:border-[#2D3F2C]" />
                                            </div>
                                        </div>

                                        <div className="px-2 py-2 border-b border-[#EFECE6] flex items-center justify-between">
                                            <button type="button" onClick={handleSelectAll} disabled={filteredGroups.length === 0 || isLoadingGroups} className="text-xs font-medium text-[#2D3F2C] hover:underline disabled:opacity-50">
                                                Select All
                                            </button>
                                            <button type="button" onClick={handleClearGroups} disabled={selectedGroupIds.length === 0} className="text-xs font-medium text-[#B83232] hover:underline disabled:opacity-50">
                                                Clear All
                                            </button>
                                        </div>

                                        <div className="max-h-48 overflow-y-auto divide-y divide-[#EFECE6]">
                                            {isLoadingGroups ? (
                                                <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-[#8C847A]">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading Service Groups...
                                                </div>
                                            ) : isGroupsError ? (
                                                <div className="px-4 py-6 text-center">
                                                    <p className="text-xs text-[#B83232] mb-2">Failed to load Service Groups</p>
                                                    <button type="button" onClick={() => refetchGroups()} className="text-xs font-medium text-[#2D3F2C] hover:underline">Try Again</button>
                                                </div>
                                            ) : filteredGroups.length > 0 ? (
                                                filteredGroups.map((group) => {
                                                    const isSelected = selectedGroupIds.includes(group.id);
                                                    return (
                                                        <button key={group.id} type="button" onClick={() => handleSelectGroup(group)} className={`w-full px-3.5 py-2.5 text-start text-xs flex items-center justify-between transition ${isSelected ? "bg-[#EAF3EC] text-[#2D3F2C] font-semibold" : "hover:bg-[#FAF8F5] text-[#0D0D0D]"}`}>
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#45413C]" dir="ltr">{group.groupCode}</span>
                                                                <span className="truncate">{group.name}</span>
                                                            </div>
                                                            {isSelected && <Check className="w-4 h-4 text-[#2D3F2C] shrink-0" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-3.5 py-4 text-center text-xs text-[#8C847A]">{t("packages.noGroupsMatch", { query: groupSearchQuery })}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {errors.service_group_ids && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.service_group_ids.message)}</p>}
                            </div>
                        </div>

                        {selectedGroups.length > 0 && (
                            <div className="border border-[#E5E0D8] rounded-lg bg-[#FAF8F5] p-3">
                                <p className="text-xs font-semibold text-[#45413C] mb-2">Selected Service Groups</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedGroups.map((group) => (
                                        <div key={group.id} className="flex items-center gap-2 bg-white border border-[#D6CFC4] rounded-md px-2.5 py-1.5">
                                            <span className="text-xs text-[#0D0D0D] truncate max-w-[180px]">{group.name}</span>
                                            <button type="button" onClick={() => handleRemoveGroup(group.id)} className="text-[#8C847A] hover:text-[#B83232] transition" aria-label={`Remove ${group.name}`}>
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.packageName")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input type="text" placeholder={t("packages.packageNamePlaceholder")} {...register("package_name")} className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition text-[#0D0D0D] placeholder-[#8C847A] ${errors.package_name ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15" : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"}`} />
                                {errors.package_name && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.package_name.message)}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.unitPrice")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div className={`flex items-stretch border rounded-lg overflow-hidden transition bg-white ${errors.unit_price ? "border-[#B83232] bg-[#FCF2F2] focus-within:border-[#B83232] focus-within:ring-2 focus-within:ring-[#B83232]/15" : "border-[#D6CFC4] focus-within:border-[#2D3F2C] focus-within:ring-2 focus-within:ring-[#2D3F2C]/15"}`}>
                                    <span className="px-3.5 py-2.5 bg-[#FAF8F5] border-e border-[#D6CFC4] text-xs font-semibold text-[#45413C] flex items-center select-none">{t("common.sar")}</span>
                                    <input type="number" dir="ltr" min="0" step="0.01" placeholder="0.00" {...register("unit_price", { valueAsNumber: true })} className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent text-[#0D0D0D] placeholder-[#8C847A] text-start" />
                                </div>
                                {errors.unit_price && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.unit_price.message)}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("common.status")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div className="relative">
                                    <select {...register("status")} className={`w-full appearance-none border rounded-lg px-3.5 py-2.5 pe-9 text-sm outline-none transition bg-white text-[#0D0D0D] ${errors.status ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15" : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"}`}>
                                        <option value={ServiceTagStatus.ACTIVE}>{t("common.active")}</option>
                                        <option value={ServiceTagStatus.INACTIVE}>{t("common.inactive")}</option>
                                        <option value={ServiceTagStatus.INITIATED}>{t("common.initiated")}</option>
                                        <option value={ServiceTagStatus.REJECTED}>{t("common.rejected")}</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-[#8C847A] absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.status && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.status.message)}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">{t("packages.description")}</label>
                            <textarea rows={3} placeholder={t("packages.descriptionPlaceholder")} {...register("description")} className="w-full border border-[#D6CFC4] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 transition resize-none bg-white text-[#0D0D0D] placeholder-[#8C847A]"></textarea>
                            {errors.description && <p className="text-[#B83232] text-xs mt-1">{translateError(t, errors.description.message)}</p>}
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] flex justify-end gap-3 bg-[#FAF8F5]">
                    <button type="button" onClick={handleCloseModal} disabled={isSubmitting || createPackageMutation.isPending} className="px-5 py-2 bg-white border border-[#D6CFC4] text-[#45413C] text-xs font-medium rounded-lg hover:bg-[#F5F2EC] transition disabled:opacity-50">
                        {t("common.cancel")}
                    </button>
                    <button type="submit" form="service-package-form" disabled={isSubmitting || createPackageMutation.isPending} className="px-5 py-2 bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#1F2C1E] transition shadow-xs disabled:opacity-50 flex items-center gap-2">
                        {(isSubmitting || createPackageMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmitting || createPackageMutation.isPending ? t("common.submitting") : t("common.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};