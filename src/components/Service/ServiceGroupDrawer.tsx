import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Building2,
    Briefcase,
    Users,
    Truck,
    Wallet,
    ShieldCheck,
    Layers,
    FileText,
    Search,
    ChevronDown,
    Check,
    RotateCcw,
    Plus,
    CheckCircle2,
} from 'lucide-react';
import {
    GroupType,
    BoardingType,
    ServiceTagStatus,
    SERVICE_TYPE_OPTIONS,
    SERVICE_CATEGORY_OPTIONS,
    INITIAL_AVAILABLE_SERVICES,
    type CreateServiceGroupDto,
    type ServicePackageOption,
} from './serviceGroupTypes';

// Predefined available Service Packages for the searchable combobox
const MOCK_SERVICE_PACKAGES: ServicePackageOption[] = [
    { id: 'pkg-1', packageCode: 'PKG-001', name: 'Enterprise Corporate Bundle' },
    { id: 'pkg-2', packageCode: 'PKG-002', name: 'SME Comprehensive Support' },
    { id: 'pkg-3', packageCode: 'PKG-003', name: 'Workforce & Labor Package' },
    { id: 'pkg-4', packageCode: 'PKG-004', name: 'Licensing & Permits Essentials' },
    { id: 'pkg-5', packageCode: 'PKG-005', name: 'Logistics & Fleet Standard Package' },
];

// Curated icon choices for enterprise service groups
const ICON_OPTIONS = [
    { id: 'users', label: 'Workforce', icon: Users },
    { id: 'briefcase', label: 'Business', icon: Briefcase },
    { id: 'building-2', label: 'Corporate', icon: Building2 },
    { id: 'truck', label: 'Logistics', icon: Truck },
    { id: 'wallet', label: 'Finance', icon: Wallet },
    { id: 'shield-check', label: 'Compliance', icon: ShieldCheck },
    { id: 'layers', label: 'Operations', icon: Layers },
    { id: 'file-text', label: 'Documents', icon: FileText },
];

interface ServiceGroupDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateServiceGroupDto, id?: string) => void;
    initialData?: (CreateServiceGroupDto & { id?: string }) | null;
}

