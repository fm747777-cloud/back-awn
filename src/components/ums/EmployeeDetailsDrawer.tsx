import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
} from 'lucide-react';
import {
    computeIqamaStatus,
    computeEmployeeInvitationStatus,
    computeEmployeeProfileCompletion,
    formatSarCurrency,
} from '../../pages/ums/umsModelHelpers';
import {
    type EmployeeRecord,
    type DepartmentRecord,
    type DesignationRecord,
    type BranchRecord,
    type RoleRecord,
    type SecurityGroupRecord,
    type CustomAddonRecord,
} from '../../pages/ums/umsMockData';

interface EmployeeDetailsDrawerProps {
    employee: EmployeeRecord | null;
    isRtl: boolean;
    departmentMap: Map<string, DepartmentRecord>;
    designationMap: Map<string, DesignationRecord>;
    branchMap: Map<string, BranchRecord>;
    roleMap: Map<string, RoleRecord>;
    securityGroupMap: Map<string, SecurityGroupRecord>;
    customAddonMap: Map<string, CustomAddonRecord>;
    onClose: () => void;
    onEdit: (employee: EmployeeRecord) => void;
}

export const EmployeeDetailsDrawer: React.FC<EmployeeDetailsDrawerProps> = ({
    employee,
    isRtl,
    departmentMap,
    designationMap,
    branchMap,
    roleMap,
    securityGroupMap,
    customAddonMap,
    onClose,
    onEdit,
}) => {
    const { t } = useTranslation();

    if (!employee) return null;

    const fullNameEn = `${employee.firstNameEn || ''} ${employee.secondNameEn || ''} ${employee.thirdNameEn || ''} ${employee.lastNameEn || ''}`.replace(/\s+/g, ' ').trim();
    const fullNameAr = `${employee.firstNameAr || ''} ${employee.secondNameAr || ''} ${employee.thirdNameAr || ''} ${employee.lastNameAr || ''}`.replace(/\s+/g, ' ').trim();
    const displayName = isRtl ? fullNameAr || employee.code : fullNameEn || employee.code;

    const dept = departmentMap.get(employee.departmentId);
    const desig = designationMap.get(employee.designationId);
    const branch = branchMap.get(employee.branchId);
    const role = roleMap.get(employee.roleId);
    const secGroup = securityGroupMap.get(employee.securityGroupId || '');
    const completion = computeEmployeeProfileCompletion(employee);
    const iqamaStatus = computeIqamaStatus(employee.iqamaExpiryDate);

    const salary = employee.salaryDetails;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E0D8] flex items-center justify-between bg-[#FAF8F5]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#037F8C] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                            {employee.avatarUrl ? (
                                <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                displayName.slice(0, 2).toUpperCase()
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-[#0D0D0D]">{displayName}</h2>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-mono font-bold text-[#037F8C]">
                                    {employee.code}
                                </span>
                            </div>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {isRtl ? desig?.titleAr || employee.jobTitleName : desig?.titleEn || employee.jobTitleName} · {isRtl ? dept?.nameAr || 'قسم غير محدد' : dept?.nameEn || 'Unassigned'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEdit(employee);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                            {isRtl ? 'تعديل الملف' : 'Edit Profile'}
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

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status & Compliance Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <p className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'حالة الموظف' : 'Employee Status'}
                            </p>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#0D0D0D]">
                                <span className={`w-2 h-2 rounded-full ${employee.status === 'Active' ? 'bg-[#037F8C]' : 'bg-[#6E6862]'}`} />
                                <span>{employee.status}</span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <p className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'اكتمال الملف الشخصي' : 'Profile Completion'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#0D0D0D]">{completion.percentage}%</span>
                                <div className="flex-1 h-1.5 bg-[#E5E0D8] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#037F8C]" style={{ width: `${completion.percentage}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                            <p className="text-[11px] font-medium text-[#857E74]">
                                {isRtl ? 'حالة الإقامة / الهوية' : 'Iqama / ID Health'}
                            </p>
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${iqamaStatus.tone === 'danger' ? 'bg-[#FEE2E2] text-[#DC2626]' : iqamaStatus.tone === 'warning' ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#EAF3EC] text-[#037F8C]'}`}>
                                {iqamaStatus.label}
                            </span>
                        </div>
                    </div>

                    {/* Personal & Contact Details */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'البيانات الشخصية والاتصال' : 'Personal & Contact Information'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'البريد الإلكتروني للعمل' : 'Work Email'}</span>
                                <p className="font-medium text-[#0D0D0D]" dir="ltr">{employee.workEmail || employee.email || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'رقم الهاتف المحمول' : 'Mobile Phone'}</span>
                                <p className="font-medium text-[#0D0D0D]" dir="ltr">{employee.phone || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'الجنسية / الدولة' : 'Nationality & Citizenship'}</span>
                                <p className="font-medium text-[#0D0D0D]">{employee.nationality || '—'} ({employee.citizenship})</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'تاريخ الميلاد' : 'Date of Birth'}</span>
                                <p className="font-medium text-[#0D0D0D]">{employee.dobGregorian || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Employment & Organization */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'بيانات العمل والهيكل التنظيمي' : 'Employment & Organization'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'القسم / الإدارة' : 'Department'}</span>
                                <p className="font-medium text-[#0D0D0D]">{isRtl ? dept?.nameAr || '—' : dept?.nameEn || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'المسمى الوظيفي' : 'Designation'}</span>
                                <p className="font-medium text-[#0D0D0D]">{isRtl ? desig?.titleAr || employee.jobTitleName : desig?.titleEn || employee.jobTitleName}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'الفرع / الموقع' : 'Branch / Location'}</span>
                                <p className="font-medium text-[#0D0D0D]">{isRtl ? branch?.nameAr || '—' : branch?.nameEn || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'نوع العقد' : 'Contract Type'}</span>
                                <p className="font-medium text-[#0D0D0D]">{employee.contractType} ({employee.employmentType})</p>
                            </div>
                        </div>
                    </div>

                    {/* Role & Security Group */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                            {isRtl ? 'الصلاحيات ومجموعات الأمان' : 'Roles & Security Groups'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'الدور الوظيفي' : 'Assigned Role'}</span>
                                <p className="font-medium text-[#0D0D0D]">{isRtl ? role?.nameAr || '—' : role?.nameEn || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-[#E5E0D8] space-y-1">
                                <span className="text-[#857E74]">{isRtl ? 'مجموعة الأمان' : 'Security Group'}</span>
                                <p className="font-medium text-[#0D0D0D]">{isRtl ? secGroup?.nameAr || '—' : secGroup?.nameEn || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Salary Summary */}
                    {salary && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#857E74]">
                                {isRtl ? 'هيكل الأجور والرواتب' : 'Salary & Compensation Structure'}
                            </h3>
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] grid grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-[#857E74]">{isRtl ? 'الراتب الأساسي' : 'Basic Salary'}</span>
                                    <p className="font-bold text-[#0D0D0D] mt-0.5">{formatSarCurrency(salary.basicSalary, isRtl)}</p>
                                </div>
                                <div>
                                    <span className="text-[#857E74]">{isRtl ? 'بدل السكن' : 'Housing Allowance'}</span>
                                    <p className="font-bold text-[#0D0D0D] mt-0.5">{formatSarCurrency(salary.housingAllowance, isRtl)}</p>
                                </div>
                                <div>
                                    <span className="text-[#857E74]">{isRtl ? 'إجمالي الراتب' : 'Gross Monthly'}</span>
                                    <p className="font-bold text-[#037F8C] mt-0.5">
                                        {formatSarCurrency(salary.basicSalary + salary.housingAllowance + salary.transportationAllowance + salary.otherAllowances, isRtl)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
