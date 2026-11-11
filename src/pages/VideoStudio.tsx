import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Sparkles, 
  Play, 
  Download, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  Sliders, 
  Upload, 
  Camera, 
  Clock, 
  X,
  RefreshCw,
  Film
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { GenerationJob } from '../types.js';

interface VideoStudioProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function VideoStudio({ openAuthModal, setCurrentTab }: VideoStudioProps) {
  const { user, wallet, refreshUserData } = useAuth();
  
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [modelTier, setModelTier] = useState<'lite' | 'pro'>('lite');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [style, setStyle] = useState('سينمائي واقعي');
  const [cameraMovement, setCameraMovement] = useState('حركة كاميرا سينمائية سلسة (Smooth Dolly In)');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [recentVideos, setRecentVideos] = useState<GenerationJob[]>([]);
  const [pollingInterval, setPollingInterval] = useState<any>(null);

  // Credit calculation
  const creditCost = modelTier === 'pro' ? 50 : 25;

  const stylesList = [
    'سينمائي واقعي',
    'إعلاني تجاري فاخر',
    'وثائقي تاريخي',
    'رسوم متحركة ثلاثية الأبعاد (3D Animation)',
    'خيال علمي مستقبلي (Sci-Fi Cyberpunk)',
    'أسلوب درامي بطيء (Dramatic Slow Motion)'
  ];

  const cameraList = [
    'حركة كاميرا سينمائية سلسة (Smooth Dolly In)',
    'لقطة درون علوية دائرية (Drone Orbit)',
    'حركة كاميرا سريعة متتابعة (Dynamic Tracking Shot)',
    'زاوية عريضة مع ثبات تام (Static Wide Shot)',
    'لقطة مقربة مع تركيز على التفاصيل (Macro Close-Up)'
  ];

  // Fetch recent video jobs
  const fetchRecentVideos = async () => {
    if (!user) return;
    try {
      const res = await api.getProjects('video');
      setRecentVideos(res.projects);
      
      // Check if there is an in-flight job
      const inFlight = res.projects.find(j => j.status === 'processing' || j.status === 'queued');
      if (inFlight && !activeJob) {
        setActiveJob(inFlight);
      }
    } catch (err) {
      console.error('Error fetching recent video projects:', err);
    }
  };

  useEffect(() => {
    fetchRecentVideos();
  }, [user]);

