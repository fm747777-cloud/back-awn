/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { ErrorPage } from '../pages/ErrorPage';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

// Lazy loading للصفحات
const HomePage = () => import('../pages/HomePage').then((m) => ({ Component: m.HomePage }));
const ServicesPage = () => import('../pages/ServicePage').then((m) => ({ Component: m.ServicesPage }));
const LoginPage = () => import('../pages/LoginPage').then((m) => ({ Component: m.LoginPage }));
const SettingsPage = () => import('../pages/SettingsPage').then((m) => ({ Component: m.SettingsPage }));

// Ticketing Module
const TicketingPage = () => import('../pages/TicketingPage').then((m) => ({ Component: m.TicketingPage }));
const TicketingDashboardPage = () => import('../pages/ticketing/TicketingDashboardPage').then((m) => ({ Component: m.TicketingDashboardPage }));
const TicketsPage = () => import('../pages/ticketing/TicketsPage').then((m) => ({ Component: m.TicketsPage }));
const TicketTypesPage = () => import('../pages/ticketing/TicketTypesPage').then((m) => ({ Component: m.TicketTypesPage }));
const CannedRepliesPage = () => import('../pages/ticketing/CannedRepliesPage').then((m) => ({ Component: m.CannedRepliesPage }));
const TicketingAuditTrailPage = () => import('../pages/ticketing/TicketingAuditTrailPage').then((m) => ({ Component: m.TicketingAuditTrailPage }));

// EDMS Module
const EdmsPage = () => import('../pages/EdmsPage').then((m) => ({ Component: m.EdmsPage }));
const EdmsDashboardPage = () => import('../pages/edms/EdmsDashboardPage').then((m) => ({ Component: m.EdmsDashboardPage }));
const EdmsDocumentsPage = () => import('../pages/edms/EdmsDocumentsPage').then((m) => ({ Component: m.EdmsDocumentsPage }));
const EdmsDocumentCategoriesPage = () => import('../pages/edms/EdmsDocumentCategoriesPage').then((m) => ({ Component: m.EdmsDocumentCategoriesPage }));
const EdmsDocumentTypesPage = () => import('../pages/edms/EdmsDocumentTypesPage').then((m) => ({ Component: m.EdmsDocumentTypesPage }));
const EdmsDocumentTemplatesPage = () => import('../pages/edms/EdmsDocumentTemplatesPage').then((m) => ({ Component: m.EdmsDocumentTemplatesPage }));
const EdmsAuditTrailPage = () => import('../pages/edms/EdmsAuditTrailPage').then((m) => ({ Component: m.EdmsAuditTrailPage }));

// Request Module
const RequestPage = () => import('../pages/RequestPage').then((m) => ({ Component: m.RequestPage }));
const RequestDashboardPage = () => import('../pages/request/RequestDashboardPage').then((m) => ({ Component: m.RequestDashboardPage }));
const RequestServicesPage = () => import('../pages/request/RequestServicesPage').then((m) => ({ Component: m.RequestServicesPage }));
const RequestsPage = () => import('../pages/request/RequestsPage').then((m) => ({ Component: m.RequestsPage }));
const OperationalTasksPage = () => import('../pages/request/OperationalTasksPage').then((m) => ({ Component: m.OperationalTasksPage }));
const RequestAuditTrailPage = () => import('../pages/request/RequestAuditTrailPage').then((m) => ({ Component: m.RequestAuditTrailPage }));

// Workflow Management Module
const WorkflowPage = () => import('../pages/WorkflowPage').then((m) => ({ Component: m.WorkflowPage }));
const WorkflowDashboardPage = () => import('../pages/workflow/WorkflowDashboardPage').then((m) => ({ Component: m.WorkflowDashboardPage }));
const WorkflowsPage = () => import('../pages/workflow/WorkflowsPage').then((m) => ({ Component: m.WorkflowsPage }));
const WorkflowStatusLevelsPage = () => import('../pages/workflow/WorkflowStatusLevelsPage').then((m) => ({ Component: m.WorkflowStatusLevelsPage }));
const WorkflowEmailTemplatesPage = () => import('../pages/workflow/WorkflowEmailTemplatesPage').then((m) => ({ Component: m.WorkflowEmailTemplatesPage }));
const WorkflowAuditTrailPage = () => import('../pages/workflow/WorkflowAuditTrailPage').then((m) => ({ Component: m.WorkflowAuditTrailPage }));

