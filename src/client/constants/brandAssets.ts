/**
 * Official Brand Assets & Fallbacks for MedCore Academy (UNI9JA MEDIA).
 * Guaranteed to be available offline, during reloads, and across all pages with zero latency.
 */

// Static storage key ensuring Super Admin uploaded logos never delete on refresh or reload
export const SUPER_ADMIN_STATIC_LOGO_KEY = 'medcore_superadmin_uploaded_logo';

/**
 * Checks if a provided logo was genuinely uploaded by the Super Admin.
 * Strictly rejects:
 * - default hardcoded SVGs (/assets/brand/medcore-logo.svg)
 * - synthetic crest data URIs generated automatically
 * - dummy 1x1 test pixels
 * - null / undefined / empty values
 */
export function isSuperAdminUploadedLogo(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  
  // Strictly reject default system SVG emblems
  if (trimmed.includes('medcore-logo.svg') || trimmed.includes('/assets/brand/medcore-logo.svg')) {
    return false;
  }

  // Strictly reject synthetic crest signatures or default generated texts
  if (
    trimmed.includes('PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MDAgNjAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj4KICA8ZGVmcz4KICAgIDwhLS0gQ2xpcCBwYXRoIGZvciB0aGUgNCBxdWFkcmFudHMgaW5zaWRlIHRoZSBzaGllbGQgLS0+') ||
    trimmed.includes('UNI9JA MEDIA HUB') ||
    trimmed.includes('MEDCORE ACADEMY')
  ) {
    return false;
  }

  // Strictly reject known 1x1 transparent dummy pngs
  if (trimmed.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB') || trimmed.includes('AAAAABJRU5ErkJggg==')) {
    return false;
  }

  // Genuine uploaded images from Super Admin: Base64 data URI or uploaded path (/uploads/...) or URL
  if (trimmed.startsWith('data:image/')) {
    const parts = trimmed.split(',');
    return parts.length > 1 && parts[1].trim().length > 20;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed.length >= 6;
  }

  return false;
}

/**
 * Validates a brand logo URL.
 */
export function isValidBrandLogo(url: string | null | undefined): boolean {
  return isSuperAdminUploadedLogo(url);
}

/**
 * Static getter for Super Admin uploaded logo from browser storage.
 * Guarantees that the logo will stay and not delete when the website is refreshed or reloaded.
 */
export function getSuperAdminStaticLogo(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SUPER_ADMIN_STATIC_LOGO_KEY) || localStorage.getItem('medcore_master_logo');
    if (isSuperAdminUploadedLogo(stored)) {
      return stored;
    }
  } catch {}
  return null;
}

/**
 * Static setter for Super Admin uploaded logo in browser storage.
 */
export function setSuperAdminStaticLogo(logo: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (logo && isSuperAdminUploadedLogo(logo)) {
      localStorage.setItem(SUPER_ADMIN_STATIC_LOGO_KEY, logo);
      localStorage.setItem('medcore_master_logo', logo);
    } else {
      localStorage.removeItem(SUPER_ADMIN_STATIC_LOGO_KEY);
      localStorage.removeItem('medcore_master_logo');
    }
  } catch {}
}

/**
 * Resolves brand logo.
 * ONLY returns a logo if it was genuinely uploaded by Super Admin.
 * Returns null if no Super Admin logo has been uploaded.
 * NEVER displays or falls back to any un-uploaded logo!
 */
export function getResolvedBrandLogo(url: string | null | undefined): string | null {
  if (isSuperAdminUploadedLogo(url)) {
    return url as string;
  }
  // Check static persistent storage before returning null
  const staticLogo = getSuperAdminStaticLogo();
  if (staticLogo) {
    return staticLogo;
  }
  return null;
}

/**
 * Generates an instant, crisp anatomical/medical SVG thumbnail for courses
 * to guarantee that course cards never show broken image icons or disappear on refresh.
 */
export function getCourseFallbackImage(code?: string, title?: string): string {
  const safeCode = (code || 'MED').toUpperCase();
  const safeTitle = (title || 'Medical Course').toUpperCase();
  
  const isAnat = safeCode.includes('ANA') || safeTitle.includes('ANATOMY');
  const isPhys = safeCode.includes('PHS') || safeCode.includes('PHY') || safeTitle.includes('PHYSIOLOGY');
  const isPharm = safeCode.includes('PHA') || safeTitle.includes('PHARM');
  const isPath = safeCode.includes('PAT') || safeTitle.includes('PATHOLOGY');

  let accentColor = '%23dc2626'; // Red
  let badgeColor = '%23ef4444';
  let motif = 'ribs';

  if (isPhys) {
    accentColor = '%232563eb'; // Blue
    badgeColor = '%233b82f6';
    motif = 'ecg';
  } else if (isPharm) {
    accentColor = '%23059669'; // Emerald
    badgeColor = '%2310b981';
    motif = 'capsule';
  } else if (isPath) {
    accentColor = '%237c3aed'; // Purple
    badgeColor = '%238b5cf6';
    motif = 'cell';
  }

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%2318181b" />
        <stop offset="50%" stop-color="%2327272a" />
        <stop offset="100%" stop-color="%2309090b" />
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(%23bg)"/>
    
    <!-- Subtle Blueprint Grid -->
    <g stroke="%233f3f46" stroke-width="0.75" opacity="0.25">
      <line x1="0" y1="125" x2="800" y2="125" />
      <line x1="0" y1="250" x2="800" y2="250" />
      <line x1="0" y1="375" x2="800" y2="375" />
      <line x1="200" y1="0" x2="200" y2="500" />
      <line x1="400" y1="0" x2="400" y2="500" />
      <line x1="600" y1="0" x2="600" y2="500" />
    </g>

    <!-- Glowing Center Accent -->
    <circle cx="400" cy="230" r="130" fill="${accentColor}" opacity="0.12"/>
    
    <!-- Medical Silhouette Iconography -->
    <g fill="none" stroke="${badgeColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
      <!-- Cross / Spine Center -->
      <line x1="400" y1="130" x2="400" y2="330" stroke="%23ffffff" stroke-width="5" opacity="0.9"/>
      <path d="M 400 160 Q 330 180 300 230" />
      <path d="M 400 160 Q 470 180 500 230" />
      <path d="M 400 200 Q 320 220 280 270" />
      <path d="M 400 200 Q 480 220 520 270" />
      <path d="M 400 240 Q 310 260 270 320" />
      <path d="M 400 240 Q 490 260 530 320" />
    </g>
    
    <!-- Dynamic Heart / Pulse Node -->
    <circle cx="385" cy="205" r="22" fill="${accentColor}" opacity="0.95"/>
    <circle cx="385" cy="205" r="30" fill="none" stroke="%23fbbf24" stroke-width="2" opacity="0.8"/>

    <!-- Course Code Badge -->
    <rect x="40" y="40" width="130" height="38" rx="10" fill="${accentColor}" opacity="0.95"/>
    <text x="105" y="64" fill="%23ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" letter-spacing="2">${safeCode}</text>

    <!-- Course Title Label -->
    <text x="40" y="435" fill="%23ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="900" letter-spacing="1">${safeTitle}</text>
    <text x="40" y="462" fill="%23a1a1aa" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" letter-spacing="0.5">MEDCORE ACADEMY OFFICIAL CURRICULUM</text>
  </svg>`;
}
