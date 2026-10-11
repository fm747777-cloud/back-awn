import React from 'react';
import { BarChart3 } from 'lucide-react';
import { CrmPhasePlaceholder } from '../../components/crm/shared/CrmPhasePlaceholder';

export const SalesPerformanceDashboardPage: React.FC = () => {
    return (
        <CrmPhasePlaceholder
            pageKey="salesPerformanceDashboard"
            groupKey="main"
            routePath="/crm/sales-performance-dashboard"
            code="CRM-SPD"
            icon={BarChart3}
        />
    );
};
