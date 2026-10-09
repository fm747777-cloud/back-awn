import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, UMS_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const UmsPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(UMS_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
