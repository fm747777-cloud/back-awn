
import { z } from 'zod';

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

export enum TaskComeFrom {
    TASK = 'task',
    REQUEST = 'request',
    CLIENT_REQUEST = 'client_request',
}

export const taskSchema = z.object({
    subject: z.string().trim().min(1, 'Subject is required'),
    start_date: z.string().min(1, 'Start date is required').refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid start date'),
    end_date: z.string().min(1, 'End date is required').refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid end date'),
    priority: z.nativeEnum(TaskPriority),
    come_from: z.nativeEnum(TaskComeFrom),
    assignTo_id: z.string().optional(),
    customer_id: z.string().optional(),
    companyBranch_id: z.string().optional(),
    service_id: z.string().optional(),
    taskType_id: z.string().optional(),
}).superRefine((data, ctx) => {
    if (Date.parse(data.end_date) < Date.parse(data.start_date)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be after or equal to start date' });
    }
});

export type CreateTaskDto = z.input<typeof taskSchema>;