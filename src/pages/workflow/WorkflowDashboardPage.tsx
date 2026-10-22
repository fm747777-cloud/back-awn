import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    GitBranch,
    CheckCircle2,
    ShieldCheck,
    Mail,
    PauseCircle,
    Layers,
} from 'lucide-react';
import {
    loadWorkflowRecords,
    APPROVAL_WORKFLOWS_BY_STATUS_DATA,
    COMMUNICATION_WORKFLOWS_BY_STATUS_DATA,
    type WorkflowRecord,
} from './workflowMockData';
import {
    safePercentage,
    buildWorkflowStatusChartData,
    buildWorkflowSourceBreakdown,
} from './workflowUtils';
import { WorkflowDashboardHeader } from '../../components/workflow/dashboard/WorkflowDashboardHeader';
import {
    WorkflowDashboardKpiGrid,
    type WorkflowDashboardKpiCardItem,
} from '../../components/workflow/dashboard/WorkflowDashboardKpiGrid';
import { WorkflowStatusAnalyticsSection } from '../../components/workflow/dashboard/WorkflowStatusAnalyticsSection';

export const WorkflowDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isAr = i18n.language?.startsWith('ar');

    const [records, setRecords] = useState<WorkflowRecord[]>(() => loadWorkflowRecords());

    useEffect(() => {
        const refresh = () => {
            setRecords(loadWorkflowRecords());
        };
        refresh();
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    const currentMonthYearLabel = useMemo(() => {
        try {
            return new Intl.DateTimeFormat(isAr ? 'ar-SA-u-ca-gregory' : 'en-US', {
                month: 'long',
                year: 'numeric',
            }).format(new Date());
        } catch {
            return 'April 2026';
        }
    }, [isAr]);

    // Derived counts from persisted workflow records
    const approvalRecords = useMemo(
        () => records.filter((r) => r.workflowType === 'approval'),
        [records]
    );
    const communicationRecords = useMemo(
        () => records.filter((r) => r.workflowType === 'communication'),
        [records]
    );

    const totalWorkflows = records.length;
    const enabledWorkflows = useMemo(
        () => records.filter((r) => r.status === 'Enabled').length,
        [records]
    );
    const disabledWorkflows = useMemo(
        () => records.filter((r) => r.status === 'Disabled').length,
        [records]
    );
    const connectedSourcesCount = useMemo(() => {
        const set = new Set(records.map((r) => r.source));
        return set.size;
    }, [records]);

    // Approval & Communication Workflows By Status chart datasets
    const approvalStatusChartData = useMemo(
        () =>
            buildWorkflowStatusChartData(
                approvalRecords,
                APPROVAL_WORKFLOWS_BY_STATUS_DATA,
                isAr
            ),
        [approvalRecords, isAr]
    );

    const communicationStatusChartData = useMemo(
        () =>
            buildWorkflowStatusChartData(
                communicationRecords,
                COMMUNICATION_WORKFLOWS_BY_STATUS_DATA,
                isAr
            ),
        [communicationRecords, isAr]
    );

    // Source breakdown per workflow type
    const approvalSourceSummary = useMemo(
        () => buildWorkflowSourceBreakdown(approvalRecords),
        [approvalRecords]
    );

    const communicationSourceSummary = useMemo(
        () => buildWorkflowSourceBreakdown(communicationRecords),
        [communicationRecords]
    );

    const kpiCards = useMemo<WorkflowDashboardKpiCardItem[]>(
        () => [
            {
                key: 'totalWorkflows',
                title: t('workflow.dashboard.kpis.totalWorkflows'),
                desc: t('workflow.dashboard.kpis.totalWorkflowsDesc'),
                count: totalWorkflows,
                percent: '100%',
                icon: GitBranch,
                accentClass: 'bg-[#037F8C]/10 border-[#037F8C]/20 text-[#037F8C]',
                badgeClass: 'bg-[#037F8C]/10 text-[#037F8C]',
            },
            {
                key: 'approvalWorkflows',
                title: t('workflow.dashboard.kpis.approvalWorkflows'),
                desc: t('workflow.dashboard.kpis.approvalWorkflowsDesc'),
                count: approvalRecords.length,
                percent: `${safePercentage(approvalRecords.length, totalWorkflows)}%`,
                icon: ShieldCheck,
                accentClass: 'bg-[#037F8C]/10 border-[#037F8C]/20 text-[#037F8C]',
                badgeClass: 'bg-[#037F8C]/10 text-[#037F8C]',
            },
            {
                key: 'communicationWorkflows',
                title: t('workflow.dashboard.kpis.communicationWorkflows'),
                desc: t('workflow.dashboard.kpis.communicationWorkflowsDesc'),
                count: communicationRecords.length,
                percent: `${safePercentage(communicationRecords.length, totalWorkflows)}%`,
                icon: Mail,
                accentClass: 'bg-[#6A7358]/15 border-[#6A7358]/25 text-[#037F8C]',
                badgeClass: 'bg-[#6A7358]/15 text-[#037F8C]',
            },
            {
                key: 'enabledWorkflows',
                title: t('workflow.dashboard.kpis.enabledWorkflows'),
                desc: t('workflow.dashboard.kpis.enabledWorkflowsDesc'),
                count: enabledWorkflows,
                percent: `${safePercentage(enabledWorkflows, totalWorkflows)}%`,
                icon: CheckCircle2,
                accentClass: 'bg-[#037F8C]/10 border-[#037F8C]/20 text-[#037F8C]',
                badgeClass: 'bg-[#037F8C]/10 text-[#037F8C]',
            },
            {
                key: 'disabledWorkflows',
                title: t('workflow.dashboard.kpis.disabledWorkflows'),
                desc: t('workflow.dashboard.kpis.disabledWorkflowsDesc'),
                count: disabledWorkflows,
                percent: `${safePercentage(disabledWorkflows, totalWorkflows)}%`,
                icon: PauseCircle,
                accentClass: 'bg-[#8C6046]/10 border-[#8C6046]/20 text-[#8C6046]',
                badgeClass: 'bg-[#8C6046]/10 text-[#8C6046]',
            },
            {
                key: 'connectedSources',
                title: t('workflow.dashboard.kpis.connectedSources'),
                desc: t('workflow.dashboard.kpis.connectedSourcesDesc'),
                count: connectedSourcesCount,
                percent: t('workflow.dashboard.labels.modulesTag'),
                icon: Layers,
                accentClass: 'bg-[#BFAB93]/25 border-[#BFAB93]/40 text-[#595550]',
                badgeClass: 'bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8]',
            },
        ],
        [
            t,
            totalWorkflows,
            approvalRecords.length,
            communicationRecords.length,
            enabledWorkflows,
            disabledWorkflows,
            connectedSourcesCount,
        ]
    );

    return (
        <div className="space-y-6 text-start">
            <WorkflowDashboardHeader currentMonthYearLabel={currentMonthYearLabel} />

            <WorkflowDashboardKpiGrid cards={kpiCards} />

            <WorkflowStatusAnalyticsSection
                sectionId="wfl-section-approval-status"
                icon={ShieldCheck}
                title={t('workflow.dashboard.sections.approvalWorkflowsByStatus')}
                description={t('workflow.dashboard.sections.approvalWorkflowsByStatusDesc')}
                totalCount={approvalRecords.length}
                actionLabel={t('workflow.dashboard.actions.viewApprovalWorkflows')}
                onActionClick={() => navigate('/workflow/workflows?tab=approval')}
                pipelineLabel={t('workflow.dashboard.labels.approvalPipeline')}
                chartData={approvalStatusChartData}
                sourceBreakdownTitle={t('workflow.dashboard.labels.approvalBySourceModule')}
                sourceSummary={approvalSourceSummary}
                sourceGridColsClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
            />

            <WorkflowStatusAnalyticsSection
                sectionId="wfl-section-communication-status"
                icon={Mail}
                title={t('workflow.dashboard.sections.communicationWorkflowsByStatus')}
                description={t('workflow.dashboard.sections.communicationWorkflowsByStatusDesc')}
                totalCount={communicationRecords.length}
                actionLabel={t('workflow.dashboard.actions.viewCommunicationWorkflows')}
                onActionClick={() => navigate('/workflow/workflows?tab=communication')}
                pipelineLabel={t('workflow.dashboard.labels.communicationPipeline')}
                chartData={communicationStatusChartData}
                sourceBreakdownTitle={t(
                    'workflow.dashboard.labels.communicationBySourceModule'
                )}
                sourceSummary={communicationSourceSummary}
                sourceGridColsClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            />
        </div>
    );
};

