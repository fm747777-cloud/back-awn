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
            <header className="h-16 bg-white border-b border-[#E5E0D8] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
                {/* Left: Sidebar Toggle Button + Module Tag */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-[#595550] hover:bg-[#F8F6F2] hover:text-[#0D0D0D] transition cursor-pointer"
                        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>

                    <button
                        onClick={() => setActionItemsModalOpen(true)}
                        className="bg-[#F8F6F2] hover:bg-[#EFECE6] border border-[#E5E0D8] px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-[#2D3F2C] transition cursor-pointer active:scale-98 shadow-2xs"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#2D3F2C]"></span>
                        <span className="tracking-tight">{selectedModule}</span>
                    </button>
                </div>

                {/* Right: Actions & User Profile */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[#595550] hover:text-[#0D0D0D] hover:bg-[#F8F6F2] rounded-lg transition cursor-pointer"
                        title={i18n.language?.startsWith('ar') ? 'Switch to English' : 'التحويل للعربية'}
                    >
                        <Languages size={17} />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                            {i18n.language?.startsWith('ar') ? 'EN' : 'عربي'}
                        </span>
                    </button>

                    <div className="h-5 w-[1px] bg-[#E5E0D8]" />

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-3 hover:bg-[#F8F6F2] p-1.5 rounded-xl transition cursor-pointer"
                        >
                            <span className="text-xs text-[#6E6862] font-medium hidden sm:inline">Welcome</span>
                            <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/30 text-[#FAF8F5] flex items-center justify-center font-bold text-xs shadow-xs">
                                {user?.fullName ? user.fullName.substring(0, 3).toUpperCase() : 'AWN'}
                            </div>
                            <ChevronDown size={14} className="text-[#6E6862]" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E0D8] rounded-xl shadow-lg py-1 z-30 font-sans animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2.5 border-b border-[#F0ECE4]">
                                    <p className="text-xs font-semibold text-[#0D0D0D]">
                                        {user?.fullName || 'Admin User'}
                                    </p>
                                    <p className="text-[10px] text-[#6E6862] capitalize mt-0.5">
                                        {user?.type || 'Super Admin'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setDropdownOpen(false)}
                                    className="w-full text-left px-4 py-2 text-xs text-[#595550] hover:bg-[#F8F6F2] hover:text-[#0D0D0D] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <User size={14} />
                                    <span>My Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-[#8C6046] hover:bg-[#8C6046]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
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