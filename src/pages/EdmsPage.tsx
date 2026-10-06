import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, EDMS_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const EdmsPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(EDMS_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
