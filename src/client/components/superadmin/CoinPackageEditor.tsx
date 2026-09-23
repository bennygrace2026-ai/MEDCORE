import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  Calculator
} from 'lucide-react';
import { useSettingsStore, CoinPackage, parseCoinPackages, DEFAULT_PACKAGES } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';

export default function CoinPackageEditor() {
  const { settings, updateSettings, fetchSettings } = useSettingsStore();
  const { token } = useAuthStore();
  
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [quizCoinCost, setQuizCoinCost] = useState<number>(30);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      if (typeof settings.quizCoinCost === 'number') {
        setQuizCoinCost(settings.quizCoinCost);
      }
      const parsed = parseCoinPackages(settings.coinPackages);
      if (parsed.length > 0) {
        setPackages(parsed);
      } else {
        setPackages(DEFAULT_PACKAGES);
      }
    } else {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  const handlePackageChange = (index: number, field: keyof CoinPackage, value: any) => {
    setPackages(prev => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'durationMonths') {
        const months = Math.max(1, Number(value) || 1);
        target.durationMonths = months;
        target.days = months * 30; // auto-sync days
      } else if (field === 'days') {
        const days = Math.max(1, Number(value) || 1);
        target.days = days;
        target.durationMonths = Math.max(1, Math.round(days / 30));
      } else if (field === 'coins' || field === 'price') {
        target[field] = Math.max(0, Number(value) || 0);
      } else if (field === 'popular') {
        // Only one package can be most popular at a time, or toggle
        if (value) {
          updated.forEach((pkg, i) => {
            if (i !== index) pkg.popular = false;
          });
        }
        target.popular = Boolean(value);
      } else {
        (target as any)[field] = value;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAddPackage = () => {
    const newId = `pack-${Date.now().toString().slice(-4)}`;
    const newPackage: CoinPackage = {
      id: newId,
      name: `Custom Tier ${packages.length + 1}`,
      coins: 1000,
      price: 2000,
      durationMonths: 1,
      days: 30,
      popular: false,
      color: 'bg-zinc-50',
      text: 'text-zinc-900',
      border: 'border-zinc-200'
    };
    setPackages(prev => [...prev, newPackage]);
  };

  const handleDeletePackage = (index: number) => {
    if (packages.length <= 1) {
      alert('You must maintain at least one coin package for students to purchase.');
      return;
    }
    setPackages(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset packages to standard (1,000 coins for ₦2,000) and quiz price to 30 coins per quiz?')) {
      setPackages(DEFAULT_PACKAGES);
      setQuizCoinCost(30);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const ok = await updateSettings(token, {
        coinPackages: packages,
        quizCoinCost: Math.max(1, Number(quizCoinCost) || 30)
      });

      if (ok) {
        setSuccessMessage(`Saved successfully! Quiz price set to ${quizCoinCost} coins per quiz and all ${packages.length} coin packages updated.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage('Failed to save settings. Please check connection and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-50/50 to-white">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl mt-0.5">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              Coin Packages & Duration Pricing
              <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-0.5 rounded-full">
                Super Admin
              </span>
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              Configure coins per package price (e.g. ₦2,000 for 1,000 coins) and the number of months each package grants access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            title="Reset to 1,000 coins = ₦2,000 / 1 Month"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleAddPackage}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Package
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save All Packages'}
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {successMessage && (
        <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-800 text-sm font-medium">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Quiz Pricing / Consumption Configurator */}
      <div className="mx-6 mt-6 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-amber-300/70 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-amber-500 text-zinc-900 rounded-xl font-bold shadow-xs">
                <Coins className="h-5 w-5 text-zinc-950" />
              </span>
              <div>
                <h4 className="text-base sm:text-lg font-black text-zinc-900 flex items-center gap-2">
                  Quiz Price: Coins per Quiz Answered
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                    Active Quiz Cost
                  </span>
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed mt-0.5 max-w-xl">
                  Coins work <strong>per quiz answered</strong> (not by time countdown expiration). Students spend coins whenever they answer an exam. Edit the price below:
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Coins Deducted Per Quiz
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={quizCoinCost}
                  onChange={(e) => setQuizCoinCost(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 px-3 py-1.5 text-lg font-black text-amber-600 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-center bg-amber-50/40"
                />
                <span className="text-xs font-bold text-zinc-800">Coins / Quiz</span>
              </div>
            </div>

            <div className="h-10 w-px bg-zinc-200 hidden sm:block" />

            {/* Quick Presets */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Presets</span>
              <div className="flex gap-1.5">
                {[10, 20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuizCoinCost(preset)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                      quizCoinCost === preset 
                        ? 'bg-amber-500 text-zinc-950 shadow-xs' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
          <p className="flex items-center font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1.5 shrink-0" />
            Students can answer quizzes as long as their balance is at least <strong>{quizCoinCost} coins</strong>.
          </p>
          <span className="font-semibold text-zinc-600 text-[11px]">
            Package calculations automatically adjust below in real time.
          </span>
        </div>
      </div>

      {/* Package Editors */}
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg, idx) => (
            <div 
              key={pkg.id || idx}
              className={`rounded-2xl border-2 p-5 relative transition-all ${
                pkg.popular 
                  ? 'border-purple-500 bg-purple-50/20 shadow-md ring-2 ring-purple-100' 
                  : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
              }`}
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md">
                  Package Tier #{idx + 1}
                </span>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-zinc-600">
                    <input 
                      type="checkbox"
                      checked={Boolean(pkg.popular)}
                      onChange={(e) => handlePackageChange(idx, 'popular', e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Popular</span>
                  </label>
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(idx)}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete this package"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Package Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Plan Title
                  </label>
                  <input
                    type="text"
                    value={pkg.name || ''}
                    onChange={(e) => handlePackageChange(idx, 'name', e.target.value)}
                    placeholder="e.g. Starter Clinical Pack"
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Coins and Price Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Coins</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Amount</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={pkg.coins}
                        onChange={(e) => handlePackageChange(idx, 'coins', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm font-bold text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <Coins className="h-4 w-4 text-amber-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Price (₦)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">NGN</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        step="500"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm font-bold text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute left-3 top-2 text-sm font-bold text-zinc-400 pointer-events-none">₦</span>
                    </div>
                  </div>
                </div>

                {/* Duration Months & Days */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Duration</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Months</span>
                    </label>
                    <div className="relative">
                      <select
                        value={pkg.durationMonths || 1}
                        onChange={(e) => handlePackageChange(idx, 'durationMonths', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={1}>1 Month</option>
                        <option value={2}>2 Months</option>
                        <option value={3}>3 Months</option>
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months (1 Year)</option>
                      </select>
                      <Clock className="h-4 w-4 text-purple-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Days</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Exact</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pkg.days || (pkg.durationMonths ? pkg.durationMonths * 30 : 30)}
                      onChange={(e) => handlePackageChange(idx, 'days', e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Student Preview Box */}
                <div className="mt-4 p-3.5 bg-white rounded-xl border border-zinc-200 text-center shadow-sm space-y-1.5">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Student View Preview</p>
                  <p className="text-xl font-black text-zinc-900">
                    {Number(pkg.coins).toLocaleString()} Coins
                  </p>
                  <p className="text-sm font-bold text-purple-700">
                    ₦{Number(pkg.price).toLocaleString()}
                  </p>
                  <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/90 py-1.5 px-2.5 rounded-lg border border-amber-200/60">
                    <Coins className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>~{Math.floor(Number(pkg.coins) / (quizCoinCost || 30))} Quizzes Unlocked</span>
                    <span className="text-[10px] text-zinc-500 font-normal">(@ {quizCoinCost} coins/quiz)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Coins do not expire by time — deducted per quiz answered
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Pricing & Frontend Synchronization Notice */}
        <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-amber-50/30 border border-purple-200/90 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs leading-relaxed">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-bold text-sm text-zinc-900">Dynamic Coin Pricing & Live Frontend Synchronization</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Frontend Sync
                </span>
              </div>
              <p className="text-zinc-600 max-w-2xl leading-relaxed">
                The prices of coins and packages are dynamic and bound to change. Any price (₦) or coin modifications saved here will immediately update and display across the frontend in real time—including the <strong>public Pricing page</strong>, student <strong>Buy Coins / Payments</strong> portal, and <strong>Quiz consumption costs</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-purple-200/70 md:pl-4">
            <div className="text-[11px] font-bold text-purple-900 bg-white/90 px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Quiz Rate: <strong className="text-zinc-900">{quizCoinCost} Coins/Quiz</strong></span>
            </div>
            <div className="text-[11px] font-bold text-indigo-900 bg-white/90 px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>Active Tiers: <strong className="text-zinc-900">{packages.length} Packages</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
