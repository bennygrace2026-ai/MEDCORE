import { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CourseListSkeleton } from '../../components/courses/CourseCardSkeleton';
import { getCourseFallbackImage } from '../../constants/brandAssets';

interface Course {
  id: string;
  title: string;
  code?: string;
  description?: string;
  thumbnail?: string | null;
  isProtected?: boolean;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses/public')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch(err => console.warn('Public courses temporarily unavailable:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex-grow bg-white">
      <div className="bg-zinc-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Curated Medical Courses
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            High-yield courses and board-style clinical question banks created by academy administrators.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <CourseListSkeleton variant="public" count={6} gridId="public-courses-skeleton-grid" />
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 p-10 max-w-2xl mx-auto">
            <BookOpen className="h-14 w-14 text-zinc-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 mb-2">New Courses in Preparation</h2>
            <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
              Academy faculty are currently compiling and publishing curriculum materials. Register today to be among the first to start your 3-course free trial.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
            >
              Register for Free Trial
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col group"
              >
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

                  {course.isProtected && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2.5 py-1 bg-purple-900/90 backdrop-blur-xs text-purple-100 rounded-full text-[11px] font-bold flex items-center shadow-xs">
                        <ShieldCheck className="h-3 w-3 mr-1 text-purple-300" /> Protected
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100">
                      {course.code || 'CORE MED'}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400 uppercase">Interactive Quiz</span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-900 mb-2 leading-tight">
                    {course.title}
                  </h3>

                  <p className="text-zinc-500 text-sm mb-6 flex-grow leading-relaxed">
                    {course.description || 'Clinical curriculum including high-yield practice questions and comprehensive explanations.'}
                  </p>

                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      Free Trial: 10 Questions
                    </span>
                    <Link 
                      to="/register" 
                      className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      Register Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Free Trial Banner */}
        <div className="mt-16 text-center bg-zinc-50 rounded-2xl p-8 sm:p-10 border border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Start with our 3-Course Free Trial</h2>
          <p className="text-zinc-600 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
            Every new student receives free access to up to 3 medical courses with 10 board-style questions per course. Upgrade with coins at any time for full 50+ question banks.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            Create Student Account
          </Link>
        </div>
      </div>
    </div>
  );
}
