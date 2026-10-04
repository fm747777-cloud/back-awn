import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export interface TableRowActionsProps {
    recordName?: string;
    onEdit?: () => void;
    onDelete?: () => void | Promise<void>;
    editLabel?: string;
    deleteLabel?: string;
    disabled?: boolean;
}

export const TableRowActions: React.FC<TableRowActionsProps> = ({
    recordName,
    onEdit,
    onDelete,
    editLabel = 'Edit',
    deleteLabel = 'Delete',
    disabled = false,
}) => {
    const id = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuCoords, setMenuCoords] = useState<{ top: number; left?: number; right?: number }>({
        top: 0,
        right: 0,
    });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Calculate menu position relative to viewport so it never clips
    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 140;
        const menuHeight = 84;
        const spacing = 4;
        const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

        // Check if menu would overflow bottom of viewport
        const openUpward = rect.bottom + menuHeight > window.innerHeight - 8;
        const top = openUpward ? Math.max(8, rect.top - menuHeight - spacing) : rect.bottom + spacing;

        if (isRtl) {
            // Align to left of button in RTL, ensure it doesn't overflow left edge
            const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.left));
            setMenuCoords({ top, left });
        } else {
            // Align to right edge of button in LTR, ensure it doesn't overflow right edge
            const right = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, window.innerWidth - rect.right));
            setMenuCoords({ top, right });
        }
    }, []);

    // Toggle menu
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        if (!isOpen) {
            updatePosition();
            // Notify other menus to close so only one menu is open at a time
            window.dispatchEvent(new CustomEvent('awn-close-action-menus', { detail: { id } }));
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Close menu when another menu opens
    useEffect(() => {
        const handleCloseOthers = (e: Event) => {
            const customEvent = e as CustomEvent<{ id: string }>;
            if (customEvent.detail?.id !== id) {
                setIsOpen(false);
            }
        };

        window.addEventListener('awn-close-action-menus', handleCloseOthers);
        return () => window.removeEventListener('awn-close-action-menus', handleCloseOthers);
    }, [id]);

    // Handle outside click, escape key, and window resize/scroll
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                menuRef.current &&
                !menuRef.current.contains(target) &&
                buttonRef.current &&
                !buttonRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        const handleScrollOrResize = () => {
            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        if (onEdit) {
            onEdit();
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!onDelete) return;
        try {
            setIsDeleting(true);
            await onDelete();
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="inline-flex items-center justify-end">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    title="Actions"
                    aria-label="Actions"
                    className={`p-1.5 rounded-lg text-[#857E74] hover:text-[#0D0D0D] hover:bg-[#F8F6F2] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/20 ${
                        isOpen ? 'bg-[#F8F6F2] text-[#0D0D0D]' : ''
                    }`}
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Portal-rendered menu to prevent clipping by table bounds */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        aria-orientation="vertical"
                        style={{
                            top: `${menuCoords.top}px`,
                            ...(menuCoords.left !== undefined ? { left: `${menuCoords.left}px` } : {}),
                            ...(menuCoords.right !== undefined ? { right: `${menuCoords.right}px` } : {}),
                        }}
                        className="fixed z-[90] w-36 bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100 select-none"
                    >
                        {onEdit && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleEditClick}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#0D0D0D] hover:bg-[#F8F6F2] rounded-lg transition-colors cursor-pointer text-left"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-[#6A7358]" />
                                <span>{editLabel}</span>
                            </button>
                        )}

                        {onDelete && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={handleDeleteClick}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer text-left"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>{deleteLabel}</span>
                            </button>
                        )}
                    </div>,
                    document.body
                )}

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                recordName={recordName}
                isDeleting={isDeleting}
            />
        </>
    );
};
