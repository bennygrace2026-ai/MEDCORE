import { Trophy } from 'lucide-react';

export default function Achievements() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Achievements</h2>
        <p className="text-zinc-500">Track your milestones and earned badges.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Trophy className="h-16 w-16 text-zinc-200 mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 mb-2">No Achievements Yet</h3>
          <p className="text-zinc-500 max-w-sm mb-6">Complete courses and ace quizzes to start earning badges and achievements.</p>
        </div>
      </div>
    </div>
  );
}
