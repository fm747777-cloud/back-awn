import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/authSchema';
import { authApi } from '../api/api';
import { useAuthStore } from '../store/useAuthStore';
import { focusAndScrollToFirstError } from '../utils/formValidation';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: 'karim.wagdi@awn.sa',
      password: 'password123',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth({
        token: data.access_token,
        user: data?.user,
      });

      toast.success(`مرحباً بك ${data?.user?.fullName || 'user name'}`);
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8F6F2] font-sans text-[#0D0D0D] dir-ltr" dir="ltr">
      {/* Left: Poster & Slogan Section */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0D0D0D] relative overflow-hidden flex-col justify-between p-12 text-[#FAF8F5] select-none border-r border-[#1C1A17]">
        {/* Subtle geometric pattern background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <div className="w-[640px] h-[640px] rounded-full border-[40px] border-[#2D3F2C] -translate-x-24 -translate-y-16"></div>
          <div className="absolute top-12 right-16 w-48 h-48 rounded-full border-[16px] border-[#BFAB93]/30"></div>
          <div className="absolute bottom-16 left-12 w-32 h-32 rounded-full border-[8px] border-[#6A7358]/30"></div>
        </div>

        {/* Top badge */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/40 flex items-center justify-center shadow-xs">
            <span className="text-sm font-black text-[#BFAB93]">ع</span>
          </div>
          <span className="text-xs font-semibold tracking-[0.2em] text-[#BFAB93] uppercase">
            AWN ADMINISTRATIVE PLATFORM
          </span>
        </div>

        {/* Center Headline */}
        <div className="relative z-10 max-w-xl pl-4 space-y-4">
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.25] text-[#FAF8F5]">
            GOVERNMENT &
            <br />
            ENTERPRISE SERVICES
            <br />
            OPERATIONS WITH <span className="text-[#BFAB93]">AWN</span>
          </h1>
          <p className="text-sm text-[#9C958C] font-normal leading-relaxed max-w-md">
            Unifying digital workflows, service governance, and administrative operations in one sovereign platform.
          </p>
        </div>

        {/* Bottom footer quote */}
        <div className="relative z-10 text-xs text-[#6E6862] flex items-center justify-between border-t border-white/10 pt-4">
          <span>Enterprise Edition v2.6</span>
          <span className="font-medium text-[#BFAB93]">Kingdom of Saudi Arabia</span>
        </div>
      </div>

      {/* Right: Form Section */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-[#F8F6F2]">
        {/* Top Header - Logo */}
        <div className="flex justify-end pt-2">
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight text-[#0D0D0D] flex items-center justify-end">
                <span>عـون</span>
              </div>
              <div className="text-[10px] font-bold tracking-[0.25em] text-[#6A7358] uppercase">
                AWN
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#2D3F2C] border border-[#BFAB93]/40 flex items-center justify-center">
              <span className="text-xs font-black text-[#BFAB93]">ع</span>
            </div>
          </div>
        </div>

        {/* Center - Form Content */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] tracking-tight">
              Sign In to AWN
            </h2>
            <p className="text-[#6E6862] text-xs mt-1.5 font-normal">
              Enter your corporate credentials to access administrative services.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit, (formErrors) =>
              focusAndScrollToFirstError(formErrors, ['email', 'password'])
            )}
            className="space-y-5"
          >
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#0D0D0D] mb-1.5">
                Email Address <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#857E74]">
                  <User size={16} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="karim.wagdi@awn.sa"
                  className={`w-full bg-white border rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-2 transition shadow-2xs ${
                    errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-[#DCD6CD] focus:border-[#2D3F2C] focus:ring-[#2D3F2C]/15'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#0D0D0D]">
                  Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#2D3F2C] hover:text-[#0D0D0D] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#857E74]">
                  <Lock size={16} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-[#DCD6CD] focus:border-[#2D3F2C] rounded-lg pl-10 pr-10 py-2.5 text-xs text-[#0D0D0D] placeholder:text-[#857E74] focus:outline-none focus:ring-2 focus:ring-[#2D3F2C]/15 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#857E74] hover:text-[#0D0D0D] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-600 text-xs mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[#2D3F2C] hover:bg-[#233222] active:bg-[#1C271B] disabled:opacity-70 text-[#FAF8F5] font-semibold px-6 py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer - Copyright */}
        <div className="text-center pb-2">
          <p className="text-[11px] font-medium text-[#6E6862]">
            © 2026 AWN Administrative Platform. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};