import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, LogOut, User, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useSidebarStore } from '../store/useSidebarStore';
import { useThemeStore } from '../store/useThemeStore';
import { ActionItemsModal, type ModuleOption } from './ActionItemsModal';

export const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [actionItemsModalOpen, setActionItemsModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { user, logout } = useAuthStore();
    const { collapsed, toggleSidebar } = useSidebarStore();
    const { theme, toggleTheme } = useThemeStore();

    const isAr = i18n.language?.startsWith('ar');
    const isDark = theme === 'dark';

    // Derive active module key directly from location.pathname
    const selectedModuleKey = (() => {
        if (location.pathname.startsWith('/ticketing')) return 'ticketing';
        if (location.pathname.startsWith('/service')) return 'service';
        if (location.pathname.startsWith('/ums')) return 'ums';
        if (location.pathname.startsWith('/crm')) return 'crm';
        if (location.pathname.startsWith('/edms')) return 'edms';
        if (location.pathname.startsWith('/request')) return 'request';
        if (location.pathname.startsWith('/workflow')) return 'workflow';
        if (location.pathname.startsWith('/customer')) return 'customer';
        if (location.pathname.startsWith('/asset')) return 'asset';
        return 'edms';
    })();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const handleSelectModule = (item: ModuleOption) => {
        setActionItemsModalOpen(false);
        navigate(item.path);
    };

    const setLanguage = (lang: 'en' | 'ar') => {
        if ((lang === 'ar' && !isAr) || (lang === 'en' && isAr)) {
            i18n.changeLanguage(lang);
        }
    };

    const selectedModuleLabel =
        selectedModuleKey === 'edms'
            ? t('nav.edmsModule')
            : t(`nav.modules.${selectedModuleKey}`, { defaultValue: selectedModuleKey.toUpperCase() });

    return (
        <>
            <header className="h-16 bg-white dark:bg-[#161D1A] border-b border-[#E5E0D8] dark:border-[#2A3630] px-3 sm:px-6 gap-2 flex items-center justify-between sticky top-0 z-20 select-none min-w-0 transition-colors duration-150">
                {/* Start: Sidebar Toggle Button + Module Tag */}
                <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-[#595550] hover:bg-[#F8F6F2] hover:text-[#0D0D0D] transition cursor-pointer shrink-0"
                        title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
                        aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
                    >
                        {collapsed ? (
                            <PanelLeft size={18} className="rtl:rotate-180" />
                        ) : (
                            <PanelLeftClose size={18} className="rtl:rotate-180" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActionItemsModalOpen(true)}
                        className="bg-[#F8F6F2] hover:bg-[#EFECE6] border border-[#E5E0D8] px-2.5 sm:px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium text-[#2D3F2C] transition cursor-pointer active:scale-98 shadow-2xs min-w-0 max-w-full"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#2D3F2C] dark:bg-[#84C799] shrink-0"></span>
                        <span className="tracking-tight truncate">
                            {selectedModuleLabel}
                        </span>
                    </button>
                </div>

                {/* End: Theme Switcher, Enterprise Language Switcher & User Profile */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <button
                        type="button"
                        data-testid="theme-toggle"
                        onClick={toggleTheme}
                        aria-pressed={isDark}
                        aria-label={
                            isDark
                                ? t('nav.switchToLightMode', { defaultValue: 'Switch to Light Mode' })
                                : t('nav.switchToDarkMode', { defaultValue: 'Switch to Dark Mode' })
                        }
                        title={
                            isDark
                                ? t('nav.switchToLightMode', { defaultValue: 'Switch to Light Mode' })
                                : t('nav.switchToDarkMode', { defaultValue: 'Switch to Dark Mode' })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#595550] hover:text-[#0D0D0D] hover:bg-[#F0ECE4] transition-colors cursor-pointer shadow-2xs"
                    >
                        {isDark ? (
                            <>
                                <Sun size={14} className="text-[#E2B478] shrink-0" />
                                <span className="hidden md:inline text-[11px]">
                                    {t('nav.lightMode', { defaultValue: 'Light' })}
                                </span>
                            </>
                        ) : (
                            <>
                                <Moon size={14} className="text-[#2D3F2C] shrink-0" />
                                <span className="hidden md:inline text-[11px]">
                                    {t('nav.darkMode', { defaultValue: 'Dark' })}
                                </span>
                            </>
                        )}
                    </button>

                    <div
                        dir="ltr"
                        role="group"
                        aria-label={isAr ? t('nav.switchLanguageToEn') : t('nav.switchLanguageToAr')}
                        className="inline-flex items-center bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg p-0.5 shadow-2xs"
                    >
                        <span className="ps-2 pe-1 text-[#857E74] flex items-center pointer-events-none">
                            <Globe size={13} />
                        </span>
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            title={t('nav.switchLanguageToEn')}
                            aria-pressed={!isAr}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer leading-none ${
                                !isAr
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-2xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('ar')}
                            title={t('nav.switchLanguageToAr')}
                            aria-pressed={isAr}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                                isAr
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-2xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D]'
                            }`}
                        >
                            عربي
                        </button>
                    </div>

                    <div className="h-5 w-[1px] bg-[#E5E0D8] dark:bg-[#2A3630]" />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            data-testid="user-menu-trigger"
                            aria-expanded={dropdownOpen}
                            aria-label={t('common.myProfile')}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2.5 hover:bg-[#F8F6F2] p-1.5 rounded-xl transition cursor-pointer"
                        >
                            <span className="text-xs text-[#6E6862] font-medium hidden sm:inline">
                                {t('common.welcome')}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/30 text-[#FAF8F5] flex items-center justify-center font-bold text-xs shadow-xs">
                                {user?.fullName ? user.fullName.substring(0, 3).toUpperCase() : 'AWN'}
                            </div>
                            <ChevronDown size={14} className="text-[#6E6862]" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute end-0 mt-2 w-48 bg-white border border-[#E5E0D8] rounded-xl shadow-lg py-1 z-30 font-sans animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2.5 border-b border-[#F0ECE4] text-start">
                                    <p className="text-xs font-semibold text-[#0D0D0D]">
                                        {user?.fullName || t('common.adminUser')}
                                    </p>
                                    <p className="text-[10px] text-[#6E6862] capitalize mt-0.5">
                                        {user?.type === 'admin' || user?.type === 'Administrator' || user?.type === 'System Admin'
                                            ? t('common.systemAdmin')
                                            : user?.type === 'Admin User'
                                            ? t('common.adminUser')
                                            : user?.type === 'Super Admin' || !user?.type
                                            ? t('common.superAdmin')
                                            : user.type}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        navigate('/settings');
                                    }}
                                    className="w-full text-start px-4 py-2 text-xs text-[#595550] hover:bg-[#F8F6F2] hover:text-[#0D0D0D] flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                    <User size={14} className="shrink-0" />
                                    <span>{t('common.myProfile')}</span>
                                </button>

                                <button
                                    type="button"
                                    data-testid="navbar-logout-button"
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        logout();
                                        navigate('/login', { replace: true });
                                    }}
                                    className="w-full text-start px-4 py-2 text-xs text-[#8C6046] hover:bg-[#8C6046]/10 flex items-center gap-2 font-medium cursor-pointer transition-colors"
                                >
                                    <LogOut size={14} className="shrink-0 rtl:rotate-180" />
                                    <span>{t('common.logout')}</span>
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

