import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Video,
  Image as ImageIcon,
  Mic,
  FileText,
  Sparkles,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Plus,
  Play,
  Eye,
  ExternalLink,
  Layers,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api.js';

interface DashboardPageProps {
  openAuthModal: (mode?: 'login' | 'register') => void;
  setCurrentTab: (tab: string) => void;
  isRtl?: boolean;
}

// Custom Tooltip for Recharts styled for Dark Mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardPage({ openAuthModal, setCurrentTab, isRtl = true }: DashboardPageProps) {
  const { user, wallet, subscription } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '14d'>('14d');
  const [activeChartTab, setActiveChartTab] = useState<'bar' | 'area'>('bar');
  const [useDemoDataIfEmpty, setUseDemoDataIfEmpty] = useState(false);

  // Demo stats for new accounts or preview
  const demoDailyUsage = [
    { date: '2026-10-03', displayDate: '10/3', dayName: 'السبت', videos: 1, images: 3, speech: 0, total: 4, credits: 45 },
    { date: '2026-10-04', displayDate: '10/4', dayName: 'الأحد', videos: 2, images: 5, speech: 1, total: 8, credits: 80 },
    { date: '2026-10-05', displayDate: '10/5', dayName: 'الاثنين', videos: 0, images: 4, speech: 2, total: 6, credits: 35 },
    { date: '2026-10-06', displayDate: '10/6', dayName: 'الثلاثاء', videos: 3, images: 6, speech: 1, total: 10, credits: 110 },
    { date: '2026-10-07', displayDate: '10/7', dayName: 'الأربعاء', videos: 2, images: 8, speech: 3, total: 13, credits: 95 },
    { date: '2026-10-08', displayDate: '10/8', dayName: 'الخميس', videos: 4, images: 7, speech: 2, total: 13, credits: 140 },
    { date: '2026-10-09', displayDate: '10/9', dayName: 'الجمعة', videos: 1, images: 9, speech: 1, total: 11, credits: 65 },
    { date: '2026-10-10', displayDate: '10/10', dayName: 'السبت', videos: 3, images: 6, speech: 2, total: 11, credits: 115 },
    { date: '2026-10-11', displayDate: '10/11', dayName: 'الأحد', videos: 2, images: 4, speech: 0, total: 6, credits: 70 },
    { date: '2026-10-12', displayDate: '10/12', dayName: 'الاثنين', videos: 5, images: 10, speech: 3, total: 18, credits: 180 },
    { date: '2026-10-13', displayDate: '10/13', dayName: 'الثلاثاء', videos: 3, images: 7, speech: 2, total: 12, credits: 110 },
    { date: '2026-10-14', displayDate: '10/14', dayName: 'الأربعاء', videos: 4, images: 9, speech: 4, total: 17, credits: 155 },
    { date: '2026-10-15', displayDate: '10/15', dayName: 'الخميس', videos: 6, images: 12, speech: 3, total: 21, credits: 210 },
    { date: '2026-10-16', displayDate: '10/16', dayName: 'اليوم', videos: 4, images: 8, speech: 2, total: 14, credits: 135 },
  ];

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUserStats();
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to load user stats:', err);
      setError(err.message || 'فشل تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Determine if using demo data
  const hasRealData = stats && stats.totalGenerations > 0;
  const isDemo = useDemoDataIfEmpty || (!hasRealData && !loading);

  const totalVideos = isDemo ? 40 : (stats?.totalVideos ?? 0);
  const totalImages = isDemo ? 88 : (stats?.totalImages ?? 0);
  const totalSpeech = isDemo ? 24 : (stats?.totalSpeech ?? 0);
  const totalGenerations = isDemo ? 152 : (stats?.totalGenerations ?? 0);
  const totalCreditsSpent = isDemo ? 1545 : (stats?.totalCreditsSpent ?? 0);
  const succeededCount = isDemo ? 148 : (stats?.succeededCount ?? 0);

  // Time range filtering
  const rawDailyData = isDemo ? demoDailyUsage : (stats?.dailyUsage || []);
  const chartDailyData = timeRange === '7d' ? rawDailyData.slice(-7) : rawDailyData;

  // Pie chart data
  const pieData = isDemo ? [
    { name: isRtl ? 'فيديوهات' : 'Videos', value: totalVideos, color: '#06b6d4' },
    { name: isRtl ? 'صور' : 'Images', value: totalImages, color: '#8b5cf6' },
    { name: isRtl ? 'تعليق صوتي' : 'Voiceover', value: totalSpeech, color: '#ec4899' },
  ] : (stats?.toolDistribution || []).map((t: any) => ({
    name: isRtl ? t.name : t.nameEn,
    value: t.value,
    color: t.color
  })).filter((d: any) => d.value > 0);

  // Tool distribution fallback if all 0
  const effectivePieData = pieData.length > 0 ? pieData : [
    { name: isRtl ? 'فيديو' : 'Videos', value: 1, color: '#06b6d4' },
    { name: isRtl ? 'صور' : 'Images', value: 1, color: '#8b5cf6' }
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6 text-cyan-400">
          <LayoutDashboard className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          {isRtl ? 'لوحة تحكم إحصائيات الاستخدام' : 'User Usage Analytics Dashboard'}
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
          {isRtl
            ? 'سجّل الدخول لمتابعة عدد الفيديوهات والصور المنشأة، وتحليل استهلاك الرصيد، والاطلاع على الرسوم البيانية لأدائك.'
            : 'Sign in to track your created videos and images, credit consumption, and visual analytics.'}
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
        >
          {isRtl ? 'تسجيل الدخول لعرض اللوحة' : 'Sign in to view Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {isRtl ? 'لوحة تحكم إحصائيات الاستخدام' : 'Usage & Analytics Dashboard'}
              </h1>
              <p className="text-xs text-slate-400">
                {isRtl 
                  ? `أهلاً بك ${user.displayName} - متابعة حية لعدد الفيديوهات والصور والأدوات المنشأة` 
                  : `Welcome ${user.displayName} - Live monitoring of your created videos, images, and tools`}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Demo toggle if user wants to see populated charts */}
          <button
            onClick={() => setUseDemoDataIfEmpty(!useDemoDataIfEmpty)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isDemo
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="تبديل وضع العرض التوضيحي للرسوم البيانية"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isDemo ? (isRtl ? 'وضع المعاينة (Demo)' : 'Demo Mode') : (isRtl ? 'بياناتي الفعلية' : 'Live Data')}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Quick Create Button */}
          <button
            onClick={() => setCurrentTab('video')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isRtl ? 'إنشاء جديد' : 'New Creation'}</span>
          </button>
        </div>
      </div>

      {/* Demo Notification banner if in demo mode */}
      {isDemo && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {isRtl
                ? 'يتم الآن عرض إحصائيات تجريبية توضيحية للرسوم البيانية. ستتحول الأرقام تلقائياً مع كل فيديو أو صورة تنشئها.'
                : 'Displaying realistic demo analytics to showcase the recharts visualization. Numbers update automatically with each creation.'}
            </span>
          </div>
          <button
            onClick={() => setUseDemoDataIfEmpty(false)}
            className="text-[11px] underline hover:text-white font-medium shrink-0"
          >
            {isRtl ? 'إخفاء المعاينة' : 'Hide Demo'}
          </button>
        </div>
      )}

      {/* 1. TOP STATS CARDS: Videos, Images, Speech, Credits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Videos Created */}
        <div 
          onClick={() => setCurrentTab('video')}
          className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden shadow-lg shadow-cyan-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {isRtl ? 'الفيديوهات المنشأة' : 'Created Videos'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalVideos}</span>
            <span className="text-xs text-slate-400 font-medium">{isRtl ? 'مقطع فيديو' : 'clips'}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? 'فتح استوديو الفيديو' : 'Open Video Studio'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-500">Google Veo 3.1</span>
          </div>
        </div>

        {/* Card 2: Images Created */}
        <div 
          onClick={() => setCurrentTab('image')}
          className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden shadow-lg shadow-purple-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              {isRtl ? 'الصور والتصاميم' : 'Created Images'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalImages}</span>
            <span className="text-xs text-slate-400 font-medium">{isRtl ? 'صورة وبوستر' : 'images'}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? 'فتح استوديو الصور' : 'Open Image Studio'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-500">Imagen 3</span>
          </div>
        </div>

        {/* Card 3: Total Operations & Success Rate */}
        <div 
          onClick={() => setCurrentTab('gallery')}
          className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden shadow-lg shadow-emerald-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isRtl ? 'إجمالي المشاريع المكتملة' : 'Total Generated'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalGenerations}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {totalGenerations > 0 ? `${Math.round((succeededCount / totalGenerations) * 100)}% ${isRtl ? 'نجاح' : 'success'}` : (isRtl ? 'جاهز' : 'ready')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? 'معرض المشاريع' : 'View Gallery'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-500">{totalSpeech} {isRtl ? 'صوتيات' : 'audio'}</span>
          </div>
        </div>

        {/* Card 4: Wallet & Credits Spent */}
        <div 
          onClick={() => setCurrentTab('wallet')}
          className="group relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer overflow-hidden shadow-lg shadow-amber-950/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {isRtl ? 'الرصيد والاستهلاك' : 'Credits Balance'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{wallet?.availableCredits ?? 0}</span>
            <span className="text-xs text-slate-400 font-medium">{isRtl ? 'رصيد متاح' : 'credits left'}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-amber-400">{isRtl ? 'المستهلك:' : 'Spent:'} {totalCreditsSpent}</span>
            <span className="text-[11px] text-slate-500">{subscription?.planName || (isRtl ? 'تجريبي' : 'Trial')}</span>
          </div>
        </div>

      </div>

      {/* 2. MAIN CHARTS SECTION (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (Videos vs Images Creations Over Time) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>{isRtl ? 'مقارنة إنتاج الفيديوهات والصور عبر الوقت' : 'Videos vs Images Creation Over Time'}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isRtl ? 'مخطط بياني يوضح عدد الفيديوهات والصور المنشأة يومياً' : 'Daily count of created videos and images generated by your account'}
              </p>
            </div>

            {/* Chart Controls: Time Range & Type */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                <button
                  onClick={() => setActiveChartTab('bar')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeChartTab === 'bar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'أعمدة' : 'Bar'}
                </button>
                <button
                  onClick={() => setActiveChartTab('area')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeChartTab === 'area' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? 'مساحة' : 'Area'}
                </button>
              </div>

              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeRange === '7d' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? '7 أيام' : '7 Days'}
                </button>
                <button
                  onClick={() => setTimeRange('14d')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeRange === '14d' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? '14 يوماً' : '14 Days'}
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'bar' ? (
                <BarChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => (
                      <span className="text-slate-300 font-medium">
                        {value === 'videos' ? (isRtl ? 'فيديوهات Veo' : 'Videos') : 
                         value === 'images' ? (isRtl ? 'صور Imagen' : 'Images') : 
                         value === 'speech' ? (isRtl ? 'تعليق صوتي' : 'Voiceover') : value}
                      </span>
                    )}
                  />
                  <Bar dataKey="videos" name="videos" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="images" name="images" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              ) : (
                <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => (
                      <span className="text-slate-300 font-medium">
                        {value === 'videos' ? (isRtl ? 'فيديوهات' : 'Videos') : 
                         value === 'images' ? (isRtl ? 'صور' : 'Images') : value}
                      </span>
                    )}
                  />
                  <Area type="monotone" dataKey="videos" name="videos" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorVideos)" />
                  <Area type="monotone" dataKey="images" name="images" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorImages)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart (Tools Distribution Pie Chart) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>{isRtl ? 'توزيع الأدوات المستخدمة' : 'Tool Distribution'}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              {isRtl ? 'نسبة الاستخدام بين الفيديو والصور والأدوات الأخرى' : 'Proportional breakdown between video, image, and voice tools'}
            </p>

            {/* Pie Chart */}
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={effectivePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {effectivePieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown legend items */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>{isRtl ? 'فيديوهات سينمائية' : 'Videos'}</span>
              </span>
              <span className="font-bold text-white">{totalVideos}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{isRtl ? 'صور وبوسترات' : 'Images'}</span>
              </span>
              <span className="font-bold text-white">{totalImages}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>{isRtl ? 'تعليق صوتي' : 'Voiceover'}</span>
              </span>
              <span className="font-bold text-white">{totalSpeech}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CREDITS CONSUMPTION TREND (AREA CHART) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'استهلاك الرصيد اليومي' : 'Daily Credit Consumption'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isRtl ? 'حجم الرصيد المستهلك في عمليات التوليد خلال الأيام السابقة' : 'Credits utilized for generation jobs over time'}
            </p>
          </div>
          <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>{isRtl ? 'إجمالي المستهلك:' : 'Total Burned:'} </span>
            <span className="font-bold text-amber-400">{totalCreditsSpent} {isRtl ? 'رصيد' : 'cr'}</span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="credits" name={isRtl ? 'رصيد مستهلك' : 'Credits'} stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCredits)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. QUICK TOOLS LAUNCHER & RECENT CREATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Launch Studios */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{isRtl ? 'الانتقال السريع للأدوات' : 'Quick Studio Launch'}</span>
          </h3>
          <p className="text-xs text-slate-400 mb-2">
            {isRtl ? 'اختر الأداة للبدء في توليد محتوى جديد فوري' : 'Jump directly into the AI tool you need'}
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => setCurrentTab('video')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-right rtl:text-right ltr:text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {isRtl ? 'استوديو الفيديو (Veo 3.1)' : 'Video Studio'}
                  </div>
                  <div className="text-[11px] text-slate-400">{isRtl ? 'تحويل النصوص والصور إلى مقاطع سينمائية' : 'Generate video clips from text/images'}</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setCurrentTab('image')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between text-right rtl:text-right ltr:text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    {isRtl ? 'استوديو الصور (Imagen 3)' : 'Image Studio'}
                  </div>
                  <div className="text-[11px] text-slate-400">{isRtl ? 'توليد صور واقعية وبوسترات عربية' : 'Create high-res visuals and posters'}</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setCurrentTab('voice')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 flex items-center justify-between text-right rtl:text-right ltr:text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-950/80 border border-pink-800/60 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                    {isRtl ? 'التعليق الصوتي العربي' : 'Voiceover Studio'}
                  </div>
                  <div className="text-[11px] text-slate-400">{isRtl ? 'نطق فصيح ولهجات متعددة' : 'Multi-dialect natural speech'}</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setCurrentTab('pricing')}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/30 border border-cyan-800/40 hover:border-cyan-500/60 flex items-center justify-between text-right rtl:text-right ltr:text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-700/60 flex items-center justify-center text-cyan-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-300">
                    {isRtl ? 'ترقية الباقة وشحن الرصيد' : 'Upgrade Plan'}
                  </div>
                  <div className="text-[11px] text-slate-400">{isRtl ? 'باقات أسبوعية وشهريّة مرنة' : 'Weekly, 5-days, and custom plans'}</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{isRtl ? 'آخر العمليات المنشأة' : 'Recent Creations'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl ? 'قائمة سريعة بآخر المهام التي تم تنفيذها' : 'History of your latest generation jobs'}
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('gallery')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>{isRtl ? 'عرض كل المشاريع' : 'All Projects'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2.5">
              {stats.recentActivity.map((job: any) => (
                <div
                  key={job.jobId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      job.type === 'video' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50' :
                      job.type === 'image' ? 'bg-purple-950/80 text-purple-400 border border-purple-800/50' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {job.type === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate max-w-xs sm:max-w-md">{job.prompt || 'عملية توليد'}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(job.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')} • {job.actualCost || job.estimatedCost || 0} {isRtl ? 'رصيد' : 'credits'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      job.status === 'succeeded' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' :
                      job.status === 'processing' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50 animate-pulse' :
                      'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                    }`}>
                      {job.status === 'succeeded' ? (isRtl ? 'مكتمل' : 'Done') :
                       job.status === 'processing' ? (isRtl ? 'جارٍ المعالجة' : 'Processing') :
                       (isRtl ? 'فشل' : 'Failed')}
                    </span>
                    {job.resultUrl && (
                      <a
                        href={job.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        title="معاينة النتيجة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">
                {isRtl ? 'لم تقم بإنشاء أي تصاميم أو فيديوهات بعد.' : 'No creations yet.'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentTab('video')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  {isRtl ? 'إنشاء أول فيديو' : 'Create First Video'}
                </button>
                <button
                  onClick={() => setCurrentTab('image')}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-500/30 transition-colors"
                >
                  {isRtl ? 'توليد أول صورة' : 'Generate First Image'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