// Asset Management Module
const AssetManagementPage = () => import('../pages/AssetManagementPage').then((m) => ({ Component: m.AssetManagementPage }));
const AssetApprovalTasksPage = () => import('../pages/asset-management/AssetApprovalTasksPage').then((m) => ({ Component: m.AssetApprovalTasksPage }));
const AssetsPage = () => import('../pages/asset-management/AssetsPage').then((m) => ({ Component: m.AssetsPage }));
const AssetStatusPage = () => import('../pages/asset-management/AssetStatusPage').then((m) => ({ Component: m.AssetStatusPage }));
const AssetTypesPage = () => import('../pages/asset-management/AssetTypesPage').then((m) => ({ Component: m.AssetTypePage }));
const AssetCategoriesPage = () => import('../pages/asset-management/AssetCategoriesPage').then((m) => ({ Component: m.AssetCategoriesPage }));
const AssetTagsPage = () => import('../pages/asset-management/AssetTagsPage').then((m) => ({ Component: m.AssetTagsPage }));
const AssetAuditTrailPage = () => import('../pages/asset-management/AssetAuditTrailPage').then((m) => ({ Component: m.AssetAuditTrailPage }));

// UMS Module (User Management System)
const UmsPage = () => import('../pages/UmsPage').then((m) => ({ Component: m.UmsPage }));
const UmsDashboardPage = () => import('../pages/ums/UmsDashboardPage').then((m) => ({ Component: m.UmsDashboardPage }));
const UmsEmployeesPage = () => import('../pages/ums/UmsEmployeesPage').then((m) => ({ Component: m.UmsEmployeesPage }));
// const UmsEmployeeNewPage = () => import('../pages/ums/UmsEmployeeWizardPage').then((m) => ({ Component: m.UmsEmployeeWizardPage }));
const UmsEmployeeDetailsPage = () => import('../pages/ums/UmsEmployeesPage').then((m) => ({ Component: m.UmsEmployeeDetailsPage }));
const UmsEmployeeImportPage = () => import('../pages/ums/UmsEmployeeImportPage').then((m) => ({ Component: m.UmsEmployeeImportPage }));
const UmsDesignationsPage = () => import('../pages/ums/UmsDesignationsPage').then((m) => ({ Component: m.UmsDesignationsPage }));
const UmsDepartmentsPage = () => import('../pages/ums/UmsDepartmentsPage').then((m) => ({ Component: m.UmsDepartmentsPage }));
const UmsSecurityGroupsPage = () => import('../pages/ums/UmsSecurityGroupsPage').then((m) => ({ Component: m.UmsSecurityGroupsPage }));
const UmsRolesPage = () => import('../pages/ums/UmsRolesPage').then((m) => ({ Component: m.UmsRolesPage }));
const UmsBranchesPage = () => import('../pages/ums/UmsBranchesPage').then((m) => ({ Component: m.UmsBranchesPage }));
const UmsCustomAddonsPage = () => import('../pages/ums/UmsCustomAddonsPage').then((m) => ({ Component: m.UmsCustomAddonsPage }));
const UmsAuditTrailPage = () => import('../pages/ums/UmsAuditTrailPage').then((m) => ({ Component: m.UmsAuditTrailPage }));

