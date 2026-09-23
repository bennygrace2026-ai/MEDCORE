import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, Phone, BookOpen, Clock, Activity, Award, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, studentData } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-zinc-900 h-32"></div>
        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 mb-6 space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-zinc-800 border-4 border-white overflow-hidden flex items-center justify-center flex-shrink-0">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-zinc-400" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-zinc-900">{user?.name}</h2>
              <p className="text-sm font-medium text-amber-600">{user?.studentId}</p>
            </div>
            
            <div className="sm:ml-auto flex flex-col items-center sm:items-end">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${studentData?.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {studentData?.isApproved ? 'Verified Student' : 'Trial Active'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Personal Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-zinc-700">
                    <Mail className="h-4 w-4 mr-3 text-zinc-400" />
                    {user?.email}
                  </div>
                  <div className="flex items-center text-sm text-zinc-700">
                    <Phone className="h-4 w-4 mr-3 text-zinc-400" />
                    +234 Student Phone
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Academic Details</h3>
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500">Institution</p>
                    <p className="text-sm font-medium text-zinc-900">{studentData?.institution || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Department</p>
                    <p className="text-sm font-medium text-zinc-900">{studentData?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Level</p>
                    <p className="text-sm font-medium text-zinc-900">{studentData?.level || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Access & Balance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
                    <Award className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-amber-600 font-semibold uppercase">Coin Balance</p>
                    <p className="text-2xl font-bold text-amber-700">{studentData?.coins || 0}</p>
                  </div>
                  
                  <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
                    <Clock className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-red-600 font-semibold uppercase">Access Days</p>
                    <p className="text-2xl font-bold text-red-700">{studentData?.accessDaysRemaining || 0}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Platform Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 text-zinc-500 mr-2" />
                      <span className="text-sm font-medium text-zinc-700">Enrolled Courses</span>
                    </div>
                    <span className="font-bold text-zinc-900">0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-zinc-500 mr-2" />
                      <span className="text-sm font-medium text-zinc-700">Quizzes Taken</span>
                    </div>
                    <span className="font-bold text-zinc-900">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
