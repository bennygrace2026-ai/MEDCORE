import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  Eye, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  X, 
  Home, 
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Edit,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { useAuthStore } from '../../../store/authStore';
import { Link } from 'react-router-dom';

const normalizeParsedQuestions = (rawData: any[]): any[] => {
  if (!rawData || !Array.isArray(rawData)) return [];
  return rawData.map(item => {
    // Search keys case-insensitively with common synonyms
    const findValue = (keys: string[]) => {
      const foundKey = Object.keys(item).find(k => 
        keys.some(searchKey => k.toLowerCase().replace(/[\s_]/g, '') === searchKey.toLowerCase().replace(/[\s_]/g, ''))
      );
      return foundKey ? String(item[foundKey]).trim() : '';
    };

    const questionText = findValue(['question', 'q', 'text', 'questiontext', 'question_text']);
    const optA = findValue(['optiona', 'a', 'choicea', 'answera', 'option_a', 'choice_a']);
    const optB = findValue(['optionb', 'b', 'choiceb', 'answerb', 'option_b', 'choice_b']);
    const optC = findValue(['optionc', 'c', 'choicec', 'answerc', 'option_c', 'choice_c']);
    const optD = findValue(['optiond', 'd', 'choiced', 'answerd', 'option_d', 'choice_d']);
    const answer = findValue(['answer', 'correct', 'correctanswer', 'ans', 'correct_answer']).toUpperCase();
    const exp = findValue(['explanation', 'explanationtext', 'exp', 'rationale', 'explanation_text']);
    const img = findValue(['imageurl', 'image', 'imgurl', 'img', 'picture', 'image_url']);

    return {
      Question: questionText,
      OptionA: optA,
      OptionB: optB,
      OptionC: optC,
      OptionD: optD,
      Answer: answer,
      Explanation: exp,
      ImageUrl: img
    };
  }).filter(q => q.Question && q.OptionA && q.OptionB && q.Answer); // Require basic question, A, B options and answer to be valid
};

const parseWordDocument = (text: string): any[] => {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  const parsed: any[] = [];
  let currentQuestion: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line looks like a question number/start
    // e.g. "1. What is...", "Question 1: What is...", "1) What is...", "Q1. What is..."
    const questionMatch = line.match(/^(?:Question\s*\d+[:\.]?\s*|Q\d+[:\.]?\s*|\d+[\.\)]\s*)(.+)/i);
    if (questionMatch) {
      if (currentQuestion) {
        parsed.push(currentQuestion);
      }
      currentQuestion = {
        Question: questionMatch[1].trim(),
        OptionA: '',
        OptionB: '',
        OptionC: '',
        OptionD: '',
        Answer: '',
        Explanation: '',
        ImageUrl: ''
      };
      continue;
    }

    // Check options
    const optAMatch = line.match(/^(?:[A]\s*[\.\)]|Option\s*A\s*[:\.-]?)(.+)/i);
    const optBMatch = line.match(/^(?:[B]\s*[\.\)]|Option\s*B\s*[:\.-]?)(.+)/i);
    const optCMatch = line.match(/^(?:[C]\s*[\.\)]|Option\s*C\s*[:\.-]?)(.+)/i);
    const optDMatch = line.match(/^(?:[D]\s*[\.\)]|Option\s*D\s*[:\.-]?)(.+)/i);

    if (optAMatch && currentQuestion) {
      currentQuestion.OptionA = optAMatch[1].trim();
      continue;
    }
    if (optBMatch && currentQuestion) {
      currentQuestion.OptionB = optBMatch[1].trim();
      continue;
    }
    if (optCMatch && currentQuestion) {
      currentQuestion.OptionC = optCMatch[1].trim();
      continue;
    }
    if (optDMatch && currentQuestion) {
      currentQuestion.OptionD = optDMatch[1].trim();
      continue;
    }

    // Check Answer
    const ansMatch = line.match(/^(?:Answer|Correct\s*Answer|Ans|Correct)\s*[:\-]?\s*([A-D])/i);
    if (ansMatch && currentQuestion) {
      currentQuestion.Answer = ansMatch[1].trim().toUpperCase();
      continue;
    }

    // Check Explanation
    const expMatch = line.match(/^(?:Explanation|Exp|Rationale)\s*[:\-]?\s*(.+)/i);
    if (expMatch && currentQuestion) {
      currentQuestion.Explanation = expMatch[1].trim();
      continue;
    }

    // Check ImageUrl
    const imgMatch = line.match(/^(?:ImageUrl|Image\s*URL|Image)\s*[:\-]?\s*(.+)/i);
    if (imgMatch && currentQuestion) {
      currentQuestion.ImageUrl = imgMatch[1].trim();
      continue;
    }

    // If it doesn't match any fields but we are in a question block, append it to the question text or explanation
    if (currentQuestion) {
      if (!currentQuestion.OptionA) {
        currentQuestion.Question += ' ' + line;
      } else if (currentQuestion.Explanation) {
        currentQuestion.Explanation += ' ' + line;
      }
    }
  }

  if (currentQuestion) {
    parsed.push(currentQuestion);
  }

  return parsed;
};

