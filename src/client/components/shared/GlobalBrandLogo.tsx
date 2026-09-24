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

  // If no custom logo has been uploaded by the Super Admin, display a stunning default Medcore Shield!
  if (!displayedUrl || !isSuperAdminUploadedLogo(displayedUrl)) {
    return (
      <div 
        id={id}
        className={`relative flex items-center justify-center overflow-hidden shrink-0 select-none bg-red-600 rounded-xl shadow-xs ${className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 10 C65 10, 80 16, 80 16 C80 16, 80 48, 75 66 C68 83, 50 88, 50 88 C50 88, 32 83, 25 66 C20 48, 20 16, 20 16 C20 16, 35 10, 50 10 Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M50 10 C65 10, 80 16, 80 16 C80 16, 80 48, 75 66 C68 83, 50 88, 50 88 C50 88, 32 83, 25 66 C20 48, 20 16, 20 16 C20 16, 35 10, 50 10 Z" stroke="currentColor" />
          <path d="M50 30 L50 70 M30 50 L70 50" stroke="currentColor" strokeWidth="8" />
        </svg>
      </div>
    );
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

