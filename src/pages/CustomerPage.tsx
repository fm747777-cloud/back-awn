import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, CUSTOMER_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const CustomerPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(CUSTOMER_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
