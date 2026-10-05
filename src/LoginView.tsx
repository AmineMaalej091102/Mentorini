import React from 'react';
import { supabase } from './supabaseClient';
import { Zap } from 'lucide-react';

export default function LoginView() {
  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen antialiased text-zinc-100 bg-[#090D1A] font-sans p-4">
      <div className="relative w-full max-w-[480px] min-h-[580px] bg-zinc-900 shadow-2xl overflow-hidden flex flex-col justify-between p-6 sm:p-8 rounded-[32px] border border-zinc-800">
        <div className="flex items-center gap-2 pt-2">
          <span className="text-2xl font-black tracking-tight text-white">
            mentorini<span className="text-indigo-500">.</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 text-[10px] font-bold">
            Zero-Fee IT 🇹🇳
          </span>
        </div>

        <div className="my-auto py-6 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-800">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Peer-Mentorship fi Tounes</span>
          </div>

          <div className="bg-gradient-to-b from-indigo-950/30 via-zinc-900 to-zinc-900 border border-indigo-900/40 rounded-3xl p-6 shadow-sm space-y-4">
            <p className="text-sm text-zinc-200 leading-relaxed font-semibold">
              T7eb tadhrob el blocker mte3ek fi draj? Houni lma3nelkom el peer mentors el kol fi blassa we7da bech t7afedh 3la akbar assets 3andek fi 3omrek: wa9tek w sa7tek.
            </p>
          </div>
        </div>

        <div className="space-y-3 pb-2">
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-900 font-black text-sm py-4 px-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>💬 Edkhel bel Google mte3ek tawa direct</span>
          </button>
          <p className="text-center text-[11px] text-zinc-500 font-medium">
            Connexion instantanée sécurisée • Zero mot de passe
          </p>
        </div>
      </div>
    </div>
  );
}
