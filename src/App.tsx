import React from 'react';

function App() {
  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-gray-900 dark:text-gray-100">
      <div className="relative w-full max-w-[480px] h-screen max-h-[900px] bg-white dark:bg-midnight shadow-2xl overflow-hidden flex flex-col md:rounded-[32px] md:border-4 border-gray-200 dark:md:border-gray-800 transition-colors duration-200">
        
        {/* Navbar */}
        <header className="w-full bg-white/80 dark:bg-surfaceDark/50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 p-4 flex justify-between items-center sticky top-0 z-50">
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white cursor-pointer" onClick={() => (window as any).switchTab?.('feed')}>
              mentorini<span className="text-indigoNeon">.</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                id="header-plus-btn"
                onClick={() => (window as any).MentoriniActions?.openShareModal?.()} 
                title="Abda share el knowledge mte3ek (+)"
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigoNeon text-xs font-black flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900 active:scale-95 transition-all cursor-pointer"
              >
                <span className="text-sm font-black">＋</span>
                <span className="text-[11px] font-bold">Share</span>
              </button>
              <select id="theme-selector" onChange={(e) => (window as any).ThemeManager?.setTheme(e.target.value)} className="bg-gray-100 dark:bg-surfaceDark text-[11px] font-medium px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 outline-none text-gray-700 dark:text-gray-300 focus:border-indigoNeon cursor-pointer">
                  <option value="system">📱 System</option>
                  <option value="dark">🌙 Night</option>
                  <option value="light">☀️ Day</option>
              </select>
            </div>
        </header>

        {/* 🔄 This is where your ui.js injects your Arabizi Views */}
        <main 
          id="app-viewport" 
          style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom))' }}
          className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4"
        ></main>

        {/* Sticky Tabs Navigation with strict Mobile Hardware Navigation Safe Area Overrides */}
        <nav 
          id="app-navigation" 
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-surfaceDark/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800/80 px-6 pt-3.5 flex justify-between items-center z-50 md:rounded-b-[28px]"
        >
            <button onClick={() => (window as any).switchTab?.('feed')} id="nav-feed" className="text-indigoNeon text-xs font-mono font-bold cursor-pointer">Feed</button>
            <button onClick={() => (window as any).switchTab?.('dashboard')} id="nav-dashboard" className="text-gray-400 dark:text-gray-500 text-xs font-mono cursor-pointer">Dashboard</button>
            <button onClick={() => (window as any).switchTab?.('idea')} id="nav-idea" className="text-gray-400 dark:text-gray-500 text-xs font-mono cursor-pointer">Idea</button>
        </nav>

      </div>
    </div>
  );
}

export default App;
