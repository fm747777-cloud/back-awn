import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Layers, ShieldCheck } from 'lucide-react';
import { useSidebarStore } from '../store/useSidebarStore';

interface PlaceholderModulePageProps {
    moduleName?: string;
    moduleCode?: string;
}

const PATH_MODULE_MAP: Record<string, { code: string; name: string; i18nKey: string }> = {
    '/ums': { code: 'UMS', name: 'User Management (UMS)', i18nKey: 'nav.modules.ums' },
    '/crm': { code: 'CRM', name: 'Client Relations (CRM)', i18nKey: 'nav.modules.crm' },
    '/edms': { code: 'EDMS', name: 'Document Management (EDMS)', i18nKey: 'nav.modules.edms' },
    '/request': { code: 'REQ', name: 'Requests Management', i18nKey: 'nav.modules.request' },
    '/workflow': { code: 'WFL', name: 'Workflow Engine', i18nKey: 'nav.modules.workflow' },
    '/customer': { code: 'CST', name: 'Customer Portal', i18nKey: 'nav.modules.customer' },
    '/ticketing': { code: 'TCK', name: 'Support & Ticketing', i18nKey: 'nav.modules.ticketing' },
    '/asset-management': { code: 'AST', name: 'Asset Management', i18nKey: 'nav.modules.asset' },
    '/service': { code: 'SRV', name: 'Service Management', i18nKey: 'nav.modules.service' },
    '/documents': { code: 'DOC', name: 'Documents', i18nKey: 'nav.documents' },
    '/templates': { code: 'TPL', name: 'Document Templates', i18nKey: 'nav.documentTemplates' },
    '/categories': { code: 'CAT', name: 'Document Categories', i18nKey: 'nav.documentCategories' },
    '/types': { code: 'TYP', name: 'Document Types', i18nKey: 'nav.documentTypes' },
    '/audit-trail': { code: 'AUD', name: 'Audit Trail', i18nKey: 'nav.auditTrail' },
};

export const PlaceholderModulePage: React.FC<PlaceholderModulePageProps> = ({
    moduleName,
    moduleCode,
}) => {
    const { t } = useTranslation();
    const location = useLocation();
    const setMenuGroups = useSidebarStore((state) => state.setMenuGroups);

    const matched = PATH_MODULE_MAP[location.pathname];
    const slug = location.pathname.replace(/^\/+/, '').split('/')[0] || 'module';
    const resolvedCode = String(moduleCode || matched?.code || slug.toUpperCase() || 'MOD');
    const resolvedName = String(
        moduleName ||
            matched?.name ||
            slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
    const resolvedPath = location.pathname || `/${resolvedCode.toLowerCase()}`;
    const i18nKey = matched?.i18nKey || `nav.modules.${resolvedCode.toLowerCase()}`;

    useEffect(() => {
        setMenuGroups([
            {
                title: 'Main',
                items: [
                    { label: 'Dashboard', path: resolvedPath, icon: LayoutGrid },
                ],
            },
        ]);
    }, [resolvedPath, setMenuGroups]);

    const localizedModuleName = t(i18nKey, { defaultValue: resolvedName });

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
                                {resolvedCode}
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
