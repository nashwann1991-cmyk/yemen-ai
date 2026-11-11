import React, { useState } from 'react';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Wallet 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

interface RedeemPageProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
  isRtl: boolean;
}

export function RedeemPage({ openAuthModal, setCurrentTab, isRtl }: RedeemPageProps) {
  const { user, wallet, refreshUserData } = useAuth();
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [keyCode, setKeyCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!keyCode.trim()) {
      setError('يرجى إدخال رمز مفتاح التفعيل');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessData(null);

    try {
      const res = await api.redeemActivationKey(keyCode.trim());
      setSuccessData(res);
      setKeyCode('');
      refreshUserData();
    } catch (err: any) {
      setError(err.message || 'فشل تفعيل المفتاح');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-2">
          <Key className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">تفعيل مفتاح الاشتراك والترخيص</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          أدخل كود المفتاح أو بطاقة الهدية لشحن رصيد إضافي فوراً أو ترقية حسابك إلى باقة المحترفين.
        </p>
      </div>

      {/* Main Activation Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successData && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>{successData.message}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-white">
              <span>الرصيد المضاف: <strong className="text-cyan-400">+{successData.creditsGranted} رصيد</strong></span>
              <span>رصيدك الحالي: <strong className="text-emerald-400">{successData.newBalance} رصيد</strong></span>
            </div>
            {successData.plan && (
              <p className="text-xs text-slate-300">
                تم تفعيل باقة: <strong className="text-cyan-400">{successData.plan.nameAr}</strong> بنجاح!
              </p>
            )}
            <div className="pt-2">
              <button
                onClick={() => setCurrentTab('video')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>الانتقال إلى استوديو الفيديو للإنتاج</span>
                <Arrow className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleRedeem} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              رمز مفتاح الترخيص (Activation License Key)
            </label>
            <div className="relative">
              <Key className="absolute right-4 top-3.5 w-5 h-5 text-slate-500 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto" />
              <input
                type="text"
                required
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
                placeholder="CS-XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 rtl:pr-12 ltr:pl-12 text-sm font-mono tracking-widest text-cyan-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500 uppercase transition-all shadow-inner"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block">
              يتكون كود المفتاح عادةً من 5 مقاطع يبدأ بـ CS- (غير حساس لحالة الأحرف).
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ فحص المفتاح والتفعيل الذري...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تفعيل المفتاح وإيداع الرصيد فوراً</span>
              </>
            )}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تأكيد تشفيري محمي من التكرار والعبث</span>
          </div>
          {user && (
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <Wallet className="w-3.5 h-3.5" />
              <span>{wallet?.availableCredits ?? 0} رصيد متوفر</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