// CRM Module (Client Relations Management)
const CrmPage = () => import('../pages/CrmPage').then((m) => ({ Component: m.CrmPage }));
const SalesPerformanceDashboardPage = () => import('../pages/crm/SalesPerformanceDashboardPage').then((m) => ({ Component: m.SalesPerformanceDashboardPage }));
const DashboardSalesPage = () => import('../pages/crm/DashboardSalesPage').then((m) => ({ Component: m.DashboardSalesPage }));
const CrmApprovalTasksPage = () => import('../pages/crm/CrmApprovalTasksPage').then((m) => ({ Component: m.CrmApprovalTasksPage }));
const CrmOperationalTaskPage = () => import('../pages/crm/CrmOperationalTaskPage').then((m) => ({ Component: m.CrmOperationalTaskPage }));
const LeadsPage = () => import('../pages/crm/LeadsPage').then((m) => ({ Component: m.LeadsPage }));
const CompaniesPage = () => import('../pages/crm/CompaniesPage').then((m) => ({ Component: m.CompaniesPage }));
const ContactsPage = () => import('../pages/crm/ContactsPage').then((m) => ({ Component: m.ContactsPage }));
const OwnersPage = () => import('../pages/crm/OwnersPage').then((m) => ({ Component: m.OwnersPage }));
const DealsPage = () => import('../pages/crm/DealsPage').then((m) => ({ Component: m.DealsPage }));
const QuotationsPage = () => import('../pages/crm/QuotationsPage').then((m) => ({ Component: m.QuotationsPage }));
const ContractsPage = () => import('../pages/crm/ContractsPage').then((m) => ({ Component: m.ContractsPage }));
const InvoicesPage = () => import('../pages/crm/InvoicesPage').then((m) => ({ Component: m.InvoicesPage }));
const WonDealsPage = () => import('../pages/crm/WonDealsPage').then((m) => ({ Component: m.WonDealsPage }));
const LeadSourcePage = () => import('../pages/crm/LeadSourcePage').then((m) => ({ Component: m.LeadSourcePage }));
const LeadStatusPage = () => import('../pages/crm/LeadStatusPage').then((m) => ({ Component: m.LeadStatusPage }));
const SectorsPage = () => import('../pages/crm/SectorsPage').then((m) => ({ Component: m.SectorsPage }));
const TaxPage = () => import('../pages/crm/TaxPage').then((m) => ({ Component: m.TaxPage }));
const OrganizationalTypesPage = () => import('../pages/crm/OrganizationalTypesPage').then((m) => ({ Component: m.OrganizationalTypesPage }));
const OwnershipTypesPage = () => import('../pages/crm/OwnershipTypesPage').then((m) => ({ Component: m.OwnershipTypesPage }));
const CrmAuditTrailsPage = () => import('../pages/crm/CrmAuditTrailsPage').then((m) => ({ Component: m.CrmAuditTrailsPage }));

// CUSTOMER Module
const CustomerPage = () => import('../pages/CustomerPage').then((m) => ({ Component: m.CustomerPage }));
const CustomerDashboardPage = () => import('../pages/customer/CustomerDashboardPage').then((m) => ({ Component: m.CustomerDashboardPage }));
const CustomerCompaniesPage = () => import('../pages/customer/CustomerCompaniesPage').then((m) => ({ Component: m.CustomerCompaniesPage }));
const CustomerDealsPage = () => import('../pages/customer/CustomerDealsPage').then((m) => ({ Component: m.CustomerDealsPage }));
const CustomerQuotationsPage = () => import('../pages/customer/CustomerQuotationsPage').then((m) => ({ Component: m.CustomerQuotationsPage }));
const CustomerContractsPage = () => import('../pages/customer/CustomerContractsPage').then((m) => ({ Component: m.CustomerContractsPage }));
const CustomerInvoicesPage = () => import('../pages/customer/CustomerInvoicesPage').then((m) => ({ Component: m.CustomerInvoicesPage }));
const CustomerServicesPage = () => import('../pages/customer/CustomerServicesPage').then((m) => ({ Component: m.CustomerServicesPage }));
const CustomerServicePackagesPage = () => import('../pages/customer/CustomerServicePackagesPage').then((m) => ({ Component: m.CustomerServicePackagesPage }));
const CustomerRequestsPage = () => import('../pages/customer/CustomerRequestsPage').then((m) => ({ Component: m.CustomerRequestsPage }));
const CustomerOperationalTasksPage = () => import('../pages/customer/CustomerOperationalTasksPage').then((m) => ({ Component: m.CustomerOperationalTasksPage }));
const CustomerContactsPage = () => import('../pages/customer/CustomerContactsPage').then((m) => ({ Component: m.CustomerContactsPage }));
const CustomerOwnersPage = () => import('../pages/customer/CustomerOwnersPage').then((m) => ({ Component: m.CustomerOwnersPage }));
const CustomerBranchesPage = () => import('../pages/customer/CustomerBranchesPage').then((m) => ({ Component: m.CustomerBranchesPage }));
const CustomerDepartmentsPage = () => import('../pages/customer/CustomerDepartmentsPage').then((m) => ({ Component: m.CustomerDepartmentsPage }));
const CustomerEmployeesPage = () => import('../pages/customer/CustomerEmployeesPage').then((m) => ({ Component: m.CustomerEmployeesPage }));
const CustomerAssetsPage = () => import('../pages/customer/CustomerAssetsPage').then((m) => ({ Component: m.CustomerAssetsPage }));
const CustomerDocumentsPage = () => import('../pages/customer/CustomerDocumentsPage').then((m) => ({ Component: m.CustomerDocumentsPage }));
const CustomerApprovalTasksPage = () => import('../pages/customer/CustomerApprovalTasksPage').then((m) => ({ Component: m.CustomerApprovalTasksPage }));
const CustomerWorkflowsPage = () => import('../pages/customer/CustomerWorkflowsPage').then((m) => ({ Component: m.CustomerWorkflowsPage }));
const CustomerTicketsPage = () => import('../pages/customer/CustomerTicketsPage').then((m) => ({ Component: m.CustomerTicketsPage }));
const CustomerAuditTrailPage = () => import('../pages/customer/CustomerAuditTrailPage').then((m) => ({ Component: m.CustomerAuditTrailPage }));

