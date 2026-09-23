import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  RefreshCw, 
  PlusCircle, 
  X, 
  Flame, 
  Award,
  Sparkles,
  TrendingUp,
  FileQuestion
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export interface QuickStatsData {
  completedCoursesCount: number;
  enrolledCoursesCount: number;
  totalCoursesCount: number;
  pendingQuizzesCount: number;
  completedQuizzesCount: number;
  totalQuizzesCount: number;
  totalHoursSpentLearning: number;
  totalMinutesSpentLearning: number;
  streak: number;
  averageScore: number;
  recentActivity: Array<{
    id: string;
    type: 'QUIZ' | 'COURSE_COMPLETED' | 'STUDY_SESSION';
    title: string;
    score?: number;
    maxScore?: number;
    durationMinutes?: number;
    date: string;
  }>;
  pendingQuizzes?: Array<{
    id: string;
    title: string;
    timeLimitMinutes: number;
  }>;
}

interface StudentQuickStatsProps {
  onStatsLoaded?: (data: QuickStatsData) => void;
}

export default function StudentQuickStats({ onStatsLoaded }: StudentQuickStatsProps) {
  const { token, studentData } = useAuthStore();
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logMinutes, setLogMinutes] = useState(30);
  const [logTitle, setLogTitle] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/users/student-dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        if (onStatsLoaded) {
          onStatsLoaded(data);
        }
      }
    } catch (err) {
      console.error('Failed to load student dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onStatsLoaded]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmittingLog(true);
    try {
      const res = await fetch('/api/users/student-log-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          minutes: logMinutes,
          activityTitle: logTitle.trim() || 'Clinical Self-Study & Revision'
        })
      });

      if (res.ok) {
        const result = await res.json();
        setShowLogModal(false);
        setLogTitle('');
        setToastMessage(`Logged +${result.loggedMinutes || logMinutes} mins to your study record!`);
        setTimeout(() => setToastMessage(null), 4000);
        await fetchStats(true);
      } else {
        alert('Could not record study session. Please try again.');
      }
    } catch (err) {
      console.error('Error logging study session:', err);
      alert('Network error while saving study session.');
    } finally {
      setSubmittingLog(false);
    }
  };

  // Safe defaults
  const completedCourses = stats?.completedCoursesCount ?? 0;
  const enrolledCourses = stats?.enrolledCoursesCount ?? 0;
  const totalCourses = stats?.totalCoursesCount ?? 0;
  const denominatorCourses = enrolledCourses > 0 ? enrolledCourses : totalCourses;
  const courseCompletionPct = denominatorCourses > 0 
    ? Math.min(100, Math.round((completedCourses / denominatorCourses) * 100))
    : 0;

  const pendingQuizzes = stats?.pendingQuizzesCount ?? 0;
  const completedQuizzes = stats?.completedQuizzesCount ?? 0;
  const totalHours = stats?.totalHoursSpentLearning ?? 0;
  const totalMinutes = stats?.totalMinutesSpentLearning ?? 0;

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 ml-3"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Widget Section Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Header bar of Quick Stats */}
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Quick Stats
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Summary of your academic milestones, pending assessments, and total study duration
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer"
              title="Record interactive self-study or lecture time"
            >
              <PlusCircle className="h-3.5 w-3.5 text-red-600" />
              <span>Log Study Time</span>
            </button>

            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh stats"
              aria-label="Refresh stats"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3 Core Highlight Cards: Completed Courses | Pending Quizzes | Total Hours Spent Learning */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Completed Courses */}
          <div className="p-5 rounded-xl border border-zinc-100 bg-linear-to-b from-white to-zinc-50/60 shadow-2xs hover:border-zinc-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Course Progress
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
                  {loading ? '—' : completedCourses}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  completed of {loading ? '—' : denominatorCourses} registered
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                  <span className="font-medium">Completion Rate</span>
                  <span className="font-semibold text-zinc-700 tabular-nums">{courseCompletionPct}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${courseCompletionPct}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                {completedCourses > 0 
                  ? `${completedCourses} clinical syllabus module${completedCourses > 1 ? 's' : ''} successfully completed.`
                  : 'Start and complete clinical courses in your catalog to build your transcript.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <Link 
                to="/dashboard/my-courses"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 group"
              >
                <span>View Registered Courses</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 2. Pending Quizzes */}
          <div className="p-5 rounded-xl border border-zinc-100 bg-linear-to-b from-white to-zinc-50/60 shadow-2xs hover:border-zinc-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Assessments
                </span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <HelpCircle className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
                  {loading ? '—' : pendingQuizzes}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  pending quiz{pendingQuizzes === 1 ? '' : 'zes'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600 bg-amber-50/60 border border-amber-100/80 rounded-lg p-2.5">
                <FileQuestion className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  {completedQuizzes > 0
                    ? `${completedQuizzes} completed · ${pendingQuizzes} awaiting your evaluation`
                    : pendingQuizzes > 0 
                      ? `${pendingQuizzes} timed questions ready for testing`
                      : 'All available quizzes currently up to date'}
                </span>
              </div>

              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                {pendingQuizzes > 0 
                  ? 'High-yield exam questions waiting to test your diagnostic precision.'
                  : 'Great job! You are caught up on all syllabus quizzes.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <Link 
                to="/dashboard/quizzes"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 group"
              >
                <span>Take Pending Quiz</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* 3. Total Hours Spent Learning */}
          <div className="p-5 rounded-xl border border-zinc-100 bg-linear-to-b from-white to-zinc-50/60 shadow-2xs hover:border-zinc-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Learning Time
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-zinc-900 tabular-nums">
                  {loading ? '—' : totalHours}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  total hours spent learning
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-zinc-600 bg-blue-50/60 border border-blue-100/80 rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="tabular-nums font-medium">{totalMinutes} active minutes</span>
                </div>
                <span className="text-blue-700 font-semibold text-[11px]">Tracked</span>
              </div>

              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Accumulated across lectures, interactive quiz simulations, and logged revision sessions.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 group cursor-pointer"
              >
                <span>+ Log Study Session</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary metrics ribbon */}
        <div className="px-6 py-3 bg-zinc-50/80 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Study Streak:</span>
              <span className="font-bold text-zinc-900 tabular-nums">{stats?.streak ?? 1} Day{((stats?.streak ?? 1) > 1) ? 's' : ''}</span>
            </div>
            <span className="text-zinc-300" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>Quiz Average:</span>
              <span className="font-bold text-zinc-900 tabular-nums">{stats?.averageScore ?? 0}%</span>
            </div>
            <span className="text-zinc-300" aria-hidden="true">·</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Available Quizzes:</span>
              <span className="font-bold text-zinc-900 tabular-nums">{stats?.totalQuizzesCount ?? 0}</span>
            </div>
          </div>

          <Link
            to="/dashboard/results"
            className="text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
          >
            <span>View Full Assessment History</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Log Study Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-600" />
                <h4 className="text-lg font-bold text-zinc-900">Log Study Time</h4>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogStudy} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
                  Session Duration
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLogMinutes(mins)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        logMinutes === mins
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-zinc-500">Custom minutes:</span>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Math.max(1, Number(e.target.value) || 15))}
                    className="w-24 px-2 py-1 text-xs border border-zinc-300 rounded-md font-mono text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Study Topic or Activity (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cardiology ECG Interpretation Review"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-3 text-xs text-zinc-600">
                <span className="font-semibold text-zinc-800">Hours Counter:</span> This will add{' '}
                <strong className="text-zinc-900 tabular-nums">{(logMinutes / 60).toFixed(2)} hours</strong> to your Total Hours Spent Learning metric.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLog}
                  className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingLog ? 'Saving...' : 'Record Study Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
