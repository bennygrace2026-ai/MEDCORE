import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Edit, Trash2, ShieldCheck, Mail, Calendar, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  profilePhoto?: string;
  createdAt: string;
};

export default function AdminManagement() {
  const { token, user: currentUser } = useAuthStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Dedicated modal & toast state
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [adminToReset, setAdminToReset] = useState<AdminUser | null>(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const res = await fetch('/api/users/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, password })
      });
      
      if (res.ok) {
        setShowModal(false);
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create admin');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setIsDeletingAdmin(true);
    try {
      const res = await fetch(`/api/users/admins/${adminToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ type: 'success', message: `Administrator ${adminToDelete.name} has been removed.` });
        setAdminToDelete(null);
        fetchAdmins();
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to delete admin.' });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setToast({ type: 'error', message: 'Network error deleting admin.' });
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!adminToReset) return;
    setIsResettingPassword(true);
    try {
      const res = await fetch(`/api/users/${adminToReset.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: 'password' })
      });
      if (res.ok) {
        setToast({ type: 'success', message: `Password for ${adminToReset.name} has been reset to "password".` });
        setAdminToReset(null);
      } else {
        const data = await res.json();
        setToast({ type: 'error', message: data.error || 'Failed to reset password.' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setToast({ type: 'error', message: 'Network error resetting password.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-black/5 rounded-lg text-zinc-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Admin Management</h2>
          <p className="text-zinc-500">Add, edit, or view administrative accounts.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Provision Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading administrators...</div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
            <div className="bg-purple-100 p-4 rounded-full mb-6">
              <ShieldAlert className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No Admins Provisioned</h3>
            <p className="text-zinc-500 max-w-md mb-8">
              You haven't provisioned any admin accounts yet. Click the button above to add administrators.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-sm">
                  <th className="py-4 px-6 font-semibold text-zinc-600">Administrator</th>
                  <th className="py-4 px-6 font-semibold text-zinc-600">Role</th>
                  <th className="py-4 px-6 font-semibold text-zinc-600">Joined</th>
                  <th className="py-4 px-6 font-semibold text-zinc-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {admin.profilePhoto ? (
                          <img 
                            src={admin.profilePhoto} 
                            alt={admin.name} 
                            className="h-10 w-10 rounded-full object-cover border border-zinc-200 shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                            admin.role === 'SUPER_ADMIN' 
                              ? 'bg-purple-100 text-purple-700 border-purple-200' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {admin.name ? admin.name.charAt(0).toUpperCase() : (admin.role === 'SUPER_ADMIN' ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-900 flex items-center">
                            {admin.name}
                            {admin.id === currentUser?.id && (
                              <span className="ml-2 text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">You</span>
                            )}
                          </p>
                          <div className="flex items-center text-sm text-zinc-500 mt-1">
                            <Mail className="h-3 w-3 mr-1" /> {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-zinc-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button 
                        onClick={() => setAdminToReset(admin)}
                        title="Reset password to 'password'"
                        className="p-2 text-zinc-400 hover:text-amber-600 bg-white hover:bg-amber-50 rounded-lg border border-zinc-200 transition-colors"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      {admin.role !== 'SUPER_ADMIN' && (
                        <button 
                          onClick={() => setAdminToDelete(admin)}
                          title="Delete Administrator"
                          className="p-2 text-zinc-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-zinc-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-900">Provision New Admin</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-1">Temporary Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-red-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Remove Administrator</h3>
                <p className="text-xs text-zinc-500">Confirm Admin Account Removal</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 mb-4">
              Are you sure you want to permanently delete administrator account <strong>{adminToDelete.name}</strong> ({adminToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAdminToDelete(null)}
                disabled={isDeletingAdmin}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAdmin}
                disabled={isDeletingAdmin}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {isDeletingAdmin ? 'Deleting...' : 'Yes, Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Admin Password Modal */}
      {adminToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-amber-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Reset Admin Password</h3>
                <p className="text-xs text-zinc-500">Reset Account Credentials</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 mb-4">
              Are you sure you want to reset the password for <strong>{adminToReset.name}</strong> to the default password: <code className="px-1.5 py-0.5 bg-zinc-100 rounded text-amber-800 font-mono font-bold">password</code>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAdminToReset(null)}
                disabled={isResettingPassword}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                disabled={isResettingPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {isResettingPassword ? 'Resetting...' : 'Confirm Reset to "password"'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
