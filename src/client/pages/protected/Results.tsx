import { Award, Clock, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Results() {
  const { studentData } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Quiz Results & History</h2>
        <p className="text-zinc-500">View your current and previous quiz performance. Results automatically clear after 14 days unless retained.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
          <h3 className="font-bold text-zinc-900 flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" /> Recent Results
          </h3>
          <span className="text-xs font-semibold bg-zinc-200 text-zinc-600 px-3 py-1 rounded-full uppercase tracking-wider">
            Last 14 Days
          </span>
        </div>
        
        <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <FileText className="h-16 w-16 text-zinc-200 mb-4" />
          <h4 className="text-lg font-bold text-zinc-900 mb-2">No Recent Results</h4>
          <p className="text-zinc-500 max-w-sm">You haven't completed any quizzes in the last 14 days. Take a quiz to see your performance metrics here.</p>
        </div>
      </div>
    </div>
  );
}
