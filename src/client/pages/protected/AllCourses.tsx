import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Coins, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
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
  isPublished?: boolean;
  isEnrolled?: boolean;
}

export default function AllCourses() {
  const { studentData, token, checkAuth, user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrollingId, setIsEnrollingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedNotesCourse, setSelectedNotesCourse] = useState<Course | null>(null);
  
  // Free trial modal state
  const [showBuyCoinsModal, setShowBuyCoinsModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Access check
  const isPaidOrApproved = Boolean(
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    studentData?.isApproved || 
    (studentData?.coins && studentData.coins > 0)
  );

  const enrolledCount = courses.filter(c => c.isEnrolled).length;
  const trialLimit = 3;
  const trialCoursesRemaining = Math.max(0, trialLimit - enrolledCount);

  const loadCourses = () => {
    if (!token) return;
    setIsLoading(true);
    fetch('/api/courses', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(err => {
        console.error('Failed to load courses:', err);
        setErrorMsg('Failed to load courses from academy database');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, [token]);

  const handleRegisterCourse = async (course: Course) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // If free trial and reached 3 courses, prompt modal
    if (!isPaidOrApproved && enrolledCount >= trialLimit && !course.isEnrolled) {
      setModalMessage(
        'Free Trial Limit: Your trial allows access to a maximum of 3 courses. To register additional courses and gain full quiz access, please buy more coins.'
      );
      setShowBuyCoinsModal(true);
      return;
    }

    try {
      setIsEnrollingId(course.id);
      const res = await fetch(`/api/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'TRIAL_COURSE_LIMIT_REACHED' || data.error === 'FREE_TRIAL_COURSE_LIMIT') {
          setModalMessage(data.message || 'Free trial limit reached: Please buy more coins to register more courses.');
          setShowBuyCoinsModal(true);
          return;
        }
        throw new Error(data.message || data.error || 'Failed to enroll');
      }

      setSuccessMsg(`Successfully registered for ${course.title}! You can now access its quizzes.`);
      // Refresh user status and courses
      await checkAuth();
      loadCourses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering for course');
    } finally {
      setIsEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Access Status */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Medical Courses</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Browse and register for official courses created by academy administrators.
          </p>
        </div>

        {isPaidOrApproved ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Full Access Active</span>
              <p className="text-xs text-emerald-600">Unlimited course registration & full question banks</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-amber-50 text-amber-900 px-4 py-3 rounded-xl border border-amber-200 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Free Trial Active</span>
                <p className="text-xs text-amber-700">
                  {enrolledCount} of {trialLimit} courses registered • 10 questions per course
                </p>
              </div>
            </div>
            <Link 
              to="/dashboard/payments"
              className="inline-flex items-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Coins className="h-3.5 w-3.5 mr-1.5" />
              Buy More Coins
            </Link>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Courses List */}
      {isLoading ? (
        <CourseListSkeleton variant="student" count={6} gridId="all-courses-skeleton-grid" />
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <BookOpen className="h-16 w-16 text-zinc-300 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 mb-2">No Courses Available</h3>
          <p className="text-zinc-500 max-w-md mb-6 text-sm">
            There are currently no courses published by the academy administrators. When courses are created in the Course Engine, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = Boolean(course.isEnrolled);
            const canEnrollFree = !isPaidOrApproved && trialCoursesRemaining > 0;

            return (
              <div 
                key={course.id} 
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col hover:border-zinc-300 transition-all group"
              >
                {/* Course Thumbnail */}
                <div className="h-48 w-full relative overflow-hidden bg-zinc-900">
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

                  {/* Status Badges on Image */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    {isEnrolled ? (
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Enrolled
                      </span>
                    ) : isPaidOrApproved ? (
                      <span className="px-3 py-1 bg-zinc-900/90 text-white rounded-full text-xs font-bold shadow-sm">
                        Available to Register
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-sm">
                        {canEnrollFree ? 'Trial Eligible (10 Qs)' : 'Trial Limit Reached'}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1">
                      {course.pdfUrl && (
                        <span className="px-2 py-0.5 bg-red-600/90 backdrop-blur-xs text-white rounded-md text-[10px] font-black uppercase shadow-xs">
                          PDF
                        </span>
                      )}
                      {course.noteContent && (
                        <span className="px-2 py-0.5 bg-purple-600/90 backdrop-blur-xs text-white rounded-md text-[10px] font-bold shadow-xs">
                          NOTES
                        </span>
                      )}
                    </div>
                    {course.isProtected ? (
                      <span className="px-2.5 py-1 bg-purple-900/90 backdrop-blur-xs text-purple-100 rounded-full text-[11px] font-bold flex items-center shadow-xs">
                        <ShieldCheck className="h-3 w-3 mr-1 text-purple-300" /> Protected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-zinc-800/80 backdrop-blur-xs text-zinc-300 rounded-full text-[11px] font-bold flex items-center shadow-xs">
                        <ShieldAlert className="h-3 w-3 mr-1 text-zinc-400" /> Standard
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Details */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                      {course.code || 'CORE MED'}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">Official Curriculum</span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 mb-2 leading-tight">
                    {course.title}
                  </h3>

                  <p className="text-zinc-500 text-xs line-clamp-3 mb-4 leading-relaxed">
                    {course.description || 'Comprehensive medical curriculum and interactive high-yield clinical quiz module.'}
                  </p>

                  {/* Read Course Notes Button */}
                  {(course.noteContent || course.pdfUrl) && (
                    <button
                      type="button"
                      onClick={() => setSelectedNotesCourse(course)}
                      className="w-full mb-3 inline-flex items-center justify-center px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all gap-1.5 border border-purple-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                      <span>Read Course Notes & PDF</span>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                    {isEnrolled ? (
                      <Link
                        to="/dashboard/quizzes"
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors gap-2"
                      >
                        Access Quizzes <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : isPaidOrApproved ? (
                      <button
                        onClick={() => handleRegisterCourse(course)}
                        disabled={isEnrollingId === course.id}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        {isEnrollingId === course.id ? 'Registering...' : 'Register Course'}
                      </button>
                    ) : canEnrollFree ? (
                      <button
                        onClick={() => handleRegisterCourse(course)}
                        disabled={isEnrollingId === course.id}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        {isEnrollingId === course.id ? 'Registering...' : `Register (${trialCoursesRemaining} Trial Left)`}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setModalMessage(
                            'Free Trial Limit Reached: Your free trial includes access to a maximum of 3 courses. Please buy more coins to unlock this course and all other courses!'
                          );
                          setShowBuyCoinsModal(true);
                        }}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors gap-1.5"
                      >
                        <Lock className="h-4 w-4" /> Buy Coins to Gain Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy More Coins Modal */}
      {showBuyCoinsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative">
            <button 
              onClick={() => setShowBuyCoinsModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Coins className="h-8 w-8 text-amber-600" />
            </div>

            <h3 className="text-xl font-bold text-zinc-900 text-center mb-2">
              Buy More Coins to Gain Access
            </h3>

            <p className="text-zinc-600 text-sm text-center mb-6 leading-relaxed">
              {modalMessage || 'Free trial access is limited to 3 courses and 10 questions per course. Buy more coins to gain unrestricted access to all courses, full question banks, and complete clinical explanations.'}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Premium Academy Benefits</h4>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Unlimited course registrations (All admin courses)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Full 50+ question banks per course (No 10 question cap)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  In-depth clinical answers, timer, and score analytics
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBuyCoinsModal(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBuyCoinsModal(false);
                  navigate('/dashboard/payments');
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Coins className="h-4 w-4" /> Buy Coins Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Notes & PDF Reader Modal */}
      <CourseNotesReaderModal
        course={selectedNotesCourse}
        isOpen={!!selectedNotesCourse}
        onClose={() => setSelectedNotesCourse(null)}
        takeQuizUrl="/dashboard/quizzes"
      />
    </div>
  );
}
