import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Send, Bell, ShieldAlert, CheckCircle, Info, Trash, Users, User, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

type StudentItem = {
  id: string; // user ID
  studentId: string; // student profile ID
  name: string;
  email: string;
};

type SentNotification = {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  createdAt: string;
};

export default function SendNotification() {
  const { token, user } = useAuthStore();
  
  // Compose form states
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedRecipientType, setSelectedRecipientType] = useState<'all' | 'specific'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(''); // targeted user ID
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');
  
  // Search state for student picker
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sent notifications history state
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load students & sent history
  const loadData = async () => {
    try {
      setIsLoading(true);
      // Fetch students
      const sRes = await fetch('/api/users/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(Array.isArray(sData) ? sData : []);
      }

      // Fetch sent history
      const hRes = await fetch('/api/users/notifications/sent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(Array.isArray(hData) ? hData : []);
      }
    } catch (err) {
      console.error('Failed to load notification assets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please specify both title and message text.' });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      const payload = {
        title,
        message,
        type,
        studentId: selectedRecipientType === 'specific' ? selectedStudentId : null
      };

      const res = await fetch('/api/users/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', text: 'Broadcast message successfully delivered!' });
        setTitle('');
        setMessage('');
        // Reload sent history
        loadData();
      } else {
        setStatus({ type: 'error', text: data.error || 'Failed to dispatch notification.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Network exception occurred dispatching notification.' });
    } finally {
      setIsSending(false);
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upper Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-purple-600" /> Academic Broadcast Center
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Send emergency announcements, transaction approvals, or quiz recommendations directly to students.</p>
        </div>
        <Link 
          to="/dashboard" 
          className="text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 active:scale-95 px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Exit Panel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Composition Form Section */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 space-y-6 shadow-xs h-fit">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-black text-zinc-950 tracking-tight">Compose Announcement</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Write alert details and select either targeted delivery or a general broadcast.</p>
          </div>

          {status && (
            <div className={`p-4 rounded-xl text-xs font-bold leading-relaxed border ${
              status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {status.text}
            </div>
          )}

          {/* Recipient Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">Recipient Target</label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => { setSelectedRecipientType('all'); setSelectedStudentId(''); }}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRecipientType === 'all' 
                    ? 'bg-zinc-900 text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> All Students
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecipientType('specific')}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRecipientType === 'specific' 
                    ? 'bg-zinc-900 text-white shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <User className="h-3.5 w-3.5" /> Specific Student
              </button>
            </div>
          </div>

          {/* Specific student selector with filter */}
          {selectedRecipientType === 'specific' && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider">Select Target Medical Student</label>
              
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter student names or emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
                />
              </div>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required={selectedRecipientType === 'specific'}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white outline-none font-bold"
              >
                <option value="">-- Choose student ({filteredStudents.length} available) --</option>
                {filteredStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Alert Type Indicator */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">Alert Level Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('info')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  type === 'info' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-black' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                Info (Blue)
              </button>
              <button
                type="button"
                onClick={() => setType('success')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  type === 'success' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                Success (Green)
              </button>
              <button
                type="button"
                onClick={() => setType('warning')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  type === 'warning' 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 font-black' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                Warning (Yellow)
              </button>
            </div>
          </div>

          {/* Message Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider">Message Header / Title</label>
            <input
              type="text"
              placeholder="e.g. Medcore Coin Transaction Verified"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-wider">Detailed Message Content</label>
            <textarea
              rows={4}
              placeholder="Provide exact details of the transaction status, coupon eligibility, or instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-800 resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] transition-all text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            {isSending ? 'Dispatching Broadcast...' : 'Deliver Notification'}
          </button>
        </form>

        {/* History Stream List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-black text-zinc-950 tracking-tight">Broadcast Delivery History</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Below is a list of previously published announcements, sorted newest to oldest.</p>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-zinc-400 text-xs font-bold animate-pulse">Retrieving delivery logs...</div>
          ) : history.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center">
              <Bell className="h-10 w-10 text-zinc-200 mb-3 animate-pulse" />
              <p className="text-xs font-bold text-zinc-700">No sent broadcasts</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 max-w-xs text-center">Your composition channel is completely clean! Write your first broadcast to publish.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((hItem) => {
                const matchedStudent = students.find(s => s.id === hItem.userId);
                const isBroadcast = !hItem.userId;
                const formattedDate = new Date(hItem.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={hItem.id} className="p-4 border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 rounded-2xl transition-all flex items-start gap-3 relative">
                    <div className="shrink-0 mt-0.5">
                      {hItem.type === 'warning' ? (
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                      ) : hItem.type === 'success' ? (
                        <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                          <Info className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-zinc-950 truncate">{hItem.title}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase shrink-0">{formattedDate}</span>
                      </div>
                      
                      {/* Recipient chip */}
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-md ${
                        isBroadcast ? 'bg-purple-100 text-purple-800' : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {isBroadcast ? '📢 Broadcast: All Students' : `🎯 Target: ${matchedStudent ? matchedStudent.name : 'Target Student'}`}
                      </span>

                      <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">{hItem.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
