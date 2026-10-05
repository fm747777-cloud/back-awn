import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Layers, ShieldCheck } from 'lucide-react';
import { useSidebarStore } from '../store/useSidebarStore';

interface PlaceholderModulePageProps {
    moduleName: string;
    moduleCode: string;
}

export const PlaceholderModulePage: React.FC<PlaceholderModulePageProps> = ({
    moduleName,
    moduleCode,
}) => {
    const { t } = useTranslation();
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    useEffect(() => {
        setMenuGroups([
            {
                title: 'Main',
                items: [
                    { label: 'Dashboard', path: `/${moduleCode.toLowerCase()}`, icon: LayoutGrid },
                ],
            },
        ]);
    }, [moduleCode, setMenuGroups]);

    const localizedModuleName = t(`nav.modules.${moduleCode.toLowerCase()}`, moduleName);

    return (
        <div className="space-y-6 text-start">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-8 shadow-2xs">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#2D3F2C] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[#0D0D0D]">{localizedModuleName}</h1>
                            <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#2D3F2C] border border-[#D6CFC4]" dir="ltr">
                                {moduleCode}
                            </span>
                        </div>
                        <p className="text-xs text-[#6E6862] mt-1">
                            {t('placeholder.moduleSubtitle', { module: localizedModuleName })}
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#265938]" />
                        <div>
                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                {t('placeholder.configuredTitle')}
                            </p>
                            <p className="text-xs text-[#6E6862] mt-0.5">
                                {t('placeholder.configuredDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
