import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useAuthStore } from './client/store/authStore';
import { useSettingsStore } from './client/store/settingsStore';

// Components
import ErrorBoundary from './client/components/shared/ErrorBoundary';
import GlobalLoader from './client/components/shared/GlobalLoader';

// Layouts
import PublicLayout from './client/components/layouts/PublicLayout';
import StudentLayout from './client/components/layouts/StudentLayout';
import AdminLayout from './client/components/layouts/AdminLayout';
import SuperAdminLayout from './client/components/layouts/SuperAdminLayout';
import ProtectedRoute from './client/components/auth/ProtectedRoute';

// Public Pages
import Home from './client/pages/public/Home';
import Login from './client/pages/public/Login';
import Register from './client/pages/public/Register';
import Courses from './client/pages/public/Courses';
import Pricing from './client/pages/public/Pricing';
import Contact from './client/pages/public/Contact';
import AdminLogin from './client/pages/public/AdminLogin';
import SuperAdminLogin from './client/pages/public/SuperAdminLogin';
import NotFound from './client/pages/public/NotFound';

// Protected Student Pages
import StudentDashboard from './client/pages/protected/StudentDashboard';
import Calculator from './client/pages/protected/Calculator';
import AllCourses from './client/pages/protected/AllCourses';
import MyCourses from './client/pages/protected/MyCourses';
import Videos from './client/pages/protected/Videos';
import Quizzes from './client/pages/protected/Quizzes';
import Results from './client/pages/protected/Results';
import Community from './client/pages/protected/Community';
import Payments from './client/pages/protected/Payments';
import Achievements from './client/pages/protected/Achievements';
import Profile from './client/pages/protected/Profile';
import Notifications from './client/pages/protected/Notifications';
import Settings from './client/pages/protected/Settings';

// Admin Pages
import AdminDashboard from './client/pages/protected/AdminDashboard';
import SuperAdminDashboard from './client/pages/protected/SuperAdminDashboard';
import AdminCourseEngine from './client/pages/protected/superadmin/AdminCourseEngine';
import AdminQuizEngine from './client/pages/protected/superadmin/AdminQuizEngine';
import ManageStudents from './client/pages/protected/shared/ManageStudents';
import AdminVideos from './client/pages/protected/shared/AdminVideos';
import SendNotification from './client/pages/protected/shared/SendNotification';
import AdminManagement from './client/pages/protected/superadmin/AdminManagement';
import Financials from './client/pages/protected/superadmin/Financials';
import SystemSettings from './client/pages/protected/superadmin/SystemSettings';
import FrontendSettings from './client/pages/protected/superadmin/FrontendSettings';
import AdminPayments from './client/pages/protected/admin/AdminPayments';
import AdminSettings from './client/pages/protected/admin/AdminSettings';
import AdminCommunityChat from './client/pages/protected/admin/AdminCommunityChat';
import SuperAdminCommunityChat from './client/pages/protected/superadmin/SuperAdminCommunityChat';

