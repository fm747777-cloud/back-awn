import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { ErrorPage } from '../pages/ErrorPage';
import { ProtectedRoute } from '../layouts/ProtectedRoute';

// Lazy loading للصفحات
const HomePage = () => import('../pages/HomePage').then((m) => ({ Component: m.HomePage }));
const ServicesPage = () => import('../pages/ServicePage').then((m) => ({ Component: m.ServicesPage }));
const LoginPage = () => import('../pages/LoginPage').then((m) => ({ Component: m.LoginPage }));
const SettingsPage = () => import('../pages/SettingsPage').then((m) => ({ Component: m.SettingsPage }));
const PlaceholderModulePage = () => import('../pages/PlaceholderModulePage').then((m) => ({ Component: m.PlaceholderModulePage }));

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
                        lazy: PlaceholderModulePage,
                    },
                    {
                        path: '/crm',
                        lazy: PlaceholderModulePage,
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
                        lazy: PlaceholderModulePage,
                    },
                    {
                        path: '/customer',
                        lazy: PlaceholderModulePage,
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
                        lazy: PlaceholderModulePage,
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
        element: (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-xl text-slate-400">
                404 - الصفحة غير موجودة
            </div>
        ),
    },
]);
