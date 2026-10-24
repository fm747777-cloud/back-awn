import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface WorkflowDashboardKpiCardItem {
    key: string;
    title: string;
    desc: string;
    count: number;
    percent: string;
    icon: LucideIcon;
    accentClass: string;
    badgeClass: string;
}

interface WorkflowDashboardKpiGridProps {
    cards: WorkflowDashboardKpiCardItem[];
}

export const WorkflowDashboardKpiGrid: React.FC<WorkflowDashboardKpiGridProps> = ({
    cards,
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.key}
                        className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-2xs hover:border-[#037F8C]/40 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${card.accentClass}`}
                            >
                                <Icon size={18} />
                            </div>
                            <span
                                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${card.badgeClass}`}
                                dir="ltr"
                            >
                                {card.percent}
                            </span>
                        </div>
                        <div className="mt-3.5 text-start">
                            <span
                                className="text-2xl font-bold font-mono tracking-tight text-[#0D0D0D] block"
                                dir="ltr"
                            >
                                {card.count}
                            </span>
                            <h2 className="text-xs font-semibold text-[#0D0D0D] mt-1">
                                {card.title}
                            </h2>
                            <p className="text-[11px] text-[#6E6862] mt-0.5 line-clamp-1">
                                {card.desc}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
