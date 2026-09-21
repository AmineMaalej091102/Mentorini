import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Compass,
  Plus,
  Play,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  X,
  Sparkles,
  CheckCircle2,
  LogOut,
  Zap,
  User as UserIcon,
} from 'lucide-react';

const SUPABASE_URL = 'https://quweyaxneqyyjfhhccbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
  avatar_url?: string;
  created_at?: string;
}

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
  },
  {
    id: 'seed-mentor-3',
    name: 'Amine Khemir',
    email: 'amine.khemir@ensi.tn',
    phone: '21622334455',
    whatsapp_number: '21622334455',
    status: 'ENSI Student • Algorithms Lead',
    role: 'mentor',
    bio: 'Dynamic Programming w Complexity O(N) fassarnehom fi 5 d9aye9. Check out notions: https://notion.site/algo-amine-tn',
    video_url: 'https://www.youtube.com/watch?v=HGTJBPNC-Gw',
    feynman_topic: 'Dynamic Programming bel Tounsi',
    category: 'DATA_STRUCTURES',
    created_at: '2026-03-03T12:00:00Z',
  },
];

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match && match[1] ? match[1] : null;
}

function cleanPhoneNumber(phone?: string | null): string {
  let cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 8) cleaned = '216' + cleaned;
  else if (cleaned.startsWith('00216')) cleaned = cleaned.substring(2);
  return cleaned || '21698765432';
}

