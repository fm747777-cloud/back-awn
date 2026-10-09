import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore, ASSET_MANAGEMENT_SIDEBAR_GROUPS } from '../store/useSidebarStore';

export const AssetManagementPage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(ASSET_MANAGEMENT_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    );
};
