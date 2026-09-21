import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Home, Plus, Play, ExternalLink, MessageCircle, X, LogOut, CheckCircle2, Zap } from 'lucide-react';

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
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  bio?: string;
  video_url?: string;
  category?: string;
}

const SEED_MENTORS: MentoriniUser[] = [
  {
    id: 'seed-1',
    name: 'Mehdi Trabelsi',
    email: 'mehdi.trabelsi@insat.tn',
    phone: '21698765432',
    status: 'INSAT GL3 • Bac Info 18.5',
    bio: 'N3awen fi Recursion, Pointers C/C++, w Trees: https://github.com/mehdi-tn/algo-prep',
    video_url: 'https://www.youtube.com/watch?v=M2_o3o9Yj0E',
    category: 'ALGO_BAC',
  },
  {
    id: 'seed-2',
    name: 'Sarra Ben Mahmoud',
    email: 'sarra.bm@gmail.com',
    phone: '21650123456',
    status: 'Full-Stack Engineer • Python Mentor',
    bio: 'Python Bac Info w FastAPI: https://github.com/sarra-dev/bac-info-python',
    video_url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    category: 'PYTHON_DEV',
  },
  {
    id: 'seed-3',
    name: 'Amine Khemir',
    email: 'amine.khemir@ensi.tn',
    phone: '21622334455',
    status: 'ENSI Student • Algorithms Lead',
    bio: 'Dynamic Programming w Complexity O(N): https://notion.site/algo-amine-tn',
    video_url: 'https://www.youtube.com/watch?v=HGTJBPNC-Gw',
    category: 'DATA_STRUCTURES',
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

function openWhatsAppChat(phone?: string | null, name?: string) {
  let cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 8) cleaned = '216' + cleaned;
  else if (cleaned.startsWith('00216')) cleaned = cleaned.substring(2);
  const firstName = name ? name.split(' ')[0] : 'Mentor';
  const msg = `3aslema ya ${firstName}! 👋 Choft profil mte3ek 3la Mentorini w 7abit nestachirek!`;
  window.open(`https://wa.me/${cleaned || '21698765432'}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function renderBioWithChips(text?: string) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (/^https?:\/\//.test(part)) {
          let label = 'Lien';
          if (part.includes('github.com')) label = 'GitHub';
          else if (part.includes('notion')) label = 'Notion';
          else if (part.includes('drive.google')) label = 'Drive';
          else if (part.includes('youtube.com') || part.includes('youtu.be')) label = 'Video 16:9';
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-800 px-1.5 py-0.5 rounded text-[11px] hover:underline mx-0.5"
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
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');
  const [mentors, setMentors] = useState<MentoriniUser[]>(SEED_MENTORS);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<MentoriniUser | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('video_url', '')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        setMentors(
          data.map((u: any) => ({
            id: String(u.id || u.email || Math.random()),
            name: u.name || u.user_metadata?.full_name || 'Peer Mentor',
            email: u.email || '',
            phone: u.phone || u.whatsapp_number || '',
            status: u.status || 'Peer Mentor IT',
            bio: u.bio || '',
            video_url: u.video_url || u.youtube_url || '',
            category: u.category || 'IT_PEER',
          }))
        );
      } else {
        setMentors(SEED_MENTORS);
      }
    } catch {
      setMentors(SEED_MENTORS);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        setUserProfile(data);
        setBioInput(data.bio || '');
        setVideoUrlInput(data.video_url || data.youtube_url || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', '#090D1A');

    const handleAuthInit = async () => {
      if (window.location.hash.includes('access_token') || window.location.search.includes('code')) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setUser(data.session.user);
          fetchUserProfile(data.session.user.id);
          window.history.replaceState({}, document.title, '/feed');
        }
      }

      const { data: initialSessionData } = await supabase.auth.getSession();
      if (initialSessionData?.session?.user) {
        setUser(initialSessionData.session.user);
        fetchUserProfile(initialSessionData.session.user.id);
      }

      fetchMentors();
    };

    handleAuthInit();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchMentors();
        if (window.location.hash.includes('access_token') || window.location.search.includes('code')) {
          window.history.replaceState({}, document.title, '/feed');
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setActiveTab('feed');
    window.history.replaceState({}, document.title, '/');
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase
        .from('users')
        .update({ bio: bioInput, video_url: videoUrlInput })
        .eq('id', user.id);

      await fetchUserProfile(user.id);
      await fetchMentors();

      setBioInput('');
      setVideoUrlInput('');
      setIsModalOpen(false);
      setActiveTab('feed');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasAccessToken = typeof window !== 'undefined' && window.location.hash.includes('access_token');

  if (!user && !hasAccessToken) {
    return (
      <div className="flex justify-center items-center min-h-screen antialiased text-zinc-100 bg-[#090D1A] font-sans">
        <div className="relative w-full max-w-[480px] h-screen max-h-[920px] bg-zinc-900 shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:rounded-[32px] md:border border-zinc-800">
          <div className="flex items-center gap-2 pt-2">
            <span className="text-2xl font-black tracking-tight text-white">
              mentorini<span className="text-indigo-500">.</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 text-[10px] font-bold">
              Zero-Fee IT 🇹🇳
            </span>
          </div>

          <div className="my-auto py-4 space-y-4">
            <div className="bg-gradient-to-b from-indigo-950/30 via-zinc-900 to-zinc-900 border border-indigo-900/40 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-800">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Peer-Mentorship fi Tounes</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-zinc-50 leading-[1.25]">
                Erba7 a3az zouz 7weyej 3andek: <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  Wa9tek w l&apos;Energie mte3ek.
                </span>
              </h1>

              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Fi 3oudh ma tdhi3 fi <strong className="text-zinc-100 font-bold">b7ar YouTube</strong> mta3 50 sa3a w forums 9dom w ma ta3rafch chkoun tsada9, l9inalek <span className="underline decoration-indigo-400 decoration-2 font-bold text-zinc-100">peer mentors mfiltrin b clique wa7da</span>.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white font-bold">Feynman Technique:</strong> Kol mentor yfassar concept fi video 9sira bel Tounsi mte3na.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white font-bold">Zero-Lock Discovery:</strong> Tfarrej direct f l-video 16:9 fi wost el feed blech ta39id.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong className="text-white font-bold">100% Free & Direct:</strong> Zero intermediation ($0). Deep-link direct lel WhatsApp mta3 l-mentor.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-2">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-black text-sm py-4 px-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] cursor-pointer"
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
        </div>
      </div>
    );
  }

  const userFirstInitial = (user?.user_metadata?.full_name || 'A').trim().charAt(0).toUpperCase() || 'A';
  const userFullName = user?.user_metadata?.full_name || 'Peer Member';
  const userEmail = user?.email || '';

  const userVideoId = extractYouTubeId(userProfile?.video_url);

  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-zinc-100 bg-[#090D1A] font-sans">
      <div className="relative w-full max-w-[480px] h-screen max-h-[920px] bg-zinc-900 shadow-2xl overflow-hidden flex flex-col md:rounded-[32px] md:border border-zinc-800">
        <header className="w-full bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 p-3.5 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <span className="text-xl font-black tracking-tight text-white">
              mentorini<span className="text-indigo-500">.</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 text-[10px] font-bold">
              100% Free 🇹🇳
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Khrouj"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs cursor-pointer shadow-sm"
            >
              {userFirstInitial}
            </div>
          </div>
        </header>

        <main
          style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {activeTab === 'feed' ? (
            <div className="space-y-4">
              {mentors.map((mentor) => {
                const videoId = extractYouTubeId(mentor.video_url);
                const isPlaying = playingVideoId === mentor.id;

                return (
                  <article
                    key={mentor.id}
                    className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="p-3.5 pb-2.5 flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-xs text-zinc-50">
                          {mentor.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {mentor.status || 'Peer Mentor IT'}
                        </p>
                      </div>
                      <button
                        onClick={() => openWhatsAppChat(mentor.phone, mentor.name)}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    <div className="px-3.5 pb-3">
                      {videoId ? (
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-700 shadow-inner">
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
                      ) : null}
                    </div>

                    {mentor.bio && (
                      <div className="px-3.5 pb-3 text-xs text-zinc-300">
                        {renderBioWithChips(mentor.bio)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center font-black text-4xl shadow-xl border-4 border-zinc-800">
                {userFirstInitial}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">
                  {userFullName}
                </h2>
                <p className="text-sm font-semibold text-zinc-400">
                  {userEmail}
                </p>
              </div>

              {userVideoId ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mt-4 shadow-inner">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(userVideoId)}?rel=0`}
                    title="User Video"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          )}
        </main>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
              className="w-full max-w-[480px] bg-zinc-900 rounded-t-[32px] sm:rounded-2xl border-t sm:border border-zinc-800 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h2 className="text-sm font-black text-white">
                  Partagi el knowledge mte3ek
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveContent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-200 mb-1">
                    Bio & Liens (GitHub, Drive, Notion)
                  </label>
                  <textarea
                    rows={3}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Chnowa tnajjem t3awen w les liens mte3ek..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-200 mb-1">
                    Lien YouTube 16:9
                  </label>
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-700 text-zinc-300 font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Syncing...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <nav
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/80 px-8 pt-3 flex justify-between items-center z-40 md:rounded-b-[28px]"
        >
          <button
            onClick={() => setActiveTab('feed')}
            aria-label="Home Feed"
            className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
              activeTab === 'feed'
                ? 'text-indigo-400 bg-indigo-950/60 scale-105'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Add Content"
            className="w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-zinc-900"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            aria-label="My Profile"
            className={`p-1.5 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
              activeTab === 'profile'
                ? 'ring-2 ring-indigo-400 scale-105'
                : 'opacity-75 hover:opacity-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              {userFirstInitial}
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
}
