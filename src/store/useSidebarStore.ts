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
    CheckSquare
} from 'lucide-react';

export interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

export interface MenuGroup {
    title?: string;
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

interface SidebarState {
    collapsed: boolean;
    menuGroups: MenuGroup[];
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMenuGroups: (groups: MenuGroup[]) => void;
}

const getInitialMenuGroups = (): MenuGroup[] => {
    if (typeof window !== 'undefined') {
        if (window.location.pathname.startsWith('/ticketing')) {
            return TICKETING_SIDEBAR_GROUPS;
        }
        if (window.location.pathname.startsWith('/edms')) {
            return EDMS_SIDEBAR_GROUPS;
        }
        if (window.location.pathname.startsWith('/request')) {
            return REQUEST_SIDEBAR_GROUPS;
        }
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

