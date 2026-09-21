import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================
const SUPABASE_URL = 'https://quweyaxneqyyjfhhccbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = (typeof window !== 'undefined' && (window as any).supabase?.auth)
  ? (window as any).supabase
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================
export interface MentoriniUser {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  whatsapp_number?: string;
  status?: string;
  role?: string;
  bio?: string;
  video_url?: string;
  youtube_url?: string;
  feynman_topic?: string;
  category?: string;
  created_at?: string;
  isFlagship?: boolean;
}

// Initial seed mentors for immediate interactive preview & zero-delay onboarding
export const SEED_MENTORS: MentoriniUser[] = [
  {
    id: 'seed-mentor-1',
    name: 'Mehdi Trabelsi',
    email: 'mehdi.trabelsi@insat.tn',
    phone: '21698765432',
    whatsapp_number: '21698765432',
    status: 'INSAT GL3 • Ex-Bac Info 18.5',
    role: 'mentor',
    bio: 'N3awen jme3et el Bac Info w licence fi Recursion, Pointers C/C++, w Trees. Chnouwa 3andi: https://drive.google.com/drive/folders/mentorini-algo w https://github.com/mehdi-tn/algo-prep',
    video_url: 'https://www.youtube.com/watch?v=M2_o3o9Yj0E',
    feynman_topic: 'Recursion w Call Stack bel Tounsi',
    category: 'ALGO_BAC',
    created_at: '2026-03-01T10:00:00Z',
    isFlagship: true,
  },
  {
    id: 'seed-mentor-2',
    name: 'Sarra Ben Mahmoud',
    email: 'sarra.bm@gmail.com',
    phone: '21650123456',
    whatsapp_number: '21650123456',
    status: 'Full-Stack Engineer • Python Mentor',
    role: 'mentor',
    bio: 'Specialiste Web (FastAPI, React) w Python pour Bac Info. Code source w exa: https://github.com/sarra-dev/bac-info-python',
    video_url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    feynman_topic: 'Python OOP & Classes bel Farsi',
    category: 'PYTHON_DEV',
    created_at: '2026-03-02T11:00:00Z',
    isFlagship: true,
  },
  {
    id: 'seed-mentor-3',
    name: 'Amine Khemir',
    email: 'amine.khemir@ensi.tn',
    phone: '21622334455',
    whatsapp_number: '21622334455',
    status: 'ENSI Student • Algorithms Lead',
    role: 'mentor',
    bio: 'Dynamic Programming w Complexity O(N) fassarnehom fi 5 d9aye9. Chekout notions: https://notion.site/algo-amine-tn',
    video_url: 'https://www.youtube.com/watch?v=HGTJBPNC-Gw',
    feynman_topic: 'Dynamic Programming bel Tounsi',
    category: 'DATA_STRUCTURES',
    created_at: '2026-03-03T12:00:00Z',
  },
];

// Helper: Extract YouTube 11-char video ID
function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match && match[1] ? match[1] : null;
}

// Helper: Clean Tunisian Phone Number (216 prefix)
function cleanPhoneNumber(phone?: string | null): string {
  let cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 8) {
    cleaned = '216' + cleaned;
  } else if (cleaned.startsWith('00216')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned || '21698765432';
}

