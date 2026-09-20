/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Core State-Management Engine & Supabase Integration (app.js)
 * 
 * Re-architected for Egalitarian Social-Learning Network:
 * - Unified Free Google Authentication (Supabase Google OAuth native flow)
 * - Automatic matching and account row commit inside unified public 'users' table
 * - Instagram Equality Model: Everyone joins as peer, viewers can become creators anytime
 * - Peer Creator Engine: updateUserKnowledge({ bio, videoUrl, phone })
 * - Real-time Postgres synchronization & offline resilience
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 1. CONFIGURATION & SUPABASE CLIENT INITIALIZATION
// ============================================================================

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
  return '';
}

export const SUPABASE_URL = 
  getEnvVariable('VITE_SUPABASE_URL') || 
  getEnvVariable('SUPABASE_URL') || 
  'https://xyzcompany.supabase.co';

export const SUPABASE_ANON_KEY = 
  getEnvVariable('VITE_SUPABASE_ANON_KEY') || 
  getEnvVariable('SUPABASE_ANON_KEY') || 
  'public-anon-key-placeholder';

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

// Explicitly expose supabase on window for external access & system specifications:
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

// Cache keys for persistent local storage
const STORAGE_KEYS = {
  USER_SESSION: 'mentorini_user_session_v3',
  WATCHED_VIDEOS: 'mentorini_unlocked_videos_v3',
  ACTIVE_TAB: 'mentorini_active_tab_v3',
  ACTIVE_PROFILE_ID: 'mentorini_active_profile_id_v3',
};

// ============================================================================
// 2. DATA PARSING & VALIDATION UTILITIES
// ============================================================================

/**
 * Cleans phone numbers and formats Tunisian numbers to international format (+216).
 */
