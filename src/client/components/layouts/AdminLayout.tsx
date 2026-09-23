import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import GlobalBrandLogo from '../shared/GlobalBrandLogo';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  MessageSquare,
  Activity,
  Video,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Manage Students', href: '/admin/students', icon: Users },
  { name: 'Manage Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Video Lectures', href: '/admin/videos', icon: Video },
  { name: 'Manual Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Community Chat', href: '/admin/community', icon: MessageSquare },
  { name: 'Send Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'Account Profile', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { settings, frontendSettings } = useSettingsStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            to="/admin" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 group min-w-0"
          >
            <GlobalBrandLogo 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0"
              imageClassName="w-full h-full object-contain"
              variant="admin"
            />
            <div className="min-w-0">
              <h1 className="text-xs font-black text-white tracking-tighter leading-none uppercase italic group-hover:text-blue-400 transition-colors truncate">{settings?.siteTitle || 'MEDCORE ACADEMY'}</h1>
              <p className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase leading-none mt-1 truncate max-w-[130px] sm:max-w-[140px]">ADMIN PORTAL</p>
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
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/admin');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-xs" 
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
            to="/admin/settings" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center space-x-3 mb-3 px-2 group hover:bg-zinc-900/80 p-2 rounded-xl transition-colors cursor-pointer"
            title="Edit profile & upload photo"
          >
            <div 
              id="admin-user-avatar"
              className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 border border-blue-500/40 overflow-hidden shadow-inner"
            >
              {user?.profilePhoto ? (
                <img 
                  id="admin-user-avatar-img"
                  src={user.profilePhoto} 
                  alt={user.name || 'Admin'} 
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{user?.name}</p>
              <p className="text-xs text-blue-400 truncate">Administrator</p>
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
              Admin Panel
            </h2>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              to="/"
              className="flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 rounded-xl text-xs font-bold transition-colors"
            >
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
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
