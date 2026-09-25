import { create } from 'zustand';
import { 
  getResolvedBrandLogo, 
  isValidBrandLogo, 
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
  applySettingsOptimistically: (newSettings: Partial<SystemSettings>) => void;
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

  const resolvedHero = getResolvedBrandLogo(base.heroLogo) || undefined;
  const resolvedReg = getResolvedBrandLogo(base.registrationLogo) || undefined;
  const resolvedLogin = getResolvedBrandLogo(base.loginLogo) || undefined;

  return {
    ...base,
    heroLogo: resolvedHero,
    registrationLogo: resolvedReg,
    loginLogo: resolvedLogin,
  };
};

const getInitialFrontendSettings = (): FrontendSettings => {
  try {
    if (typeof window === 'undefined') return enrichFrontendSettings(null);
    const staticLogo = getSuperAdminStaticLogo();
    const stored = localStorage.getItem('medcore_frontend_settings');
    const parsed = stored ? JSON.parse(stored) : {};
    
    if (staticLogo && isValidBrandLogo(staticLogo)) {
      parsed.heroLogo = staticLogo;
      parsed.registrationLogo = staticLogo;
      parsed.loginLogo = staticLogo;
    } else if (parsed.heroLogo && isValidBrandLogo(parsed.heroLogo)) {
      // keep stored logo
    } else {
      parsed.heroLogo = undefined;
      parsed.registrationLogo = undefined;
      parsed.loginLogo = undefined;
    }
    
    return enrichFrontendSettings(parsed);
  } catch {
    return enrichFrontendSettings(null);
  }
};

// Resilient JSON fetch helper with retry and graceful fallback
async function fetchSafeJson<T>(url: string, retries = 2, delayMs = 600): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        return (await res.json()) as T;
      }
      if (attempt < retries && (res.status >= 500 || res.status === 404)) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      return null;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      return null;
    }
  }
  return null;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: getInitialSettings(),
  frontendSettings: getInitialFrontendSettings(),
  isLoading: true,
  isUploadingGlobal: false,
  globalUploadProgress: 0,
  globalUploadStatus: '',

  fetchSettings: async () => {
    try {
      // Concurrently and safely fetch system settings and frontend settings with retries
      const [rawSysData, rawFrontData] = await Promise.all([
        fetchSafeJson<any>('/api/settings', 2, 700),
        fetchSafeJson<any>('/api/settings/frontend', 2, 700)
      ]);
      
      let sysData = rawSysData;
      let frontData = rawFrontData ? enrichFrontendSettings(rawFrontData) : null;

      if (sysData) {
        try {
          localStorage.setItem('medcore_system_settings', JSON.stringify(sysData));
        } catch {
          // ignore storage error
        }
      }

      if (frontData && rawFrontData) {
        // Static persistence check: ensure genuine uploaded logo is kept in storage
        const staticLogo = getSuperAdminStaticLogo();
        const serverHasValidLogo = rawFrontData?.heroLogo && isValidBrandLogo(rawFrontData.heroLogo);

        if (serverHasValidLogo) {
          setSuperAdminStaticLogo(rawFrontData.heroLogo);
          frontData.heroLogo = rawFrontData.heroLogo;
          frontData.registrationLogo = rawFrontData.heroLogo;
          frontData.loginLogo = rawFrontData.heroLogo;
        } else if (staticLogo && isValidBrandLogo(staticLogo)) {
          // Keep static logo active across refreshes/reloads
          frontData.heroLogo = staticLogo;
          frontData.registrationLogo = staticLogo;
          frontData.loginLogo = staticLogo;
        } else {
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
      // Retain existing cached settings gracefully without breaking application flow
      set({ 
        settings: get().settings,
        frontendSettings: get().frontendSettings,
        isLoading: false 
      });
    }
  },

  applySettingsOptimistically: (newSettings: Partial<SystemSettings>) => {
    const current = get().settings;
    if (current) {
      const updated = { ...current, ...newSettings } as SystemSettings;
      set({ settings: updated });
      try {
        localStorage.setItem('medcore_system_settings', JSON.stringify(updated));
      } catch {}
    }
  },

  updateSettings: async (token: string, newSettings: Partial<SystemSettings>) => {
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      
      // Optimistically apply immediately across all components and local storage
      const current = get().settings;
      if (current) {
        const optimistic = { ...current, ...newSettings } as SystemSettings;
        set({ settings: optimistic });
        try {
          localStorage.setItem('medcore_system_settings', JSON.stringify(optimistic));
        } catch {}
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
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
