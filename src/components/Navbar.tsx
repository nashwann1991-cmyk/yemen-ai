import React, { useState } from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  FolderGit2, 
  CreditCard, 
  Key, 
  Wallet, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown, 
  Menu, 
  X,
  Globe,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  isRtl: boolean;
  toggleRtl: () => void;
}

export function Navbar({ currentTab, setCurrentTab, openAuthModal, isRtl, toggleRtl }: NavbarProps) {
  const { user, wallet, subscription, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', labelAr: 'الرئيسية', labelEn: 'Home', icon: Sparkles },
    { id: 'video', labelAr: 'استوديو الفيديو', labelEn: 'Video Studio', icon: Video },
    { id: 'image', labelAr: 'استوديو الصور', labelEn: 'Image Studio', icon: ImageIcon },
    { id: 'voice', labelAr: 'التعليق الصوتي', labelEn: 'Voiceover', icon: Mic },
    { id: 'prompt', labelAr: 'السيناريو والبرومبت', labelEn: 'Script & Prompt', icon: FileText },
    { id: 'gallery', labelAr: 'معرض المشاريع', labelEn: 'Projects', icon: FolderGit2 },
    { id: 'dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'pricing', labelAr: 'الباقات والأسعار', labelEn: 'Pricing', icon: CreditCard },
    { id: 'redeem', labelAr: 'تفعيل المفتاح', labelEn: 'Redeem Key', icon: Key },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">CREATIVE AI</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">استوديو الإبداع بالذكاء الاصطناعي</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                    isActive 
                      ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{isRtl ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Credits & User or Login */}
          <div className="flex items-center gap-2.5">
            {/* Language / Direction Toggle */}
            <button
              onClick={toggleRtl}
              title={isRtl ? 'تبديل إلى الإنجليزية' : 'Switch to Arabic'}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-xs flex items-center gap-1 border border-slate-800/60"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">{isRtl ? 'EN' : 'عربي'}</span>
            </button>

            {user ? (
              <>
                {/* Available Credits Indicator */}
                <button
                  onClick={() => setCurrentTab('wallet')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-700/40 hover:border-cyan-500/60 transition-all text-xs font-semibold text-cyan-300"
                  title="محفظة الرصيد"
                >
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{wallet?.availableCredits ?? 0}</span>
                  <span className="text-[10px] text-slate-400">{isRtl ? 'رصيد' : 'cr'}</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[90px] truncate hidden sm:inline font-medium">{user.displayName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {dropdownOpen && (
                    <div 
                      className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs backdrop-blur-md`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                        <p className="font-bold text-slate-200 truncate">{user.displayName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        {subscription ? (
                          <div className="mt-1 text-[10px] text-emerald-400 font-medium">
                            {subscription.planName || 'باقة نشطة'}
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] text-slate-500 font-medium">
                            باقة تجريبية مجانية
                          </div>
                        )}
                      </div>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => setCurrentTab('admin')}
                          className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-amber-400 hover:bg-amber-950/30 flex items-center gap-2 font-semibold"
                        >
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>لوحة إدارة المالك (Admin)</span>
                        </button>
                      )}

                      <button
                        onClick={() => setCurrentTab('dashboard')}
                        className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-cyan-400 hover:bg-cyan-950/40 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                        <span>لوحة التحكم والإحصائيات</span>
                      </button>

                      <button
                        onClick={() => setCurrentTab('wallet')}
                        className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
                      >
                        <Wallet className="w-4 h-4 text-cyan-400" />
                        <span>المحفظة وسجل الحركات</span>
                      </button>

                      <button
                        onClick={() => setCurrentTab('settings')}
                        className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>إعدادات المفاتيح (BYOK)</span>
                      </button>

                      <div className="border-t border-slate-800/80 my-1"></div>

                      <button
                        onClick={logout}
                        className="w-full text-right rtl:text-right ltr:text-left px-3 py-2 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {isRtl ? 'تسجيل الدخول' : 'Sign In'}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
                >
                  {isRtl ? 'ابدأ مجاناً' : 'Get Started'}
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/90 bg-slate-950 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{isRtl ? item.labelAr : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
