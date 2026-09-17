import { Clock, Zap, Youtube, CheckCircle2, UserPlus, ArrowDown } from 'lucide-react';

interface ManifestoProps {
  onOpenRegister: () => void;
  onScrollToFeed: () => void;
}

export function Manifesto({ onOpenRegister, onScrollToFeed }: ManifestoProps) {
  return (
    <section className="px-4 pt-5 pb-6">
      <div className="bg-gradient-to-b from-indigo-50/80 via-white to-zinc-50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-zinc-950 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 shadow-sm">
        
        {/* Value Proposition Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-3 border border-indigo-200 dark:border-indigo-800">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Zero-Cost Peer Mentorship fi Tounes</span>
        </div>

        {/* Big Bold Arabizi Manifesto Headline */}
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.25] mb-3">
          Erba7 a3az zouz 7weyej 3andek: <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            Wa9tek w l&apos;Energie mte3ek.
          </span>
        </h1>

        {/* Body Manifesto in Natural Authentic Tunisian Arabizi */}
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
          Fi 3oudh ma tdhi3 fi <strong className="text-zinc-900 dark:text-zinc-100 font-bold">b7ar YouTube</strong> mta3 50 sa3a w forums 9dom w ma ta3rafch chkoun tsada9, l9inalek <span className="underline decoration-indigo-400 decoration-2 font-bold text-zinc-900 dark:text-zinc-100">peer mentors mfiltrin b clique wa7da</span>. 
        </p>

        {/* 3 Value Pillars */}
        <div className="space-y-2 mb-5">
          <div className="flex items-start gap-2 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong className="text-zinc-900 dark:text-white font-bold">Feynman Technique:</strong> Kol mentor yfassar concept fi video 9sira bel Tounsi mte3na.</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong className="text-zinc-900 dark:text-white font-bold">Video-Watch Lock:</strong> Tfarrej f l-video bech t-unlocki l-WhatsApp mte3ou direct blech takssir rass.</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-zinc-800 dark:text-zinc-200 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong className="text-zinc-900 dark:text-white font-bold">100% Free & Direct:</strong> Zero intermediation, zero fees ($0). Deep-link direct lel WhatsApp.</span>
          </div>
        </div>

        {/* Open Door Action Track */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onScrollToFeed}
            className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold py-3 px-3 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <span>Lawwej Mentor</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenRegister}
            className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 border border-indigo-500"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sajjel Mentor 🚀</span>
          </button>
        </div>

      </div>
    </section>
  );
}
