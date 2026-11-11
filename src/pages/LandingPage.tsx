import React from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Zap, 
  Check, 
  TrendingUp, 
  Play, 
  Download, 
  Layers,
  Star,
  Film
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  isRtl: boolean;
}

export function LandingPage({ setCurrentTab, openAuthModal, isRtl }: LandingPageProps) {
  const { user } = useAuth();
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const features = [
    {
      id: 'video',
      titleAr: 'استوديو الفيديو السينمائي',
      titleEn: 'Cinematic Video Studio',
      descAr: 'تحويل النص والصور إلى مقاطع فيديو مذهلة بأبعاد 9:16 للريلز والشورتس أو 16:9 بجودة فائقة بدعم محرك Google Veo.',
      icon: Video,
      badge: 'Google Veo 3.1',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'image',
      titleAr: 'استوديو الصور والبوسترات',
      titleEn: '4K Ultra Image Studio',
      descAr: 'توليد صور فائقة الواقعية بدقة تصل إلى 4K مع إمكانية تصميم بوسترات إعلانية وتركيب نصوص عربية أنيقة عبر محرك التصميم.',
      icon: ImageIcon,
      badge: 'Nano Banana 4K',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'voice',
      titleAr: 'استوديو التعليق الصوتي',
      titleEn: 'Voiceover Studio (TTS)',
      descAr: 'تحويل النصوص المكتوبة إلى تعليق صوتي واقعي باللغة العربية الفصحى واللهجات، مع نبرات إعلانية، وثائقية وبودكاست.',
      icon: Mic,
      badge: 'Gemini TTS 3.8',
      color: 'from-amber-500 to-rose-600'
    },
    {
      id: 'prompt',
      titleAr: 'مساعد السيناريو والبرومبت',
      titleEn: 'Script & Prompt Engine',
      descAr: 'تحويل أفكارك البسيطة إلى سيناريوهات سينمائية مقسمة إلى مشاهد مع أوصاف زوايا الكاميرا، الإضاءة والمؤثرات الصوتية.',
      icon: FileText,
      badge: 'Gemini 3.8 Flash',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="space-y-24 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center max-w-5xl mx-auto px-4 pt-10 sm:pt-16">
        
        {/* Glow ambient background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-indigo-600/20 to-purple-600/20 blur-3xl rounded-full -z-10 pointer-events-none"></div>

        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>منصة الإنتاج الرقمي بالذكاء الاصطناعي الأكثر تطوراً في العالم العربي</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight">
          أنتج فيديوهات، صوراً وتعليقات صوتية
          <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            بجودة سينمائية تجارية متكاملة
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          منصة SaaS تجارية متكاملة تمكن صناع المحتوى والمسوقين والشركات من إطلاق حملاتهم الإعلانية ومحتوى الشورتس والريلز بدقة متناهية، مع نظام محفظة واشتراكات ومفاتيح تفعيل مرنة.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {user ? (
            <button
              onClick={() => setCurrentTab('video')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>دخول استوديو الإنتاج</span>
              <Arrow className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>ابدأ الآن مع 100 رصيد مجاني</span>
                <Arrow className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentTab('pricing')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-colors"
              >
                استعراض باقات الأسعار
              </button>
            </>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>حقوق استخدام تجاري كاملة 100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>معالجة سريعة عبر Google GenAI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>دعم أبعاد 9:16 للريلز و 16:9 لليوتيوب</span>
          </div>
        </div>

      </section>

      {/* Feature Showcase Studios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">محركات الذكاء الاصطناعي الأربعة</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">استوديوهات إنتاج متكاملة في شاشة واحدة</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            لا حاجة للتنقل بين عدة مواقع؛ جهز نصوصك، أنشئ صورك، ادمج صوتك وأنتج فيديوهاتك في منصة موحدة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="group relative bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {isRtl ? item.titleAr : item.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {item.descAr}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>فتح الاستوديو</span>
                  <Arrow className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Demonstration Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 p-8 sm:p-12 relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">إنتاج الفيديوهات القصيرة (Shorts & Reels)</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-snug">
                صمم محتواك بذكاء يناسب منصات التواصل الاجتماعي الأكثر انتشاراً
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                سواء كنت تدير متجراً إلكترونياً، أو قناة يوتيوب، أو حسابات تيك توك وإنستغرام؛ المنصة تمنحك أدوات التوليد العمودي 9:16 مع تحكم شامل بحركة الكاميرا والإضاءة وأسلوب المشهد.
              </p>

              <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>دعم كامل للغة العربية في نصوص التعليق والبوسترات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>توليد غير متزامن بدون تعليق المتصفح مع إمكانية المتابعة الفورية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>تصدير مباشر وتنزيل بصيغ MP4 و PNG و WAV عالية الجودة</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setCurrentTab('video')}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Film className="w-4 h-4" />
                  <span>جرّب استوديو الفيديو الآن</span>
                </button>
              </div>
            </div>

            {/* Mock Visual Preview */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-[11px] text-slate-400">Veo 3.1 AI Engine 9:16</span>
                </div>

                <div className="mt-4 aspect-[9/16] rounded-xl bg-gradient-to-b from-indigo-950/80 via-slate-900 to-cyan-950/60 border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-900/80 text-cyan-400 px-2 py-0.5 rounded border border-slate-700 font-mono">1080p HD</span>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded font-mono">Ready</span>
                  </div>

                  <div className="text-center my-auto py-6">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Play className="w-6 h-6 fill-cyan-400 text-cyan-400 translate-x-0.5 rtl:-translate-x-0.5" />
                    </div>
                    <p className="text-xs font-bold text-white">مشهد سينمائي إعلاني عالي الديناميكية</p>
                    <p className="text-[10px] text-slate-400 mt-1">حركة كاميرا سلسة وإضاءة استوديو متقدمة</p>
                  </div>

                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-[10px] text-cyan-400 block font-semibold">نص المشهد:</span>
                    "لقطة مقربة لطائرة هجينة مستقبلية تحلق فوق سماء دبي ليلاً..."
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Pricing Matrix Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">خطط اشتراك شفافة وعادلة</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">اختر الباقة المناسبة لطبيعة عملك</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            جميع الباقات تمنحك إمكانية الترقية، شراء الأرصدة الإضافية، أو تفعيل بطاقات الترخيص والمفاتيح.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Plan 1 */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-white">صانع المحتوى (Starter)</h3>
              <p className="text-xs text-slate-400 mt-1">مثالي للمبتدئين وصناع مقاطع الريلز والتيك توك</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400"> / شهرياً</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>1,200 رصيد توليد شهري</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>توليد صور فائقة الدقة 1080p</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>محرك Veo Lite لإنتاج الفيديو</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>تعليق صوتي غير محدود ضمن الرصيد</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setCurrentTab('pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              اختيار هذه الباقة
            </button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="rounded-2xl bg-gradient-to-b from-cyan-950/40 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/60 p-6 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
              الأكثر طلباً للمحترفين
            </div>
            <div>
              <h3 className="font-bold text-base text-white">المحترف برو (Pro Studio)</h3>
              <p className="text-xs text-slate-400 mt-1">للمسوقين، القنوات المتطورة والوكالات الإعلانية</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-white">$79</span>
                <span className="text-xs text-slate-400"> / شهرياً</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">4,000 رصيد توليد شهري</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>نماذج Nano Banana 2.1 فائقة الجودة 4K</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>فيديوهات أطول تصل إلى 30 ثانية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>أولوية قصوى في طابور المعالجة السحابية</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>دعم كامل لتركيب نصوص البوسترات العربية</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setCurrentTab('pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all"
            >
              الترقية إلى المحترف برو
            </button>
          </div>

          {/* Plan 3 */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-white">الاستوديو التجاري (Enterprise)</h3>
              <p className="text-xs text-slate-400 mt-1">للشركات الكبرى، فرق العمل وشركات الإنتاج</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-black text-white">$199</span>
                <span className="text-xs text-slate-400"> / شهرياً</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>12,000 رصيد توليد شهري ضخم</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>استخدام كافة النماذج دون قيود على الدقة</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>توليد متزامن لعدة مشاريع معاً</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>دعم فني مخصص على مدار الساعة</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setCurrentTab('pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              اختيار باقة الشركات
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
