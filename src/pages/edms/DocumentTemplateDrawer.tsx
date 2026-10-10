import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { documentApi } from '../../api/api';
import { documentDefaultValues, documentSchema, type DocumentFormValues } from '../../schemas/edmsSchema';

export interface DocumentRecord {
    templateCode?: string;
    id: string;
    name: string;
    documentTypeId?: string | null;
    documentTagId?: string | null;
    documentType?: { id?: string; name?: string } | string | null;
    documentTag?: { id?: string; name?: string } | string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string | { name?: string; email?: string } | null;
    [key: string]: unknown;
}
interface OptionRecord { id: string; name: string;[key: string]: unknown; }
interface DocumentDrawerProps {
    isOpen: boolean;
    editingItem: DocumentRecord | null;
    onClose: () => void;
    onSubmit: (data: DocumentFormValues, existingItem: DocumentRecord | null) => void;
    isSubmitting?: boolean;
}

const extractItems = (response: any): OptionRecord[] => {
    const candidates = [response?.data?.items, response?.items, response?.data?.data, response?.data, response?.results, response];
    const found = candidates.find(Array.isArray) || [];
    return found.map((item: any) => ({ ...item, id: String(item.id ?? item.uuid ?? ''), name: String(item.name ?? item.title ?? '') }))
        .filter((item: OptionRecord) => item.id && item.name);
};

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({ isOpen, editingItem, onClose, onSubmit, isSubmitting = false }) => {
    const { t } = useTranslation();
    const isEdit = Boolean(editingItem);
    const typesQuery = useQuery({
        queryKey: ['document-types', 'document-drawer'],
        queryFn: () => documentApi.getDocumentTypes({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });
    const tagsQuery = useQuery({
        queryKey: ['document-tags', 'document-drawer'],
        queryFn: () => documentApi.getDocumentTags({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });
    const types = useMemo(() => extractItems(typesQuery.data), [typesQuery.data]);
    const tags = useMemo(() => extractItems(tagsQuery.data), [tagsQuery.data]);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<DocumentFormValues>({
        resolver: zodResolver(documentSchema),
        defaultValues: documentDefaultValues,
    });

    useEffect(() => {
        if (!isOpen) return;
        reset({
            name: editingItem?.name ?? '',
            documentTypeId: editingItem?.documentTypeId ?? (typeof editingItem?.documentType === 'object' ? editingItem.documentType?.id : '') ?? '',
            documentTagId: editingItem?.documentTagId ?? (typeof editingItem?.documentTag === 'object' ? editingItem.documentTag?.id : '') ?? '',
        });
    }, [isOpen, editingItem, reset]);

    const submit = (values: DocumentFormValues) => onSubmit({
        name: values.name.trim(),
        documentTypeId: values.documentTypeId || undefined,
        documentTagId: values.documentTagId || undefined,
    }, editingItem);

    return (
        <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!isOpen}>
            <button type="button" aria-label={t('common.close', 'Close')} onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-slate-900/35 backdrop-blur-[2px]" />
            <section role="dialog" aria-modal="true" aria-labelledby="document-drawer-title" className={`absolute end-0 top-0 flex h-full w-full max-w-xl flex-col bg-white text-start shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'}`}>
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] px-6 py-4 dark:border-slate-800">
                    <div>
                        <h2 id="document-drawer-title" className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">{isEdit ? t('edms.documents.form.editTitle', 'Edit Document') : t('edms.documents.form.createTitle', 'Add Document')}</h2>
                        <p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">{isEdit ? t('edms.documents.form.editSubtitle', 'Update document details') : t('edms.documents.form.createSubtitle', 'Enter document details')}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800"><X size={18} /></button>
                </header>
                <form id="edms-document-form" onSubmit={handleSubmit(submit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div>
                        <label htmlFor="document-name" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">{t('edms.documents.form.name', 'Document Name')} <span className="text-red-600">*</span></label>
                        <input id="document-name" autoFocus {...register('name')} placeholder={t('edms.documents.form.namePlaceholder', 'Enter document name')} aria-invalid={Boolean(errors.name)} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none dark:bg-slate-800 dark:text-slate-100 ${errors.name ? 'border-red-400' : 'border-[#E5E0D8] bg-[#FAF8F5] focus:border-[#2D3F2C] dark:border-slate-700'}`} />
                        {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="document-type-id" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">{t('edms.documents.form.documentType', 'Document Type')} <span className="font-normal text-[#857E74]">{t('common.optional', 'Optional')}</span></label>
                        <select id="document-type-id" {...register('documentTypeId')} disabled={typesQuery.isLoading} className="w-full rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            <option value="">{typesQuery.isLoading ? t('common.loading', 'Loading...') : t('edms.documents.form.documentTypePlaceholder', 'Select document type')}</option>
                            {types.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        {typesQuery.isError && <p className="mt-1 text-[11px] text-red-500">{t('edms.documents.form.typesLoadError', 'Could not load document types')}</p>}
                    </div>
                    <div>
                        <label htmlFor="document-tag-id" className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">{t('edms.documents.form.documentTag', 'Document Tag')} <span className="font-normal text-[#857E74]">{t('common.optional', 'Optional')}</span></label>
                        <select id="document-tag-id" {...register('documentTagId')} disabled={tagsQuery.isLoading} className="w-full rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            <option value="">{tagsQuery.isLoading ? t('common.loading', 'Loading...') : t('edms.documents.form.documentTagPlaceholder', 'Select document tag')}</option>
                            {tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        {tagsQuery.isError && <p className="mt-1 text-[11px] text-red-500">{t('edms.documents.form.tagsLoadError', 'Could not load document tags')}</p>}
                    </div>
                </form>
                <footer className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <button type="button" onClick={onClose} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2.5 text-xs font-semibold text-[#595550] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{t('common.cancel', 'Cancel')}</button>
                    <button type="submit" form="edms-document-form" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#233222] disabled:opacity-60">{isSubmitting && <LoaderCircle size={14} className="animate-spin" />}{isEdit ? t('common.saveChanges', 'Save Changes') : t('common.create', 'Create')}</button>
                </footer>
            </section>
        </div>
    );
};
