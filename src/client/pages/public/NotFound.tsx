import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Home, ShieldAlert, GraduationCap, ArrowRight, Compass } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  const isSuperAdminMatch = currentPath.includes('super') || currentPath.includes('superadmin');
  const isAdminMatch = currentPath.includes('admin');
  const isStudentMatch = currentPath.includes('student') || currentPath.includes('course') || currentPath.includes('learn');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center bg-white border border-zinc-200/80 rounded-3xl p-8 sm:p-12 shadow-sm">
        <div className="inline-flex p-4 rounded-2xl bg-purple-50 text-purple-600 mb-6">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
          The address <code className="bg-zinc-100 text-purple-700 px-2 py-0.5 rounded font-mono text-xs">{location.pathname}</code> could not be found or has moved.
        </p>

        {/* Smart Redirect Suggestions based on what was typed */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-8 text-left space-y-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Suggested Destinations</p>
          
          {(isSuperAdminMatch || isAdminMatch) && (
            <Link
              to="/super-admin/login"
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-purple-50 border border-zinc-200 hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-sm font-bold text-zinc-900 group-hover:text-purple-700">Super Admin Portal</div>
                  <div className="text-xs text-zinc-500">Access executive controls, system settings & financials</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>
          )}

          {isAdminMatch && !isSuperAdminMatch && (
            <Link
              to="/admin/login"
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-purple-50 border border-zinc-200 hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-bold text-zinc-900 group-hover:text-purple-700">Instructor Admin Portal</div>
                  <div className="text-xs text-zinc-500">Manage courses, student enrollments & lectures</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>
          )}

          <Link
            to="/login"
            className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-purple-50 border border-zinc-200 hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm font-bold text-zinc-900 group-hover:text-purple-700">Student Portal</div>
                <div className="text-xs text-zinc-500">Access dashboard, classrooms, videos & community</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/courses"
            className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-purple-50 border border-zinc-200 hover:border-purple-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-sm font-bold text-zinc-900 group-hover:text-purple-700">Browse All Courses</div>
                <div className="text-xs text-zinc-500">Explore medical programs, curricula & modules</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}
