/**
 * Mentorini - Peer-Mentorship for the Tunisian IT Ecosystem
 * Frontend Presentation File (ui.js)
 * 
 * Mobile-First String-Template Layout Builders & Arabizi UI Engine
 * Directly bounds to the Central AppStore & Native WhatsApp Deep-Link Protocol
 */

import { 
  AppStore, 
  executeWhatsAppRedirect, 
  submitMentorRegistration, 
  saveUser, 
  extractYouTubeId, 
  cleanPhoneNumber 
} from './app.js';

// ============================================================================
// 1. GLOBAL ACTION DISPATCHER & EVENT ROUTING
// ============================================================================

/**
 * Window-level action hub ensuring all string-template 'onclick' and 'onsubmit'
 * handlers route directly into the centralized AppStore and Supabase methods.
 */
if (typeof window !== 'undefined') {
  window.MentoriniActions = {
    // Navigation / Tab routing
    setTab: (tabName) => {
      AppStore.setTab(tabName);
    },

    // Role selection from Onboarding Gateway
    selectRole: (role) => {
      if (role === 'mentee') {
        AppStore.setTab('feed');
      } else if (role === 'mentor') {
        AppStore.setTab('register_mentor');
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
      // Trigger quick re-render of just the button or full view if needed
      const btnContainer = document.getElementById(`action-btn-box-${mentorId}`);
      const mentor = AppStore.getState().mentors.find(m => String(m.id) === String(mentorId));
      if (btnContainer && mentor) {
        btnContainer.innerHTML = renderContactButton(mentor, true);
      }
    },

    // WhatsApp Deep-Link Execution
    connectWhatsApp: (phone, mentorName, topic) => {
      const text = `3aslema ${mentorName}! 👋 Choft l-video mte3ek 3la Mentorini mta3 "${topic}". 3andi sou2el w 7abit nestachirek ken ma y9al9ekch!`;
      executeWhatsAppRedirect(phone, text);
    },

    // Mentor Registration Form Submission
    handleMentorFormSubmit: async (event) => {
      event.preventDefault();
      const form = event.target;
      const feedbackEl = document.getElementById('mentor-form-feedback');

      const formData = {
        name: form.name.value,
        status: form.status.value,
        whatsappNumber: form.whatsappNumber.value,
        youtubeUrl: form.youtubeUrl.value,
        feynmanTopic: form.feynmanTopic.value,
        bio: form.bio.value,
        category: form.category.value,
      };

      try {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = '⏳ 9a3din nsajlou f profile mte3ek fil base...';
          feedbackEl.classList.remove('hidden');
        }

        const newMentor = await submitMentorRegistration(formData);

        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `🎉 Mabrouk ya ${newMentor.name}! Profile mte3ek tzad tawa direct fil feed.`;
        }

        setTimeout(() => {
          AppStore.setTab('feed');
        }, 1200);
      } catch (err) {
        if (feedbackEl) {
          feedbackEl.className = 'p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-3';
          feedbackEl.innerHTML = `⚠️ Oops! ${err.message || 'Thabbet fil ma3loumet mte3ek w 3awed.'}`;
          feedbackEl.classList.remove('hidden');
        }
      }
    },

    // Mentee Registration Submission
    handleMenteeQuickRegister: async (event) => {
      event.preventDefault();
      const form = event.target;
      const name = form.menteeName.value;
      const level = form.menteeLevel.value;

      try {
        await saveUser({ name, educationalLevel: level });
        AppStore.setTab('feed');
      } catch (err) {
        alert('Oops! Thabbet fi esmek svp.');
      }
    },
  };
}

// ============================================================================
// 2. TEXT HELPERS & SAFE BIO LINK PARSER
// ============================================================================

/**
 * Parses freeform text bio into safe clickable links for Drive, GitHub, and Notion
 */
export function formatBioWithPills(text) {
  if (!text) return '';
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return escaped.replace(urlRegex, (url) => {
    let label = '🔗 Link';
    if (url.includes('drive.google')) label = '📁 Google Drive';
    else if (url.includes('github.com')) label = '💻 GitHub';
    else if (url.includes('notion')) label = '📝 Notion';

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] hover:underline mx-0.5">${label} ↗</a>`;
  });
}

