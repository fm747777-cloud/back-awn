import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    recordName?: string;
    isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    recordName,
    isDeleting = false,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const displayName = recordName ? `"${recordName}"` : 'this record';

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-[#0D0D0D]/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#F8F6F2] transition cursor-pointer"
                    aria-label="Close dialog"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                    </div>

                    <div className="flex-1 pr-4">
                        <h3
                            id="delete-dialog-title"
                            className="text-base font-bold text-[#0D0D0D] tracking-tight leading-snug"
                        >
                            Delete {displayName}?
                        </h3>
                        <p className="text-xs text-[#6E6862] mt-1.5 leading-relaxed">
                            Are you sure you want to delete this record? This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-[#E5E0D8]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-[#DCD6CD] text-[#0D0D0D] hover:bg-[#F8F6F2] transition cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 size={13} />
                        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
