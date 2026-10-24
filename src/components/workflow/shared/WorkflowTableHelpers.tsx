import React from 'react';
import {
    Eye,
    Pencil,
    Power,
    Trash2,
    GitBranch,
    FolderKanban,
    ListFilter,
    Mail,
    FileText,
} from 'lucide-react';
import {
    normalizeWorkflowAuditAction,
    normalizeWorkflowAuditResource,
    type WorkflowAuditAction,
    type WorkflowAuditResource,
} from '../../../pages/workflow/workflowMockData';
import {
    WORKFLOW_AUDIT_ACTION_BADGE_STYLES,
    WORKFLOW_AUDIT_ACTION_DOT_STYLES,
    WORKFLOW_AUDIT_RESOURCE_BADGE_STYLES,
} from '../../../pages/workflow/workflowUtils';

export interface WorkflowRowActionsProps {
    isEnabledOrActive: boolean;
    viewTitle: string;
    editTitle: string;
    toggleTitle: string;
    deleteTitle: string;
    alignEnd?: boolean;
    onView: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

/**
 * Shared row action buttons (View, Edit, Enable/Disable or Activate/Deactivate, Delete)
 * used across Workflows, Status Levels, and Email Templates tables.
 */
export const WorkflowRowActions: React.FC<WorkflowRowActionsProps> = ({
    isEnabledOrActive,
    viewTitle,
    editTitle,
    toggleTitle,
    deleteTitle,
    alignEnd = false,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}) => {
    return (
        <div
            className={
                alignEnd
                    ? 'inline-flex items-center justify-end gap-1'
                    : 'flex items-center gap-1'
            }
        >
            <button
                type="button"
                onClick={onView}
                title={viewTitle}
                aria-label={viewTitle}
                className="p-1 rounded-md text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
                <Eye size={14} />
            </button>
            <button
                type="button"
                onClick={onEdit}
                title={editTitle}
                aria-label={editTitle}
                className="p-1 rounded-md text-[#857E74] hover:text-[#037F8C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
                <Pencil size={14} />
            </button>
            <button
                type="button"
                onClick={onToggleStatus}
                title={toggleTitle}
                aria-label={toggleTitle}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                    isEnabledOrActive
                        ? 'text-[#037F8C] hover:bg-[#037F8C]/10'
                        : 'text-[#857E74] hover:bg-[#857E74]/15'
                }`}
            >
                <Power size={14} />
            </button>
            <button
                type="button"
                onClick={onDelete}
                title={deleteTitle}
                aria-label={deleteTitle}
                className="p-1 rounded-md text-[#857E74] hover:text-[#A63A3A] hover:bg-[#FCECE9] transition-colors cursor-pointer"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

/**
 * Shared icon renderer for Workflow Audit Trail resource types.
 */
function renderWorkflowResourceIcon(
    resource: WorkflowAuditResource | string
): React.ReactNode {
    const norm = normalizeWorkflowAuditResource(resource);
    switch (norm) {
        case 'Workflow':
            return <GitBranch size={12} className="shrink-0 text-[#037F8C]" />;
        case 'Workflow Master':
            return <FolderKanban size={12} className="shrink-0 text-[#8C6046]" />;
        case 'Status Level':
            return <ListFilter size={12} className="shrink-0 text-[#037F8C]" />;
        case 'Email Template':
            return <Mail size={12} className="shrink-0 text-[#6A7358]" />;
        default:
            return <FileText size={12} className="shrink-0 text-[#595550]" />;
    }
}

export interface WorkflowAuditActionBadgeProps {
    action: WorkflowAuditAction | string;
    label: string;
}

export const WorkflowAuditActionBadge: React.FC<WorkflowAuditActionBadgeProps> = ({
    action,
    label,
}) => {
    const normAction = normalizeWorkflowAuditAction(action);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                WORKFLOW_AUDIT_ACTION_BADGE_STYLES[normAction]
            }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${
                    WORKFLOW_AUDIT_ACTION_DOT_STYLES[normAction]
                }`}
            />
            <span>{label}</span>
        </span>
    );
};

export interface WorkflowAuditResourceBadgeProps {
    resource: WorkflowAuditResource | string;
    label: string;
}

export const WorkflowAuditResourceBadge: React.FC<WorkflowAuditResourceBadgeProps> = ({
    resource,
    label,
}) => {
    const normResource = normalizeWorkflowAuditResource(resource);
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                WORKFLOW_AUDIT_RESOURCE_BADGE_STYLES[normResource] ||
                WORKFLOW_AUDIT_RESOURCE_BADGE_STYLES.Workflow
            }`}
        >
            {renderWorkflowResourceIcon(resource)}
            <span>{label}</span>
        </span>
    );
};
