import React from 'react';
import { useTranslation } from 'react-i18next';
import { type WorkflowEmailTemplateRecord } from '../../pages/workflow/workflowMockData';
import { WorkflowConfirmDeleteModal } from './shared/WorkflowConfirmDeleteModal';

interface WorkflowEmailTemplateDeleteModalProps {
    record: WorkflowEmailTemplateRecord | null;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowEmailTemplateDeleteModal: React.FC<WorkflowEmailTemplateDeleteModalProps> = ({
    record,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') ?? false;

    if (!record) return null;

    return (
        <WorkflowConfirmDeleteModal
            isOpen={Boolean(record)}
            title={t('common.confirmDeleteTitle', 'Confirm Deletion')}
            description={
                <>
                    {t(
                        'common.confirmDeleteDesc',
                        'Are you sure you want to delete this record?'
                    )}{' '}
                    <span className="font-semibold text-[#0D0D0D]">
                        {record.id} —{' '}
                        {isRtl ? record.templateNameAr : record.templateNameEn}
                    </span>
                </>
            }
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
};
