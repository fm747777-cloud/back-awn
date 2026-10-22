import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Braces,
    Plus,
    AlertCircle,
    EyeOff,
    Eye,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link2,
} from 'lucide-react';
import {
    type WorkflowEmailTemplateRecord,
    type CommunicationWorkflowDefinition,
} from '../../pages/workflow/workflowMockData';
import type { EmailTemplateFormState } from '../../pages/workflow/workflowUtils';

export interface FormValidationErrors {
    templateName?: string;
    communicationWorkflow?: string;
    subject?: string;
    content?: string;
}

interface WorkflowEmailTemplateFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formState: EmailTemplateFormState;
    setFormState: React.Dispatch<React.SetStateAction<EmailTemplateFormState>>;
    formErrors: FormValidationErrors;
    setFormErrors: React.Dispatch<React.SetStateAction<FormValidationErrors>>;
    editingRecord: WorkflowEmailTemplateRecord | null;
    workflowSearchTerm?: string;
    setWorkflowSearchTerm?: (term: string) => void;
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
    searchableWorkflowOptions,
    currentWorkflowVariables,
    onInsertVariable,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;
    const [isVariablesVisible, setIsVariablesVisible] = useState<boolean>(true);
    const editorRef = useRef<HTMLTextAreaElement | null>(null);

    if (!isOpen) return null;

    const applyFormatting = (
        format: 'bold' | 'italic' | 'underline' | 'bullet' | 'numbered' | 'link'
    ) => {
        const textarea = editorRef.current;
        const currentValue = formState.contentEn;
        const start = textarea?.selectionStart ?? currentValue.length;
        const end = textarea?.selectionEnd ?? currentValue.length;
        const selected = currentValue.slice(start, end);

        let replacement = selected;
        if (format === 'bold') {
            replacement = `**${selected || 'text'}**`;
        } else if (format === 'italic') {
            replacement = `*${selected || 'text'}*`;
        } else if (format === 'underline') {
            replacement = `<u>${selected || 'text'}</u>`;
        } else if (format === 'bullet') {
            replacement = selected
                ? selected
                      .split('\n')
                      .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
                      .join('\n')
                : '\n- ';
        } else if (format === 'numbered') {
            replacement = selected
                ? selected
                      .split('\n')
                      .map((line, idx) => `${idx + 1}. ${line}`)
                      .join('\n')
                : '\n1. ';
        } else if (format === 'link') {
            replacement = `[${selected || 'link'}](https://)`;
        }

        const nextContent =
            currentValue.slice(0, start) + replacement + currentValue.slice(end);

        setFormState((prev) => ({
            ...prev,
            contentEn: nextContent,
            contentAr: nextContent,
        }));

        if (formErrors.content && nextContent.trim()) {
            setFormErrors((prev) => ({
                ...prev,
                content: undefined,
            }));
        }

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                const cursor = start + replacement.length;
                textarea.setSelectionRange(cursor, cursor);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <form
                onSubmit={onSubmit}
                noValidate
                className="w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-start justify-between gap-3 bg-[#FAF8F5]">
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {t('workflow.emailTemplates.drawer.createTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                {t('workflow.emailTemplates.drawer.formSubtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('common.close', 'Close')}
                            className="p-2 rounded-lg text-[#6E6862] hover:text-[#0D0D0D] hover:bg-white transition-colors cursor-pointer shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* 1. Template Name */}
                        <div>
                            <label
                                htmlFor="email-template-name"
                                className="block text-xs font-semibold text-[#0D0D0D] mb-1.5"
                            >
                                {t('workflow.emailTemplates.drawer.templateName')} *
                            </label>
                            <input
                                id="email-template-name"
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

                        {/* 2. Communication Workflow */}
                        <div>
                            <label
                                htmlFor="email-template-workflow"
                                className="block text-xs font-semibold text-[#0D0D0D] mb-1.5"
                            >
                                {t('workflow.emailTemplates.drawer.communicationWorkflow')} *
                            </label>
                            <select
                                id="email-template-workflow"
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
                                className={`w-full px-3 py-2 text-xs rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white cursor-pointer transition-colors ${
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
                                        {isRtl ? wf.nameAr : wf.nameEn}
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

                        {/* 3. Email Subject */}
                        <div>
                            <label
                                htmlFor="email-template-subject"
                                className="block text-xs font-semibold text-[#0D0D0D] mb-1.5"
                            >
                                {t('workflow.emailTemplates.drawer.emailSubject')} *
                            </label>
                            <input
                                id="email-template-subject"
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

                        {/* 4. Email Template + Hide Variables + Available Variables */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <label
                                    htmlFor="email-template-content"
                                    className="block text-xs font-semibold text-[#0D0D0D]"
                                >
                                    {t('workflow.emailTemplates.drawer.emailContent')} *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsVariablesVisible((prev) => !prev)}
                                    aria-expanded={isVariablesVisible}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[11px] font-semibold text-[#037F8C] transition-colors cursor-pointer"
                                >
                                    {isVariablesVisible ? (
                                        <>
                                            <EyeOff size={12} />
                                            <span>
                                                {t('workflow.emailTemplates.drawer.hideVariables')}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye size={12} />
                                            <span>
                                                {t('workflow.emailTemplates.drawer.showVariables')}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {isVariablesVisible && (
                                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D0D0D]">
                                            <Braces size={14} className="text-[#037F8C]" />
                                            <span>
                                                {t(
                                                    'workflow.emailTemplates.drawer.availableVariables'
                                                )}
                                            </span>
                                        </span>
                                    </div>

                                    {currentWorkflowVariables.length === 0 ? (
                                        <div className="py-2 px-3 rounded-lg bg-white border border-dashed border-[#E5E0D8] text-xs font-medium text-[#6E6862] text-center">
                                            {t(
                                                'workflow.emailTemplates.drawer.noAvailableVariables'
                                            )}
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
                            )}

                            {/* Email Template Editor */}
                            <div
                                className={`overflow-hidden rounded-lg border bg-[#FAF8F5] transition-colors focus-within:bg-white ${
                                    formErrors.content
                                        ? 'border-[#A63A3A] focus-within:border-[#A63A3A]'
                                        : 'border-[#E5E0D8] focus-within:border-[#037F8C]'
                                }`}
                            >
                                <div className="flex flex-wrap items-center gap-1 border-b border-[#E5E0D8] bg-[#FAF8F5] px-2.5 py-1.5">
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('bold')}
                                        title="Bold"
                                        aria-label="Bold"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <Bold size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('italic')}
                                        title="Italic"
                                        aria-label="Italic"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <Italic size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('underline')}
                                        title="Underline"
                                        aria-label="Underline"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <Underline size={13} />
                                    </button>
                                    <span className="mx-1 h-4 w-px bg-[#E5E0D8]" />
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('bullet')}
                                        title="Bullet List"
                                        aria-label="Bullet List"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <List size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('numbered')}
                                        title="Numbered List"
                                        aria-label="Numbered List"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <ListOrdered size={13} />
                                    </button>
                                    <span className="mx-1 h-4 w-px bg-[#E5E0D8]" />
                                    <button
                                        type="button"
                                        onClick={() => applyFormatting('link')}
                                        title="Insert Link"
                                        aria-label="Insert Link"
                                        className="rounded-md p-1.5 text-[#6E6862] hover:bg-white hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                    >
                                        <Link2 size={13} />
                                    </button>
                                </div>

                                <textarea
                                    id="email-template-content"
                                    ref={editorRef}
                                    rows={7}
                                    value={formState.contentEn}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormState((prev) => ({
                                            ...prev,
                                            contentEn: val,
                                            contentAr: val,
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
                                    className="w-full px-3 py-2.5 text-xs bg-transparent text-[#0D0D0D] focus:outline-hidden leading-relaxed resize-y"
                                />
                            </div>

                            {formErrors.content && (
                                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A63A3A]">
                                    <AlertCircle size={12} />
                                    <span>{formErrors.content}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-medium text-[#6E6862] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                    >
                        {t('workflow.emailTemplates.drawer.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-medium text-[#FAF8F5] transition-colors cursor-pointer"
                    >
                        {t('workflow.emailTemplates.drawer.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

