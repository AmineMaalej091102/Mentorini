import { Sun, Moon, Monitor, PlusCircle, Sparkles } from 'lucide-react';
import { ThemeMode } from '../types';

interface NavbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenRegister: () => void;
  mentorCount: number;
}

export function Navbar({ theme, onThemeChange, onOpenRegister, mentorCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-500/30">
            M
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Mentorini
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900">
                TN 🇹🇳
              </span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-400 font-medium">
              Peer-Mentorship IT {mentorCount > 0 && `• ${mentorCount} Mentors`}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Day / Night selector */}
          <div className="relative inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1">
            <button
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all"
              title={`Mode: ${theme} (Click bech tbadal)`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Monitor className="w-4 h-4 text-zinc-500" />
              )}
            </button>
          </div>

          {/* Quick Add Mentor Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Zid Mentor</span>
          </button>
        </div>
      </div>
    </header>
  );
}
