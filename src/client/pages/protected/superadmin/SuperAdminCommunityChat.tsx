import CommunityChatEngine from '../../../components/chat/CommunityChatEngine';
import { MessageSquare, Crown, ShieldAlert } from 'lucide-react';

export default function SuperAdminCommunityChat() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Academy Super Admin Community & Live Classrooms
          </h2>
          <p className="text-sm text-zinc-500">
            End-to-end encrypted hub for faculty leadership. Post official announcements, broadcast live group class sessions, and communicate across all departments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-purple-600" />
            Super Admin Access
          </span>
        </div>
      </div>

      <CommunityChatEngine portalRole="SUPER_ADMIN" />
    </div>
  );
}
