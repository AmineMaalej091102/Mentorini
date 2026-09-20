/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Core State-Management Engine & Supabase Integration (app.js)
 * 
 * Re-architected for Zero-Friction Social-Learning Network:
 * - Unified 'users' table write schema: 'name', 'phone', 'status', 'role'
 * - Instant phone-based authentication via handleSignIn(phone)
 * - Social Creator Engine: updateUserKnowledge({ bio, videoUrl })
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

// Cache keys for persistent local storage
const STORAGE_KEYS = {
  USER_SESSION: 'mentorini_user_session_v2',
  WATCHED_VIDEOS: 'mentorini_unlocked_videos_v2',
  ACTIVE_TAB: 'mentorini_active_tab_v2',
  ACTIVE_PROFILE_ID: 'mentorini_active_profile_id_v2',
};

// ============================================================================
// 2. DATA PARSING & VALIDATION UTILITIES
// ============================================================================

/**
 * Cleans phone numbers and formats Tunisian numbers to international format (+216).
 * Accepts 8-digit local numbers ('98123456') or international numbers.
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
    phone: '21698765432',
    whatsappNumber: '21698765432',
    status: 'INSAT GL3 • Ex-Bac Info 18.5',
    role: 'mentor',
    bio: 'N3awen jme3et el Bac Info w licence fi Recursion, Pointers C/C++, w Trees. Chnouwa 3andi: drive.google.com/drive/folders/mentorini-algo w github.com/mehdi-tn/algo-prep',
    youtubeUrl: 'https://www.youtube.com/watch?v=M2_o3o9Yj0E',
    youtubeVideoId: 'M2_o3o9Yj0E',
    feynmanTopic: 'Recursion w Call Stack bel Tounsi',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'seed-mentor-2',
    name: 'Sarra Ben Mahmoud',
    phone: '21650123456',
    whatsappNumber: '21650123456',
    status: 'Full-Stack Engineer • Python Mentor',
    role: 'mentor',
    bio: 'Specialiste Web (FastAPI, React) w Python pour Bac Info. Code source w exa: github.com/sarra-dev/bac-info-python',
    youtubeUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    youtubeVideoId: 'kqtD5dpn9C8',
    feynmanTopic: 'Python OOP & Classes bel Farsi',
    createdAt: '2026-03-02T11:00:00Z',
  },
  {
    id: 'seed-mentor-3',
    name: 'Amine Khemir',
    phone: '21622334455',
    whatsappNumber: '21622334455',
    status: 'ENSI Student • Algorithms Lead',
    role: 'mentor',
    bio: 'Dynamic Programming w Complexity O(N) fassarnehom fi 5 d9aye9. Chekout notions: notion.site/algo-amine-tn',
    youtubeUrl: 'https://www.youtube.com/watch?v=HGTJBPNC-Gw',
    youtubeVideoId: 'HGTJBPNC-Gw',
    feynmanTopic: 'Dynamic Programming bel Tounsi',
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

  try {
    // 1. Query unified 'users' table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    let fetchedMentors = [];

    if (usersData && usersData.length > 0 && !usersError) {
      // Find all users marked as mentor or who have shared knowledge
      fetchedMentors = usersData
        .filter((u) => u.role === 'mentor' || (u.video_url && String(u.video_url).trim().length > 0))
        .map((u) => ({
          id: String(u.id),
          name: u.name,
          phone: u.phone,
          whatsappNumber: u.phone,
          status: u.status || 'Peer Mentor IT',
          role: u.role || 'mentor',
          bio: u.bio || 'Partage des connaissances en IT bel Tounsi.',
          youtubeUrl: u.video_url || '',
          youtubeVideoId: extractYouTubeId(u.video_url || ''),
          feynmanTopic: u.feynman_topic || 'Concept IT bel Tounsi',
          createdAt: u.created_at || new Date().toISOString(),
        }));
    }

    // 2. Fallback check on legacy 'mentors' table if users table has no mentors yet
    if (fetchedMentors.length === 0) {
      const { data: legacyMentors, error: legacyError } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });

      if (legacyMentors && legacyMentors.length > 0 && !legacyError) {
        fetchedMentors = legacyMentors.map((row) => ({
          id: String(row.id),
          name: row.name,
          phone: row.whatsapp_number || row.phone,
          whatsappNumber: row.whatsapp_number || row.phone,
          status: row.status || 'Peer Mentor IT',
          role: 'mentor',
          bio: row.bio || '',
          youtubeUrl: row.youtube_url || '',
          youtubeVideoId: row.youtube_video_id || extractYouTubeId(row.youtube_url || ''),
          feynmanTopic: row.feynman_topic || 'Concept IT bel Tounsi',
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

  realtimeChannel = supabase
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
// 6. DATABASE REALIGNMENT & AUTHENTICATION SUBSYSTEMS
// ============================================================================

/**
 * Zero-Friction Onboarding Registration
 * Writes strictly to the unified Supabase 'users' table with exact schema fields:
 * - name
 * - phone
 * - status
 * - role ('mentee' or 'mentor')
 * 
 * Mentors can join with zero uploads on Day 1.
 *
 * @param {Object} userData - Registration parameters ({ name, phone, role })
 * @returns {Promise<Object>} Created user profile
 */
