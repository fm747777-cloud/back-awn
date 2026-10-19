import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    WORKFLOW_SOURCES,
    type WorkflowMasterCategory,
    type WorkflowMasterRecord,
    type WorkflowSource,
    type WorkflowStatus,
} from '../../pages/workflow/workflowMockData';

export const MASTER_COLOR_OPTIONS = [
    '#037F8C',
    '#037F8C',
    '#8C6046',
    '#6A7358',
    '#BFAB93',
    '#857E74',
    '#A63A3A',
];

export interface MasterFormState {
    category: WorkflowMasterCategory;
    code: string;
    nameEn: string;
    nameAr: string;
    moduleScope: WorkflowSource | 'GLOBAL';
    linkedWorkflowsCount: number;
    color: string;
    status: WorkflowStatus;
    descriptionEn: string;
    descriptionAr: string;
}

export const DEFAULT_MASTER_FORM_STATE: MasterFormState = {
    category: 'sources',
    code: 'SRC-NEW',
    nameEn: '',
    nameAr: '',
    moduleScope: 'CRM',
    linkedWorkflowsCount: 0,
    color: '#037F8C',
    status: 'Enabled',
    descriptionEn: '',
    descriptionAr: '',
};

interface WorkflowMasterFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formState: MasterFormState;
    setFormState: React.Dispatch<React.SetStateAction<MasterFormState>>;
    editingRecord: WorkflowMasterRecord | null;
}

export const WorkflowMasterFormDrawer: React.FC<WorkflowMasterFormDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formState,
    setFormState,
    editingRecord,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {editingRecord
                                    ? t('workflow.masters.drawer.editTitle')
                                    : t('workflow.masters.drawer.createTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('workflow.masters.drawer.formSubtitle')}
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
                        <div className="grid grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.masters.drawer.category')}
                                </label>
                                <select
                                    value={formState.category}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            category: e.target.value as WorkflowMasterCategory,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                >
                                    <option value="sources">
                                        {t('workflow.masters.tabs.sources')}
                                    </option>
                                    <option value="types">
                                        {t('workflow.masters.tabs.types')}
                                    </option>
                                    <option value="statuses">
                                        {t('workflow.masters.tabs.statuses')}
                                    </option>
                                    <option value="actions">
                                        {t('workflow.masters.tabs.actions')}
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.masters.table.code')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.code}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                        }))
                                    }
                                    dir="ltr"
                                    placeholder="SRC-CRM"
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.masters.drawer.nameEn')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formState.nameEn}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        nameEn: e.target.value,
                                    }))
                                }
                                placeholder="e.g., Approval Workflow"
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.masters.drawer.nameAr')}
                            </label>
                            <input
                                type="text"
                                value={formState.nameAr}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        nameAr: e.target.value,
                                    }))
                                }
                                placeholder="مثال: سير عمل الاعتمادات"
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.masters.table.scope')}
                                </label>
                                <select
                                    value={formState.moduleScope}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            moduleScope: e.target.value as
                                                | WorkflowSource
                                                | 'GLOBAL',
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                >
                                    <option value="GLOBAL">GLOBAL</option>
                                    {WORKFLOW_SOURCES.map((src) => (
                                        <option key={src} value={src}>
                                            {src}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.masters.table.status')}
                                </label>
                                <select
                                    value={formState.status}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: e.target.value as WorkflowStatus,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                >
                                    <option value="Enabled">
                                        {t('workflow.workflows.statuses.enabled')}
                                    </option>
                                    <option value="Disabled">
                                        {t('workflow.workflows.statuses.disabled')}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.masters.drawer.badgeColor')}
                            </label>
                            <div className="flex items-center gap-2">
                                {MASTER_COLOR_OPTIONS.map((hex) => (
                                    <button
                                        key={hex}
                                        type="button"
                                        onClick={() =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                color: hex,
                                            }))
                                        }
                                        className={`w-7 h-7 rounded-lg border-2 transition-transform cursor-pointer ${
                                            formState.color === hex
                                                ? 'border-[#0D0D0D] scale-110'
                                                : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: hex }}
                                        aria-label={hex}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.description')} (EN)
                            </label>
                            <textarea
                                rows={2}
                                value={formState.descriptionEn}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        descriptionEn: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.description')} (AR)
                            </label>
                            <textarea
                                rows={2}
                                value={formState.descriptionAr}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        descriptionAr: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            />
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
