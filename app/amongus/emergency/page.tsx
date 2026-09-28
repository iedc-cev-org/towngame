'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertOctagon, ShieldAlert, Loader2, User, Skull, X } from 'lucide-react';
import { publicCallMeeting, publicCastVote } from '@/app/amongus/actions/game';
import { supabase } from '@/lib/amongus/supabase/client';
import { getPlayerColor } from '@/lib/colors';
import Link from 'next/link';

export default function EmergencyScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Game state
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  
  const [cooldown, setCooldown] = useState(0);
  const prevGameStatus = useRef<string | null>(null);
  
  // Voting UI State
  const [selectedVoter, setSelectedVoter] = useState<any | null>(null);
  const [submittingTargetId, setSubmittingTargetId] = useState<string | null>(null);

  // Play a loud synthesized beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 1); // Drop pitch

      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.error('AudioContext not supported');
    }
  };

  const handleCallMeeting = useCallback(async () => {
    if (!joinCode || joinCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-character game code.');
      setStatus('ERROR');
      return;
    }

    setStatus('LOADING');
    const res = await publicCallMeeting(joinCode);
    
    if (res.error) {
      setErrorMessage(res.error);
      setStatus('ERROR');
    } else {
      playBeep();
      setStatus('SUCCESS');
      // The Supabase subscription will soon pick up status === 'MEETING' and switch the UI
    }
  }, [joinCode]);

  // Spacebar shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
        }
        if (status !== 'LOADING' && status !== 'SUCCESS' && joinCode.length === 6 && (!game || game.status !== 'MEETING') && cooldown === 0) {
          handleCallMeeting();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, joinCode, game, handleCallMeeting, cooldown]);

  useEffect(() => {
    const currentStatus = game?.status;
    if (currentStatus) {
      if ((prevGameStatus.current === 'MEETING' && currentStatus === 'ACTIVE') ||
          (prevGameStatus.current === 'LOBBY' && currentStatus === 'ACTIVE')) {
        setCooldown(20);
        localStorage.setItem(`sus_irl_meeting_cooldown_${joinCode}`, Date.now().toString());
      }
      prevGameStatus.current = currentStatus;
    }
  }, [game?.status, joinCode]);

  useEffect(() => {
    if (!joinCode) return;
    const lastMeetingStr = localStorage.getItem(`sus_irl_meeting_cooldown_${joinCode}`);
    if (lastMeetingStr) {
      const elapsed = Math.floor((Date.now() - parseInt(lastMeetingStr, 10)) / 1000);
      if (elapsed < 20) {
        setCooldown(20 - elapsed);
      } else {
        setCooldown(0);
      }
    }
  }, [joinCode, game?.status]);

  useEffect(() => {
    if (cooldown > 0 && (!game || game.status !== 'MEETING')) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown, game?.status]);

  // Subscribe to game state when a valid code is entered
  useEffect(() => {
    if (joinCode.length !== 6) return;

    let isSubscribed = true;
    let gameIdRef: string | null = null;

    const fetchInitialState = async () => {
      const { data: gameData } = await supabase.from('games').select('*').eq('join_code', joinCode).single();
      if (gameData && isSubscribed) {
        gameIdRef = gameData.id;
        setGame(gameData);
        
        // Always fetch players so we have them ready
        const { data: playersData } = await supabase.from('game_players').select('*').eq('game_id', gameData.id);
        if (playersData) setPlayers(playersData);

        if (gameData.status === 'MEETING') {
          setStatus('IDLE');
          const { data: votesData } = await supabase.from('votes').select('*').eq('game_id', gameData.id);
          if (votesData) setVotes(votesData);
        }
      }
    };

    fetchInitialState();

    const channelSuffix = Math.random().toString(36).substring(7);
    const gameChannel = supabase.channel(`public-game-${joinCode}-${channelSuffix}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games' }, (payload) => {
        // Use the ref so we don't have a stale closure
        if (gameIdRef && payload.new.id !== gameIdRef) return;
        if (!gameIdRef) gameIdRef = payload.new.id;
        
        setGame(payload.new);
        if (payload.new.status === 'MEETING') {
          setStatus('IDLE');
          setSelectedVoter(null);
          setVotes([]); // Clear stale votes from previous meeting
          // Fetch fresh players and votes
          supabase.from('game_players').select('*').eq('game_id', payload.new.id).then(res => res.data && setPlayers(res.data));
          supabase.from('votes').select('*').eq('game_id', payload.new.id).then(res => res.data && setVotes(res.data));
        }
        if (payload.new.status === 'ACTIVE') {
          // Meeting just ended — refresh players to get updated statuses (ejected player is now DEAD)
          supabase.from('game_players').select('*').eq('game_id', payload.new.id).then(res => res.data && setPlayers(res.data));
        }
      })
      .subscribe();

    const votesChannel = supabase.channel(`public-votes-${joinCode}-${channelSuffix}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, (payload) => {
        // Use gameIdRef instead of stale `game` closure
        if (gameIdRef && payload.new.game_id === gameIdRef) {
          setVotes(prev => {
            // Deduplicate — don't add if we already have this vote
            if (prev.some(v => v.voter_id === payload.new.voter_id)) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    // Also listen for player status changes (someone got killed mid-game)
    const playersChannel = supabase.channel(`public-players-${joinCode}-${channelSuffix}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_players' }, (payload) => {
        if (gameIdRef && payload.new.game_id === gameIdRef) {
          setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        }
      })
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(playersChannel);
    };
  }, [joinCode]);

  const handleCastVote = async (targetId: string | null) => {
    if (!selectedVoter || status === 'LOADING') return;
    const voterId = selectedVoter.id;
    setStatus('LOADING');
    setSubmittingTargetId(targetId || 'skip');
    
    const res = await publicCastVote(joinCode, voterId, targetId);
    setStatus('IDLE');
    
    if (res.error) {
      alert(res.error);
    } else {
      // Immediately update local votes so UI shows "VOTED" without waiting for real-time
      setVotes(prev => {
        if (prev.some(v => v.voter_id === voterId)) return prev;
        return [...prev, { voter_id: voterId, target_id: targetId, game_id: game?.id }];
      });
      setSelectedVoter(null);
    }
    setSubmittingTargetId(null);
  };

  const inMeeting = game?.status === 'MEETING';

  if (inMeeting) {
    const alivePlayers = players.filter(p => p.status === 'ALIVE');
    const deadPlayers = players.filter(p => p.status === 'DEAD');
    
    return (
      <main className="min-h-screen bg-blue-950 flex flex-col items-center p-6 text-white overflow-y-auto shadow-[inset_0_0_100px_rgba(255,0,0,0.3)]">
        <header className="w-full max-w-2xl flex flex-col items-center mb-8 mt-4 animate-in slide-in-from-top fade-in">
          <AlertOctagon className="w-16 h-16 text-danger mb-2 drop-shadow-[0_0_15px_rgba(255,59,59,0.8)] animate-pulse" />
          <h1 className="au-title text-4xl text-danger text-center">PUBLIC TERMINAL</h1>
          <p className="text-blue-300 font-bold mt-2 text-center uppercase tracking-widest text-xs">Honor System Voting</p>
          <p className="text-blue-400 font-bold mt-1 text-center text-xs">
            {votes.length} / {alivePlayers.length} votes cast
          </p>
        </header>

        {selectedVoter ? (
          <div className="w-full max-w-2xl animate-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedVoter(null)}
              className="mb-6 text-blue-300 hover:text-white flex items-center gap-2 font-bold uppercase tracking-widest"
            >
              <X className="w-5 h-5" /> Back to Voter List
            </button>
            
            <h2 className="text-2xl font-black text-center mb-8">
              <span className="text-blue-300">{selectedVoter.display_name}</span>, cast your vote:
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alivePlayers.map(p => {
                const colorInfo = getPlayerColor(p.player_token);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleCastVote(p.id)}
                    disabled={p.id === selectedVoter.id || status === 'LOADING'}
                    className={`au-panel p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 ${p.id === selectedVoter.id ? 'opacity-50 grayscale cursor-not-allowed' : 'bg-blue-900 border-blue-500 hover:bg-danger hover:border-white'} ${status === 'LOADING' ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    {submittingTargetId === p.id ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <div className="w-8 h-8 rounded-full border-2 border-black" style={{ backgroundColor: colorInfo.hex }}></div>}
                    <span className="font-bold text-xl" style={{ color: colorInfo.hex }}>{p.display_name}</span>
                    {p.id === selectedVoter.id && <span className="text-xs uppercase">(You)</span>}
                  </button>
                );
              })}
              
              <button
                onClick={() => handleCastVote(null)}
                disabled={status === 'LOADING'}
                className={`au-panel p-6 flex flex-col items-center justify-center gap-3 bg-card border-card-border hover:bg-white hover:text-black transition-all hover:scale-105 sm:col-span-2 mt-4 ${status === 'LOADING' ? 'pointer-events-none opacity-70' : ''}`}
              >
                {submittingTargetId === 'skip' ? <Loader2 className="w-10 h-10 animate-spin" /> : <X className="w-10 h-10" />}
                <span className="font-bold text-xl">SKIP VOTE</span>
              </button>
            </div>
            
            {/* Global spinner removed since we have individual button spinners */}
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest text-blue-300">Select your name to vote</h2>
            
            <div className="flex flex-col gap-3">
              {alivePlayers.map(p => {
                const hasVoted = votes.some(v => v.voter_id === p.id);
                const colorInfo = getPlayerColor(p.player_token);
                return (
                  <div key={p.id} className={`au-panel p-4 flex items-center justify-between ${hasVoted ? 'bg-success/20 border-success/50' : 'bg-blue-900 border-blue-500'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-black/50" style={{ backgroundColor: colorInfo.hex }}></div>
                      <span className={`font-bold text-lg`} style={{ color: hasVoted ? '#22c55e' : colorInfo.hex }}>{p.display_name}</span>
                    </div>
                    {hasVoted ? (
                      <span className="bg-success text-black px-3 py-1 rounded font-bold text-sm">VOTED</span>
                    ) : (
                      <button 
                        onClick={() => setSelectedVoter(p)}
                        className="au-btn bg-secondary text-white px-6 py-2 rounded font-bold"
                      >
                        VOTE
                      </button>
                    )}
                  </div>
                );
              })}

              {deadPlayers.length > 0 && (
                <>
                  <h3 className="text-gray-500 font-bold uppercase tracking-widest mt-8 mb-4 text-center">Ghosts (Cannot Vote)</h3>
                  {deadPlayers.map(p => (
                    <div key={p.id} className="au-panel p-4 flex items-center gap-3 bg-black/50 border-gray-800 opacity-50">
                      <Skull className="w-6 h-6 text-gray-500" />
                      <span className="font-bold text-gray-500 line-through">{p.display_name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden">
      {/* Background Warning Animation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,0,0,0.2)_0%,_transparent_70%)] animate-pulse"></div>
      
      {status === 'SUCCESS' && (
        <div className="absolute inset-0 bg-danger/20 z-0 animate-ping"></div>
      )}

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black text-danger tracking-widest mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] text-center uppercase flex items-center gap-3">
          <ShieldAlert className="w-10 h-10" />
          Emergency
        </h1>
        <p className="text-gray-400 font-bold mb-12 uppercase tracking-widest text-center">
          Public Access Terminal
        </p>

        {/* Status Messages */}
        {status === 'ERROR' && (
          <div className="bg-danger/20 border border-danger text-danger px-6 py-3 rounded-xl mb-8 font-bold text-center w-full shadow-[0_0_15px_rgba(255,0,0,0.3)] animate-in slide-in-from-top fade-in">
            {errorMessage}
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="bg-success/20 border border-success text-success px-6 py-3 rounded-xl mb-8 font-black text-xl text-center w-full shadow-[0_0_30px_rgba(0,255,136,0.5)] animate-in zoom-in fade-in">
            MEETING CALLED!
          </div>
        )}

        {/* Game Code Input */}
        <div className="w-full mb-16 relative group">
          <label className="absolute -top-3 left-4 bg-black px-2 text-xs font-black text-gray-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-danger">
            Target Game Code
          </label>
          <input 
            type="text" 
            placeholder="ENTER CODE"
            maxLength={6}
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase());
              if (status === 'ERROR') setStatus('IDLE');
            }}
            disabled={status === 'LOADING' || status === 'SUCCESS'}
            className="w-full bg-gray-900 border-4 border-gray-800 rounded-xl px-6 py-4 text-center text-4xl font-mono font-black text-white uppercase tracking-[0.5em] focus:border-danger focus:outline-none transition-all disabled:opacity-50"
          />
        </div>

        {/* The Giant Red Button */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Base warning stripes */}
          <div className="absolute inset-0 rounded-full border-[10px] border-gray-900 shadow-[0_0_50px_rgba(255,0,0,0.3)]" 
               style={{ background: 'repeating-linear-gradient(45deg, #111, #111 25px, #ffcc00 25px, #ffcc00 50px)' }}>
          </div>
          
          {/* Button housing */}
          <div className="absolute inset-4 rounded-full bg-gray-800 shadow-inner flex items-center justify-center">
            
            {/* The actual pressable red button */}
            <button 
              onClick={handleCallMeeting}
              disabled={status === 'LOADING' || status === 'SUCCESS' || joinCode.length !== 6 || cooldown > 0}
              className={`w-48 h-48 rounded-full border-[8px] z-10 flex flex-col items-center justify-center transition-all duration-150 ${
                status === 'LOADING' || status === 'SUCCESS' || joinCode.length !== 6 || cooldown > 0
                ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed transform translate-y-2 shadow-[0_0_0_#060913]' 
                : 'bg-danger border-[#990000] shadow-[0_20px_0_#660000,0_0_60px_rgba(255,0,0,0.6)] active:translate-y-4 active:shadow-[0_4px_0_#660000,0_0_30px_rgba(255,0,0,0.4)] hover:brightness-110'
              }`}
            >
              {status === 'LOADING' ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : cooldown > 0 ? (
                <span className="font-black text-white text-7xl tracking-tighter">{cooldown}</span>
              ) : (
                <AlertOctagon className={`w-20 h-20 text-white/80 transition-transform ${status === 'SUCCESS' ? 'scale-125' : ''}`} />
              )}
            </button>
            
          </div>
        </div>
        
        <p className="mt-16 text-gray-600 font-bold text-center text-sm uppercase tracking-widest max-w-xs">
          Only use in case of an emergency. False alarms may result in ejection.
        </p>

        <Link href="/" className="mt-8 text-gray-500 hover:text-white transition-colors underline decoration-gray-700 underline-offset-4 text-sm font-bold uppercase tracking-widest">
          Return to Home
        </Link>
      </div>
    </main>
  );
}
