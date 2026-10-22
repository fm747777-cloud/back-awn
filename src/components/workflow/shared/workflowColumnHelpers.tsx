import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Shared checkbox selection column builder for Workflows, Status Levels, and Email Templates tables.
 */
export function createWorkflowSelectionColumn<
    TRecord extends { id: TId },
    TId extends string | number,
>(options: {
    isAllCurrentPageSelected: boolean;
    selectedIds: TId[];
    selectAllLabel: string;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: TId) => void;
}): ColumnDef<any, any> {
    const {
        isAllCurrentPageSelected,
        selectedIds,
        selectAllLabel,
        onToggleSelectAll,
        onToggleSelectOne,
    } = options;

    return {
        id: 'select',
        header: () => (
            <input
                type="checkbox"
                checked={isAllCurrentPageSelected}
                onChange={onToggleSelectAll}
                className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                aria-label={selectAllLabel}
            />
        ),
        cell: ({ row }) => {
            const record = row.original as TRecord;
            return (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(record.id)}
                    onChange={() => onToggleSelectOne(record.id)}
                    className="w-3.5 h-3.5 rounded-xs border-[#C9C2B8] text-[#037F8C] focus:ring-[#037F8C] cursor-pointer"
                    aria-label={`Select row ${String(record.id)}`}
                />
            );
        },
    };
}
