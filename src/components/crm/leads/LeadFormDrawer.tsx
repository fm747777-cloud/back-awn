import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    UserPlus,
    Edit3,
    AlertCircle,
    CheckCircle2,
    Building2,
    Phone,
    Mail,
    MapPin,
    Plus,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    crmLeadInputSchema,
    type CrmLeadInput,
    type CrmLeadRecord,
    type CrmLeadSourceRecord,
    type CrmLeadStatusRecord,
    type CrmSectorRecord,
    type CrmCompanyRecord,
    type CrmCompanyInput,
    type CrmOrganizationalTypeRecord,
    type CrmOwnershipTypeRecord,
    type CrmOwnerRecord,
} from '../../../schemas/crmSchema';
import { crmApi, type CrmSalesEmployee } from '../../../api/api';
import { CompanyPreOnboardingModal } from '../companies/CompanyPreOnboardingModal';

const COMPANY_SIZE_OPTIONS = [
    '1-10',
    '11-50',
    '51-200',
    '200-500',
    '500-1000',
    '1000+',
] as const;

const COUNTRY_OPTIONS = [
    'Saudi Arabia',
    'United Arab Emirates',
    'Kuwait',
    'Qatar',
    'Bahrain',
    'Oman',
    'Egypt',
    'Jordan',
] as const;

export interface LeadFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmLeadRecord | null;
    leadSources: CrmLeadSourceRecord[];
    leadStatuses: CrmLeadStatusRecord[];
    sectors: CrmSectorRecord[];
    companies: CrmCompanyRecord[];
    employees: CrmSalesEmployee[];
    organizationalTypes?: CrmOrganizationalTypeRecord[];
    ownershipTypes?: CrmOwnershipTypeRecord[];
    existingOwners?: CrmOwnerRecord[];
    onCompanyCreated?: (newCompany: CrmCompanyRecord) => void;
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmLeadInput) => Promise<void> | void;
}