// Tabs
const ServicesDashboardTab = () => import('../components/Service/ServicesDashboardTab').then((m) => ({ Component: m.ServicesDashboardTab }));
const ServicesListTab = () => import('../components/Service/ServicesListTab').then((m) => ({ Component: m.ServicesListTab }));
const ServiceGroupsTab = () => import('../components/Service/ServiceGroupsTab').then((m) => ({ Component: m.ServiceGroupsTab }));
const ServicePackagesTab = () => import('../components/Service/ServicePackagesTab').then((m) => ({ Component: m.ServicePackagesTab }));
const ServiceTypeTab = () => import('../components/Service/ServiceTypeTab').then((m) => ({ Component: m.ServiceTypeTab }));
const ServiceCategoryTab = () => import('../components/Service/ServiceCategoryTab').then((m) => ({ Component: m.ServiceCategoryTab }));
const ServiceTagsTab = () => import('../components/Service/ServiceTagsTab').then((m) => ({ Component: m.ServiceTagsTab }));
const ServicePortalsTab = () => import('../components/Service/ServicePortalsTab').then((m) => ({ Component: m.ServicePortalsTab }));
const ServiceAuditTrailTab = () => import('../components/Service/ServiceAuditTrailTab').then((m) => ({ Component: m.ServiceAuditTrailTab }));

