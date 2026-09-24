import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldAlert, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import GlobalBrandLogo from '../../components/shared/GlobalBrandLogo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SuperAdminLogin() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { settings } = useSettingsStore();

  const siteTitle = settings?.siteTitle || 'Medcore Academy';

  const from = (location.state as any)?.from?.pathname || '/super-admin';

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
          expectedRole: 'SUPER_ADMIN',
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
        throw new Error(result?.error || 'Invalid Super Administrator credentials. Please check your email and security key.');
      }

      if (result.user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access strictly required');
      }

      setAuth(result.token, result.user, result.studentData);
      
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/90 to-black"></div>
      <div className="absolute top-8 left-8 z-10">
        <Link to="/" className="flex items-center text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to safety
        </Link>
      </div>
      <div className="max-w-md w-full space-y-8 bg-zinc-950/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-zinc-800 z-10 relative">
        <div className="absolute -top-4 -right-4">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </span>
        </div>
        
        <div>
          <div className="flex justify-center">
            <GlobalBrandLogo 
              className="h-16 w-16"
              imageClassName="h-16 w-auto max-w-full object-contain"
              fallbackIcon={ShieldAlert}
              fallbackClassName="h-8 w-8 text-purple-400"
              variant="superadmin"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            System Control
          </h2>
          <p className="mt-2 text-center text-sm font-mono text-purple-400/80">
            [{siteTitle.toUpperCase()}_SUPER_ADMIN]
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate>
          {error && (
            <div className="bg-red-950/80 border border-red-900 rounded-xl p-4 flex items-start backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-[0.2em]" htmlFor="email">
                Identity Sequence
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  className={`appearance-none block w-full px-4 py-3 bg-black/40 border ${errors.email ? 'border-red-500/50 focus:ring-red-500/50' : 'border-zinc-800/80 focus:ring-purple-500/50 focus:border-purple-500/50'} rounded-xl text-white placeholder-zinc-700 focus:outline-none sm:text-sm font-mono transition-all duration-300 group-hover:border-zinc-700`}
                  placeholder="admin@system.local"
                  {...register('email')}
                />
                <div className="absolute inset-0 rounded-xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-[10px] text-red-500 font-mono uppercase tracking-tight">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-[0.2em]" htmlFor="password">
                Security Key
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`appearance-none block w-full px-4 py-3 pr-11 bg-black/40 border ${errors.password ? 'border-red-500/50 focus:ring-red-500/50' : 'border-zinc-800/80 focus:ring-purple-500/50 focus:border-purple-500/50'} rounded-xl text-white placeholder-zinc-700 focus:outline-none sm:text-sm font-mono transition-all duration-300 group-hover:border-zinc-700`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-purple-400 focus:outline-none cursor-pointer z-10"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <div className="absolute inset-0 rounded-xl bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[10px] text-red-500 font-mono uppercase tracking-tight">{errors.password.message}</p>
              )}
            </div>
          </motion.div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Authorizing...' : 'Initialize Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
