import React from 'react';
import { useTranslation } from 'react-i18next';
import { type WorkflowStatusLevelRecord } from '../../pages/workflow/workflowMockData';
import { WorkflowConfirmDeleteModal } from './shared/WorkflowConfirmDeleteModal';

interface WorkflowStatusLevelDeleteModalProps {
    record: WorkflowStatusLevelRecord | null;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowStatusLevelDeleteModal: React.FC<WorkflowStatusLevelDeleteModalProps> = ({
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
                        #{record.id} (
                        {isRtl ? record.levelNameAr : record.levelNameEn}
                        )
                    </span>
                </>
            }
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
};
