import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
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
import { focusAndScrollToFirstError } from "../../utils/formValidation";
import { translateError } from "../../i18n";

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
    const { t } = useTranslation();
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
        mode: "onSubmit",
        defaultValues: {
            group_type: GroupType.BUSINESS,
            service_group_id: "",
            package_name: "",
            unit_price: "" as unknown as number,
            status: ServiceTagStatus.ACTIVE,
            description: "",
        },
    });

    const [prevOpen, setPrevOpen] = useState(isOpen);
    if (prevOpen !== isOpen) {
        setPrevOpen(isOpen);
        if (isOpen) {
            setSelectedGroupId("");
            setIsGroupDropdownOpen(false);
            setGroupSearchQuery("");
        }
    }

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

    if (!isOpen) return null;

    const selectedGroup: ServiceGroupOption | undefined = DEMO_SERVICE_GROUPS.find(
        (g) => g.id === selectedGroupId
    );

    const filteredGroups = DEMO_SERVICE_GROUPS.filter(
        (g) =>
            g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
            g.groupCode.toLowerCase().includes(groupSearchQuery.toLowerCase())
    );

    const handleSelectGroup = (group: ServiceGroupOption) => {
        setSelectedGroupId(group.id);
        setValue("service_group_id", group.id, { shouldValidate: true });
        clearErrors("service_group_id");
        setIsGroupDropdownOpen(false);
        setGroupSearchQuery("");
    };

    const handleCloseModal = () => {
        reset();
        setIsGroupDropdownOpen(false);
        setGroupSearchQuery("");
        onClose();
    };

    const handleFormSubmit = (formValues: ServicePackageFormValues) => {
        const dtoPayload: CreateServicePackageDto = {
            package_name: formValues.package_name.trim(),
            description: formValues.description?.trim() || undefined,
            unit_price: Number(formValues.unit_price),
            group_type: formValues.group_type,
            status: formValues.status,
        };

        onSubmit(dtoPayload, {
            service_group_id: formValues.service_group_id,
            group_name: selectedGroup?.name,
        });
        handleCloseModal();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D]/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-[#E5E0D8] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] text-start">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                            {t("packages.addTitle")}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t("packages.subtitle")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        aria-label={t("common.close")}
                        className="text-[#8C847A] hover:text-[#0D0D0D] p-1 rounded-md hover:bg-[#EFECE6] transition focus:outline-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Section Header */}
                    <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-[#EFECE6]">
                        <div className="w-2 h-2 rounded-full bg-[#2D3F2C]"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D3F2C]">
                            {t("packages.detailsSection")}
                        </h3>
                    </div>

                    <form
                        id="service-package-form"
                        noValidate
                        onSubmit={handleSubmit(handleFormSubmit, (errs) =>
                            focusAndScrollToFirstError(errs)
                        )}
                        className="space-y-5"
                    >
                        {/* Row 1: Group Type + Select Service Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Group Type */}
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.groupType")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register("group_type")}
                                        className={`w-full appearance-none border rounded-lg px-3.5 py-2.5 pe-9 text-sm outline-none transition bg-white text-[#0D0D0D] ${
                                            errors.group_type
                                                ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                                : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                        }`}
                                    >
                                        <option value={GroupType.BUSINESS}>{t("services.entityTypes.business")}</option>
                                        <option value={GroupType.EMPLOYEE}>{t("services.entityTypes.employee")}</option>
                                        <option value={GroupType.ASSET}>{t("services.entityTypes.asset")}</option>
                                        <option value={GroupType.INDIVIDUAL}>{t("services.entityTypes.individual")}</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-[#8C847A] absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.group_type && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.group_type.message)}
                                    </p>
                                )}
                            </div>

                            {/* Searchable Select Service Group */}
                            <div ref={dropdownRef} className="relative">
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.selectServiceGroup")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input type="hidden" {...register("service_group_id")} />
                                <button
                                    type="button"
                                    onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                                    className={`w-full flex items-center justify-between border rounded-lg px-3.5 py-2.5 text-sm text-start outline-none transition bg-white ${
                                        errors.service_group_id
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : isGroupDropdownOpen
                                              ? "border-[#2D3F2C] ring-2 ring-[#2D3F2C]/15"
                                              : "border-[#D6CFC4] hover:border-[#8C847A]"
                                    }`}
                                >
                                    {selectedGroup ? (
                                        <span className="flex items-center gap-2 truncate text-[#0D0D0D]">
                                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#45413C] border border-[#E5E0D8]" dir="ltr">
                                                {selectedGroup.groupCode}
                                            </span>
                                            <span className="truncate font-medium">
                                                {selectedGroup.name}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-[#8C847A]">
                                            {t("packages.searchServiceGroup")}
                                        </span>
                                    )}
                                    <ChevronDown
                                        className={`w-4 h-4 text-[#8C847A] shrink-0 transition-transform ${
                                            isGroupDropdownOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {isGroupDropdownOpen && (
                                    <div className="absolute z-30 mt-1.5 w-full bg-white border border-[#D6CFC4] rounded-lg shadow-xl overflow-hidden">
                                        <div className="p-2 border-b border-[#EFECE6] bg-[#FAF8F5]">
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-[#8C847A] absolute start-2.5 top-1/2 -translate-y-1/2" />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={groupSearchQuery}
                                                    onChange={(e) =>
                                                        setGroupSearchQuery(e.target.value)
                                                    }
                                                    placeholder={t("packages.searchServiceGroup")}
                                                    className="w-full ps-8 pe-3 py-1.5 text-xs bg-white border border-[#D6CFC4] rounded-md outline-none focus:border-[#2D3F2C]"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto divide-y divide-[#EFECE6]">
                                            {filteredGroups.length > 0 ? (
                                                filteredGroups.map((group) => {
                                                    const isSelected =
                                                        group.id === selectedGroupId;
                                                    return (
                                                        <button
                                                            key={group.id}
                                                            type="button"
                                                            onClick={() =>
                                                                handleSelectGroup(group)
                                                            }
                                                            className={`w-full px-3.5 py-2.5 text-start text-xs flex items-center justify-between transition ${
                                                                isSelected
                                                                    ? "bg-[#EAF3EC] text-[#2D3F2C] font-semibold"
                                                                    : "hover:bg-[#FAF8F5] text-[#0D0D0D]"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#EFECE6] text-[#45413C]" dir="ltr">
                                                                    {group.groupCode}
                                                                </span>
                                                                <span className="truncate">
                                                                    {group.name}
                                                                </span>
                                                            </div>
                                                            {isSelected && (
                                                                <Check className="w-4 h-4 text-[#2D3F2C] shrink-0" />
                                                            )}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="px-3.5 py-4 text-center text-xs text-[#8C847A]">
                                                    {t("packages.noGroupsMatch", { query: groupSearchQuery })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {errors.service_group_id && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.service_group_id.message)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Package Name + Unit Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Package Name */}
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.packageName")} <span className="text-[#B83232]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={t("packages.packageNamePlaceholder")}
                                    {...register("package_name")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition text-[#0D0D0D] placeholder-[#8C847A] ${
                                        errors.package_name
                                            ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] bg-white focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                    }`}
                                />
                                {errors.package_name && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.package_name.message)}
                                    </p>
                                )}
                            </div>

                            {/* Unit Price */}
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("packages.unitPrice")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div
                                    className={`flex items-stretch border rounded-lg overflow-hidden transition bg-white ${
                                        errors.unit_price
                                            ? "border-[#B83232] bg-[#FCF2F2] focus-within:border-[#B83232] focus-within:ring-2 focus-within:ring-[#B83232]/15"
                                            : "border-[#D6CFC4] focus-within:border-[#2D3F2C] focus-within:ring-2 focus-within:ring-[#2D3F2C]/15"
                                    }`}
                                >
                                    <span className="px-3.5 py-2.5 bg-[#FAF8F5] border-e border-[#D6CFC4] text-xs font-semibold text-[#45413C] flex items-center select-none">
                                        {t("common.sar")}
                                    </span>
                                    <input
                                        type="number"
                                        dir="ltr"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        {...register("unit_price", { valueAsNumber: true })}
                                        className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent text-[#0D0D0D] placeholder-[#8C847A] text-start"
                                    />
                                </div>
                                {errors.unit_price && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.unit_price.message)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                    {t("common.status")} <span className="text-[#B83232]">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register("status")}
                                        className={`w-full appearance-none border rounded-lg px-3.5 py-2.5 pe-9 text-sm outline-none transition bg-white text-[#0D0D0D] ${
                                            errors.status
                                                ? "border-[#B83232] bg-[#FCF2F2] focus:border-[#B83232] focus:ring-2 focus:ring-[#B83232]/15"
                                                : "border-[#D6CFC4] focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15"
                                        }`}
                                    >
                                        <option value={ServiceTagStatus.ACTIVE}>{t("common.active")}</option>
                                        <option value={ServiceTagStatus.INACTIVE}>{t("common.inactive")}</option>
                                        <option value={ServiceTagStatus.INITIATED}>{t("common.initiated")}</option>
                                        <option value={ServiceTagStatus.REJECTED}>{t("common.rejected")}</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-[#8C847A] absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                {errors.status && (
                                    <p className="text-[#B83232] text-xs mt-1">
                                        {translateError(t, errors.status.message)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 4: Description */}
                        <div>
                            <label className="block text-xs font-medium text-[#0D0D0D] mb-1.5">
                                {t("packages.description")}
                            </label>
                            <textarea
                                rows={3}
                                placeholder={t("packages.descriptionPlaceholder")}
                                {...register("description")}
                                className="w-full border border-[#D6CFC4] rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#2D3F2C] focus:ring-2 focus:ring-[#2D3F2C]/15 transition resize-none bg-white text-[#0D0D0D] placeholder-[#8C847A]"
                            ></textarea>
                            {errors.description && (
                                <p className="text-[#B83232] text-xs mt-1">
                                    {translateError(t, errors.description.message)}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] flex justify-end gap-3 bg-[#FAF8F5]">
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-white border border-[#D6CFC4] text-[#45413C] text-xs font-medium rounded-lg hover:bg-[#F5F2EC] transition"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        type="submit"
                        form="service-package-form"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-[#2D3F2C] text-[#FAF8F5] text-xs font-medium rounded-lg hover:bg-[#1F2C1E] transition shadow-xs disabled:opacity-50"
                    >
                        {isSubmitting ? t("common.submitting") : t("common.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};
