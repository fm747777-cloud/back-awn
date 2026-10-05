import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ServicesDashboardTab = () => {
    const { t } = useTranslation();

    const activeLabel = t('dashboard.activeLabel');
    const availableServicesData = useMemo(() => [{ name: activeLabel, count: 130 }], [activeLabel]);
    const availableServiceGroupsData = useMemo(() => [{ name: activeLabel, count: 115 }], [activeLabel]);
    const availableServicePackagesData = useMemo(() => [{ name: activeLabel, count: 9 }], [activeLabel]);
    const availableServiceCategoriesData = useMemo(() => [{ name: activeLabel, count: 5 }], [activeLabel]);

    return (
        <div className="space-y-6">
            {/* Unified Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div className="text-start">
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {t('dashboard.description')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Services */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('dashboard.availableServices')}
                        </h2>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {t('common.total', { count: 130 })}
                        </span>
                    </div>
                    <div className="p-6" dir="ltr">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServicesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <YAxis domain={[0, 150]} ticks={[0, 30, 60, 90, 120, 150]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [val, t('dashboard.countLabel')]}
                                        contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#2D3F2C', borderRadius: '8px', color: '#FAF8F5', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#2D3F2C" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Available Service Groups */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('dashboard.availableServiceGroups')}
                        </h2>
                        <span className="text-xs font-mono font-bold text-[#6A7358]">
                            {t('common.total', { count: 115 })}
                        </span>
                    </div>
                    <div className="p-6" dir="ltr">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServiceGroupsData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <YAxis domain={[0, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [val, t('dashboard.countLabel')]}
                                        contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#6A7358', borderRadius: '8px', color: '#FAF8F5', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#6A7358" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Available Service Packages */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('dashboard.availableServicePackages')}
                        </h2>
                        <span className="text-xs font-mono font-bold text-[#8C6046]">
                            {t('common.total', { count: 9 })}
                        </span>
                    </div>
                    <div className="p-6" dir="ltr">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServicePackagesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [val, t('dashboard.countLabel')]}
                                        contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#8C6046', borderRadius: '8px', color: '#FAF8F5', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#8C6046" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Available Service Categories */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">
                            {t('dashboard.availableServiceCategories')}
                        </h2>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">
                            {t('common.total', { count: 5 })}
                        </span>
                    </div>
                    <div className="p-6" dir="ltr">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServiceCategoriesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [val, t('dashboard.countLabel')]}
                                        contentStyle={{ backgroundColor: '#0D0D0D', borderColor: '#BFAB93', borderRadius: '8px', color: '#FAF8F5', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#BFAB93" radius={[4, 4, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
