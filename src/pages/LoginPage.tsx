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
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-800 dir-ltr" dir="ltr">
      {/* 🟢 الجزء الأيسر: Poster & Slogan Section */}
      <div className="hidden lg:flex lg:w-[60%] bg-[#126b71] relative overflow-hidden flex-col justify-center p-12 text-white select-none">
        {/* خلفية وهمية نمطية (Awn Logo Pattern Background) */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full border-[60px] border-white/20 -translate-x-32 -translate-y-20"></div>
          <div className="absolute top-10 right-20 w-40 h-40 rounded-full border-[20px] border-white/20"></div>
        </div>

        {/* النص الرئيسي */}
        <div className="relative z-10 max-w-2xl pl-8 space-y-4">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-wide uppercase leading-[1.3]">
            UNLOCK THE FULL
            <br />
            POTENTIAL OF YOUR
            <br />
            BUSINESS WITH <span className="text-[#c19b49]">AWN</span>
          </h1>
        </div>
      </div>

      {/* ⚪ الجزء الأيمن: Form Section */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-white">
        {/* Top Header - Logo */}
        <div className="flex justify-end pt-2">
          <div className="flex items-center gap-2">
            {/* يمكنك استبدال هذا المكون بصورة اللوجو الحقيقية <img src="/logo.png" alt="AWN" className="h-14" /> */}
            <div className="text-right">
              <div className="text-3xl font-extrabold tracking-tight text-[#126b71] flex items-center justify-end gap-1">
                <span>عـون</span>
              </div>
              <div className="text-xs font-bold tracking-[0.25em] text-[#126b71] uppercase">
                AWN
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl border-4 border-[#126b71] border-t-transparent flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#126b71] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Center - Form Content */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome To AWN....!
            </h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Please enter your login details to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Email ID
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="karim.wagdi@awn.sa"
                  className="w-full bg-[#ebf3fe] border border-[#a8c6fa] focus:border-[#126b71] rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition shadow-sm"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#126b71] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-[#ebf3fe] border border-transparent focus:border-[#126b71] rounded-xl pl-11 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="bg-[#c19b49] hover:bg-[#b08b3c] active:bg-[#9d7a31] disabled:opacity-70 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login Now</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer - Copyright */}
        <div className="text-center pb-2">
          <p className="text-[11px] font-medium text-slate-500">
            © 2026 AWN. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};