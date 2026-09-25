import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  MinusCircle, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface StudentRecord {
  id: string;
  studentId: string;
  name: string;
  email: string;
  coins: number;
  status: string;
  institution?: string;
  department?: string;
}

export default function StudentCoinDeductionPanel() {
  const { token } = useAuthStore();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const [actionType, setActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStudents = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (selectedStudent) {
          const updated = data.find((s: StudentRecord) => s.studentId === selectedStudent.studentId);
          if (updated) setSelectedStudent(updated);
        }
      }
    } catch (err) {
      console.warn('Students data temporarily unavailable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !token) return;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive coin amount.' });
      return;
    }

    if (actionType === 'DEDUCT') {
      if (!confirm(`Are you sure you want to deduct ${numAmount} coins from ${selectedStudent.name}?`)) {
        return;
      }
      if (numAmount > (selectedStudent.coins || 0)) {
        if (!confirm(`Warning: Student only has ${selectedStudent.coins} coins. Deducting ${numAmount} coins will set their balance to 0. Proceed?`)) {
          return;
        }
      }
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/users/adjust-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          action: actionType,
          amount: numAmount,
          reason: reason || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || `Successfully adjusted coins for ${selectedStudent.name}.`
        });
        setAmount('');
        setReason('');
        await fetchStudents();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to adjust coins.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error communicating with server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Student Coin Management & Adjustments</h3>
            <p className="text-xs text-zinc-500">
              Directly credit or adjust coins for any student. Coins are used to access quizzes and exams based on dynamic platform pricing.
            </p>
          </div>
        </div>
        <button
          onClick={fetchStudents}
          disabled={isLoading}
          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Students
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {feedback && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Student Selector */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              1. Select Student
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, Medcore ID, or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            <div className="max-h-64 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 bg-white">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500">
                  {isLoading ? 'Loading students...' : 'No students found matching your query.'}
                </div>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.studentId === s.studentId;
                  return (
                    <button
                      type="button"
                      key={s.studentId}
                      onClick={() => {
                        setSelectedStudent(s);
                        setFeedback(null);
                      }}
                      className={`w-full text-left p-3 flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                        isSelected ? 'bg-amber-50/80 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{s.name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-zinc-700">
                            {s.studentId}
                          </span>
                          <span>•</span>
                          <span>{s.email}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs border border-amber-200">
                          <Coins className="h-3.5 w-3.5" />
                          {(s.coins || 0).toLocaleString()} Coins
                        </span>
                        {s.status && s.status !== 'ACTIVE' && (
                          <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5">{s.status}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Coin Adjustment Action */}
          <div className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
              2. Coin Adjustment Action
            </label>

            {!selectedStudent ? (
              <div className="h-64 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <User className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-zinc-600">No Student Selected</p>
                <p className="text-xs max-w-xs text-zinc-400 mt-1">
                  Choose a student from the list on the left to deduct or credit coins.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAdjustCoins} className="p-5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-4">
                {/* Active Student Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{selectedStudent.name}</h4>
                    <p className="text-xs text-zinc-500 font-mono">{selectedStudent.studentId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 block">Current Balance:</span>
                    <span className="text-lg font-black text-amber-600">
                      {(selectedStudent.coins || 0).toLocaleString()} Coins
                    </span>
                  </div>
                </div>

                {/* Mode Selector: Add vs Deduct */}
                <div>
                  <span className="block text-xs font-bold text-zinc-700 mb-2 uppercase">Action:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType('ADD')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        actionType === 'ADD'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <ArrowUpCircle className="h-4 w-4" /> Add Coins (Credit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType('DEDUCT')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        actionType === 'DEDUCT'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      <ArrowDownCircle className="h-4 w-4" /> Deduct Coins (Penalty)
                    </button>
                  </div>
                </div>

                {/* Dynamic coin usage notice */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                  <Coins className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dynamic Coin Usage:</strong> Credited coins are available for students to unlock quizzes and exams at the current active coin rates.
                  </span>
                </div>

                {/* Amount Input & Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-700 uppercase">
                      Amount to {actionType === 'DEDUCT' ? 'Deduct' : 'Credit'}
                    </label>
                    {amount && typeof amount === 'number' && (
                      <span className="text-xs font-semibold text-zinc-500">
                        Resulting balance:{' '}
                        <strong className="text-zinc-900">
                          {actionType === 'DEDUCT'
                            ? Math.max(0, (selectedStudent.coins || 0) - amount).toLocaleString()
                            : ((selectedStudent.coins || 0) + amount).toLocaleString()}{' '}
                          coins
                        </strong>
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 30"
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-mono font-bold bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[10, 30, 50, 100, 500, 1000].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setAmount(preset)}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {preset === 30 ? '30 (1 Quiz)' : `${preset}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason / Notes */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1 uppercase">
                    Reason / Administrative Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Quiz penalty, correction, or bonus reward"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    actionType === 'DEDUCT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : actionType === 'DEDUCT' ? (
                    <>
                      <MinusCircle className="h-4 w-4" />
                      Deduct {amount ? Number(amount).toLocaleString() : 0} Coins from {selectedStudent.name}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Add {amount ? Number(amount).toLocaleString() : 0} Coins to {selectedStudent.name}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
