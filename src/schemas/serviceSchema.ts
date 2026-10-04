import { z } from 'zod';
import { GroupType, ServiceTagStatus } from '../components/Service/serviceGroupTypes';

export const OTHER_PAYMENT_METHODS = [
    { id: 'bank_transfer', name: 'Bank Transfer (تحويل بنكي)' },
    { id: 'credit_card', name: 'Credit / Mada Card (بطاقة مدى / ائتمان)' },
    { id: 'pos', name: 'Point of Sale (أجهزة نقاط البيع)' },
    { id: 'cheque', name: 'Certified Cheque (شيك مصدق)' },
    { id: 'cash', name: 'Cash Deposit (إيداع نقدي)' },
] as const;

export interface OutputDocumentOption {
    id: string;
    code: string;
    name: string;
}

export const OUTPUT_DOCUMENT_OPTIONS: OutputDocumentOption[] = [
    { id: 'out-1', code: 'DOC-CR', name: 'شهادة السجل التجاري (Commercial Registration Certificate)' },
    { id: 'out-2', code: 'DOC-INS', name: 'شهادة التأمين الطبي للموظف (Employee Health Insurance Certificate)' },
    { id: 'out-3', code: 'DOC-TAX', name: 'شهادة الالتزام الضريبي (Tax Compliance Certificate)' },
    { id: 'out-4', code: 'DOC-GOSI', name: 'شهادة الألتزام في التأمينات (GOSI Compliance Certificate)' },
    { id: 'out-5', code: 'DOC-LIC', name: 'رخصة القيادة / السير المجددة (Renewed Driving / Vehicle License)' },
    { id: 'out-6', code: 'DOC-MUDAD', name: 'شهادة التزام حماية الأجور (Wages Protection Certificate)' },
    { id: 'out-7', code: 'DOC-CERT', name: 'طباعة شهادة إتمام المعاملة (Service Completion Certificate)' },
];

export const INPUT_DOCUMENT_PRESETS = [
    'Commercial Registration (السجل التجاري)',
    'Vehicle Registration (استمارة المركبة)',
    'Vehicle Insurance (وثيقة تأمين المركبة)',
    'National ID / Iqama (الهوية الوطنية / الإقامة)',
    'Chamber of Commerce Attestation (تصديق الغرفة التجارية)',
    'Power of Attorney (وكالة شرعية / تفويض)',
    'Bank Account Certificate (شهادة الحساب البنكي / آيبان)',
];

export const addServiceSchema = z.object({
    group_type: z.string().optional(),
    serviceGroup_id: z.string().optional(),
    service_title: z.string().min(1, 'Service title is required'),
    service_description: z.string().optional(),
    servicePortal_id: z.string().min(1, 'Service portal is required'),
    service_category_id: z.string().optional(),
    serviceType_id: z.string().min(1, 'Service type is required'),
    service_processing_time: z.string().min(1, 'Processing time is required'),
    service_processing_frequen: z.string().min(1, 'Processing frequency is required'),
    serviceTag_id: z.string().min(1, 'Service tag is required'),
    service_validity: z.string().min(1, 'Service validity is required'),
    recurring_type: z.string().optional(),
    service_due_date: z.union([z.string(), z.date()]).optional(),
    service_period: z.string().optional(),
    period_type: z.string().optional(),
    document_category_id: z.string().optional(),
    service_event_date: z.union([z.string(), z.date()]).optional(),
    confirmation_required: z.boolean(),
    delegation_required: z.boolean(),
    service_responsible_department_id: z.string().min(1, 'Responsible department is required'),
    service_submission_mode: z.string().min(1, 'Submission mode is required'),
    sadad_payment_available: z.boolean(),
    other_payment_method_id: z.string().optional(),
    service_fees: z.string().optional(),
    input_documents: z.array(z.string()).optional(),
    output_documents: z.array(z.string()).optional(),
    process_description: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.service_validity === 'recurring' && (!data.service_period || data.service_period.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Service period is required for recurring services',
            path: ['service_period'],
        });
    }
    if (!data.sadad_payment_available) {
        if (!data.other_payment_method_id || data.other_payment_method_id.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Other payment method is required when Sadad is unavailable',
                path: ['other_payment_method_id'],
            });
        }
    }
});

export type AddServiceFormValues = z.infer<typeof addServiceSchema>;

export const serviceTypeSchema = z.object({
    name: z.string().min(1, 'Type name is required'),
    serviceCategory_id: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
});

export type ServiceTypeFormValues = z.infer<typeof serviceTypeSchema>;

export const serviceCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    status: z.string().optional(),
});

export type ServiceCategoryFormValues = z.infer<typeof serviceCategorySchema>;

export const servicePortalSchema = z.object({
    name: z.string().min(1, 'Portal name is required'),
    url: z.string().min(1, 'URL is required'),
    contact_number: z.number().optional().or(z.string().optional()),
    email: z.string().optional(),
    description: z.string().optional(),
});

export type ServicePortalFormValues = z.infer<typeof servicePortalSchema>;

export const serviceTagSchema = z.object({
    name: z.string().min(1, 'Tag name is required'),
    description: z.string().optional(),
    status: z.string().optional(),
});

export type ServiceTagFormValues = z.infer<typeof serviceTagSchema>;

export interface CreateServicePackageDto {
    package_name: string;
    unit_price: number;
    group_type?: GroupType;
    status?: ServiceTagStatus;
    description?: string;
}

export const servicePackageSchema = z.object({
    group_type: z.nativeEnum(GroupType),
    service_group_id: z.string().trim().min(1, 'Please select a service group'),
    package_name: z.string().trim().min(1, 'Package Name is required'),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
    description: z.string().optional(),
    status: z.nativeEnum(ServiceTagStatus),
});

export type ServicePackageFormValues = z.infer<typeof servicePackageSchema>;
