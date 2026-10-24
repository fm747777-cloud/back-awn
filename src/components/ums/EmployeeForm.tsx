import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Briefcase, Check, FileText, HeartHandshake, Save, User } from "lucide-react";
import { toast } from "sonner";

import { authApi, umsApi, userApi } from "../../api/api";

const emptyToUndefined = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());

const optionalEmail = z.preprocess(emptyToUndefined, z.string().trim().email("البريد الإلكتروني غير صالح").optional());

const optionalUuid = (message: string) => {
    return z.preprocess(emptyToUndefined, z.string().uuid(message).optional());
};

const optionalDate = (message: string) => {
    return z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message).optional());
};

const optionalNumber = (message: string) => {
    return z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        return Number(value);
    }, z.number({ message }).finite(message).optional());
};

const optionalBoolean = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return value;
}, z.boolean({ message: "القيمة غير صالحة" }).optional());

export const createEmployeeContractSchema = z.object({
    department_id: optionalUuid("معرف القسم غير صالح"),
    designation_id: optionalUuid("معرف المسمى الوظيفي غير صالح"),
    reportingTo_id: optionalUuid("معرف المدير المباشر غير صالح"),
    branch_id: optionalUuid("معرف الفرع غير صالح"),
    role_id: optionalUuid("معرف الدور غير صالح"),

    email: optionalEmail,
    personal_email: optionalEmail,
    phone_number: optionalString,

    first_name_Ar: optionalString,
    first_name_En: optionalString,
    last_name_Ar: optionalString,
    last_name_En: optionalString,
    secend_name_Ar: optionalString,
    secend_name_En: optionalString,

    job_title: optionalString,
    joining_date: optionalDate("تاريخ الانضمام غير صالح"),
    job_grade: optionalString,
    contract_type: optionalString,
    probation_period: optionalString,
    employment_type: optionalString,

    basic_pay: optionalNumber("الراتب الأساسي يجب أن يكون رقمًا"),
    housing_allows: optionalNumber("بدل السكن يجب أن يكون رقمًا"),
    transport_allows: optionalNumber("بدل المواصلات يجب أن يكون رقمًا"),
    food_allows: optionalNumber("بدل الطعام يجب أن يكون رقمًا"),
    other_allows: optionalNumber("البدلات الأخرى يجب أن تكون رقمًا"),
    gross_salary: optionalNumber("إجمالي الراتب يجب أن يكون رقمًا"),
    net_salary: optionalNumber("صافي الراتب يجب أن يكون رقمًا"),

    iqama_profession: optionalString,
    iqama_ID: optionalString,
    iqama_ID_expiry: optionalDate("تاريخ انتهاء الإقامة غير صالح"),
    work_permit_no: optionalNumber("رقم تصريح العمل يجب أن يكون رقمًا"),
    work_permit_expiry: optionalDate("تاريخ انتهاء تصريح العمل غير صالح"),
    iqama_url_front: optionalString,
    iqama_url_back: optionalString,

    bank_name: optionalString,
    account_holder_name: optionalString,
    IBAN_number: optionalNumber("رقم IBAN يجب أن يكون رقمًا"),
    IFSC_code: optionalString,

    health_insurance: optionalString,
    health_insurance_number: optionalString,
    insurance_expiry: optionalDate("تاريخ انتهاء التأمين غير صالح"),
    health_card: optionalBoolean,
    health_card_number: optionalString,
    health_card_expiry: optionalDate("تاريخ انتهاء البطاقة الصحية غير صالح"),

    passport_number: optionalString,
    passport_expiry: optionalDate("تاريخ انتهاء جواز السفر غير صالح"),
    passport_issue: optionalDate("تاريخ إصدار جواز السفر غير صالح"),
    place_of_issue: optionalString,

    visa_number: optionalString,
    visa_expiry: optionalDate("تاريخ انتهاء التأشيرة غير صالح"),
    visa_issue: optionalDate("تاريخ إصدار التأشيرة غير صالح"),
    visa_type: optionalString,

    contract_number: optionalString,
    contract_end: optionalDate("تاريخ انتهاء العقد غير صالح"),

    driving_license_number: optionalString,
    driving_license_validity: optionalString,

    GOSI_registration: optionalBoolean,
    GOSI_registration_number: optionalNumber("رقم تسجيل GOSI يجب أن يكون رقمًا"),
    mudad_registration: optionalBoolean,
    mudad_registration_number: optionalNumber("رقم تسجيل مدد يجب أن يكون رقمًا"),

    nationality: optionalString,
    religion: optionalString,
    gender: optionalString,
    maritalStatus: optionalString,
    dependents: optionalBoolean,
});

