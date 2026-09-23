import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, Lock, Upload, AlertTriangle, Phone, Globe, Building, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, studentData, checkAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile');
  
  // Profile Editable states
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || '');
  const [state, setState] = useState(user?.state || '');
  const [secondaryEmail, setSecondaryEmail] = useState(user?.secondaryEmail || '');
  
  // Student data editable states
  const [institution, setInstitution] = useState(studentData?.institution || '');
  const [department, setDepartment] = useState(studentData?.department || '');
  const [level, setLevel] = useState(studentData?.level || '');
  const [photo, setPhoto] = useState<File | null>(null);
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setCountry(user.country || '');
      setState(user.state || '');
      setSecondaryEmail(user.secondaryEmail || '');
    }
    if (studentData) {
      setInstitution(studentData.institution || '');
      setDepartment(studentData.department || '');
      setLevel(studentData.level || '');
    }
  }, [user, studentData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('country', country);
      formData.append('state', state);
      formData.append('secondaryEmail', secondaryEmail);
      formData.append('institution', institution);
      formData.append('department', department);
      formData.append('level', level);
      
      if (photo) {
        formData.append('profilePhoto', photo);
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      setMessage({ type: 'success', text: 'All profile changes saved successfully!' });
      await checkAuth(); // Refresh user data
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred while updating profile.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all access, coins, and progress.")) {
      return;
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete account');
      
      logout();
      navigate('/');
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not delete account. Please try again or contact support.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'profile' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Edit Profile
          </button>
          <button 
            onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'password' ? 'border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Change Password
          </button>
          <button 
            onClick={() => { setActiveTab('danger'); setMessage({ type: '', text: '' }); }}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'danger' ? 'border-b-2 border-red-600 text-red-600' : 'text-zinc-500 hover:text-red-600'}`}
          >
            Danger Zone
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Photo Upload Row */}
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Profile Photo</label>
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                    {photo ? (
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="h-full w-full object-cover" />
                    ) : user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Current" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center px-3.5 py-2 border border-zinc-200 shadow-xs text-xs font-bold uppercase tracking-wider rounded-xl text-zinc-700 bg-white hover:bg-zinc-50 transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-zinc-500" />
                      Select Photo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                    </label>
                    <p className="mt-1 text-[10px] text-zinc-500">JPG or PNG. Maximum size 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Read-Only Locked Fields */}
              <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    Full Name <Lock className="h-3 w-3 text-zinc-400" />
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed font-medium"
                    title="This field is locked and can only be updated by administration."
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Locked: Contact support to change.</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    Email Address <Lock className="h-3 w-3 text-zinc-400" />
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed font-medium"
                    title="This field is locked and can only be updated by administration."
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Locked: Contact support to change.</span>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Secondary Email */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Secondary Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      value={secondaryEmail}
                      onChange={(e) => setSecondaryEmail(e.target.value)}
                      placeholder="e.g. secondary@mail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +234 800 000 0000"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Nigeria"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">State / Region</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Lagos"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Student Academic Details Section */}
              <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Institution */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Institution / University</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. UNILAG"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Department / Faculty</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Medicine & Surgery"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                  />
                </div>

                {/* Academic Level */}
                <div>
                  <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Academic Level</label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g. 400 Level"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex justify-center py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-sm focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full flex justify-center py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-base font-bold text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-800 mt-1 mb-4">
                    Once you delete your account, there is no going back. All of your quiz history, course progress, and Medcore Coins will be permanently deleted.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-black uppercase tracking-wider rounded-xl text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
