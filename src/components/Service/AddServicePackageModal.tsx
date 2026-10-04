import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    servicePackageSchema,
    type ServicePackageFormValues,
    type CreateServicePackageDto,
} from "../../schemas/serviceSchema";
import {
    GroupType,
    ServiceTagStatus,
    DEMO_SERVICE_GROUPS,
    type ServiceGroupOption,
} from "./serviceGroupTypes";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface AddServicePackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        data: CreateServicePackageDto,
        meta?: { service_group_id: string; group_name?: string }
    ) => void;
}

export const AddServicePackageModal: React.FC<AddServicePackageModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<ServicePackageFormValues>({
        resolver: zodResolver(servicePackageSchema),
        defaultValues: {
            group_type: GroupType.EMPLOYEE,
            service_group_id: "",
            package_name: "",
            unit_price: 0,
            description: "",
            status: ServiceTagStatus.ACTIVE,
        },
    });

    const selectedGroup = DEMO_SERVICE_GROUPS.find((g) => g.id === selectedGroupId);

    // Adjust state during render when isOpen changes (per React docs)
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen);
        setIsGroupDropdownOpen(false);
        setGroupSearchQuery("");
        if (!isOpen) {
            setSelectedGroupId("");
        }
    }

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsGroupDropdownOpen(false);
            }
        };

        if (isGroupDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isGroupDropdownOpen]);

    // Filter service groups based on search query
    const filteredGroups = DEMO_SERVICE_GROUPS.filter((g) => {
        const query = groupSearchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
            g.name.toLowerCase().includes(query) ||
            (g.groupCode && g.groupCode.toLowerCase().includes(query))
        );
    });

    const handleSelectGroup = (group: ServiceGroupOption) => {
        setSelectedGroupId(group.id);
        setValue("service_group_id", group.id, { shouldValidate: true });
        clearErrors("service_group_id");
        setIsGroupDropdownOpen(false);
        setGroupSearchQuery("");
    };

    const handleFormSubmit = (data: ServicePackageFormValues) => {
        // Backend DTO aligned strictly with the provided contract:
        // package_name, unit_price, group_type, status, description
        const backendPayload: CreateServicePackageDto = {
            package_name: data.package_name.trim(),
            unit_price: Number(data.unit_price),
            group_type: data.group_type || GroupType.EMPLOYEE,
            status: data.status || ServiceTagStatus.ACTIVE,
            description: data.description?.trim() || undefined,
        };

        // Pass relationship field separately to keep backend contract pure
        onSubmit(backendPayload, {
            service_group_id: data.service_group_id,
            group_name: selectedGroup?.name,
        });

        reset();
        onClose();
    };

    const handleCancel = () => {
        reset();
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
        >
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={handleCancel}
            />

            {/* Slide-over Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">
                            Add Service Package
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Create and manage service packages including pricing, trial period, and grouping.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form
                        id="add-service-package-form"
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="space-y-5"
                    >
                        {/* Section Header */}
                        <div className="pb-1 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Service Package Details
                            </h3>
                        </div>

                        {/* Two-column Layout on Desktop, One Column on Mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 1. Group Type * */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Group Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register("group_type")}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 cursor-pointer"
                                >
                                    <option value={GroupType.BUSINESS}>Business</option>
                                    <option value={GroupType.EMPLOYEE}>Employee</option>
                                    <option value={GroupType.ASSET}>Asset</option>
                                </select>
                                {errors.group_type && (
                                    <span className="text-[10px] text-red-500 mt-1 block">
                                        {errors.group_type.message}
                                    </span>
                                )}
                            </div>

                            {/* 2. Select Service Group * (Searchable Combobox) */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Select Service Group <span className="text-red-500">*</span>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs flex items-center justify-between cursor-pointer transition text-left focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 ${
                                        errors.service_group_id
                                            ? "border-red-300"
                                            : "border-slate-200"
                                    }`}
                                >
                                    <span
                                        className={`truncate ${
                                            selectedGroup
                                                ? "text-slate-800 font-medium"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {selectedGroup ? selectedGroup.name : "Search for Select Service Group"}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`text-slate-400 ml-1 shrink-0 transition-transform ${
                                            isGroupDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {errors.service_group_id && (
                                    <span className="text-[10px] text-red-500 mt-1 block">
                                        {errors.service_group_id.message}
                                    </span>
                                )}

                                {/* Dropdown menu */}
                                {isGroupDropdownOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 animate-in fade-in-50 duration-150">
                                        {/* Search Input inside Combobox */}
                                        <div className="relative mb-2">
                                            <Search
                                                size={13}
                                                className="absolute left-2.5 top-2.5 text-slate-400"
                                            />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={groupSearchQuery}
                                                onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                placeholder="Search for Select Service Group"
                                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#126b71]"
                                            />
                                        </div>

                                        {/* Options List */}
                                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                                            {filteredGroups.length > 0 ? (
                                                filteredGroups.map((group) => {
                                                    const isSelected = selectedGroupId === group.id;
                                                    return (
                                                        <button
                                                            key={group.id}
                                                            type="button"
                                                            onClick={() => handleSelectGroup(group)}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition flex items-center justify-between cursor-pointer ${
                                                                isSelected
                                                                    ? "bg-[#126b71]/10 text-[#126b71] font-semibold"
                                                                    : "text-slate-700 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <div className="truncate pr-2">
                                                                <div className="truncate font-medium">
                                                                    {group.name}
                                                                </div>
                                                                {group.groupCode && (
                                                                    <div className="text-[10px] text-slate-400">
                                                                        {group.groupCode}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <Check
                                                                    size={14}
                                                                    className="text-[#126b71] shrink-0"
                                                                />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-3 text-center text-xs text-slate-400">
                                                    No service groups found matching &quot;{groupSearchQuery}&quot;
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. Package Name * */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Package Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Package Name"
                                    {...register("package_name")}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 ${
                                        errors.package_name
                                            ? "border-red-300"
                                            : "border-slate-200"
                                    }`}
                                />
                                {errors.package_name && (
                                    <span className="text-[10px] text-red-500 mt-1 block">
                                        {errors.package_name.message}
                                    </span>
                                )}
                            </div>

                            {/* 4. Unit Price * */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Unit Price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="0.00"
                                        onKeyDown={(e) => {
                                            // Prevent negative signs from being typed
                                            if (e.key === "-" || e.key === "e") {
                                                e.preventDefault();
                                            }
                                        }}
                                        {...register("unit_price", { valueAsNumber: true })}
                                        className={`w-full pl-3 pr-14 py-2 bg-slate-50 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 ${
                                            errors.unit_price
                                                ? "border-red-300"
                                                : "border-slate-200"
                                        }`}
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded pointer-events-none">
                                        SAR
                                    </div>
                                </div>
                                {errors.unit_price && (
                                    <span className="text-[10px] text-red-500 mt-1 block">
                                        {errors.unit_price.message}
                                    </span>
                                )}
                            </div>

                            {/* 5. Description (Spans full width on desktop) */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter Description"
                                    {...register("description")}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 resize-none text-slate-700"
                                />
                                {errors.description && (
                                    <span className="text-[10px] text-red-500 mt-1 block">
                                        {errors.description.message}
                                    </span>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-service-package-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#b5925a] hover:bg-[#a1804c] text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};
