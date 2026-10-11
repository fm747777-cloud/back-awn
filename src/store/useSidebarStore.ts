import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Layers,
    FolderKanban,
    PackageCheck,
    ListFilter,
    Grid,
    Tag,
    Monitor,
    History,
    Ticket,
    MessageSquareQuote,
    ClipboardList,
    CheckSquare,
    GitBranch,
    Mail,
    Users,
    Briefcase,
    Building2,
    ShieldCheck,
    UserCheck,
    MapPin,
    Puzzle,
    BarChart3,
    UserPlus,
    FileText,
    FileCheck,
    Receipt,
    Award,
    Percent,
} from 'lucide-react';

export interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

export interface MenuGroup {
    title?: string;
    collapsible?: boolean;
    icon?: LucideIcon;
    items: MenuItem[];
}

export const DEFAULT_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'MAIN',
        items: [
            { label: 'Dashboard', path: '/service/dashboard', icon: LayoutDashboard },
            { label: 'Services', path: '/service/services', icon: Layers },
        ],
    },
    {
        title: 'MASTERS',
        items: [
            { label: 'Service Groups', path: '/service/service-groups', icon: FolderKanban },
            { label: 'Service Packages', path: '/service/service-packages', icon: PackageCheck },
            { label: 'Service Types', path: '/service/service-types', icon: ListFilter },
            { label: 'Service Categories', path: '/service/service-categories', icon: Grid },
            { label: 'Service Tags', path: '/service/service-tags', icon: Tag },
            { label: 'Service Portals', path: '/service/service-portals', icon: Monitor },
        ],
    },
    {
        title: 'AUDIT TRAIL',
        items: [
            { label: 'Audit Trail', path: '/service/services-audit-trail', icon: History },
        ],
    },
];

export const TICKETING_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/ticketing/dashboard', icon: LayoutDashboard },
            { label: 'Tickets', path: '/ticketing/tickets', icon: Ticket },
        ],
    },
    {
        title: 'Masters',
        items: [
            { label: 'Ticket Types', path: '/ticketing/ticket-types', icon: Tag },
            { label: 'Canned Replies', path: '/ticketing/canned-replies', icon: MessageSquareQuote },
        ],
    },
    {
        // Audit Trail group has no title so "Audit Trail" appears only once as the nav item
        items: [
            { label: 'Audit Trail', path: '/ticketing/audit-trail', icon: History },
        ],
    },
];

export const EDMS_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/edms/dashboard', icon: LayoutDashboard },
            { label: 'Documents', path: '/edms/documents', icon: Layers },
        ],
    },
    {
        title: 'Masters',
        items: [
            { label: 'Document Categories', path: '/edms/document-categories', icon: Grid },
            { label: 'Document Types', path: '/edms/document-types', icon: ListFilter },
            { label: 'Document Templates', path: '/edms/document-templates', icon: FolderKanban },
        ],
    },
    {
        items: [
            { label: 'Audit Trail', path: '/edms/audit-trail', icon: History },
        ],
    },
];

export const REQUEST_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/request/dashboard', icon: LayoutDashboard },
            { label: 'Service', path: '/request/services', icon: Layers },
            { label: 'Requests', path: '/request/requests', icon: ClipboardList },
            { label: 'Operational Tasks', path: '/request/operational-tasks', icon: CheckSquare },
        ],
    },
    {
        items: [
            { label: 'Audit Trail', path: '/request/audit-trail', icon: History },
        ],
    },
];

export const WORKFLOW_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/workflow/dashboard', icon: LayoutDashboard },
            { label: 'Workflows', path: '/workflow/workflows', icon: GitBranch },
        ],
    },
    {
        title: 'Masters',
        items: [
            { label: 'Masters', path: '/workflow/masters', icon: FolderKanban },
            { label: 'Status Levels', path: '/workflow/status-levels', icon: ListFilter },
            { label: 'Email Templates', path: '/workflow/email-templates', icon: Mail },
        ],
    },
    {
        items: [
            { label: 'Audit Trail', path: '/workflow/audit-trail', icon: History },
        ],
    },
];

export const ASSET_MANAGEMENT_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Approval Tasks', path: '/asset-management/approval-tasks', icon: CheckSquare },
            { label: 'Assets', path: '/asset-management/assets', icon: PackageCheck },
        ],
    },
    {
        title: 'Masters',
        collapsible: true,
        icon: FolderKanban,
        items: [
            { label: 'Asset Status', path: '/asset-management/status', icon: ListFilter },
            { label: 'Asset Types', path: '/asset-management/types', icon: Layers },
            { label: 'Asset Categories', path: '/asset-management/categories', icon: Grid },
            { label: 'Asset Tags', path: '/asset-management/tags', icon: Tag },
        ],
    },
    {
        items: [
            { label: 'Audit Trail', path: '/asset-management/audit-trail', icon: History },
        ],
    },
];

