import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layers, FileText, Globe, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const HomePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6 text-start">
            {/* Welcome Banner */}
            <div className="bg-[#2D3F2C] rounded-xl p-6 text-[#FAF8F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border border-[#3E553D]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C2A46D] mb-1">
                        {t('common.platformTitle')}
                    </p>
                    <h1 className="text-2xl font-bold text-[#FAF8F5]">
                        {t('common.welcome')}، {user?.fullName || t('common.systemAdmin')}
                    </h1>
                    <p className="text-sm text-[#D6CFC4] mt-1">
                        {t('common.platformSubtitle')}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/service')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FAF8F5] text-[#2D3F2C] text-sm font-semibold rounded-lg hover:bg-[#EFECE6] transition cursor-pointer shadow-xs"
                >
                    <span>{t('home.goToServiceManagement')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
            </div>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">{t('home.availableServices')}</p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">130</p>
                        <span className="text-[11px] text-[#265938] font-medium mt-1 inline-block">
                            {t('home.activeAcrossPortals')}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-[#EAF3EC] text-[#2D3F2C] flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">{t('home.activePortals')}</p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">12</p>
                        <span className="text-[11px] text-[#6E6862] font-medium mt-1 inline-block">
                            {t('home.portalsSample')}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-[#EFECE6] text-[#45413C] flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">{t('home.pendingRequests')}</p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">24</p>
                        <span className="text-[11px] text-[#B87D14] font-medium mt-1 inline-block">
                            {t('home.inProcessing')}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-[#FDF5E6] text-[#B87D14] flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-[#6E6862]">{t('home.documentTemplates')}</p>
                        <p className="text-2xl font-bold text-[#0D0D0D] mt-1">48</p>
                        <span className="text-[11px] text-[#265938] font-medium mt-1 inline-block">
                            {t('home.readyForIssuance')}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-[#EAF3EC] text-[#265938] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-2xs">
                <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider mb-4">
                    {t('home.quickAccess')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => navigate('/service')}
                        className="flex items-start gap-3.5 p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#2D3F2C] hover:bg-white transition text-start cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#2D3F2C] text-white flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#2D3F2C]">
                                {t('home.servicesCatalog')}
                            </h3>
                            <p className="text-xs text-[#6E6862] mt-1">
                                {t('home.servicesCatalogDesc')}
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/service')}
                        className="flex items-start gap-3.5 p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#2D3F2C] hover:bg-white transition text-start cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#6A7358] text-white flex items-center justify-center shrink-0">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#2D3F2C]">
                                {t('home.servicePortals')}
                            </h3>
                            <p className="text-xs text-[#6E6862] mt-1">
                                {t('home.servicePortalsDesc')}
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/service')}
                        className="flex items-start gap-3.5 p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#2D3F2C] hover:bg-white transition text-start cursor-pointer group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#45413C] text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#2D3F2C]">
                                {t('home.categoriesAndTypes')}
                            </h3>
                            <p className="text-xs text-[#6E6862] mt-1">
                                {t('home.categoriesAndTypesDesc')}
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
