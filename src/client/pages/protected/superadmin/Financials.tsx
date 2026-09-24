import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  TrendingUp, 
  Building, 
  Save, 
  CheckCircle2, 
  Home, 
  ArrowLeft, 
  Copy, 
  Key, 
  ShieldCheck, 
  Phone, 
  FileText,
  AlertCircle,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import CoinPackageEditor from '../../../components/superadmin/CoinPackageEditor';
import StudentCoinDeductionPanel from '../../../components/superadmin/StudentCoinDeductionPanel';
import PendingPaymentsQueue from '../../../components/superadmin/PendingPaymentsQueue';

export default function Financials() {
  const { token } = useAuthStore();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackSecretKey, setPaystackSecretKey] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setBankName(settings.bankName || 'Guaranty Trust Bank (GTB)');
      setAccountName(settings.accountName || 'UNI9JA MEDIA MEDCORE');
      setAccountNumber(settings.accountNumber || '0123456789');
      setPaymentInstructions(
        settings.paymentInstructions || 
        'Transfer the exact package amount and upload your transaction receipt. Include your account email in the narration/reference.'
      );
      setSupportPhone(settings.supportPhone || '+234 800 000 0000');
      setPaystackPublicKey(settings.paystackPublicKey || 'pk_test_sample_key');
      setPaystackSecretKey(settings.paystackSecretKey || 'sk_test_sample_key');
    }
  }, [settings]);

  const handleSaveAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = token || localStorage.getItem('token') || '';
    if (!activeToken) return;

    setIsSaving(true);
    const success = await updateSettings(activeToken, {
      bankName,
      accountName,
      accountNumber,
      paymentInstructions,
      supportPhone,
      paystackPublicKey,
      paystackSecretKey,
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      alert('Failed to save account details. Please try again.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Back to Home */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Back to Home"
          >
            <Home className="h-4 w-4 text-purple-600" />
            <span>Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Financial & Account Settings</h2>
            <p className="text-sm text-zinc-500">
              Manage bank transfer details, payment credentials, and revenue tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => alert("Financial statement report generated.")}
            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors font-medium text-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Export Report
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold">
              Account details saved successfully! Students will now see these updated payment details.
            </p>
          </div>
        </div>
      )}

      {/* Revenue & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Total Revenue (30d)</h3>
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-zinc-900">₦0.00</p>
          <p className="text-xs text-emerald-600 mt-2 font-semibold">+0% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Payment Gateway</h3>
            <div className="p-2 bg-purple-100 rounded-xl">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-zinc-900">Paystack & Bank Wire</p>
          <p className="text-xs text-zinc-500 mt-1">Direct NGN settlement & Manual Proofs</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quiz Price</h3>
            <div className="p-2 bg-amber-100 rounded-xl">
              <Coins className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900">
            {settings?.quizCoinCost ?? 30} <span className="text-sm font-bold text-amber-600">Coins</span>
          </p>
          <p className="text-xs text-zinc-500 mt-1">Deducted per quiz answered (editable below)</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Receiving Bank</h3>
            <div className="p-2 bg-blue-100 rounded-xl">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-zinc-900 truncate">{bankName || 'Not configured'}</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{accountNumber || '—'}</p>
        </div>
      </div>

      {/* Financial Settings: Bank & Account Details Space */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Edit Bank & Account Details</h3>
              <p className="text-xs text-zinc-500">
                Configure the destination bank account where students send manual wire transfers.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
            Financial Settings
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSaveAccountDetails} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Form Inputs */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Guaranty Trust Bank (GTB), Access Bank, Zenith Bank"
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Commercial or digital bank where funds are received.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Account Name / Beneficiary *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. UNI9JA MEDIA MEDCORE ACADEMY"
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all uppercase"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Exact legal or corporate business name on the bank account.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 0123456789"
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-mono tracking-wider font-bold transition-all"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">NUBAN account number displayed to students.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Support Contact for Payment Proofs
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="e.g. +234 800 000 0000 or WhatsApp line"
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Payment Instructions & Reference Note
                  </label>
                  <textarea
                    rows={3}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="e.g. Transfer the exact amount and upload your transaction receipt. Include your account email in the narration."
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              {/* Right Column: Live Student Preview & Payment Gateway Keys */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                      Live Student Screen Preview
                    </label>
                    <span className="text-[11px] text-purple-600 font-semibold">Updates in real-time</span>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Bank Transfer</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded text-[10px] font-bold border border-emerald-700/50">
                        Active Destination
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Bank Name</p>
                        <p className="text-sm font-semibold text-zinc-100">{bankName || 'Your Bank Name'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Account Name</p>
                        <p className="text-sm font-semibold text-zinc-100 uppercase">{accountName || 'Your Account Name'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Account Number</p>
                        <div className="flex items-center justify-between bg-zinc-800/80 px-3 py-2 rounded-xl border border-zinc-700 mt-1">
                          <p className="text-xl font-black font-mono tracking-widest text-amber-400">
                            {accountNumber || '0000000000'}
                          </p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(accountNumber, 'acc')}
                            className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title="Copy Account Number"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {copiedField === 'acc' && (
                          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Copied to clipboard!</p>
                        )}
                      </div>

                      {paymentInstructions && (
                        <div className="pt-2 border-t border-zinc-800/80">
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Notice to Student</p>
                          <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-800">
                            "{paymentInstructions}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gateway Integration */}
                <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                      Online Gateway (Paystack Keys)
                    </h4>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">Paystack Public Key</label>
                    <input
                      type="text"
                      value={paystackPublicKey}
                      onChange={(e) => setPaystackPublicKey(e.target.value)}
                      placeholder="pk_test_..."
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 mb-1">Paystack Secret Key</label>
                    <input
                      type="password"
                      value={paystackSecretKey}
                      onChange={(e) => setPaystackSecretKey(e.target.value)}
                      placeholder="sk_test_..."
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500 flex items-center">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mr-1.5 flex-shrink-0" />
                Changes take effect across the student portal immediately upon saving.
              </p>
              
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isSaving ? (
                  <>Saving Details...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Account Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pending Payments Queue (Super Admin must confirm before coins are added) */}
      <PendingPaymentsQueue />

      {/* Student Coin Deduction & Adjustment Panel */}
      <StudentCoinDeductionPanel />

      {/* Coin Pricing & Duration Management */}
      <CoinPackageEditor />
    </div>
  );
}
