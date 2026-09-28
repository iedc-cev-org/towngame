'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/amongus/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScanFace, Loader2, QrCode, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Scanner from '@/components/Scanner';

function JoinGameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialCode = searchParams.get('game') || '';
  const [gameCode, setGameCode] = useState(initialCode);
  const [playerName, setPlayerName] = useState('');
  const [badgeNum, setBadgeNum] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = (decodedText: string) => {
    setIsScanning(false);
    if (decodedText.startsWith('JOIN_')) {
      setGameCode(decodedText.replace('JOIN_', '').trim());
      setError(null);
    } else if (decodedText.length === 6) {
      setGameCode(decodedText.trim().toUpperCase());
      setError(null);
    } else {
      setError('Invalid Game QR Code');
    }
  };

  useEffect(() => {
    const fetchActiveGame = async () => {
      const gId = localStorage.getItem('sus_irl_game_id');
      const pToken = localStorage.getItem('sus_irl_player_token');
      if (gId && pToken) {
        const { data: gameData } = await supabase
          .from('games')
          .select('id, name, status')
          .eq('id', gId)
          .single();
          
        if (gameData && gameData.status !== 'ENDED') {
          const { data: player } = await supabase
            .from('game_players')
            .select('id')
            .eq('game_id', gId)
            .eq('player_token', pToken)
            .single();
            
          if (player) {
            setActiveGame(gameData);
          }
        }
      }
    };
    fetchActiveGame();
  }, []);

  const handleJoin = async () => {
    if (!gameCode || !playerName || !badgeNum) {
      setError('Please enter game code, player name, and your badge number');
      return;
    }
    
    const num = parseInt(badgeNum);
    if (isNaN(num) || num < 1 || num > 30) {
      setError('Badge number must be between 1 and 30');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const code = gameCode.toUpperCase().trim();
      const name = playerName.trim();
      
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id, status, max_players')
        .eq('join_code', code)
        .single();
        
      if (gameError || !game) throw new Error('Game not found');
      if (game.status !== 'LOBBY') throw new Error('Game is already in progress');

      const { count: playerCount } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id);
        
      if (playerCount !== null && playerCount >= game.max_players) {
        throw new Error(`Game is full! (Maximum ${game.max_players} players)`);
      }
      
      const formattedNum = num.toString().padStart(2, '0');
      const playerToken = `00000000-0000-0000-0000-0000000000${formattedNum}`;
      localStorage.setItem('sus_irl_player_token', playerToken);
      
      const { data: existingPlayer } = await supabase
        .from('game_players')
        .select('id')
        .eq('game_id', game.id)
        .eq('player_token', playerToken)
        .single();
        
      if (!existingPlayer) {
        const { error: joinError } = await supabase
          .from('game_players')
          .insert({
            game_id: game.id,
            player_token: playerToken,
            display_name: name,
          });
          
        if (joinError) {
          if (joinError.code === '23505') {
            if (joinError.message.includes('player_token')) {
              throw new Error(`Badge ${num} is already taken in this game`);
            }
            throw new Error('Name is already taken in this game');
          }
          throw joinError;
        }
      }
      
      localStorage.setItem('sus_irl_game_id', game.id);
      router.push('/amongus/player/lobby');
      
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-4">
      <div className="w-full z-10">
        <h1 className="au-title text-4xl sm:text-5xl text-white mb-2 text-center tracking-tight">
          JOIN <span className="text-secondary">CREW</span>
        </h1>
        <p className="text-muted text-xs text-center uppercase tracking-[0.3em] font-bold mb-8">Among Us IRL</p>
      </div>

      {error && (
        <div className="bg-danger/20 border border-danger/40 text-danger p-3 rounded-xl mb-6 text-sm text-center font-bold">
          {error}
        </div>
      )}

      {activeGame && (
        <div className="mb-6 au-panel p-4 flex flex-col gap-4">
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mb-1">Active Session Found</span>
            <span className="text-xl font-black text-white">{activeGame.name}</span>
          </div>
          <button
            onClick={() => router.push(activeGame.status === 'LOBBY' ? '/amongus/player/lobby' : '/amongus/player/game')}
            className="au-btn w-full bg-success text-white py-3 text-base"
          >
            REJOIN GAME
          </button>
        </div>
      )}

      <div className="au-panel p-5 sm:p-6 space-y-5">
        {!gameCode ? (
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-card-border/50 flex items-center justify-center mb-2">
              <ScanFace className="w-12 h-12 text-muted/50" />
            </div>
            <p className="text-center text-muted font-bold uppercase tracking-widest text-xs px-4 leading-relaxed">Scan the QR code on the Host's screen to join.</p>
            <button 
              onClick={() => setIsScanning(true)}
              className="au-btn w-full bg-secondary text-background py-4 text-lg flex items-center justify-center gap-3 font-black"
            >
              <QrCode className="w-7 h-7" /> SCAN HOST QR
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-card-border">
              <div>
                <span className="block text-[10px] font-bold text-muted uppercase tracking-widest">Game Code</span>
                <span className="text-2xl font-black text-secondary tracking-[0.2em]">{gameCode}</span>
              </div>
              <button 
                onClick={() => setGameCode('')}
                className="text-xs font-bold uppercase text-danger/80 hover:text-danger transition-colors px-3 py-1 rounded-lg bg-danger/10"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Player Name</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={12}
                className="w-full bg-background border-2 border-card-border p-3.5 rounded-xl text-lg font-bold text-center text-white focus:outline-none focus:border-secondary transition-colors placeholder:text-muted/30"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Badge Number</label>
              <input 
                type="number" 
                value={badgeNum}
                onChange={(e) => setBadgeNum(e.target.value)}
                min={1}
                max={30}
                className="w-full bg-background border-2 border-card-border p-3.5 rounded-xl text-lg font-bold text-center text-secondary focus:outline-none focus:border-secondary transition-colors placeholder:text-muted/30"
                placeholder="1-30"
              />
              <p className="text-[10px] text-muted text-center mt-2 uppercase font-bold tracking-widest">Look at the physical badge given by the host</p>
            </div>

            <button 
              onClick={handleJoin}
              disabled={loading || !gameCode || !playerName}
              className="au-btn w-full bg-primary text-white py-4 text-lg disabled:opacity-50 flex items-center justify-center gap-3 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'JOIN GAME'}
            </button>
          </>
        )}
      </div>

      {isScanning && <Scanner onScan={handleScan} onClose={() => setIsScanning(false)} title="SCAN HOST" subtitle="Scan the Host's game QR code." />}

      <div className="mt-6 text-center">
        <Link href="/" className="text-muted/60 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function JoinGame() {
  return (
    <main className="min-h-screen p-6 bg-background flex flex-col items-center justify-center">
      <Suspense fallback={<Loader2 className="w-12 h-12 text-secondary animate-spin" />}>
        <JoinGameContent />
      </Suspense>
    </main>
  );
}
