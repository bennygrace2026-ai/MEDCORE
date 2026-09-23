import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Lock, 
  Unlock, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Image as ImageIcon, 
  Eye, 
  FileText,
  Loader2,
  Home,
  User,
  Crown,
  Search,
  Filter,
  Edit,
  Sparkles,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Bold,
  Italic,
  FileType,
  FileCheck,
  Download
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { Link } from 'react-router-dom';
import { CourseListSkeleton } from '../../../components/courses/CourseCardSkeleton';
import { getCourseFallbackImage } from '../../../constants/brandAssets';
import { CourseNotesReaderModal } from '../../../components/courses/CourseNotesReaderModal';

interface Course {
  id: string;
  title: string;
  code: string;
  description: string | null;
  thumbnail: string | null;
  pdfUrl?: string | null;
  pdfName?: string | null;
  pdfSize?: number | null;
  noteTitle?: string | null;
  noteContent?: string | null;
  isProtected: boolean;
  isPublished: boolean;
  authorId?: string;
  creatorName?: string;
  creatorRole?: string;
  createdAt: string;
}

export default function AdminCourseEngine() {
  const { user, token } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [creatorFilter, setCreatorFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN'>('ALL');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [academicLevel, setAcademicLevel] = useState('100 Level');
  const [description, setDescription] = useState('');

  // Course Notes & PDF Writer State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [noteTab, setNoteTab] = useState<'WRITER' | 'PDF'>('WRITER');
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [previewModalCourse, setPreviewModalCourse] = useState<Course | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Anti-download & copy toggle state (functional: activate and deactivate)
  const [isProtected, setIsProtected] = useState(true);

  // Thumbnail upload & display state
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFileName, setThumbnailFileName] = useState('');
  const [thumbnailFileSize, setThumbnailFileSize] = useState<number | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch courses from server
  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const res = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCourses(data);
        } else if (data && Array.isArray(data.courses)) {
          setCourses(data.courses);
        } else {
          setCourses([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  // Handle Thumbnail File Selection & Upload
  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP, GIF).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size exceeds 10MB limit.' });
      return;
    }

    // Set immediate client preview
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setThumbnailFileName(file.name);
    setThumbnailFileSize(file.size);
    setMessage(null);

    // Upload to server
    try {
      setIsUploadingThumbnail(true);
      const formData = new FormData();
      formData.append('thumbnail', file);

      const res = await fetch('/api/courses/upload-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setThumbnailUrl(data.url);
        setMessage({ type: 'success', text: 'Thumbnail picture uploaded successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        let errorMessage = 'Failed to upload thumbnail';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server returned ${res.status}: ${res.statusText}`;
          console.error('Non-JSON error response:', await res.text().catch(() => 'No body'));
        }
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (err: any) {
      console.error('Upload thumbnail error:', err);
      setMessage({ type: 'error', text: err.message || 'An error occurred during upload' });
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeThumbnail = () => {
    setThumbnailUrl('');
    setThumbnailPreview('');
    setThumbnailFileName('');
    setThumbnailFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle PDF File Upload
  const handlePdfFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Please select a valid PDF file (.pdf).' });
      return;
    }

    if (file.size > 35 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'PDF file size exceeds 35MB limit.' });
      return;
    }

    try {
      setIsUploadingPdf(true);
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/courses/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setPdfUrl(data.url);
        setPdfName(data.filename);
        setPdfSize(data.size);
        setMessage({ type: 'success', text: `PDF note "${data.filename}" uploaded successfully!` });
        setTimeout(() => setMessage(null), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || 'Failed to upload PDF note' });
      }
    } catch (err: any) {
      console.error('Upload PDF error:', err);
      setMessage({ type: 'error', text: err.message || 'An error occurred during PDF upload' });
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const removePdf = () => {
    setPdfUrl('');
    setPdfName('');
    setPdfSize(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  // Text Writer Formatting Helpers
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = noteTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    setNoteContent(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const insertMedicalTemplate = (templateType: 'ANATOMY' | 'CLINICAL' | 'PHARM') => {
    let templateText = '';
    if (templateType === 'ANATOMY') {
      templateText = `\n# Regional Anatomy & Osteology Lecture Notes\n\n## 1. Primary Bony Landmarks & Boundaries\n- Landmark A:\n- Landmark B:\n- Arterial / Venous Relations:\n\n> **[Clinical Pearl: Surgical Landmark]**\n> High-yield nerve/vascular bundle relation vulnerable during surgical exposure.\n\n## 2. Innervation & Key Foramina\n1. Cranial / Spinal Nerve exits:\n2. Motor supply:\n3. Sensory distribution:\n\n> **[High-Yield Concept: Board Exam Focus]**\n> Key anatomical variation and clinical testing maneuver.\n`;
    } else if (templateType === 'CLINICAL') {
      templateText = `\n# Clinical Vignette & Pathology Notes\n\n## 1. Pathophysiology & Etiology\n- Primary mechanism of injury or disease progression\n- Classic presenting symptoms & triage signs\n\n> **[Clinical Warning: Urgent Red Flags]**\n> Emergency stabilization protocol and contraindications to observe.\n\n## 2. Diagnostic Workup & Investigations\n- Gold standard diagnostic test:\n- High-yield radiographic findings:\n- Laboratory biomarkers:\n`;
    } else {
      templateText = `\n# Pharmacology & High-Yield Therapeutics\n\n## 1. Drug Class & Mechanism of Action\n- Receptor target and cellular intracellular cascade\n- Absorption, Distribution, Metabolism, and Excretion (ADME)\n\n> **[Clinical Pearl: High-Yield Adverse Effect]**\n> Classic board-tested side effect, boxed warnings, and antidote.\n\n## 2. Indications & Absolute Contraindications\n- Primary clinical indications:\n- Absolute contraindications:\n`;
    }

    setNoteContent(prev => prev ? `${prev}\n\n${templateText}` : templateText);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setTitle(course.title);
    setCode(course.code);
    setDescription(course.description || '');
    setThumbnailUrl(course.thumbnail || '');
    setThumbnailPreview(course.thumbnail || '');
    setPdfUrl(course.pdfUrl || '');
    setPdfName(course.pdfName || '');
    setPdfSize(course.pdfSize || null);
    setNoteTitle(course.noteTitle || '');
    setNoteContent(course.noteContent || '');
    setIsProtected(course.isProtected);
    setIsCreating(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Course Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Please enter a course title.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const url = editingCourseId ? `/api/courses/${editingCourseId}` : '/api/courses';
      const method = editingCourseId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          code,
          description,
          thumbnail: thumbnailUrl || thumbnailPreview || null,
          pdfUrl: pdfUrl || null,
          pdfName: pdfName || null,
          pdfSize: pdfSize || null,
          noteTitle: noteTitle.trim() || null,
          noteContent: noteContent || null,
          isProtected, // Anti-download and anti-copy status
          isPublished: true
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingCourseId ? 'Course updated successfully with notes & PDF saved!' : 'Course created successfully with curriculum & study notes initialized!' });
        // Reset form
        setTitle('');
        setCode('');
        setDescription('');
        setAcademicLevel('100 Level');
        setNoteTitle('');
        setNoteContent('');
        removePdf();
        removeThumbnail();
        setIsProtected(true);
        setEditingCourseId(null);
        fetchCourses();
        setTimeout(() => {
          setIsCreating(false);
          setMessage(null);
        }, 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: err.error || (editingCourseId ? 'Failed to update course' : 'Failed to create course') });
      }
    } catch (err) {
      console.error('Course save error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred while saving the course.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle protection directly on a course in the list
  const handleToggleCourseProtection = async (courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/toggle-protection`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isProtected: !currentStatus })
      });
      if (res.ok) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isProtected: !currentStatus } : c));
      }
    } catch (err) {
      console.error('Failed to toggle course protection:', err);
    }
  };

  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  // Delete course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      setDeletingCourseId(courseId);
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setMessage({ type: 'success', text: 'Course deleted successfully' });
        setTimeout(() => setMessage(null), 2500);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete course' });
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      setMessage({ type: 'error', text: 'Network error deleting course' });
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
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
            <h2 className="text-2xl font-bold text-zinc-900 mb-1">Course Engine</h2>
            <p className="text-zinc-500">Upload and manage secure, protected courses with automated content security.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsCreating(!isCreating);
            setMessage(null);
          }}
          className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium text-sm shadow-sm hover:shadow active:scale-95"
        >
          {isCreating ? (
            'View Course List'
          ) : (
            <><Plus className="h-4 w-4 mr-2" /> Create New Course</>
          )}
        </button>
      </div>

      {/* Status Feedback Toast */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {isCreating ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-3 text-purple-600" />
              <h3 className="text-lg font-bold text-zinc-900">
                {editingCourseId ? 'Edit Course' : 'Create New Course'}
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {editingCourseId ? 'Course Modification' : 'Course Provisioning'}
            </span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Metadata */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Human Anatomy & Gross Anatomy" 
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-zinc-900 placeholder-zinc-400 text-sm" 
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-2">Course Code</label>
                    <input 
                      type="text" 
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. ANA 201" 
                      className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all uppercase text-zinc-900 placeholder-zinc-400 text-sm font-mono font-medium" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 mb-2">Academic Level</label>
                    <select 
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-zinc-900 text-sm bg-white"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="500 Level">500 Level</option>
                      <option value="600 Level">600 Level</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 mb-2">Course Description</label>
                  <textarea 
                    rows={4} 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the medical syllabus, core learning outcomes, and module coverage..." 
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-zinc-900 placeholder-zinc-400 text-sm"
                  ></textarea>
                </div>
              </div>

              {/* Right Column: Content Protection Toggle & Thumbnail Picture Upload */}
              <div className="space-y-6">
                
                {/* 1. CONTENT PROTECTION & ANTI-DOWNLOAD/COPY TOGGLE (CSS Selector 1) */}
                <div 
                  className={`rounded-2xl p-5 transition-all duration-200 border-2 ${
                    isProtected 
                      ? 'bg-purple-50/80 border-purple-300 shadow-sm' 
                      : 'bg-zinc-50 border-zinc-300 shadow-none'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        isProtected ? 'bg-purple-600 text-white' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {isProtected ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          Anti-Download & Copy Protection
                        </h4>
                        <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          isProtected ? 'bg-purple-200/80 text-purple-900' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {isProtected ? 'STATUS: ACTIVATED' : 'STATUS: DEACTIVATED'}
                        </span>
                      </div>
                    </div>

                    {/* Functional Interactive Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isProtected}
                      onClick={() => setIsProtected(!isProtected)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${
                        isProtected ? 'bg-purple-600' : 'bg-zinc-300'
                      }`}
                    >
                      <span className="sr-only">Toggle Anti-Download & Anti-Copy Protection</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isProtected ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                    {isProtected
                      ? 'Activated: Videos and documents in this course cannot be downloaded, text copy is prevented, and right-click actions are locked on student devices.'
                      : 'Deactivated: Content protection is turned off. Students will be allowed to copy text and download notes or resources.'}
                  </p>

                  <div 
                    onClick={() => setIsProtected(!isProtected)}
                    className="flex items-center cursor-pointer p-2.5 rounded-lg hover:bg-black/5 transition-colors select-none"
                  >
                    <input 
                      type="checkbox" 
                      id="protection" 
                      checked={isProtected}
                      onChange={(e) => setIsProtected(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-zinc-300 rounded cursor-pointer" 
                    />
                    <label htmlFor="protection" className="ml-2.5 block text-xs font-semibold text-zinc-900 cursor-pointer">
                      {isProtected 
                        ? 'Anti-Download & Anti-Copy is currently ACTIVE (click to deactivate)' 
                        : 'Anti-Download & Anti-Copy is currently INACTIVE (click to activate)'}
                    </label>
                  </div>
                </div>

                {/* 2. COURSE THUMBNAIL PICTURE UPLOAD & DISPLAY (CSS Selector 2) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-zinc-900">
                      Course Thumbnail Picture
                    </label>
                    {thumbnailPreview && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ready & Displayed
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Container (Target of CSS Selector 2) */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-1 relative border-2 border-dashed rounded-2xl transition-all overflow-hidden ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-50/50' 
                        : thumbnailPreview 
                        ? 'border-purple-200 bg-zinc-900/5' 
                        : 'border-zinc-300 bg-zinc-50/80 hover:border-purple-400'
                    }`}
                  >
                    {/* Hidden input for selecting pictures */}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      id="thumbnail-file-input"
                      className="sr-only" 
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChange(e.target.files[0]);
                        }
                      }}
                    />

                    {thumbnailPreview ? (
                      /* DISPLAY UPLOADED THUMBNAIL PICTURE */
                      <div className="relative group">
                        <div className="w-full h-52 sm:h-60 bg-zinc-950 flex items-center justify-center overflow-hidden">
                          <img 
                            src={thumbnailPreview} 
                            alt="Course Thumbnail Preview" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Overlay Controls */}
                        <div className="p-3 bg-white border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 truncate">
                            <ImageIcon className="h-4 w-4 text-purple-600 shrink-0" />
                            <span className="text-xs font-medium text-zinc-700 truncate max-w-[180px] sm:max-w-[240px]">
                              {thumbnailFileName || 'Course Thumbnail'}
                            </span>
                            {thumbnailFileSize && (
                              <span className="text-[11px] text-zinc-400 font-mono">
                                ({Math.round(thumbnailFileSize / 1024)} KB)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-semibold flex items-center transition-colors"
                            >
                              <Upload className="h-3 w-3 mr-1.5 text-zinc-600" />
                              Change Picture
                            </button>
                            <button
                              type="button"
                              onClick={removeThumbnail}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center transition-colors"
                            >
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Remove
                            </button>
                          </div>
                        </div>

                        {isUploadingThumbnail && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-white text-xs font-medium gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Uploading to server...
                          </div>
                        )}
                      </div>
                    ) : (
                      /* EMPTY UPLOAD DROPZONE */
                      <div className="px-6 pt-7 pb-8 text-center">
                        <div className="mx-auto h-14 w-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex text-sm text-zinc-600 justify-center items-center">
                            <label 
                              htmlFor="thumbnail-file-input"
                              className="relative cursor-pointer rounded-md font-bold text-purple-600 hover:text-purple-700 hover:underline focus-within:outline-none"
                            >
                              <span>Click to upload thumbnail</span>
                            </label>
                            <span className="pl-1 text-zinc-500">or drag and drop</span>
                          </div>
                          <p className="text-xs text-zinc-400">PNG, JPG, WEBP, GIF up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. COURSE NOTES & PDF WRITER WORKSPACE */}
                <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                          <BookOpen className="h-4 w-4" />
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                          Course Notes & Student Reader Engine
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Provide study notes for students via written interactive notes, an uploaded PDF document, or both.
                      </p>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex items-center bg-zinc-200/80 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setNoteTab('WRITER')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          noteTab === 'WRITER'
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        <span>Interactive Text Writer</span>
                        {noteContent.trim() && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setNoteTab('PDF')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          noteTab === 'PDF'
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5 text-red-500" />
                        <span>PDF Document</span>
                        {pdfUrl && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[9px] font-black uppercase">
                            PDF
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: INTERACTIVE TEXT WRITER */}
                  {noteTab === 'WRITER' && (
                    <div className="space-y-4">
                      {/* Note Title */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                          Lecture Note Title
                        </label>
                        <input
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="e.g. Axial Skeleton & Cranial Osteology Comprehensive Lecture Notes"
                          className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400"
                        />
                      </div>

                      {/* Text Formatting Toolbar */}
                      <div className="bg-white border border-zinc-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => insertFormatting('# ', '', 'Major Topic Heading')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Heading 1"
                          >
                            <Heading1 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('## ', '', 'Section Subheading')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Heading 2"
                          >
                            <Heading2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('**', '**', 'bold text')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Bold text"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('*', '*', 'italic text')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Italic text"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </button>
                          <div className="h-4 w-px bg-zinc-200 mx-1" />
                          <button
                            type="button"
                            onClick={() => insertFormatting('- ', '', 'Bullet point detail')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Bullet list"
                          >
                            <List className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('1. ', '', 'Numbered step')}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-xs font-bold text-zinc-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Numbered list"
                          >
                            <ListOrdered className="h-3.5 w-3.5" />
                          </button>
                          <div className="h-4 w-px bg-zinc-200 mx-1" />
                          
                          {/* Medical High-Yield Callout Quick Buttons */}
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n> **[Clinical Pearl: Medical Correlation]**\n> ', '\n', 'Key clinical diagnostic signs and board exam correlations.')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Insert Clinical Pearl Box"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            <span>Clinical Pearl</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n> **[High-Yield Concept: Exam Focus]**\n> ', '\n', 'Critical board exam concept and high-yield physiology.')}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Insert High-Yield Concept Box"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                            <span>High-Yield</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n> **[Clinical Warning: Contraindication / Red Flag]**\n> ', '\n', 'Vital contraindication or emergency clinical sign.')}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Insert Clinical Warning Box"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                            <span>Warning</span>
                          </button>
                        </div>

                        {/* Medical Templates & Live Preview Toggle */}
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                insertMedicalTemplate(e.target.value as any);
                                e.target.value = '';
                              }
                            }}
                            className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-700 font-semibold cursor-pointer outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Insert Medical Template...</option>
                            <option value="ANATOMY">+ Gross Anatomy Outline</option>
                            <option value="CLINICAL">+ Clinical Pathology Vignette</option>
                            <option value="PHARM">+ Pharmacology Summary</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setIsLivePreview(!isLivePreview)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                              isLivePreview
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{isLivePreview ? 'Editor Mode' : 'Live Student Preview'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Editor Textarea vs Live Student Preview */}
                      {isLivePreview ? (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 min-h-[300px] max-h-[480px] overflow-y-auto">
                          <div className="border-b border-zinc-200 pb-3 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">STUDENT PREVIEW</span>
                            <h3 className="text-xl font-bold text-zinc-900">{noteTitle || title || 'Course Lecture Notes'}</h3>
                          </div>
                          {noteContent ? (
                            <div className="space-y-3 text-sm leading-relaxed text-zinc-800">
                              {noteContent.split('\n').map((line, idx) => {
                                const tr = line.trim();
                                if (tr.startsWith('# ')) return <h1 key={idx} className="text-xl font-black mt-4 mb-2 text-zinc-900 border-b pb-1">{tr.replace('# ', '')}</h1>;
                                if (tr.startsWith('## ')) return <h2 key={idx} className="text-lg font-bold mt-3 mb-1 text-zinc-800">{tr.replace('## ', '')}</h2>;
                                if (tr.startsWith('> **[Clinical Pearl')) return (
                                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium my-2 flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>{tr.replace(/^>\s*/, '')}</span>
                                  </div>
                                );
                                if (tr.startsWith('> **[High-Yield')) return (
                                  <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-medium my-2 flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                    <span>{tr.replace(/^>\s*/, '')}</span>
                                  </div>
                                );
                                if (tr.startsWith('> **[Clinical Warning')) return (
                                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-medium my-2 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                    <span>{tr.replace(/^>\s*/, '')}</span>
                                  </div>
                                );
                                if (tr.startsWith('- ') || tr.startsWith('* ')) return <li key={idx} className="ml-4 list-disc text-xs text-zinc-700">{tr.replace(/^[-*]\s+/, '')}</li>;
                                if (/^\d+\.\s/.test(tr)) return <li key={idx} className="ml-4 list-decimal text-xs text-zinc-700">{tr.replace(/^\d+\.\s+/, '')}</li>;
                                if (!tr) return <div key={idx} className="h-1.5" />;
                                return <p key={idx} className="text-xs text-zinc-700">{tr}</p>;
                              })}
                            </div>
                          ) : (
                            <p className="text-zinc-400 text-xs italic text-center py-10">
                              Write notes in the editor to see the live student preview.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <textarea
                            ref={noteTextareaRef}
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            rows={12}
                            placeholder="Write comprehensive lecture notes, clinical correlations, anatomical descriptions, and high-yield board concepts here... Use markdown headers (#, ##), bullets (-), or the toolbar buttons above."
                            className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-2xl text-xs sm:text-sm font-sans focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-zinc-400 resize-y min-h-[260px]"
                          />
                          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
                            <span>Markdown & Callout syntax supported</span>
                            <span>{noteContent ? noteContent.trim().split(/\s+/).filter(Boolean).length : 0} words • ~{Math.max(1, Math.ceil((noteContent ? noteContent.trim().split(/\s+/).filter(Boolean).length : 0) / 180))} min read</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: PDF DOCUMENT UPLOADER */}
                  {noteTab === 'PDF' && (
                    <div className="space-y-4">
                      {/* Hidden PDF file input */}
                      <input
                        ref={pdfInputRef}
                        type="file"
                        id="pdf-file-input"
                        className="sr-only"
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePdfFileChange(e.target.files[0]);
                          }
                        }}
                      />

                      {pdfUrl ? (
                        /* DISPLAY UPLOADED PDF CARD */
                        <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-200 shrink-0">
                                <BookOpen className="h-8 w-8" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-black uppercase">
                                    PDF DOCUMENT READY
                                  </span>
                                  {isProtected && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3" /> Protected
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-zinc-900 truncate mt-1">
                                  {pdfName || 'Course-Notes.pdf'}
                                </h4>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                  {pdfSize ? `${(pdfSize / (1024 * 1024)).toFixed(2)} MB` : 'PDF file attached'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-zinc-600" />
                                <span>Preview Document</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => pdfInputRef.current?.click()}
                                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <span>Replace PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={removePdf}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                                title="Remove PDF"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs text-zinc-600 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              Students enrolled in this course can read this PDF in the full-screen reader module. Anti-Download protection is currently {isProtected ? 'ACTIVE (preventing unauthorized downloads)' : 'INACTIVE'}.
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* EMPTY PDF UPLOAD DROPZONE */
                        <div
                          onClick={() => pdfInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handlePdfFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          className="bg-white border-2 border-dashed border-zinc-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-purple-50/20 group"
                        >
                          <div className="mx-auto h-14 w-14 bg-red-50 group-hover:bg-purple-100 text-red-600 group-hover:text-purple-600 rounded-2xl flex items-center justify-center mb-3 transition-colors">
                            {isUploadingPdf ? (
                              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
                            ) : (
                              <BookOpen className="h-7 w-7" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-zinc-800">
                              {isUploadingPdf ? 'Uploading PDF Document...' : 'Click to Upload Course Notes PDF'}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Upload official lecture slides, syllabus, or medical handouts (.pdf up to 35MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row justify-end items-center gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsCreating(false);
                  setEditingCourseId(null);
                  setTitle('');
                  setCode('');
                  setDescription('');
                  removeThumbnail();
                  setIsProtected(true);
                  setMessage(null);
                }} 
                className="w-full sm:w-auto px-6 py-2.5 border border-zinc-300 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 rounded-xl text-sm font-semibold text-white hover:bg-purple-700 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingCourseId ? 'Updating Course...' : 'Saving Course...'}
                  </>
                ) : (
                  editingCourseId ? 'Save Changes' : 'Save & Initialize Curriculum'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Course List View */
        <div className="space-y-6">
          {/* Search, Filter & Parity Bar */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses or codes..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-zinc-50 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" />
                Filter Creator:
              </span>
              <button
                type="button"
                onClick={() => setCreatorFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  creatorFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All Courses ({courses.length})
              </button>
              <button
                type="button"
                onClick={() => setCreatorFilter('SUPER_ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 ${
                  creatorFilter === 'SUPER_ADMIN'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Crown className="h-3.5 w-3.5" />
                By Super Admin ({courses.filter(c => c.creatorRole === 'SUPER_ADMIN').length})
              </button>
              <button
                type="button"
                onClick={() => setCreatorFilter('ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 ${
                  creatorFilter === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                By Admin ({courses.filter(c => c.creatorRole === 'ADMIN' || !c.creatorRole).length})
              </button>
            </div>
          </div>

          {isLoadingCourses ? (
            <CourseListSkeleton variant="admin" count={3} compact={true} gridId="admin-courses-skeleton-grid" />
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter(course => {
                  const matchesSearch = 
                    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (course.creatorName && course.creatorName.toLowerCase().includes(searchTerm.toLowerCase()));
                  
                  if (!matchesSearch) return false;
                  if (creatorFilter === 'SUPER_ADMIN') return course.creatorRole === 'SUPER_ADMIN';
                  if (creatorFilter === 'ADMIN') return course.creatorRole === 'ADMIN' || !course.creatorRole;
                  return true;
                })
                .map((course) => (
                <div 
                  key={course.id} 
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
                >
                  {/* Thumbnail Picture Display */}
                  <div className="h-44 w-full relative bg-zinc-900 overflow-hidden">
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
                    
                    {/* Top Protection Badge with Quick Toggle */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {course.pdfUrl && (
                        <span className="px-2 py-0.5 bg-red-600/90 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <BookOpen className="h-3 w-3" /> PDF
                        </span>
                      )}
                      {course.noteContent && (
                        <span className="px-2 py-0.5 bg-purple-600/90 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs">
                          <FileText className="h-3 w-3" /> Notes
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleCourseProtection(course.id, course.isProtected)}
                        title="Click to toggle Anti-Download & Copy"
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-md transition-all ${
                          course.isProtected 
                            ? 'bg-purple-600 text-white hover:bg-purple-700' 
                            : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-900'
                        }`}
                      >
                        {course.isProtected ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Anti-Copy Active
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Protection Off
                          </>
                        )}
                      </button>
                    </div>

                    {course.code && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-zinc-900 rounded-lg text-xs font-bold font-mono shadow-sm">
                          {course.code}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Creator Tag (Super Admin vs Admin) */}
                    <div className="mb-2">
                      {course.creatorRole === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Crown className="h-3 w-3 mr-1 text-amber-600" />
                          Created by Super Admin {course.creatorName ? `(${course.creatorName})` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <User className="h-3 w-3 mr-1 text-blue-600" />
                          Created by Admin {course.creatorName ? `(${course.creatorName})` : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-zinc-900 mb-1 leading-snug line-clamp-2">
                      {course.title}
                    </h4>
                    {course.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    )}

                    {/* Bottom Info & Actions */}
                    <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">
                        Added {new Date(course.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(course.noteContent || course.pdfUrl) && (
                          <button
                            onClick={() => setPreviewModalCourse(course)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Open Student Reader Preview"
                          >
                            <BookOpen className="h-3 w-3" /> Read Notes
                          </button>
                        )}
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="px-2.5 py-1 bg-zinc-100 text-zinc-700 hover:bg-purple-100 hover:text-purple-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleCourseProtection(course.id, course.isProtected)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Toggle Anti-Copy
                        </button>
                        {(user?.role === 'SUPER_ADMIN' || course.authorId === user?.id) && (
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            disabled={deletingCourseId === course.id}
                            className={`p-1.5 rounded-lg transition-all ${
                              deletingCourseId === course.id
                                ? 'text-zinc-300 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                            }`}
                            title="Delete course"
                          >
                            {deletingCourseId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col items-center justify-center min-h-[400px] p-12 text-center">
              <div className="bg-purple-100 p-4 rounded-full mb-6">
                <BookOpen className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No Courses Uploaded Yet</h3>
              <p className="text-zinc-500 max-w-md mb-8 text-sm">
                Start building the academy's curriculum by creating a new course. You can upload custom thumbnail artwork and activate or deactivate Anti-Download & Copy protection.
              </p>
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm hover:shadow"
              >
                <Plus className="h-4 w-4 mr-2" /> Create First Course
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reader Modal for Course Lecture Notes & PDF */}
      <CourseNotesReaderModal
        course={previewModalCourse}
        isOpen={!!previewModalCourse}
        onClose={() => setPreviewModalCourse(null)}
        takeQuizUrl="/dashboard/quizzes"
      />
    </div>
  );
}
