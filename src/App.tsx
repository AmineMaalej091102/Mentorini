import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle, Plus, Filter } from 'lucide-react';
import { Mentor, Category, ThemeMode } from './types';
import { INITIAL_MENTORS, CATEGORIES } from './data/seedMentors';
import { Navbar } from './components/Navbar';
import { Manifesto } from './components/Manifesto';
import { CategoryFilter } from './components/CategoryFilter';
import { MentorCard } from './components/MentorCard';
import { MentorRegisterModal } from './components/MentorRegisterModal';
import { Footer } from './components/Footer';

const STORAGE_KEY_MENTORS = 'mentorini_mentors_v1';
const STORAGE_KEY_UNLOCKED = 'mentorini_unlocked_videos_v1';
const STORAGE_KEY_THEME = 'mentorini_theme_mode_v1';

export default function App() {
  // Theme state: defaults to 'system'
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
    return saved || 'system';
  });

  // Mentors state: loaded from localStorage or seeded with founder profile
  const [mentors, setMentors] = useState<Mentor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MENTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load mentors from storage', e);
    }
    return INITIAL_MENTORS;
  });

  // Video-watch unlocked mentor IDs (persisted locally)
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCKED);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load unlocked IDs', e);
    }
    return [];
  });

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<Category>('kolchay');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);

  // Apply Theme effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    const root = document.documentElement;

    const applyDark = () => root.classList.add('dark');
    const removeDark = () => root.classList.remove('dark');

    if (theme === 'dark') {
      applyDark();
    } else if (theme === 'light') {
      removeDark();
    } else {
      // System mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        applyDark();
      } else {
        removeDark();
      }

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) applyDark();
        else removeDark();
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Persist mentors to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MENTORS, JSON.stringify(mentors));
  }, [mentors]);

  // Persist unlocked IDs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(unlockedIds));
  }, [unlockedIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Video Watch Unlock
  const handleUnlockMentor = (mentorId: string) => {
    if (!unlockedIds.includes(mentorId)) {
      setUnlockedIds((prev) => [...prev, mentorId]);
      showToast('🎉 Mabrouk! L-WhatsApp unlocked tawa. Tnajjem tconnecti direct!');
    }
  };

  // Add new Mentor from the Open-Door track
  const handleAddMentor = (newMentor: Mentor) => {
    setMentors((prev) => [newMentor, ...prev]);
    showToast(`🚀 Mabrouk ya ${newMentor.name}! Profile mte3ek tzed fi Mentorini.`);
  };

  const scrollToFeed = () => {
    feedRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Category counts calculation
  const mentorCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      kolchay: mentors.length,
      bac_info: 0,
      fac_prep: 0,
      web_mobile: 0,
      devops_cloud: 0,
      data_ai: 0,
    };

    mentors.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category]++;
      }
    });

    return counts;
  }, [mentors]);

  // Filtered mentors based on Category & Search query
  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const matchesCategory =
        selectedCategory === 'kolchay' || m.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q) ||
        m.feynmanTopic.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [mentors, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased flex flex-col items-center">
      {/* Strict 480px Mobile Bedtime Viewport Container */}
      <div className="w-full max-w-[480px] min-h-screen bg-white dark:bg-zinc-950 border-x border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl flex flex-col relative transition-colors duration-200">
        
        {/* Sticky Mobile Navigation */}
        <Navbar
          theme={theme}
          onThemeChange={setTheme}
          onOpenRegister={() => setIsRegisterOpen(true)}
          mentorCount={mentors.length}
        />

        {/* Global Floating Toast */}
        {toastMessage && (
          <div className="fixed top-16 z-50 left-1/2 -translate-x-1/2 w-11/12 max-w-[420px] bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-indigo-400 animate-bounce">
            <CheckCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Arabizi Text Manifesto Gateway */}
        <Manifesto
          onOpenRegister={() => setIsRegisterOpen(true)}
          onScrollToFeed={scrollToFeed}
        />

        {/* Main Feed Section */}
        <main ref={feedRef} className="flex-1 pb-16">
          
          {/* Category Filter Horizontal Scroll */}
          <CategoryFilter
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            mentorCounts={mentorCounts}
          />

          {/* Quick Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lawwej: Bac Info, INSAT, React, Docker..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mentors Directory Feed */}
          <div className="px-4 pt-3 space-y-4">
            {filteredMentors.length > 0 ? (
              filteredMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  isUnlocked={unlockedIds.includes(mentor.id)}
                  onUnlock={handleUnlockMentor}
                />
              ))
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ma l9inach mentors fi hadha l-filtre
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                  Tnajjem tkoun awel mentor yfasser hadha l-domaine!
                </p>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sajjel Profile Mentor</span>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Quick Action Button on Mobile */}
        <div className="fixed bottom-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-lg shadow-indigo-600/40 border border-indigo-400"
          >
            <Plus className="w-4 h-4" />
            <span>Zid Mentor</span>
          </button>
        </div>

        {/* Open Door Mentor Registration Modal */}
        <MentorRegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onAddMentor={handleAddMentor}
        />

      </div>
    </div>
  );
}
