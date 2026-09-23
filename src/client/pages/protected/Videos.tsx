import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Play, 
  Video, 
  Clock, 
  BookOpen, 
  Search, 
  PlayCircle,
  X,
  Sparkles,
  Award
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

export default function Videos() {
  const { token, user } = useAuthStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  // Interactive Video Player State
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideosAndCourses = async () => {
      try {
        setIsLoading(true);
        // Fetch All Videos
        const vRes = await fetch('/api/users/videos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          setVideos(vData);
          setAccessError(null);
        } else if (vRes.status === 403) {
          const errData = await vRes.json();
          setAccessError(errData.error || 'Access Denied');
        }

        // Fetch Courses
        const cRes = await fetch('/api/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          setCourses(Array.isArray(cData) ? cData : (cData.courses || []));
        }
      } catch (err) {
        console.error('Error fetching videos data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchVideosAndCourses();
    }
  }, [token]);

  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
        }
      } else if (url.includes('vimeo.com')) {
        const id = url.split('/').pop();
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
      }
    } catch {}
    return url;
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(search.toLowerCase()) || 
                          (video.description && video.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCourse = selectedCourseId === 'all' || video.courseId === selectedCourseId;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Premium Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" /> High Definition Lecture Streams
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Academic Video Portal</h2>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Supplement your preparation with high-yield explanation videos led by Medcore Academy instructors.
          </p>
        </div>
        <div className="p-4 bg-zinc-900 text-white rounded-2xl shrink-0 border border-zinc-800 text-center relative z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Available Lectures</div>
          <div className="text-2xl font-black mt-1">{videos.length} Lectures</div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-radial-at-t from-purple-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Filter Toolbar */}
      {!accessError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="md:col-span-2 bg-white px-4 py-3 rounded-2xl border border-zinc-200 flex items-center gap-2.5">
            <Search className="h-4.5 w-4.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search academic lecture videos by title or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-transparent outline-hidden text-zinc-800 placeholder-zinc-400"
            />
          </div>

          {/* Course assigned selector dropdown */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-zinc-200 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full text-sm bg-transparent outline-hidden text-zinc-800 font-bold cursor-pointer"
            >
              <option value="all">All Specialties / Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main video catalog stream */}
      {accessError ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center min-h-[380px] max-w-2xl mx-auto shadow-xs">
          <div className="p-4 bg-purple-50 rounded-full border border-purple-100 text-purple-600 mb-4 animate-pulse">
            <PlayCircle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-zinc-950 tracking-tight">Access Restricted</h3>
          <p className="text-zinc-500 text-sm max-w-md mt-2 leading-relaxed">
            {accessError}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link 
              to="/dashboard/payments" 
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center justify-center"
            >
              Purchase Coins / Access Package
            </Link>
            <Link 
              to="/dashboard" 
              className="px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 active:scale-95 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="p-16 text-center text-zinc-500 font-bold">Assembling video library streaming catalog...</div>
      ) : filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center flex flex-col items-center justify-center min-h-[350px]">
          <PlayCircle className="h-16 w-16 text-zinc-200 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-zinc-950">No Lectures Found</h3>
          <p className="text-zinc-500 text-sm max-w-sm mt-1">Adjust your filter terms or check back later as new high-yield lectures are added daily!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const course = courses.find(c => c.id === video.courseId);
            const courseTitle = course ? course.title : 'General Study';

            return (
              <div 
                key={video.id} 
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md hover:border-zinc-300 transition-all flex flex-col group cursor-pointer"
                onClick={() => setActiveVideo(video)}
              >
                {/* Visual Thumbnail Frame with hover scale */}
                <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-950 to-zinc-950 opacity-90 group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  
                  {/* Decorative Play Button overlay */}
                  <div className="relative z-10 h-12 w-12 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-zinc-950 transition-all duration-300 shadow-lg">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>

                  <span className="absolute bottom-3 right-3 text-[10px] font-black text-white bg-black/75 px-2 py-1 rounded-md tracking-wider flex items-center gap-1 backdrop-blur-xs">
                    <Clock className="h-3 w-3 text-purple-400" /> {video.duration}
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full uppercase">
                      {courseTitle}
                    </span>
                    <h3 className="text-base font-black text-zinc-900 mt-2 line-clamp-1 group-hover:text-purple-700 transition-colors">{video.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 h-8">{video.description || 'No supplementary details listed. Select to begin streaming this lecture.'}</p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Award className="h-3.5 w-3.5" /> High-Yield Topic
                    </span>
                    <span>Begin Study</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Modal Video Stream Player overlay */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 text-white">
            
            {/* Modal header details */}
            <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black tracking-wider uppercase text-purple-400">Streaming Interactive Lecture</span>
                <h3 className="font-black text-base sm:text-lg text-white line-clamp-1 mt-0.5">{activeVideo.title}</h3>
              </div>
              <button 
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full cursor-pointer hover:bg-zinc-800 transition-colors"
                title="Close Stream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Premium Embed Frame */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {!(activeVideo.videoUrl.includes('youtube.com') || activeVideo.videoUrl.includes('youtu.be') || activeVideo.videoUrl.includes('vimeo.com')) ? (
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={getEmbedUrl(activeVideo.videoUrl)}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title}
                />
              )}
            </div>

            {/* Supplemental course context below player */}
            <div className="p-6 bg-zinc-900 space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-bold text-purple-400 uppercase tracking-widest text-[10px]">Course Assignment:</span>
                <span>{courses.find(c => c.id === activeVideo.courseId)?.title || 'General Medical Syllabus'}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {activeVideo.duration}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-h-24 overflow-y-auto pt-1">{activeVideo.description || 'No supplementary study descriptions are listed for this lecture. Follow along with your printed note course materials.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
