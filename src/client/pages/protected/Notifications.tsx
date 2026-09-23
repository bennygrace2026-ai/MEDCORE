import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Bell, ShieldAlert, CheckCircle, Info, Eye } from 'lucide-react';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  isRead: boolean;
  createdAt: string;
};

export default function Notifications() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const handleMarkAsRead = async (id?: string) => {
    try {
      const res = await fetch('/api/users/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        if (id) {
          // Update local state to mark single notification as read
          setNotifications(prev =>
            prev.map(note => (note.id === id ? { ...note, isRead: true } : note))
          );
          setToast({ type: 'success', message: 'Notification marked as read.' });
        } else {
          // Update all to read
          setNotifications(prev =>
            prev.map(note => ({ ...note, isRead: true }))
          );
          setToast({ type: 'success', message: 'All notifications marked as read.' });
        }
      } else {
        setToast({ type: 'error', message: 'Failed to update notification state.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Error marking read.' });
    }
  };

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle className={`h-4 w-4 ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-500'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Academic Notifications</h2>
          <p className="text-xs text-zinc-500 mt-1">Stay up-to-date with medical broadcasts, coin updates, and course warnings from Medcore Academy admins.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={() => handleMarkAsRead()}
            className="text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 active:scale-95 px-4 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <Eye className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-zinc-500 font-bold">Querying academic announcements feed...</div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {notifications.map((note) => {
              const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={note.id} 
                  className={`p-6 flex items-start gap-4 hover:bg-zinc-50 transition-all duration-150 relative ${
                    !note.isRead ? 'bg-purple-50/20' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {note.type === 'warning' ? (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                    ) : note.type === 'success' ? (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
                        <Info className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className={`text-sm font-black tracking-tight ${!note.isRead ? 'text-zinc-900' : 'text-zinc-700'}`}>
                        {note.title}
                      </h4>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{formattedDate}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">{note.message}</p>
                    
                    {!note.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(note.id)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="h-3 w-3" /> Mark as Read
                      </button>
                    )}
                  </div>

                  {!note.isRead && (
                    <div className="absolute right-6 top-6 shrink-0">
                      <span className="h-2 w-2 bg-purple-600 rounded-full block animate-ping"></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center flex flex-col items-center justify-center min-h-[350px]">
            <Bell className="h-14 w-14 text-zinc-200 mb-4 animate-bounce" />
            <h4 className="text-base font-black text-zinc-950">Zero Unread Broadcasts</h4>
            <p className="text-zinc-500 text-xs max-w-sm mt-1">You are perfectly caught up! Announcements and alerts published by admins will appear right here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
