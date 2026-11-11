import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  AlertCircle, 
  Loader2, 
  Clapperboard, 
  Camera, 
  Sun, 
  Volume2 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

interface PromptStudioProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
  setSharedPrompt?: (prompt: string) => void;
  isRtl: boolean;
}

export function PromptStudio({ openAuthModal, setCurrentTab, setSharedPrompt, isRtl }: PromptStudioProps) {
  const { user, wallet, refreshUserData } = useAuth();
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [rawIdea, setRawIdea] = useState('');
  const [contentType, setContentType] = useState<'video' | 'image' | 'voice' | 'social_reel'>('social_reel');
  const [style, setStyle] = useState('سينمائي واقعي إعلاني (Cinematic Commercial)');
  const [targetAudience, setTargetAudience] = useState('صناع المحتوى ورواد الأعمال والشباب');
  const [language, setLanguage] = useState('العربية الفصحى المعاصرة');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerateScript = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!rawIdea.trim()) {
      setError('يرجى كتابة فكرة المحتوى الأساسية');
      return;
    }

    if ((wallet?.availableCredits || 0) < 1) {
      setError('رصيدك غير كافٍ. يلزم 1 رصيد لهذه العملية.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.enhancePrompt({
        rawIdea: rawIdea.trim(),
        contentType,
        style,
        targetAudience,
        language
      });

      setResult(res.job.resultData);
      refreshUserData();
    } catch (err: any) {
      setError(err.message || 'فشلت معالجة وتوليد السيناريو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyText = (textToCopy: string, sectionId: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const transferToStudio = (targetStudio: string, payloadText: string) => {
    if (setSharedPrompt) {
      setSharedPrompt(payloadText);
    }
    setCurrentTab(targetStudio);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">مساعد كتابة السيناريو والبرومبت السينمائي</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            حول أفكارك الأولية إلى نصوص سينمائية احترافية مقسمة إلى مشاهد وزوايا تصوير وتعليق صوتي جاهزة للتوليد.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">التكلفة: </span>
          <span className="font-bold text-emerald-400">1 رصيد رمزي</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">فكرة المحتوى الخام (Raw Idea)</label>
              <textarea
                rows={5}
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="مثال: فيديو قصير ترويجي لتطبيق توصيل قهوة طازجة في الصباح الباكر يركز على السرعة والشعور بالانتعاش..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نوع المحتوى المستهدف</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="social_reel">فيديو شورتس / ريلز عمودي (9:16)</option>
                <option value="video">فيديو إعلاني أفقي (16:9)</option>
                <option value="image">صورة وبوستر فني إعلاني</option>
                <option value="voice">نص تعليق صوتي وإذاعي فقط</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">الأسلوب المفضل</label>
                <input
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">الجمهور المستهدف</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerateScript}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ هندسة السيناريو بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>توليد الخطة والسيناريو السينمائي (1 رصيد)</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Output & Scene Breakdown (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>خطة الإنتاج والسيناريو المحسن</span>
              {result && (
                <span className="text-[10px] text-emerald-400 font-normal">تم التوليد بنجاح عبر Gemini 3.8 Flash</span>
              )}
            </h3>

            {result ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Master Enhanced Prompt */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">البرومبت السينمائي الموصى به:</span>
                    <button
                      onClick={() => copyText(result.enhancedPrompt, 'mainPrompt')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedSection === 'mainPrompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'mainPrompt' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    {result.enhancedPrompt}
                  </p>

                  {/* Transfer shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={() => transferToStudio('video', result.enhancedPrompt)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>إرسال إلى استوديو الفيديو</span>
                    </button>
                    <button
                      onClick={() => transferToStudio('image', result.enhancedPrompt)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>إرسال إلى استوديو الصور</span>
                    </button>
                  </div>
                </div>

                {/* Scene by Scene Breakdown */}
                {result.scenes && result.scenes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">تقسيم المشاهد والتصوير (Scene Breakdown):</span>
                    <div className="space-y-3">
                      {result.scenes.map((scene: any) => (
                        <div key={scene.sceneNumber} className="bg-slate-950 p-4 rounded-xl border border-slate-800/90 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-cyan-400 flex items-center gap-1">
                              <Clapperboard className="w-3.5 h-3.5" />
                              <span>مشهد {scene.sceneNumber} ({scene.durationSeconds || 5} ثوانٍ)</span>
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Camera className="w-3 h-3 text-slate-500" />
                                <span>{scene.cameraAngle}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Sun className="w-3 h-3 text-amber-500" />
                                <span>{scene.lighting}</span>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            <span className="text-slate-500 font-semibold">الوصف البصري: </span>
                            {scene.visualDescription}
                          </p>

                          {scene.dialogueOrVoiceover && (
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-amber-400 font-bold block">التعليق الصوتي المقترح:</span>
                                <span className="text-slate-200">"{scene.dialogueOrVoiceover}"</span>
                              </div>
                              <button
                                onClick={() => transferToStudio('voice', scene.dialogueOrVoiceover)}
                                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                              >
                                <Mic className="w-3 h-3" />
                                <span>تسجيل صوتي</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sound & Music Instructions */}
                {result.soundEffects && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-slate-500 font-bold">المؤثرات الصوتية والموسيقى: </span>
                      <span>{result.soundEffects}</span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-20 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">لم يتم إنشاء أي سيناريو بعد</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  اكتب فكرتك في النموذج وانقر على زر التوليد للحصول على تفكيك سينمائي متكامل لمشروعك.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
