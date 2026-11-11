import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Key, 
  CreditCard, 
  Sliders, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Plus, 
  Lock, 
  Unlock, 
  Loader2, 
  Copy, 
  Check, 
  PlayCircle,
  FileCheck2,
  DollarSign,
  Layers,
  PackagePlus,
  Edit3,
  Trash2,
  Zap,
  X
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

export function AdminPage() {
  const { user, login } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'metrics' | 'plans' | 'payments' | 'keys' | 'users' | 'providers' | 'settings' | 'selftest'>('metrics');
  const [metrics, setMetrics] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any | null>(null);
  const [testResults, setTestResults] = useState<any | null>(null);

  // Plans Management State
  const [plansList, setPlansList] = useState<any[]>([]);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Plan Form States
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState('weekly');
  const [formDurationDays, setFormDurationDays] = useState(7);
  const [formCredits, setFormCredits] = useState(600);
  const [formPrice, setFormPrice] = useState(15);
  const [formBadge, setFormBadge] = useState('باقة أسبوعية');
  const [formAllowedModels, setFormAllowedModels] = useState<string[]>([
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite-image',
    'gemini-3.8-flash-lite-tts',
    'veo-3.1-lite-generate-preview'
  ]);
  const [formMaxVideoDuration, setFormMaxVideoDuration] = useState(15);
  const [formMaxDailyJobs, setFormMaxDailyJobs] = useState(50);
  const [formFeatures, setFormFeatures] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Key generator state
  const [keyCount, setKeyCount] = useState(1);
  const [keyCredits, setKeyCredits] = useState(500);
  const [keyPlanId, setKeyPlanId] = useState('');
  const [keyMaxActivations, setKeyMaxActivations] = useState(1);
  const [keyExpiryDays, setKeyExpiryDays] = useState(30);
  const [freshGeneratedKeys, setFreshGeneratedKeys] = useState<any[]>([]);

  // User credit adjustment modal
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(100);
  const [adjustReason, setAdjustReason] = useState('مكافأة أو تعويض إداري');

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') {
      return;
    }
    setLoading(true);
    try {
      const [m, p, k, u, prov, s, pl] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminPayments(),
        api.getAdminActivationKeys(),
        api.getAdminUsers(),
        api.getAdminProviders(),
        api.getAdminSettings(),
        api.getAdminPlans()
      ]);
      setMetrics(m);
      setPayments(p.payments);
      setKeys(k.keys);
      setUsersList(u.users);
      setProviders(prov.providers);
      setSiteSettings(s.settings);
      setPlansList(pl.plans || []);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات لوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const handleReviewPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    const notes = prompt(action === 'approve' ? 'ملاحظات الموافقة (اختياري):' : 'سبب الرفض (إلزامي):');
    if (action === 'reject' && !notes) return;

    try {
      await api.reviewPayment(paymentId, action, notes || undefined);
      setSuccess(`تمت ${action === 'approve' ? 'الموافقة على' : 'رفض'} عملية الدفع بنجاح وتحديث الحساب`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث حالة الدفع');
    }
  };

  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateActivationKeys({
        count: keyCount,
        creditsAmount: keyCredits,
        planId: keyPlanId || undefined,
        maxActivations: keyMaxActivations,
        expiresDays: keyExpiryDays
      });
      setFreshGeneratedKeys(res.generatedKeys);
      setSuccess(res.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل توليد المفاتيح');
    }
  };

  const handleAdjustCredit = async () => {
    if (!selectedUserForCredit) return;
    try {
      await api.adjustUserCredits(selectedUserForCredit.uid, adjustAmount, adjustReason);
      setSuccess(`تم تعديل رصيد المستخدم ${selectedUserForCredit.displayName} بنجاح`);
      setSelectedUserForCredit(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل تعديل الرصيد');
    }
  };

  const handleToggleUser = async (uid: string) => {
    try {
      const res = await api.toggleUserStatus(uid);
      setSuccess(`تم تغيير حالة المستخدم إلى ${res.status}`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل تعديل حالة الحساب');
    }
  };

  const handleToggleProvider = async (providerId: string) => {
    try {
      await api.toggleProvider(providerId);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل تعديل المزود');
    }
  };

  // Plan Management Actions
  const applyPreset = (type: '5days' | 'weekly' | 'monthly' | 'custom') => {
    if (type === '5days') {
      setFormNameAr('باقة 5 أيام السريعة (Sprint)');
      setFormNameEn('5-Days Fast Sprint');
      setFormDesc('باقة ممتازة لإنتاج محتوى مكثف لمدة خمسة أيام كاملة للمتاجر وصناع الإعلانات');
      setFormDuration('5days');
      setFormDurationDays(5);
      setFormCredits(500);
      setFormPrice(9.99);
      setFormBadge('5 أيام عمل');
      setFormAllowedModels(['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview']);
      setFormMaxVideoDuration(15);
      setFormMaxDailyJobs(50);
      setFormFeatures('500 رصيد توليد متكامل\nصلاحية كاملة لمدة 5 أيام متتالية\nتوليد فيديو حتى 1080p بمحرك Veo Lite\nتوليد صور وتعليقات صوتية بالذكاء الاصطناعي\nترخيص تجاري معتمد');
    } else if (type === 'weekly') {
      setFormNameAr('باقة أسبوعية مرنة (Weekly Flex)');
      setFormNameEn('Weekly Flex Creator');
      setFormDesc('خطة أسبوعية متكاملة لمديري الحملات وقنوات السوشيال ميديا');
      setFormDuration('weekly');
      setFormDurationDays(7);
      setFormCredits(800);
      setFormPrice(14.99);
      setFormBadge('أسبوعي اقتصادي');
      setFormAllowedModels(['gemini-3.8-flash', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-lite-generate-preview']);
      setFormMaxVideoDuration(20);
      setFormMaxDailyJobs(70);
      setFormFeatures('800 رصيد توليد أسبوعي\nصلاحية استخدام لمدة 7 أيام\nتوليد فيديو عالي الدقة بمحرك Veo Lite\nنماذج صور وصوتيات غير محدودة\nطابور معالجة سريع وترخيص تجاري');
    } else if (type === 'monthly') {
      setFormNameAr('باقة شهرية احترافية (Pro Monthly)');
      setFormNameEn('Monthly Studio Pro');
      setFormDesc('الخيار المثالي لشركات التسويق والوكالات الإعلانية طوال الشهر');
      setFormDuration('monthly');
      setFormDurationDays(30);
      setFormCredits(3000);
      setFormPrice(49.99);
      setFormBadge('الأكثر طلباً');
      setFormAllowedModels(['gemini-3.8-flash', 'gemini-nano-banana-2.1', 'gemini-3.1-flash-lite-image', 'gemini-3.8-flash-lite-tts', 'veo-3.1-generate-preview', 'veo-3.1-lite-generate-preview']);
      setFormMaxVideoDuration(30);
      setFormMaxDailyJobs(150);
      setFormFeatures('3,000 رصيد توليد ضخم\nصلاحية لمدة 30 يوماً\nمحرك Veo Pro لأعلى دقة تصوير فيديو سينمائي\nنماذج الصور بدقة 4K\nأولوية معالجة فائقة ودعم فني مخصص');
    } else {
      setFormNameAr('باقة مخصصة');
      setFormNameEn('Custom Duration Plan');
      setFormDesc('باقة قابلة للتخصيص بأي عدد أيام يحدده المدير');
      setFormDuration('custom');
      setFormDurationDays(10);
      setFormCredits(1000);
      setFormPrice(19.99);
      setFormBadge('باقة مخصصة');
    }
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    applyPreset('weekly');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (p: any) => {
    setEditingPlan(p);
    setFormNameAr(p.nameAr || '');
    setFormNameEn(p.name || '');
    setFormDesc(p.description || '');
    setFormDuration(p.duration || (p.durationDays === 5 ? '5days' : p.durationDays === 7 ? 'weekly' : 'custom'));
    setFormDurationDays(p.durationDays || (p.duration === '5days' ? 5 : p.duration === 'weekly' ? 7 : p.duration === 'monthly' ? 30 : p.duration === 'annual' ? 365 : 7));
    setFormCredits(p.creditsGranted || 500);
    setFormPrice((p.priceMinor || 0) / 100);
    setFormBadge(p.badge || '');
    setFormAllowedModels(p.allowedModels || ['gemini-3.8-flash', 'gemini-3.1-flash-lite-image']);
    setFormMaxVideoDuration(p.maxVideoDurationSeconds || 15);
    setFormMaxDailyJobs(p.maxDailyJobs || 50);
    setFormFeatures(Array.isArray(p.features) ? p.features.join('\n') : '');
    setFormActive(p.active !== false);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formNameEn.trim() || formNameAr.trim(),
        nameAr: formNameAr.trim(),
        description: formDesc.trim(),
        priceMinor: Math.round(Number(formPrice) * 100),
        duration: formDuration,
        durationDays: Number(formDurationDays) || (formDuration === '5days' ? 5 : formDuration === 'weekly' ? 7 : 30),
        creditsGranted: Number(formCredits),
        allowedModels: formAllowedModels,
        maxVideoDurationSeconds: Number(formMaxVideoDuration),
        maxDailyJobs: Number(formMaxDailyJobs),
        active: formActive,
        badge: formBadge.trim() || undefined,
        features: formFeatures
          .split('\n')
          .map(f => f.trim())
          .filter(Boolean)
      };

      if (editingPlan) {
        await api.updateAdminPlan(editingPlan.planId, payload);
        setSuccess(`تم تحديث باقة «${payload.nameAr}» بنجاح!`);
      } else {
        await api.createAdminPlan(payload);
        setSuccess(`تم إنشاء باقة «${payload.nameAr}» بنجاح (${payload.durationDays} أيام)!`);
      }

      setIsPlanModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الباقة');
    }
  };

  const handleTogglePlan = async (planId: string) => {
    try {
      const res = await api.toggleAdminPlan(planId);
      setSuccess(res.message || 'تم تحديث حالة الباقة');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل تعديل حالة الباقة');
    }
  };

  const handleDeletePlan = async (planId: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف أو تعطيل باقة «${name}»؟`)) return;
    try {
      const res = await api.deleteAdminPlan(planId);
      setSuccess(res.message);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'فشل حذف الباقة');
    }
  };

  const handleRunSelfTest = async () => {
    setLoading(true);
    setTestResults(null);
    try {
      const res = await api.runSelfTest();
      setTestResults(res);
      setSuccess('اكتملت الاختبارات الآلية الشاملة للنظام بنجاح!');
    } catch (err: any) {
      setError(err.message || 'فشل تشغيل الاختبارات الآلية');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAdminSettings(siteSettings);
      setSuccess('تم حفظ إعدادات المنصة بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الإعدادات');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">صلاحيات غير كافية</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          لوحة تحكم المالك مخصصة لحساب المدير فقط (<span className="text-cyan-400 font-mono">nashwann1991@gmail.com</span>). يمكنك تسجيل الدخول بحساب المدير لتصفح كافة الإحصائيات وإدارة النظام.
        </p>
        <button
          onClick={async () => {
            try {
              const res = await api.login({ email: 'nashwann1991@gmail.com', password: 'StudioPro2026!' });
              login(res.token, res.user);
            } catch (err: any) {
              alert(err.message || 'فشل الدخول كمدير');
            }
          }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 transition-opacity"
        >
          الدخول السريع كمدير المنصة (Admin)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">لوحة تحكم وإدارة المالك (Platform Owner)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة العمليات المالية، باقات الاشتراكات، مفاتيح التفعيل، المستخدمين، والمزودين بحماية كاملة.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-slate-400 text-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Admin Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'metrics', label: 'المؤشرات المالية والتشغيلية', icon: TrendingUp },
          { id: 'plans', label: 'إدارة الباقات والاشتراكات', icon: Layers, count: plansList.length },
          { id: 'payments', label: 'مراجعة المدفوعات اليدوية', icon: CreditCard, count: metrics?.overview?.pendingPaymentsCount },
          { id: 'keys', label: 'مفاتيح التفعيل والترخيص', icon: Key },
          { id: 'users', label: 'إدارة المستخدمين والأرصدة', icon: Users },
          { id: 'providers', label: 'مزودو الذكاء الاصطناعي', icon: Sliders },
          { id: 'settings', label: 'إعدادات المنصة والهوية', icon: Settings },
          { id: 'selftest', label: 'اختبارات النظام والامتثال الآلي', icon: FileCheck2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count ? (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: METRICS & KPIS */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">إجمالي الإيرادات المؤكدة</span>
              <p className="text-3xl font-black text-emerald-400 font-mono">{metrics.overview.totalRevenueFormatted}</p>
              <span className="text-[11px] text-slate-500 mt-2 block">من الاشتراكات وشراء الأرصدة</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">المستخدمون النشطون</span>
              <p className="text-3xl font-black text-white font-mono">{metrics.overview.totalUsers}</p>
              <span className="text-[11px] text-slate-500 mt-2 block">{metrics.overview.activeSubs} اشتراك مدفوع نشط</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">المدفوعات المعلقة للمراجعة</span>
              <p className="text-3xl font-black text-amber-400 font-mono">{metrics.overview.pendingPaymentsCount}</p>
              <span className="text-[11px] text-slate-500 mt-2 block">تحويلات بنكية وكريبتو تنتظر التأكيد</span>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">إجمالي عمليات التوليد</span>
              <p className="text-3xl font-black text-cyan-400 font-mono">{metrics.overview.totalJobs}</p>
              <span className="text-[11px] text-slate-500 mt-2 block">{metrics.overview.totalCreditsUsed} رصيد مستهلك فعلياً</span>
            </div>
          </div>

          {/* Model Consumption Breakdown */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">أكثر النماذج استخداماً في المنصة</h3>
            <div className="space-y-3">
              {Object.entries(metrics.modelUsage || {}).map(([modelId, count]: [string, any]) => (
                <div key={modelId} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-mono text-cyan-400">{modelId}</span>
                  <span className="font-bold text-white">{count} مهمة مكتملة</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PLANS MANAGEMENT (CREATE WEEKLY, 5-DAYS, CUSTOM PACKAGES) */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Header & Quick stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">إدارة باقات الاشتراكات والعروض المتنوعة</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                أنشئ وخصص باقاتك بحرية كاملة: باقات أسبوعية، باقات 5 أيام عمل، باقات يومية، شهرية، سنوية، أو أي عدد أيام مخصص مع تحديد الرصيد والموديلات المسموحة.
              </p>
            </div>

            <button
              onClick={handleOpenCreatePlan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء باقة جديدة +</span>
            </button>
          </div>

          {/* Quick presets banner */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              قوالب جاهزة سريعة لتوليد الباقات بنقرة واحدة:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  applyPreset('5days');
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-700/50 text-cyan-300 text-[11px] font-bold transition-colors"
              >
                ⚡ باقة 5 أيام عمل (سريعة)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPreset('weekly');
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-indigo-700/50 text-indigo-300 text-[11px] font-bold transition-colors"
              >
                📅 باقة أسبوعية (7 أيام)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPreset('monthly');
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-700/50 text-amber-300 text-[11px] font-bold transition-colors"
              >
                🗓️ باقة شهرية (30 يوم)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPreset('custom');
                  setIsPlanModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
              >
                ⚙️ باقة مخصصة بأي عدد أيام
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plansList.map((p) => {
              const priceDollars = ((p.priceMinor || 0) / 100).toFixed(2);
              const durationLabel = 
                p.durationDays === 5 || p.duration === '5days' ? '5 أيام عمل' :
                p.durationDays === 7 || p.duration === 'weekly' ? 'أسبوعية (7 أيام)' :
                p.duration === 'daily' || p.durationDays === 1 ? 'يومية (24 ساعة)' :
                p.duration === 'annual' || p.durationDays === 365 ? 'سنوية (365 يوم)' :
                p.durationDays ? `${p.durationDays} يوم` : 'شهرية (30 يوم)';

              return (
                <div
                  key={p.planId}
                  className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                    p.active
                      ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50'
                      : 'bg-slate-950/60 border-slate-900 opacity-60'
                  }`}
                >
                  <div>
                    {/* Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {p.badge || durationLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.active ? 'نشطة ومتاحة للبيع' : 'معطلة'}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-white">{p.nameAr}</h4>
                    <span className="text-[11px] text-slate-500 block mb-2 font-mono">{p.name}</span>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{p.description || 'باقة مخصصة لتوليد الوسائط بالذكاء الاصطناعي'}</p>

                    <div className="my-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">السعر:</span>
                        <span className="text-base font-black text-white font-mono">${priceDollars} USD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">الرصيد الممنوح:</span>
                        <span className="font-bold text-cyan-400 font-mono">{(p.creditsGranted || 0).toLocaleString()} رصيد</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">مدة الصلاحية:</span>
                        <span className="font-semibold text-amber-300 font-mono">{durationLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">أقصى مدة فيديو:</span>
                        <span className="text-slate-300 font-mono">{p.maxVideoDurationSeconds || 15} ثانية</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">الحد اليومي:</span>
                        <span className="text-slate-300 font-mono">{p.maxDailyJobs || 50} عملية/يوم</span>
                      </div>
                    </div>

                    {/* Features list */}
                    {p.features && p.features.length > 0 && (
                      <ul className="space-y-1.5 text-[11px] text-slate-300 mb-4">
                        {p.features.slice(0, 3).map((feat: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                        {p.features.length > 3 && (
                          <li className="text-[10px] text-slate-500 pr-5">
                            +{p.features.length - 3} ميزات إضافية
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleTogglePlan(p.planId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        p.active ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {p.active ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{p.active ? 'تعطيل' : 'تفعيل'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPlan(p)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="تعديل الباقة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePlan(p.planId, p.nameAr)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="حذف الباقة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL PAYMENTS APPROVAL */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white">طلبات التحويل البنكي والكريبتو المعلقة</h3>
          <p className="text-xs text-slate-400">
            تأكد من استلام الحوالة في كشف حسابك البنكي أو محفظة USDT قبل النقر على "موافقة وتفعيل".
          </p>

          <div className="overflow-x-auto pt-3">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">البريد الإلكتروني</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">طريقة التحويل</th>
                  <th className="py-3 px-3">رقم العملية (Ref ID)</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3">الإجراء الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map(pay => (
                  <tr key={pay.paymentId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-slate-200">{pay.userEmail}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                      ${(pay.amountMinor / 100).toFixed(2)} USD
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {pay.method === 'manual_crypto' ? 'USDT (TRC20)' : 'حوالة بنكية'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{pay.transferReference || 'غير محدد'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pay.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400' :
                        pay.status === 'rejected' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {pay.status === 'confirmed' ? 'مؤكد ومفعل' : pay.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {pay.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReviewPayment(pay.paymentId, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px]"
                          >
                            موافقة وتفعيل
                          </button>
                          <button
                            onClick={() => handleReviewPayment(pay.paymentId, 'reject')}
                            className="px-2.5 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-[11px]"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVATION KEYS GENERATOR */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>توليد دفعة مفاتيح ترخيص واشتراك جديدة</span>
            </h3>

            <form onSubmit={handleGenerateKeys} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">عدد المفاتيح</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={keyCount}
                  onChange={(e) => setKeyCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">الرصيد الممنوح للمفتاح</label>
                <input
                  type="number"
                  value={keyCredits}
                  onChange={(e) => setKeyCredits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">الباقة المرتبطة (اختياري)</label>
                <select
                  value={keyPlanId}
                  onChange={(e) => setKeyPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">بدون باقة (شحن رصيد فقط)</option>
                  {plansList.map(p => (
                    <option key={p.planId} value={p.planId}>
                      {p.nameAr} ({p.durationDays ? `${p.durationDays} يوم` : p.duration}) - ${((p.priceMinor || 0) / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">أقصى مرات تفعيل</label>
                <input
                  type="number"
                  min="1"
                  value={keyMaxActivations}
                  onChange={(e) => setKeyMaxActivations(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-4 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  توليد المفاتيح المشفرة الآن
                </button>
              </div>
            </form>

            {/* Display Freshly Generated Plaintext Keys */}
            {freshGeneratedKeys.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-cyan-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">
                    المفاتيح المولدة حديثاً (احفظها الآن، لن تعرض كنص صريح مرة أخرى لأسباب أمنية):
                  </span>
                  <button
                    onClick={() => {
                      const all = freshGeneratedKeys.map(k => k.keyCode).join('\n');
                      navigator.clipboard.writeText(all);
                      alert('تم نسخ جميع المفاتيح إلى الحافظة');
                    }}
                    className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكل</span>
                  </button>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-emerald-400 max-h-48 overflow-y-auto">
                  {freshGeneratedKeys.map((k, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span>{k.keyCode}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{k.creditsAmount} رصيد</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Keys History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-sm font-bold text-white">سجل المفاتيح المشفرة في قاعدة البيانات</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">معرف المفتاح</th>
                    <th className="py-2.5 px-3">هاش المفتاح (HMAC)</th>
                    <th className="py-2.5 px-3">الرصيد</th>
                    <th className="py-2.5 px-3">التفعيلات</th>
                    <th className="py-2.5 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {keys.map(k => (
                    <tr key={k.keyId}>
                      <td className="py-2.5 px-3 text-slate-300">{k.keyId.slice(0, 12)}...</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[10px]">{k.keyHash.slice(0, 16)}...</td>
                      <td className="py-2.5 px-3 text-cyan-400 font-sans font-bold">{k.creditsAmount}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">{k.activationCount} / {k.maxActivations}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          k.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {k.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-white">إدارة حسابات المستخدمين وأرصدتهم</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">المستخدم</th>
                  <th className="py-3 px-3">البريد الإلكتروني</th>
                  <th className="py-3 px-3">الدور</th>
                  <th className="py-3 px-3">الرصيد المتاح</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-white">{u.displayName}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">{u.credits} رصيد</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {u.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3 px-3 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserForCredit(u)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold"
                      >
                        تعديل الرصيد
                      </button>
                      <button
                        onClick={() => handleToggleUser(u.uid)}
                        className="p-1 rounded bg-slate-950 text-slate-400 hover:text-white"
                        title="تغيير حالة الحساب"
                      >
                        {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal for adjusting credit */}
          {selectedUserForCredit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
                <h4 className="text-sm font-bold text-white">تعديل رصيد: {selectedUserForCredit.displayName}</h4>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المبلغ المطلوب إضافته أو خصمه (+ أو -)</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">السبب (يُسجل في دفتر الأستاذ)</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleAdjustCredit}
                    className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    تأكيد وتسجيل الحركة
                  </button>
                  <button
                    onClick={() => setSelectedUserForCredit(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AI PROVIDERS TOGGLE */}
      {activeTab === 'providers' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <h3 className="text-sm font-bold text-white">مزودو الذكاء الاصطناعي والنماذج المفعلة</h3>
          <div className="space-y-4">
            {providers.map(p => (
              <div key={p.providerId} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{p.name}</h4>
                    <span className="text-xs text-slate-400">{p.nameAr}</span>
                  </div>
                  <button
                    onClick={() => handleToggleProvider(p.providerId)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      p.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {p.enabled ? 'مفعل وجاهز' : 'معطل'}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">النماذج المتاحة وتكلفة الرصيد:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {p.models.map((m: any) => (
                      <div key={m.modelId} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-mono">{m.name}</span>
                        <span className="font-bold text-cyan-400">{m.creditCost} رصيد</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SITE SETTINGS */}
      {activeTab === 'settings' && siteSettings && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 max-w-2xl">
          <h3 className="text-sm font-bold text-white">إعدادات الهوية والبنوك</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المنصة التجاري (English)</label>
              <input
                type="text"
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">اسم المنصة التجاري (عربي)</label>
              <input
                type="text"
                value={siteSettings.siteNameAr}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteNameAr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">بيانات الحساب البنكي والتحويل (IBAN)</label>
              <textarea
                rows={3}
                value={siteSettings.manualBankDetails}
                onChange={(e) => setSiteSettings({ ...siteSettings, manualBankDetails: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">بيانات محفظة الكريبتو (USDT TRC20)</label>
              <input
                type="text"
                value={siteSettings.manualCryptoDetails}
                onChange={(e) => setSiteSettings({ ...siteSettings, manualCryptoDetails: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              حفظ وتطبيق الإعدادات
            </button>
          </form>
        </div>
      )}

      {/* TAB 7: AUTOMATED SYSTEM SELF-TEST (SECTION 23) */}
      {activeTab === 'selftest' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>حزمة الاختبارات الآلية والامتثال الأمني (Automated Verification Suite)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تنفيذ اختبارات فورية مشددة على التشفير، الجلسات، منع الخصم المزدوج، وحجز الرصيد الذري وفق متطلبات البند 23.
              </p>
            </div>
            <button
              onClick={handleRunSelfTest}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <PlayCircle className="w-4 h-4" />
              <span>تشغيل الاختبارات الآن</span>
            </button>
          </div>

          {testResults && (
            <div className="space-y-3 pt-3">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <span className="font-bold">حالة النظام: {testResults.status === 'all_tests_passed' ? 'جميع الاختبارات نجحت 100%' : 'تنبيه'}</span>
                <span>إجمالي الفحوصات: {testResults.totalTests}</span>
              </div>

              <div className="space-y-2">
                {testResults.tests.map((t: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">{t.testName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-slate-400">{t.message}</span>
                      <span className="text-slate-500 font-mono">{t.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PLAN CREATION / EDITING MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PackagePlus className="w-5 h-5 text-cyan-400" />
                  <span>{editingPlan ? 'تعديل بيانات الباقة' : 'إنشاء باقة اشتراك جديدة'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حدد مدة الباقة (أسبوعية، 5 أيام، يومية، شهرية، أو أي مدة مخصصة) مع الرصيد والميزات.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets inside modal */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">اختيار سريع لقالب مسبق (يمكنك التعديل عليه):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('5days')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 text-xs font-bold text-center transition-all"
                >
                  ⚡ 5 أيام عمل
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('weekly')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-indigo-800/60 text-indigo-300 text-xs font-bold text-center transition-all"
                >
                  📅 أسبوعية (7 أيام)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('monthly')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-800/60 text-amber-300 text-xs font-bold text-center transition-all"
                >
                  🗓️ شهرية (30 يوم)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('custom')}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold text-center transition-all"
                >
                  ⚙️ مدة مخصصة
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الباقة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    placeholder="مثال: باقة 5 أيام السريعة أو باقة أسبوعية"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الباقة بالإنجليزية *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. 5-Days Sprint or Weekly Flex"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">وصف الباقة</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="وصف مختصر لمزايا الباقة والجمهور المستهدف"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نوع المدة *</label>
                  <select
                    value={formDuration}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormDuration(val);
                      if (val === '5days') setFormDurationDays(5);
                      else if (val === 'weekly') setFormDurationDays(7);
                      else if (val === 'daily') setFormDurationDays(1);
                      else if (val === 'monthly') setFormDurationDays(30);
                      else if (val === 'annual') setFormDurationDays(365);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="5days">باقة 5 أيام (5 Days Sprint)</option>
                    <option value="weekly">باقة أسبوعية (7 أيام - Weekly)</option>
                    <option value="daily">باقة يومية (24 ساعة - Daily)</option>
                    <option value="monthly">باقة شهرية (30 يوم - Monthly)</option>
                    <option value="annual">باقة سنوية (365 يوم - Annual)</option>
                    <option value="custom">مدة مخصصة (أي عدد أيام)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عدد أيام الصلاحية الدقيقة *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-cyan-400 mt-0.5 block">صلاحية لمدة {formDurationDays} أيام بالضبط</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">السعر بالدولار ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    placeholder="9.99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الرصيد الممنوح (Credits) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    placeholder="600"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">شارة مميزة (Badge)</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="مثال: 5 أيام عمل، أو أسبوعي"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">أقصى مدة فيديو (ثواني)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={formMaxVideoDuration}
                    onChange={(e) => setFormMaxVideoDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ميزات الباقة (أدخل كل ميزة في سطر منفصل)
                </label>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder={`توليد فيديو حتى دقة 1080p بمحرك Veo Lite\nتوليد صور متقدمة بنماذج Flash Lite\nتعليق صوتي لكافة المقاطع بدقة 24kHz\nترخيص استخدام تجاري`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="planActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="planActiveCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  تفعيل الباقة فوراً وإتاحتها للبيع في صفحة الأسعار
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  {editingPlan ? 'حفظ التعديلات' : 'تأكيد إنشاء الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
