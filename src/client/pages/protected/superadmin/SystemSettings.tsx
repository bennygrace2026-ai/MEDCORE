import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, Server, Monitor, Users, Briefcase, Save, CloudUpload, CheckCircle2, AlertCircle, Globe, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import { useAuthStore } from '../../../store/authStore';
import CoinPackageEditor from '../../../components/superadmin/CoinPackageEditor';

export default function SystemSettings() {
  const { settings, updateSettings, fetchSettings } = useSettingsStore();
  const { token } = useAuthStore();
  const [formData, setFormData] = useState(settings || {} as any);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Synchronize formData whenever store settings change or load
  useEffect(() => {
    if (settings) {
      setFormData((prev: any) => ({
        ...settings,
        ...prev
      }));
    }
  }, [settings]);

  const handleToggle = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setSaveFeedback(null);
    const success = await updateSettings(token, formData);
    setIsSaving(false);
    if (success) {
      setSaveFeedback({ success: true, message: 'Settings saved and applied globally across all environments!' });
      setTimeout(() => setSaveFeedback(null), 4000);
    } else {
      setSaveFeedback({ success: false, message: 'Failed to save settings. Please try again.' });
    }
  };

  const handleMigrateToCloud = async () => {
    if (!token || !confirm('Are you sure you want to push all local data to Supabase Cloud? This will overwrite existing records with local ones.')) return;
    
    setIsMigrating(true);
    setMigrationStatus(null);
    
    try {
      const res = await fetch('/api/settings/migrate-to-cloud', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
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

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1 sm:mb-2">System Settings</h2>
          <p className="text-xs sm:text-sm text-zinc-500">Global configurations for Frontend, Student, and Admin environments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            to="/super-admin/frontend"
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all font-bold text-xs sm:text-sm tracking-tight"
          >
            <Globe className="h-4 w-4 mr-2 text-purple-600 shrink-0" />
            Global State & Logo Upload
          </Link>

          <button 
            onClick={handleMigrateToCloud}
            disabled={isMigrating}
            className="flex-1 sm:flex-none justify-center flex items-center px-3.5 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-black transition-all shadow-md shadow-zinc-200 disabled:opacity-50 font-bold text-xs sm:text-sm tracking-tight"
          >
            <CloudUpload className={`h-4 w-4 mr-2 shrink-0 ${isMigrating ? 'animate-bounce' : ''}`} />
            {isMigrating ? 'Pushing...' : 'Push to Cloud'}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto justify-center flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-200 disabled:opacity-50 font-bold text-xs sm:text-sm tracking-tight border-b-4 border-purple-800 active:border-b-0 active:translate-y-1"
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
          {migrationStatus.success ? <CheckCircle2 className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <p className="text-sm font-bold">{migrationStatus.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Frontend Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <Monitor className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Frontend Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1">Site Title</label>
              <input 
                type="text" 
                value={formData.siteTitle || ''} 
                onChange={(e) => setFormData({...formData, siteTitle: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1">Site Subtitle</label>
              <input 
                type="text" 
                value={formData.siteSubtitle || ''} 
                onChange={(e) => setFormData({...formData, siteSubtitle: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" 
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Maintenance Mode</p>
                <p className="text-xs text-zinc-500">Lock the public site temporarily</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.maintenanceMode ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('maintenanceMode')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Paystack Integration</p>
                <p className="text-xs text-zinc-500">Enable automated online payments</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.enablePaystack ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('enablePaystack')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.enablePaystack ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Allow New Registrations</p>
                <p className="text-xs text-zinc-500">Toggle public sign-up page</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.allowRegistrations ? 'bg-indigo-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('allowRegistrations')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.allowRegistrations ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Dashboard Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-emerald-100 p-2 rounded-lg mr-3">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Student Dashboard</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Quiz Coin Cost</p>
                <p className="text-xs text-zinc-500">Coins deducted per quiz answered</p>
              </div>
              <input 
                type="number" 
                min="1"
                max="5000"
                value={formData.quizCoinCost ?? 30} 
                onChange={(e) => setFormData({...formData, quizCoinCost: Math.max(1, Number(e.target.value) || 1)})}
                className="w-20 px-2 py-1 border border-zinc-300 rounded-md text-sm text-center font-bold text-amber-600 bg-amber-50/50" 
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Default Access Days</p>
                <p className="text-xs text-zinc-500">Days granted upon sign-up</p>
              </div>
              <input 
                type="number" 
                value={formData.defaultAccessDays || 7} 
                onChange={(e) => setFormData({...formData, defaultAccessDays: Number(e.target.value)})}
                className="w-16 px-2 py-1 border border-zinc-300 rounded-md text-sm text-center" 
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Enable Coin Purchases</p>
                <p className="text-xs text-zinc-500">Allow students to buy coins</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.enableCoinPurchases ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('enableCoinPurchases')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.enableCoinPurchases ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Show Leaderboard</p>
                <p className="text-xs text-zinc-500">Gamification feature toggle</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.showLeaderboard ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('showLeaderboard')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.showLeaderboard ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Allow Free Trial Submissions</p>
                <p className="text-xs text-zinc-500">Allow free trial students to submit quizzes (first 3 attempts free)</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.allowTrialSubmissions ? 'bg-emerald-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('allowTrialSubmissions')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.allowTrialSubmissions ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Control */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-2 rounded-lg mr-3">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Admin Dashboard</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Course Creation</p>
                <p className="text-xs text-zinc-500">Allow admins to create courses</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.adminCourseCreation ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminCourseCreation')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.adminCourseCreation ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Manual Approvals</p>
                <p className="text-xs text-zinc-500">Admins can approve payments</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.adminManualApprovals ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminManualApprovals')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.adminManualApprovals ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Access Analytics</p>
                <p className="text-xs text-zinc-500">Admins can view financials</p>
              </div>
              <div 
                className={`w-11 h-6 rounded-full relative cursor-pointer ${formData.adminViewAnalytics ? 'bg-purple-600' : 'bg-zinc-200'}`}
                onClick={() => handleToggle('adminViewAnalytics')}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.adminViewAnalytics ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Coin Pricing & Duration Management */}
      <CoinPackageEditor />
    </div>
  );
}
