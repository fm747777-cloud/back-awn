import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useAuthStore } from '../../store/useAuthStore';
import {
    loadEmployees,
    saveEmployees,
    loadDepartments,
    loadDesignations,
    loadBranches,
    loadRoles,
    loadSecurityGroups,
    loadCustomAddons,
    generateNextEmployeeCode,
    computeIqamaStatus,
    computeEmployeeProfileCompletion,
    NATIONALITY_OPTIONS,
    splitFullName,
    joinNameParts,
    calculateSalaryTotals,
    isValidSaudiMobile,
    validateUploadFileMeta,
    wouldCreateCircularManagerChain,
    getEligibleManagersForEmployee,
    synchronizeEmployeeRelationships,
    gregorianToApproximateHijri,
    syncMasterEntityEmployeeCounts,
    recordUmsAuditEvent,
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
} from './umsMockData';

type WizardStepIndex = 0 | 1 | 2 | 3;

type DocumentSubTab =
    | 'all'
    | 'salary'
    | 'iqama'
    | 'bank'
    | 'health_insurance'
    | 'health_card'
    | 'passport'
    | 'visa'
    | 'contract'
    | 'driving_license'
    | 'subscription';

interface EmployeeWizardFormState {
    code: string;
    status: EmployeeStatus;

    // Step 1: Personal
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

    // Step 2: Employment
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

    // Step 3: Compensation & Regulatory Documents
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

    // Step 4: Dependents & Options
    dependents: EmployeeDependent[];
    sendInviteOnSave: boolean;
}

const CONTRACT_TYPES: ContractType[] = [
    'Permanent',
    'Fixed Term',
    'Probation',
    'Seasonal',
    'Remote',
];

