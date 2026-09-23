import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { 
  BookOpen, 
  HelpCircle, 
  Award, 
  Clock, 
  Flame, 
  Trophy,
  ArrowRight,
  Coins,
  MessageSquare,
  Users,
  Lock,
  Play,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TrialCountdownBadge from '../../components/shared/TrialCountdownBadge';
import StudentQuickStats, { QuickStatsData } from '../../components/student/StudentQuickStats';

export default function StudentDashboard() {
  const { user, studentData } = useAuthStore();
  const { settings } = useSettingsStore();
  const [statsData, setStatsData] = useState<QuickStatsData | null>(null);
  const quizCoinCost = settings?.quizCoinCost || 30;

  const isPaidOrApproved = Boolean(
    studentData?.isApproved || (studentData?.coins && studentData.coins > 0)
  );

  return (
    <div className="space-y-6">
      {/* Live Free Trial Countdown */}
      {!isPaidOrApproved && (
        <TrialCountdownBadge 
          accessExpiryDate={studentData?.accessExpiryDate}
          accessDaysRemaining={studentData?.accessDaysRemaining}
          isPaidOrApproved={isPaidOrApproved}
        />
      )}

      {/* Welcome Banner */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <BookOpen className="h-64 w-64 text-white" />
        </div>
        
        <div className="relative z-10 mb-6 sm:mb-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl">
            {isPaidOrApproved ? (
              <span className="text-emerald-400 font-semibold">Full Academy Access Active: You have unrestricted access to all courses and complete question banks.</span>
            ) : (
              <>
                You are on the <strong className="text-amber-500 font-semibold">Free Trial</strong>. Limited to 3 courses and 10 questions per course. Buy coins to unlock full access.
              </>
            )}
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col items-center bg-zinc-950/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-700/50 w-full sm:w-auto sm:min-w-[150px]">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-amber-500" /> Coins Balance
          </span>
          <div className="flex items-baseline space-x-1 text-white">
            <span className="text-3xl font-black">
              {studentData?.coins || 0}
            </span>
            <span className="text-xs font-bold text-amber-400">
              coins
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-medium">
            ~{Math.floor((studentData?.coins || 0) / quizCoinCost)} Quizzes Available
          </p>
          <Link to="/dashboard/payments" className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center">
            Top Up Coins <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Quick Stats Summary Widget */}
      <StudentQuickStats onStatsLoaded={setStatsData} />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Activity & Courses (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Quizzes Recommendation if available */}
          {statsData && statsData.pendingQuizzes && statsData.pendingQuizzes.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-amber-50/30">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-zinc-900">Recommended Pending Quizzes</h3>
                </div>
                <Link to="/dashboard/quizzes" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
                  View All Quizzes ({statsData.pendingQuizzesCount})
                </Link>
              </div>

              <div className="divide-y divide-zinc-100">
                {statsData.pendingQuizzes.slice(0, 3).map((quiz) => (
                  <div key={quiz.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">{quiz.title}</h4>
                      <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>{quiz.timeLimitMinutes} mins limit</span>
                        <span aria-hidden="true">·</span>
                        <span>Clinical Case Scenarios</span>
                      </p>
                    </div>
                    <Link
                      to="/dashboard/quizzes"
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      <span>Start Quiz</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Recent Activity</h3>
              <Link to="/dashboard/results" className="text-sm font-medium text-red-600 hover:text-red-700">View All</Link>
            </div>

            {statsData && statsData.recentActivity && statsData.recentActivity.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {statsData.recentActivity.map((act) => (
                  <div key={act.id} className="p-4 sm:px-6 flex items-start justify-between gap-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${
                        act.type === 'QUIZ' 
                          ? 'bg-amber-50 text-amber-600' 
                          : act.type === 'COURSE_COMPLETED' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {act.type === 'QUIZ' ? (
                          <Award className="h-4 w-4" />
                        ) : act.type === 'COURSE_COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-zinc-900">{act.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          {act.score !== undefined && act.maxScore !== undefined && (
                            <>
                              <span className="font-semibold text-zinc-700 tabular-nums">
                                Score: {act.score}/{act.maxScore} ({act.maxScore > 0 ? Math.round((act.score / act.maxScore) * 100) : 0}%)
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          {act.durationMinutes && (
                            <>
                              <span className="font-medium text-blue-600 tabular-nums">{act.durationMinutes} mins logged</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-zinc-400" />
                            {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={act.type === 'QUIZ' ? '/dashboard/results' : act.type === 'COURSE_COMPLETED' ? '/dashboard/my-courses' : '/dashboard/results'}
                      className="text-xs text-zinc-500 hover:text-zinc-900 font-medium inline-flex items-center gap-1 shrink-0 mt-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[220px]">
                <Clock className="h-10 w-10 text-zinc-300 mb-3" />
                <p className="font-medium text-zinc-900">No activity yet</p>
                <p className="text-sm mt-1">Start a course or take a quiz to see your progress here.</p>
                <Link to="/dashboard/courses" className="mt-4 inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar content */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Student ID Card</h3>
            </div>
            <div className="p-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-zinc-200 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="h-8 w-8 text-zinc-400" />
                </div>
                <h4 className="font-bold text-zinc-900">{user?.name}</h4>
                <p className="text-sm text-zinc-500 mb-4">Medical Student</p>
                <div className="w-full bg-white border border-zinc-200 p-2 rounded text-center">
                  <p className="text-xs font-semibold text-zinc-400 uppercase">ID Number</p>
                  <p className="font-mono font-bold text-lg text-zinc-900 tracking-wider">{user?.studentId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community & Fellow Students Hub Card */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl border border-purple-800/50 p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="h-3.5 w-3.5" />
              <span>E2EE Classroom & Friends</span>
            </div>
            <h4 className="text-lg font-bold mb-1">Community & Study Network</h4>
            <p className="text-xs text-purple-200 mb-4 leading-relaxed">
              Connect with fellow medical students, send friend requests, exchange encrypted voice notes, and participate in live class group calls.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard/community"
                className="w-full py-2.5 px-4 bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span>Open Community & Channels</span>
              </Link>
              <Link
                to="/dashboard/community"
                className="w-full py-2 px-4 bg-purple-800/60 hover:bg-purple-800 text-purple-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-purple-700/50"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Browse Fellow Students & Friends</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

