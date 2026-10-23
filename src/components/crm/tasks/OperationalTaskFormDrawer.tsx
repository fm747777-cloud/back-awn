import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertCircle, ClipboardList } from 'lucide-react';
import {
    CRM_SALES_EMPLOYEES,
    type CrmOperationalRelatedEntityOption,
} from '../../../api/api';
import {
    crmOperationalTaskInputSchema,
    CRM_OPERATIONAL_RELATED_ENTITY_TYPE_VALUES,
    CRM_OPERATIONAL_TASK_STATUS_VALUES,
    CRM_TASK_PRIORITY_VALUES,
    type CrmOperationalTaskInput,
    type CrmOperationalTaskRecord,
    type CrmOperationalRelatedEntityType,
} from '../../../schemas/crmSchema';

export interface OperationalTaskFormDrawerProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    record: CrmOperationalTaskRecord | null;
    relatedEntities: CrmOperationalRelatedEntityOption[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmOperationalTaskInput) => void;
}

const DEFAULT_DUE_DATE = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split('T')[0];

export const OperationalTaskFormDrawer: React.FC<
    OperationalTaskFormDrawerProps
> = ({
    isOpen,
    mode,
    record,
    relatedEntities,
    isSubmitting = false,
    serverError,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultEmp = CRM_SALES_EMPLOYEES[0];
    const defaultDueDate = DEFAULT_DUE_DATE;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CrmOperationalTaskInput>({
        resolver: zodResolver(crmOperationalTaskInputSchema),
        defaultValues: {
            titleEn: '',
            titleAr: '',
            relatedEntityType: 'Deal',
            relatedEntityId: '',
            relatedEntityCode: '',
            relatedEntityNameEn: '',
            relatedEntityNameAr: '',
            companyId: '',
            companyNameEn: '',
            companyNameAr: '',
            priority: 'High',
            taskStatus: 'Assigned',
            dueDate: defaultDueDate,
            assignedSpecialistId: defaultEmp?.id || '',
            assignedSpecialistNameEn: defaultEmp?.nameEn || '',
            assignedSpecialistNameAr: defaultEmp?.nameAr || '',
            departmentEn: defaultEmp?.departmentEn || '',
            departmentAr: defaultEmp?.departmentAr || '',
            designationEn: defaultEmp?.roleEn || '',
            designationAr: defaultEmp?.roleAr || '',
            notes: '',
        },
    });

    const selectedEntityType =
        useWatch({ control, name: 'relatedEntityType' }) || 'Deal';
    const selectedEntityId =
        useWatch({ control, name: 'relatedEntityId' }) || '';
    const selectedSpecialistId =
        useWatch({ control, name: 'assignedSpecialistId' }) || '';
    const currentTaskStatus =
        useWatch({ control, name: 'taskStatus' }) || 'Assigned';

    useEffect(() => {
        if (!isOpen) return;
        if (mode === 'edit' && record) {
            reset({
                titleEn: record.titleEn,
                titleAr: record.titleAr || '',
                relatedEntityType: record.relatedEntityType,
                relatedEntityId: record.relatedEntityId,
                relatedEntityCode: record.relatedEntityCode || '',
                relatedEntityNameEn: record.relatedEntityNameEn || '',
                relatedEntityNameAr: record.relatedEntityNameAr || '',
                companyId: record.companyId || '',
                companyNameEn: record.companyNameEn || '',
                companyNameAr: record.companyNameAr || '',
                priority: record.priority,
                taskStatus: record.taskStatus,
                dueDate: record.dueDate,
                assignedSpecialistId: record.assignedSpecialistId || '',
                assignedSpecialistNameEn: record.assignedSpecialistNameEn || '',
                assignedSpecialistNameAr: record.assignedSpecialistNameAr || '',
                departmentEn: record.departmentEn || '',
                departmentAr: record.departmentAr || '',
                designationEn: record.designationEn || '',
                designationAr: record.designationAr || '',
                notes: record.notes || '',
            });
        } else {
            const firstDeal = relatedEntities.find(
                (r) => r.entityType === 'Deal'
            );
            const firstEmp = CRM_SALES_EMPLOYEES[0];
            reset({
                titleEn: '',
                titleAr: '',
                relatedEntityType: 'Deal',
                relatedEntityId: firstDeal?.id || '',
                relatedEntityCode: firstDeal?.code || '',
                relatedEntityNameEn: firstDeal?.nameEn || '',
                relatedEntityNameAr: firstDeal?.nameAr || '',
                companyId: firstDeal?.companyId || '',
                companyNameEn: firstDeal?.companyNameEn || '',
                companyNameAr: firstDeal?.companyNameAr || '',
                priority: 'High',
                taskStatus: 'Assigned',
                dueDate: defaultDueDate,
                assignedSpecialistId: firstEmp.id,
                assignedSpecialistNameEn: firstEmp.nameEn,
                assignedSpecialistNameAr: firstEmp.nameAr,
                departmentEn: firstEmp.departmentEn,
                departmentAr: firstEmp.departmentAr,
                designationEn: firstEmp.roleEn,
                designationAr: firstEmp.roleAr,
                notes: '',
            });
        }
    }, [isOpen, mode, record, relatedEntities, reset, defaultDueDate]);

    const filteredRelatedOptions = relatedEntities.filter(
        (opt) => opt.entityType === selectedEntityType
    );

    const handleEntityTypeChange = (
        newType: CrmOperationalRelatedEntityType
    ) => {
        setValue('relatedEntityType', newType, { shouldValidate: true });
        const firstMatching = relatedEntities.find(
            (opt) => opt.entityType === newType
        );
        if (firstMatching) {
            setValue('relatedEntityId', firstMatching.id, {
                shouldValidate: true,
            });
            setValue('relatedEntityCode', firstMatching.code);
            setValue('relatedEntityNameEn', firstMatching.nameEn);
            setValue('relatedEntityNameAr', firstMatching.nameAr);
            setValue('companyId', firstMatching.companyId || '');
            setValue('companyNameEn', firstMatching.companyNameEn || '');
            setValue('companyNameAr', firstMatching.companyNameAr || '');
        } else {
            setValue('relatedEntityId', '');
        }
    };

    const handleRelatedRecordChange = (entityId: string) => {
        setValue('relatedEntityId', entityId, { shouldValidate: true });
        const found = relatedEntities.find(
            (opt) =>
                opt.entityType === selectedEntityType && opt.id === entityId
        );
        if (found) {
            setValue('relatedEntityCode', found.code);
            setValue('relatedEntityNameEn', found.nameEn);
            setValue('relatedEntityNameAr', found.nameAr);
            setValue('companyId', found.companyId || '');
            setValue('companyNameEn', found.companyNameEn || '');
            setValue('companyNameAr', found.companyNameAr || '');
        }
    };

    const handleSpecialistChange = (empId: string) => {
        setValue('assignedSpecialistId', empId, { shouldValidate: true });
        if (!empId) {
            setValue('assignedSpecialistNameEn', '');
            setValue('assignedSpecialistNameAr', '');
            setValue('departmentEn', '');
            setValue('departmentAr', '');
            setValue('designationEn', '');
            setValue('designationAr', '');
            if (currentTaskStatus === 'Assigned') {
                setValue('taskStatus', 'Pending');
            }
            return;
        }
        const emp = CRM_SALES_EMPLOYEES.find((e) => e.id === empId);
        if (emp) {
            setValue('assignedSpecialistNameEn', emp.nameEn);
            setValue('assignedSpecialistNameAr', emp.nameAr);
            setValue('departmentEn', emp.departmentEn);
            setValue('departmentAr', emp.departmentAr);
            setValue('designationEn', emp.roleEn);
            setValue('designationAr', emp.roleAr);
            if (currentTaskStatus === 'Pending') {
                setValue('taskStatus', 'Assigned');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="operational-task-form-drawer-title"
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-xl bg-white h-full shadow-2xl border-s border-[#E5E0D8] flex flex-col overflow-hidden text-start">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center shrink-0">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2
                                id="operational-task-form-drawer-title"
                                className="text-lg font-bold text-[#0D0D0D]"
                            >
                                {mode === 'create'
                                    ? t(
                                          'crm.workflow.operationalTasks.formDrawer.createTitle'
                                      )
                                    : t(
                                          'crm.workflow.operationalTasks.formDrawer.editTitle'
                                      )}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t(
                                    'crm.workflow.operationalTasks.formDrawer.subtitle'
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('crm.commercial.common.close')}
                        className="w-8 h-8 rounded-lg border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-[#6E6862] hover:text-[#0D0D0D] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit((values) => onSubmit(values))}
                    className="flex-1 overflow-y-auto p-6 space-y-4"
                >
                    {serverError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 flex items-start gap-2">
                            <AlertCircle
                                size={15}
                                className="shrink-0 mt-0.5 text-rose-600"
                            />
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Title EN */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.operationalTasks.fields.titleEn')}{' '}
                            <span className="text-rose-600">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('titleEn')}
                            dir="ltr"
                            placeholder={t(
                                'crm.workflow.operationalTasks.formDrawer.titleEnPlaceholder'
                            )}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                        />
                        {errors.titleEn && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {errors.titleEn.message}
                            </p>
                        )}
                    </div>

                    {/* Title AR */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.operationalTasks.fields.titleAr')}
                        </label>
                        <input
                            type="text"
                            {...register('titleAr')}
                            dir="rtl"
                            placeholder={t(
                                'crm.workflow.operationalTasks.formDrawer.titleArPlaceholder'
                            )}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                        />
                    </div>

                    {/* Related Entity Type & Record */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.relatedEntityType'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                value={selectedEntityType}
                                onChange={(e) =>
                                    handleEntityTypeChange(
                                        e.target
                                            .value as CrmOperationalRelatedEntityType
                                    )
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                {CRM_OPERATIONAL_RELATED_ENTITY_TYPE_VALUES.map(
                                    (type) => (
                                        <option key={type} value={type}>
                                            {t(
                                                `crm.workflow.operationalTasks.entityTypes.${type}`
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.relatedEntity'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                value={selectedEntityId}
                                onChange={(e) =>
                                    handleRelatedRecordChange(e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t(
                                        'crm.workflow.operationalTasks.formDrawer.selectRelatedEntity'
                                    )}
                                </option>
                                {filteredRelatedOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.code} —{' '}
                                        {isRtl
                                            ? opt.nameAr || opt.nameEn
                                            : opt.nameEn}
                                    </option>
                                ))}
                            </select>
                            {errors.relatedEntityId && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                    {errors.relatedEntityId.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Priority & Due Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.priority'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                {...register('priority')}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                {CRM_TASK_PRIORITY_VALUES.map((prio) => (
                                    <option key={prio} value={prio}>
                                        {t(
                                            `crm.workflow.common.priorities.${prio}`
                                        )}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.dueDate'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="date"
                                {...register('dueDate')}
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-mono text-[#0D0D0D]"
                            />
                            {errors.dueDate && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                    {errors.dueDate.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Assigned Specialist & Task Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.assignedSpecialist'
                                )}
                            </label>
                            <select
                                value={selectedSpecialistId || ''}
                                onChange={(e) =>
                                    handleSpecialistChange(e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t(
                                        'crm.workflow.operationalTasks.filters.unassigned'
                                    )}
                                </option>
                                {CRM_SALES_EMPLOYEES.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {isRtl ? emp.nameAr : emp.nameEn} —{' '}
                                        {isRtl ? emp.roleAr : emp.roleEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.operationalTasks.fields.taskStatus'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                {...register('taskStatus')}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                {CRM_OPERATIONAL_TASK_STATUS_VALUES.map(
                                    (st) => (
                                        <option key={st} value={st}>
                                            {t(
                                                `crm.workflow.operationalTasks.statuses.${st}`
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Operational Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.operationalTasks.fields.notes')}
                        </label>
                        <textarea
                            rows={3}
                            {...register('notes')}
                            placeholder={t(
                                'crm.workflow.operationalTasks.formDrawer.notesPlaceholder'
                            )}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D] resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-[#E5E0D8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#0D0D0D] transition-colors cursor-pointer"
                        >
                            {t('crm.commercial.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl bg-[#2D3F2C] hover:bg-[#233122] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                            {mode === 'create'
                                ? t(
                                      'crm.workflow.operationalTasks.formDrawer.createButton'
                                  )
                                : t(
                                      'crm.workflow.operationalTasks.formDrawer.saveButton'
                                  )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
