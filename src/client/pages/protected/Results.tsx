import { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Clock, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  BarChart3, 
  Search, 
  Filter, 
  Calendar, 
  RotateCcw, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

interface QuizResultItem {
  id: string;
  quizId: string;
  quizTitle: string;
  topicTitle: string;
  courseId: string | null;
  courseTitle: string;
  courseCode: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
}

interface ResultsStats {
  totalAttempts: number;
  averagePercentage: number;
  highestPercentage: number;
  passedCount: number;
  distinctionCount: number;
  totalMinutes: number;
}

export default function Results() {
  const { token, studentData } = useAuthStore();
  const [results, setResults] = useState<QuizResultItem[]>(() => {
    try {
      const cached = localStorage.getItem('medcore_student_quiz_results');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [stats, setStats] = useState<ResultsStats | null>(() => {
    try {
      const cached = localStorage.getItem('medcore_student_quiz_stats');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => results.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<QuizResultItem | null>(null);

  const fetchResults = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/quizzes/my-results', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
          try {
            localStorage.setItem('medcore_student_quiz_results', JSON.stringify(data.results));
          } catch {}
        }
        if (data.stats) {
          setStats(data.stats);
          try {
            localStorage.setItem('medcore_student_quiz_stats', JSON.stringify(data.stats));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Unable to sync recent quiz results from server:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [token]);

  // Listen for real-time quiz completions in the current session
  useEffect(() => {
    const handleStudyUpdate = () => {
      fetchResults();
    };
    window.addEventListener('study-time-updated', handleStudyUpdate);
    return () => window.removeEventListener('study-time-updated', handleStudyUpdate);
  }, [token]);

  // Extract distinct courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach(r => {
      if (r.courseTitle) {
        map.set(r.courseCode || r.courseTitle, r.courseTitle);
      }
    });
    return Array.from(map.entries());
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = 
        r.quizTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourse = 
        selectedCourse === 'ALL' || 
        r.courseCode === selectedCourse || 
        r.courseTitle === selectedCourse;

      let matchesGrade = true;
      if (selectedGrade === 'DISTINCTION') {
        matchesGrade = r.percentage >= 75;
      } else if (selectedGrade === 'PASS') {
        matchesGrade = r.percentage >= 50 && r.percentage < 75;
      } else if (selectedGrade === 'FAIL') {
        matchesGrade = r.percentage < 50;
      }

      return matchesSearch && matchesCourse && matchesGrade;
    });
  }, [results, searchQuery, selectedCourse, selectedGrade]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '< 1m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (pct >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getGradeBadge = (grade: string, pct: number) => {
    if (pct >= 75) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
          Grade {grade} • Mastery
        </span>
      );
    }
    if (pct >= 50) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
          Grade {grade} • Competent
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
        Grade {grade} • Needs Review
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider border border-red-100">
              Performance Records
            </span>
            <span className="text-xs text-zinc-500 font-medium">Automatic Capture Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Quiz Results & Exam History</h2>
          <p className="text-zinc-500 text-sm mt-1 max-w-2xl">
            Review detailed scores, accuracy rates, and time breakdowns from your clinical mock exams. Every quiz attempt is captured automatically.
          </p>
        </div>

        <Link
          to="/dashboard/quizzes"
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <BookOpen className="h-4 w-4" /> Take a Quiz
        </Link>
      </div>

      {/* High-Yield Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quizzes Taken</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {stats?.totalAttempts ?? results.length}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Recorded quiz attempts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {stats?.averagePercentage ?? (results.length > 0 ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0)}%
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {stats?.passedCount ?? results.filter(r => r.passed).length} of {results.length} passed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Top Score</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {stats?.highestPercentage ?? (results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0)}%
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {stats?.distinctionCount ?? results.filter(r => r.percentage >= 75).length} distinctions achieved
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Quiz Study Time</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            {stats?.totalMinutes ?? Math.round(results.reduce((acc, r) => acc + (r.timeSpentSeconds || 0), 0) / 60)}m
          </div>
          <p className="text-xs text-zinc-500 mt-1">Active time answering tests</p>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls: Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search quiz title, course code (e.g. MED 100), or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-zinc-900 placeholder-zinc-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-600 shadow-2xs">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-transparent font-medium text-zinc-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Courses</option>
                {uniqueCourses.map(([code, title]) => (
                  <option key={code} value={code}>
                    {code} - {title.length > 20 ? title.substring(0, 20) + '...' : title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-600 shadow-2xs">
              <BarChart3 className="h-3.5 w-3.5 text-zinc-400" />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent font-medium text-zinc-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">All Scores</option>
                <option value="DISTINCTION">Distinction (75%+)</option>
                <option value="PASS">Passing (50 - 74%)</option>
                <option value="FAIL">Needs Review (&lt; 50%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List View */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-3" />
            <p className="text-sm font-medium text-zinc-600">Loading your captured quiz performance records...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {filteredResults.map((result) => {
              const isDistinction = result.percentage >= 75;
              const isPass = result.percentage >= 50;

              return (
                <div 
                  key={result.id}
                  className="p-5 sm:p-6 hover:bg-zinc-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        {result.courseCode || 'MED'}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium truncate">
                        {result.courseTitle}
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(result.completedAt)}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                      {result.quizTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        Time Taken: <strong className="text-zinc-700">{formatDuration(result.timeSpentSeconds)}</strong>
                      </span>
                      <span className="text-zinc-300">•</span>
                      <span>
                        Accuracy: <strong className="text-zinc-700">{result.score}</strong> of <strong className="text-zinc-700">{result.maxScore}</strong> questions
                      </span>
                    </div>
                  </div>

                  {/* Score & Evaluation Badges */}
                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className={`text-2xl font-black ${
                          isDistinction ? 'text-emerald-600' : isPass ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {result.percentage}%
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                          ({result.score}/{result.maxScore})
                        </span>
                      </div>
                      <div className="mt-1">
                        {getGradeBadge(result.grade, result.percentage)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedResult(result)}
                        className="px-3.5 py-2 border border-zinc-200 hover:bg-white text-zinc-700 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        Details
                      </button>

                      <Link
                        to="/dashboard/quizzes"
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        title="Retake quiz in Quiz Engine"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retake
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center min-h-[360px]">
            <div className="h-16 w-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h4 className="text-xl font-bold text-zinc-900 mb-2">
              {searchQuery || selectedCourse !== 'ALL' || selectedGrade !== 'ALL'
                ? 'No matching quiz results found'
                : 'No Quiz Results Recorded Yet'}
            </h4>
            <p className="text-zinc-500 max-w-md text-sm mb-6 leading-relaxed">
              {searchQuery || selectedCourse !== 'ALL' || selectedGrade !== 'ALL'
                ? 'Try adjusting your filters or search keywords to view other records.'
                : 'Complete clinical mock tests and board-style question banks in the Clinical Quiz Engine. Your answers and score breakdowns will be captured here automatically.'}
            </p>
            <Link
              to="/dashboard/quizzes"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Award className="h-4 w-4" /> Start Your First Quiz
            </Link>
          </div>
        )}
      </div>

      {/* Result Details Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedResult(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                {selectedResult.courseCode || 'MED'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {selectedResult.courseTitle}
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 mb-1">
              {selectedResult.quizTitle}
            </h3>
            <p className="text-xs text-zinc-400 mb-6 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Taken on {formatDate(selectedResult.completedAt)}
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 mb-6 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Score</span>
                <span className="text-xl font-black text-zinc-900">
                  {selectedResult.score} / {selectedResult.maxScore}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Accuracy</span>
                <span className={`text-xl font-black ${
                  selectedResult.percentage >= 75 ? 'text-emerald-600' : selectedResult.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {selectedResult.percentage}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Duration</span>
                <span className="text-xl font-black text-zinc-900">
                  {formatDuration(selectedResult.timeSpentSeconds)}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h5 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Evaluation & Clinical Rationale:</h5>
              <div className="p-4 rounded-xl border border-zinc-200 bg-white text-xs leading-relaxed text-zinc-600 space-y-2">
                {selectedResult.percentage >= 75 ? (
                  <p className="text-emerald-800">
                    <strong className="text-emerald-950 font-bold">Outstanding Mastery:</strong> You demonstrated high clinical competency in this topic bank. Review any missed options and proceed to adjacent medical modules.
                  </p>
                ) : selectedResult.percentage >= 50 ? (
                  <p className="text-amber-800">
                    <strong className="text-amber-950 font-bold">Competent Understanding:</strong> You passed the clinical assessment baseline. We recommend reviewing lecture notes in {selectedResult.courseTitle} before your final board exam.
                  </p>
                ) : (
                  <p className="text-rose-800">
                    <strong className="text-rose-950 font-bold">Recommended Review:</strong> Your score was below passing standard. Access the course lecture notes or retake this quiz to solidify clinical recall.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to="/dashboard/quizzes"
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-4 w-4" /> Retake in Engine
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
