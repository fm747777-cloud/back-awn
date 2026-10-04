import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore } from '../store/useSidebarStore';
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

export const ServicesPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups([
            {
                title: 'Main',
                items: [
                    { label: 'Dashboard', path: '/service/dashboard', icon: LayoutDashboard },
                    { label: 'Services', path: '/service/services', icon: Layers },
                ],
            },
            {
                title: 'Masters',
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
                title: 'Audit Trail',
                items: [
                    { label: 'Audit Trail', path: '/service/services-audit-trail', icon: History },
                ],
            },
        ]);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
