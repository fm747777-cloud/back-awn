import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, REQUEST_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const RequestPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(REQUEST_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
