import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSidebarStore, DEFAULT_SIDEBAR_GROUPS } from '../store/useSidebarStore';
import {
    FolderTree,
    Layers,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileCheck,
    Globe
} from 'lucide-react';

export const HomePage = () => {
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups(DEFAULT_SIDEBAR_GROUPS);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                        AWN Administrative Platform
                    </h1>
                    <p className="text-xs text-[#6E6862] mt-1 font-normal">
                        Electronic Document Management & Enterprise Service Operations
                    </p>
                </div>
                <Link
                    to="/service/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2D3F2C] hover:bg-[#233222] text-[#FAF8F5] text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                    <Layers size={15} className="text-[#BFAB93]" />
                    <span>Go to Service Management</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#6E6862] font-medium">Available Services</p>
                        <h3 className="text-2xl font-bold font-mono text-[#0D0D0D] mt-1">130</h3>
                        <span className="text-[10px] text-[#2D3F2C] font-semibold flex items-center gap-1 mt-1">
                            <CheckCircle2 size={12} /> Active across portals
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#2D3F2C]/10 text-[#2D3F2C] flex items-center justify-center">
                        <Layers size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#6E6862] font-medium">Active Portals</p>
                        <h3 className="text-2xl font-bold font-mono text-[#0D0D0D] mt-1">6</h3>
                        <span className="text-[10px] text-[#6A7358] font-semibold flex items-center gap-1 mt-1">
                            <Globe size={12} /> Absher, Qiwa, Muqeem...
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#6A7358]/10 text-[#6A7358] flex items-center justify-center">
                        <Globe size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#6E6862] font-medium">Pending Requests</p>
                        <h3 className="text-2xl font-bold font-mono text-[#0D0D0D] mt-1">14</h3>
                        <span className="text-[10px] text-[#8C6046] font-semibold flex items-center gap-1 mt-1">
                            <Clock size={12} /> In processing
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#8C6046]/10 text-[#8C6046] flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[#6E6862] font-medium">Document Templates</p>
                        <h3 className="text-2xl font-bold font-mono text-[#0D0D0D] mt-1">42</h3>
                        <span className="text-[10px] text-[#6E6862] font-medium flex items-center gap-1 mt-1">
                            <FileCheck size={12} /> Ready for issuance
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#BFAB93]/20 text-[#2D3F2C] flex items-center justify-center">
                        <FileCheck size={20} />
                    </div>
                </div>
            </div>

            {/* Quick Access Navigation */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] mb-4">
                    Quick Access to Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Link
                        to="/service/services"
                        className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white transition-all flex items-center gap-3.5 group cursor-pointer shadow-2xs hover:border-[#BFAB93]"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] group-hover:border-[#BFAB93] flex items-center justify-center text-[#2D3F2C] group-hover:scale-105 transition shadow-2xs">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#0D0D0D]">Services Catalog</p>
                            <p className="text-[11px] text-[#6E6862]">View and manage administrative services</p>
                        </div>
                    </Link>

                    <Link
                        to="/service/service-portals"
                        className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white transition-all flex items-center gap-3.5 group cursor-pointer shadow-2xs hover:border-[#BFAB93]"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] group-hover:border-[#BFAB93] flex items-center justify-center text-[#2D3F2C] group-hover:scale-105 transition shadow-2xs">
                            <Globe size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#0D0D0D]">Service Portals</p>
                            <p className="text-[11px] text-[#6E6862]">Official government platforms and portals</p>
                        </div>
                    </Link>

                    <Link
                        to="/service/service-categories"
                        className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white transition-all flex items-center gap-3.5 group cursor-pointer shadow-2xs hover:border-[#BFAB93]"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] group-hover:border-[#BFAB93] flex items-center justify-center text-[#2D3F2C] group-hover:scale-105 transition shadow-2xs">
                            <FolderTree size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#0D0D0D]">Categories & Types</p>
                            <p className="text-[11px] text-[#6E6862]">Classification taxonomy and tags</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};
