import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, User, Users, Briefcase, X } from 'lucide-react';
import { type DepartmentRecord, type EmployeeRecord, type DesignationRecord } from '../../pages/ums/umsMockData';

interface DepartmentDetailsModalProps {
    department: DepartmentRecord | null;
    employees: EmployeeRecord[];
    designations: DesignationRecord[];
    isRtl: boolean;
    onClose: () => void;
    onEdit: (department: DepartmentRecord) => void;
}

export const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({
    department,
    employees,
    designations,
    isRtl,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();

    if (!department) return null;

    const name = isRtl ? department.nameAr : department.nameEn;
    const desc = isRtl ? department.descriptionAr : department.descriptionEn;

    const headEmployee = employees.find((e) => e.id === department.headEmployeeId);
    const assignedStaff = employees.filter((e) => e.departmentId === department.id);
    const deptDesignations = designations.filter((d) => d.departmentId === department.id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#037F8C] text-white flex items-center justify-center shadow-xs">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[#0D0D0D]">{name}</h2>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]">
                                    {department.code}
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isRtl ? 'إدارة وقسم تنظيمي معتمد' : 'Authorized administrative department'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(department);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                            {isRtl ? 'تعديل القسم' : 'Edit Department'}
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
                    {/* Status, Head & Staff Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'حالة القسم' : 'Status'}
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D0D0D]">
                                <span className={`w-2 h-2 rounded-full ${department.status === 'Active' ? 'bg-[#037F8C]' : 'bg-[#6E6862]'}`} />
                                <span>{department.status}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'مدير القسم' : 'Department Head'}
                            </span>
                            <p className="font-bold text-xs text-[#0D0D0D] truncate">
                                {headEmployee ? (isRtl ? headEmployee.nameAr : headEmployee.nameEn) : (department.headEmployeeName || '—')}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <span className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'الموظفون المعينون' : 'Assigned Workforce'}
                            </span>
                            <p className="font-bold text-xs text-[#037F8C]">{assignedStaff.length} {isRtl ? 'موظف' : 'employee(s)'}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {desc && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {isRtl ? 'نبذة ووصف القسم' : 'Department Description'}
                            </h3>
                            <p className="text-xs text-[#0D0D0D] p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                                {desc}
                            </p>
                        </div>
                    )}

                    {/* Linked Designations */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'المسميات الوظيفية المرتبطة' : 'Linked Designations'}
                        </h3>
                        {deptDesignations.length === 0 ? (
                            <p className="text-xs text-[#857E74] italic">
                                {isRtl ? 'لا توجد مسميات وظيفية مرتبطة بهذا القسم.' : 'No designations linked to this department.'}
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {deptDesignations.map((desig) => (
                                    <span key={desig.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#0D0D0D]">
                                        <Briefcase size={12} className="text-[#037F8C]" />
                                        <span>{isRtl ? desig.titleAr : desig.titleEn}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assigned Staff List */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'قائمة الموظفين في القسم' : 'Assigned Personnel List'}
                        </h3>
                        {assignedStaff.length === 0 ? (
                            <p className="text-xs text-[#857E74] italic">
                                {isRtl ? 'لا يوجد موظفون معينون لهذا القسم حالياً.' : 'No employees currently assigned to this department.'}
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
