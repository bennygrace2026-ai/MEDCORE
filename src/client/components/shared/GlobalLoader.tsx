import React from 'react';
import { motion } from 'motion/react';
import GlobalBrandLogo from './GlobalBrandLogo';

interface GlobalLoaderProps {
  progress: number;
  statusText: string;
}

export default function GlobalLoader({ progress }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      {/* Dynamic Background Light Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-50/20 via-white to-white pointer-events-none" />

      <div className="relative flex items-center justify-center h-48 w-48 z-10">
        {/* Glowing Circle Loading Ring Around Logo */}
        <div className="absolute inset-0 rounded-full border-2 border-zinc-100" />
        
        {/* Active Animated Spinner Overlay */}
        <svg 
          className="absolute inset-0 w-full h-full animate-spin text-red-600" 
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="80 200"
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Pulsing Backlit Glow to Match the Pop In/Out Animation */}
        <motion.div 
          className="absolute h-32 w-32 rounded-full bg-red-500/5 blur-xl pointer-events-none"
          animate={{
            scale: [0.85, 1.15, 0.85],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 2.0,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />

        {/* Logo Container with Pop In and Out Animation */}
        <motion.div
          className="relative h-28 w-28 flex items-center justify-center bg-zinc-50/80 border border-zinc-100 rounded-full p-5 shadow-lg backdrop-blur-xs"
          animate={{
            scale: [0.92, 1.08, 0.92],
          }}
          transition={{
            duration: 2.0,
            ease: "easeInOut",
            repeat: Infinity
          }}
        >
          <GlobalBrandLogo 
            className="h-16 w-16 object-contain" 
            imageClassName="h-full w-full object-contain" 
          />
        </motion.div>
      </div>
    </div>
  );
}