export type CreateEmployeeContractInput = z.input<typeof createEmployeeContractSchema>;
export type CreateEmployeeContractPayload = z.output<typeof createEmployeeContractSchema>;

type WizardStepIndex = 0 | 1 | 2 | 3;

type DocumentTab =
    | "salary"
    | "iqama"
    | "bank"
    | "health"
    | "passport"
    | "visa"
    | "contract"
    | "driving"
    | "subscription";

interface FieldConfig {
    name: keyof CreateEmployeeContractInput;
    label: string;
    type?: "text" | "email" | "number" | "date" | "boolean";
    placeholder?: string;
    step?: string;
}

interface FormInputProps {
    field: FieldConfig;
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    disabled: boolean;
}

export type EmployeeFormMode = "create" | "view" | "update";

export interface EmployeeFormProps {
    isOpen: boolean;
    mode: EmployeeFormMode;
    employee?: any | null;
    onClose: () => void;
    onSuccess?: () => void;
    onModeChange?: (mode: EmployeeFormMode) => void;
}

const extractItems = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.results)) return response.data.results;
    return [];
};

const toDateInput = (value: unknown): string | undefined => {
    if (!value) return undefined;
    const dateValue = String(value);
    return dateValue.length >= 10 ? dateValue.slice(0, 10) : undefined;
};

const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message || error?.message;
    return Array.isArray(message) ? message.join(", ") : message || fallback;
};

const getUserName = (item: any): string => {
    const englishName = [
        item?.userAttach?.first_name_En,
        item?.userAttach?.secend_name_En,
        item?.userAttach?.last_name_En,
    ].filter(Boolean).join(" ");

    const arabicName = [
        item?.userAttach?.first_name_Ar,
        item?.userAttach?.secend_name_Ar,
        item?.userAttach?.last_name_Ar,
    ].filter(Boolean).join(" ");

    return englishName || arabicName || item?.email || item?.personal_email || String(item?.id || "");
};

