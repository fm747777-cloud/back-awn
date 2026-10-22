import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WorkflowRecord } from '../../pages/workflow/workflowMockData';
import { WorkflowConfirmDeleteModal } from './shared/WorkflowConfirmDeleteModal';

interface WorkflowDeleteModalProps {
    record: WorkflowRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const WorkflowDeleteModal: React.FC<WorkflowDeleteModalProps> = ({
    record,
    isOpen,
    onClose,
    onConfirm,
}) => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    if (!isOpen || !record) return null;

    return (
        <WorkflowConfirmDeleteModal
            isOpen={isOpen}
            title={t('common.confirmDeleteTitle', {
                name: isAr ? record.titleAr : record.titleEn,
            })}
            description={t('workflow.workflows.feedback.deleteWarning')}
            summaryCard={
                <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-[#0D0D0D]">
                        #{record.id} — {isAr ? record.titleAr : record.titleEn}
                    </p>
                    <p className="text-[11px] text-[#6E6862]">
                        {t('workflow.workflows.table.source')}: {record.source} ·{' '}
                        {t('workflow.workflows.table.status')}: {record.status}
                    </p>
                </div>
            }
            onClose={onClose}
            onConfirm={onConfirm}
        />
    );
};
