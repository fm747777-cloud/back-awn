
import React, { useMemo, useRef, useState } from 'react';
import { X, ChevronDown, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { translateError } from '../../i18n';
import { focusAndScrollToFirstError } from '../../utils/formValidation';

import { taskSchema, TaskPriority, TaskComeFrom, type CreateTaskDto } from '../../schemas/ticketSchema';

import { companyBranchApi, companyUserApi, serviceApi, userApi } from '../../api/api';
import { axiosClient } from '../../api/axiosClient';

export type TicketDrawerMode = 'create' | 'edit' | 'view';

type TaskFormValues = z.input<typeof taskSchema>;
type CreateTaskPayload = CreateTaskDto;
type TaskFieldErrors = Partial<Record<keyof TaskFormValues, string>>;

interface TaskRecord {
    id?: string;
    subject?: string;
    start_date?: string | Date;
    end_date?: string | Date;
    priority?: string;
    come_from?: string;
    assignTo_id?: string;
    customer_id?: string;
    companyBranch_id?: string;
    service_id?: string;
    taskType_id?: string;
    assignTo?: { id?: string; name?: string; fullName?: string };
    customer?: { id?: string; name?: string; fullName?: string };
    companyBranch?: { id?: string; name?: string };
    service?: { id?: string; name?: string };
    taskType?: { id?: string; name?: string };
    [key: string]: unknown;
}

interface TicketDrawerProps {
    isOpen: boolean;
    mode: TicketDrawerMode;
    ticket?: TaskRecord | null;
    onClose: () => void;
    onSubmit: (data: CreateTaskPayload, existingTask?: TaskRecord | null) => void | Promise<void>;
}

interface SelectOption {
    id: string;
    label: string;
}

const taskDefaultValues: TaskFormValues = {
    subject: '',
    start_date: '',
    end_date: '',
    priority: TaskPriority.MEDIUM,
    come_from: TaskComeFrom.TASK,
    assignTo_id: '',
    customer_id: '',
    companyBranch_id: '',
    service_id: '',
    taskType_id: '',
};

const FIELD_ORDER: (keyof TaskFormValues)[] = [
    'subject',
    'start_date',
    'end_date',
    'priority',
    'come_from',
    'assignTo_id',
    'customer_id',
    'companyBranch_id',
    'service_id',
    'taskType_id',
];

function extractArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
}

function getOptionLabel(item: any, isAr: boolean): string {
    if (typeof item === 'string') return item;

    const localizedName = isAr
        ? item?.nameAr || item?.titleAr || item?.ar
        : item?.nameEn || item?.titleEn || item?.en;

    const combinedName = [item?.firstName, item?.lastName]
        .filter(Boolean)
        .join(' ');

    return String(
        localizedName ||
        item?.fullName ||
        item?.name ||
        combinedName ||
        item?.title ||
        item?.code ||
        item?.email ||
        item?.id ||
        ''
    );
}

function toOptions(response: any, isAr: boolean): SelectOption[] {
    return extractArray(response)
        .map((item: any) => ({
            id: String(item?.id ?? item?.uuid ?? ''),
            label: getOptionLabel(item, isAr),
        }))
        .filter((item) => item.id && item.label);
}

function toDateInput(value?: string | Date): string {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 16);
}

function normalizePriority(value?: string): TaskPriority {
    switch (String(value ?? '').toLowerCase()) {
        case 'high':
            return TaskPriority.HIGH;
        case 'low':
            return TaskPriority.LOW;
        case 'medium':
            return TaskPriority.MEDIUM;
        default:
            return TaskPriority.MEDIUM;
    }
}

function normalizeComeFrom(value?: string): TaskComeFrom {
    switch (String(value ?? '').toLowerCase()) {
        case 'request':
            return TaskComeFrom.REQUEST;
        case 'client_request':
            return TaskComeFrom.CLIENT_REQUEST;
        case 'task':
            return TaskComeFrom.TASK;
        default:
            return TaskComeFrom.TASK;
    }
}

