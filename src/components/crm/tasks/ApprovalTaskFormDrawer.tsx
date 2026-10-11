import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
import {
    CRM_SALES_EMPLOYEES,
    type CrmApprovalTargetEntityOption,
} from '../../../api/api';
import {
    crmApprovalTaskInputSchema,
    CRM_APPROVAL_TARGET_ENTITY_VALUES,
    CRM_TASK_PRIORITY_VALUES,
    type CrmApprovalTaskInput,
    type CrmApprovalTargetEntityType,
} from '../../../schemas/crmSchema';

export interface ApprovalTaskFormDrawerProps {
    isOpen: boolean;
    targetOptions: CrmApprovalTargetEntityOption[];
    isSubmitting?: boolean;
    serverError?: string | null;
    onClose: () => void;
    onSubmit: (data: CrmApprovalTaskInput) => void;
}

const DEFAULT_DUE_DATE = new Date(Date.now() + 5 * 86400000)
    .toISOString()
    .split('T')[0];

export const ApprovalTaskFormDrawer: React.FC<ApprovalTaskFormDrawerProps> = ({
    isOpen,
    targetOptions,
    isSubmitting = false,
    serverError,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    const defaultEmployee = CRM_SALES_EMPLOYEES[0];
    const defaultRequester = CRM_SALES_EMPLOYEES[1] || defaultEmployee;
    const defaultDueDate = DEFAULT_DUE_DATE;

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CrmApprovalTaskInput>({
        resolver: zodResolver(crmApprovalTaskInputSchema),
        defaultValues: {
            titleEn: '',
            titleAr: '',
            module: 'Quotation',
            targetEntityType: 'Quotation',
            targetEntityId: '',
            targetEntityCode: '',
            targetEntityNameEn: '',
            targetEntityNameAr: '',
            companyId: '',
            companyNameEn: '',
            companyNameAr: '',
            stageNameEn: 'Commercial Governance Review',
            stageNameAr: 'مراجعة الحوكمة التجارية',
            priority: 'High',
            approvalStatus: 'Pending',
            assignedApproverId: defaultEmployee.id,
            assignedApproverNameEn: defaultEmployee.nameEn,
            assignedApproverNameAr: defaultEmployee.nameAr,
            departmentEn: defaultEmployee.departmentEn,
            departmentAr: defaultEmployee.departmentAr,
            designationEn: defaultEmployee.roleEn,
            designationAr: defaultEmployee.roleAr,
            requestedByNameEn: defaultRequester.nameEn,
            requestedByNameAr: defaultRequester.nameAr,
            requestedByEmail: defaultRequester.email,
            dueDate: defaultDueDate,
            decisionRemarks: '',
        },
    });

    const selectedEntityType =
        useWatch({ control, name: 'targetEntityType' }) || 'Quotation';
    const selectedTargetId =
        useWatch({ control, name: 'targetEntityId' }) || '';
    const selectedApproverId =
        useWatch({ control, name: 'assignedApproverId' }) || defaultEmployee.id;

    useEffect(() => {
        if (isOpen) {
            const firstQuotation = targetOptions.find(
                (o) => o.entityType === 'Quotation'
            );
            reset({
                titleEn: firstQuotation
                    ? `Approve Quotation ${firstQuotation.code} — ${firstQuotation.nameEn}`
                    : '',
                titleAr: firstQuotation
                    ? `اعتماد عرض السعر ${firstQuotation.code} — ${firstQuotation.nameAr}`
                    : '',
                module: 'Quotation',
                targetEntityType: 'Quotation',
                targetEntityId: firstQuotation?.id || '',
                targetEntityCode: firstQuotation?.code || '',
                targetEntityNameEn: firstQuotation?.nameEn || '',
                targetEntityNameAr: firstQuotation?.nameAr || '',
                companyId: firstQuotation?.companyId || '',
                companyNameEn: firstQuotation?.companyNameEn || '',
                companyNameAr: firstQuotation?.companyNameAr || '',
                stageNameEn: 'Commercial Governance Review',
                stageNameAr: 'مراجعة الحوكمة التجارية',
                priority: 'High',
                approvalStatus: 'Pending',
                assignedApproverId: defaultEmployee.id,
                assignedApproverNameEn: defaultEmployee.nameEn,
                assignedApproverNameAr: defaultEmployee.nameAr,
                departmentEn: defaultEmployee.departmentEn,
                departmentAr: defaultEmployee.departmentAr,
                designationEn: defaultEmployee.roleEn,
                designationAr: defaultEmployee.roleAr,
                requestedByNameEn: defaultRequester.nameEn,
                requestedByNameAr: defaultRequester.nameAr,
                requestedByEmail: defaultRequester.email,
                dueDate: defaultDueDate,
                decisionRemarks: '',
            });
        }
    }, [
        isOpen,
        targetOptions,
        reset,
        defaultEmployee,
        defaultRequester,
        defaultDueDate,
    ]);

    const filteredTargetOptions = targetOptions.filter(
        (opt) => opt.entityType === selectedEntityType
    );

    const handleEntityTypeChange = (newType: CrmApprovalTargetEntityType) => {
        setValue('targetEntityType', newType, { shouldValidate: true });
        setValue('module', newType);
        const firstMatching = targetOptions.find(
            (opt) => opt.entityType === newType
        );
        if (firstMatching) {
            setValue('targetEntityId', firstMatching.id, {
                shouldValidate: true,
            });
            setValue('targetEntityCode', firstMatching.code);
            setValue('targetEntityNameEn', firstMatching.nameEn);
            setValue('targetEntityNameAr', firstMatching.nameAr);
            setValue('companyId', firstMatching.companyId || '');
            setValue('companyNameEn', firstMatching.companyNameEn || '');
            setValue('companyNameAr', firstMatching.companyNameAr || '');
            setValue(
                'titleEn',
                `Approve ${newType} ${firstMatching.code} — ${firstMatching.nameEn}`,
                { shouldValidate: true }
            );
            setValue(
                'titleAr',
                `اعتماد ${firstMatching.code} — ${firstMatching.nameAr}`
            );
        } else {
            setValue('targetEntityId', '');
        }
    };

    const handleTargetRecordChange = (targetId: string) => {
        setValue('targetEntityId', targetId, { shouldValidate: true });
        const found = targetOptions.find(
            (opt) =>
                opt.entityType === selectedEntityType && opt.id === targetId
        );
        if (found) {
            setValue('targetEntityCode', found.code);
            setValue('targetEntityNameEn', found.nameEn);
            setValue('targetEntityNameAr', found.nameAr);
            setValue('companyId', found.companyId || '');
            setValue('companyNameEn', found.companyNameEn || '');
            setValue('companyNameAr', found.companyNameAr || '');
            setValue(
                'titleEn',
                `Approve ${found.entityType} ${found.code} — ${found.nameEn}`,
                { shouldValidate: true }
            );
            setValue('titleAr', `اعتماد ${found.code} — ${found.nameAr}`);
        }
    };

    const handleAssigneeChange = (empId: string) => {
        setValue('assignedApproverId', empId, { shouldValidate: true });
        const emp = CRM_SALES_EMPLOYEES.find((e) => e.id === empId);
        if (emp) {
            setValue('assignedApproverNameEn', emp.nameEn);
            setValue('assignedApproverNameAr', emp.nameAr);
            setValue('departmentEn', emp.departmentEn);
            setValue('departmentAr', emp.departmentAr);
            setValue('designationEn', emp.roleEn);
            setValue('designationAr', emp.roleAr);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-task-form-drawer-title"
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
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h2
                                id="approval-task-form-drawer-title"
                                className="text-lg font-bold text-[#0D0D0D]"
                            >
                                {t(
                                    'crm.workflow.approvalTasks.formDrawer.createTitle'
                                )}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t(
                                    'crm.workflow.approvalTasks.formDrawer.subtitle'
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
                    onSubmit={handleSubmit((values) =>
                        onSubmit(values as unknown as CrmApprovalTaskInput)
                    )}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Module / Target Entity Type */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.workflow.approvalTasks.fields.module')}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                value={selectedEntityType}
                                onChange={(e) =>
                                    handleEntityTypeChange(
                                        e.target
                                            .value as CrmApprovalTargetEntityType
                                    )
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                {CRM_APPROVAL_TARGET_ENTITY_VALUES.map(
                                    (type) => (
                                        <option key={type} value={type}>
                                            {t(
                                                `crm.workflow.approvalTasks.modules.${type}`
                                            )}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Target Commercial Record */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.approvalTasks.fields.targetEntity'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                value={selectedTargetId}
                                onChange={(e) =>
                                    handleTargetRecordChange(e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                <option value="">
                                    {t(
                                        'crm.workflow.approvalTasks.formDrawer.selectTargetRecord'
                                    )}
                                </option>
                                {filteredTargetOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.code} —{' '}
                                        {isRtl
                                            ? opt.nameAr || opt.nameEn
                                            : opt.nameEn}
                                    </option>
                                ))}
                            </select>
                            {errors.targetEntityId && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                    {errors.targetEntityId.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Title En */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.approvalTasks.fields.titleEn')}{' '}
                            <span className="text-rose-600">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('titleEn')}
                            dir="ltr"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                        />
                        {errors.titleEn && (
                            <p className="text-[11px] text-rose-600 mt-1">
                                {errors.titleEn.message}
                            </p>
                        )}
                    </div>

                    {/* Title Ar */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.approvalTasks.fields.titleAr')}
                        </label>
                        <input
                            type="text"
                            {...register('titleAr')}
                            dir="rtl"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Stage En */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.workflow.approvalTasks.fields.stage')}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('stageNameEn')}
                                dir="ltr"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs text-[#0D0D0D]"
                            />
                            {errors.stageNameEn && (
                                <p className="text-[11px] text-rose-600 mt-1">
                                    {errors.stageNameEn.message}
                                </p>
                            )}
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t('crm.workflow.operationalTasks.fields.dueDate')}{' '}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.approvalTasks.fields.priority'
                                )}
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

                        {/* Assigned Approver */}
                        <div>
                            <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                                {t(
                                    'crm.workflow.approvalTasks.fields.assignedUser'
                                )}{' '}
                                <span className="text-rose-600">*</span>
                            </label>
                            <select
                                value={selectedApproverId}
                                onChange={(e) =>
                                    handleAssigneeChange(e.target.value)
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-medium text-[#0D0D0D]"
                            >
                                {CRM_SALES_EMPLOYEES.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {isRtl ? emp.nameAr : emp.nameEn} —{' '}
                                        {isRtl ? emp.roleAr : emp.roleEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div>
                        <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                            {t('crm.workflow.approvalTasks.fields.notes')}
                        </label>
                        <textarea
                            rows={3}
                            {...register('decisionRemarks')}
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
                            {t(
                                'crm.workflow.approvalTasks.formDrawer.submitButton'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
