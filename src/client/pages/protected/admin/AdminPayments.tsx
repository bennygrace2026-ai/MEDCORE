import { useState } from 'react';
import { CreditCard, ShieldCheck, Banknote, RefreshCw } from 'lucide-react';
import PendingPaymentsQueue from '../../../components/superadmin/PendingPaymentsQueue';

export default function AdminPayments() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Manual Payments & Verification Portal
          </h2>
          <p className="text-sm text-zinc-500">
            Review submitted bank transfers and Paystack reference proofs. Approving immediately credits student coins and updates their account access.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Admin Authorized
          </span>
        </div>
      </div>

      {/* Main Payment Queue Component */}
      <PendingPaymentsQueue />
    </div>
  );
}
