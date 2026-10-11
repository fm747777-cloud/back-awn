import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import {
    crmApi,
    type CrmApprovalTaskQueryParams,
    type CrmOperationalTaskQueryParams,
    type CrmAuditTrailQueryParams,
} from '../../../api/api';
import type {
    CrmApprovalTaskInput,
    CrmApprovalTaskDecisionInput,
    CrmApprovalTaskStatus,
    CrmOperationalTaskInput,
    CrmOperationalTaskStatus,
} from '../../../schemas/crmSchema';

export const CRM_WORKFLOW_QUERY_KEYS = {
    allCrm: ['crm'] as const,
    approvalTasks: (params?: CrmApprovalTaskQueryParams) =>
        ['crm', 'approvalTasks', params] as const,
    approvalTaskDetail: (id: string) =>
        ['crm', 'approvalTasks', 'detail', id] as const,
    approvalTaskMetrics: ['crm', 'approvalTasks', 'metrics'] as const,
    approvalTargetOptions: ['crm', 'approvalTasks', 'targetOptions'] as const,
    operationalTasks: (params?: CrmOperationalTaskQueryParams) =>
        ['crm', 'operationalTasks', params] as const,
    operationalTaskDetail: (id: string) =>
        ['crm', 'operationalTasks', 'detail', id] as const,
    operationalTaskMetrics: ['crm', 'operationalTasks', 'metrics'] as const,
    operationalRelatedEntities: [
        'crm',
        'operationalTasks',
        'relatedEntities',
    ] as const,
    auditTrails: (params?: CrmAuditTrailQueryParams) =>
        ['crm', 'auditTrails', params] as const,
    auditTrailDetail: (id: string) =>
        ['crm', 'auditTrails', 'detail', id] as const,
    auditTrailMetrics: ['crm', 'auditTrails', 'metrics'] as const,
    auditTrailResourceTypes: ['crm', 'auditTrails', 'resourceTypes'] as const,
    auditTrailActors: ['crm', 'auditTrails', 'actors'] as const,
};

export function useCrmApprovalTasks(params?: CrmApprovalTaskQueryParams) {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.approvalTasks(params),
        queryFn: () => crmApi.approvalTasks.getAll(params),
    });
}

export function useCrmApprovalTaskMetrics() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.approvalTaskMetrics,
        queryFn: () => crmApi.approvalTasks.getMetrics(),
    });
}

export function useCrmApprovalTargetOptions() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.approvalTargetOptions,
        queryFn: () => crmApi.approvalTasks.getTargetEntityOptions(),
    });
}

export function useCrmApprovalTaskMutations() {
    const queryClient = useQueryClient();

    const invalidateCrm = () => {
        queryClient.invalidateQueries({
            queryKey: CRM_WORKFLOW_QUERY_KEYS.allCrm,
        });
    };

    const createApprovalTask = useMutation({
        mutationFn: (payload: CrmApprovalTaskInput) =>
            crmApi.approvalTasks.create(payload),
        onSuccess: invalidateCrm,
    });

    const approveTask = useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input?: CrmApprovalTaskDecisionInput | string;
        }) => crmApi.approvalTasks.approve(id, input),
        onSuccess: invalidateCrm,
    });

    const rejectTask = useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: CrmApprovalTaskDecisionInput | string;
        }) => crmApi.approvalTasks.reject(id, input),
        onSuccess: invalidateCrm,
    });

    const updateApprovalStatus = useMutation({
        mutationFn: ({
            id,
            approvalStatus,
            input,
        }: {
            id: string;
            approvalStatus: CrmApprovalTaskStatus;
            input?: CrmApprovalTaskDecisionInput;
        }) => crmApi.approvalTasks.updateStatus(id, approvalStatus, input),
        onSuccess: invalidateCrm,
    });

    return {
        createApprovalTask,
        approveTask,
        rejectTask,
        updateApprovalStatus,
    };
}

export function useCrmOperationalTasks(
    params?: CrmOperationalTaskQueryParams
) {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.operationalTasks(params),
        queryFn: () => crmApi.operationalTasks.getAll(params),
    });
}

export function useCrmOperationalTaskMetrics() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.operationalTaskMetrics,
        queryFn: () => crmApi.operationalTasks.getMetrics(),
    });
}

export function useCrmOperationalRelatedEntities() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.operationalRelatedEntities,
        queryFn: () => crmApi.operationalTasks.getRelatedEntities(),
    });
}

export function useCrmOperationalTaskMutations() {
    const queryClient = useQueryClient();

    const invalidateCrm = () => {
        queryClient.invalidateQueries({
            queryKey: CRM_WORKFLOW_QUERY_KEYS.allCrm,
        });
    };

    const createOperationalTask = useMutation({
        mutationFn: (payload: CrmOperationalTaskInput) =>
            crmApi.operationalTasks.create(payload),
        onSuccess: invalidateCrm,
    });

    const updateOperationalTask = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: Partial<CrmOperationalTaskInput>;
        }) => crmApi.operationalTasks.update(id, payload),
        onSuccess: invalidateCrm,
    });

    const assignOperationalTask = useMutation({
        mutationFn: ({
            id,
            assignedSpecialistId,
            notes,
        }: {
            id: string;
            assignedSpecialistId: string;
            notes?: string;
        }) => crmApi.operationalTasks.assign(id, assignedSpecialistId, notes),
        onSuccess: invalidateCrm,
    });

    const transitionOperationalTaskStatus = useMutation({
        mutationFn: ({
            id,
            taskStatus,
            notes,
        }: {
            id: string;
            taskStatus: CrmOperationalTaskStatus;
            notes?: string;
        }) => crmApi.operationalTasks.updateStatus(id, taskStatus, notes),
        onSuccess: invalidateCrm,
    });

    const deleteOperationalTask = useMutation({
        mutationFn: (id: string) => crmApi.operationalTasks.delete(id),
        onSuccess: invalidateCrm,
    });

    return {
        createOperationalTask,
        updateOperationalTask,
        assignOperationalTask,
        transitionOperationalTaskStatus,
        deleteOperationalTask,
    };
}

export function useCrmAuditTrails(params?: CrmAuditTrailQueryParams) {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.auditTrails(params),
        queryFn: () => crmApi.auditTrails.getAll(params),
    });
}

export function useCrmAuditTrailMetrics() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.auditTrailMetrics,
        queryFn: () => crmApi.auditTrails.getMetrics(),
    });
}

export function useCrmAuditTrailResourceTypes() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.auditTrailResourceTypes,
        queryFn: () => crmApi.auditTrails.getResourceTypes(),
    });
}

export function useCrmAuditTrailActors() {
    return useQuery({
        queryKey: CRM_WORKFLOW_QUERY_KEYS.auditTrailActors,
        queryFn: () => crmApi.auditTrails.getActors(),
    });
}
