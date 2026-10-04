import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSidebarStore } from '../store/useSidebarStore';
import {
    LayoutDashboard,
    FileText,
    FileCode,
    FolderTree,
    ListFilter,
    History,
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
        setMenuGroups([
            {
                title: 'Main',
                items: [
                    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
                    { label: 'Documents', path: '/documents', icon: FileText },
                ],
            },
            {
                title: 'Masters',
                items: [
                    { label: 'Document Templates', path: '/templates', icon: FileCode },
                    { label: 'Document Categories', path: '/categories', icon: FolderTree },
                    { label: 'Document Types', path: '/types', icon: ListFilter },
                ],
            },
            {
                title: 'Audit Trail',
                items: [
                    { label: 'Audit Trail', path: '/audit-trail', icon: History },
                ],
            },
        ]);
    }, [setMenuGroups]);

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        AWN Administrative Platform
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Electronic Document Management & Enterprise Service Operations
                    </p>
                </div>
                <Link
                    to="/service/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#126b71] hover:bg-[#0f555a] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                    <Layers size={16} />
                    <span>Go to Service Management</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Available Services</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">130</h3>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle2 size={12} /> Active across portals
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#126b71]/10 text-[#126b71] flex items-center justify-center">
                        <Layers size={20} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Active Portals</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">6</h3>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <Globe size={12} /> Absher, Qiwa, Muqeem...
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#b5925a] flex items-center justify-center">
                        <Globe size={20} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Pending Requests</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">14</h3>
                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                            <Clock size={12} /> In processing
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Document Templates</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">42</h3>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <FileCheck size={12} /> Ready for issuance
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <FileCode size={20} />
                    </div>
                </div>
            </div>

            {/* Quick Access Navigation */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                    Quick Access to Modules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Link
                        to="/service/services"
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition flex items-center gap-3.5 group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#126b71] group-hover:scale-105 transition">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Services Catalog</p>
                            <p className="text-[11px] text-slate-500">View and manage administrative services</p>
                        </div>
                    </Link>

                    <Link
                        to="/service/service-portals"
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition flex items-center gap-3.5 group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#126b71] group-hover:scale-105 transition">
                            <Globe size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Service Portals</p>
                            <p className="text-[11px] text-slate-500">Official government platforms and portals</p>
                        </div>
                    </Link>

                    <Link
                        to="/service/service-categories"
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition flex items-center gap-3.5 group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#126b71] group-hover:scale-105 transition">
                            <FolderTree size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Categories & Types</p>
                            <p className="text-[11px] text-slate-500">Classification taxonomy and tags</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};
