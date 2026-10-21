import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Braces, Plus, AlertCircle } from 'lucide-react';
import {
    type WorkflowEmailTemplateRecord,
    type WorkflowEmailTemplateStatus,
    type CommunicationWorkflowDefinition,
} from '../../pages/workflow/workflowMockData';

export interface EmailTemplateFormState {
    templateNameEn: string;
    templateNameAr: string;
    communicationWorkflowKey: string;
    subjectEn: string;
    subjectAr: string;
    contentEn: string;
    contentAr: string;
    creatorNameEn: string;
    creatorNameAr: string;
    email: string;
    status: WorkflowEmailTemplateStatus;
}

export interface FormValidationErrors {
    templateName?: string;
    communicationWorkflow?: string;
    subject?: string;
    content?: string;
}

export const DEFAULT_EMAIL_TEMPLATE_FORM_STATE: EmailTemplateFormState = {
    templateNameEn: '',
    templateNameAr: '',
    communicationWorkflowKey: '',
    subjectEn: '',
    subjectAr: '',
    contentEn: '',
    contentAr: '',
    creatorNameEn: 'Khalifah Alsharabi',
    creatorNameAr: 'خليفة الشرعبي',
    email: 'k.alsharabi@awn.sa',
    status: 'Active',
};

interface WorkflowEmailTemplateFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formState: EmailTemplateFormState;
    setFormState: React.Dispatch<React.SetStateAction<EmailTemplateFormState>>;
    formErrors: FormValidationErrors;
    setFormErrors: React.Dispatch<React.SetStateAction<FormValidationErrors>>;
    editingRecord: WorkflowEmailTemplateRecord | null;
    workflowSearchTerm: string;
    setWorkflowSearchTerm: (term: string) => void;
    searchableWorkflowOptions: CommunicationWorkflowDefinition[];
    currentWorkflowVariables: string[];
    onInsertVariable: (token: string) => void;
}

