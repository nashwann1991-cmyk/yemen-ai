import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Layers, 
  Sliders, 
  AlertCircle, 
  Loader2, 
  Type, 
  Copy, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { GenerationJob } from '../types.js';

interface ImageStudioProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function ImageStudio({ openAuthModal, setCurrentTab }: ImageStudioProps) {
  const { user, wallet, refreshUserData } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1'>('gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  
  // Poster Overlay Mode
  const [isPosterMode, setIsPosterMode] = useState(false);
  const [arabicPosterTitle, setArabicPosterTitle] = useState('');
  const [arabicPosterSubtitle, setArabicPosterSubtitle] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [currentResult, setCurrentResult] = useState<GenerationJob | null>(null);
  const [recentImages, setRecentImages] = useState<GenerationJob[]>([]);

  const creditCost = model === 'gemini-nano-banana-2.1' ? 10 : 5;

  const fetchRecentImages = async () => {
    if (!user) return;
    try {
      const res = await api.getProjects('image');
      setRecentImages(res.projects);
      if (res.projects.length > 0 && !currentResult) {
        setCurrentResult(res.projects[0]);
      }
    } catch (err) {
      console.error('Error fetching recent image projects:', err);
    }
  };

  useEffect(() => {
    fetchRecentImages();
  }, [user]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError('يرجى كتابة فكرة أولية لتحسينها');
      return;
    }
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await api.enhancePrompt({
        rawIdea: prompt,
        contentType: 'image',
        style: 'Ultra-realistic cinematic 8K photorealistic'
      });
      if (res.job?.resultData?.enhancedPrompt) {
        setPrompt(res.job.resultData.enhancedPrompt);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحسين البرومبت');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!prompt.trim()) {
      setError('يرجى إدخال وصف للصورة المراد إنشاؤها');
      return;
    }

    if ((wallet?.availableCredits || 0) < creditCost) {
      setError(`رصيدك المتاح (${wallet?.availableCredits || 0}) غير كافٍ. يلزم ${creditCost} رصيد.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.generateImage({
        prompt: prompt.trim(),
        model,
        aspectRatio,
        arabicPosterText: isPosterMode ? arabicPosterTitle : undefined,
        posterSubtitle: isPosterMode ? arabicPosterSubtitle : undefined
      });

      setCurrentResult(res.job);
      refreshUserData();
      fetchRecentImages();
    } catch (err: any) {
      setError(err.message || 'فشلت عملية توليد الصورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentResult?.prompt) return;
    navigator.clipboard.writeText(currentResult.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">استوديو توليد الصور والبوسترات 4K</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            أنشئ صوراً مذهلة مع تركيب الخطوط العربية الاحترافية عبر محرك SVG المتقدم.
          </p>
        </div>

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

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editor Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            
            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">وصف الصورة المطلوبة (البرومبت)</label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>تحسين تلقائي بالذكاء الاصطناعي</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثال: لقطة بورتريه إعلانية عالية الدقة لزجاجة عطر زجاجية فاخرة موضوعة على رمال ذهبية وقت الغروب مع إضاءة درامية ناعمة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Model & Quality Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">محرك وجودة التوليد</label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setModel('gemini-3.1-flash-lite-image')}
                    className={`w-full text-right rtl:text-right ltr:text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      model === 'gemini-3.1-flash-lite-image'
                        ? 'bg-purple-950/40 border-purple-500/60 text-purple-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p>Gemini Flash Lite (الوضع الاقتصادي)</p>
                      <span className="text-[10px] text-slate-500 font-normal">سرعة فائقة وجودة متوازنة</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono">5 رصيد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModel('gemini-nano-banana-2.1')}
                    className={`w-full text-right rtl:text-right ltr:text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      model === 'gemini-nano-banana-2.1'
                        ? 'bg-purple-950/40 border-purple-500/60 text-purple-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <p>Nano Banana 2.1 (الوضع الاحترافي 4K)</p>
                      <span className="text-[10px] text-slate-500 font-normal">أعلى جودة تفاصيل وواقعية سينمائية</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono">10 رصيد</span>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">نسبة العرض إلى الارتفاع</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  {[
                    { id: '1:1', label: '1:1 مربع' },
                    { id: '16:9', label: '16:9 شاشة' },
                    { id: '9:16', label: '9:16 قصة' },
                    { id: '4:3', label: '4:3 قياسي' },
                    { id: '3:4', label: '3:4 عمودي' }
                  ].map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAspectRatio(a.id as any)}
                      className={`py-1.5 rounded-lg font-semibold text-center transition-all ${
                        aspectRatio === a.id ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Poster Typography Overlay Module (Arabic Vector Design Engine) */}
            <div className="rounded-xl border border-slate-800 p-4 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">وضع البوستر وتركيب النصوص العربية الفاخرة</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPosterMode}
                  onChange={(e) => setIsPosterMode(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {isPosterMode && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يقوم الخادم بإنشاء العمل الفني أولاً، ثم تركيب النص العربي عبر محرك التصميم بدقة وضوح متناهية ودون أخطاء تشويه الحروف.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">العنوان الرئيسي للبوستر</label>
                      <input
                        type="text"
                        value={arabicPosterTitle}
                        onChange={(e) => setArabicPosterTitle(e.target.value)}
                        placeholder="مثال: الإبداع بلا حدود"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">العنوان الفرعي أو الترويج</label>
                      <input
                        type="text"
                        value={arabicPosterSubtitle}
                        onChange={(e) => setArabicPosterSubtitle(e.target.value)}
                        placeholder="مثال: استكشف مستقبل التكنولوجيا اليوم"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                <span>التكلفة: </span>
                <span className="font-extrabold text-purple-400 text-sm">{creditCost} رصيد</span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ توليد الصورة بدقة 4K...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>توليد الصورة الآن ({creditCost} رصيد)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Preview & Output Canvas (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200">النتيجة المولدة والتحميل</h3>
              {currentResult && (
                <button
                  onClick={copyToClipboard}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  title="نسخ البرومبت"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'تم النسخ' : 'نسخ الوصف'}</span>
                </button>
              )}
            </div>

            {/* Display Area */}
            {currentResult && currentResult.resultUrl ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group flex items-center justify-center">
                  <img
                    src={currentResult.resultUrl}
                    alt={currentResult.prompt}
                    className="w-full max-h-[460px] object-contain transition-transform group-hover:scale-[1.01]"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <p className="line-clamp-2 text-slate-400">{currentResult.prompt}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={currentResult.resultUrl}
                    download={`creative_ai_image_${currentResult.jobId}.${currentResult.metadata?.format || 'png'}`}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل العمل الفني بدقة أصلية</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">لا توجد صورة معروضة</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  اكتب وصف المشهد واضغط على زر التوليد لتشاهد النتيجة هنا بدقة عالية.
                </p>
              </div>
            )}

            {/* Recent Images Strip */}
            {recentImages.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 block mb-2">أحدث الصور المنشأة:</span>
                <div className="grid grid-cols-4 gap-2">
                  {recentImages.slice(0, 4).map(img => (
                    <div
                      key={img.jobId}
                      onClick={() => setCurrentResult(img)}
                      className="aspect-square rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 cursor-pointer transition-all bg-slate-950"
                    >
                      {img.resultUrl && (
                        <img src={img.resultUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      )}
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
