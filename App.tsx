import React, { useState, useEffect } from 'react';
import { Module, Settings } from './types';
import Navigation from './components/Navigation';
import SplitModule from './components/SplitModule';
import ReconcileModule from './components/ReconcileModule';
import SettingsModule from './components/SettingsModule';
import { Layout, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<Module>(Module.SPLIT);
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  
  const [settings, setSettings] = useState<Settings>({
    driveClientId: localStorage.getItem('driveClientId') || '',
    driveFolderId: localStorage.getItem('driveFolderId') || '',
  });

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const envKey = process.env.API_KEY;
        if (envKey && envKey.length > 5) {
          setIsKeySelected(true);
          return;
        }
      } catch (e) {
        console.warn("App: API_KEY no detectado en process.env");
      }

      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        setIsKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('driveClientId', newSettings.driveClientId);
    localStorage.setItem('driveFolderId', newSettings.driveFolderId);
  };

  if (isKeySelected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020b18]">
        <Loader2 className="w-10 h-10 text-[#f84827] animate-spin" />
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case Module.SPLIT:
        return <SplitModule settings={settings} />;
      case Module.RECONCILE:
        return <ReconcileModule />;
      case Module.SETTINGS:
        return <SettingsModule settings={settings} onSave={saveSettings} onKeyChange={handleSelectKey} />;
      default:
        return <SplitModule settings={settings} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 glass sticky top-0 z-50 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f84827] rounded-lg shadow-[0_0_15px_rgba(248,72,39,0.5)]">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            BRADY <span className="text-[#f84827]">AUDIT</span>
            <span className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-[10px] uppercase tracking-tighter border border-white/10">Pro</span>
          </h1>
        </div>
        <Navigation currentModule={currentModule} setModule={setCurrentModule} />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {renderModule()}
      </main>

      <footer className="p-6 text-center text-slate-500 text-xs mt-auto border-t border-white/5">
        <div>&copy; {new Date().getFullYear()} Brady Audit Suite. Versión Pro.</div>
      </footer>
    </div>
  );
};

export default App;