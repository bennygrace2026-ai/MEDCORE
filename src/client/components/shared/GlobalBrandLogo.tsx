import React, { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { preloadImage } from '../../utils/preloadAssets';
import { getResolvedBrandLogo, isCustomUploadedLogo } from '../../constants/brandAssets';

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
  
  // Prefer heroLogo as the unified master logo, with fallbacks to registration and login logos
  const rawLogoUrl = frontendSettings?.heroLogo || frontendSettings?.loginLogo || frontendSettings?.registrationLogo;
  const initialResolved = getResolvedBrandLogo(rawLogoUrl);
  
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(initialResolved);
  const [hasError, setHasError] = useState(false);

  // When global state logo changes, preload and update atomically
  useEffect(() => {
    const targetUrl = getResolvedBrandLogo(rawLogoUrl);
    setHasError(false);
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

  // If no uploaded logo is present or an error occurred, display the professional system-default vector brand logo
  if (!displayedUrl || hasError || !isCustomUploadedLogo(displayedUrl)) {
    return (
      <div 
        id={id}
        className={`relative flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full text-red-600 fill-current" xmlns="http://www.w3.org/2000/svg">
          {/* Stylized medical/cerebral shield logo */}
          <path d="M100 20 C140 20, 170 35, 170 35 C170 35, 170 120, 100 175 C30 120, 30 35, 30 35 C30 35, 60 20, 100 20 Z" fill="currentColor" className="text-red-600 opacity-90" />
          <path d="M100 32 C132 32, 158 45, 158 45 C158 45, 158 113, 100 160 C42 113, 42 45, 42 45 C42 45, 68 32, 100 32 Z" fill="#ffffff" />
          {/* Medical cross + brain waves inside */}
          <path d="M100 55 L100 125 M65 90 L135 90" stroke="currentColor" className="text-red-600" strokeWidth="18" strokeLinecap="round" />
          <circle cx="100" cy="90" r="14" className="text-white fill-current" />
          <path d="M88 90 Q100 78 112 90" fill="none" stroke="currentColor" className="text-red-600" strokeWidth="4" strokeLinecap="round" />
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
        alt={alt || settings?.siteTitle || 'Medcore Academy'}
        className={`${imageClassName} transition-all duration-200 block`}
        loading="eager"
        decoding="sync"
        onError={() => {
          setHasError(true);
          setDisplayedUrl(null);
        }}
      />
    </div>
  );
}


