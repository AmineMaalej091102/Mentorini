import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeMentoriniApp } from './app.js';
import { mountApp } from './ui.js';

function Root() {
  useEffect(() => {
    // Initialize ThemeManager
    if (typeof window !== 'undefined' && (window as any).ThemeManager?.init) {
      (window as any).ThemeManager.init();
    }

    // Initialize core state & Supabase data sync
    initializeMentoriniApp();

    // Mount dynamic Arabizi UI engine directly into #app-viewport
    const mountedApp = mountApp('#app-viewport');

    return () => {
      mountedApp?.unmount();
    };
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