// ============================================================================
// 3. VIEW LAYOUT MODULE 1: ONBOARDING GATEWAY
// ============================================================================

/**
 * Builds the Onboarding Gateway view with the official Arabizi Text Manifesto
 * and thumb-friendly role selector cards.
 */
export function renderOnboardingGateway(state = {}) {
  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Brand & Status Pill -->
      <div class="flex items-center justify-between">
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero-Cost ($0) Peer Mentorship Tounsi 🇹🇳</span>
        </div>
        <span class="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Bac Info & IT Pro</span>
      </div>

      <!-- High-Converting Value Manifesto Card -->
      <div class="bg-gradient-to-b from-indigo-50/90 via-white to-zinc-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 shadow-sm">
        <h1 class="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-[1.25] mb-2.5">
          Erba7 a3az zouz 7weyej 3andek: <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            Wa9tek w l'Energie mte3ek.
          </span>
        </h1>
        
        <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium mb-4">
          Fi 3oudh ma tdhi3 fi <strong>b7ar YouTube</strong> mta3 50 sa3a w forums 9dom w ma ta3rafch chkoun tsada9, l9inalek 
          <span class="font-bold underline decoration-indigo-500 decoration-2 text-zinc-900 dark:text-white">peer mentors mfiltrin b clique wa7da</span>.
        </p>

        <!-- Feature Points -->
        <div class="space-y-2 text-xs text-zinc-800 dark:text-zinc-200 mb-2">
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>Feynman Technique:</strong> Kol mentor yfasser concept fi video 9sira bel Tounsi mte3na.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>Video-Watch Lock:</strong> Tfarrej fil video bech t-unlocki noumrou l-WhatsApp direct blech takssir rass.</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-emerald-500 font-bold">✓</span>
            <span><strong>100% Free:</strong> Zero frais ($0). Direct connection bin mentee w mentor.</span>
          </div>
        </div>
      </div>

      <!-- Thumb-Friendly Dual-Track Selector Cards -->
      <div class="space-y-3 pt-1">
        <h2 class="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
          Ekhtar Track mte3ek l-youm:
        </h2>

        <!-- Option A: Mentee Card -->
        <button 
          type="button" 
          onclick="MentoriniActions.selectRole('mentee')"
          class="w-full text-left p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-between group"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">📖</span>
              <span class="font-black text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                T7eb Tet3alem Kahw (Mentee)
              </span>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 pl-7 leading-snug">
              Bac Info, Prep, 1ère fac? Lawwej mentor, tfarrej fil concept w connecti m3ah direct 3al WhatsApp.
            </p>
          </div>
          <span class="text-zinc-400 group-hover:translate-x-1 transition-transform font-bold text-sm">→</span>
        </button>

        <!-- Option B: Mentor Card -->
        <button 
          type="button" 
          onclick="MentoriniActions.selectRole('mentor')"
          class="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-white to-zinc-50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-between group"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-lg">🛠️</span>
              <span class="font-black text-sm text-indigo-700 dark:text-indigo-300">
                T7eb T3awen + Tet3alem (Mentor)
              </span>
              <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Open Track
              </span>
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 pl-7 leading-snug">
              3andek khedma, PFE, wala majorit fi matière? Sajjel profile w 7ot video Feynman bech ycontactiwk.
            </p>
          </div>
          <span class="text-indigo-500 group-hover:translate-x-1 transition-transform font-bold text-sm">→</span>
        </button>
      </div>

    </section>
  `;
}

// ============================================================================
// 4. VIEW LAYOUT MODULE 2: OPEN MENTOR REGISTRATION FORM
// ============================================================================

/**
 * Builds the open mentor onboarding form with clear Feynman Technique video criteria,
 * single-box resource link instructions, and zero-cost submission.
 */
export function renderMentorRegistrationForm(state = {}) {
  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Navigation Back Bar -->
      <div class="flex items-center justify-between pb-1">
        <button 
          type="button" 
          onclick="MentoriniActions.setTab('feed')"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          <span>←</span>
          <span>Rja3 lel Feed</span>
        </button>
        <span class="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Open-Door Mentor Onboarding</span>
      </div>

      <!-- Card Container -->
      <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        
        <div class="mb-4">
          <h2 class="text-lg font-black text-zinc-900 dark:text-white">
            Sajjel Rou7ek Mentor fi Mentorini
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            3awen wled w bnet bledi fi Bac Info, Fac, w awel karier IT fi Tounes 🇹🇳.
          </p>
        </div>

        <!-- Mandatory Feynman Criteria Banner -->
        <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-3.5 mb-4 text-xs">
          <div class="flex items-start gap-2.5">
            <span class="text-base leading-none">⚠️</span>
            <div>
              <p class="font-black text-amber-900 dark:text-amber-200 leading-snug">
                Lazim t7ot video short wala long-form tfahem fih concept b Feynman Technique bel Tounsi mte3na.
              </p>
              <p class="text-amber-800 dark:text-amber-300 mt-1 text-[11px] leading-relaxed">
                Mentees ychoufou l-video mte3ek 9bal ma yconnectiw m3ak. Tafsir simplifié ybayan elli enti ma3lem fil mawdhou3!
              </p>
            </div>
          </div>
        </div>

        <!-- Dynamic Feedback banner -->
        <div id="mentor-form-feedback" class="hidden"></div>

        <!-- Mentor Registration Form -->
        <form id="mentor-registration-form" onsubmit="MentoriniActions.handleMentorFormSubmit(event)" class="space-y-3.5 text-xs">
          
          <!-- Name -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Esmek w La9bek *
            </label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="Ex: Yassine Ben Salah" 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Current Status -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Wadh3itek tawa (Current Status) *
            </label>
            <input 
              type="text" 
              name="status" 
              required 
              placeholder="Ex: Bac Info Major -> INSAT GL2 / Full-Stack Dev" 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Category Selection -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Domaine mte3ek (Category) *
            </label>
            <select 
              name="category" 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="bac_info">Bac Info & Lycée (Algo, TIC, Python)</option>
              <option value="fac_prep">Fac, Prep & INSAT (C, Java OOP, Structures)</option>
              <option value="web_mobile">Web & Mobile Dev (React, Flutter, Node)</option>
              <option value="devops_cloud">DevOps & Cloud (Docker, Linux, $0 Deploy)</option>
              <option value="data_ai">Data & AI (Python, Machine Learning)</option>
            </select>
          </div>

          <!-- WhatsApp Number -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Noumrou WhatsApp (Zero-Cost direct messaging) *
            </label>
            <input 
              type="tel" 
              name="whatsappNumber" 
              required 
              placeholder="21698123456 wala 98123456" 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Noumrouk safe: ma yet-unlooka ken ba3d ma l-mentee yetfarrej fil video mte3ek.
            </p>
          </div>

          <!-- Feynman Topic Header -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Concept elli fassartou fil video (Feynman Topic) *
            </label>
            <input 
              type="text" 
              name="feynmanTopic" 
              required 
              placeholder="Ex: Pointers fi C / Kifeh tfassi algorithmique Bac Info" 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- YouTube URL -->
          <div>
            <label class="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Lien YouTube Embed (Short wala Long-form) *
            </label>
            <input 
              type="url" 
              name="youtubeUrl" 
              required 
              placeholder="https://www.youtube.com/watch?v=... wala youtu.be/..." 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Standard Bio & Direct Resource Sharing Box -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-bold text-zinc-800 dark:text-zinc-200">
                Bio & Resource Sharing Box *
              </label>
              <span class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                🔗 Drive, GitHub, Notion houni
              </span>
            </div>
            
            <textarea 
              name="bio" 
              rows="3" 
              required 
              placeholder="A7ki 3la rou7ek w 7ot liens mte3 Google Drive, GitHub repos, wala Notion direct houni fil kiba..." 
              class="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            ></textarea>
            
            <!-- Explicit Strategic Instruction -->
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
              <strong>Ma famech separate fields:</strong> Ikteb les liens mte3 Google Drive, GitHub wala Notion direct fil bio box, ywalliw des boutons cliquables automatiquement.
            </p>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              class="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-black tracking-wide shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Sajjel Profile Mentor Tawa ($0 Free)</span>
            </button>
          </div>

        </form>

      </div>
    </section>
  `;
}

