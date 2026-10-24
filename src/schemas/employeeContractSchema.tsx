import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());

const optionalEmail = z.preprocess(emptyToUndefined, z.string().trim().email("البريد الإلكتروني غير صالح").optional());

const optionalUuid = (message: string) => z.preprocess(emptyToUndefined, z.string().uuid(message).optional());

const optionalDate = (message: string) => z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message).optional());

const optionalNumber = (message: string) => z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
}, z.number({ message }).finite(message).optional());

const optionalBoolean = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return value;
}, z.boolean({ message: "القيمة يجب أن تكون true أو false" }).optional());

export const createEmployeeContractSchema = z.object({
    department_id: optionalUuid("معرف القسم غير صالح"),
    designation_id: optionalUuid("معرف المسمى الوظيفي غير صالح"),
    reportingTo_id: optionalUuid("معرف المدير المباشر غير صالح"),

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
});

export type CreateEmployeeContractInput = z.input<typeof createEmployeeContractSchema>;
export type CreateEmployeeContractPayload = z.output<typeof createEmployeeContractSchema>;