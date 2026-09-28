import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DEFAULT_BRAND_LOGO, getResolvedBrandLogo } from './client/constants/brandAssets';
import { preloadImage } from './client/utils/preloadAssets';

// Synchronously pre-decode brand assets to eliminate logo display delay
if (typeof window !== 'undefined') {
  const logo = getResolvedBrandLogo(null) || DEFAULT_BRAND_LOGO;
  preloadImage(logo);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
