import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export interface SecurityGroupFormData {
    members_ids: string[];
    name: string;
    description: string;
}

export interface SecurityGroupMemberOption {
    id: string;
    codeName?: string | null;
    email?: string | null;
    phone_number?: string | null;
    userAttach?: {
        first_name_Ar?: string | null;
        first_name_En?: string | null;
        secend_name_Ar?: string | null;
        secend_name_En?: string | null;
        last_name_Ar?: string | null;
        last_name_En?: string | null;
    } | null;
}

interface SecurityGroupFormProps {
    isEditing?: boolean;
    formData: SecurityGroupFormData;
    formErrors: Partial<Record<keyof SecurityGroupFormData, string>>;
    users: SecurityGroupMemberOption[];
    isSubmitting?: boolean;
    onChange: (data: SecurityGroupFormData) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

const getUserName = (user: SecurityGroupMemberOption): string => {
    const attach = user.userAttach;
    const englishName = [attach?.first_name_En, attach?.secend_name_En, attach?.last_name_En].filter(Boolean).join(' ');
    const arabicName = [attach?.first_name_Ar, attach?.secend_name_Ar, attach?.last_name_Ar].filter(Boolean).join(' ');
    return englishName || arabicName || user.email || user.codeName || '—';
};

export const SecurityGroupForm: React.FC<SecurityGroupFormProps> = ({ isEditing = false, formData, formErrors, users, isSubmitting = false, onChange, onSubmit, onCancel }) => {
    const { t } = useTranslation();
const toggleMember = (userId: string) => {
    const isSelected = formData.members_ids.includes(userId);
    onChange({ ...formData, members_ids: isSelected ? formData.members_ids.filter((id) => id !== userId) : [...formData.members_ids, userId] });
};

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs" role="dialog" aria-modal="true" aria-labelledby="security-group-form-title">
        <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[#E5E0D8] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E0D8] px-6 py-4">
                <div>
                    <h2 id="security-group-form-title" className="text-base font-bold text-[#0D0D0D]">{isEditing ? t('ums.securityGroups.form.editTitle', { defaultValue: 'Edit Security Group' }) : t('ums.securityGroups.form.createTitle', { defaultValue: 'Add Security Group' })}</h2>
                    <p className="mt-1 text-xs text-[#6E6862]">{t('ums.securityGroups.form.subtitle', { defaultValue: 'Enter the security group name and description.' })}</p>
                </div>
                <button type="button" onClick={onCancel} disabled={isSubmitting} aria-label={t('common.close', { defaultValue: 'Close' })} className="shrink-0 rounded-lg p-1.5 text-[#857E74] hover:bg-[#FAF8F5] hover:text-[#0D0D0D] disabled:opacity-50"><X size={17} /></button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto p-6" noValidate>
                <div>
                    <label htmlFor="security-group-name" className="mb-1 block text-xs font-semibold text-[#45413C]">{t('ums.securityGroups.form.name', { defaultValue: 'Group Name' })} <span className="text-[#DC2626]">*</span></label>
                    <input id="security-group-name" type="text" value={formData.name} onChange={(event) => onChange({ ...formData, name: event.target.value })} placeholder={t('ums.securityGroups.form.namePlaceholder', { defaultValue: 'Enter security group name' })} disabled={isSubmitting} className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none placeholder:text-[#857E74] focus:ring-1 focus:ring-[#037F8C] disabled:opacity-50 ${formErrors.name ? 'border-[#DC2626]' : 'border-[#E5E0D8] focus:border-[#037F8C]'}`} />
                    {formErrors.name && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{formErrors.name}</p>}
                </div>

                <div>
                    <label htmlFor="security-group-description" className="mb-1 block text-xs font-semibold text-[#45413C]">{t('ums.securityGroups.form.description', { defaultValue: 'Description' })} <span className="text-[#DC2626]">*</span></label>
                    <textarea id="security-group-description" rows={4} value={formData.description} onChange={(event) => onChange({ ...formData, description: event.target.value })} placeholder={t('ums.securityGroups.form.descriptionPlaceholder', { defaultValue: 'Enter security group description' })} disabled={isSubmitting} className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-xs text-[#0D0D0D] outline-none placeholder:text-[#857E74] focus:ring-1 focus:ring-[#037F8C] disabled:opacity-50 ${formErrors.description ? 'border-[#DC2626]' : 'border-[#E5E0D8] focus:border-[#037F8C]'}`} />
                    {formErrors.description && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{formErrors.description}</p>}
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-xs font-semibold text-[#45413C]">{t('ums.securityGroups.form.members', { defaultValue: 'Group Members' })}</label>
                        <span className="rounded-full bg-[#EAF3EC] px-2 py-0.5 text-[11px] font-bold text-[#037F8C]">{formData.members_ids.length} {t('common.selected', { defaultValue: 'selected' })}</span>
                    </div>
                    <div className="max-h-56 divide-y divide-[#EFECE6] overflow-y-auto rounded-lg border border-[#E5E0D8]">
                        {users.length === 0 ? <p className="p-4 text-center text-xs text-[#857E74]">{t('ums.securityGroups.form.noUsers', { defaultValue: 'No users found' })}</p> : users.map((user) => {
                            const isSelected = formData.members_ids.includes(user.id);
                            return <label key={user.id} className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${isSelected ? 'bg-[#EAF3EC]' : 'bg-white hover:bg-[#FAF8F5]'}`}><input type="checkbox" checked={isSelected} onChange={() => toggleMember(user.id)} disabled={isSubmitting} className="h-4 w-4 accent-[#037F8C]" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#0D0D0D]">{getUserName(user)}</p><p className="mt-0.5 truncate text-[11px] text-[#857E74]">{user.email || user.phone_number || '—'}</p></div><span className="shrink-0 font-mono text-[10px] text-[#037F8C]">{user.codeName || '—'}</span></label>;
                        })}
                    </div>
                    {formErrors.members_ids && <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{formErrors.members_ids}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-[#E5E0D8] pt-4">
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-lg border border-[#E5E0D8] bg-white px-4 py-2 text-xs font-semibold text-[#45413C] hover:bg-[#FAF8F5] disabled:opacity-50">{t('common.cancel', { defaultValue: 'Cancel' })}</button>
                    <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#037F8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#223121] disabled:opacity-50">{isSubmitting ? t('common.loading', { defaultValue: 'Loading...' }) : isEditing ? t('common.update', { defaultValue: 'Update' }) : t('common.create', { defaultValue: 'Create' })}</button>
                </div>
            </form>
        </div>
    </div>
);
};

export default SecurityGroupForm;