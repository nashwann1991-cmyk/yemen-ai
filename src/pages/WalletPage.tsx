import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { LedgerEntry } from '../types.js';

interface WalletPageProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function WalletPage({ openAuthModal, setCurrentTab }: WalletPageProps) {
  const { user, wallet, refreshUserData } = useAuth();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getLedger();
      setLedger(res.ledger);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [user]);

  const creditPacks = [
    { credits: 150, priceUsd: 15, tag: 'حزمة تجريبية' },
    { credits: 500, priceUsd: 45, tag: 'الأكثر توفيراً', popular: true },
    { credits: 1500, priceUsd: 120, tag: 'حزمة مكثفة' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">المحفظة وسجل الحركات المالية (Ledger)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            نظام محاسبي مالي دقيق غير قابل للتعديل يضمن عدم الخصم المزدوج وحماية الرصيد المحجوز للمهام.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('redeem')}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-cyan-300 transition-colors"
        >
          تفعيل كود ترخيص أو شحن
        </button>
      </div>

      {/* Balance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Available Credits */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/50 shadow-xl">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold">
            <span>الرصيد المتاح للاستهلاك</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
              {wallet?.availableCredits ?? 0}
            </span>
            <span className="text-xs text-slate-400">رصيد</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">جاهز للاستخدام الفوري في الفيديوهات والصور والصوتيات</p>
        </div>

        {/* Reserved Credits */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold">
            <span>الرصيد المحجوز (In-Flight)</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
              {wallet?.reservedCredits ?? 0}
            </span>
            <span className="text-xs text-slate-400">رصيد محجوز</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">محجوز لمهام قيد المعالجة السحابية، يسترد فوراً عند الإلغاء أو الفشل</p>
        </div>

        {/* Security & Idempotency info */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold">
              <span>حماية العمليات</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              جميع الحركات مشفرة ومرتبطة بـ <span className="text-cyan-400 font-mono">Idempotency Keys</span> لمنع التكرار والحفاظ على حقك المالي.
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('pricing')}
            className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
          >
            ترقية الباقة الشهرية
          </button>
        </div>

      </div>

      {/* Quick Add-on Credit Packs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-sm font-bold text-white">باقات شحن الرصيد الإضافية (Credit Packs)</h3>
        <p className="text-xs text-slate-400">
          هل تحتاج إلى رصيد إضافي لإكمال مشروع ضخم دون تغيير باقتك الحالية؟ اختر حزمة الرصيد المناسبة:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {creditPacks.map((pack, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                pack.popular ? 'bg-cyan-950/30 border-cyan-500/60' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{pack.tag}</span>
                <p className="text-lg font-black text-white font-mono mt-0.5">{pack.credits} رصيد</p>
                <span className="text-xs text-slate-400">${pack.priceUsd} USD</span>
              </div>
              <button
                onClick={() => setCurrentTab('pricing')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                شراء الحزمة
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable Financial Ledger Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white">سجل العمليات والحركات المالية (Ledger Audit)</h3>
            <p className="text-xs text-slate-400 mt-0.5">تفاصيل الحركات، الأرصدة قبل وبعد، والمعرف الفريد لكل عملية.</p>
          </div>
          <button
            onClick={fetchLedger}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
            title="تحديث السجل"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {ledger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400">
                  <th className="py-3 px-3">نوع الحركة</th>
                  <th className="py-3 px-3">الوصف</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">الرصيد بعد</th>
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">معرف الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledger.map((entry) => {
                  const isPositive = entry.amount > 0;
                  return (
                    <tr key={entry.transactionId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPositive ? 'bg-emerald-950/80 text-emerald-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {entry.type === 'generation_hold' ? 'حجز توليد' :
                           entry.type === 'generation_refund' ? 'استرداد حجز' :
                           entry.type === 'plan_grant' ? 'منحة باقة' :
                           entry.type === 'activation_redeem' ? 'تفعيل مفتاح' :
                           entry.type === 'credit_purchase' ? 'شراء رصيد' : entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{entry.description}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-slate-400'}>
                          {isPositive ? `+${entry.amount}` : entry.amount} رصيد
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-400">{entry.balanceAfter}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500">
                        {entry.transactionId.slice(0, 10)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            لا توجد حركات مالية مسجلة بعد في دفتر الأستاذ.
          </div>
        )}
      </div>

    </div>
  );
}
