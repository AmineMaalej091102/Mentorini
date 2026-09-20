/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Visual Presentation & Layout Module (ui.js)
 * 
 * Instagram-Style Equality Architecture:
 * 1. 0-Friction Entry View:
 *    - No role selection cards, no custom passwords/text inputs.
 *    - Unique Value Manifesto: "T7eb tadhrob el blocker mte3ek fi draj? Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek."
 *    - Single prominent thumb-friendly button: "💬 Edkhel bel Google mte3ek tawa direct" triggering loginWithGoogle().
 * 
 * 2. Universal Discovery Feed View:
 *    - Mentees and mentors scroll the exact same egalitarian feed.
 *    - Dynamic user cards with 16:9 horizontal YouTube 'video_url' & 'bio' governed by Video-Watch Lock.
 *    - Connect button reads "🔒 Tfarrej fil video bech tconnecti" until played, turning into indigo "💬 Connecti m3ah tawa direct".
 * 
 * 3. The Creator Engine & Safe Area Overrides:
 *    - Floating UI button '[+]' / 'Abda Share' opening modal prompting "Abda share el knowledge mte3ek"
 *      with Bio textarea and Horizontal 16:9 YouTube video embed input.
 *    - Submitting triggers updateProfileContent(bio, videoUrl).
 *    - Sticky bottom bar enforcing: 'padding-bottom: calc(16px + env(safe-area-inset-bottom))'.
 */

import { 
  AppStore, 
  loginWithGoogle,
  signInWithGoogle, 
  checkUserSession,
  signOutUser,
  updateProfileContent,
  updateUserKnowledge,
  fetchMentors, 
  executeWhatsAppRedirect, 
  extractYouTubeId, 
  cleanPhoneNumber 
} from './app.js';

// ============================================================================
// 1. GLOBAL ACTION DISPATCHER & LIFECYCLE ROUTING
// ============================================================================

