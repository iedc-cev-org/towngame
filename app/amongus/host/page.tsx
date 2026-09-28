'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, ArrowLeft, Trash2, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/amongus/supabase/client';
import { deleteGame } from '@/app/amongus/actions/game';

export const DEFAULT_HOST_PIN = 'iedccev2026';

export default function HostLogin() {
  const [hostName, setHostName] = useState('');
  const [pin, setPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGames, setActiveGames] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedPin = localStorage.getItem('sus_irl_host_pin');
    const isVerified = savedPin?.trim().toLowerCase() === DEFAULT_HOST_PIN;
    if (isVerified) {
      setIsPinVerified(true);
      setPin(DEFAULT_HOST_PIN);
    }

    const fetchActiveGames = async () => {
      const hostToken = localStorage.getItem('sus_irl_host_token');
      const savedName = localStorage.getItem('sus_irl_host_name');
      if (savedName) setHostName(savedName);

      if (hostToken && isVerified) {
        const { data } = await supabase
          .from('games')
          .select('id, name, status, created_at')
          .eq('host_id', hostToken)
          .order('created_at', { ascending: false })
          .limit(5);
        if (data) {
          setActiveGames(data.filter(g => g.status !== 'ENDED'));
        }
      }
    };
    fetchActiveGames();
  }, []);

  const handleEnter = () => {
    setError(null);
    if (!hostName.trim()) {
      setError('Please enter your Host Name');
      return;
    }

    if (pin.trim().toLowerCase() !== DEFAULT_HOST_PIN) {
      setError('ACCESS DENIED: Invalid Host Security PIN.');
      return;
    }

    let hostToken = localStorage.getItem('sus_irl_host_token');
    if (!hostToken) {
      hostToken = crypto.randomUUID();
      localStorage.setItem('sus_irl_host_token', hostToken);
    }

    localStorage.setItem('sus_irl_host_pin', DEFAULT_HOST_PIN);
    localStorage.setItem('sus_irl_host_name', hostName.trim());
    setIsPinVerified(true);
    router.push('/amongus/host/create');
  };

  const handleDeleteActiveGame = async (e: React.MouseEvent, gId: string) => {
    e.stopPropagation();
    if (pin.trim().toLowerCase() !== DEFAULT_HOST_PIN) {
      setError('Enter correct Host PIN to delete games.');
      return;
    }
    const hostToken = localStorage.getItem('sus_irl_host_token');
    if (!hostToken) return;
    if (!confirm('Are you sure you want to permanently delete this game?')) return;
    const res = await deleteGame(gId, hostToken);
    if (res?.error) {
      alert('Failed to delete game: ' + res.error);
    } else {
      setActiveGames(prev => prev.filter(g => g.id !== gId));
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md au-panel p-6 sm:p-8 relative overflow-hidden">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 animate-pulse-glow">
            <ShieldAlert className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="au-title text-3xl sm:text-4xl text-white">HOST ACCESS</h1>
          <p className="text-muted text-[10px] mt-2 font-bold uppercase tracking-[0.2em]">Among Us IRL • Game Master</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Host Name</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => { setHostName(e.target.value); setError(null); }}
              className="w-full bg-background border-2 border-card-border p-3.5 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-secondary transition-colors placeholder:text-muted/30 text-center"
              placeholder="Your Name"
              onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Host Security PIN</span>
              {isPinVerified && (
                <span className="text-emerald-400 font-mono text-[10px] font-bold">
                  ✓ VERIFIED
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                className={`w-full bg-background border-2 ${error ? 'border-danger' : 'border-card-border'} p-3.5 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-secondary transition-colors placeholder:text-muted/30 text-center font-mono tracking-widest`}
                placeholder="Enter Host PIN"
                onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors text-xs font-mono"
              >
                {showPin ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {error && (
              <p className="text-danger text-xs font-bold mt-2 text-center">
                {error}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleEnter}
              disabled={!hostName.trim() || !pin.trim()}
              className="au-btn w-full bg-secondary text-background py-4 disabled:opacity-50 disabled:cursor-not-allowed font-black text-lg"
            >
              CREATE NEW GAME
            </button>
            <button
              type="button"
              onClick={() => {
                if (pin.trim().toLowerCase() !== DEFAULT_HOST_PIN) {
                  setError('Enter correct Host PIN to access Mini-Games Simulator.');
                  return;
                }
                localStorage.setItem('sus_irl_host_pin', DEFAULT_HOST_PIN);
                router.push('/amongus/host/sim-vault-9x7q');
              }}
              className="au-btn w-full mt-3 bg-card border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 py-3 text-sm flex items-center justify-center gap-2 font-bold tracking-wider"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              MINI-GAMES SIMULATOR
            </button>
          </div>
        </div>

        {activeGames.length > 0 && (
          <div className="border-t border-card-border pt-5">
            <h2 className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">Rejoin Active Game</h2>
            <div className="flex flex-col gap-2">
              {activeGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    if (pin.trim().toLowerCase() !== DEFAULT_HOST_PIN) {
                      setError('Enter correct Host PIN to access this active game.');
                      return;
                    }
                    localStorage.setItem('sus_irl_host_pin', DEFAULT_HOST_PIN);
                    router.push(`/amongus/host/game/${game.id}`);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-background/50 border border-card-border hover:bg-card-border/30 transition-all group cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white text-sm">{game.name}</span>
                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">{game.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteActiveGame(e, game.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/20 text-muted hover:text-danger transition-colors cursor-pointer"
                      title="Delete Game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-secondary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-muted/60 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
