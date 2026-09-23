import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { preloadImage } from '../../utils/preloadAssets';
import { getResolvedBrandLogo, isSuperAdminUploadedLogo } from '../../constants/brandAssets';

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
  fallbackIcon: CustomFallbackIcon,
  fallbackClassName,
  alt,
  variant = 'public',
}: GlobalBrandLogoProps) {
  const { frontendSettings, settings } = useSettingsStore();
  
  // Prefer heroLogo as the unified master logo, with fallbacks to registration and login logos
  const rawLogoUrl = frontendSettings?.heroLogo || frontendSettings?.loginLogo || frontendSettings?.registrationLogo;
  const initialResolved = getResolvedBrandLogo(rawLogoUrl);
  
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(initialResolved);

  // When global state logo changes, preload and update atomically
  useEffect(() => {
    const targetUrl = getResolvedBrandLogo(rawLogoUrl);
    if (targetUrl !== displayedUrl) {
      if (targetUrl) {
        let active = true;
        preloadImage(targetUrl).then(() => {
          if (active) {
            setDisplayedUrl(targetUrl);
          }
        }).catch(() => {
          if (active) {
            setDisplayedUrl(targetUrl);
          }
        });

        return () => {
          active = false;
        };
      } else {
        setDisplayedUrl(null);
      }
    }
  }, [rawLogoUrl, displayedUrl]);

  // If no logo has been uploaded by the Super Admin, do not display any logo!
  if (!displayedUrl || !isSuperAdminUploadedLogo(displayedUrl)) {
    return null;
  }

  return (
    <div 
      id={id}
      className={`relative flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
    >
      <img
        id={imgId}
        src={displayedUrl}
        alt={alt || settings?.siteTitle || 'Brand Logo'}
        className={`${imageClassName} transition-all duration-200 block`}
        loading="eager"
        decoding="sync"
        onError={() => {
          // If an uploaded logo image fails to load, do not show any un-uploaded fallback
          setDisplayedUrl(null);
        }}
      />
    </div>
  );
}