if (typeof window !== 'undefined') {
  // Theme Manager handling system, dark, and light modes
  window.ThemeManager = {
    setTheme: (mode) => {
      localStorage.setItem('mentorini_theme_mode_v1', mode);
      const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      const selector = document.getElementById('theme-selector');
      if (selector && selector.value !== mode) {
        selector.value = mode;
      }
    },
    init: () => {
      const saved = localStorage.getItem('mentorini_theme_mode_v1') || 'system';
      window.ThemeManager.setTheme(saved);
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          const current = localStorage.getItem('mentorini_theme_mode_v1') || 'system';
          if (current === 'system') {
            window.ThemeManager.setTheme('system');
          }
        });
      }
    }
  };

  // Tab router
  window.switchTab = (tabName) => {
    AppStore.setTab(tabName);
  };

  window.MentoriniActions = {
    // Tab router
    setTab: (tabName) => {
      AppStore.setTab(tabName);
    },

    // Inspect individual mentor profile
    viewProfile: (mentorId) => {
      AppStore.setActiveProfile(mentorId);
    },

    // Unified 0-Friction Google Login Trigger
    loginWithGoogle: async () => {
      const feedbackEl = document.getElementById('auth-feedback');
      if (feedbackEl) {
        feedbackEl.className = 'p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3';
        feedbackEl.innerHTML = '⏳ 9a3din n-connectiw fik bel Google mte3ek...';
        feedbackEl.classList.remove('hidden');
      }

      try {
        const result = await loginWithGoogle();
        if (result && result.user) {
          if (feedbackEl) {
            feedbackEl.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-3';
            feedbackEl.innerHTML = `🎉 Mar7be bik ya ${result.user.name}! Dkhalna direct fil feed.`;
          }
        }
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `⚠️ Oops! ${err.message || 'Mochkla fi Google Login.'}`;
          feedbackEl.classList.remove('hidden');
        }
      }
    },

    signInWithGoogle: async () => {
      return window.MentoriniActions.loginWithGoogle();
    },

    // Logout session
    logout: async () => {
      await signOutUser();
    },

    // Video-Watch Lock trigger: unlocks button instantly when user plays the video
    playAndUnlockVideo: (mentorId, videoId) => {
      AppStore.unlockMentorVideo(mentorId);
      const container = document.getElementById(`video-box-${mentorId}`);
      if (container && videoId) {
        container.innerHTML = `
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1" 
            title="Feynman Concept Video" 
            class="w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
          ></iframe>
        `;
      }
      const btnContainer = document.getElementById(`action-btn-box-${mentorId}`);
      const mentor = AppStore.getState().mentors.find(m => String(m.id) === String(mentorId));
      if (btnContainer && mentor) {
        btnContainer.innerHTML = renderContactButton(mentor, true);
      }
    },

    // WhatsApp Deep-Link Execution
    connectWhatsApp: (phone, mentorName, topic) => {
      const cleanName = mentorName ? mentorName.split(' ')[0] : 'Mentor';
      const text = `3aslema ya ${cleanName}! 👋 Choft profil mte3ek 3la Mentorini mta3 "${topic || 'Concept IT'}". 3andi blocker 9sir w 7abit nestachirek ken ma y9al9ekch!`;
      executeWhatsAppRedirect(phone, text);
    },

    // Open Creator Engine Modal Sheet
    openShareModal: () => {
      const state = AppStore.getState();
      const user = state.userSession || state.activeUser;
      if (!user) {
        const confirmGo = confirm('Lazmek tkoun connecti bel Google mte3ek se3a bech t-partagi! T7eb tconnecti tawa b clique wa7da?');
        if (confirmGo) {
          window.MentoriniActions.loginWithGoogle();
        }
        return;
      }
      const modal = document.getElementById('share-knowledge-modal');
      if (modal) {
        modal.classList.remove('hidden');
        const bioInput = document.getElementById('share-bio-input');
        const videoInput = document.getElementById('share-video-input');
        if (bioInput && user.bio) bioInput.value = user.bio;
        if (videoInput && (user.video_url || user.youtubeUrl)) {
          videoInput.value = user.video_url || user.youtubeUrl;
        }
      }
      AppStore.setShareModalOpen(true);
    },

    // Close Creator Engine Modal Sheet
    closeShareModal: () => {
      const modal = document.getElementById('share-knowledge-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      AppStore.setShareModalOpen(false);
    },

    // Handle Knowledge Sharing submission -> triggers updateProfileContent
    handleShareKnowledge: async (event) => {
      event.preventDefault();
      const form = event.target;
      const bio = form.bio ? form.bio.value.trim() : '';
      const videoUrl = form.videoUrl ? form.videoUrl.value.trim() : '';
      const feedbackEl = document.getElementById('share-feedback');

      if (!bio) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = '⚠️ A3mel bio 9sira w 7ot feha chnowa tnajjem t3awen w les liens Drive/GitHub mte3ek.';
          feedbackEl.classList.remove('hidden');
        }
        return;
      }

      if (feedbackEl) {
        feedbackEl.className = 'p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3';
        feedbackEl.innerHTML = '⏳ 9a3din n-syncou fil knowledge mte3ek fil cloud (patch query)...';
        feedbackEl.classList.remove('hidden');
      }

      try {
        // Trigger required updateProfileContent action
        const result = await updateProfileContent(bio, videoUrl);
        if (result.success) {
          if (feedbackEl) {
            feedbackEl.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-3';
            feedbackEl.innerHTML = '🚀 Sa77a ya creator! L-knowledge mte3ek t-partaga tawa fil feed direct!';
          }
          setTimeout(() => {
            window.MentoriniActions.closeShareModal();
            AppStore.setTab('feed');
          }, 800);
        }
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `⚠️ ${err.message || 'Mochkla fil mise à jour.'}`;
          feedbackEl.classList.remove('hidden');
        }
      }
    },
  };
}

// ============================================================================
// 2. TEXT & RESOURCE URL PARSER (DRIVE / GITHUB / NOTION)
// ============================================================================

export function formatBioWithPills(text) {
  if (!text) return '<span class="text-zinc-400 italic">Ma famech bio maktouba l-tawa.</span>';
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return escaped.replace(urlRegex, (url) => {
    let label = '🔗 Lien';
    if (url.includes('drive.google')) label = '📁 Google Drive';
    else if (url.includes('github.com')) label = '💻 GitHub';
    else if (url.includes('notion')) label = '📝 Notion';
    else if (url.includes('youtube.com') || url.includes('youtu.be')) label = '▶ Video 16:9';

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] hover:underline mx-0.5">${label} ↗</a>`;
  });
}

// ============================================================================
// 3. SPECIFICATION 1: 0-FRICTION ENTRY VIEW (EGALITARIAN ONBOARDING)
// ============================================================================

