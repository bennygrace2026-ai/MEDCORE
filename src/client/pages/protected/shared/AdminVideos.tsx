import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { 
  Play, 
  Plus, 
  Edit2, 
  Trash2, 
  Video, 
  Clock, 
  ExternalLink,
  BookOpen,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  UploadCloud,
  Link2
} from 'lucide-react';

type VideoItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  courseId: string | null;
  duration: string;
  createdAt: string;
};

type CourseItem = {
  id: string;
  title: string;
  code: string;
};

export default function AdminVideos() {
  const { token } = useAuthStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState('0:00');
  
  // Upload specific states
  const [sourceType, setSourceType] = useState<'link' | 'upload'>('link');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification states
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch videos
      const vRes = await fetch('/api/users/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVideos(vData);
      }

      // Fetch courses for assignment
      const cRes = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCourses(Array.isArray(cData) ? cData : (cData.courses || []));
      }
    } catch (err) {
      console.error('Failed to load videos dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const openAddModal = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setCourseId('');
    setDuration('10:00');
    setSourceType('link');
    setSelectedFileName('');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const openEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || '');
    setVideoUrl(video.videoUrl);
    setCourseId(video.courseId || '');
    setDuration(video.duration || '10:00');
    setSourceType(video.videoUrl.startsWith('http') && !video.videoUrl.includes('/uploads/videos/') ? 'link' : 'upload');
    setSelectedFileName('');
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 200MB limit
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large! Maximum limit is 200MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFileName(file.name);
    setUploadingFile(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('videoFile', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/users/videos/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploadingFile(false);
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setVideoUrl(data.videoUrl);
            setToast({ type: 'success', message: 'Video file uploaded successfully!' });
          } catch (err) {
            setToast({ type: 'error', message: 'Failed to process upload response.' });
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setToast({ type: 'error', message: data.error || 'Failed to upload video.' });
          } catch {
            setToast({ type: 'error', message: 'Failed to upload video file.' });
          }
        }
      };

      xhr.onerror = () => {
        setUploadingFile(false);
        setToast({ type: 'error', message: 'Network error occurred during upload.' });
      };

      xhr.send(formData);
    } catch (err: any) {
      setUploadingFile(false);
      setToast({ type: 'error', message: err.message || 'Error uploading file.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setToast({ type: 'error', message: 'Title and Video URL are required fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        courseId: courseId || null,
        duration: duration.trim() || '10:00'
      };

      const url = editingVideo ? `/api/users/videos/${editingVideo.id}` : '/api/users/videos';
      const method = editingVideo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setToast({ 
          type: 'success', 
          message: editingVideo ? 'Video updated successfully!' : 'New video added to library!' 
        });
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await response.json();
        setToast({ type: 'error', message: errData.error || 'Failed to submit video.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/users/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setToast({ type: 'success', message: 'Video lecture removed successfully.' });
        setConfirmDeleteId(null);
        // Optimistic UI state filtering
        setVideos(prev => prev.filter(v => v.id !== id));
      } else {
        const errData = await response.json();
        setToast({ type: 'error', message: errData.error || 'Failed to delete video.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error deleting video.' });
    }
  };

  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}`;
        }
      } else if (url.includes('vimeo.com')) {
        const id = url.split('/').pop();
        return `https://player.vimeo.com/video/${id}`;
      }
    } catch {}
    return url;
  };

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast notifications */}
      {toast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all animate-in fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-zinc-800" /> Video Library Management
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Manage interactive lecture videos, assign them to courses, and control access permissions.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer shrink-0 uppercase tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          <Plus className="h-4 w-4" /> Add New Video
        </button>
      </div>

      {/* Search Filter and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white px-4 py-3 rounded-2xl border border-zinc-200 flex items-center gap-2.5">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search videos by title or course assignment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent outline-hidden text-zinc-800"
          />
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-zinc-200 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Video Lectures</span>
          <span className="text-lg font-black text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg">{videos.length}</span>
        </div>
      </div>

      {/* Grid List of Videos */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500 font-bold">Loading video library lectures...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Video className="h-12 w-12 text-zinc-200 mb-2" />
          <h3 className="text-lg font-bold text-zinc-800">No Videos Found</h3>
          <p className="text-zinc-500 text-sm max-w-sm mt-1">Add a new video lecture link to populate your academic video portal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const courseName = courses.find(c => c.id === video.courseId)?.title || 'General / Unassigned';
            const embed = getEmbedUrl(video.videoUrl);
            const isEmbeddable = embed.includes('embed') || embed.includes('player.vimeo');
            const isDirectVideo = !(video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be') || video.videoUrl.includes('vimeo.com'));

            return (
              <div key={video.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
                {/* Video Card Preview Player or thumbnail */}
                <div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
                  {previewUrl === video.id ? (
                    isDirectVideo ? (
                      <video
                        src={video.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      isEmbeddable ? (
                        <iframe
                          src={embed}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      ) : (
                        <div className="text-xs text-zinc-400 font-bold">Preview unavailable</div>
                      )
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center select-none bg-gradient-to-br from-zinc-900 to-zinc-950">
                      <Play className="h-12 w-12 text-zinc-400 mb-2 hover:scale-110 transition-transform cursor-pointer" onClick={() => setPreviewUrl(video.id)} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Click Play to Preview</span>
                    </div>
                  )}

                  {previewUrl === video.id && (
                    <button 
                      onClick={() => setPreviewUrl(null)}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/90 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-700 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full w-fit">
                      <BookOpen className="h-3 w-3" /> {courseName}
                    </div>
                    <h3 className="text-base font-black text-zinc-900 mt-2 line-clamp-1" title={video.title}>{video.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 h-8">{video.description || 'No description provided.'}</p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {video.duration}
                    </span>

                    <div className="flex gap-1.5 items-center">
                      {confirmDeleteId === video.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-100 p-0.5 rounded-lg animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-md cursor-pointer transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase rounded-md cursor-pointer border border-zinc-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(video)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-transparent transition-colors cursor-pointer"
                            title="Edit Video details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(video.id);
                              // Auto cancel after 5 seconds of inactivity
                              setTimeout(() => {
                                setConfirmDeleteId(prev => prev === video.id ? null : prev);
                              }, 5000);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent transition-all duration-150 active:scale-90 cursor-pointer"
                            title="Delete Video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider">
                {editingVideo ? 'Edit Lecture Video' : 'Add New Lecture Video'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full cursor-pointer hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Lecture Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Medical Biochemistry"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 outline-hidden transition-all text-zinc-800"
                />
              </div>

              {/* Source Type Toggle */}
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1.5">Video Resource Source</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSourceType('link')}
                    className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sourceType === 'link' ? 'bg-white text-zinc-900 shadow-xs animate-in fade-in duration-100' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Web Link / YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sourceType === 'upload' ? 'bg-white text-zinc-900 shadow-xs animate-in fade-in duration-100' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Manual Upload MP4
                  </button>
                </div>
              </div>

              {sourceType === 'link' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Video Resource Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://www.youtube.com/watch?v=sample"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 outline-hidden transition-all text-zinc-800"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Supports YouTube, Vimeo, or standard MP4 direct streaming links.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-700 block">Video File (Max 200MB) *</label>
                  <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 bg-zinc-50 flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="video/*"
                      className="hidden"
                    />
                    
                    {uploadingFile ? (
                      <div className="space-y-2 w-full px-4">
                        <UploadCloud className="h-8 w-8 text-indigo-500 animate-bounce mx-auto" />
                        <div className="text-xs font-bold text-zinc-700">Uploading lecture video... {uploadProgress}%</div>
                        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="h-8 w-8 text-zinc-400 mx-auto" />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                        >
                          Select MP4 File
                        </button>
                        <p className="text-[10px] text-zinc-500">Supports MP4, MKV, AVI files up to 200MB.</p>
                      </div>
                    )}
                  </div>
                  {videoUrl && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs font-bold text-zinc-700">
                      <span className="truncate max-w-[280px]">Active URL: {videoUrl}</span>
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Assign to Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 outline-hidden transition-all text-zinc-800"
                  >
                    <option value="">General / Unassigned</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title} ({course.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">Duration (MM:SS)</label>
                  <input
                    type="text"
                    placeholder="e.g. 15:45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 outline-hidden transition-all text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Lecture Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize topic learning outcomes, reference chapters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-zinc-900 outline-hidden transition-all text-zinc-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-xs font-black rounded-xl cursor-pointer transition-colors uppercase tracking-wider shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
