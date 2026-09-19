/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Production Backend Integration & Real-time State Script (app.js)
 * 
 * Powered by Supabase (@supabase/supabase-js) and Native WhatsApp Deep-Linking ($0 Cost)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// 1. ENVIRONMENT CONFIGURATION & SUPABASE CLIENT INITIALIZATION
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

const SUPABASE_URL = getEnvVariable('VITE_SUPABASE_URL') || getEnvVariable('SUPABASE_URL') || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = getEnvVariable('VITE_SUPABASE_ANON_KEY') || getEnvVariable('SUPABASE_ANON_KEY') || 'public-anon-key-placeholder';

/**
 * Singleton Supabase Client instance with real-time websocket subscriptions enabled.
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

// Storage keys for local caching
const STORAGE_KEYS = {
  USER_SESSION: 'mentorini_user_session',
  WATCHED_VIDEOS: 'mentorini_unlocked_videos_v1',
  ACTIVE_TAB: 'mentorini_active_tab',
};

// ============================================================================
// 2. CENTRAL REACTIVE STATE MODEL (AppStore)
// ============================================================================

/**
 * Reactive data store managing active users, navigation tabs, video-watch states,
 * and the live mentors collection fetched from the database.
 */
class ReactiveAppStore {
  constructor() {
    this._listeners = new Set();
    
    // Initialized from browser local cache when available
    const initialWatched = this._loadJson(STORAGE_KEYS.WATCHED_VIDEOS, []);
    const initialUser = this._loadJson(STORAGE_KEYS.USER_SESSION, null);
    const initialTab = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'feed'
      : 'feed';

    this._state = {
      activeUser: initialUser,
      tabRouter: initialTab, // 'feed' | 'bac_info' | 'fac_prep' | 'register_mentor' | 'profile'
      videoWatchedStates: new Set(Array.isArray(initialWatched) ? initialWatched : []),
      mentors: [],
      isLoading: false,
      error: null,
      lastSync: null,
    };
  }

