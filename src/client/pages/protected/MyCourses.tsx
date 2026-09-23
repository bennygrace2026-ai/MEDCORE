import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { CourseListSkeleton } from '../../components/courses/CourseCardSkeleton';
import { getCourseFallbackImage } from '../../constants/brandAssets';
import { CourseNotesReaderModal } from '../../components/courses/CourseNotesReaderModal';

interface Course {
  id: string;
  title: string;
  code?: string;
  description?: string;
  thumbnail?: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  pdfSize?: number | null;
  noteTitle?: string | null;
  noteContent?: string | null;
  isProtected?: boolean;
}

export default function MyCourses() {
  const { token } = useAuthStore();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [readingCourse, setReadingCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    Promise.all([
      fetch('/api/courses/my-courses', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/courses/completions', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
    ])
      .then(([coursesData, completionsData]) => {
        if (Array.isArray(coursesData)) {
          setEnrolledCourses(coursesData);
        }
        if (Array.isArray(completionsData)) {
          setCompletedCourseIds(completionsData);
        }
      })
      .catch(err => console.error('Failed to load my courses:', err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleToggleComplete = async (courseId: string) => {
    if (!token || togglingId) return;
    setTogglingId(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}/toggle-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.completed) {
          setCompletedCourseIds(prev => [...prev, courseId]);
        } else {
          setCompletedCourseIds(prev => prev.filter(id => id !== courseId));
        }
      }
    } catch (err) {
      console.error('Error toggling course completion:', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">My Registered Courses</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Access study material and practice quizzes for the courses you have registered.
          </p>
        </div>

        <Link
          to="/dashboard/courses"
          className="inline-flex items-center px-4 py-2 border border-zinc-200 text-sm font-semibold rounded-xl text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-xs"
        >
          Explore All Courses
        </Link>
      </div>

      {isLoading ? (
        <CourseListSkeleton variant="student" count={3} compact={true} gridId="my-courses-skeleton-grid" />
      ) : enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <BookOpen className="h-16 w-16 text-zinc-300 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 mb-2">No Registered Courses Yet</h3>
          <p className="text-zinc-500 max-w-sm mb-6 text-sm">
            You have not registered for any courses yet. Go to the course catalog to register and unlock clinical quizzes.
          </p>
          <Link 
            to="/dashboard/courses" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Register a Course Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div 
              key={course.id}
              className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col hover:border-zinc-300 transition-all group"
            >
              <div className="h-44 w-full relative overflow-hidden bg-zinc-900">
                <img 
                  src={course.thumbnail || getCourseFallbackImage(course.code, course.title)} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = getCourseFallbackImage(course.code, course.title);
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Registered
                  </span>
                  {course.pdfUrl && (
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-black uppercase shadow-xs">
                      PDF
                    </span>
                  )}
                  {course.noteContent && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-bold shadow-xs">
                      Notes
                    </span>
                  )}
                </div>
                {course.isProtected && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {completedCourseIds.includes(course.id) && (
                      <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white rounded-full text-[11px] font-bold flex items-center shadow-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-white" /> Completed
                      </span>
                    )}
                    {course.isProtected && (
                      <span className="px-2.5 py-1 bg-purple-900/90 backdrop-blur-xs text-purple-100 rounded-full text-[11px] font-bold flex items-center shadow-xs">
                        <ShieldCheck className="h-3 w-3 mr-1 text-purple-300" /> Protected
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                    {course.code || 'CORE'}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    {completedCourseIds.includes(course.id) ? 'Completed' : 'In Progress'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 mb-2 leading-tight">
                  {course.title}
                </h3>

                <p className="text-zinc-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                  {course.description || 'Access clinical quizzes, timed exams, and high-yield revision modules.'}
                </p>

                {/* Read Notes & PDF Button */}
                {(course.noteContent || course.pdfUrl) && (
                  <button
                    type="button"
                    onClick={() => setReadingCourse(course)}
                    className="w-full mb-3 inline-flex items-center justify-center px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all gap-2 border border-purple-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                  >
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    <span>Read Course Notes & PDF</span>
                  </button>
                )}

                <div className="mt-auto pt-3 border-t border-zinc-100 space-y-2">
                  <Link
                    to="/dashboard/quizzes"
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors gap-2 shadow-xs"
                  >
                    Start Course Quizzes <ArrowRight className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleComplete(course.id)}
                    disabled={togglingId === course.id}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      completedCourseIds.includes(course.id)
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <CheckCircle2 className={`h-3.5 w-3.5 ${completedCourseIds.includes(course.id) ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    <span>
                      {togglingId === course.id
                        ? 'Updating...'
                        : completedCourseIds.includes(course.id)
                        ? 'Marked as Completed ✓'
                        : 'Mark Course as Completed'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Notes & PDF Reader Modal */}
      <CourseNotesReaderModal
        course={readingCourse}
        isOpen={!!readingCourse}
        onClose={() => setReadingCourse(null)}
        takeQuizUrl="/dashboard/quizzes"
      />
    </div>
  );
}
