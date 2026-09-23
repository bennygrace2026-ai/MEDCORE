import { useAuthStore } from '../../store/authStore';
import CommunityChatEngine from '../../components/chat/CommunityChatEngine';
import { ShieldAlert, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Community() {
  const { studentData } = useAuthStore();
  
  // Verify access: approved student with active status or remaining access
  const hasAccess = studentData?.isApproved !== false;

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Community Access Restricted</h2>
        <p className="text-zinc-500 max-w-md mx-auto mb-8 text-sm">
          To maintain an authentic and secure medical training environment, the community chat and student networking directory are reserved for approved Medcore Academy students.
        </p>
        <Link 
          to="/dashboard/payments" 
          className="inline-flex items-center px-6 py-3 text-xs font-bold rounded-2xl text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Lock className="h-4 w-4 mr-2" /> Upgrade Access
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommunityChatEngine portalRole="STUDENT" />
    </div>
  );
}