  // Polling effect for active asynchronous job
  useEffect(() => {
    if (activeJob && (activeJob.status === 'processing' || activeJob.status === 'queued')) {
      const timer = setInterval(async () => {
        try {
          const res = await api.getJobStatus(activeJob.jobId);
          setActiveJob(res.job);
          if (res.job.status === 'succeeded' || res.job.status === 'failed' || res.job.status === 'cancelled') {
            clearInterval(timer);
            refreshUserData();
            fetchRecentVideos();
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 4000);
      setPollingInterval(timer);

      return () => clearInterval(timer);
    }
  }, [activeJob?.jobId, activeJob?.status]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً، الحد الأقصى المسموح هو 15 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!prompt.trim() && !imageBase64) {
      setError('يرجى إدخال وصف للفيديو أو رفع صورة مرجعية للبدء');
      return;
    }

    if ((wallet?.availableCredits || 0) < creditCost) {
      setError(`رصيدك المتاح (${wallet?.availableCredits || 0}) غير كافٍ. يلزم ${creditCost} رصيد لإنشاء هذا المقطع.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const fullPrompt = `${prompt.trim()}. Style: ${style}. Camera: ${cameraMovement}. High cinematic quality.`;
    const selectedModel = modelTier === 'pro' ? 'veo-3.1-generate-preview' : 'veo-3.1-lite-generate-preview';

    try {
      const res = await api.generateVideo({
        prompt: fullPrompt,
        model: selectedModel,
        aspectRatio,
        resolution,
        imageBase64: imageBase64 || undefined
      });

      setActiveJob(res.job);
      refreshUserData();
      fetchRecentVideos();
    } catch (err: any) {
      setError(err.message || 'فشلت عملية إطلاق توليد الفيديو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await api.cancelJob(jobId);
      if (activeJob?.jobId === jobId) {
        setActiveJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
      refreshUserData();
      fetchRecentVideos();
    } catch (err: any) {
      setError(err.message || 'فشل إلغاء المهمة');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">استوديو إنتاج الفيديو بالذكاء الاصطناعي</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            صمم مقاطع شورتس وريلز احترافية بأبعاد 9:16 أو مقاطع أفقية 16:9 مدعومة بمحرك Google Veo السحابي.
          </p>
        </div>

        {/* Balance Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">الرصيد المتاح: </span>
            <span className="font-bold text-cyan-400">{wallet?.availableCredits ?? 0} رصيد</span>
          </div>
          <button
            onClick={() => setCurrentTab('wallet')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            شحن الرصيد
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Generation Mode Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">نوع مدخلات الفيديو</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setMode('text')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    mode === 'text' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  نص إلى فيديو (Text to Video)
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    mode === 'image' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  صورة إلى فيديو (Image to Video)
                </button>
              </div>
            </div>

            {/* Image upload dropzone if Image to Video */}
            {mode === 'image' && (
              <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 text-center transition-colors relative bg-slate-950/50">
                {imageBase64 ? (
                  <div className="relative inline-block">
                    <img 
                      src={`data:image/png;base64,${imageBase64}`} 
                      alt="Uploaded reference" 
                      className="max-h-48 rounded-lg shadow-md border border-slate-700" 
                    />
                    <button
                      onClick={() => setImageBase64(null)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-200">انقر لرفع الصورة المرجعية التي ترغب في تحريكها</p>
                    <p className="text-[11px] text-slate-500 mt-1">PNG, JPG بحد أقصى 15MB</p>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            )}

            {/* Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">وصف المشهد والحركة المطلوبة (البرومبت)</label>
                <button
                  onClick={() => setCurrentTab('prompt')}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>توليد سيناريو ذكي</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: لقطة سينمائية بطيئة لرجل أعمال يمشي بثقة في شوارع مدينة نيويورك الماطرة ليلاً مع انعكاسات أضواء النيون المبهرة على الرصيف..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Quick Configurations: Aspect, Resolution, Model Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Aspect Ratio */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">أبعاد الفيديو</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      aspectRatio === '9:16' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                    }`}
                  >
                    9:16 عمودي (Reels)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      aspectRatio === '16:9' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                    }`}
                  >
                    16:9 أفقي (YouTube)
                  </button>
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">الدقة (Resolution)</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResolution('720p')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      resolution === '720p' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                    }`}
                  >
                    720p HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolution('1080p')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      resolution === '1080p' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                    }`}
                  >
                    1080p Full HD
                  </button>
                </div>
              </div>

              {/* Model Tier */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">محرك التوليد</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModelTier('lite')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      modelTier === 'lite' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
                    }`}
                    title="25 رصيد"
                  >
                    Veo Lite (25)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelTier('pro')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      modelTier === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400'
                    }`}
                    title="50 رصيد"
                  >
                    Veo Pro (50)
                  </button>
                </div>
              </div>

            </div>

            {/* Style & Camera selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الأسلوب الفني والمظهر</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {stylesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">حركة الكاميرا والعدسة</label>
                <select
                  value={cameraMovement}
                  onChange={(e) => setCameraMovement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {cameraList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                <span>التكلفة المقدرة: </span>
                <span className="font-extrabold text-cyan-400 text-sm">{creditCost} رصيد</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isSubmitting || (activeJob?.status === 'processing')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>بدء إنتاج الفيديو ({creditCost} رصيد)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Live Output & Job Monitor Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>شاشة المراقبة ومعاينة الفيديو</span>
              </h3>
              {activeJob && (
                <button
                  onClick={() => handleCancel(activeJob.jobId)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  إلغاء واسترداد الرصيد
                </button>
              )}
            </div>

            {/* Active Job State */}
            {activeJob ? (
              <div className="space-y-4">
                {activeJob.status === 'processing' || activeJob.status === 'queued' ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                    <h4 className="font-bold text-white text-sm">جارٍ معالجة الفيديو في سحابة Google Veo...</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      تتطلب معالجة الفيديو الدقيقة عادةً من دقيقة إلى دقيقتين. لا تقلق، يمكنك الانتقال لأي صفحة أخرى وستجد الفيديو في معرض المشاريع فور جهوزيته.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300">
                      <span>الحالة: {activeJob.status === 'queued' ? 'في قائمة الانتظار' : 'جارٍ التصيير الحركي'}</span>
                    </div>
                  </div>
                ) : activeJob.status === 'succeeded' && activeJob.resultUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-[9/16] max-h-[460px] mx-auto flex items-center justify-center">
                      <video 
                        src={activeJob.resultUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={activeJob.resultUrl}
                        download={`creative_ai_video_${activeJob.jobId}.mp4`}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل الفيديو (MP4)</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    <p className="font-bold">فشلت عملية توليد الفيديو:</p>
                    <p className="mt-1">{activeJob.errorCode || 'تم استرداد الرصيد المحجوز لحسابك بالكامل.'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <Video className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">لا توجد عملية توليد نشطة حالياً</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  قم بضبط الإعدادات والضغط على زر الإنتاج لبدء معالجة مقطع الفيديو الخاص بك.
                </p>
              </div>
            )}

            {/* Recent Completed Videos */}
            {recentVideos.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 block mb-2">أحدث الفيديوهات المنتجة:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentVideos.slice(0, 4).map(v => (
                    <div 
                      key={v.jobId}
                      onClick={() => setActiveJob(v)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[200px]">
                        <p className="font-semibold text-slate-200 truncate">{v.prompt}</p>
                        <span className="text-[10px] text-slate-500">{new Date(v.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        v.status === 'succeeded' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {v.status === 'succeeded' ? 'مكتمل' : v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
