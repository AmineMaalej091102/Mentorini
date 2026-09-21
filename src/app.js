import { createClient } from '@supabase/supabase-js';

function getEnvVariable(key) {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }
  if (typeof window !== 'undefined' && window[key]) {
    return window[key];
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
  }
  return '';
}

export const SUPABASE_URL = 
  getEnvVariable('VITE_SUPABASE_URL') || 
  getEnvVariable('SUPABASE_URL') || 
  'https://quweyaxneqyyjfhhccbd.supabase.co';

export const SUPABASE_ANON_KEY = 
  getEnvVariable('VITE_SUPABASE_ANON_KEY') || 
  getEnvVariable('SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

const STORAGE_KEYS = {
  USER_SESSION: 'mentorini_user_session_v3',
  WATCHED_VIDEOS: 'mentorini_unlocked_videos_v3',
  ACTIVE_TAB: 'mentorini_active_tab_v3',
  ACTIVE_PROFILE_ID: 'mentorini_active_profile_id_v3',
};

export function cleanPhoneNumber(phone) {
  let cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 8) {
    cleaned = '216' + cleaned;
  } else if (cleaned.startsWith('00216')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    /^([\w-]{11})$/
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = trimmed.match(patterns[i]);
    if (match && match[1]) return match[1];
  }
  return null;
}

export const SEED_MENTORS = [
  {
    id: 'seed-mentor-1',
    name: 'Mehdi Trabelsi',
    email: 'mehdi.trabelsi@insat.tn',
    phone: '21698765432',
    whatsappNumber: '21698765432',
    status: 'INSAT GL3 • Ex-Bac Info 18.5',
    role: 'mentor',
    bio: 'N3awen jme3et el Bac Info w licence fi Recursion, Pointers C/C++, w Trees. Chnouwa 3andi: drive.google.com/drive/folders/mentorini-algo w github.com/mehdi-tn/algo-prep',
    youtubeUrl: 'https://www.youtube.com/watch?v=M2_o3o9Yj0E',
    youtubeVideoId: 'M2_o3o9Yj0E',
    feynmanTopic: 'Recursion w Call Stack bel Tounsi',
    category: 'ALGO_BAC',
    createdAt: '2026-03-01T10:00:00Z',
    isFlagship: true,
  },
  {
    id: 'seed-mentor-2',
    name: 'Sarra Ben Mahmoud',
    email: 'sarra.bm@gmail.com',
    phone: '21650123456',
    whatsappNumber: '21650123456',
    status: 'Full-Stack Engineer • Python Mentor',
    role: 'mentor',
    bio: 'Specialiste Web (FastAPI, React) w Python pour Bac Info. Code source w exa: github.com/sarra-dev/bac-info-python',
    youtubeUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    youtubeVideoId: 'kqtD5dpn9C8',
    feynmanTopic: 'Python OOP & Classes bel Farsi',
    category: 'PYTHON_DEV',
    createdAt: '2026-03-02T11:00:00Z',
    isFlagship: true,
  },
  {
    id: 'seed-mentor-3',
    name: 'Amine Khemir',
    email: 'amine.khemir@ensi.tn',
    phone: '21622334455',
    whatsappNumber: '21622334455',
    status: 'ENSI Student • Algorithms Lead',
    role: 'mentor',
    bio: 'Dynamic Programming w Complexity O(N) fassarnehom fi 5 d9aye9. Chekout notions: notion.site/algo-amine-tn',
    youtubeUrl: 'https://www.youtube.com/watch?v=HGTJBPNC-Gw',
    youtubeVideoId: 'HGTJBPNC-Gw',
    feynmanTopic: 'Dynamic Programming bel Tounsi',
    category: 'DATA_STRUCTURES',
    createdAt: '2026-03-03T12:00:00Z',
  },
];

