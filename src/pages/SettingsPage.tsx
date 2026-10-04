import { useAuthStore } from '../store/useAuthStore';
import { User, Shield, Mail, Bell, Building } from 'lucide-react';

export const SettingsPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs">
                <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">Account Settings</h1>
                <p className="text-xs text-[#6E6862] mt-1 font-normal">
                    Manage your personal profile, security, and administrative preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[#2D3F2C] border-2 border-[#BFAB93]/40 text-[#FAF8F5] flex items-center justify-center font-extrabold text-2xl shadow-xs mb-4">
                        {user?.fullName ? user.fullName.substring(0, 3).toUpperCase() : 'AWN'}
                    </div>
                    <h2 className="text-base font-bold text-[#0D0D0D]">
                        {user?.fullName || 'Karim Wagdi'}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#2D3F2C]/10 text-[#2D3F2C] border border-[#2D3F2C]/20 mt-1 capitalize">
                        {user?.type || 'Super Admin'}
                    </span>
                    <p className="text-xs text-[#857E74] mt-2">
                        AWN Enterprise Administrative Platform
                    </p>
                </div>

                {/* Account Details */}
                <div className="md:col-span-2 bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] border-b border-[#E5E0D8] pb-3">
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#6E6862] flex items-center gap-1.5 font-medium">
                                <User size={13} className="text-[#857E74]" /> Full Name
                            </span>
                            <span className="text-xs font-semibold text-[#0D0D0D] mt-1 block">
                                {user?.fullName || 'Karim Wagdi'}
                            </span>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#6E6862] flex items-center gap-1.5 font-medium">
                                <Mail size={13} className="text-[#857E74]" /> Email ID
                            </span>
                            <span className="text-xs font-semibold text-[#0D0D0D] mt-1 block">
                                karim.wagdi@awn.sa
                            </span>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#6E6862] flex items-center gap-1.5 font-medium">
                                <Shield size={13} className="text-[#857E74]" /> Role & Permissions
                            </span>
                            <span className="text-xs font-semibold text-[#0D0D0D] mt-1 block">
                                Super Administrator
                            </span>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <span className="text-[11px] text-[#6E6862] flex items-center gap-1.5 font-medium">
                                <Building size={13} className="text-[#857E74]" /> Organization
                            </span>
                            <span className="text-xs font-semibold text-[#0D0D0D] mt-1 block">
                                AWN Holding Ltd.
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-[#857E74]" />
                            <span className="text-xs font-medium text-[#0D0D0D]">Notification Alerts</span>
                        </div>
                        <span className="text-xs font-semibold text-[#2D3F2C] bg-[#2D3F2C]/10 px-2.5 py-0.5 rounded-full border border-[#2D3F2C]/20">
                            Enabled
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