  _loadJson(key, fallback) {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  _saveJson(key, value) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[AppStore] Failed to cache key "${key}":`, err);
    }
  }

  /**
   * Returns a snapshot of the current state.
   */
  getState() {
    return {
      ...this._state,
      // Provide array view of watched videos for easier consumption
      watchedVideoIds: Array.from(this._state.videoWatchedStates),
    };
  }

  /**
   * Updates state partially and notifies all registered listeners.
   */
  setState(partial) {
    const prevState = { ...this._state };
    this._state = {
      ...this._state,
      ...partial,
    };

    // Keep localStorage synchronized for persistent fields
    if (partial.videoWatchedStates) {
      this._saveJson(
        STORAGE_KEYS.WATCHED_VIDEOS,
        Array.from(this._state.videoWatchedStates)
      );
    }
    if (partial.activeUser !== undefined) {
      this._saveJson(STORAGE_KEYS.USER_SESSION, this._state.activeUser);
    }
    if (partial.tabRouter && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, this._state.tabRouter);
    }

    this._notify(prevState);
  }

  /**
   * Subscribes a listener callback to state mutations.
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
        console.error('[AppStore] Error in listener execution:', err);
      }
    });
  }

  // --- Convenience State Reducers ---

  setTab(tabName) {
    this.setState({ tabRouter: tabName });
  }

  unlockMentorVideo(mentorId) {
    if (!mentorId) return;
    const nextSet = new Set(this._state.videoWatchedStates);
    nextSet.add(String(mentorId));
    this.setState({ videoWatchedStates: nextSet });
  }

  isVideoUnlocked(mentorId) {
    return this._state.videoWatchedStates.has(String(mentorId));
  }

  clearUserSession() {
    this.setState({ activeUser: null });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    }
  }
}

export const AppStore = new ReactiveAppStore();

// ============================================================================
// 3. DATA PARSING & FORMATTING UTILITIES
// ============================================================================

/**
 * Extracts 11-character YouTube video ID from arbitrary video and Short URLs.
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

/**
 * Cleans phone number and applies Tunisian international country code (+216)
 * if an 8-digit mobile number is supplied.
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

// ============================================================================
// 4. SUPABASE INTEGRATION METHODS
// ============================================================================

/**
 * Asynchronously queries the public 'mentors' table, ordering entries from
 * newest to oldest, and updates the local AppStore state.
 * Also configures live real-time subscription on the table.
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

    if (error) {
      throw error;
    }

    const formattedMentors = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      whatsappNumber: row.whatsapp_number || row.whatsappNumber,
      youtubeUrl: row.youtube_url || row.youtubeUrl,
      youtubeVideoId: row.youtube_video_id || extractYouTubeId(row.youtube_url || ''),
      bio: row.bio || '',
      category: row.category || 'bac_info',
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? String(row.tags).split(',') : []),
      isFlagship: Boolean(row.is_flagship || row.isFlagship),
      feynmanTopic: row.feynman_topic || row.feynmanTopic || 'Concept IT',
      createdAt: row.created_at || new Date().toISOString(),
    }));

    AppStore.setState({
      mentors: formattedMentors,
      isLoading: false,
      lastSync: new Date().toISOString(),
    });

    return formattedMentors;
  } catch (err) {
    console.error('[Mentorini API] fetchMentors() error:', err);
    AppStore.setState({
      isLoading: false,
      error: err.message || 'Error fetching mentors from database',
    });
    return AppStore.getState().mentors;
  }
}

/**
 * Initializes a real-time subscription on the 'mentors' table to synchronize
 * live inserts/updates directly into AppStore.
 */
export function subscribeToMentorsRealtime() {
  const channel = supabase
    .channel('mentors-realtime-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mentors' },
      (payload) => {
        const newRow = payload.new;
        const newMentor = {
          id: newRow.id,
          name: newRow.name,
          status: newRow.status,
          whatsappNumber: newRow.whatsapp_number || newRow.whatsappNumber,
          youtubeUrl: newRow.youtube_url || newRow.youtubeUrl,
          youtubeVideoId: newRow.youtube_video_id || extractYouTubeId(newRow.youtube_url || ''),
          bio: newRow.bio || '',
          category: newRow.category || 'bac_info',
          tags: Array.isArray(newRow.tags) ? newRow.tags : [],
          isFlagship: Boolean(newRow.is_flagship),
          feynmanTopic: newRow.feynman_topic || 'Concept IT',
          createdAt: newRow.created_at,
        };

        const currentMentors = AppStore.getState().mentors;
        // Avoid duplicate insertion
        if (!currentMentors.some((m) => m.id === newMentor.id)) {
          AppStore.setState({
            mentors: [newMentor, ...currentMentors],
          });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Inserts a new mentee profile record into the cloud 'users' table while
 * caching a session block in browser 'localStorage'.
 *
 * @param {Object} userData - Mentee details (name, email, educationalLevel, fieldOfStudy)
 * @returns {Promise<Object>} Created user record
 */
export async function saveUser(userData) {
  if (!userData || !userData.name) {
    throw new Error('User name is required for registration.');
  }

  const payload = {
    name: String(userData.name).trim(),
    email: userData.email ? String(userData.email).trim().toLowerCase() : null,
    phone: userData.phone ? cleanPhoneNumber(userData.phone) : null,
    educational_level: userData.educationalLevel || userData.educational_level || 'Bac Info',
    field_of_study: userData.fieldOfStudy || userData.field_of_study || 'Computer Science',
    interests: Array.isArray(userData.interests) ? userData.interests : [],
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const sessionUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      educationalLevel: data.educational_level,
      fieldOfStudy: data.field_of_study,
      createdAt: data.created_at,
    };

    // Cache session in state and localStorage
    AppStore.setState({ activeUser: sessionUser });

    return sessionUser;
  } catch (err) {
    console.error('[Mentorini API] saveUser() error:', err);
    // Fallback: Create and persist an offline session so user is not blocked
    const offlineSessionUser = {
      id: `local-user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      educationalLevel: payload.educational_level,
      fieldOfStudy: payload.field_of_study,
      isOfflineCached: true,
      createdAt: new Date().toISOString(),
    };
    AppStore.setState({ activeUser: offlineSessionUser });
    return offlineSessionUser;
  }
}

/**
 * Validates, cleans, and commits an onboarding mentor record directly into
 * the Supabase 'mentors' table, updating AppStore state.
 *
 * @param {Object} mentorData - Form input from mentor onboarding
 * @returns {Promise<Object>} Registered mentor profile
 */
