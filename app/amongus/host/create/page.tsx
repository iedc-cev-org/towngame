'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/amongus/supabase/client';
import { useRouter } from 'next/navigation';
import { Settings, Play, Loader2 } from 'lucide-react';
import { generateGameCode } from '@/lib/utils';
import Link from 'next/link';

export default function CreateGame() {
  const [name, setName] = useState('SUS IRL NIGHT');
  const [maxPlayers, setMaxPlayers] = useState(15);
  const [impostorCount, setImpostorCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Check local host token and PIN
    const hostToken = localStorage.getItem('sus_irl_host_token');
    const hostPin = localStorage.getItem('sus_irl_host_pin');
    if (!hostToken || hostPin?.trim().toLowerCase() !== 'iedccev2026') {
      router.push('/amongus/host');
    }
  }, [router]);

  const handleCreateGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const hostToken = localStorage.getItem('sus_irl_host_token');
      const hostPin = localStorage.getItem('sus_irl_host_pin');
      if (!hostToken || hostPin?.trim().toLowerCase() !== 'iedccev2026') {
        throw new Error('ACCESS DENIED: Unauthorized host. Valid Host PIN required.');
      }

      const joinCode = generateGameCode(6);

      const { data, error: dbError } = await supabase
        .from('games')
        .insert({
          host_id: hostToken, // Using UUID string instead of Supabase Auth UUID
          name,
          join_code: joinCode,
          max_players: maxPlayers,
          impostor_count: impostorCount,
          status: 'LOBBY'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      router.push(`/amongus/host/game/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-background text-white pb-24">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="au-title text-4xl text-white flex items-center gap-3">
              <Settings className="w-8 h-8 text-secondary" />
              GAME SETTINGS
            </h1>
            <p className="text-muted text-sm mt-1 uppercase tracking-widest font-bold">Configure your new game session</p>
          </div>
          <Link href="/amongus/host" className="text-sm font-bold text-muted hover:text-white transition-colors uppercase">
            Cancel
          </Link>
        </header>

        {error && (
          <div className="bg-danger/20 border border-danger/50 text-danger-100 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-8">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Game Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-card border border-card-border p-4 rounded-xl text-lg font-bold focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">Max Players</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="4" max="30"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full accent-secondary"
                />
                <span className="bg-card px-4 py-2 rounded-lg font-mono font-bold border border-card-border">
                  {maxPlayers}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase mb-2">Impostors</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1" max="5"
                  value={impostorCount}
                  onChange={(e) => setImpostorCount(parseInt(e.target.value))}
                  className="w-full accent-danger"
                />
                <span className="bg-card px-4 py-2 rounded-lg font-mono font-bold border border-card-border text-danger">
                  {impostorCount}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
            <h3 className="text-sm font-bold text-primary mb-2">Rule Summary</h3>
            <ul className="text-sm text-muted space-y-1">
              <li>• Total Players: {maxPlayers}</li>
              <li>• Crewmates: {maxPlayers - impostorCount}</li>
              <li>• Impostors: {impostorCount}</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleCreateGame}
          disabled={loading}
          className="mt-8 w-full bg-gradient-to-r from-secondary to-accent text-white font-black text-xl py-6 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] shadow-neon-secondary"
        >
          {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8" />}
          {loading ? 'CREATING...' : 'CREATE GAME'}
        </button>
      </div>
    </main>
  );
}
