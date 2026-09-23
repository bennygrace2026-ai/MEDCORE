import React from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '../../store/settingsStore';
import GlobalBrandLogo from './GlobalBrandLogo';

export default function GlobalLoader() {
  const { frontendSettings, settings } = useSettingsStore();
  const primaryColor = frontendSettings?.primaryColor || 'purple';

  const colorMap: Record<string, string> = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    rose: 'bg-rose-600',
  };

  const barColor = colorMap[primaryColor] || 'bg-purple-600';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center"
        >
          <GlobalBrandLogo 
            className="h-20 w-20 max-w-[140px] max-h-[80px]" 
            imageClassName="max-h-full max-w-full object-contain"
          />
          <h1 className="mt-3 text-xl font-black tracking-tighter text-zinc-900 uppercase italic">
            {settings?.siteSubtitle || 'UNI9JA MEDIA'}
          </h1>
          <p className="text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase mt-0.5">
            {settings?.siteTitle || 'MEDCORE ACADEMY'}
          </p>
        </motion.div>

        {/* Loading Bar Track */}
        <div className="w-64 h-1.5 bg-zinc-100 rounded-full overflow-hidden relative">
          {/* Active Loading Bar */}
          <motion.div
            className={`absolute inset-y-0 left-0 ${barColor}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 0.55, 
              ease: "easeInOut"
            }}
          />
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-5 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]"
        >
          Synchronizing Platform...
        </motion.p>
      </div>
    </div>
  );
}
