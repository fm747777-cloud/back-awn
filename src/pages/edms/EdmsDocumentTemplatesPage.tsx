import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type ColumnDef } from '@tanstack/react-table';
import {
    MoreHorizontal,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    Type,
    AlignLeft,
    CheckSquare,
    Calendar,
    CalendarClock,
    Upload,
    ListChecks,
    Hash,
    Heading,
    Pilcrow,
    Mail,
    ChevronDownSquare,
    Plus,
    GripVertical,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '../../components/DataTable';
import {
    EDMS_DEMO_TEMPLATES,
    EDMS_TEMPLATE_TAG_OPTIONS,
    getEdmsTemplateDocTypeOptions,
    prependDemoTemplate,
    updateDemoTemplate,
    removeDemoTemplate,
    type EdmsDocumentTemplate,
    type EdmsTemplateBuilderElement,
    type EdmsTemplateBuilderElementType,
} from './edmsMockData';

const PRIMARY_TOOLBAR_ELEMENTS: EdmsTemplateBuilderElementType[] = [
    'Text Field',
    'Text Area',
    'Checkbox',
    'Date Field',
    'Expiry Date',
    'File Upload',
    'Checkbox Group',
    'Number',
];

const HEADER_CONTROL_ELEMENTS: EdmsTemplateBuilderElementType[] = [
    'Header',
    'Paragraph',
    'Email',
    'Select',
];

const renderElementIcon = (type: EdmsTemplateBuilderElementType, size = 14) => {
    switch (type) {
        case 'Text Field':
            return <Type size={size} />;
        case 'Text Area':
            return <AlignLeft size={size} />;
        case 'Checkbox':
            return <CheckSquare size={size} />;
        case 'Date Field':
            return <Calendar size={size} />;
        case 'Expiry Date':
            return <CalendarClock size={size} />;
        case 'File Upload':
            return <Upload size={size} />;
        case 'Checkbox Group':
            return <ListChecks size={size} />;
        case 'Number':
            return <Hash size={size} />;
        case 'Header':
            return <Heading size={size} />;
        case 'Paragraph':
            return <Pilcrow size={size} />;
        case 'Email':
            return <Mail size={size} />;
        case 'Select':
            return <ChevronDownSquare size={size} />;
    }
};

// --- Actions Dropdown Component (Strictly Edit & Delete only) ---
interface TemplateActionsMenuProps {
    item: EdmsDocumentTemplate;
    onEdit: (item: EdmsDocumentTemplate) => void;
    onDelete: (item: EdmsDocumentTemplate) => void;
}

const TemplateActionsMenu: React.FC<TemplateActionsMenuProps> = ({
    item,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-start" ref={menuRef}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isOpen
                        ? 'bg-[#2D3F2C] text-[#FAF8F5] border-[#2D3F2C]'
                        : 'border-transparent text-[#857E74] hover:bg-[#F8F6F2] dark:hover:bg-slate-800 hover:text-[#0D0D0D] dark:hover:text-slate-100'
                }`}
                title={t('edms.documentTemplates.columns.actions')}
                aria-label={t('edms.documentTemplates.columns.actions')}
                aria-expanded={isOpen}
            >
                <MoreHorizontal size={16} />
            </button>

            {isOpen && (
                <div className="absolute end-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-xl shadow-lg py-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 font-sans">
                    {/* 1. Edit */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onEdit(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#0D0D0D] dark:text-slate-100 hover:bg-[#FAF8F5] dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <Edit2 size={14} className="text-[#6E6862] dark:text-slate-400 shrink-0" />
                        <span>{t('edms.documentTemplates.actions.edit')}</span>
                    </button>

                    <div className="my-1 border-t border-[#F0ECE4] dark:border-slate-700" />

                    {/* 2. Delete */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDelete(item);
                        }}
                        className="w-full text-start px-3.5 py-2 text-[#A23B2A] hover:bg-[#A23B2A]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                    >
                        <Trash2 size={14} className="shrink-0" />
                        <span>{t('edms.documentTemplates.actions.delete')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Add / Edit Template Drawer with Document Template Builder ---
interface TemplateDrawerProps {
    isOpen: boolean;
    editingItem: EdmsDocumentTemplate | null;
    onClose: () => void;
    onSubmit: (
        data: {
            templateName: string;
            documentType: string;
            documentCategory: string;
            documentTag: string;
            elements: EdmsTemplateBuilderElement[];
        },
        existingItem?: EdmsDocumentTemplate | null
    ) => void;
}

const TemplateDrawer: React.FC<TemplateDrawerProps> = ({
    isOpen,
    editingItem,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));
    const isEdit = Boolean(editingItem);

    const templateNameInputRef = useRef<HTMLInputElement>(null);
    const documentTypeSelectRef = useRef<HTMLSelectElement>(null);
    const nextElemSeqRef = useRef(1);

    const [templateName, setTemplateName] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [documentCategory, setDocumentCategory] = useState<string>('');
    const [documentTag, setDocumentTag] = useState('');
    const liveDocTypeOptions = getEdmsTemplateDocTypeOptions();

    // Builder State
    const [builderElements, setBuilderElements] = useState<EdmsTemplateBuilderElement[]>([]);
    const [activeControlType, setActiveControlType] =
        useState<EdmsTemplateBuilderElementType>('Header');
    const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
    const [draggedCanvasIndex, setDraggedCanvasIndex] = useState<number | null>(null);

    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [templateNameError, setTemplateNameError] = useState<string | null>(null);
    const [documentTypeError, setDocumentTypeError] = useState<string | null>(null);

    // Sync state during render when drawer opens or target record changes
    const [prevSyncKey, setPrevSyncKey] = useState('');
    const currentSyncKey = `${isOpen}-${editingItem?.id ?? 'new'}`;
    if (currentSyncKey !== prevSyncKey) {
        setPrevSyncKey(currentSyncKey);
        setHasSubmitted(false);
        setTemplateNameError(null);
        setDocumentTypeError(null);
        setIsCanvasDragOver(false);
        setDraggedCanvasIndex(null);

        if (isOpen && editingItem) {
            setTemplateName(
                (isAr ? editingItem.templateNameAr : editingItem.templateName) ||
                    editingItem.templateName ||
                    ''
            );
            setDocumentType(editingItem.documentType);
            setDocumentCategory(editingItem.documentCategory);
            setDocumentTag(editingItem.documentTag || '');
            setBuilderElements(
                editingItem.elements
                    ? editingItem.elements.map((el) => ({
                          ...el,
                          options: el.options ? [...el.options] : undefined,
                      }))
                    : []
            );
        } else if (isOpen && !editingItem) {
            setTemplateName('');
            setDocumentType('');
            setDocumentCategory('');
            setDocumentTag('');
            setBuilderElements([]);
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleDocumentTypeChange = (nextType: string) => {
        setDocumentType(nextType);
        const matchedOption = liveDocTypeOptions.find(
            (opt) => opt.value === nextType
        );
        setDocumentCategory(matchedOption ? matchedOption.categoryAr : '');

        if (hasSubmitted && documentTypeError && nextType) {
            setDocumentTypeError(null);
        }
    };

    const createBuilderElement = (
        type: EdmsTemplateBuilderElementType
    ): EdmsTemplateBuilderElement => {
        const seq = nextElemSeqRef.current++;
        const defaultLabel = t(`edms.documentTemplates.form.builder.defaults.${type}`);
        const needsOptions = type === 'Checkbox Group' || type === 'Select';
        return {
            id: `el-${seq}-${builderElements.length + 1}`,
            type,
            label: defaultLabel,
            options: needsOptions
                ? [
                      t('edms.documentTemplates.form.builder.defaults.option1'),
                      t('edms.documentTemplates.form.builder.defaults.option2'),
                  ]
                : undefined,
        };
    };

    const handleAddElement = (
        type: EdmsTemplateBuilderElementType,
        insertIndex?: number
    ) => {
        const newEl = createBuilderElement(type);
        setBuilderElements((prev) => {
            if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= prev.length) {
                const copy = [...prev];
                copy.splice(insertIndex, 0, newEl);
                return copy;
            }
            return [...prev, newEl];
        });
    };

    const handleRemoveElement = (id: string) => {
        setBuilderElements((prev) => prev.filter((el) => el.id !== id));
    };

    const handleMoveElement = (index: number, direction: 'up' | 'down') => {
        setBuilderElements((prev) => {
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= prev.length) return prev;
            const copy = [...prev];
            const [moved] = copy.splice(index, 1);
            copy.splice(targetIndex, 0, moved);
            return copy;
        });
    };

    const handleUpdateElementLabel = (id: string, nextLabel: string) => {
        setBuilderElements((prev) =>
            prev.map((el) => (el.id === id ? { ...el, label: nextLabel } : el))
        );
    };

    const handleUpdateElementOption = (id: string, optIdx: number, nextVal: string) => {
        setBuilderElements((prev) =>
            prev.map((el) => {
                if (el.id !== id || !el.options) return el;
                const nextOpts = [...el.options];
                nextOpts[optIdx] = nextVal;
                return { ...el, options: nextOpts };
            })
        );
    };

    const handleAddElementOption = (id: string) => {
        setBuilderElements((prev) =>
            prev.map((el) => {
                if (el.id !== id) return el;
                const currentOpts = el.options || [];
                const nextIdx = currentOpts.length + 1;
                return {
                    ...el,
                    options: [
                        ...currentOpts,
                        t('edms.documentTemplates.form.builder.optionPlaceholder', {
                            index: nextIdx,
                        }),
                    ],
                };
            })
        );
    };

    const handleRemoveElementOption = (id: string, optIdx: number) => {
        setBuilderElements((prev) =>
            prev.map((el) => {
                if (el.id !== id || !el.options || el.options.length <= 1) return el;
                return {
                    ...el,
                    options: el.options.filter((_, idx) => idx !== optIdx),
                };
            })
        );
    };

    // Drag & Drop handlers
    const handleToolbarDragStart = (
        e: React.DragEvent,
        type: EdmsTemplateBuilderElementType
    ) => {
        e.dataTransfer.setData('application/awn-builder-new-type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleCanvasItemDragStart = (e: React.DragEvent, index: number) => {
        setDraggedCanvasIndex(index);
        e.dataTransfer.setData('application/awn-builder-reorder-index', String(index));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleCanvasDrop = (e: React.DragEvent, targetIndex?: number) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCanvasDragOver(false);

        const newType = e.dataTransfer.getData(
            'application/awn-builder-new-type'
        ) as EdmsTemplateBuilderElementType;

        if (newType) {
            handleAddElement(newType, targetIndex);
            setDraggedCanvasIndex(null);
            return;
        }

        const reorderIdxStr = e.dataTransfer.getData('application/awn-builder-reorder-index');
        if (reorderIdxStr !== '') {
            const fromIndex = parseInt(reorderIdxStr, 10);
            const toIndex =
                typeof targetIndex === 'number' ? targetIndex : builderElements.length - 1;
            if (!isNaN(fromIndex) && fromIndex !== toIndex) {
                setBuilderElements((prev) => {
                    const copy = [...prev];
                    const [moved] = copy.splice(fromIndex, 1);
                    copy.splice(toIndex, 0, moved);
                    return copy;
                });
            }
        }
        setDraggedCanvasIndex(null);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);

        const trimmedName = templateName.trim();
        let firstInvalid: 'name' | 'type' | null = null;

        if (!trimmedName) {
            setTemplateNameError(t('edms.documentTemplates.form.errors.templateNameRequired'));
            firstInvalid = 'name';
        } else {
            setTemplateNameError(null);
        }

        if (!documentType) {
            setDocumentTypeError(t('edms.documentTemplates.form.errors.documentTypeRequired'));
            if (!firstInvalid) firstInvalid = 'type';
        } else {
            setDocumentTypeError(null);
        }

        if (firstInvalid === 'name') {
            templateNameInputRef.current?.focus();
            templateNameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (firstInvalid === 'type') {
            documentTypeSelectRef.current?.focus();
            documentTypeSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const matchedTypeOption = liveDocTypeOptions.find(
            (opt) => opt.value === documentType
        );
        const resolvedCategory: string =
            documentCategory ||
            matchedTypeOption?.categoryAr ||
            'منشأت';

        onSubmit(
            {
                templateName: trimmedName,
                documentType,
                documentCategory: resolvedCategory,
                documentTag,
                elements: builderElements,
            },
            editingItem
        );
    };

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!isOpen}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Right/End-side Drawer */}
            <div
                className={`fixed top-0 end-0 h-full w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col text-start ${
                    isOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E0D8] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isEdit
                                ? t('edms.documentTemplates.form.editTitle')
                                : t('edms.documentTemplates.form.createTitle')}
                        </h2>
                        <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-0.5">
                            {isEdit
                                ? t('edms.documentTemplates.form.editSubtitle', {
                                      code: editingItem?.templateCode || '',
                                  })
                                : t('edms.documentTemplates.form.createSubtitle')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-[#857E74] hover:text-[#0D0D0D] dark:hover:text-slate-200 rounded-lg hover:bg-[#F8F6F2] dark:hover:bg-slate-800 transition cursor-pointer"
                        title={t('common.close')}
                        aria-label={t('common.close')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="awn-edms-template-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="p-6 overflow-y-auto flex-1 space-y-6"
                >
                    {/* Existing 4 Metadata Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Template Name * */}
                        <div>
                            <label
                                htmlFor="edms-template-name-input"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('edms.documentTemplates.form.templateName')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <input
                                id="edms-template-name-input"
                                name="templateName"
                                ref={templateNameInputRef}
                                type="text"
                                value={templateName}
                                aria-invalid={Boolean(hasSubmitted && templateNameError)}
                                onChange={(e) => {
                                    setTemplateName(e.target.value);
                                    if (
                                        hasSubmitted &&
                                        templateNameError &&
                                        e.target.value.trim()
                                    ) {
                                        setTemplateNameError(null);
                                    }
                                }}
                                placeholder={t(
                                    'edms.documentTemplates.form.templateNamePlaceholder'
                                )}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition ${
                                    hasSubmitted && templateNameError
                                        ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                        : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            />
                            {hasSubmitted && templateNameError && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {templateNameError}
                                </span>
                            )}
                        </div>

                        {/* 2. Document Type * */}
                        <div>
                            <label
                                htmlFor="edms-document-type-select"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('edms.documentTemplates.form.documentType')}{' '}
                                <span className="text-[#A23B2A]">*</span>
                            </label>
                            <select
                                id="edms-document-type-select"
                                name="documentType"
                                ref={documentTypeSelectRef}
                                value={documentType}
                                aria-invalid={Boolean(hasSubmitted && documentTypeError)}
                                onChange={(e) => handleDocumentTypeChange(e.target.value)}
                                className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition cursor-pointer ${
                                    hasSubmitted && documentTypeError
                                        ? 'bg-white dark:bg-slate-800 border-red-400 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-400/20'
                                        : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#E5E0D8] dark:border-slate-700 text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C]'
                                }`}
                            >
                                <option value="">
                                    {t('edms.documentTemplates.form.documentTypePlaceholder')}
                                </option>
                                {liveDocTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {isAr ? opt.labelAr : opt.labelEn}
                                    </option>
                                ))}
                            </select>
                            {hasSubmitted && documentTypeError && (
                                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                                    {documentTypeError}
                                </span>
                            )}
                        </div>

                        {/* 3. Document Category (Derived from selected Document Type) */}
                        <div>
                            <label
                                htmlFor="edms-document-category-display"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('edms.documentTemplates.form.documentCategory')}
                            </label>
                            <input
                                id="edms-document-category-display"
                                name="documentCategory"
                                type="text"
                                readOnly
                                value={documentCategory}
                                placeholder={t(
                                    'edms.documentTemplates.form.documentCategoryPlaceholder'
                                )}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-[#EFECE6]/60 dark:bg-slate-800/50 border border-[#E5E0D8] dark:border-slate-700 text-xs font-medium text-[#2D3F2C] dark:text-emerald-300 placeholder-[#857E74] cursor-default focus:outline-none"
                            />
                        </div>

                        {/* 4. Tag (Optional) */}
                        <div>
                            <label
                                htmlFor="edms-document-tag-select"
                                className="block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200 mb-1.5"
                            >
                                {t('edms.documentTemplates.form.tag')}{' '}
                                <span className="text-[#857E74] font-normal">
                                    {t('common.optional')}
                                </span>
                            </label>
                            <select
                                id="edms-document-tag-select"
                                name="documentTag"
                                value={documentTag}
                                onChange={(e) => setDocumentTag(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 focus:border-[#2D3F2C] transition cursor-pointer"
                            >
                                <option value="">
                                    {t('edms.documentTemplates.form.tagPlaceholder')}
                                </option>
                                {EDMS_TEMPLATE_TAG_OPTIONS.map((tagOpt) => (
                                    <option key={tagOpt.value} value={tagOpt.value}>
                                        {isAr ? tagOpt.labelAr : tagOpt.labelEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Document Template Builder Section */}
                    <div className="pt-4 border-t border-[#E5E0D8] dark:border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('edms.documentTemplates.form.builder.title')}
                                </h3>
                                <p className="text-[11px] text-[#6E6862] dark:text-slate-400 mt-0.5">
                                    {t('edms.documentTemplates.form.builder.subtitle')}
                                </p>
                            </div>

                            {/* Observed Header / Element Controls: Header, Paragraph, Email, Select, + */}
                            <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF8F5] dark:bg-slate-800/80 border border-[#E5E0D8] dark:border-slate-700 rounded-xl p-1.5">
                                {HEADER_CONTROL_ELEMENTS.map((ctrlType) => {
                                    const isSelectedCtrl = activeControlType === ctrlType;
                                    return (
                                        <button
                                            key={ctrlType}
                                            type="button"
                                            draggable
                                            onDragStart={(e) =>
                                                handleToolbarDragStart(e, ctrlType)
                                            }
                                            onClick={() => {
                                                setActiveControlType(ctrlType);
                                                handleAddElement(ctrlType);
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-grab active:cursor-grabbing ${
                                                isSelectedCtrl
                                                    ? 'bg-white dark:bg-slate-900 text-[#2D3F2C] dark:text-emerald-300 border border-[#DCD6CD] dark:border-slate-600 shadow-2xs'
                                                    : 'text-[#595550] dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-[#0D0D0D]'
                                            }`}
                                        >
                                            <span className="text-[#6A7358] dark:text-emerald-400">
                                                {renderElementIcon(ctrlType, 13)}
                                            </span>
                                            <span>
                                                {t(
                                                    `edms.documentTemplates.form.builder.elements.${ctrlType}`
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}

                                {/* + Control Button */}
                                <button
                                    type="button"
                                    onClick={() => handleAddElement(activeControlType)}
                                    title={t(
                                        'edms.documentTemplates.form.builder.quickAddTitle'
                                    )}
                                    aria-label="+"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-[#FAF8F5] text-xs font-bold shadow-2xs transition cursor-pointer"
                                >
                                    <Plus size={14} className="text-[#BFAB93]" />
                                </button>
                            </div>
                        </div>

                        {/* Available Elements Toolbar (8 Primary Elements) */}
                        <div className="bg-[#FAF8F5] dark:bg-slate-800/50 border border-[#E5E0D8] dark:border-slate-800 rounded-xl p-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6862] dark:text-slate-400 mb-2.5">
                                {t('edms.documentTemplates.form.builder.availableElements')}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {PRIMARY_TOOLBAR_ELEMENTS.map((elemType) => (
                                    <button
                                        key={elemType}
                                        type="button"
                                        draggable
                                        onDragStart={(e) => handleToolbarDragStart(e, elemType)}
                                        onClick={() => {
                                            setActiveControlType(elemType);
                                            handleAddElement(elemType);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 hover:border-[#2D3F2C] dark:hover:border-emerald-500/50 text-xs font-medium text-[#0D0D0D] dark:text-slate-100 shadow-2xs hover:shadow-xs transition cursor-grab active:cursor-grabbing text-start group"
                                    >
                                        <span className="w-6 h-6 rounded-md bg-[#2D3F2C]/10 dark:bg-slate-800 text-[#2D3F2C] dark:text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-[#2D3F2C] group-hover:text-[#FAF8F5] transition-colors">
                                            {renderElementIcon(elemType, 13)}
                                        </span>
                                        <span className="truncate">
                                            {t(
                                                `edms.documentTemplates.form.builder.elements.${elemType}`
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Template Canvas Drop Zone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (!isCanvasDragOver) setIsCanvasDragOver(true);
                            }}
                            onDragLeave={() => setIsCanvasDragOver(false)}
                            onDrop={(e) => handleCanvasDrop(e)}
                            className={`rounded-xl border-2 border-dashed transition-colors p-4 min-h-[240px] ${
                                isCanvasDragOver
                                    ? 'border-[#2D3F2C] bg-[#2D3F2C]/5 dark:bg-emerald-950/20'
                                    : 'border-[#DCD6CD] dark:border-slate-700 bg-[#FAF8F5]/50 dark:bg-slate-900/50'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EFECE6] dark:border-slate-800">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#595550] dark:text-slate-300">
                                    {t('edms.documentTemplates.form.builder.canvasTitle')}
                                </span>
                                <span
                                    className="text-[11px] font-mono font-bold text-[#2D3F2C] dark:text-emerald-300"
                                    dir="ltr"
                                >
                                    {t('edms.documentTemplates.form.builder.elementsCount', {
                                        count: builderElements.length,
                                    })}
                                </span>
                            </div>

                            {builderElements.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 flex items-center justify-center text-[#857E74] mb-2.5 shadow-2xs">
                                        <Plus size={18} />
                                    </div>
                                    <p className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-200">
                                        {t('edms.documentTemplates.form.builder.emptyCanvasTitle')}
                                    </p>
                                    <p className="text-[11px] text-[#6E6862] dark:text-slate-400 mt-1 max-w-sm">
                                        {t(
                                            'edms.documentTemplates.form.builder.emptyCanvasSubtitle'
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {builderElements.map((el, index) => (
                                        <div
                                            key={el.id}
                                            draggable
                                            onDragStart={(e) => handleCanvasItemDragStart(e, index)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleCanvasDrop(e, index)}
                                            className={`bg-white dark:bg-slate-800 border rounded-xl p-3.5 shadow-2xs transition ${
                                                draggedCanvasIndex === index
                                                    ? 'opacity-50 border-[#2D3F2C]'
                                                    : 'border-[#E5E0D8] dark:border-slate-700 hover:border-[#BFAB93]'
                                            }`}
                                        >
                                            {/* Element Card Header: Drag Grip + Element Type Badge + Reorder & Remove Controls */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[#857E74] cursor-grab active:cursor-grabbing">
                                                        <GripVertical size={14} />
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#2D3F2C]/10 dark:bg-slate-700 text-[#2D3F2C] dark:text-emerald-300">
                                                        {renderElementIcon(el.type, 12)}
                                                        <span>
                                                            {t(
                                                                `edms.documentTemplates.form.builder.elements.${el.type}`
                                                            )}
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleMoveElement(index, 'up')
                                                        }
                                                        disabled={index === 0}
                                                        title={t(
                                                            'edms.documentTemplates.form.builder.moveUp'
                                                        )}
                                                        className="p-1 rounded hover:bg-[#FAF8F5] dark:hover:bg-slate-700 text-[#6E6862] dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                                    >
                                                        <ArrowUp size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleMoveElement(index, 'down')
                                                        }
                                                        disabled={
                                                            index === builderElements.length - 1
                                                        }
                                                        title={t(
                                                            'edms.documentTemplates.form.builder.moveDown'
                                                        )}
                                                        className="p-1 rounded hover:bg-[#FAF8F5] dark:hover:bg-slate-700 text-[#6E6862] dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                                    >
                                                        <ArrowDown size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveElement(el.id)}
                                                        title={t(
                                                            'edms.documentTemplates.form.builder.removeElement'
                                                        )}
                                                        className="p-1 rounded hover:bg-[#A23B2A]/10 text-[#A23B2A] transition cursor-pointer"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Basic Element Configuration Body */}
                                            <div className="space-y-2.5">
                                                <div>
                                                    <label className="block text-[11px] font-medium text-[#6E6862] dark:text-slate-400 mb-1">
                                                        {el.type === 'Header'
                                                            ? t(
                                                                  'edms.documentTemplates.form.builder.headingText'
                                                              )
                                                            : el.type === 'Paragraph'
                                                            ? t(
                                                                  'edms.documentTemplates.form.builder.paragraphText'
                                                              )
                                                            : t(
                                                                  'edms.documentTemplates.form.builder.fieldLabel'
                                                              )}
                                                    </label>
                                                    {el.type === 'Paragraph' ? (
                                                        <textarea
                                                            rows={2}
                                                            value={el.label}
                                                            onChange={(e) =>
                                                                handleUpdateElementLabel(
                                                                    el.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={el.label}
                                                            onChange={(e) =>
                                                                handleUpdateElementLabel(
                                                                    el.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`w-full px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C] ${
                                                                el.type === 'Header'
                                                                    ? 'font-bold'
                                                                    : ''
                                                            }`}
                                                        />
                                                    )}
                                                </div>

                                                {/* Compact Visual Field Preview by Element Type */}
                                                {el.type === 'Text Field' && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] text-[#857E74]">
                                                        {el.label || t('edms.documentTemplates.form.builder.elements.Text Field')}...
                                                    </div>
                                                )}
                                                {el.type === 'Text Area' && (
                                                    <div className="px-3 py-2.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] text-[#857E74] min-h-[44px]">
                                                        {el.label || t('edms.documentTemplates.form.builder.elements.Text Area')}...
                                                    </div>
                                                )}
                                                {el.type === 'Checkbox' && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] text-[#595550] dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            disabled
                                                            className="rounded border-[#DCD6CD]"
                                                        />
                                                        <span>{el.label}</span>
                                                    </div>
                                                )}
                                                {(el.type === 'Date Field' || el.type === 'Expiry Date') && (
                                                    <div
                                                        className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] font-mono text-[#857E74]"
                                                        dir="ltr"
                                                    >
                                                        <span>YYYY-MM-DD</span>
                                                        <Calendar size={12} />
                                                    </div>
                                                )}
                                                {el.type === 'File Upload' && (
                                                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] text-[#6E6862] dark:text-slate-400">
                                                        <Upload size={13} className="text-[#2D3F2C] dark:text-emerald-300" />
                                                        <span>{el.label}</span>
                                                    </div>
                                                )}
                                                {el.type === 'Number' && (
                                                    <div
                                                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] font-mono text-[#857E74]"
                                                        dir="ltr"
                                                    >
                                                        0
                                                    </div>
                                                )}
                                                {el.type === 'Email' && (
                                                    <div
                                                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5]/60 dark:bg-slate-900/50 border border-dashed border-[#DCD6CD] dark:border-slate-700 text-[11px] font-mono text-[#857E74]"
                                                        dir="ltr"
                                                    >
                                                        name@company.sa
                                                    </div>
                                                )}

                                                {/* Options Configuration for Checkbox Group and Select */}
                                                {(el.type === 'Checkbox Group' ||
                                                    el.type === 'Select') &&
                                                    el.options && (
                                                        <div className="pt-1 space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-medium text-[#6E6862] dark:text-slate-400">
                                                                    {t(
                                                                        'edms.documentTemplates.form.builder.optionsLabel'
                                                                    )}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleAddElementOption(
                                                                            el.id
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D3F2C] dark:text-emerald-300 hover:underline cursor-pointer"
                                                                >
                                                                    <Plus size={12} />
                                                                    <span>
                                                                        {t(
                                                                            'edms.documentTemplates.form.builder.addOption'
                                                                        )}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {el.options.map(
                                                                    (optVal, optIdx) => (
                                                                        <div
                                                                            key={optIdx}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            {el.type ===
                                                                                'Checkbox Group' && (
                                                                                <input
                                                                                    type="checkbox"
                                                                                    disabled
                                                                                    className="rounded border-[#DCD6CD]"
                                                                                />
                                                                            )}
                                                                            <input
                                                                                type="text"
                                                                                value={optVal}
                                                                                onChange={(e) =>
                                                                                    handleUpdateElementOption(
                                                                                        el.id,
                                                                                        optIdx,
                                                                                        e.target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                className="flex-1 px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-700 text-xs text-[#0D0D0D] dark:text-slate-100 focus:outline-none focus:border-[#2D3F2C]"
                                                                            />
                                                                            {el.options &&
                                                                                el.options.length >
                                                                                    1 && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleRemoveElementOption(
                                                                                                el.id,
                                                                                                optIdx
                                                                                            )
                                                                                        }
                                                                                        className="p-1 text-[#857E74] hover:text-[#A23B2A] transition cursor-pointer"
                                                                                    >
                                                                                        <X
                                                                                            size={
                                                                                                12
                                                                                            }
                                                                                        />
                                                                                    </button>
                                                                                )}
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Sticky Footer */}
                <div className="px-6 py-4 border-t border-[#E5E0D8] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-900 flex justify-end gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                    >
                        {t('edms.documentTemplates.form.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="awn-edms-template-form"
                        className="px-5 py-2 text-xs font-semibold text-white bg-[#2D3F2C] hover:bg-[#233222] rounded-lg shadow-xs transition cursor-pointer"
                    >
                        {t('edms.documentTemplates.form.saveTemplate')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main EDMS Document Templates Page ---
export const EdmsDocumentTemplatesPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = Boolean(i18n.language?.startsWith('ar'));

    const [templates, setTemplates] = useState<EdmsDocumentTemplate[]>(() => [
        ...EDMS_DEMO_TEMPLATES,
    ]);
    const [searchValue, setSearchValue] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Drawer & Delete Modal state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EdmsDocumentTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<EdmsDocumentTemplate | null>(null);

    const filteredTemplates = useMemo(() => {
        const q = searchValue.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter(
            (item) =>
                item.templateCode.toLowerCase().includes(q) ||
                item.templateName.toLowerCase().includes(q) ||
                item.templateNameAr.toLowerCase().includes(q) ||
                item.documentTag.toLowerCase().includes(q) ||
                item.documentCategory.toLowerCase().includes(q) ||
                item.documentType.toLowerCase().includes(q) ||
                item.documentTypeAr.toLowerCase().includes(q) ||
                item.createdByEn.toLowerCase().includes(q) ||
                item.createdByAr.toLowerCase().includes(q)
        );
    }, [templates, searchValue]);

    const paginatedTemplates = useMemo(() => {
        const start = pageIndex * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
    }, [filteredTemplates, pageIndex, pageSize]);

    const handleSearchChange = useCallback((val: string) => {
        setSearchValue(val);
        setPageIndex(0);
    }, []);

    const handleOpenCreate = useCallback(() => {
        setEditingTemplate(null);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenEdit = useCallback((item: EdmsDocumentTemplate) => {
        setEditingTemplate(item);
        setIsDrawerOpen(true);
    }, []);

    const handleOpenDelete = useCallback((item: EdmsDocumentTemplate) => {
        setDeletingTemplate(item);
    }, []);

    const handleFormSubmit = useCallback(
        (
            formData: {
                templateName: string;
                documentType: string;
                documentCategory: string;
                documentTag: string;
                elements: EdmsTemplateBuilderElement[];
            },
            existingItem?: EdmsDocumentTemplate | null
        ) => {
            const matchedDocType = getEdmsTemplateDocTypeOptions().find(
                (opt) => opt.value === formData.documentType
            );
            const docTypeAr = matchedDocType
                ? matchedDocType.labelAr.split(' (')[0]
                : formData.documentType;

            if (existingItem) {
                const updated: EdmsDocumentTemplate = {
                    ...existingItem,
                    templateName: formData.templateName,
                    templateNameAr: formData.templateName,
                    documentType: formData.documentType,
                    documentTypeAr: docTypeAr,
                    documentCategory: formData.documentCategory,
                    documentTag: formData.documentTag,
                    elements: formData.elements,
                };
                updateDemoTemplate(updated);
                setTemplates([...EDMS_DEMO_TEMPLATES]);
                setIsDrawerOpen(false);
                setEditingTemplate(null);
                toast.success(t('edms.documentTemplates.feedback.editSuccess'));
            } else {
                const maxNum = templates.reduce((max, item) => {
                    const num = parseInt(item.templateCode.replace(/\D/g, ''), 10);
                    return !isNaN(num) && num > max ? num : max;
                }, 54);
                const nextCode = `DTP${String(maxNum + 1).padStart(3, '0')}`;

                const newRecord: EdmsDocumentTemplate = {
                    id: `tpl-${templates.length + 1}-${maxNum + 1}`,
                    templateCode: nextCode,
                    templateName: formData.templateName,
                    templateNameAr: formData.templateName,
                    createDate: '2026-04-05',
                    documentTag: formData.documentTag,
                    documentCategory: formData.documentCategory,
                    documentType: formData.documentType,
                    documentTypeAr: docTypeAr,
                    createdByEn: 'System Admin',
                    createdByAr: 'مسؤول النظام',
                    createdByEmail: 'admin@awn.sa',
                    status: 'Active',
                    elements: formData.elements,
                };

                prependDemoTemplate(newRecord);
                setTemplates([...EDMS_DEMO_TEMPLATES]);
                setPageIndex(0);
                setIsDrawerOpen(false);
                toast.success(t('edms.documentTemplates.feedback.createSuccess'));
            }
        },
        [templates, t]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!deletingTemplate) return;
        removeDemoTemplate(deletingTemplate.id);
        const nextList = [...EDMS_DEMO_TEMPLATES];
        setTemplates(nextList);

        const maxPage = Math.max(0, Math.ceil(nextList.length / pageSize) - 1);
        if (pageIndex > maxPage) {
            setPageIndex(maxPage);
        }

        setDeletingTemplate(null);
        toast.success(t('edms.documentTemplates.feedback.deleteSuccess'));
    }, [deletingTemplate, pageIndex, pageSize, t]);

    const handleExportCsv = useCallback(() => {
        const headers = [
            t('edms.documentTemplates.columns.templateCode'),
            t('edms.documentTemplates.columns.templateName'),
            t('edms.documentTemplates.columns.createDate'),
            t('edms.documentTemplates.columns.documentTags'),
            t('edms.documentTemplates.columns.documentCategory'),
            t('edms.documentTemplates.columns.documentType'),
            t('edms.documentTemplates.columns.createdBy'),
            t('edms.documentTemplates.columns.status'),
        ];

        const escapeCsv = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const rows = filteredTemplates.map((item) => [
            escapeCsv(item.templateCode),
            escapeCsv(isAr ? item.templateNameAr : item.templateName),
            escapeCsv(item.createDate),
            escapeCsv(item.documentTag || '—'),
            escapeCsv(item.documentCategory),
            escapeCsv(isAr ? item.documentTypeAr : item.documentType),
            escapeCsv(isAr ? item.createdByAr : item.createdByEn),
            escapeCsv(t('common.active')),
        ]);

        const csvContent =
            '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'edms-document-templates.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(
            t('edms.documentTemplates.exportSuccess', {
                count: filteredTemplates.length,
            })
        );
    }, [filteredTemplates, isAr, t]);

    // Columns in exact required order:
    // 1. Template Code
    // 2. Template Name
    // 3. Create Date
    // 4. Document Tags
    // 5. Document Category
    // 6. Document Type
    // 7. Created By
    // 8. Status
    // 9. Actions
    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                accessorKey: 'templateCode',
                header: t('edms.documentTemplates.columns.templateCode'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <span
                        className="font-semibold font-mono text-xs text-[#2D3F2C] dark:text-emerald-300"
                        dir="ltr"
                    >
                        {row.original.templateCode}
                    </span>
                ),
            },
            {
                id: 'templateName',
                header: t('edms.documentTemplates.columns.templateName'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <span className="font-medium text-[#0D0D0D] dark:text-slate-100 inline-block text-start">
                        {isAr ? row.original.templateNameAr : row.original.templateName}
                    </span>
                ),
            },
            {
                accessorKey: 'createDate',
                header: t('edms.documentTemplates.columns.createDate'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <span className="font-mono text-xs text-[#6E6862] dark:text-slate-400" dir="ltr">
                        {row.original.createDate}
                    </span>
                ),
            },
            {
                accessorKey: 'documentTag',
                header: t('edms.documentTemplates.columns.documentTags'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) =>
                    row.original.documentTag ? (
                        <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] dark:bg-slate-800 text-[#595550] dark:text-slate-300 border border-[#E5E0D8] dark:border-slate-700"
                            dir="ltr"
                        >
                            {row.original.documentTag}
                        </span>
                    ) : (
                        <span className="text-[#857E74]">—</span>
                    ),
            },
            {
                accessorKey: 'documentCategory',
                header: t('edms.documentTemplates.columns.documentCategory'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-slate-200 border border-[#E5E0D8] dark:border-slate-700">
                        {row.original.documentCategory}
                    </span>
                ),
            },
            {
                id: 'documentType',
                header: t('edms.documentTemplates.columns.documentType'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <span className="text-[#0D0D0D] dark:text-slate-200 font-medium">
                        {isAr ? row.original.documentTypeAr : row.original.documentType}
                    </span>
                ),
            },
            {
                id: 'createdBy',
                header: t('edms.documentTemplates.columns.createdBy'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <div className="flex flex-col text-start">
                        <span className="font-medium text-[#0D0D0D] dark:text-slate-100">
                            {isAr ? row.original.createdByAr : row.original.createdByEn}
                        </span>
                        <span className="text-[10px] text-[#857E74] font-mono" dir="ltr">
                            {row.original.createdByEmail}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: t('edms.documentTemplates.columns.status'),
                cell: () => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D3F2C]/10 text-[#2D3F2C] dark:bg-emerald-900/30 dark:text-emerald-300 border border-[#2D3F2C]/20 dark:border-emerald-700/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D3F2C] dark:bg-emerald-400" />
                        {t('common.active')}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: t('edms.documentTemplates.columns.actions'),
                cell: ({ row }: { row: { original: EdmsDocumentTemplate } }) => (
                    <TemplateActionsMenu
                        item={row.original}
                        onEdit={handleOpenEdit}
                        onDelete={handleOpenDelete}
                    />
                ),
            },
        ],
        [handleOpenDelete, handleOpenEdit, isAr, t]
    );

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={paginatedTemplates}
                count={filteredTemplates.length}
                loading={false}
                title={t('edms.documentTemplates.title')}
                description={t('edms.documentTemplates.description')}
                addNewLabel={t('edms.documentTemplates.addNew')}
                searchPlaceholder={t('edms.documentTemplates.searchPlaceholder')}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
                onPageSizeChange={setPageSize}
                onAddNew={handleOpenCreate}
                onExport={handleExportCsv}
            />

            {/* Add / Edit Template Drawer with Builder */}
            <TemplateDrawer
                isOpen={isDrawerOpen}
                editingItem={editingTemplate}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingTemplate(null);
                }}
                onSubmit={handleFormSubmit}
            />

            {/* Delete Confirmation Modal */}
            {deletingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-start animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-[#A23B2A]/10 text-[#A23B2A] flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#0D0D0D] dark:text-slate-100">
                                    {t('edms.documentTemplates.deleteModal.title')}
                                </h3>
                                <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1.5 leading-relaxed">
                                    {t('edms.documentTemplates.deleteModal.message', {
                                        code: deletingTemplate.templateCode,
                                        name: isAr
                                            ? deletingTemplate.templateNameAr
                                            : deletingTemplate.templateName,
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#EFECE6] dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingTemplate(null)}
                                className="px-4 py-2 text-xs font-semibold text-[#595550] dark:text-slate-300 bg-white dark:bg-slate-800 border border-[#E5E0D8] dark:border-slate-700 rounded-lg hover:bg-[#F8F6F2] transition cursor-pointer"
                            >
                                {t('edms.documentTemplates.deleteModal.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-xs font-semibold text-white bg-[#A23B2A] hover:bg-[#8B3122] rounded-lg shadow-xs transition cursor-pointer"
                            >
                                {t('edms.documentTemplates.deleteModal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