export const WorkflowEmailTemplateFormDrawer: React.FC<WorkflowEmailTemplateFormDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formState,
    setFormState,
    formErrors,
    setFormErrors,
    editingRecord,
    workflowSearchTerm,
    setWorkflowSearchTerm,
    searchableWorkflowOptions,
    currentWorkflowVariables,
    onInsertVariable,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <form
                onSubmit={onSubmit}
                noValidate
                className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {editingRecord
                                    ? t('workflow.emailTemplates.drawer.editTitle')
                                    : t('workflow.emailTemplates.drawer.createTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('workflow.emailTemplates.drawer.formSubtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Template Name */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.emailTemplates.drawer.templateName')} *
                            </label>
                            <input
                                type="text"
                                value={formState.templateNameEn}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormState((prev) => ({
                                        ...prev,
                                        templateNameEn: val,
                                    }));
                                    if (formErrors.templateName && val.trim()) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            templateName: undefined,
                                        }));
                                    }
                                }}
                                placeholder={t(
                                    'workflow.emailTemplates.drawer.templateNamePlaceholder'
                                )}
                                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors ${
                                    formErrors.templateName
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {formErrors.templateName && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                    <AlertCircle size={12} />
                                    <span>{formErrors.templateName}</span>
                                </p>
                            )}
                        </div>

                        {/* Communication Workflow Searchable Dropdown */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#0D0D0D]">
                                {t('workflow.emailTemplates.drawer.communicationWorkflow')} *
                            </label>
                            <div className="relative">
                                <Search
                                    size={13}
                                    className="absolute top-1/2 -translate-y-1/2 start-3 text-[#857E74] pointer-events-none"
                                />
                                <input
                                    type="text"
                                    value={workflowSearchTerm}
                                    onChange={(e) => setWorkflowSearchTerm(e.target.value)}
                                    placeholder={t(
                                        'workflow.emailTemplates.drawer.searchWorkflowPlaceholder'
                                    )}
                                    className="w-full ps-8 pe-3 py-1.5 text-xs rounded-t-lg border border-b-0 border-[#E5E0D8] bg-[#FAF8F5]/70 text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-hidden focus:bg-white"
                                />
                            </div>
                            <select
                                value={formState.communicationWorkflowKey}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormState((prev) => ({
                                        ...prev,
                                        communicationWorkflowKey: val,
                                    }));
                                    if (formErrors.communicationWorkflow && val.trim()) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            communicationWorkflow: undefined,
                                        }));
                                    }
                                }}
                                aria-label={t(
                                    'workflow.emailTemplates.drawer.communicationWorkflow'
                                )}
                                className={`w-full px-3 py-2 text-xs rounded-b-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white cursor-pointer ${
                                    formErrors.communicationWorkflow
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            >
                                <option value="">
                                    {t(
                                        'workflow.emailTemplates.drawer.selectWorkflowOption'
                                    )}
                                </option>
                                {searchableWorkflowOptions.map((wf) => (
                                    <option key={wf.key} value={wf.key}>
                                        {isRtl ? wf.nameAr : wf.nameEn} ({wf.source})
                                    </option>
                                ))}
                            </select>
                            {formErrors.communicationWorkflow && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                    <AlertCircle size={12} />
                                    <span>{formErrors.communicationWorkflow}</span>
                                </p>
                            )}
                        </div>

                        {/* Available Variables Box */}
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                    <Braces size={14} className="text-[#037F8C]" />
                                    <span>
                                        {t('workflow.emailTemplates.drawer.availableVariables')}
                                    </span>
                                </span>
                                <span className="text-[11px] text-[#6E6862]">
                                    {t('workflow.emailTemplates.drawer.clickToInsertHint')}
                                </span>
                            </div>

                            {currentWorkflowVariables.length === 0 ? (
                                <div className="py-2 px-3 rounded-lg bg-white border border-dashed border-[#E5E0D8] text-xs font-medium text-[#6E6862] text-center">
                                    {t('workflow.emailTemplates.drawer.noAvailableVariables')}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {currentWorkflowVariables.map((variableToken) => (
                                        <button
                                            key={variableToken}
                                            type="button"
                                            onClick={() => onInsertVariable(variableToken)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-[#037F8C] text-[#037F8C] hover:text-[#FAF8F5] border border-[#E5E0D8] hover:border-[#037F8C] text-[11px] font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
                                            dir="ltr"
                                        >
                                            <Plus size={11} />
                                            <span>{variableToken}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Email Subject */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.emailTemplates.drawer.emailSubject')} *
                            </label>
                            <input
                                type="text"
                                value={formState.subjectEn}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormState((prev) => ({
                                        ...prev,
                                        subjectEn: val,
                                    }));
                                    if (formErrors.subject && val.trim()) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            subject: undefined,
                                        }));
                                    }
                                }}
                                placeholder={t(
                                    'workflow.emailTemplates.drawer.emailSubjectPlaceholder'
                                )}
                                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors ${
                                    formErrors.subject
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {formErrors.subject && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                    <AlertCircle size={12} />
                                    <span>{formErrors.subject}</span>
                                </p>
                            )}
                        </div>

                        {/* Email Content */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.emailTemplates.drawer.emailContent')} *
                            </label>
                            <textarea
                                rows={6}
                                value={formState.contentEn}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormState((prev) => ({
                                        ...prev,
                                        contentEn: val,
                                    }));
                                    if (formErrors.content && val.trim()) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            content: undefined,
                                        }));
                                    }
                                }}
                                placeholder={t(
                                    'workflow.emailTemplates.drawer.emailContentPlaceholder'
                                )}
                                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white transition-colors leading-relaxed ${
                                    formErrors.content
                                        ? 'border-[#A63A3A] focus:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {formErrors.content && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                    <AlertCircle size={12} />
                                    <span>{formErrors.content}</span>
                                </p>
                            )}
                        </div>

                        {/* Creator, Email & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.emailTemplates.table.creator')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.creatorNameEn}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            creatorNameEn: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.emailTemplates.table.email')}
                                </label>
                                <input
                                    type="email"
                                    dir="ltr"
                                    value={formState.email}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.emailTemplates.table.status')}
                                </label>
                                <select
                                    value={formState.status}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: e.target
                                                .value as WorkflowEmailTemplateStatus,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C] cursor-pointer"
                                >
                                    <option value="Active">
                                        {t('workflow.emailTemplates.statuses.active')}
                                    </option>
                                    <option value="Inactive">
                                        {t('workflow.emailTemplates.statuses.inactive')}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                        {editingRecord
                            ? t('common.saveChanges', 'Save Changes')
                            : t('common.create', 'Create')}
                    </button>
                </div>
            </form>
        </div>
    );
};
