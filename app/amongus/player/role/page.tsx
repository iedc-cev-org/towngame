'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, Skull } from 'lucide-react';
import { getMyRole } from '@/app/amongus/actions/game';
import { getPlayerColor } from '@/lib/colors';

export default function RoleReveal() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const gameId = localStorage.getItem('sus_irl_game_id');
      const playerToken = localStorage.getItem('sus_irl_player_token');

      if (!gameId || !playerToken) {
        router.push('/');
        return;
      }

      try {
        setPlayerToken(playerToken);
        const data = await getMyRole(gameId, playerToken);
        setRole(data.role);
        setName(data.name);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch role');
      }
    };

    fetchRole();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-white">
        <p className="text-danger font-bold mb-4">{error}</p>
        <button onClick={() => router.push('/')} className="bg-card px-6 py-2 rounded-lg">Return Home</button>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white">
        <h2 className="text-xl font-bold tracking-[0.2em] mb-8 animate-pulse text-muted">ASSIGNING ROLE</h2>
        <Loader2 className="w-16 h-16 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const isImpostor = role === 'IMPOSTOR';
  const playerColor = getPlayerColor(playerToken);

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000 ${
      isImpostor ? 'bg-danger/10' : 'bg-secondary/10'
    }`}>
      
      <div className={`absolute inset-0 bg-gradient-to-b opacity-50 ${
        isImpostor ? 'from-danger/20 to-background' : 'from-secondary/20 to-background'
      }`} />

      <div className="z-10 text-center animate-in zoom-in duration-700 fade-in slide-in-from-bottom-8">
        <p className="text-muted font-bold tracking-[0.3em] uppercase mb-4 text-sm">Your Role</p>
        
        <h1 className={`text-6xl md:text-8xl font-black tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ${
          isImpostor ? 'text-danger' : 'text-secondary'
        }`}>
          {role}
        </h1>

        <div className={`glass-panel p-8 rounded-2xl max-w-sm mx-auto border ${
          isImpostor ? 'border-danger/30' : 'border-secondary/30'
        }`}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              {isImpostor ? (
                <Skull className="w-20 h-20 drop-shadow-[0_0_15px_rgba(255,59,59,0.5)]" style={{ color: playerColor.hex }} />
              ) : (
                <User className="w-20 h-20 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" style={{ color: playerColor.hex }} />
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-1" style={{ color: playerColor.hex }}>{name}</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">{playerColor.name}</p>
          
          <p className="text-muted text-sm leading-relaxed">
            {isImpostor 
              ? "Your objective is to eliminate the Crewmates without being discovered. Blend in and sabotage their efforts."
              : "Complete your tasks and observe other players. Work together to identify and eject the Impostors."}
          </p>
        </div>

        <button 
          onClick={() => router.push('/amongus/player/game')}
          className={`mt-12 w-full max-w-sm py-5 rounded-2xl font-black text-xl transition-all shadow-lg text-white ${
            isImpostor 
              ? 'bg-danger hover:bg-danger/80 shadow-[0_0_20px_rgba(255,59,59,0.4)]'
              : 'bg-secondary hover:bg-secondary/80 shadow-[0_0_20px_rgba(0,229,255,0.4)] text-background'
          }`}
        >
          CONTINUE TO GAME
        </button>
      </div>
    </main>
  );
}
