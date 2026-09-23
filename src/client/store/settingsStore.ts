import { create } from 'zustand';
import { 
  getResolvedBrandLogo, 
  isSuperAdminUploadedLogo, 
  getSuperAdminStaticLogo, 
  setSuperAdminStaticLogo 
} from '../constants/brandAssets';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  durationMonths: number;
  days: number;
  popular?: boolean;
  color?: string;
  text?: string;
  border?: string;
}

export const parseCoinPackages = (coinPackages: string | CoinPackage[] | undefined): CoinPackage[] => {
  if (!coinPackages) return [];
  if (Array.isArray(coinPackages)) return coinPackages;
  try {
    const parsed = JSON.parse(coinPackages);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const DEFAULT_PACKAGES: CoinPackage[] = [
  {
    id: 'pack-1000',
    name: 'Starter Clinical Pack',
    coins: 1000,
    price: 2000,
    durationMonths: 1,
    days: 30,
    popular: false,
    color: 'bg-zinc-50',
    text: 'text-zinc-900',
    border: 'border-zinc-200'
  },
  {
    id: 'pack-2500',
    name: 'Semester High-Yield Pack',
    coins: 2500,
    price: 4500,
    durationMonths: 2,
    days: 60,
    popular: true,
    color: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  {
    id: 'pack-5000',
    name: 'Board Master Comprehensive',
    coins: 5000,
    price: 8000,
    durationMonths: 3,
    days: 90,
    popular: false,
    color: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  }
];

interface SystemSettings {
  siteTitle: string;
  siteSubtitle: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultAccessDays: number;
  enableCoinPurchases: boolean;
  quizCoinCost?: number;
  showLeaderboard: boolean;
  adminCourseCreation: boolean;
  adminManualApprovals: boolean;
  adminViewAnalytics: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  paymentInstructions?: string;
  supportPhone?: string;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  enablePaystack: boolean;
  coinPackages?: string | CoinPackage[];
}

interface FrontendSettings {
  heroHeading: string;
  heroSubheading: string;
  heroButtonText: string;
  featuresHeading: string;
  featuresSubheading: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  heroLogo?: string;
  registrationLogo?: string;
  loginLogo?: string;
}

interface SettingsState {
  settings: SystemSettings | null;
  frontendSettings: FrontendSettings | null;
  isLoading: boolean;
  isUploadingGlobal: boolean;
  globalUploadProgress: number;
  globalUploadStatus: string;
  fetchSettings: () => Promise<void>;
  updateSettings: (token: string, newSettings: Partial<SystemSettings>) => Promise<boolean>;
  updateFrontendSettings: (token: string, newSettings: Partial<FrontendSettings> | FormData) => Promise<boolean>;
  uploadGlobalLogo: (token: string, file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
}

const getInitialSettings = (): SystemSettings | null => {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('medcore_system_settings');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const enrichFrontendSettings = (data: FrontendSettings | null): FrontendSettings => {
  const base = data || {
    id: 'default',
    heroHeading: 'Master Medicine with Medcore Precision',
    heroSubheading: 'Join thousands of medical students passing their exams with our precision-engineered mock tests and comprehensive resources.',
    heroButtonText: 'Start Free Mock Exam',
    featuresHeading: 'Why Choose Medcore?',
    featuresSubheading: 'Built specifically for medical students by top clinicians and educators.',
    primaryColor: '#dc2626',
    contactEmail: 'support@medcoreacademy.com',
    contactPhone: '+234 800 000 0000',
    heroLogo: undefined,
    registrationLogo: undefined,
    loginLogo: undefined,
  };

  const resolvedHero = getResolvedBrandLogo(base.heroLogo);
  const resolvedReg = getResolvedBrandLogo(base.registrationLogo);
  const resolvedLogin = getResolvedBrandLogo(base.loginLogo);

  return {
    ...base,
    heroLogo: resolvedHero || undefined,
    registrationLogo: resolvedReg || undefined,
    loginLogo: resolvedLogin || undefined,
  };
};

const getInitialFrontendSettings = (): FrontendSettings => {
  try {
    if (typeof window === 'undefined') return enrichFrontendSettings(null);
    const staticLogo = getSuperAdminStaticLogo();
    const stored = localStorage.getItem('medcore_frontend_settings');
    const parsed = stored ? JSON.parse(stored) : {};
    
    if (staticLogo && isSuperAdminUploadedLogo(staticLogo)) {
      parsed.heroLogo = staticLogo;
      parsed.registrationLogo = staticLogo;
      parsed.loginLogo = staticLogo;
    } else {
      if (!isSuperAdminUploadedLogo(parsed.heroLogo)) parsed.heroLogo = undefined;
      if (!isSuperAdminUploadedLogo(parsed.registrationLogo)) parsed.registrationLogo = undefined;
      if (!isSuperAdminUploadedLogo(parsed.loginLogo)) parsed.loginLogo = undefined;
    }
    
    return enrichFrontendSettings(parsed);
  } catch {
    return enrichFrontendSettings(null);
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: getInitialSettings(),
  frontendSettings: getInitialFrontendSettings(),
  isLoading: true,
  isUploadingGlobal: false,
  globalUploadProgress: 0,
  globalUploadStatus: '',

  fetchSettings: async () => {
    try {
      const [sysRes, frontRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/settings/frontend')
      ]);
      
      let sysData = null;
      let frontData = null;

      if (sysRes.ok) {
        sysData = await sysRes.json();
        try {
          localStorage.setItem('medcore_system_settings', JSON.stringify(sysData));
        } catch {
          // ignore storage error
        }
      }

      if (frontRes.ok) {
        const rawFrontData = await frontRes.json();
        frontData = enrichFrontendSettings(rawFrontData);
        
        // Static persistence check: ensure Super Admin uploaded logo stays even after reload
        const staticLogo = getSuperAdminStaticLogo();
        const serverHasValidLogo = rawFrontData?.heroLogo && isSuperAdminUploadedLogo(rawFrontData.heroLogo);

        if (serverHasValidLogo) {
          setSuperAdminStaticLogo(rawFrontData.heroLogo);
        } else if (staticLogo && isSuperAdminUploadedLogo(staticLogo)) {
          // Keep static logo active across refreshes/reloads
          frontData.heroLogo = staticLogo;
          frontData.registrationLogo = staticLogo;
          frontData.loginLogo = staticLogo;
        } else {
          // No super admin logo uploaded -> do not display any logo
          frontData.heroLogo = undefined;
          frontData.registrationLogo = undefined;
          frontData.loginLogo = undefined;
          setSuperAdminStaticLogo(null);
        }

        try {
          localStorage.setItem('medcore_frontend_settings', JSON.stringify(frontData));
        } catch {
          // ignore storage error
        }
      }

      // Preload the logo into cache if present
      const masterLogo = frontData?.heroLogo || frontData?.loginLogo || frontData?.registrationLogo;
      if (masterLogo && typeof window !== 'undefined') {
        const img = new Image();
        img.src = masterLogo;
      }

      set({ 
        settings: sysData || get().settings, 
        frontendSettings: frontData || get().frontendSettings,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (token: string, newSettings: Partial<SystemSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        const data = await response.json();
        try {
          localStorage.setItem('medcore_system_settings', JSON.stringify(data));
        } catch {
          // ignore
        }
        set({ settings: data });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  },

  updateFrontendSettings: async (token: string, newSettings: Partial<FrontendSettings> | FormData) => {
    try {
      const isFormData = newSettings instanceof FormData;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch('/api/settings/frontend', {
        method: 'PUT',
        headers,
        body: isFormData ? newSettings : JSON.stringify(newSettings)
      });
      
      if (response.ok) {
        const data = await response.json();
        try {
          localStorage.setItem('medcore_frontend_settings', JSON.stringify(data));
        } catch {
          // ignore
        }
        
        // Pre-decode logo image before committing to state so all components switch simultaneously
        const logoToPreload = data.heroLogo || data.loginLogo || data.registrationLogo;
        if (logoToPreload && typeof window !== 'undefined') {
          await new Promise((resolve) => {
            const img = new Image();
            img.src = logoToPreload;
            img.onload = () => {
              if (img.decode) {
                img.decode().then(resolve).catch(resolve);
              } else {
                resolve(true);
              }
            };
            img.onerror = () => resolve(true);
          });
        }

        set({ frontendSettings: data });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update frontend settings:', error);
      return false;
    }
  },

  uploadGlobalLogo: async (token: string, file: File) => {
    set({
      isUploadingGlobal: true,
      globalUploadProgress: 15,
      globalUploadStatus: 'Uploading master asset to server...'
    });

    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      const formData = new FormData();
      formData.append('logo', file);

      set({ globalUploadProgress: 45, globalUploadStatus: 'Processing and generating cloud/local assets...' });

      const headers: Record<string, string> = {
        'x-admin-request': 'true'
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/settings/global-logo', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload global logo');
      }

      set({ globalUploadProgress: 75, globalUploadStatus: 'Pre-decoding asset for synchronized display across all views...' });

      // Preload and decode in memory before updating state
      if (data.url && typeof window !== 'undefined') {
        await new Promise((resolve) => {
          const img = new Image();
          img.src = data.url;
          img.onload = () => {
            if (img.decode) {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve(true);
            }
          };
          img.onerror = () => resolve(true);
        });
      }

      if (typeof window !== 'undefined') {
        try {
          if (data.url) {
            setSuperAdminStaticLogo(data.url);
          }
          if (data.frontendSettings) {
            localStorage.setItem('medcore_frontend_settings', JSON.stringify(data.frontendSettings));
          }
        } catch {
          // ignore
        }
      }

      set({
        globalUploadProgress: 100,
        globalUploadStatus: 'Synchronized! Displaying everywhere simultaneously.',
        frontendSettings: data.frontendSettings,
        isUploadingGlobal: false
      });

      // Reset progress status after a short moment
      setTimeout(() => {
        set({ globalUploadProgress: 0, globalUploadStatus: '' });
      }, 3000);

      return { success: true, url: data.url };
    } catch (err: any) {
      console.error('Failed to upload global logo:', err);
      set({
        isUploadingGlobal: false,
        globalUploadProgress: 0,
        globalUploadStatus: `Error: ${err.message || 'Upload failed'}`
      });
      return { success: false, error: err.message || 'Upload failed' };
    }
  }
}));