export const LeadFormDrawer: React.FC<LeadFormDrawerProps> = ({
    isOpen,
    mode,
    initialData,
    leadSources,
    leadStatuses,
    sectors,
    companies,
    employees,
    organizationalTypes = [],
    ownershipTypes = [],
    existingOwners = [],
    onCompanyCreated,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultSourceId =
        leadSources.find((s) => s.status === 'active')?.id || leadSources[0]?.id || '';
    const defaultStatusId =
        leadStatuses.find((s) => s.isDefault && s.status === 'active')?.id ||
        leadStatuses.find((s) => s.status === 'active')?.id ||
        leadStatuses[0]?.id ||
        '';
    const defaultSectorId =
        sectors.find((s) => s.status === 'active')?.id || sectors[0]?.id || '';

    const [formState, setFormState] = useState<CrmLeadInput>({
        title: '',
        leadType: 'individual',
        leadSourceId: '',
        leadStatusId: defaultStatusId,
        assignedEmployeeId: '',
        sectorId: '',
        contactName: '',
        contactJobTitle: '',
        contactPhone: '',
        contactEmail: '',
        temporaryCompanyName: '',
        companyId: '',
        companySize: '',
        estimatedValue: 0,
        country: '',
        state: '',
        city: '',
        pinCode: '',
        website: '',
        address: '',
        notes: '',
        status: 'active',
    });

    const [leadValueInput, setLeadValueInput] = useState<string>('');
    const [isMoreFieldsOpen, setIsMoreFieldsOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isCreatingCompany, setIsCreatingCompany] = useState(false);
    const [companyModalError, setCompanyModalError] = useState<string | null>(null);
    const [companyPrefill, setCompanyPrefill] = useState<Partial<CrmCompanyInput> | null>(null);
    const [locallyCreatedCompanies, setLocallyCreatedCompanies] = useState<CrmCompanyRecord[]>([]);

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${defaultSourceId}-${defaultStatusId}-${defaultSectorId}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setFieldErrors({});
            setIsMoreFieldsOpen(false);
            if (mode === 'edit' && initialData) {
                setFormState({
                    title: initialData.title,
                    leadType: initialData.leadType || 'company',
                    leadSourceId: initialData.leadSourceId,
                    leadStatusId: initialData.leadStatusId,
                    assignedEmployeeId: initialData.assignedEmployeeId || '',
                    sectorId: initialData.sectorId,
                    contactName: initialData.contactName,
                    contactJobTitle: initialData.contactJobTitle || '',
                    contactPhone: initialData.contactPhone,
                    contactEmail: initialData.contactEmail,
                    temporaryCompanyName: initialData.temporaryCompanyName || '',
                    companyId: initialData.companyId || '',
                    companySize: initialData.companySize || '',
                    estimatedValue: Number(initialData.estimatedValue || 0),
                    country: initialData.country || 'Saudi Arabia',
                    state: initialData.state || '',
                    city: initialData.city || '',
                    pinCode: initialData.pinCode || '',
                    website: initialData.website || '',
                    address: initialData.address || '',
                    notes: initialData.notes || '',
                    status: initialData.status,
                });
                setLeadValueInput(
                    initialData.estimatedValue ? String(initialData.estimatedValue) : ''
                );
            } else {
                setFormState({
                    title: '',
                    leadType: 'individual',
                    leadSourceId: '',
                    leadStatusId: defaultStatusId,
                    assignedEmployeeId: '',
                    sectorId: '',
                    contactName: '',
                    contactJobTitle: '',
                    contactPhone: '',
                    contactEmail: '',
                    temporaryCompanyName: '',
                    companyId: '',
                    companySize: '',
                    estimatedValue: 0,
                    country: '',
                    state: '',
                    city: '',
                    pinCode: '',
                    website: '',
                    address: '',
                    notes: '',
                    status: 'active',
                });
                setLeadValueInput('');
            }
        }
    }

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleChange = <K extends keyof CrmLeadInput>(
        field: K,
        value: CrmLeadInput[K]
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field as string]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[field as string];
                return next;
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldErrors({});

        const resolvedTitle =
            mode === 'create'
                ? formState.contactName.trim() ||
                  formState.temporaryCompanyName?.trim() ||
                  ''
                : formState.title?.trim() || '';

        const resolvedLeadValue =
            mode === 'create'
                ? leadValueInput.trim() === ''
                    ? 0
                    : Math.max(0, Number(leadValueInput))
                : Number(formState.estimatedValue || 0);

        const parsed = crmLeadInputSchema.safeParse({
            ...formState,
            title: resolvedTitle,
            leadStatusId: formState.leadStatusId || defaultStatusId || '',
            estimatedValue: Number.isFinite(resolvedLeadValue) ? resolvedLeadValue : 0,
            companyId: formState.companyId?.trim() || undefined,
        });

        const errors: Record<string, string> = {};
        if (mode === 'edit' && !resolvedTitle) {
            errors.title = 'Lead title is required';
        }
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] || 'form');
                if (!errors[key]) {
                    errors[key] = issue.message;
                }
            }
        }

        if (Object.keys(errors).length > 0 || !parsed.success) {
            setFieldErrors(errors);
            return;
        }

        await onSubmit(parsed.data);
    };

    const allAvailableCompanies = useMemo(() => {
        const map = new Map<string, CrmCompanyRecord>();
        for (const c of companies) {
            map.set(c.id, c);
        }
        for (const c of locallyCreatedCompanies) {
            map.set(c.id, c);
        }
        return Array.from(map.values());
    }, [companies, locallyCreatedCompanies]);

    const activeSources = leadSources.filter(
        (s) => s.status === 'active' || s.id === formState.leadSourceId
    );
    const activeStatuses = [...leadStatuses]
        .filter((s) => s.status === 'active' || s.id === formState.leadStatusId)
        .sort((a, b) => a.stageOrder - b.stageOrder);
    const activeSectors = sectors.filter(
        (s) => s.status === 'active' || s.id === formState.sectorId
    );
    const activeCompanies = allAvailableCompanies.filter(
        (c) => c.status === 'active' || c.id === formState.companyId
    );

    const selectedCompany = useMemo(() => {
        if (!formState.companyId) return null;
        return allAvailableCompanies.find((c) => c.id === formState.companyId) || null;
    }, [formState.companyId, allAvailableCompanies]);

    const handleOpenCreateCompany = () => {
        const defaultOrgTypeId =
            organizationalTypes.find((o) => o.status === 'active')?.id ||
            organizationalTypes[0]?.id ||
            '';
        const defaultOwnTypeId =
            ownershipTypes.find((o) => o.status === 'active')?.id ||
            ownershipTypes[0]?.id ||
            '';

        const prefillName =
            formState.temporaryCompanyName?.trim() ||
            formState.title?.trim() ||
            formState.contactName.trim();

        const prefill: Partial<CrmCompanyInput> = {
            nameEn: prefillName,
            nameAr: prefillName,
            businessName: prefillName,
            organizationalTypeId: defaultOrgTypeId,
            ownershipTypeId: defaultOwnTypeId,
            sectorId: formState.sectorId || defaultSectorId,
            assignedEmployeeId: formState.assignedEmployeeId || '',
            phone: formState.contactPhone || '',
            email: formState.contactEmail || '',
            country: formState.country || 'Saudi Arabia',
            state: formState.state || 'Riyadh Province',
            city: formState.city || 'Riyadh',
            pinCode: formState.pinCode || '',
            address: formState.address || '',
            website: formState.website || '',
            leadId: initialData?.id || undefined,
            owners: formState.contactName?.trim()
                ? [
                      {
                          firstName:
                              formState.contactName.trim().split(' ')[0] ||
                              formState.contactName.trim(),
                          lastName:
                              formState.contactName
                                  .trim()
                                  .split(' ')
                                  .slice(1)
                                  .join(' ') || '',
                          fullNameEn: formState.contactName.trim(),
                          fullNameAr: formState.contactName.trim(),
                          gender: 'male',
                          nationality: 'Saudi',
                          ownershipTypeId: defaultOwnTypeId,
                          phone: formState.contactPhone || '',
                          email: formState.contactEmail || '',
                          ownershipPercentage: 100,
                          isMainOwner: true,
                      },
                  ]
                : [],
        };
        setCompanyPrefill(prefill);
        setCompanyModalError(null);
        setIsCompanyModalOpen(true);
    };

    const handleCreateCompanySubmit = async (companyData: CrmCompanyInput) => {
        try {
            setIsCreatingCompany(true);
            setCompanyModalError(null);
            const created = await crmApi.companies.submitPreOnboarding({
                ...companyData,
                leadId: initialData?.id || undefined,
            });

            setLocallyCreatedCompanies((prev) => [created, ...prev]);

            setFormState((prev) => ({
                ...prev,
                companyId: created.id,
                temporaryCompanyName: prev.temporaryCompanyName || created.nameEn,
            }));

            if (fieldErrors.companyId) {
                setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.companyId;
                    return next;
                });
            }

            if (mode === 'edit' && initialData?.id) {
                await crmApi.leads.update(initialData.id, { companyId: created.id });
            }

            onCompanyCreated?.(created);
            setIsCompanyModalOpen(false);
            setCompanyPrefill(null);
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : 'Failed to create company';
            setCompanyModalError(msg);
        } finally {
            setIsCreatingCompany(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C] shrink-0">
                            {mode === 'create' ? <UserPlus size={18} /> : <Edit3 size={18} />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#037F8C]"
                                    dir="ltr"
                                >
                                    {mode === 'edit' && initialData
                                        ? initialData.code
                                        : t('crm.customer.leads.badge')}
                                </span>
                            </div>
                            <h2
                                id="lead-form-drawer-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t('crm.customer.leads.form.createTitle')
                                    : t('crm.customer.leads.form.editTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t('crm.customer.leads.form.createSubtitle')
                                    : t('crm.customer.leads.form.editSubtitle', {
                                          code: initialData?.code || '',
                                      })}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.customer.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {mode === 'create' ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex-1 overflow-y-auto p-6 space-y-5"
                        noValidate
                    >
                        {serverError && (
                            <div className="rounded-xl border border-[#F5C6C6] bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. Source* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Source <span className="text-[#A63A3A]">*</span>
                                </label>
                                <select
                                    value={formState.leadSourceId}
                                    onChange={(e) =>
                                        handleChange('leadSourceId', e.target.value)
                                    }
                                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                        fieldErrors.leadSourceId
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                >
                                    <option value="">Select Source</option>
                                    {activeSources.map((src) => (
                                        <option key={src.id} value={src.id}>
                                            {isRtl ? src.nameAr : src.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.leadSourceId && (
                                    <p className="mt-1 text-[11px] text-[#A63A3A]">
                                        {fieldErrors.leadSourceId}
                                    </p>
                                )}
                            </div>

                            {/* 2. Assigned */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Assigned
                                </label>
                                <select
                                    value={formState.assignedEmployeeId || ''}
                                    onChange={(e) =>
                                        handleChange('assignedEmployeeId', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                >
                                    <option value="">Select Assigned Lead</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn} (
                                            {isRtl ? emp.roleAr : emp.roleEn})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. Lead Type */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Lead Type
                                </label>
                                <div className="flex items-center gap-4">
                                    <label
                                        className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                            formState.leadType === 'individual'
                                                ? 'border-[#037F8C] bg-[#037F8C]/5 text-[#037F8C]'
                                                : 'border-[#E5E0D8] bg-white text-[#0D0D0D]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="leadType"
                                            value="individual"
                                            checked={formState.leadType === 'individual'}
                                            onChange={() =>
                                                handleChange('leadType', 'individual')
                                            }
                                            className="accent-[#037F8C]"
                                        />
                                        <span>Individual</span>
                                    </label>
                                    <label
                                        className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                            formState.leadType === 'company'
                                                ? 'border-[#037F8C] bg-[#037F8C]/5 text-[#037F8C]'
                                                : 'border-[#E5E0D8] bg-white text-[#0D0D0D]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="leadType"
                                            value="company"
                                            checked={formState.leadType === 'company'}
                                            onChange={() =>
                                                handleChange('leadType', 'company')
                                            }
                                            className="accent-[#037F8C]"
                                        />
                                        <span>Organization</span>
                                    </label>
                                </div>
                            </div>

                            {/* 4. Name* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Name <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.contactName}
                                    onChange={(e) =>
                                        handleChange('contactName', e.target.value)
                                    }
                                    placeholder="Enter Name"
                                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                        fieldErrors.contactName
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.contactName && (
                                    <p className="mt-1 text-[11px] text-[#A63A3A]">
                                        {fieldErrors.contactName}
                                    </p>
                                )}
                            </div>

                            {/* 5. Phone* */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Phone <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formState.contactPhone}
                                    onChange={(e) =>
                                        handleChange('contactPhone', e.target.value)
                                    }
                                    placeholder="Enter Phone Number"
                                    dir="ltr"
                                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                        fieldErrors.contactPhone
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.contactPhone && (
                                    <p className="mt-1 text-[11px] text-[#A63A3A]">
                                        {fieldErrors.contactPhone}
                                    </p>
                                )}
                            </div>

                            {/* 6. Email Address */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formState.contactEmail}
                                    onChange={(e) =>
                                        handleChange('contactEmail', e.target.value)
                                    }
                                    placeholder="Enter Email Address"
                                    dir="ltr"
                                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                        fieldErrors.contactEmail
                                            ? 'border-[#A63A3A]'
                                            : 'border-[#E5E0D8]'
                                    }`}
                                />
                                {fieldErrors.contactEmail && (
                                    <p className="mt-1 text-[11px] text-[#A63A3A]">
                                        {fieldErrors.contactEmail}
                                    </p>
                                )}
                            </div>

                            {/* 7. Sector */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Sector
                                </label>
                                <select
                                    value={formState.sectorId}
                                    onChange={(e) => handleChange('sectorId', e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                >
                                    <option value="">Select Sector</option>
                                    {activeSectors.map((sec) => (
                                        <option key={sec.id} value={sec.id}>
                                            {isRtl ? sec.nameAr : sec.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 8. Company Name (Temporary) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Company Name (Temporary)
                                </label>
                                <input
                                    type="text"
                                    value={formState.temporaryCompanyName || ''}
                                    onChange={(e) =>
                                        handleChange('temporaryCompanyName', e.target.value)
                                    }
                                    placeholder="Enter Company Name (Temporary)"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                />
                            </div>

                            {/* 9. Company */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-[#0D0D0D]">
                                        Company
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleOpenCreateCompany}
                                        disabled={isCreatingCompany}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#037F8C] hover:text-[#233122] hover:underline cursor-pointer disabled:opacity-50"
                                    >
                                        <Plus size={12} />
                                        <span>
                                            {t(
                                                'crm.customer.leads.form.newCompany',
                                                '+ New Company'
                                            )}
                                        </span>
                                    </button>
                                </div>
                                <select
                                    value={formState.companyId || ''}
                                    onChange={(e) => {
                                        const cid = e.target.value;
                                        handleChange('companyId', cid);
                                        if (cid) {
                                            const comp = allAvailableCompanies.find(
                                                (c) => c.id === cid
                                            );
                                            if (comp && !formState.temporaryCompanyName) {
                                                handleChange(
                                                    'temporaryCompanyName',
                                                    comp.nameEn
                                                );
                                            }
                                        }
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                >
                                    <option value="">Select Company</option>
                                    {activeCompanies.map((comp) => (
                                        <option key={comp.id} value={comp.id}>
                                            {comp.code} — {isRtl ? comp.nameAr : comp.nameEn}
                                        </option>
                                    ))}
                                </select>
                                {selectedCompany && (
                                    <div className="mt-2 rounded-lg border border-[#C5D7C2] bg-[#F2F7F2] px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                        <div className="min-w-0 flex items-center gap-1.5 truncate">
                                            <span className="px-1.5 py-0.5 rounded bg-white border border-[#C5D7C2] font-mono text-[10px] font-bold text-[#037F8C]">
                                                {selectedCompany.code}
                                            </span>
                                            <span className="font-semibold text-[#037F8C] truncate">
                                                {isRtl
                                                    ? selectedCompany.nameAr
                                                    : selectedCompany.nameEn}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E6B4E]/10 text-[#2E6B4E] font-medium">
                                                {selectedCompany.onboardingStatus}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('companyId', '')}
                                            className="text-[11px] font-semibold text-[#A63A3A] hover:underline cursor-pointer shrink-0"
                                        >
                                            {t(
                                                'crm.customer.leads.form.unlinkCompany',
                                                'Unlink'
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 11. Company Size */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    Company Size
                                </label>
                                <select
                                    value={formState.companySize || ''}
                                    onChange={(e) =>
                                        handleChange('companySize', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                >
                                    <option value="">Select Company Size</option>
                                    {COMPANY_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Collapsible More Fields Section */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/70 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setIsMoreFieldsOpen((prev) => !prev)}
                                aria-expanded={isMoreFieldsOpen}
                                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[#037F8C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            >
                                <span>More Fields</span>
                                {isMoreFieldsOpen ? (
                                    <ChevronUp size={15} />
                                ) : (
                                    <ChevronDown size={15} />
                                )}
                            </button>

                            {isMoreFieldsOpen && (
                                <div className="p-4 pt-2 border-t border-[#E5E0D8] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 12. Address */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.address || ''}
                                            onChange={(e) =>
                                                handleChange('address', e.target.value)
                                            }
                                            placeholder="Enter Address"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 13. Position */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Position
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.contactJobTitle || ''}
                                            onChange={(e) =>
                                                handleChange('contactJobTitle', e.target.value)
                                            }
                                            placeholder="Enter Position"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 14. City */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.city || ''}
                                            onChange={(e) =>
                                                handleChange('city', e.target.value)
                                            }
                                            placeholder="Enter City"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 15. State */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.state || ''}
                                            onChange={(e) =>
                                                handleChange('state', e.target.value)
                                            }
                                            placeholder="Enter State"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 16. Website */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            value={formState.website || ''}
                                            onChange={(e) =>
                                                handleChange('website', e.target.value)
                                            }
                                            placeholder="Enter URL"
                                            dir="ltr"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 17. Country */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Country
                                        </label>
                                        <select
                                            value={formState.country || ''}
                                            onChange={(e) =>
                                                handleChange('country', e.target.value)
                                            }
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        >
                                            <option value="">Select Country</option>
                                            {COUNTRY_OPTIONS.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 18. Pin Code */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Pin Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formState.pinCode || ''}
                                            onChange={(e) =>
                                                handleChange('pinCode', e.target.value)
                                            }
                                            placeholder="Enter Pin Code"
                                            dir="ltr"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 19. Lead Value */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Lead Value
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={leadValueInput}
                                            onChange={(e) => {
                                                setLeadValueInput(e.target.value);
                                                handleChange(
                                                    'estimatedValue',
                                                    e.target.value === ''
                                                        ? 0
                                                        : Math.max(0, Number(e.target.value))
                                                );
                                            }}
                                            placeholder="Enter Lead Value"
                                            dir="ltr"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>

                                    {/* 20. Notes */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                            Notes
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formState.notes || ''}
                                            onChange={(e) =>
                                                handleChange('notes', e.target.value)
                                            }
                                            placeholder="Enter Notes"
                                            className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions: Cancel and Submit only */}
                        <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} />
                                <span>Submit</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Edit Lead Form (Preserved Unchanged) */
                    <form
                        onSubmit={handleSubmit}
                        className="flex-1 overflow-y-auto p-6 space-y-6"
                        noValidate
                    >
                        {serverError && (
                            <div className="rounded-xl border border-[#F5C6C6] bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        {/* Section 1: Lead & Qualification Details */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/70 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                                <Building2 size={14} />
                                <span>{t('crm.customer.leads.form.sectionLeadInfo')}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.titleLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.title || ''}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        placeholder={t('crm.customer.leads.form.titlePlaceholder')}
                                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                            fieldErrors.title
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.title && (
                                        <p className="mt-1 text-[11px] text-[#A63A3A]">
                                            {fieldErrors.title}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.leadTypeLabel')}
                                    </label>
                                    <select
                                        value={formState.leadType}
                                        onChange={(e) =>
                                            handleChange(
                                                'leadType',
                                                e.target.value as 'company' | 'individual'
                                            )
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    >
                                        <option value="company">
                                            {t('crm.customer.leads.typeCompany')}
                                        </option>
                                        <option value="individual">
                                            {t('crm.customer.leads.typeIndividual')}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.leadStatusLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <select
                                        value={formState.leadStatusId}
                                        onChange={(e) =>
                                            handleChange('leadStatusId', e.target.value)
                                        }
                                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                            fieldErrors.leadStatusId
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    >
                                        {activeStatuses.map((st) => (
                                            <option key={st.id} value={st.id}>
                                                #{st.stageOrder} —{' '}
                                                {isRtl ? st.nameAr : st.nameEn} (
                                                {st.probability}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.leadSourceLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <select
                                        value={formState.leadSourceId}
                                        onChange={(e) =>
                                            handleChange('leadSourceId', e.target.value)
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    >
                                        {activeSources.map((src) => (
                                            <option key={src.id} value={src.id}>
                                                {isRtl ? src.nameAr : src.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.sectorLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <select
                                        value={formState.sectorId}
                                        onChange={(e) => handleChange('sectorId', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    >
                                        {activeSectors.map((sec) => (
                                            <option key={sec.id} value={sec.id}>
                                                {isRtl ? sec.nameAr : sec.nameEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.assignedEmployeeLabel')}
                                    </label>
                                    <select
                                        value={formState.assignedEmployeeId || ''}
                                        onChange={(e) =>
                                            handleChange('assignedEmployeeId', e.target.value)
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    >
                                        <option value="">
                                            {t('crm.customer.common.unassigned')}
                                        </option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {isRtl ? emp.nameAr : emp.nameEn} (
                                                {isRtl ? emp.roleAr : emp.roleEn})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.estimatedValueLabel')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1000}
                                        value={formState.estimatedValue ?? 0}
                                        onChange={(e) =>
                                            handleChange(
                                                'estimatedValue',
                                                Math.max(0, Number(e.target.value || 0))
                                            )
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Primary Contact Details */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/70 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                                <Phone size={14} />
                                <span>{t('crm.customer.leads.form.sectionContactInfo')}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.contactNameLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.contactName}
                                        onChange={(e) =>
                                            handleChange('contactName', e.target.value)
                                        }
                                        placeholder={t(
                                            'crm.customer.leads.form.contactNamePlaceholder'
                                        )}
                                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                            fieldErrors.contactName
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.contactName && (
                                        <p className="mt-1 text-[11px] text-[#A63A3A]">
                                            {fieldErrors.contactName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.contactJobTitleLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.contactJobTitle || ''}
                                        onChange={(e) =>
                                            handleChange('contactJobTitle', e.target.value)
                                        }
                                        placeholder={t(
                                            'crm.customer.leads.form.contactJobTitlePlaceholder'
                                        )}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.contactPhoneLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.contactPhone}
                                        onChange={(e) =>
                                            handleChange('contactPhone', e.target.value)
                                        }
                                        placeholder={t(
                                            'crm.customer.leads.form.contactPhonePlaceholder'
                                        )}
                                        dir="ltr"
                                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                            fieldErrors.contactPhone
                                                ? 'border-[#A63A3A]'
                                                : 'border-[#E5E0D8]'
                                        }`}
                                    />
                                    {fieldErrors.contactPhone && (
                                        <p className="mt-1 text-[11px] text-[#A63A3A]">
                                            {fieldErrors.contactPhone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.contactEmailLabel')}{' '}
                                        <span className="text-[#A63A3A]">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={13}
                                            className="absolute start-3 top-1/2 -translate-y-1/2 text-[#6E6862]"
                                        />
                                        <input
                                            type="email"
                                            value={formState.contactEmail}
                                            onChange={(e) =>
                                                handleChange('contactEmail', e.target.value)
                                            }
                                            placeholder={t(
                                                'crm.customer.leads.form.contactEmailPlaceholder'
                                            )}
                                            dir="ltr"
                                            className={`w-full ps-8 pe-3.5 py-2.5 rounded-lg border text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20 ${
                                                fieldErrors.contactEmail
                                                    ? 'border-[#A63A3A]'
                                                    : 'border-[#E5E0D8]'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.contactEmail && (
                                        <p className="mt-1 text-[11px] text-[#A63A3A]">
                                            {fieldErrors.contactEmail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Company, Location & Notes */}
                        <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]/70 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#037F8C]">
                                <MapPin size={14} />
                                <span>{t('crm.customer.leads.form.sectionAddressInfo')}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.temporaryCompanyLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.temporaryCompanyName || ''}
                                        onChange={(e) =>
                                            handleChange('temporaryCompanyName', e.target.value)
                                        }
                                        placeholder={t(
                                            'crm.customer.leads.form.temporaryCompanyPlaceholder'
                                        )}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-[#0D0D0D]">
                                            {t('crm.customer.leads.form.linkedCompanyLabel')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleOpenCreateCompany}
                                            disabled={isCreatingCompany}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#037F8C] hover:text-[#233122] hover:underline cursor-pointer disabled:opacity-50"
                                        >
                                            <Plus size={13} />
                                            <span>
                                                {t(
                                                    'crm.customer.leads.form.newCompany',
                                                    '+ New Company'
                                                )}
                                            </span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <select
                                                value={formState.companyId || ''}
                                                onChange={(e) => {
                                                    const cid = e.target.value;
                                                    handleChange('companyId', cid);
                                                    if (cid) {
                                                        const comp = allAvailableCompanies.find(
                                                            (c) => c.id === cid
                                                        );
                                                        if (
                                                            comp &&
                                                            !formState.temporaryCompanyName
                                                        ) {
                                                            handleChange(
                                                                'temporaryCompanyName',
                                                                comp.nameEn
                                                            );
                                                        }
                                                    }
                                                }}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                            >
                                                <option value="">
                                                    {t(
                                                        'crm.customer.leads.form.noLinkedCompany'
                                                    )}
                                                </option>
                                                {activeCompanies.map((comp) => (
                                                    <option key={comp.id} value={comp.id}>
                                                        {comp.code} —{' '}
                                                        {isRtl ? comp.nameAr : comp.nameEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleOpenCreateCompany}
                                            disabled={isCreatingCompany}
                                            className="px-3 py-2.5 rounded-lg border border-[#037F8C]/30 bg-[#037F8C]/5 hover:bg-[#037F8C]/10 text-xs font-semibold text-[#037F8C] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                                        >
                                            <Plus size={14} />
                                            <span>
                                                {t(
                                                    'crm.customer.leads.form.newCompany',
                                                    'New Company'
                                                )}
                                            </span>
                                        </button>
                                    </div>

                                    {selectedCompany && (
                                        <div className="rounded-lg border border-[#C5D7C2] bg-[#F2F7F2] p-3 flex items-start justify-between gap-3 text-xs">
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#C5D7C2] font-mono text-[10px] font-bold text-[#037F8C]">
                                                        {selectedCompany.code}
                                                    </span>
                                                    <span className="font-bold text-[#037F8C] truncate">
                                                        {isRtl
                                                            ? selectedCompany.nameAr
                                                            : selectedCompany.nameEn}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2E6B4E]/10 text-[#2E6B4E] font-medium">
                                                        {selectedCompany.onboardingStatus}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-[#6E6862] flex flex-wrap gap-x-3 gap-y-0.5">
                                                    {selectedCompany.crNumber && (
                                                        <span>CR: {selectedCompany.crNumber}</span>
                                                    )}
                                                    {selectedCompany.taxNumber && (
                                                        <span>VAT: {selectedCompany.taxNumber}</span>
                                                    )}
                                                    {selectedCompany.city && (
                                                        <span>{selectedCompany.city}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('companyId', '')}
                                                className="text-[11px] font-semibold text-[#A63A3A] hover:underline cursor-pointer shrink-0"
                                            >
                                                {t(
                                                    'crm.customer.leads.form.unlinkCompany',
                                                    'Unlink'
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.companySizeLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.companySize || ''}
                                        onChange={(e) =>
                                            handleChange('companySize', e.target.value)
                                        }
                                        placeholder={t(
                                            'crm.customer.leads.form.companySizePlaceholder'
                                        )}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.cityLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.city || ''}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.countryLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.country || ''}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.websiteLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.website || ''}
                                        onChange={(e) => handleChange('website', e.target.value)}
                                        dir="ltr"
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.addressLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formState.address || ''}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                        {t('crm.customer.leads.form.notesLabel')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formState.notes || ''}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder={t(
                                            'crm.customer.leads.form.notesPlaceholder'
                                        )}
                                        className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D] focus:outline-none focus:ring-2 focus:ring-[#037F8C]/20"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
                                    <span className="text-xs font-semibold text-[#0D0D0D]">
                                        {t('crm.master.form.statusLabel')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('status', 'active')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                                formState.status === 'active'
                                                    ? 'bg-[#E9F5EE] border-[#2E6B4E]/30 text-[#2E6B4E]'
                                                    : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                            }`}
                                        >
                                            {t('crm.customer.common.active')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('status', 'inactive')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                                formState.status === 'inactive'
                                                    ? 'bg-[#FCECE9] border-[#A63A3A]/30 text-[#A63A3A]'
                                                    : 'bg-white border-[#E5E0D8] text-[#6E6862]'
                                            }`}
                                        >
                                            {t('crm.customer.common.inactive')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                            >
                                {t('crm.customer.common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 size={14} />
                                {isSubmitting
                                    ? t('crm.customer.common.saving')
                                    : t('crm.customer.common.saveChanges')}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {isCompanyModalOpen && (
                <CompanyPreOnboardingModal
                    isOpen={isCompanyModalOpen}
                    mode="create"
                    prefillData={companyPrefill}
                    organizationalTypes={organizationalTypes}
                    ownershipTypes={ownershipTypes}
                    sectors={sectors}
                    existingOwners={existingOwners}
                    employees={employees}
                    isSubmitting={isCreatingCompany}
                    serverError={companyModalError}
                    onClose={() => {
                        setIsCompanyModalOpen(false);
                        setCompanyModalError(null);
                        setCompanyPrefill(null);
                    }}
                    onSubmit={handleCreateCompanySubmit}
                />
            )}
        </div>
    );
};
export default LeadFormDrawer;
