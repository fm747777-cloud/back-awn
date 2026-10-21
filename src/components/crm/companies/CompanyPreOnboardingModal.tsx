import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Building2,
    FileText,
    Users,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Crown,
    UserPlus,
} from 'lucide-react';
import type {
    CrmCompanyInput,
    CrmCompanyRecord,
    CrmCompanyOwnerAssignment,
    CrmOrganizationalTypeRecord,
    CrmOwnershipTypeRecord,
    CrmSectorRecord,
    CrmOwnerRecord,
} from '../../../schemas/crmSchema';
import type { CrmSalesEmployee } from '../../../api/api';

export interface CompanyPreOnboardingModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData?: CrmCompanyRecord | null;
    prefillData?: Partial<CrmCompanyInput> | null;
    organizationalTypes: CrmOrganizationalTypeRecord[];
    ownershipTypes: CrmOwnershipTypeRecord[];
    sectors: CrmSectorRecord[];
    existingOwners: CrmOwnerRecord[];
    employees: CrmSalesEmployee[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmCompanyInput) => Promise<void> | void;
}

export const CompanyPreOnboardingModal: React.FC<CompanyPreOnboardingModalProps> = ({
    isOpen,
    mode,
    initialData,
    prefillData = null,
    organizationalTypes,
    ownershipTypes,
    sectors,
    existingOwners,
    employees,
    isSubmitting = false,
    serverError = null,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultOrgTypeId =
        organizationalTypes.find((o) => o.status === 'active')?.id ||
        organizationalTypes[0]?.id ||
        '';
    const defaultOwnTypeId =
        ownershipTypes.find((o) => o.status === 'active')?.id ||
        ownershipTypes[0]?.id ||
        '';
    const defaultSectorId =
        sectors.find((s) => s.status === 'active')?.id || sectors[0]?.id || '';

    const createBlankOwner = (isMain = false): CrmCompanyOwnerAssignment => ({
        firstName: '',
        lastName: '',
        fullNameEn: '',
        fullNameAr: '',
        gender: 'male',
        nationality: 'Saudi',
        ownershipTypeId: defaultOwnTypeId,
        nationalIdOrIqama: '',
        phone: '',
        email: '',
        ownershipPercentage: isMain ? 100 : 0,
        isMainOwner: isMain,
    });

    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [stepError, setStepError] = useState<string | null>(null);
    const [selectedDirectoryOwnerId, setSelectedDirectoryOwnerId] = useState<string>('');

    const [formState, setFormState] = useState<CrmCompanyInput>({
        nameEn: '',
        nameAr: '',
        businessName: '',
        organizationalTypeId: defaultOrgTypeId,
        ownershipTypeId: defaultOwnTypeId,
        sectorId: defaultSectorId,
        assignedEmployeeId: '',
        crNumber: '',
        unifiedNumber: '',
        taxNumber: '',
        email: '',
        phone: '',
        website: '',
        country: 'Saudi Arabia',
        state: 'Riyadh Province',
        city: 'Riyadh',
        pinCode: '',
        address: '',
        onboardingStatus: 'pre_onboarding',
        owners: [createBlankOwner(true)],
        notes: '',
        status: 'active',
    });

    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${mode}-${initialData?.id ?? 'new'}-${prefillData?.nameEn ?? ''}-${prefillData?.email ?? ''}-${prefillData?.leadId ?? ''}-${defaultOrgTypeId}-${defaultOwnTypeId}-${defaultSectorId}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        if (isOpen) {
            setCurrentStep(1);
            setStepError(null);
            setSelectedDirectoryOwnerId('');

            if (mode === 'edit' && initialData) {
                setFormState({
                    nameEn: initialData.nameEn,
                    nameAr: initialData.nameAr,
                    businessName: initialData.businessName || initialData.nameEn,
                    organizationalTypeId: initialData.organizationalTypeId,
                    ownershipTypeId: initialData.ownershipTypeId || defaultOwnTypeId,
                    sectorId: initialData.sectorId,
                    assignedEmployeeId: initialData.assignedEmployeeId || '',
                    crNumber: initialData.crNumber || '',
                    unifiedNumber: initialData.unifiedNumber || '',
                    taxNumber: initialData.taxNumber || '',
                    email: initialData.email,
                    phone: initialData.phone,
                    website: initialData.website || '',
                    country: initialData.country || 'Saudi Arabia',
                    state: initialData.state || '',
                    city: initialData.city || '',
                    pinCode: initialData.pinCode || '',
                    address: initialData.address || '',
                    onboardingStatus: initialData.onboardingStatus,
                    owners:
                        initialData.owners && initialData.owners.length > 0
                            ? initialData.owners.map((o) => ({ ...o }))
                            : [createBlankOwner(true)],
                    notes: initialData.notes || '',
                    status: initialData.status,
                    leadId: initialData.leadId,
                });
            } else {
                setFormState({
                    nameEn: prefillData?.nameEn || '',
                    nameAr: prefillData?.nameAr || prefillData?.nameEn || '',
                    businessName:
                        prefillData?.businessName ||
                        prefillData?.nameEn ||
                        '',
                    businessType: prefillData?.businessType || 'existing_business',
                    organizationalTypeId:
                        prefillData?.organizationalTypeId || defaultOrgTypeId,
                    ownershipTypeId:
                        prefillData?.ownershipTypeId || defaultOwnTypeId,
                    sectorId: prefillData?.sectorId || defaultSectorId,
                    assignedEmployeeId: prefillData?.assignedEmployeeId || '',
                    crNumber: prefillData?.crNumber || '',
                    unifiedNumber: prefillData?.unifiedNumber || '',
                    taxNumber: prefillData?.taxNumber || '',
                    email: prefillData?.email || '',
                    phone: prefillData?.phone || '',
                    website: prefillData?.website || '',
                    country: prefillData?.country || 'Saudi Arabia',
                    state: prefillData?.state || 'Riyadh Province',
                    city: prefillData?.city || 'Riyadh',
                    pinCode: prefillData?.pinCode || '',
                    address: prefillData?.address || '',
                    onboardingStatus: prefillData?.onboardingStatus || 'pre_onboarding',
                    owners:
                        prefillData?.owners && prefillData.owners.length > 0
                            ? prefillData.owners.map((o) => ({ ...o }))
                            : [createBlankOwner(true)],
                    notes: prefillData?.notes || '',
                    status: 'active',
                    leadId: prefillData?.leadId,
                });
            }
        }
    }

    if (!isOpen) return null;

    const handleFieldChange = <K extends keyof CrmCompanyInput>(
        field: K,
        value: CrmCompanyInput[K]
    ) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        setStepError(null);
    };

    const handleOwnerChange = <K extends keyof CrmCompanyOwnerAssignment>(
        index: number,
        field: K,
        value: CrmCompanyOwnerAssignment[K]
    ) => {
        setStepError(null);
        setFormState((prev) => {
            const nextOwners = prev.owners.map((owner, idx) => {
                if (idx !== index) return owner;
                const updated = { ...owner, [field]: value };
                if (field === 'firstName' || field === 'lastName') {
                    const composed = [
                        field === 'firstName' ? String(value) : updated.firstName,
                        field === 'lastName' ? String(value) : updated.lastName,
                    ]
                        .map((s) => (s || '').trim())
                        .filter(Boolean)
                        .join(' ');
                    if (composed) {
                        updated.fullNameEn = composed;
                    }
                }
                return updated;
            });
            return { ...prev, owners: nextOwners };
        });
    };

    const handleSetMainOwner = (index: number) => {
        setStepError(null);
        setFormState((prev) => ({
            ...prev,
            owners: prev.owners.map((o, idx) => ({
                ...o,
                isMainOwner: idx === index,
            })),
        }));
    };

    const handleAddOwnerRow = () => {
        setStepError(null);
        setFormState((prev) => ({
            ...prev,
            owners: [
                ...prev.owners,
                createBlankOwner(prev.owners.length === 0),
            ],
        }));
    };

    const handleLinkDirectoryOwner = () => {
        if (!selectedDirectoryOwnerId) return;
        const found = existingOwners.find((o) => o.id === selectedDirectoryOwnerId);
        if (!found) return;
        const alreadyAdded = formState.owners.some((o) => o.ownerId === found.id);
        if (alreadyAdded) {
            setSelectedDirectoryOwnerId('');
            return;
        }
        const hasMain = formState.owners.some((o) => o.isMainOwner);
        const mappedOwner: CrmCompanyOwnerAssignment = {
            ownerId: found.id,
            firstName: found.firstName || found.fullNameEn.split(' ')[0] || found.fullNameEn,
            lastName:
                found.lastName ||
                found.fullNameEn.split(' ').slice(1).join(' ') ||
                '',
            fullNameEn: found.fullNameEn,
            fullNameAr: found.fullNameAr || found.fullNameEn,
            gender: found.gender || 'male',
            nationality: found.nationality || 'Saudi',
            ownershipTypeId: found.ownershipTypeId || defaultOwnTypeId,
            nationalIdOrIqama: found.nationalIdOrIqama || '',
            phone: found.phone,
            email: found.email || '',
            ownershipPercentage: found.ownershipPercentage || 25,
            isMainOwner: !hasMain,
        };
        setFormState((prev) => ({
            ...prev,
            owners: [...prev.owners, mappedOwner],
        }));
        setSelectedDirectoryOwnerId('');
    };

    const handleRemoveOwnerRow = (index: number) => {
        setStepError(null);
        setFormState((prev) => {
            if (prev.owners.length <= 1) return prev;
            const filtered = prev.owners.filter((_, idx) => idx !== index);
            if (!filtered.some((o) => o.isMainOwner) && filtered.length > 0) {
                filtered[0] = { ...filtered[0], isMainOwner: true };
            }
            return { ...prev, owners: filtered };
        });
    };

    const validateStep1 = (): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (
            !formState.nameEn.trim() ||
            !formState.nameAr.trim() ||
            !formState.phone.trim() ||
            !emailRegex.test(formState.email.trim()) ||
            !formState.organizationalTypeId ||
            !formState.sectorId
        ) {
            setStepError(t('crm.customer.companies.wizard.errors.step1Invalid'));
            return false;
        }
        setStepError(null);
        return true;
    };

    const validateStep2 = (): boolean => {
        if (!formState.crNumber || !formState.crNumber.trim()) {
            setStepError(t('crm.customer.companies.wizard.errors.step2Invalid'));
            return false;
        }
        setStepError(null);
        return true;
    };

    const validateStep3 = (): boolean => {
        if (!formState.owners || formState.owners.length === 0) {
            setStepError(t('crm.customer.companies.wizard.errors.noOwners'));
            return false;
        }
        const mainCount = formState.owners.filter((o) => o.isMainOwner).length;
        if (mainCount !== 1) {
            setStepError(
                t('crm.customer.companies.wizard.errors.mainOwnerRequired')
            );
            return false;
        }
        const totalShare = formState.owners.reduce(
            (sum, o) => sum + Number(o.ownershipPercentage || 0),
            0
        );
        if (totalShare > 100) {
            setStepError(t('crm.customer.companies.wizard.errors.shareExceeded'));
            return false;
        }
        for (const owner of formState.owners) {
            const fullName =
                owner.fullNameEn.trim() ||
                [owner.firstName?.trim(), owner.lastName?.trim()]
                    .filter(Boolean)
                    .join(' ');
            if (
                !fullName ||
                !owner.ownershipTypeId ||
                !owner.phone.trim() ||
                owner.ownershipPercentage <= 0
            ) {
                setStepError(
                    t('crm.customer.companies.wizard.errors.ownerFieldsInvalid')
                );
                return false;
            }
        }
        setStepError(null);
        return true;
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (validateStep1()) setCurrentStep(2);
        } else if (currentStep === 2) {
            if (validateStep2()) setCurrentStep(3);
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) {
            setCurrentStep(1);
            return;
        }
        if (!validateStep2()) {
            setCurrentStep(2);
            return;
        }
        if (!validateStep3()) {
            setCurrentStep(3);
            return;
        }
        const normalizedOwners = formState.owners.map((o) => ({
            ...o,
            fullNameEn:
                o.fullNameEn.trim() ||
                [o.firstName?.trim(), o.lastName?.trim()].filter(Boolean).join(' '),
            fullNameAr:
                o.fullNameAr?.trim() ||
                o.fullNameEn.trim() ||
                [o.firstName?.trim(), o.lastName?.trim()].filter(Boolean).join(' '),
            ownershipPercentage: Number(o.ownershipPercentage || 0),
        }));
        await onSubmit({
            ...formState,
            businessName: formState.businessName?.trim() || formState.nameEn.trim(),
            owners: normalizedOwners,
        });
    };

    const totalSharePercentage = formState.owners.reduce(
        (sum, o) => sum + Number(o.ownershipPercentage || 0),
        0
    );

    const activeOrgTypes = organizationalTypes.filter(
        (o) => o.status === 'active' || o.id === formState.organizationalTypeId
    );
    const activeOwnTypes = ownershipTypes.filter(
        (o) => o.status === 'active' || o.id === formState.ownershipTypeId
    );
    const activeSectors = sectors.filter(
        (s) => s.status === 'active' || s.id === formState.sectorId
    );

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-preonboarding-wizard-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C]/10 border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C] shrink-0">
                            <Building2 size={19} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span
                                    className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-semibold text-[#037F8C]"
                                    dir="ltr"
                                >
                                    {mode === 'edit' && initialData
                                        ? initialData.code
                                        : t('crm.customer.companies.badge')}
                                </span>
                                <span className="text-[11px] font-semibold text-[#6E6862]">
                                    {t('crm.customer.common.stepOf', {
                                        step: currentStep,
                                        total: 3,
                                    })}
                                </span>
                            </div>
                            <h2
                                id="company-preonboarding-wizard-title"
                                className="text-base font-bold text-[#0D0D0D] truncate mt-0.5"
                            >
                                {mode === 'create'
                                    ? t('crm.customer.companies.wizard.createTitle')
                                    : t('crm.customer.companies.wizard.editTitle', {
                                          code: initialData?.code || '',
                                      })}
                            </h2>
                            <p className="text-xs text-[#6E6862] truncate">
                                {mode === 'create'
                                    ? t('crm.customer.companies.wizard.createSubtitle')
                                    : t('crm.customer.companies.wizard.editSubtitle')}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* 3-Step Indicator Bar */}
                <div className="px-6 py-3.5 border-b border-[#E5E0D8] bg-white grid grid-cols-3 gap-3">
                    {[
                        {
                            step: 1 as const,
                            title: t('crm.customer.companies.wizard.step1Title'),
                            desc: t('crm.customer.companies.wizard.step1Desc'),
                            icon: Building2,
                        },
                        {
                            step: 2 as const,
                            title: t('crm.customer.companies.wizard.step2Title'),
                            desc: t('crm.customer.companies.wizard.step2Desc'),
                            icon: FileText,
                        },
                        {
                            step: 3 as const,
                            title: t('crm.customer.companies.wizard.step3Title'),
                            desc: t('crm.customer.companies.wizard.step3Desc'),
                            icon: Users,
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = currentStep === item.step;
                        const isDone = currentStep > item.step;
                        return (
                            <button
                                key={item.step}
                                type="button"
                                onClick={() => {
                                    if (item.step === 1) setCurrentStep(1);
                                    if (item.step === 2 && validateStep1()) setCurrentStep(2);
                                    if (
                                        item.step === 3 &&
                                        validateStep1() &&
                                        validateStep2()
                                    )
                                        setCurrentStep(3);
                                }}
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-start transition-colors cursor-pointer ${
                                    isActive
                                        ? 'border-[#037F8C] bg-[#037F8C]/5'
                                        : isDone
                                          ? 'border-[#2E6B4E]/30 bg-[#E9F5EE]/50'
                                          : 'border-[#E5E0D8] bg-[#FAF8F5]'
                                }`}
                            >
                                <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isActive
                                            ? 'bg-[#037F8C] text-white'
                                            : isDone
                                              ? 'bg-[#2E6B4E] text-white'
                                              : 'bg-white border border-[#E5E0D8] text-[#6E6862]'
                                    }`}
                                >
                                    <Icon size={14} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#0D0D0D] truncate">
                                        {item.title}
                                    </div>
                                    <div className="text-[10px] text-[#6E6862] truncate">
                                        {item.desc}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Wizard Form Body */}
                <form
                    onSubmit={handleFinalSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                    noValidate
                >
                    {(stepError || serverError) && (
                        <div className="rounded-xl border border-[#F5C6C6] bg-[#FCECE9] p-3.5 flex items-start gap-2.5 text-xs text-[#A63A3A]">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{stepError || serverError}</span>
                        </div>
                    )}

                    {/* STEP 1: BASIC INFO */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.nameEnLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.nameEn}
                                    onChange={(e) =>
                                        handleFieldChange('nameEn', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.nameEnPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.nameArLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.nameAr}
                                    onChange={(e) =>
                                        handleFieldChange('nameAr', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.nameArPlaceholder'
                                    )}
                                    dir="rtl"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.businessNameLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.businessName || ''}
                                    onChange={(e) =>
                                        handleFieldChange('businessName', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.businessNamePlaceholder'
                                    )}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.phoneLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.phone}
                                    onChange={(e) =>
                                        handleFieldChange('phone', e.target.value)
                                    }
                                    placeholder="+966 11 XXX XXXX"
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.emailLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formState.email}
                                    onChange={(e) =>
                                        handleFieldChange('email', e.target.value)
                                    }
                                    placeholder="info@company.sa"
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.orgTypeLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <select
                                    value={formState.organizationalTypeId}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'organizationalTypeId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                >
                                    {activeOrgTypes.map((ot) => (
                                        <option key={ot.id} value={ot.id}>
                                            {isRtl ? ot.nameAr : ot.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.ownershipTypeLabel')}
                                </label>
                                <select
                                    value={formState.ownershipTypeId || ''}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'ownershipTypeId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                >
                                    {activeOwnTypes.map((ow) => (
                                        <option key={ow.id} value={ow.id}>
                                            {isRtl ? ow.nameAr : ow.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.sectorLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <select
                                    value={formState.sectorId}
                                    onChange={(e) =>
                                        handleFieldChange('sectorId', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
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
                                    {t('crm.customer.companies.wizard.assignedRepLabel')}
                                </label>
                                <select
                                    value={formState.assignedEmployeeId || ''}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'assignedEmployeeId',
                                            e.target.value
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                >
                                    <option value="">
                                        {t('crm.customer.common.unassigned')}
                                    </option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {isRtl ? emp.nameAr : emp.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.customer.companies.wizard.onboardingStatusLabel'
                                    )}
                                </label>
                                <select
                                    value={formState.onboardingStatus}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'onboardingStatus',
                                            e.target.value as CrmCompanyInput['onboardingStatus']
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                >
                                    <option value="draft">
                                        {t(
                                            'crm.customer.companies.onboardingStatuses.draft'
                                        )}
                                    </option>
                                    <option value="pre_onboarding">
                                        {t(
                                            'crm.customer.companies.onboardingStatuses.pre_onboarding'
                                        )}
                                    </option>
                                    <option value="under_review">
                                        {t(
                                            'crm.customer.companies.onboardingStatuses.under_review'
                                        )}
                                    </option>
                                    <option value="active">
                                        {t(
                                            'crm.customer.companies.onboardingStatuses.active'
                                        )}
                                    </option>
                                    <option value="inactive">
                                        {t(
                                            'crm.customer.companies.onboardingStatuses.inactive'
                                        )}
                                    </option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: BUSINESS INFO */}
                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.crNumberLabel')}{' '}
                                    <span className="text-[#A63A3A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formState.crNumber || ''}
                                    onChange={(e) =>
                                        handleFieldChange('crNumber', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.crNumberPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t(
                                        'crm.customer.companies.wizard.unifiedNumberLabel'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formState.unifiedNumber || ''}
                                    onChange={(e) =>
                                        handleFieldChange('unifiedNumber', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.unifiedNumberPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.taxNumberLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.taxNumber || ''}
                                    onChange={(e) =>
                                        handleFieldChange('taxNumber', e.target.value)
                                    }
                                    placeholder={t(
                                        'crm.customer.companies.wizard.taxNumberPlaceholder'
                                    )}
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.websiteLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.website || ''}
                                    onChange={(e) =>
                                        handleFieldChange('website', e.target.value)
                                    }
                                    placeholder="https://company.sa"
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.countryLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.country}
                                    onChange={(e) =>
                                        handleFieldChange('country', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.stateLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.state || ''}
                                    onChange={(e) =>
                                        handleFieldChange('state', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.cityLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.city || ''}
                                    onChange={(e) =>
                                        handleFieldChange('city', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.pinCodeLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.pinCode || ''}
                                    onChange={(e) =>
                                        handleFieldChange('pinCode', e.target.value)
                                    }
                                    dir="ltr"
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.addressLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.address || ''}
                                    onChange={(e) =>
                                        handleFieldChange('address', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('crm.customer.companies.wizard.notesLabel')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={formState.notes || ''}
                                    onChange={(e) =>
                                        handleFieldChange('notes', e.target.value)
                                    }
                                    className="w-full px-3.5 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: OWNERS */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-[#0D0D0D]">
                                        {t('crm.customer.companies.wizard.ownersHeader')}
                                    </h3>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {t('crm.customer.companies.wizard.ownersSub')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                                            totalSharePercentage > 100
                                                ? 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/30'
                                                : 'bg-[#E9F5EE] text-[#2E6B4E] border-[#2E6B4E]/30'
                                        }`}
                                    >
                                        {t(
                                            'crm.customer.companies.wizard.totalOwnershipShare',
                                            { total: totalSharePercentage }
                                        )}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={handleAddOwnerRow}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <Plus size={13} />
                                        {t('crm.customer.companies.wizard.addOwnerRow')}
                                    </button>
                                </div>
                            </div>

                            {/* Link Existing Owner from Directory */}
                            {existingOwners.length > 0 && (
                                <div className="rounded-xl border border-[#E5E0D8] bg-white p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                    <select
                                        value={selectedDirectoryOwnerId}
                                        onChange={(e) =>
                                            setSelectedDirectoryOwnerId(e.target.value)
                                        }
                                        className="flex-1 px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-[#FAF8F5] text-[#0D0D0D]"
                                    >
                                        <option value="">
                                            {t(
                                                'crm.customer.companies.wizard.selectExistingOwner'
                                            )}
                                        </option>
                                        {existingOwners.map((o) => (
                                            <option key={o.id} value={o.id}>
                                                {o.code} —{' '}
                                                {isRtl
                                                    ? o.fullNameAr || o.fullNameEn
                                                    : o.fullNameEn}{' '}
                                                ({o.phone})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleLinkDirectoryOwner}
                                        disabled={!selectedDirectoryOwnerId}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#037F8C] cursor-pointer disabled:opacity-50"
                                    >
                                        <UserPlus size={13} />
                                        {t(
                                            'crm.customer.companies.wizard.linkExistingOwner'
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Owners List */}
                            <div className="space-y-3">
                                {formState.owners.map((owner, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-xl border p-4 space-y-3 ${
                                            owner.isMainOwner
                                                ? 'border-[#037F8C] bg-[#FAF8F5]'
                                                : 'border-[#E5E0D8] bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetMainOwner(idx)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                                        owner.isMainOwner
                                                            ? 'bg-[#037F8C] text-white border-[#037F8C]'
                                                            : 'bg-white text-[#6E6862] border-[#E5E0D8] hover:text-[#0D0D0D]'
                                                    }`}
                                                >
                                                    <Crown size={12} />
                                                    {owner.isMainOwner
                                                        ? t(
                                                              'crm.customer.companies.wizard.mainOwnerBadge'
                                                          )
                                                        : t(
                                                              'crm.customer.companies.wizard.setAsMainOwner'
                                                          )}
                                                </button>
                                                {owner.ownerId && (
                                                    <span
                                                        className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[10px] font-mono text-[#6E6862]"
                                                        dir="ltr"
                                                    >
                                                        Linked ID: {owner.ownerId}
                                                    </span>
                                                )}
                                            </div>

                                            {formState.owners.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveOwnerRow(idx)
                                                    }
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#F5C6C6] bg-[#FCECE9] text-[#A63A3A] text-xs font-semibold cursor-pointer"
                                                >
                                                    <Trash2 size={12} />
                                                    {t(
                                                        'crm.customer.companies.wizard.removeOwner'
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.firstNameLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.firstName || ''}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'firstName',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.lastNameLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.lastName || ''}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'lastName',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.fullNameEnLabel'
                                                    )}{' '}
                                                    *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.fullNameEn}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'fullNameEn',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.fullNameArLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.fullNameAr || ''}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'fullNameAr',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="rtl"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.genderLabel'
                                                    )}
                                                </label>
                                                <select
                                                    value={owner.gender || 'male'}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'gender',
                                                            e.target.value as 'male' | 'female'
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                >
                                                    <option value="male">
                                                        {t('crm.customer.common.male')}
                                                    </option>
                                                    <option value="female">
                                                        {t('crm.customer.common.female')}
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.nationalityLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.nationality || ''}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'nationality',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.ownershipTypeLabel'
                                                    )}{' '}
                                                    *
                                                </label>
                                                <select
                                                    value={owner.ownershipTypeId}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'ownershipTypeId',
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs bg-white text-[#0D0D0D]"
                                                >
                                                    {ownershipTypes.map((ot) => (
                                                        <option key={ot.id} value={ot.id}>
                                                            {isRtl
                                                                ? ot.nameAr
                                                                : ot.nameEn}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.nationalIdLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        owner.nationalIdOrIqama || ''
                                                    }
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'nationalIdOrIqama',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.ownershipPercentLabel'
                                                    )}{' '}
                                                    *
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0.01}
                                                    max={100}
                                                    step={0.5}
                                                    value={owner.ownershipPercentage}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'ownershipPercentage',
                                                            Number(e.target.value || 0)
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.phoneLabel'
                                                    )}{' '}
                                                    *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={owner.phone}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'phone',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-semibold text-[#6E6862] mb-1">
                                                    {t(
                                                        'crm.customer.companies.wizard.emailLabel'
                                                    )}
                                                </label>
                                                <input
                                                    type="email"
                                                    value={owner.email || ''}
                                                    onChange={(e) =>
                                                        handleOwnerChange(
                                                            idx,
                                                            'email',
                                                            e.target.value
                                                        )
                                                    }
                                                    dir="ltr"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#E5E0D8] text-xs font-mono bg-white text-[#0D0D0D]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-between gap-3">
                        <div>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentStep(
                                            (prev) => (prev - 1) as 1 | 2 | 3
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                                >
                                    {isRtl ? (
                                        <ArrowRight size={14} />
                                    ) : (
                                        <ArrowLeft size={14} />
                                    )}
                                    {t('crm.customer.common.back')}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                            >
                                {t('crm.customer.common.cancel')}
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer"
                                >
                                    <span>{t('crm.customer.common.nextStep')}</span>
                                    {isRtl ? (
                                        <ArrowLeft size={14} />
                                    ) : (
                                        <ArrowRight size={14} />
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                    <CheckCircle2 size={14} />
                                    {isSubmitting
                                        ? t('crm.customer.common.submitting')
                                        : mode === 'create'
                                          ? t(
                                                'crm.customer.companies.wizard.submitPreOnboarding'
                                            )
                                          : t('crm.customer.common.saveChanges')}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CompanyPreOnboardingModal;