const FormInput: React.FC<FormInputProps> = ({ field, register, errors, disabled }) => {
    const fieldError = errors[field.name];
    const errorMessage = typeof fieldError?.message === "string" ? fieldError.message : undefined;

    if (field.type === "boolean") {
        return (
            <div>
                <label htmlFor={String(field.name)} className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                    {field.label}
                </label>

                <select
                    id={String(field.name)}
                    disabled={disabled}
                    {...register(field.name)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none focus:border-[#037F8C] focus:ring-1 focus:ring-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50 ${errorMessage ? "border-[#DC2626]" : "border-[#E5E0D8]"}`}
                >
                    <option value="">غير محدد</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                </select>

                {errorMessage && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{errorMessage}</p>}
            </div>
        );
    }

    return (
        <div>
            <label htmlFor={String(field.name)} className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                {field.label}
            </label>

            <input
                id={String(field.name)}
                type={field.type || "text"}
                step={field.step}
                disabled={disabled}
                placeholder={field.placeholder}
                {...register(field.name)}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] placeholder-[#857E74] outline-none focus:border-[#037F8C] focus:ring-1 focus:ring-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50 ${errorMessage ? "border-[#DC2626]" : "border-[#E5E0D8]"}`}
            />

            {errorMessage && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{errorMessage}</p>}
        </div>
    );
};

const PERSONAL_FIELDS: FieldConfig[] = [
    { name: "first_name_En", label: "الاسم الأول بالإنجليزية" },
    { name: "secend_name_En", label: "الاسم الثاني بالإنجليزية" },
    { name: "last_name_En", label: "اسم العائلة بالإنجليزية" },
    { name: "first_name_Ar", label: "الاسم الأول بالعربية" },
    { name: "secend_name_Ar", label: "الاسم الثاني بالعربية" },
    { name: "last_name_Ar", label: "اسم العائلة بالعربية" },
    { name: "email", label: "البريد الإلكتروني للعمل", type: "email", placeholder: "employee@company.com" },
    { name: "personal_email", label: "البريد الإلكتروني الشخصي", type: "email", placeholder: "personal@example.com" },
    { name: "phone_number", label: "رقم الهاتف", placeholder: "05xxxxxxxx" },
    { name: "nationality", label: "الجنسية" },
    { name: "religion", label: "الديانة" },
];

const EMPLOYMENT_FIELDS: FieldConfig[] = [
    { name: "job_title", label: "المسمى الوظيفي النصي" },
    { name: "joining_date", label: "تاريخ الانضمام", type: "date" },
    { name: "job_grade", label: "الدرجة الوظيفية" },
    { name: "contract_type", label: "نوع العقد" },
    { name: "probation_period", label: "فترة التجربة" },
    { name: "employment_type", label: "نوع التوظيف" },
];

const SALARY_FIELDS: FieldConfig[] = [
    { name: "basic_pay", label: "الراتب الأساسي", type: "number", step: "0.01" },
    { name: "housing_allows", label: "بدل السكن", type: "number", step: "0.01" },
    { name: "transport_allows", label: "بدل المواصلات", type: "number", step: "0.01" },
    { name: "food_allows", label: "بدل الطعام", type: "number", step: "0.01" },
    { name: "other_allows", label: "البدلات الأخرى", type: "number", step: "0.01" },
    { name: "gross_salary", label: "إجمالي الراتب", type: "number", step: "0.01" },
    { name: "net_salary", label: "صافي الراتب", type: "number", step: "0.01" },
];

const IQAMA_FIELDS: FieldConfig[] = [
    { name: "iqama_ID", label: "رقم الإقامة" },
    { name: "iqama_profession", label: "مهنة الإقامة" },
    { name: "iqama_ID_expiry", label: "تاريخ انتهاء الإقامة", type: "date" },
    { name: "work_permit_no", label: "رقم تصريح العمل", type: "number" },
    { name: "work_permit_expiry", label: "تاريخ انتهاء تصريح العمل", type: "date" },
    { name: "iqama_url_front", label: "رابط صورة الإقامة الأمامية" },
    { name: "iqama_url_back", label: "رابط صورة الإقامة الخلفية" },
];

const BANK_FIELDS: FieldConfig[] = [
    { name: "bank_name", label: "اسم البنك" },
    { name: "account_holder_name", label: "اسم صاحب الحساب" },
    { name: "IBAN_number", label: "رقم IBAN", type: "number" },
    { name: "IFSC_code", label: "كود IFSC" },
];

const HEALTH_FIELDS: FieldConfig[] = [
    { name: "health_insurance", label: "فئة أو شركة التأمين الصحي" },
    { name: "health_insurance_number", label: "رقم التأمين الصحي" },
    { name: "insurance_expiry", label: "تاريخ انتهاء التأمين", type: "date" },
    { name: "health_card", label: "يمتلك بطاقة صحية", type: "boolean" },
    { name: "health_card_number", label: "رقم البطاقة الصحية" },
    { name: "health_card_expiry", label: "تاريخ انتهاء البطاقة الصحية", type: "date" },
];

const PASSPORT_FIELDS: FieldConfig[] = [
    { name: "passport_number", label: "رقم جواز السفر" },
    { name: "passport_issue", label: "تاريخ إصدار جواز السفر", type: "date" },
    { name: "passport_expiry", label: "تاريخ انتهاء جواز السفر", type: "date" },
    { name: "place_of_issue", label: "مكان الإصدار" },
];

const VISA_FIELDS: FieldConfig[] = [
    { name: "visa_number", label: "رقم التأشيرة" },
    { name: "visa_type", label: "نوع التأشيرة" },
    { name: "visa_issue", label: "تاريخ إصدار التأشيرة", type: "date" },
    { name: "visa_expiry", label: "تاريخ انتهاء التأشيرة", type: "date" },
];

const CONTRACT_FIELDS: FieldConfig[] = [
    { name: "contract_number", label: "رقم العقد" },
    { name: "contract_end", label: "تاريخ انتهاء العقد", type: "date" },
];

const DRIVING_FIELDS: FieldConfig[] = [
    { name: "driving_license_number", label: "رقم رخصة القيادة" },
    { name: "driving_license_validity", label: "صلاحية رخصة القيادة" },
];

const SUBSCRIPTION_FIELDS: FieldConfig[] = [
    { name: "GOSI_registration", label: "مسجل في GOSI", type: "boolean" },
    { name: "GOSI_registration_number", label: "رقم تسجيل GOSI", type: "number" },
    { name: "mudad_registration", label: "مسجل في مدد", type: "boolean" },
    { name: "mudad_registration_number", label: "رقم تسجيل مدد", type: "number" },
];

const DOCUMENT_TABS: Array<{ id: DocumentTab; label: string }> = [
    { id: "salary", label: "الراتب" },
    { id: "iqama", label: "الإقامة" },
    { id: "bank", label: "البنك" },
    { id: "health", label: "التأمين الصحي" },
    { id: "passport", label: "جواز السفر" },
    { id: "visa", label: "التأشيرة" },
    { id: "contract", label: "العقد" },
    { id: "driving", label: "رخصة القيادة" },
    { id: "subscription", label: "الاشتراكات" },
];

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, mode, employee = null, onClose, onSuccess, onModeChange }) => {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();
    const id = employee?.id ? String(employee.id) : undefined;
    // console.log('employee', employee);

    const isRtl = i18n.dir() === "rtl" || i18n.language?.startsWith("ar");
    const isViewMode = mode === "view";
    const isUpdateMode = mode === "update";

    const [currentStep, setCurrentStep] = useState<WizardStepIndex>(0);
    const [highestVisitedStep, setHighestVisitedStep] = useState<WizardStepIndex>(mode === "create" ? 0 : 3);
    const [activeDocumentTab, setActiveDocumentTab] = useState<DocumentTab>("salary");

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreateEmployeeContractInput, any, CreateEmployeeContractPayload>({
        resolver: zodResolver(createEmployeeContractSchema),
        defaultValues: {
            gender: "",
            maritalStatus: "",
            dependents: false,
            GOSI_registration: false,
            mudad_registration: false,
            health_card: false,
        },
    });

    useEffect(() => {
        if (!isOpen) return;

        setCurrentStep(0);
        setActiveDocumentTab("salary");

        if (mode === "create") {
            reset({ gender: "", maritalStatus: "", dependents: false, GOSI_registration: false, mudad_registration: false, health_card: false });
            setHighestVisitedStep(0);
            return;
        }

        reset({});

        setValue("department_id", employee?.employeeContract?.department?.id ?? "");
        setValue("designation_id", employee?.employeeContract?.designation?.id ?? "");
        setValue("reportingTo_id", employee?.employeeContract?.reportingTo?.id ?? "");
        setValue("branch_id", employee?.branch?.id ?? "");
        setValue("role_id", employee?.role?.id ?? "");

        setValue("email", employee?.email ?? "");
        setValue("personal_email", employee?.personal_email ?? "");
        setValue("phone_number", employee?.phone_number ?? "");

        setValue("first_name_Ar", employee?.userAttach?.first_name_Ar ?? "");
        setValue("first_name_En", employee?.userAttach?.first_name_En ?? "");
        setValue("last_name_Ar", employee?.userAttach?.last_name_Ar ?? "");
        setValue("last_name_En", employee?.userAttach?.last_name_En ?? "");
        setValue("secend_name_Ar", employee?.userAttach?.secend_name_Ar ?? "");
        setValue("secend_name_En", employee?.userAttach?.secend_name_En ?? "");
        setValue("nationality", employee?.userAttach?.nationality ?? "");
        setValue("religion", employee?.userAttach?.religion ?? "");
        setValue("gender", employee?.userAttach?.gender ?? "");
        setValue("maritalStatus", employee?.userAttach?.marital_status ?? "");
        setValue("dependents", Boolean(employee?.employeeContract?.dependents ?? employee?.dependents ?? false));

        setValue("job_title", employee?.employeeContract?.job_title ?? "");
        setValue("joining_date", toDateInput(employee?.employeeContract?.joining_date) ?? "");
        setValue("job_grade", employee?.employeeContract?.job_grade ?? "");
        setValue("contract_type", employee?.employeeContract?.contract_type ?? "");
        setValue("probation_period", employee?.employeeContract?.probation_period ?? "");
        setValue("employment_type", employee?.employeeContract?.employment_type ?? "");

        setValue("basic_pay", employee?.employeeContract?.basic_pay ?? "");
        setValue("housing_allows", employee?.employeeContract?.housing_allows ?? "");
        setValue("transport_allows", employee?.employeeContract?.transport_allows ?? "");
        setValue("food_allows", employee?.employeeContract?.food_allows ?? "");
        setValue("other_allows", employee?.employeeContract?.other_allows ?? "");
        setValue("gross_salary", employee?.employeeContract?.gross_salary ?? "");
        setValue("net_salary", employee?.employeeContract?.net_salary ?? "");

        setValue("iqama_profession", employee?.employeeContract?.iqama_profession ?? "");
        setValue("iqama_ID", employee?.employeeContract?.iqama_ID ?? "");
        setValue("iqama_ID_expiry", toDateInput(employee?.employeeContract?.iqama_ID_expiry) ?? "");
        setValue("work_permit_no", employee?.employeeContract?.work_permit_no ?? "");
        setValue("work_permit_expiry", toDateInput(employee?.employeeContract?.work_permit_expiry) ?? "");
        setValue("iqama_url_front", employee?.employeeContract?.iqama_url_front ?? "");
        setValue("iqama_url_back", employee?.employeeContract?.iqama_url_back ?? "");

        setValue("bank_name", employee?.employeeContract?.bank_name ?? "");
        setValue("account_holder_name", employee?.employeeContract?.account_holder_name ?? "");
        setValue("IBAN_number", employee?.employeeContract?.IBAN_number ?? "");
        setValue("IFSC_code", employee?.employeeContract?.IFSC_code ?? "");

        setValue("health_insurance", employee?.employeeContract?.health_insurance ?? "");
        setValue("health_insurance_number", employee?.employeeContract?.health_insurance_number ?? "");
        setValue("insurance_expiry", toDateInput(employee?.employeeContract?.insurance_expiry) ?? "");
        setValue("health_card", Boolean(employee?.employeeContract?.health_card));
        setValue("health_card_number", employee?.employeeContract?.health_card_number ?? "");
        setValue("health_card_expiry", toDateInput(employee?.employeeContract?.health_card_expiry) ?? "");

        setValue("passport_number", employee?.employeeContract?.passport_number ?? "");
        setValue("passport_expiry", toDateInput(employee?.employeeContract?.passport_expiry) ?? "");
        setValue("passport_issue", toDateInput(employee?.employeeContract?.passport_issue) ?? "");
        setValue("place_of_issue", employee?.employeeContract?.place_of_issue ?? "");

        setValue("visa_number", employee?.employeeContract?.visa_number ?? "");
        setValue("visa_expiry", toDateInput(employee?.employeeContract?.visa_expiry) ?? "");
        setValue("visa_issue", toDateInput(employee?.employeeContract?.visa_issue) ?? "");
        setValue("visa_type", employee?.employeeContract?.visa_type ?? "");

        setValue("contract_number", employee?.employeeContract?.contract_number ?? "");
        setValue("contract_end", toDateInput(employee?.employeeContract?.contract_end) ?? "");
        setValue("driving_license_number", employee?.employeeContract?.driving_license_number ?? "");
        setValue("driving_license_validity", employee?.employeeContract?.driving_license_validity ?? "");

        setValue("GOSI_registration", Boolean(employee?.employeeContract?.GOSI_registration));
        setValue("GOSI_registration_number", employee?.employeeContract?.GOSI_registration_number ?? "");
        setValue("mudad_registration", Boolean(employee?.employeeContract?.mudad_registration));
        setValue("mudad_registration_number", employee?.employeeContract?.mudad_registration_number ?? "");
        setHighestVisitedStep(3);
    }, [isOpen, mode, employee, reset, setValue]);

    const { data: departmentsResponse, isLoading: isLoadingDepartments } = useQuery({
        queryKey: ["employee-form", "departments"],
        queryFn: () => umsApi.getDepartments({ page: 1, limit: 100 }),
    });

    const { data: designationsResponse, isLoading: isLoadingDesignations } = useQuery({
        queryKey: ["employee-form", "designations"],
        queryFn: () => umsApi.getDesignations({ page: 1, limit: 100 }),
    });

    const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
        queryKey: ["employee-form", "roles"],
        queryFn: () => umsApi.getRoles({ page: 1, limit: 100 }),
    });

    const { data: branchesResponse, isLoading: isLoadingBranches } = useQuery({
        queryKey: ["employee-form", "branches"],
        queryFn: () => umsApi.getBranchs({ page: 1, limit: 100 }),
    });

    const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["employee-form", "users"],
        queryFn: () => userApi.getUsers({ page: 1, limit: 100 }),
    });

    const departments = useMemo(() => extractItems(departmentsResponse), [departmentsResponse]);
    const designations = useMemo(() => extractItems(designationsResponse), [designationsResponse]);
    const roles = useMemo(() => extractItems(rolesResponse), [rolesResponse]);
    const branches = useMemo(() => extractItems(branchesResponse), [branchesResponse]);
    const reportingUsers = useMemo(() => extractItems(usersResponse), [usersResponse]);

    const basicPay = Number(watch("basic_pay") || 0);
    const housingAllowance = Number(watch("housing_allows") || 0);
    const transportAllowance = Number(watch("transport_allows") || 0);
    const foodAllowance = Number(watch("food_allows") || 0);
    const otherAllowance = Number(watch("other_allows") || 0);

    const calculatedGrossSalary = basicPay + housingAllowance + transportAllowance + foodAllowance + otherAllowance;

    const createMutation = useMutation({
        mutationFn: (data: CreateEmployeeContractPayload) => authApi.createEmployee(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "employees"] });
            await queryClient.invalidateQueries({ queryKey: ["employee-form", "users"] });

            toast.success(t("ums.employees.feedback.created", { defaultValue: "تم إنشاء الموظف بنجاح" }));
            onSuccess?.();
            onClose();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "حدث خطأ أثناء إنشاء الموظف" })));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: CreateEmployeeContractPayload) => {
            if (!id) throw new Error("معرف الموظف غير موجود");
            return userApi.updateEmployee(id, data);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["ums", "employees"] });
            await queryClient.invalidateQueries({ queryKey: ["employee-form", "employee", id] });
            await queryClient.invalidateQueries({ queryKey: ["ums", "employee", id] });

            toast.success(t("ums.employees.feedback.updated", { defaultValue: "تم تحديث بيانات الموظف بنجاح" }));
            onSuccess?.();
            onClose();
        },
        onError: (error: any) => {
            toast.error(getErrorMessage(error, t("common.somethingWentWrong", { defaultValue: "حدث خطأ أثناء تحديث الموظف" })));
        },
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;
    const isFormDisabled = isViewMode || isSaving;
    const pageTitle = mode === "create" ? "إضافة موظف جديد" : mode === "update" ? "تعديل بيانات الموظف" : "عرض بيانات الموظف";
    const pageDescription = mode === "create" ? "أدخل بيانات الموظف والعقد ثم راجع البيانات قبل الحفظ." : mode === "update" ? "عدّل بيانات الموظف والعقد ثم احفظ التغييرات." : "عرض بيانات الموظف والعقد دون إمكانية التعديل.";

    const steps = [
        {
            index: 0 as WizardStepIndex,
            title: "البيانات الشخصية",
            description: "بيانات الموظف الأساسية وبيانات التواصل",
            icon: User,
        },
        {
            index: 1 as WizardStepIndex,
            title: "البيانات الوظيفية",
            description: "القسم والمسمى والفرع والعقد",
            icon: Briefcase,
        },
        {
            index: 2 as WizardStepIndex,
            title: "الوثائق والبيانات المالية",
            description: "الراتب والإقامة والبنك والتأمين",
            icon: FileText,
        },
        {
            index: 3 as WizardStepIndex,
            title: "المراجعة والخيارات",
            description: "مراجعة البيانات وحفظ الموظف",
            icon: HeartHandshake,
        },
    ];

    const handleStepClick = (step: WizardStepIndex) => {
        if (step <= highestVisitedStep) {
            setCurrentStep(step);
        }
    };

    const handleNext = (event?: React.MouseEvent<HTMLButtonElement>) => {
        event?.preventDefault();
        event?.stopPropagation();

        if (currentStep >= 3) return;

        const nextStep = (currentStep + 1) as WizardStepIndex;

        setCurrentStep(nextStep);
        setHighestVisitedStep((previous) => Math.max(previous, nextStep) as WizardStepIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePrevious = () => {
        if (currentStep <= 0) return;

        setCurrentStep((currentStep - 1) as WizardStepIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderFields = (fields: FieldConfig[]) => {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                    <FormInput key={String(field.name)} field={field} register={register} errors={errors} disabled={isFormDisabled} />
                ))}
            </div>
        );
    };

    const renderApiSelect = (
        name: "department_id" | "designation_id" | "reportingTo_id" | "branch_id" | "role_id",
        label: string,
        options: any[],
        loading: boolean,
    ) => {
        const error = errors[name];
        const errorMessage = typeof error?.message === "string" ? error.message : undefined;

        return (
            <div>
                <label htmlFor={name} className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                    {label}
                </label>

                <select
                    id={name}
                    disabled={loading || isFormDisabled}
                    {...register(name)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none focus:border-[#037F8C] focus:ring-1 focus:ring-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50 ${errorMessage ? "border-[#DC2626]" : "border-[#E5E0D8]"}`}
                >
                    <option value="">{loading ? "جارٍ التحميل..." : `اختر ${label}`}</option>

                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {name === "reportingTo_id" ? getUserName(option) : option.name || option.nameEn || option.titleEn || option.email || option.codeName || String(option.id)}
                        </option>
                    ))}
                </select>

                {errorMessage && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{errorMessage}</p>}
            </div>
        );
    };

    const renderDocumentFields = () => {
        if (activeDocumentTab === "salary") return renderFields(SALARY_FIELDS);
        if (activeDocumentTab === "iqama") return renderFields(IQAMA_FIELDS);
        if (activeDocumentTab === "bank") return renderFields(BANK_FIELDS);
        if (activeDocumentTab === "health") return renderFields(HEALTH_FIELDS);
        if (activeDocumentTab === "passport") return renderFields(PASSPORT_FIELDS);
        if (activeDocumentTab === "visa") return renderFields(VISA_FIELDS);
        if (activeDocumentTab === "contract") return renderFields(CONTRACT_FIELDS);
        if (activeDocumentTab === "driving") return renderFields(DRIVING_FIELDS);
        return renderFields(SUBSCRIPTION_FIELDS);
    };

    const onSubmit = (data: CreateEmployeeContractPayload) => {
        const payload: CreateEmployeeContractPayload = {
            ...data,
            gross_salary: data.gross_salary ?? calculatedGrossSalary,
            net_salary: data.net_salary ?? data.gross_salary ?? calculatedGrossSalary,
        };

        if (isUpdateMode) {
            updateMutation.mutate(payload);
            return;
        }

        if (mode === "create") createMutation.mutate(payload);
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        if (currentStep < 3) {
            event.preventDefault();
            event.stopPropagation();
            handleNext();
            return;
        }

        handleSubmit(onSubmit)(event);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true">
            <div className="max-h-[95vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-[#FAF8F5] p-4 shadow-2xl sm:p-6">
                <form onSubmit={handleFormSubmit} className="space-y-6 text-start" noValidate>
                    <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl font-bold text-[#0D0D0D]">{pageTitle}</h1>
                                    {mode !== "create" && employee?.codeName && <span className="rounded-md border border-[#E5E0D8] bg-[#FAF8F5] px-2 py-0.5 font-mono text-[11px] font-bold text-[#037F8C]">{employee.codeName}</span>}
                                </div>

                                <p className="mt-1 text-xs text-[#6E6862]">
                                    {pageDescription}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-[#037F8C]">
                                    الخطوة {currentStep + 1} من 4
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {steps.map((step) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.index;
                                const isComplete = highestVisitedStep > step.index;
                                const canOpen = step.index <= highestVisitedStep;

                                return (
                                    <button
                                        key={step.index}
                                        type="button"
                                        disabled={!canOpen || isSaving}
                                        onClick={() => handleStepClick(step.index)}
                                        className={`rounded-xl border p-3 text-start transition ${isActive ? "border-[#037F8C] bg-[#EAF3EC]" : isComplete ? "border-[#037F8C]/30 bg-white" : "border-[#E5E0D8] bg-[#FAF8F5]"} disabled:cursor-not-allowed disabled:opacity-60`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive || isComplete ? "bg-[#037F8C] text-white" : "bg-white text-[#857E74]"}`}>
                                                {isComplete ? <Check size={15} /> : <Icon size={15} />}
                                            </div>

                                            <div>
                                                <p className="text-xs font-bold text-[#0D0D0D]">
                                                    {step.title}
                                                </p>

                                                <p className="mt-0.5 text-[11px] text-[#6E6862]">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {currentStep === 0 && (
                        <div className="space-y-5">
                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <div className="mb-4 border-b border-[#E5E0D8] pb-3">
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        البيانات الشخصية
                                    </h2>

                                    <p className="mt-1 text-xs text-[#6E6862]">
                                        الاسم وبيانات التواصل والمعلومات الشخصية.
                                    </p>
                                </div>

                                {renderFields(PERSONAL_FIELDS)}
                            </section>

                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="gender" className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                                            النوع
                                        </label>

                                        <select id="gender" disabled={isFormDisabled} {...register("gender")} className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-xs outline-none focus:border-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">اختر النوع</option>
                                            <option value="Male">ذكر</option>
                                            <option value="Female">أنثى</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="maritalStatus" className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                                            الحالة الاجتماعية
                                        </label>

                                        <select id="maritalStatus" disabled={isFormDisabled} {...register("maritalStatus")} className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-xs outline-none focus:border-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">اختر الحالة الاجتماعية</option>
                                            <option value="Single">أعزب</option>
                                            <option value="Married">متزوج</option>
                                            <option value="Divorced">مطلق</option>
                                            <option value="Widowed">أرمل</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <div className="mb-4 border-b border-[#E5E0D8] pb-3">
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        العلاقات الوظيفية
                                    </h2>

                                    <p className="mt-1 text-xs text-[#6E6862]">
                                        بيانات القوائم التالية تأتي مباشرة من الـ APIs.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {renderApiSelect("branch_id", "الفرع", branches, isLoadingBranches)}
                                    {renderApiSelect("department_id", "القسم", departments, isLoadingDepartments)}
                                    {renderApiSelect("designation_id", "المسمى الوظيفي", designations, isLoadingDesignations)}
                                    {renderApiSelect("role_id", "الدور", roles, isLoadingRoles)}
                                    {renderApiSelect("reportingTo_id", "المدير المباشر", reportingUsers, isLoadingUsers)}
                                </div>
                            </section>

                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <div className="mb-4 border-b border-[#E5E0D8] pb-3">
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        بيانات الوظيفة والعقد
                                    </h2>
                                </div>

                                {renderFields(EMPLOYMENT_FIELDS)}
                            </section>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                            <div className="mb-4 border-b border-[#E5E0D8] pb-3">
                                <h2 className="text-sm font-bold text-[#0D0D0D]">
                                    الوثائق والبيانات المالية
                                </h2>

                                <p className="mt-1 text-xs text-[#6E6862]">
                                    اختر القسم المطلوب وأدخل البيانات الخاصة به.
                                </p>
                            </div>

                            <div className="mb-5 flex flex-wrap gap-2">
                                {DOCUMENT_TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveDocumentTab(tab.id)}
                                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${activeDocumentTab === tab.id ? "border-[#037F8C] bg-[#037F8C] text-white" : "border-[#E5E0D8] bg-white text-[#45413C] hover:bg-[#FAF8F5]"}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {renderDocumentFields()}

                            {activeDocumentTab === "salary" && (
                                <div className="mt-5 rounded-xl border border-[#037F8C]/20 bg-[#EAF3EC] p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#45413C]">
                                            إجمالي الراتب المحسوب
                                        </span>

                                        <span className="font-mono text-lg font-bold text-[#037F8C]">
                                            {calculatedGrossSalary.toLocaleString("en-US")} SAR
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isFormDisabled}
                                        onClick={() => {
                                            setValue("gross_salary", calculatedGrossSalary);
                                            setValue("net_salary", calculatedGrossSalary);
                                        }}
                                        className="mt-3 rounded-lg border border-[#037F8C]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        استخدام القيمة المحسوبة
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-5">
                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <div className="mb-4 border-b border-[#E5E0D8] pb-3">
                                    <h2 className="text-sm font-bold text-[#0D0D0D]">
                                        الخيارات النهائية
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="dependents" className="mb-1 block text-xs font-semibold text-[#0D0D0D]">
                                            يوجد تابعون للموظف
                                        </label>

                                        <select id="dependents" disabled={isFormDisabled} {...register("dependents")} className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-xs outline-none focus:border-[#037F8C] disabled:cursor-not-allowed disabled:opacity-50">
                                            <option value="">غير محدد</option>
                                            <option value="true">نعم</option>
                                            <option value="false">لا</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-2xs">
                                <h2 className="text-sm font-bold text-[#0D0D0D]">
                                    مراجعة سريعة
                                </h2>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3">
                                        <p className="text-[11px] text-[#857E74]">
                                            البريد الإلكتروني
                                        </p>

                                        <p className="mt-1 truncate text-xs font-semibold text-[#0D0D0D]">
                                            {String(watch("email") || "—")}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3">
                                        <p className="text-[11px] text-[#857E74]">
                                            رقم الهاتف
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[#0D0D0D]">
                                            {String(watch("phone_number") || "—")}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3">
                                        <p className="text-[11px] text-[#857E74]">
                                            تاريخ الانضمام
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[#0D0D0D]">
                                            {String(watch("joining_date") || "—")}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] p-3">
                                        <p className="text-[11px] text-[#857E74]">
                                            إجمالي الراتب
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-[#037F8C]">
                                            {calculatedGrossSalary.toLocaleString("en-US")} SAR
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {!isViewMode && Object.keys(errors).length > 0 && (
                        <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs text-[#DC2626]">
                            توجد بيانات غير صحيحة. راجع الحقول ثم حاول مرة أخرى.
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-2xs">
                        <div>
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={handlePrevious}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50"
                                >
                                    {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                                    السابق
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={isSaving}
                                onClick={onClose}
                                className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50"
                            >
                                رجوع
                            </button>

                            {isViewMode && currentStep === 3 ? (
                                <button
                                    type="button"
                                    onClick={() => onModeChange?.("update")}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#037F8C] px-5 py-2 text-xs font-semibold text-white hover:bg-[#223121]"
                                >
                                    <Save size={14} />
                                    تعديل الموظف
                                </button>
                            ) : currentStep < 3 ? (
                                <button
                                    key="employee-form-next-step"
                                    type="button"
                                    disabled={isSaving}
                                    onClick={handleNext}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] disabled:opacity-50"
                                >
                                    التالي
                                    {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                                </button>
                            ) : (
                                <button
                                    key="employee-form-submit"
                                    type="submit"
                                    disabled={isSaving || isViewMode}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#037F8C] px-5 py-2 text-xs font-semibold text-white hover:bg-[#223121] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {isSaving ? "جارٍ الحفظ..." : isUpdateMode ? "حفظ التعديلات" : "حفظ الموظف"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeForm;