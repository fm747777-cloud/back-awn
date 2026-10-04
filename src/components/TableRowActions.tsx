import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    editLabel,
    deleteLabel,
    disabled = false,
}) => {
    const id = useId();
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar') || document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

    const finalEditLabel = editLabel || t('common.edit', 'Edit');
    const finalDeleteLabel = deleteLabel || t('common.delete', 'Delete');

    const [isOpen, setIsOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const editBtnRef = useRef<HTMLButtonElement>(null);
    const deleteBtnRef = useRef<HTMLButtonElement>(null);

    // Calculate menu position relative to viewport so it never clips
    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 144;
        const menuHeight = 86;
        const spacing = 4;
        const currentIsRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl';

        // Check if menu would overflow bottom of viewport
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < menuHeight + 10 && spaceAbove > spaceBelow;
        const top = openUpward
            ? Math.max(8, rect.top - menuHeight - spacing)
            : Math.min(window.innerHeight - menuHeight - 8, rect.bottom + spacing);

        let left: number;
        if (currentIsRtl) {
            // In RTL: if button is on the left half, align to left edge
            if (rect.left < window.innerWidth / 2) {
                left = rect.left;
            } else {
                left = rect.right - menuWidth;
            }
        } else {
            // In LTR: if button is near the right edge (standard table column), align to right edge
            if (rect.right > window.innerWidth / 2) {
                left = rect.right - menuWidth;
            } else {
                left = rect.left;
            }
        }

        // Clamp inside screen bounds
        left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, left));

        setMenuPosition({ top, left });
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

    // Handle outside click, keyboard navigation, and window resize/scroll
    useEffect(() => {
        if (!isOpen) return;

        // Auto-focus first available option
        const timer = setTimeout(() => {
            if (onEdit && editBtnRef.current) {
                editBtnRef.current.focus();
            } else if (onDelete && deleteBtnRef.current) {
                deleteBtnRef.current.focus();
            }
        }, 30);

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
                e.preventDefault();
                setIsOpen(false);
                buttonRef.current?.focus();
            } else if (e.key === 'Tab') {
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (document.activeElement === editBtnRef.current && deleteBtnRef.current) {
                    deleteBtnRef.current.focus();
                } else if (editBtnRef.current) {
                    editBtnRef.current.focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (document.activeElement === deleteBtnRef.current && editBtnRef.current) {
                    editBtnRef.current.focus();
                } else if (deleteBtnRef.current) {
                    deleteBtnRef.current.focus();
                }
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
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen, onEdit, onDelete]);

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
                    title={t('common.actions', 'Actions')}
                    aria-label={t('common.actions', 'Actions')}
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
                        dir={isRtl ? 'rtl' : 'ltr'}
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                        }}
                        className="fixed z-[90] w-36 bg-white border border-[#E5E0D8] rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100 select-none"
                    >
                        {onEdit && (
                            <button
                                ref={editBtnRef}
                                type="button"
                                role="menuitem"
                                tabIndex={0}
                                onClick={handleEditClick}
                                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-[#0D0D0D] hover:bg-[#F8F6F2] focus:bg-[#F8F6F2] focus:outline-none rounded-lg transition-colors cursor-pointer text-start"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-[#6A7358] shrink-0" />
                                <span>{finalEditLabel}</span>
                            </button>
                        )}

                        {onDelete && (
                            <button
                                ref={deleteBtnRef}
                                type="button"
                                role="menuitem"
                                tabIndex={0}
                                onClick={handleDeleteClick}
                                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 focus:bg-rose-50/80 focus:outline-none rounded-lg transition-colors cursor-pointer text-start"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{finalDeleteLabel}</span>
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
