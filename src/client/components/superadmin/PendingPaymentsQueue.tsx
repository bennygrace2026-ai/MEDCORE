import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ShieldCheck, 
  Coins, 
  Calendar, 
  User, 
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export interface PaymentRequestItem {
  id: string;
  userId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  packageTitle: string;
  coins: number;
  amountNgn: number;
  durationMonths: number;
  durationDays: number;
  paymentMethod: string;
  reference?: string;
  proofUrl?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  confirmedAt?: string;
}

export default function PendingPaymentsQueue() {
  const { token, user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [requests, setRequests] = useState<PaymentRequestItem[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'CONFIRMED' | 'ALL'>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRequests = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/payment-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load payment requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleConfirm = async (item: PaymentRequestItem) => {
    if (!token) return;
    if (!confirm(`Confirm payment of ₦${item.amountNgn.toLocaleString()} for ${item.studentName}? This will instantly credit ${item.coins.toLocaleString()} coins and ${item.durationDays || (item.durationMonths * 30)} days access.`)) {
      return;
    }

    setProcessingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/users/payment-requests/${item.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || `Payment confirmed and ${item.coins.toLocaleString()} coins credited to ${item.studentName}.`
        });
        await fetchRequests();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to confirm payment.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error communicating with server.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: PaymentRequestItem) => {
    if (!token) return;
    const note = prompt('Enter a reason for rejecting this payment request (optional):');
    if (note === null) return; // cancelled

    setProcessingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/users/payment-requests/${item.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes: note })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Payment request for ${item.studentName} has been rejected.`
        });
        await fetchRequests();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to reject payment.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error communicating with server.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReceipt = async (item: PaymentRequestItem) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to delete the uploaded receipt proof for ${item.studentName}? This will clear the proof attachment from both this request and the student's profile.`)) {
      return;
    }

    setProcessingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/users/payment-requests/${item.id}/receipt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'Payment receipt proof cleared successfully.'
        });
        await fetchRequests();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to delete receipt.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error communicating with server.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteRequest = async (item: PaymentRequestItem) => {
    if (!token) return;
    if (!confirm(`Are you sure you want to permanently delete this payment request record for ${item.studentName}?`)) {
      return;
    }

    setProcessingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/users/payment-requests/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'Payment request record deleted successfully.'
        });
        await fetchRequests();
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to delete request record.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error communicating with server.' });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const filteredRequests = requests.filter(r => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'CONFIRMED') return r.status === 'CONFIRMED';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900">Payment Verification & Coin Crediting Queue</h3>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Payments must be reviewed and confirmed by Super Admin before coins are added to the student account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Pills */}
          <div className="flex bg-zinc-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'PENDING' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'CONFIRMED' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'ALL' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All ({requests.length})
            </button>
          </div>

          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-colors"
            title="Refresh payments"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">
        {feedback && (
          <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 text-sm font-medium ${
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

        {isLoading ? (
          <div className="py-12 text-center text-zinc-400 text-sm">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-2" />
            Loading payment verification queue...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-zinc-300" />
            <p className="text-base font-semibold text-zinc-700">No {filter.toLowerCase()} payments found</p>
            <p className="text-xs text-zinc-400 mt-1">
              {filter === 'PENDING' 
                ? 'All student payment requests have been reviewed and processed!' 
                : 'No payment records match this filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredRequests.map((item) => {
              const isPending = item.status === 'PENDING';
              const isConfirmed = item.status === 'CONFIRMED';
              const isRejected = item.status === 'REJECTED';

              return (
                <div key={item.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-50/50 p-3 rounded-xl transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 text-base">{item.studentName}</span>
                      <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-semibold">
                        {item.studentId}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPending ? 'bg-amber-100 text-amber-800' :
                        isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Email: <strong className="text-zinc-700">{item.studentEmail}</strong> • Method:{' '}
                      <strong className="text-zinc-700">{item.paymentMethod === 'ONLINE_PAYSTACK' ? 'Online Paystack' : 'Manual Bank Wire'}</strong> • Ref:{' '}
                      <span className="font-mono text-zinc-600">{item.reference || '—'}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span className="font-semibold text-zinc-800 bg-zinc-100 px-2.5 py-1 rounded-lg">
                        Package: {item.packageTitle}
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Amount: ₦{Number(item.amountNgn).toLocaleString()}
                      </span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" />
                        Will credit: {Number(item.coins).toLocaleString()} Coins
                      </span>
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        Duration: {item.durationMonths} Month(s) ({item.durationDays || (item.durationMonths * 30)} Days)
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {item.proofUrl && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <a
                          href={item.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline gap-1 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100"
                        >
                          <FileText className="h-3.5 w-3.5" /> View Uploaded Receipt / Proof <ExternalLink className="h-3 w-3" />
                        </a>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteReceipt(item)}
                            disabled={processingId === item.id}
                            className="inline-flex items-center text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 gap-1 bg-white px-2.5 py-1 rounded-md border border-red-200 cursor-pointer disabled:opacity-50"
                            title="Super Admin: Clear receipt proof"
                          >
                            <Trash2 className="h-3 w-3.5 text-red-500" /> Delete Receipt
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleConfirm(item)}
                          disabled={processingId === item.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Confirm & Credit Coins
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          disabled={processingId === item.id}
                          className="px-3 py-2 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    ) : isConfirmed ? (
                      <div className="text-right">
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" /> Confirmed & Credited
                        </span>
                        {item.confirmedAt && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(item.confirmedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                        <XCircle className="h-4 w-4 mr-1 text-red-600" /> Rejected
                      </span>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteRequest(item)}
                        disabled={processingId === item.id}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100 disabled:opacity-50"
                        title="Super Admin: Delete entire payment request record"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
