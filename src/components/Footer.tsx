import React from 'react';
import { ShieldCheck, Cpu, FileText, Lock, Mail, ExternalLink } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  openLegalModal: (type: 'terms' | 'privacy' | 'acceptable') => void;
}

export function Footer({ setCurrentTab, openLegalModal }: FooterProps) {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/90 text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                C
              </div>
              <span className="font-extrabold text-white text-sm tracking-wide">CREATIVE AI STUDIO PRO</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              المنصة التجارية الرائدة في الشرق الأوسط والعالم العربي لإنتاج الفيديو، الصور والتسجيلات الصوتية الاحترافية بنماذج الذكاء الاصطناعي المتقدمة.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>نظام حماية وتشفير عالي الاعتمادية</span>
            </div>
          </div>

          {/* AI Studios Navigation */}
          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-xs tracking-wider">استوديوهات الإنتاج</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentTab('video')} className="hover:text-cyan-400 transition-colors">
                  استوديو الفيديو (Veo 3.1 & Reels 9:16)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('image')} className="hover:text-cyan-400 transition-colors">
                  استوديو الصور والبوسترات (Nano Banana 4K)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('voice')} className="hover:text-cyan-400 transition-colors">
                  استوديو التعليق الصوتي (Gemini TTS Studio)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('prompt')} className="hover:text-cyan-400 transition-colors">
                  مساعد كتابة السيناريو والبرومبت السينمائي
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('gallery')} className="hover:text-cyan-400 transition-colors">
                  معرض المشاريع والتحميلات
                </button>
              </li>
            </ul>
          </div>

          {/* Pricing & Business */}
          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-xs tracking-wider">الاشتراكات والدفع</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setCurrentTab('pricing')} className="hover:text-cyan-400 transition-colors">
                  باقات صانع المحتوى والمحترفين
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('redeem')} className="hover:text-cyan-400 transition-colors">
                  تفعيل بطاقة ترخيص ومفتاح اشتراك
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('wallet')} className="hover:text-cyan-400 transition-colors">
                  المحفظة المالية وسجل الحركات
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('settings')} className="hover:text-cyan-400 transition-colors">
                  ربط مفاتيح API الخاصة (BYOK)
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-slate-200 font-bold mb-3 text-xs tracking-wider">السياسات والأمان</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => openLegalModal('terms')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>شروط الخدمة والاستخدام التجاري</span>
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('privacy')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>سياسة الخصوصية وحماية البيانات</span>
                </button>
              </li>
              <li>
                <button onClick={() => openLegalModal('acceptable')} className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>سياسة الاستخدام العادل والمقبول</span>
                </button>
              </li>
              <li className="pt-2 text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>support@creativestudio.ai</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CREATIVE AI STUDIO PRO. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              الخدمات السحابية متصلة وجاهزة
            </span>
            <span>العملة الافتراضية: USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
