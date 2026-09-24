import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import GlobalBrandLogo from '../../components/shared/GlobalBrandLogo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { settings } = useSettingsStore();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const formatAuthError = (rawError: any): string => {
    if (!rawError) return '';
    const msg = String(rawError?.message || rawError || '').trim();
    if (
      msg.includes("Unexpected token '<'") ||
      msg.includes('is not valid JSON') ||
      msg.includes('not valid JSON') ||
      msg.includes('<html>') ||
      msg.includes('<hea') ||
      msg.includes('<!DOCTYPE') ||
      msg.includes('<!doctype')
    ) {
      return 'Authentication service temporarily busy. Please try again.';
    }
    return msg;
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
          expectedRole: 'ADMIN',
        }),
      });

      const rawText = await response.text();
      let result: any = null;
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Invalid administrator credentials. Please check your email and password.');
      }

      if (result.user.role !== 'ADMIN' && result.user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Admin access strictly required');
      }

      setAuth(result.token, result.user, result.studentData);
      
      if (result.user.role === 'SUPER_ADMIN') {
        navigate(from === '/admin' ? '/super-admin' : from, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to main site
        </Link>
      </div>
      <div className="max-w-md w-full space-y-8 bg-zinc-950 p-10 rounded-3xl shadow-2xl border border-zinc-800">
        <div>
          <div className="flex justify-center">
            <GlobalBrandLogo 
              className="h-16 w-16"
              imageClassName="h-16 w-auto max-w-full object-contain"
              fallbackIcon={ShieldCheck}
              fallbackClassName="h-8 w-8 text-blue-500"
              variant="admin"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Secure login for {settings?.siteTitle || 'Medcore Academy'} administrators
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate>
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="off"
                className={`appearance-none block w-full px-4 py-3 bg-zinc-900 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-blue-500 focus:border-blue-500'} rounded-xl text-white placeholder-zinc-500 focus:outline-none sm:text-sm transition-colors`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`appearance-none block w-full px-4 py-3 pr-11 bg-zinc-900 border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-blue-500 focus:border-blue-500'} rounded-xl text-white placeholder-zinc-500 focus:outline-none sm:text-sm transition-colors`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
