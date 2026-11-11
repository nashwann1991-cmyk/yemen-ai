import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Trash2, 
  ShieldCheck, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  User, 
  Lock 
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

export function SettingsPage() {
  const { user, refreshUserData } = useAuth();
  
  const [credentials, setCredentials] = useState<any[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  const [loading, setLoading] = useState(true);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCredentials = async () => {
    try {
      const res = await api.getCustomerCredentials();
      setCredentials(res.credentials);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSubmittingKey(true);
    setError(null);
    setSuccess(null);

    try {
      await api.addCustomerCredential({
        providerId: 'provider_gemini',
        apiKey: apiKeyInput.trim()
      });
      setApiKeyInput('');
      setSuccess('تم حفظ وتشفير مفتاح API بنجاح على الخادم بتقنية AES-256-GCM');
      fetchCredentials();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ المفتاح');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleDeleteKey = async (credId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المفتاح؟')) return;
    try {
      await api.deleteCustomerCredential(credId);
      fetchCredentials();
      setSuccess('تم حذف المفتاح بنجاح');
    } catch (err: any) {
      setError(err.message || 'فشل حذف المفتاح');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setError(null);
    try {
      await api.updateProfile({ displayName });
      setSuccess('تم تحديث الملف الشخصي بنجاح');
      refreshUserData();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث الملف الشخصي');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">إعدادات الحساب ومفاتيح API الخاصة (BYOK)</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          تحكم في بياناتك الشخصية وقم بربط مفاتيح الذكاء الاصطناعي الخاصة بك لتجاوز استهلاك رصيد المنصة.
        </p>
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

      {/* Profile Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>المعلومات الشخصية</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
          >
            {isUpdatingProfile ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>

      {/* BYOK Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>مفاتيح API الخاصة بالعميل (Bring Your Own Key)</span>
          </h3>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold">
            اختياري
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          عند إضافة مفتاحك الخاص، يمكنك استخدامه في عمليات التوليد دون خصم رصيد من باقتك. يتم تشفير المفاتيح تشفيراً عسكرياً في الخادم ولا تظهر لأي مستخدم آخر.
        </p>

        {/* Existing Keys List */}
        {credentials.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-300 block">المفاتيح المربوطة حالياً:</span>
            {credentials.map(c => (
              <div key={c.credentialId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-mono text-slate-200 font-bold">{c.keyMask}</p>
                    <span className="text-[10px] text-slate-500">Google Gemini & Veo API</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteKey(c.credentialId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="حذف المفتاح"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Key Form */}
        <form onSubmit={handleAddKey} className="space-y-3 pt-3 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300">
            إضافة مفتاح Google Gemini API جديد
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              required
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="ألصق مفتاح AI Studio أو Google Cloud هنا..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              disabled={isSubmittingKey}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSubmittingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>تشفير وحفظ المفتاح</span>
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>المفاتيح محمية ولا تعرض في المتصفح مطلقاً بعد الحفظ.</span>
        </div>
      </div>

    </div>
  );
}