// ============================================================================
// 5. VIEW LAYOUT MODULE 3: THE UNIFIED FEED CARD & CONTACT BUTTON
// ============================================================================

/**
 * Helper to render the contact button adhering strictly to the Video-Watch Lock:
 * Greyed out and locked until watched -> Glowing indigo "Connecti m3ah tawa direct"
 */
export function renderContactButton(mentor, isUnlocked) {
  if (isUnlocked) {
    return `
      <button 
        type="button" 
        onclick="MentoriniActions.connectWhatsApp('${mentor.whatsappNumber}', '${mentor.name.replace(/'/g, "\\'")}', '${(mentor.feynmanTopic || '').replace(/'/g, "\\'")}')"
        class="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 animate-pulse"
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
      class="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold text-xs py-3 px-4 rounded-xl cursor-not-allowed border border-zinc-200 dark:border-zinc-800"
      title="Tfarrej fil video bech t-unlocki l-bouton"
    >
      <span>🔒</span>
      <span>Tfarrej fil video bech tconnecti</span>
    </button>
  `;
}

/**
 * Draws a single professional profile row in the feed with YouTube aspect-video
 * embed and Video-Watch Lock mechanics.
 */
export function renderFeedCard(mentor, isUnlocked = false) {
  const videoId = mentor.youtubeVideoId || extractYouTubeId(mentor.youtubeUrl || '');
  const parsedBioHtml = formatBioWithPills(mentor.bio);

  return `
    <article class="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      
      <!-- Card Header -->
      <div class="p-4 pb-2.5">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="font-black text-sm text-zinc-900 dark:text-zinc-50">
                ${mentor.name}
              </h3>
              ${mentor.isFlagship ? `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800">
                  ★ Flagship Founder
                </span>
              ` : ''}
            </div>
            <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              ${mentor.status}
            </p>
          </div>

          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            ${mentor.category ? mentor.category.toUpperCase().replace('_', ' ') : 'IT'}
          </span>
        </div>
      </div>

      <!-- Aspect-Video YouTube Wrapper with Video-Watch Lock -->
      <div class="px-4 pb-3">
        <div class="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          
          <!-- Feynman Topic Header -->
          <div class="bg-zinc-900 text-zinc-300 px-3 py-1.5 text-[11px] font-bold flex items-center justify-between border-b border-zinc-800 truncate">
            <span class="truncate">Feynman Topic: <strong class="text-white font-black">${mentor.feynmanTopic || 'Concept IT'}</strong></span>
            <span class="text-red-500 font-black">▶ YouTube</span>
          </div>

          <!-- Video Stage -->
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
                <div class="w-12 h-12 rounded-full bg-red-600 group-hover:scale-110 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform mb-2">
                  <span class="text-white text-base font-black ml-0.5">▶</span>
                </div>
                <p class="text-xs font-bold text-white mb-0.5">
                  Tfarrej fil concept bel Tounsi
                </p>
                <p class="text-[11px] text-zinc-400">
                  Click bech t-unlocki l-WhatsApp mte3 ${mentor.name.split(' ')[0]}
                </p>
              </div>
            `}
          </div>

          <!-- Unlock Status Bar -->
          <div class="bg-zinc-900/90 px-3 py-1.5 flex items-center justify-between text-[11px] border-t border-zinc-800">
            <span class="text-zinc-400">
              ${isUnlocked ? '✅ <strong class="text-emerald-400">Video mtfarrej fih!</strong>' : '🔒 Lazim tchouf l-video 9bal ma tconnecti'}
            </span>
            ${!isUnlocked ? `
              <button 
                type="button" 
                onclick="MentoriniActions.playAndUnlockVideo('${mentor.id}', '${videoId}')" 
                class="text-indigo-400 hover:text-indigo-300 font-bold underline"
              >
                Choftou déjà? Unlocki
              </button>
            ` : ''}
          </div>

        </div>
      </div>

      <!-- Bio & Resource Direct Links Box -->
      <div class="px-4 pb-4">
        <div class="bg-zinc-50 dark:bg-zinc-950/70 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-800/70 mb-3 leading-relaxed break-words">
          <p class="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-1">
            Bio & Resources Directes (Drive / GitHub / Notion)
          </p>
          <div>
            ${parsedBioHtml}
          </div>
        </div>

        <!-- Video-Watch Lock Action Button Container -->
        <div id="action-btn-box-${mentor.id}">
          ${renderContactButton(mentor, isUnlocked)}
        </div>

        <p class="text-[10px] text-center text-zinc-400 mt-2 font-medium">
          Zero-cost deep link • Privé direct lel WhatsApp mte3 ${mentor.name.split(' ')[0]}
        </p>
      </div>

    </article>
  `;
}

/**
 * Builds the complete unified feed list with category tabs and search bar
 */
export function renderUnifiedFeed(state = {}) {
  const mentors = state.mentors || [];
  const watchedSet = state.videoWatchedStates || new Set();

  return `
    <section class="p-4 space-y-4 animate-fadeIn">
      
      <!-- Top Gateway Banner Shortcut -->
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
          onclick="MentoriniActions.setTab('register_mentor')"
          class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
        >
          + Zid Mentor
        </button>
      </div>

      <!-- Feed Cards List -->
      <div class="space-y-4">
        ${mentors.length > 0 ? mentors.map((m) => {
          const isUnlocked = watchedSet.has(String(m.id));
          return renderFeedCard(m, isUnlocked);
        }).join('') : `
          <div class="text-center p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p class="text-sm font-black text-zinc-700 dark:text-zinc-300">Ma famech mentors fil base tawa</p>
            <p class="text-xs text-zinc-400 mt-1 mb-3">Tnajjem tkoun awel mentor yfasser concept bel Tounsi!</p>
            <button 
              type="button" 
              onclick="MentoriniActions.setTab('register_mentor')"
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
// 6. MAIN SHELL & SCREEN WRAPPER MOUNT ENGINE
// ============================================================================

/**
 * Assembles the persistent mobile navigation header and active router view.
 */
export function renderAppLayout(state = {}) {
  const currentTab = state.tabRouter || 'gateway';

  let activeViewHtml = '';
  if (currentTab === 'gateway') {
    activeViewHtml = renderOnboardingGateway(state);
  } else if (currentTab === 'register_mentor') {
    activeViewHtml = renderMentorRegistrationForm(state);
  } else {
    activeViewHtml = renderUnifiedFeed(state);
  }

  return `
    <div class="w-full max-w-[480px] mx-auto min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col border-x border-zinc-200 dark:border-zinc-800 shadow-xl transition-colors">
      
      <!-- Sticky Mobile Navbar -->
      <header class="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div 
          onclick="MentoriniActions.setTab('gateway')"
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

        <div class="flex items-center gap-2">
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('feed')" 
            class="px-2.5 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'feed' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'}"
          >
            Feed
          </button>
          <button 
            type="button" 
            onclick="MentoriniActions.setTab('register_mentor')" 
            class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            + Mentor
          </button>
        </div>
      </header>

      <!-- Central Mounted Screen Body -->
      <main id="mentorini-screen-wrapper" class="flex-1">
        ${activeViewHtml}
      </main>

      <!-- Persistent Footer -->
      <footer class="p-4 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-400">
        <p class="font-bold text-zinc-600 dark:text-zinc-400">Mentorini • Made with ❤️ for Tunisian IT Youth 🇹🇳</p>
        <p class="text-[10px] mt-0.5">$0 Operating Cost • Native WhatsApp Protocol • Feynman Technique</p>
      </footer>

    </div>
  `;
}

/**
 * Mounts and dynamically re-renders the Mentorini presentation engine into a container.
 * Subscribes to the central AppStore so any mutation re-renders effortlessly.
 *
 * @param {HTMLElement|string} targetElement - Mount DOM node or selector
 * @param {Object} store - AppStore singleton
 */
export function mountApp(targetElement, store = AppStore) {
  const container = typeof targetElement === 'string' 
    ? document.querySelector(targetElement) 
    : targetElement;

  if (!container) {
    console.error('[MentoriniUI] Mount target container not found:', targetElement);
    return;
  }

  const render = () => {
    const state = store.getState();
    container.innerHTML = renderAppLayout(state);
  };

  // Initial mount
  render();

  // Subscribe to live AppStore mutations
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
  renderOnboardingGateway,
  renderMentorRegistrationForm,
  renderFeedCard,
  renderContactButton,
  renderUnifiedFeed,
  renderAppLayout,
  mountApp,
  formatBioWithPills,
};
