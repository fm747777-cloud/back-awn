import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Settings, ChevronDown, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSidebarStore, getMenuGroupsForPath } from '../store/useSidebarStore';

const GROUP_TITLE_KEYS: Record<string, string> = {
    MAIN: 'nav.main',
    Main: 'nav.main',
    MASTERS: 'nav.masters',
    Masters: 'nav.masters',
    'AUDIT TRAIL': 'nav.auditTrailGroup',
    'Audit Trail': 'nav.auditTrailGroup',
    'Asset Management': 'nav.assetManagement',
    'ASSET MANAGEMENT': 'nav.assetManagement',
};

const ITEM_LABEL_KEYS: Record<string, string> = {
    Dashboard: 'nav.dashboard',
    Services: 'nav.services',
    'Service Groups': 'nav.serviceGroups',
    'Service Packages': 'nav.servicePackages',
    'Service Types': 'nav.serviceTypes',
    'Service Categories': 'nav.serviceCategories',
    'Service Tags': 'nav.serviceTags',
    'Service Portals': 'nav.servicePortals',
    'Audit Trail': 'nav.auditTrail',
    Tickets: 'nav.tickets',
    'Ticket Types': 'nav.ticketTypes',
    'Canned Replies': 'nav.cannedReplies',
    Documents: 'nav.documents',
    'Document Categories': 'nav.documentCategories',
    'Document Types': 'nav.documentTypes',
    'Document Templates': 'nav.documentTemplates',
    Service: 'nav.service',
    Requests: 'nav.requests',
    'Operational Tasks': 'nav.operationalTasks',
    Workflows: 'nav.workflows',
    Masters: 'nav.masters',
    'Status Levels': 'nav.statusLevels',
    'Email Templates': 'nav.emailTemplates',
    'Approval Tasks': 'nav.approvalTasks',
    Assets: 'nav.assets',
    'Asset Status': 'nav.assetStatus',
    Status: 'nav.assetStatus',
    'Asset Types': 'nav.assetTypes',
    Types: 'nav.assetTypes',
    'Asset Categories': 'nav.assetCategories',
    Categories: 'nav.assetCategories',
    'Asset Tags': 'nav.assetTags',
    Tags: 'nav.assetTags',
};

function isPathMatching(itemPath: string, currentPathname: string): boolean {
    if (itemPath === '/') {
        return currentPathname === '/';
    }
    return currentPathname === itemPath || currentPathname.startsWith(`${itemPath}/`);
}

interface GroupToggleEntry {
    expanded: boolean;
    pathnameAtToggle: string;
}

