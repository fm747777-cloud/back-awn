import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, ShieldCheck, Bell, Building2, UserCheck, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const { theme, setTheme } = useThemeStore();

    return (
        <div className="space-y-6 text-start">
            {/* Header Banner */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#0D0D0D]">{t('settings.title')}</h1>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('settings.subtitle')}
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EAF3EC] text-[#265938] border border-[#C5DFCC]">
                    {t('settings.platformLabel')}
                </span>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFECE6]">
                        <UserCheck className="w-4 h-4 text-[#2D3F2C]" />
                        <h2 className="text-sm font-bold text-[#0D0D0D]">{t('settings.accountInfo')}</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="block text-xs text-[#6E6862] mb-1">{t('settings.fullName')}</label>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] font-medium text-[#0D0D0D]">
                                {user?.fullName || t('common.adminUser')}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#6E6862] mb-1">{t('settings.emailId')}</label>
                            <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] font-medium text-[#0D0D0D]" dir="ltr">
                                {user?.id || 'admin@awn.sa'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#EFECE6]">
                        <ShieldCheck className="w-4 h-4 text-[#2D3F2C]" />
                        <h2 className="text-sm font-bold text-[#0D0D0D]">{t('settings.rolePermissions')}</h2>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                <Building2 className="w-4 h-4 text-[#6A7358]" />
                                <span className="text-xs font-medium text-[#45413C]">{t('settings.organization')}</span>
                            </div>
                            <span className="text-xs font-semibold text-[#0D0D0D]">{t('settings.organizationName')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                <Bell className="w-4 h-4 text-[#6A7358]" />
                                <span className="text-xs font-medium text-[#45413C]">{t('settings.notificationAlerts')}</span>
                            </div>
                            <span className="text-xs font-semibold text-[#265938]">{t('settings.enabled')}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                            <div className="flex items-center gap-2.5">
                                {theme === 'dark' ? (
                                    <Moon className="w-4 h-4 text-[#6A7358]" />
                                ) : (
                                    <Sun className="w-4 h-4 text-[#6A7358]" />
                                )}
                                <span className="text-xs font-medium text-[#45413C]">
                                    {t('settings.themePreference', { defaultValue: 'Appearance Theme' })}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-white border border-[#E5E0D8]">
                                <button
                                    type="button"
                                    data-testid="settings-theme-light"
                                    aria-pressed={theme === 'light'}
                                    onClick={() => setTheme('light')}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                        theme === 'light'
                                            ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    <Sun size={12} />
                                    <span>{t('nav.lightMode', { defaultValue: 'Light' })}</span>
                                </button>
                                <button
                                    type="button"
                                    data-testid="settings-theme-dark"
                                    aria-pressed={theme === 'dark'}
                                    onClick={() => setTheme('dark')}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                        theme === 'dark'
                                            ? 'bg-[#2D3F2C] text-[#FAF8F5]'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    <Moon size={12} />
                                    <span>{t('nav.darkMode', { defaultValue: 'Dark' })}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

