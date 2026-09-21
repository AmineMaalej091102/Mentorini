import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================
const SUPABASE_URL = 'https://quweyaxneqyyjfhhccbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// Fallback seed mentors for offline/migration resilience
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
    bio: 'Specialiste Web (FastAPI, React) w Python pour Bac Info. Code source w examens: https://github.com/sarra-dev/bac-info-python',
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

// Helper: Interactive Drive / GitHub / Notion resource chips
function renderBioWithChips(text?: string) {
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
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function App() {
  // 1. Technical Flow & State Matching
  const [user, setUser] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem('mentorini_user_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Dedicated profileState hook mapped directly to verified public 'users' table
  const [profileState, setProfileState] = useState<MentoriniUser | null>(() => {
    try {
      const saved = localStorage.getItem('mentorini_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mentors, setMentors] = useState<MentoriniUser[]>(SEED_MENTORS);
  // Three core functional views: 'feed', 'dashboard', 'profile'
  const [activeTab, setActiveTab] = useState<'feed' | 'dashboard' | 'profile'>('feed');
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mentorini_watched_videos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Creator Modal States
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // General Notification / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Theme Management (Nighttime & System)
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>('system');

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

  // Persist local session caches
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('mentorini_user_auth', JSON.stringify(user));
      } else {
        localStorage.removeItem('mentorini_user_auth');
      }
      if (profileState) {
        localStorage.setItem('mentorini_user_profile', JSON.stringify(profileState));
      } else {
        localStorage.removeItem('mentorini_user_profile');
      }
    } catch (e) {
      console.warn(e);
    }
  }, [user, profileState]);

  useEffect(() => {
    try {
      localStorage.setItem('mentorini_watched_videos', JSON.stringify(Array.from(watchedVideos)));
    } catch (e) {
      console.warn(e);
    }
  }, [watchedVideos]);

  // Fetch Public Users Catalog
  const fetchMentorsCatalog = useCallback(async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData && usersData.length > 0 && !error) {
        const mapped: MentoriniUser[] = usersData.map((u: any) => ({
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
        setMentors(mapped);
      } else {
        setMentors(SEED_MENTORS);
      }
    } catch (err) {
      console.warn('Live fetch error, falling back to seed mentors:', err);
      setMentors(SEED_MENTORS);
    }
  }, []);

  // Fetch verified single profile record for active user
  const fetchActiveUserProfile = useCallback(async (userId: string, fallbackEmail?: string, fallbackName?: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        setProfileState(profile);
        setBioInput(profile.bio || '');
        setVideoUrlInput(profile.video_url || profile.youtube_url || '');
        return profile;
      }

      // Fallback lookup via email if user row was seeded with email key
      if (fallbackEmail) {
        const { data: profileByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', fallbackEmail)
          .single();

        if (profileByEmail) {
          setProfileState(profileByEmail);
          setBioInput(profileByEmail.bio || '');
          setVideoUrlInput(profileByEmail.video_url || profileByEmail.youtube_url || '');
          return profileByEmail;
        }
      }

      // Default synthetic profile
      const defaultProfile: MentoriniUser = {
        id: userId,
        email: fallbackEmail || '',
        name: fallbackName || 'Peer Member',
        status: 'Active Member',
        role: 'mentee',
        bio: '',
        video_url: '',
      };
      setProfileState(defaultProfile);
      return defaultProfile;
    } catch (err) {
      console.warn('Profile fetch error:', err);
      const defaultProfile: MentoriniUser = {
        id: userId,
        email: fallbackEmail || '',
        name: fallbackName || 'Peer Member',
        status: 'Active Member',
        role: 'mentee',
        bio: '',
        video_url: '',
      };
      setProfileState(defaultProfile);
      return defaultProfile;
    }
  }, []);

  // Supabase Auth & Session Observer
  useEffect(() => {
    fetchMentorsCatalog();

    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event: string, session: any) => {
      if (session?.user) {
        setUser(session.user);
        await fetchActiveUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata?.full_name
        );
        await fetchMentorsCatalog();
      } else {
        setUser(null);
        setProfileState(null);
      }
    });

    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, [fetchMentorsCatalog, fetchActiveUserProfile]);

  // Google 1-Tap OAuth Action
  const handleGoogleLogin = async () => {
    setFeedback({ type: 'info', message: '⏳ Connexion bel Google mte3ek tawa direct...' });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `⚠️ Mochkla fi Google Login: ${err?.message || 'Thabbet fil connexion mte3ek.'}`,
      });
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
    setProfileState(null);
    setActiveTab('feed');
  };

  // Video-Watch Lock Action
  const handleUnlockVideo = (mentorId: string) => {
    setWatchedVideos((prev) => {
      const next = new Set(prev);
      next.add(mentorId);
      return next;
    });
  };

  // Open the Floating '+' Creator Modal
  const handleOpenCreatorModal = () => {
    if (!user) {
      const wantLogin = window.confirm(
        'Lazmek tkoun connecti bel Google mte3ek se3a bech t-partagi! T7eb tconnecti tawa direct?'
      );
      if (wantLogin) {
        handleGoogleLogin();
      }
      return;
    }
    setBioInput(profileState?.bio || '');
    setVideoUrlInput(profileState?.video_url || profileState?.youtube_url || '');
    setFeedback(null);
    setIsCreatorModalOpen(true);
  };

  // The Patch Query: Submitting Modal executes supabase update & instant re-fetch
  const handleCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedBio = bioInput.trim();
    const trimmedVideoUrl = videoUrlInput.trim();

    if (!trimmedBio) {
      setFeedback({
        type: 'error',
        message: '⚠️ A3mel bio 9sira w 7ot feha chnowa tnajjem t3awen w les liens Drive/GitHub mte3ek.',
      });
      return;
    }

    setIsSavingProfile(true);
    setFeedback({ type: 'info', message: '⏳ 9a3din n-syncou fil knowledge mte3ek fil cloud...' });

    try {
      // Direct patch query requirement:
      // await supabase.from("users").update({ bio, video_url: videoUrl }).eq("id", user.id);
      const { error } = await supabase
        .from('users')
        .update({
          bio: trimmedBio,
          video_url: trimmedVideoUrl,
        })
        .eq('id', user.id);

      if (error) {
        console.warn('Update by id warning, attempting fallback by email:', error);
        await supabase
          .from('users')
          .update({
            bio: trimmedBio,
            video_url: trimmedVideoUrl,
          })
          .eq('email', user.email);
      }

      // Re-fetch data from Supabase immediately so user profile card updates instantly without reloading
      await fetchActiveUserProfile(user.id, user.email, user.user_metadata?.full_name);
      await fetchMentorsCatalog();

      setFeedback({
        type: 'success',
        message: '🚀 Sa77a! L-knowledge mte3ek t-partaga w profil mte3ek t-updata tawa direct!',
      });

      setTimeout(() => {
        setIsCreatorModalOpen(false);
        setActiveTab('profile');
      }, 600);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `⚠️ Mochkla fil mise à jour: ${err?.message || 'A3wed jarreb mara okhra.'}`,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-gray-900 dark:text-gray-100 bg-zinc-100 dark:bg-zinc-950 font-sans">
      <div className="relative w-full max-w-[480px] h-screen max-h-[900px] bg-white dark:bg-midnight shadow-2xl overflow-hidden flex flex-col md:rounded-[32px] md:border-4 border-gray-200 dark:md:border-gray-800 transition-colors duration-200">
        
        {/* ==================================================================== */}
        {/* HEADER                                                               */}
        {/* ==================================================================== */}
        <header className="w-full bg-white/80 dark:bg-surfaceDark/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60 p-3.5 flex justify-between items-center sticky top-0 z-40">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveTab('feed')}
          >
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              mentorini<span className="text-indigoNeon">.</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              100% Free 🇹🇳
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreatorModal}
              title="Abda share el knowledge mte3ek (+)"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black flex items-center gap-1.5 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="text-sm font-black leading-none">＋</span>
              <span className="text-[11px] font-bold">Share</span>
            </button>

            <select
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
        {/* VIEWPORT ROUTER                                                      */}
        {/* ==================================================================== */}
        <main
          id="app-viewport"
          style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom))' }}
          className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4"
        >
          {/* Global Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-bold transition-all ${
                feedback.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                  : feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* ================================================================== */}
          {/* VIEW 1: FEED                                                       */}
          {/* ================================================================== */}
          {activeTab === 'feed' && (
            <section className="space-y-4 animate-fadeIn">
              {/* Manifesto Card */}
              <div className="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/50 dark:via-zinc-900 dark:to-zinc-950 border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-100/90 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-black uppercase">
                  ✨ Zero-Friction Peer Mentorship
                </div>

                <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-white leading-snug">
                  T7eb tadhrob el blocker mte3ek fi draj? Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek.
                </h1>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Saving your Time and Energy by grouping filtered peer mentors in one click instead of searching the endless sea of YouTube.
                </p>

                {!user && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500"
                  >
                    <span>💬 Edkhel bel Google mte3ek tawa direct</span>
                  </button>
                )}
              </div>

              {/* Feed Directory List */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Peer Mentors Mawjoudin ({mentors.length})
                </h2>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Synced
                </span>
              </div>

              <div className="space-y-4">
                {mentors.map((mentor) => {
                  const videoId = extractYouTubeId(mentor.video_url || mentor.youtube_url);
                  const isUnlocked = watchedVideos.has(String(mentor.id));

                  return (
                    <article
                      key={mentor.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                    >
                      {/* Mentor Card Header */}
                      <div className="p-4 pb-2.5 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                            {(mentor.name || 'M').charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50 truncate">
                              {mentor.name}
                            </h3>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                              {mentor.status || 'Peer Mentor IT'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                          {mentor.category ? mentor.category.replace('_', ' ') : 'IT'}
                        </span>
                      </div>

                      {/* 16:9 Horizontal YouTube Player with Video-Watch Lock */}
                      <div className="px-4 pb-3">
                        {videoId ? (
                          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-inner">
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
                                className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950/90 hover:bg-zinc-900 transition-colors cursor-pointer p-4 text-center group"
                              >
                                <div className="w-12 h-12 rounded-full bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-transform mb-2">
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
                            {renderBioWithChips(mentor.bio)}
                          </div>
                        )}
                      </div>

                      {videoId && mentor.bio && (
                        <div className="px-4 pb-2 text-xs text-zinc-600 dark:text-zinc-300">
                          {renderBioWithChips(mentor.bio)}
                        </div>
                      )}

                      {/* Video-Watch Lock Action Button */}
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
                          >
                            <span className="text-sm">🔒</span>
                            <span className="font-bold text-xs">Tfarrej fil video bech tconnecti</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================================================================== */}
          {/* VIEW 2: DASHBOARD                                                  */}
          {/* ================================================================== */}
          {activeTab === 'dashboard' && (
            <section className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-800/60 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-mono font-black uppercase">
                  🇹🇳 Dashboard & Equality
                </div>
                <h2 className="text-base font-black">
                  Mentorini Ecosystem Analytics
                </h2>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Saving your Time and Energy by grouping filtered peer mentors in one click instead of searching the endless sea of YouTube.
                </p>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{watchedVideos.size}</span>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Videos Unlocked</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Concepts tfarrajt fehom</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                  <span className="text-2xl font-black text-emerald-500">{mentors.length}</span>
                  <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Peer Mentors</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Mawjoudin fil base</p>
                </div>
              </div>

              {/* Fast Action */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                  T7eb t-partagi el knowledge mte3ek?
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Ay etudiant wala eleve ynajjem ykoun peer mentor. Koun partie mel 7arka!
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreatorModal}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>＋</span>
                  <span>Abda share el knowledge mte3ek tawa</span>
                </button>
              </div>
            </section>
          )}

          {/* ================================================================== */}
          {/* VIEW 3: MY PROFILE (PERSONALIZED DATA CARD)                        */}
          {/* ================================================================== */}
          {activeTab === 'profile' && (
            <section className="space-y-4 animate-fadeIn">
              {user ? (
                <>
                  {/* User Header Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                          {(profileState?.name || user.email || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-black text-zinc-900 dark:text-white truncate">
                            {profileState?.name || user.user_metadata?.full_name || 'Peer Creator'}
                          </h2>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {user.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            Verified Cloud Profile 🇹🇳
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        Khrouj
                      </button>
                    </div>
                  </div>

                  {/* Horizontal 16:9 YouTube Video if Posted */}
                  {extractYouTubeId(profileState?.video_url || profileState?.youtube_url) ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm space-y-2">
                      <div className="p-3 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
                        <span className="text-xs font-black">📺 El Video 16:9 Mte3ek Mawjouda</span>
                        <span className="text-xs text-red-500 font-bold">Live 16:9</span>
                      </div>
                      <div className="p-3 pt-0">
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                              extractYouTubeId(profileState?.video_url || profileState?.youtube_url)!
                            )}?rel=0&modestbranding=1`}
                            title="My Video Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-1">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Ma zelt ma 7attitech video YouTube 16:9!
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Zid video tfasser feha concept fi 5 d9aye9 bech t-unlooki l-feed.
                      </p>
                    </div>
                  )}

                  {/* Current Bio & Resources */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-zinc-900 dark:text-white">
                        Bio & Resources mte3ek
                      </h3>
                      <button
                        type="button"
                        onClick={handleOpenCreatorModal}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Baddel (Edit) ✎
                      </button>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {profileState?.bio ? (
                        renderBioWithChips(profileState.bio)
                      ) : (
                        <span className="italic text-zinc-400">
                          Faragh. Enzel 3la "Baddel" wala l-bouton (+) bech t3ammer el bio mte3ek.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Floating Creator Shortcut */}
                  <button
                    type="button"
                    onClick={handleOpenCreatorModal}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <span className="text-base font-black">＋</span>
                    <span>Abda share el knowledge mte3ek (Edit Profile)</span>
                  </button>
                </>
              ) : (
                /* Prompt to login if user accesses My Profile logged out */
                <div className="bg-gradient-to-b from-indigo-50/90 to-white dark:from-indigo-950/40 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mx-auto font-black shadow-inner">
                    👤
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900 dark:text-white">
                      Espace My Profile
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px] mx-auto">
                      Dkhol bel Google mte3ek tawa direct bech tchouf l-profil mte3ek w t-partagi l-knowledge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>💬 Edkhel bel Google mte3ek tawa direct</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </main>

        {/* ==================================================================== */}
        {/* THE CREATOR MODAL OVERLAY ("Abda share el knowledge mte3ek")         */}
        {/* ==================================================================== */}
        {isCreatorModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
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

              <form onSubmit={handleCreatorSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Bio & Resources (Drive / GitHub / Notion) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
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
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
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
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>🚀</span>
                    <span>{isSavingProfile ? 'Syncing...' : 'Partagi fil Feed'}</span>
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
          className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-surfaceDark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800/80 px-6 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] flex justify-between items-center z-40 md:rounded-b-[28px]"
        >
          {/* Option 1: Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            id="nav-feed"
            className={`text-xs font-mono font-bold cursor-pointer transition-all flex flex-col items-center gap-0.5 ${
              activeTab === 'feed'
                ? 'text-indigoNeon font-black scale-105'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>Feed</span>
          </button>

          {/* Central Thumb-Friendly '+' Creator Button */}
          <button
            onClick={handleOpenCreatorModal}
            id="nav-create-plus"
            title="Abda share el knowledge mte3ek (+)"
            className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-midnight"
          >
            ＋
          </button>

          {/* Option 2: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            id="nav-dashboard"
            className={`text-xs font-mono font-bold cursor-pointer transition-all flex flex-col items-center gap-0.5 ${
              activeTab === 'dashboard'
                ? 'text-indigoNeon font-black scale-105'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>Dashboard</span>
          </button>

          {/* Option 3: My Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            id="nav-my-profile"
            className={`text-xs font-mono font-bold cursor-pointer transition-all flex flex-col items-center gap-0.5 ${
              activeTab === 'profile'
                ? 'text-indigoNeon font-black scale-105'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>My Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