function getTaskFormValues(task?: TaskRecord | null): TaskFormValues {
    if (!task) return { ...taskDefaultValues };

    return {
        subject: task.subject ?? '',
        start_date: toDateInput(task.start_date),
        end_date: toDateInput(task.end_date),
        priority: normalizePriority(task.priority),
        come_from: normalizeComeFrom(task.come_from),
        assignTo_id: task.assignTo_id ?? task.assignTo?.id ?? '',
        customer_id: task.customer_id ?? task.customer?.id ?? '',
        companyBranch_id: task.companyBranch_id ?? task.companyBranch?.id ?? '',
        service_id: task.service_id ?? task.service?.id ?? '',
        taskType_id: task.taskType_id ?? task.taskType?.id ?? '',
    };
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({
    isOpen,
    mode,
    ticket,
    onClose,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar') ?? false;
    const isView = mode === 'view';
    const isEdit = mode === 'edit';

    const formRef = useRef<HTMLFormElement>(null);
    const subjectRef = useRef<HTMLInputElement>(null);
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);
    const priorityRef = useRef<HTMLSelectElement>(null);
    const comeFromRef = useRef<HTMLSelectElement>(null);
    const assignToRef = useRef<HTMLSelectElement>(null);
    const customerRef = useRef<HTMLSelectElement>(null);
    const companyBranchRef = useRef<HTMLSelectElement>(null);
    const serviceRef = useRef<HTMLSelectElement>(null);
    const taskTypeRef = useRef<HTMLSelectElement>(null);

    const [values, setValues] = useState<TaskFormValues>({
        ...taskDefaultValues,
    });
    const [errors, setErrors] = useState<TaskFieldErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [prevOpenState, setPrevOpenState] = useState({ isOpen, id: ticket?.id, mode });
    if (prevOpenState.isOpen !== isOpen || prevOpenState.id !== ticket?.id || prevOpenState.mode !== mode) {
        setPrevOpenState({ isOpen, id: ticket?.id, mode });
        if (isOpen) {
            setValues(getTaskFormValues(ticket));
            setErrors({});
            setHasSubmitted(false);
            setIsSaving(false);
        }
    }

    const branchesQuery = useQuery({
        queryKey: ['task-drawer', 'company-branches'],
        queryFn: () =>
            companyBranchApi.getCompaniesBranchs({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const customersQuery = useQuery({
        queryKey: ['task-drawer', 'company-users'],
        queryFn: () =>
            companyUserApi.getCompanyUsers({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const usersQuery = useQuery({
        queryKey: ['task-drawer', 'users'],
        queryFn: () =>
            userApi.getCompaniesBranchs({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const servicesQuery = useQuery({
        queryKey: ['task-drawer', 'services'],
        queryFn: () => serviceApi.getServices({ page: 1, limit: 100 }),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const taskTypesQuery = useQuery({
        queryKey: ['task-drawer', 'task-types'],
        queryFn: async () => {
            const response = await axiosClient.get('/task-type', {
                params: { page: 1, limit: 100 },
            });

            return response.data;
        },
        enabled: isOpen,
        staleTime: 60_000,
        retry: 1,
    });

    const branches = useMemo(
        () => toOptions(branchesQuery.data, isAr),
        [branchesQuery.data, isAr]
    );

    const customers = useMemo(
        () => toOptions(customersQuery.data, isAr),
        [customersQuery.data, isAr]
    );

    const users = useMemo(
        () => toOptions(usersQuery.data, isAr),
        [usersQuery.data, isAr]
    );

    const services = useMemo(
        () => toOptions(servicesQuery.data, isAr),
        [servicesQuery.data, isAr]
    );

    const taskTypes = useMemo(
        () => toOptions(taskTypesQuery.data, isAr),
        [taskTypesQuery.data, isAr]
    );

    const loadingOptions =
        branchesQuery.isLoading ||
        customersQuery.isLoading ||
        usersQuery.isLoading ||
        servicesQuery.isLoading ||
        taskTypesQuery.isLoading;

    const updateField = <K extends keyof TaskFormValues>(
        field: K,
        value: TaskFormValues[K]
    ) => {
        const nextValues = { ...values, [field]: value };

        setValues(nextValues);

        if (hasSubmitted) {
            const result = taskSchema.safeParse(nextValues);

            setErrors((previous) => {
                const updated = { ...previous };
                delete updated[field];

                if (!result.success) {
                    const relatedIssue = result.error.issues.find(
                        (issue) => issue.path[0] === field
                    );

                    if (relatedIssue) {
                        updated[field] = relatedIssue.message;
                    }
                }

                if (field === 'start_date' || field === 'end_date') {
                    const dateIssue = result.success
                        ? undefined
                        : result.error.issues.find(
                            (issue) => issue.path[0] === 'end_date'
                        );

                    if (dateIssue) {
                        updated.end_date = dateIssue.message;
                    } else {
                        delete updated.end_date;
                    }
                }

                return updated;
            });
        }
    };

    const focusFirstInvalid = (fieldErrors: TaskFieldErrors) => {
        window.setTimeout(() => {
            const refs: Partial<
                Record<keyof TaskFormValues, React.RefObject<HTMLElement | null>>
            > = {
                subject: subjectRef,
                start_date: startDateRef,
                end_date: endDateRef,
                priority: priorityRef,
                come_from: comeFromRef,
                assignTo_id: assignToRef,
                customer_id: customerRef,
                companyBranch_id: companyBranchRef,
                service_id: serviceRef,
                taskType_id: taskTypeRef,
            };

            for (const field of FIELD_ORDER) {
                if (!fieldErrors[field]) continue;

                const element = refs[field]?.current;

                if (element) {
                    element.focus();
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    return;
                }
            }

            focusAndScrollToFirstError(
                fieldErrors,
                FIELD_ORDER,
                formRef.current
            );
        }, 30);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (isView || isSaving) return;

        setHasSubmitted(true);

        const result = taskSchema.safeParse(values);

        if (!result.success) {
            const nextErrors: TaskFieldErrors = {};

            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof TaskFormValues;

                if (FIELD_ORDER.includes(field) && !nextErrors[field]) {
                    nextErrors[field] = issue.message;
                }
            });

            setErrors(nextErrors);
            focusFirstInvalid(nextErrors);
            return;
        }

        const payload: CreateTaskPayload = {
            subject: result.data.subject.trim(),
            start_date: new Date(result.data.start_date).toISOString(),
            end_date: new Date(result.data.end_date).toISOString(),
            priority: result.data.priority,
            come_from: result.data.come_from,
            ...(result.data.assignTo_id
                ? { assignTo_id: result.data.assignTo_id }
                : {}),
            ...(result.data.customer_id
                ? { customer_id: result.data.customer_id }
                : {}),
            ...(result.data.companyBranch_id
                ? { companyBranch_id: result.data.companyBranch_id }
                : {}),
            ...(result.data.service_id
                ? { service_id: result.data.service_id }
                : {}),
            ...(result.data.taskType_id
                ? { taskType_id: result.data.taskType_id }
                : {}),
        };

        try {
            setIsSaving(true);
            await onSubmit(payload, ticket);
        } catch (error: any) {
            toast.error(
                translateError(
                    t,
                    error?.response?.data?.message ||
                    error?.message ||
                    'Failed to save task'
                )
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (isSaving) return;
        onClose();
    };

    const fieldClass = (field: keyof TaskFormValues) =>
        `w-full rounded-lg border px-3.5 py-2.5 text-xs transition ${hasSubmitted && errors[field]
            ? 'border-red-400 bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:bg-slate-800'
            : 'border-[#E5E0D8] bg-[#FAF8F5] focus:border-[#2D3F2C] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 dark:border-slate-700 dark:bg-slate-800'
        } ${isView
            ? 'cursor-default text-[#595550] dark:text-slate-300'
            : 'cursor-pointer text-[#0D0D0D] dark:text-slate-100'
        }`;

    const renderError = (field: keyof TaskFormValues) => {
        if (!hasSubmitted || !errors[field]) return null;

        return (
            <span className="mt-1 block text-[11px] font-medium text-red-500">
                {translateError(t, errors[field]!)}
            </span>
        );
    };

    const renderSelect = (
        field:
            | 'assignTo_id'
            | 'customer_id'
            | 'companyBranch_id'
            | 'service_id'
            | 'taskType_id',
        label: string,
        options: SelectOption[],
        ref: React.RefObject<HTMLSelectElement | null>
    ) => (
        <div>
            <label
                htmlFor={`task-${field}`}
                className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
            >
                {label}
                <span className="ms-1 font-normal text-[#857E74]">
                    ({t('common.optional')})
                </span>
            </label>

            <div className="relative">
                <select
                    id={`task-${field}`}
                    ref={ref}
                    value={values[field] ?? ''}
                    disabled={isView || loadingOptions}
                    aria-invalid={Boolean(hasSubmitted && errors[field])}
                    onChange={(event) =>
                        updateField(field, event.target.value)
                    }
                    className={`${fieldClass(field)} appearance-none pe-9`}
                >
                    <option value="">
                        {loadingOptions
                            ? isAr
                                ? 'جاري تحميل البيانات...'
                                : 'Loading options...'
                            : isAr
                                ? 'بدون تحديد'
                                : 'Select an option'}
                    </option>

                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}

                    {values[field] &&
                        !options.some(
                            (option) => option.id === values[field]
                        ) && (
                            <option value={values[field]}>
                                {values[field]}
                            </option>
                        )}
                </select>

                {!isView && (
                    <ChevronDown
                        size={14}
                        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74]"
                    />
                )}
            </div>

            {renderError(field)}
        </div>
    );

    const headerTitle = isView
        ? isAr
            ? 'عرض المهمة'
            : 'View Task'
        : isEdit
            ? isAr
                ? 'تعديل المهمة'
                : 'Edit Task'
            : isAr
                ? 'إنشاء مهمة جديدة'
                : 'Create New Task';

    const headerSubtitle = isView
        ? isAr
            ? 'عرض تفاصيل المهمة'
            : 'View task details'
        : isEdit
            ? isAr
                ? 'تعديل بيانات المهمة'
                : 'Update task details'
            : isAr
                ? 'أدخل بيانات المهمة الجديدة'
                : 'Enter the new task details';

    if (!isOpen && !ticket) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isOpen
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0'
                }`}
            aria-hidden={!isOpen}
        >
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px]"
                onClick={handleClose}
            />

            <div
                dir={isAr ? 'rtl' : 'ltr'}
                className={`fixed end-0 top-0 flex h-full w-full max-w-xl flex-col bg-white text-start shadow-2xl transition-transform duration-300 ease-in-out dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-[#E5E0D8] bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D] dark:text-slate-100">
                            {headerTitle}
                        </h2>

                        <p className="mt-0.5 text-xs text-[#6E6862] dark:text-slate-400">
                            {headerSubtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        aria-label={isAr ? 'إغلاق' : 'Close'}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#857E74] transition hover:bg-[#F8F6F2] hover:text-[#0D0D0D] disabled:cursor-not-allowed dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    id="awn-ticket-form"
                    ref={formRef}
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex-1 space-y-5 overflow-y-auto p-6"
                >
                    <div>
                        <label
                            htmlFor="task-subject"
                            className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                        >
                            {isAr ? 'موضوع المهمة' : 'Subject'}
                            {!isView && (
                                <span className="ms-1 text-[#A23B2A]">
                                    *
                                </span>
                            )}
                        </label>

                        <input
                            id="task-subject"
                            ref={subjectRef}
                            type="text"
                            value={values.subject}
                            readOnly={isView}
                            disabled={isView}
                            onChange={(event) =>
                                updateField('subject', event.target.value)
                            }
                            placeholder={
                                isAr
                                    ? 'أدخل موضوع المهمة'
                                    : 'Enter task subject'
                            }
                            aria-invalid={Boolean(
                                hasSubmitted && errors.subject
                            )}
                            className={fieldClass('subject')}
                        />

                        {renderError('subject')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="task-start-date"
                                className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                            >
                                {isAr ? 'تاريخ البداية' : 'Start Date'}
                                {!isView && (
                                    <span className="ms-1 text-[#A23B2A]">
                                        *
                                    </span>
                                )}
                            </label>

                            <input
                                id="task-start-date"
                                ref={startDateRef}
                                type="datetime-local"
                                value={values.start_date}
                                readOnly={isView}
                                disabled={isView}
                                onChange={(event) =>
                                    updateField(
                                        'start_date',
                                        event.target.value
                                    )
                                }
                                aria-invalid={Boolean(
                                    hasSubmitted && errors.start_date
                                )}
                                className={fieldClass('start_date')}
                            />

                            {renderError('start_date')}
                        </div>

                        <div>
                            <label
                                htmlFor="task-end-date"
                                className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                            >
                                {isAr ? 'تاريخ النهاية' : 'End Date'}
                                {!isView && (
                                    <span className="ms-1 text-[#A23B2A]">
                                        *
                                    </span>
                                )}
                            </label>

                            <input
                                id="task-end-date"
                                ref={endDateRef}
                                type="datetime-local"
                                value={values.end_date}
                                readOnly={isView}
                                disabled={isView}
                                onChange={(event) =>
                                    updateField(
                                        'end_date',
                                        event.target.value
                                    )
                                }
                                aria-invalid={Boolean(
                                    hasSubmitted && errors.end_date
                                )}
                                className={fieldClass('end_date')}
                            />

                            {renderError('end_date')}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="task-priority"
                                className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                            >
                                {isAr ? 'الأولوية' : 'Priority'}
                                {!isView && (
                                    <span className="ms-1 text-[#A23B2A]">
                                        *
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <select
                                    id="task-priority"
                                    ref={priorityRef}
                                    value={values.priority}
                                    disabled={isView}
                                    onChange={(event) =>
                                        updateField(
                                            'priority',
                                            event.target.value as TaskPriority
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        hasSubmitted && errors.priority
                                    )}
                                    className={`${fieldClass('priority')} appearance-none pe-9`}
                                >
                                    <option value={TaskPriority.HIGH}>
                                        {isAr ? 'عالية' : 'High'}
                                    </option>
                                    <option value={TaskPriority.MEDIUM}>
                                        {isAr ? 'متوسطة' : 'Medium'}
                                    </option>
                                    <option value={TaskPriority.LOW}>
                                        {isAr ? 'منخفضة' : 'Low'}
                                    </option>
                                </select>

                                {!isView && (
                                    <ChevronDown
                                        size={14}
                                        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74]"
                                    />
                                )}
                            </div>

                            {renderError('priority')}
                        </div>

                        <div>
                            <label
                                htmlFor="task-come-from"
                                className="mb-1.5 block text-xs font-semibold text-[#0D0D0D] dark:text-slate-200"
                            >
                                {isAr ? 'مصدر المهمة' : 'Task Source'}
                                {!isView && (
                                    <span className="ms-1 text-[#A23B2A]">
                                        *
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <select
                                    id="task-come-from"
                                    ref={comeFromRef}
                                    value={values.come_from}
                                    disabled={isView}
                                    onChange={(event) =>
                                        updateField(
                                            'come_from',
                                            event.target.value as TaskComeFrom
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        hasSubmitted && errors.come_from
                                    )}
                                    className={`${fieldClass('come_from')} appearance-none pe-9`}
                                >
                                    <option value={TaskComeFrom.TASK}>
                                        {isAr ? 'مهمة' : 'Task'}
                                    </option>
                                    <option value={TaskComeFrom.REQUEST}>
                                        {isAr ? 'طلب' : 'Request'}
                                    </option>
                                    <option value={TaskComeFrom.CLIENT_REQUEST}>
                                        {isAr ? 'طلب عميل' : 'Client Request'}
                                    </option>
                                </select>

                                {!isView && (
                                    <ChevronDown
                                        size={14}
                                        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#857E74]"
                                    />
                                )}
                            </div>

                            {renderError('come_from')}
                        </div>
                    </div>

                    <div className="border-t border-[#E5E0D8] pt-4 dark:border-slate-800">
                        <h3 className="mb-4 text-sm font-bold text-[#0D0D0D] dark:text-slate-100">
                            {isAr
                                ? 'ربط المهمة بالبيانات'
                                : 'Task Assignments'}
                        </h3>

                        <div className="space-y-4">
                            {renderSelect(
                                'assignTo_id',
                                isAr ? 'المستخدم المسؤول' : 'Assigned User',
                                users,
                                assignToRef
                            )}

                            {renderSelect(
                                'customer_id',
                                isAr ? 'العميل' : 'Customer',
                                customers,
                                customerRef
                            )}

                            {renderSelect(
                                'companyBranch_id',
                                isAr ? 'فرع الشركة' : 'Company Branch',
                                branches,
                                companyBranchRef
                            )}

                            {renderSelect(
                                'service_id',
                                isAr ? 'الخدمة' : 'Service',
                                services,
                                serviceRef
                            )}

                            {renderSelect(
                                'taskType_id',
                                isAr ? 'نوع المهمة' : 'Task Type',
                                taskTypes,
                                taskTypeRef
                            )}
                        </div>

                        {taskTypesQuery.isError && (
                            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                {isAr
                                    ? 'تعذر تحميل أنواع المهام. تحقق من مسار API /task-type.'
                                    : 'Could not load task types. Check the /task-type API endpoint.'}
                            </p>
                        )}

                        {(branchesQuery.isError ||
                            customersQuery.isError ||
                            usersQuery.isError ||
                            servicesQuery.isError) && (
                                <p className="mt-3 text-xs text-red-500">
                                    {isAr
                                        ? 'تعذر تحميل بعض القوائم. تحقق من اتصال الخادم.'
                                        : 'Some options could not be loaded. Check the server connection.'}
                                </p>
                            )}
                    </div>
                </form>

                <div className="flex shrink-0 justify-end gap-2.5 border-t border-[#E5E0D8] bg-[#FAF8F5] px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="cursor-pointer rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#595550] transition hover:bg-[#F8F6F2] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                        {isView
                            ? isAr
                                ? 'إغلاق'
                                : 'Close'
                            : isAr
                                ? 'إلغاء'
                                : 'Cancel'}
                    </button>

                    {!isView && (
                        <button
                            type="submit"
                            form="awn-ticket-form"
                            disabled={isSaving}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#2D3F2C] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#233222] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving && (
                                <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                />
                            )}

                            {isSaving
                                ? isAr
                                    ? 'جاري الحفظ...'
                                    : 'Saving...'
                                : isEdit
                                    ? isAr
                                        ? 'حفظ التعديلات'
                                        : 'Save Changes'
                                    : isAr
                                        ? 'إنشاء المهمة'
                                        : 'Create Task'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};