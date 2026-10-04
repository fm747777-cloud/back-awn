import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface PlaceholderModulePageProps {
    title?: string;
    subtitle?: string;
}

export const PlaceholderModulePage: React.FC<PlaceholderModulePageProps> = ({
    title,
    subtitle,
}) => {
    const location = useLocation();
    const displayTitle = title || location.pathname.replace(/^\//, '').replace(/-/g, ' ').toUpperCase();

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight capitalize">
                        {displayTitle}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {subtitle || `AWN Enterprise Administrative Module (${displayTitle})`}
                    </p>
                </div>
                <Link
                    to="/service/dashboard"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#126b71] text-white text-xs font-semibold hover:bg-[#0f555a] transition"
                >
                    <Layers size={14} />
                    <span>Go to Service Management</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-[#126b71] mb-4">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                    Module Configured & Operational
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                    This administrative section is structured under AWN enterprise governance and linked to user role permissions.
                </p>
            </div>
        </div>
    );
};
