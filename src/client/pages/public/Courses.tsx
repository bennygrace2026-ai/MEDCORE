import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Crown, 
  GraduationCap, 
  FileText, 
  RefreshCw, 
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CourseListSkeleton } from '../../components/courses/CourseCardSkeleton';
import { getCourseFallbackImage } from '../../constants/brandAssets';
import { useAuthStore } from '../../store/authStore';

interface Course {
  id: string;
  title: string;
  code?: string;
  description?: string | null;
  thumbnail?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  pdfSize?: number | null;
  noteTitle?: string | null;
  noteContent?: string | null;
  isProtected?: boolean;
  isPublished?: boolean;
  authorId?: string;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt?: string;
}

export default function Courses() {
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPublicCourses = (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    fetch('/api/courses/public')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(err => console.warn('Public courses temporarily unavailable:', err))
      .finally(() => {
        setIsLoading(false);
        if (refresh) setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchPublicCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.authorName || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="flex-grow bg-white">
      {/* 1st div: Header Hero Banner */}
      <div className="bg-zinc-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Curated Medical Courses
          </h1>
          <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            High-yield courses and board-style clinical question banks published directly by academy super administrators and faculty admins.
          </p>
        </div>
      </div>

      {/* 2nd div: Courses display and filter workspace */}
      <div className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        {/* Controls Toolbar: Search and Refresh */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/90 border border-zinc-200/90 p-4 sm:p-5 rounded-2xl shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by course title, code (e.g., ANAT101), or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:border-red-600 shadow-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchPublicCourses(true)}
              disabled={isRefreshing}
              className="p-2 text-zinc-600 hover:text-red-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-xs"
              title="Refresh courses from server"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            </button>

            {/* Quick Upload Button for Logged-In Admins */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <Link
                to={user?.role === 'SUPER_ADMIN' ? '/super-admin/courses' : '/admin/courses'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Upload Course
              </Link>
            )}
          </div>
        </div>

        {/* Content Display: Loading, Empty, or Course Cards */}
        {isLoading ? (
          <CourseListSkeleton variant="public" count={6} gridId="public-courses-skeleton-grid" />
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 p-8 sm:p-12 max-w-2xl mx-auto shadow-xs">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 mb-5">
              <BookOpen className="h-8 w-8 text-zinc-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">
              {searchQuery ? 'No courses match your search' : 'No Courses Uploaded Yet'}
            </h2>
            
            <p className="text-zinc-600 text-sm mb-6 leading-relaxed max-w-lg mx-auto">
              {searchQuery 
                ? 'Try adjusting your search query or clear the filter to see all academy courses.' 
                : user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
                  ? 'All default courses have been removed. Any courses you upload and publish through the Admin Course Engine will immediately appear here on this public page and in student dashboards.'
                  : 'All default courses have been removed. Only authentic courses published by Academy Administrators and Super Administrators will appear here. Check back shortly!'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
                >
                  Clear Search Filter
                </button>
              ) : (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ? (
                <Link
                  to={user?.role === 'SUPER_ADMIN' ? '/super-admin/courses' : '/admin/courses'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Upload First Course Now
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Register for Free Trial
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const isSuperAdmin = course.authorRole === 'SUPER_ADMIN';
              const hasNotes = !!(course.noteTitle || course.noteContent || course.pdfUrl);

              return (
                <div 
                  key={course.id} 
                  className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group hover:border-zinc-300 ring-1 ring-black/5"
                >
                  {/* Thumbnail Banner with Creator & Protection Badges */}
                  <div className="h-48 w-full relative overflow-hidden bg-zinc-900">
                    <img 
                      src={course.thumbnail || getCourseFallbackImage(course.code, course.title)} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getCourseFallbackImage(course.code, course.title);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />

                    {/* Gradient Overlay for Top Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Creator Tag (Super Admin or Faculty Admin) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/95 backdrop-blur-md text-amber-950 rounded-full text-[11px] font-extrabold shadow-sm ring-1 ring-amber-300/40">
                          <Crown className="h-3 w-3 text-amber-950 fill-amber-950" />
                          Super Admin Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/95 backdrop-blur-md text-white rounded-full text-[11px] font-bold shadow-sm ring-1 ring-white/20">
                          <GraduationCap className="h-3 w-3 text-indigo-100" />
                          Faculty Admin
                        </span>
                      )}
                    </div>

                    {/* Protection Status */}
                    {course.isProtected && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center px-2.5 py-1 bg-purple-900/90 backdrop-blur-md text-purple-100 rounded-full text-[11px] font-bold shadow-sm ring-1 ring-purple-400/30">
                          <ShieldCheck className="h-3 w-3 mr-1 text-purple-300" /> Protected Notes
                        </span>
                      </div>
                    )}

                    {/* Bottom overlay with Course Code */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded border border-white/20 text-white">
                        {course.code || 'MED-CORE'}
                      </span>
                      {hasNotes && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 backdrop-blur-md text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                          <FileText className="w-3 h-3 text-emerald-400" />
                          Study Notes Included
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Details Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                          Clinical Curriculum
                        </span>
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Quiz Bank
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-zinc-900 mb-2.5 leading-snug group-hover:text-red-600 transition-colors">
                        {course.title}
                      </h3>

                      <p className="text-zinc-600 text-sm mb-5 leading-relaxed line-clamp-3">
                        {course.description || 'Comprehensive clinical medical curriculum covering board exam questions, high-yield practice scenarios, and structured academic study notes.'}
                      </p>
                    </div>

                    {/* Bottom Author & Enrollment Footer */}
                    <div className="pt-4 border-t border-zinc-100 flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-zinc-400 uppercase font-semibold tracking-wider">
                          Author / Faculty
                        </span>
                        <span className="text-xs font-bold text-zinc-800 truncate max-w-[130px] sm:max-w-[160px]">
                          {course.authorName || (isSuperAdmin ? 'Main Administrator' : 'Academy Faculty')}
                        </span>
                      </div>

                      {isAuthenticated ? (
                        <Link 
                          to="/dashboard/courses" 
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs group-hover:bg-red-700"
                        >
                          Access Course <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link 
                          to="/register" 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors border border-red-200/80 shadow-2xs"
                        >
                          Start Free Trial <ArrowRight className="h-3.5 w-3.5 text-red-600" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Free Trial Banner */}
        <div className="mt-16 text-center bg-gradient-to-br from-zinc-50 to-zinc-100/80 rounded-2xl p-8 sm:p-10 border border-zinc-200 shadow-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 text-red-600 mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Start with our 3-Course Free Trial</h2>
          <p className="text-zinc-600 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            Every new student receives instant free access to up to 3 medical courses with clinical question banks and study notes. Upgrade with coins at any time for full 50+ question banks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link 
              to="/register" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              Create Student Account
            </Link>
            <Link 
              to="/pricing" 
              className="inline-flex items-center px-5 py-3 border border-zinc-300 text-sm font-semibold rounded-xl text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-xs"
            >
              View Coin Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

