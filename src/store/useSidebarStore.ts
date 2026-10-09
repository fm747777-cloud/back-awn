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
    Mail
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
    if (pathname.startsWith('/service')) {
        return DEFAULT_SIDEBAR_GROUPS;
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

