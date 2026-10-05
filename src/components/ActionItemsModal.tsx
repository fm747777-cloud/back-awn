import React from 'react';
import { ChevronLeft, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ModuleOption {
    id: string;
    label: string;
    path: string;
}

export const MODULE_OPTIONS: ModuleOption[] = [
    { id: 'ums', label: 'UMS', path: '/ums' },
    { id: 'crm', label: 'CRM', path: '/crm' },
    { id: 'edms', label: 'EDMS', path: '/edms' },
    { id: 'request', label: 'REQUEST', path: '/request' },
    { id: 'service', label: 'SERVICE', path: '/service' },
    { id: 'workflow', label: 'WORKFLOW', path: '/workflow' },
    { id: 'customer', label: 'CUSTOMER', path: '/customer' },
    { id: 'ticketing', label: 'TICKETING', path: '/ticketing' },
    { id: 'asset', label: 'ASSET', path: '/asset-management' },
];

interface ActionItemsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectModule: (item: ModuleOption) => void;
}

export const ActionItemsModal: React.FC<ActionItemsModalProps> = ({ isOpen, onClose, onSelectModule }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-[#E5E0D8]">
                    <button
                        type="button"
                        onClick={onClose}
                        title={t('common.close')}
                        className="w-8 h-8 rounded-lg bg-[#F8F6F2] hover:bg-[#EFECE6] flex items-center justify-center text-[#2D3F2C] transition cursor-pointer"
                    >
                        <ChevronLeft size={18} className="rtl:rotate-180" />
                    </button>
                    <div className="text-start">
                        <h3 className="text-lg font-bold text-[#0D0D0D]">
                            {t('nav.modulesModalTitle')}
                        </h3>
                        <p className="text-xs text-[#6E6862]">{t('nav.modulesModalSubtitle')}</p>
                    </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 py-2">
                    {MODULE_OPTIONS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectModule(item)}
                            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-[#E5E0D8] hover:border-[#BFAB93] transition-all text-start group cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                            <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] group-hover:border-[#BFAB93] flex items-center justify-center text-[#2D3F2C] group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                                <LayoutGrid size={18} />
                            </div>
                            <div className="min-w-0">
                                <span className="font-bold text-xs text-[#0D0D0D] block tracking-wide truncate">
                                    {t(`nav.modules.${item.id}`, { defaultValue: item.label })}
                                </span>
                                <span className="text-[10px] text-[#6E6862]">
                                    {t('nav.administrativeModule')}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
