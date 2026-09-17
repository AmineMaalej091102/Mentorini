import { useState, type FormEvent } from 'react';
import { X, AlertTriangle, Youtube, Sparkles, Check, Link2, Info } from 'lucide-react';
import { Mentor, MentorFormData, Category } from '../types';
import { CATEGORIES } from '../data/seedMentors';
import { extractYouTubeId, cleanWhatsAppNumber } from '../utils/youtube';

interface MentorRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMentor: (mentor: Mentor) => void;
}

export function MentorRegisterModal({ isOpen, onClose, onAddMentor }: MentorRegisterModalProps) {
  const [formData, setFormData] = useState<MentorFormData>({
    name: '',
    status: '',
    whatsappNumber: '',
    youtubeUrl: '',
    bio: '',
    category: 'bac_info',
    feynmanTopic: '',
  });

  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleYoutubeChange = (val: string) => {
    setFormData((prev) => ({ ...prev, youtubeUrl: val }));
    const id = extractYouTubeId(val);
    setPreviewVideoId(id);
    if (error && id) setError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('A3tina esmek w la9bek svp.');
      return;
    }
    if (!formData.status.trim()) {
      setError('A3tina wadh3itek tawa (ex: Bac Info, INSAT GL, Junior Dev).');
      return;
    }
    if (!formData.whatsappNumber.trim()) {
      setError('A3tina noumrou el WhatsApp mte3ek bech les mentees yconnectiw m3ak.');
      return;
    }

    const videoId = extractYouTubeId(formData.youtubeUrl);
    if (!videoId) {
      setError('L-lien YouTube ghalet wala na9es. 7ot lien YouTube 3adi wala Short.');
      return;
    }

    if (!formData.feynmanTopic.trim()) {
      setError('A3tina 3onwen l-concept elli fassartou b Feynman Technique.');
      return;
    }

    if (!formData.bio.trim()) {
      setError('7ot description 9sira 3la rou7ek w a3tina les liens mte3 Drive wala GitHub!');
      return;
    }

    const newMentor: Mentor = {
      id: `mentor-${Date.now()}`,
      name: formData.name.trim(),
      status: formData.status.trim(),
      whatsappNumber: cleanWhatsAppNumber(formData.whatsappNumber),
      youtubeUrl: formData.youtubeUrl.trim(),
      youtubeVideoId: videoId,
      bio: formData.bio.trim(),
      category: formData.category,
      tags: [
        CATEGORIES.find((c) => c.id === formData.category)?.label || 'IT',
        'Peer Mentor',
      ],
      isFlagship: false,
      feynmanTopic: formData.feynmanTopic.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddMentor(newMentor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-[460px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 mb-1">
            <Sparkles className="w-3 h-3" />
            Open-Door Peer Registration (100% Free)
          </span>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white">
            Sajjel Rou7ek Mentor fi Mentorini
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            3awen wled w bnet bledi fi Bac Info, Fac, w awel karier IT.
          </p>
        </div>

        {/* MANDATORY PILLAR 3 WARNING BANNER */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-3.5 mb-4 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-900 dark:text-amber-200 leading-snug">
                ⚠️ Lazim t7ot video short wala long-form tfa7em fih concept b Feynman Technique bel Tounsi mte3na.
              </p>
              <p className="text-amber-800 dark:text-amber-300/90 mt-1 text-[11px] leading-relaxed">
                Mentees ychoufou l-video mte3ek 9bal ma yconnectiw m3ak. Tafsir simplifié ybayan elli enti ma3lem f l-mawdhou3!
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-2.5 mb-3 text-xs text-red-700 dark:text-red-300 font-bold">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Name */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Esmek w La9bek *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mohamed Ali K."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Current Status */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Wadh3itek tawa (Current Status) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Bac Info Major 2024 -> INSAT GL2 / Junior Dev"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Domaine mte3ek *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.filter((c) => c.id !== 'kolchay').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.subLabel})
                </option>
              ))}
            </select>
          </div>

          {/* WhatsApp Phone Number */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Noumrou WhatsApp (Zero-Cost direct messaging) *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="21698123456 wala 98123456"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Mentees ma ychoufou noumrouk ken ba3d ma yetfarjou f l-video mte3ek.
            </p>
          </div>

          {/* Feynman Video Topic */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Concept elli fassartou f l-video (Feynman Topic) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pointers fi C / Kifeh tfassi algorithmique Bac Info"
              value={formData.feynmanTopic}
              onChange={(e) => setFormData({ ...formData, feynmanTopic: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* YouTube Link */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              Lien YouTube (Short wala Long Video) *
            </label>
            <input
              type="url"
              required
              placeholder="https://youtube.com/watch?v=... wala https://youtu.be/..."
              value={formData.youtubeUrl}
              onChange={(e) => handleYoutubeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {previewVideoId && (
              <div className="mt-2 rounded-lg overflow-hidden border border-emerald-500/50 bg-black aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${previewVideoId}`}
                  title="Video Preview"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Bio and Resource Links Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-zinc-800 dark:text-zinc-200">
                Bio & Resource Sharing (Drive / GitHub / Notion) *
              </label>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Kol liens houni direct
              </span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="A7ki 3la parcours mte3ek w colli lena directement les liens mte3 Google Drive, GitHub repos, wala les fiches mte3ek..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ma femmech separate fields: Ay lien (Drive, GitHub, Notion) ywalli clickable automatiquement f profil mte3ek.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500"
            >
              <Check className="w-4 h-4" />
              <span>Sajjel Profile Tawa (Free $0)</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
