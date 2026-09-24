import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../../../store/settingsStore';
import { useAuthStore } from '../../../store/authStore';
import { LayoutTemplate, Save, MonitorPlay, Image as ImageIcon, Upload, Globe, CheckCircle2, Sparkles, RefreshCw, Layers, Trash2, ShieldCheck } from 'lucide-react';
import GlobalBrandLogo from '../../../components/shared/GlobalBrandLogo';
import { 
  getResolvedBrandLogo, 
  isValidBrandLogo, 
  isCustomUploadedLogo,
  setSuperAdminStaticLogo, 
  getSuperAdminStaticLogo
} from '../../../constants/brandAssets';

export default function FrontendSettings() {
  const { 
    frontendSettings, 
    updateFrontendSettings, 
    uploadGlobalLogo, 
    isUploadingGlobal, 
    globalUploadProgress, 
    globalUploadStatus 
  } = useSettingsStore();
  const { token } = useAuthStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    heroHeading: '',
    heroSubheading: '',
    heroButtonText: '',
    featuresHeading: '',
    featuresSubheading: '',
    primaryColor: 'purple',
    contactEmail: '',
    contactPhone: '',
  });

  const [globalFile, setGlobalFile] = useState<File | null>(null);
  const [globalPreview, setGlobalPreview] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [logos, setLogos] = useState<{
    heroLogo: File | null;
    registrationLogo: File | null;
    loginLogo: File | null;
  }>({
    heroLogo: null,
    registrationLogo: null,
    loginLogo: null,
  });
  const [previews, setPreviews] = useState<{
    heroLogo: string | null;
    registrationLogo: string | null;
    loginLogo: string | null;
  }>({
    heroLogo: null,
    registrationLogo: null,
    loginLogo: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (frontendSettings) {
      setFormData({
        heroHeading: frontendSettings.heroHeading || '',
        heroSubheading: frontendSettings.heroSubheading || '',
        heroButtonText: frontendSettings.heroButtonText || '',
        featuresHeading: frontendSettings.featuresHeading || '',
        featuresSubheading: frontendSettings.featuresSubheading || '',
        primaryColor: frontendSettings.primaryColor || '#dc2626',
        contactEmail: frontendSettings.contactEmail || '',
        contactPhone: frontendSettings.contactPhone || '',
      });
      const resolvedHero = getResolvedBrandLogo(frontendSettings.heroLogo);
      const resolvedReg = getResolvedBrandLogo(frontendSettings.registrationLogo);
      const resolvedLogin = getResolvedBrandLogo(frontendSettings.loginLogo);
      setPreviews({
        heroLogo: resolvedHero,
        registrationLogo: resolvedReg,
        loginLogo: resolvedLogin,
      });
      // Always keep the live preview updated with the active master logo unless user is selecting an unsynced file
      if (!globalFile) {
        setGlobalPreview(resolvedHero || resolvedLogin);
      }
    }
  }, [frontendSettings, globalFile]);

  const debounceTimer = useRef<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        const activeToken = token || localStorage.getItem('token') || '';
        await updateFrontendSettings(activeToken, updated);
        setSaveMessage('✓ Changes automatically applied');
        setTimeout(() => setSaveMessage(''), 3000);
      }, 500);

      return updated;
    });
  };

  // Helper to process and immediately persist an uploaded file to server & localStorage
  const processAndUploadMasterFile = async (file: File) => {
    setGlobalFile(file);
    setSyncFeedback(null);

    // Read and display preview + store in localStorage immediately for zero-delay refresh persistence
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setGlobalPreview(dataUrl);
      setPreviews({
        heroLogo: dataUrl,
        registrationLogo: dataUrl,
        loginLogo: dataUrl
      });
      
      setSuperAdminStaticLogo(dataUrl);

      // Automatically trigger server upload & global sync immediately
      const activeToken = token || localStorage.getItem('token') || '';
      const result = await uploadGlobalLogo(activeToken, file);
      if (result.success) {
        setSyncFeedback('✓ Master brand logo saved permanently! It will remain displayed across all portals even after page refreshes.');
        if (result.url) {
          const resolved = getResolvedBrandLogo(result.url);
          setPreviews({
            heroLogo: resolved,
            registrationLogo: resolved,
            loginLogo: resolved
          });
          setGlobalPreview(resolved);
          setSuperAdminStaticLogo(resolved);
        }
        setTimeout(() => setSyncFeedback(null), 8000);
      } else {
        setSyncFeedback(result.error || 'Failed to upload global logo to server. Saved locally.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveGlobalLogo = async () => {
    if (!window.confirm('Delete this logo from the system totally? Only uploaded logo PNG or image will display.')) {
      return;
    }
    const activeToken = token || localStorage.getItem('token') || '';
    try {
      const res = await fetch('/api/settings/global-logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'x-admin-request': 'true'
        }
      });
      if (res.ok) {
        setSuperAdminStaticLogo(null);
        setGlobalFile(null);
        setGlobalPreview(null);
        setPreviews({
          heroLogo: '',
          registrationLogo: '',
          loginLogo: ''
        });
        setSyncFeedback('✓ Logo deleted totally from the system. Only uploaded logo PNG or image will display.');
        const { fetchSettings } = useSettingsStore.getState();
        await fetchSettings();
        setTimeout(() => setSyncFeedback(null), 5000);
      }
    } catch (err: any) {
      setSyncFeedback('Failed to delete logo: ' + (err.message || 'Error'));
    }
  };

  const handleGlobalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadMasterFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.name.endsWith('.svg'))) {
      processAndUploadMasterFile(file);
    }
  };

  const handleTriggerGlobalSync = async () => {
    const activeToken = token || localStorage.getItem('token');

    if (!globalFile) {
      // Prompt user to pick file if button is clicked before selection
      fileInputRef.current?.click();
      return;
    }

    setSyncFeedback(null);
    const result = await uploadGlobalLogo(activeToken || '', globalFile);
    if (result.success) {
      setSyncFeedback('✓ Master brand logo synchronized & saved permanently across all portals and refreshes!');
      if (result.url) {
        const resolved = getResolvedBrandLogo(result.url);
        setPreviews({
          heroLogo: resolved,
          registrationLogo: resolved,
          loginLogo: resolved
        });
        setGlobalPreview(resolved);
        try {
          localStorage.setItem('medcore_master_logo', resolved);
        } catch {}
      }
      setTimeout(() => setSyncFeedback(null), 6000);
    } else {
      setSyncFeedback(result.error || 'Failed to upload global logo');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof logos) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogos(prev => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const activeToken = token || localStorage.getItem('token') || '';
    setIsSaving(true);
    setSaveMessage('');
    
    // If a master logo file was selected, ensure it is synchronized
    if (globalFile) {
      await uploadGlobalLogo(activeToken, globalFile);
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value as string);
    });
    
    if (logos.heroLogo) data.append('heroLogo', logos.heroLogo);
    if (logos.registrationLogo) data.append('registrationLogo', logos.registrationLogo);
    if (logos.loginLogo) data.append('loginLogo', logos.loginLogo);

    const success = await updateFrontendSettings(activeToken, data);
    setIsSaving(false);
    if (success) {
      setSaveMessage('Frontend settings and branding updated successfully.');
      setTimeout(() => setSaveMessage(''), 4000);
    } else {
      setSaveMessage('Failed to update frontend settings.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-1">Frontend & Global Branding</h2>
          <p className="text-zinc-500">Upload global master assets and synchronize branding seamlessly across all portals.</p>
        </div>
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
          <LayoutTemplate className="h-6 w-6" />
        </div>
      </div>

      {/* Global State Upload & Synchronized Display Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Global Master Logo Upload
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
                    Synchronized State
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Broadcasts one single master logo to all portals (Public, Student, Admin, Super Admin, Login, Register, Global Loader) so everything renders in unison.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-zinc-800">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Auto-Synchronized</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Box */}
            <div className="lg:col-span-6 space-y-4">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Select Master Logo File (PNG, SVG, JPG, WebP)
              </label>

               <div className="flex flex-col gap-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="w-full"
                >
                  <label className="cursor-pointer group block">
                    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-3xl transition-all duration-300 ${
                      isDragging 
                        ? 'border-red-500 bg-red-950/20 ring-4 ring-red-500/15 scale-[1.01]' 
                        : 'border-zinc-700/80 hover:border-red-500 bg-zinc-900/60 group-hover:bg-zinc-900/90 shadow-inner'
                    }`}>
                      <div className="p-4 bg-zinc-800/90 rounded-full mb-3 group-hover:scale-110 group-hover:bg-red-950/30 group-hover:text-red-400 transition-all shadow-inner">
                        <Upload className={`h-6 w-6 ${isDragging ? 'text-red-500' : 'text-zinc-300 group-hover:text-red-400'}`} />
                      </div>
                      <span className="text-sm font-bold text-zinc-100 text-center group-hover:text-red-400 transition-colors">
                        {globalFile ? globalFile.name : 'Click to browse or drop picture here'}
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-1.5 text-center leading-relaxed">
                        PNG, SVG, JPG, or WebP &bull; Saves immediately and persists across page refreshes
                      </span>
                      <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 animate-pulse">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Instant Upload & Refresh Persistence Active</span>
                      </div>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleGlobalFileSelect}
                    />
                  </label>
                </div>

                <button
                  id="btn-global-sync-upload"
                  onClick={handleTriggerGlobalSync}
                  disabled={isUploadingGlobal}
                  aria-label="Upload and synchronize brand logo globally"
                  className={`w-full min-h-[50px] flex items-center justify-center py-4 px-8 rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 active:scale-[0.98] ${
                    isUploadingGlobal
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-wait shadow-inner'
                      : globalFile
                      ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-950/40 ring-2 ring-red-400/40 cursor-pointer group'
                      : 'bg-zinc-950 hover:bg-zinc-900 active:bg-black text-zinc-100 hover:text-white border border-zinc-800 hover:border-zinc-600 shadow-lg hover:shadow-red-950/20 cursor-pointer group'
                  }`}
                >
                  {isUploadingGlobal ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin text-zinc-300 flex-shrink-0" />
                      <span className="whitespace-nowrap">{globalUploadStatus || 'Synchronizing globally...'}</span>
                    </>
                  ) : globalFile ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 text-white group-hover:rotate-12 transition-transform flex-shrink-0" />
                      <span className="whitespace-nowrap font-bold">Re-Broadcast & Synchronize Everywhere</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2 text-zinc-400 group-hover:text-white transition-colors flex-shrink-0" />
                      <span className="whitespace-nowrap">Upload Master Logo & Sync Across Portals</span>
                    </>
                  )}
                </button>

                {(globalPreview || frontendSettings?.heroLogo) && (
                  <button
                    type="button"
                    onClick={handleRemoveGlobalLogo}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    <span>Remove Uploaded Logo (Hide Everywhere)</span>
                  </button>
                )}
              </div>

              {/* Progress bar when uploading */}
              {isUploadingGlobal && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-medium text-zinc-400">
                    <span>{globalUploadStatus}</span>
                    <span className="font-mono text-purple-400">{globalUploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out" 
                      style={{ width: `${globalUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>

            {/* Live Multi-Portal Synchronized Preview Matrix */}
            <div className="lg:col-span-6 bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Synchronized Multi-View Preview
                </span>
                <span className="text-[10px] text-zinc-500">
                  Updates All Portals In Unison
                </span>
              </div>

              {/* Active Brand Status Banner */}
              <div className="flex items-center justify-between text-xs bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-800">
                <span className="flex items-center gap-2 font-medium text-zinc-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${isCustomUploadedLogo(frontendSettings?.heroLogo) ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                  <span>{isCustomUploadedLogo(frontendSettings?.heroLogo) ? 'Custom Uploaded Logo Active (Visible Everywhere)' : 'No Logo Uploaded (Hidden Everywhere)'}</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Multi-IP Realtime</span>
              </div>

              {(() => {
                const activeLogo = globalPreview || getResolvedBrandLogo(frontendSettings?.heroLogo);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. Public Nav Preview (Light) */}
                    <div className="bg-white text-zinc-900 p-3 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between h-24">
                      <div className="flex items-center space-x-2">
                        {activeLogo ? (
                          <img 
                            src={activeLogo} 
                            alt="Public Preview" 
                            className="h-7 w-7 object-contain rounded" 
                          />
                        ) : (
                          <div className="h-7 w-7 rounded bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                            None
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="text-[11px] font-black uppercase italic">UNI9JA MEDIA</div>
                          <div className="text-[8px] text-amber-600 uppercase font-bold tracking-wider">MEDCORE</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-400 border-t border-zinc-100 pt-1 flex justify-between">
                        <span>Public Navbar</span>
                        <span className={activeLogo ? "text-emerald-600 font-bold" : "text-zinc-400"}>
                          {activeLogo ? "Synchronized" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    {/* 2. Student Sidebar Preview (Dark) */}
                    <div className="bg-zinc-900 text-zinc-200 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between h-24">
                      <div className="flex items-center space-x-2">
                        {activeLogo ? (
                          <img 
                            src={activeLogo} 
                            alt="Student Preview" 
                            className="h-7 w-7 object-contain rounded" 
                          />
                        ) : (
                          <div className="h-7 w-7 rounded bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                            None
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="text-[11px] font-black uppercase italic text-white">UNI9JA MEDIA</div>
                          <div className="text-[8px] text-amber-400 uppercase font-bold tracking-wider">STUDENT</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-500 border-t border-zinc-800/80 pt-1 flex justify-between">
                        <span>Student Portal</span>
                        <span className={activeLogo ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {activeLogo ? "Synchronized" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    {/* 3. Admin Portal Preview */}
                    <div className="bg-zinc-900 text-zinc-200 p-3 rounded-xl border border-blue-900/40 flex flex-col justify-between h-24">
                      <div className="flex items-center space-x-2">
                        {activeLogo ? (
                          <img 
                            src={activeLogo} 
                            alt="Admin Preview" 
                            className="h-7 w-7 object-contain rounded" 
                          />
                        ) : (
                          <div className="h-7 w-7 rounded bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                            None
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="text-[11px] font-black uppercase italic text-white">ADMIN PORTAL</div>
                          <div className="text-[8px] text-blue-400 uppercase font-bold tracking-wider">SUPERVISOR</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-500 border-t border-zinc-800/80 pt-1 flex justify-between">
                        <span>Admin Portal</span>
                        <span className={activeLogo ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {activeLogo ? "Synchronized" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    {/* 4. Super Admin Portal Preview */}
                    <div className="bg-zinc-900 text-zinc-200 p-3 rounded-xl border border-purple-900/40 flex flex-col justify-between h-24">
                      <div className="flex items-center space-x-2">
                        {activeLogo ? (
                          <img 
                            src={activeLogo} 
                            alt="SuperAdmin Preview" 
                            className="h-7 w-7 object-contain rounded" 
                          />
                        ) : (
                          <div className="h-7 w-7 rounded bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                            None
                          </div>
                        )}
                        <div className="leading-tight">
                          <div className="text-[11px] font-black uppercase italic text-white">SUPER ADMIN</div>
                          <div className="text-[8px] text-purple-400 uppercase font-bold tracking-wider">SYSTEM CONTROL</div>
                        </div>
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-500 border-t border-zinc-800/80 pt-1 flex justify-between">
                        <span>Super Admin</span>
                        <span className={activeLogo ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                          {activeLogo ? "Synchronized" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/70">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Master Asset
                </span>
                <span className="font-mono text-zinc-300 truncate max-w-[200px]">
                  {frontendSettings?.heroLogo ? 'Synced to Cloud / Local' : 'Default Preset Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Form for Text Overrides and Fine-Tuning */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Hero Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-2">
              <MonitorPlay className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Hero Section (Home Page)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Hero Section Logo</label>
                <div className="flex items-center space-x-4">
                  {previews.heroLogo && (
                    <div className="h-16 w-16 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                      <img src={previews.heroLogo} alt="Hero Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-zinc-300 rounded-lg hover:border-purple-400 transition-colors bg-zinc-50">
                      <Upload className="h-4 w-4 mr-2 text-zinc-500" />
                      <span className="text-sm text-zinc-600 font-medium">Click to upload hero logo</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'heroLogo')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Hero Heading</label>
                <input 
                  type="text" 
                  name="heroHeading"
                  value={formData.heroHeading}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Hero Subheading</label>
                <textarea 
                  name="heroSubheading"
                  value={formData.heroSubheading}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Call to Action Button Text</label>
                <input 
                  type="text" 
                  name="heroButtonText"
                  value={formData.heroButtonText}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-2 mt-8">
              <MonitorPlay className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Features Section</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Features Heading</label>
                <input 
                  type="text" 
                  name="featuresHeading"
                  value={formData.featuresHeading}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Features Subheading</label>
                <textarea 
                  name="featuresSubheading"
                  value={formData.featuresSubheading}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Auth Logos */}
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-2 mt-8">
              <ImageIcon className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Authentication Page Logos</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Login Page Logo</label>
                <div className="flex flex-col space-y-3">
                  {previews.loginLogo && (
                    <div className="h-20 w-full rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center p-2">
                      <img src={previews.loginLogo} alt="Login Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-zinc-300 rounded-lg hover:border-purple-400 transition-colors bg-zinc-50">
                      <Upload className="h-4 w-4 mr-2 text-zinc-500" />
                      <span className="text-sm text-zinc-600 font-medium">Upload Login Logo</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'loginLogo')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Registration Page Logo</label>
                <div className="flex flex-col space-y-3">
                  {previews.registrationLogo && (
                    <div className="h-20 w-full rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center p-2">
                      <img src={previews.registrationLogo} alt="Registration Logo Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-zinc-300 rounded-lg hover:border-purple-400 transition-colors bg-zinc-50">
                      <Upload className="h-4 w-4 mr-2 text-zinc-500" />
                      <span className="text-sm text-zinc-600 font-medium">Upload Register Logo</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'registrationLogo')}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-2 mt-8">
              <MonitorPlay className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Contact & Footer Info</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Contact Phone</label>
                <input 
                  type="text" 
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <div className="flex items-center space-x-2 mb-4 border-b border-zinc-100 pb-2 mt-8">
              <MonitorPlay className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-bold text-zinc-900">Theme Styling</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-zinc-900 mb-1">Primary Color Scheme</label>
              <select 
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
              >
                <option value="purple">Purple</option>
                <option value="blue">Blue</option>
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
              </select>
            </div>
          </div>

        </div>
        
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <div className="text-sm font-medium text-green-600">
            {saveMessage}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Frontend Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
