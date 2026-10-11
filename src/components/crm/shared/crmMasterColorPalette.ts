export interface CrmStageColorTheme {
    hex: string;
    labelEn: string;
    labelAr: string;
    dotClass: string;
    badgeClass: string;
    swatchClass: string;
    activeRingClass: string;
}

export const CRM_STAGE_COLOR_PRESETS: CrmStageColorTheme[] = [
    {
        hex: '#1D4ED8',
        labelEn: 'Royal Blue',
        labelAr: 'أزرق ملكي',
        dotClass: 'bg-blue-700',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        swatchClass: 'bg-blue-700 border-blue-800',
        activeRingClass: 'ring-2 ring-offset-2 ring-blue-700',
    },
    {
        hex: '#B45309',
        labelEn: 'Amber Gold',
        labelAr: 'كهرماني ذهبي',
        dotClass: 'bg-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        swatchClass: 'bg-amber-700 border-amber-800',
        activeRingClass: 'ring-2 ring-offset-2 ring-amber-700',
    },
    {
        hex: '#265938',
        labelEn: 'Emerald Forest',
        labelAr: 'أخضر زمردي',
        dotClass: 'bg-[#265938]',
        badgeClass: 'bg-[#EAF3EC] text-[#265938] border-[#C5DFCC]',
        swatchClass: 'bg-[#265938] border-[#1f492e]',
        activeRingClass: 'ring-2 ring-offset-2 ring-[#265938]',
    },
    {
        hex: '#2D3F2C',
        labelEn: 'AWN Olive',
        labelAr: 'زيتوني عون',
        dotClass: 'bg-[#2D3F2C]',
        badgeClass: 'bg-[#2D3F2C]/10 text-[#2D3F2C] border-[#2D3F2C]/25',
        swatchClass: 'bg-[#2D3F2C] border-[#233122]',
        activeRingClass: 'ring-2 ring-offset-2 ring-[#2D3F2C]',
    },
    {
        hex: '#A63A3A',
        labelEn: 'Crimson Red',
        labelAr: 'أحمر قرمزي',
        dotClass: 'bg-[#A63A3A]',
        badgeClass: 'bg-[#FCECE9] text-[#A63A3A] border-[#A63A3A]/25',
        swatchClass: 'bg-[#A63A3A] border-[#8B2E2E]',
        activeRingClass: 'ring-2 ring-offset-2 ring-[#A63A3A]',
    },
    {
        hex: '#6D28D9',
        labelEn: 'Royal Violet',
        labelAr: 'بنفسجي ملكي',
        dotClass: 'bg-violet-700',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        swatchClass: 'bg-violet-700 border-violet-800',
        activeRingClass: 'ring-2 ring-offset-2 ring-violet-700',
    },
    {
        hex: '#0F766E',
        labelEn: 'Deep Teal',
        labelAr: 'فيروزي داكن',
        dotClass: 'bg-teal-700',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        swatchClass: 'bg-teal-700 border-teal-800',
        activeRingClass: 'ring-2 ring-offset-2 ring-teal-700',
    },
    {
        hex: '#475569',
        labelEn: 'Slate Neutral',
        labelAr: 'رمادي صخري',
        dotClass: 'bg-slate-600',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        swatchClass: 'bg-slate-600 border-slate-700',
        activeRingClass: 'ring-2 ring-offset-2 ring-slate-600',
    },
];

export const CRM_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

export function getCrmStageColorTheme(colorCode?: string): CrmStageColorTheme {
    const normalized = (colorCode || '#2D3F2C').trim().toUpperCase();
    const matched = CRM_STAGE_COLOR_PRESETS.find(
        (preset) => preset.hex.toUpperCase() === normalized
    );
    return matched || CRM_STAGE_COLOR_PRESETS[3];
}

export function getCreatorInitials(name: string): string {
    const parts = (name || 'AWN')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length === 0) return 'AW';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function exportCrmMasterCsv(
    filenamePrefix: string,
    headers: string[],
    rows: Array<Array<string | number>>
): void {
    const escapedRows = rows.map((row) =>
        row
            .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
            .join(',')
    );
    const csvContent = '\uFEFF' + [headers.join(','), ...escapedRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `${filenamePrefix}-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
