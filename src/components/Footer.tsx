import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="px-4 py-8 mt-6 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
      <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200 mb-1">
        <span>Mentorini</span>
        <span>•</span>
        <span>Made with</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
        <span>for Tunisian IT Youth 🇹🇳</span>
      </div>
      <p className="text-[11px] text-zinc-700 dark:text-zinc-400 max-w-xs mx-auto mb-2 leading-relaxed">
        Zero-Cost ($0) architecture: direct WhatsApp deep links, local community caching, open-door dual registration.
      </p>
      <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
        <span>Feynman Technique</span>
        <span>•</span>
        <span>Bac Info & Tech</span>
        <span>•</span>
        <span>Engineering TN</span>
      </div>
    </footer>
  );
}
