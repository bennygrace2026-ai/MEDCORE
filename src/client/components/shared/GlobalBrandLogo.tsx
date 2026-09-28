import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { preloadImage } from '../../utils/preloadAssets';
import { getResolvedBrandLogo, DEFAULT_BRAND_LOGO } from '../../constants/brandAssets';

interface GlobalBrandLogoProps {
  id?: string;
  imgId?: string;
  className?: string;
  imageClassName?: string;
  fallbackIcon?: LucideIcon;
  fallbackClassName?: string;
  alt?: string;
  variant?: 'public' | 'student' | 'admin' | 'superadmin' | 'auth' | 'custom';
}

export default function GlobalBrandLogo({
  id,
  imgId,
  className = 'w-10 h-10',
  imageClassName = 'w-full h-full object-contain',
  alt,
}: GlobalBrandLogoProps) {
  const { frontendSettings, settings } = useSettingsStore();
  
  // Prefer heroLogo as the unified master logo, with fallbacks to registration, login, and static default
  const rawLogoUrl = frontendSettings?.heroLogo || frontendSettings?.loginLogo || frontendSettings?.registrationLogo;
  const initialResolved = getResolvedBrandLogo(rawLogoUrl) || DEFAULT_BRAND_LOGO;
  
  const [displayedUrl, setDisplayedUrl] = useState<string>(initialResolved);
  const [loadFailed, setLoadFailed] = useState(false);

  // When global state logo changes, update displayed URL and preload
  useEffect(() => {
    const targetUrl = getResolvedBrandLogo(rawLogoUrl) || DEFAULT_BRAND_LOGO;
    setDisplayedUrl(targetUrl);
    setLoadFailed(false);
    
    if (targetUrl) {
      let active = true;
      preloadImage(targetUrl).catch(() => {
        if (active && targetUrl !== DEFAULT_BRAND_LOGO) {
          // If custom base64 or remote URL is unreachable on this device, fallback to static asset
          setDisplayedUrl(DEFAULT_BRAND_LOGO);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [rawLogoUrl]);

  const currentResolved = getResolvedBrandLogo(rawLogoUrl) || DEFAULT_BRAND_LOGO;
  const activeSrc = loadFailed ? DEFAULT_BRAND_LOGO : (displayedUrl || currentResolved);

  return (
    <div 
      id={id}
      className={`relative flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
      style={{ minWidth: '2rem', minHeight: '2rem' }}
    >
      <img
        id={imgId}
        src={activeSrc}
        alt={alt || settings?.siteTitle || 'Medcore Academy'}
        className={`${imageClassName} block max-w-full max-h-full`}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
        onError={() => {
          if (!loadFailed && activeSrc !== DEFAULT_BRAND_LOGO) {
            setLoadFailed(true);
            setDisplayedUrl(DEFAULT_BRAND_LOGO);
          }
        }}
      />
    </div>
  );
}