export const ServiceGroupDrawer: React.FC<ServiceGroupDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
}) => {
    const isEdit = Boolean(initialData?.id);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const comboboxRef = useRef<HTMLDivElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Section 1 & 2: Form states
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [groupIcon, setGroupIcon] = useState(initialData?.group_icon || 'briefcase');
    const [servicePackageId, setServicePackageId] = useState(initialData?.servicePackage_id || '');
    const [groupType, setGroupType] = useState<GroupType>(initialData?.group_type || GroupType.EMPLOYEE);
    const [boardingType, setBoardingType] = useState<BoardingType>(initialData?.boarding_type || BoardingType.OTHER);
    const [status, setStatus] = useState<ServiceTagStatus>(initialData?.status || ServiceTagStatus.ACTIVE);

    // Section 3: Selected Services state
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialData?.service_ids || []);

    // Filter states for Service Selection
    const [serviceSearchInput, setServiceSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

    // Comboboxes open states
    const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [typeSearch, setTypeSearch] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    // Validation
    const [nameError, setNameError] = useState<string | null>(null);

    // Adjust state during render when initialData reference changes (per React docs)
    const [prevInitialData, setPrevInitialData] = useState(initialData);
    if (initialData !== prevInitialData) {
        setPrevInitialData(initialData);
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setGroupIcon(initialData?.group_icon || 'briefcase');
        setServicePackageId(initialData?.servicePackage_id || '');
        setGroupType(initialData?.group_type || GroupType.EMPLOYEE);
        setBoardingType(initialData?.boarding_type || BoardingType.OTHER);
        setStatus(initialData?.status || ServiceTagStatus.ACTIVE);
        setSelectedServiceIds(initialData?.service_ids || []);
        setNameError(null);
        setIsPackageDropdownOpen(false);
        setPackageSearch('');
        setServiceSearchInput('');
        setAppliedSearch('');
        setSelectedTypeFilter('');
        setSelectedCategoryFilter('');
    }

    // Auto-focus primary field when drawer opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close comboboxes on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (comboboxRef.current && !comboboxRef.current.contains(target)) {
                setIsPackageDropdownOpen(false);
            }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) {
                setIsTypeDropdownOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isPackageDropdownOpen || isTypeDropdownOpen || isCategoryDropdownOpen) {
                    setIsPackageDropdownOpen(false);
                    setIsTypeDropdownOpen(false);
                    setIsCategoryDropdownOpen(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPackageDropdownOpen, isTypeDropdownOpen, isCategoryDropdownOpen, onClose]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (!trimmedName) {
            setNameError('Group Name is required');
            nameInputRef.current?.focus();
            return;
        }

        setNameError(null);

        const dto: CreateServiceGroupDto = {
            name: trimmedName,
            description: description.trim() || undefined,
            group_icon: groupIcon,
            servicePackage_id: servicePackageId || undefined,
            group_type: groupType,
            boarding_type: boardingType,
            status: status,
            service_ids: selectedServiceIds,
        };

        onSubmit(dto, initialData?.id);
    };

    // Filtered Packages for Combobox
    const selectedPackage = MOCK_SERVICE_PACKAGES.find((pkg) => pkg.id === servicePackageId);
    const filteredPackages = MOCK_SERVICE_PACKAGES.filter((pkg) => {
        const term = packageSearch.toLowerCase();
        return pkg.name.toLowerCase().includes(term) || pkg.packageCode.toLowerCase().includes(term);
    });

    // Filtered Types for Combobox
    const filteredTypeOptions = SERVICE_TYPE_OPTIONS.filter((opt) =>
        opt.toLowerCase().includes(typeSearch.toLowerCase())
    );

    // Filtered Categories for Combobox
    const filteredCategoryOptions = SERVICE_CATEGORY_OPTIONS.filter((opt) =>
        opt.toLowerCase().includes(categorySearch.toLowerCase())
    );

    // Handle Enter to Search on main service search
    const handleServiceSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setAppliedSearch(serviceSearchInput);
        }
    };

    const handleExecuteServiceSearch = () => {
        setAppliedSearch(serviceSearchInput);
    };

    const handleResetFilters = () => {
        setServiceSearchInput('');
        setAppliedSearch('');
        setSelectedTypeFilter('');
        setSelectedCategoryFilter('');
    };

    const isAnyFilterActive = Boolean(
        appliedSearch || serviceSearchInput || selectedTypeFilter || selectedCategoryFilter
    );

    // Progressive filtering of Available Services
    const filteredAvailableServices = INITIAL_AVAILABLE_SERVICES.filter((svc) => {
        // Search term filter (uses appliedSearch or live input if applied)
        const term = (appliedSearch || '').trim().toLowerCase();
        if (term && !svc.name.toLowerCase().includes(term)) {
            return false;
        }
        // Service Type filter
        if (selectedTypeFilter && svc.serviceType !== selectedTypeFilter) {
            return false;
        }
        // Service Category filter
        if (selectedCategoryFilter && svc.serviceCategory !== selectedCategoryFilter) {
            return false;
        }
        return true;
    });

    // Add / Remove from Selected Services
    const handleAddService = (serviceId: string) => {
        if (!selectedServiceIds.includes(serviceId)) {
            setSelectedServiceIds((prev) => [...prev, serviceId]);
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setSelectedServiceIds((prev) => prev.filter((id) => id !== serviceId));
    };

    // Selected service items resolved from master mock list
    const selectedServicesList = selectedServiceIds
        .map((id) => INITIAL_AVAILABLE_SERVICES.find((s) => s.id === id))
        .filter(Boolean);

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Right-side Sheet / Drawer Container */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl lg:max-w-3xl bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {isEdit ? 'Edit Service Group' : 'Create Service Group'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isEdit
                                ? 'Update group information, linked classification, and service associations.'
                                : 'Configure group details and select services to link to this administrative group.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Close drawer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="service-group-form"
                    onSubmit={handleFormSubmit}
                    className="p-6 overflow-y-auto flex-1 space-y-6"
                >
                    {/* SECTION 1: Group Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3.5 bg-[#126b71] rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                1. Group Information
                            </h3>
                        </div>

                        {/* Group Name */}
                        <div>
                            <label
                                htmlFor="sg-name"
                                className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                                Group Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="sg-name"
                                ref={nameInputRef}
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (nameError && e.target.value.trim()) {
                                        setNameError(null);
                                    }
                                }}
                                placeholder="e.g. Corporate & Commercial Services"
                                className={`w-full px-3.5 py-2.5 bg-slate-50/80 border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 transition-colors ${
                                    nameError
                                        ? 'border-red-300 focus:ring-red-400/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-[#126b71]/20 focus:border-[#126b71]'
                                }`}
                            />
                            {nameError && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {nameError}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="sg-description"
                                className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                                Description <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                id="sg-description"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the operational scope, related entity categories, or organizational context..."
                                className="w-full px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition-colors resize-none"
                            />
                        </div>

                        {/* Group Icon Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Group Icon <span className="text-slate-400 font-normal">(Select an identifier)</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ICON_OPTIONS.map((item) => {
                                    const IconComponent = item.icon;
                                    const isSelected = groupIcon === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setGroupIcon(item.id)}
                                            className={`flex items-center gap-2 p-2 rounded-lg border text-left transition cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#126b71]/10 border-[#126b71] text-[#126b71] font-semibold ring-1 ring-[#126b71]'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            <IconComponent size={15} className="shrink-0" />
                                            <span className="text-[11px] truncate flex-1">{item.label}</span>
                                            {isSelected && <Check size={12} className="shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Classification & Status */}
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <span className="w-1.5 h-3.5 bg-[#b5925a] rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                2. Classification & Status
                            </h3>
                        </div>

                        {/* Service Package (Searchable Combobox) */}
                        <div className="relative" ref={comboboxRef}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Service Package <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsPackageDropdownOpen((prev) => !prev)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-left flex items-center justify-between text-slate-800 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition cursor-pointer"
                            >
                                <span className={selectedPackage ? 'font-medium text-slate-800' : 'text-slate-400'}>
                                    {selectedPackage
                                        ? `${selectedPackage.name} (${selectedPackage.packageCode})`
                                        : 'Search or select a Service Package...'}
                                </span>
                                <ChevronDown size={14} className="text-slate-400 shrink-0" />
                            </button>

                            {/* Dropdown Popover */}
                            {isPackageDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="relative mb-2">
                                        <Search
                                            size={14}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="text"
                                            value={packageSearch}
                                            onChange={(e) => setPackageSearch(e.target.value)}
                                            placeholder="Filter packages by name or code..."
                                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#126b71] focus:border-[#126b71]"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="max-h-44 overflow-y-auto space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setServicePackageId('');
                                                setIsPackageDropdownOpen(false);
                                                setPackageSearch('');
                                            }}
                                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                                                !servicePackageId
                                                    ? 'bg-slate-100 font-semibold text-slate-800'
                                                    : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>None (No package linked)</span>
                                            {!servicePackageId && <Check size={12} className="text-[#126b71]" />}
                                        </button>

                                        {filteredPackages.length > 0 ? (
                                            filteredPackages.map((pkg) => {
                                                const isPkgSelected = servicePackageId === pkg.id;
                                                return (
                                                    <button
                                                        key={pkg.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setServicePackageId(pkg.id);
                                                            setIsPackageDropdownOpen(false);
                                                            setPackageSearch('');
                                                        }}
                                                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${
                                                            isPkgSelected
                                                                ? 'bg-[#126b71]/10 text-[#126b71] font-semibold'
                                                                : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="font-medium">{pkg.name}</div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {pkg.packageCode}
                                                            </div>
                                                        </div>
                                                        {isPkgSelected && <Check size={14} className="text-[#126b71]" />}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="py-3 text-center text-xs text-slate-400">
                                                No packages found matching &quot;{packageSearch}&quot;
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Two-column layout for Group Type & Boarding Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="sg-group-type"
                                    className="block text-xs font-semibold text-slate-700 mb-1"
                                >
                                    Group Type
                                </label>
                                <select
                                    id="sg-group-type"
                                    value={groupType}
                                    onChange={(e) => setGroupType(e.target.value as GroupType)}
                                    className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition"
                                >
                                    <option value={GroupType.EMPLOYEE}>Employee (موظف)</option>
                                    <option value={GroupType.BUSINESS}>Business (منشأة / أعمال)</option>
                                    <option value={GroupType.ASSET}>Asset (أصول / مركبات)</option>
                                    <option value={GroupType.INDIVIDUAL}>Individual (أفراد)</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="sg-boarding-type"
                                    className="block text-xs font-semibold text-slate-700 mb-1"
                                >
                                    Boarding Type
                                </label>
                                <select
                                    id="sg-boarding-type"
                                    value={boardingType}
                                    onChange={(e) => setBoardingType(e.target.value as BoardingType)}
                                    className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition"
                                >
                                    <option value={BoardingType.OTHER}>Other (عام / أخرى)</option>
                                    <option value={BoardingType.ONBOARDING}>Onboarding (تهيئة وانضمام)</option>
                                    <option value={BoardingType.OFFBOARDING}>Offboarding (إنهاء خدمات)</option>
                                    <option value={BoardingType.TRANSITION}>Transition (انتقال وتبديل)</option>
                                </select>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label
                                htmlFor="sg-status"
                                className="block text-xs font-semibold text-slate-700 mb-1"
                            >
                                Status
                            </label>
                            <select
                                id="sg-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ServiceTagStatus)}
                                className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition"
                            >
                                <option value={ServiceTagStatus.ACTIVE}>Active (نشط)</option>
                                <option value={ServiceTagStatus.INACTIVE}>Inactive (غير نشط)</option>
                                <option value={ServiceTagStatus.INITIATED}>Initiated (قيد التدشين)</option>
                                <option value={ServiceTagStatus.REJECTED}>Rejected (مرفوض)</option>
                            </select>
                        </div>
                    </div>

                    {/* SECTION 3: Service Selection */}
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-3.5 bg-[#126b71] rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    3. Service Selection
                                </h3>
                            </div>
                            {isAnyFilterActive && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="text-[11px] font-medium text-slate-500 hover:text-[#126b71] flex items-center gap-1 transition cursor-pointer"
                                >
                                    <RotateCcw size={11} />
                                    <span>Reset Filters</span>
                                </button>
                            )}
                        </div>

                        {/* Filters Container */}
                        <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                            {/* 1. Main Search Services Input with Enter to Search */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Select Service
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={serviceSearchInput}
                                        onChange={(e) => {
                                            setServiceSearchInput(e.target.value);
                                            // If cleared, immediately clear filter
                                            if (e.target.value === '') {
                                                setAppliedSearch('');
                                            }
                                        }}
                                        onKeyDown={handleServiceSearchKeyDown}
                                        placeholder="Search Services (Press Enter To Search)"
                                        className="w-full pl-8 pr-16 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition"
                                    />
                                    <Search
                                        size={14}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleExecuteServiceSearch}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition cursor-pointer"
                                        title="Press Enter to search"
                                    >
                                        Search ↵
                                    </button>
                                </div>
                            </div>

                            {/* 2. Service Type & Service Category Comboboxes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                {/* Service Type Combobox */}
                                <div className="relative" ref={typeDropdownRef}>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Service Type
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsTypeDropdownOpen((prev) => !prev)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-left flex items-center justify-between text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition cursor-pointer"
                                    >
                                        <span className={selectedTypeFilter ? 'font-medium text-slate-800' : 'text-slate-400'}>
                                            {selectedTypeFilter || 'Search for Service Type'}
                                        </span>
                                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                    </button>

                                    {/* Type Dropdown Menu */}
                                    {isTypeDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="relative mb-1.5">
                                                <Search
                                                    size={12}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                                <input
                                                    type="text"
                                                    value={typeSearch}
                                                    onChange={(e) => setTypeSearch(e.target.value)}
                                                    placeholder="Filter service type..."
                                                    className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#126b71]"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTypeFilter('');
                                                        setIsTypeDropdownOpen(false);
                                                        setTypeSearch('');
                                                    }}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between cursor-pointer ${
                                                        !selectedTypeFilter
                                                            ? 'bg-slate-100 font-semibold text-slate-800'
                                                            : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span>All Types (الكل)</span>
                                                    {!selectedTypeFilter && <Check size={12} className="text-[#126b71]" />}
                                                </button>
                                                {filteredTypeOptions.map((opt) => {
                                                    const isSelected = selectedTypeFilter === opt;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTypeFilter(opt);
                                                                setIsTypeDropdownOpen(false);
                                                                setTypeSearch('');
                                                            }}
                                                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#126b71]/10 text-[#126b71] font-semibold'
                                                                    : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span>{opt}</span>
                                                            {isSelected && <Check size={12} className="text-[#126b71]" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Service Category Combobox */}
                                <div className="relative" ref={categoryDropdownRef}>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Service Category
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-left flex items-center justify-between text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#126b71]/20 focus:border-[#126b71] transition cursor-pointer"
                                    >
                                        <span className={selectedCategoryFilter ? 'font-medium text-slate-800' : 'text-slate-400'}>
                                            {selectedCategoryFilter || 'Search for Service Category'}
                                        </span>
                                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                    </button>

                                    {/* Category Dropdown Menu */}
                                    {isCategoryDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="relative mb-1.5">
                                                <Search
                                                    size={12}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                                <input
                                                    type="text"
                                                    value={categorySearch}
                                                    onChange={(e) => setCategorySearch(e.target.value)}
                                                    placeholder="Filter service category..."
                                                    className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#126b71]"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCategoryFilter('');
                                                        setIsCategoryDropdownOpen(false);
                                                        setCategorySearch('');
                                                    }}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between cursor-pointer ${
                                                        !selectedCategoryFilter
                                                            ? 'bg-slate-100 font-semibold text-slate-800'
                                                            : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span>All Categories (الكل)</span>
                                                    {!selectedCategoryFilter && <Check size={12} className="text-[#126b71]" />}
                                                </button>
                                                {filteredCategoryOptions.map((opt) => {
                                                    const isSelected = selectedCategoryFilter === opt;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCategoryFilter(opt);
                                                                setIsCategoryDropdownOpen(false);
                                                                setCategorySearch('');
                                                            }}
                                                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition flex items-center justify-between cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#126b71]/10 text-[#126b71] font-semibold'
                                                                    : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span>{opt}</span>
                                                            {isSelected && <Check size={12} className="text-[#126b71]" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Side-by-side Selection Area */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                            {/* Left Area: Available Services */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col h-[280px]">
                                <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs text-slate-800">Available Services</span>
                                        <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                            {filteredAvailableServices.length}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">Click to add</span>
                                </div>

                                <div className="p-2 overflow-y-auto flex-1 space-y-1.5 divide-y divide-slate-100">
                                    {filteredAvailableServices.length > 0 ? (
                                        filteredAvailableServices.map((svc) => {
                                            const isSelected = selectedServiceIds.includes(svc.id);
                                            return (
                                                <div
                                                    key={svc.id}
                                                    className={`p-2 rounded-lg transition flex items-center justify-between gap-2 pt-2 first:pt-0 ${
                                                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium text-slate-800 dir-rtl text-right leading-relaxed truncate">
                                                            {svc.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                                {svc.serviceCategory}
                                                            </span>
                                                            <span className="text-[9px] bg-[#126b71]/10 text-[#126b71] px-1.5 py-0.5 rounded">
                                                                {svc.serviceType}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {isSelected ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md">
                                                                <Check size={11} />
                                                                Added
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddService(svc.id)}
                                                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#126b71] hover:bg-[#0f555a] text-white font-medium transition cursor-pointer shadow-2xs active:scale-95"
                                                            >
                                                                <Plus size={12} />
                                                                Add
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                                            <Search size={20} className="text-slate-300 mb-1" />
                                            <span>No available services match filters.</span>
                                            {isAnyFilterActive && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-2 text-[11px] text-[#126b71] font-medium underline"
                                                >
                                                    Reset filters
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Area: Selected Services */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col h-[280px]">
                                <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-xs text-slate-800">Selected Services</span>
                                        <span className="text-[10px] bg-[#126b71]/10 text-[#126b71] px-1.5 py-0.2 rounded font-bold">
                                            ({selectedServiceIds.length})
                                        </span>
                                    </div>
                                    {selectedServiceIds.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedServiceIds([])}
                                            className="text-[10px] text-slate-400 hover:text-red-600 transition cursor-pointer"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="p-2 overflow-y-auto flex-1 space-y-1.5">
                                    {selectedServicesList.length > 0 ? (
                                        selectedServicesList.map((svc) => {
                                            if (!svc) return null;
                                            return (
                                                <div
                                                    key={svc.id}
                                                    className="p-2 rounded-lg bg-emerald-50/40 border border-emerald-100 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0 flex-1 flex items-center gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-800 dir-rtl text-right truncate">
                                                                {svc.name}
                                                            </p>
                                                            <span className="text-[9px] text-slate-500">
                                                                {svc.serviceCategory} • {svc.serviceType}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveService(svc.id)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer shrink-0"
                                                        title="Remove service"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                                            <Layers size={22} className="text-slate-300 mb-1" />
                                            <span className="font-medium text-slate-600">No services selected</span>
                                            <span className="text-[11px] text-slate-400 max-w-[200px] mt-1">
                                                Click &quot;+ Add&quot; on services from the Available Services list.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="service-group-form"
                        className="px-5 py-2 bg-[#126b71] hover:bg-[#0e5257] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer active:scale-98"
                    >
                        {isEdit ? 'Save Changes' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};
