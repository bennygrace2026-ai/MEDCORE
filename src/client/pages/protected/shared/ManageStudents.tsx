import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Coins, 
  MinusCircle, 
  PlusCircle, 
  ShieldAlert, 
  Trash2, 
  Clock, 
  UserX, 
  UserCheck, 
  AlertTriangle,
  FileText,
  ExternalLink,
  Ban,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  X
} from 'lucide-react';
import { format } from 'date-fns';

type Student = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  institution: string;
  department: string;
  level: string;
  coins: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  isApproved: boolean;
  paymentProofUrl?: string;
  profilePhoto?: string;
  createdAt: string;
};

export default function ManageStudents() {
  const { token, user } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Action Modal State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Dedicated Functional Modals
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToResetPassword, setStudentToResetPassword] = useState<Student | null>(null);
  const [customPassword, setCustomPassword] = useState<string>('password');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [resetSuccessInfo, setResetSuccessInfo] = useState<{ newPassword: string; studentName: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [pageToast, setPageToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal Fields
  const [addDays, setAddDays] = useState<number | ''>('');
  const [giftCoins, setGiftCoins] = useState<number | ''>('');
  const [deductCoins, setDeductCoins] = useState<number | ''>('');
  const [accountStatus, setAccountStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED'>('ACTIVE');
  const [setApproved, setSetApproved] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss page notifications
  useEffect(() => {
    if (pageToast) {
      const timer = setTimeout(() => setPageToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [pageToast]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
        if (selectedStudent) {
          const updated = data.find((s: Student) => s.studentId === selectedStudent.studentId);
          if (updated) setSelectedStudent(updated);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const openActionModal = (student: Student) => {
    setSelectedStudent(student);
    setAddDays('');
    setGiftCoins('');
    setDeductCoins('');
    setAccountStatus(student.status || 'ACTIVE');
    setSetApproved(student.isApproved);
    setFeedback(null);
    setShowActionModal(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;
    setIsUpdating(true);
    setFeedback(null);

    const giftNum = giftCoins ? Number(giftCoins) : undefined;
    const deductNum = deductCoins ? Number(deductCoins) : undefined;
    const daysNum = addDays ? Number(addDays) : undefined;

    try {
      const response = await fetch(`/api/users/students/${selectedStudent.studentId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          addDays: daysNum,
          giftCoins: giftNum,
          deductCoins: deductNum,
          status: accountStatus,
          setApproved
        })
      });

      const data = await response.json();

      if (response.ok) {
        setFeedback({ type: 'success', message: data.message || 'Student updated successfully!' });
        await fetchStudents();
        setTimeout(() => {
          setShowActionModal(false);
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update student' });
      }
    } catch (error) {
      console.error('Upgrade error', error);
      setFeedback({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Open dedicated modals
  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
  };

  const openResetPasswordModal = (student: Student) => {
    setStudentToResetPassword(student);
    setCustomPassword('password');
    setShowPassword(false);
    setResetSuccessInfo(null);
    setCopiedPassword(false);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Try deleting by studentId
      let response = await fetch(`/api/users/students/${encodeURIComponent(studentToDelete.studentId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 2. Fallback to userId if needed
      if (!response.ok && studentToDelete.id) {
        response = await fetch(`/api/users/students/${encodeURIComponent(studentToDelete.id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const data = await response.json();

      if (response.ok) {
        setPageToast({
          type: 'success',
          message: `Student ${studentToDelete.name} (${studentToDelete.studentId}) was permanently removed.`
        });
        setStudentToDelete(null);
        setShowActionModal(false);
        await fetchStudents();
      } else {
        setPageToast({
          type: 'error',
          message: data.error || 'Failed to remove student from system.'
        });
      }
    } catch (error) {
      console.error('Delete student error:', error);
      setPageToast({
        type: 'error',
        message: 'Network error occurred while attempting to remove student.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!studentToResetPassword) return;

    const trimmedPassword = customPassword.trim() || 'password';
    if (trimmedPassword.length < 6) {
      setPageToast({
        type: 'error',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(studentToResetPassword.id)}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: trimmedPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        const effectivePassword = data.newPassword || trimmedPassword;
        setResetSuccessInfo({
          newPassword: effectivePassword,
          studentName: studentToResetPassword.name
        });
        setPageToast({
          type: 'success',
          message: `Password for ${studentToResetPassword.name} reset to "${effectivePassword}".`
        });
      } else {
        setPageToast({
          type: 'error',
          message: data.error || 'Failed to reset password.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setPageToast({
        type: 'error',
        message: 'Network error while attempting to reset password.'
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyPasswordToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handleQuickStatus = async (student: Student, newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED') => {
    try {
      const response = await fetch(`/api/users/students/${student.studentId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        setPageToast({
          type: 'success',
          message: `Status of ${student.name} updated to ${newStatus}.`
        });
        await fetchStudents();
      } else {
        const data = await response.json();
        setPageToast({
          type: 'error',
          message: data.error || `Failed to update status to ${newStatus}`
        });
      }
    } catch (error) {
      console.error('Quick status error', error);
      setPageToast({
        type: 'error',
        message: 'Network error updating student status.'
      });
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(search.toLowerCase()) || 
    student.email.toLowerCase().includes(search.toLowerCase()) ||
    student.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {pageToast && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          pageToast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          pageToast.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
          'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {pageToast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" /> :
             pageToast.type === 'error' ? <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" /> :
             <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0" />}
            <span>{pageToast.message}</span>
          </div>
          <button 
            onClick={() => setPageToast(null)} 
            className="p-1 hover:bg-black/5 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Registered Students Management</h2>
          <p className="text-sm text-zinc-500">
            View student profiles, manage coin balances (deductions & credits), adjust status (Active, Suspend, Ban), or remove accounts.
          </p>
        </div>
        <div className="flex items-center bg-zinc-100 rounded-xl px-3 py-2 border border-zinc-200 w-full sm:w-80">
          <Search className="h-4 w-4 text-zinc-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search by name, email, or Medcore ID..." 
            className="bg-transparent border-none focus:ring-0 outline-none text-xs w-full text-zinc-800 placeholder-zinc-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Medcore ID</th>
                <th className="px-6 py-4 font-semibold">Coins Balance</th>
                <th className="px-6 py-4 font-semibold">Academic Profile</th>
                <th className="px-6 py-4 font-semibold">Account Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="h-8 w-8 bg-zinc-200 rounded-full mb-3"></div>
                      <p className="text-xs">Loading student records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Users className="mx-auto h-10 w-10 text-zinc-300 mb-2" />
                    <p className="text-base font-bold text-zinc-900">No students found</p>
                    <p className="text-xs text-zinc-400">There are no registered students matching your search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSuspended = student.status === 'SUSPENDED';
                  const isBanned = student.status === 'BANNED';
                  const isActive = !student.status || student.status === 'ACTIVE';

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {student.profilePhoto ? (
                            <img 
                              src={student.profilePhoto} 
                              alt={student.name} 
                              className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-zinc-200 shadow-sm"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm border ${
                              isBanned ? 'bg-red-100 text-red-700 border-red-200' :
                              isSuspended ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                              {student.name}
                              {student.isApproved && (
                                <span title="Approved" className="inline-block">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {student.studentId}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs border border-amber-200">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          {(student.coins || 0).toLocaleString()} Coins
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <div className="text-zinc-900 font-medium">{student.institution || 'Institution N/A'}</div>
                        <div className="text-zinc-500">{student.department || 'General'} • {student.level || 'Year 1'}</div>
                      </td>

                      <td className="px-6 py-4">
                        {isBanned ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <Ban className="w-3 h-3 mr-1 text-red-600" /> Banned
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActionModal(student)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                          >
                            <span>Action</span>
                          </button>
                          
                          {/* Direct Reset Password Button */}
                          <button
                            onClick={() => openResetPasswordModal(student)}
                            title="Reset student password"
                            className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-zinc-200"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          {/* Quick Ban/Suspend */}
                          {isActive ? (
                            <button
                              onClick={() => handleQuickStatus(student, 'SUSPENDED')}
                              title="Suspend student"
                              className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-zinc-200"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickStatus(student, 'ACTIVE')}
                              title="Reinstate student to Active"
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-zinc-200"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}

                          {/* Direct Delete / Remove Student Totally Button */}
                          <button
                            onClick={() => openDeleteModal(student)}
                            title="Remove student totally"
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-zinc-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Action Modal */}
      {showActionModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <div className="flex items-center gap-3">
                {selectedStudent.profilePhoto ? (
                  <img 
                    src={selectedStudent.profilePhoto} 
                    alt={selectedStudent.name} 
                    className="h-10 w-10 rounded-full object-cover border border-zinc-200 shadow-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    Student Action: {selectedStudent.name}
                    <span className="text-xs font-mono font-normal bg-zinc-200 px-2 py-0.5 rounded text-zinc-700">
                      {selectedStudent.studentId}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowActionModal(false)} 
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-200"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {feedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Current Status & Balance Banner */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Current Coin Balance</span>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5 mt-0.5">
                    <Coins className="h-5 w-5" />
                    {(selectedStudent.coins || 0).toLocaleString()} Coins
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider block">Current Status</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedStudent.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                    selectedStudent.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedStudent.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Payment Proof (if uploaded) */}
              {selectedStudent.paymentProofUrl && (
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span>Uploaded Payment Receipt</span>
                    </div>
                    <a 
                      href={selectedStudent.paymentProofUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border border-amber-200 shadow-xs"
                    >
                      View Receipt <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to approve this student's registration access?`)) return;
                          try {
                            const res = await fetch(`/api/users/students/${selectedStudent.studentId}/upgrade`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                setApproved: true,
                                giftCoins: 100
                              })
                            });
                            if (res.ok) {
                              setPageToast({
                                type: 'success',
                                message: `Access approved and 100 coins credited successfully!`
                              });
                              await fetchStudents();
                            } else {
                              const d = await res.json();
                              setPageToast({ type: 'error', message: d.error || 'Failed to approve access' });
                            }
                          } catch (err: any) {
                            setPageToast({ type: 'error', message: err.message || 'Error occurred.' });
                          }
                        }}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve Payment & Credit
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to permanently delete this student\'s uploaded payment proof image to free cloud storage?')) return;
                          try {
                            const res = await fetch(`/api/users/students/${selectedStudent.studentId}/payment-proof`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (res.ok) {
                              setPageToast({
                                type: 'success',
                                message: 'Payment proof deleted successfully!'
                              });
                              await fetchStudents();
                            } else {
                              const d = await res.json();
                              setPageToast({ type: 'error', message: d.error || 'Failed to delete proof' });
                            }
                          } catch (err: any) {
                            setPageToast({ type: 'error', message: err.message || 'Error occurred.' });
                          }
                        }}
                        className="py-1.5 px-3 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors inline-flex items-center justify-center gap-1"
                        title="Delete uploaded receipt file"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Proof
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Coin Deduction & Addition Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-emerald-600" /> Coin Management (Credit or Adjust)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gift / Add coins */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-300 space-y-1.5">
                    <label className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-600" /> Gift / Add Coins
                    </label>
                    <input 
                      type="number"
                      min="1"
                      placeholder="e.g. 100 or 1000"
                      value={giftCoins}
                      onChange={(e) => {
                        setGiftCoins(e.target.value ? Number(e.target.value) : '');
                        if (e.target.value) setDeductCoins('');
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <div className="flex gap-1 pt-1">
                      {[50, 100, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setGiftCoins(amt); setDeductCoins(''); }}
                          className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Coins credited are ready for the student to spend on quizzes and courses.
                    </p>
                  </div>

                  {/* Deduct coins */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                      <MinusCircle className="h-3.5 w-3.5 text-red-600" /> Deduct Coins (Penalty)
                    </label>
                    <input 
                      type="number"
                      min="1"
                      placeholder="e.g. 30 or 100"
                      value={deductCoins}
                      onChange={(e) => {
                        setDeductCoins(e.target.value ? Number(e.target.value) : '');
                        if (e.target.value) setGiftCoins('');
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-zinc-300 rounded-lg focus:ring-1 focus:ring-zinc-400 outline-none"
                    />
                    <div className="flex gap-1 pt-1">
                      {[30, 60, 100].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => { setDeductCoins(amt); setGiftCoins(''); }}
                          className="px-2 py-0.5 bg-white hover:bg-zinc-100 text-zinc-800 text-[10px] font-bold rounded border border-zinc-300"
                        >
                          -{amt}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      Manual deduction only.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status (Active, Suspended, Banned) */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-purple-600" /> Account Status (Suspend or Ban)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    accountStatus === 'ACTIVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="ACTIVE"
                      checked={accountStatus === 'ACTIVE'}
                      onChange={() => setAccountStatus('ACTIVE')}
                      className="sr-only"
                    />
                    <UserCheck className="h-4 w-4 mb-1 text-emerald-600" />
                    <span className="text-xs">Active</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    accountStatus === 'SUSPENDED'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="SUSPENDED"
                      checked={accountStatus === 'SUSPENDED'}
                      onChange={() => setAccountStatus('SUSPENDED')}
                      className="sr-only"
                    />
                    <AlertTriangle className="h-4 w-4 mb-1 text-amber-600" />
                    <span className="text-xs">Suspend</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    accountStatus === 'BANNED'
                      ? 'bg-red-50 border-red-500 text-red-900 font-bold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="BANNED"
                      checked={accountStatus === 'BANNED'}
                      onChange={() => setAccountStatus('BANNED')}
                      className="sr-only"
                    />
                    <Ban className="h-4 w-4 mb-1 text-red-600" />
                    <span className="text-xs">Ban</span>
                  </label>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Suspended and banned students are blocked from logging in and cannot access any courses or quizzes.
                </p>
              </div>

              {/* Access Days & Approval Section */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" /> Access Days & Approval
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Grant Free Days</label>
                    <input 
                      type="number" 
                      min="1" max="366"
                      value={addDays}
                      onChange={(e) => setAddDays(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200">
                    <label className="text-xs font-medium text-zinc-700">Approve Student</label>
                    <input 
                      type="checkbox" 
                      checked={setApproved}
                      onChange={(e) => setSetApproved(e.target.checked)}
                      className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Administrative Security: Reset Password */}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-amber-600" /> Administrative Security
                  </h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-amber-900">
                        Reset Student Password
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionModal(false);
                          openResetPasswordModal(selectedStudent);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Key className="h-3.5 w-3.5" />
                        Reset Password
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Restore or override login password for this student. Allows quick reset to default or a custom password.
                    </p>
                  </div>
                </div>
              )}

              {/* Danger Zone: Remove Student Totally */}
              <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                    <Trash2 className="h-4 w-4 text-red-600" /> Danger Zone: Remove Student Totally
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionModal(false);
                      openDeleteModal(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove Student Totally
                  </button>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Permanently deletes this student's account, enrollments, and payment history from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end space-x-3">
              <button 
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStudent}
                disabled={isUpdating}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving Changes...' : 'Save & Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Functional Modal: Remove Student Totally */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 border border-red-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Remove Student Totally</h3>
                  <p className="text-xs text-zinc-500">Permanent Database Removal</p>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Student Name:</span>
                  <span className="font-semibold text-zinc-900">{studentToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-semibold text-zinc-900">{studentToDelete.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Medcore ID:</span>
                  <span className="font-mono font-semibold text-zinc-900">{studentToDelete.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Coins Balance:</span>
                  <span className="font-semibold text-amber-600">{(studentToDelete.coins || 0).toLocaleString()} Coins</span>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-xs text-red-800 leading-relaxed">
                <strong>Attention:</strong> This operation will permanently remove the student's authentication account, profile, course enrollments, quiz attempts, study sessions, and payment history. This action cannot be reversed.
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteStudent}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Removing Totally...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Yes, Remove Student Totally</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Functional Modal: Reset Password */}
      {studentToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 border border-amber-200">
            <div className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Reset Student Password</h3>
                  <p className="text-xs text-zinc-500">Restore or Update Student Access</p>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 mb-4 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Student:</span>
                  <span className="font-semibold text-zinc-900">{studentToResetPassword.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="font-semibold text-zinc-900">{studentToResetPassword.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Medcore ID:</span>
                  <span className="font-mono font-semibold text-zinc-900">{studentToResetPassword.studentId}</span>
                </div>
              </div>

              {resetSuccessInfo ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Password Successfully Reset!
                  </div>
                  <p className="text-xs text-emerald-700">
                    The student can now log in using the new password below:
                  </p>
                  <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2.5">
                    <span className="font-mono font-bold text-sm text-zinc-900">{resetSuccessInfo.newPassword}</span>
                    <button
                      type="button"
                      onClick={() => copyPasswordToClipboard(resetSuccessInfo.newPassword)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Password</span>
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentToResetPassword(null);
                      setResetSuccessInfo(null);
                    }}
                    className="w-full mt-2 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-5">
                    <label className="block text-xs font-bold text-zinc-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Quick preset chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-zinc-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCustomPassword('password')}
                        className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono text-zinc-700 transition-colors"
                      >
                        password
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPassword('password123')}
                        className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono text-zinc-700 transition-colors"
                      >
                        password123
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPassword('student2026')}
                        className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[11px] font-mono text-zinc-700 transition-colors"
                      >
                        student2026
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentToResetPassword(null)}
                      disabled={isResettingPassword}
                      className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmResetPassword}
                      disabled={isResettingPassword || customPassword.trim().length < 6}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isResettingPassword ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Resetting Password...</span>
                        </>
                      ) : (
                        <>
                          <Key className="h-3.5 w-3.5" />
                          <span>Confirm Reset Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
