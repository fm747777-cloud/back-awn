import type {
    OperationalTaskPriority,
    OperationalTaskStatus,
} from '../../../pages/request/operationalTasksMockData';
import type { RequestType } from '../../../pages/request/requestsMockData';

export interface TaskInlineEditDraft {
    taskTitle: string;
    requestType: RequestType;
    requestId: string;
    ownerId: string;
    companyId: string;
    serviceRecordId: string;
    operationalUnitId: string;
    assigneeId: string;
    priority: OperationalTaskPriority;
    status: OperationalTaskStatus;
    dueDateIso: string;
    notes: string;
}

export interface OperationalTaskKpiCounts {
    total: number;
    notAssigned: number;
    assigned: number;
    pending: number;
    inProgress: number;
    completed: number;
    blocked: number;
}

export const STATUS_BADGE_STYLES: Record<OperationalTaskStatus, string> = {
    Pending: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    Assigned: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    'In Progress': 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    'Under Review': 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
    Completed: 'bg-[#EAF3EC] text-[#037F8C] border-[#037F8C]/25',
    Blocked: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    Rejected: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
};

export const PRIORITY_BADGE_STYLES: Record<OperationalTaskPriority, string> = {
    Low: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
    Medium: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
    High: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    Urgent: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
};