export async function submitMentorRegistration(mentorData) {
  if (!mentorData) {
    throw new Error('Mentor registration payload cannot be empty.');
  }

  // Validation
  const name = String(mentorData.name || '').trim();
  const status = String(mentorData.status || '').trim();
  const rawPhone = String(mentorData.whatsappNumber || mentorData.phone || '').trim();
  const youtubeUrl = String(mentorData.youtubeUrl || '').trim();
  const feynmanTopic = String(mentorData.feynmanTopic || '').trim();
  const bio = String(mentorData.bio || '').trim();
  const category = mentorData.category || 'bac_info';

  if (!name) throw new Error('Esmek w la9bek required.');
  if (!status) throw new Error('Current Status required.');
  if (!rawPhone) throw new Error('Noumrou WhatsApp required.');

  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    throw new Error('Lien YouTube ghalet wala na9es. Lazim video valid fih concept b Feynman Technique.');
  }

  const cleanPhone = cleanPhoneNumber(rawPhone);

  const dbPayload = {
    name,
    status,
    whatsapp_number: cleanPhone,
    youtube_url: youtubeUrl,
    youtube_video_id: videoId,
    feynman_topic: feynmanTopic || 'Concept IT bel Tounsi',
    bio,
    category,
    tags: Array.isArray(mentorData.tags) && mentorData.tags.length > 0 
      ? mentorData.tags 
      : [category, 'Peer Mentor'],
    is_flagship: Boolean(mentorData.isFlagship),
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('mentors')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const newMentor = {
      id: data.id,
      name: data.name,
      status: data.status,
      whatsappNumber: data.whatsapp_number,
      youtubeUrl: data.youtube_url,
      youtubeVideoId: data.youtube_video_id,
      bio: data.bio,
      category: data.category,
      tags: data.tags || [],
      isFlagship: data.is_flagship,
      feynmanTopic: data.feynman_topic,
      createdAt: data.created_at,
    };

    // Prepend to current local state so it appears immediately
    const currentList = AppStore.getState().mentors;
    AppStore.setState({
      mentors: [newMentor, ...currentList.filter((m) => m.id !== newMentor.id)],
    });

    return newMentor;
  } catch (err) {
    console.error('[Mentorini API] submitMentorRegistration() error:', err);
    // Optimistic fallback for local preview / zero-cost resilience
    const fallbackMentor = {
      id: `local-mentor-${Date.now()}`,
      name: dbPayload.name,
      status: dbPayload.status,
      whatsappNumber: dbPayload.whatsapp_number,
      youtubeUrl: dbPayload.youtube_url,
      youtubeVideoId: dbPayload.youtube_video_id,
      bio: dbPayload.bio,
      category: dbPayload.category,
      tags: dbPayload.tags,
      isFlagship: false,
      feynmanTopic: dbPayload.feynman_topic,
      createdAt: new Date().toISOString(),
      isOfflineCached: true,
    };

    const currentList = AppStore.getState().mentors;
    AppStore.setState({
      mentors: [fallbackMentor, ...currentList],
    });

    return fallbackMentor;
  }
}

// ============================================================================
// 5. INTERACTIVE WHATSAPP DEEP-LINK ROUTING ENGINE
// ============================================================================

/**
 * Builds and executes a native mobile device redirect protocol via standard 'wa.me' paths.
 * Formats phone number, safely encodes message parameters, and triggers navigation.
 *
 * @param {string} phone - Target phone number (e.g. '21698123456' or '98123456')
 * @param {string} text - Message pre-fill string (or custom query)
 * @returns {string} The fully constructed WhatsApp deep-link URL
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

  // Execute native mobile redirection if running in a browser environment
  if (typeof window !== 'undefined') {
    // Attempt location redirection or window.open for desktop tabs
    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn('[WhatsApp Redirect] Automatic window navigation blocked by browser policy:', err);
    }
  }

  return waUrl;
}

// ============================================================================
// 6. DEFAULT INITIALIZER
// ============================================================================

/**
 * Bootstraps the application: fetches initial mentors, connects real-time
 * listener, and logs readiness.
 */
export async function initializeMentoriniApp() {
  console.log('🚀 [Mentorini] Initializing production state & Supabase integration...');
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
  fetchMentors,
  subscribeToMentorsRealtime,
  saveUser,
  submitMentorRegistration,
  executeWhatsAppRedirect,
  extractYouTubeId,
  cleanPhoneNumber,
  initializeMentoriniApp,
};