/**
 * 0-Friction Entry View:
 * - Drops all role selection cards and custom text input fields entirely.
 * - Value Manifesto in friendly Tunisian Arabizi:
 *   "T7eb tadhrob el blocker mte3ek fi draj? Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek."
 * - Directly underneath, a single prominent, thumb-friendly login button:
 *   "💬 Edkhel bel Google mte3ek tawa direct" triggering loginWithGoogle().
 */
export function renderSignUpView(state = {}) {
  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Top Badge -->
      <div class="flex items-center justify-between">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Egalitarian Peer Network • 100% Free 🇹🇳</span>
        </div>
        <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Bac Info & IT Pro</span>
      </div>

      <!-- Unique Value Manifesto Card in Friendly Tunisian Arabizi -->
      <div class="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 shadow-sm space-y-3">
        
        <div class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-black uppercase tracking-wide">
          ✨ Zero-Friction Social Learning
        </div>

        <h1 class="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
          T7eb tadhrob el blocker mte3ek fi draj?
        </h1>
        
        <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">
          Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: <span class="text-indigo-600 dark:text-indigo-400 font-black">wa9tek w sa7tek.</span>
        </p>

        <!-- Instagram Equality Pillars -->
        <div class="space-y-2 pt-2 text-xs text-zinc-800 dark:text-zinc-200">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
            <span><strong>Instagram Equality:</strong> Dkhol blech 9youyat. Kol mentee ynajem ykoun creator bel bouton (+).</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
            <span><strong>16:9 Feynman Videos:</strong> Des concepts IT s3ab mfassrin fi 5 d9aye9 bel lahja mte3na.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
            <span><strong>Video-Watch Lock:</strong> Tfarrej fil video bech t-unlooki l-WhatsApp mte3ou direct blech $0.</span>
          </div>
        </div>
      </div>

      <!-- Single 1-Tap Google Entry Container (No text fields, no role cards) -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <!-- Feedback Alert Banner -->
        <div id="auth-feedback" class="hidden"></div>

        <!-- THE PROMINENT THUMB-FRIENDLY LOGIN BUTTON -->
        <button 
          type="button" 
          id="btn-google-login"
          onclick="MentoriniActions.loginWithGoogle()"
          class="w-full py-4 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-black tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer border border-indigo-500"
        >
          <svg class="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="font-extrabold text-sm">💬 Edkhel bel Google mte3ek tawa direct</span>
        </button>

        <p class="text-[11px] text-center text-zinc-500 dark:text-zinc-400 font-medium">
          🔒 Données sécurisées via Supabase Auth. Accès 100% gratuit lil feed.
        </p>

        <!-- Direct browse fallback -->
        <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('feed')" 
            class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            T7eb tchouf el feed se3a? Chouf les mentors houni →
          </button>
        </div>

      </div>

    </section>
  `;
}

// Map sign-in view directly to unified 0-friction onboarding
export function renderSignInView(state = {}) {
  return renderSignUpView(state);
}

// ============================================================================
// 4. SPECIFICATION 2: UNIVERSAL DISCOVERY FEED (VIDEO-WATCH LOCK)
// ============================================================================

/**
 * Renders the WhatsApp Connect Button governed by Video-Watch Lock:
 * - Locked: reads "🔒 Tfarrej fil video bech tconnecti"
 * - Unlocked: reads indigo "💬 Connecti m3ah tawa direct"
 */
export function renderContactButton(mentor, isUnlocked) {
  const hasVideo = Boolean(mentor.youtubeVideoId || mentor.youtubeUrl || mentor.video_url);

  if (!hasVideo || isUnlocked) {
    return `
      <button 
        type="button" 
        onclick="MentoriniActions.connectWhatsApp('${mentor.whatsappNumber || mentor.phone}', '${(mentor.name || '').replace(/'/g, "\\'")}', '${(mentor.feynmanTopic || '').replace(/'/g, "\\'")}')"
        class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 cursor-pointer"
      >
        <span>💬</span>
        <span class="font-black text-xs">Connecti m3ah tawa direct</span>
      </button>
    `;
  }

  return `
    <button 
      type="button" 
      disabled 
      class="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold text-xs py-3.5 px-4 rounded-xl cursor-not-allowed border border-zinc-200 dark:border-zinc-800"
      title="Tfarrej fil video bech t-unlocki l-bouton"
    >
      <span>🔒</span>
      <span>Tfarrej fil video bech tconnecti</span>
    </button>
  `;
}

export function renderFeedSummaryCard(mentor, isUnlocked = false) {
  const videoId = mentor.youtubeVideoId || extractYouTubeId(mentor.youtubeUrl || mentor.video_url || '');
  const cleanCategory = mentor.category ? mentor.category.toUpperCase().replace('_', ' ') : 'IT';
  const hasVideo = Boolean(videoId);

  return `
    <article 
      onclick="MentoriniActions.viewProfile('${mentor.id}')"
      class="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer group"
    >
      
      <!-- Card Top Bar -->
      <div class="p-4 pb-2.5 flex items-start justify-between gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            ${(mentor.name || 'M').charAt(0)}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="font-black text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                ${mentor.name}
              </h3>
              ${mentor.isFlagship ? `
                <span class="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800">
                  ★ Flagship
                </span>
              ` : ''}
            </div>
            <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
              ${mentor.status || 'Peer Mentor IT'}
            </p>
          </div>
        </div>

        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
          ${cleanCategory}
        </span>
      </div>

      <!-- Horizontal 16:9 Aspect Ratio Video Embed Preview or Bio -->
      <div class="px-4 pb-3">
        ${hasVideo ? `
          <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
            
            <div class="absolute top-2 left-2 z-10 bg-zinc-900/90 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-800 truncate max-w-[85%]">
              Feynman: ${mentor.feynmanTopic || 'Concept IT bel Tounsi'}
            </div>

            <div class="flex flex-col items-center justify-center p-3 text-center">
              <div class="w-11 h-11 rounded-full bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform mb-1.5">
                <span class="text-white text-sm font-black ml-0.5">▶</span>
              </div>
              <p class="text-xs font-bold text-white">
                Tfarrej fil Concept (16:9 bel Tounsi)
              </p>
              <p class="text-[10px] text-zinc-400 mt-0.5">
                ${isUnlocked ? '✅ Unlocked! Click bech tchouf l-profile' : '🔒 Click bech t-unlooki l-WhatsApp mte3ou'}
              </p>
            </div>

          </div>
        ` : `
          <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
            <p class="line-clamp-2">
              ${mentor.bio ? formatBioWithPills(mentor.bio) : 'Peer mentor ready to share knowledge and help via WhatsApp direct.'}
            </p>
          </div>
        `}
      </div>

      <!-- Card Footer CTA -->
      <div class="px-4 pb-3.5 pt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
        <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span>${hasVideo ? (isUnlocked ? '🔓 WhatsApp Wa7dou' : '🔒 Video-Watch Lock') : '💬 WhatsApp Direct'}</span>
        </span>
        <span class="font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>Chouf l-Profile</span>
          <span>→</span>
        </span>
      </div>

    </article>
  `;
}

/**
 * Universal Discovery Feed View:
 * Mentees and mentors scroll the exact same feed layout.
 */
export function renderUniversalFeed(state = {}) {
  const mentors = state.mentors || [];
  const watchedSet = state.watchedVideos instanceof Set 
    ? state.watchedVideos 
    : new Set(state.watchedVideos || []);

  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Top Manifesto Micro-Banner -->
      <div class="bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
        <div>
          <p class="text-xs font-black text-zinc-900 dark:text-white">
            T7eb tadhrob el blocker mte3ek fi draj?
          </p>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
            Houni lma3nelkom el peer mentors el kol fi blassa we7da.
          </p>
        </div>
        <button 
          type="button" 
          onclick="MentoriniActions.openShareModal()"
          class="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-black text-xs shadow-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        >
          <span class="text-sm font-black">＋</span>
          <span>Abda Share</span>
        </button>
      </div>

      <!-- Feed List Header -->
      <div class="flex items-center justify-between px-1">
        <h2 class="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Peer Mentors Mawjoudin (${mentors.length})
        </h2>
        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Database
        </span>
      </div>

      <!-- Feed Cards Container -->
      <div class="space-y-3.5">
        ${mentors.length === 0 ? `
          <div class="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
            <p class="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Ma famech mentors l-tawa!</p>
            <p>Koun enti awwel mentor y-partagi el knowledge mte3ou.</p>
            <button 
              type="button" 
              onclick="MentoriniActions.openShareModal()"
              class="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              ＋ Abda Share El Knowledge
            </button>
          </div>
        ` : mentors.map(m => renderFeedSummaryCard(m, watchedSet.has(String(m.id)))).join('')}
      </div>

    </section>
  `;
}

