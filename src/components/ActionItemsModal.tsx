import React from 'react';
import { ChevronLeft, LayoutGrid } from 'lucide-react';

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h3 className="text-xl font-bold text-slate-800">
                        Action Items
                    </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
                    {MODULE_OPTIONS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelectModule(item)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition text-left group cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform shadow-xs">
                                <LayoutGrid size={20} />
                            </div>
                            <span className="font-semibold text-sm text-slate-800">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};