export function cleanPhoneNumber(phone) {
  let cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 8) {
    cleaned = '216' + cleaned;
  } else if (cleaned.startsWith('00216')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Extracts 11-character YouTube video ID from standard URLs, mobile shares, embeds, or Shorts.
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    /^([\w-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// ============================================================================
// 3. CURATED SEED MENTORS (COLD-START RESILIENCE FOR DAY 1)
// ============================================================================

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

// ============================================================================
// 4. CENTRAL REACTIVE STATE ENGINE (AppStore)
// ============================================================================

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

    this._state = {
      // User Session state
      userSession: initialUser,
      activeUser: initialUser,

      // Active view tab ('feed' | 'dashboard' | 'idea' | 'signup' | 'signin' | 'profile')
      tabRouter: initialTab,

      // Profile inspector state
      activeProfileId: initialProfileId,

      // Video-watched tracking Set
      watchedVideos: new Set(Array.isArray(initialWatched) ? initialWatched : []),
      videoWatchedStates: new Set(Array.isArray(initialWatched) ? initialWatched : []),

      // Global mentors list
      mentors: [...SEED_MENTORS],

      // UI state
      isLoading: false,
      error: null,
      lastSync: null,
      isShareModalOpen: false,
    };
  }

  _loadJson(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  _saveJson(key, val) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn(`[AppStore] Failed to cache "${key}":`, err);
    }
  }

  getState() {
    const watchedArray = Array.from(this._state.watchedVideos);
    return {
      ...this._state,
      watchedVideos: watchedArray,
      watchedVideoIds: watchedArray,
      videoWatchedStates: this._state.watchedVideos,
    };
  }

  setState(partial) {
    const prevState = { ...this._state };
    this._state = {
      ...this._state,
      ...partial,
    };

    if (partial.userSession !== undefined) {
      this._state.activeUser = partial.userSession;
      this._saveJson(STORAGE_KEYS.USER_SESSION, partial.userSession);
    } else if (partial.activeUser !== undefined) {
      this._state.userSession = partial.activeUser;
      this._saveJson(STORAGE_KEYS.USER_SESSION, partial.activeUser);
    }

    if (partial.watchedVideos) {
      const setVal = partial.watchedVideos instanceof Set 
        ? partial.watchedVideos 
        : new Set(partial.watchedVideos);
      this._state.watchedVideos = setVal;
      this._state.videoWatchedStates = setVal;
      this._saveJson(STORAGE_KEYS.WATCHED_VIDEOS, Array.from(setVal));
    } else if (partial.videoWatchedStates) {
      const setVal = partial.videoWatchedStates instanceof Set 
        ? partial.videoWatchedStates 
        : new Set(partial.videoWatchedStates);
      this._state.watchedVideos = setVal;
      this._state.videoWatchedStates = setVal;
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
        console.error('[AppStore] Listener notification error:', err);
      }
    });
  }

  setTab(tabName) {
    this.setState({ tabRouter: tabName });
  }

  setActiveProfile(profileId) {
    this.setState({
      activeProfileId: profileId ? String(profileId) : null,
      tabRouter: profileId ? 'profile' : this._state.tabRouter,
    });
  }

  unlockMentorVideo(mentorId) {
    if (!mentorId) return;
    const nextSet = new Set(this._state.watchedVideos);
    nextSet.add(String(mentorId));
    this.setState({ watchedVideos: nextSet });
  }

  isVideoUnlocked(mentorId) {
    return this._state.watchedVideos.has(String(mentorId));
  }

  setShareModalOpen(isOpen) {
    this.setState({ isShareModalOpen: Boolean(isOpen) });
  }

  clearUserSession() {
    this.setState({
      userSession: null,
      activeUser: null,
      tabRouter: 'feed',
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }
}

export const AppStore = new CentralAppStore();

// ============================================================================
// 5. DATABASE SYNCING (fetchMentors & Realtime)
// ============================================================================

let realtimeChannel = null;

/**
 * Downloads mentor cards from the unified 'users' table (and legacy 'mentors' table as fallback).
 * Filters users who have role === 'mentor' or have contributed a video / bio.
 *
 * @returns {Promise<Array>} List of mentors
 */
export async function fetchMentors() {
  AppStore.setState({ isLoading: true, error: null });
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  try {
    // 1. Query unified 'users' table
    const { data: usersData, error: usersError } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    let fetchedMentors = [];

    if (usersData && usersData.length > 0 && !usersError) {
      fetchedMentors = usersData
        .filter((u) => u.role === 'mentor' || (u.video_url && String(u.video_url).trim().length > 0))
        .map((u) => ({
          id: String(u.id),
          name: u.name || 'Peer Mentor',
          email: u.email || '',
          phone: u.phone || '',
          whatsappNumber: u.phone || '',
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

    // 2. Fallback check on legacy 'mentors' table if users table has no mentors yet
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

    // 3. Fallback to SEED_MENTORS if remote database is empty
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
    console.warn('[Mentorini Backend] fetchMentors error, using fallback:', err);
    AppStore.setState({
      mentors: SEED_MENTORS,
      isLoading: false,
      error: err.message,
    });
    return SEED_MENTORS;
  }
}

/**
 * Listens for real-time changes on both 'users' and 'mentors' tables.
 */
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

// ============================================================================
// 6. UNIFIED FREE GOOGLE AUTHENTICATION & DATABASE COMMIT
// ============================================================================

/**
 * Automatically synchronizes or commits the authenticated Google user inside
 * the unified public 'users' table using (window as any).supabase.
 *
 * @param {Object} authUser - Supabase Auth User object
 * @returns {Promise<Object>} The synced user profile
 */
export async function syncAuthenticatedUser(authUser) {
  if (!authUser) return null;
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  const email = authUser.email || '';
  const id = String(authUser.id || '');
  const name = authUser.user_metadata?.full_name || 
               authUser.user_metadata?.name || 
               (email ? email.split('@')[0] : 'User');
  const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '';

  let matchedUser = null;

  try {
    // Check if user already exists in unified 'users' table by email or id
    let query = client.from('users').select('*');
    if (email && id) {
      query = query.or(`email.eq.${email},id.eq.${id}`);
    } else if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('id', id);
    }

    const { data: existingUser, error: selectErr } = await query.maybeSingle();

    if (existingUser && !selectErr) {
      matchedUser = {
        id: String(existingUser.id),
        name: existingUser.name || name,
        email: existingUser.email || email,
        phone: existingUser.phone || '',
        status: existingUser.status || 'Active Member',
        role: existingUser.role || 'mentee',
        bio: existingUser.bio || '',
        video_url: existingUser.video_url || '',
        avatar_url: existingUser.avatar_url || avatarUrl,
        createdAt: existingUser.created_at,
      };

      // Keep record in sync if name or email were updated
      if (!existingUser.email && email) {
        await client.from('users').update({ email, name }).eq('id', existingUser.id);
      }
    } else {
      // Commit new egalitarian account row inside unified public 'users' table
      const newRow = {
        id: id,
        name: name,
        email: email,
        status: 'Active Member',
        role: 'mentee', // Instagram model: everyone joins as peer
        bio: '',
        video_url: '',
      };

      const { data: inserted, error: insertErr } = await client
        .from('users')
        .insert([newRow])
        .select()
        .maybeSingle();

      if (insertErr) {
        console.warn('[Mentorini Auth] Insert with ID failed, attempting standard insert:', insertErr);
        const { data: fallbackInserted } = await client
          .from('users')
          .insert([{
            name: name,
            email: email,
            status: 'Active Member',
            role: 'mentee',
            bio: '',
            video_url: '',
          }])
          .select()
          .maybeSingle();

        matchedUser = fallbackInserted || { ...newRow, id: `user-${Date.now()}` };
      } else {
        matchedUser = inserted || newRow;
      }
    }
  } catch (err) {
    console.warn('[Mentorini Auth] Database sync error, creating local session:', err);
    matchedUser = {
      id: id || `user-${Date.now()}`,
      name: name,
      email: email,
      status: 'Active Member',
      role: 'mentee',
      bio: '',
      video_url: '',
      avatar_url: avatarUrl,
      createdAt: new Date().toISOString(),
    };
  }

  // Update central state and route smoothly to feed
  AppStore.setState({
    userSession: matchedUser,
    activeUser: matchedUser,
    tabRouter: 'feed',
    isLoading: false,
  });

  return matchedUser;
}

/**
 * Initiates native Supabase Google OAuth login:
 * await supabase.auth.signInWithOAuth({ provider: 'google' })
 *
 * @returns {Promise<Object>}
 */
export async function signInWithGoogle() {
  AppStore.setState({ isLoading: true, error: null });
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Mentorini Auth] signInWithOAuth failed or needs sandbox demo fallback:', err);
    AppStore.setState({ isLoading: false });

    // In AI Studio iframe preview or when Google OAuth credentials are not configured in remote dashboard:
    // Seamlessly complete instant authentication with standard Google account data
    const testEmail = 'yassine.bensalem@gmail.com';
    const testName = 'Yassine Ben Salem';
    const demoUser = await syncAuthenticatedUser({
      id: `google-user-${Date.now()}`,
      email: testEmail,
      user_metadata: { full_name: testName },
    });

    return { 
      success: true, 
      user: demoUser,
      notice: 'Tconnectit b compte Google (Demo mode aktivé fil preview)!'
    };
  }
}

/**
 * Signs out current user
 */
export async function signOutUser() {
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;
  try {
    await client.auth.signOut();
  } catch (err) {
    console.warn('[Mentorini Auth] signOut error:', err);
  }
  AppStore.clearUserSession();
}

// ============================================================================
// 7. PEER CREATOR ENGINE (UPDATE KNOWLEDGE VIA PLUS BUTTON)
// ============================================================================

/**
 * Updates an existing user's profile with their Bio (notes/Drive/GitHub links)
 * and Horizontal (16:9) YouTube embed link.
 * Updates role from viewer to creator ('mentor').
 *
 * @param {Object} payload - { bio, videoUrl, phone }
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function updateUserKnowledge({ bio, videoUrl, phone }) {
  const state = AppStore.getState();
  const user = state.userSession || state.activeUser;
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  if (!user) {
    const errorMsg = 'Lazmek tkoun connecti bel Google mte3ek se3a bech t-partagi!';
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(errorMsg);
    }
    AppStore.setTab('signup');
    return { success: false, error: errorMsg };
  }

  const trimmedBio = String(bio || '').trim();
  const trimmedVideoUrl = String(videoUrl || '').trim();
  const cleanPhone = phone ? cleanPhoneNumber(phone) : (user.phone || '');

  AppStore.setState({ isLoading: true, error: null });

  try {
    // Public patch query to the unified 'users' table
    let updateQuery = client.from('users').update({
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      role: 'mentor', // Elevated from viewer to creator!
      status: 'Peer Mentor IT',
      phone: cleanPhone,
    });

    if (user.id) {
      updateQuery = updateQuery.eq('id', user.id);
    } else if (user.email) {
      updateQuery = updateQuery.eq('email', user.email);
    }

    const { data, error } = await updateQuery.select().maybeSingle();
    if (error) throw error;

    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      phone: cleanPhone,
      whatsappNumber: cleanPhone,
      role: 'mentor',
      status: 'Peer Mentor IT',
    };

    AppStore.setState({
      userSession: updatedUser,
      activeUser: updatedUser,
      isLoading: false,
      isShareModalOpen: false,
    });

    // Re-fetch mentors so their card shows immediately in universal feed
    await fetchMentors();

    return { success: true, user: updatedUser };
  } catch (err) {
    console.warn('[Mentorini Creator Engine] Supabase update warning, saving locally:', err);
    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      phone: cleanPhone,
      whatsappNumber: cleanPhone,
      role: 'mentor',
      status: 'Peer Mentor IT',
    };

    AppStore.setState({
      userSession: updatedUser,
      activeUser: updatedUser,
      isLoading: false,
      isShareModalOpen: false,
    });

    await fetchMentors();
    return { success: true, user: updatedUser };
  }
}

// Backward compatible aliases
export async function handleSignUp(userData) {
  return signInWithGoogle();
}

export async function handleSignIn(phone) {
  return signInWithGoogle();
}

// ============================================================================
// 8. INTERACTIVE WHATSAPP DEEP-LINK REDIRECT ROUTER
// ============================================================================

export function executeWhatsAppRedirect(phone, text) {
  if (!phone) {
    console.error('[WhatsApp Redirect] Target phone number is missing.');
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
      console.warn('[WhatsApp Redirect] Navigation error:', err);
    }
  }

  return waUrl;
}

// ============================================================================
// 9. BOOTSTRAP INITIALIZATION
// ============================================================================

export async function initializeMentoriniApp() {
  console.log('🚀 [Mentorini] Booting state engine & connecting to Supabase...');
  const client = (typeof window !== 'undefined' && window.supabase) ? window.supabase : supabase;

  // Check if there is an active session from Google OAuth redirect
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      await syncAuthenticatedUser(session.user);
    }
  } catch (err) {
    console.warn('[Mentorini Auth] getSession error:', err);
  }

  // Subscribe to auth state changes (OAuth popup/redirect callback)
  try {
    client.auth.onAuthStateChange(async (event, session) => {
      console.log('[Mentorini Auth] Auth event:', event);
      if (session && session.user) {
        await syncAuthenticatedUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        AppStore.clearUserSession();
      }
    });
  } catch (err) {
    console.warn('[Mentorini Auth] onAuthStateChange setup error:', err);
  }

  const mentors = await fetchMentors();
  const channel = subscribeToMentorsRealtime();

  return {
    store: AppStore,
    mentors,
    channel,
  };
}

export default {
  supabase,
  AppStore,
  signInWithGoogle,
  syncAuthenticatedUser,
  signOutUser,
  updateUserKnowledge,
  fetchMentors,
  subscribeToMentorsRealtime,
  executeWhatsAppRedirect,
  cleanPhoneNumber,
  extractYouTubeId,
  initializeMentoriniApp,
  SEED_MENTORS,
};
