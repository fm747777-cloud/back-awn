import { useAuthStore } from '../store/useAuthStore';
import { User, Shield, Mail, Bell, Building } from 'lucide-react';

export const SettingsPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Account Settings</h1>
                <p className="text-xs text-slate-500 mt-1">
                    Manage your personal profile, security, and administrative preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#126b71] text-white flex items-center justify-center font-extrabold text-2xl shadow-sm mb-4">
                        {user?.fullName ? user.fullName.substring(0, 3).toUpperCase() : 'AWN'}
                    </div>
                    <h2 className="text-base font-bold text-slate-800">
                        {user?.fullName || 'Karim Wagdi'}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1 capitalize">
                        {user?.type || 'Admin'}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                        AWN Enterprise Administrative Platform
                    </p>
                </div>

                {/* Account Details */}
                <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block flex items-center gap-1.5 font-medium">
                                <User size={13} /> Full Name
                            </span>
                            <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                {user?.fullName || 'Karim Wagdi'}
                            </span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block flex items-center gap-1.5 font-medium">
                                <Mail size={13} /> Email ID
                            </span>
                            <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                karim.wagdi@awn.sa
                            </span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block flex items-center gap-1.5 font-medium">
                                <Shield size={13} /> Role & Permissions
                            </span>
                            <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                Super Administrator
                            </span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block flex items-center gap-1.5 font-medium">
                                <Building size={13} /> Organization
                            </span>
                            <span className="text-xs font-semibold text-slate-800 mt-1 block">
                                AWN Holding Ltd.
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-700">Notification Alerts</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Enabled
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
