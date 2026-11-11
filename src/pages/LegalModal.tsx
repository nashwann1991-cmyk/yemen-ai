import React from 'react';
import { X, ShieldCheck, FileText, Lock, Cpu } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'acceptable' | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const content = {
    terms: {
      title: 'شروط الخدمة والاستخدام التجاري (Terms of Service)',
      icon: FileText,
      body: `1. ترخيص الاستخدام التجاري:
يمنحك الاشتراك في المنصة ترخيصاً تجارياً كاملاً وغير حصري لاستخدام، نشر، وبيع جميع الفيديوهات والصور والتسجيلات الصوتية التي تقوم بتوليدها من خلال حسابك.

2. سياسة الرصيد والاشتراكات:
يتم تجديد الأرصدة الشهرية مع بداية كل دورة فوترة. الأرصدة غير قابلة للاسترداد المالي المباشر بمجرد استهلاكها في عمليات التوليد الناجحة. في حال فشل أي عملية بسبب خلل تقني لدى المزود، يتم تحرير الرصيد المحجوز وإرجاعه لمحفظتك آلياً.

3. مفاتيح التفعيل والترخيص:
تعتبر مفاتيح التفعيل ذات الاستخدام المحدد بمثابة رصيد رقمي. لا تتحمل المنصة مسؤولية مشاركة أو ضياع المفاتيح بعد تصديرها.

4. التزامات العميل:
يتعهد العميل بعدم محاولة الهندسة العكسية للمنصة أو تجاوز حدود الاستهلاك المحددة في باقته.`
    },
    privacy: {
      title: 'سياسة الخصوصية وحماية البيانات (Privacy Policy)',
      icon: Lock,
      body: `1. حماية وتشفير الأسرار (BYOK):
أي مفاتيح API يضيفها العميل يتم تشفيرها في خوادم المنصة باستخدام خوارزمية AES-256-GCM مع مفتاح تشفير مستقل، ولا يمكن قراءتها كنص صريح أو مشاركتها مع أي طرف ثالث.

2. بيانات الدفع:
لا تقوم المنصة بتخزين أرقام البطاقات الائتمانية الحساسة. كافة التحويلات البنكية ومطالبات الكريبتو يتم تسجيلها كأرقام مرجعية لغرض التدقيق والمراجعة المحاسبية فقط.

3. تخزين الملفات والوسائط:
تحتفظ المنصة بالفيديوهات والصور والملفات الصوتية المولدة في وحدات تخزين محمية، ويحق للمستخدم حذف أي مشروع في أي وقت من خلال معرض المشاريع.`
    },
    acceptable: {
      title: 'سياسة الاستخدام العادل والمقبول (Acceptable Use Policy)',
      icon: Cpu,
      body: `1. المحتوى المحظور:
يُحظر تماماً استخدام المنصة لتوليد أي محتوى يروج للعنف، الكراهية، انتهاك الخصوصية، الاحتيال المالي، أو التزييف العميق (Deepfake) المضلل أو انتحال الشخصيات دون إذن كتابي موثق.

2. استنساخ الأصوات والهوية:
تلتزم المنصة بضوابط صارمة تمنع انتحال أصوات الشخصيات العامة أو الأفراد دون موافقة نظامية صريحة.

3. إساءة استخدام الموارد:
يحظر إرسال طلبات آلية متزامنة غير اعتيادية تهدف إلى تعطيل الخوادم أو التحايل على نظام حساب الأرصدة.`
    }
  }[type];

  const Icon = content.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 rtl:left-5 rtl:right-auto ltr:right-5 ltr:left-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">{content.title}</h3>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-5 rounded-2xl border border-slate-800">
          {content.body}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
