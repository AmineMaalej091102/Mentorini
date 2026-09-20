/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Frontend Presentation View Engine (ui.js)
 * 
 * Mobile-First Phone Viewport (max-width: 480px)
 * System Theme Defaults (Light / Dark responsive)
 * Authentic Tunisian Arabizi Chat-Dialect Engine (using 3, 7, 9)
 * Directly bound to the Centralized AppStore & Native WhatsApp Deep-Link Engine
 */

import { 
  AppStore, 
  handleSignUp, 
  handleSignIn, 
  fetchMentors, 
  executeWhatsAppRedirect, 
  extractYouTubeId, 
  cleanPhoneNumber 
} from './app.js';

// ============================================================================
// 1. GLOBAL ACTION DISPATCHER & EVENT ROUTING
// ============================================================================

/**
 * Window-level action hub ensuring all string-template handlers route
 * directly into the centralized AppStore and Supabase methods.
 */
if (typeof window !== 'undefined') {
  window.MentoriniActions = {
    // Navigation / Tab router
    setTab: (tabName) => {
      AppStore.setTab(tabName);
    },

    // Inspect individual mentor profile
    viewProfile: (mentorId) => {
      AppStore.setActiveProfile(mentorId);
    },

    // Logout session
    logout: () => {
      AppStore.clearUserSession();
    },

    // Role selection in Sign Up
    selectRole: (role) => {
      const menteeFields = document.getElementById('mentee-role-fields');
      const mentorFields = document.getElementById('mentor-role-fields');
      const roleRadioMentee = document.getElementById('role-mentee-radio');
      const roleRadioMentor = document.getElementById('role-mentor-radio');
      const roleCardMentee = document.getElementById('role-card-mentee');
      const roleCardMentor = document.getElementById('role-card-mentor');

      if (role === 'mentor') {
        if (roleRadioMentor) roleRadioMentor.checked = true;
        if (mentorFields) mentorFields.classList.remove('hidden');
        if (menteeFields) menteeFields.classList.add('hidden');
        if (roleCardMentor) roleCardMentor.className = 'flex-1 p-3 rounded-2xl border-2 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 cursor-pointer transition-all';
        if (roleCardMentee) roleCardMentee.className = 'flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 cursor-pointer transition-all';
      } else {
        if (roleRadioMentee) roleRadioMentee.checked = true;
        if (mentorFields) mentorFields.classList.add('hidden');
        if (menteeFields) menteeFields.classList.remove('hidden');
        if (roleCardMentee) roleCardMentee.className = 'flex-1 p-3 rounded-2xl border-2 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 cursor-pointer transition-all';
        if (roleCardMentor) roleCardMentor.className = 'flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 cursor-pointer transition-all';
      }
    },

    // Video-Watch Lock trigger: unlocks when user plays/clicks video poster
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
      // Re-render button container into unlocked state immediately
      const btnContainer = document.getElementById(`action-btn-box-${mentorId}`);
      const mentor = AppStore.getState().mentors.find(m => String(m.id) === String(mentorId));
      if (btnContainer && mentor) {
        btnContainer.innerHTML = renderContactButton(mentor, true);
      }
    },

    // WhatsApp Deep-Link Execution ($0 direct routing)
    connectWhatsApp: (phone, mentorName, topic) => {
      const cleanName = mentorName ? mentorName.split(' ')[0] : 'Mentor';
      const text = `3aslema ya ${cleanName}! 👋 Choft l-video mte3ek 3la Mentorini mta3 "${topic || 'Concept IT'}". 3andi sou2el 9sir w 7abit nestachirek ken ma y9al9ekch!`;
      executeWhatsAppRedirect(phone, text);
    },

    // Sign Up form submission
    handleSignUpSubmit: async (event) => {
      event.preventDefault();
      const form = event.target;
      const feedbackEl = document.getElementById('signup-feedback');
      const role = form.role.value || 'mentee';

      const payload = {
        role,
        name: form.name.value,
        phone: form.phone.value,
        email: form.email ? form.email.value : '',
      };

      if (role === 'mentor') {
        payload.status = form.status ? form.status.value : 'Peer Mentor IT';
        payload.category = form.category ? form.category.value : 'bac_info';
        payload.youtubeUrl = form.youtubeUrl ? form.youtubeUrl.value : '';
        payload.feynmanTopic = form.feynmanTopic ? form.feynmanTopic.value : 'Concept IT bel Tounsi';
        payload.bio = form.bio ? form.bio.value : '';
      } else {
        payload.educationalLevel = form.educationalLevel ? form.educationalLevel.value : 'Bac Info';
        payload.fieldOfStudy = form.fieldOfStudy ? form.fieldOfStudy.value : 'Informatique';
      }

      if (feedbackEl) {
        feedbackEl.className = 'p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3';
        feedbackEl.innerHTML = '⏳ 9a3din nsajlou fil compte mte3ek fil cloud...';
        feedbackEl.classList.remove('hidden');
      }

      try {
        const session = await handleSignUp(payload);
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `🎉 Mabrouk ya ${session.name}! Tawa tconnectit direct fil feed.`;
        }
        setTimeout(() => {
          AppStore.setTab('feed');
        }, 800);
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `⚠️ Oops! ${err.message || 'Thabbet fil ma3loumet mte3ek.'}`;
          feedbackEl.classList.remove('hidden');
        }
      }
    },

    // Sign In form submission
    handleSignInSubmit: async (event) => {
      event.preventDefault();
      const form = event.target;
      const phoneInput = form.phone.value;
      const feedbackEl = document.getElementById('signin-feedback');

      if (feedbackEl) {
        feedbackEl.className = 'p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3';
        feedbackEl.innerHTML = '⏳ 9a3din nlawjou 3la noumrouk fil base...';
        feedbackEl.classList.remove('hidden');
      }

      const result = await handleSignIn(phoneInput);
      if (result.success) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `✅ Mar7be bik ya ${result.user.name}! Dkhalna fil feed.`;
        }
      } else if (feedbackEl) {
        feedbackEl.className = 'p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold mb-3';
        feedbackEl.innerHTML = `⚠️ ${result.error}`;
      }
    },
  };
}