// Helper: Deep-Link to native WhatsApp
function openWhatsAppChat(phone?: string | null, mentorName?: string, topic?: string) {
  const sanitized = cleanPhoneNumber(phone);
  const firstName = mentorName ? mentorName.split(' ')[0] : 'Mentor';
  const message = `3aslema ya ${firstName}! 👋 Choft profil mte3ek 3la Mentorini mta3 "${topic || 'Concept IT'}". 3andi blocker 9sir w 7abit nestachirek ken ma y9al9ekch!`;
  const waUrl = `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // 1. Core State Engine
  const [user, setUser] = useState<MentoriniUser | null>(() => {
    try {
      const saved = localStorage.getItem('mentorini_user_session_react');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mentors, setMentors] = useState<MentoriniUser[]>(SEED_MENTORS);
  const [activeTab, setActiveTab] = useState<'feed' | 'onboarding' | 'dashboard' | 'idea'>('feed');
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mentorini_watched_videos_react');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // UI / Modal States
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [creatorBio, setCreatorBio] = useState('');
  const [creatorVideoUrl, setCreatorVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>('system');

  // Sync theme
  useEffect(() => {
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // Persist user & watched videos in localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('mentorini_user_session_react', JSON.stringify(user));
      } else {
        localStorage.removeItem('mentorini_user_session_react');
      }
    } catch (err) {
      console.warn(err);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('mentorini_watched_videos_react', JSON.stringify(Array.from(watchedVideos)));
    } catch (err) {
      console.warn(err);
    }
  }, [watchedVideos]);

  // 2. Fetch Network Directory Catalog from Supabase
  const fetchMentorsCatalog = useCallback(async () => {
    try {
      // 1st attempt: Query public 'users' table
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData && usersData.length > 0 && !usersErr) {
        const mappedUsers: MentoriniUser[] = usersData.map((u: any) => ({
          id: String(u.id || u.email || Math.random()),
          name: u.name || u.user_metadata?.full_name || 'Peer Mentor',
          email: u.email || '',
          phone: u.phone || u.whatsapp_number || '',
          whatsapp_number: u.whatsapp_number || u.phone || '',
          status: u.status || 'Peer Mentor IT',
          role: u.role || 'mentor',
          bio: u.bio || 'Partage des connaissances en IT bel Tounsi.',
          video_url: u.video_url || u.youtube_url || '',
          feynman_topic: u.feynman_topic || 'Concept IT bel Tounsi',
          category: u.category || 'IT_PEER',
          created_at: u.created_at || new Date().toISOString(),
        }));
        setMentors(mappedUsers);
        return;
      }

      // 2nd attempt: Fallback to 'mentors' table
      const { data: mentorsData, error: mentorsErr } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (mentorsData && mentorsData.length > 0 && !mentorsErr) {
        const mappedMentors: MentoriniUser[] = mentorsData.map((row: any) => ({
          id: String(row.id),
          name: row.name,
          email: row.email || '',
          phone: row.whatsapp_number || row.phone,
          whatsapp_number: row.whatsapp_number || row.phone,
          status: row.status || 'Peer Mentor IT',
          role: 'mentor',
          bio: row.bio || '',
          video_url: row.youtube_url || row.video_url || '',
          feynman_topic: row.feynman_topic || 'Concept IT bel Tounsi',
          category: row.category || 'IT_PEER',
          created_at: row.created_at || new Date().toISOString(),
        }));
        setMentors(mappedMentors);
        return;
      }

      // 3rd attempt: Seed default mentors
      setMentors(SEED_MENTORS);
    } catch (err) {
      console.warn('Live fetch error, utilizing seed mentors fallback:', err);
      setMentors(SEED_MENTORS);
    }
  }, []);

  // 3. Supabase Auth Lifecycle Observer
  useEffect(() => {
    // Initial fetch of directory catalog
    fetchMentorsCatalog();

    // Setup Auth Listener
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user?.email) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          const activeUser: MentoriniUser = profile || {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || 'Peer User',
            role: 'mentee',
            status: 'Active Member',
            bio: '',
            video_url: '',
          };

          setUser(activeUser);
          if (activeUser.bio) setCreatorBio(activeUser.bio);
          if (activeUser.video_url) setCreatorVideoUrl(activeUser.video_url);

          // Download updated network catalog
          await fetchMentorsCatalog();
        } catch {
          const fallbackUser: MentoriniUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || 'Peer User',
            role: 'mentee',
            status: 'Active Member',
            bio: '',
            video_url: '',
          };
          setUser(fallbackUser);
          await fetchMentorsCatalog();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Realtime Postgres sync for live updates
    const channel = supabase
      .channel('mentorini-react-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchMentorsCatalog();
      })
      .subscribe();

    return () => {
      authSubscription?.subscription?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchMentorsCatalog]);

  // Handle 1-Tap Google Login
  const handleGoogleLogin = async () => {
    setFeedbackMsg({ type: 'info', text: '⏳ 9a3din n-connectiw fik bel Google mte3ek tawa direct...' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `⚠️ Mochkla fi Google Login: ${err?.message || 'Thabbet fil connexion mte3ek.'}`,
      });
    }
  };

  // Video-Watch Unlock Action
  const handleUnlockVideo = (mentorId: string) => {
    setWatchedVideos((prev) => {
      const next = new Set(prev);
      next.add(mentorId);
      return next;
    });
  };

  // Open Creator Modal
  const openCreatorModal = () => {
    if (!user) {
      const confirmAuth = window.confirm(
        'Lazmek tkoun connecti bel Google mte3ek se3a bech t-partagi! T7eb tconnecti tawa direct?'
      );
      if (confirmAuth) {
        handleGoogleLogin();
      }
      return;
    }
    setCreatorBio(user.bio || '');
    setCreatorVideoUrl(user.video_url || '');
    setFeedbackMsg(null);
    setIsCreatorModalOpen(true);
  };

  // Submit Knowledge to Supabase (Peer Creator Engine)
  const handleCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedBio = creatorBio.trim();
    const trimmedVideoUrl = creatorVideoUrl.trim();

    if (!trimmedBio) {
      setFeedbackMsg({
        type: 'error',
        text: '⚠️ A3mel bio 9sira w 7ot feha chnowa tnajjem t3awen w les liens Drive/GitHub mte3ek.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg({ type: 'info', text: '⏳ 9a3din n-syncou fil knowledge mte3ek fil cloud...' });

    try {
      // Direct cloud update to public 'users' table
      const { error } = await supabase
        .from('users')
        .update({
          bio: trimmedBio,
          video_url: trimmedVideoUrl,
        })
        .eq('id', user.id);

      if (error) {
        console.warn('Direct id update warning, fallback email update:', error);
        await supabase
          .from('users')
          .update({
            bio: trimmedBio,
            video_url: trimmedVideoUrl,
          })
          .eq('email', user.email);
      }

      // Update local state immediately
      const updatedUser: MentoriniUser = {
        ...user,
        bio: trimmedBio,
        video_url: trimmedVideoUrl,
        role: 'mentor',
        status: 'Peer Mentor IT',
      };
      setUser(updatedUser);

      // Refresh mentors catalog
      await fetchMentorsCatalog();

      setFeedbackMsg({
        type: 'success',
        text: '🚀 Sa77a ya creator! L-knowledge mte3ek t-partaga tawa fil feed direct!',
      });

      setTimeout(() => {
        setIsCreatorModalOpen(false);
        setActiveTab('feed');
      }, 700);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `⚠️ Mochkla fil mise à jour: ${err?.message || 'A3wed jarreb mara okhra.'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn(err);
    }
    setUser(null);
    setActiveTab('feed');
  };

  // Format bio text with interactive Drive / GitHub / Notion resource chips
  const renderBioWithChips = (text?: string) => {
    if (!text) return <span className="text-zinc-400 italic">Ma famech bio maktouba l-tawa.</span>;

    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return (
      <span>
        {parts.map((part, index) => {
          if (/^https?:\/\//.test(part)) {
            let label = '🔗 Lien';
            if (part.includes('drive.google')) label = '📁 Google Drive';
            else if (part.includes('github.com')) label = '💻 GitHub';
            else if (part.includes('notion')) label = '📝 Notion';
            else if (part.includes('youtube.com') || part.includes('youtu.be')) label = '▶ 16:9 Video';

            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] hover:underline mx-0.5"
              >
                {label} ↗
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  // Selected profile mentor lookup
  const activeMentor = useMemo(() => {
    if (!activeProfileId) return null;
    return mentors.find((m) => String(m.id) === String(activeProfileId)) || null;
  }, [activeProfileId, mentors]);

  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-gray-900 dark:text-gray-100 bg-zinc-100 dark:bg-zinc-950">
      <div className="relative w-full max-w-[480px] h-screen max-h-[900px] bg-white dark:bg-midnight shadow-2xl overflow-hidden flex flex-col md:rounded-[32px] md:border-4 border-gray-200 dark:md:border-gray-800 transition-colors duration-200">
        
        {/* ==================================================================== */}
        {/* APP HEADER */}
        {/* ==================================================================== */}
        <header className="w-full bg-white/80 dark:bg-surfaceDark/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 p-3.5 flex justify-between items-center sticky top-0 z-40">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setActiveProfileId(null);
              setActiveTab('feed');
            }}
          >
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              mentorini<span className="text-indigoNeon">.</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              100% Free 🇹🇳
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Top Workspace Toolbar '+' Plus Button */}
            <button
              type="button"
              id="header-plus-btn"
              onClick={openCreatorModal}
              title="Abda share el knowledge mte3ek (+)"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black flex items-center gap-1.5 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="text-sm font-black leading-none">＋</span>
              <span className="text-[11px] font-bold">Share</span>
            </button>

            {/* Theme Selector */}
            <select
              id="theme-selector"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as any)}
              className="bg-gray-100 dark:bg-surfaceDark text-[11px] font-medium px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 outline-none text-gray-700 dark:text-gray-300 focus:border-indigoNeon cursor-pointer"
            >
              <option value="system">📱 System</option>
              <option value="dark">🌙 Night</option>
              <option value="light">☀️ Day</option>
            </select>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* VIEWPORT ROUTER */}
        {/* ==================================================================== */}
        <main
          id="app-viewport"
          style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom))' }}
          className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4"
        >
          {/* PROFILE DETAIL VIEW */}
          {activeProfileId && activeMentor ? (
            <section className="space-y-4 animate-fadeIn">
              {/* Back Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveProfileId(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>←</span>
                  <span>Erja3 lil Feed</span>
                </button>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {activeMentor.category ? activeMentor.category.toUpperCase().replace('_', ' ') : 'IT'}
                </span>
              </div>

              {/* Profile Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {(activeMentor.name || 'M').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 truncate">
                      {activeMentor.name}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {activeMentor.status || 'Peer Mentor IT'}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                      <span>📍 Tounes 🇹🇳</span>
                      <span>•</span>
                      <span>Direct WhatsApp Peer</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 16:9 Video Box with Video-Watch Lock */}
              {extractYouTubeId(activeMentor.video_url || activeMentor.youtube_url) && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-900 text-zinc-200 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-zinc-800">
                    <span className="truncate">
                      Feynman: <strong className="text-white font-black">{activeMentor.feynman_topic || 'Concept IT bel Tounsi'}</strong>
                    </span>
                    <span className="text-red-500 font-black text-[11px] shrink-0">▶ 16:9 YouTube</span>
                  </div>

                  <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
                    {watchedVideos.has(String(activeMentor.id)) ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                          extractYouTubeId(activeMentor.video_url || activeMentor.youtube_url)!
                        )}?autoplay=1&rel=0&modestbranding=1`}
                        title="Feynman Concept Video"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => handleUnlockVideo(String(activeMentor.id))}
                        className="group cursor-pointer relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition-colors p-4 text-center"
                      >
                        <div className="w-14 h-14 rounded-full bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform mb-2">
                          <span className="text-white text-lg font-black ml-0.5">▶</span>
                        </div>
                        <p className="text-xs font-black text-white">Tfarrej fil concept bel Tounsi (16:9)</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Click bech t-unlooki noumrou l-WhatsApp direct</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Button (Governed by Video-Watch Lock) */}
              <div>
                {!extractYouTubeId(activeMentor.video_url || activeMentor.youtube_url) ||
                watchedVideos.has(String(activeMentor.id)) ? (
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppChat(
                        activeMentor.whatsapp_number || activeMentor.phone,
                        activeMentor.name,
                        activeMentor.feynman_topic
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 cursor-pointer"
                  >
                    <span className="text-base leading-none">💬</span>
                    <span className="font-black text-xs">Connecti m3ah tawa direct</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold text-xs py-3.5 px-4 rounded-xl cursor-not-allowed border border-zinc-200 dark:border-zinc-800"
                  >
                    <span className="text-sm">🔒</span>
                    <span className="font-bold text-xs">Tfarrej fil video bech tconnecti</span>
                  </button>
                )}
              </div>

              {/* Bio & Resources */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
                <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                  A propos de {activeMentor.name.split(' ')[0]} & Resources
                </h3>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {renderBioWithChips(activeMentor.bio)}
                </div>
              </div>
            </section>
          ) : activeTab === 'onboarding' ? (
            /* ================================================================ */
            /* VIEW 1: ONBOARDING MANIFESTO & 1-TAP GOOGLE LOGIN                */
            /* ================================================================ */
            <section className="space-y-4 animate-fadeIn">
              {/* Top Ecosystem Pill */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Peer-Mentorship IT • 100% Free 🇹🇳</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Bac Info & Pro</span>
              </div>

              {/* THE VALUE MANIFESTO CARD */}
              <div className="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/50 dark:via-zinc-900 dark:to-zinc-950 border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100/90 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono font-black uppercase tracking-wider">
                  ✨ Zero-Friction Peer Mentorship
                </div>

                {/* The Literal Required Tunisian Arabizi Text Manifesto */}
                <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                  T7eb tadhrob el blocker mte3ek fi draj? Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek.
                </h1>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-indigo-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  Saving your Time and Energy by grouping filtered peer mentors in one click instead of searching the endless sea of YouTube.
                </div>

                <div className="space-y-2.5 pt-1 text-xs text-zinc-800 dark:text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </span>
                    <span>
                      <strong>Instagram Equality:</strong> Mentees w mentors 3andhom nafs el feed. Kol we7ed ynajem ykoun creator bel bouton (+).
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </span>
                    <span>
                      <strong>16:9 Feynman Videos:</strong> Concepts IT s3ab mfassrin fi 5 d9aye9 bel lahja mte3na.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black shrink-0">
                      ✓
                    </span>
                    <span>
                      <strong>Video-Watch Lock:</strong> Tfarrej fil video bech t-unlooki l-WhatsApp mte3ou direct blech $0.
                    </span>
                  </div>
                </div>
              </div>

              {/* SINGLE 1-TAP AUTHENTICATION TARGET */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3.5">
                {feedbackMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      feedbackMsg.type === 'error'
                        ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                        : feedbackMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {feedbackMsg.text}
                  </div>
                )}

                {user ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                      ✅ Enti connecti tawa ya {user.name || 'Peer'}!
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('feed')}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black shadow-md cursor-pointer transition-all"
                    >
                      🚀 Chouf el Feed tawa direct →
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      id="btn-google-login"
                      onClick={handleGoogleLogin}
                      className="w-full py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-black tracking-wide shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer border border-indigo-500"
                    >
                      <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="font-black text-sm">💬 Edkhel bel Google mte3ek tawa direct</span>
                    </button>

                    <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400 font-medium">
                      🔒 0-Friction Access. Blech mot de passe w blech flous ($0).
                    </p>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('feed')}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        T7eb tchouf el feed se3a? Chouf les mentors houni →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          ) : activeTab === 'dashboard' ? (
            /* ================================================================ */
            /* VIEW: DASHBOARD                                                  */
            /* ================================================================ */
            <section className="space-y-4 animate-fadeIn">
              {user ? (
                <>
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-zinc-900 dark:text-white">{user.name}</h2>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {user.role === 'mentor' ? '🛠️ Peer Mentor IT' : '🎓 Active Peer'}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[180px]">
                            {user.email || 'Compte Google vérifié'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>

                  {/* Creator Engine Shortcut */}
                  <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden border border-indigo-500/40 space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold tracking-wide">
                      ✨ Peer Creator Engine
                    </span>
                    <div>
                      <h3 className="text-base font-black leading-tight text-white">Abda share el knowledge mte3ek</h3>
                      <p className="text-xs text-indigo-100 leading-relaxed mt-1">
                        Baddel statut mte3ek men viewer l-creator: 7ot des liens Drive/GitHub w video YouTube 16:9 bel Tounsi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCreatorModal}
                      className="w-full py-3 px-4 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <span className="text-lg leading-none font-black text-indigo-600">＋</span>
                      <span>Abda share el knowledge mte3ek →</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 text-center shadow-sm space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-inner">
                    👤
                  </div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white">Espace Compte Mentorini</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] mx-auto">
                    Dkhol bel Google mte3ek bech t-partagi l-knowledge w t-gérer l-statut mte3ek.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>💬 Edkhel bel Google mte3ek tawa direct →</span>
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{watchedVideos.size}</span>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Videos Unlocked</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Concepts mtfarrej fehom</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl font-black text-emerald-500">{mentors.length}</span>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Peer Mentors</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Fil IT w Bac Info</p>
                </div>
              </div>
            </section>
          ) : activeTab === 'idea' ? (
            /* ================================================================ */
            /* VIEW: IDEA & EQUALITY MANIFESTO                                  */
            /* ================================================================ */
            <section className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-800/60 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-mono font-black uppercase">
                  🇹🇳 The Mentorini Vision
                </div>
                <h2 className="text-base font-black">
                  Saving your Time and Energy by grouping filtered peer mentors in one click instead of searching the endless sea of YouTube.
                </h2>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Fi Tounes, el talba wel élèves ydhay3ou ayyamet kemla fil b7ar mta3 YouTube 3la chahrin bech yefhmou concept kima Recursion wala Dynamic Programming. Mentorini te9di 3la hedha bil Feynman Technique bel Tounsi w direct WhatsApp access.
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
                <h3 className="font-black text-zinc-900 dark:text-zinc-100">Les 3 Principes Fondateurs :</h3>
                <div className="space-y-2">
                  <p>
                    <strong>1. Instagram Equality :</strong> Ma famech barrier bin mentee w mentor. Ay we7ed 3andou concept fehmou ynajjem y-partagih bil bouton (+).
                  </p>
                  <p>
                    <strong>2. 16:9 Horizontal Videos :</strong> Videos claires, sghira (5 d9aye9), tfasser concept wa7ed sans blabla.
                  </p>
                  <p>
                    <strong>3. Video-Watch Lock :</strong> L-bouton mta3 WhatsApp mayet7alech ella ma tchouf el video, bech ykoun contact serieux w fi wa9tou.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            /* ================================================================ */
            /* VIEW 2: UNIVERSAL FEED VIEW                                      */
            /* ================================================================ */
            <section className="space-y-4 animate-fadeIn">
              {/* Micro-Banner */}
              <div className="bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    T7eb tadhrob el blocker mte3ek fi draj?
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Houni lma3nelkom el peer mentors el kol fi blassa we7da.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreatorModal}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-black text-xs shadow-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-sm font-black">＋</span>
                  <span>Abda Share</span>
                </button>
              </div>

              {/* Feed Header */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Peer Mentors Mawjoudin ({mentors.length})
                </h2>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Database
                </span>
              </div>

              {/* Mentors Card Grid */}
              <div className="space-y-4">
                {mentors.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Ma famech mentors l-tawa!</p>
                    <p>Koun enti awwel mentor y-partagi el knowledge mte3ou.</p>
                    <button
                      type="button"
                      onClick={openCreatorModal}
                      className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                    >
                      ＋ Abda Share El Knowledge
                    </button>
                  </div>
                ) : (
                  mentors.map((mentor) => {
                    const videoId = extractYouTubeId(mentor.video_url || mentor.youtube_url);
                    const isUnlocked = watchedVideos.has(String(mentor.id));
                    const cleanCategory = mentor.category ? mentor.category.toUpperCase().replace('_', ' ') : 'IT';

                    return (
                      <article
                        key={mentor.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
                      >
                        {/* Header */}
                        <div className="p-4 pb-2.5 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => setActiveProfileId(String(mentor.id))}
                              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 cursor-pointer"
                            >
                              {(mentor.name || 'M').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3
                                  onClick={() => setActiveProfileId(String(mentor.id))}
                                  className="font-black text-sm text-zinc-900 dark:text-zinc-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer truncate"
                                >
                                  {mentor.name}
                                </h3>
                                {mentor.isFlagship && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800">
                                    ★ Flagship
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                                {mentor.status || 'Peer Mentor IT'}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                            {cleanCategory}
                          </span>
                        </div>

                        {/* 16:9 Horizontal YouTube Video Container */}
                        <div className="px-4 pb-3">
                          {videoId ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors shadow-inner">
                              {isUnlocked ? (
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                                    videoId
                                  )}?rel=0&modestbranding=1`}
                                  title="Feynman Concept Video"
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div
                                  onClick={() => handleUnlockVideo(String(mentor.id))}
                                  className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950/90 hover:bg-zinc-900 transition-colors cursor-pointer p-4 text-center group/play"
                                >
                                  <div className="absolute top-2.5 left-2.5 z-10 bg-black/80 text-zinc-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-zinc-800 truncate max-w-[85%]">
                                    Feynman: {mentor.feynman_topic || 'Concept IT bel Tounsi'}
                                  </div>
                                  <div className="w-12 h-12 rounded-full bg-red-600 group-hover/play:scale-110 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-transform mb-2">
                                    <span className="text-white text-base font-black ml-0.5">▶</span>
                                  </div>
                                  <p className="text-xs font-black text-white">Tfarrej fil Concept (16:9 bel Tounsi)</p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">
                                    🔒 Click bech t-unlooki l-WhatsApp mte3ou direct
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                              <p className="line-clamp-2">
                                {mentor.bio
                                  ? renderBioWithChips(mentor.bio)
                                  : 'Peer mentor ready to share knowledge and help via WhatsApp direct.'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bio snippet if video exists */}
                        {videoId && mentor.bio && (
                          <div className="px-4 pb-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <p className="line-clamp-2">{renderBioWithChips(mentor.bio)}</p>
                          </div>
                        )}

                        {/* WhatsApp CTA governed by Video-Watch Lock */}
                        <div className="px-4 pb-3.5 pt-1">
                          {!videoId || isUnlocked ? (
                            <button
                              type="button"
                              onClick={() =>
                                openWhatsAppChat(
                                  mentor.whatsapp_number || mentor.phone,
                                  mentor.name,
                                  mentor.feynman_topic
                                )
                              }
                              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 cursor-pointer"
                            >
                              <span className="text-base leading-none">💬</span>
                              <span className="font-black text-xs">Connecti m3ah tawa direct</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold text-xs py-3.5 px-4 rounded-xl cursor-not-allowed border border-zinc-200 dark:border-zinc-800"
                              title="Tfarrej fil video bech t-unlocki l-bouton"
                            >
                              <span className="text-sm">🔒</span>
                              <span className="font-bold text-xs">Tfarrej fil video bech tconnecti</span>
                            </button>
                          )}
                        </div>

                        {/* Footer link to full profile */}
                        <div
                          onClick={() => setActiveProfileId(String(mentor.id))}
                          className="px-4 py-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 text-xs bg-zinc-50/60 dark:bg-zinc-900/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                        >
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            {videoId ? (isUnlocked ? '🔓 Video Mtfarrej Fih' : '🔒 Video-Watch Lock') : '💬 Direct Contact'}
                          </span>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <span>Chouf l-Profile Kamel</span>
                            <span>→</span>
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </main>

        {/* ==================================================================== */}
        {/* VIEW 3: THE CREATOR MODAL OVERLAY ("Abda share el knowledge mte3ek") */}
        {/* ==================================================================== */}
        {isCreatorModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
              className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    <span className="text-indigo-600 dark:text-indigo-400">✨</span>
                    <span>Abda share el knowledge mte3ek</span>
                  </h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Baddel statut mte3ek men viewer l-creator w 3awen wled bledna 🇹🇳
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatorModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    feedbackMsg.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                      : feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <form onSubmit={handleCreatorSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Bio & Resources (Drive / GitHub / Notion) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={creatorBio}
                    onChange={(e) => setCreatorBio(e.target.value)}
                    placeholder="Fasser chnowa tnajjem t3awen fih w 7ot des liens Drive/GitHub mte3ek houni (Ex: N3awen fi Algo w Python Bac Info. Heda dossier el cours: https://drive.google.com/... w code: https://github.com/...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                    💡 Les liens Drive, GitHub w Notion yetbadlou automatiquemenet en boutons cliquables.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Lien YouTube Feynman Video (Format 16:9 Horizontal) 📺
                  </label>
                  <input
                    type="url"
                    value={creatorVideoUrl}
                    onChange={(e) => setCreatorVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... wala https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                    Format 16:9 horizontal — Feynman concept video bel Tounsi (5 d9aye9).
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatorModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🚀</span>
                    <span>{isSubmitting ? 'Sync...' : 'Partagi fil Feed'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* MOBILE HARDWARE NAVIGATION OVERRIDES (SAFE AREA FIX)                 */}
        {/* ==================================================================== */}
        <nav
          id="app-navigation"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-surfaceDark/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800/80 px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] flex justify-between items-center z-40 md:rounded-b-[28px]"
        >
          <button
            onClick={() => {
              setActiveProfileId(null);
              setActiveTab('feed');
            }}
            id="nav-feed"
            className={`text-xs font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'feed' && !activeProfileId ? 'text-indigoNeon font-black scale-105' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Feed
          </button>

          <button
            onClick={() => {
              setActiveProfileId(null);
              setActiveTab('onboarding');
            }}
            id="nav-onboarding"
            className={`text-xs font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'onboarding' ? 'text-indigoNeon font-black scale-105' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Intro
          </button>

          {/* Central Prominent '+' Creator Button */}
          <button
            onClick={openCreatorModal}
            id="nav-create-plus"
            title="Abda share el knowledge mte3ek (+)"
            className="w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-midnight"
          >
            ＋
          </button>

          <button
            onClick={() => {
              setActiveProfileId(null);
              setActiveTab('dashboard');
            }}
            id="nav-dashboard"
            className={`text-xs font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'dashboard' ? 'text-indigoNeon font-black scale-105' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              setActiveProfileId(null);
              setActiveTab('idea');
            }}
            id="nav-idea"
            className={`text-xs font-mono font-bold cursor-pointer transition-colors ${
              activeTab === 'idea' ? 'text-indigoNeon font-black scale-105' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Idea
          </button>
        </nav>

      </div>
    </div>
  );
}
