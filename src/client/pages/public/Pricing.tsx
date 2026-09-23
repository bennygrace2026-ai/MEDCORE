import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, parseCoinPackages, DEFAULT_PACKAGES, CoinPackage } from '../../store/settingsStore';
import { CheckCircle2, Zap, ArrowRight, Coins } from 'lucide-react';
import { motion } from 'motion/react';

export default function Pricing() {
  const navigate = useNavigate();
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const quizCoinCost = settings?.quizCoinCost || 30;
  
  // Use packages from settings or fallback to default if not configured
  const packages: CoinPackage[] = React.useMemo(() => {
    const parsed = parseCoinPackages(settings?.coinPackages);
    return parsed.length > 0 ? parsed : DEFAULT_PACKAGES;
  }, [settings?.coinPackages]);

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic mb-4">Pricing & MedCoins</h1>
          <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
            Purchase MedCoins to unlock premium courses, specialized quiz engines, and exclusive medical community features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-white p-8 rounded-3xl border ${pkg.popular ? 'border-purple-600 shadow-2xl shadow-purple-100' : 'border-zinc-200'} flex flex-col`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{pkg.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">{pkg.description || `Get ${pkg.coins} MedCoins for your academic needs.`}</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-black text-zinc-900">₦{pkg.price.toLocaleString()}</span>
                <span className="ml-2 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">/ {pkg.coins.toLocaleString()} Coins</span>
              </div>

              <div className="mb-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                  <span>Usage Preview</span>
                  <span className="text-amber-600">Clinical Value</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-zinc-200">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-zinc-900 leading-none">~{Math.floor(pkg.coins / quizCoinCost)} Quizzes</p>
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">Unlocked with this package</p>
                  </div>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {[
                  `${pkg.coins.toLocaleString()} MedCoins instantly`,
                  `${pkg.durationMonths || 1} Month Access Period`,
                  'Access premium quiz banks',
                  'Enroll in paid courses',
                  'Community access enabled'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start text-sm text-zinc-600 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                id={`btn-purchase-plan-${idx}`}
                onClick={() => navigate('/login')}
                aria-label={`Purchase ${pkg.name} and go to student login`}
                className={`w-full min-h-[48px] py-3.5 px-7 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group border-b-4 ${
                  pkg.popular 
                    ? 'bg-purple-600 text-white hover:bg-purple-700 border-purple-800 shadow-lg shadow-purple-200 hover:shadow-purple-300' 
                    : 'bg-zinc-900 text-white hover:bg-black border-zinc-950 shadow-lg shadow-zinc-200 hover:shadow-zinc-300'
                } active:border-b-0 active:translate-y-1 cursor-pointer`}
              >
                <span className="whitespace-nowrap">Purchase Now</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 sm:mt-20 bg-white border border-zinc-200 rounded-3xl sm:rounded-[2rem] p-6 sm:p-12 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 opacity-[0.03] rotate-12 pointer-events-none">
            <Zap className="w-96 h-96 text-black" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tighter uppercase italic mb-3 sm:mb-6">Need a custom plan?</h2>
            <p className="text-sm sm:text-base text-zinc-600 mb-6 sm:mb-8 font-medium">
              Are you a medical institution or a large group of students? We offer tailored packages and bulk MedCoin distributions at special rates.
            </p>
            <button 
              id="btn-contact-sales"
              onClick={() => navigate('/contact')}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm hover:bg-black transition-all cursor-pointer"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
