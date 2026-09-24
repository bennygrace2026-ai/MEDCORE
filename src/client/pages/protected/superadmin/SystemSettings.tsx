import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Monitor, 
  Users, 
  Briefcase, 
  Save, 
  CloudUpload, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import { useAuthStore } from '../../../store/authStore';
import CoinPackageEditor from '../../../components/superadmin/CoinPackageEditor';

export default function SystemSettings() {
  const { settings, updateSettings, fetchSettings, applySettingsOptimistically } = useSettingsStore();
  const { token } = useAuthStore();
  const [formData, setFormData] = useState<any>(settings || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoAppliedMessage, setAutoAppliedMessage] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  
  const debounceTimer = useRef<any>(null);
  const isEditingRef = useRef(false);

  // Synchronize formData whenever store settings change or load
  useEffect(() => {
    if (settings && !isEditingRef.current) {
      setFormData(settings);
    }
  }, [settings]);

  const formatFieldName = (f: string) => {
    return f.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  // Immediate apply & auto-persist for toggles
  const handleToggle = async (field: string) => {
    const updatedValue = !formData[field];
    const newFormData = { ...formData, [field]: updatedValue };
    setFormData(newFormData);

    // 1. Immediately apply to store & localStorage so the entire application updates synchronously
    applySettingsOptimistically({ [field]: updatedValue });

    // 2. Persist to database immediately
    setIsAutoSaving(true);
    setAutoAppliedMessage(`✓ ${formatFieldName(field)} applied`);

    const activeToken = token || localStorage.getItem('token') || '';
    const success = await updateSettings(activeToken, { [field]: updatedValue });
    setIsAutoSaving(false);
    
    if (success) {
      setTimeout(() => setAutoAppliedMessage(null), 3000);
    } else {
      setAutoAppliedMessage('Error saving change. Please retry.');
    }
  };

  // Immediate optimistic apply & debounced persistence for text/number inputs
  const handleInputChange = (field: string, value: any) => {
    isEditingRef.current = true;
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // 1. Instantly apply to global store optimistically
    applySettingsOptimistically({ [field]: value });
    setIsAutoSaving(true);
    setAutoAppliedMessage('Applying changes...');

    // 2. Debounce auto-save to server
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const activeToken = token || localStorage.getItem('token') || '';
      const success = await updateSettings(activeToken, { [field]: value });
      setIsAutoSaving(false);
      isEditingRef.current = false;
      if (success) {
        setAutoAppliedMessage(`✓ ${formatFieldName(field)} applied & saved globally`);
        setTimeout(() => setAutoAppliedMessage(null), 3000);
      } else {
        setAutoAppliedMessage('Error saving change. Please retry.');
      }
    }, 400);
  };

  const handleInputBlur = async (field: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    isEditingRef.current = false;
    setIsAutoSaving(true);
    const activeToken = token || localStorage.getItem('token') || '';
    const success = await updateSettings(activeToken, { [field]: formData[field] });
    setIsAutoSaving(false);
    if (success) {
      setAutoAppliedMessage(`✓ ${formatFieldName(field)} applied & saved`);
      setTimeout(() => setAutoAppliedMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const activeToken = token || localStorage.getItem('token') || '';
    setIsSaving(true);
    setSaveFeedback(null);
    const success = await updateSettings(activeToken, formData);
    setIsSaving(false);
    if (success) {
      setSaveFeedback({ success: true, message: 'Settings saved and applied globally across all environments!' });
      setAutoAppliedMessage('✓ All settings applied');
      setTimeout(() => {
        setSaveFeedback(null);
        setAutoAppliedMessage(null);
      }, 4000);
    } else {
      setSaveFeedback({ success: false, message: 'Failed to save settings. Please try again.' });
    }
  };

  const handleMigrateToCloud = async () => {
    const activeToken = token || localStorage.getItem('token') || '';
    if (!activeToken || !confirm('Are you sure you want to push all local data to Supabase Cloud? This will overwrite existing records with local ones.')) return;
    
    setIsMigrating(true);
    setMigrationStatus(null);
    
    try {
      const res = await fetch('/api/settings/migrate-to-cloud', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      
      const data = await res.json();
      if (res.ok) {
        setMigrationStatus({ success: true, message: data.message });
        await fetchSettings(); // Refresh to ensure we're now pulling from cloud
      } else {
        setMigrationStatus({ success: false, message: data.error || 'Migration failed' });
      }
    } catch (error) {
      setMigrationStatus({ success: false, message: 'Network error during migration' });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!settings) return <p className="p-8 text-center text-zinc-500 font-medium">Loading settings...</p>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">System Settings</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
              <Sparkles className="h-3 w-3 text-purple-600" />
              Live Apply Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Changes to any setting apply instantly across the portal and save automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Live Auto-apply status indicator */}
          <div className="flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-50 border border-zinc-200 shadow-2xs">
            {isAutoSaving ? (
              <span className="flex items-center text-purple-600 font-bold animate-pulse">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin text-purple-600 shrink-0" />
                Applying changes...
              </span>
            ) : autoAppliedMessage ? (
              <span className="flex items-center text-emerald-600 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600 shrink-0" />
                {autoAppliedMessage}
              </span>
            ) : (
              <span className="flex items-center text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500 shrink-0" />
                Instant apply active
              </span>
            )}
          </div>

          <Link
            to="/super-admin/frontend-settings"
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all font-bold text-xs sm:text-sm tracking-tight"
          >
            <Globe className="h-4 w-4 mr-2 text-purple-600 shrink-0" />
            Global State & Logo Upload
          </Link>

          <button 
            onClick={handleMigrateToCloud}
            disabled={isMigrating}
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-black transition-all shadow-xs disabled:opacity-50 font-bold text-xs sm:text-sm tracking-tight"
          >
            <CloudUpload className={`h-4 w-4 mr-2 shrink-0 ${isMigrating ? 'animate-bounce' : ''}`} />
            {isMigrating ? 'Pushing...' : 'Push to Cloud'}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto justify-center flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-xs disabled:opacity-50 font-bold text-xs sm:text-sm tracking-tight border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 cursor-pointer"
          >
            <Save className="h-4 w-4 mr-2 shrink-0" />
            {isSaving ? 'Permitting Update...' : 'Global Permit Update'}
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className={`p-4 rounded-xl border flex items-center ${saveFeedback.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {saveFeedback.success ? <CheckCircle2 className="h-5 w-5 mr-3 shrink-0" /> : <AlertCircle className="h-5 w-5 mr-3 shrink-0" />}
          <p className="text-sm font-bold">{saveFeedback.message}</p>
        </div>
      )}

      {migrationStatus && (
        <div className={`p-4 rounded-xl border flex items-center ${migrationStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {migrationStatus.success ? <CheckCircle2 className="h-5 w-5 mr-3 shrink-0" /> : <AlertCircle className="h-5 w-5 mr-3 shrink-0" />}
          <p className="text-sm font-bold">{migrationStatus.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Frontend Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <Monitor className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 leading-none">Frontend Settings</h3>
              <p className="text-xs text-zinc-500 mt-1">Site titles and global public controls</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-zinc-900">Site Title</label>
                <span className="text-[10px] text-zinc-400 font-medium">Applies immediately</span>
              </div>
              <input 
                type="text" 
                value={formData.siteTitle || ''} 
                onChange={(e) => handleInputChange('siteTitle', e.target.value)}
                onBlur={() => handleInputBlur('siteTitle')}
                placeholder="e.g. Medcore Academy"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-zinc-900">Site Subtitle</label>
                <span className="text-[10px] text-zinc-400 font-medium">Applies immediately</span>
              </div>
              <input 
                type="text" 
                value={formData.siteSubtitle || ''} 
                onChange={(e) => handleInputChange('siteSubtitle', e.target.value)}
                onBlur={() => handleInputBlur('siteSubtitle')}
                placeholder="e.g. UNI9JA MEDIA"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow" 
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Maintenance Mode</p>
                <p className="text-xs text-zinc-500">Lock the public site temporarily</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.maintenanceMode)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${formData.maintenanceMode ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('maintenanceMode')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.maintenanceMode ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Paystack Integration</p>
                <p className="text-xs text-zinc-500">Enable automated online payments</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.enablePaystack)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${formData.enablePaystack ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('enablePaystack')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.enablePaystack ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Allow New Registrations</p>
                <p className="text-xs text-zinc-500">Toggle public sign-up page</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.allowRegistrations)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${formData.allowRegistrations ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('allowRegistrations')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.allowRegistrations ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Student Dashboard Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center mb-6">
            <div className="bg-emerald-100 p-2 rounded-lg mr-3">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 leading-none">Student Dashboard</h3>
              <p className="text-xs text-zinc-500 mt-1">Rules, trial access & quiz costs</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Quiz Coin Cost</p>
                <p className="text-xs text-zinc-500">Coins deducted per quiz answered</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="1"
                  max="5000"
                  value={formData.quizCoinCost ?? 30} 
                  onChange={(e) => handleInputChange('quizCoinCost', Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => handleInputBlur('quizCoinCost')}
                  className="w-20 px-2.5 py-1.5 border border-amber-300 rounded-lg text-sm text-center font-bold text-amber-700 bg-amber-50/70 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-shadow" 
                />
                <span className="text-xs font-bold text-amber-600">coins</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Default Access Days</p>
                <p className="text-xs text-zinc-500">Days granted upon sign-up</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="1"
                  max="365"
                  value={formData.defaultAccessDays || 7} 
                  onChange={(e) => handleInputChange('defaultAccessDays', Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => handleInputBlur('defaultAccessDays')}
                  className="w-16 px-2.5 py-1.5 border border-zinc-300 rounded-lg text-sm text-center font-bold text-zinc-800 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow" 
                />
                <span className="text-xs font-semibold text-zinc-500">days</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Enable Coin Purchases</p>
                <p className="text-xs text-zinc-500">Allow students to buy coins</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.enableCoinPurchases)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${formData.enableCoinPurchases ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('enableCoinPurchases')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.enableCoinPurchases ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Show Leaderboard</p>
                <p className="text-xs text-zinc-500">Gamification feature toggle</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.showLeaderboard)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${formData.showLeaderboard ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('showLeaderboard')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.showLeaderboard ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Allow Free Trial Submissions</p>
                <p className="text-xs text-zinc-500">Allow free trial students to submit quizzes (first 3 attempts free)</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.allowTrialSubmissions)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${formData.allowTrialSubmissions ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('allowTrialSubmissions')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.allowTrialSubmissions ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Admin Dashboard Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 leading-none">Admin Dashboard</h3>
              <p className="text-xs text-zinc-500 mt-1">Privileges and sub-admin authority</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Course Creation</p>
                <p className="text-xs text-zinc-500">Allow admins to create courses</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.adminCourseCreation)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${formData.adminCourseCreation ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminCourseCreation')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.adminCourseCreation ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Manual Approvals</p>
                <p className="text-xs text-zinc-500">Admins can approve payments</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.adminManualApprovals)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${formData.adminManualApprovals ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminManualApprovals')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.adminManualApprovals ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Access Analytics</p>
                <p className="text-xs text-zinc-500">Admins can view financials</p>
              </div>
              <button 
                type="button"
                role="switch"
                aria-checked={Boolean(formData.adminViewAnalytics)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${formData.adminViewAnalytics ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminViewAnalytics')}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-xs ${formData.adminViewAnalytics ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Coin Pricing & Duration Management */}
      <CoinPackageEditor />
    </div>
  );
}
