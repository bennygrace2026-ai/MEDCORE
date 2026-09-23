import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Coins, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Link, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
}

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  topicTitle?: string;
  courseTitle?: string;
  courseCode?: string;
  courseId?: string;
  questionCount: number;
  isEnrolled?: boolean;
  isPaidOrApproved?: boolean;
}

interface ActiveQuizDetail {
  id: string;
  title: string;
  topicTitle?: string;
  courseTitle?: string;
  courseCode?: string;
  questions: Question[];
  totalQuestionsInBank: number;
  isTrial: boolean;
  trialQuestionLimit: number;
  isPaidOrApproved: boolean;
  message?: string;
}

export default function Quizzes() {
  const { token, studentData, user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();

  const quizCoinCost = settings?.quizCoinCost || 30;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuizDetail | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Quiz taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [coinsDeductionNotice, setCoinsDeductionNotice] = useState<string | null>(null);

  // Buy coins modal
  const [showBuyCoinsModal, setShowBuyCoinsModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const isPaidOrApproved = Boolean(
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    studentData?.isApproved || 
    (studentData?.coins && studentData.coins > 0)
  );

  const fetchQuizzes = () => {
    if (!token) return;
    setIsLoadingList(true);
    fetch('/api/quizzes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuizzes(data);
        }
      })
      .catch(err => console.error('Failed to load quizzes:', err))
      .finally(() => setIsLoadingList(false));
  };

  useEffect(() => {
    fetchQuizzes();
  }, [token]);

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmitted || isSubmittingQuiz) return;

    if (user?.role === 'STUDENT' && (studentData?.coins ?? 0) < quizCoinCost) {
      setModalMessage(
        `Answering this quiz requires ${quizCoinCost} coins. Your current balance is ${studentData?.coins ?? 0} coins. Please top up your coins to complete this quiz.`
      );
      setShowBuyCoinsModal(true);
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: calculateScore(),
          totalQuestions: activeQuiz.questions.length,
          answers: userAnswers
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_COINS') {
          setModalMessage(
            data.message || `Answering this quiz requires ${quizCoinCost} coins. Please buy coins to continue.`
          );
          setShowBuyCoinsModal(true);
          return;
        }
        alert(data.message || 'Failed to submit quiz');
        return;
      }

      if (data.remainingCoins !== undefined) {
        useAuthStore.getState().updateStudentCoins(data.remainingCoins);
      }
      setCoinsDeductionNotice(
        data.coinsDeducted 
          ? `${data.coinsDeducted} coins deducted for answering this quiz. Your remaining balance is ${data.remainingCoins} coins.`
          : 'Quiz evaluation complete.'
      );
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submit quiz error:', err);
      alert('Network error submitting quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeQuiz || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, isSubmitted, userAnswers]);

  const handleStartQuiz = async (quizId: string) => {
    setIsLoadingQuiz(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'NOT_ENROLLED') {
          setModalMessage(
            data.message || 'You must register for this course first to access its quizzes. Please visit the Courses section to enroll.'
          );
          setShowBuyCoinsModal(true);
          return;
        }
        alert(data.message || 'Failed to start quiz');
        return;
      }

      setActiveQuiz(data);
      setCurrentIndex(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setCoinsDeductionNotice(null);
      setTimeLeft(30 * 60);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      alert('Network error loading quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSelectOption = (optionKey: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionKey }));
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    
    // Check if at trial limit
    if (activeQuiz.isTrial && currentIndex >= activeQuiz.questions.length - 1) {
      setModalMessage(
        `Free Trial Limit Reached: Your free trial provides 10 questions for this course. To unlock all ${activeQuiz.totalQuestionsInBank} questions in this course bank, please buy more coins!`
      );
      setShowBuyCoinsModal(true);
      return;
    }

    if (currentIndex < activeQuiz.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let correct = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. ACTIVE QUIZ TAKING / REVIEW VIEW
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentIndex];
    const totalLoaded = activeQuiz.questions.length;
    const score = calculateScore();
    const percent = Math.round((score / totalLoaded) * 100) || 0;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Active Quiz Header */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-100">
                {activeQuiz.courseCode || 'MED 100'}
              </span>
              <span className="text-xs text-zinc-500 font-medium">{activeQuiz.courseTitle}</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{activeQuiz.title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 rounded-xl text-zinc-800 font-mono text-sm font-semibold">
                <Clock className="h-4 w-4 text-zinc-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={() => setActiveQuiz(null)}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Free Trial Notification Banner */}
        {activeQuiz.isTrial && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Free Trial Mode (10 Questions Limit)</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You are viewing 10 of {activeQuiz.totalQuestionsInBank} questions in this course bank. Buy coins to unlock all questions.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setModalMessage(
                  `Unlock Full Question Bank: This course contains ${activeQuiz.totalQuestionsInBank} clinical questions with comprehensive explanations. Buy coins to unlock full access!`
                );
                setShowBuyCoinsModal(true);
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Coins className="h-3.5 w-3.5" /> Buy Coins to Unlock All
            </button>
          </div>
        )}

        {/* Question & Exam Card */}
        {!isSubmitted ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-zinc-500">
                <span>QUESTION {currentIndex + 1} OF {totalLoaded}</span>
                <span>{Math.round(((currentIndex + 1) / totalLoaded) * 100)}% COMPLETED</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / totalLoaded) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
                {currentQ.text}
              </h3>

              {currentQ.imageUrl && (
                <div className="mt-4 w-full rounded-2xl border border-zinc-200 overflow-hidden bg-black flex items-center justify-center">
                  <img 
                    src={currentQ.imageUrl} 
                    alt="Question visual" 
                    className="w-full h-auto max-h-[400px] object-contain mx-auto" 
                  />
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQ[`option${optKey}` as keyof Question] as string;
                const isSelected = userAnswers[currentIndex] === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectOption(optKey)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/20'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white'
                    }`}
                  >
                    <span className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {optKey}
                    </span>
                    <span className="text-sm sm:text-base font-medium text-zinc-800 leading-relaxed">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submission Controls */}
            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < totalLoaded - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    Next Question <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmittingQuiz ? 'Submitting & Deducting...' : 'Submit Exam (30 Coins)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Result Summary & Question Explanations */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
              <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-4">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Quiz Completed!</h3>
              <p className="text-zinc-500 text-sm mb-4">Here is your performance summary for this module.</p>

              {/* Coins Deducted Notice */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-md mx-auto flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-200/80 rounded-lg text-amber-800">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Quiz Fee Processed</p>
                    <p className="text-xs text-amber-800">
                      {coinsDeductionNotice || `${quizCoinCost} coins deducted for answering this quiz.`}
                    </p>
                  </div>
                </div>
                <div className="text-right pl-3 border-l border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Balance</span>
                  <span className="text-sm font-black text-amber-950">{studentData?.coins ?? 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Score</span>
                  <p className="text-2xl font-black text-zinc-900 mt-1">{score} / {totalLoaded}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Accuracy</span>
                  <p className="text-2xl font-black text-red-600 mt-1">{percent}%</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Total Bank</span>
                  <p className="text-2xl font-black text-zinc-900 mt-1">{activeQuiz.totalQuestionsInBank}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setCurrentIndex(0);
                    setIsSubmitted(false);
                    setTimeLeft(30 * 60);
                  }}
                  className="px-4 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" /> Retake Quiz
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Back to All Quizzes
                </button>
              </div>
            </div>

            {/* Question Review with Explanations */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-6">
              <h4 className="text-lg font-bold text-zinc-900 pb-3 border-b border-zinc-100">
                Detailed Answers & Clinical Explanations
              </h4>

              <div className="space-y-6">
                {activeQuiz.questions.map((q, qIdx) => {
                  const userChoice = userAnswers[qIdx];
                  const isCorrect = userChoice === q.correctAnswer;

                  return (
                    <div key={q.id} className="p-5 rounded-xl border border-zinc-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-400">QUESTION {qIdx + 1}</span>
                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Correct
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-600" /> Incorrect
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-900 font-semibold text-sm leading-relaxed">{q.text}</p>

                      {q.imageUrl && (
                        <div className="my-3 w-full max-w-lg rounded-xl border border-zinc-200 overflow-hidden bg-black flex items-center justify-center">
                          <img 
                            src={q.imageUrl} 
                            alt="Question visual" 
                            className="w-full h-auto max-h-64 object-contain mx-auto" 
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const text = q[`option${opt}` as keyof Question] as string;
                          const isAnswer = opt === q.correctAnswer;
                          const wasChosen = opt === userChoice;

                          let badgeColor = 'bg-zinc-50 border-zinc-200 text-zinc-700';
                          if (isAnswer) badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                          else if (wasChosen && !isCorrect) badgeColor = 'bg-red-50 border-red-300 text-red-900 line-through';

                          return (
                            <div key={opt} className={`p-2.5 rounded-lg border flex items-start gap-2 ${badgeColor}`}>
                              <span className="font-bold">{opt}.</span>
                              <span>{text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                          <span className="font-bold block mb-1">Clinical Explanation:</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal for Buy Coins */}
        {showBuyCoinsModal && renderBuyCoinsModal()}
      </div>
    );
  }

  // 2. QUIZ CATALOG VIEW
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Clinical Quiz Engine</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Practice board-style questions for your registered medical courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3.5 py-2 rounded-xl border border-amber-200 text-xs font-semibold">
            <Coins className="h-4 w-4 text-amber-600" />
            <span>Balance: <strong>{studentData?.coins ?? 0} Coins</strong></span>
            <span className="text-amber-500">•</span>
            <span className="text-amber-700">{quizCoinCost} Coins per Quiz</span>
          </div>

          {isPaidOrApproved ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs">Full Bank Access</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-50 text-zinc-700 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs">Free Trial: 10 Qs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoadingList ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600 mx-auto mb-3"></div>
          <p className="text-zinc-500 text-sm">Loading quiz catalog...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <BrainCircuit className="h-16 w-16 text-zinc-300 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 mb-2">No Quizzes Published Yet</h3>
          <p className="text-zinc-500 max-w-sm mb-6 text-sm">
            The academy administrators have not published quizzes yet. When quizzes are uploaded via the Quiz Engine, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const isEnrolled = Boolean(quiz.isEnrolled);

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col hover:border-zinc-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                    {quiz.courseCode || 'CORE MED'}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {quiz.questionCount} Questions in Bank
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 mb-1 leading-tight group-hover:text-red-600 transition-colors">
                  {quiz.title}
                </h3>

                <p className="text-xs text-zinc-500 mb-4">
                  Course: <span className="font-semibold text-zinc-700">{quiz.courseTitle}</span>
                </p>

                <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Access Mode:</span>
                    {isPaidOrApproved ? (
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Full (All {quiz.questionCount} Qs)
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Free Trial (10 Qs)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Quiz Fee:</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      30 Coins Deducted
                    </span>
                  </div>

                  {isEnrolled ? (
                    <button
                      onClick={() => handleStartQuiz(quiz.id)}
                      disabled={isLoadingQuiz}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-colors gap-2 shadow-xs"
                    >
                      <BrainCircuit className="h-4 w-4" /> Start Quiz
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setModalMessage(
                          `Course Registration Required: You must register for "${quiz.courseTitle}" in the course catalog before you can access its quizzes!`
                        );
                        setShowBuyCoinsModal(true);
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-semibold transition-colors gap-2"
                    >
                      <Lock className="h-4 w-4 text-zinc-400" /> Register Course to Access
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showBuyCoinsModal && renderBuyCoinsModal()}
    </div>
  );

  function renderBuyCoinsModal() {
    return (
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
            Unlock Full Quiz Access
          </h3>

          <p className="text-zinc-600 text-sm text-center mb-6 leading-relaxed">
            {modalMessage || 'Free trial access is limited to 10 questions per course and a maximum of 3 courses. Buy more coins to gain unrestricted access to full 50+ question banks, timed clinical mock exams, and complete explanations.'}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">What you get with Coins:</h4>
            <ul className="text-xs text-amber-800 space-y-1.5">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Access all 50+ questions per course (No 10 question limit)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Register for all published academy courses without restriction
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                High-yield board rationales, analytics & timed mock simulation
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowBuyCoinsModal(false)}
              className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Close
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
    );
  }
}