function openWhatsAppChat(phone?: string | null, mentorName?: string, topic?: string) {
  const sanitized = cleanPhoneNumber(phone);
  const firstName = mentorName ? mentorName.split(' ')[0] : 'Mentor';
  const message = `3aslema ya ${firstName}! 👋 Choft profil mte3ek 3la Mentorini mta3 "${topic || 'Concept IT'}". 3andi blocker 9sir w 7abit nestachirek!`;
  window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

function renderBioWithChips(text?: string) {
  if (!text) return <span className="text-zinc-400 italic">Ma famech bio maktouba l-tawa.</span>;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
          let label = 'Lien';
          if (part.includes('drive.google')) label = 'Google Drive';
          else if (part.includes('github.com')) label = 'GitHub';
          else if (part.includes('notion')) label = 'Notion';
          else if (part.includes('youtube.com') || part.includes('youtu.be')) label = 'Video 16:9';
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] hover:underline mx-0.5"
            >
              {label} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [profileState, setProfileState] = useState<MentoriniUser | null>(null);
  const [mentors, setMentors] = useState<MentoriniUser[]>(SEED_MENTORS);
  const [currentPath, setCurrentPath] = useState<'feed' | 'profile'>('feed');
  const [selectedMentor, setSelectedMentor] = useState<MentoriniUser | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const navigate = useCallback((targetPath: 'feed' | 'profile', replace = false) => {
    const fullPath = `/${targetPath}`;
    if (replace) {
      window.history.replaceState({}, document.title, fullPath);
    } else {
      window.history.pushState({}, document.title, fullPath);
    }
    setCurrentPath(targetPath);
    setSelectedMentor(null);
  }, []);

  const hydrateUserProfile = useCallback(async (userId: string, email?: string, metadata?: any) => {
    try {
      if (email) {
        const { data: profileByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (profileByEmail) {
          setProfileState(profileByEmail);
          setBioInput(profileByEmail.bio || '');
          setVideoUrlInput(profileByEmail.video_url || profileByEmail.youtube_url || '');
          return profileByEmail;
        }
      }

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

      const generatedProfile: MentoriniUser = {
        id: userId,
        email: email || '',
        name: metadata?.full_name || metadata?.name || email?.split('@')[0] || 'Peer Creator',
        avatar_url: metadata?.avatar_url || metadata?.picture || '',
        status: 'Peer Member IT',
        role: 'member',
        bio: '',
        video_url: '',
        created_at: new Date().toISOString(),
      };

      setProfileState(generatedProfile);
      setBioInput('');
      setVideoUrlInput('');
      return generatedProfile;
    } catch {
      const fallbackProfile: MentoriniUser = {
        id: userId,
        email: email || '',
        name: metadata?.full_name || 'Peer Creator',
        avatar_url: metadata?.avatar_url || metadata?.picture || '',
        status: 'Peer Member IT',
        role: 'member',
        bio: '',
        video_url: '',
      };
      setProfileState(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  const fetchMentorsCatalog = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        const mapped: MentoriniUser[] = data.map((u: any) => ({
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
          avatar_url: u.avatar_url || '',
          created_at: u.created_at || new Date().toISOString(),
        }));
        setMentors(mapped);
      } else {
        setMentors(SEED_MENTORS);
      }
    } catch {
      setMentors(SEED_MENTORS);
    }
  }, []);

  useEffect(() => {
    fetchMentorsCatalog();

    const handleInitialAuth = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
          await hydrateUserProfile(data.session.user.id, data.session.user.email, data.session.user.user_metadata);
          window.history.replaceState({}, document.title, '/feed');
          setCurrentPath('feed');
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        await hydrateUserProfile(data.session.user.id, data.session.user.email, data.session.user.user_metadata);
        if (window.location.pathname === '/profile') {
          setCurrentPath('profile');
        } else {
          setCurrentPath('feed');
          window.history.replaceState({}, document.title, '/feed');
        }
      }
    };

    handleInitialAuth();

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        setUser(session.user);
        await hydrateUserProfile(session.user.id, session.user.email, session.user.user_metadata);
        await fetchMentorsCatalog();
        if (window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, '/feed');
        }
        if (event === 'SIGNED_IN') {
          window.history.replaceState({}, document.title, '/feed');
          setCurrentPath('feed');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfileState(null);
        window.history.replaceState({}, document.title, '/');
      }
    });

    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p === '/profile' ? 'profile' : 'feed');
      setSelectedMentor(null);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      authSub?.subscription?.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fetchMentorsCatalog, hydrateUserProfile]);

  const loginWithGoogle = async () => {
    setFeedback({ type: 'info', message: 'Connexion bel Google direct...' });
    try {
      const targetRedirect = `${window.location.origin}/feed`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetRedirect,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erreur: ${err?.message || 'Connexion impossible'}` });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn(err);
    }
    setUser(null);
    setProfileState(null);
    window.history.replaceState({}, document.title, '/');
  };

  const handleOpenCreatorModal = () => {
    if (!user) {
      loginWithGoogle();
      return;
    }
    setBioInput(profileState?.bio || '');
    setVideoUrlInput(profileState?.video_url || profileState?.youtube_url || '');
    setFeedback(null);
    setIsCreatorModalOpen(true);
  };

  const handleCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedBio = bioInput.trim();
    const trimmedVideoUrl = videoUrlInput.trim();

    if (!trimmedBio) {
      setFeedback({ type: 'error', message: 'A3mel bio 9sira w 7ot feha chnowa tnajjem t3awen.' });
      return;
    }

    setIsSavingProfile(true);
    setFeedback({ type: 'info', message: 'Syncing fil cloud...' });

    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: trimmedBio, video_url: trimmedVideoUrl })
        .eq('id', user.id);

      if (error) {
        await supabase
          .from('users')
          .update({ bio: trimmedBio, video_url: trimmedVideoUrl })
          .eq('email', user.email);
      }

      await hydrateUserProfile(user.id, user.email, user.user_metadata);
      await fetchMentorsCatalog();

      setFeedback({ type: 'success', message: 'L-knowledge mte3ek t-partaga fil base!' });
      setTimeout(() => {
        setIsCreatorModalOpen(false);
        navigate('profile');
      }, 400);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Erreur: ${err?.message || 'A3wed jarreb'}` });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || profileState?.avatar_url;
  const userInitials = (profileState?.name || user?.user_metadata?.full_name || user?.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-950 font-sans">
      <div className="relative w-full max-w-[480px] h-screen max-h-[920px] bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col md:rounded-[32px] md:border border-zinc-200 dark:border-zinc-800">
        
        {/* =========================================================================
            ABSOLUTE RENDER GATE:
            IF !user -> Suppress Navigation Bar & Header. Render ONLY Login & Manifesto.
            IF user  -> Destroy Onboarding View & Sign-In Button. Render ONLY Main App.
           ========================================================================= */}
        {!user ? (
          <main
            id="auth-viewport"
            style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
            className="flex-1 overflow-y-auto p-5 flex flex-col justify-between"
          >
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between mb-2 ${
                  feedback.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                    : feedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                <span>{feedback.message}</span>
                <button onClick={() => setFeedback(null)} className="cursor-pointer ml-2">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  mentorini<span className="text-indigo-600">.</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Zero-Fee IT 🇹🇳
                </span>
              </div>
            </div>

            <div className="my-auto py-4 space-y-4">
              <div className="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/40 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Peer-Mentorship fi Tounes</span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.25]">
                  Erba7 a3az zouz 7weyej 3andek: <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                    Wa9tek w l&apos;Energie mte3ek.
                  </span>
                </h1>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                  Fi 3oudh ma tdhi3 fi <strong className="text-zinc-900 dark:text-zinc-100 font-bold">b7ar YouTube</strong> mta3 50 sa3a w forums 9dom w ma ta3rafch chkoun tsada9, l9inalek <span className="underline decoration-indigo-400 decoration-2 font-bold text-zinc-900 dark:text-zinc-100">peer mentors mfiltrin b clique wa7da</span>.
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900 dark:text-white font-bold">Feynman Technique:</strong> Kol mentor yfassar concept fi video 9sira bel Tounsi mte3na.</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900 dark:text-white font-bold">Zero-Lock Discovery:</strong> Tfarrej direct f l-video 16:9 fi wost el feed blech ta39id.</span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong className="text-zinc-900 dark:text-white font-bold">100% Free & Direct:</strong> Zero intermediation ($0). Deep-link direct lel WhatsApp mta3 l-mentor.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-black text-sm py-4 px-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Edkhel bel Google direct</span>
              </button>
              <p className="text-center text-[11px] text-zinc-500 font-medium">
                Connexion instantanée sécurisée • Zero mot de passe
              </p>
            </div>
          </main>
        ) : (
          <>
            {/* TOP APPLICATION HEADER */}
            <header className="w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-3.5 flex justify-between items-center sticky top-0 z-40">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('feed')}
              >
                <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                  mentorini<span className="text-indigo-600">.</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  100% Free 🇹🇳
                </span>
              </div>

              <div
                onClick={() => navigate('profile')}
                className="flex items-center gap-2 cursor-pointer"
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt="Google Profile"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-indigo-500 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {userInitials}
                  </div>
                )}
              </div>
            </header>

            {/* MAIN APP VIEWPORT */}
            <main
              id="app-viewport"
              style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    feedback.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                      : feedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <span>{feedback.message}</span>
                  <button onClick={() => setFeedback(null)} className="cursor-pointer ml-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* VIEW: CREATOR INDEPENDENT PROFILE (Opened from feed) */}
              {selectedMentor ? (
                <section className="space-y-4">
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer py-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Rja3 lel Feed</span>
                  </button>

                  <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3.5">
                      {selectedMentor.avatar_url ? (
                        <img
                          src={selectedMentor.avatar_url}
                          alt={selectedMentor.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover shadow-md shrink-0 border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                          {(selectedMentor.name || 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                          {selectedMentor.name}
                        </h2>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {selectedMentor.status || 'Peer Mentor IT'}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                          {selectedMentor.category ? selectedMentor.category.replace('_', ' ') : 'Peer IT'}
                        </span>
                      </div>
                    </div>

                    {extractYouTubeId(selectedMentor.video_url || selectedMentor.youtube_url) && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700 shadow-inner">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                            extractYouTubeId(selectedMentor.video_url || selectedMentor.youtube_url)!
                          )}?autoplay=1&rel=0&modestbranding=1`}
                          title={selectedMentor.name}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Bio & Resources
                      </h3>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {renderBioWithChips(selectedMentor.bio)}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        openWhatsAppChat(
                          selectedMentor.whatsapp_number || selectedMentor.phone,
                          selectedMentor.name,
                          selectedMentor.feynman_topic
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Connecti m3ah direct 3la WhatsApp</span>
                    </button>
                  </div>
                </section>
              ) : currentPath === 'feed' ? (
                /* VIEW: '/feed' - STREAMLINED 16:9 GRID FEED (NO WATCH-LOCK) */
                <section className="space-y-4">
                  <div className="space-y-4">
                    {mentors.map((mentor) => {
                      const videoId = extractYouTubeId(mentor.video_url || mentor.youtube_url);
                      const isPlaying = playingVideoId === mentor.id;

                      return (
                        <article
                          key={mentor.id}
                          className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
                        >
                          <div
                            onClick={() => setSelectedMentor(mentor)}
                            className="p-3.5 pb-2.5 flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              {mentor.avatar_url ? (
                                <img
                                  src={mentor.avatar_url}
                                  alt={mentor.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                                  {(mentor.name || 'M').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <h3 className="font-black text-xs text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {mentor.name}
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                  {mentor.status || 'Peer Mentor IT'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                              Profil ↗
                            </span>
                          </div>

                          <div className="px-3.5 pb-3">
                            {videoId ? (
                              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                {isPlaying ? (
                                  <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                                      videoId
                                    )}?autoplay=1&rel=0&modestbranding=1`}
                                    title={mentor.name}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <div
                                    onClick={() => setPlayingVideoId(mentor.id)}
                                    className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 group cursor-pointer"
                                  >
                                    <img
                                      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                      alt={mentor.name}
                                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                                    />
                                    <div className="relative z-10 w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/50 group-hover:scale-110 transition-transform">
                                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                onClick={() => setSelectedMentor(mentor)}
                                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
                              >
                                {renderBioWithChips(mentor.bio)}
                              </div>
                            )}
                          </div>

                          {videoId && mentor.bio && (
                            <div className="px-3.5 pb-3 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                              {renderBioWithChips(mentor.bio)}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : (
                /* VIEW: '/profile' - PROFILE ACCOUNT & CONTENT MANAGER */
                <section className="space-y-4">
                  <div className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt="Google Profile"
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-2xl object-cover shadow-md border border-indigo-500"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                            {userInitials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="text-sm font-black text-zinc-900 dark:text-white truncate">
                            {profileState?.name || user.user_metadata?.full_name || 'Peer Creator'}
                          </h2>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {user.email}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Compte Google Vérifié
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSignOut}
                        className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Khrouj</span>
                      </button>
                    </div>

                    {extractYouTubeId(profileState?.video_url || profileState?.youtube_url) ? (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Video 16:9 Mte3ek
                        </h3>
                        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-700 shadow-inner">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(
                              extractYouTubeId(profileState?.video_url || profileState?.youtube_url)!
                            )}?rel=0`}
                            title="My Video Preview"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-1">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Ma zelt ma 7attitech video 16:9!
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Enzel 3la [+] l-louta bech tzid lien YouTube w t-partagi l-knowledge.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          Bio & Liens mte3ek
                        </h3>
                        <button
                          onClick={handleOpenCreatorModal}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Baddel ✎
                        </button>
                      </div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {profileState?.bio ? (
                          renderBioWithChips(profileState.bio)
                        ) : (
                          <span className="italic text-zinc-400">Faragh. Enzel 3la [+] bech t3ammer el bio mte3ek.</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tbadil el Bio w Video YouTube</span>
                      </h3>

                      <form onSubmit={handleCreatorSubmit} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                            Bio & Liens (Drive / GitHub / Notion)
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={bioInput}
                            onChange={(e) => setBioInput(e.target.value)}
                            placeholder="Chnowa tnajjem t3awen w les liens mte3ek..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                            Lien YouTube 16:9 (Horizontal)
                          </label>
                          <input
                            type="url"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSavingProfile ? 'Enregistrement fil base...' : 'Sauvegarder mon profil'}
                        </button>
                      </form>
                    </div>
                  </div>
                </section>
              )}
            </main>

            {/* CREATOR UPDATE MODAL OVERLAY */}
            {isCreatorModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div
                  style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
                  className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Abda share el knowledge mte3ek</span>
                    </h2>
                    <button
                      onClick={() => setIsCreatorModalOpen(false)}
                      className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreatorSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        Bio & Liens (Drive / GitHub / Notion) *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={bioInput}
                        onChange={(e) => setBioInput(e.target.value)}
                        placeholder="Chnowa tnajjem t3awen w les liens mte3ek (Drive, GitHub, Notion)..."
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                        Lien YouTube 16:9 (Horizontal)
                      </label>
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatorModalOpen(false)}
                        className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black shadow cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfile ? 'Syncing...' : 'Partagi'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <nav
              id="app-navigation"
              style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
              className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800/80 px-8 pt-3 flex justify-between items-center z-40 md:rounded-b-[28px]"
            >
              {/* 1. Explore/Feed Grid Icon */}
              <button
                onClick={() => navigate('feed')}
                id="nav-explore-feed"
                aria-label="Explore Feed"
                className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                  currentPath === 'feed' && !selectedMentor
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 scale-105'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Compass className="w-5 h-5" />
              </button>

              {/* 2. [+] Upload Icon */}
              <button
                onClick={handleOpenCreatorModal}
                id="nav-creator-upload"
                aria-label="Add Content"
                className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-zinc-900"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* 3. Google Profile Avatar / Initials */}
              <button
                onClick={() => navigate('profile')}
                id="nav-profile-avatar"
                aria-label="My Profile"
                className={`p-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                  currentPath === 'profile' && !selectedMentor
                    ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-105'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt="Google Profile"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                )}
              </button>
            </nav>
          </>
        )}

      </div>
    </div>
  );
}
