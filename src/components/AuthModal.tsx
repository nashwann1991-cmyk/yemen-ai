import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);

  // Map Firebase Auth error codes to clear Arabic messages
  const formatFirebaseAuthError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'هذا البريد الإلكتروني مسجل مسبقاً في Firebase. يمكنك تسجيل الدخول مباشرة.';
    }
    if (code === 'auth/weak-password') {
      return 'كلمة المرور ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل.';
    }
    if (code === 'auth/invalid-email') {
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (code === 'auth/too-many-requests') {
      return 'تم تجاوز عدد المحاولات المسموح به. يرجى المحاولة لاحقاً.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'التسجيل بالبريد وكلمة المرور غير مفعّل بعد في Firebase Console لمشروعك. قم بتفعيل Email/Password من Authentication > Sign-in method أو سجّل بحساب Google.';
    }
    return err?.message || 'فشلت العملية، يرجى المحاولة مرة أخرى';
  };

  // Google Sign-In & Sign-Up handler (triggers official Google Account Chooser popup & saves account to Firestore)
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { signInWithGooglePopup } = await import('../firebase.js');
      const result = await signInWithGooglePopup();
      const googleUser = result.user;

      let idToken: string | undefined;
      try {
        idToken = await googleUser.getIdToken();
      } catch {
        // ignore token fetch error if offline
      }

      const res = await api.syncFirebaseAuth({
        idToken,
        firebaseUid: googleUser.uid,
        email: googleUser.email || '',
        displayName: googleUser.displayName || googleUser.email?.split('@')[0] || 'مستخدم Google',
        photoUrl: googleUser.photoURL || undefined,
        authProvider: 'google'
      });

      login(res.token, res.user);
      onClose();
    } catch (err: any) {
      console.warn('Google Auth popup notice:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('تم إغلاق نافذة Google قبل اختيار الحساب');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('المتصفح حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو اختيار حسابك أدناه.');
        setShowGooglePrompt(true);
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('النطاق الحالي غير مضاف في Authorized domains داخل Firebase Console. يمكنك اختيار حسابك أدناه مؤقتاً.');
        setShowGooglePrompt(true);
      } else {
        setError(err?.message || 'حدث خطأ أثناء المصادقة عبر Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleAuth = async (googleEmail: string, googleName: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginWithGoogle({
        email: googleEmail,
        displayName: googleName,
        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName || googleEmail)}`
      });
      login(res.token, res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || (mode === 'register' ? 'فشل إنشاء الحساب بحساب Google' : 'فشل تسجيل الدخول بحساب Google'));
    } finally {
      setLoading(false);
      setShowGooglePrompt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { registerWithFirebaseEmail, loginWithFirebaseEmail } = await import('../firebase.js');
      if (mode === 'register') {
        const { user: fbUser, idToken } = await registerWithFirebaseEmail(email, password, displayName);
        const res = await api.syncFirebaseAuth({
          idToken,
          firebaseUid: fbUser.uid,
          email: fbUser.email || email,
          displayName: displayName.trim(),
          authProvider: 'password'
        });
        login(res.token, res.user);
        onClose();
      } else {
        const { user: fbUser, idToken } = await loginWithFirebaseEmail(email, password);
        const res = await api.syncFirebaseAuth({
          idToken,
          firebaseUid: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || undefined,
          authProvider: 'password'
        });
        login(res.token, res.user);
        onClose();
      }
    } catch (err: any) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click login for testing
  const handleQuickDemo = async (type: 'admin' | 'creator') => {
    setError(null);
    setLoading(true);

    const demoEmail = type === 'admin' ? 'nashwann1991@gmail.com' : 'creator_demo@studio.ai';
    const demoPass = 'StudioPro2026!';
    const demoName = type === 'admin' ? 'المهندس نشوان (مدير المنصة)' : 'صانع محتوى تجريبي';

    try {
      // Try login first
      try {
        const res = await api.login({ email: demoEmail, password: demoPass });
        login(res.token, res.user);
        onClose();
        return;
      } catch {
        // If not registered yet, auto-register
        const regRes = await api.register({ email: demoEmail, password: demoPass, displayName: demoName });
        login(regRes.token, regRes.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'تعذر تسجيل الدخول السريع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/20 mb-3">
            C
          </div>
          <h3 className="text-lg font-bold text-white">
            {mode === 'login' ? 'تسجيل الدخول إلى استوديو الإبداع' : 'إنشاء حساب تجاري جديد'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' 
              ? 'أدخل بياناتك للوصول إلى أدوات الفيديو، الصور، والصوتيات' 
              : 'احصل فوراً على 100 رصيد تجريبي مجاني لتجربة نماذج الذكاء الاصطناعي'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800/80">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign-In / Sign-Up Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{mode === 'login' ? 'تسجيل الدخول بحساب Google' : 'إنشاء حساب عن طريق Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[11px] text-slate-500 font-medium">أو بالبريد الإلكتروني</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>
        </div>

        {/* Google Account Selector Dialog */}
        {showGooglePrompt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative text-right">
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2 shadow">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {mode === 'register' ? 'إنشاء حساب جديد عبر Google' : 'تسجيل الدخول عبر Google'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mode === 'register' 
                    ? 'اختر حساب Google لإنشاء حسابك وتفعيل 100 رصيد تجريبي فوراً' 
                    : 'اختر حساب Google للمتابعة إلى استوديو الإبداع'}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <button
                  type="button"
                  onClick={() => executeGoogleAuth('nashwann1991@gmail.com', 'المهندس نشوان')}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 flex items-center justify-between text-right transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">
                      N
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">المهندس نشوان</p>
                      <p className="text-[10px] text-slate-400 font-mono">nashwann1991@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold">
                    {mode === 'register' ? 'إنشاء الحساب' : 'متابعة'}
                  </span>
                </button>

                {!showCustomEmailInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailInput(true)}
                    className="w-full p-2.5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs text-center transition-colors"
                  >
                    + {mode === 'register' ? 'إنشاء حساب بحساب Google آخر' : 'استخدام حساب Google آخر'}
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                        {mode === 'register' ? 'بريد Google لحسابك الجديد:' : 'أدخل بريد Google:'}
                      </label>
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                        الاسم الكامل (اختياري):
                      </label>
                      <input
                        type="text"
                        value={customGoogleName}
                        onChange={(e) => setCustomGoogleName(e.target.value)}
                        placeholder="مثال: أحمد العبدالله"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!customGoogleEmail.includes('@')}
                      onClick={() => executeGoogleAuth(
                        customGoogleEmail, 
                        customGoogleName.trim() || customGoogleEmail.split('@')[0]
                      )}
                      className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {mode === 'register' ? 'إنشاء الحساب وتفعيل 100 رصيد' : 'متابعة بهذا الحساب'}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-500 text-center leading-normal">
                {mode === 'register' 
                  ? 'عند إنشاء حسابك عن طريق Google، ستحصل تلقائياً على 100 رصيد تجريبي فوري.' 
                  : 'بالمتابعة، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بالمنصة.'}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">الاسم الكامل</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 w-4 h-4 text-slate-500 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 rtl:pr-10 ltr:pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-4 h-4 text-slate-500 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 rtl:pr-10 ltr:pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 rtl:pr-10 ltr:pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{mode === 'login' ? 'دخول للمنصة' : 'إنشاء حساب وتفعيل 100 رصيد'}</span>
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400 text-center mb-3">أو جرّب الحسابات الجاهزة بنقرة واحدة لاختبار النظام:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-2.5 py-2 rounded-xl bg-amber-950/30 border border-amber-800/40 hover:border-amber-500/60 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>دخول كـ مدير (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('creator')}
              className="px-2.5 py-2 rounded-xl bg-cyan-950/30 border border-cyan-800/40 hover:border-cyan-500/60 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>دخول كـ صانع محتوى</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
