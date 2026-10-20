import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    User,
    Briefcase,
    FileText,
    HeartHandshake,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    AlertTriangle,
    Upload,
    Trash2,
    Plus,
    Save,
    Sparkles,
    Landmark,
    ShieldCheck,
    Paperclip,
    FileCheck2,
    X,
} from 'lucide-react';
import {
    NATIONALITY_OPTIONS,
    gregorianToApproximateHijri,
    type EmployeeRecord,
    type EmployeeStatus,
    type ContractType,
    type EmploymentType,
    type Gender,
    type MaritalStatus,
    type Citizenship,
    type EmployeeDependent,
    type EmployeeDocumentCategory,
    type EmployeeDocumentAttachment,
    type DepartmentRecord,
    type DesignationRecord,
    type BranchRecord,
    type RoleRecord,
    type SecurityGroupRecord,
    type CustomAddonRecord,
    type SalaryDetails,
    type IqamaStatus,
    type EmployeeProfileCompletionResult,
} from '../../pages/ums/umsMockData';

export type WizardStepIndex = 0 | 1 | 2 | 3;

export type DocumentSubTab =
    | 'all'
    | 'salary'
    | 'iqama'
    | 'account'
    | 'bank'
    | 'health_insurance'
    | 'health_card'
    | 'passport'
    | 'visa'
    | 'contract'
    | 'driving_license'
    | 'subscription';

export interface EmployeeWizardFormState {
    code: string;
    status: EmployeeStatus;

    // Step 1: Personal Info
    firstNameEn: string;
    secondNameEn: string;
    thirdNameEn: string;
    lastNameEn: string;
    firstNameAr: string;
    secondNameAr: string;
    thirdNameAr: string;
    lastNameAr: string;
    email: string;
    workEmail: string;
    phone: string;
    dobGregorian: string;
    dobHijri: string;
    religionId: string;
    religion: string;
    maritalStatus: MaritalStatus;
    gender: Gender;
    citizenship: Citizenship;
    nationality: string;
    avatarUrl: string;
    avatarMeta?: EmployeeDocumentAttachment;

    // Step 2: Employment Info
    branchId: string;
    departmentId: string;
    designationId: string;
    jobTitleId: string;
    jobTitleName: string;
    roleId: string;
    jobGradeId: string;
    managerId: string;
    joiningDate: string;
    contractType: ContractType;
    employmentType: EmploymentType;
    isUnderProbation: boolean;
    probationPeriodDays: number;

    // Step 3: Documents (Salary Details, Iqama, Account, Health Insurance, Health Card, Passport, Visa, Contract, Driving License, Subscription)
    basicSalary: number;
    housingAllowance: number;
    transportationAllowance: number;
    foodAllowance: number;
    otherAllowances: number;

    iqamaNumber: string;
    iqamaProfession: string;
    iqamaExpiryDate: string;
    workPermitNumber: string;
    workPermitExpiryDate: string;

    bankId: string;
    bankName: string;
    accountHolderName: string;
    iban: string;
    accountNumber: string;

    healthInsuranceProvider: string;
    healthInsurancePolicy: string;
    healthInsuranceClass: string;
    healthInsuranceExpiry: string;

    healthCardNumber: string;
    healthCardAuthority: string;
    healthCardIssueDate: string;
    healthCardExpiryDate: string;

    passportNumber: string;
    passportIssueCountry: string;
    passportIssueDate: string;
    passportExpiry: string;

    visaNumber: string;
    visaType: string;
    visaBorderNumber: string;
    visaIssueDate: string;
    visaExpiry: string;

    contractNumber: string;
    contractStartDate: string;
    contractEndDate: string;

    drivingLicenseNumber: string;
    drivingLicenseType: string;
    drivingLicenseIssueDate: string;
    drivingLicenseExpiry: string;

    gosiSubscriptionNumber: string;
    professionalSubscriptionNumber: string;
    subscriptionIssueDate: string;
    subscriptionExpiryDate: string;

    documentAttachments: Partial<Record<EmployeeDocumentCategory, EmployeeDocumentAttachment>>;

    // Step 4: Dependents Info & Options
    dependents: EmployeeDependent[];
    sendInviteOnSave: boolean;
}

export const CONTRACT_TYPES: ContractType[] = [
    'Permanent',
    'Fixed Term',
    'Probation',
    'Seasonal',
    'Remote',
];

export const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-time', 'Part-time', 'Contractor'];
export const MARITAL_STATUSES: MaritalStatus[] = ['Single', 'Married', 'Divorced', 'Widowed'];
export const GENDERS: Gender[] = ['Male', 'Female'];
export const CITIZENSHIPS: Citizenship[] = ['Saudi', 'Non-Saudi'];
export const DEPENDENT_RELATIONSHIPS: EmployeeDependent['relationship'][] = [
    'Spouse',
    'Child',
    'Parent',
    'Other',
];

export const DOCUMENT_SUB_TABS: DocumentSubTab[] = [
    'all',
    'salary',
    'iqama',
    'account',
    'health_insurance',
    'health_card',
    'passport',
    'visa',
    'contract',
    'driving_license',
    'subscription',
];

function formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getInitials(nameEn: string, nameAr?: string): string {
    const source = (nameEn || nameAr || '').trim();
    if (!source) return 'EM';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

export interface EmployeeFormProps {
    isEditMode: boolean;
    form: EmployeeWizardFormState;
    errors: Record<string, string>;
    currentStep: WizardStepIndex;
    highestVisitedStep: WizardStepIndex;
    activeDocSubTab: DocumentSubTab;
    uploadFeedback: { type: 'success' | 'error'; message: string } | null;
    composedNameEn: string;
    composedNameAr: string;
    calculatedSalary: SalaryDetails;
    calculatedIqamaStatus: IqamaStatus;
    liveCompletionPercentage: number;
    liveCompletion?: EmployeeProfileCompletionResult;
    departments: DepartmentRecord[];
    designations: DesignationRecord[];
    branches: BranchRecord[];
    roles: RoleRecord[];
    linkedSecurityGroup?: SecurityGroupRecord;
    eligibleManagers: EmployeeRecord[];
    religionAddons: CustomAddonRecord[];
    jobTitleAddons: CustomAddonRecord[];
    jobGradeAddons: CustomAddonRecord[];
    bankAddons: CustomAddonRecord[];
    isSubmitting?: boolean;
    onUpdateField: <K extends keyof EmployeeWizardFormState>(
        key: K,
        value: EmployeeWizardFormState[K]
    ) => void;
    onStepClick: (targetStep: WizardStepIndex) => void;
    onNextStep: () => void;
    onPrevStep: () => void;
    onActiveDocSubTabChange: (tab: DocumentSubTab) => void;
    onClearUploadFeedback: () => void;
    onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDocumentUpload: (
        category: EmployeeDocumentCategory,
        e: React.ChangeEvent<HTMLInputElement>
    ) => void;
    onRemoveDocument: (category: EmployeeDocumentCategory) => void;
    onFormatIban: () => void;
    onAddDependent: () => void;
    onUpdateDependent: <K extends keyof EmployeeDependent>(
        index: number,
        key: K,
        value: EmployeeDependent[K]
    ) => void;
    onDependentDocUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveDependentDoc: (index: number) => void;
    onRemoveDependent: (index: number) => void;
    onSave: (saveAsDraft: boolean) => void;
    onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
    isEditMode,
    form,
    errors,
    currentStep,
    highestVisitedStep,
    activeDocSubTab,
    uploadFeedback,
    composedNameEn,
    composedNameAr,
    calculatedSalary,
    calculatedIqamaStatus,
    liveCompletionPercentage,
    liveCompletion,
    departments,
    designations,
    branches,
    roles,
    linkedSecurityGroup,
    eligibleManagers,
    religionAddons,
    jobTitleAddons,
    jobGradeAddons,
    bankAddons,
    isSubmitting = false,
    onUpdateField,
    onStepClick,
    onNextStep,
    onPrevStep,
    onActiveDocSubTabChange,
    onClearUploadFeedback,
    onAvatarUpload,
    onDocumentUpload,
    onRemoveDocument,
    onFormatIban,
    onAddDependent,
    onUpdateDependent,
    onDependentDocUpload,
    onRemoveDependentDoc,
    onRemoveDependent,
    onSave,
    onCancel,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');

    const stepsMeta: Array<{
        index: WizardStepIndex;
        key: 'personal' | 'employment' | 'documents' | 'dependents';
        title: string;
        desc: string;
        icon: React.ElementType;
        complete: boolean;
    }> = [
        {
            index: 0,
            key: 'personal',
            title: isRtl ? t('ums.employees.wizard.steps.personal.title') : 'Personal Info',
            desc: t('ums.employees.wizard.steps.personal.subtitle'),
            icon: User,
            complete: Boolean(liveCompletion?.personalComplete),
        },
        {
            index: 1,
            key: 'employment',
            title: isRtl ? t('ums.employees.wizard.steps.employment.title') : 'Employment Info',
            desc: t('ums.employees.wizard.steps.employment.subtitle'),
            icon: Briefcase,
            complete: Boolean(liveCompletion?.employmentComplete),
        },
        {
            index: 2,
            key: 'documents',
            title: isRtl ? t('ums.employees.wizard.steps.documents.title') : 'Documents',
            desc: t('ums.employees.wizard.steps.documents.subtitle'),
            icon: FileText,
            complete: Boolean(
                liveCompletion?.salaryComplete && liveCompletion?.documentsComplete
            ),
        },
        {
            index: 3,
            key: 'dependents',
            title: isRtl ? t('ums.employees.wizard.steps.dependents.title') : 'Dependents Info',
            desc: t('ums.employees.wizard.steps.dependents.subtitle'),
            icon: HeartHandshake,
            complete: form.dependents.length > 0,
        },
    ];

    const shouldShowDocSection = (section: Exclude<DocumentSubTab, 'all'>): boolean => {
        if (activeDocSubTab === 'all') return true;
        if (
            (section === 'account' || section === 'bank') &&
            (activeDocSubTab === 'account' || activeDocSubTab === 'bank')
        ) {
            return true;
        }
        return activeDocSubTab === section;
    };

    const renderDocumentAttachmentControl = (category: EmployeeDocumentCategory) => {
        const currentAttachment = form.documentAttachments[category];
        const inputId = `doc-upload-${category}`;

        return (
            <div className="pt-3 mt-3 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#6E6862]">
                    <Paperclip size={13} className="text-[#857E74] shrink-0" />
                    {currentAttachment ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EAF3EC] text-[#037F8C] font-medium border border-[#037F8C]/20">
                                <FileCheck2 size={12} />
                                <span>{currentAttachment.fileName}</span>
                            </span>
                            <span className="text-[11px] font-mono text-[#857E74]" dir="ltr">
                                ({formatFileSize(currentAttachment.fileSize)} ·{' '}
                                {currentAttachment.uploadedAt})
                            </span>
                        </div>
                    ) : (
                        <span>
                            {t('ums.employees.wizard.documents.attachmentLabel')}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <label
                        htmlFor={inputId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                    >
                        <Upload size={13} />
                        <span>
                            {currentAttachment
                                ? t('ums.employees.wizard.documents.replaceDocument')
                                : t('ums.employees.wizard.documents.uploadDocument')}
                        </span>
                    </label>
                    <input
                        id={inputId}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={(e) => onDocumentUpload(category, e)}
                        className="hidden"
                    />
                    {currentAttachment && (
                        <button
                            type="button"
                            onClick={() => onRemoveDocument(category)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                            <Trash2 size={13} />
                            <span>{t('ums.employees.wizard.documents.removeDocument')}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const getDocTabLabel = (tab: DocumentSubTab): string => {
        if (!isRtl) {
            return tab === 'all'
                ? 'All Sections'
                : tab === 'salary'
                ? 'Salary Details'
                : tab === 'iqama'
                ? 'Iqama'
                : tab === 'account' || tab === 'bank'
                ? 'Account'
                : tab === 'health_insurance'
                ? 'Health Insurance'
                : tab === 'health_card'
                ? 'Health Card'
                : tab === 'passport'
                ? 'Passport'
                : tab === 'visa'
                ? 'Visa'
                : tab === 'contract'
                ? 'Contract'
                : tab === 'driving_license'
                ? 'Driving License'
                : 'Subscription';
        }
        const i18nTabKey = tab === 'account' ? 'bank' : tab;
        return t(`ums.employees.wizard.documents.subTabs.${i18nTabKey}`);
    };

    return (
        <div className="space-y-6 text-start">
            {/* Upload or Validation Feedback Banner */}
            {uploadFeedback && (
                <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                        uploadFeedback.type === 'error'
                            ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                            : 'bg-[#EAF3EC] border-[#037F8C]/20 text-[#037F8C]'
                    }`}
                >
                    <div className="flex items-center gap-2 text-xs font-medium">
                        {uploadFeedback.type === 'error' ? (
                            <AlertTriangle size={15} />
                        ) : (
                            <CheckCircle2 size={15} />
                        )}
                        <span>{uploadFeedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClearUploadFeedback}
                        className="p-1 rounded hover:bg-black/5 cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-xs text-[#DC2626]">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold">
                            {t('ums.employees.wizard.validation.fixErrorsBanner')}
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {Object.values(errors).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 4-Step Stepper Navigation Bar */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stepsMeta.map((s) => {
                        const StepIcon = s.icon;
                        const isActive = currentStep === s.index;
                        const isCompleted = currentStep > s.index;
                        const isAccessible = isEditMode || s.index <= highestVisitedStep + 1;

                        return (
                            <button
                                key={s.index}
                                type="button"
                                disabled={!isAccessible}
                                onClick={() => onStepClick(s.index)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-start transition-all ${
                                    isActive
                                        ? 'bg-[#037F8C] text-white border-[#037F8C] shadow-xs'
                                        : isCompleted
                                        ? 'bg-[#EAF3EC]/60 text-[#0D0D0D] border-[#037F8C]/30 hover:bg-[#EAF3EC]'
                                        : 'bg-[#FAF8F5] text-[#6E6862] border-[#E5E0D8] hover:text-[#0D0D0D]'
                                } ${isAccessible ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                                        isActive
                                            ? 'bg-white/15 text-white'
                                            : isCompleted
                                            ? 'bg-[#037F8C] text-white'
                                            : 'bg-white border border-[#E5E0D8] text-[#857E74]'
                                    }`}
                                >
                                    {isCompleted ? <Check size={14} /> : <StepIcon size={15} />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`text-[10px] font-mono uppercase tracking-wider ${
                                                isActive ? 'text-white/75' : 'text-[#857E74]'
                                            }`}
                                        >
                                            0{s.index + 1}
                                        </span>
                                    </div>
                                    <p
                                        className={`text-xs font-bold truncate ${
                                            isActive ? 'text-white' : 'text-[#0D0D0D]'
                                        }`}
                                    >
                                        {s.title}
                                    </p>
                                    <p
                                        className={`text-[11px] truncate mt-0.5 ${
                                            isActive ? 'text-white/80' : 'text-[#6E6862]'
                                        }`}
                                    >
                                        {s.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* =================================================================== */}
            {/* 1. PERSONAL INFO                                                    */}
            {/* =================================================================== */}
            {currentStep === 0 && (
                <div className="space-y-6">
                    {/* Profile Picture Upload Card */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {form.avatarUrl ? (
                                    <img
                                        src={form.avatarUrl}
                                        alt={composedNameEn || form.code}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-[#E5E0D8] shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-[#037F8C] text-white flex items-center justify-center font-bold text-lg shrink-0">
                                        {getInitials(composedNameEn, composedNameAr)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        {t('ums.employees.wizard.personal.photoSectionTitle')}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] mt-0.5">
                                        {t('ums.employees.wizard.personal.photoSectionDesc')}
                                    </p>
                                    {form.avatarMeta && (
                                        <p className="text-[11px] font-mono text-[#037F8C] mt-1">
                                            {form.avatarMeta.fileName} (
                                            {formatFileSize(form.avatarMeta.fileSize)})
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="employee-avatar-upload"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                                >
                                    <Upload size={14} />
                                    <span>
                                        {form.avatarUrl
                                            ? t('ums.employees.wizard.personal.changePhoto')
                                            : t('ums.employees.wizard.personal.uploadPhoto')}
                                    </span>
                                </label>
                                <input
                                    id="employee-avatar-upload"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                    onChange={onAvatarUpload}
                                    className="hidden"
                                />
                                {form.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onUpdateField('avatarUrl', '');
                                            onUpdateField('avatarMeta', undefined);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                        <span>
                                            {t('ums.employees.wizard.personal.removePhoto')}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bilingual 4-Part Name Card */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-6">
                        {/* English 4-part Name */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.personal.englishNamesTitle')}
                                </h3>
                                {composedNameEn && (
                                    <div className="text-xs text-[#6E6862]">
                                        <span>
                                            {t('ums.employees.wizard.personal.composedFullNameEn')}
                                        </span>{' '}
                                        <span className="font-bold text-[#037F8C]" dir="ltr">
                                            {composedNameEn}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.firstNameEn')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.firstNameEn}
                                        onChange={(e) =>
                                            onUpdateField('firstNameEn', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.firstNameEnPlaceholder',
                                            { defaultValue: 'Enter First Name (EN)' }
                                        )}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.firstNameEn
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.firstNameEn && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.firstNameEn}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.secondNameEn')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.secondNameEn}
                                        onChange={(e) =>
                                            onUpdateField('secondNameEn', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.secondNameEnPlaceholder',
                                            { defaultValue: 'Enter Second Name (EN)' }
                                        )}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.thirdNameEn')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.thirdNameEn}
                                        onChange={(e) =>
                                            onUpdateField('thirdNameEn', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.thirdNameEnPlaceholder',
                                            { defaultValue: 'Enter Third Name (EN)' }
                                        )}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.lastNameEn')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.lastNameEn}
                                        onChange={(e) =>
                                            onUpdateField('lastNameEn', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.lastNameEnPlaceholder',
                                            { defaultValue: 'Enter Last Name (EN)' }
                                        )}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.lastNameEn
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.lastNameEn && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.lastNameEn}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Arabic 4-part Name */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.personal.arabicNamesTitle')}
                                </h3>
                                {composedNameAr && (
                                    <div className="text-xs text-[#6E6862]">
                                        <span>
                                            {t('ums.employees.wizard.personal.composedFullNameAr')}
                                        </span>{' '}
                                        <span className="font-bold text-[#037F8C]" dir="rtl">
                                            {composedNameAr}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.firstNameAr')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={form.firstNameAr}
                                        onChange={(e) =>
                                            onUpdateField('firstNameAr', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.firstNameArPlaceholder',
                                            { defaultValue: 'أدخل الاسم الأول بالعربية' }
                                        )}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.firstNameAr
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.firstNameAr && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.firstNameAr}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.secondNameAr')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={form.secondNameAr}
                                        onChange={(e) =>
                                            onUpdateField('secondNameAr', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.secondNameArPlaceholder',
                                            { defaultValue: 'أدخل الاسم الثاني بالعربية' }
                                        )}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.thirdNameAr')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={form.thirdNameAr}
                                        onChange={(e) =>
                                            onUpdateField('thirdNameAr', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.thirdNameArPlaceholder',
                                            { defaultValue: 'أدخل الاسم الثالث بالعربية' }
                                        )}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.personal.lastNameAr')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        value={form.lastNameAr}
                                        onChange={(e) =>
                                            onUpdateField('lastNameAr', e.target.value)
                                        }
                                        placeholder={t(
                                            'ums.employees.wizard.lastNameArPlaceholder',
                                            { defaultValue: 'أدخل اسم العائلة بالعربية' }
                                        )}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.lastNameAr
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.lastNameAr && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.lastNameAr}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Coordinates & Demographic Attributes */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                        <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                            {t('ums.employees.wizard.personal.contactDemographicsTitle')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Personal Email */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.personalEmail')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="email"
                                    dir="ltr"
                                    value={form.email}
                                    onChange={(e) => onUpdateField('email', e.target.value)}
                                    placeholder={t(
                                        'ums.employees.wizard.personalEmailPlaceholder',
                                        { defaultValue: 'Enter Personal Email' }
                                    )}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.email
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                />
                                {errors.email && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Work Email */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.workEmail')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="email"
                                    dir="ltr"
                                    value={form.workEmail}
                                    onChange={(e) => onUpdateField('workEmail', e.target.value)}
                                    placeholder={t('ums.employees.wizard.workEmailPlaceholder', {
                                        defaultValue: 'Enter Official Work Email',
                                    })}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.workEmail
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                />
                                {errors.workEmail && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.workEmail}
                                    </p>
                                )}
                            </div>

                            {/* Saudi Mobile Number */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.phone')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="tel"
                                    dir="ltr"
                                    value={form.phone}
                                    onChange={(e) => onUpdateField('phone', e.target.value)}
                                    placeholder={t('ums.employees.wizard.phonePlaceholder', {
                                        defaultValue: 'Enter Phone Number (+966 5X XXX XXXX)',
                                    })}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.phone
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                />
                                <p className="text-[10px] text-[#857E74] mt-1">
                                    {t('ums.employees.wizard.personal.phoneHint')}
                                </p>
                                {errors.phone && (
                                    <p className="text-[11px] text-[#DC2626] mt-0.5">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Date of Birth (Gregorian) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.dobGregorian')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="date"
                                    dir="ltr"
                                    value={form.dobGregorian}
                                    onChange={(e) => {
                                        const greg = e.target.value;
                                        onUpdateField('dobGregorian', greg);
                                        const approxHijri = gregorianToApproximateHijri(greg);
                                        if (approxHijri) {
                                            onUpdateField('dobHijri', approxHijri);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.dobGregorian
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                />
                                {errors.dobGregorian && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.dobGregorian}
                                    </p>
                                )}
                            </div>

                            {/* Date of Birth (Hijri) */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-[#0D0D0D]">
                                        {t('ums.employees.wizard.personal.dobHijri')}
                                    </label>
                                    {form.dobGregorian && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateField(
                                                    'dobHijri',
                                                    gregorianToApproximateHijri(form.dobGregorian)
                                                )
                                            }
                                            className="text-[10px] font-semibold text-[#037F8C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Sparkles size={10} />
                                            <span>
                                                {t('ums.employees.wizard.personal.syncHijri')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={form.dobHijri}
                                    onChange={(e) => onUpdateField('dobHijri', e.target.value)}
                                    placeholder={t('ums.employees.wizard.dobHijriPlaceholder', {
                                        defaultValue: '1412/08/15',
                                    })}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            {/* Religion (Custom Addons) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.religion')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.religionId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const addon = religionAddons.find(
                                            (r) => r.id === selectedId
                                        );
                                        onUpdateField('religionId', selectedId);
                                        onUpdateField('religion', addon?.nameEn || '');
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.religionId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.personal.selectReligion')}
                                    </option>
                                    {religionAddons
                                        .filter(
                                            (r) =>
                                                r.status === 'Active' || r.id === form.religionId
                                        )
                                        .map((rel) => (
                                            <option key={rel.id} value={rel.id}>
                                                {isRtl ? rel.nameAr : rel.nameEn}
                                                {rel.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.religionId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.religionId}
                                    </p>
                                )}
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.gender')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.gender}
                                    onChange={(e) =>
                                        onUpdateField('gender', e.target.value as Gender)
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {GENDERS.map((g) => (
                                        <option key={g} value={g}>
                                            {t(`ums.employees.genders.${g}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Marital Status */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.maritalStatus')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.maritalStatus}
                                    onChange={(e) =>
                                        onUpdateField(
                                            'maritalStatus',
                                            e.target.value as MaritalStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {MARITAL_STATUSES.map((ms) => (
                                        <option key={ms} value={ms}>
                                            {t(`ums.employees.maritalStatuses.${ms}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Citizenship */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.citizenship')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.citizenship}
                                    onChange={(e) => {
                                        const nextCit = e.target.value as Citizenship;
                                        onUpdateField('citizenship', nextCit);
                                        if (nextCit === 'Saudi') {
                                            onUpdateField('nationality', 'Saudi Arabia');
                                        } else if (form.nationality === 'Saudi Arabia') {
                                            onUpdateField('nationality', 'Egypt');
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {CITIZENSHIPS.map((cit) => (
                                        <option key={cit} value={cit}>
                                            {t(`ums.employees.citizenships.${cit}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Nationality */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.personal.nationality')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.nationality}
                                    onChange={(e) => {
                                        const nat = e.target.value;
                                        onUpdateField('nationality', nat);
                                        onUpdateField(
                                            'citizenship',
                                            nat === 'Saudi Arabia' ? 'Saudi' : 'Non-Saudi'
                                        );
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.nationality
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.personal.selectNationality')}
                                    </option>
                                    {NATIONALITY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {isRtl ? opt.labelAr : opt.labelEn}
                                        </option>
                                    ))}
                                </select>
                                {errors.nationality && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.nationality}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================== */}
            {/* 2. EMPLOYMENT INFO                                                  */}
            {/* =================================================================== */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    {/* Organizational Placement */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                        <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                            {t('ums.employees.wizard.employment.orgPlacementTitle')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Employee Code */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.employeeCode')}
                                </label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={form.code}
                                    readOnly
                                    className="w-full px-3 py-2 rounded-lg bg-[#EFECE6]/60 border border-[#E5E0D8] text-xs font-mono font-bold text-[#037F8C] cursor-not-allowed"
                                />
                            </div>

                            {/* Employment Status */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.employmentStatus')}
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        onUpdateField('status', e.target.value as EmployeeStatus)
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {(['Active', 'Inactive', 'Draft'] as EmployeeStatus[]).map(
                                        (st) => (
                                            <option key={st} value={st}>
                                                {t(`ums.employees.statuses.${st}`)}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Branch */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.branch')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.branchId}
                                    onChange={(e) => onUpdateField('branchId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.branchId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectBranch')}
                                    </option>
                                    {branches
                                        .filter(
                                            (b) => b.status === 'Active' || b.id === form.branchId
                                        )
                                        .map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {isRtl ? branch.nameAr : branch.nameEn} (
                                                {branch.code})
                                                {branch.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.branchId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.branchId}
                                    </p>
                                )}
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.department')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.departmentId}
                                    onChange={(e) =>
                                        onUpdateField('departmentId', e.target.value)
                                    }
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.departmentId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectDepartment')}
                                    </option>
                                    {departments
                                        .filter(
                                            (d) =>
                                                d.status === 'Active' || d.id === form.departmentId
                                        )
                                        .map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {isRtl ? dept.nameAr : dept.nameEn} ({dept.code})
                                                {dept.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.departmentId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.departmentId}
                                    </p>
                                )}
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.designation')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.designationId}
                                    onChange={(e) =>
                                        onUpdateField('designationId', e.target.value)
                                    }
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.designationId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectDesignation')}
                                    </option>
                                    {designations
                                        .filter(
                                            (d) =>
                                                d.status === 'Active' ||
                                                d.id === form.designationId
                                        )
                                        .map((desig) => (
                                            <option key={desig.id} value={desig.id}>
                                                {isRtl ? desig.titleAr : desig.titleEn} (
                                                {desig.code})
                                                {desig.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.designationId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.designationId}
                                    </p>
                                )}
                            </div>

                            {/* Job Title (Custom Addons) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.jobTitle')}
                                </label>
                                <select
                                    value={form.jobTitleId}
                                    onChange={(e) => {
                                        const jtId = e.target.value;
                                        const jt = jobTitleAddons.find((a) => a.id === jtId);
                                        onUpdateField('jobTitleId', jtId);
                                        onUpdateField('jobTitleName', jt?.nameEn || '');
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectJobTitle')}
                                    </option>
                                    {jobTitleAddons
                                        .filter(
                                            (jt) =>
                                                jt.status === 'Active' || jt.id === form.jobTitleId
                                        )
                                        .map((jt) => (
                                            <option key={jt.id} value={jt.id}>
                                                {isRtl ? jt.nameAr : jt.nameEn} ({jt.code})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* System Role */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.role')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.roleId}
                                    onChange={(e) => onUpdateField('roleId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.roleId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectRole')}
                                    </option>
                                    {roles
                                        .filter(
                                            (r) => r.status === 'Active' || r.id === form.roleId
                                        )
                                        .map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {isRtl ? role.nameAr : role.nameEn} ({role.code})
                                                {role.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.roleId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.roleId}
                                    </p>
                                )}
                            </div>

                            {/* Security Group (Derived from Role) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.securityGroupDerived', {
                                        defaultValue: 'Security Group (Derived from Role)',
                                    })}
                                </label>
                                <div className="w-full px-3 py-2 rounded-lg bg-[#EFECE6]/60 border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] flex items-center gap-1.5 min-h-[34px]">
                                    <ShieldCheck size={14} className="text-[#037F8C] shrink-0" />
                                    {linkedSecurityGroup ? (
                                        <span className="truncate">
                                            {isRtl
                                                ? linkedSecurityGroup.nameAr
                                                : linkedSecurityGroup.nameEn}{' '}
                                            <span
                                                className="font-mono text-[#037F8C]"
                                                dir="ltr"
                                            >
                                                ({linkedSecurityGroup.code})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-[#857E74]">
                                            {t('ums.employees.wizard.employment.selectRole')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Job Grade (Custom Addons) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.jobGrade')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.jobGradeId}
                                    onChange={(e) => onUpdateField('jobGradeId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.jobGradeId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.selectJobGrade')}
                                    </option>
                                    {jobGradeAddons
                                        .filter(
                                            (g) =>
                                                g.status === 'Active' || g.id === form.jobGradeId
                                        )
                                        .map((grade) => (
                                            <option key={grade.id} value={grade.id}>
                                                {isRtl ? grade.nameAr : grade.nameEn} ({grade.code}
                                                )
                                                {grade.status === 'Inactive'
                                                    ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                    : ''}
                                            </option>
                                        ))}
                                </select>
                                {errors.jobGradeId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.jobGradeId}
                                    </p>
                                )}
                            </div>

                            {/* Direct Manager */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.directManager')}
                                </label>
                                <select
                                    value={form.managerId}
                                    onChange={(e) => onUpdateField('managerId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.managerId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                >
                                    <option value="">
                                        {t('ums.employees.wizard.employment.noDirectManager')}
                                    </option>
                                    {eligibleManagers.map((mgr) => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {isRtl ? mgr.nameAr : mgr.nameEn} ({mgr.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.managerId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.managerId}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contract Terms & Probation Schedule */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                        <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                            {t('ums.employees.wizard.employment.contractProbationTitle')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Joining Date */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.joiningDate')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <input
                                    type="date"
                                    dir="ltr"
                                    value={form.joiningDate}
                                    onChange={(e) =>
                                        onUpdateField('joiningDate', e.target.value)
                                    }
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.joiningDate
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                    }`}
                                />
                                {errors.joiningDate && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.joiningDate}
                                    </p>
                                )}
                            </div>

                            {/* Contract Type */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.contractType')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.contractType}
                                    onChange={(e) => {
                                        const ct = e.target.value as ContractType;
                                        onUpdateField('contractType', ct);
                                        if (ct === 'Probation') {
                                            onUpdateField('isUnderProbation', true);
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {CONTRACT_TYPES.map((ct) => (
                                        <option key={ct} value={ct}>
                                            {t(`ums.employees.contractTypes.${ct}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Employment Type */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.employmentType')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.employmentType}
                                    onChange={(e) =>
                                        onUpdateField(
                                            'employmentType',
                                            e.target.value as EmploymentType
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    {EMPLOYMENT_TYPES.map((et) => (
                                        <option key={et} value={et}>
                                            {t(`ums.employees.employmentTypes.${et}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Probation Period Controls */}
                        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <label className="inline-flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isUnderProbation}
                                    onChange={(e) =>
                                        onUpdateField('isUnderProbation', e.target.checked)
                                    }
                                    className="rounded border-[#E5E0D8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                                />
                                <span className="text-xs font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.employment.isUnderProbation')}
                                </span>
                            </label>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-[#6E6862]">
                                    {t('ums.employees.wizard.employment.probationPeriodDays')}:
                                </span>
                                <input
                                    type="number"
                                    min={0}
                                    max={365}
                                    dir="ltr"
                                    value={form.probationPeriodDays}
                                    onChange={(e) =>
                                        onUpdateField(
                                            'probationPeriodDays',
                                            Math.max(0, Number(e.target.value) || 0)
                                        )
                                    }
                                    className="w-24 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#037F8C]"
                                />
                                <button
                                    type="button"
                                    onClick={() => onUpdateField('probationPeriodDays', 90)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                                        form.probationPeriodDays === 90
                                            ? 'bg-[#037F8C] text-white border-[#037F8C]'
                                            : 'bg-white text-[#6E6862] border-[#E5E0D8] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {t('ums.employees.wizard.employment.probationPreset90')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onUpdateField('probationPeriodDays', 180)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                                        form.probationPeriodDays === 180
                                            ? 'bg-[#037F8C] text-white border-[#037F8C]'
                                            : 'bg-white text-[#6E6862] border-[#E5E0D8] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {t('ums.employees.wizard.employment.probationPreset180')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================================== */}
            {/* 3. DOCUMENTS (10 SUB-SECTIONS IN EXACT ORDER)                       */}
            {/* =================================================================== */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    {/* Sub-Section Segmented Filter Bar */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-2 shadow-2xs overflow-x-auto">
                        <div className="flex items-center gap-1 min-w-max">
                            {DOCUMENT_SUB_TABS.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => onActiveDocSubTabChange(tab)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        activeDocSubTab === tab
                                            ? 'bg-[#037F8C] text-white shadow-2xs'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                    {getDocTabLabel(tab)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3.1 SALARY DETAILS */}
                    {shouldShowDocSection('salary') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <div className="flex items-center gap-2">
                                    <Landmark size={16} className="text-[#037F8C]" />
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        {isRtl
                                            ? t('ums.employees.wizard.documents.salaryTitle')
                                            : 'Salary Details'}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-[#6E6862]">
                                        {t('ums.employees.wizard.documents.calculatedGross')}:
                                    </span>
                                    <span
                                        className="font-mono font-bold text-sm text-[#037F8C]"
                                        dir="ltr"
                                    >
                                        {calculatedSalary.grossSalary.toLocaleString('en-US')} SAR
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.basicSalary')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        dir="ltr"
                                        value={form.basicSalary}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'basicSalary',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.basicSalary
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.basicSalary && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.basicSalary}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.housingAllowance')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100}
                                        dir="ltr"
                                        value={form.housingAllowance}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'housingAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.transportationAllowance'
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={50}
                                        dir="ltr"
                                        value={form.transportationAllowance}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'transportationAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.foodAllowance')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={50}
                                        dir="ltr"
                                        value={form.foodAllowance}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'foodAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.otherAllowances')}
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={50}
                                        dir="ltr"
                                        value={form.otherAllowances}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'otherAllowances',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.grossSalary', {
                                            defaultValue: 'Gross Monthly Salary (SAR)',
                                        })}
                                    </label>
                                    <input
                                        type="number"
                                        dir="ltr"
                                        readOnly
                                        value={calculatedSalary.grossSalary}
                                        className="w-full px-3 py-2 rounded-lg bg-[#EFECE6]/60 border border-[#E5E0D8] text-xs font-mono font-bold text-[#037F8C] cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3.2 IQAMA */}
                    {shouldShowDocSection('iqama') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {isRtl
                                        ? t('ums.employees.wizard.documents.iqamaTitle')
                                        : 'Iqama'}
                                </h3>
                                <div className="text-xs flex items-center gap-2">
                                    <span className="text-[#6E6862]">
                                        {t(
                                            'ums.employees.wizard.documents.iqamaCalculatedStatus'
                                        )}
                                        :
                                    </span>
                                    <span
                                        className={`font-bold ${
                                            calculatedIqamaStatus === 'Valid'
                                                ? 'text-[#037F8C]'
                                                : calculatedIqamaStatus === 'Warning'
                                                ? 'text-[#C28E3A]'
                                                : 'text-[#DC2626]'
                                        }`}
                                    >
                                        {t(
                                            `ums.employees.iqamaStatuses.${calculatedIqamaStatus}`
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.iqamaNumber')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.iqamaNumber}
                                        onChange={(e) =>
                                            onUpdateField('iqamaNumber', e.target.value)
                                        }
                                        placeholder="10XXXXXXXX / 24XXXXXXXX"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iqamaNumber
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.iqamaNumber && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.iqamaNumber}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.iqamaProfession')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.iqamaProfession}
                                        onChange={(e) =>
                                            onUpdateField('iqamaProfession', e.target.value)
                                        }
                                        placeholder="e.g. Software Engineer"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.iqamaExpiryDate')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.iqamaExpiryDate}
                                        onChange={(e) =>
                                            onUpdateField('iqamaExpiryDate', e.target.value)
                                        }
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iqamaExpiryDate
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.iqamaExpiryDate && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.iqamaExpiryDate}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.workPermitNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.workPermitNumber}
                                        onChange={(e) =>
                                            onUpdateField('workPermitNumber', e.target.value)
                                        }
                                        placeholder="WP-2026-XXXX"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.workPermitExpiryDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.workPermitExpiryDate}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'workPermitExpiryDate',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('iqama')}
                        </div>
                    )}

                    {/* 3.3 ACCOUNT */}
                    {shouldShowDocSection('account') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.bankTitle')
                                    : 'Account'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Bank (Custom Addons) */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.bank')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <select
                                        value={form.bankId}
                                        onChange={(e) => {
                                            const bId = e.target.value;
                                            const bank = bankAddons.find((b) => b.id === bId);
                                            onUpdateField('bankId', bId);
                                            onUpdateField('bankName', bank?.nameEn || '');
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                            errors.bankId
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    >
                                        <option value="">
                                            {t('ums.employees.wizard.documents.selectBank')}
                                        </option>
                                        {bankAddons
                                            .filter(
                                                (b) =>
                                                    b.status === 'Active' || b.id === form.bankId
                                            )
                                            .map((bank) => (
                                                <option key={bank.id} value={bank.id}>
                                                    {isRtl ? bank.nameAr : bank.nameEn}
                                                    {bank.status === 'Inactive'
                                                        ? ` ${t('ums.employees.filters.inactiveRecordSuffix')}`
                                                        : ''}
                                                </option>
                                            ))}
                                    </select>
                                    {errors.bankId && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.bankId}
                                        </p>
                                    )}
                                </div>

                                {/* Account Holder Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.accountHolderName')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.accountHolderName}
                                        onChange={(e) =>
                                            onUpdateField('accountHolderName', e.target.value)
                                        }
                                        placeholder={composedNameEn || 'Full Name on Bank Account'}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                {/* Saudi IBAN */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-[#0D0D0D]">
                                            {t('ums.employees.wizard.documents.iban')}{' '}
                                            <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={onFormatIban}
                                            className="text-[10px] font-semibold text-[#037F8C] hover:underline cursor-pointer"
                                        >
                                            {t('ums.employees.wizard.documents.formatIban')}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.iban}
                                        onChange={(e) =>
                                            onUpdateField('iban', e.target.value.toUpperCase())
                                        }
                                        placeholder="SA44 8000 0400 6080 1016 7519"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iban
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.iban && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.iban}
                                        </p>
                                    )}
                                </div>

                                {/* Bank Account Number */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.accountNumber')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.accountNumber}
                                        onChange={(e) =>
                                            onUpdateField('accountNumber', e.target.value)
                                        }
                                        placeholder="400608010167519"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.accountNumber
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    {errors.accountNumber && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.accountNumber}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('account')}
                        </div>
                    )}

                    {/* 3.4 HEALTH INSURANCE */}
                    {shouldShowDocSection('health_insurance') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.healthInsuranceTitle')
                                    : 'Health Insurance'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.healthInsuranceProvider'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.healthInsuranceProvider}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'healthInsuranceProvider',
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g. Bupa Arabia / Tawuniya"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.healthInsurancePolicy'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.healthInsurancePolicy}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'healthInsurancePolicy',
                                                e.target.value
                                            )
                                        }
                                        placeholder="POL-2026-8840"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthInsuranceClass')}
                                    </label>
                                    <select
                                        value={form.healthInsuranceClass}
                                        onChange={(e) =>
                                            onUpdateField('healthInsuranceClass', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                    >
                                        <option value="VIP">VIP</option>
                                        <option value="Class A+">Class A+</option>
                                        <option value="Class A">Class A</option>
                                        <option value="Class B">Class B</option>
                                        <option value="Class C">Class C</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.healthInsuranceExpiry'
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.healthInsuranceExpiry}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'healthInsuranceExpiry',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('health_insurance')}
                        </div>
                    )}

                    {/* 3.5 HEALTH CARD */}
                    {shouldShowDocSection('health_card') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.healthCardTitle')
                                    : 'Health Card'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthCardNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.healthCardNumber}
                                        onChange={(e) =>
                                            onUpdateField('healthCardNumber', e.target.value)
                                        }
                                        placeholder="HC-9920184"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthCardAuthority')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.healthCardAuthority}
                                        onChange={(e) =>
                                            onUpdateField('healthCardAuthority', e.target.value)
                                        }
                                        placeholder="Balady / MOH"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthCardIssueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.healthCardIssueDate}
                                        onChange={(e) =>
                                            onUpdateField('healthCardIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthCardExpiryDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.healthCardExpiryDate}
                                        onChange={(e) =>
                                            onUpdateField('healthCardExpiryDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('health_card')}
                        </div>
                    )}

                    {/* 3.6 PASSPORT */}
                    {shouldShowDocSection('passport') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.passportTitle')
                                    : 'Passport'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.passportNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.passportNumber}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'passportNumber',
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="V8839201"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.passportIssueCountry')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.passportIssueCountry}
                                        onChange={(e) =>
                                            onUpdateField('passportIssueCountry', e.target.value)
                                        }
                                        placeholder="Saudi Arabia"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.passportIssueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.passportIssueDate}
                                        onChange={(e) =>
                                            onUpdateField('passportIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.passportExpiry')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.passportExpiry}
                                        onChange={(e) =>
                                            onUpdateField('passportExpiry', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('passport')}
                        </div>
                    )}

                    {/* 3.7 VISA */}
                    {shouldShowDocSection('visa') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.visaTitle')
                                    : 'Visa'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.visaNumber}
                                        onChange={(e) =>
                                            onUpdateField('visaNumber', e.target.value)
                                        }
                                        placeholder="6092837411"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaType')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.visaType}
                                        onChange={(e) =>
                                            onUpdateField('visaType', e.target.value)
                                        }
                                        placeholder="Work / Exit Re-Entry"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaBorderNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.visaBorderNumber}
                                        onChange={(e) =>
                                            onUpdateField('visaBorderNumber', e.target.value)
                                        }
                                        placeholder="3099281726"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaIssueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.visaIssueDate}
                                        onChange={(e) =>
                                            onUpdateField('visaIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaExpiry')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.visaExpiry}
                                        onChange={(e) =>
                                            onUpdateField('visaExpiry', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('visa')}
                        </div>
                    )}

                    {/* 3.8 CONTRACT */}
                    {shouldShowDocSection('contract') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.contractTitle')
                                    : 'Contract'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.contractNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.contractNumber}
                                        onChange={(e) =>
                                            onUpdateField('contractNumber', e.target.value)
                                        }
                                        placeholder="CNT-2026-001"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.contractStartDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.contractStartDate}
                                        onChange={(e) =>
                                            onUpdateField('contractStartDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.contractEndDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.contractEndDate}
                                        onChange={(e) =>
                                            onUpdateField('contractEndDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('contract')}
                        </div>
                    )}

                    {/* 3.9 DRIVING LICENSE */}
                    {shouldShowDocSection('driving_license') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.drivingLicenseTitle')
                                    : 'Driving License'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.drivingLicenseNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.drivingLicenseNumber}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'drivingLicenseNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="DL-10293847"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.drivingLicenseType')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.drivingLicenseType}
                                        onChange={(e) =>
                                            onUpdateField('drivingLicenseType', e.target.value)
                                        }
                                        placeholder="Private / Public"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.drivingLicenseIssueDate'
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.drivingLicenseIssueDate}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'drivingLicenseIssueDate',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.drivingLicenseExpiry')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.drivingLicenseExpiry}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'drivingLicenseExpiry',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('driving_license')}
                        </div>
                    )}

                    {/* 3.10 SUBSCRIPTION */}
                    {shouldShowDocSection('subscription') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {isRtl
                                    ? t('ums.employees.wizard.documents.subscriptionTitle')
                                    : 'Subscription'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.gosiSubscriptionNumber'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.gosiSubscriptionNumber}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'gosiSubscriptionNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="GOSI-88492011"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.professionalSubscriptionNumber'
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.professionalSubscriptionNumber}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'professionalSubscriptionNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="SCE-554019"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.subscriptionIssueDate')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.subscriptionIssueDate}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'subscriptionIssueDate',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t(
                                            'ums.employees.wizard.documents.subscriptionExpiryDate'
                                        )}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.subscriptionExpiryDate}
                                        onChange={(e) =>
                                            onUpdateField(
                                                'subscriptionExpiryDate',
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#037F8C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('subscription')}
                        </div>
                    )}
                </div>
            )}

            {/* =================================================================== */}
            {/* 4. DEPENDENTS INFO                                                  */}
            {/* =================================================================== */}
            {currentStep === 3 && (
                <div className="space-y-6">
                    {/* Dependents Section */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.dependents.headerTitle')} (
                                    {form.dependents.length})
                                </h3>
                                <p className="text-xs text-[#6E6862] mt-0.5">
                                    {t('ums.employees.wizard.dependents.headerDesc')}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onAddDependent}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                            >
                                <Plus size={14} />
                                <span>{t('ums.employees.wizard.dependents.addDependent')}</span>
                            </button>
                        </div>

                        {form.dependents.length === 0 ? (
                            <div className="p-8 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-center space-y-2">
                                <HeartHandshake size={24} className="mx-auto text-[#857E74]" />
                                <p className="text-xs font-bold text-[#0D0D0D]">
                                    {t('ums.employees.details.fields.noDependentsTitle')}
                                </p>
                                <p className="text-[11px] text-[#6E6862]">
                                    {t('ums.employees.details.fields.noDependentsDesc')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {form.dependents.map((dep, idx) => {
                                    const depDocId = `dep-doc-${idx}`;
                                    return (
                                        <div
                                            key={dep.id}
                                            className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-4"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
                                                <span className="text-xs font-bold text-[#037F8C]">
                                                    {t(
                                                        'ums.employees.wizard.dependents.dependentCardTitle',
                                                        { index: idx + 1 }
                                                    )}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveDependent(idx)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>
                                                        {t(
                                                            'ums.employees.wizard.dependents.removeDependent'
                                                        )}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {/* Dependent Name EN */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.nameEn'
                                                        )}{' '}
                                                        <span className="text-[#DC2626]">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="ltr"
                                                        value={dep.nameEn}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'nameEn',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Full Name (EN)"
                                                        className={`w-full px-3 py-1.5 rounded-lg bg-white border text-xs text-[#0D0D0D] ${
                                                            errors[`dep_${idx}_nameEn`]
                                                                ? 'border-[#DC2626]'
                                                                : 'border-[#E5E0D8]'
                                                        }`}
                                                    />
                                                </div>

                                                {/* Dependent Name AR */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.nameAr'
                                                        )}{' '}
                                                        <span className="text-[#DC2626]">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={dep.nameAr}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'nameAr',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="الاسم الكامل بالعربية"
                                                        className={`w-full px-3 py-1.5 rounded-lg bg-white border text-xs text-[#0D0D0D] ${
                                                            errors[`dep_${idx}_nameAr`]
                                                                ? 'border-[#DC2626]'
                                                                : 'border-[#E5E0D8]'
                                                        }`}
                                                    />
                                                </div>

                                                {/* Relationship */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.relationship'
                                                        )}
                                                    </label>
                                                    <select
                                                        value={dep.relationship}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'relationship',
                                                                e.target
                                                                    .value as EmployeeDependent['relationship']
                                                            )
                                                        }
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        {DEPENDENT_RELATIONSHIPS.map((rel) => (
                                                            <option key={rel} value={rel}>
                                                                {t(
                                                                    `ums.employees.relationships.${rel}`
                                                                )}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Gender */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.gender'
                                                        )}
                                                    </label>
                                                    <select
                                                        value={dep.gender}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'gender',
                                                                e.target.value as Gender
                                                            )
                                                        }
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        {GENDERS.map((g) => (
                                                            <option key={g} value={g}>
                                                                {t(`ums.employees.genders.${g}`)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Date of Birth */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t('ums.employees.wizard.dependents.dob')}{' '}
                                                        <span className="text-[#DC2626]">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        dir="ltr"
                                                        value={dep.dob}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'dob',
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`w-full px-3 py-1.5 rounded-lg bg-white border text-xs font-mono text-[#0D0D0D] ${
                                                            errors[`dep_${idx}_dob`]
                                                                ? 'border-[#DC2626]'
                                                                : 'border-[#E5E0D8]'
                                                        }`}
                                                    />
                                                </div>

                                                {/* National ID / Iqama */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.nationalIdOrIqama'
                                                        )}{' '}
                                                        <span className="text-[#DC2626]">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="ltr"
                                                        value={dep.nationalIdOrIqama}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'nationalIdOrIqama',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="10XXXXXXXX / 24XXXXXXXX"
                                                        className={`w-full px-3 py-1.5 rounded-lg bg-white border text-xs font-mono text-[#0D0D0D] ${
                                                            errors[`dep_${idx}_nationalIdOrIqama`]
                                                                ? 'border-[#DC2626]'
                                                                : 'border-[#E5E0D8]'
                                                        }`}
                                                    />
                                                </div>

                                                {/* ID Expiry Date */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.idExpiryDate'
                                                        )}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        dir="ltr"
                                                        value={dep.idExpiryDate || ''}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'idExpiryDate',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                                    />
                                                </div>

                                                {/* Nationality */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.nationality'
                                                        )}
                                                    </label>
                                                    <select
                                                        value={dep.nationality || 'Saudi Arabia'}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'nationality',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#0D0D0D] cursor-pointer"
                                                    >
                                                        {NATIONALITY_OPTIONS.map((opt) => (
                                                            <option
                                                                key={opt.value}
                                                                value={opt.value}
                                                            >
                                                                {isRtl
                                                                    ? opt.labelAr
                                                                    : opt.labelEn}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Passport Number */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                                        {t(
                                                            'ums.employees.wizard.dependents.passportNumber'
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="ltr"
                                                        value={dep.passportNumber || ''}
                                                        onChange={(e) =>
                                                            onUpdateDependent(
                                                                idx,
                                                                'passportNumber',
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                        placeholder="V1234567"
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                                    />
                                                </div>

                                                {/* Insurance Included Checkbox */}
                                                <div className="sm:col-span-2 lg:col-span-3 flex items-end pb-1">
                                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={dep.insuranceIncluded}
                                                            onChange={(e) =>
                                                                onUpdateDependent(
                                                                    idx,
                                                                    'insuranceIncluded',
                                                                    e.target.checked
                                                                )
                                                            }
                                                            className="rounded border-[#E5E0D8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                                                        />
                                                        <span className="text-xs font-semibold text-[#0D0D0D]">
                                                            {t(
                                                                'ums.employees.wizard.dependents.insuranceIncluded'
                                                            )}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Dependent Identity Document Attachment */}
                                            <div className="pt-2 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                                                <div className="text-xs text-[#6E6862] flex items-center gap-2">
                                                    <Paperclip size={12} />
                                                    {dep.documentAttachment ? (
                                                        <span className="font-medium text-[#037F8C]">
                                                            {dep.documentAttachment.fileName} (
                                                            {formatFileSize(
                                                                dep.documentAttachment.fileSize
                                                            )}
                                                            )
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {t(
                                                                'ums.employees.wizard.dependents.attachment'
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label
                                                        htmlFor={depDocId}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-semibold text-[#037F8C] hover:bg-[#EFECE6] cursor-pointer"
                                                    >
                                                        <Upload size={12} />
                                                        <span>
                                                            {dep.documentAttachment
                                                                ? t(
                                                                      'ums.employees.wizard.documents.replaceDocument'
                                                                  )
                                                                : t(
                                                                      'ums.employees.wizard.documents.uploadDocument'
                                                                  )}
                                                        </span>
                                                    </label>
                                                    <input
                                                        id={depDocId}
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) =>
                                                            onDependentDocUpload(idx, e)
                                                        }
                                                        className="hidden"
                                                    />
                                                    {dep.documentAttachment && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onRemoveDependentDoc(idx)
                                                            }
                                                            className="text-[11px] text-[#DC2626] hover:underline cursor-pointer"
                                                        >
                                                            {t(
                                                                'ums.employees.wizard.documents.removeDocument'
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Onboarding Summary & Portal Invitation Card */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E0D8]">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.dependents.summaryTitle')}
                                </h3>
                                <p className="text-xs text-[#6E6862]">
                                    {t('ums.employees.wizard.dependents.summaryDesc')}
                                </p>
                            </div>
                            <span className="font-mono text-sm font-bold text-[#037F8C]">
                                {liveCompletionPercentage}%
                                {liveCompletion
                                    ? ` (${liveCompletion.completedCount}/${liveCompletion.totalCount})`
                                    : ''}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#857E74]">
                                    {t('ums.employees.details.fields.fullNameEn')}
                                </p>
                                <p className="font-bold text-[#0D0D0D] mt-0.5">
                                    {composedNameEn || '—'}
                                </p>
                                <p className="text-[11px] text-[#6E6862] mt-0.5" dir="rtl">
                                    {composedNameAr || '—'}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#857E74]">
                                    {t('ums.employees.wizard.dependents.totalDependents')}
                                </p>
                                <p className="font-mono text-base font-bold text-[#0D0D0D] mt-0.5">
                                    {form.dependents.length}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#857E74]">
                                    {t('ums.employees.wizard.dependents.insuredDependents')}
                                </p>
                                <p className="font-mono text-base font-bold text-[#037F8C] mt-0.5">
                                    {form.dependents.filter((d) => d.insuranceIncluded).length}
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <p className="text-[11px] text-[#857E74]">
                                    {t('ums.employees.wizard.dependents.grossMonthlyPackage')}
                                </p>
                                <p
                                    className="font-mono font-bold text-[#037F8C] text-base mt-0.5"
                                    dir="ltr"
                                >
                                    {calculatedSalary.grossSalary.toLocaleString('en-US')} SAR
                                </p>
                            </div>
                        </div>

                        {liveCompletion &&
                            (isRtl
                                ? liveCompletion.missingFieldsAr
                                : liveCompletion.missingFieldsEn
                            ).length > 0 && (
                                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
                                    <span className="font-semibold text-[#C28E3A] block mb-1">
                                        {t('ums.employees.details.incompleteHint')}
                                    </span>
                                    <p className="text-[11px] text-[#6E6862]">
                                        {(isRtl
                                            ? liveCompletion.missingFieldsAr
                                            : liveCompletion.missingFieldsEn
                                        ).join(' · ')}
                                    </p>
                                </div>
                            )}

                        {!isEditMode && (
                            <div className="p-3.5 rounded-xl bg-[#EAF3EC]/60 border border-[#037F8C]/20 flex items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.sendInviteOnSave}
                                        onChange={(e) =>
                                            onUpdateField('sendInviteOnSave', e.target.checked)
                                        }
                                        className="rounded border-[#037F8C] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                                    />
                                    <span className="text-xs font-semibold text-[#0D0D0D]">
                                        {t('ums.employees.wizard.sendInviteOnSave')}
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =================================================================== */}
            {/* WIZARD NAVIGATION FOOTER                                            */}
            {/* =================================================================== */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                    {currentStep > 0 ? (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onPrevStep}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                            <span>{t('ums.employees.wizard.prevStep')}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onCancel}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#6E6862] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <span>{t('ums.employees.wizard.cancel')}</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onSave(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Save size={14} />
                        <span>{t('ums.employees.wizard.saveAsDraft')}</span>
                    </button>

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={onNextStep}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            <span>{t('ums.employees.wizard.nextStep')}</span>
                            {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => onSave(false)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            <CheckCircle2 size={15} />
                            <span>
                                {isEditMode
                                    ? t('ums.employees.wizard.submitUpdate')
                                    : t('ums.employees.wizard.submitCreate')}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeForm;
