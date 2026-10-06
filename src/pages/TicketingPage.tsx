import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, TICKETING_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const TicketingPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(TICKETING_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
