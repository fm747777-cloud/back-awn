import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export const ErrorPage = () => {
    const { t } = useTranslation();
    const error = useRouteError();

    let errorMessage = t('errorPage.unexpectedError');
    let errorStatus = '404';

    if (isRouteErrorResponse(error)) {
        errorStatus = `${error.status}`;
        errorMessage = error.statusText || error.data?.message || errorMessage;
    } else if (error instanceof Error) {
        errorStatus = t('common.failed');
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-6">
            <div className="max-w-md w-full bg-white border border-[#E5E0D8] rounded-2xl p-8 text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-[#FCF2F2] border border-[#F2C6C6] text-[#B83232] flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-7 h-7" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#B83232] mb-1" dir="ltr">
                    {errorStatus}
                </p>
                <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">
                    {t('errorPage.somethingWentWrong')}
                </h1>
                <p className="text-sm text-[#6E6862] mb-6 leading-relaxed">
                    {errorMessage}
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2D3F2C] hover:bg-[#1F2C1E] text-[#FAF8F5] text-sm font-medium rounded-lg transition shadow-xs"
                >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    <span>{t('errorPage.returnToDashboard')}</span>
                </Link>
            </div>
        </div>
    );
};
