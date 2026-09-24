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

  // If no uploaded logo is present or an error occurred, do not display any image
  // Only uploaded logo PNG or image will display!
  if (!displayedUrl || hasError || !isCustomUploadedLogo(displayedUrl)) {
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


