import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, WORKFLOW_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const WorkflowPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(WORKFLOW_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
