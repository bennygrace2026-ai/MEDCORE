import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Download, 
  ExternalLink, 
  Eye, 
  Maximize2, 
  Minimize2, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sun,
  Moon,
  Type
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CourseNotesData {
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
}

interface CourseNotesReaderModalProps {
  course: CourseNotesData | null;
  isOpen: boolean;
  onClose: () => void;
  takeQuizUrl?: string;
}

export const CourseNotesReaderModal: React.FC<CourseNotesReaderModalProps> = ({
  course,
  isOpen,
  onClose,
  takeQuizUrl = '/dashboard/quizzes'
}) => {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'PDF'>('NOTES');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  // Track exact open-to-close reading time
  const openTimeRef = React.useRef<number>(Date.now());
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const activeTabRef = React.useRef(activeTab);
  activeTabRef.current = activeTab;
  const courseRef = React.useRef(course);
  courseRef.current = course;
  const isLoggedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && course) {
      openTimeRef.current = Date.now();
      isLoggedRef.current = false;
      setLiveElapsedSeconds(0);
      const interval = setInterval(() => {
        setLiveElapsedSeconds(Math.floor((Date.now() - openTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, course?.id]);

  const logStudySession = React.useCallback(() => {
    if (isLoggedRef.current) return;
    const elapsedSeconds = Math.floor((Date.now() - openTimeRef.current) / 1000);
    // Log if studied for at least 10 seconds
    if (elapsedSeconds >= 10 && courseRef.current) {
      isLoggedRef.current = true;
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.stringify({
          seconds: elapsedSeconds,
          materialType: activeTabRef.current,
          activityTitle: `Studied ${activeTabRef.current === 'PDF' ? 'PDF Material' : 'Lecture Note'}: ${courseRef.current.title}`,
          courseId: courseRef.current.id
        });

        try {
          fetch('/api/users/student-log-study', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: payload,
            keepalive: true
          }).then(() => {
            window.dispatchEvent(new CustomEvent('study-time-updated', { detail: { seconds: elapsedSeconds } }));
          }).catch(() => {});
        } catch {}
      }
    }
  }, []);

  const handleClose = () => {
    logStudySession();
    onClose();
  };

  useEffect(() => {
    if (course) {
      // Default to PDF if note is empty, otherwise NOTES
      if (!course.noteContent && course.pdfUrl) {
        setActiveTab('PDF');
      } else {
        setActiveTab('NOTES');
      }
    }
  }, [course]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, logStudySession]);

  // Log on page unload if modal was still open
  useEffect(() => {
    const handleUnload = () => {
      if (isOpen) {
        logStudySession();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [isOpen, logStudySession]);

  if (!isOpen || !course) return null;

  // Word count & read time calculation
  const noteText = course.noteContent || '';
  const wordCount = noteText ? noteText.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));

  // Render markdown-like sections for written notes
  const renderFormattedNote = (content: string) => {
    if (!content) {
      return (
        <div className="py-16 text-center text-zinc-400 space-y-3">
          <FileText className="h-12 w-12 mx-auto text-zinc-300 opacity-60" />
          <p className="text-sm font-semibold text-zinc-600">No written lecture notes available for this course yet.</p>
          {course.pdfUrl && (
            <button
              onClick={() => setActiveTab('PDF')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <BookOpen className="h-4 w-4" /> Switch to PDF Document
            </button>
          )}
        </div>
      );
    }

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 1
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl sm:text-3xl font-black tracking-tight mt-6 mb-3 text-zinc-900 border-b border-zinc-200/80 pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-xl sm:text-2xl font-extrabold tracking-tight mt-6 mb-2.5 text-zinc-900">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-zinc-800">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      // Clinical Pearl Callout
      if (trimmed.startsWith('> **[Clinical Pearl') || trimmed.includes('[Clinical Pearl')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-200/90 text-amber-950 text-sm leading-relaxed flex items-start gap-3 shadow-xs">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{trimmed.replace(/^>\s*/, '')}</div>
          </div>
        );
      }
      // High-Yield Callout
      if (trimmed.startsWith('> **[High-Yield') || trimmed.includes('[High-Yield')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-2xl bg-purple-50/90 border-2 border-purple-200/90 text-purple-950 text-sm leading-relaxed flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{trimmed.replace(/^>\s*/, '')}</div>
          </div>
        );
      }
      // Warning Callout
      if (trimmed.startsWith('> **[Clinical Warning') || trimmed.includes('[Clinical Warning') || trimmed.includes('[Warning')) {
        return (
          <div key={idx} className="my-4 p-4 rounded-2xl bg-red-50/90 border-2 border-red-200/90 text-red-950 text-sm leading-relaxed flex items-start gap-3 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{trimmed.replace(/^>\s*/, '')}</div>
          </div>
        );
      }
      // General Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-3 pl-4 border-l-4 border-purple-400 italic text-zinc-700 bg-zinc-50/60 py-2 rounded-r-xl">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      }
      // Bullet list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc my-1 leading-relaxed text-zinc-800">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="ml-5 list-decimal my-1 leading-relaxed text-zinc-800">
            {trimmed.replace(/^\d+\.\s+/, '')}
          </li>
        );
      }
      // Horizontal Rule
      if (trimmed === '---') {
        return <hr key={idx} className="my-6 border-zinc-200" />;
      }
      // Empty line
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      // Normal paragraph
      return (
        <p key={idx} className="my-2 leading-relaxed text-zinc-800 font-normal">
          {trimmed}
        </p>
      );
    });
  };

  // Font size classes
  const fontSizeClass = {
    sm: 'text-xs sm:text-sm',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg'
  }[fontSize];

  // Theme styling
  const themeContainerClass = {
    light: 'bg-white text-zinc-900',
    sepia: 'bg-[#faf6eb] text-[#3e3427]',
    dark: 'bg-zinc-950 text-zinc-100'
  }[readingTheme];

  const themeArticleClass = {
    light: 'bg-white text-zinc-800',
    sepia: 'bg-[#faf6eb] text-[#43382c]',
    dark: 'bg-zinc-950 text-zinc-200'
  }[readingTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className={`bg-white rounded-3xl w-full flex flex-col shadow-2xl border border-zinc-200 overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? 'h-full max-w-full rounded-none' 
            : 'max-w-5xl max-h-[92vh] h-[850px]'
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-purple-600/30 text-purple-400 rounded-2xl border border-purple-500/30 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                  {course.code || 'COURSE NOTE'}
                </span>
                {course.isProtected && (
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Protected
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-sm sm:max-w-md md:max-w-lg mt-0.5">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Live Learning Time Counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Learning: {Math.floor(liveElapsedSeconds / 60)}:{(liveElapsedSeconds % 60).toString().padStart(2, '0')}</span>
            </div>

            <Link
              to={takeQuizUrl}
              onClick={logStudySession}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>Practice Quiz</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title="Close Reader"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab & Reading Controls Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-100 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 bg-zinc-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('NOTES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'NOTES'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              <span>Lecture Notes</span>
              {course.noteContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PDF')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PDF'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-red-500" />
              <span>PDF Document</span>
              {course.pdfUrl && (
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px] font-black uppercase">
                  PDF
                </span>
              )}
            </button>
          </div>

          {/* Reading Customization Controls */}
          {activeTab === 'NOTES' && (
            <div className="flex items-center space-x-2 text-xs text-zinc-600">
              <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 mr-2">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>~{estimatedReadTime} min read</span>
                <span className="text-zinc-300">•</span>
                <span>{wordCount} words</span>
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    fontSize === 'sm' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    fontSize === 'base' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                  title="Medium text"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                    fontSize === 'lg' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                  title="Large text"
                >
                  A+
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={() => setReadingTheme('light')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    readingTheme === 'light' ? 'bg-zinc-200 text-zinc-900 font-bold' : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  title="Light Theme"
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setReadingTheme('sepia')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    readingTheme === 'sepia' ? 'bg-[#ebdcb9] text-[#43382c] font-bold' : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  title="Warm Sepia"
                >
                  <span className="text-[10px] font-black uppercase">SEP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadingTheme('dark')}
                  className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                    readingTheme === 'dark' ? 'bg-zinc-900 text-white font-bold' : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  title="Dark Theme"
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'PDF' && course.pdfUrl && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-zinc-500 text-xs font-medium truncate max-w-[200px]">
                {course.pdfName || 'Document.pdf'}
              </span>
              {course.pdfSize && (
                <span className="text-zinc-400 text-[11px]">
                  ({(course.pdfSize / (1024 * 1024)).toFixed(1)} MB)
                </span>
              )}
              {!course.isProtected && (
                <a
                  href={course.pdfUrl}
                  download={course.pdfName || 'course-notes.pdf'}
                  className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-purple-600" />
                  <span>Download</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Reader Content Body */}
        <div 
          className={`flex-1 overflow-y-auto ${themeContainerClass} transition-colors duration-200 ${
            course.isProtected ? 'select-none' : ''
          }`}
          onContextMenu={course.isProtected ? (e) => e.preventDefault() : undefined}
        >
          {activeTab === 'NOTES' ? (
            <div className="max-w-4xl mx-auto px-6 sm:px-12 py-8">
              {/* Note Header Title */}
              <div className="mb-6 pb-6 border-b border-zinc-200/60">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 block mb-1">
                  OFFICIAL STUDY MODULE NOTES
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {course.noteTitle || course.title}
                </h1>
                <p className="text-xs text-zinc-500 mt-2">
                  Medcore Academy Faculty • Medical Board Revision Syllabus
                </p>
              </div>

              {/* Formatted Text Content */}
              <article className={`prose max-w-none ${fontSizeClass} ${themeArticleClass}`}>
                {renderFormattedNote(course.noteContent || '')}
              </article>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {course.pdfUrl ? (
                <iframe
                  src={`${course.pdfUrl}#toolbar=0`}
                  title={course.pdfName || course.title}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="py-24 text-center max-w-md mx-auto p-6 space-y-4">
                  <div className="p-4 bg-zinc-100 rounded-3xl inline-block text-zinc-400">
                    <BookOpen className="h-10 w-10 mx-auto" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-800">No PDF Uploaded Yet</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The academy instructor has not uploaded a standalone PDF document for this course. You can read the complete written lecture notes under the <strong>Lecture Notes</strong> tab!
                  </p>
                  <button
                    onClick={() => setActiveTab('NOTES')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" /> Open Lecture Notes Tab
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Protected Anti-Copy Footer Watermark */}
        {course.isProtected && (
          <div className="py-2 px-4 bg-zinc-900 border-t border-zinc-800 text-center text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-2 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>Medcore Academic Integrity System: Digital Watermarked & Protected against unauthorized copying/distribution.</span>
          </div>
        )}
      </div>
    </div>
  );
};