export const router = createBrowserRouter([
    // 🔓 1. صفحة تسجيل الدخول العامة
    {
        path: '/login',
        lazy: LoginPage,
    },

    // 🔒 2. الصفحات المحمية
    {
        path: '/',
        element: <ProtectedRoute />, // يفحص التوكن ويرجع <Outlet />
        errorElement: <ErrorPage />,
        children: [
            {
                element: <RootLayout />,
                children: [
                    {
                        index: true,
                        lazy: HomePage,
                    },
                    {
                        path: '/settings',
                        lazy: SettingsPage,
                    },
                    {
                        path: '/documents',
                        element: <Navigate to="/edms/documents" replace />,
                    },
                    {
                        path: '/templates',
                        element: <Navigate to="/edms/document-templates" replace />,
                    },
                    {
                        path: '/categories',
                        element: <Navigate to="/edms/document-categories" replace />,
                    },
                    {
                        path: '/types',
                        element: <Navigate to="/edms/document-types" replace />,
                    },
                    {
                        path: '/audit-trail',
                        element: <Navigate to="/edms/audit-trail" replace />,
                    },
                    // Core AWN modules
                    {
                        path: '/ums',
                        lazy: UmsPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/ums/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: UmsDashboardPage,
                            },
                            {
                                path: 'employees',
                                lazy: UmsEmployeesPage,
                            },
                            // {
                            //     path: 'employees/new',
                            //     lazy: UmsEmployeeNewPage,
                            // },
                            {
                                path: 'employees/import',
                                lazy: UmsEmployeeImportPage,
                            },
                            {
                                path: 'employees/:id',
                                lazy: UmsEmployeeDetailsPage,
                            },
                            // {
                            //     path: 'employees/:id/edit',
                            //     lazy: UmsEmployeeNewPage,
                            // },
                            {
                                path: 'designations',
                                lazy: UmsDesignationsPage,
                            },
                            {
                                path: 'departments',
                                lazy: UmsDepartmentsPage,
                            },
                            {
                                path: 'security-groups',
                                lazy: UmsSecurityGroupsPage,
                            },
                            {
                                path: 'roles',
                                lazy: UmsRolesPage,
                            },
                            {
                                path: 'branches',
                                lazy: UmsBranchesPage,
                            },
                            {
                                path: 'custom-addons',
                                lazy: UmsCustomAddonsPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: UmsAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/crm',
                        lazy: CrmPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/crm/sales-performance-dashboard" replace />,
                            },
                            {
                                path: 'sales-performance-dashboard',
                                lazy: SalesPerformanceDashboardPage,
                            },
                            {
                                path: 'dashboard-sales',
                                lazy: DashboardSalesPage,
                            },
                            {
                                path: 'approval-tasks',
                                lazy: CrmApprovalTasksPage,
                            },
                            {
                                path: 'operational-task',
                                lazy: CrmOperationalTaskPage,
                            },
                            {
                                path: 'leads',
                                lazy: LeadsPage,
                            },
                            {
                                path: 'companies',
                                lazy: CompaniesPage,
                            },
                            {
                                path: 'contacts',
                                lazy: ContactsPage,
                            },
                            {
                                path: 'owners',
                                lazy: OwnersPage,
                            },
                            {
                                path: 'deals',
                                lazy: DealsPage,
                            },
                            {
                                path: 'quotations',
                                lazy: QuotationsPage,
                            },
                            {
                                path: 'contracts',
                                lazy: ContractsPage,
                            },
                            {
                                path: 'invoices',
                                lazy: InvoicesPage,
                            },
                            {
                                path: 'won-deals',
                                lazy: WonDealsPage,
                            },
                            {
                                path: 'lead-source',
                                lazy: LeadSourcePage,
                            },
                            {
                                path: 'lead-status',
                                lazy: LeadStatusPage,
                            },
                            {
                                path: 'sectors',
                                lazy: SectorsPage,
                            },
                            {
                                path: 'tax',
                                lazy: TaxPage,
                            },
                            {
                                path: 'organizational-types',
                                lazy: OrganizationalTypesPage,
                            },
                            {
                                path: 'ownership-types',
                                lazy: OwnershipTypesPage,
                            },
                            {
                                path: 'audit-trails',
                                lazy: CrmAuditTrailsPage,
                            },
                        ],
                    },
                    {
                        path: '/edms',
                        lazy: EdmsPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/edms/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: EdmsDashboardPage,
                            },
                            {
                                path: 'documents',
                                lazy: EdmsDocumentsPage,
                            },
                            {
                                path: 'document-categories',
                                lazy: EdmsDocumentCategoriesPage,
                            },
                            {
                                path: 'document-types',
                                lazy: EdmsDocumentTypesPage,
                            },
                            {
                                path: 'document-templates',
                                lazy: EdmsDocumentTemplatesPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: EdmsAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/request',
                        lazy: RequestPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/request/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: RequestDashboardPage,
                            },
                            {
                                path: 'services',
                                lazy: RequestServicesPage,
                            },
                            {
                                path: 'requests',
                                lazy: RequestsPage,
                            },
                            {
                                path: 'operational-tasks',
                                lazy: OperationalTasksPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: RequestAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/workflow',
                        lazy: WorkflowPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/workflow/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: WorkflowDashboardPage,
                            },
                            {
                                path: 'workflows',
                                lazy: WorkflowsPage,
                            },
                            {
                                path: 'status-levels',
                                lazy: WorkflowStatusLevelsPage,
                            },
                            {
                                path: 'email-templates',
                                lazy: WorkflowEmailTemplatesPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: WorkflowAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/customer',
                        lazy: CustomerPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/customer/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: CustomerDashboardPage,
                            },
                            {
                                path: 'companies',
                                lazy: CustomerCompaniesPage,
                            },
                            {
                                path: 'deals',
                                lazy: CustomerDealsPage,
                            },
                            {
                                path: 'quotations',
                                lazy: CustomerQuotationsPage,
                            },
                            {
                                path: 'contracts',
                                lazy: CustomerContractsPage,
                            },
                            {
                                path: 'invoices',
                                lazy: CustomerInvoicesPage,
                            },
                            {
                                path: 'services',
                                lazy: CustomerServicesPage,
                            },
                            {
                                path: 'service-packages',
                                lazy: CustomerServicePackagesPage,
                            },
                            {
                                path: 'requests',
                                lazy: CustomerRequestsPage,
                            },
                            {
                                path: 'operational-tasks',
                                lazy: CustomerOperationalTasksPage,
                            },
                            {
                                path: 'contacts',
                                lazy: CustomerContactsPage,
                            },
                            {
                                path: 'owners',
                                lazy: CustomerOwnersPage,
                            },
                            {
                                path: 'branches',
                                lazy: CustomerBranchesPage,
                            },
                            {
                                path: 'departments',
                                lazy: CustomerDepartmentsPage,
                            },
                            {
                                path: 'employees',
                                lazy: CustomerEmployeesPage,
                            },
                            {
                                path: 'assets',
                                lazy: CustomerAssetsPage,
                            },
                            {
                                path: 'documents',
                                lazy: CustomerDocumentsPage,
                            },
                            {
                                path: 'approval-tasks',
                                lazy: CustomerApprovalTasksPage,
                            },
                            {
                                path: 'workflows',
                                lazy: CustomerWorkflowsPage,
                            },
                            {
                                path: 'tickets',
                                lazy: CustomerTicketsPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: CustomerAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/ticketing',
                        lazy: TicketingPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/ticketing/dashboard" replace />,
                            },
                            {
                                path: 'dashboard',
                                lazy: TicketingDashboardPage,
                            },
                            {
                                path: 'tickets',
                                lazy: TicketsPage,
                            },
                            {
                                path: 'ticket-types',
                                lazy: TicketTypesPage,
                            },
                            {
                                path: 'canned-replies',
                                lazy: CannedRepliesPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: TicketingAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/asset-management',
                        lazy: AssetManagementPage,
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/asset-management/approval-tasks" replace />,
                            },
                            {
                                path: 'approval-tasks',
                                lazy: AssetApprovalTasksPage,
                            },
                            {
                                path: 'assets',
                                lazy: AssetsPage,
                            },
                            {
                                path: 'status',
                                lazy: AssetStatusPage,
                            },
                            {
                                path: 'types',
                                lazy: AssetTypesPage,
                            },
                            {
                                path: 'categories',
                                lazy: AssetCategoriesPage,
                            },
                            {
                                path: 'tags',
                                lazy: AssetTagsPage,
                            },
                            {
                                path: 'audit-trail',
                                lazy: AssetAuditTrailPage,
                            },
                        ],
                    },
                    {
                        path: '/service',
                        lazy: ServicesPage, // الصفحة الحاوية (Parent Layout)
                        children: [
                            {
                                index: true,
                                element: <Navigate to="/service/dashboard" replace />, // التحويل تلقائياً لتاب الداديش بورد
                            },
                            {
                                path: 'dashboard',
                                lazy: ServicesDashboardTab,
                            },
                            {
                                path: 'services',
                                lazy: ServicesListTab,
                            },
                            {
                                path: 'service-groups',
                                lazy: ServiceGroupsTab,
                            },
                            {
                                path: 'service-packages',
                                lazy: ServicePackagesTab,
                            },
                            {
                                path: 'service-types',
                                lazy: ServiceTypeTab,
                            },
                            {
                                path: 'service-categories',
                                lazy: ServiceCategoryTab,
                            },
                            {
                                path: 'service-tags',
                                lazy: ServiceTagsTab,
                            },
                            {
                                path: 'service-portals',
                                lazy: ServicePortalsTab,
                            },
                            {
                                path: 'services-audit-trail',
                                lazy: ServiceAuditTrailTab,
                            },
                        ],
                    },
                ],
            },
        ],
    },

    // 🚫 3. مسار 404
    {
        path: '*',
        element: <ErrorPage />,
    },
]);
