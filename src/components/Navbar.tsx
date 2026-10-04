import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, LogOut, User, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSidebarStore } from '../store/useSidebarStore';
import { ActionItemsModal, type ModuleOption } from './ActionItemsModal';

export const Navbar = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [actionItemsModalOpen, setActionItemsModalOpen] = useState(false);

    const [selectedModule, setSelectedModule] = useState('Electronic Document Management System');

    const { user, logout } = useAuthStore();
    const { collapsed, toggleSidebar } = useSidebarStore();

    const handleSelectModule = (item: ModuleOption) => {
        setSelectedModule(item.label);
        setActionItemsModalOpen(false);
        navigate(item.path);
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language?.startsWith('ar') ? 'en' : 'ar';
        i18n.changeLanguage(nextLang);
    };

    return (
        <>
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
                {/* Left: Sidebar Toggle Button + Module Tag */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>

                    <button
                        onClick={() => setActionItemsModalOpen(true)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer active:scale-98"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#126b71]"></span>
                        <span>{selectedModule}</span>
                    </button>
                </div>

                {/* Right: Actions & User Profile */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title={i18n.language?.startsWith('ar') ? 'Switch to English' : 'التحويل للعربية'}
                    >
                        <Languages size={18} />
                        <span className="text-xs font-semibold uppercase">
                            {i18n.language?.startsWith('ar') ? 'EN' : 'عربي'}
                        </span>
                    </button>

                    <div className="h-5 w-[1px] bg-slate-200" />

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition cursor-pointer"
                        >
                            <span className="text-xs text-slate-500 font-medium">Welcome</span>
                            <div className="w-9 h-9 rounded-xl bg-[#126b71] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                {user?.fullName ? user.fullName.substring(0, 3).toUpperCase() : 'AWN'}
                            </div>
                            <ChevronDown size={14} className="text-slate-500" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 font-sans">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-800">
                                        {user?.fullName || 'Admin User'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 capitalize">
                                        {user?.type || 'Admin'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setDropdownOpen(false)}
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                    <User size={14} />
                                    <span>My Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                                >
                                    <LogOut size={14} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Render Modal Component */}
            <ActionItemsModal
                isOpen={actionItemsModalOpen}
                onClose={() => setActionItemsModalOpen(false)}
                onSelectModule={handleSelectModule}
            />
        </>
    );
};