class CentralAppStore {
  constructor() {
    this._listeners = new Set();

    const initialUser = this._loadJson(STORAGE_KEYS.USER_SESSION, null);
    const initialWatched = this._loadJson(STORAGE_KEYS.WATCHED_VIDEOS, []);
    const initialTab = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'feed'
      : 'feed';
    const initialProfileId = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || null
      : null;

    this.state = {
      user: initialUser,
      userSession: initialUser,
      activeUser: initialUser,
      tabRouter: initialTab,
      activeProfileId: initialProfileId,
      watchedVideos: new Set(Array.isArray(initialWatched) ? initialWatched : []),
      videoWatchedStates: new Set(Array.isArray(initialWatched) ? initialWatched : []),
      mentors: [...SEED_MENTORS],
      isLoading: false,
      error: null,
      lastSync: null,
      isShareModalOpen: false,
    };
    this._state = this.state;
  }

  _loadJson(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  _saveJson(key, val) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn(err);
    }
  }

  getState() {
    const watchedArray = Array.from(this.state.watchedVideos);
    return {
      ...this.state,
      user: this.state.user || this.state.userSession,
      userSession: this.state.user || this.state.userSession,
      activeUser: this.state.user || this.state.activeUser,
      watchedVideos: watchedArray,
      watchedVideoIds: watchedArray,
      videoWatchedStates: this.state.watchedVideos,
    };
  }

  setState(partial) {
    const prevState = { ...this.state };
    this.state = {
      ...this.state,
      ...partial,
    };
    this._state = this.state;

    const userVal = partial.user !== undefined ? partial.user : (partial.userSession !== undefined ? partial.userSession : partial.activeUser);
    if (userVal !== undefined) {
      this.state.user = userVal;
      this.state.userSession = userVal;
      this.state.activeUser = userVal;
      this._saveJson(STORAGE_KEYS.USER_SESSION, userVal);
    }

    if (partial.watchedVideos) {
      const setVal = partial.watchedVideos instanceof Set 
        ? partial.watchedVideos 
        : new Set(partial.watchedVideos);
      this.state.watchedVideos = setVal;
      this.state.videoWatchedStates = setVal;
      this._saveJson(STORAGE_KEYS.WATCHED_VIDEOS, Array.from(setVal));
    } else if (partial.videoWatchedStates) {
      const setVal = partial.videoWatchedStates instanceof Set 
        ? partial.videoWatchedStates 
        : new Set(partial.videoWatchedStates);
      this.state.watchedVideos = setVal;
      this.state.videoWatchedStates = setVal;
      this._saveJson(STORAGE_KEYS.WATCHED_VIDEOS, Array.from(setVal));
    }

    if (partial.tabRouter && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, partial.tabRouter);
    }

    if (partial.activeProfileId !== undefined && typeof localStorage !== 'undefined') {
      if (partial.activeProfileId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, String(partial.activeProfileId));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
      }
    }

    this._notify(prevState);
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  _notify(prevState) {
    const currentState = this.getState();
    this._listeners.forEach((listener) => {
      try {
        listener(currentState, prevState);
      } catch (err) {
        console.error(err);
      }
    });
  }

  setTab(tabName) {
    this.setState({ tabRouter: tabName });
  }

  setActiveProfile(profileId) {
    this.setState({
      activeProfileId: profileId ? String(profileId) : null,
      tabRouter: profileId ? 'profile' : this.state.tabRouter,
    });
  }

  unlockMentorVideo(mentorId) {
    if (!mentorId) return;
    const nextSet = new Set(this.state.watchedVideos);
    nextSet.add(String(mentorId));
    this.setState({ watchedVideos: nextSet });
  }

  isVideoUnlocked(mentorId) {
    return this.state.watchedVideos.has(String(mentorId));
  }

  setShareModalOpen(isOpen) {
    this.setState({ isShareModalOpen: Boolean(isOpen) });
  }

  clearUserSession() {
    this.setState({
      user: null,
      userSession: null,
      activeUser: null,
      tabRouter: 'feed',
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }

  async fetchMentors() {
    return await fetchMentors();
  }
}

export const AppStore = new CentralAppStore();
AppStore.fetchMentors = async () => await fetchMentors();

export function renderEngine() {
  if (typeof window !== 'undefined' && typeof window.renderEngine === 'function') {
    window.renderEngine();
  }
}

if (typeof window !== 'undefined') {
  window.renderEngine = window.renderEngine || renderEngine;
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session && session.user && session.user.email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      const userRecord = data || {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'Peer User',
        role: 'mentee',
        status: 'Active Member',
        bio: '',
        video_url: '',
      };

      AppStore.state.user = userRecord;
      AppStore.setState({
        user: userRecord,
        userSession: userRecord,
        activeUser: userRecord,
        tabRouter: 'feed',
      });
      await AppStore.fetchMentors();
      renderEngine();
    } catch (err) {
      const fallbackUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'Peer User',
        role: 'mentee',
        status: 'Active Member',
        bio: '',
        video_url: '',
      };
      AppStore.state.user = fallbackUser;
      AppStore.setState({
        user: fallbackUser,
        userSession: fallbackUser,
        activeUser: fallbackUser,
        tabRouter: 'feed',
      });
      await AppStore.fetchMentors();
      renderEngine();
    }
  } else if (event === 'SIGNED_OUT') {
    AppStore.clearUserSession();
    renderEngine();
  }
});

