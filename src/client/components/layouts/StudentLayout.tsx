import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import TrialCountdownBadge from '../shared/TrialCountdownBadge';
import GlobalBrandLogo from '../shared/GlobalBrandLogo';
import { 
  Activity, 
  LayoutDashboard, 
  BookOpen, 
  PlaySquare, 
  HelpCircle, 
  Award, 
  MessageSquare, 
  Calculator, 
  Coins, 
  Trophy, 
  User, 
  Bell, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'My Courses', href: '/dashboard/my-courses', icon: BookOpen },
  { name: 'Videos', href: '/dashboard/videos', icon: PlaySquare },
  { name: 'Quizzes', href: '/dashboard/quizzes', icon: HelpCircle },
  { name: 'Results', href: '/dashboard/results', icon: Award },
  { name: 'Community', href: '/dashboard/community', icon: MessageSquare },
  { name: 'GP Calculator', href: '/dashboard/calculator', icon: Calculator },
  { name: 'Coins & Payments', href: '/dashboard/payments', icon: Coins },
  { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function StudentLayout() {
  const { user, studentData, logout } = useAuthStore();
  const { settings, frontendSettings } = useSettingsStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPaidOrApproved = Boolean(
    studentData?.isApproved || (studentData?.coins && studentData.coins > 0)
  );

  return (
    <div className="h-screen flex overflow-hidden bg-zinc-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-zinc-900 text-zinc-300 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 sm:h-20 px-5 sm:px-6 border-b border-zinc-800/60 shrink-0">
          <Link 
            to="/dashboard" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 group min-w-0"
          >
            <GlobalBrandLogo 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0"
              imageClassName="w-full h-full object-contain"
              variant="student"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-white tracking-tighter leading-none uppercase italic group-hover:text-red-500 transition-colors truncate">{settings?.siteTitle || 'MEDCORE ACADEMY'}</h1>
              <p className="text-[9px] font-bold text-amber-500 tracking-[0.2em] uppercase leading-none mt-1 truncate max-w-[130px] sm:max-w-[150px]">{settings?.siteSubtitle || 'UNI9JA MEDIA'}</p>
            </div>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close sidebar navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain py-3 sm:py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                id={item.name === 'Community' ? 'community-nav-link' : undefined}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group",
                  isActive 
                    ? "bg-red-600 text-white shadow-xs" 
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-white"
                )}
              >
                <Icon className={clsx("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-3 sm:p-4 bg-zinc-950/90 border-t border-zinc-800/80 shrink-0">
          <Link 
            to="/dashboard/settings" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 mb-3 px-2 group hover:bg-zinc-900/80 p-2 rounded-xl transition-colors cursor-pointer"
            title="Edit profile & upload photo"
          >
            <div 
              id="student-user-avatar"
              className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700 overflow-hidden shadow-inner"
            >
              {user?.profilePhoto ? (
                <img 
                  id="student-user-avatar-img"
                  src={user.profilePhoto} 
                  alt={user.name || 'Student'} 
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <User className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.studentId}</p>
            </div>
          </Link>
          <button
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
            className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-zinc-500 shrink-0" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <header className="bg-white border-b border-zinc-200 h-16 sm:h-20 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 z-10 shrink-0">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 mr-2 sm:mr-4 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-zinc-900 capitalize truncate">
              {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <div className="hidden xs:block">
              <TrialCountdownBadge 
                compact={true}
                accessExpiryDate={studentData?.accessExpiryDate}
                accessDaysRemaining={studentData?.accessDaysRemaining}
                isPaidOrApproved={isPaidOrApproved}
              />
            </div>
            <Link 
              to="/dashboard/payments" 
              className="flex items-center space-x-1 sm:space-x-1.5 bg-amber-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
              title="View coin balance and purchase packages"
            >
              <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-amber-800 whitespace-nowrap">
                {studentData?.coins || 0} <span className="hidden sm:inline">Coins</span>
              </span>
            </Link>
            <Link 
              to="/dashboard/notifications" 
              className="relative p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-600 bg-zinc-50 rounded-full border border-zinc-200 transition-colors shrink-0"
              title="Notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 block h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 lg:p-8 min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
