import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CrmContactInput } from '../../../schemas/crmSchema';

export interface ContactImportModalProps {
    isOpen: boolean;
    isImporting?: boolean;
    onClose: () => void;
    onImport: (rows: Array<Partial<CrmContactInput>>) => Promise<void> | void;
}

const SAMPLE_CONTACTS_CSV = `fullNameEn,fullNameAr,email,phone,jobTitle,contactType,companyId
Mazen Al-Qahtani,مازن القحطاني,m.qahtani@almarai-industrial.sa,+966 50 778 8899,Director of Operations,decision_maker,crm-comp-1
Huda Al-Shammari,هدى الشمري,h.shammari@tuwaiq-tech.sa,+966 55 443 2211,Finance & Billing Lead,billing,crm-comp-2`;

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
    isOpen,
    isImporting = false,
    onClose,
    onImport,
}) => {
    const { t } = useTranslation();
    const [csvText, setCsvText] = useState(SAMPLE_CONTACTS_CSV);
    const [parseError, setParseError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCsvText(String(ev.target?.result || ''));
            setParseError(null);
        };
        reader.readAsText(file);
    };

    const handleImportSubmit = async () => {
        setParseError(null);
        const lines = csvText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        if (lines.length < 2) {
            setParseError('Please provide a header row and at least one data row.');
            return;
        }
        const headers = lines[0].split(',').map((h) => h.trim());
        const rows: Array<Partial<CrmContactInput>> = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim());
            const rowObj: Record<string, string> = {};
            headers.forEach((h, idx) => {
                rowObj[h] = cols[idx] || '';
            });
            rows.push({
                fullNameEn: rowObj.fullNameEn || '',
                fullNameAr: rowObj.fullNameAr || rowObj.fullNameEn || '',
                email: rowObj.email || '',
                phone: rowObj.phone || '',
                jobTitle: rowObj.jobTitle || '',
                contactType:
                    (rowObj.contactType as CrmContactInput['contactType']) ||
                    'primary',
                companyId: rowObj.companyId || undefined,
                isPrimary: false,
                status: 'active',
            });
        }
        await onImport(rows);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-import-modal-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl overflow-hidden text-start">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div>
                            <h2
                                id="contact-import-modal-title"
                                className="text-sm font-bold text-[#0D0D0D]"
                            >
                                {t('crm.customer.contacts.importModal.title')}
                            </h2>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('crm.customer.contacts.importModal.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {parseError && (
                        <div className="rounded-xl border border-[#F5C6C6] bg-[#FCECE9] p-3 text-xs text-[#A63A3A] flex items-center gap-2">
                            <AlertCircle size={14} />
                            <span>{parseError}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setCsvText(SAMPLE_CONTACTS_CSV)}
                            className="px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#2D3F2C] cursor-pointer"
                        >
                            {t('crm.customer.contacts.importModal.downloadTemplate')}
                        </button>

                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] cursor-pointer">
                            <Upload size={13} />
                            <span>{t('crm.customer.contacts.importModal.uploadCsv')}</span>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.customer.contacts.importModal.csvContentLabel')}
                        </label>
                        <textarea
                            rows={6}
                            value={csvText}
                            onChange={(e) => setCsvText(e.target.value)}
                            dir="ltr"
                            className="w-full p-3 rounded-xl border border-[#E5E0D8] font-mono text-xs bg-[#FAF8F5] text-[#0D0D0D]"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#0D0D0D] cursor-pointer"
                    >
                        {t('crm.customer.common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleImportSubmit}
                        disabled={isImporting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 size={14} />
                        {isImporting
                            ? t('crm.customer.common.saving')
                            : t('crm.customer.contacts.importModal.importBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ContactImportModal;
