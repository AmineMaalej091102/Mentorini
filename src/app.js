/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Core State-Management Engine & Supabase Integration (app.js)
 * 
 * Powered directly by Supabase (@supabase/supabase-js)
 * Real-Time Discovery Feed • Native Auth Engine • Video-Watch Lock Protocol
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 1. CONFIGURATION & SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Resolves environment variables safely across Vite (import.meta.env),
 * Node.js (process.env), or browser window globals (window.__ENV__).
 */
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

/**
 * Direct initialization via createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 */
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
  USER_SESSION: 'mentorini_user_session',
  WATCHED_VIDEOS: 'mentorini_unlocked_videos_v1',
  ACTIVE_TAB: 'mentorini_active_tab',
  ACTIVE_PROFILE_ID: 'mentorini_active_profile_id',
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
 * Extracts 11-character YouTube video ID from standard URLs, mobile shares, or Shorts.
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
// 3. CENTRAL REACTIVE STATE ENGINE (AppStore)
// ============================================================================

/**
 * Central State Engine managing user sessions, navigation tabs ('signup', 'signin',
 * 'feed', 'profile'), active profile inspector, video-watch states, and live mentors.
 */
class CentralAppStore {
  constructor() {
    this._listeners = new Set();

    // Rehydrate state from browser local cache when available
    const initialUser = this._loadJson(STORAGE_KEYS.USER_SESSION, null);
    const initialWatched = this._loadJson(STORAGE_KEYS.WATCHED_VIDEOS, []);
    const initialTab = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'feed'
      : 'feed';
    const initialProfileId = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || null
      : null;

    this._state = {
      // 1. User Session state
      userSession: initialUser,
      activeUser: initialUser, // alias for backwards compatibility

      // 2. Tab Routers ('signup' | 'signin' | 'feed' | 'profile' | 'gateway' | 'register_mentor')
      tabRouter: initialTab,

      // 3. Profile inspector state
      activeProfileId: initialProfileId,

      // 4. Video-watched tracking Set
      watchedVideos: new Set(Array.isArray(initialWatched) ? initialWatched : []),
      videoWatchedStates: new Set(Array.isArray(initialWatched) ? initialWatched : []), // alias

      // 5. Global database mentors collection
      mentors: [],

      // Metadata
      isLoading: false,
      error: null,
      lastSync: null,
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

  /**
   * Returns an immutable snapshot of the current state.
   */
  getState() {
    const watchedArray = Array.from(this._state.watchedVideos);
    return {
      ...this._state,
      watchedVideos: watchedArray,
      watchedVideoIds: watchedArray,
      videoWatchedStates: this._state.watchedVideos,
    };
  }

  /**
   * Updates state partially, synchronizes cache, and notifies all subscribers.
   */
  setState(partial) {
    const prevState = { ...this._state };
    this._state = {
      ...this._state,
      ...partial,
    };

    // Maintain alias parity
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

  /**
   * Registers a subscriber callback for state updates.
   * Returns an unsubscribe function.
   */
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

  // --- Convenience State Reducers ---

  /**
   * Switches the active view tab ('signup' | 'signin' | 'feed' | 'profile')
   */
  setTab(tabName) {
    this.setState({ tabRouter: tabName });
  }

  /**
   * Focuses on a specific mentor profile and routes to 'profile' tab.
   */
  setActiveProfile(profileId) {
    this.setState({
      activeProfileId: profileId ? String(profileId) : null,
      tabRouter: profileId ? 'profile' : this._state.tabRouter,
    });
  }

  /**
   * Records a watched video for the mentor, lifting the contact lock.
   */
  unlockMentorVideo(mentorId) {
    if (!mentorId) return;
    const nextSet = new Set(this._state.watchedVideos);
    nextSet.add(String(mentorId));
    this.setState({ watchedVideos: nextSet });
  }

  /**
   * Checks if a mentor's Feynman video has been watched.
   */
  isVideoUnlocked(mentorId) {
    return this._state.watchedVideos.has(String(mentorId));
  }

  /**
   * Logs out the user and clears stored session.
   */
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
// 4. DATABASE SYNCING (fetchMentors & Realtime)
// ============================================================================

let realtimeChannel = null;

/**
 * Actively downloads live mentor cards from the cloud 'mentors' database,
 * ordering from newest to oldest, and populates the discovery feed across
 * all devices. Also binds a real-time Postgres change listener.
 *
 * @returns {Promise<Array>} List of mentors
 */
export async function fetchMentors() {
  AppStore.setState({ isLoading: true, error: null });

  try {
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedMentors = (data || []).map((row) => ({
      id: String(row.id),
      name: row.name,
      status: row.status,
      whatsappNumber: row.whatsapp_number || row.whatsappNumber,
      youtubeUrl: row.youtube_url || row.youtubeUrl,
      youtubeVideoId: row.youtube_video_id || extractYouTubeId(row.youtube_url || ''),
      feynmanTopic: row.feynman_topic || row.feynmanTopic || 'Concept IT bel Tounsi',
      bio: row.bio || '',
      category: row.category || 'bac_info',
      tags: Array.isArray(row.tags) 
        ? row.tags 
        : (row.tags ? String(row.tags).split(',').map(t => t.trim()) : []),
      isFlagship: Boolean(row.is_flagship || row.isFlagship),
      createdAt: row.created_at || new Date().toISOString(),
    }));

    AppStore.setState({
      mentors: formattedMentors,
      isLoading: false,
      lastSync: new Date().toISOString(),
    });

    // Ensure real-time updates are active
    subscribeToMentorsRealtime();

    return formattedMentors;
  } catch (err) {
    console.error('[Mentorini Backend] fetchMentors() error:', err);
    AppStore.setState({
      isLoading: false,
      error: err.message || 'Error syncing mentors from Supabase',
    });
    return AppStore.getState().mentors;
  }
}

/**
 * Listens for real-time INSERT/UPDATE/DELETE events on the public 'mentors' table.
 */
export function subscribeToMentorsRealtime() {
  if (realtimeChannel) return realtimeChannel;

  realtimeChannel = supabase
    .channel('mentors-universal-sync')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mentors' },
      (payload) => {
        const row = payload.new;
        const newMentor = {
          id: String(row.id),
          name: row.name,
          status: row.status,
          whatsappNumber: row.whatsapp_number || row.whatsappNumber,
          youtubeUrl: row.youtube_url || row.youtubeUrl,
          youtubeVideoId: row.youtube_video_id || extractYouTubeId(row.youtube_url || ''),
          feynmanTopic: row.feynman_topic || 'Concept IT bel Tounsi',
          bio: row.bio || '',
          category: row.category || 'bac_info',
          tags: Array.isArray(row.tags) ? row.tags : [],
          isFlagship: Boolean(row.is_flagship),
          createdAt: row.created_at,
        };

        const existing = AppStore.getState().mentors;
        if (!existing.some((m) => m.id === newMentor.id)) {
          AppStore.setState({
            mentors: [newMentor, ...existing],
          });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'mentors' },
      (payload) => {
        const row = payload.new;
        const updatedList = AppStore.getState().mentors.map((m) => 
          m.id === String(row.id) 
            ? {
                ...m,
                name: row.name,
                status: row.status,
                whatsappNumber: row.whatsapp_number || m.whatsappNumber,
                youtubeUrl: row.youtube_url || m.youtubeUrl,
                feynmanTopic: row.feynman_topic || m.feynmanTopic,
                bio: row.bio || m.bio,
                category: row.category || m.category,
              }
            : m
        );
        AppStore.setState({ mentors: updatedList });
      }
    )
    .subscribe();

  return realtimeChannel;
}

// ============================================================================
// 5. AUTHENTICATION SUBSYSTEMS (handleSignUp & handleSignIn)
// ============================================================================

/**
 * Handles account creation for both mentees and mentors.
 * Inserts rows into cloud 'users' or 'mentors' tables based on role selection,
 * saves a persistent session in 'localStorage', and boots the app into the 'feed'.
 *
 * @param {Object} userData - Registration parameters (name, phone, role, status, etc.)
 * @returns {Promise<Object>} Created session profile
 */
export async function handleSignUp(userData) {
  if (!userData || !userData.name) {
    throw new Error('Esmek w la9bek required lel inscription.');
  }

  const role = userData.role === 'mentor' ? 'mentor' : 'mentee';
  const rawPhone = userData.phone || userData.whatsappNumber || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);

  if (!cleanPhone) {
    throw new Error('Noumrou tel/WhatsApp required bech tconnecti.');
  }

  let sessionProfile = null;

  try {
    if (role === 'mentor') {
      // --- MENTOR ONBOARDING ---
      const videoId = extractYouTubeId(userData.youtubeUrl || '');
      if (!videoId) {
        throw new Error('Lien YouTube lazim ykoun valid (video short wala 3adiya b Feynman Technique).');
      }

      const mentorRow = {
        name: String(userData.name).trim(),
        status: String(userData.status || 'Peer Mentor IT').trim(),
        whatsapp_number: cleanPhone,
        youtube_url: String(userData.youtubeUrl).trim(),
        youtube_video_id: videoId,
        feynman_topic: String(userData.feynmanTopic || 'Concept IT bel Tounsi').trim(),
        bio: String(userData.bio || '').trim(),
        category: userData.category || 'bac_info',
        tags: Array.isArray(userData.tags) && userData.tags.length > 0 
          ? userData.tags 
          : [userData.category || 'IT', 'Peer Mentor'],
        is_flagship: Boolean(userData.isFlagship),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('mentors')
        .insert([mentorRow])
        .select()
        .single();

      if (error) throw error;

      sessionProfile = {
        id: String(data.id),
        name: data.name,
        role: 'mentor',
        phone: data.whatsapp_number,
        whatsappNumber: data.whatsapp_number,
        status: data.status,
        category: data.category,
        feynmanTopic: data.feynman_topic,
        createdAt: data.created_at,
      };

      // Add to local mentors immediately
      const currentMentors = AppStore.getState().mentors;
      const formatted = {
        id: String(data.id),
        name: data.name,
        status: data.status,
        whatsappNumber: data.whatsapp_number,
        youtubeUrl: data.youtube_url,
        youtubeVideoId: data.youtube_video_id,
        feynmanTopic: data.feynman_topic,
        bio: data.bio,
        category: data.category,
        tags: data.tags || [],
        isFlagship: data.is_flagship,
        createdAt: data.created_at,
      };
      AppStore.setState({
        mentors: [formatted, ...currentMentors.filter(m => m.id !== formatted.id)],
      });

    } else {
      // --- MENTEE ONBOARDING ---
      const userRow = {
        name: String(userData.name).trim(),
        phone: cleanPhone,
        email: userData.email ? String(userData.email).trim().toLowerCase() : null,
        educational_level: userData.educationalLevel || 'Bac Info',
        field_of_study: userData.fieldOfStudy || 'Computer Science',
        interests: Array.isArray(userData.interests) ? userData.interests : [],
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userRow])
        .select()
        .single();

      if (error) throw error;

      sessionProfile = {
        id: String(data.id),
        name: data.name,
        role: 'mentee',
        phone: data.phone,
        email: data.email,
        educationalLevel: data.educational_level,
        fieldOfStudy: data.field_of_study,
        createdAt: data.created_at,
      };
    }

    // Cache session in state and localStorage, then boot the app to 'feed'
    AppStore.setState({
      userSession: sessionProfile,
      activeUser: sessionProfile,
      tabRouter: 'feed',
    });

    return sessionProfile;
  } catch (err) {
    console.warn('[Mentorini Auth] SignUp cloud warning, activating local fallback:', err);
    
    // Offline resilience fallback
    sessionProfile = {
      id: `local-${role}-${Date.now()}`,
      name: userData.name,
      role,
      phone: cleanPhone,
      isOffline: true,
      createdAt: new Date().toISOString(),
    };

    AppStore.setState({
      userSession: sessionProfile,
      activeUser: sessionProfile,
      tabRouter: 'feed',
    });

    return sessionProfile;
  }
}

/**
 * Queries Supabase for an existing profile with a matching phone number.
 * Searches both the 'users' and 'mentors' tables. If found, caches the session
 * and routes to 'feed'. If not, alerts in friendly Arabizi to register first.
 *
 * @param {string} phone - User's phone number
 * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
 */
export async function handleSignIn(phone) {
  const cleanPhone = cleanPhoneNumber(phone);
  if (!cleanPhone) {
    const errorMsg = 'A3tina noumrou tel s7i7 svp.';
    alert(errorMsg);
    return { success: false, error: errorMsg };
  }

  AppStore.setState({ isLoading: true, error: null });

  try {
    // 1. Search in 'users' table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (userData && !userError) {
      const userSession = {
        id: String(userData.id),
        name: userData.name,
        role: 'mentee',
        phone: userData.phone,
        email: userData.email,
        educationalLevel: userData.educational_level,
        fieldOfStudy: userData.field_of_study,
        createdAt: userData.created_at,
      };

      AppStore.setState({
        userSession,
        activeUser: userSession,
        tabRouter: 'feed',
        isLoading: false,
      });

      return { success: true, user: userSession };
    }

    // 2. Search in 'mentors' table if not in users
    const { data: mentorData, error: mentorError } = await supabase
      .from('mentors')
      .select('*')
      .eq('whatsapp_number', cleanPhone)
      .maybeSingle();

    if (mentorData && !mentorError) {
      const mentorSession = {
        id: String(mentorData.id),
        name: mentorData.name,
        role: 'mentor',
        phone: mentorData.whatsapp_number,
        whatsappNumber: mentorData.whatsapp_number,
        status: mentorData.status,
        category: mentorData.category,
        createdAt: mentorData.created_at,
      };

      AppStore.setState({
        userSession: mentorSession,
        activeUser: mentorSession,
        tabRouter: 'feed',
        isLoading: false,
      });

      return { success: true, user: mentorSession };
    }

    // 3. User not found in either table -> Friendly Arabizi alert
    AppStore.setState({ isLoading: false });
    const notFoundMessage = `Oops! Noumrou "${phone}" mouch mawjoud fil base ya 5ouya/o5ti! Sajjel rou7ek se3a fil SignUp bech tconnecti m3ana direct.`;
    
    // Trigger interactive alert or toast
    if (typeof window !== 'undefined') {
      alert(notFoundMessage);
    }

    // Direct user to signup tab
    AppStore.setTab('signup');

    return { 
      success: false, 
      error: notFoundMessage 
    };

  } catch (err) {
    console.error('[Mentorini Auth] handleSignIn() error:', err);
    AppStore.setState({ isLoading: false, error: err.message });
    const fallbackMsg = 'Famech connection tawa. Tnajjem tsajjel se3a fil SignUp!';
    if (typeof window !== 'undefined') {
      alert(fallbackMsg);
    }
    AppStore.setTab('signup');
    return { success: false, error: fallbackMsg };
  }
}

// ============================================================================
// 6. BACKWARD COMPATIBLE API ALIASES (FOR UI.JS & APP.TSX)
// ============================================================================

/**
 * Legacy mentee saver delegating to handleSignUp.
 */
export async function saveUser(userData) {
  return handleSignUp({
    ...userData,
    role: 'mentee',
  });
}

/**
 * Legacy mentor onboarding delegating to handleSignUp.
 */
export async function submitMentorRegistration(mentorData) {
  return handleSignUp({
    ...mentorData,
    role: 'mentor',
  });
}

// ============================================================================
// 7. INTERACTIVE WHATSAPP DEEP-LINK REDIRECT ROUTER
// ============================================================================

/**
 * Builds and executes a native mobile device redirect protocol via standard 'wa.me' paths.
 *
 * @param {string} phone - Target phone number
 * @param {string} text - Message pre-fill string
 * @returns {string} Fully formatted WhatsApp URL
 */
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
      console.warn('[WhatsApp Redirect] Navigation blocked by policy:', err);
    }
  }

  return waUrl;
}

// ============================================================================
// 8. BOOTSTRAP INITIALIZATION
// ============================================================================

/**
 * Bootstraps the application on initial page load:
 * Loads live mentors and attaches the real-time websocket channel.
 */
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
  fetchMentors,
  subscribeToMentorsRealtime,
  saveUser,
  submitMentorRegistration,
  executeWhatsAppRedirect,
  cleanPhoneNumber,
  extractYouTubeId,
  initializeMentoriniApp,
};