export async function handleSignUp(userData) {
  if (!userData || !userData.name || !String(userData.name).trim()) {
    throw new Error('Esmek w la9bek required lel inscription ya 5ouya/o5ti.');
  }

  const rawPhone = userData.phone || userData.whatsappNumber || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);

  if (!cleanPhone) {
    throw new Error('Noumrou WhatsApp required bech tconnecti.');
  }

  const role = userData.role === 'mentor' ? 'mentor' : 'mentee';
  const status = userData.status || (role === 'mentor' ? 'Peer Mentor IT' : 'Active Mentee');

  // Exact unified schema fields
  const userRow = {
    name: String(userData.name).trim(),
    phone: cleanPhone,
    status: status,
    role: role,
  };

  let sessionProfile = null;

  try {
    // 1. Direct write to unified 'users' table
    const { data, error } = await supabase
      .from('users')
      .insert([userRow])
      .select()
      .single();

    if (error) {
      // Handle phone duplicate gracefully
      if (error.code === '23505' || String(error.message).includes('duplicate')) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingUser) {
          sessionProfile = {
            id: String(existingUser.id),
            name: existingUser.name,
            phone: existingUser.phone,
            role: existingUser.role || role,
            status: existingUser.status || status,
            bio: existingUser.bio || '',
            video_url: existingUser.video_url || '',
            createdAt: existingUser.created_at,
          };
        }
      }
      if (!sessionProfile) throw error;
    } else if (data) {
      sessionProfile = {
        id: String(data.id),
        name: data.name,
        phone: data.phone,
        role: data.role || role,
        status: data.status || status,
        bio: data.bio || '',
        video_url: data.video_url || '',
        createdAt: data.created_at,
      };
    }
  } catch (err) {
    console.warn('[Mentorini Auth] SignUp Supabase warning, using local session fallback:', err);
    sessionProfile = {
      id: `user-${Date.now()}`,
      name: userRow.name,
      phone: cleanPhone,
      role: role,
      status: status,
      bio: '',
      video_url: '',
      isOffline: true,
      createdAt: new Date().toISOString(),
    };
  }

  // Update central state and localStorage cache, then route to feed
  AppStore.setState({
    userSession: sessionProfile,
    activeUser: sessionProfile,
    tabRouter: 'feed',
  });

  // Re-fetch mentors in background to reflect any new mentor
  fetchMentors().catch(() => {});

  return sessionProfile;
}

