import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, CheckCircle2, XCircle, Users } from 'lucide-react';

interface DepartmentKpiGridProps {
    kpis: {
        total: number;
        active: number;
        inactive: number;
        totalAssignedStaff: number;
    };
    isRtl: boolean;
}

export const DepartmentKpiGrid: React.FC<DepartmentKpiGridProps> = ({ kpis, isRtl }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'إجمالي الأقسام' : 'Total Departments'}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">{kpis.total}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Building2 size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'الإدارات والأقسام المسجلة' : 'Registered administrative units'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الأقسام النشطة' : 'Active Departments'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{kpis.active}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <CheckCircle2 size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'تعمل بكامل طاقتها التنظيمية' : 'Operating normally'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الأقسام المعطلة' : 'Inactive Departments'}
                        </p>
                        <p className="text-2xl font-bold text-[#6E6862] mt-1">{kpis.inactive}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#6E6862]">
                        <XCircle size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'مؤرشفة أو غير مفعلة' : 'Archived or suspended'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'إجمالي الموظفين في الأقسام' : 'Personnel Assigned'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{kpis.totalAssignedStaff}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <Users size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'الموظفون الموزعون على الأقسام' : 'Employees allocated across units'}
                </p>
            </div>
        </div>
    );
};