function SEOMetadataManager() {
  const location = useLocation();
  const { settings, frontendSettings } = useSettingsStore();

  const path = location.pathname;
  const isPublic = [
    '/',
    '/login',
    '/register',
    '/courses',
    '/pricing',
    '/contact',
    '/admin/login',
    '/super-admin/login'
  ].includes(path);

  // Robots indexing rule: index public pages, keep private student/admin portals out of search results
  const robotsRule = isPublic ? 'index, follow' : 'noindex, nofollow';

  // Branded Title
  let title = settings?.siteTitle || 'Medcore Academy';
  let description = frontendSettings?.heroSubheading || 'Accelerate Your Medical Career. Join thousands of medical students passing their exams with our precision-engineered mock tests.';
  
  if (path === '/') {
    title = `${settings?.siteTitle || 'Medcore Academy'} | Master Medicine with Precision`;
  } else if (path === '/login' || path === '/register') {
    title = `Sign In | ${settings?.siteTitle || 'Medcore Academy'}`;
  } else if (path === '/courses') {
    title = `Our Clinical Courses | ${settings?.siteTitle || 'Medcore Academy'}`;
  } else if (path === '/pricing') {
    title = `Affordable High-Yield Plans | ${settings?.siteTitle || 'Medcore Academy'}`;
  } else if (path === '/contact') {
    title = `Contact Clinical Support | ${settings?.siteTitle || 'Medcore Academy'}`;
  } else if (path.startsWith('/dashboard')) {
    title = `Student Learning Portal | ${settings?.siteTitle || 'Medcore Academy'}`;
    description = 'Access your clinical lectures, board-style practice questions, mock tests, and virtual peer study rooms.';
  } else if (path.startsWith('/admin')) {
    title = `Academy Administrator Dashboard | ${settings?.siteTitle || 'Medcore Academy'}`;
  } else if (path.startsWith('/super-admin')) {
    title = `Main Controller Panel | ${settings?.siteTitle || 'Medcore Academy'}`;
  }

  const canonicalUrl = window.location.origin + path;
  
  // Use uploaded brand logo or professional high-resolution medical education banner image as fallback for OpenGraph card
  const socialImage = frontendSettings?.heroLogo || frontendSettings?.loginLogo || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80';

  return (
    <Helmet>
      {/* Search Engine Optimization meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsRule} />

      {/* Facebook OpenGraph social sharing meta tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:site_name" content={settings?.siteTitle || 'Medcore Academy'} />

      {/* Twitter / X card social sharing meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
    </Helmet>
  );
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const { fetchSettings, settings } = useSettingsStore();
  const [showApp, setShowApp] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('Connecting to Medcore clinical database...');

  useEffect(() => {
    if (settings?.siteTitle) {
      document.title = settings.siteSubtitle ? `${settings.siteTitle} | ${settings.siteSubtitle}` : settings.siteTitle;
    }
  }, [settings?.siteTitle, settings?.siteSubtitle]);

  useEffect(() => {
    // 1. Kickoff asynchronous auth & configuration updates in the background
    Promise.allSettled([checkAuth(), fetchSettings()]);

    // 2. High-Fidelity 15-second Initialization sequence
    const totalTimeMs = 15000;
    const intervalMs = 150; // increment 1% every 150ms
    const totalSteps = totalTimeMs / intervalMs; // 100 steps
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setLoadingProgress(currentPct);

      // Dynamically cycle through key initialization milestones over the 15 seconds
      if (currentPct < 20) {
        setLoadingStep('Connecting to Medcore clinical database...');
      } else if (currentPct < 40) {
        setLoadingStep('Hydrating curriculum modules & lecture channels...');
      } else if (currentPct < 60) {
        setLoadingStep('Syncing board-style questions & quiz engines...');
      } else if (currentPct < 80) {
        setLoadingStep('Validating student subscription & session keys...');
      } else {
        setLoadingStep('Pre-decoding critical learning assets & configurations...');
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setShowApp(true);
      }
    }, intervalMs);

    // Multi-IP and cross-tab background synchronization:
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    const syncInterval = setInterval(handleSync, 20000); // 20-second heartbeat sync

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(syncInterval);
    };
  }, [checkAuth, fetchSettings]);

  return (
    <ErrorBoundary>
      {!showApp ? (
        <GlobalLoader progress={loadingProgress} statusText={loadingStep} />
      ) : (
        <HelmetProvider>
          <div className="min-h-screen flex flex-col">
            <BrowserRouter>
              <SEOMetadataManager />
              <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
              
              {/* Dedicated Admin Login Routes (No Layout) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />

              {/* Protected Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'SUPER_ADMIN']} loginPath="/login" />}>
                <Route path="/dashboard" element={<StudentLayout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="calculator" element={<Calculator />} />
                  <Route path="courses" element={<AllCourses />} />
                  <Route path="my-courses" element={<MyCourses />} />
                  <Route path="videos" element={<Videos />} />
                  <Route path="quizzes" element={<Quizzes />} />
                  <Route path="results" element={<Results />} />
                  <Route path="community" element={<Community />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} loginPath="/admin/login" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="students" element={<ManageStudents />} />
                  <Route path="courses" element={<AdminCourseEngine />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="notifications" element={<SendNotification />} />
                  <Route path="community" element={<AdminCommunityChat />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* Protected Super Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} loginPath="/super-admin/login" />}>
                <Route path="/super-admin" element={<SuperAdminLayout />}>
                  <Route index element={<SuperAdminDashboard />} />
                  <Route path="admins" element={<AdminManagement />} />
                  <Route path="students" element={<ManageStudents />} />
                  <Route path="courses" element={<AdminCourseEngine />} />
                  <Route path="quizzes" element={<AdminQuizEngine />} />
                  <Route path="videos" element={<AdminVideos />} />
                  <Route path="notifications" element={<SendNotification />} />
                  <Route path="community" element={<SuperAdminCommunityChat />} />
                  <Route path="financials" element={<Financials />} />
                  <Route path="frontend-settings" element={<FrontendSettings />} />
                  <Route path="profile" element={<AdminSettings />} />
                  <Route path="settings" element={<SystemSettings />} />
                </Route>
              </Route>

              {/* Helpful Route Aliases to Prevent Broken Search/Links */}
              <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />
              <Route path="/superadmin/*" element={<Navigate to="/super-admin" replace />} />
              <Route path="/super-admin-login" element={<Navigate to="/super-admin/login" replace />} />
              <Route path="/superadmin-login" element={<Navigate to="/super-admin/login" replace />} />
              <Route path="/super_admin" element={<Navigate to="/super-admin" replace />} />
              <Route path="/super_admin/*" element={<Navigate to="/super-admin" replace />} />
              <Route path="/adminlogin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin-login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/super-admin/dashboard" element={<Navigate to="/super-admin" replace />} />
              <Route path="/student" element={<Navigate to="/dashboard" replace />} />
              <Route path="/student/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="/student-login" element={<Navigate to="/login" replace />} />

              {/* Universal Catch-all Route: Renders friendly page instead of blank space */}
              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            </BrowserRouter>
          </div>
        </HelmetProvider>
      )}
    </ErrorBoundary>
  );
}