/**
 * Queries the unified 'users' table cleanly by the 'phone' column.
 * If a matching record is found: caches session and logs in instantly.
 * If no record is found: prompts them in friendly Arabizi to sign up.
 *
 * @param {string} phone - User's phone number
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function handleSignIn(phone) {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) {
    const errorMsg = 'A3tina noumrou tel/WhatsApp s7i7 svp.';
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(errorMsg);
    }
    return { success: false, error: errorMsg };
  }

  AppStore.setState({ isLoading: true, error: null });

  try {
    // 1. Query unified 'users' table cleanly by 'phone'
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (data && !error) {
      const userSession = {
        id: String(data.id),
        name: data.name,
        phone: data.phone,
        role: data.role || 'mentee',
        status: data.status || 'Active Mentee',
        bio: data.bio || '',
        video_url: data.video_url || '',
        createdAt: data.created_at,
      };

      AppStore.setState({
        userSession,
        activeUser: userSession,
        tabRouter: 'feed',
        isLoading: false,
      });

      return { success: true, user: userSession };
    }

    // 2. Query legacy 'mentors' table as a safety fallback
    const { data: legacyData } = await supabase
      .from('mentors')
      .select('*')
      .eq('whatsapp_number', cleanPhone)
      .maybeSingle();

    if (legacyData) {
      const userSession = {
        id: String(legacyData.id),
        name: legacyData.name,
        phone: legacyData.whatsapp_number,
        role: 'mentor',
        status: legacyData.status || 'Peer Mentor IT',
        bio: legacyData.bio || '',
        video_url: legacyData.youtube_url || '',
        createdAt: legacyData.created_at,
      };

      AppStore.setState({
        userSession,
        activeUser: userSession,
        tabRouter: 'feed',
        isLoading: false,
      });

      return { success: true, user: userSession };
    }

    // 3. User not found in database: Prompt to sign up in authentic Arabizi
    AppStore.setState({ isLoading: false });
    const notFoundMessage = `Noumrou "${cleanPhone}" ma l9inech bih compte ya 5ouya/o5ti! Sajjel houni fi d9i9a bech tconnecti direct.`;

    if (typeof window !== 'undefined' && window.alert) {
      window.alert(notFoundMessage);
    }

    // Redirect to Sign-Up tab
    AppStore.setTab('signup');

    return { 
      success: false, 
      error: notFoundMessage 
    };

  } catch (err) {
    console.error('[Mentorini Auth] handleSignIn() error:', err);
    AppStore.setState({ isLoading: false, error: err.message });
    const fallbackMsg = `Noumrou "${cleanPhone}" ma l9inech bih compte. Sajjel rou7ek fi d9i9a!`;
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(fallbackMsg);
    }
    AppStore.setTab('signup');
    return { success: false, error: fallbackMsg };
  }
}

// ============================================================================
// 7. SOCIAL CREATOR ENGINE (UPDATE KNOWLEDGE VIA PLUS BUTTON)
// ============================================================================

/**
 * Updates an existing user's profile with their Bio (notes/Drive/GitHub links)
 * and Horizontal (16:9) YouTube embed link.
 * 
 * Executes:
 * await supabase.from("users").update({ bio, video_url }).eq("phone", user.phone)
 *
 * @param {Object} payload - { bio, videoUrl }
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function updateUserKnowledge({ bio, videoUrl }) {
  const state = AppStore.getState();
  const user = state.userSession || state.activeUser;

  if (!user || !user.phone) {
    const errorMsg = 'Lazmek tkoun connecti b compte bech t-partagi el knowledge mte3ek!';
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(errorMsg);
    }
    AppStore.setTab('signin');
    return { success: false, error: errorMsg };
  }

  const cleanPhone = cleanPhoneNumber(user.phone);
  const trimmedBio = String(bio || '').trim();
  const trimmedVideoUrl = String(videoUrl || '').trim();

  AppStore.setState({ isLoading: true, error: null });

  try {
    // Update user in Supabase 'users' table
    const { data, error } = await supabase
      .from('users')
      .update({
        bio: trimmedBio,
        video_url: trimmedVideoUrl,
        role: 'mentor', // Contributing knowledge establishes mentor role
      })
      .eq('phone', cleanPhone)
      .select()
      .maybeSingle();

    if (error) throw error;

    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      role: 'mentor',
    };

    AppStore.setState({
      userSession: updatedUser,
      activeUser: updatedUser,
      isLoading: false,
      isShareModalOpen: false,
    });

    // Re-sync feed so their mentor card shows instantly
    await fetchMentors();

    return { success: true, user: updatedUser };
  } catch (err) {
    console.warn('[Mentorini Creator Engine] Supabase update warning, saving locally:', err);
    const updatedUser = {
      ...user,
      bio: trimmedBio,
      video_url: trimmedVideoUrl,
      role: 'mentor',
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
export async function saveUser(userData) {
  return handleSignUp({ ...userData, role: 'mentee' });
}

export async function submitMentorRegistration(mentorData) {
  return handleSignUp({ ...mentorData, role: 'mentor' });
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
  handleSignUp,
  handleSignIn,
  updateUserKnowledge,
  fetchMentors,
  subscribeToMentorsRealtime,
  saveUser,
  submitMentorRegistration,
  executeWhatsAppRedirect,
  cleanPhoneNumber,
  extractYouTubeId,
  initializeMentoriniApp,
  SEED_MENTORS,
};
