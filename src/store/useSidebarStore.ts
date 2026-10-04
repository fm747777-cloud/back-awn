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
    History
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

interface SidebarState {
    collapsed: boolean;
    menuGroups: MenuGroup[];
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMenuGroups: (groups: MenuGroup[]) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    collapsed: false,
    menuGroups: DEFAULT_SIDEBAR_GROUPS,
    toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
    setCollapsed: (collapsed) => set({ collapsed }),
    setMenuGroups: (menuGroups) => set({ menuGroups }),
}));

