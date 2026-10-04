import { NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useSidebarStore } from '../store/useSidebarStore';

export const Sidebar = () => {
    const { collapsed, menuGroups } = useSidebarStore();

    return (
        <aside
            className={`bg-[#0D0D0D] border-r border-[#1C1A17] min-h-screen flex flex-col justify-between transition-all duration-300 relative select-none z-30 ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Header / Brand Logo */}
            <div>
                <div className="h-16 border-b border-[#1C1A17] flex items-center justify-center px-4">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/40 flex items-center justify-center shadow-xs">
                                <span className="text-sm font-black text-[#BFAB93]">ع</span>
                            </div>
                            <div className="text-left">
                                <span className="text-base font-bold text-[#FAF8F5] block leading-tight tracking-wide">
                                    عَـــــوْن
                                </span>
                                <span className="text-[9px] font-semibold tracking-[0.25em] text-[#BFAB93] uppercase block">
                                    AWN ENTERPRISE
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/50 flex items-center justify-center">
                            <span className="text-xs font-black text-[#BFAB93]">ع</span>
                        </div>
                    )}
                </div>

                {/* Navigation Groups */}
                <nav className="p-3 space-y-6">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            {!collapsed && group.title && (
                                <p className="px-3 py-1 text-[10px] font-semibold text-[#6E6862] uppercase tracking-[0.16em]">
                                    {group.title}
                                </p>
                            )}
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                                isActive
                                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] font-semibold shadow-xs'
                                                    : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                                            }`
                                        }
                                        title={collapsed ? item.label : undefined}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Left Accent indicator for active item */}
                                                {isActive && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#BFAB93]" />
                                                )}
                                                <Icon
                                                    size={17}
                                                    className={`transition-colors shrink-0 ${
                                                        isActive
                                                            ? 'text-[#BFAB93]'
                                                            : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                                    }`}
                                                />
                                                {!collapsed && (
                                                    <span className="truncate">{item.label}</span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer - Account Settings */}
            <div className="p-3 border-t border-[#1C1A17]">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isActive
                                ? 'bg-[#2D3F2C] text-[#FAF8F5] font-semibold shadow-xs'
                                : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                        }`
                    }
                    title={collapsed ? 'Account Settings' : undefined}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#BFAB93]" />
                            )}
                            <Settings
                                size={17}
                                className={`transition-colors shrink-0 ${
                                    isActive
                                        ? 'text-[#BFAB93]'
                                        : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                }`}
                            />
                            {!collapsed && <span>Account Settings</span>}
                        </>
                    )}
                </NavLink>
            </div>
        </aside>
    );
};