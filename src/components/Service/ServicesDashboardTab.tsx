import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ServicesDashboardTab = () => {
    const availableServicesData = [{ name: 'Active', count: 130 }];
    const availableServiceGroupsData = [{ name: 'Active', count: 115 }];
    const availableServicePackagesData = [{ name: 'Active', count: 9 }];
    const availableServiceCategoriesData = [{ name: 'Active', count: 5 }];

    return (
        <div className="space-y-6">
            {/* Unified Page Header System */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">Dashboard</h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        Enterprise service operations, portal distribution, and performance metrics.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Services */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-2xs overflow-hidden">
                    <div className="bg-[#FAF8F5] border-b border-[#E5E0D8] px-6 py-3.5 flex items-center justify-between">
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">Available Services</h2>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">130 Total</span>
                    </div>
                    <div className="p-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServicesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis domain={[0, 150]} ticks={[0, 30, 60, 90, 120, 150]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
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
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">Available Service Groups</h2>
                        <span className="text-xs font-mono font-bold text-[#6A7358]">115 Total</span>
                    </div>
                    <div className="p-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServiceGroupsData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis domain={[0, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
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
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">Available Service Packages</h2>
                        <span className="text-xs font-mono font-bold text-[#8C6046]">9 Total</span>
                    </div>
                    <div className="p-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServicePackagesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
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
                        <h2 className="text-xs font-semibold text-[#0D0D0D] tracking-wide uppercase">Available Service Categories</h2>
                        <span className="text-xs font-mono font-bold text-[#2D3F2C]">5 Total</span>
                    </div>
                    <div className="p-6">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={availableServiceCategoriesData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE6" />
                                    <XAxis dataKey="name" tick={{ fill: '#6E6862', fontSize: 12 }} angle={-45} textAnchor="end" />
                                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: '#6E6862', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
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