export async function loginWithGoogle() {
  AppStore.setState({ isLoading: true, error: null });
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    AppStore.setState({ isLoading: false, error: err.message || String(err) });
    throw err;
  }
}

if (typeof window !== 'undefined') {
  window.loginWithGoogle = loginWithGoogle;
}

export const signInWithGoogle = loginWithGoogle;

export async function checkUserSession() {
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data || !data.user) {
      return AppStore.getState().user || null;
    }
    const user = data.user;
    let activeProfile = null;
    try {
      const { data: matchedRow } = await client
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (matchedRow) {
        activeProfile = matchedRow;
      }
    } catch (e) {
    }

    if (!activeProfile) {
      activeProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 'Peer User',
        status: 'Active Member',
        role: 'mentee',
      };
    }

    AppStore.state.user = activeProfile;
    AppStore.setState({
      user: activeProfile,
      userSession: activeProfile,
      activeUser: activeProfile,
    });
    return activeProfile;
  } catch (err) {
    return AppStore.getState().user || null;
  }
}

if (typeof window !== 'undefined') {
  window.checkUserSession = checkUserSession;
}

export async function updateProfileContent(bio, videoUrl) {
  const state = AppStore.getState();
  const user = state.user || state.userSession || state.activeUser;
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  if (!user) {
    const errMsg = 'Lazmek tkoun connecti bel Google mte3ek se3a bech t-partagi!';
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(errMsg);
    }
    AppStore.setTab('signup');
    return { success: false, error: errMsg };
  }

  const trimmedBio = String(bio || '').trim();
  const trimmedVideoUrl = String(videoUrl || '').trim();

  AppStore.setState({ isLoading: true, error: null });

  try {
    await client
      .from('users')
      .update({
        bio: trimmedBio,
        video_url: trimmedVideoUrl,
      })
      .eq('email', user.email);

    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      role: 'mentor',
      status: 'Peer Mentor IT',
    };

    AppStore.state.user = updatedUser;
    AppStore.setState({
      user: updatedUser,
      userSession: updatedUser,
      activeUser: updatedUser,
      isLoading: false,
      isShareModalOpen: false,
    });

    await AppStore.fetchMentors();
    renderEngine();

    return { success: true, user: updatedUser };
  } catch (err) {
    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      role: 'mentor',
      status: 'Peer Mentor IT',
    };

    AppStore.state.user = updatedUser;
    AppStore.setState({
      user: updatedUser,
      userSession: updatedUser,
      activeUser: updatedUser,
      isLoading: false,
      isShareModalOpen: false,
    });

    await AppStore.fetchMentors();
    renderEngine();
    return { success: true, user: updatedUser };
  }
}

if (typeof window !== 'undefined') {
  window.updateProfileContent = updateProfileContent;
}

export async function updateUserKnowledge({ bio, videoUrl, phone }) {
  const user = AppStore.state.user || AppStore.getState().userSession;
  if (user && phone) {
    user.phone = cleanPhoneNumber(phone);
    user.whatsappNumber = cleanPhoneNumber(phone);
  }
  return updateProfileContent(bio, videoUrl);
}

let realtimeChannel = null;