// ============================================================================
// 5. VIEW: PROFILE VIEW (INDIVIDUAL MENTOR INSPECTOR & VIDEO-WATCH LOCK)
// ============================================================================

export function renderProfileView(state = {}) {
  const profileId = state.activeProfileId;
  const mentors = state.mentors || [];
  const mentor = mentors.find((m) => String(m.id) === String(profileId));

  if (!mentor) {
    return `
      <section class="p-6 text-center space-y-3 animate-fadeIn">
        <p class="text-sm font-bold text-zinc-700 dark:text-zinc-300">Profil hedha ma l9inech bih data.</p>
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('feed')" 
          class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          ← Erja3 lil Feed
        </button>
      </section>
    `;
  }

  const isUnlocked = AppStore.isVideoUnlocked(mentor.id);
  const videoId = mentor.youtubeVideoId || extractYouTubeId(mentor.youtubeUrl || mentor.video_url || '');
  const parsedBio = formatBioWithPills(mentor.bio);
  const hasVideo = Boolean(videoId);

  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between">
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('feed')" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
        >
          <span>←</span>
          <span>Erja3 lil Feed</span>
        </button>
        <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          ${mentor.category ? mentor.category.toUpperCase().replace('_', ' ') : 'IT'}
        </span>
      </div>

      <!-- Profile Header Identity Card -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm">
        <div class="flex items-start gap-3.5">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
            ${(mentor.name || 'M').charAt(0)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h2 class="text-base font-black text-zinc-900 dark:text-zinc-50 truncate">
                ${mentor.name}
              </h2>
              ${mentor.isFlagship ? `
                <span class="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800">
                  ★ Founder
                </span>
              ` : ''}
            </div>
            <p class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              ${mentor.status || 'Peer Mentor IT'}
            </p>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
              <span>📍 Tounes 🇹🇳</span>
              <span>•</span>
              <span>Direct WhatsApp Peer</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Horizontal (16:9) Embed YouTube aspect-video Wrapper -->
      ${hasVideo ? `
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          
          <div class="bg-zinc-900 text-zinc-200 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-zinc-800">
            <span class="truncate">Feynman: <strong class="text-white font-black">${mentor.feynmanTopic || 'Concept IT bel Tounsi'}</strong></span>
            <span class="text-red-500 font-black text-[11px] shrink-0">▶ 16:9 YouTube</span>
          </div>

          <div id="video-box-${mentor.id}" class="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
            ${isUnlocked ? `
              <iframe 
                src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1" 
                title="Feynman Concept Video" 
                class="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
              ></iframe>
            ` : `
              <div 
                onclick="MentoriniActions.playAndUnlockVideo('${mentor.id}', '${videoId}')"
                class="group cursor-pointer relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition-colors p-4 text-center"
              >
                <div class="w-14 h-14 rounded-full bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform mb-2">
                  <span class="text-white text-lg font-black ml-0.5">▶</span>
                </div>
                <p class="text-xs font-black text-white">
                  Tfarrej fil concept bel Tounsi (16:9)
                </p>
                <p class="text-[11px] text-zinc-400 mt-0.5">
                  Click bech t-unlooki noumrou l-WhatsApp direct
                </p>
              </div>
            `}
          </div>

          <div class="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">
              ${isUnlocked ? '✅ <strong class="text-emerald-500">Video mtfarrej fih!</strong>' : '🔒 Lazim tchouf l-video 9bal ma tconnecti'}
            </span>
            ${!isUnlocked ? `
              <button 
                type="button" 
                onclick="MentoriniActions.playAndUnlockVideo('${mentor.id}', '${videoId}')" 
                class="text-indigo-500 hover:text-indigo-400 text-[11px] font-bold underline cursor-pointer"
              >
                Choftou déjà? Unlocki
              </button>
            ` : ''}
          </div>

        </div>
      ` : ''}

      <!-- CTA Contact Target (WhatsApp Deep-Link Redirect) -->
      <div id="action-btn-box-${mentor.id}">
        ${renderContactButton(mentor, isUnlocked)}
      </div>

      <!-- Bio & Resource Direct Links Box -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 class="text-xs font-black text-zinc-800 dark:text-zinc-200">
          A propos de ${mentor.name.split(' ')[0]} & Resources
        </h3>
        <div class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          ${parsedBio}
        </div>
      </div>

    </section>
  `;
}

// ============================================================================
// 6. VIEW: DASHBOARD VIEW
// ============================================================================

export function renderDashboardView(state = {}) {
  const user = state.userSession || state.activeUser;
  const watchedCount = state.watchedVideos instanceof Set 
    ? state.watchedVideos.size 
    : (Array.isArray(state.watchedVideos) ? state.watchedVideos.length : 0);
  const mentorsCount = (state.mentors || []).length;

  if (!user) {
    return `
      <section class="space-y-4 animate-fadeIn p-2">
        <div class="bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 text-center shadow-sm">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-black text-xl mb-3 shadow-inner">
            👤
          </div>
          <h2 class="text-base font-black text-zinc-900 dark:text-white">
            Espace Compte Mentorini
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px] mx-auto">
            Dkhol bel Google mte3ek bech t-partagi l-knowledge w t-gérer l-statut mte3ek.
          </p>
          <div class="mt-4 flex flex-col gap-2">
            <button 
              type="button" 
              onclick="MentoriniActions.loginWithGoogle()" 
              class="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>💬 Edkhel bel Google mte3ek tawa direct →</span>
            </button>
          </div>
        </div>

        <!-- Quick Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${mentorsCount}</span>
            <p class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Peer Mentors Active</p>
            <p class="text-[10px] text-zinc-400 mt-0.5">Fil IT w Bac Info</p>
          </div>
          <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
            <span class="text-2xl font-black text-emerald-500">${watchedCount}</span>
            <p class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Videos Unlocked</p>
            <p class="text-[10px] text-zinc-400 mt-0.5">Concepts mtfarrej fehom</p>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="space-y-4 animate-fadeIn p-1">
      
      <!-- Profile Welcome Card -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-md">
              ${user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h2 class="text-base font-black text-zinc-900 dark:text-white">
                ${user.name}
              </h2>
              <p class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                ${user.role === 'mentor' ? '🛠️ Peer Mentor IT' : '🎓 Active Peer'}
              </p>
              <p class="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[180px]">
                ${user.email || 'Compte Google vérifié'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onclick="MentoriniActions.logout()" 
            class="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <!-- PROMINENT SOCIAL CREATOR ENGINE CARD -->
      <div class="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden border border-indigo-500/40">
        <div class="relative z-10 space-y-3">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold tracking-wide">
              <span>✨ Peer Creator Engine</span>
            </span>
            <span class="text-xs font-black text-indigo-200">16:9 Video + Bio</span>
          </div>

          <div>
            <h3 class="text-base font-black leading-tight text-white">
              Abda share el knowledge mte3ek
            </h3>
            <p class="text-xs text-indigo-100 leading-relaxed mt-1">
              Baddel statut mte3ek men viewer l-creator w 3awen wled bledna: 7ot des liens Drive/GitHub w video YouTube 16:9 bel Tounsi.
            </p>
          </div>

          <!-- The Prominent '+' Action Button -->
          <button 
            type="button" 
            onclick="MentoriniActions.openShareModal()"
            class="w-full py-3 px-4 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-[0.98] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <span class="text-lg leading-none font-black text-indigo-600">＋</span>
            <span>Abda share el knowledge mte3ek</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span class="text-2xl font-black text-indigo-600 dark:text-indigo-400">${watchedCount}</span>
          <p class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Concepts Mtfarrej Fehom</p>
          <p class="text-[10px] text-zinc-400 mt-0.5">Video-Watch Unlocked</p>
        </div>
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <span class="text-2xl font-black text-emerald-500">$0</span>
          <p class="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-1">Frais Déboursés</p>
          <p class="text-[10px] text-zinc-400 mt-0.5">100% Peer-to-Peer gratuit</p>
        </div>
      </div>

    </section>
  `;
}

// ============================================================================
// 7. VIEW: IDEA MANIFESTO VIEW
// ============================================================================

export function renderIdeaView(state = {}) {
  return `
    <section class="space-y-4 animate-fadeIn p-1">
      
      <!-- Big Manifesto Header -->
      <div class="bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-800/60 space-y-3">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-800/60 border border-indigo-700 text-indigo-200 text-[10px] font-mono font-bold">
          💡 El Fekra mta3 Mentorini
        </div>
        <h1 class="text-base font-black leading-snug">
          T7eb tadhrob el blocker mte3ek fi draj?
        </h1>
        <p class="text-xs text-zinc-300 leading-relaxed">
          Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek.
        </p>
      </div>

      <!-- 3 Strategic Pillars -->
      <div class="space-y-3 text-xs">
        
        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">🧠</span>
            <h3 class="font-black text-zinc-900 dark:text-white">1. Feynman Technique bel Tounsi</h3>
          </div>
          <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            A7san tari9a bech tet3alem concept s3ib (Algo, Recursion, Pointers, OOP) hiya ki yfasserhoulek chkoun 9riblek fel 3mor w bel lahja mte3na fi video 16:9 9sir.
          </p>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">🔒</span>
            <h3 class="font-black text-zinc-900 dark:text-white">2. Video-Watch Contact Lock</h3>
          </div>
          <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Noumrou l-WhatsApp ma yet-unlooka ken ba3d ma l-mentee yetfarrej fil video. Hedha y7mi wa9t l-mentors w ythabbet l-jaddiya mta3 l-mentees.
          </p>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">🚀</span>
            <h3 class="font-black text-zinc-900 dark:text-white">3. Instagram Equality Model</h3>
          </div>
          <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Kol 3abd dkhal b compte Google ynajem ykoun mentee wa9t ma y7eb, w ynajem ykoun creator wa9t ma y7eb bel bouton (+). Direct peer-to-peer connection blech flous ($0).
          </p>
        </div>

      </div>

    </section>
  `;
}

// ============================================================================
// 8. SPECIFICATION 3: THE CREATOR ENGINE (MODAL SHEET & HARDWARE OVERRIDES)
// ============================================================================

/**
 * Slide-up Modal Sheet: Prompting "Abda share el knowledge mte3ek"
 * Form fields:
 * 1. Bio textarea (for description text and Drive/GitHub URLs)
 * 2. Horizontal 16:9 YouTube video embed text input
 * Submitting triggers updateProfileContent(bio, videoUrl).
 */
export function renderShareKnowledgeModal(state = {}) {
  const user = state.userSession || state.activeUser;
  const isHidden = !state.isShareModalOpen;

  return `
    <div 
      id="share-knowledge-modal" 
      class="${isHidden ? 'hidden' : ''} fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity"
    >
      <div 
        style="padding-bottom: calc(20px + env(safe-area-inset-bottom))"
        class="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-[28px] sm:rounded-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp"
      >
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div class="space-y-0.5">
            <h2 class="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <span>✨</span>
              <span>Abda share el knowledge mte3ek</span>
            </h2>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Baddel statut mte3ek men viewer l-creator w 3awen wled bledna 🇹🇳
            </p>
          </div>
          <button 
            type="button" 
            onclick="MentoriniActions.closeShareModal()" 
            class="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Feedback Banner -->
        <div id="share-feedback" class="hidden"></div>

        <!-- Form: Bio Textarea + Horizontal 16:9 YouTube Video Input -->
        <form onsubmit="MentoriniActions.handleShareKnowledge(event)" class="space-y-3.5 text-xs">
          
          <!-- Field 1: Bio Textarea -->
          <div>
            <label class="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Bio & Resources (Drive / GitHub / Notion) <span class="text-red-500">*</span>
            </label>
            <textarea 
              id="share-bio-input"
              name="bio" 
              rows="4" 
              required
              placeholder="Fasser chnowa tnajjem t3awen fih w 7ot des liens Drive/GitHub mte3ek houni (Ex: N3awen fi Algo w Python. Heda dossier el cours: https://drive.google.com/... w code: https://github.com/...)"
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >${user && user.bio ? user.bio : ''}</textarea>
            <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              💡 Les liens Drive w GitHub yetbadlou automatiquemenet en boutons cliquables.
            </p>
          </div>

          <!-- Field 2: Horizontal 16:9 YouTube Video Embed Input -->
          <div>
            <label class="block font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Lien YouTube Feynman Video (Format 16:9 Horizontal) 📺
            </label>
            <input 
              id="share-video-input"
              type="url" 
              name="videoUrl" 
              value="${user && (user.video_url || user.youtubeUrl) ? (user.video_url || user.youtubeUrl) : ''}"
              placeholder="https://www.youtube.com/watch?v=... wala https://youtu.be/..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
              Format 16:9 horizontal — Feynman concept video bel Tounsi.
            </p>
          </div>

          <!-- Actions -->
          <div class="pt-2 flex items-center justify-end gap-2">
            <button 
              type="button" 
              onclick="MentoriniActions.closeShareModal()" 
              class="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <span>🚀</span>
              <span>Partagi fil Feed</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  `;
}

// ============================================================================
// 9. ACTIVE VIEW CONTROLLER & FLOATING CREATOR BUTTON
// ============================================================================

export function renderActiveView(state = {}) {
  const currentTab = state.tabRouter || 'feed';
  let viewHtml = '';

  switch (currentTab) {
    case 'signup':
      viewHtml = renderSignUpView(state);
      break;
    case 'signin':
      viewHtml = renderSignInView(state);
      break;
    case 'feed':
      viewHtml = renderUniversalFeed(state);
      break;
    case 'profile':
      viewHtml = renderProfileView(state);
      break;
    case 'dashboard':
      viewHtml = renderDashboardView(state);
      break;
    case 'idea':
      viewHtml = renderIdeaView(state);
      break;
    default:
      viewHtml = renderUniversalFeed(state);
      break;
  }

  // Floating UI button labeled '[+]' / 'Abda Share' with mobile safe-area offset
  const persistentPlusButton = `
    <button 
      type="button" 
      id="floating-creator-btn"
      onclick="MentoriniActions.openShareModal()"
      title="Abda share el knowledge mte3ek"
      style="bottom: calc(76px + env(safe-area-inset-bottom))"
      class="fixed z-40 right-5 px-3.5 py-2.5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white flex items-center justify-center gap-1.5 font-black text-xs shadow-2xl border-2 border-white/40 dark:border-zinc-800 shadow-indigo-600/50 transition-all cursor-pointer"
    >
      <span class="text-base font-black leading-none">＋</span>
      <span class="font-extrabold tracking-wide">Abda Share</span>
    </button>
  `;

  // Append modal sheet and persistent floating '+' button
  return `
    ${viewHtml}
    ${persistentPlusButton}
    ${renderShareKnowledgeModal(state)}
  `;
}

export function updateNavButtons(currentTab) {
  if (typeof document === 'undefined') return;

  const feedBtn = document.getElementById('nav-feed');
  const dashBtn = document.getElementById('nav-dashboard');
  const ideaBtn = document.getElementById('nav-idea');

  const activeClass = 'text-indigoNeon text-xs font-mono font-bold cursor-pointer transition-colors';
  const inactiveClass = 'text-gray-400 dark:text-gray-500 text-xs font-mono cursor-pointer transition-colors';

  if (feedBtn) feedBtn.className = (currentTab === 'feed' || currentTab === 'profile') ? activeClass : inactiveClass;
  if (dashBtn) dashBtn.className = (currentTab === 'dashboard' || currentTab === 'signup' || currentTab === 'signin') ? activeClass : inactiveClass;
  if (ideaBtn) ideaBtn.className = (currentTab === 'idea') ? activeClass : inactiveClass;
}

// ============================================================================
// 10. MOUNTING & LIFECYCLE CONTROLLER
// ============================================================================

export function mountApp(targetElement = '#app-viewport', store = AppStore) {
  const getContainer = () => {
    if (typeof targetElement === 'string') {
      return document.querySelector(targetElement) || document.querySelector('#app-viewport');
    }
    return targetElement;
  };

  const container = getContainer();

  const render = () => {
    const currentContainer = getContainer();
    if (!currentContainer) return;
    const state = store.getState();
    currentContainer.innerHTML = renderActiveView(state);
    updateNavButtons(state.tabRouter || 'feed');
  };

  if (!container) {
    const timer = setTimeout(() => {
      render();
    }, 50);
    const unsubscribe = store.subscribe(() => {
      render();
    });
    return {
      unmount: () => {
        clearTimeout(timer);
        unsubscribe();
      },
      render,
    };
  }

  // Initial render
  render();

  // Subscription to reactive store
  const unsubscribe = store.subscribe(() => {
    render();
  });

  return {
    unmount: () => {
      unsubscribe();
      const currentContainer = getContainer();
      if (currentContainer) currentContainer.innerHTML = '';
    },
    render,
  };
}

export default {
  renderSignUpView,
  renderSignInView,
  renderUniversalFeed,
  renderProfileView,
  renderDashboardView,
  renderIdeaView,
  renderShareKnowledgeModal,
  renderActiveView,
  renderFeedSummaryCard,
  renderContactButton,
  mountApp,
};
