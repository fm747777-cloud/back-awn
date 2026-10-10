import React from 'react';
import { X, FileText, CalendarDays, UserRound, Tag, Layers3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DocumentRecord } from './DocumentTemplateDrawer';

interface Props { isOpen: boolean; item: DocumentRecord | null; onClose: () => void; }

const relationName = (value: unknown, fallbackId?: unknown) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'name' in value) {
        const name = (value as { name?: unknown }).name;
        if (typeof name === 'string' && name.trim()) return name;
    }
    return typeof fallbackId === 'string' && fallbackId ? fallbackId : '—';
};
const formatDate = (value: unknown, locale: string) => {
    if (typeof value !== 'string' || !value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export const DocumentViewDrawer: React.FC<Props> = ({ isOpen, item, onClose }) => {
    const { t, i18n } = useTranslation();
    if (!item) return null;
    const isAr = Boolean(i18n.language?.startsWith('ar'));
    const createdBy = typeof item.createdBy === 'string' ? item.createdBy : item.createdBy?.name || item.createdBy?.email || '—';
    const fields = [
        { label: t('edms.documents.form.name', 'Document Name'), value: item.name, Icon: FileText },
        { label: t('edms.documents.form.documentType', 'Document Type'), value: relationName(item.documentType, item.documentTypeId), Icon: Layers3 },
        { label: t('edms.documents.form.documentTag', 'Document Tag'), value: relationName(item.documentTag, item.documentTagId), Icon: Tag },
        { label: t('edms.documents.columns.createdBy', 'Created By'), value: createdBy, Icon: UserRound },
        { label: t('edms.documents.columns.createdAt', 'Created At'), value: formatDate(item.createdAt, isAr ? 'ar-EG' : 'en-US'), Icon: CalendarDays },
        { label: t('edms.documents.columns.updatedAt', 'Updated At'), value: formatDate(item.updatedAt, isAr ? 'ar-EG' : 'en-US'), Icon: CalendarDays },
    ];
    return (
        <div className={`fixed inset-0 z-[55] overflow-hidden transition-opacity duration-300 ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!isOpen}>
            <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="absolute inset-0 h-full w-full bg-slate-900/35 backdrop-blur-[2px]" />
            <section role="dialog" aria-modal="true" aria-labelledby="document-view-title" className={`absolute end-0 top-0 flex h-full w-full max-w-xl flex-col bg-white text-start shadow-2xl transition-transform duration-300 dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'}`}>
                <header className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] px-6 py-4 dark:border-slate-800">
                    <div><h2 id="document-view-title" className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">{t('edms.documents.view.title', 'Document Details')}</h2><p className="mt-1 text-xs text-[#6E6862] dark:text-slate-400">{t('edms.documents.view.subtitle', 'View document information')}</p></div>
                    <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800"><X size={18} /></button>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto p-6">
                    {fields.map(({ label, value, Icon }) => <div key={label} className="flex items-start gap-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-4 dark:border-slate-800 dark:bg-slate-800/60"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-950 dark:text-emerald-300"><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-[#857E74] dark:text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-[#0D0D0D] dark:text-slate-100">{value || '—'}</p></div></div>)}
                </div>
                <footer className="flex shrink-0 justify-end border-t border-[#E5E0D8] px-6 py-4 dark:border-slate-800"><button type="button" onClick={onClose} className="rounded-lg bg-[#2D3F2C] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#233222]">{t('common.close', 'Close')}</button></footer>
            </section>
        </div>
    );
};