export const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { collapsed, menuGroups } = useSidebarStore();
    const [groupToggleMap, setGroupToggleMap] = useState<Record<string, GroupToggleEntry>>({});

    // Synchronize sidebar menu groups with current location pathname for direct navigation, refresh, and back/forward
    const activeMenuGroups = getMenuGroupsForPath(location.pathname, menuGroups);

    const handleToggleCollapsibleGroup = (groupKey: string, currentlyExpanded: boolean) => {
        setGroupToggleMap((prev) => ({
            ...prev,
            [groupKey]: {
                expanded: !currentlyExpanded,
                pathnameAtToggle: location.pathname,
            },
        }));
    };

    return (
        <aside
            className={`bg-[#0D0D0D] border-e border-[#1C1A17] min-h-screen flex flex-col justify-between transition-all duration-300 relative select-none z-30 ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Header / Brand Logo */}
            <div>
                <div className="h-16 border-b border-[#1C1A17] flex items-center justify-center px-4">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/40 flex items-center justify-center shadow-xs shrink-0">
                                <span className="text-sm font-black text-[#BFAB93]">ع</span>
                            </div>
                            <div className="text-start">
                                <span className="text-base font-bold text-[#FAF8F5] block leading-tight tracking-wide">
                                    عَـــــوْن
                                </span>
                                <span className="text-[9px] font-semibold tracking-[0.25em] text-[#BFAB93] uppercase block">
                                    {t('common.awnEnterprise')}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/50 flex items-center justify-center">
                            <span className="text-xs font-black text-[#BFAB93]">ع</span>
                        </div>
                    )}
                </div>

                {/* Navigation Groups */}
                <nav className="p-3 space-y-6">
                    {activeMenuGroups.map((group, idx) => {
                        const groupTitleKey = group.title ? GROUP_TITLE_KEYS[group.title] : undefined;
                        const translatedGroupTitle = groupTitleKey
                            ? t(groupTitleKey)
                            : group.title;

                        if (group.collapsible) {
                            const groupKey = group.title || `collapsible-${idx}`;
                            const GroupIcon = group.icon || FolderKanban;
                            const hasActiveChild = group.items.some((item) =>
                                isPathMatching(item.path, location.pathname)
                            );
                            const toggleEntry = groupToggleMap[groupKey];

                            // Automatically expand when any child route is active (unless toggled on this exact route)
                            const isExpanded = hasActiveChild
                                ? toggleEntry && toggleEntry.pathnameAtToggle === location.pathname
                                    ? toggleEntry.expanded
                                    : true
                                : toggleEntry
                                ? toggleEntry.expanded
                                : true;

                            return (
                                <div key={groupKey} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleToggleCollapsibleGroup(groupKey, isExpanded)
                                        }
                                        aria-expanded={isExpanded}
                                        title={collapsed ? translatedGroupTitle : undefined}
                                        className={`w-full group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                            hasActiveChild
                                                ? 'bg-white/[0.06] text-[#FAF8F5]'
                                                : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3 min-w-0">
                                            <GroupIcon
                                                size={17}
                                                className={`transition-colors shrink-0 ${
                                                    hasActiveChild
                                                        ? 'text-[#BFAB93]'
                                                        : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                                }`}
                                            />
                                            {!collapsed && (
                                                <span className="truncate">
                                                    {translatedGroupTitle}
                                                </span>
                                            )}
                                        </span>
                                        {!collapsed && (
                                            <ChevronDown
                                                size={15}
                                                className={`shrink-0 transition-transform duration-200 ${
                                                    hasActiveChild
                                                        ? 'text-[#BFAB93]'
                                                        : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                                } ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div
                                            className={
                                                collapsed
                                                    ? 'space-y-1 pt-0.5'
                                                    : 'ps-3 ms-3 border-s border-[#1C1A17] space-y-1 pt-0.5'
                                            }
                                        >
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const labelKey = ITEM_LABEL_KEYS[item.label];
                                                const translatedLabel = labelKey
                                                    ? t(labelKey, { defaultValue: item.label })
                                                    : item.label;
                                                const activeByPath = isPathMatching(
                                                    item.path,
                                                    location.pathname
                                                );

                                                return (
                                                    <NavLink
                                                        key={item.path}
                                                        to={item.path}
                                                        end={item.path === '/'}
                                                        className={({ isActive }) => {
                                                            const active =
                                                                isActive || activeByPath;
                                                            return `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                                                                active
                                                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] font-semibold shadow-xs'
                                                                    : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                                                            }`;
                                                        }}
                                                        title={
                                                            collapsed ? translatedLabel : undefined
                                                        }
                                                    >
                                                        {({ isActive }) => {
                                                            const active =
                                                                isActive || activeByPath;
                                                            return (
                                                                <>
                                                                    {active && (
                                                                        <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BFAB93]" />
                                                                    )}
                                                                    <Icon
                                                                        size={16}
                                                                        className={`transition-colors shrink-0 ${
                                                                            active
                                                                                ? 'text-[#BFAB93]'
                                                                                : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                                                        }`}
                                                                    />
                                                                    {!collapsed && (
                                                                        <span className="truncate">
                                                                            {translatedLabel}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            );
                                                        }}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Ensure Audit Trail group heading does not duplicate when it has a single item matching its label
                        const isDuplicateTitle =
                            group.items.length === 1 &&
                            group.title?.trim().toLowerCase() === group.items[0]?.label?.trim().toLowerCase();
                        const shouldShowGroupTitle = !collapsed && translatedGroupTitle && !isDuplicateTitle;

                        return (
                            <div key={idx} className="space-y-1">
                                {shouldShowGroupTitle && (
                                    <p className="px-3 py-1 text-[10px] font-semibold text-[#6E6862] uppercase tracking-[0.16em] text-start">
                                        {translatedGroupTitle}
                                    </p>
                                )}
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const labelKey = ITEM_LABEL_KEYS[item.label];
                                    const translatedLabel = labelKey ? t(labelKey, { defaultValue: item.label }) : item.label;
                                    const activeByPath = isPathMatching(item.path, location.pathname);

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.path === '/'}
                                            className={({ isActive }) => {
                                                const active = isActive || activeByPath;
                                                return `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                                    active
                                                        ? 'bg-[#2D3F2C] text-[#FAF8F5] font-semibold shadow-xs'
                                                        : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                                                }`;
                                            }}
                                            title={collapsed ? translatedLabel : undefined}
                                        >
                                            {({ isActive }) => {
                                                const active = isActive || activeByPath;
                                                return (
                                                    <>
                                                        {/* Start Accent indicator for active item */}
                                                        {active && (
                                                            <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BFAB93]" />
                                                        )}
                                                        <Icon
                                                            size={17}
                                                            className={`transition-colors shrink-0 ${
                                                                active
                                                                    ? 'text-[#BFAB93]'
                                                                    : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                                            }`}
                                                        />
                                                        {!collapsed && (
                                                            <span className="truncate">{translatedLabel}</span>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Footer - Account Settings */}
            <div className="p-3 border-t border-[#1C1A17]">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isActive
                                ? 'bg-[#2D3F2C] text-[#FAF8F5] font-semibold shadow-xs'
                                : 'text-[#9C958C] hover:bg-white/[0.04] hover:text-[#FAF8F5]'
                        }`
                    }
                    title={collapsed ? t('nav.accountSettings') : undefined}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BFAB93]" />
                            )}
                            <Settings
                                size={17}
                                className={`transition-colors shrink-0 ${
                                    isActive
                                        ? 'text-[#BFAB93]'
                                        : 'text-[#857E74] group-hover:text-[#FAF8F5]'
                                }`}
                            />
                            {!collapsed && <span>{t('nav.accountSettings')}</span>}
                        </>
                    )}
                </NavLink>
            </div>
        </aside>
    );
};
