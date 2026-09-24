import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import GlobalBrandLogo from '../../components/shared/GlobalBrandLogo';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  institution: z.string().min(2, 'Institution is required'),
  department: z.string().min(2, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { settings, frontendSettings } = useSettingsStore();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError('');
      
      const payload = {
        ...data,
        email: data.email.trim().toLowerCase(),
        name: data.name.trim(),
        phone: data.phone.trim(),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let result: any = null;
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Registration temporarily unavailable. Please try again.');
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to register');
      }

      if (result.token && result.user) {
        setAuth(result.token, result.user, result.studentData);
      }

      setStudentId(result.studentId);
      setSuccess(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (settings && settings.allowRegistrations === false) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-sm border border-zinc-100">
          <div className="flex justify-center mb-4">
            <GlobalBrandLogo 
              className="h-14 w-14"
              imageClassName="h-14 w-auto max-w-full object-contain"
              variant="auth"
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Registrations Temporarily Paused</h2>
          <p className="text-zinc-600 mb-6 text-sm">
            Student account creation is currently closed by the academy administration. If you already have an account, you can sign in below.
          </p>
          <Link
            to="/login"
            className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-zinc-900 hover:bg-black transition-colors"
          >
            Sign In to Existing Account
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-grow flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-2xl shadow-sm border border-zinc-100">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">Registration Successful!</h2>
          <p className="text-zinc-600 mb-6">Your student account has been created. You have been granted {settings?.defaultAccessDays || 7} days of full free trial access.</p>
          
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-8">
            <p className="text-sm text-zinc-500 font-medium mb-1">Your Student ID</p>
            <p className="text-2xl font-bold text-zinc-900 font-mono tracking-wider">{studentId}</p>
            <p className="text-xs text-zinc-400 mt-2">Please save this ID for your academy records.</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Enter Student Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <Link
              to="/login"
              className="w-full flex justify-center py-2.5 px-4 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Proceed to Sign In Screen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center bg-zinc-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="flex justify-center">
          <GlobalBrandLogo 
            className="h-16 w-16"
            imageClassName="h-16 w-auto max-w-full object-contain"
            fallbackClassName="h-8 w-8 text-red-600"
            variant="auth"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
          Create Student Account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {/* Personal Info */}
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-200 pb-2 mb-4">Personal Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('phone')}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`appearance-none block w-full px-3 py-2 pr-10 border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 focus:outline-none cursor-pointer"
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
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Country</label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.country ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('country')}
                />
                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">State</label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.state ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('state')}
                />
                {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
              </div>

              {/* Academic Info */}
              <div className="sm:col-span-2 mt-4">
                <h3 className="text-lg font-medium text-zinc-900 border-b border-zinc-200 pb-2 mb-4">Academic Information</h3>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">Institution / University</label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.institution ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('institution')}
                />
                {errors.institution && <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Department / Course</label>
                <input
                  type="text"
                  autoComplete="off"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.department ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('department')}
                />
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Level / Year</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. 100 Level or Year 1"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.level ? 'border-red-300 focus:ring-red-500' : 'border-zinc-300 focus:ring-zinc-900'} rounded-lg shadow-sm sm:text-sm`}
                  {...register('level')}
                />
                {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
