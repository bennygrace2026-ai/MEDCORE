import React from 'react';
import { BookOpen } from 'lucide-react';

export interface CourseCardSkeletonProps {
  key?: React.Key;
  variant?: 'public' | 'student' | 'admin';
  compact?: boolean;
  id?: string;
}

export const CourseCardSkeleton: React.FC<CourseCardSkeletonProps> = ({
  variant = 'student',
  compact = false,
  id
}) => {
  const heightClass = compact ? 'h-44' : 'h-48';

  return (
    <div
      id={id || `course-skeleton-${Math.random().toString(36).substring(2, 9)}`}
      className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col animate-pulse"
      aria-hidden="true"
      role="status"
    >
      {/* Thumbnail Area Placeholder */}
      <div className={`${heightClass} w-full relative overflow-hidden bg-zinc-100 skeleton-shimmer flex items-center justify-center`}>
        <BookOpen className="h-10 w-10 text-zinc-300 opacity-60" />

        {/* Top-Left Status Badge Placeholder */}
        <div className="absolute top-4 left-4">
          <div className="h-6 w-24 rounded-full bg-zinc-200/90 shadow-xs" />
        </div>

        {/* Top-Right Protection Badge Placeholder */}
        <div className="absolute top-4 right-4">
          <div className="h-6 w-20 rounded-full bg-zinc-200/90 shadow-xs" />
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Code Tag & Category Row */}
        <div className="flex justify-between items-center mb-3">
          <div className="h-5 w-20 rounded-md bg-zinc-100 skeleton-shimmer" />
          <div className="h-4 w-24 rounded bg-zinc-100" />
        </div>

        {/* Course Title Lines */}
        <div className="h-6 w-4/5 rounded-md bg-zinc-200 skeleton-shimmer mb-2" />
        <div className="h-4 w-1/2 rounded-md bg-zinc-100 mb-4" />

        {/* Course Description Lines */}
        <div className="space-y-2 mb-6 flex-grow">
          <div className="h-3 w-full rounded bg-zinc-100" />
          <div className="h-3 w-11/12 rounded bg-zinc-100" />
          <div className="h-3 w-3/4 rounded bg-zinc-100" />
        </div>

        {/* Footer / CTA Actions */}
        <div className="pt-4 border-t border-zinc-100 mt-auto">
          {variant === 'public' ? (
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-zinc-100" />
              <div className="h-5 w-24 rounded bg-zinc-200 skeleton-shimmer" />
            </div>
          ) : variant === 'admin' ? (
            <div className="flex items-center justify-between gap-2">
              <div className="h-9 w-24 rounded-xl bg-zinc-100" />
              <div className="h-9 w-28 rounded-xl bg-purple-100 skeleton-shimmer" />
            </div>
          ) : (
            <div className="h-10 w-full rounded-xl bg-zinc-200 skeleton-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
}

export interface CourseListSkeletonProps {
  count?: number;
  variant?: 'public' | 'student' | 'admin';
  compact?: boolean;
  className?: string;
  gridId?: string;
}

export const CourseListSkeleton: React.FC<CourseListSkeletonProps> = ({
  count = 6,
  variant = 'student',
  compact = false,
  className,
  gridId = 'courses-skeleton-grid'
}) => {
  const defaultGridClass =
    variant === 'public'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div id={gridId} className={className || defaultGridClass} aria-label="Loading courses" role="status">
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton
          key={`course-skeleton-item-${index}`}
          id={`course-skeleton-card-${index}`}
          variant={variant}
          compact={compact}
        />
      ))}
      <span className="sr-only">Loading courses...</span>
    </div>
  );
}
