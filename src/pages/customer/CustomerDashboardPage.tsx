import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Building2,
    Briefcase,
    FileCheck,
    ClipboardList,
    Users,
    Ticket,
    History,
    ShieldCheck,
    CheckCircle2,
    Clock,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    Sparkles,
    Calendar,
    UserCheck,
    Eye,
} from 'lucide-react';

interface CustomerKpiItem {
    id: string;
    titleKey: string;
    value: string;
    changeLabelKey: string;
    isPositive: boolean;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgTint: string;
    targetRoute: string;
}

interface RecentActivityItem {
    id: string;
    clientNameEn: string;
    clientNameAr: string;
    category: 'commercial' | 'operations' | 'support' | 'governance';
    actionEn: string;
    actionAr: string;
    timeEn: string;
    timeAr: string;
    status: 'completed' | 'in_progress' | 'pending' | 'resolved';
    icon: React.ComponentType<{ className?: string }>;
    route: string;
}

interface QuickLinkItem {
    id: string;
    titleKey: string;
    descKey: string;
    route: string;
    code: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeColor: string;
}

const CUSTOMER_ACTIVITIES: RecentActivityItem[] = [];

export const CustomerDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRtl = i18n.language?.startsWith('ar');
    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    const [activityFilter, setActivityFilter] = useState<'all' | 'commercial' | 'operations' | 'support'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastRefreshedAt(new Date());
            setIsRefreshing(false);
        }, 500);
    };

    const kpis: CustomerKpiItem[] = [
        {
            id: 'kpi-accounts',
            titleKey: 'customer.pages.dashboard.kpis.activeAccounts',
            value: '0',
            changeLabelKey: 'customer.pages.dashboard.kpis.activeAccountsSub',
            isPositive: true,
            icon: Building2,
            accentColor: 'text-[#037F8C]',
            bgTint: 'bg-[#037F8C]/10',
            targetRoute: '/customer/companies',
        },
        {
            id: 'kpi-contracts',
            titleKey: 'customer.pages.dashboard.kpis.activeContracts',
            value: '0',
            changeLabelKey: 'customer.pages.dashboard.kpis.activeContractsSub',
            isPositive: true,
            icon: FileCheck,
            accentColor: 'text-[#037F8C]',
            bgTint: 'bg-[#EAF3EC]',
            targetRoute: '/customer/contracts',
        },
        {
            id: 'kpi-requests',
            titleKey: 'customer.pages.dashboard.kpis.inflightRequests',
            value: '0',
            changeLabelKey: 'customer.pages.dashboard.kpis.inflightRequestsSub',
            isPositive: true,
            icon: ClipboardList,
            accentColor: 'text-[#8C6D3B]',
            bgTint: 'bg-[#FBF6ED]',
            targetRoute: '/customer/requests',
        },
        {
            id: 'kpi-governance',
            titleKey: 'customer.pages.dashboard.kpis.pendingGovernance',
            value: '0',
            changeLabelKey: 'customer.pages.dashboard.kpis.pendingGovernanceSub',
            isPositive: false,
            icon: ShieldCheck,
            accentColor: 'text-[#4A5D4E]',
            bgTint: 'bg-[#F0F4F1]',
            targetRoute: '/customer/approval-tasks',
        },
    ];

    const quickLinks: QuickLinkItem[] = [
        {
            id: 'ql-companies',
            titleKey: 'customer.pages.companies.title',
            descKey: 'customer.pages.dashboard.quickLinks.companiesDesc',
            route: '/customer/companies',
            code: 'CST-CMP',
            icon: Building2,
            badgeColor: 'bg-[#EFECE6] text-[#037F8C] border-[#D6CFC4]',
        },
        {
            id: 'ql-deals',
            titleKey: 'customer.pages.deals.title',
            descKey: 'customer.pages.dashboard.quickLinks.dealsDesc',
            route: '/customer/deals',
            code: 'CST-DLS',
            icon: Briefcase,
            badgeColor: 'bg-[#EAEFF8] text-[#2A4365] border-[#CBD8EC]',
        },
        {
            id: 'ql-contracts',
            titleKey: 'customer.pages.contracts.title',
            descKey: 'customer.pages.dashboard.quickLinks.contractsDesc',
            route: '/customer/contracts',
            code: 'CST-CNT',
            icon: FileCheck,
            badgeColor: 'bg-[#EAF3EC] text-[#037F8C] border-[#C5DFCC]',
        },
        {
            id: 'ql-requests',
            titleKey: 'customer.pages.requests.title',
            descKey: 'customer.pages.dashboard.quickLinks.requestsDesc',
            route: '/customer/requests',
            code: 'CST-REQ',
            icon: ClipboardList,
            badgeColor: 'bg-[#FBF6ED] text-[#8C6D3B] border-[#EADFCB]',
        },
        {
            id: 'ql-employees',
            titleKey: 'customer.pages.employees.title',
            descKey: 'customer.pages.dashboard.quickLinks.employeesDesc',
            route: '/customer/employees',
            code: 'CST-EMP',
            icon: Users,
            badgeColor: 'bg-[#F4EFF8] text-[#553C7B] border-[#DDD3E8]',
        },
        {
            id: 'ql-contacts',
            titleKey: 'customer.pages.contacts.title',
            descKey: 'customer.pages.dashboard.quickLinks.contactsDesc',
            route: '/customer/contacts',
            code: 'CST-CTC',
            icon: UserCheck,
            badgeColor: 'bg-[#EFECE6] text-[#037F8C] border-[#D6CFC4]',
        },
        {
            id: 'ql-tickets',
            titleKey: 'customer.pages.tickets.title',
            descKey: 'customer.pages.dashboard.quickLinks.ticketsDesc',
            route: '/customer/tickets',
            code: 'CST-TCK',
            icon: Ticket,
            badgeColor: 'bg-[#FDF2E9] text-[#9C4221] border-[#F6D6C2]',
        },
        {
            id: 'ql-audit',
            titleKey: 'customer.pages.auditTrail.title',
            descKey: 'customer.pages.dashboard.quickLinks.auditTrailDesc',
            route: '/customer/audit-trail',
            code: 'CST-AUD',
            icon: History,
            badgeColor: 'bg-[#EFECE6] text-[#4A443C] border-[#D6CFC4]',
        },
    ];

    const filteredActivities = useMemo(() => {
        if (activityFilter === 'all') return CUSTOMER_ACTIVITIES;
        return CUSTOMER_ACTIVITIES.filter((a) => a.category === activityFilter);
    }, [activityFilter]);

    const getStatusBadge = (status: RecentActivityItem['status']) => {
        switch (status) {
            case 'completed':
            case 'resolved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isRtl ? 'مكتمل' : 'Completed'}</span>
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBF6ED] text-[#8C6D3B] border border-[#EADFCB]">
                        <Clock className="w-3 h-3" />
                        <span>{isRtl ? 'قيد التنفيذ' : 'In Progress'}</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0F4F1] text-[#4A5D4E] border border-[#D5E0D7]">
                        <AlertCircle className="w-3 h-3" />
                        <span>{isRtl ? 'معلق' : 'Pending'}</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 text-start">
            {/* Header & Controls */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                {t('customer.pages.dashboard.title')}
                            </h1>
                            <span
                                className="px-2.5 py-0.5 text-xs font-mono font-semibold uppercase rounded-full bg-[#EFECE6] text-[#037F8C] border border-[#D6CFC4]"
                                dir="ltr"
                            >
                                CST-DSH
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#EAF3EC] text-[#037F8C] border border-[#C5DFCC]">
                                <span className="w-2 h-2 rounded-full bg-[#037F8C] animate-pulse" />
                                <span>{t('customer.pages.dashboard.sections.liveIndicator', 'Live Feed')}</span>
                            </span>
                        </div>
                        <p className="text-sm text-[#6E6862] max-w-3xl leading-relaxed">
                            {t('customer.pages.dashboard.subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 self-start lg:self-center shrink-0">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#6E6862]">
                            <Calendar className="w-3.5 h-3.5 text-[#857E74]" />
                            <span>
                                {isRtl ? 'آخر تحديث: ' : 'Updated: '}
                                {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#0D0D0D] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#037F8C] ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span>{isRtl ? 'تحديث البيانات' : 'Refresh'}</span>
                        </button>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-xs font-semibold text-[#595550] border border-[#E5E0D8]">
                            <Eye className="w-3.5 h-3.5 text-[#857E74]" />
                            <span>{isRtl ? 'عرض فقط' : 'View Only'}</span>
                        </span>

                        <button
                            type="button"
                            onClick={() => navigate('/customer/companies')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#037F8C] hover:bg-[#233222] text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                            <Building2 className="w-3.5 h-3.5 text-[#BFAB93]" />
                            <span>{t('customer.pages.companies.title')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={kpi.id}
                            onClick={() => navigate(kpi.targetRoute)}
                            className="group bg-white border border-[#E5E0D8] hover:border-[#BFAB93] rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-[#857E74]">
                                        {t(kpi.titleKey)}
                                    </span>
                                    <div className={`w-9 h-9 rounded-lg ${kpi.bgTint} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4.5 h-4.5 ${kpi.accentColor}`} />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-[#0D0D0D] tracking-tight">
                                    {kpi.value}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#F0ECE6] flex items-center justify-between text-xs">
                                <span className="text-[#6E6862] truncate">
                                    {t(kpi.changeLabelKey)}
                                </span>
                                <ArrowIcon className="w-3.5 h-3.5 text-[#857E74] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all shrink-0" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Portfolio Snapshot & Health Banner */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-base font-bold text-[#0D0D0D]">
                            {t('customer.pages.dashboard.sections.accountSummaryTitle', 'Customer Portfolio Snapshot')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('customer.pages.dashboard.sections.accountSummarySubtitle', 'Distribution across account tiers and service operational compliance')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#037F8C]">
                            <Sparkles className="w-3.5 h-3.5 text-[#037F8C]" />
                            <span>{isRtl ? 'جاهزية الخدمات: —' : 'Service Availability: —'}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-medium text-[#037F8C]">
                            <Clock className="w-3.5 h-3.5 text-[#8C6D3B]" />
                            <span>{isRtl ? 'متوسط سرعة المعالجة: —' : 'Avg. Turnaround: —'}</span>
                        </span>
                    </div>
                </div>

                {/* Tier Progress Bar */}
                <div className="space-y-2">
                    <div className="w-full h-3 rounded-full bg-[#EFECE6] overflow-hidden flex">
                        <div className="bg-[#037F8C] h-full" style={{ width: '0%' }} title="Enterprise (0%)" />
                        <div className="bg-[#4A5D4E] h-full" style={{ width: '0%' }} title="Commercial & SMB (0%)" />
                        <div className="bg-[#BFAB93] h-full" style={{ width: '0%' }} title="Strategic Government (0%)" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-xs text-[#6E6862] pt-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#037F8C]" />
                            <span>{isRtl ? 'كبار العملاء (Enterprise) — 0%' : 'Enterprise Accounts — 0% (0)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4A5D4E]" />
                            <span>{isRtl ? 'الشركات التجارية (Commercial) — 0%' : 'Commercial & SMB — 0% (0)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#BFAB93]" />
                            <span>{isRtl ? 'الشركاء الاستراتيجيون — 0%' : 'Strategic Partners — 0% (0)'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                            {t('customer.pages.dashboard.sections.quickLinksTitle', 'Quick Navigation & Portals')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('customer.pages.dashboard.sections.quickLinksSubtitle', 'Direct shortcuts to primary customer operational and commercial sections')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <div
                                key={link.id}
                                onClick={() => navigate(link.route)}
                                className="group bg-white border border-[#E5E0D8] hover:border-[#037F8C]/40 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between text-start"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] group-hover:bg-[#037F8C] group-hover:border-[#037F8C] text-[#037F8C] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs shrink-0">
                                            <Icon className="w-5 h-5 transition-colors" />
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-full border ${link.badgeColor}`}
                                            dir="ltr"
                                        >
                                            {link.code}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#037F8C] transition-colors">
                                        {t(link.titleKey)}
                                    </h3>
                                    <p className="text-xs text-[#6E6862] mt-1 line-clamp-2 leading-relaxed">
                                        {t(link.descKey)}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#F0ECE6] flex items-center justify-between text-xs font-medium text-[#037F8C]">
                                    <span>{t('customer.pages.dashboard.sections.viewAll', 'Open Section')}</span>
                                    <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 sm:p-7 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">
                            {t('customer.pages.dashboard.sections.recentActivityTitle', 'Recent Customer Activity')}
                        </h2>
                        <p className="text-xs text-[#6E6862] mt-0.5">
                            {t('customer.pages.dashboard.sections.recentActivitySubtitle', 'Real-time updates across commercial, operational, and support channels')}
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] self-start sm:self-center">
                        {(['all', 'commercial', 'operations', 'support'] as const).map((filter) => {
                            const active = activityFilter === filter;
                            const filterLabel =
                                filter === 'all'
                                    ? t('customer.pages.dashboard.sections.filterAll', 'All')
                                    : filter === 'commercial'
                                    ? t('customer.pages.dashboard.sections.filterCommercial', 'Commercial')
                                    : filter === 'operations'
                                    ? t('customer.pages.dashboard.sections.filterOperations', 'Operations')
                                    : t('customer.pages.dashboard.sections.filterSupport', 'Support');

                            return (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setActivityFilter(filter)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                        active
                                            ? 'bg-white text-[#037F8C] shadow-2xs font-semibold'
                                            : 'text-[#6E6862] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {filterLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Activity List */}
                <div className="divide-y divide-[#F0ECE6]">
                    {filteredActivities.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#857E74]">
                            {isRtl ? 'لا توجد أنشطة مسجلة في هذا التصنيف' : 'No recent activities found for this filter.'}
                        </div>
                    ) : (
                        filteredActivities.map((act) => {
                            const Icon = act.icon;
                            return (
                                <div
                                    key={act.id}
                                    onClick={() => navigate(act.route)}
                                    className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 hover:bg-[#FAF8F5]/80 -mx-3 px-3 rounded-lg transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start gap-3.5 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] group-hover:border-[#BFAB93] text-[#037F8C] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                            <Icon className="w-4.5 h-4.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-[#0D0D0D] group-hover:text-[#037F8C] transition-colors truncate">
                                                    {isRtl ? act.clientNameAr : act.clientNameEn}
                                                </p>
                                                <span className="text-[11px] font-mono text-[#857E74] bg-[#EFECE6] px-1.5 py-0.2 rounded" dir="ltr">
                                                    {act.category.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#6E6862] mt-0.5 line-clamp-1">
                                                {isRtl ? act.actionAr : act.actionEn}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                                        {getStatusBadge(act.status)}
                                        <div className="flex items-center gap-1 text-[11px] text-[#857E74]">
                                            <Clock className="w-3 h-3" />
                                            <span>{isRtl ? act.timeAr : act.timeEn}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
