import { db } from '../../db/index.js';
import { students, systemSettings } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export interface CoinPackageConfig {
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

export const DEFAULT_COIN_PACKAGES: CoinPackageConfig[] = [
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

export async function getSystemCoinPackages(): Promise<CoinPackageConfig[]> {
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global_settings')).limit(1);
    if (settings.length > 0 && settings[0].coinPackages) {
      const parsed = JSON.parse(settings[0].coinPackages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading coin packages from settings:', err);
  }
  return DEFAULT_COIN_PACKAGES;
}

export async function syncAndFormatStudent(student: any) {
  if (!student) return student;

  let daysRemaining = 0;
  let hoursRemaining = 0;
  let isExpired = true;
  let expiryMs: number | null = null;

  if (student.accessExpiryDate) {
    if (student.accessExpiryDate instanceof Date) {
      const ms = student.accessExpiryDate.getTime();
      if (!isNaN(ms)) expiryMs = ms;
    } else if (typeof student.accessExpiryDate === 'number') {
      expiryMs = student.accessExpiryDate < 1e11 ? student.accessExpiryDate * 1000 : student.accessExpiryDate;
    } else if (typeof student.accessExpiryDate === 'string') {
      const parsed = Date.parse(student.accessExpiryDate);
      if (!isNaN(parsed)) expiryMs = parsed;
    }
  }

  // If no valid timestamp could be parsed from accessExpiryDate
  if (expiryMs === null || isNaN(expiryMs)) {
    const rawDays = typeof student.accessDaysRemaining === 'number' && !isNaN(student.accessDaysRemaining)
      ? student.accessDaysRemaining
      : 7;

    if (rawDays > 0) {
      daysRemaining = rawDays;
      hoursRemaining = rawDays * 24;
      isExpired = false;
      const calculatedExpiry = new Date(Date.now() + rawDays * 24 * 60 * 60 * 1000);
      student.accessExpiryDate = calculatedExpiry.toISOString();
      try {
        await db.update(students).set({ 
          accessExpiryDate: calculatedExpiry,
          accessDaysRemaining: daysRemaining
        }).where(eq(students.id, student.id));
      } catch (e) {
        console.warn('Could not sync fixed expiry date:', e);
      }
    } else {
      daysRemaining = 0;
      hoursRemaining = 0;
      isExpired = true;
    }
  } else {
    const nowMs = Date.now();
    const diffMs = expiryMs - nowMs;

    if (diffMs > 0) {
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
      isExpired = false;
    } else {
      daysRemaining = 0;
      hoursRemaining = 0;
      isExpired = true;
    }

    // Update DB if cached accessDaysRemaining differs from accurate countdown
    if (student.accessDaysRemaining !== daysRemaining && student.id) {
      try {
        await db.update(students).set({ accessDaysRemaining: daysRemaining }).where(eq(students.id, student.id));
        student.accessDaysRemaining = daysRemaining;
      } catch (e) {
        console.error('Failed to sync student accessDaysRemaining:', e);
      }
    }
  }

  return {
    ...student,
    accessDaysRemaining: daysRemaining,
    accessHoursRemaining: hoursRemaining,
    isExpired
  };
}
