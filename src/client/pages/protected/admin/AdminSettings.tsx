import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { 
  ShieldCheck, 
  Key, 
  User, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Server,
  Lock,
  Layers,
  Cloud,
  Upload,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminSettings() {
  const { user, token, checkAuth } = useAuthStore();
  const { settings } = useSettingsStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [secondaryEmail, setSecondaryEmail] = useState(user?.secondaryEmail || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.profilePhoto || null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdatingProfile(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (user?.role === 'SUPER_ADMIN') {
        formData.append('email', email);
        formData.append('secondaryEmail', secondaryEmail);
      }
      if (profileImage) {
        formData.append('profilePhoto', profileImage);
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: data.isSupabaseStorage || (data.profilePhoto && data.profilePhoto.includes('supabase'))
            ? 'Profile saved and image synced to Supabase Cloud Storage!'
            : (data.message || 'Profile saved and synced successfully!')
        });
        await checkAuth(); // Refresh user data in store
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsUpdatingPassword(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Security credentials updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Administrator Account & Security Settings
          </h2>
          <p className="text-sm text-zinc-500">
            Manage your administrative access profile, password credentials, and view system status.
          </p>
        </div>
      </div>

      {/* 2nd div: Status & Cloud Storage Indicator (guarantees permanent div:nth-of-type(2)) */}
      <div id="admin-settings-status-slot">
        {message ? (
          <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        ) : (
          <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="font-bold">Supabase Cloud Storage:</span>
              <span className="text-blue-700">Active and configured for real-time asset synchronization.</span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Connected
            </span>
          </div>
        )}
      </div>

      {/* Admin Profile Details */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Admin Profile & Communication Settings
          </h3>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
          </span>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-zinc-100">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-zinc-100 border-2 border-zinc-200 overflow-hidden flex items-center justify-center relative shadow-sm">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-zinc-300" />
                )}
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Upload className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  <Cloud className="h-3 w-3" />
                  Supabase Sync
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">Account Display Name</label>
                  <input
                    id="admin-display-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-sm transition-all placeholder:text-zinc-400"
                    placeholder="Enter your full name"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">This name appears in community and classroom chats.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium"
                    placeholder="Optional phone number"
                  />
                </div>
              </div>

              {/* Email Management Section */}
              <div className="p-5 bg-blue-50/50 border-2 border-blue-100 rounded-2xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Primary Administrative Email
                  </label>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-sm font-bold text-zinc-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-sm transition-all"
                      placeholder="Primary login email"
                    />
                  ) : (
                    <div className="w-full px-4 py-3 bg-zinc-100 border-2 border-zinc-200 rounded-xl text-sm text-zinc-500 font-bold">
                      {user?.email}
                    </div>
                  )}
                  <p className="text-[10px] text-blue-600/70 mt-1.5 font-medium italic">
                    {user?.role === 'SUPER_ADMIN' 
                      ? 'System authority allows modification of the primary authentication address.' 
                      : 'Standard administrative accounts have fixed primary email addresses.'}
                  </p>
                </div>

                {user?.role === 'SUPER_ADMIN' && (
                  <div className="pt-2 border-t border-blue-100">
                    <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Extra Login Email (Secondary Access)
                    </label>
                    <input
                      type="email"
                      value={secondaryEmail}
                      onChange={(e) => setSecondaryEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-sm font-bold text-zinc-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-sm transition-all"
                      placeholder="Optional extra login email"
                    />
                    <p className="text-[10px] text-blue-600/70 mt-1.5 font-medium italic">
                      Configure a secondary credential to maintain multi-channel login access.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Scope: {user?.role === 'SUPER_ADMIN' ? 'Full System Authority' : 'Assigned Faculty Permissions'}</span>
            </div>
            <button
              id="btn-save-profile-admin"
              type="submit"
              disabled={isUpdatingProfile}
              className="min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 active:translate-y-0.5 cursor-pointer"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white flex-shrink-0" />
                  <span className="whitespace-nowrap">Syncing to Supabase...</span>
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 text-blue-200 flex-shrink-0" />
                  <span className="whitespace-nowrap">Save & Sync to Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security: Update Password */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Update Security Password
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            id="btn-change-password-admin"
            type="submit"
            disabled={isUpdatingPassword}
            className="min-h-[44px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 active:translate-y-0.5 cursor-pointer"
          >
            {isUpdatingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white flex-shrink-0" />
                <span className="whitespace-nowrap">Saving Credentials...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-blue-200 flex-shrink-0" />
                <span className="whitespace-nowrap">Change & Sync Password</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* System Parameter Snapshot (Super Admin only) */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            Academy Parameters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block mb-0.5">Quiz Coin Rate</span>
              <span className="font-bold text-amber-600">{settings?.quizCoinCost || 30} coins/quiz</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block mb-0.5">Default Free Days</span>
              <span className="font-bold text-zinc-800">{settings?.defaultAccessDays || 7} Days</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block mb-0.5">Registrations</span>
              <span className="font-bold text-emerald-600">{settings?.allowRegistrations ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="text-zinc-400 block mb-0.5">Maintenance Mode</span>
              <span className="font-bold text-zinc-800">{settings?.maintenanceMode ? 'Active' : 'Off'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
