import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Save } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { umsApi } from '../../api/api';
import {
    EmployeeForm,
    type WizardStepIndex,
    type DocumentSubTab,
    type EmployeeWizardFormState,
} from '../../components/ums/EmployeeForm';
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
    type EmployeeDependent,
    type EmployeeDocumentCategory,
    type EmployeeDocumentAttachment,
} from './umsMockData';

function formatSaudiIban(raw: string): string {
    const cleaned = raw.replace(/\s+/g, '').toUpperCase();
    if (!cleaned) return '';
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

export { EmployeeForm } from '../../components/ums/EmployeeForm';
export type {
    WizardStepIndex,
    DocumentSubTab,
    EmployeeWizardFormState,
    EmployeeFormProps,
} from '../../components/ums/EmployeeForm';

export const UmsEmployeeWizardPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language?.startsWith('ar');
    const currentUser = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    // Master datasets loaded via TanStack Query + umsApi with synchronous localStorage initialData
    const { data: employees = [] } = useQuery({
        queryKey: ['ums', 'employees'],
        queryFn: async () => {
            const res = await umsApi.listEmployees();
            return res.ok && res.data ? res.data : loadEmployees();
        },
        initialData: () => loadEmployees(),
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['ums', 'departments'],
        queryFn: async () => {
            const res = await umsApi.listDepartments();
            return res.ok && res.data ? res.data : loadDepartments();
        },
        initialData: () => loadDepartments(),
    });
    const { data: designations = [] } = useQuery({
        queryKey: ['ums', 'designations'],
        queryFn: async () => umsApi.listDesignations(),
        initialData: () => loadDesignations(),
    });
    const { data: branches = [] } = useQuery({
        queryKey: ['ums', 'branches'],
        queryFn: async () => umsApi.listBranches(),
        initialData: () => loadBranches(),
    });
    const { data: roles = [] } = useQuery({
        queryKey: ['ums', 'roles'],
        queryFn: async () => umsApi.listRoles(),
        initialData: () => loadRoles(),
    });
    const { data: securityGroups = [] } = useQuery({
        queryKey: ['ums', 'securityGroups'],
        queryFn: async () => umsApi.listSecurityGroups(),
        initialData: () => loadSecurityGroups(),
    });
    const { data: customAddons = [] } = useQuery({
        queryKey: ['ums', 'customAddons'],
        queryFn: async () => umsApi.listCustomAddons(),
        initialData: () => loadCustomAddons(),
    });

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

    const saveEmployeeMutation = useMutation({
        mutationFn: async (record: EmployeeRecord) => {
            const currentEmployees = loadEmployees();
            const updatedEmployees = isEditMode
                ? currentEmployees.map((emp) => (emp.id === record.id ? record : emp))
                : [record, ...currentEmployees];
            saveEmployees(updatedEmployees);
            syncMasterEntityEmployeeCounts(updatedEmployees);
            return umsApi.upsertEmployee(record);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ums'] });
        },
    });

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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] text-white text-xs font-semibold hover:bg-[#223121] transition-colors cursor-pointer"
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

    const handleRemoveDependentDoc = (index: number) => {
        handleUpdateDependent(index, 'documentAttachment', undefined);
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

    const handleFormatIban = () => {
        if (form.iban.trim()) {
            updateField('iban', formatSaudiIban(form.iban));
        }
    };

    const handleCancel = () => {
        navigate(
            isEditMode && existingEmployee
                ? `/ums/employees/${existingEmployee.id}`
                : '/ums/employees'
        );
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
                        else if (stepErrs.bankId || stepErrs.iban) setActiveDocSubTab('account');
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

        saveEmployeeMutation.mutate(syncedRecord);

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

    return (
        <div className="space-y-6 text-start pb-10">
            {/* TOP HEADER BAR */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="mt-0.5 p-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#0D0D0D] transition-colors cursor-pointer shadow-2xs"
                        title={t('ums.employees.actions.backToList')}
                    >
                        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                    </button>

                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6862]">
                            <span className="font-mono font-bold text-[#037F8C]" dir="ltr">
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
                            <span className="font-semibold text-[#037F8C]">
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
                        onClick={handleCancel}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] transition-colors cursor-pointer"
                    >
                        <span>{t('ums.employees.wizard.cancel')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSaveEmployee(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer"
                    >
                        <Save size={14} />
                        <span>{t('ums.employees.wizard.saveAsDraft')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSaveEmployee(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
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

            {/* Standalone Employee Form Component */}
            <EmployeeForm
                isEditMode={isEditMode}
                form={form}
                errors={errors}
                currentStep={currentStep}
                highestVisitedStep={highestVisitedStep}
                activeDocSubTab={activeDocSubTab}
                uploadFeedback={uploadFeedback}
                composedNameEn={composedNameEn}
                composedNameAr={composedNameAr}
                calculatedSalary={calculatedSalary}
                calculatedIqamaStatus={calculatedIqamaStatus}
                liveCompletionPercentage={liveCompletion.percentage}
                liveCompletion={liveCompletion}
                departments={departments}
                designations={designations}
                branches={branches}
                roles={roles}
                linkedSecurityGroup={linkedSecurityGroup}
                eligibleManagers={eligibleManagers}
                religionAddons={religionAddons}
                jobTitleAddons={jobTitleAddons}
                jobGradeAddons={jobGradeAddons}
                bankAddons={bankAddons}
                isSubmitting={saveEmployeeMutation.isPending}
                onUpdateField={updateField}
                onStepClick={handleStepClick}
                onNextStep={handleNextStep}
                onPrevStep={handlePrevStep}
                onActiveDocSubTabChange={setActiveDocSubTab}
                onClearUploadFeedback={() => setUploadFeedback(null)}
                onAvatarUpload={handleAvatarUpload}
                onDocumentUpload={handleDocumentUpload}
                onRemoveDocument={handleRemoveDocument}
                onFormatIban={handleFormatIban}
                onAddDependent={handleAddDependent}
                onUpdateDependent={handleUpdateDependent}
                onDependentDocUpload={handleDependentDocUpload}
                onRemoveDependentDoc={handleRemoveDependentDoc}
                onRemoveDependent={handleRemoveDependent}
                onSave={handleSaveEmployee}
                onCancel={handleCancel}
            />
        </div>
    );
};

export const UmsEmployeeNewPage = UmsEmployeeWizardPage;
export const UmsEmployeeEditPage = UmsEmployeeWizardPage;

export default UmsEmployeeWizardPage;
