import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, Globe } from 'lucide-react';

import { loginSchema, type LoginFormData } from '../schemas/authSchema';
import { authApi } from '../api/api';
import { useAuthStore } from '../store/useAuthStore';
import { translateError } from '../i18n';

export const LoginPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const isAr = i18n.language?.startsWith('ar');

    const setLanguage = (lang: 'en' | 'ar') => {
        if ((lang === 'ar' && !isAr) || (lang === 'en' && isAr)) {
            i18n.changeLanguage(lang);
        }
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            const response = await authApi.login(data);
            const token = response?.access_token;

            if (!token) {
                throw new Error('Authentication token missing from response');
            }

            const emailPrefix = data.email.split('@')[0];
            const userProfile = response?.user || {
                id: data.email,
                type: 'admin',
                fullName: emailPrefix,
            };
            setAuth({ token, user: userProfile });
            toast.success(t('login.welcomeBack', { name: userProfile.fullName }));
            navigate('/service');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } } };
            const errorMessage =
                err.response?.data?.message ||
                t('login.loginFailed');
            toast.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5] text-[#0D0D0D] text-start">
            {/* Top Subtle Brand Bar */}
            <header className="w-full px-8 py-5 flex items-center justify-between border-b border-[#E5E0D8] bg-white/80 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2D3F2C] flex items-center justify-center text-[#FAF8F5] font-bold text-lg shadow-xs">
                        ع
                    </div>
                    <div>
                        <span className="font-bold text-base tracking-wide text-[#0D0D0D]">
                            {t('common.awn')}
                        </span>
                        <span className="mx-2 text-[#D6CFC4]">|</span>
                        <span className="text-xs text-[#6E6862] font-medium">
                            {t('common.platformTitle')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-xs text-[#8C847A] font-medium">
                        {t('common.awnArabic')} — {t('nav.edmsModule')}
                    </div>
                    <div
                        role="group"
                        aria-label={isAr ? t('nav.switchLanguageToEn') : t('nav.switchLanguageToAr')}
                        dir="ltr"
                        className="inline-flex items-center p-0.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] shadow-2xs select-none"
                    >
                        <span className="flex items-center justify-center ps-2 pe-1 text-[#6E6862]">
                            <Globe size={13} strokeWidth={2} />
                        </span>
                        <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            aria-pressed={!isAr}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all cursor-pointer leading-none ${
                                !isAr
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-2xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4]/60'
                            }`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => setLanguage('ar')}
                            aria-pressed={isAr}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer leading-none ${
                                isAr
                                    ? 'bg-[#2D3F2C] text-[#FAF8F5] shadow-2xs'
                                    : 'text-[#6E6862] hover:text-[#0D0D0D] hover:bg-[#F0ECE4]/60'
                            }`}
                        >
                            عربي
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Centered Login Card */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-2xl shadow-lg overflow-hidden">
                    {/* Card Top Olive Accent Header */}
                    <div className="bg-[#2D3F2C] px-8 py-7 text-[#FAF8F5]">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3E553D] text-[#C2A46D] text-[11px] font-semibold uppercase tracking-wider mb-3">
                            {t('common.awnEnterprise')}
                        </div>
                        <h1 className="text-2xl font-bold text-[#FAF8F5]">
                            {t('login.signInTitle')}
                        </h1>
                        <p className="text-xs text-[#D6CFC4] mt-1.5 leading-relaxed">
                            {t('login.signInSubtitle')}
                        </p>
                    </div>

                    {/* Form Body */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="block text-xs font-semibold text-[#45413C] uppercase tracking-wider mb-2">
                                    {t('login.emailLabel')}
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-[#8C847A] absolute start-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        dir="ltr"
                                        placeholder="admin@awn.sa"
                                        {...register('email')}
                                        className={`w-full ps-10 pe-4 py-2.5 text-sm rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] placeholder-[#8C847A] outline-none transition text-start ${
                                            errors.email
                                                ? 'border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20'
                                                : 'border-[#D6CFC4] focus:border-[#2D3F2C] focus:bg-white focus:ring-2 focus:ring-[#2D3F2C]/15'
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[#B83232] text-xs mt-1.5">
                                        {translateError(t, errors.email.message)}
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-[#45413C] uppercase tracking-wider">
                                        {t('login.passwordLabel')}
                                    </label>
                                    <button
                                        type="button"
                                        className="text-xs text-[#2D3F2C] hover:underline font-medium"
                                    >
                                        {t('login.forgotPassword')}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-[#8C847A] absolute start-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        dir="ltr"
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className={`w-full ps-10 pe-4 py-2.5 text-sm rounded-lg border bg-[#FAF8F5] text-[#0D0D0D] placeholder-[#8C847A] outline-none transition text-start ${
                                            errors.password
                                                ? 'border-[#B83232] focus:ring-2 focus:ring-[#B83232]/20'
                                                : 'border-[#D6CFC4] focus:border-[#2D3F2C] focus:bg-white focus:ring-2 focus:ring-[#2D3F2C]/15'
                                        }`}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-[#B83232] text-xs mt-1.5">
                                        {translateError(t, errors.password.message)}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 px-4 bg-[#2D3F2C] hover:bg-[#1F2C1E] text-[#FAF8F5] font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                <span>{isLoading ? t('login.signingIn') : t('login.signInBtn')}</span>
                                {!isLoading && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full px-8 py-4 border-t border-[#E5E0D8] text-center sm:flex sm:items-center sm:justify-between text-xs text-[#8C847A]">
                <span>{t('login.copyright')}</span>
                <span className="mt-1 sm:mt-0 block">
                    {t('login.edition')} • {t('login.country')}
                </span>
            </footer>
        </div>
    );
};