// ============================================================================
// 2. TEXT HELPERS & SAFE BIO RESOURCE LINK PARSER
// ============================================================================

/**
 * Transforms freeform URLs inside bio text into safe clickable badge pills
 * for Google Drive, GitHub, and Notion repositories.
 */
export function formatBioWithPills(text) {
  if (!text) return '<span class="text-zinc-400 italic">Ma famech bio maktouba.</span>';
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

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] hover:underline mx-0.5">${label} ↗</a>`;
  });
}

// ============================================================================
// 3. VIEW 1: SIGN UP (WITH ARABIZI VALUE MANIFESTO & DUAL ROLES)
// ============================================================================

/**
 * View 1 (Sign Up): Renders the official Tunisian Arabizi Manifesto,
 * dual role choice selector cards (Mentee vs Mentor), and registration form.
 */
export function renderSignUpView(state = {}) {
  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Brand & Zero-Cost Status Pill -->
      <div class="flex items-center justify-between">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero-Cost ($0) Peer Mentorship Tounsi 🇹🇳</span>
        </div>
        <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Bac Info & IT Pro</span>
      </div>

      <!-- High-Converting Value Manifesto Card in Arabizi (using 3, 7, 9) -->
      <div class="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4.5 shadow-sm">
        <h1 class="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug mb-2">
          Erba7 a3az zouz 7weyej 3andek: <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            Wa9tek w l'Energie mte3ek.
          </span>
        </h1>
        
        <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium mb-3">
          Fi 3oudh ma tdhi3 fi <strong>b7ar YouTube</strong> mta3 50 sa3a w forums 9dom w ma ta3rafch chkoun tsada9, l9inalek 
          <span class="font-bold underline decoration-indigo-500 decoration-2 text-zinc-900 dark:text-white">peer mentors mfiltrin b clique wa7da</span>.
        </p>

        <!-- 3 Pillars -->
        <div class="space-y-1.5 text-xs text-zinc-800 dark:text-zinc-200">
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>Feynman Technique:</strong> Kol mentor yfasser concept fi video 9sira bel Tounsi mte3na.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>Video-Watch Lock:</strong> Tfarrej fil video bech t-unlocki l-WhatsApp mte3ou direct blech takssir rass.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>100% Free:</strong> Zero frais ($0). Direct connection bin mentee w mentor.</span>
          </div>
        </div>
      </div>

      <!-- Registration Card Container -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm space-y-4">
        
        <div>
          <h2 class="text-base font-black text-zinc-900 dark:text-zinc-50">
            Créer un Compte Jdid fil Base
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Khtar rôle mte3ek l-youm bech tconnecti:
          </p>
        </div>

        <!-- Dual Role Choice Selector Cards -->
        <div class="grid grid-cols-2 gap-2.5">
          
          <!-- Role 1: Mentee -->
          <div 
            id="role-card-mentee" 
            onclick="MentoriniActions.selectRole('mentee')"
            class="flex-1 p-3 rounded-2xl border-2 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 cursor-pointer transition-all"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-base">📖</span>
              <input type="radio" id="role-mentee-radio" name="role_toggle" value="mentee" checked class="text-indigo-600 focus:ring-indigo-500" />
            </div>
            <p class="text-xs font-black text-zinc-900 dark:text-white leading-tight">
              T7eb Tet3alem Kahw
            </p>
            <p class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              (Mentee - Bac / Fac)
            </p>
          </div>

          <!-- Role 2: Mentor -->
          <div 
            id="role-card-mentor" 
            onclick="MentoriniActions.selectRole('mentor')"
            class="flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 cursor-pointer transition-all"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-base">🛠️</span>
              <input type="radio" id="role-mentor-radio" name="role_toggle" value="mentor" class="text-indigo-600 focus:ring-indigo-500" />
            </div>
            <p class="text-xs font-black text-zinc-900 dark:text-white leading-tight">
              T7eb T3awen + Tet3alem
            </p>
            <p class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              (Peer Mentor IT)
            </p>
          </div>

        </div>

        <!-- Feedback Alert Banner -->
        <div id="signup-feedback" class="hidden"></div>

        <!-- Unified Form mapping to registration actions -->
        <form onsubmit="MentoriniActions.handleSignUpSubmit(event)" class="space-y-3 text-xs">
          
          <input type="hidden" name="role" value="mentee" id="hidden-role-input" />

          <!-- Common: Name -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Esmek w La9bek <span class="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="Ex: Yassine Ben Salem" 
              class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Common: Phone -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Noumrou Tel / WhatsApp 🇹🇳 <span class="text-red-500">*</span>
            </label>
            <input 
              type="tel" 
              name="phone" 
              required 
              placeholder="Ex: 98123456 wala 21698123456" 
              class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-[10px] text-zinc-400 mt-1">
              Noumrouk safe: ma yet-unlooka ken ba3d ma l-mentee yetfarrej fil video.
            </p>
          </div>

          <!-- Common: Email -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Email (Optionnel)
            </label>
            <input 
              type="email" 
              name="email" 
              placeholder="yassine@example.com" 
              class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Mentee-only Fields -->
          <div id="mentee-role-fields" class="space-y-3">
            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Niveau d'études / Fac
              </label>
              <select 
                name="educationalLevel" 
                class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Bac Info">Bac Info (Algo, TIC, Python)</option>
                <option value="1ère Licence Info (INSAT / ISITCom / FST)">1ère Licence Info</option>
                <option value="2ème / 3ème Licence">2ème / 3ème Licence</option>
                <option value="Cycle Ingénieur (ENSI / SUPCOM / ENIT / INSAT)">Cycle Ingénieur</option>
                <option value="Autodidacte / Reconversion IT">Autodidacte / Reconversion IT</option>
              </select>
            </div>
          </div>

          <!-- Mentor-only Fields -->
          <div id="mentor-role-fields" class="hidden space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            
            <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 text-[11px]">
              <p class="font-black text-amber-900 dark:text-amber-200">
                ⚠️ Lazim t7ot video short wala long-form tfahem fih concept b Feynman Technique bel Tounsi mte3na.
              </p>
            </div>

            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Wadh3itek tawa (Current Status) <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="status" 
                placeholder="Ex: Bac Info Major -> INSAT GL2 / Full-Stack Dev" 
                class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Domaine mte3ek (Category)
              </label>
              <select 
                name="category" 
                class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium"
              >
                <option value="bac_info">Bac Info & Lycée (Algo, TIC, Python)</option>
                <option value="fac_prep">Fac, Prep & INSAT (C, Java, OOP)</option>
                <option value="web_mobile">Web & Mobile Dev (React, Flutter, Node)</option>
                <option value="devops_cloud">DevOps & Cloud (Docker, Linux)</option>
                <option value="data_ai">Data & AI (Python, ML)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Concept elli fassartou (Feynman Topic) <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="feynmanTopic" 
                placeholder="Ex: Pointers fi C / Kifeh tfassi algorithmique Bac" 
                class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Lien YouTube Embed (Short wala Video) <span class="text-red-500">*</span>
              </label>
              <input 
                type="url" 
                name="youtubeUrl" 
                placeholder="https://youtu.be/... wala youtube.com/watch?v=..." 
                class="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Bio & Resource Sharing Box (Drive / GitHub / Notion)
              </label>
              <textarea 
                name="bio" 
                rows="2" 
                placeholder="7ot liens mte3 Google Drive, GitHub wala Notion direct houni fil bio box..." 
                class="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-white font-medium"
              ></textarea>
            </div>

          </div>

          <!-- Submit Action Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              class="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-black tracking-wide shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Sajjel fil Base w Dkhol ($0 Free)</span>
            </button>
          </div>

        </form>

        <!-- Route to Sign In -->
        <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            3andek déjà compte msajjel?
          </p>
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('signin')" 
            class="mt-1 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Connecti houni (Sign In) →
          </button>
        </div>

      </div>

    </section>
  `;
}

// ============================================================================
// 4. VIEW 2: SIGN IN (SLEEK MINIMAL PHONE LOGIN)
// ============================================================================

/**
 * View 2 (Sign In): Sleek, minimal phone-number login interface.
 * Includes the anchor link: "Mazelt ma 3maltech compte? Sajjel houni".
 */
export function renderSignInView(state = {}) {
  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <div class="text-center py-4">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black text-xl mb-2.5 shadow-inner">
          🔑
        </div>
        <h2 class="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          Connecti fil Espace mte3ek
        </h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[280px] mx-auto">
          A3tina noumrou tel / WhatsApp mte3ek bech nconnectouk direct lil feed.
        </p>
      </div>

      <!-- Sleek Phone Sign In Card -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        
        <div id="signin-feedback" class="hidden"></div>

        <form onsubmit="MentoriniActions.handleSignInSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Noumrou Tel / WhatsApp 🇹🇳 <span class="text-red-500">*</span>
            </label>
            <input 
              type="tel" 
              name="phone" 
              required 
              placeholder="Ex: 98123456 wala 21698123456" 
              class="w-full px-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
            />
            <p class="text-[10px] text-zinc-400 mt-1">
              Kanik msajjel fi Mentorini, database tconnectik direct.
            </p>
          </div>

          <button 
            type="submit" 
            class="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Dkhol Tawa (Sign In)</span>
            <span>→</span>
          </button>
        </form>

        <!-- Anchor Link back to Sign Up -->
        <div class="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            Mazelt ma 3maltech compte?
          </p>
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('signup')" 
            class="mt-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Mazelt ma 3maltech compte? Sajjel houni 🚀
          </button>
        </div>

      </div>

    </section>
  `;
}

