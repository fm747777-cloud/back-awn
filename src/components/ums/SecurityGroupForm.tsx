import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X,
    Users,
    FileText,
    Globe,
    GitFork,
    ClipboardCheck,
    Box,
    LifeBuoy,
    CheckSquare,
    Square,
    Lock,
    Mail,
    Plus,
    Trash2,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';
import {
    type SecurityGroupPermissions,
    type ModulePermission,
    type EmployeeRecord,
} from '../../pages/ums/umsMockData';

export const MODULE_KEYS: (keyof SecurityGroupPermissions)[] = [
    'ums',
    'edms',
    'service',
    'workflow',
    'request',
    'asset',
    'ticketing',
];

export interface ModuleMetadata {
    nameEn: string;
    nameAr: string;
    descEn: string;
    descAr: string;
    icon: LucideIcon;
}

export const MODULE_INFO: Record<keyof SecurityGroupPermissions, ModuleMetadata> = {
    ums: {
        nameEn: 'User Management (UMS)',
        nameAr: 'إدارة المستخدمين والصلاحيات',
        descEn: 'Employees, designations, departments, roles & groups',
        descAr: 'الموظفون، المسميات، الأقسام، والأدوار ومجموعات الأمان',
        icon: Users,
    },
    edms: {
        nameEn: 'Document Management (EDMS)',
        nameAr: 'إدارة الوثائق والملفات',
        descEn: 'Company records, contracts, licenses, certificates',
        descAr: 'السجلات النظامية، العقود، الرخص، والشهادات',
        icon: FileText,
    },
    service: {
        nameEn: 'Government & Enterprise Services',
        nameAr: 'الخدمات والبوابات الحكومية',
        descEn: 'Muqeem, Qiwa, Balady, ZATCA, commercial registrations',
        descAr: 'مقيم، قوى، بلدي، زاتكا، وتجديد السجلات التجارية',
        icon: Globe,
    },
    workflow: {
        nameEn: 'Workflow Automation',
        nameAr: 'مسارات العمل المؤتمتة',
        descEn: 'Business approvals, sequential transitions, SLA engine',
        descAr: 'الموافقات الإدارية، الانتقالات التلقائية، ومتابعة الالتزام',
        icon: GitFork,
    },
    request: {
        nameEn: 'Requests & Approvals',
        nameAr: 'الطلبات والاعتمادات',
        descEn: 'Leave requests, salary certificates, business expenses',
        descAr: 'الإجازات، شهادات التعريف بالراتب، وعهد ومصروفات الأعمال',
        icon: ClipboardCheck,
    },
    asset: {
        nameEn: 'Asset Management',
        nameAr: 'إدارة الأصول والعهد',
        descEn: 'Custody tracking, equipment, IT devices, vehicles',
        descAr: 'تتبع العهد، الأجهزة التقنية، المعدات، وأسطول المركبات',
        icon: Box,
    },
    ticketing: {
        nameEn: 'Support Ticketing',
        nameAr: 'الدعم والمساعدات الفنية',
        descEn: 'Internal requests, helpdesk issues, SLA escalations',
        descAr: 'التذاكر الداخلية، قضايا الدعم الفني، ومستويات الخدمة',
        icon: LifeBuoy,
    },
};

export const DEFAULT_PERMISSIONS: SecurityGroupPermissions = {
    ums: { read: false, write: false, delete: false, export: false },
    edms: { read: false, write: false, delete: false, export: false },
    service: { read: false, write: false, delete: false, export: false },
    workflow: { read: false, write: false, delete: false, export: false },
    request: { read: false, write: false, delete: false, export: false },
    asset: { read: false, write: false, delete: false, export: false },
    ticketing: { read: false, write: false, delete: false, export: false },
};

export function clonePermissions(
    permissions: SecurityGroupPermissions = DEFAULT_PERMISSIONS
): SecurityGroupPermissions {
    return JSON.parse(JSON.stringify(permissions));
}

export function countActivePermissions(permissions: SecurityGroupPermissions): number {
    let count = 0;
    MODULE_KEYS.forEach((mKey) => {
        const p = permissions[mKey];
        if (!p) return;
        if (p.read) count++;
        if (p.write) count++;
        if (p.delete) count++;
        if (p.export) count++;
    });
    return count;
}

export interface InvitedMemberItem {
    email: string;
    employeeId?: string;
    employeeName?: string;
    permissions: SecurityGroupPermissions;
}

