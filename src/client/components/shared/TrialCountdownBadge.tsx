import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrialCountdownBadgeProps {
  accessExpiryDate?: string | Date | null;
  accessDaysRemaining?: number;
  isPaidOrApproved?: boolean;
  compact?: boolean;
}

export default function TrialCountdownBadge({
  accessExpiryDate,
  accessDaysRemaining = 0,
  isPaidOrApproved = false,
  compact = false
}: TrialCountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalMs: number;
  }>({
    days: accessDaysRemaining || 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalMs: 0
  });

  useEffect(() => {
    if (isPaidOrApproved) return;

    const calculateTime = () => {
      let expiryMs = 0;
      if (accessExpiryDate) {
        expiryMs = new Date(accessExpiryDate).getTime();
      } else if (accessDaysRemaining) {
        // Fallback if only days provided
        expiryMs = Date.now() + accessDaysRemaining * 24 * 60 * 60 * 1000;
      }

      const diff = expiryMs - Date.now();

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalMs: 0
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalMs: diff
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [accessExpiryDate, accessDaysRemaining, isPaidOrApproved]);

  if (isPaidOrApproved) {
    if (compact) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle className="h-3 w-3 mr-1" /> Full Access
        </span>
      );
    }
    return (
      <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
        <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>Full Academy Access Granted</span>
      </div>
    );
  }

  if (timeLeft.isExpired) {
    if (compact) {
      return (
        <Link 
          to="/dashboard/payments"
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 hover:bg-red-200 transition-colors animate-pulse"
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1 text-red-600" />
          Trial Expired (0d)
        </Link>
      );
    }
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900">Free Trial Expired (0 Days Remaining)</p>
            <p className="text-xs text-red-700">Your initial free trial access has ended. Buy coins to unlock full access to all courses and quizzes.</p>
          </div>
        </div>
        <Link
          to="/dashboard/payments"
          className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
        >
          Renew & Buy Coins
        </Link>
      </div>
    );
  }

  // Active Countdown
  if (compact) {
    return (
      <Link
        to="/dashboard/payments"
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
        title="Click to view payment packages"
      >
        <Clock className="h-3 w-3 mr-1 text-amber-600" />
        {timeLeft.days > 0 
          ? `Trial: ${timeLeft.days}d ${timeLeft.hours}h left` 
          : `Trial: ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s left`}
      </Link>
    );
  }

  return (
    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Free Trial Countdown:
            </span>
            <span className="text-sm font-mono font-black text-amber-950">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Counting down in real-time. Unrestricted access continues until countdown reaches 0.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/payments"
        className="hidden sm:inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
      >
        Top Up Now
      </Link>
    </div>
  );
}
