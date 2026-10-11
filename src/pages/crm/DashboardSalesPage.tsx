import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { CrmPhasePlaceholder } from '../../components/crm/shared/CrmPhasePlaceholder';

export const DashboardSalesPage: React.FC = () => {
    return (
        <CrmPhasePlaceholder
            pageKey="dashboardSales"
            groupKey="main"
            routePath="/crm/dashboard-sales"
            code="CRM-DBS"
            icon={LayoutDashboard}
        />
    );
};
