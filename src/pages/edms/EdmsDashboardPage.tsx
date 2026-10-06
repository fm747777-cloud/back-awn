import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    Clock,
    FolderKanban,
    ListFilter,
    Building2,
    Briefcase,
} from 'lucide-react';
import {
    EDMS_DEMO_DOCUMENTS,
    EDMS_CATEGORY_META,
    EDMS_DOCUMENT_TYPE_META,
    type EdmsCategoryKey,
    type EdmsDocumentTypeKey,
} from './edmsMockData';

const CATEGORY_ORDER: EdmsCategoryKey[] = ['employees', 'establishments', 'assets'];

const TYPE_ORDER: EdmsDocumentTypeKey[] = [
    'iqama',
    'employee_contract',
    'commercial_registration',
    'employee_health_insurance',
    'baladi_license',
    'gosi_subscription',
    'passport',
    'business_health_insurance',
];

export const EdmsDashboardPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language?.startsWith('ar');

    const totalDocuments = EDMS_DEMO_DOCUMENTS.length;

    // --- 1. Documents Expiring (derived from EDMS_DEMO_DOCUMENTS) ---
    const expiringDocuments = useMemo(() => {
        return EDMS_DEMO_DOCUMENTS.filter((doc) => doc.isExpiringSoon).sort(
            (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
        );
    }, []);

    // --- 2. Documents By Category (derived from EDMS_DEMO_DOCUMENTS) ---
    const categoryData = useMemo(() => {
        return CATEGORY_ORDER.map((catKey) => {
            const meta = EDMS_CATEGORY_META[catKey];
            const count = EDMS_DEMO_DOCUMENTS.filter((doc) => doc.categoryKey === catKey).length;
            const percent = ((count / totalDocuments) * 100).toFixed(1);
            return {
                key: catKey,
                name: isAr ? meta.ar : meta.en,
                rawAr: meta.ar,
                count,
                percent,
                color: meta.color,
            };
        }).sort((a, b) => b.count - a.count);
    }, [isAr, totalDocuments]);

    // --- 3. Documents By Type (derived from EDMS_DEMO_DOCUMENTS) ---
    const typeData = useMemo(() => {
        return TYPE_ORDER.map((typeKey) => {
            const meta = EDMS_DOCUMENT_TYPE_META[typeKey];
            const count = EDMS_DEMO_DOCUMENTS.filter((doc) => doc.typeKey === typeKey).length;
            const percent = ((count / totalDocuments) * 100).toFixed(1);
            return {
                key: typeKey,
                name: isAr ? meta.ar : meta.en,
                count,
                percent,
            };
        }).sort((a, b) => b.count - a.count);
    }, [isAr, totalDocuments]);

    // --- 4. Company Wise Documents (all documents per company) ---
    const companyWiseData = useMemo(() => {
        const map: Record<
            string,
            { companyId: string; en: string; ar: string; count: number }
        > = {};

        EDMS_DEMO_DOCUMENTS.forEach((doc) => {
            if (!map[doc.companyId]) {
                map[doc.companyId] = {
                    companyId: doc.companyId,
                    en: doc.companyEn,
                    ar: doc.companyAr,
                    count: 0,
                };
            }
            map[doc.companyId].count += 1;
        });

        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                companyId: item.companyId,
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: ((item.count / totalDocuments) * 100).toFixed(1),
            }));
    }, [isAr, totalDocuments]);

    // --- 5. Company Wise Business Documents (business scope documents per company) ---
    const businessDocumentsTotal = useMemo(
        () => EDMS_DEMO_DOCUMENTS.filter((doc) => doc.scope === 'business').length,
        []
    );

    const companyWiseBusinessData = useMemo(() => {
        const map: Record<
            string,
            { companyId: string; en: string; ar: string; count: number }
        > = {};

        EDMS_DEMO_DOCUMENTS.filter((doc) => doc.scope === 'business').forEach((doc) => {
            if (!map[doc.companyId]) {
                map[doc.companyId] = {
                    companyId: doc.companyId,
                    en: doc.companyEn,
                    ar: doc.companyAr,
                    count: 0,
                };
            }
            map[doc.companyId].count += 1;
        });

        return Object.values(map)
            .sort((a, b) => b.count - a.count)
            .map((item) => ({
                companyId: item.companyId,
                name: isAr ? item.ar : item.en,
                count: item.count,
                percent: (
                    (item.count / Math.max(1, businessDocumentsTotal)) *
                    100
                ).toFixed(1),
            }));
    }, [isAr, businessDocumentsTotal]);

    return (
        <div className="space-y-6 text-start">
            {/* Unified Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D] dark:text-slate-100">
                        {t('edms.dashboardTitle')}
                    </h1>
                    <p className="text-xs text-[#6E6862] dark:text-slate-400 mt-1 font-normal">
                        {t('edms.dashboardDesc')}
                    </p>
                </div>
            </div>

            {/* Section 1: Documents Expiring */}
            <section
                aria-labelledby="edms-section-expiring"
                className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
            >
                <div className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={15} className="text-[#8C6046] dark:text-amber-400 shrink-0" />
                        <h2
                            id="edms-section-expiring"
                            className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 tracking-wide uppercase"
                        >
                            {t('edms.dashboard.sections.documentsExpiring')}
                        </h2>
                    </div>
                    <span
                        className="text-xs font-mono font-bold text-[#8C6046] dark:text-amber-400"
                        dir="ltr"
                    >
                        {expiringDocuments.length} / {totalDocuments}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5]/70 dark:bg-slate-800/40 border-b border-[#EFECE6] dark:border-slate-800 text-[11px] font-semibold text-[#6E6862] dark:text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-6 text-start">
                                    {t('edms.dashboard.labels.documentCode')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('edms.dashboard.labels.documentTitle')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('edms.dashboard.labels.category')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('edms.dashboard.labels.type')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('edms.dashboard.labels.company')}
                                </th>
                                <th className="py-3 px-4 text-start">
                                    {t('edms.dashboard.labels.expiryDate')}
                                </th>
                                <th className="py-3 px-6 text-end">
                                    {t('edms.dashboard.labels.remaining')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFECE6] dark:divide-slate-800 text-xs">
                            {expiringDocuments.map((doc) => {
                                const isUrgent = doc.daysUntilExpiry <= 15;
                                const isWarning = doc.daysUntilExpiry > 15 && doc.daysUntilExpiry <= 30;
                                const progressWidth = Math.max(
                                    10,
                                    Math.min(100, Math.round(((60 - doc.daysUntilExpiry) / 60) * 100))
                                );

                                return (
                                    <tr
                                        key={doc.id}
                                        className="hover:bg-[#FAF8F5]/80 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="py-3 px-6 whitespace-nowrap">
                                            <span
                                                className="font-mono font-semibold text-[#2D3F2C] dark:text-emerald-300"
                                                dir="ltr"
                                            >
                                                {doc.id}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-[#0D0D0D] dark:text-slate-100">
                                                {isAr ? doc.titleAr : doc.titleEn}
                                            </div>
                                            <div className="text-[11px] text-[#6E6862] dark:text-slate-400 mt-0.5">
                                                {isAr ? doc.holderNameAr : doc.holderNameEn}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF8F5] dark:bg-slate-800 text-[#2D3F2C] dark:text-slate-200 border border-[#E5E0D8] dark:border-slate-700">
                                                {isAr ? doc.categoryAr : doc.categoryEn}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-[#0D0D0D] dark:text-slate-200 font-medium">
                                            {isAr ? doc.typeAr : doc.typeEn}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap text-[#595550] dark:text-slate-300">
                                            {isAr ? doc.companyAr : doc.companyEn}
                                        </td>
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <span
                                                className="font-mono text-[#0D0D0D] dark:text-slate-200"
                                                dir="ltr"
                                            >
                                                {doc.expiryDate}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 whitespace-nowrap text-end">
                                            <div className="inline-flex items-center justify-end gap-2.5">
                                                <div
                                                    className="w-16 bg-[#FAF8F5] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-[#E5E0D8] dark:border-slate-700 hidden sm:block"
                                                    dir="ltr"
                                                >
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            isUrgent
                                                                ? 'bg-[#8C6046]'
                                                                : isWarning
                                                                ? 'bg-[#BFAB93]'
                                                                : 'bg-[#6A7358]'
                                                        }`}
                                                        style={{ width: `${progressWidth}%` }}
                                                    />
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                                                        isUrgent
                                                            ? 'bg-[#8C6046]/15 text-[#8C6046] dark:text-amber-300'
                                                            : isWarning
                                                            ? 'bg-[#BFAB93]/25 text-[#595550] dark:text-slate-200'
                                                            : 'bg-[#2D3F2C]/10 text-[#2D3F2C] dark:text-emerald-300'
                                                    }`}
                                                    dir="ltr"
                                                >
                                                    {t('edms.dashboard.labels.daysRemaining', {
                                                        count: doc.daysUntilExpiry,
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Sections 2 & 3: Documents By Category & Documents By Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 2: Documents By Category */}
                <section
                    aria-labelledby="edms-section-by-category"
                    className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FolderKanban size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="edms-section-by-category"
                                className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 tracking-wide uppercase"
                            >
                                {t('edms.dashboard.sections.documentsByCategory')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C] dark:text-emerald-300"
                            dir="ltr"
                        >
                            {t('edms.dashboard.labels.categoriesCount', {
                                count: categoryData.length,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                            {/* Donut Chart */}
                            <div className="h-56 w-56 relative shrink-0" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={58}
                                            outerRadius={86}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="name"
                                        >
                                            {categoryData.map((entry) => (
                                                <Cell key={entry.key} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0D0D0D',
                                                borderColor: '#2D3F2C',
                                                borderRadius: '8px',
                                                color: '#FAF8F5',
                                                fontSize: '12px',
                                            }}
                                            formatter={(value: any, name: any) => [
                                                `${value} (${((Number(value) / totalDocuments) * 100).toFixed(1)}%)`,
                                                name,
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span
                                        className="text-xl font-bold font-mono text-[#0D0D0D] dark:text-slate-100"
                                        dir="ltr"
                                    >
                                        {totalDocuments}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-[#6E6862] dark:text-slate-400 tracking-wider">
                                        {t('edms.dashboard.labels.documents')}
                                    </span>
                                </div>
                            </div>

                            {/* Category Breakdown List */}
                            <div className="w-full sm:w-auto flex-1 space-y-3">
                                {categoryData.map((cat) => (
                                    <div
                                        key={cat.key}
                                        className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-slate-800/60 border border-[#E5E0D8] dark:border-slate-700/80 text-start"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span className="text-xs font-bold text-[#0D0D0D] dark:text-slate-100">
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <span
                                                className="text-xs font-mono font-bold text-[#2D3F2C] dark:text-emerald-300"
                                                dir="ltr"
                                            >
                                                {cat.percent}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div
                                                className="flex-1 bg-white dark:bg-slate-900 rounded-full h-1.5 overflow-hidden border border-[#E5E0D8] dark:border-slate-700"
                                                dir="ltr"
                                            >
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${cat.percent}%`,
                                                        backgroundColor: cat.color,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-sm font-bold font-mono text-[#0D0D0D] dark:text-slate-100 w-7 text-end"
                                                dir="ltr"
                                            >
                                                {cat.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Documents By Type */}
                <section
                    aria-labelledby="edms-section-by-type"
                    className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListFilter size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="edms-section-by-type"
                                className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 tracking-wide uppercase"
                            >
                                {t('edms.dashboard.sections.documentsByType')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C] dark:text-emerald-300"
                            dir="ltr"
                        >
                            {t('edms.dashboard.labels.typesCount', {
                                count: typeData.length,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="h-56 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={typeData}
                                    margin={{ top: 10, right: 15, left: -15, bottom: 35 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={48}
                                    />
                                    <YAxis
                                        domain={[0, 10]}
                                        ticks={[0, 2, 4, 6, 8, 10]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [
                                            `${val} ${t('edms.dashboard.labels.documents')}`,
                                            t('edms.dashboard.labels.type'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#2D3F2C"
                                        radius={[4, 4, 0, 0]}
                                        barSize={22}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* All 8 Document Types breakdown list */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-start">
                            {typeData.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center justify-between text-xs py-0.5"
                                >
                                    <span className="text-[#0D0D0D] dark:text-slate-200 font-medium truncate pe-2">
                                        {item.name}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0" dir="ltr">
                                        <span className="text-[11px] font-mono text-[#6E6862] dark:text-slate-400">
                                            {item.percent}%
                                        </span>
                                        <span className="font-mono font-bold text-[#0D0D0D] dark:text-slate-100 w-5 text-end">
                                            {item.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Sections 4 & 5: Company Wise Documents & Company Wise Business Documents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section 4: Company Wise Documents */}
                <section
                    aria-labelledby="edms-section-company-wise"
                    className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="edms-section-company-wise"
                                className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 tracking-wide uppercase"
                            >
                                {t('edms.dashboard.sections.companyWiseDocuments')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#2D3F2C] dark:text-emerald-300"
                            dir="ltr"
                        >
                            {t('edms.dashboard.labels.totalDocuments', {
                                count: totalDocuments,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="h-60 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={companyWiseData}
                                    margin={{ top: 10, right: 15, left: -15, bottom: 35 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={48}
                                    />
                                    <YAxis
                                        domain={[0, 12]}
                                        ticks={[0, 2, 4, 6, 8, 10, 12]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [
                                            `${val} ${t('edms.dashboard.labels.documents')}`,
                                            t('edms.dashboard.sections.companyWiseDocuments'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#2D3F2C',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#2D3F2C"
                                        radius={[4, 4, 0, 0]}
                                        barSize={26}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown summary */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] dark:border-slate-800 space-y-2 text-start">
                            {companyWiseData.map((comp) => (
                                <div
                                    key={comp.companyId}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="text-[#0D0D0D] dark:text-slate-200 font-medium truncate max-w-[220px]">
                                        {comp.name}
                                    </span>
                                    <div className="flex items-center gap-3" dir="ltr">
                                        <span className="text-[11px] font-mono text-[#6E6862] dark:text-slate-400 w-10 text-end">
                                            {comp.percent}%
                                        </span>
                                        <div className="w-24 bg-[#FAF8F5] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-[#E5E0D8] dark:border-slate-700">
                                            <div
                                                className="bg-[#2D3F2C] h-full rounded-full"
                                                style={{
                                                    width: `${(comp.count / 10) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] dark:text-slate-100 w-6 text-end">
                                            {comp.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: Company Wise Business Documents */}
                <section
                    aria-labelledby="edms-section-company-business"
                    className="bg-white dark:bg-slate-900 border border-[#E5E0D8] dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden"
                >
                    <div className="bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E5E0D8] dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Briefcase size={15} className="text-[#857E74] shrink-0" />
                            <h2
                                id="edms-section-company-business"
                                className="text-xs font-semibold text-[#0D0D0D] dark:text-slate-100 tracking-wide uppercase"
                            >
                                {t('edms.dashboard.sections.companyWiseBusinessDocuments')}
                            </h2>
                        </div>
                        <span
                            className="text-xs font-mono font-bold text-[#6A7358] dark:text-emerald-300"
                            dir="ltr"
                        >
                            {t('edms.dashboard.labels.totalBusinessDocs', {
                                count: businessDocumentsTotal,
                            })}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="h-60 w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={companyWiseBusinessData}
                                    margin={{ top: 10, right: 15, left: -15, bottom: 35 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#EFECE6"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        angle={-25}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: '#6E6862', fontSize: 10 }}
                                        height={48}
                                    />
                                    <YAxis
                                        domain={[0, 6]}
                                        ticks={[0, 1, 2, 3, 4, 5, 6]}
                                        tick={{ fill: '#6E6862', fontSize: 11 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8F6F2' }}
                                        formatter={(val: any) => [
                                            `${val} ${t('edms.dashboard.labels.businessDocuments')}`,
                                            t('edms.dashboard.sections.companyWiseBusinessDocuments'),
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#0D0D0D',
                                            borderColor: '#6A7358',
                                            borderRadius: '8px',
                                            color: '#FAF8F5',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#6A7358"
                                        radius={[4, 4, 0, 0]}
                                        barSize={26}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown summary */}
                        <div className="mt-4 pt-4 border-t border-[#EFECE6] dark:border-slate-800 space-y-2 text-start">
                            {companyWiseBusinessData.map((comp) => (
                                <div
                                    key={comp.companyId}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="text-[#0D0D0D] dark:text-slate-200 font-medium truncate max-w-[220px]">
                                        {comp.name}
                                    </span>
                                    <div className="flex items-center gap-3" dir="ltr">
                                        <span className="text-[11px] font-mono text-[#6E6862] dark:text-slate-400 w-10 text-end">
                                            {comp.percent}%
                                        </span>
                                        <div className="w-24 bg-[#FAF8F5] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-[#E5E0D8] dark:border-slate-700">
                                            <div
                                                className="bg-[#6A7358] h-full rounded-full"
                                                style={{
                                                    width: `${(comp.count / 5) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="font-mono font-bold text-[#0D0D0D] dark:text-slate-100 w-6 text-end">
                                            {comp.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
