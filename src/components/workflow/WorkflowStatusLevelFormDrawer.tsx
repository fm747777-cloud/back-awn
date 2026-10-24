import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
    type WorkflowStatusLevelRecord,
    type WorkflowStageCategory,
    type WorkflowSource,
    type WorkflowStatus,
    type WorkflowType,
} from '../../pages/workflow/workflowMockData';
import {
    STAGE_CATEGORIES,
    COLOR_OPTIONS,
    type StatusLevelFormState,
} from '../../pages/workflow/workflowUtils';

interface WorkflowStatusLevelFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formState: StatusLevelFormState;
    setFormState: React.Dispatch<React.SetStateAction<StatusLevelFormState>>;
    editingRecord: WorkflowStatusLevelRecord | null;
    availableWorkflows: Array<{ titleEn: string; titleAr: string; workflowType: WorkflowType; source: WorkflowSource }>;
}

export const WorkflowStatusLevelFormDrawer: React.FC<WorkflowStatusLevelFormDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formState,
    setFormState,
    editingRecord: _editingRecord,
    availableWorkflows,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px]">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-lg bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col justify-between overflow-y-auto"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <div>
                    <div className="px-6 py-5 border-b border-[#E5E0D8] flex items-center justify-between gap-3 bg-[#FAF8F5]">
                        <div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">
                                {t('workflow.statusLevels.drawer.editTitle')}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('workflow.statusLevels.drawer.formSubtitle')}
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
                                    required
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.table.order')}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={formState.levelOrder}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            levelOrder: Number(e.target.value) || 1,
                                        }))
                                    }
                                    required
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.statusLevels.table.stageCategory')}
                            </label>
                            <select
                                value={formState.stageCategory}
                                onChange={(e) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        stageCategory: e.target.value as WorkflowStageCategory,
                                    }))
                                }
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            >
                                {STAGE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('workflow.statusLevels.drawer.associatedWorkflow')}
                            </label>
                            <select
                                value={`${formState.workflowTitleEn}|||${formState.source}`}
                                onChange={(e) => {
                                    const [chosenTitle, chosenSource] = e.target.value.split('|||');
                                    const match = availableWorkflows.find(
                                        (w) =>
                                            w.titleEn === chosenTitle &&
                                            w.source === chosenSource
                                    );
                                    if (match) {
                                        setFormState((prev) => ({
                                            ...prev,
                                            workflowTitleEn: match.titleEn,
                                            workflowTitleAr: match.titleAr,
                                            workflowType: match.workflowType,
                                            source: match.source,
                                        }));
                                    }
                                }}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                            >
                                {availableWorkflows.map((wf) => (
                                    <option
                                        key={`${wf.titleEn}-${wf.source}`}
                                        value={`${wf.titleEn}|||${wf.source}`}
                                    >
                                        [{wf.source}] {isRtl ? wf.titleAr : wf.titleEn} (
                                        {wf.workflowType})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.drawer.levelNameEn')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.levelNameEn}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            levelNameEn: e.target.value,
                                        }))
                                    }
                                    required
                                    placeholder="e.g. Compliance Review"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.drawer.levelNameAr')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.levelNameAr}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            levelNameAr: e.target.value,
                                        }))
                                    }
                                    required
                                    dir="rtl"
                                    placeholder="مثال: مراجعة الامتثال"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.drawer.approverRoleEn')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.approverRoleEn}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            approverRoleEn: e.target.value,
                                        }))
                                    }
                                    required
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.drawer.approverRoleAr')}
                                </label>
                                <input
                                    type="text"
                                    value={formState.approverRoleAr}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            approverRoleAr: e.target.value,
                                        }))
                                    }
                                    required
                                    dir="rtl"
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.table.sla')} ({t('workflow.statusLevels.drawer.hours')})
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={720}
                                    value={formState.slaHours}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            slaHours: Number(e.target.value) || 12,
                                        }))
                                    }
                                    dir="ltr"
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-[#0D0D0D] focus:outline-hidden focus:bg-white focus:border-[#037F8C]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                    {t('workflow.statusLevels.table.status')}
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
                                {COLOR_OPTIONS.map((hex) => (
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

                        <div className="flex flex-wrap items-center gap-5 pt-1">
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0D0D0D] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formState.isFinalLevel}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            isFinalLevel: e.target.checked,
                                        }))
                                    }
                                    className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C]"
                                />
                                <span>{t('workflow.statusLevels.labels.finalStage')}</span>
                            </label>

                            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0D0D0D] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formState.requireComment}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            requireComment: e.target.checked,
                                        }))
                                    }
                                    className="w-4 h-4 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C]"
                                />
                                <span>
                                    {t('workflow.statusLevels.labels.commentRequired')}
                                </span>
                            </label>
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
                        {t('common.saveChanges', 'Save Changes')}
                    </button>
                </div>
            </form>
        </div>
    );
};