const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-time', 'Part-time', 'Contractor'];
const MARITAL_STATUSES: MaritalStatus[] = ['Single', 'Married', 'Divorced', 'Widowed'];
const GENDERS: Gender[] = ['Male', 'Female'];
const CITIZENSHIPS: Citizenship[] = ['Saudi', 'Non-Saudi'];
const DEPENDENT_RELATIONSHIPS: EmployeeDependent['relationship'][] = [
    'Spouse',
    'Child',
    'Parent',
    'Other',
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

export const UmsEmployeeWizardPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');
    const currentUser = useAuthStore((state) => state.user);

    // Master datasets loaded from localStorage
    const [employees] = useState<EmployeeRecord[]>(() => loadEmployees());
    const [departments] = useState(() => loadDepartments());
    const [designations] = useState(() => loadDesignations());
    const [branches] = useState(() => loadBranches());
    const [roles] = useState(() => loadRoles());
    const [securityGroups] = useState(() => loadSecurityGroups());
    const [customAddons] = useState(() => loadCustomAddons());

    const existingEmployee = useMemo(
        () => (isEditMode && id ? employees.find((emp) => emp.id === id) : undefined),
        [employees, id, isEditMode]
    );

    // Custom Addons filtered by category
    const religionAddons = useMemo(
        () => customAddons.filter((a) => a.type === 'religion'),
        [customAddons]
    );
    const jobTitleAddons = useMemo(
        () => customAddons.filter((a) => a.type === 'job_title'),
        [customAddons]
    );
    const jobGradeAddons = useMemo(
        () =>
            customAddons
                .filter((a) => a.type === 'job_grade')
                .sort((a, b) => (a.gradeLevel ?? 99) - (b.gradeLevel ?? 99)),
        [customAddons]
    );
    const bankAddons = useMemo(
        () => customAddons.filter((a) => a.type === 'bank'),
        [customAddons]
    );

    // Build initial state from existingEmployee or clean defaults
    const [form, setForm] = useState<EmployeeWizardFormState>(() => {
        if (existingEmployee) {
            const enParts = splitFullName(existingEmployee.nameEn);
            const arParts = splitFullName(existingEmployee.nameAr);

            const matchedReligion = religionAddons.find(
                (r) =>
                    r.id === existingEmployee.religionId ||
                    r.id === existingEmployee.religion ||
                    r.nameEn.toLowerCase() === (existingEmployee.religion || '').toLowerCase() ||
                    r.nameAr === existingEmployee.religion
            );
            const matchedJobTitle = jobTitleAddons.find(
                (jt) =>
                    jt.id === existingEmployee.jobTitleId ||
                    jt.nameEn.toLowerCase() ===
                        (existingEmployee.jobTitleName || '').toLowerCase()
            );
            const matchedBank = bankAddons.find(
                (b) =>
                    b.id === existingEmployee.bankId ||
                    b.nameEn.toLowerCase() === (existingEmployee.bankName || '').toLowerCase() ||
                    b.nameAr === existingEmployee.bankName
            );
            const matchedGrade = jobGradeAddons.find(
                (g) =>
                    g.id === existingEmployee.jobGradeId ||
                    g.nameEn.toLowerCase() === (existingEmployee.jobGradeId || '').toLowerCase()
            );

            return {
                code: existingEmployee.code,
                status: existingEmployee.status,

                firstNameEn: existingEmployee.firstNameEn ?? enParts.firstName,
                secondNameEn: existingEmployee.secondNameEn ?? enParts.secondName,
                thirdNameEn: existingEmployee.thirdNameEn ?? enParts.thirdName,
                lastNameEn: existingEmployee.lastNameEn ?? enParts.lastName,

                firstNameAr: existingEmployee.firstNameAr ?? arParts.firstName,
                secondNameAr: existingEmployee.secondNameAr ?? arParts.secondName,
                thirdNameAr: existingEmployee.thirdNameAr ?? arParts.thirdName,
                lastNameAr: existingEmployee.lastNameAr ?? arParts.lastName,

                email: existingEmployee.email || '',
                workEmail: existingEmployee.workEmail || '',
                phone: existingEmployee.phone || '',
                dobGregorian: existingEmployee.dobGregorian || '',
                dobHijri:
                    existingEmployee.dobHijri ||
                    gregorianToApproximateHijri(existingEmployee.dobGregorian),
                religionId: matchedReligion?.id || existingEmployee.religionId || '',
                religion: matchedReligion?.nameEn || existingEmployee.religion || '',
                maritalStatus: existingEmployee.maritalStatus || 'Single',
                gender: existingEmployee.gender || 'Male',
                citizenship: existingEmployee.citizenship || 'Saudi',
                nationality: existingEmployee.nationality || 'Saudi Arabia',
                avatarUrl: existingEmployee.avatarUrl || '',
                avatarMeta: existingEmployee.avatarMeta,

                branchId: existingEmployee.branchId || '',
                departmentId: existingEmployee.departmentId || '',
                designationId: existingEmployee.designationId || '',
                jobTitleId: matchedJobTitle?.id || existingEmployee.jobTitleId || '',
                jobTitleName: matchedJobTitle?.nameEn || existingEmployee.jobTitleName || '',
                roleId: existingEmployee.roleId || '',
                jobGradeId: matchedGrade?.id || existingEmployee.jobGradeId || '',
                managerId: existingEmployee.managerId || '',
                joiningDate: existingEmployee.joiningDate || '',
                contractType: existingEmployee.contractType || 'Permanent',
                employmentType: existingEmployee.employmentType || 'Full-time',
                isUnderProbation: Boolean(existingEmployee.isUnderProbation),
                probationPeriodDays:
                    typeof existingEmployee.probationPeriodDays === 'number'
                        ? existingEmployee.probationPeriodDays
                        : 90,

                basicSalary: existingEmployee.salaryDetails?.basicSalary ?? 0,
                housingAllowance: existingEmployee.salaryDetails?.housingAllowance ?? 0,
                transportationAllowance:
                    existingEmployee.salaryDetails?.transportationAllowance ?? 0,
                foodAllowance: existingEmployee.salaryDetails?.foodAllowance ?? 0,
                otherAllowances: existingEmployee.salaryDetails?.otherAllowances ?? 0,

                iqamaNumber: existingEmployee.iqamaNumber || '',
                iqamaProfession: existingEmployee.iqamaProfession || '',
                iqamaExpiryDate: existingEmployee.iqamaExpiryDate || '',
                workPermitNumber: existingEmployee.workPermitNumber || '',
                workPermitExpiryDate: existingEmployee.workPermitExpiryDate || '',

                bankId: matchedBank?.id || existingEmployee.bankId || '',
                bankName: matchedBank?.nameEn || existingEmployee.bankName || '',
                accountHolderName:
                    existingEmployee.accountHolderName || existingEmployee.nameEn || '',
                iban: existingEmployee.iban || '',
                accountNumber: existingEmployee.accountNumber || '',

                healthInsuranceProvider: existingEmployee.healthInsuranceProvider || '',
                healthInsurancePolicy: existingEmployee.healthInsurancePolicy || '',
                healthInsuranceClass: existingEmployee.healthInsuranceClass || 'Class A',
                healthInsuranceExpiry: existingEmployee.healthInsuranceExpiry || '',

                healthCardNumber: existingEmployee.healthCardNumber || '',
                healthCardAuthority: existingEmployee.healthCardAuthority || '',
                healthCardIssueDate: existingEmployee.healthCardIssueDate || '',
                healthCardExpiryDate: existingEmployee.healthCardExpiryDate || '',

                passportNumber: existingEmployee.passportNumber || '',
                passportIssueCountry:
                    existingEmployee.passportIssueCountry ||
                    existingEmployee.nationality ||
                    'Saudi Arabia',
                passportIssueDate: existingEmployee.passportIssueDate || '',
                passportExpiry: existingEmployee.passportExpiry || '',

                visaNumber: existingEmployee.visaNumber || '',
                visaType: existingEmployee.visaType || '',
                visaBorderNumber: existingEmployee.visaBorderNumber || '',
                visaIssueDate: existingEmployee.visaIssueDate || '',
                visaExpiry: existingEmployee.visaExpiry || '',

                contractNumber: existingEmployee.contractNumber || '',
                contractStartDate:
                    existingEmployee.contractStartDate || existingEmployee.joiningDate || '',
                contractEndDate: existingEmployee.contractEndDate || '',

                drivingLicenseNumber: existingEmployee.drivingLicenseNumber || '',
                drivingLicenseType: existingEmployee.drivingLicenseType || 'Private',
                drivingLicenseIssueDate: existingEmployee.drivingLicenseIssueDate || '',
                drivingLicenseExpiry: existingEmployee.drivingLicenseExpiry || '',

                gosiSubscriptionNumber: existingEmployee.gosiSubscriptionNumber || '',
                professionalSubscriptionNumber:
                    existingEmployee.professionalSubscriptionNumber || '',
                subscriptionIssueDate: existingEmployee.subscriptionIssueDate || '',
                subscriptionExpiryDate: existingEmployee.subscriptionExpiryDate || '',

                documentAttachments: existingEmployee.documentAttachments || {},
                dependents: existingEmployee.dependents ? [...existingEmployee.dependents] : [],
                sendInviteOnSave: false,
            };
        }

        const defaultReligion =
            religionAddons.find((r) => r.status === 'Active') || religionAddons[0];
        const defaultBranch =
            branches.find((b) => b.status === 'Active' && b.isHeadquarter) ||
            branches.find((b) => b.status === 'Active');
        const todayIso = new Date().toISOString().slice(0, 10);

        return {
            code: generateNextEmployeeCode(employees),
            status: 'Active',

            firstNameEn: '',
            secondNameEn: '',
            thirdNameEn: '',
            lastNameEn: '',
            firstNameAr: '',
            secondNameAr: '',
            thirdNameAr: '',
            lastNameAr: '',
            email: '',
            workEmail: '',
            phone: '',
            dobGregorian: '',
            dobHijri: '',
            religionId: defaultReligion?.id || '',
            religion: defaultReligion?.nameEn || '',
            maritalStatus: 'Single',
            gender: 'Male',
            citizenship: 'Saudi',
            nationality: 'Saudi Arabia',
            avatarUrl: '',
            avatarMeta: undefined,

            branchId: defaultBranch?.id || '',
            departmentId: '',
            designationId: '',
            jobTitleId: '',
            jobTitleName: '',
            roleId: '',
            jobGradeId: '',
            managerId: '',
            joiningDate: todayIso,
            contractType: 'Permanent',
            employmentType: 'Full-time',
            isUnderProbation: true,
            probationPeriodDays: 90,

            basicSalary: 0,
            housingAllowance: 0,
            transportationAllowance: 0,
            foodAllowance: 0,
            otherAllowances: 0,

            iqamaNumber: '',
            iqamaProfession: '',
            iqamaExpiryDate: '',
            workPermitNumber: '',
            workPermitExpiryDate: '',

            bankId: '',
            bankName: '',
            accountHolderName: '',
            iban: '',
            accountNumber: '',

            healthInsuranceProvider: 'Bupa Arabia',
            healthInsurancePolicy: '',
            healthInsuranceClass: 'Class A',
            healthInsuranceExpiry: '',

            healthCardNumber: '',
            healthCardAuthority: '',
            healthCardIssueDate: '',
            healthCardExpiryDate: '',

            passportNumber: '',
            passportIssueCountry: 'Saudi Arabia',
            passportIssueDate: '',
            passportExpiry: '',

            visaNumber: '',
            visaType: '',
            visaBorderNumber: '',
            visaIssueDate: '',
            visaExpiry: '',

            contractNumber: '',
            contractStartDate: todayIso,
            contractEndDate: '',

            drivingLicenseNumber: '',
            drivingLicenseType: 'Private',
            drivingLicenseIssueDate: '',
            drivingLicenseExpiry: '',

            gosiSubscriptionNumber: '',
            professionalSubscriptionNumber: '',
            subscriptionIssueDate: '',
            subscriptionExpiryDate: '',

            documentAttachments: {},
            dependents: [],
            sendInviteOnSave: true,
        };
    });

    const [currentStep, setCurrentStep] = useState<WizardStepIndex>(0);
    const [highestVisitedStep, setHighestVisitedStep] = useState<WizardStepIndex>(
        isEditMode ? 3 : 0
    );
    const [activeDocSubTab, setActiveDocSubTab] = useState<DocumentSubTab>('all');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadFeedback, setUploadFeedback] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    useEffect(() => {
        if (!uploadFeedback) return;
        const timer = window.setTimeout(() => setUploadFeedback(null), 4000);
        return () => window.clearTimeout(timer);
    }, [uploadFeedback]);

    // Composed full names
    const composedNameEn = useMemo(
        () =>
            joinNameParts({
                firstName: form.firstNameEn,
                secondName: form.secondNameEn,
                thirdName: form.thirdNameEn,
                lastName: form.lastNameEn,
            }),
        [form.firstNameEn, form.secondNameEn, form.thirdNameEn, form.lastNameEn]
    );

    const composedNameAr = useMemo(
        () =>
            joinNameParts({
                firstName: form.firstNameAr,
                secondName: form.secondNameAr,
                thirdName: form.thirdNameAr,
                lastName: form.lastNameAr,
            }),
        [form.firstNameAr, form.secondNameAr, form.thirdNameAr, form.lastNameAr]
    );

    // Live salary calculation
    const calculatedSalary = useMemo(
        () =>
            calculateSalaryTotals({
                basicSalary: form.basicSalary,
                housingAllowance: form.housingAllowance,
                transportationAllowance: form.transportationAllowance,
                foodAllowance: form.foodAllowance,
                otherAllowances: form.otherAllowances,
            }),
        [
            form.basicSalary,
            form.housingAllowance,
            form.transportationAllowance,
            form.foodAllowance,
            form.otherAllowances,
        ]
    );

    // Live Iqama status
    const calculatedIqamaStatus = useMemo(
        () => computeIqamaStatus(form.iqamaExpiryDate),
        [form.iqamaExpiryDate]
    );

    // Eligible managers (prevents self & circular chains)
    const eligibleManagers = useMemo(
        () => getEligibleManagersForEmployee(id, employees),
        [id, employees]
    );

    // Selected Role & Security Group
    const selectedRole = useMemo(
        () => roles.find((r) => r.id === form.roleId),
        [roles, form.roleId]
    );
    const linkedSecurityGroup = useMemo(
        () =>
            selectedRole
                ? securityGroups.find((sg) => sg.id === selectedRole.securityGroupId)
                : undefined,
        [selectedRole, securityGroups]
    );

    // Construct candidate EmployeeRecord for live Profile Completion calculation
    const candidateRecordForCompletion = useMemo<EmployeeRecord>(() => {
        const baseRecord: EmployeeRecord = {
            id: id || 'draft-preview',
            code: form.code,
            status: form.status,
            nameEn: composedNameEn,
            nameAr: composedNameAr,
            firstNameEn: form.firstNameEn.trim(),
            secondNameEn: form.secondNameEn.trim(),
            thirdNameEn: form.thirdNameEn.trim(),
            lastNameEn: form.lastNameEn.trim(),
            firstNameAr: form.firstNameAr.trim(),
            secondNameAr: form.secondNameAr.trim(),
            thirdNameAr: form.thirdNameAr.trim(),
            lastNameAr: form.lastNameAr.trim(),
            email: form.email.trim(),
            workEmail: form.workEmail.trim(),
            phone: form.phone.trim(),
            dobGregorian: form.dobGregorian,
            dobHijri: form.dobHijri,
            religionId: form.religionId,
            religion: form.religion,
            maritalStatus: form.maritalStatus,
            gender: form.gender,
            citizenship: form.citizenship,
            nationality: form.nationality,
            avatarUrl: form.avatarUrl || undefined,
            avatarMeta: form.avatarMeta,
            branchId: form.branchId,
            departmentId: form.departmentId,
            designationId: form.designationId,
            jobTitleId: form.jobTitleId || undefined,
            jobTitleName: form.jobTitleName || undefined,
            roleId: form.roleId,
            jobGradeId: form.jobGradeId,
            managerId: form.managerId || undefined,
            joiningDate: form.joiningDate,
            contractType: form.contractType,
            employmentType: form.employmentType,
            isUnderProbation: form.isUnderProbation,
            probationPeriodDays: form.probationPeriodDays,
            salaryDetails: calculatedSalary,
            iqamaNumber: form.iqamaNumber.trim(),
            iqamaProfession: form.iqamaProfession.trim(),
            iqamaExpiryDate: form.iqamaExpiryDate,
            iqamaStatus: calculatedIqamaStatus,
            workPermitNumber: form.workPermitNumber.trim(),
            workPermitExpiryDate: form.workPermitExpiryDate,
            bankId: form.bankId || undefined,
            bankName: form.bankName || undefined,
            accountHolderName: form.accountHolderName.trim(),
            iban: form.iban.trim(),
            accountNumber: form.accountNumber.trim(),
            healthInsuranceProvider: form.healthInsuranceProvider.trim(),
            healthInsurancePolicy: form.healthInsurancePolicy.trim(),
            healthInsuranceClass: form.healthInsuranceClass.trim(),
            healthInsuranceExpiry: form.healthInsuranceExpiry,
            healthCardNumber: form.healthCardNumber.trim(),
            healthCardAuthority: form.healthCardAuthority.trim(),
            healthCardIssueDate: form.healthCardIssueDate,
            healthCardExpiryDate: form.healthCardExpiryDate,
            passportNumber: form.passportNumber.trim(),
            passportIssueCountry: form.passportIssueCountry.trim(),
            passportIssueDate: form.passportIssueDate,
            passportExpiry: form.passportExpiry,
            visaNumber: form.visaNumber.trim(),
            visaType: form.visaType.trim(),
            visaBorderNumber: form.visaBorderNumber.trim(),
            visaIssueDate: form.visaIssueDate,
            visaExpiry: form.visaExpiry,
            contractNumber: form.contractNumber.trim(),
            contractStartDate: form.contractStartDate,
            contractEndDate: form.contractEndDate,
            drivingLicenseNumber: form.drivingLicenseNumber.trim(),
            drivingLicenseType: form.drivingLicenseType.trim(),
            drivingLicenseIssueDate: form.drivingLicenseIssueDate,
            drivingLicenseExpiry: form.drivingLicenseExpiry,
            gosiSubscriptionNumber: form.gosiSubscriptionNumber.trim(),
            professionalSubscriptionNumber: form.professionalSubscriptionNumber.trim(),
            subscriptionIssueDate: form.subscriptionIssueDate,
            subscriptionExpiryDate: form.subscriptionExpiryDate,
            documentAttachments: form.documentAttachments,
            dependents: form.dependents,
            createdAt: existingEmployee?.createdAt || new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10),
            createdBy: existingEmployee?.createdBy || currentUser?.fullName || 'Karim Wagdi',
        };
        return synchronizeEmployeeRelationships(baseRecord, {
            departments,
            designations,
            branches,
            roles,
            customAddons,
            employees,
        });
    }, [
        id,
        form,
        composedNameEn,
        composedNameAr,
        calculatedSalary,
        calculatedIqamaStatus,
        existingEmployee,
        currentUser,
        departments,
        designations,
        branches,
        roles,
        customAddons,
        employees,
    ]);

    const liveCompletion = useMemo(
        () => computeEmployeeProfileCompletion(candidateRecordForCompletion),
        [candidateRecordForCompletion]
    );

    // If Edit mode with invalid ID, show clean Not Found state
    if (isEditMode && !existingEmployee) {
        return (
            <div className="space-y-6 text-start">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-10 text-center max-w-lg mx-auto my-8 space-y-4 shadow-2xs">
                    <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#C28E3A]">
                        <AlertTriangle size={22} />
                    </div>
                    <h2 className="text-lg font-bold text-[#0D0D0D]">
                        {t('ums.employees.details.notFoundTitle')}
                    </h2>
                    <p className="text-xs text-[#6E6862]">
                        {t('ums.employees.details.notFoundDesc', { id })}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/ums/employees')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
                    >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{t('ums.employees.actions.backToList')}</span>
                    </button>
                </div>
            </div>
        );
    }

    // Field update helper
    const updateField = <K extends keyof EmployeeWizardFormState>(
        key: K,
        value: EmployeeWizardFormState[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key as string]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key as string];
                return next;
            });
        }
    };

    // Validation logic per step
    const validateStep = (
        step: WizardStepIndex,
        isDraftSave: boolean = false
    ): Record<string, string> => {
        const stepErrors: Record<string, string> = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (step === 0) {
            if (!form.firstNameEn.trim()) {
                stepErrors.firstNameEn = t('ums.employees.wizard.validation.firstNameEnRequired');
            }
            if (!form.lastNameEn.trim() && !isDraftSave) {
                stepErrors.lastNameEn = t('ums.employees.wizard.validation.lastNameEnRequired');
            }
            if (!form.firstNameAr.trim() && !isDraftSave) {
                stepErrors.firstNameAr = t('ums.employees.wizard.validation.firstNameArRequired');
            }
            if (!form.lastNameAr.trim() && !isDraftSave) {
                stepErrors.lastNameAr = t('ums.employees.wizard.validation.lastNameArRequired');
            }

            if (!isDraftSave || form.email.trim()) {
                if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
                    stepErrors.email = t('ums.employees.wizard.validation.personalEmailRequired');
                } else {
                    const dup = employees.find(
                        (e) =>
                            e.id !== id &&
                            (e.email?.toLowerCase() === form.email.trim().toLowerCase() ||
                                e.workEmail?.toLowerCase() === form.email.trim().toLowerCase())
                    );
                    if (dup) {
                        stepErrors.email = t('ums.employees.wizard.validation.duplicateEmail', {
                            code: dup.code,
                        });
                    }
                }
            }

            if (!isDraftSave || form.workEmail.trim()) {
                if (!form.workEmail.trim() || !emailRegex.test(form.workEmail.trim())) {
                    stepErrors.workEmail = t('ums.employees.wizard.validation.workEmailRequired');
                } else if (
                    form.email.trim() &&
                    form.workEmail.trim().toLowerCase() === form.email.trim().toLowerCase()
                ) {
                    stepErrors.workEmail = t(
                        'ums.employees.wizard.validation.samePersonalAndWorkEmail',
                        {
                            defaultValue:
                                'Official work email must be different from personal email.',
                        }
                    );
                } else {
                    const dup = employees.find(
                        (e) =>
                            e.id !== id &&
                            (e.workEmail?.toLowerCase() === form.workEmail.trim().toLowerCase() ||
                                e.email?.toLowerCase() === form.workEmail.trim().toLowerCase())
                    );
                    if (dup) {
                        stepErrors.workEmail = t(
                            'ums.employees.wizard.validation.duplicateEmail',
                            { code: dup.code }
                        );
                    }
                }
            }

            if (!isDraftSave || form.phone.trim()) {
                if (!form.phone.trim()) {
                    stepErrors.phone = t('ums.employees.wizard.validation.phoneRequired');
                } else if (!isValidSaudiMobile(form.phone)) {
                    stepErrors.phone = t('ums.employees.wizard.validation.phoneInvalid');
                }
            }

            if (!isDraftSave) {
                if (!form.dobGregorian.trim()) {
                    stepErrors.dobGregorian = t('ums.employees.wizard.validation.dobRequired');
                }
                if (!form.religionId && !form.religion.trim()) {
                    stepErrors.religionId = t('ums.employees.wizard.validation.religionRequired');
                }
                if (!form.nationality.trim()) {
                    stepErrors.nationality = t(
                        'ums.employees.wizard.validation.nationalityRequired'
                    );
                }
            }
        }

        if (step === 1 && !isDraftSave) {
            if (!form.branchId) {
                stepErrors.branchId = t('ums.employees.wizard.validation.branchRequired');
            }
            if (!form.departmentId) {
                stepErrors.departmentId = t('ums.employees.wizard.validation.departmentRequired');
            }
            if (!form.designationId) {
                stepErrors.designationId = t(
                    'ums.employees.wizard.validation.designationRequired'
                );
            }
            if (!form.roleId) {
                stepErrors.roleId = t('ums.employees.wizard.validation.roleRequired');
            }
            if (!form.jobGradeId) {
                stepErrors.jobGradeId = t('ums.employees.wizard.validation.jobGradeRequired');
            }
            if (!form.joiningDate.trim()) {
                stepErrors.joiningDate = t('ums.employees.wizard.validation.joiningDateRequired');
            }
            if (
                form.managerId &&
                wouldCreateCircularManagerChain(id, form.managerId, employees)
            ) {
                stepErrors.managerId = t('ums.employees.wizard.validation.circularManager');
            }
        }

        if (step === 2) {
            if (form.iqamaNumber.trim()) {
                const dupIqama = employees.find(
                    (e) =>
                        e.id !== id &&
                        e.iqamaNumber &&
                        e.iqamaNumber.trim().toLowerCase() ===
                            form.iqamaNumber.trim().toLowerCase()
                );
                if (dupIqama) {
                    stepErrors.iqamaNumber = t(
                        'ums.employees.wizard.validation.duplicateIqama',
                        {
                            code: dupIqama.code,
                            defaultValue: `This National ID / Iqama is already registered to ${dupIqama.code}.`,
                        }
                    );
                }
            }

            if (!isDraftSave) {
                if (Number(form.basicSalary) <= 0) {
                    stepErrors.basicSalary = t(
                        'ums.employees.wizard.validation.basicSalaryRequired'
                    );
                }
                if (!form.iqamaNumber.trim()) {
                    stepErrors.iqamaNumber = t(
                        'ums.employees.wizard.validation.iqamaNumberRequired'
                    );
                }
                if (!form.iqamaExpiryDate.trim()) {
                    stepErrors.iqamaExpiryDate = t(
                        'ums.employees.wizard.validation.iqamaExpiryRequired'
                    );
                }
                if (!form.bankId && !form.bankName.trim()) {
                    stepErrors.bankId = t('ums.employees.wizard.validation.bankRequired');
                }
                if (!form.iban.trim()) {
                    stepErrors.iban = t('ums.employees.wizard.validation.ibanRequired');
                }
            }
        }

        if (step === 3 && !isDraftSave) {
            form.dependents.forEach((dep, idx) => {
                if (!dep.nameEn.trim()) {
                    stepErrors[`dep_${idx}_nameEn`] = t(
                        'ums.employees.wizard.validation.dependentNameEnRequired'
                    );
                }
                if (!dep.nameAr.trim()) {
                    stepErrors[`dep_${idx}_nameAr`] = t(
                        'ums.employees.wizard.validation.dependentNameArRequired'
                    );
                }
                if (!dep.dob.trim()) {
                    stepErrors[`dep_${idx}_dob`] = t(
                        'ums.employees.wizard.validation.dependentDobRequired'
                    );
                }
                if (!dep.nationalIdOrIqama.trim()) {
                    stepErrors[`dep_${idx}_nationalIdOrIqama`] = t(
                        'ums.employees.wizard.validation.dependentIdRequired'
                    );
                }
            });
        }

        return stepErrors;
    };

    // Avatar Photo Upload Handler
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateUploadFileMeta(file, 'image');
        if (!check.valid) {
            setUploadFeedback({
                type: 'error',
                message: isRtl ? check.errorAr || '' : check.errorEn || '',
            });
            e.target.value = '';
            return;
        }

        const nowIso = new Date().toISOString().slice(0, 10);
        // If <= 512 KB, read as Data URL for persistent inline preview; otherwise use object URL + metadata
        if (file.size <= 512 * 1024) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                setForm((prev) => ({
                    ...prev,
                    avatarUrl: dataUrl,
                    avatarMeta: {
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type || 'image/jpeg',
                        uploadedAt: nowIso,
                        storageMode: 'inline-preview',
                    },
                }));
            };
            reader.readAsDataURL(file);
        } else {
            const previewUrl = URL.createObjectURL(file);
            setForm((prev) => ({
                ...prev,
                avatarUrl: previewUrl,
                avatarMeta: {
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || 'image/jpeg',
                    uploadedAt: nowIso,
                    storageMode: 'local-metadata',
                },
            }));
        }
        e.target.value = '';
    };

    // Regulatory Document Attachment Handler
    const handleDocumentUpload = (
        category: EmployeeDocumentCategory,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateUploadFileMeta(file, 'document');
        if (!check.valid) {
            setUploadFeedback({
                type: 'error',
                message: isRtl ? check.errorAr || '' : check.errorEn || '',
            });
            e.target.value = '';
            return;
        }

        const attachment: EmployeeDocumentAttachment = {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            uploadedAt: new Date().toISOString().slice(0, 10),
            storageMode: 'local-metadata',
        };

        setForm((prev) => ({
            ...prev,
            documentAttachments: {
                ...prev.documentAttachments,
                [category]: attachment,
            },
        }));
        e.target.value = '';
    };

    const handleRemoveDocument = (category: EmployeeDocumentCategory) => {
        setForm((prev) => {
            const nextAttachments = { ...prev.documentAttachments };
            delete nextAttachments[category];
            return {
                ...prev,
                documentAttachments: nextAttachments,
            };
        });
    };

    // Dependent Handlers
    const handleAddDependent = () => {
        const newDep: EmployeeDependent = {
            id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            nameEn: '',
            nameAr: '',
            relationship: 'Child',
            dob: '',
            gender: 'Male',
            nationality: form.nationality || 'Saudi Arabia',
            nationalIdOrIqama: '',
            idExpiryDate: '',
            passportNumber: '',
            insuranceIncluded: true,
        };
        setForm((prev) => ({
            ...prev,
            dependents: [...prev.dependents, newDep],
        }));
    };

    const handleUpdateDependent = <K extends keyof EmployeeDependent>(
        index: number,
        key: K,
        value: EmployeeDependent[K]
    ) => {
        setForm((prev) => {
            const nextDeps = [...prev.dependents];
            nextDeps[index] = {
                ...nextDeps[index],
                [key]: value,
            };
            return {
                ...prev,
                dependents: nextDeps,
            };
        });
        const errKey = `dep_${index}_${String(key)}`;
        if (errors[errKey]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[errKey];
                return next;
            });
        }
    };

    const handleDependentDocUpload = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const check = validateUploadFileMeta(file, 'document');
        if (!check.valid) {
            setUploadFeedback({
                type: 'error',
                message: isRtl ? check.errorAr || '' : check.errorEn || '',
            });
            e.target.value = '';
            return;
        }

        const attachment: EmployeeDocumentAttachment = {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/pdf',
            uploadedAt: new Date().toISOString().slice(0, 10),
            storageMode: 'local-metadata',
        };

        handleUpdateDependent(index, 'documentAttachment', attachment);
        e.target.value = '';
    };

    const handleRemoveDependent = (index: number) => {
        setForm((prev) => ({
            ...prev,
            dependents: prev.dependents.filter((_, idx) => idx !== index),
        }));
    };

    // Step Navigation
    const handleNextStep = () => {
        const stepErrors = validateStep(currentStep, false);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        const next = Math.min(3, currentStep + 1) as WizardStepIndex;
        setCurrentStep(next);
        setHighestVisitedStep((prev) => (next > prev ? next : prev));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevStep = () => {
        setErrors({});
        const prev = Math.max(0, currentStep - 1) as WizardStepIndex;
        setCurrentStep(prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStepClick = (targetStep: WizardStepIndex) => {
        if (targetStep === currentStep) return;
        if (targetStep < currentStep || isEditMode || targetStep <= highestVisitedStep) {
            setErrors({});
            setCurrentStep(targetStep);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        // Validate current step before jumping forward
        const stepErrors = validateStep(currentStep, false);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        setCurrentStep(targetStep);
        setHighestVisitedStep((prev) => (targetStep > prev ? targetStep : prev));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Persist Employee (Save as Draft OR Final Submit)
    const handleSaveEmployee = (saveAsDraft: boolean) => {
        if (saveAsDraft) {
            if (!form.firstNameEn.trim() && !form.firstNameAr.trim()) {
                setErrors({
                    firstNameEn: t('ums.employees.wizard.validation.draftNameRequired'),
                });
                setCurrentStep(0);
                return;
            }
            const draftFormatErrors = validateStep(0, true);
            if (Object.keys(draftFormatErrors).length > 0) {
                setErrors(draftFormatErrors);
                setCurrentStep(0);
                return;
            }
        } else {
            // Validate all 4 steps
            for (const stepIdx of [0, 1, 2, 3] as WizardStepIndex[]) {
                const stepErrs = validateStep(stepIdx, false);
                if (Object.keys(stepErrs).length > 0) {
                    setErrors(stepErrs);
                    setCurrentStep(stepIdx);
                    if (stepIdx === 2) {
                        if (stepErrs.basicSalary) setActiveDocSubTab('salary');
                        else if (stepErrs.iqamaNumber || stepErrs.iqamaExpiryDate)
                            setActiveDocSubTab('iqama');
                        else if (stepErrs.bankId || stepErrs.iban) setActiveDocSubTab('bank');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
            }
        }

        const todayIso = new Date().toISOString().slice(0, 10);
        const existingIdSet = new Set(employees.map((e) => e.id.toLowerCase()));
        let targetId = existingEmployee ? existingEmployee.id : `emp-${Date.now()}`;
        if (!existingEmployee) {
            let idCounter = 1;
            while (existingIdSet.has(targetId.toLowerCase())) {
                targetId = `emp-${Date.now()}-${idCounter}`;
                idCounter += 1;
            }
        }
        const finalStatus: EmployeeStatus = saveAsDraft
            ? 'Draft'
            : form.status === 'Draft'
            ? 'Active'
            : form.status;

        const finalNameEn =
            composedNameEn ||
            existingEmployee?.nameEn ||
            form.firstNameAr.trim() ||
            form.code;
        const finalNameAr =
            composedNameAr ||
            existingEmployee?.nameAr ||
            form.firstNameEn.trim() ||
            form.code;

        const invitationStatus =
            finalStatus === 'Draft'
                ? 'Not Sent'
                : form.sendInviteOnSave
                ? 'Pending'
                : existingEmployee?.invitationStatus || 'Accepted';

        const invitedAt =
            form.sendInviteOnSave && finalStatus !== 'Draft'
                ? todayIso
                : existingEmployee?.invitedAt;

        const rawRecord: EmployeeRecord = {
            ...candidateRecordForCompletion,
            id: targetId,
            code: existingEmployee ? existingEmployee.code : form.code,
            status: finalStatus,
            nameEn: finalNameEn,
            nameAr: finalNameAr,
            invitationStatus,
            ...(invitedAt ? { invitedAt } : {}),
            ...(existingEmployee?.lastLoginAt
                ? { lastLoginAt: existingEmployee.lastLoginAt }
                : {}),
            createdAt: existingEmployee?.createdAt || todayIso,
            updatedAt: todayIso,
            createdBy: existingEmployee?.createdBy || currentUser?.fullName || 'Karim Wagdi',
        };

        const syncedRecord = synchronizeEmployeeRelationships(rawRecord, {
            departments,
            designations,
            branches,
            roles,
            customAddons,
            employees,
        });

        const currentEmployees = loadEmployees();
        const updatedEmployees = isEditMode
            ? currentEmployees.map((emp) => (emp.id === targetId ? syncedRecord : emp))
            : [syncedRecord, ...currentEmployees];

        saveEmployees(updatedEmployees);
        syncMasterEntityEmployeeCounts(updatedEmployees);

        recordUmsAuditEvent({
            action: isEditMode ? 'UPDATED' : 'CREATED',
            resource: 'Employee',
            resourceId: syncedRecord.id,
            resourceName: `${syncedRecord.nameEn} (${syncedRecord.code})`,
            detailsEn: isEditMode
                ? `Updated ${saveAsDraft ? 'draft ' : ''}employee record ${syncedRecord.code} (${syncedRecord.nameEn}) — Status: ${syncedRecord.status}.`
                : `Created ${
                      saveAsDraft ? 'draft ' : ''
                  }employee record ${syncedRecord.code} (${syncedRecord.nameEn}) in ${
                      syncedRecord.departmentName || 'Unassigned Department'
                  }.`,
            detailsAr: isEditMode
                ? `تحديث ${saveAsDraft ? 'مسودة ' : ''}سجل الموظف ${syncedRecord.code} (${syncedRecord.nameAr}) — الحالة: ${syncedRecord.status}.`
                : `إنشاء سجل موظف ${saveAsDraft ? 'كمسودة ' : ''}${syncedRecord.code} (${
                      syncedRecord.nameAr
                  }).`,
            previousState: existingEmployee ? `Status: ${existingEmployee.status}` : undefined,
            newState: `Status: ${syncedRecord.status}`,
            actorName: currentUser?.fullName || 'Karim Wagdi',
            actorEmail: 'karim@awn.sa',
        });

        navigate(`/ums/employees/${syncedRecord.id}`);
    };

    // Helper for rendering document attachment uploader inside Step 3 cards
    const renderDocumentAttachmentControl = (category: EmployeeDocumentCategory) => {
        const attachment = form.documentAttachments[category];
        const inputId = `doc-upload-${category}`;

        return (
            <div className="pt-3 mt-3 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="text-[#857E74] shrink-0" />
                    {attachment ? (
                        <div className="text-xs min-w-0">
                            <span className="font-semibold text-[#265938] inline-flex items-center gap-1 truncate">
                                <FileCheck2 size={13} />
                                {attachment.fileName}
                            </span>
                            <span className="text-[11px] text-[#857E74] ms-2" dir="ltr">
                                ({formatFileSize(attachment.fileSize)} · {attachment.uploadedAt})
                            </span>
                        </div>
                    ) : (
                        <span className="text-[11px] text-[#6E6862]">
                            {t('ums.employees.wizard.documents.attachmentLabel')}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <label
                        htmlFor={inputId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        <Upload size={12} />
                        <span>
                            {attachment
                                ? t('ums.employees.wizard.documents.replaceDocument')
                                : t('ums.employees.wizard.documents.uploadDocument')}
                        </span>
                    </label>
                    <input
                        id={inputId}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        onChange={(e) => handleDocumentUpload(category, e)}
                        className="hidden"
                    />
                    {attachment && (
                        <button
                            type="button"
                            onClick={() => handleRemoveDocument(category)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                            <Trash2 size={12} />
                            <span>{t('ums.employees.wizard.documents.removeDocument')}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const stepsMeta: Array<{
        index: WizardStepIndex;
        key: 'personal' | 'employment' | 'documents' | 'dependents';
        icon: React.FC<{ size?: number; className?: string }>;
        complete: boolean;
    }> = [
        {
            index: 0,
            key: 'personal',
            icon: User,
            complete: liveCompletion.personalComplete,
        },
        {
            index: 1,
            key: 'employment',
            icon: Briefcase,
            complete: liveCompletion.employmentComplete,
        },
        {
            index: 2,
            key: 'documents',
            icon: FileText,
            complete: liveCompletion.salaryComplete && liveCompletion.documentsComplete,
        },
        {
            index: 3,
            key: 'dependents',
            icon: HeartHandshake,
            complete: form.dependents.length > 0,
        },
    ];

    const documentSubTabs: DocumentSubTab[] = [
        'all',
        'salary',
        'iqama',
        'bank',
        'health_insurance',
        'health_card',
        'passport',
        'visa',
        'contract',
        'driving_license',
        'subscription',
    ];

    const shouldShowDocSection = (section: DocumentSubTab) =>
        activeDocSubTab === 'all' || activeDocSubTab === section;

    return (
        <div className="space-y-6 text-start pb-10">
            {/* TOP HEADER BAR */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                isEditMode && existingEmployee
                                    ? `/ums/employees/${existingEmployee.id}`
                                    : '/ums/employees'
                            )
                        }
                        className="mt-0.5 p-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                        title={t('ums.employees.actions.backToList')}
                    >
                        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    </button>

                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6862]">
                            <span className="font-mono font-bold text-[#2D3F2C]" dir="ltr">
                                {form.code}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                                {t('ums.employees.wizard.stepIndicator', {
                                    current: currentStep + 1,
                                    total: 4,
                                })}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#265938]">
                                {t('ums.employees.wizard.liveCompletion')}:{' '}
                                {liveCompletion.percentage}%
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] mt-0.5">
                            {isEditMode
                                ? t('ums.employees.wizard.editTitle')
                                : t('ums.employees.wizard.createTitle')}
                        </h1>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {isEditMode
                                ? t('ums.employees.wizard.editSubtitle', { code: form.code })
                                : t('ums.employees.wizard.createSubtitle')}
                        </p>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                isEditMode && existingEmployee
                                    ? `/ums/employees/${existingEmployee.id}`
                                    : '/ums/employees'
                            )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                    >
                        <span>{t('ums.employees.wizard.cancel')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSaveEmployee(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        <Save size={14} />
                        <span>{t('ums.employees.wizard.saveAsDraft')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSaveEmployee(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                        <Check size={14} />
                        <span>
                            {isEditMode
                                ? t('ums.employees.wizard.submitUpdate')
                                : t('ums.employees.wizard.submitCreate')}
                        </span>
                    </button>
                </div>
            </div>

            {/* UPLOAD OR VALIDATION BANNER */}
            {uploadFeedback && (
                <div
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
                        uploadFeedback.type === 'error'
                            ? 'bg-[#FEF2F2] border-[#DC2626]/30 text-[#DC2626]'
                            : 'bg-[#EAF3EC] border-[#265938]/30 text-[#265938]'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={15} />
                        <span>{uploadFeedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setUploadFeedback(null)}
                        className="p-1 hover:opacity-75 cursor-pointer"
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

            {/* 4-STEP WIZARD PROGRESS HEADER */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {stepsMeta.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.index;
                        const isVisited =
                            isEditMode ||
                            step.index < currentStep ||
                            step.index <= highestVisitedStep;

                        return (
                            <button
                                key={step.key}
                                type="button"
                                onClick={() => handleStepClick(step.index)}
                                className={`flex items-start gap-3 p-3 rounded-xl border text-start transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-[#FAF8F5] border-[#2D3F2C] ring-1 ring-[#2D3F2C]'
                                        : isVisited
                                        ? 'bg-white hover:bg-[#FAF8F5] border-[#E5E0D8]'
                                        : 'bg-[#FAF8F5]/50 border-[#E5E0D8] opacity-75 hover:opacity-100'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                        isActive
                                            ? 'bg-[#2D3F2C] text-white'
                                            : step.complete
                                            ? 'bg-[#EAF3EC] text-[#265938]'
                                            : 'bg-[#EFECE6] text-[#6E6862]'
                                    }`}
                                >
                                    {step.complete && !isActive ? (
                                        <Check size={15} />
                                    ) : (
                                        <Icon size={15} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#857E74]">
                                            0{step.index + 1}
                                        </span>
                                        {step.complete && (
                                            <CheckCircle2
                                                size={13}
                                                className="text-[#265938] shrink-0"
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-[#0D0D0D] truncate mt-0.5">
                                        {t(`ums.employees.wizard.steps.${step.key}.title`)}
                                    </p>
                                    <p className="text-[11px] text-[#6E6862] line-clamp-1 mt-0.5">
                                        {t(`ums.employees.wizard.steps.${step.key}.subtitle`)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* =================================================================== */}
            {/* STEP 1: PERSONAL INFORMATION                                        */}
            {/* =================================================================== */}
            {currentStep === 0 && (
                <div className="space-y-6">
                    {/* Profile Photo Upload Card */}
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
                                    <div className="w-16 h-16 rounded-full bg-[#2D3F2C] text-white flex items-center justify-center font-bold text-lg shrink-0">
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
                                        <p className="text-[11px] font-mono text-[#265938] mt-1">
                                            {form.avatarMeta.fileName} (
                                            {formatFileSize(form.avatarMeta.fileSize)})
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="employee-avatar-upload"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
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
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                {form.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateField('avatarUrl', '');
                                            updateField('avatarMeta', undefined);
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
                                        <span className="font-bold text-[#2D3F2C]" dir="ltr">
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
                                            updateField('firstNameEn', e.target.value)
                                        }
                                        placeholder="e.g. Tariq"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.firstNameEn
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                            updateField('secondNameEn', e.target.value)
                                        }
                                        placeholder="e.g. Abdulaziz"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('thirdNameEn', e.target.value)
                                        }
                                        placeholder="e.g. Abdullah"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                        onChange={(e) => updateField('lastNameEn', e.target.value)}
                                        placeholder="e.g. Al-Mansoor"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.lastNameEn
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                        <span className="font-bold text-[#2D3F2C]" dir="rtl">
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
                                            updateField('firstNameAr', e.target.value)
                                        }
                                        placeholder="مثال: طارق"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.firstNameAr
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                            updateField('secondNameAr', e.target.value)
                                        }
                                        placeholder="مثال: عبدالعزيز"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('thirdNameAr', e.target.value)
                                        }
                                        placeholder="مثال: عبدالله"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                        onChange={(e) => updateField('lastNameAr', e.target.value)}
                                        placeholder="مثال: المنصور"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.lastNameAr
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="name@gmail.com"
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.email
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('workEmail', e.target.value)}
                                    placeholder="employee@awn.sa"
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.workEmail
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="+966 50 123 4567"
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.phone
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                        updateField('dobGregorian', greg);
                                        const approxHijri = gregorianToApproximateHijri(greg);
                                        if (approxHijri) {
                                            updateField('dobHijri', approxHijri);
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.dobGregorian
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                                updateField(
                                                    'dobHijri',
                                                    gregorianToApproximateHijri(form.dobGregorian)
                                                )
                                            }
                                            className="text-[10px] font-semibold text-[#2D3F2C] hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                                    onChange={(e) => updateField('dobHijri', e.target.value)}
                                    placeholder="1410/08/15"
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                        updateField('religionId', selectedId);
                                        updateField('religion', addon?.nameEn || '');
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.religionId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    {t('ums.employees.wizard.personal.gender')}
                                </label>
                                <select
                                    value={form.gender}
                                    onChange={(e) =>
                                        updateField('gender', e.target.value as Gender)
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                    {t('ums.employees.wizard.personal.maritalStatus')}
                                </label>
                                <select
                                    value={form.maritalStatus}
                                    onChange={(e) =>
                                        updateField(
                                            'maritalStatus',
                                            e.target.value as MaritalStatus
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                    {t('ums.employees.wizard.personal.citizenship')}
                                </label>
                                <select
                                    value={form.citizenship}
                                    onChange={(e) => {
                                        const nextCit = e.target.value as Citizenship;
                                        updateField('citizenship', nextCit);
                                        if (nextCit === 'Saudi') {
                                            updateField('nationality', 'Saudi Arabia');
                                        } else if (form.nationality === 'Saudi Arabia') {
                                            updateField('nationality', 'Egypt');
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                        updateField('nationality', nat);
                                        updateField(
                                            'citizenship',
                                            nat === 'Saudi Arabia' ? 'Saudi' : 'Non-Saudi'
                                        );
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.nationality
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
            {/* STEP 2: EMPLOYMENT INFORMATION                                      */}
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
                                    className="w-full px-3 py-2 rounded-lg bg-[#EFECE6]/60 border border-[#E5E0D8] text-xs font-mono font-bold text-[#2D3F2C] cursor-not-allowed"
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
                                        updateField('status', e.target.value as EmployeeStatus)
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                    onChange={(e) => updateField('branchId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.branchId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('departmentId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.departmentId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('designationId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.designationId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                        updateField('jobTitleId', jtId);
                                        updateField('jobTitleName', jt?.nameEn || '');
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                    onChange={(e) => updateField('roleId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.roleId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                {linkedSecurityGroup && (
                                    <p className="text-[11px] text-[#265938] mt-1 flex items-center gap-1">
                                        <ShieldCheck size={12} />
                                        <span>
                                            {t(
                                                'ums.employees.wizard.employment.linkedSecurityGroup'
                                            )}{' '}
                                            <strong>
                                                {isRtl
                                                    ? linkedSecurityGroup.nameAr
                                                    : linkedSecurityGroup.nameEn}
                                            </strong>{' '}
                                            ({linkedSecurityGroup.code})
                                        </span>
                                    </p>
                                )}
                                {errors.roleId && (
                                    <p className="text-[11px] text-[#DC2626] mt-1">
                                        {errors.roleId}
                                    </p>
                                )}
                            </div>

                            {/* Job Grade (Custom Addons) */}
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                    {t('ums.employees.wizard.employment.jobGrade')}{' '}
                                    <span className="text-[#DC2626]">*</span>
                                </label>
                                <select
                                    value={form.jobGradeId}
                                    onChange={(e) => updateField('jobGradeId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.jobGradeId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('managerId', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                        errors.managerId
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    onChange={(e) => updateField('joiningDate', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                        errors.joiningDate
                                            ? 'border-[#DC2626]'
                                            : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                    {t('ums.employees.wizard.employment.contractType')}
                                </label>
                                <select
                                    value={form.contractType}
                                    onChange={(e) => {
                                        const ct = e.target.value as ContractType;
                                        updateField('contractType', ct);
                                        if (ct === 'Probation') {
                                            updateField('isUnderProbation', true);
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                    {t('ums.employees.wizard.employment.employmentType')}
                                </label>
                                <select
                                    value={form.employmentType}
                                    onChange={(e) =>
                                        updateField(
                                            'employmentType',
                                            e.target.value as EmploymentType
                                        )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C] cursor-pointer"
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
                                        updateField('isUnderProbation', e.target.checked)
                                    }
                                    className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
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
                                        updateField(
                                            'probationPeriodDays',
                                            Math.max(0, Number(e.target.value) || 0)
                                        )
                                    }
                                    className="w-24 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#2D3F2C]"
                                />
                                <button
                                    type="button"
                                    onClick={() => updateField('probationPeriodDays', 90)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                                        form.probationPeriodDays === 90
                                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C]'
                                            : 'bg-white text-[#6E6862] border-[#E5E0D8] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {t('ums.employees.wizard.employment.probationPreset90')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateField('probationPeriodDays', 180)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                                        form.probationPeriodDays === 180
                                            ? 'bg-[#2D3F2C] text-white border-[#2D3F2C]'
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
            {/* STEP 3: COMPENSATION & REGULATORY DOCUMENTS                         */}
            {/* =================================================================== */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    {/* Sub-Section Segmented Filter Bar */}
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-2 shadow-2xs overflow-x-auto">
                        <div className="flex items-center gap-1 min-w-max">
                            {documentSubTabs.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveDocSubTab(tab)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        activeDocSubTab === tab
                                            ? 'bg-[#2D3F2C] text-white shadow-2xs'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                    {t(`ums.employees.wizard.documents.subTabs.${tab}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 1. SALARY DETAILS */}
                    {shouldShowDocSection('salary') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <div className="flex items-center gap-2">
                                    <Landmark size={16} className="text-[#2D3F2C]" />
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        {t('ums.employees.wizard.documents.salaryTitle')}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-[#6E6862]">
                                        {t('ums.employees.wizard.documents.calculatedGross')}:
                                    </span>
                                    <span
                                        className="font-mono font-bold text-sm text-[#265938]"
                                        dir="ltr"
                                    >
                                        {calculatedSalary.grossSalary.toLocaleString('en-US')} SAR
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                            updateField(
                                                'basicSalary',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.basicSalary
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                            updateField(
                                                'housingAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField(
                                                'transportationAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField(
                                                'foodAllowance',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField(
                                                'otherAllowances',
                                                Math.max(0, Number(e.target.value) || 0)
                                            )
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. NATIONAL ID / IQAMA & WORK PERMIT */}
                    {shouldShowDocSection('iqama') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.documents.iqamaTitle')}
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
                                                ? 'text-[#265938]'
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
                                            updateField('iqamaNumber', e.target.value)
                                        }
                                        placeholder="10XXXXXXXX / 24XXXXXXXX"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iqamaNumber
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                            updateField('iqamaProfession', e.target.value)
                                        }
                                        placeholder="e.g. Software Engineer"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('iqamaExpiryDate', e.target.value)
                                        }
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iqamaExpiryDate
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                            updateField('workPermitNumber', e.target.value)
                                        }
                                        placeholder="WP-2026-XXXX"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('workPermitExpiryDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('iqama')}
                        </div>
                    )}

                    {/* 3. BANK ACCOUNT & WPS */}
                    {shouldShowDocSection('bank') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.bankTitle')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                            updateField('bankId', bId);
                                            updateField('bankName', bank?.nameEn || '');
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs text-[#0D0D0D] focus:outline-none focus:bg-white cursor-pointer ${
                                            errors.bankId
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
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
                                                    {isRtl ? bank.nameAr : bank.nameEn} (
                                                    {bank.code})
                                                </option>
                                            ))}
                                    </select>
                                    {errors.bankId && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.bankId}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.accountHolderName')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.accountHolderName}
                                        onChange={(e) =>
                                            updateField('accountHolderName', e.target.value)
                                        }
                                        placeholder={composedNameEn || 'Account Holder Name'}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.iban')}{' '}
                                        <span className="text-[#DC2626]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.iban}
                                        onChange={(e) =>
                                            updateField('iban', e.target.value.toUpperCase())
                                        }
                                        placeholder="SA4480000000608010167519"
                                        className={`w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white ${
                                            errors.iban
                                                ? 'border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#2D3F2C]'
                                        }`}
                                    />
                                    {errors.iban && (
                                        <p className="text-[11px] text-[#DC2626] mt-1">
                                            {errors.iban}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.accountNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.accountNumber}
                                        onChange={(e) =>
                                            updateField('accountNumber', e.target.value)
                                        }
                                        placeholder="608010167519"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('account')}
                        </div>
                    )}

                    {/* 4. HEALTH INSURANCE */}
                    {shouldShowDocSection('health_insurance') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.healthInsuranceTitle')}
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
                                            updateField('healthInsuranceProvider', e.target.value)
                                        }
                                        placeholder="Bupa Arabia / Tawuniya"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthInsurancePolicy')}
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={form.healthInsurancePolicy}
                                        onChange={(e) =>
                                            updateField('healthInsurancePolicy', e.target.value)
                                        }
                                        placeholder="BUPA-99201-A"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthInsuranceClass')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.healthInsuranceClass}
                                        onChange={(e) =>
                                            updateField('healthInsuranceClass', e.target.value)
                                        }
                                        placeholder="VIP / Class A / Class B"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.healthInsuranceExpiry')}
                                    </label>
                                    <input
                                        type="date"
                                        dir="ltr"
                                        value={form.healthInsuranceExpiry}
                                        onChange={(e) =>
                                            updateField('healthInsuranceExpiry', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('health_insurance')}
                        </div>
                    )}

                    {/* 5. MUNICIPAL HEALTH CARD */}
                    {shouldShowDocSection('health_card') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.healthCardTitle')}
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
                                            updateField('healthCardNumber', e.target.value)
                                        }
                                        placeholder="HC-88401"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('healthCardAuthority', e.target.value)
                                        }
                                        placeholder="Riyadh Municipality"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('healthCardIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('healthCardExpiryDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('health_card')}
                        </div>
                    )}

                    {/* 6. PASSPORT DETAILS */}
                    {shouldShowDocSection('passport') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.passportTitle')}
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
                                            updateField(
                                                'passportNumber',
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="V8839201"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('passportIssueCountry', e.target.value)
                                        }
                                        placeholder="Saudi Arabia"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('passportIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('passportExpiry', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('passport')}
                        </div>
                    )}

                    {/* 7. VISA & BORDER ENTRY */}
                    {shouldShowDocSection('visa') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.visaTitle')}
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
                                        onChange={(e) => updateField('visaNumber', e.target.value)}
                                        placeholder="6092837411"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#0D0D0D] mb-1">
                                        {t('ums.employees.wizard.documents.visaType')}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.visaType}
                                        onChange={(e) => updateField('visaType', e.target.value)}
                                        placeholder="Work / Exit Re-Entry"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('visaBorderNumber', e.target.value)
                                        }
                                        placeholder="3099281726"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('visaIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                        onChange={(e) => updateField('visaExpiry', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('visa')}
                        </div>
                    )}

                    {/* 8. QIWA / EMPLOYMENT CONTRACT */}
                    {shouldShowDocSection('contract') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.contractTitle')}
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
                                            updateField('contractNumber', e.target.value)
                                        }
                                        placeholder="CNT-2026-001"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('contractStartDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('contractEndDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('contract')}
                        </div>
                    )}

                    {/* 9. DRIVING LICENSE */}
                    {shouldShowDocSection('driving_license') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.drivingLicenseTitle')}
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
                                            updateField('drivingLicenseNumber', e.target.value)
                                        }
                                        placeholder="DL-10293847"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('drivingLicenseType', e.target.value)
                                        }
                                        placeholder="Private / Public"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('drivingLicenseIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('drivingLicenseExpiry', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('driving_license')}
                        </div>
                    )}

                    {/* 10. GOSI & PROFESSIONAL SUBSCRIPTIONS */}
                    {shouldShowDocSection('subscription') && (
                        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs space-y-4">
                            <h3 className="text-sm font-bold text-[#0D0D0D] pb-2 border-b border-[#E5E0D8]">
                                {t('ums.employees.wizard.documents.subscriptionTitle')}
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
                                            updateField('gosiSubscriptionNumber', e.target.value)
                                        }
                                        placeholder="GOSI-88492011"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField(
                                                'professionalSubscriptionNumber',
                                                e.target.value
                                            )
                                        }
                                        placeholder="SCE-554019"
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('subscriptionIssueDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
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
                                            updateField('subscriptionExpiryDate', e.target.value)
                                        }
                                        className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:outline-none focus:bg-white focus:border-[#2D3F2C]"
                                    />
                                </div>
                            </div>

                            {renderDocumentAttachmentControl('subscription')}
                        </div>
                    )}
                </div>
            )}

            {/* =================================================================== */}
            {/* STEP 4: DEPENDENTS & FINAL REVIEW                                   */}
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
                                onClick={handleAddDependent}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
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
                                                <span className="text-xs font-bold text-[#2D3F2C]">
                                                    {t(
                                                        'ums.employees.wizard.dependents.dependentCardTitle',
                                                        { index: idx + 1 }
                                                    )}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDependent(idx)}
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
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
                                                            handleUpdateDependent(
                                                                idx,
                                                                'idExpiryDate',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                                    />
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
                                                            handleUpdateDependent(
                                                                idx,
                                                                'passportNumber',
                                                                e.target.value.toUpperCase()
                                                            )
                                                        }
                                                        placeholder="Passport No."
                                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Insurance Included & Dependent Document Upload */}
                                            <div className="pt-2 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={dep.insuranceIncluded}
                                                        onChange={(e) =>
                                                            handleUpdateDependent(
                                                                idx,
                                                                'insuranceIncluded',
                                                                e.target.checked
                                                            )
                                                        }
                                                        className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                                    />
                                                    <span className="text-xs font-semibold text-[#0D0D0D]">
                                                        {t(
                                                            'ums.employees.wizard.dependents.insuranceIncluded'
                                                        )}
                                                    </span>
                                                </label>

                                                <div className="flex items-center gap-2">
                                                    {dep.documentAttachment && (
                                                        <span className="text-xs font-semibold text-[#265938] inline-flex items-center gap-1">
                                                            <FileCheck2 size={13} />
                                                            {dep.documentAttachment.fileName}
                                                        </span>
                                                    )}
                                                    <label
                                                        htmlFor={depDocId}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] cursor-pointer"
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
                                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                                        onChange={(e) =>
                                                            handleDependentDocUpload(idx, e)
                                                        }
                                                        className="hidden"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Onboarding & Profile Readiness Summary */}
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
                            <span className="font-mono text-sm font-bold text-[#265938]">
                                {liveCompletion.percentage}% ({liveCompletion.completedCount}/
                                {liveCompletion.totalCount})
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#857E74] block">
                                    {t('ums.employees.wizard.dependents.totalDependents')}
                                </span>
                                <span className="font-mono text-base font-bold text-[#0D0D0D] mt-0.5 block">
                                    {form.dependents.length}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#857E74] block">
                                    {t('ums.employees.wizard.dependents.insuredDependents')}
                                </span>
                                <span className="font-mono text-base font-bold text-[#265938] mt-0.5 block">
                                    {form.dependents.filter((d) => d.insuranceIncluded).length}
                                </span>
                            </div>

                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                                <span className="text-[11px] text-[#857E74] block">
                                    {t('ums.employees.wizard.dependents.grossMonthlyPackage')}
                                </span>
                                <span
                                    className="font-mono text-base font-bold text-[#2D3F2C] mt-0.5 block"
                                    dir="ltr"
                                >
                                    {calculatedSalary.grossSalary.toLocaleString('en-US')} SAR
                                </span>
                            </div>
                        </div>

                        {(isRtl
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
                            <label className="inline-flex items-center gap-2.5 pt-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.sendInviteOnSave}
                                    onChange={(e) =>
                                        updateField('sendInviteOnSave', e.target.checked)
                                    }
                                    className="rounded border-[#E5E0D8] text-[#2D3F2C] focus:ring-[#2D3F2C] cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-[#0D0D0D]">
                                    {t('ums.employees.wizard.sendInviteOnSave')}
                                </span>
                            </label>
                        )}
                    </div>
                </div>
            )}

            {/* WIZARD FOOTER NAVIGATION BAR */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                            <span>{t('ums.employees.wizard.prevStep')}</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleSaveEmployee(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#2D3F2C] transition-colors cursor-pointer"
                    >
                        <Save size={14} />
                        <span>{t('ums.employees.wizard.saveAsDraft')}</span>
                    </button>

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <span>{t('ums.employees.wizard.nextStep')}</span>
                            {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleSaveEmployee(false)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#265938] hover:bg-[#1B4D3E] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <Check size={14} />
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

export const UmsEmployeeNewPage = UmsEmployeeWizardPage;
export const UmsEmployeeEditPage = UmsEmployeeWizardPage;

export default UmsEmployeeWizardPage;
