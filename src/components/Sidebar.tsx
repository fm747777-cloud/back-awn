import { NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useSidebarStore } from '../store/useSidebarStore';

export const Sidebar = () => {
    const { collapsed, menuGroups } = useSidebarStore();

    return (
        <aside
            className={`bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between transition-all duration-300 relative select-none ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Header / Logo */}
            <div>
                <div className="h-16 border-b border-slate-100 flex items-center justify-center px-4">
                    {!collapsed ? (
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <span className="text-2xl font-extrabold text-[#126b71] block leading-none">
                                    عـون
                                </span>
                                <span className="text-[10px] font-bold tracking-[0.2em] text-[#126b71] uppercase block">
                                    AWN
                                </span>
                            </div>
                            <div className="w-7 h-7 rounded-lg border-2 border-[#126b71] border-t-transparent flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-[#126b71] rounded-full"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xl font-bold text-[#126b71]">AWN</div>
                    )}
                </div>

                {/* Dynamic Navigation Links */}
                <nav className="p-3 space-y-6">
                    {menuGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            {!collapsed && group.title && (
                                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                                            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                                ? 'bg-[#126b71]/10 text-[#126b71]'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`
                                        }
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon size={18} />
                                        {!collapsed && <span>{item.label}</span>}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer - Account Settings */}
            <div className="p-3 border-t border-slate-100">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                            ? 'bg-[#126b71]/10 text-[#126b71]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                    }
                    title={collapsed ? 'Account Settings' : undefined}
                >
                    <Settings size={18} />
                    {!collapsed && <span>Account Settings</span>}
                </NavLink>
            </div>
        </aside>
    );
};