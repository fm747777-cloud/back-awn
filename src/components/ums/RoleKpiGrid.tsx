import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, CheckCircle2, XCircle, Users } from 'lucide-react';

interface RoleKpiGridProps {
    kpis: {
        total: number;
        active: number;
        inactive: number;
        totalAssignedStaff: number;
    };
    isRtl: boolean;
}

export const RoleKpiGrid: React.FC<RoleKpiGridProps> = ({ kpis, isRtl }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'إجمالي الأدوار' : 'Total Roles'}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">{kpis.total}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <UserCheck size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'الأدوار الوظيفية المعرفة' : 'Configured system roles'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الأدوار النشطة' : 'Active Roles'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{kpis.active}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <CheckCircle2 size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'متاحة لتفويض الصلاحيات' : 'Active for delegation'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الأدوار المعطلة' : 'Inactive Roles'}
                        </p>
                        <p className="text-2xl font-bold text-[#6E6862] mt-1">{kpis.inactive}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#6E6862]">
                        <XCircle size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'مؤرشفة أو موقوفة' : 'Archived or suspended'}
                </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الموظفون المفوضون' : 'Assigned Personnel'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{kpis.totalAssignedStaff}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <Users size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'إجمالي الموظفين المرتبطين' : 'Total employees with role'}
                </p>
            </div>
        </div>
    );
};
