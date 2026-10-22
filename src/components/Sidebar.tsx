import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Settings, ChevronDown, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSidebarStore, getMenuGroupsForPath } from '../store/useSidebarStore';
import awnLogo from '../assets/awn-logo.png';

const GROUP_TITLE_KEYS: Record<string, string> = {
    MAIN: 'nav.main',
    Main: 'nav.main',
    MASTERS: 'nav.masters',
    Masters: 'nav.masters',
    Master: 'nav.master',
    Leads: 'nav.leadsGroup',
    LEADS: 'nav.leadsGroup',
    Deals: 'nav.dealsGroup',
    DEALS: 'nav.dealsGroup',
    'AUDIT TRAIL': 'nav.auditTrailGroup',
    'Audit Trail': 'nav.auditTrailGroup',
    'Asset Management': 'nav.assetManagement',
    'ASSET MANAGEMENT': 'nav.assetManagement',
    'Overview & Commercial': 'nav.overviewAndCommercial',
    'OVERVIEW & COMMERCIAL': 'nav.overviewAndCommercial',
    'Operations & Service Delivery': 'nav.operationsAndServiceDelivery',
    'OPERATIONS & SERVICE DELIVERY': 'nav.operationsAndServiceDelivery',
    'Organization & Resources': 'nav.organizationAndResources',
    'ORGANIZATION & RESOURCES': 'nav.organizationAndResources',
    'Governance & Support': 'nav.governanceAndSupport',
    'GOVERNANCE & SUPPORT': 'nav.governanceAndSupport',
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
    'Audit Trails': 'nav.auditTrails',
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
    'Operational Task': 'nav.operationalTask',
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
    Employees: 'nav.employees',
    Designations: 'nav.designations',
    Departments: 'nav.departments',
    'Security Groups': 'nav.securityGroups',
    Roles: 'nav.roles',
    Branches: 'nav.branches',
    'Custom Addons': 'nav.customAddons',
    'Sales Performance Dashboard': 'nav.salesPerformanceDashboard',
    'Dashboard Sales': 'nav.dashboardSales',
    Leads: 'nav.leads',
    Companies: 'nav.companies',
    Contacts: 'nav.contacts',
    Owners: 'nav.owners',
    Deals: 'nav.deals',
    Quotations: 'nav.quotations',
    Contracts: 'nav.contracts',
    Invoices: 'nav.invoices',
    'Won Deals': 'nav.wonDeals',
    'Lead Source': 'nav.leadSource',
    'Lead Status': 'nav.leadStatus',
    Sectors: 'nav.sectors',
    Tax: 'nav.tax',
    'Organizational Types': 'nav.organizationalTypes',
    'Ownership Types': 'nav.ownershipTypes',
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
            className={`bg-white border-e border-[#E5E7EB] min-h-screen flex flex-col justify-between transition-all duration-300 relative select-none z-30 ${
                collapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Header / Brand Logo */}
            <div>
                <div
                    className={`h-16 border-b border-[#E5E7EB] flex items-center ${
                        collapsed ? 'justify-center px-2' : 'justify-start px-4'
                    }`}
                >
                    <img
                        src={awnLogo}
                        alt={t('common.awnEnterprise', { defaultValue: 'AWN' })}
                        className={`object-contain object-left rtl:object-right select-none shrink-0 transition-all duration-300 ${
                            collapsed ? 'h-9 w-auto max-w-full' : 'h-11 w-auto max-w-full'
                        }`}
                    />
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
                                                ? 'bg-[#37848C]/10 text-[#37848C]'
                                                : 'text-[#4B5563] hover:bg-slate-100 hover:text-[#111827]'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3 min-w-0">
                                            <GroupIcon
                                                size={17}
                                                className={`transition-colors shrink-0 ${
                                                    hasActiveChild
                                                        ? 'text-[#37848C]'
                                                        : 'text-[#6B7280] group-hover:text-[#37848C]'
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
                                                        ? 'text-[#37848C]'
                                                        : 'text-[#6B7280] group-hover:text-[#37848C]'
                                                } ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div
                                            className={
                                                collapsed
                                                    ? 'space-y-1 pt-0.5'
                                                    : 'ps-3 ms-3 border-s border-[#E5E7EB] space-y-1 pt-0.5'
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
                                                                    ? 'bg-[#37848C] text-white font-semibold shadow-xs'
                                                                    : 'text-[#4B5563] hover:bg-slate-100 hover:text-[#111827]'
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
                                                                        <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BF9A56]" />
                                                                    )}
                                                                    <Icon
                                                                        size={16}
                                                                        className={`transition-colors shrink-0 ${
                                                                            active
                                                                                ? 'text-white'
                                                                                : 'text-[#6B7280] group-hover:text-[#37848C]'
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
                                    <p className="px-3 py-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em] text-start">
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
                                                        ? 'bg-[#37848C] text-white font-semibold shadow-xs'
                                                        : 'text-[#4B5563] hover:bg-slate-100 hover:text-[#111827]'
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
                                                            <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BF9A56]" />
                                                        )}
                                                        <Icon
                                                            size={17}
                                                            className={`transition-colors shrink-0 ${
                                                                active
                                                                    ? 'text-white'
                                                                    : 'text-[#6B7280] group-hover:text-[#37848C]'
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
            <div className="p-3 border-t border-[#E5E7EB]">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isActive
                                ? 'bg-[#37848C] text-white font-semibold shadow-xs'
                                : 'text-[#4B5563] hover:bg-slate-100 hover:text-[#111827]'
                        }`
                    }
                    title={collapsed ? t('nav.accountSettings') : undefined}
                >
                    {({ isActive }) => (
                        <>
                            {isActive && (
                                <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[#BF9A56]" />
                            )}
                            <Settings
                                size={17}
                                className={`transition-colors shrink-0 ${
                                    isActive
                                        ? 'text-white'
                                        : 'text-[#6B7280] group-hover:text-[#37848C]'
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