export interface SecurityGroupFormValues {
    groupName: string;
    description: string;
    emailInput: string;
    invitedMembers: InvitedMemberItem[];
    permissions: SecurityGroupPermissions;
}

export interface SecurityGroupFormErrors {
    groupName?: string;
    description?: string;
    emailInput?: string;
}

export interface SecurityGroupFormProps {
    isOpen: boolean;
    isEditing?: boolean;
    values: SecurityGroupFormValues;
    errors: SecurityGroupFormErrors;
    employees: EmployeeRecord[];
    isSubmitting?: boolean;
    onChange: (next: SecurityGroupFormValues) => void;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SecurityGroupForm: React.FC<SecurityGroupFormProps> = ({
    isOpen,
    values,
    errors,
    employees,
    isSubmitting = false,
    onChange,
    onCancel,
    onSubmit,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl' || i18n.language.startsWith('ar');

    // Tracks whether the permission matrix is editing the group-level baseline ('GROUP')
    // or a specific invited member's email
    const [activePermissionTarget, setActivePermissionTarget] = useState<'GROUP' | string>('GROUP');
    const [localEmailError, setLocalEmailError] = useState<string | null>(null);

    if (!isOpen) return null;

    const currentTargetMember =
        activePermissionTarget === 'GROUP'
            ? null
            : values.invitedMembers.find((m) => m.email === activePermissionTarget) || null;

    const activePermissions: SecurityGroupPermissions = currentTargetMember
        ? currentTargetMember.permissions
        : values.permissions;

    const updateActivePermissions = (nextPerms: SecurityGroupPermissions) => {
        if (currentTargetMember) {
            onChange({
                ...values,
                invitedMembers: values.invitedMembers.map((m) =>
                    m.email === currentTargetMember.email
                        ? { ...m, permissions: nextPerms }
                        : m
                ),
            });
        } else {
            onChange({
                ...values,
                permissions: nextPerms,
            });
        }
    };

    const handlePermissionToggle = (
        moduleKey: keyof SecurityGroupPermissions,
        action: keyof ModulePermission
    ) => {
        const currentVal = activePermissions[moduleKey][action];
        const nextPerms: SecurityGroupPermissions = {
            ...activePermissions,
            [moduleKey]: {
                ...activePermissions[moduleKey],
                [action]: !currentVal,
            },
        };
        updateActivePermissions(nextPerms);
    };

    const handleToggleModuleRow = (moduleKey: keyof SecurityGroupPermissions) => {
        const curr = activePermissions[moduleKey];
        const allOn = curr.read && curr.write && curr.delete && curr.export;
        const targetVal = !allOn;
        const nextPerms: SecurityGroupPermissions = {
            ...activePermissions,
            [moduleKey]: {
                read: targetVal,
                write: targetVal,
                delete: targetVal,
                export: targetVal,
            },
        };
        updateActivePermissions(nextPerms);
    };

    const handleGrantAll = () => {
        const granted: SecurityGroupPermissions = clonePermissions(DEFAULT_PERMISSIONS);
        MODULE_KEYS.forEach((mKey) => {
            granted[mKey] = { read: true, write: true, delete: true, export: true };
        });
        updateActivePermissions(granted);
    };

    const handleReadOnlyAll = () => {
        const readOnly: SecurityGroupPermissions = clonePermissions(DEFAULT_PERMISSIONS);
        MODULE_KEYS.forEach((mKey) => {
            readOnly[mKey] = { read: true, write: false, delete: false, export: false };
        });
        updateActivePermissions(readOnly);
    };

    const handleRevokeAll = () => {
        const revoked: SecurityGroupPermissions = clonePermissions(DEFAULT_PERMISSIONS);
        MODULE_KEYS.forEach((mKey) => {
            revoked[mKey] = { read: false, write: false, delete: false, export: false };
        });
        updateActivePermissions(revoked);
    };

    const handleAddEmailsFromInput = () => {
        const raw = values.emailInput.trim();
        if (!raw) return;

        const parts = raw
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);

        const invalid = parts.find((email) => !EMAIL_REGEX.test(email));
        if (invalid) {
            setLocalEmailError(`Invalid email address: ${invalid}`);
            return;
        }

        setLocalEmailError(null);
        const existingEmails = new Set(values.invitedMembers.map((m) => m.email.toLowerCase()));
        const addedMembers: InvitedMemberItem[] = [];

        parts.forEach((email) => {
            if (!existingEmails.has(email)) {
                existingEmails.add(email);
                const matchedEmp = employees.find(
                    (emp) =>
                        emp.email.toLowerCase() === email ||
                        (emp.workEmail && emp.workEmail.toLowerCase() === email)
                );
                addedMembers.push({
                    email,
                    employeeId: matchedEmp?.id,
                    employeeName: matchedEmp
                        ? isRtl
                            ? matchedEmp.nameAr || matchedEmp.nameEn
                            : matchedEmp.nameEn
                        : undefined,
                    permissions: clonePermissions(values.permissions),
                });
            }
        });

        const nextInvited = [...values.invitedMembers, ...addedMembers];
        onChange({
            ...values,
            emailInput: '',
            invitedMembers: nextInvited,
        });

        if (addedMembers.length > 0) {
            setActivePermissionTarget(addedMembers[addedMembers.length - 1].email);
        }
    };

    const handleRemoveInvitedMember = (email: string) => {
        const nextInvited = values.invitedMembers.filter((m) => m.email !== email);
        if (activePermissionTarget === email) {
            setActivePermissionTarget('GROUP');
        }
        onChange({
            ...values,
            invitedMembers: nextInvited,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="security-group-form-title"
                dir={isRtl ? 'rtl' : 'ltr'}
                className="bg-white rounded-xl border border-[#E5E0D8] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-start"
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#037F8C] text-[#FAF8F5] flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5 text-[#84C799]" />
                        </div>
                        <div>
                            <h2
                                id="security-group-form-title"
                                className="text-base font-bold text-[#0D0D0D]"
                            >
                                {t('ums.securityGroups.form.title', {
                                    defaultValue: 'Create New Security Group',
                                })}
                            </h2>
                            <p className="text-xs text-[#6E6862] mt-1 leading-relaxed">
                                {t('ums.securityGroups.form.description', {
                                    defaultValue:
                                        'Define and configure a new security group for better access control and permissions management. Set up roles, assign permissions, and manage your team access rights securely.',
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label={t('common.cancel', { defaultValue: 'Cancel' })}
                        className="p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-white cursor-pointer shrink-0 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="security-group-form"
                    onSubmit={onSubmit}
                    className="p-6 space-y-6 overflow-y-auto flex-1"
                    noValidate
                >
                    {/* Section: Security Group Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#E5E0D8] pb-2">
                            {t('ums.securityGroups.form.sectionInfo', {
                                defaultValue: 'Security Group Information',
                            })}
                        </h3>

                        {/* 1. Group Name* (required) */}
                        <div>
                            <label
                                htmlFor="security-group-name-input"
                                className="block text-xs font-semibold text-[#45413C] mb-1"
                            >
                                {t('ums.securityGroups.form.groupName', {
                                    defaultValue: 'Group Name',
                                })}
                                <span className="text-[#DC2626]">*</span>
                            </label>
                            <input
                                id="security-group-name-input"
                                type="text"
                                required
                                value={values.groupName}
                                onChange={(e) =>
                                    onChange({
                                        ...values,
                                        groupName: e.target.value,
                                    })
                                }
                                placeholder={t('ums.securityGroups.form.groupNamePlaceholder', {
                                    defaultValue: 'Enter security group name',
                                })}
                                className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                    errors.groupName
                                        ? 'border-[#DC2626] focus:border-[#DC2626]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {errors.groupName && (
                                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                    {errors.groupName}
                                </p>
                            )}
                        </div>

                        {/* 2. Description* (required) */}
                        <div>
                            <label
                                htmlFor="security-group-description-input"
                                className="block text-xs font-semibold text-[#45413C] mb-1"
                            >
                                {t('ums.securityGroups.form.descriptionField', {
                                    defaultValue: 'Description',
                                })}
                                <span className="text-[#DC2626]">*</span>
                            </label>
                            <textarea
                                id="security-group-description-input"
                                rows={3}
                                required
                                value={values.description}
                                onChange={(e) =>
                                    onChange({
                                        ...values,
                                        description: e.target.value,
                                    })
                                }
                                placeholder={t('ums.securityGroups.form.descriptionPlaceholder', {
                                    defaultValue: 'Enter security group description',
                                })}
                                className={`w-full px-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                    errors.description
                                        ? 'border-[#DC2626] focus:border-[#DC2626]'
                                        : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                }`}
                            />
                            {errors.description && (
                                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Section: Invite Member */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider border-b border-[#E5E0D8] pb-2">
                                {t('ums.securityGroups.form.sectionInviteMember', {
                                    defaultValue: 'Invite Member',
                                })}
                            </h3>
                            <p className="text-xs text-[#6E6862] mt-2 leading-relaxed">
                                {t('ums.securityGroups.form.inviteHelperText', {
                                    defaultValue:
                                        'You can invite one or more Employees at a time and assign specific permissions to each Employee during the invitation process.',
                                })}
                            </p>
                        </div>

                        {/* 3. Employee Email Address input */}
                        <div>
                            <label
                                htmlFor="security-group-employee-email-input"
                                className="block text-xs font-semibold text-[#45413C] mb-1"
                            >
                                {t('ums.securityGroups.form.employeeEmailAddress', {
                                    defaultValue: 'Employee Email Address',
                                })}
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Mail className="w-3.5 h-3.5 text-[#6E6862] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="security-group-employee-email-input"
                                        type="email"
                                        multiple
                                        list="ums-security-group-employee-emails"
                                        value={values.emailInput}
                                        onChange={(e) => {
                                            setLocalEmailError(null);
                                            onChange({
                                                ...values,
                                                emailInput: e.target.value,
                                            });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                handleAddEmailsFromInput();
                                            }
                                        }}
                                        placeholder={t(
                                            'ums.securityGroups.form.employeeEmailPlaceholder',
                                            {
                                                defaultValue:
                                                    'Enter one or more employee email addresses',
                                            }
                                        )}
                                        className={`w-full ps-8 pe-3 py-2 rounded-lg bg-white border text-xs text-[#0D0D0D] placeholder-[#857E74] focus:outline-none focus:ring-1 focus:ring-[#037F8C] ${
                                            errors.emailInput || localEmailError
                                                ? 'border-[#DC2626] focus:border-[#DC2626]'
                                                : 'border-[#E5E0D8] focus:border-[#037F8C]'
                                        }`}
                                    />
                                    <datalist id="ums-security-group-employee-emails">
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.email}>
                                                {isRtl ? emp.nameAr || emp.nameEn : emp.nameEn} ({emp.code})
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddEmailsFromInput}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-[#037F8C] hover:text-white text-xs font-semibold text-[#037F8C] transition-colors cursor-pointer shrink-0"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>
                                        {t('ums.securityGroups.form.addInvite', {
                                            defaultValue: 'Add',
                                        })}
                                    </span>
                                </button>
                            </div>
                            {(errors.emailInput || localEmailError) && (
                                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                                    {errors.emailInput || localEmailError}
                                </p>
                            )}
                        </div>

                        {/* Invited Members List & Target Selector */}
                        {values.invitedMembers.length > 0 && (
                            <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-[#6E6862]">
                                    <span className="font-semibold text-[#0D0D0D]">
                                        Invited Employees ({values.invitedMembers.length}) — click a member to customize their permissions:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActivePermissionTarget('GROUP')}
                                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                            activePermissionTarget === 'GROUP'
                                                ? 'bg-[#037F8C] text-white'
                                                : 'bg-white text-[#037F8C] border border-[#E5E0D8]'
                                        }`}
                                    >
                                        Group Default ({countActivePermissions(values.permissions)}/28)
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {values.invitedMembers.map((member) => {
                                        const isSelectedTarget =
                                            activePermissionTarget === member.email;
                                        const memberPermCount = countActivePermissions(
                                            member.permissions
                                        );
                                        return (
                                            <div
                                                key={member.email}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all ${
                                                    isSelectedTarget
                                                        ? 'bg-[#037F8C]/10 border-[#037F8C] text-[#0D0D0D]'
                                                        : 'bg-white border-[#E5E0D8] text-[#45413C]'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setActivePermissionTarget(member.email)
                                                    }
                                                    className="flex items-center gap-1.5 text-start cursor-pointer"
                                                >
                                                    <span className="font-medium">
                                                        {member.employeeName
                                                            ? `${member.employeeName} (${member.email})`
                                                            : member.email}
                                                    </span>
                                                    <span className="px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[10px] text-[#037F8C]">
                                                        {memberPermCount}/28
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveInvitedMember(member.email)
                                                    }
                                                    aria-label={`Remove ${member.email}`}
                                                    className="text-[#857E74] hover:text-[#DC2626] p-0.5 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Permission Assignment Matrix */}
                        <div className="pt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-[#037F8C]" />
                                        <span className="text-xs font-bold text-[#0D0D0D]">
                                            {currentTargetMember
                                                ? `Permissions for ${currentTargetMember.email}`
                                                : t('ums.securityGroups.permissionsMatrix', {
                                                      defaultValue: 'Module Permissions Matrix',
                                                  })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#6E6862] mt-0.5">
                                        {countActivePermissions(activePermissions)}/28 privileges assigned
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={handleGrantAll}
                                        className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition-colors cursor-pointer"
                                    >
                                        {t('ums.securityGroups.form.grantAll', {
                                            defaultValue: 'Grant Full',
                                        })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReadOnlyAll}
                                        className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#037F8C] border border-[#E5E0D8] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                                    >
                                        {t('ums.securityGroups.form.readOnlyAll', {
                                            defaultValue: 'Read-Only',
                                        })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRevokeAll}
                                        className="px-2 py-1 text-[11px] font-medium rounded bg-[#FAF8F5] text-[#D32F2F] border border-[#E5E0D8] hover:bg-[#FFEBEE] transition-colors cursor-pointer"
                                    >
                                        {t('ums.securityGroups.form.clearAll', {
                                            defaultValue: 'Revoke All',
                                        })}
                                    </button>
                                </div>
                            </div>

                            <div className="border border-[#E5E0D8] rounded-lg overflow-hidden bg-white text-xs">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#6E6862] font-semibold">
                                            <th className="p-2.5 text-start">Module</th>
                                            <th className="p-2.5 text-center w-14">
                                                {t('ums.securityGroups.actions.read', {
                                                    defaultValue: 'Read',
                                                })}
                                            </th>
                                            <th className="p-2.5 text-center w-14">
                                                {t('ums.securityGroups.actions.write', {
                                                    defaultValue: 'Write',
                                                })}
                                            </th>
                                            <th className="p-2.5 text-center w-14">
                                                {t('ums.securityGroups.actions.delete', {
                                                    defaultValue: 'Delete',
                                                })}
                                            </th>
                                            <th className="p-2.5 text-center w-14">
                                                {t('ums.securityGroups.actions.export', {
                                                    defaultValue: 'Export',
                                                })}
                                            </th>
                                            <th className="p-2.5 text-center w-14">All</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E0D8]">
                                        {MODULE_KEYS.map((mKey) => {
                                            const meta = MODULE_INFO[mKey];
                                            const Icon = meta.icon;
                                            const p = activePermissions[mKey];
                                            const rowAllChecked =
                                                p.read && p.write && p.delete && p.export;

                                            return (
                                                <tr
                                                    key={mKey}
                                                    className="hover:bg-[#FAF8F5]/60 transition-colors"
                                                >
                                                    <td className="p-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#037F8C] shrink-0">
                                                                <Icon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-[#0D0D0D]">
                                                                    {isRtl
                                                                        ? meta.nameAr
                                                                        : meta.nameEn}
                                                                </div>
                                                                <div className="text-[10px] text-[#6E6862]">
                                                                    {isRtl
                                                                        ? meta.descAr
                                                                        : meta.descEn}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {(
                                                        ['read', 'write', 'delete', 'export'] as const
                                                    ).map((actionKey) => {
                                                        const checked = p[actionKey];
                                                        return (
                                                            <td
                                                                key={actionKey}
                                                                className="p-2.5 text-center"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    role="checkbox"
                                                                    aria-checked={checked}
                                                                    onClick={() =>
                                                                        handlePermissionToggle(
                                                                            mKey,
                                                                            actionKey
                                                                        )
                                                                    }
                                                                    className="p-1 rounded text-[#6E6862] hover:text-[#037F8C] cursor-pointer"
                                                                >
                                                                    {checked ? (
                                                                        <CheckSquare className="w-4 h-4 text-[#037F8C]" />
                                                                    ) : (
                                                                        <Square className="w-4 h-4 text-[#857E74]" />
                                                                    )}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-2.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleModuleRow(mKey)
                                                            }
                                                            className="p-1 rounded text-[#6E6862] hover:text-[#037F8C] cursor-pointer"
                                                            title={
                                                                rowAllChecked
                                                                    ? 'Revoke module'
                                                                    : 'Grant module'
                                                            }
                                                        >
                                                            {rowAllChecked ? (
                                                                <CheckSquare className="w-4 h-4 text-[#2E7D32]" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-[#857E74]" />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Actions, in exact order: 1. Cancel, 2. Submit & Send Invitation */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E0D8]">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-[#E5E0D8] bg-white text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {t('common.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#1B4D3E] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {t('ums.securityGroups.form.submitAndSendInvitation', {
                                defaultValue: 'Submit & Send Invitation',
                            })}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SecurityGroupForm;
