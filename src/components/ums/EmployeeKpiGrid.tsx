import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    UserCheck,
    UserX,
    FileEdit,
    CheckCircle2,
    Clock,
    AlertTriangle,
    MailWarning,
} from 'lucide-react';
import { type EmployeeDirectoryKpis } from '../../pages/ums/umsMockData';

interface EmployeeKpiGridProps {
    kpis: EmployeeDirectoryKpis;
    saudiCount: number;
    iqamaAlertsCount: number;
    isRtl: boolean;
}

export const EmployeeKpiGrid: React.FC<EmployeeKpiGridProps> = ({
    kpis,
    saudiCount,
    iqamaAlertsCount,
    isRtl,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Workforce */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'إجمالي الموظفين' : 'Total Directory'}
                        </p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">{kpis.totalEmployees}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C]">
                        <Users size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'جميع السجلات المسجلة' : 'All registered personnel'}
                </p>
            </div>

            {/* Active Employees */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الموظفين النشطين' : 'Active Employees'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{kpis.activeEmployees}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <UserCheck size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'يعملون حالياً بنجاح' : 'Currently active in system'}
                </p>
            </div>

            {/* Inactive Employees */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الموظفين غير النشطين' : 'Inactive Employees'}
                        </p>
                        <p className="text-2xl font-bold text-[#6E6862] mt-1">{kpis.inactiveEmployees}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#6E6862]">
                        <UserX size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'حسابات موقوفة أو مغادرة' : 'Suspended or terminated'}
                </p>
            </div>

            {/* Draft Employees */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'حسابات مسودة' : 'Draft Profiles'}
                        </p>
                        <p className="text-2xl font-bold text-[#B45309] mt-1">{kpis.draftEmployees}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                        <FileEdit size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'بانتظار اكتمال البيانات' : 'Pending profile finalization'}
                </p>
            </div>

            {/* Saudi Nationals */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'المواطنون السعوديون' : 'Saudi Nationals'}
                        </p>
                        <p className="text-2xl font-bold text-[#037F8C] mt-1">{saudiCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#EAF3EC] border border-[#037F8C]/20 flex items-center justify-center text-[#037F8C]">
                        <CheckCircle2 size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'حسابات تدعم نسبة السعودة' : 'Contributing to Saudization'}
                </p>
            </div>

            {/* Under Probation */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'تحت فترة التجربة' : 'Under Probation'}
                        </p>
                        <p className="text-2xl font-bold text-[#B45309] mt-1">{kpis.underProbation}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
                        <Clock size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'فترة تقييم الأداء 90 يوماً' : '90-day evaluation window'}
                </p>
            </div>

            {/* Iqama / ID Alerts */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'تنبيهات الإقامة / الهوية' : 'Iqama / ID Alerts'}
                        </p>
                        <p className="text-2xl font-bold text-[#DC2626] mt-1">{iqamaAlertsCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                        <AlertTriangle size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'تنتهي قريباً أو منتهية الصلاحية' : 'Expiring soon or expired'}
                </p>
            </div>

            {/* Pending Invitations */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">
                            {isRtl ? 'الدعوات المعلقة' : 'Pending Invitations'}
                        </p>
                        <p className="text-2xl font-bold text-[#D97706] mt-1">{kpis.pendingInvitations}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                        <MailWarning size={18} />
                    </div>
                </div>
                <p className="text-[11px] text-[#857E74] mt-2">
                    {isRtl ? 'لم يتم قبول دعوة النظام بعد' : 'System invite not yet accepted'}
                </p>
            </div>
        </div>
    );
};
