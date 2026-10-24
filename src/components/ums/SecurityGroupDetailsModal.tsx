import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Users, Lock, X, Check, Minus } from 'lucide-react';
import { type SecurityGroupRecord, type EmployeeRecord } from '../../pages/ums/umsMockData';

interface SecurityGroupDetailsModalProps {
    group: SecurityGroupRecord | null;
    employees: EmployeeRecord[];
    isRtl: boolean;
    onClose: () => void;
    onEdit: (group: SecurityGroupRecord) => void;
}

export const SecurityGroupDetailsModal: React.FC<SecurityGroupDetailsModalProps> = ({
    group,
    employees,
    isRtl,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();

    if (!group) return null;

    const name = isRtl ? group.nameAr : group.nameEn;
    const desc = isRtl ? group.descriptionAr : group.descriptionEn;
    const assignedStaff = employees.filter(
        (e) => e.securityGroupId === group.id || e.roleId === group.id
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shadow-xs">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[#0D0D0D]">{name}</h2>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]">
                                    {group.code}
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isRtl ? 'مجموعة صلاحيات وصول معتمدة' : 'Authorized access control group'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(group);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                            {isRtl ? 'تعديل المجموعة' : 'Edit Group'}
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
                    {/* Status & Members Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'حالة المجموعة' : 'Status'}
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D0D0D]">
                                <span className={`w-2 h-2 rounded-full ${group.status === 'Active' ? 'bg-[#037F8C]' : 'bg-[#6E6862]'}`} />
                                <span>{group.status}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'الأعضاء المشمولون' : 'Assigned Members'}
                            </span>
                            <p className="font-bold text-xs text-[#037F8C]">{assignedStaff.length} {isRtl ? 'موظف' : 'employee(s)'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {desc && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {isRtl ? 'وصف المجموعة والأهداف' : 'Group Description & Scope'}
                            </h3>
                            <p className="text-xs text-[#0D0D0D] p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                {desc}
                            </p>
                        </div>
                    )}

                    {/* Permissions Matrix Overview */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'صلاحيات الوحدات النظامية' : 'Module Permissions Matrix'}
                        </h3>
                        <div className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862]">
                                    <tr>
                                        <th className="p-3 font-semibold text-start">{isRtl ? 'الوحدة' : 'Module'}</th>
                                        <th className="p-3 font-semibold text-center">{isRtl ? 'عرض' : 'Read'}</th>
                                        <th className="p-3 font-semibold text-center">{isRtl ? 'كتابة' : 'Write'}</th>
                                        <th className="p-3 font-semibold text-center">{isRtl ? 'حذف' : 'Delete'}</th>
                                        <th className="p-3 font-semibold text-center">{isRtl ? 'تصدير' : 'Export'}</th>
                                    </tr>
                                </thead>
                                {/* <tbody className="divide-y divide-[#EFECE6]">
                                    {MODULE_KEYS.map((modKey) => {
                                        const modInfo = MODULE_INFO[modKey];
                                        const perms = group.permissions?.[modKey] || { read: false, write: false, delete: false, export: false };
                                        return (
                                            <tr key={modKey}>
                                                <td className="p-3 font-medium text-[#0D0D0D]">
                                                    {isRtl ? modInfo.nameAr : modInfo.nameEn}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perms.read ? <Check size={14} className="mx-auto text-[#037F8C]" /> : <Minus size={14} className="mx-auto text-[#C2BDB5]" />}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perms.write ? <Check size={14} className="mx-auto text-[#037F8C]" /> : <Minus size={14} className="mx-auto text-[#C2BDB5]" />}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perms.delete ? <Check size={14} className="mx-auto text-[#DC2626]" /> : <Minus size={14} className="mx-auto text-[#C2BDB5]" />}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {perms.export ? <Check size={14} className="mx-auto text-[#037F8C]" /> : <Minus size={14} className="mx-auto text-[#C2BDB5]" />}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody> */}
                            </table>
                        </div>
                    </div>

                    {/* Assigned Members */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'الأعضاء المشمولون في المجموعة' : 'Covered Personnel'}
                        </h3>
                        {assignedStaff.length === 0 ? (
                            <p className="text-xs text-[#857E74] italic">
                                {isRtl ? 'لا يوجد موظفون معينون لهذه المجموعة حالياً.' : 'No employees currently assigned to this security group.'}
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
