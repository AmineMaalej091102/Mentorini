import { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Play, 
  MessageCircle, 
  ExternalLink, 
  CheckCircle, 
  Sparkles, 
  Youtube,
  GraduationCap,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { Mentor } from '../types';
import { buildWhatsAppLink, parseBioWithLinks } from '../utils/youtube';

interface MentorCardProps {
  key?: string;
  mentor: Mentor;
  isUnlocked: boolean;
  onUnlock: (mentorId: string) => void;
}

export function MentorCard({ mentor, isUnlocked, onUnlock }: MentorCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const parsedBio = parseBioWithLinks(mentor.bio);
  const waLink = buildWhatsAppLink(mentor.whatsappNumber, mentor.name, mentor.feynmanTopic);

  const handleStartVideo = () => {
    setIsPlaying(true);
    onUnlock(mentor.id);
  };

  const handleManualUnlock = () => {
    onUnlock(mentor.id);
  };

  const handleShare = async () => {
    const shareText = `Check mentor ${mentor.name} 3la Mentorini TN! 🇹🇳`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mentorini - ${mentor.name}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <article className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Top Header: Mentor info & Flagship status */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                {mentor.name}
              </h3>
              {mentor.isFlagship && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-300 dark:border-amber-800">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  Flagship Founder
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              {mentor.status}
            </p>
          </div>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Partager profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {mentor.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Feynman Technique Video Player Container */}
      <div className="px-4 pb-3">
        <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
          
          {/* Header pill describing Feynman concept */}
          <div className="bg-zinc-900/90 text-zinc-200 px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-1.5 truncate">
              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">Feynman Topic: <span className="text-white font-bold">{mentor.feynmanTopic}</span></span>
            </div>
          </div>

          {/* Video Iframe or Interactive Play Placeholder */}
          <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center">
            {isPlaying || isUnlocked ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${mentor.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title={`${mentor.name} - Feynman Explanation`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div 
                onClick={handleStartVideo}
                className="group cursor-pointer relative w-full h-full flex flex-col items-center justify-center bg-zinc-900 hover:bg-zinc-800 transition-colors text-center p-4"
              >
                {/* Simulated Thumbnail or clean cover */}
                <div className="w-12 h-12 rounded-full bg-red-600 group-hover:scale-110 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform mb-2">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
                <p className="text-xs font-bold text-white mb-0.5">
                  Tfarrej f l-concept bel Arabizi
                </p>
                <p className="text-[11px] text-zinc-400">
                  Click bech t-unlooki l-WhatsApp mte3 {mentor.name.split(' ')[0]}
                </p>
              </div>
            )}
          </div>

          {/* Quick unlock helper toolbar */}
          <div className="bg-zinc-900/95 px-3 py-2 flex items-center justify-between text-[11px] border-t border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400">
              {isUnlocked ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Video mtfarrej fih!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-zinc-400">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Lazim tchouf l-video 9bal ma tconnecti
                </span>
              )}
            </div>

            {!isUnlocked && (
              <button
                onClick={handleManualUnlock}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                Choftou 3al PC? Unlooki
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Bio & Direct Resource Sharing Links */}
      <div className="px-4 pb-4">
        <div className="bg-zinc-50 dark:bg-zinc-950/70 rounded-xl p-3 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-800/70 leading-relaxed mb-3">
          <p className="font-bold text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Bio & Resources Directes (Drive, GitHub, Notion)
          </p>
          <div className="break-words">
            {parsedBio.map((part, index) => {
              if (part.type === 'link') {
                const isDrive = part.url?.includes('drive.google');
                const isGithub = part.url?.includes('github.com');
                const isNotion = part.url?.includes('notion');

                return (
                  <a
                    key={index}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline mx-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px]"
                  >
                    <span>{isDrive ? '📁 Drive' : isGithub ? '💻 GitHub' : isNotion ? '📝 Notion' : '🔗 Link'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                );
              }
              return <span key={index}>{part.content}</span>;
            })}
          </div>
        </div>

        {/* Video-Watch Lock: Connect Button */}
        {isUnlocked ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500 animate-pulse"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Connecti m3ah direct 3al WhatsApp</span>
            <Unlock className="w-3.5 h-3.5 text-indigo-200" />
          </a>
        ) : (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-bold text-sm py-3 px-4 rounded-xl cursor-not-allowed border border-zinc-200 dark:border-zinc-700/50"
          >
            <Lock className="w-4 h-4 text-zinc-400" />
            <span>Connecti m3ah (Tfarrej f l-video bech t-unlooki)</span>
          </button>
        )}

        <p className="text-[10px] text-center text-zinc-700 dark:text-zinc-400 mt-2 font-medium">
          Zero-cost deep link • Direct privé lel WhatsApp mte3 {mentor.name.split(' ')[0]}
        </p>
      </div>
    </article>
  );
}
