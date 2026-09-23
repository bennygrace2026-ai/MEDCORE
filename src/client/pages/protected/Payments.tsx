import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, parseCoinPackages, DEFAULT_PACKAGES, CoinPackage } from '../../store/settingsStore';
import { 
  Coins, 
  Upload, 
  CreditCard, 
  Building, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  RefreshCw,
  Hourglass,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Trash2,
  X
} from 'lucide-react';
import TrialCountdownBadge from '../../components/shared/TrialCountdownBadge';

interface StudentPaymentRequest {
  id: string;
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
}

export default function Payments() {
  const { studentData, token, checkAuth, user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { settings, fetchSettings } = useSettingsStore();

  const quizCoinCost = settings?.quizCoinCost || 30;

  const packages: CoinPackage[] = React.useMemo(() => {
    const parsed = parseCoinPackages(settings?.coinPackages);
    return parsed.length > 0 ? parsed : DEFAULT_PACKAGES;
  }, [settings?.coinPackages]);

  const [selectedPackage, setSelectedPackage] = useState<CoinPackage>(
    packages.find(p => p.popular) || packages[0] || DEFAULT_PACKAGES[0]
  );

  // Sync selectedPackage if packages change
  useEffect(() => {
    if (packages.length > 0 && !packages.find(p => p.id === selectedPackage?.id)) {
      setSelectedPackage(packages.find(p => p.popular) || packages[0]);
    }
  }, [packages, selectedPackage]);

  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'manual'>('paystack');

  // Sync payment method if settings change
  useEffect(() => {
    if (settings) {
      if (!settings.enablePaystack && paymentMethod === 'paystack') {
        setPaymentMethod('manual');
      }
    }
  }, [settings, paymentMethod]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customCoins, setCustomCoins] = useState<number | ''>('');

  useEffect(() => {
    if (selectedPackage) {
      setCustomCoins(selectedPackage.coins);
    }
  }, [selectedPackage]);
  
  // Payment Requests History
  const [myRequests, setMyRequests] = useState<StudentPaymentRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchMyRequests();
  }, [fetchSettings, token]);

  const fetchMyRequests = async () => {
    if (!token) return;
    setIsLoadingRequests(true);
    try {
      const res = await fetch('/api/users/payment-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error('Failed to load my payment requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const isPaidOrApproved = Boolean(
    studentData?.isApproved || (studentData?.coins && studentData.coins > 0)
  );

  const calculateDaysRemaining = () => {
    if (!studentData?.accessExpiryDate) {
      return studentData?.accessDaysRemaining ?? 0;
    }
    const diff = new Date(studentData.accessExpiryDate).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpired = daysRemaining <= 0;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      setErrorMessage('Please select a payment receipt (image or PDF) to upload');
      return;
    }

    if (!token) {
      setErrorMessage('Authentication session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('receipt', proofFile);
      formData.append('packageId', selectedPackage.id);
      formData.append('packageCoins', String(customCoins || selectedPackage.coins));
      formData.append('packagePrice', String(selectedPackage.price));
      formData.append('durationMonths', String(selectedPackage.durationMonths || 1));

      const res = await fetch('/api/users/payment-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setUploadSuccess(
          data.message || 'Payment receipt submitted successfully! Payment must be confirmed by Super Admin before coins and access are added.'
        );
        setProofFile(null);
        await checkAuth();
        await fetchMyRequests();
      } else {
        setErrorMessage(data.error || 'Failed to upload receipt. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadSuccess(null);

    try {
      const res = await fetch('/api/users/purchase-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          packageTitle: selectedPackage.name,
          coins: selectedPackage.coins,
          price: selectedPackage.price,
          days: selectedPackage.days || ((selectedPackage.durationMonths || 1) * 30),
          durationMonths: selectedPackage.durationMonths || 1,
          reference: `PSK-${Date.now()}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(
          data.message || 'Payment recorded! Payment must be confirmed by Super Admin before coins will be added to your balance.'
        );
        await checkAuth();
        await fetchMyRequests();
      } else {
        setErrorMessage(data.error || 'Payment processing could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Live Countdown & Access Banner */}
      {!isPaidOrApproved && (
        <TrialCountdownBadge 
          accessExpiryDate={studentData?.accessExpiryDate}
          accessDaysRemaining={studentData?.accessDaysRemaining}
          isPaidOrApproved={isPaidOrApproved}
        />
      )}

      {/* Balance & Status Card */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between border border-zinc-800 shadow-xl">
        <div className="flex items-center space-x-4 mb-6 sm:mb-0">
          <div className="p-4 bg-amber-500 rounded-2xl">
            <Coins className="h-8 w-8 text-zinc-900" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Balance</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-white">{studentData?.coins || 0}</span>
              <span className="text-lg font-bold text-amber-500">Coins</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {quizCoinCost} Coins deducted per quiz answered
            </p>
            <div className="mt-1 text-xs text-amber-400 font-semibold flex items-center gap-1.5">
              <span>{Math.floor((studentData?.coins || 0) / quizCoinCost)} Quizzes Available</span>
              <span className="text-[10px] text-zinc-400 font-normal">({quizCoinCost} coins/quiz)</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4 text-center">
          <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/60 min-w-[130px]">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Access Duration
            </p>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-2xl font-black text-white">{daysRemaining}</span>
              <span className="text-xs font-medium text-zinc-400">days</span>
            </div>
            {studentData?.accessExpiryDate && (
              <p className="text-[10px] text-zinc-400 mt-1">
                Exp: {new Date(studentData.accessExpiryDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/60 min-w-[130px]">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Plan Status
            </p>
            <div className="flex items-baseline justify-center space-x-1">
              <span className={`text-xl font-bold ${isPaidOrApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isPaidOrApproved ? 'Full Access' : isExpired ? 'Expired' : 'Free Trial'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              {isPaidOrApproved ? 'Verified Account' : 'Limited to 10 Qs'}
            </p>
          </div>
        </div>
      </div>

      {/* Super Admin Verification Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
        <Hourglass className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-sm text-amber-900">
            Payment Verification Notice
          </p>
          <p className="text-amber-800">
            All payments (online checkout or manual bank transfer) must be confirmed by the Super Admin before coins and access are credited to your account.
          </p>
        </div>
      </div>

      {/* Success / Error Messages */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-emerald-800 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{uploadSuccess}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between text-red-800 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Coin Packages Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Select Coin Package</h3>
            <p className="text-xs sm:text-sm text-zinc-500">
              Purchase coins to unlock all 50+ question banks, clinical rationales, and mock exams.
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100 whitespace-nowrap">
            Per Quiz Deducted: {quizCoinCost} Coins
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isSelected = selectedPackage.id === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all flex flex-col justify-between hover:shadow-md ${
                  isSelected 
                    ? 'border-zinc-900 shadow-md ring-2 ring-zinc-900/10' 
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                    <span className="bg-zinc-900 text-white text-[11px] font-black uppercase tracking-wider py-1 px-3.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="text-center pt-2 mb-4">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      {pkg.name || 'Access Tier'}
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-zinc-900 block">
                      {Number(pkg.coins).toLocaleString()}
                    </span>
                    <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Coins Included
                    </span>
                  </div>

                  <ul className="space-y-2.5 mb-6 text-xs text-zinc-700 border-t border-zinc-100 pt-4">
                    <li className="flex items-center font-semibold text-purple-700">
                      <Coins className="h-4 w-4 mr-2 text-purple-600 flex-shrink-0" />
                      <span>{Math.floor((pkg.coins || 0) / (quizCoinCost || 30))} Complete Quizzes</span>
                    </li>
                    <li className="flex items-center font-medium">
                      <Clock className="h-4 w-4 mr-2 text-zinc-400 flex-shrink-0" />
                      <span>No Time Expiration (Pay Per Quiz)</span>
                    </li>
                    <li className="flex items-center font-medium">
                      <ArrowRight className="h-3.5 w-3.5 mr-2 text-zinc-400 flex-shrink-0" />
                      <span>Full Access: Rationales & Mock Exams</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center pt-3 border-t border-zinc-100">
                  <span className="text-2xl font-black text-zinc-900">₦{Number(pkg.price).toLocaleString()}</span>
                  <button
                    type="button"
                    className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      isSelected 
                        ? 'bg-zinc-900 text-white' 
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-xl font-bold text-zinc-900">Payment Method</h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            Paying <strong>₦{Number(selectedPackage.price).toLocaleString()}</strong> for <strong>{Number(selectedPackage.coins).toLocaleString()} Coins</strong> ({selectedPackage.durationMonths || 1} Month Access).
          </p>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {settings?.enablePaystack && (
              <button
                onClick={() => setPaymentMethod('paystack')}
                className={`flex-1 flex items-center justify-center p-4 border rounded-xl font-bold transition-all ${
                  paymentMethod === 'paystack' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs' 
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <CreditCard className="h-5 w-5 mr-3 text-emerald-600" />
                Pay Online (Paystack Checkout)
              </button>
            )}
            <button
              onClick={() => setPaymentMethod('manual')}
              className={`flex-1 flex items-center justify-center p-4 border rounded-xl font-bold transition-all ${
                paymentMethod === 'manual' 
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-xs' 
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Building className="h-5 w-5 mr-3" />
              Manual Bank Transfer
            </button>
          </div>

          {paymentMethod === 'paystack' && (
            <div className="text-center py-8 bg-zinc-50/50 rounded-2xl border border-zinc-100 p-6">
              <ShieldCheck className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-zinc-900 mb-2">Automated Online Payment</h4>
              <p className="text-zinc-500 mb-6 max-w-md mx-auto text-sm">
                Your payment of <strong>₦{Number(selectedPackage.price).toLocaleString()}</strong> for <strong>{Number(selectedPackage.coins).toLocaleString()} coins</strong> will be submitted to the verification queue for Super Admin confirmation.
              </p>
              <button
                id="btn-pay-now"
                onClick={handlePaystackPayment}
                disabled={isSubmitting}
                className="inline-flex justify-center items-center gap-2 px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" /> Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Pay ₦{Number(selectedPackage.price).toLocaleString()} Now
                  </>
                )}
              </button>
            </div>
          )}

          {paymentMethod === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                <h4 className="font-bold text-zinc-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-zinc-500" /> Destination Bank Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Bank Name</p>
                    <p className="text-lg font-semibold text-zinc-900">{settings?.bankName || 'Guaranty Trust Bank (GTB)'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Account Name</p>
                    <p className="text-lg font-semibold text-zinc-900 uppercase">{settings?.accountName || 'UNI9JA MEDIA MEDCORE'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Account Number</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-2xl font-black font-mono text-zinc-900 tracking-wider">
                        {settings?.accountNumber || '0123456789'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings?.accountNumber || '0123456789');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1.5 hover:bg-zinc-200 text-zinc-600 rounded-lg transition-colors"
                        title="Copy Account Number"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {copied && <p className="text-xs font-semibold text-emerald-600">Copied to clipboard!</p>}
                  </div>
                  <div className="pt-4 border-t border-zinc-200">
                    <p className="text-sm font-medium text-amber-800">
                      Amount to Transfer: <strong>₦{Number(selectedPackage.price).toLocaleString()}</strong>
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Package: {Number(selectedPackage.coins).toLocaleString()} Coins ({selectedPackage.durationMonths || 1} Month Access)
                    </p>
                  </div>
                  {settings?.paymentInstructions && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      <strong>Note:</strong> {settings.paymentInstructions}
                    </div>
                  )}
                  {settings?.supportPhone && (
                    <div className="text-xs text-zinc-500">
                      Payment Support WhatsApp/Call: <strong>{settings.supportPhone}</strong>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">
                    Total Coins Paid For
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="appearance-none block w-full px-4 py-3 border border-zinc-300 rounded-xl shadow-xs focus:ring-zinc-950 focus:border-zinc-950 sm:text-sm font-mono font-bold text-zinc-900 bg-white"
                    placeholder="Enter total coins"
                    value={customCoins}
                    onChange={(e) => setCustomCoins(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    required
                  />
                  <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                    Enter the total number of coins you paid for. When approved, this amount will automatically count and be credited to your balance.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-800 mb-2">Upload Payment Receipt</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 border-dashed rounded-xl hover:border-zinc-400 transition-colors bg-zinc-50/50">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-zinc-400" />
                      <div className="flex text-sm text-zinc-600 justify-center">
                        <label className="relative cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-zinc-200 font-bold text-purple-600 hover:text-purple-500 focus-within:outline-none shadow-sm">
                          <span>Choose Receipt File</span>
                          <input 
                            type="file" 
                            className="sr-only" 
                            required 
                            accept="image/*,.pdf" 
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)} 
                          />
                        </label>
                      </div>
                      <p className="text-xs text-zinc-500">JPG, PNG, or PDF up to 10MB</p>
                      {proofFile && (
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 mt-2 text-xs font-bold text-emerald-800">
                          Selected: {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !proofFile}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Uploading Receipt...' : 'Submit Payment Proof for Confirmation'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Student's Recent Payment Requests */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-zinc-900">Your Payment Verification History</h4>
            <p className="text-xs text-zinc-500">Track confirmation status of your coin purchases.</p>
          </div>
          <button
            onClick={fetchMyRequests}
            disabled={isLoadingRequests}
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRequests ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            No payment requests submitted yet. Select a package above to purchase coins.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {myRequests.map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900">{req.packageTitle}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      req.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status === 'PENDING' ? 'Awaiting Super Admin Confirmation' : req.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-2">
                    <span>₦{Number(req.amountNgn).toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{Number(req.coins).toLocaleString()} Coins</span>
                    <span>•</span>
                    <span>{req.paymentMethod === 'ONLINE_PAYSTACK' ? 'Online Paystack' : 'Manual Bank Wire'}</span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  {req.proofUrl && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <a
                        href={req.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <FileText className="h-3 w-3" /> View Uploaded Receipt
                      </a>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete the uploaded receipt proof? This frees up cloud storage space.')) return;
                            try {
                              const res = await fetch(`/api/users/payment-requests/${req.id}/receipt`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              if (res.ok) {
                                setMyRequests(prev => prev.map(item => item.id === req.id ? { ...item, proofUrl: '' } : item));
                                alert('Receipt deleted and cloud storage freed!');
                                fetchMyRequests();
                                checkAuth();
                              } else {
                                const data = await res.json();
                                alert(data.error || 'Failed to delete receipt.');
                              }
                            } catch (err: any) {
                              alert(err.message || 'Error occurred.');
                            }
                          }}
                          className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                          title="Super Admin: Delete uploaded receipt image"
                        >
                          (Delete Receipt)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  {req.status === 'CONFIRMED' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Credited to Balance
                    </span>
                  ) : req.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Hourglass className="h-3.5 w-3.5 text-amber-600" /> Pending Admin Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                      <XCircle className="h-3.5 w-3.5 text-red-600" /> Rejected
                    </span>
                  )}
                  {confirmDeleteId === req.id ? (
                    <div className="flex items-center gap-1.5 animate-in slide-in-from-right-1 duration-150">
                      <button
                        type="button"
                        disabled={deletingId === req.id}
                        onClick={async () => {
                          setDeletingId(req.id);
                          try {
                            const res = await fetch(`/api/users/payment-requests/${req.id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (res.ok) {
                              setMyRequests(prev => prev.filter(item => item.id !== req.id));
                              setUploadSuccess('Payment verification history record permanently removed!');
                              fetchMyRequests();
                              checkAuth();
                            } else {
                              const data = await res.json();
                              setErrorMessage(data.error || 'Failed to delete request.');
                            }
                          } catch (err: any) {
                            setErrorMessage(err.message || 'Error occurred.');
                          } finally {
                            setConfirmDeleteId(null);
                            setDeletingId(null);
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors whitespace-nowrap uppercase tracking-wider"
                      >
                        {deletingId === req.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(req.id);
                        setTimeout(() => {
                          setConfirmDeleteId(prev => prev === req.id ? null : prev);
                        }, 5000);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer inline-flex items-center"
                      title="Delete payment request history record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
