import { useState, useEffect } from 'react';
import { Users, Database, ShieldAlert, CreditCard, TrendingUp, Sparkles, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

export default function SuperAdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState({ 
    admins: 0, 
    students: 0, 
    totalRevenue: 0, 
    trends: [] as Array<{ date: string; registrations: number; coinVolume: number }>
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/users/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Stats error', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Upper Welcome Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" /> Super Admin Control Dashboard
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Real-time system health metrics, financial insights, and student engagement graphs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-400 border border-zinc-200 px-4 py-2 rounded-xl bg-zinc-50 w-fit">
          <Database className="h-3.5 w-3.5 text-emerald-500" /> DB Connection Status: Active
        </div>
      </div>

      {/* Main KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">Total Administrators</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">{stats.admins}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">Registered Students</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">{stats.students}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">Gross Revenue (NGN)</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">₦{(stats.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex items-start space-x-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">Coin Activity Peak</p>
            <p className="text-3xl font-black text-zinc-900 mt-1">High</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Registrations Line Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/95 shadow-sm hover:shadow-md transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-black text-zinc-950 tracking-tight uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-600" /> Daily Student Registration Trends
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Number of new medical students registering over the past 7 days.</p>
          </div>
          
          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-bold">Assembling charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'black', color: '#a1a1aa' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    name="Student Sign-ups" 
                    stroke="#7c3aed" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#regColor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daily Coin Transactions Volume Bar Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/95 shadow-sm hover:shadow-md transition-all">
          <div className="mb-4">
            <h3 className="text-sm font-black text-zinc-950 tracking-tight uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-amber-600" /> Coin Transaction Volumes
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Volume of standard coins successfully credited to students per day.</p>
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-bold">Assembling charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: 'none', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'black', color: '#a1a1aa' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar 
                    dataKey="coinVolume" 
                    name="Transaction Coins Credited" 
                    fill="#d97706" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Super Admin Notice Summary Card */}
      <div className="bg-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h3 className="text-lg font-black tracking-tight mb-2 flex items-center gap-2">
            🛡️ Platform Auditing Mode Active
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All system configurations, sub-admin accounts, database nodes, global package values, and course publish state overrides are active. Ensure modifications made correspond with Medcore Academy's official standards.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-at-b from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
