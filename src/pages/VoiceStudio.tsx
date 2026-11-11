import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Radio, 
  FileText, 
  Clock 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { GenerationJob } from '../types.js';

interface VoiceStudioProps {
  openAuthModal: () => void;
  setCurrentTab: (tab: string) => void;
}

export function VoiceStudio({ openAuthModal, setCurrentTab }: VoiceStudioProps) {
  const { user, wallet, refreshUserData } = useAuth();

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedStyle, setSelectedStyle] = useState('وثائقي هادئ ورصين');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<GenerationJob | null>(null);
  const [recentAudios, setRecentAudios] = useState<GenerationJob[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const creditCost = 4;

  const voices = [
    { id: 'Kore', name: 'كوري (Kore)', desc: 'صوت أنثوي متزن، ممتاز للإعلانات والأخبار والتعليم' },
    { id: 'Puck', name: 'باك (Puck)', desc: 'صوت ذكوري حيوي، رائع للبودكاست ومقاطع الريلز' },
    { id: 'Charon', name: 'شارون (Charon)', desc: 'صوت رخيم عميق، مثالي للوثائقيات والقصص التاريخية' },
    { id: 'Fenrir', name: 'فينرير (Fenrir)', desc: 'نبرة قوية وواثقة للعلامات التجارية الفاخرة' },
    { id: 'Zephyr', name: 'زفير (Zephyr)', desc: 'نبرة دافئة وودودة لخدمة العملاء والشروحات' }
  ];

  const styles = [
    'وثائقي هادئ ورصين',
    'إعلاني حماسي وجذاب',
    'إخباري رسمي دقيق',
    'بودكاست عفوي وتفاعلي',
    'قصصي درامي مشوق'
  ];

  const fetchRecentAudios = async () => {
    if (!user) return;
    try {
      const res = await api.getProjects('speech');
      setRecentAudios(res.projects);
      if (res.projects.length > 0 && !currentResult) {
        setCurrentResult(res.projects[0]);
      }
    } catch (err) {
      console.error('Error fetching recent speech projects:', err);
    }
  };

  useEffect(() => {
    fetchRecentAudios();
  }, [user]);

  const handleGenerate = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (!text.trim()) {
      setError('يرجى إدخال النص المطلوب تحويله إلى صوت');
      return;
    }

    if ((wallet?.availableCredits || 0) < creditCost) {
      setError(`رصيدك المتاح (${wallet?.availableCredits || 0}) غير كافٍ. يلزم ${creditCost} رصيد.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.generateSpeech({
        text: text.trim(),
        voiceName: selectedVoice,
        style: selectedStyle
      });

      setCurrentResult(res.job);
      refreshUserData();
      fetchRecentAudios();

      // Setup audio playback
      if (res.job.resultUrl) {
        const audio = new Audio(res.job.resultUrl);
        audio.onended = () => setIsPlaying(false);
        setAudioElement(audio);
      }
    } catch (err: any) {
      setError(err.message || 'فشلت عملية توليد التعليق الصوتي');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlayAudio = (url?: string) => {
    const targetUrl = url || currentResult?.resultUrl;
    if (!targetUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(targetUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(2, Math.round(wordCount / 2.5));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">استوديو التعليق الصوتي الاحترافي (TTS)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            حول نصوصك إلى نبرات صوتية طبيعية متقنة باللغة العربية الفصحى واللهجات بجودة استوديو 24kHz.
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

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
            
            {/* Script Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300">نص التعليق الصوتي (Script)</label>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{wordCount} كلمة</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>~{estimatedSeconds} ثانية تقديرية</span>
                  </span>
                </div>
              </div>

              <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="أدخل النص هنا بالتشكيل أو بدونه... مثال: مرحباً بكم في مستقبل الذكاء الاصطناعي التجاري، حيث يتحول الخيال إلى واقع ملموس في ثوانٍ معدودة."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Voice Persona Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">اختيار المعلق الصوتي (Voice Persona)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {voices.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition-all ${
                      selectedVoice === v.id
                        ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{v.name}</span>
                      <Radio className={`w-3.5 h-3.5 ${selectedVoice === v.id ? 'text-amber-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الأسلوب والنبرة الإلقائية</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                <span>التكلفة: </span>
                <span className="font-extrabold text-amber-400 text-sm">{creditCost} رصيد</span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ توليد الصوت الطبيعي...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>إنشاء التعليق الصوتي ({creditCost} رصيد)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Audio Player & Waveform Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-3">مشغل الصوت والاستماع</h3>

            {currentResult && currentResult.resultUrl ? (
              <div className="space-y-4">
                {/* Audio Card */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                    <button onClick={() => togglePlayAudio()} className="p-2">
                      {isPlaying ? (
                        <Pause className="w-7 h-7 fill-amber-400" />
                      ) : (
                        <Play className="w-7 h-7 fill-amber-400 translate-x-0.5 rtl:-translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">التسجيل الصوتي جاهز للاستماع</h4>
                    <p className="text-[11px] text-slate-400 mt-1">صوت المعلق: {currentResult.metadata?.voice || 'Kore'}</p>
                  </div>

                  {/* Animated Waveform Visualization */}
                  <div className="flex items-center justify-center gap-1 h-8 px-4">
                    {[12, 24, 18, 30, 16, 28, 32, 20, 14, 26, 30, 18, 22, 16].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full bg-amber-400/80 transition-all ${
                          isPlaying ? 'animate-pulse' : 'opacity-40'
                        }`}
                        style={{ height: `${isPlaying ? h : 8}px` }}
                      ></div>
                    ))}
                  </div>

                  <audio src={currentResult.resultUrl} controls className="w-full mt-2" />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] text-amber-400 font-semibold block mb-1">النص المسجل:</span>
                  <p className="line-clamp-3 text-slate-400">{currentResult.prompt}</p>
                </div>

                <a
                  href={currentResult.resultUrl}
                  download={`creative_ai_voice_${currentResult.jobId}.wav`}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الملف الصوتي (WAV الأصلي)</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-20 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <Mic className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">لا يوجد تسجيل صوتي قيد التشغيل</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  اكتب النص في المحرر وانقر على إنشاء التعليق الصوتي للاستماع والتنزيل.
                </p>
              </div>
            )}

            {/* Recent Audios List */}
            {recentAudios.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 block mb-2">التسجيلات السابقة:</span>
                <div className="space-y-2">
                  {recentAudios.slice(0, 3).map(a => (
                    <div
                      key={a.jobId}
                      onClick={() => setCurrentResult(a)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[200px]">
                        <p className="font-semibold text-slate-200 truncate">{a.prompt}</p>
                        <span className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayAudio(a.resultUrl);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 text-amber-400 hover:bg-slate-800"
                      >
                        <Play className="w-3.5 h-3.5 fill-amber-400" />
                      </button>
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
