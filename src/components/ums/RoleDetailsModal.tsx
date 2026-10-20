import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, ShieldCheck, Users, X, Layers } from 'lucide-react';
import { type RoleRecord, type SecurityGroupRecord, type EmployeeRecord } from '../../pages/ums/umsMockData';

interface RoleDetailsModalProps {
    role: RoleRecord | null;
    securityGroups: SecurityGroupRecord[];
    employees: EmployeeRecord[];
    isRtl: boolean;
    onClose: () => void;
    onEdit: (role: RoleRecord) => void;
}

export const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({
    role,
    securityGroups,
    employees,
    isRtl,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();

    if (!role) return null;

    const name = isRtl ? role.nameAr : role.nameEn;
    const desc = isRtl ? role.descriptionAr : role.descriptionEn;
    const secGroup = securityGroups.find((g) => g.id === role.securityGroupId);
    const assignedStaff = employees.filter((e) => e.roleId === role.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shadow-xs">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[#0D0D0D]">{name}</h2>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]">
                                    {role.code}
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isRtl ? secGroup?.nameAr || 'مجموعة أمان عامة' : secGroup?.nameEn || 'General Security Group'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(role);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                            {isRtl ? 'تعديل الدور' : 'Edit Role'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-[#857E74] hover:text-[#0D0D0D] cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status, Level & Staff Summary */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'حالة الدور' : 'Status'}
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D0D0D]">
                                <span className={`w-2 h-2 rounded-full ${role.status === 'Active' ? 'bg-[#037F8C]' : 'bg-[#6E6862]'}`} />
                                <span>{role.status}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'مستوى الصلاحية' : 'Auth Level'}
                            </span>
                            <p className="font-bold text-xs font-mono text-[#037F8C]">Level {role.level}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'الموظفون المفوضون' : 'Assigned Staff'}
                            </span>
                            <p className="font-bold text-xs text-[#037F8C]">{assignedStaff.length} {isRtl ? 'موظف' : 'employee(s)'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {desc && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {isRtl ? 'وصف الدور والمسؤوليات' : 'Role Description & Responsibilities'}
                            </h3>
                            <p className="text-xs text-[#0D0D0D] p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                {desc}
                            </p>
                        </div>
                    )}

                    {/* Security Group Link */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'مجموعة الأمان المرتبطة' : 'Linked Security Group'}
                        </h3>
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck size={16} className="text-[#037F8C]" />
                                <span className="font-bold text-[#0D0D0D]">
                                    {isRtl ? secGroup?.nameAr || role.securityGroupName : secGroup?.nameEn || role.securityGroupName}
                                </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#857E74]" dir="ltr">
                                {secGroup?.code}
                            </span>
                        </div>
                    </div>

                    {/* Assigned Staff List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'الموظفون المفوضون بهذا الدور' : 'Personnel Assigned to Role'}
                        </h3>
                        {assignedStaff.length === 0 ? (
                            <p className="text-xs text-[#857E74] italic">
                                {isRtl ? 'لا يوجد موظفون معينون لهذا الدور حالياً.' : 'No employees currently assigned to this role.'}
                            </p>
                        ) : (
                            <div className="divide-y divide-[#EFECE6] border border-[#E5E0D8] rounded-xl overflow-hidden bg-white">
                                {assignedStaff.map((emp) => {
                                    const empName = isRtl ? emp.nameAr || emp.nameEn : emp.nameEn;
                                    return (
                                        <div key={emp.id} className="p-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center font-bold text-[#037F8C]">
                                                    {empName.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0D0D0D]">{empName}</p>
                                                    <p className="text-[11px] font-mono text-[#857E74]" dir="ltr">{emp.code}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-medium text-[#037F8C]">
                                                {emp.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
