import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

export interface MenuGroup {
    title?: string;
    items: MenuItem[];
}

interface SidebarState {
    collapsed: boolean;
    menuGroups: MenuGroup[];
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
    setMenuGroups: (groups: MenuGroup[]) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    collapsed: false,
    menuGroups: [],
    toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
    setCollapsed: (collapsed) => set({ collapsed }),
    setMenuGroups: (menuGroups) => set({ menuGroups }),
}));
