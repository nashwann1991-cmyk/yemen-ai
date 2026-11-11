import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { LandingPage } from './pages/LandingPage.js';
import { VideoStudio } from './pages/VideoStudio.js';
import { ImageStudio } from './pages/ImageStudio.js';
import { VoiceStudio } from './pages/VoiceStudio.js';
import { PromptStudio } from './pages/PromptStudio.js';
import { GalleryPage } from './pages/GalleryPage.js';
import { PricingPage } from './pages/PricingPage.js';
import { RedeemPage } from './pages/RedeemPage.js';
import { WalletPage } from './pages/WalletPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { LegalModal } from './pages/LegalModal.js';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('landing');
  const [isRtl, setIsRtl] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'acceptable' | null>(null);
  const [sharedPrompt, setSharedPrompt] = useState<string>('');

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = isRtl ? 'ar' : 'en';
  }, [isRtl]);

  const toggleRtl = () => {
    setIsRtl(!isRtl);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950`}>
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={openAuthModal}
        isRtl={isRtl}
        toggleRtl={toggleRtl}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            setCurrentTab={setCurrentTab}
            openAuthModal={openAuthModal}
            isRtl={isRtl}
          />
        )}

        {currentTab === 'video' && (
          <VideoStudio
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'image' && (
          <ImageStudio
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'voice' && (
          <VoiceStudio
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'prompt' && (
          <PromptStudio
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
            setSharedPrompt={setSharedPrompt}
            isRtl={isRtl}
          />
        )}

        {currentTab === 'gallery' && (
          <GalleryPage
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'pricing' && (
          <PricingPage
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'redeem' && (
          <RedeemPage
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
            isRtl={isRtl}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletPage
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            openAuthModal={openAuthModal}
            setCurrentTab={setCurrentTab}
            isRtl={isRtl}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        setCurrentTab={setCurrentTab}
        openLegalModal={(type) => setLegalModalType(type)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Legal & Policy Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
