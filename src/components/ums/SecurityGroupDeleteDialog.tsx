import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Trash2, X } from 'lucide-react';
import { type SecurityGroupRecord } from '../../pages/ums/umsMockData';

interface SecurityGroupDeleteDialogProps {
    group: SecurityGroupRecord | null;
    employees: any[];
    roles: any[];
    isRtl: boolean;
    onClose: () => void;
    onConfirm: (group: SecurityGroupRecord) => void;
    onDeactivate: (group: SecurityGroupRecord) => void;
}

export const SecurityGroupDeleteDialog: React.FC<SecurityGroupDeleteDialogProps> = ({
    group,
    employees,
    roles,
    isRtl,
    onClose,
    onConfirm,
    onDeactivate,
}) => {
    const { t } = useTranslation();

    if (!group) return null;

    const assignedCount = employees.filter(
        (e) => e.securityGroupId === group.id || e.roleId === group.id
    ).length;
    const linkedRolesCount = roles.filter((r) => r.securityGroupId === group.id).length;
    const canDelete = assignedCount === 0 && linkedRolesCount === 0;

    const name = isRtl ? group.nameAr : group.nameEn;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border border-[#E5E0D8] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-[#0D0D0D]">
                                {isRtl ? 'حذف مجموعة الأمان' : 'Delete Security Group'}
                            </h3>
                            <p className="text-xs font-mono text-[#857E74]">{group.code}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[#857E74] hover:text-[#0D0D0D] p-1 rounded-lg cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                    <p className="text-xs font-semibold text-[#0D0D0D]">
                        {isRtl ? `هل أنت متأكد من حذف مجموعة الأمان: ${name}؟` : `Are you sure you want to delete security group: ${name}?`}
                    </p>
                    {!canDelete && (
                        <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs space-y-1">
                            <p className="font-bold">
                                {isRtl ? 'لا يمكن حذف مجموعة الأمان هذه' : 'Cannot Delete Security Group'}
                            </p>
                            <p className="text-[11px]">
                                {isRtl
                                    ? `مرتبط بها ${assignedCount} موظف و ${linkedRolesCount} دور وظيفي. يرجى إلغاء التعيين أولاً.`
                                    : `Currently referenced by ${assignedCount} employee(s) and ${linkedRolesCount} role(s). Reassign or remove dependencies first.`}
                            </p>
                        </div>
                    )}
                    {canDelete && (
                        <p className="text-[11px] text-[#6E6862]">
                            {isRtl
                                ? 'سيتم إزالة السجل نهائياً وتسجيل العملية في سجل التدقيق.'
                                : 'This action is permanent and will be logged in the UMS audit trail.'}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#45413C] cursor-pointer"
                    >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    {!canDelete ? (
                        <button
                            type="button"
                            onClick={() => onDeactivate(group)}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#223121] text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                            {isRtl ? 'إلغاء التفعيل بدلاً من الحذف' : 'Deactivate Instead'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onConfirm(group)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                            <Trash2 size={14} />
                            <span>{isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