// ============================================================================
// 5. VIEW 3: UNIVERSAL FEED (SCROLLABLE RICH-MEDIA DISCOVERY CARDS)
// ============================================================================

/**
 * Helper to render the contact button with strict Video-Watch Lock:
 * Locked & greyed out -> Glowing indigo "Connecti m3ah tawa direct".
 */
export function renderContactButton(mentor, isUnlocked) {
  if (isUnlocked) {
    return `
      <button 
        type="button" 
        onclick="MentoriniActions.connectWhatsApp('${mentor.whatsappNumber}', '${mentor.name.replace(/'/g, "\\'")}', '${(mentor.feynmanTopic || '').replace(/'/g, "\\'")}')"
        class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 animate-pulse"
      >
        <span>💬</span>
        <span>Connecti m3ah tawa direct (WhatsApp)</span>
        <span>🔓</span>
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

/**
 * Rich-media summary card in the scrollable Universal Feed.
 * Clicking the card sets activeProfileId and switches to the Profile View.
 */
export function renderFeedSummaryCard(mentor, isUnlocked = false) {
  const videoId = mentor.youtubeVideoId || extractYouTubeId(mentor.youtubeUrl || '');
  const cleanCategory = mentor.category ? mentor.category.toUpperCase().replace('_', ' ') : 'IT';

  return `
    <article 
      onclick="MentoriniActions.viewProfile('${mentor.id}')"
      class="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer group"
    >
      
      <!-- Card Top Bar -->
      <div class="p-4 pb-2.5 flex items-start justify-between gap-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
            ${mentor.name.charAt(0)}
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
              ${mentor.status}
            </p>
          </div>
        </div>

        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
          ${cleanCategory}
        </span>
      </div>

      <!-- Rich-Media Video Poster Stage -->
      <div class="px-4 pb-3">
        <div class="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
          
          <div class="absolute top-2 left-2 z-10 bg-zinc-900/90 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-800 truncate max-w-[85%]">
            Feynman: ${mentor.feynmanTopic || 'Concept IT'}
          </div>

          <div class="flex flex-col items-center justify-center p-3 text-center">
            <div class="w-11 h-11 rounded-full bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-transform mb-1.5">
              <span class="text-white text-sm font-black ml-0.5">▶</span>
            </div>
            <p class="text-xs font-bold text-white">
              Tfarrej fil Concept bel Tounsi
            </p>
            <p class="text-[10px] text-zinc-400 mt-0.5">
              ${isUnlocked ? '✅ Unlocked! Click bech tchouf l-profile' : '🔒 Click bech t-unlooki l-WhatsApp mte3ou'}
            </p>
          </div>

        </div>
      </div>

      <!-- Card Footer CTA -->
      <div class="px-4 pb-3.5 pt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
        <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span>${isUnlocked ? '🔓 WhatsApp Wa7dou' : '🔒 Video-Watch Lock'}</span>
        </span>
        <span class="font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>Chouf l-Profile & Video</span>
          <span>→</span>
        </span>
      </div>

    </article>
  `;
}

/**
 * View 3 (Universal Feed): Scrollable discovery feed for mentees and mentors.
 */
export function renderUniversalFeed(state = {}) {
  const mentors = state.mentors || [];
  const watchedSet = state.watchedVideos instanceof Set 
    ? state.watchedVideos 
    : new Set(state.watchedVideos || []);

  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Top Gateway Banner -->
      <div class="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-zinc-900 dark:text-white">
            Erba7 wa9tek w l'energie mte3ek.
          </p>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
            Feynman IT mentors mfiltrin fi Tounes 🇹🇳
          </p>
        </div>
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('signup')"
          class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
        >
          + Sajjel Mentor
        </button>
      </div>

      <!-- Feed List Header -->
      <div class="flex items-center justify-between px-1">
        <h2 class="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Peer Mentors Mawjoudin (${mentors.length})
        </h2>
        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync
        </span>
      </div>

      <!-- Scrollable List of Summary Cards -->
      <div class="space-y-3.5">
        ${mentors.length > 0 ? mentors.map((mentor) => {
          const isUnlocked = watchedSet.has(String(mentor.id));
          return renderFeedSummaryCard(mentor, isUnlocked);
        }).join('') : `
          <div class="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p class="text-sm font-black text-zinc-700 dark:text-zinc-300">Ma famech mentors fil base tawa</p>
            <p class="text-xs text-zinc-400 mt-1 mb-3">Tnajjem tkoun awel mentor yfasser concept bel Tounsi!</p>
            <button 
              type="button" 
              onclick="MentoriniActions.setTab('signup')"
              class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Sajjel Rou7ek Mentor 🚀
            </button>
          </div>
        `}
      </div>

    </section>
  `;
}

// ============================================================================
// 6. VIEW 4: PROFILE VIEW (VIDEO-WATCH LOCK & DEEP LINK TARGET)
// ============================================================================

/**
 * View 4 (Profile View): Dedicated view embedding the mentor's YouTube iframe.
 * Enforces the Video-Watch Lock: contact CTA is locked by default reading
 * "🔒 Tfarrej fil video bech tconnecti", instantly unlocking into a glowing
 * indigo "💬 Connecti m3ah tawa direct" target once the poster is clicked.
 */
export function renderProfileView(state = {}) {
  const mentorId = state.activeProfileId;
  const mentor = (state.mentors || []).find((m) => String(m.id) === String(mentorId));

  if (!mentor) {
    return `
      <section class="p-6 text-center space-y-4">
        <p class="text-sm font-black text-zinc-800 dark:text-zinc-200">Profile mouch mawjoud wala tfasa5!</p>
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('feed')" 
          class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          ← Erja3 lil Feed
        </button>
      </section>
    `;
  }

  const isUnlocked = AppStore.isVideoUnlocked(mentor.id);
  const videoId = mentor.youtubeVideoId || extractYouTubeId(mentor.youtubeUrl || '');
  const parsedBio = formatBioWithPills(mentor.bio);

  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Back Navigation Header -->
      <div class="flex items-center justify-between">
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('feed')" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-colors"
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
            ${mentor.name.charAt(0)}
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
              ${mentor.status}
            </p>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
              <span>📍 Tounes 🇹🇳</span>
              <span>•</span>
              <span>Direct WhatsApp Peer</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Embed YouTube aspect-video Wrapper & Video-Watch Lock -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        
        <!-- Video Topic Bar -->
        <div class="bg-zinc-900 text-zinc-200 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-zinc-800">
          <span class="truncate">Feynman Concept: <strong class="text-white font-black">${mentor.feynmanTopic || 'Concept IT'}</strong></span>
          <span class="text-red-500 font-black text-[11px] shrink-0">▶ YouTube</span>
        </div>

        <!-- Video Player Stage -->
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
                Tfarrej fil concept bel Tounsi
              </p>
              <p class="text-[11px] text-zinc-400 mt-0.5">
                Click bech t-unlooki noumrou l-WhatsApp direct
              </p>
            </div>
          `}
        </div>

        <!-- Video-Watch Lock Status Bar -->
        <div class="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">
            ${isUnlocked ? '✅ <strong class="text-emerald-500">Video mtfarrej fih!</strong>' : '🔒 Lazim tchouf l-video 9bal ma tconnecti'}
          </span>
          ${!isUnlocked ? `
            <button 
              type="button" 
              onclick="MentoriniActions.playAndUnlockVideo('${mentor.id}', '${videoId}')" 
              class="text-indigo-500 hover:text-indigo-400 text-[11px] font-bold underline"
            >
              Choftou déjà? Unlocki
            </button>
          ` : ''}
        </div>

      </div>

      <!-- CTA Contact Target (Deep-Link Redirect) -->
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
// 7. MAIN SHELL & SCREEN WRAPPER (MOBILE VIEWPORT: MAX-WIDTH 480PX)
// ============================================================================

/**
 * Assembles the full application shell locked to mobile phone dimensions
 * (max-width: 480px), defaulting to System Theme styling.
 */
export function renderAppLayout(state = {}) {
  const currentTab = state.tabRouter || 'feed';
  const userSession = state.userSession || state.activeUser;

  let activeViewHtml = '';
  if (currentTab === 'signup') {
    activeViewHtml = renderSignUpView(state);
  } else if (currentTab === 'signin') {
    activeViewHtml = renderSignInView(state);
  } else if (currentTab === 'profile') {
    activeViewHtml = renderProfileView(state);
  } else {
    activeViewHtml = renderUniversalFeed(state);
  }

  return `
    <div class="w-full max-w-[480px] mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col border-x border-zinc-200 dark:border-zinc-800 shadow-2xl transition-colors">
      
      <!-- Sticky Mobile Navbar -->
      <header class="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        
        <!-- Brand Logo -->
        <div 
          onclick="MentoriniActions.setTab('feed')"
          class="flex items-center gap-2 cursor-pointer select-none"
        >
          <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            M
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-black text-sm tracking-tight">Mentorini</span>
              <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                TN 🇹🇳
              </span>
            </div>
            <p class="text-[10px] text-zinc-400 font-medium">Peer-Mentorship IT</p>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div class="flex items-center gap-1.5">
          
          <!-- Feed Button -->
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('feed')" 
            class="px-2.5 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'feed' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
          >
            Feed
          </button>

          <!-- Dynamic Auth Controls -->
          ${userSession ? `
            <div class="flex items-center gap-1">
              <span class="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 truncate max-w-[85px]">
                👤 ${userSession.name ? userSession.name.split(' ')[0] : 'User'}
              </span>
              <button 
                type="button" 
                onclick="MentoriniActions.logout()" 
                title="Deconnecti"
                class="p-1 rounded-lg text-zinc-400 hover:text-red-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ` : `
            <button 
              type="button" 
              onclick="MentoriniActions.setTab('signin')" 
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'signin' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
            >
              Sign In
            </button>
            <button 
              type="button" 
              onclick="MentoriniActions.setTab('signup')" 
              class="px-2.5 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'}"
            >
              Sign Up
            </button>
          `}

        </div>
      </header>

      <!-- Central Mounted Screen Wrapper -->
      <main id="mentorini-screen-wrapper" class="flex-1">
        ${activeViewHtml}
      </main>

      <!-- Persistent Mobile Footer -->
      <footer class="p-4 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-400">
        <p class="font-bold text-zinc-600 dark:text-zinc-400">Mentorini • Made with ❤️ for Tunisian IT Youth 🇹🇳</p>
        <p class="text-[10px] mt-0.5">$0 Operating Cost • Native WhatsApp Protocol • Feynman Technique</p>
      </footer>

    </div>
  `;
}

/**
 * Mounts and dynamically re-renders the Mentorini presentation engine.
 * Subscribes directly to AppStore so mutations trigger automatic re-renders.
 *
 * @param {HTMLElement|string} targetElement - Mount DOM node or selector
 * @param {Object} store - Central AppStore instance
 */
export function mountApp(targetElement, store = AppStore) {
  const container = typeof targetElement === 'string' 
    ? document.querySelector(targetElement) 
    : targetElement;

  if (!container) {
    console.error('[MentoriniUI] Target mount container not found:', targetElement);
    return;
  }

  const render = () => {
    const state = store.getState();
    container.innerHTML = renderAppLayout(state);
  };

  // Initial render
  render();

  // Subscription to reactive store
  const unsubscribe = store.subscribe(() => {
    render();
  });

  return {
    unmount: () => {
      unsubscribe();
      container.innerHTML = '';
    },
    render,
  };
}

export default {
  renderSignUpView,
  renderSignInView,
  renderUniversalFeed,
  renderProfileView,
  renderFeedSummaryCard,
  renderContactButton,
  renderAppLayout,
  mountApp,
  formatBioWithPills,
};
