import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useThemeStore, applyThemeToDom } from '../store/useThemeStore';

export const RootLayout = () => {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        applyThemeToDom(theme);
    }, [theme]);

    return (
        <div className="flex min-h-screen bg-[#F8F6F2] dark:bg-[#0F1412] font-sans text-[#0D0D0D] dark:text-[#F3F0EA] overflow-x-hidden transition-colors duration-150">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

