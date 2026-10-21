import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';

export interface ModuleShortcut {
    label: string;
    count: number;
    path: string;
    icon: LucideIcon;
    code: string;
}

interface DashboardModuleGridProps {
    modules: ModuleShortcut[];
    isRtl: boolean;
}

export const DashboardModuleGrid: React.FC<DashboardModuleGridProps> = ({ modules, isRtl }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xl">
            <h2 className="text-sm font-bold text-[#0D0D0D] mb-3.5">
                {isRtl
                    ? 'وحدات إدارة المستخدمين والبيانات الأساسية'
                    : 'UMS Master Modules & Governance'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {modules.map((mod) => {
                    const ModIcon = mod.icon;
                    return (
                        <button
                            key={mod.path}
                            type="button"
                            onClick={() => navigate(mod.path)}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E5E0D8] transition-colors cursor-pointer text-start"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
                                    <ModIcon size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#0D0D0D]">
                                        {mod.label}
                                    </p>
                                    <p
                                        className="text-[10px] font-mono text-[#857E74] mt-0.5"
                                        dir="ltr"
                                    >
                                        {mod.code}
                                    </p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-xs font-bold text-[#037F8C]">
                                {mod.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
