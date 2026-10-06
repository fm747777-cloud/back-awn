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
    MessageSquareQuote
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

interface SidebarState {
    collapsed: boolean;
    menuGroups: MenuGroup[];
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMenuGroups: (groups: MenuGroup[]) => void;
}

const getInitialMenuGroups = (): MenuGroup[] => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/ticketing')) {
        return TICKETING_SIDEBAR_GROUPS;
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

