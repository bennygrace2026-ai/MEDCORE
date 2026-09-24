import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from './client/store/authStore';
import { useSettingsStore } from './client/store/settingsStore';

// Components
import GlobalLoader from './client/components/shared/GlobalLoader';
import ErrorBoundary from './client/components/shared/ErrorBoundary';

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
import { preloadImage } from './client/utils/preloadAssets';

export default function App() {
  const { checkAuth, isLoading: authLoading } = useAuthStore();
  const { fetchSettings, isLoading: settingsLoading } = useSettingsStore();
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const startTime = Date.now();

      // 1. Fetch essential auth & settings concurrently
      await Promise.allSettled([checkAuth(), fetchSettings()]);

      // 2. Preload and pre-decode brand assets so they display at the exact same instant
      const currentSettings = useSettingsStore.getState().frontendSettings;
      const masterLogo = currentSettings?.heroLogo || currentSettings?.loginLogo || currentSettings?.registrationLogo;
      if (masterLogo) {
        await preloadImage(masterLogo);
      }

      // 3. Coordinate synchronized reveal duration
      const elapsed = Date.now() - startTime;
      const targetDuration = 600;
      if (elapsed < targetDuration) {
        await new Promise((r) => setTimeout(r, targetDuration - elapsed));
      }

      if (isMounted) {
        setShowApp(true);
      }
    };
    init();

    // Multi-IP and cross-tab background synchronization:
    // Periodically re-check settings and sync immediately when user returns to tab
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings();
      }
    };

    window.addEventListener('focus', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    const syncInterval = setInterval(handleSync, 20000); // 20-second heartbeat sync

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(syncInterval);
    };
  }, [checkAuth, fetchSettings]);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {!showApp && <GlobalLoader key="loader" />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showApp ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={!showApp ? "h-0 overflow-hidden" : "min-h-screen flex flex-col"}
      >
        {showApp && (
          <BrowserRouter>
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
        )}
      </motion.div>
    </ErrorBoundary>
  );
}

