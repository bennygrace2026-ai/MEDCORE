import { useState, useEffect } from 'react';
import { Users, BookOpen, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState({ students: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Stats error', err);
      }
    };
    if (token) fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Admin Dashboard</h2>
        <p className="text-zinc-500">Manage students, courses, and verify manual payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Students</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.students}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Payments</p>
            <p className="text-2xl font-bold text-zinc-900">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Active Courses</p>
            <p className="text-2xl font-bold text-zinc-900">0</p>
          </div>
        </div>
      </div>
      
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-12 text-center">
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Welcome to the Admin Portal</h3>
        <p className="text-zinc-500 max-w-md mx-auto">
          Use the sidebar to navigate through the student management, course creation, and payment verification modules.
        </p>
      </div>
    </div>
  );
}