export async function fetchMentors() {
  AppStore.setState({ isLoading: true, error: null });
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  try {
    const { data: usersData, error: usersError } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    let fetchedMentors = [];

    if (usersData && usersData.length > 0 && !usersError) {
      fetchedMentors = usersData
        .filter((u) => u.role === 'mentor' || (u.video_url && String(u.video_url).trim().length > 0))
        .map((u) => ({
          id: String(u.id || u.email || Math.random()),
          name: u.name || u.user_metadata?.full_name || 'Peer Mentor',
          email: u.email || '',
          phone: u.phone || '',
          whatsappNumber: u.whatsapp_number || u.phone || '',
          status: u.status || 'Peer Mentor IT',
          role: u.role || 'mentor',
          bio: u.bio || 'Partage des connaissances en IT bel Tounsi.',
          youtubeUrl: u.video_url || '',
          youtubeVideoId: extractYouTubeId(u.video_url || ''),
          feynmanTopic: u.feynman_topic || 'Concept IT bel Tounsi',
          category: u.category || 'IT_PEER',
          createdAt: u.created_at || new Date().toISOString(),
        }));
    }

    if (fetchedMentors.length === 0) {
      const { data: legacyMentors, error: legacyError } = await client
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (legacyMentors && legacyMentors.length > 0 && !legacyError) {
        fetchedMentors = legacyMentors.map((row) => ({
          id: String(row.id),
          name: row.name,
          email: row.email || '',
          phone: row.whatsapp_number || row.phone,
          whatsappNumber: row.whatsapp_number || row.phone,
          status: row.status || 'Peer Mentor IT',
          role: 'mentor',
          bio: row.bio || '',
          youtubeUrl: row.youtube_url || '',
          youtubeVideoId: row.youtube_video_id || extractYouTubeId(row.youtube_url || ''),
          feynmanTopic: row.feynman_topic || 'Concept IT bel Tounsi',
          category: 'IT_PEER',
          createdAt: row.created_at || new Date().toISOString(),
        }));
      }
    }

    if (fetchedMentors.length === 0) {
      fetchedMentors = SEED_MENTORS;
    }

    AppStore.setState({
      mentors: fetchedMentors,
      isLoading: false,
      lastSync: new Date().toISOString(),
    });

    subscribeToMentorsRealtime();
    return fetchedMentors;
  } catch (err) {
    AppStore.setState({
      mentors: SEED_MENTORS,
      isLoading: false,
      error: err.message,
    });
    return SEED_MENTORS;
  }
}

export function subscribeToMentorsRealtime() {
  if (realtimeChannel) return realtimeChannel;
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  realtimeChannel = client
    .channel('mentorini-unified-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      () => {
        fetchMentors().catch(() => {});
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'mentors' },
      () => {
        fetchMentors().catch(() => {});
      }
    )
    .subscribe();

  return realtimeChannel;
}

export function executeWhatsAppRedirect(phone, text) {
  if (!phone) {
    console.error('Target phone number is missing.');
    return '';
  }

  const sanitizedPhone = cleanPhoneNumber(phone);
  const defaultGreeting = '3aslema! Choft profil mte3ek 3la Mentorini w 7abit nestachirek fi sou2el IT.';
  const messageBody = text && String(text).trim().length > 0 ? String(text).trim() : defaultGreeting;

  const encodedMessage = encodeURIComponent(messageBody);
  const waUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

  if (typeof window !== 'undefined') {
    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  return waUrl;
}

export async function signOutUser() {
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;
  try {
    await client.auth.signOut();
  } catch (err) {
    console.warn(err);
  }
  AppStore.clearUserSession();
  renderEngine();
}

export async function initializeMentoriniApp() {
  const mentors = await fetchMentors();
  const channel = subscribeToMentorsRealtime();
  renderEngine();

  return {
    store: AppStore,
    mentors,
    channel,
  };
}

export default {
  supabase,
  AppStore,
  loginWithGoogle,
  signInWithGoogle,
  checkUserSession,
  updateProfileContent,
  updateUserKnowledge,
  fetchMentors,
  subscribeToMentorsRealtime,
  executeWhatsAppRedirect,
  cleanPhoneNumber,
  extractYouTubeId,
  initializeMentoriniApp,
  signOutUser,
  renderEngine,
  SEED_MENTORS,
};