interface QuizItem {
  id: string;
  title: string;
  topicId: string;
  topicTitle?: string;
  courseTitle?: string;
  courseCode?: string;
  questionCount?: number;
  timeLimitMinutes?: number;
  timeLimit?: number;
  createdAt: string;
}

interface QuestionDetail {
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

interface EditingQuestion extends QuestionDetail {
  isSaving?: boolean;
}

export default function AdminQuizEngine() {
  const { token } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Quizzes list state
  const [quizzesList, setQuizzesList] = useState<QuizItem[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  // Quiz questions preview modal
  const [selectedQuizPreview, setSelectedQuizPreview] = useState<{
    quiz: QuizItem;
    questions: QuestionDetail[];
    isLoading: boolean;
  } | null>(null);

  const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const handleEditQuiz = (quiz: QuizItem) => {
    setEditingQuiz({ ...quiz });
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !token) return;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingQuiz.title,
          timeLimit: editingQuiz.timeLimitMinutes || editingQuiz.timeLimit,
          timeLimitMinutes: editingQuiz.timeLimitMinutes || editingQuiz.timeLimit,
          topicTitle: editingQuiz.topicTitle
        })
      });

      if (res.ok) {
        // Update local list
        setQuizzesList(prev => prev.map(q => q.id === editingQuiz.id ? { ...editingQuiz } : q));
        // If it's the currently selected preview, update that too
        if (selectedQuizPreview?.quiz.id === editingQuiz.id) {
          setSelectedQuizPreview({
            ...selectedQuizPreview,
            quiz: { ...editingQuiz }
          });
        }
        setEditingQuiz(null);
        setSaveSuccessMsg('Quiz details updated successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update quiz', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = (q: QuestionDetail) => {
    setEditingQuestion({ ...q });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !token) return;

    try {
      setEditingQuestion(prev => prev ? { ...prev, isSaving: true } : null);
      const res = await fetch(`/api/quizzes/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingQuestion)
      });

      if (res.ok) {
        // Update local state
        if (selectedQuizPreview) {
          setSelectedQuizPreview({
            ...selectedQuizPreview,
            questions: selectedQuizPreview.questions.map(q => 
              q.id === editingQuestion.id ? { ...editingQuestion } : q
            )
          });
        }
        setEditingQuestion(null);
      }
    } catch (err) {
      console.error('Failed to update question', err);
    } finally {
      setEditingQuestion(prev => prev ? { ...prev, isSaving: false } : null);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this question from the quiz?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        if (selectedQuizPreview) {
          setSelectedQuizPreview({
            ...selectedQuizPreview,
            questions: selectedQuizPreview.questions.filter(q => q.id !== questionId)
          });

          const quizId = selectedQuizPreview.quiz.id;
          setQuizzesList(prev => prev.map(q => {
            if (q.id === quizId) {
              return { ...q, questionCount: Math.max(0, (q.questionCount || 1) - 1) };
            }
            return q;
          }));
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete question');
      }
    } catch (err: any) {
      console.error('Failed to delete question', err);
      alert(err.message || 'Error deleting question');
    }
  };

  const handleQuestionImageUpload = async (questionId: string, file: File) => {
    if (!token) return;

    try {
      setUploadingImageId(questionId);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/quizzes/questions/${questionId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        if (selectedQuizPreview) {
          setSelectedQuizPreview({
            ...selectedQuizPreview,
            questions: selectedQuizPreview.questions.map(q => 
              q.id === questionId ? { ...q, imageUrl: data.url } : q
            )
          });
        }
        
        // Use functional state updater to avoid stale state closures
        setEditingQuestion(prev => {
          if (prev && prev.id === questionId) {
            return { ...prev, imageUrl: data.url };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to upload question image', err);
    } finally {
      setUploadingImageId(null);
    }
  };

  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [topicName, setTopicName] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setCourses(data);
        } else if (data && typeof data === 'object' && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchQuizzes = async () => {
    if (!token) return;
    try {
      setIsLoadingQuizzes(true);
      const res = await fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzesList(data);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes', err);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
      fetchQuizzes();
    }
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'docx' || fileExtension === 'doc') {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          const mammothResult = await mammoth.extractRawText({ arrayBuffer });
          const rawText = mammothResult.value;
          
          if (!rawText || !rawText.trim()) {
            alert("The Word document is empty or could not be read.");
            return;
          }

          const rawParsed = parseWordDocument(rawText);
          const normalized = normalizeParsedQuestions(rawParsed);

          if (normalized.length === 0) {
            alert("No questions found in the Word document. Please ensure it has lines starting with numbers (e.g., 1.) followed by Options A-D, Answer:, and Explanation:.");
            return;
          }

          setParsedQuestions(normalized);
        } catch (err) {
          console.error("Error parsing Word document", err);
          alert("Failed to parse Word document. Ensure it has a standard question list format.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Excel or CSV
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          const data = XLSX.utils.sheet_to_json(ws);
          if (!data || data.length === 0) {
            alert("The uploaded spreadsheet appears to be empty or has no readable rows.");
            return;
          }

          const normalized = normalizeParsedQuestions(data);
          if (normalized.length === 0) {
            alert("Failed to extract questions. Please check column headers (e.g., Question, OptionA, OptionB, OptionC, OptionD, Answer).");
            return;
          }

          setParsedQuestions(normalized);
        } catch (err) {
          console.error("Error parsing Excel file", err);
          alert("Failed to parse Excel/CSV file. Ensure it has columns: Question, OptionA, OptionB, OptionC, OptionD, Answer");
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleSaveQuiz = async () => {
    if (!selectedCourse) return alert("Please select a target course");
    if (!topicName.trim()) return alert("Please enter a topic name");
    if (!quizTitle.trim()) return alert("Please enter a quiz title");
    if (parsedQuestions.length === 0) return alert("Please upload an Excel file with questions first");

    let targetCourseId = selectedCourse;

    try {
      setIsSaving(true);

      // Dynamically create a new course if CREATE_NEW is selected
      if (selectedCourse === 'CREATE_NEW') {
        if (!newCourseTitle.trim()) {
          alert('Please enter a title for the new course');
          setIsSaving(false);
          return;
        }

        const courseRes = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newCourseTitle.trim(),
            code: newCourseCode.trim(),
            description: `Auto-created during bulk quiz upload: ${quizTitle.trim()}`,
            isPublished: true,
            isProtected: true
          })
        });

        if (!courseRes.ok) {
          const courseErr = await courseRes.json();
          throw new Error(courseErr.error || 'Failed to create new course');
        }

        const newCourseData = await courseRes.json();
        targetCourseId = newCourseData.id;
        
        // Refresh local courses list
        await fetchCourses();
      }

      const res = await fetch('/api/quizzes/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: targetCourseId,
          topicTitle: topicName.trim(),
          quizTitle: quizTitle.trim(),
          questions: parsedQuestions
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Immediately fetch the fresh quizzes list
        await fetchQuizzes();

        // Switch to the quiz list view so the newly saved quiz is permanently displayed!
        setIsCreating(false);
        setParsedQuestions([]);
        setFileName('');
        setTopicName('');
        setQuizTitle('');
        setSelectedCourse('');
        setNewCourseTitle('');
        setNewCourseCode('');

        setSaveSuccessMsg(`Quiz "${quizTitle}" with ${result.count || parsedQuestions.length} questions saved and published successfully!`);
        setTimeout(() => setSaveSuccessMsg(''), 5000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save quiz');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving quiz to database');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, title: string) => {
    try {
      setDeletingQuizId(quizId);
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setQuizzesList(prev => prev.filter(q => q.id !== quizId));
        if (selectedQuizPreview?.quiz.id === quizId) {
          setSelectedQuizPreview(null);
        }
        setSaveSuccessMsg(`Quiz "${title}" deleted successfully.`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete quiz');
      }
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err.message || 'Error deleting quiz');
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleOpenPreview = async (quiz: QuizItem) => {
    setSelectedQuizPreview({
      quiz,
      questions: [],
      isLoading: true
    });

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedQuizPreview({
          quiz,
          questions: data.questions || [],
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Error fetching quiz details', err);
      setSelectedQuizPreview(prev => prev ? { ...prev, isLoading: false } : null);
    }
  };

  const filteredQuizzes = quizzesList.filter(q => {
    const term = searchQuery.toLowerCase();
    return (
      (q.title || '').toLowerCase().includes(term) ||
      (q.topicTitle || '').toLowerCase().includes(term) ||
      (q.courseTitle || '').toLowerCase().includes(term) ||
      (q.courseCode || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Back to Home */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Back to Home"
          >
            <Home className="h-4 w-4 text-purple-600" />
            <span>Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Quiz Engine</h2>
            <p className="text-sm text-zinc-500">Create, upload, and manage verified medical exam quizzes.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {isCreating ? (
            <button 
              onClick={() => { setIsCreating(false); setParsedQuestions([]); setFileName(''); }}
              className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-xl transition-colors font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Saved Quizzes
            </button>
          ) : (
            <button 
              onClick={() => { setIsCreating(true); setParsedQuestions([]); setFileName(''); }}
              className="flex-1 sm:flex-initial flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-sm shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Upload New Quiz
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{saveSuccessMsg}</p>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload/Create Quiz View */}
      {isCreating ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Upload & Create Question Bank</h3>
                <p className="text-xs text-zinc-500">Extracts multiple choice questions, choices, and answers directly from spreadsheet</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
              Bulk Generator
            </span>
          </div>
          
          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Target Course / Subject *</label>
                  <select 
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm bg-white"
                  >
                    <option value="">Select a Course...</option>
                    {courses && Array.isArray(courses) && courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title} {c.code ? `(${c.code})` : ''}</option>
                    ))}
                    <option value="CREATE_NEW" className="text-purple-600 font-bold">+ Create a New Course...</option>
                  </select>
                </div>

                {selectedCourse === 'CREATE_NEW' && (
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-4 animate-in slide-in-from-top duration-200">
                    <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">New Course Configuration</p>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">New Course Title *</label>
                      <input 
                        type="text" 
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="e.g. Human Anatomy & Physiology"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">New Course Code (Optional)</label>
                      <input 
                        type="text" 
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="e.g. ANA101"
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Topic Name *</label>
                  <input 
                    type="text" 
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    placeholder="e.g. Axial Skeleton & Cranial Nerves" 
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Quiz Title *</label>
                  <input 
                    type="text" 
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Cranial Nerves Clinical Assessment Quiz" 
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Time Limit (Minutes)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      min="5" 
                      max="180"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
                      className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm" 
                    />
                    <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">Mins</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Upload Spreadsheet / Document (.xlsx, .xls, .csv, .docx, .doc) *</label>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 hover:border-purple-500 rounded-2xl transition-all bg-zinc-50/70 hover:bg-purple-50/20 text-center relative group">
                  <div className="p-4 bg-purple-100 rounded-2xl mb-4 text-purple-600 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="h-10 w-10" />
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-zinc-800 transition-colors">
                      <Upload className="h-3.5 w-3.5 mr-2" /> Browse File
                    </span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept=".xlsx, .xls, .csv, .docx, .doc" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                  
                  <div className="mt-4 text-xs text-zinc-500 space-y-1">
                    <p className="font-semibold text-zinc-700">Supported File Formats:</p>
                    <p className="text-[11px] text-zinc-600">
                      • <span className="font-semibold">Excel/CSV columns</span>: Question | OptionA | OptionB | OptionC | OptionD | Answer | Explanation | ImageUrl
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      • <span className="font-semibold">Word Document (.docx)</span>: Standard list with numbered questions, options A-D, Answer: [A-D], and Explanation:
                    </p>
                  </div>

                  {fileName && (
                    <div className="mt-4 px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Loaded: {fileName} ({parsedQuestions.length} questions found)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {parsedQuestions.length > 0 && (
              <div className="pt-6 border-t border-zinc-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900">Extracted Questions Preview</h4>
                    <p className="text-xs text-zinc-500">Verify extracted data before committing to the database.</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {parsedQuestions.length} Questions Ready
                  </span>
                </div>
                
                <div className="border border-zinc-200 rounded-xl overflow-hidden overflow-x-auto shadow-xs">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-12">#</th>
                        <th className="px-4 py-3 font-semibold">Question Text</th>
                        <th className="px-4 py-3 font-semibold">Option A</th>
                        <th className="px-4 py-3 font-semibold">Option B</th>
                        <th className="px-4 py-3 font-semibold">Option C</th>
                        <th className="px-4 py-3 font-semibold">Option D</th>
                        <th className="px-4 py-3 font-semibold w-24 text-center">Correct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {parsedQuestions.slice(0, 8).map((q: any, i: number) => (
                        <tr key={i} className="bg-white hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-500 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-zinc-900 max-w-xs truncate">{q.Question || q.question || 'N/A'}</td>
                          <td className="px-4 py-3 text-zinc-600 max-w-[120px] truncate text-xs">{String(q.OptionA || q.optionA || '')}</td>
                          <td className="px-4 py-3 text-zinc-600 max-w-[120px] truncate text-xs">{String(q.OptionB || q.optionB || '')}</td>
                          <td className="px-4 py-3 text-zinc-600 max-w-[120px] truncate text-xs">{String(q.OptionC || q.optionC || '')}</td>
                          <td className="px-4 py-3 text-zinc-600 max-w-[120px] truncate text-xs">{String(q.OptionD || q.optionD || '')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-xs">
                              {String(q.Answer || q.answer || '?').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedQuestions.length > 8 && (
                    <div className="p-3 text-center border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500 font-medium">
                      Showing first 8 of {parsedQuestions.length} extracted questions...
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setParsedQuestions([]); }}
                    className="px-6 py-2.5 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleSaveQuiz}
                    disabled={isSaving}
                    className="px-8 py-2.5 bg-zinc-900 rounded-xl text-sm font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 flex items-center"
                  >
                    {isSaving ? (
                      <>Saving Quiz & Questions...</>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" />
                        Save Quiz to Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Saved Quizzes Listing - Stays Displayed and Does NOT Disappear! */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by quiz title, subject, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 self-end sm:self-center">
              <span>Total Quizzes:</span>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                {quizzesList.length}
              </span>
            </div>
          </div>

          {isLoadingQuizzes ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-3" />
              <p className="text-sm font-medium text-zinc-500">Loading quiz banks...</p>
            </div>
          ) : filteredQuizzes.length > 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 font-bold">Quiz Details</th>
                      <th className="px-6 py-4 font-bold">Target Course</th>
                      <th className="px-6 py-4 font-bold">Topic Module</th>
                      <th className="px-6 py-4 font-bold text-center">Questions</th>
                      <th className="px-6 py-4 font-bold text-center">Time Limit</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {filteredQuizzes.map((quiz) => (
                          <tr key={quiz.id} className="hover:bg-zinc-50/80 transition-colors">
                            {editingQuiz?.id === quiz.id ? (
                              <td colSpan={6} className="px-6 py-4 bg-purple-50/30">
                                <div className="flex flex-col sm:flex-row items-end gap-4">
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Quiz Title</label>
                                        <input
                                          type="text"
                                          value={editingQuiz.title}
                                          onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Topic Module</label>
                                        <input
                                          type="text"
                                          value={editingQuiz.topicTitle || ''}
                                          onChange={(e) => setEditingQuiz({ ...editingQuiz, topicTitle: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Time Limit (mins)</label>
                                        <input
                                          type="number"
                                          value={editingQuiz.timeLimitMinutes || 30}
                                          onChange={(e) => setEditingQuiz({ ...editingQuiz, timeLimitMinutes: parseInt(e.target.value) || 0 })}
                                          className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 pb-0.5">
                                    <button
                                      onClick={() => setEditingQuiz(null)}
                                      className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={handleUpdateQuiz}
                                      disabled={isSaving}
                                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[11px] font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                      Save
                                    </button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl flex-shrink-0">
                                      <BrainCircuit className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-zinc-900">{quiz.title}</p>
                                      <p className="text-xs text-zinc-400">
                                        Created {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Recently'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-1.5">
                                    <BookOpen className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                                    <span className="font-medium text-zinc-800 text-xs">
                                      {quiz.courseTitle || 'Medical Core'}
                                    </span>
                                    {quiz.courseCode && (
                                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                                        {quiz.courseCode}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-1.5">
                                    <Layers className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-zinc-700">
                                      {quiz.topicTitle || 'General Topic'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                                    {quiz.questionCount || 0} Questions
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center text-xs text-zinc-600 font-medium">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                                    {quiz.timeLimitMinutes || 30} mins
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => handleOpenPreview(quiz)}
                                      className="px-3 py-1.5 bg-zinc-100 hover:bg-purple-100 text-zinc-700 hover:text-purple-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 relative z-10"
                                      title="View questions"
                                    >
                                      <Eye className="h-3.5 w-3.5 pointer-events-none" /> View
                                    </button>
                                    <button
                                      onClick={() => handleEditQuiz(quiz)}
                                      className="p-2 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative z-10"
                                      title="Edit quiz details"
                                    >
                                      <Edit className="h-4 w-4 pointer-events-none" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                      disabled={deletingQuizId === quiz.id}
                                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 active:scale-95 relative z-10 flex items-center justify-center min-w-[32px] min-h-[32px]"
                                      title="Delete quiz"
                                    >
                                      {deletingQuizId === quiz.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-600 pointer-events-none" />
                                      ) : (
                                        <Trash2 className="h-4 w-4 pointer-events-none" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[380px] p-12 text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-5">
                <FileSpreadsheet className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                {searchQuery ? 'No Quizzes Found' : 'No Quizzes Created Yet'}
              </h3>
              <p className="text-zinc-500 max-w-md mb-6 text-sm">
                {searchQuery 
                  ? `No quizzes matched "${searchQuery}". Try a different keyword.` 
                  : 'Upload an Excel or CSV question bank to generate your first medical quiz.'}
              </p>
              <button 
                onClick={() => { setIsCreating(true); setSearchQuery(''); }}
                className="flex items-center px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-semibold text-sm shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Upload First Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* Questions Preview Modal */}
      {selectedQuizPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg">{selectedQuizPreview.quiz.title}</h3>
                  <p className="text-xs text-zinc-500">
                    Topic: {selectedQuizPreview.quiz.topicTitle} • {selectedQuizPreview.questions.length} Questions
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedQuizPreview(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedQuizPreview.isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">Loading questions bank...</p>
                </div>
              ) : selectedQuizPreview.questions.length === 0 ? (
                <div className="py-10 text-center text-sm text-zinc-500">
                  No questions found for this quiz.
                </div>
              ) : (
                selectedQuizPreview.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3 relative group">
                    {editingQuestion?.id === q.id ? (
                      <div className="space-y-4 p-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Question Text</label>
                          <textarea
                            value={editingQuestion.text}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <div key={opt}>
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Option {opt}</label>
                              <input
                                type="text"
                                value={(editingQuestion as any)[`option${opt}`]}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, [`option${opt}`]: e.target.value })}
                                className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Correct Answer</label>
                            <select
                              value={editingQuestion.correctAnswer}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                              className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                            >
                              <option value="A">Option A</option>
                              <option value="B">Option B</option>
                              <option value="C">Option C</option>
                              <option value="D">Option D</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Question Image</label>
                            <div className="flex items-center gap-2">
                              {editingQuestion.imageUrl ? (
                                <div className="relative h-10 w-10 rounded border border-zinc-200 overflow-hidden shrink-0">
                                  <img src={editingQuestion.imageUrl} className="h-full w-full object-cover" />
                                  <button 
                                    onClick={() => setEditingQuestion({ ...editingQuestion, imageUrl: undefined })}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id="btn-global-sync-upload"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) handleQuestionImageUpload(q.id, file);
                                    };
                                    input.click();
                                  }}
                                  disabled={uploadingImageId === q.id}
                                  className="h-10 px-3 border border-dashed border-zinc-300 rounded-lg flex items-center justify-center text-zinc-400 hover:border-purple-500 hover:text-purple-500 transition-all text-[10px] font-bold uppercase"
                                >
                                  {uploadingImageId === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Explanation</label>
                          <textarea
                            value={editingQuestion.explanation || ''}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            rows={2}
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingQuestion(null)}
                            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateQuestion}
                            disabled={editingQuestion.isSaving}
                            className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5"
                          >
                            {editingQuestion.isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-zinc-900 text-sm flex-1">
                            <span className="text-purple-600 font-bold mr-2">Q{idx + 1}.</span>
                            {q.text}
                          </p>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="p-1.5 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit question"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete question"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {q.imageUrl && (
                          <div className="mt-2 w-full max-w-sm rounded-xl border border-zinc-200 overflow-hidden bg-black">
                            <img src={q.imageUrl} alt="Question visual" className="w-full h-auto object-contain max-h-64 mx-auto" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${q.correctAnswer === 'A' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                            <span className="mr-1.5 font-bold">A:</span> {q.optionA}
                          </div>
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${q.correctAnswer === 'B' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                            <span className="mr-1.5 font-bold">B:</span> {q.optionB}
                          </div>
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${q.correctAnswer === 'C' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                            <span className="mr-1.5 font-bold">C:</span> {q.optionC}
                          </div>
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium border ${q.correctAnswer === 'D' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                            <span className="mr-1.5 font-bold">D:</span> {q.optionD}
                          </div>
                        </div>
                        {q.explanation && (
                          <div className="mt-2 text-xs text-zinc-500 bg-white p-2.5 rounded-lg border border-zinc-200">
                            <span className="font-bold text-purple-600">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedQuizPreview(null)}
                className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
