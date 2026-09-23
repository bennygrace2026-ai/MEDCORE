import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { LogOut, Menu, X, BookOpen, Calculator, Coins, Home, Mail, ArrowRight } from 'lucide-react';
import GlobalBrandLogo from '../shared/GlobalBrandLogo';

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { settings, frontendSettings } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const siteTitle = settings?.siteTitle || 'Medcore Academy';
  const siteSubtitle = settings?.siteSubtitle || 'UNI9JA MEDIA';
  const contactEmail = frontendSettings?.contactEmail || 'support@medcore.com';
  const contactPhone = frontendSettings?.contactPhone || '+1 (555) 000-0000';

  const dashboardPath = user?.role === 'SUPER_ADMIN' ? '/super-admin' : user?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link 
              to={isAuthenticated ? dashboardPath : '/'} 
              className="flex items-center space-x-2.5 sm:space-x-3.5 group min-w-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <GlobalBrandLogo 
                id="header-brand-logo-container"
                imgId="header-brand-logo-img"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-300 shrink-0 bg-transparent flex items-center justify-center"
                imageClassName="w-full h-full object-contain filter drop-shadow-sm select-none"
                variant="public"
              />
              <div className="flex flex-col min-w-0">
                <h1 className="text-base sm:text-xl font-black text-zinc-900 tracking-tighter leading-none uppercase italic decoration-red-600 group-hover:text-red-600 transition-colors truncate">{siteTitle}</h1>
                <p className="text-[9px] sm:text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase leading-none mt-1 truncate">{siteSubtitle}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-red-600 font-bold' : 'text-zinc-600 hover:text-red-600'}`}>Home</Link>
              <Link to="/courses" className={`text-sm font-medium transition-colors ${location.pathname.startsWith('/courses') ? 'text-red-600 font-bold' : 'text-zinc-600 hover:text-red-600'}`}>Courses</Link>
              <Link to="/pricing" className={`text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'text-red-600 font-bold' : 'text-zinc-600 hover:text-red-600'}`}>Pricing & Coins</Link>
              <Link to="/dashboard/calculator" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard/calculator' ? 'text-red-600 font-bold' : 'text-zinc-600 hover:text-red-600'}`}>GP Calculator</Link>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-sm font-medium text-zinc-600 hidden lg:block">
                    Welcome, {user?.name?.split(' ')[0]}
                  </span>
                  <Link 
                    to={dashboardPath} 
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="text-xs sm:text-sm font-medium text-zinc-600 hover:text-red-600 transition-colors px-2 py-1.5"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="inline-flex items-center px-3.5 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-xl text-white bg-zinc-900 hover:bg-black transition-colors shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile/Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === '/' ? 'bg-red-50 text-red-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <Home className="h-4 w-4 mr-3 text-zinc-400" />
              Home
            </Link>
            <Link
              to="/courses"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname.startsWith('/courses') ? 'bg-red-50 text-red-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <BookOpen className="h-4 w-4 mr-3 text-zinc-400" />
              Courses
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'bg-red-50 text-red-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <Coins className="h-4 w-4 mr-3 text-zinc-400" />
              Pricing & Coins
            </Link>
            <Link
              to="/dashboard/calculator"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === '/dashboard/calculator' ? 'bg-red-50 text-red-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <Calculator className="h-4 w-4 mr-3 text-zinc-400" />
              GP Calculator
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${location.pathname === '/contact' ? 'bg-red-50 text-red-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              <Mail className="h-4 w-4 mr-3 text-zinc-400" />
              Contact Support
            </Link>

            {!isAuthenticated && (
              <div className="pt-3 mt-2 border-t border-zinc-100 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 px-4 text-center rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 px-4 text-center rounded-xl text-xs font-bold text-white bg-zinc-900 hover:bg-black transition-colors shadow-xs"
                >
                  Get Started <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col min-w-0 w-full overflow-x-hidden">
        <Outlet />
      </main>

      <footer className="bg-zinc-900 text-zinc-400 py-10 sm:py-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-3.5 mb-5 group">
              <GlobalBrandLogo 
                id="footer-brand-logo-container"
                imgId="footer-brand-logo-img"
                className="w-10 h-10 rounded-xl shrink-0"
                imageClassName="w-full h-full object-contain drop-shadow-sm"
                variant="public"
              />
              <div className="min-w-0">
                <h2 className="text-lg font-black text-white tracking-tighter leading-none uppercase italic truncate">{siteSubtitle}</h2>
                <p className="text-[10px] font-bold text-amber-500 tracking-[0.2em] uppercase leading-none mt-1 truncate">{siteTitle}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm">
              Empowering medical students with world-class education, comprehensive quiz engines, and an active learning community.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">Platform</h3>
            <ul className="space-y-2.5 sm:space-y-3">
              <li><Link to="/courses" className="text-sm hover:text-white transition-colors">All Courses</Link></li>
              <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing & Coins</Link></li>
              <li><Link to="/dashboard/calculator" className="text-sm hover:text-white transition-colors">GP Calculator</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">Contact</h3>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="text-sm text-zinc-400 break-all">{contactEmail}</li>
              <li className="text-sm text-zinc-400">{contactPhone}</li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact Form</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-zinc-800 text-xs sm:text-sm text-center text-zinc-500">
          &copy; {new Date().getFullYear()} {siteSubtitle} {siteTitle}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
