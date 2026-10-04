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
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight capitalize">
                        {displayTitle}
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        {subtitle || `AWN Enterprise Administrative Module (${displayTitle})`}
                    </p>
                </div>
                <Link
                    to="/service/dashboard"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233222] transition shadow-xs"
                >
                    <Layers size={14} className="text-[#BFAB93]" />
                    <span>Go to Service Management</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-12 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center mx-auto text-[#2D3F2C] mb-4 shadow-2xs">
                    <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-[#0D0D0D]">
                    Module Configured & Operational
                </h3>
                <p className="text-xs text-[#6E6862] max-w-md mx-auto mt-2">
                    This administrative section is structured under AWN enterprise governance and linked to user role permissions.
                </p>
            </div>
        </div>
    );
};