export const UMS_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/ums/dashboard', icon: LayoutDashboard },
            { label: 'Employees', path: '/ums/employees', icon: Users },
        ],
    },
    {
        title: 'Masters',
        items: [
            { label: 'Designations', path: '/ums/designations', icon: Briefcase },
            { label: 'Departments', path: '/ums/departments', icon: Building2 },
            { label: 'Security Groups', path: '/ums/security-groups', icon: ShieldCheck },
            { label: 'Roles', path: '/ums/roles', icon: UserCheck },
            { label: 'Branches', path: '/ums/branches', icon: MapPin },
            { label: 'Custom Addons', path: '/ums/custom-addons', icon: Puzzle },
        ],
    },
    {
        items: [
            { label: 'Audit Trail', path: '/ums/audit-trail', icon: History },
        ],
    },
];

export const CRM_SIDEBAR_GROUPS: MenuGroup[] = [
    {
        title: 'Main',
        items: [
            { label: 'Sales Performance Dashboard', path: '/crm/sales-performance-dashboard', icon: BarChart3 },
            { label: 'Dashboard Sales', path: '/crm/dashboard-sales', icon: LayoutDashboard },
            { label: 'Approval Tasks', path: '/crm/approval-tasks', icon: CheckSquare },
            { label: 'Operational Task', path: '/crm/operational-task', icon: ClipboardList },
        ],
    },
    {
        title: 'Leads',
        items: [
            { label: 'Leads', path: '/crm/leads', icon: UserPlus },
            { label: 'Companies', path: '/crm/companies', icon: Building2 },
            { label: 'Contacts', path: '/crm/contacts', icon: Users },
            { label: 'Owners', path: '/crm/owners', icon: UserCheck },
        ],
    },
    {
        title: 'Deals',
        items: [
            { label: 'Deals', path: '/crm/deals', icon: Briefcase },
            { label: 'Quotations', path: '/crm/quotations', icon: FileText },
            { label: 'Contracts', path: '/crm/contracts', icon: FileCheck },
            { label: 'Invoices', path: '/crm/invoices', icon: Receipt },
            { label: 'Won Deals', path: '/crm/won-deals', icon: Award },
        ],
    },
    {
        title: 'Master',
        items: [
            { label: 'Lead Source', path: '/crm/lead-source', icon: FolderKanban },
            { label: 'Lead Status', path: '/crm/lead-status', icon: ListFilter },
            { label: 'Sectors', path: '/crm/sectors', icon: Layers },
            { label: 'Tax', path: '/crm/tax', icon: Percent },
            { label: 'Organizational Types', path: '/crm/organizational-types', icon: Grid },
            { label: 'Ownership Types', path: '/crm/ownership-types', icon: ShieldCheck },
        ],
    },
    {
        title: 'Audit Trail',
        items: [
            { label: 'Audit Trails', path: '/crm/audit-trails', icon: History },
        ],
    },
];

interface SidebarState {
    collapsed: boolean;
    menuGroups: MenuGroup[];
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMenuGroups: (groups: MenuGroup[]) => void;
}

export const getMenuGroupsForPath = (
    pathname: string,
    fallbackGroups: MenuGroup[] = DEFAULT_SIDEBAR_GROUPS
): MenuGroup[] => {
    if (pathname.startsWith('/ums')) {
        return UMS_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/crm')) {
        return CRM_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/ticketing')) {
        return TICKETING_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/edms')) {
        return EDMS_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/request')) {
        return REQUEST_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/workflow')) {
        return WORKFLOW_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/asset-management')) {
        return ASSET_MANAGEMENT_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/service') || pathname === '/') {
        return DEFAULT_SIDEBAR_GROUPS;
    }
    if (pathname.startsWith('/customer')) {
        const basePath = `/${pathname.replace(/^\/+/, '').split('/')[0]}`;
        return [
            {
                title: 'Main',
                items: [
                    { label: 'Dashboard', path: basePath, icon: LayoutDashboard },
                ],
            },
        ];
    }
    return fallbackGroups;
};

const getInitialMenuGroups = (): MenuGroup[] => {
    if (typeof window !== 'undefined') {
        return getMenuGroupsForPath(window.location.pathname, DEFAULT_SIDEBAR_GROUPS);
    }
    return DEFAULT_SIDEBAR_GROUPS;
};

export const useSidebarStore = create<SidebarState>((set) => ({
    collapsed: false,
    menuGroups: getInitialMenuGroups(),
    toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
    setCollapsed: (collapsed) => set({ collapsed }),
    setMenuGroups: (menuGroups) => set({ menuGroups }),
}));

