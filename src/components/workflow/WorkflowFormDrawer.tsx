import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    WORKFLOW_SOURCES,
    type WorkflowRecord,
    type WorkflowType,
    type WorkflowStatus,
    type WorkflowSource,
} from '../../pages/workflow/workflowMockData';

export interface WorkflowFormState {
    workflowType: WorkflowType;
    titleEn: string;
    titleAr: string;
    source: WorkflowSource;
    status: WorkflowStatus;
    createDate: string;
    descriptionEn: string;
    descriptionAr: string;
    triggerEventEn: string;
    triggerEventAr: string;
    stagesCount: number;
}

interface WorkflowFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formState: WorkflowFormState;
    setFormState: React.Dispatch<React.SetStateAction<WorkflowFormState>>;
    editingRecord: WorkflowRecord | null;
}

export const WorkflowFormDrawer: React.FC<WorkflowFormDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formState,
    setFormState,
    editingRecord: _editingRecord,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
            >
                <div>
                    <div className="px-6 py-5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {t('workflow.workflows.drawer.editTitle')}
                            </h2>
                            <p className="text-[11px] text-[#6E6862]">
                                {t('workflow.workflows.drawer.formSubtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[#6E6862] hover:bg-[#EFECE6] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.workflowType')}
                            </label>
                            <select
                                value={formState.workflowType}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        workflowType: e.target.value as WorkflowType,
                                    }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                            >
                                <option value="approval">
                                    {t('workflow.workflows.tabs.approval')}
                                </option>
                                <option value="communication">
                                    {t('workflow.workflows.tabs.communication')}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.titleEn')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formState.titleEn}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        titleEn: e.target.value,
                                    }))
                                }
                                placeholder="e.g., Sector"
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.titleAr')}
                            </label>
                            <input
                                type="text"
                                value={formState.titleAr}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        titleAr: e.target.value,
                                    }))
                                }
                                placeholder="مثال: القطاع"
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.workflows.table.source')}
                                </label>
                                <select
                                    value={formState.source}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            source: e.target.value as WorkflowSource,
                                        }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                                >
                                    {WORKFLOW_SOURCES.map((src) => (
                                        <option key={src} value={src}>
                                            {src}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.workflows.table.status')}
                                </label>
                                <select
                                    value={formState.status}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            status: e.target.value as WorkflowStatus,
                                        }))
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.workflows.table.createDate')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.createDate}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            createDate: e.target.value,
                                        }))
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.workflows.drawer.stagesCount')}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formState.stagesCount}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            stagesCount: Number(e.target.value) || 1,
                                        }))
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.workflows.drawer.description')}
                            </label>
                            <textarea
                                rows={3}
                                value={formState.descriptionEn}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        descriptionEn: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#0D0D0D] focus:bg-white focus:border-[#037F8C] focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#EFECE6] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D] cursor-pointer"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233122] text-xs font-semibold text-[#FAF8F5] cursor-pointer"
                    >
                        {t('common.saveChanges')}
                    </button>
                </div>
            </form>
        </div>
    );
};
