import CommunityChatEngine from '../../../components/chat/CommunityChatEngine';
import { MessageSquare, ShieldCheck } from 'lucide-react';

export default function AdminCommunityChat() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Instructor & Faculty Community Chat
          </h2>
          <p className="text-sm text-zinc-500">
            End-to-end encrypted classroom communication hub. Conduct live classes, post announcements, share scans, and communicate with students.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Instructor Portal
          </span>
        </div>
      </div>

      <CommunityChatEngine portalRole="ADMIN" />
    </div>
  );
}
