import { z } from "zod";

export const documentCategorySchema = z.object({
    name: z.string().trim().min(1, 'اسم تصنيف المستند مطلوب'),
    description: z.string().optional(),
});

export const documentTypeSchema = z.object({
    name: z.string().trim().min(1, 'اسم نوع المستند مطلوب'),
    description: z.string().trim().min(1, 'وصف نوع المستند مطلوب'),
    documentCategoryId: z.string().uuid('من فضلك اختر تصنيف مستند صحيح'),
});

export type DocumentTypeFormValues = z.input<typeof documentTypeSchema>;


export const documentSchema = z.object({
    name: z.string().trim().min(1, 'اسم المستند مطلوب'),
    documentTypeId: z.union([z.string().uuid('معرف نوع المستند غير صالح'), z.literal('')]).optional(),
    documentTagId: z.union([z.string().uuid('معرف علامة المستند غير صالح'), z.literal('')]).optional(),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;

export const documentDefaultValues: DocumentFormValues = {
    name: '',
    documentTypeId: '',
    documentTagId: '',
};
