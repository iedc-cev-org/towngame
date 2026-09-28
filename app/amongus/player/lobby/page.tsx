'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/amongus/supabase/client';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Loader2 } from 'lucide-react';
import { getPlayerColor } from '@/lib/colors';

export default function PlayerLobby() {
  const router = useRouter();
  const [game, setGame] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gameId = localStorage.getItem('sus_irl_game_id');
    const playerToken = localStorage.getItem('sus_irl_player_token');

    if (!gameId || !playerToken) {
      router.push('/');
      return;
    }

    let channel: any;

    const initLobby = async () => {
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!gameData || gameData.status !== 'LOBBY') {
        router.push('/');
        return;
      }

      setGame(gameData);

      const { data: playerData } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId)
        .eq('player_token', playerToken)
        .single();

      if (!playerData) {
        router.push('/');
        return;
      }

      setPlayer(playerData);

      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId);

      if (playersData) setPlayers(playersData);

      setLoading(false);

      const channelSuffix = Math.random().toString(36).substring(7);

      channel = supabase.channel(`player-lobby-${gameId}-${channelSuffix}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${gameId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            if (payload.new.id === playerData.id) setPlayer(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
            if (payload.old.id === playerData.id) router.push('/');
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        }, (payload) => {
          if (payload.new.status === 'ACTIVE') {
            router.push('/amongus/player/role');
          }
        })
        .subscribe();
    };

    initLobby();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const toggleReady = async () => {
    if (!player) return;

    await supabase
      .from('game_players')
      .update({ is_ready: !player.is_ready })
      .eq('id', player.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        <p className="text-muted text-xs font-bold uppercase tracking-widest">Loading Lobby...</p>
      </div>
    );
  }

  const readyCount = players.filter(p => p.is_ready).length;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 text-center border-b border-card-border bg-card/30 backdrop-blur-sm safe-area-top">
        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mb-1">Room Code</p>
        <p className="text-3xl sm:text-4xl font-mono font-black text-secondary tracking-[0.3em] ml-[0.3em]">
          {game?.join_code}
        </p>
      </header>

      <div className="flex-1 px-4 sm:px-6 overflow-y-auto pb-28">
        {/* Title */}
        <header className="w-full max-w-md flex flex-col items-center mb-6 mt-5 mx-auto">
          <h1 className="au-title text-3xl sm:text-4xl text-white tracking-wider">{game?.name}</h1>
          <p className="text-secondary/60 font-bold mt-1.5 tracking-[0.3em] uppercase text-xs">Waiting for Host</p>
        </header>

        {/* Player count & ready status */}
        <div className="flex items-center justify-between mb-4 max-w-md mx-auto">
          <h2 className="text-sm font-bold flex items-center gap-2 text-white/80">
            <Users className="text-secondary w-4 h-4" />
            Crew Assembling
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-secondary font-mono font-black text-sm">
              {readyCount}/{players.length}
            </span>
            <span className="text-muted text-[10px] font-bold uppercase">ready</span>
          </div>
        </div>

        {/* Player list */}
        <ul className="space-y-2.5 max-w-md mx-auto">
          {players.map((p) => (
            <li
              key={p.id}
              className={`p-3.5 rounded-xl flex items-center justify-between border-2 transition-all ${p.id === player?.id
                ? 'bg-secondary/10 border-secondary/40 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                : 'bg-card/50 border-card-border'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Mini crewmate avatar */}
                <div 
                  className="w-8 h-9 rounded-t-[16px] rounded-b-[6px] flex-shrink-0 border-2 border-black/20"
                  style={{ backgroundColor: getPlayerColor(p.player_token).hex }}
                >
                  <div className="w-[55%] h-[28%] bg-[#c0d8f0] rounded-[50%] ml-auto mr-[10%] mt-[24%] opacity-90 border border-black/20" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-base truncate" style={{ color: getPlayerColor(p.player_token).hex }}>
                    {p.display_name}
                  </span>
                  {p.id === player?.id && (
                    <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-md font-black flex-shrink-0">YOU</span>
                  )}
                </div>
              </div>

              {p.is_ready ? (
                <CheckCircle className="text-success w-5 h-5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted/40 flex-shrink-0"></div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background via-background/95 to-transparent safe-area-bottom">
        <button
          onClick={toggleReady}
          className={`au-btn w-full py-4 text-lg transition-all ${player?.is_ready
            ? 'bg-success text-white'
            : 'bg-card text-white border-card-border'
            }`}
        >
          {player?.is_ready ? 'NOT READY' : 'READY UP'}
        </button>
      </div>
    </main>
  );
}
