import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  Key, 
  Building2, 
  Coins, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { Plan } from '../types.js';

interface PricingPageProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function PricingPage({ openAuthModal, setCurrentTab }: PricingPageProps) {
  const { user, refreshUserData } = useAuth();

  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto'>('bank');
  const [transferRef, setTransferRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [durationCategory, setDurationCategory] = useState<'all' | 'weekly_sprint' | 'monthly_annual'>('all');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.getPlans();
        if (res.plans && res.plans.length > 0) {
          const formatted = res.plans.map(p => {
            const is5Days = p.durationDays === 5 || p.duration === '5days';
            const isWeekly = p.durationDays === 7 || p.duration === 'weekly';
            const isDaily = p.durationDays === 1 || p.duration === 'daily';
            const isAnnualPlan = p.durationDays === 365 || p.duration === 'annual';
            const isMonthlyPlan = !is5Days && !isWeekly && !isDaily && !isAnnualPlan;

            const category = (is5Days || isWeekly || isDaily || (p.durationDays && p.durationDays <= 14)) ? 'weekly_sprint' : 'monthly_annual';
            const durationLabel = 
              is5Days ? '5 أيام عمل' :
              isWeekly ? 'أسبوعية (7 أيام)' :
              isDaily ? 'يومية (24 ساعة)' :
              isAnnualPlan ? 'سنوية (365 يوم)' :
              p.durationDays && p.durationDays !== 30 ? `${p.durationDays} يوم` : 'شهرية (30 يوم)';

            const defaultFeatures = [
              `${(p.creditsGranted || 0).toLocaleString()} رصيد توليد متكامل`,
              `صلاحية استخدام كاملة لمدة ${p.durationDays || (is5Days ? 5 : isWeekly ? 7 : 30)} أيام`,
              `توليد فيديو حتى دقة 1080p بمحرك Veo Lite`,
              'توليد صور متقدمة وعالية الدقة',
              'تعليق صوتي لكافة المقاطع بدقة 24kHz',
              'ترخيص استخدام تجاري معتمد'
            ];

            const basePrice = (p.priceMinor || 0) / 100;

            return {
              ...p,
              durationCategory: category,
              durationLabel,
              monthlyPrice: basePrice,
              annualPrice: Math.round(basePrice * 0.8 * 100) / 100,
              credits: p.creditsGranted || 0,
              desc: p.description || 'باقة مخصصة لتوليد مقاطع الفيديو والصور والتسجيلات الصوتية',
              popular: p.badge?.includes('طلب') || p.badge?.includes('شائع') || p.badge?.includes('مفضل') || p.planId === 'plan_pro',
              features: Array.isArray(p.features) && p.features.length > 0 ? p.features : defaultFeatures
            };
          });
          setPlans(formatted);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleCheckoutOpen = (plan: any) => {
    if (!user) {
      openAuthModal();
      return;
    }
    setSelectedPlan(plan);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!transferRef.trim()) {
      setError('يرجى إدخال رقم العملية أو كود الحوالة البنكية/الرقمية');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.submitManualPayment({
        planId: selectedPlan.planId,
        method: paymentMethod === 'crypto' ? 'manual_crypto' : 'manual_bank',
        transferReference: transferRef.trim(),
        proofAttachmentUrl: proofUrl.trim() || undefined
      });

      setSuccessMsg(res.message);
      refreshUserData();
      setTimeout(() => {
        setSelectedPlan(null);
        setTransferRef('');
        setProofUrl('');
        setSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال طلب الدفع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>باقات اشتراك مرنة ومتنوعة تناسب جميع الاحتياجات والمدد</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          اختر الباقة المناسبة لمشروعك الإبداعي
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          سواء كنت تبدأ خطوتك الأولى كصانع محتوى أو تدير استوديو إعلاني متكامل، تصفح باقات الـ 5 أيام السريعة، الباقات الأسبوعية، والشهرية مع إمكانية الدفع البنكي، العملات الرقمية أو مفاتيح الترخيص.
        </p>

        {/* Duration Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setDurationCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              durationCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            جميع الباقات المتاحة ({plans.filter(p => p.planId !== 'plan_trial').length})
          </button>
          <button
            type="button"
            onClick={() => setDurationCategory('weekly_sprint')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              durationCategory === 'weekly_sprint'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>باقات 5 أيام وأسبوعية سريعة</span>
          </button>
          <button
            type="button"
            onClick={() => setDurationCategory('monthly_annual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              durationCategory === 'monthly_annual'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>باقات شهرية وسنوية</span>
          </button>
        </div>

        {/* Annual / Monthly Toggle for monthly packages */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className={`text-xs font-semibold ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>فاتورة عادية</span>
          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-slate-900 border border-slate-700 rounded-full p-0.5 transition-colors relative"
          >
            <div
              className={`w-5 h-5 rounded-full bg-cyan-400 transition-transform ${
                isAnnual ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${isAnnual ? 'text-white' : 'text-slate-400'}`}>اشتراك سنوي</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              وفر 20%
            </span>
          </div>
        </div>

        {/* Quick Activation Key Banner */}
        <div className="pt-2">
          <button
            onClick={() => setCurrentTab('redeem')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            <Key className="w-3.5 h-3.5" />
            <span>هل تملك بطاقة أو مفتاح تفعيل تم شراؤه مسبقاً؟ انقر هنا لتفعيله فوراً</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loadingPlans ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-400">جارٍ تحميل الباقات المتاحة...</p>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans
            .filter(p => {
              if (p.planId === 'plan_trial' && p.priceMinor === 0) return false;
              if (durationCategory === 'weekly_sprint') return p.durationCategory === 'weekly_sprint';
              if (durationCategory === 'monthly_annual') return p.durationCategory === 'monthly_annual';
              return true;
            })
            .map((p) => {
              const isSprint = p.durationCategory === 'weekly_sprint';
              const price = (!isSprint && isAnnual) ? p.annualPrice : p.monthlyPrice;
              const unitLabel = isSprint 
                ? `/ ${p.durationLabel}` 
                : isAnnual 
                  ? '/ شهرياً (فاتورة سنوية)' 
                  : '/ شهرياً';

              return (
                <div
                  key={p.planId}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                    p.popular
                      ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/80 shadow-2xl shadow-cyan-500/10'
                      : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badge */}
                  {(p.badge || p.popular) && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md whitespace-nowrap">
                      {p.badge || 'الخيار المفضل'}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                        {p.durationLabel}
                      </span>
                      {p.durationDays && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          صلاحية {p.durationDays} يوم
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-white">{p.nameAr}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed min-h-[36px]">{p.desc}</p>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black text-white font-mono">${price}</span>
                        <span className="text-xs text-slate-400">{unitLabel}</span>
                      </div>
                      {!isSprint && isAnnual && (
                        <span className="text-[11px] text-emerald-400 mt-1 block">تتم الفاتورة سنوياً (${price * 12}/سنة)</span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">الرصيد الممنوح:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">{(p.credits || 0).toLocaleString()} رصيد</span>
                    </div>

                    <ul className="space-y-3 text-xs text-slate-300">
                      {p.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800/80">
                    <button
                      onClick={() => handleCheckoutOpen(p)}
                      className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        p.popular
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>الاشتراك في {p.nameAr}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Manual Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">إتمام طلب الاشتراك</h3>
              <p className="text-xs text-slate-400 mt-1">
                الباقة: <strong className="text-cyan-400">{selectedPlan.nameAr}</strong> ({selectedPlan.durationLabel}) · المبلغ المطلوب: <strong className="text-white font-mono">${selectedPlan.durationCategory === 'weekly_sprint' ? selectedPlan.monthlyPrice : (isAnnual ? selectedPlan.annualPrice * 12 : selectedPlan.monthlyPrice)} USD</strong>
              </p>
            </div>

            {/* Payment Method Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'bank' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>حوالة بنكية / IBAN</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'crypto' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>عملات رقمية (USDT TRC20)</span>
              </button>
            </div>

            {/* Details Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-5 space-y-2 text-xs">
              <span className="text-slate-400 font-bold block">بيانات التحويل للمنصة:</span>
              {paymentMethod === 'bank' ? (
                <div className="text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  البنك التجاري الدولي (CIB)<br/>
                  حساب رقم: 9876543210<br/>
                  آيبان IBAN: AE070331234567890123456<br/>
                  المستفيد: CREATIVE AI STUDIO PRO
                </div>
              ) : (
                <div className="text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800 break-all">
                  الشبكة: USDT (TRC-20)<br/>
                  عنوان المحفظة: TXYzCreativeStudioProOfficialWallet99
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم مرجع الحوالة / كود العملية (Transaction Hash / Ref ID) *
                </label>
                <input
                  type="text"
                  required
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="مثال: TXN-99882341 أو 0x7a8b9c..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رابط إثبات التحويل أو الإيصال (اختياري)
                </label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="رابط صورة الإيصال أو تفاصيل إضافية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ تأكيد وإرسال الطلب...</span>
                  </>
                ) : (
                  <span>تأكيد إرسال الحوالة ومراجعة الطلب</span>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
