'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/amongus/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Users, Play, Loader2, AlertOctagon, XSquare, QrCode, Timer, Download, Gamepad2 } from 'lucide-react';
import { startGame, forceEndMeeting, timeExpired, autoEndMeeting, deleteGame, resetGame } from '@/app/amongus/actions/game';
import { QRCodeSVG } from 'qrcode.react';
import { getPlayerColor } from '@/lib/colors';

export default function HostDashboard() {
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();

  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [meetingTimeLeft, setMeetingTimeLeft] = useState<number | null>(null);
  const [expiredTriggered, setExpiredTriggered] = useState(false);
  const [downloadingLogs, setDownloadingLogs] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!game) return;
    if (game.status !== 'ACTIVE' && game.status !== 'MEETING') return;

    const calculateRemaining = () => {
      let elapsed = game.game_elapsed_ms || 0;
      if (game.status === 'ACTIVE' || (game.status === 'MEETING' && game.meeting_type !== 'EMERGENCY')) {
        if (game.last_resume_time) {
          elapsed += Date.now() - new Date(game.last_resume_time).getTime();
        }
      }
      const remaining = Math.max(0, (game.game_duration_ms || 1800000) - elapsed);
      return remaining;
    };

    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0 && !expiredTriggered) {
        clearInterval(interval);
        setExpiredTriggered(true);
        timeExpired(gameId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game, gameId, expiredTriggered]);

  useEffect(() => {
    if (game?.status !== 'MEETING' || !game?.meeting_expires_at) {
      setMeetingTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(game.meeting_expires_at).getTime() - Date.now());
      setMeetingTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        autoEndMeeting(gameId);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.status, game?.meeting_expires_at, gameId]);

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const hostToken = localStorage.getItem('sus_irl_host_token');
    const hostPin = localStorage.getItem('sus_irl_host_pin');
    if (!hostToken || hostPin?.trim().toLowerCase() !== 'iedccev2026') {
      router.push('/amongus/host');
      return;
    }

    const fetchGame = async () => {
      const { data: gameData, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error || !gameData) {
        router.push('/amongus/host');
        return;
      }

      setGame(gameData);

      // Fetch initial players
      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', gameId);

      if (playersData) setPlayers(playersData);

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('player_roles')
        .select('*')
        .eq('game_id', gameId);
      if (rolesData) setRoles(rolesData);

      // Fetch votes if meeting
      if (gameData.status === 'MEETING') {
        const { data: votesData } = await supabase.from('votes').select('*').eq('game_id', gameId);
        if (votesData) setVotes(votesData);
      }

      // Fetch events
      const { data: eventsData } = await supabase
        .from('game_events')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (eventsData) setEvents(eventsData.reverse());

      setLoading(false);
    };

    fetchGame();

    // Setup Realtime Channels with unique suffixes to avoid React Strict Mode collisions
    const channelSuffix = Math.random().toString(36).substring(7);

    const playersChannel = supabase.channel(`host-players-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') setPlayers(prev => [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setPlayers(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    const gameChannel = supabase.channel(`host-game-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        setGame(payload.new);
        if (payload.new.status === 'MEETING') setVotes([]); // Reset votes on new meeting
      })
      .subscribe();

    const votesChannel = supabase.channel(`host-votes-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'votes',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        setVotes(prev => [...prev, payload.new]);
      })
      .subscribe();

    const eventsChannel = supabase.channel(`host-events-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        setEvents(prev => [...prev, payload.new].slice(-50)); // keep last 50
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [gameId, router]);

  const handleStartGame = async () => {
    setStarting(true);
    setErrorMsg(null);
    try {
      const hostToken = localStorage.getItem('sus_irl_host_token');
      if (!hostToken) {
        setErrorMsg('Not authenticated');
        setStarting(false);
        return;
      }
      const res = await startGame(gameId, hostToken);
      if (res.error) {
        setErrorMsg(res.error);
        setStarting(false);
      } else {
        setStarting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start game');
      setStarting(false);
    }
  };

  const handleForceEnd = async () => {
    const hostToken = localStorage.getItem('sus_irl_host_token');
    if (!hostToken) return;
    if (!confirm('Are you sure you want to force end the meeting early?')) return;
    await forceEndMeeting(gameId, hostToken);
  };

  const handleEndGame = async () => {
    const hostToken = localStorage.getItem('sus_irl_host_token');
    if (!hostToken) {
      alert('Host token not found. Please log in again.');
      return;
    }
    if (!confirm('Are you sure you want to reset this game? Everyone will be returned to the lobby.')) return;
    const res = await resetGame(gameId, hostToken);
    if (res?.error) {
      alert('Failed to reset game: ' + res.error);
    }
  };

  const handleDeleteGame = async () => {
    const hostToken = localStorage.getItem('sus_irl_host_token');
    if (!hostToken) {
      alert('Host token not found. Please log in again.');
      return;
    }
    if (!confirm('Are you sure you want to PERMANENTLY delete this game? This cannot be undone.')) return;
    
    setDeleting(true);
    try {
      const res = await deleteGame(gameId, hostToken);
      if (res?.error) {
        alert('Failed to delete game: ' + res.error);
        setDeleting(false);
      } else {
        router.push('/amongus/host');
      }
    } catch (err: any) {
      alert('Error deleting game: ' + err.message);
      setDeleting(false);
    }
  };

  const handleDownloadLogs = async () => {
    setDownloadingLogs(true);
    try {
      const { data: allEvents, error } = await supabase
        .from('game_events')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) {
        alert('Failed to fetch event logs: ' + error.message);
        return;
      }

      if (!allEvents || allEvents.length === 0) {
        alert('No event logs recorded for this game yet.');
        return;
      }

      const lines = [
        `============================================================`,
        `AMONG US IRL - GAME EVENT HISTORY LOGS`,
        `Game Name: ${game?.name || 'Among Us Game'}`,
        `Game Code: ${game?.join_code || 'N/A'}`,
        `Export Date: ${new Date().toLocaleString()}`,
        `Total Logged Events: ${allEvents.length}`,
        `============================================================\n`,
        ...allEvents.map((e) => {
          const time = new Date(e.created_at).toLocaleString();
          return `[${time}] [${e.event_type.padEnd(7, ' ')}] ${e.message}`;
        })
      ];

      const logText = lines.join('\n');
      const blob = new Blob([logText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AmongUs_Logs_${game?.join_code || gameId.slice(0, 8)}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading event history: ' + err.message);
    } finally {
      setDownloadingLogs(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV string
    const headers = ['Player Name', 'Role', 'Status', 'Points', 'Score Breakdown'];

    const rows = players.map(p => {
      const role = roles.find(r => r.player_id === p.id)?.role || 'UNKNOWN';
      // Need to wrap in quotes to handle commas in text
      return [
        `"${p.display_name}"`,
        `"${role}"`,
        `"${p.status}"`,
        `"${p.points || 0}"`,
        `"${p.score_breakdown || ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AmongUs_Results_${gameId.slice(0, 8)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-secondary animate-spin" />
      </div>
    );
  }

  const inMeeting = game?.status === 'MEETING';
  const alivePlayersCount = players.filter(p => p.status === 'ALIVE').length;
  const isGameOver = game?.status === 'CREWMATES_WIN' || game?.status === 'IMPOSTORS_WIN';

  if (isGameOver) {
    const isCrewmatesWin = game.status === 'CREWMATES_WIN';

    return (
      <main className={`min-h-screen flex flex-col items-center justify-center p-6 text-white ${isCrewmatesWin ? 'bg-blue-900' : 'bg-red-950'}`}>
        <div className="animate-in zoom-in duration-1000 flex flex-col items-center text-center">
          <h1 className={`text-6xl font-black tracking-tighter mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] ${isCrewmatesWin ? 'text-secondary' : 'text-danger'}`}>
            {isCrewmatesWin ? 'CREWMATES WIN' : 'IMPOSTORS WIN'}
          </h1>

          <h2 className="text-4xl font-bold mb-12 text-white">
            GAME OVER
          </h2>

          <button
            onClick={handleExportCSV}
            className="bg-green-600 border-2 border-white/20 px-8 py-4 rounded-xl font-bold text-xl hover:bg-green-500 transition-all mb-4"
          >
            Download Results (Excel/CSV)
          </button>

          <button
            onClick={() => router.push('/amongus/host')}
            className="bg-black/50 border-2 border-white/20 px-8 py-4 rounded-xl font-bold text-xl hover:bg-black/70 transition-all mb-4"
          >
            Return to Dashboard
          </button>

          <button
            onClick={handleEndGame}
            className="text-gray-400 hover:text-white underline"
          >
            Reset Game to Lobby
          </button>
        </div>
      </main>
    );
  }

  const progressPercent = game?.total_tasks > 0 ? (game.tasks_completed / game.total_tasks) * 100 : 0;

  return (
    <main className="min-h-screen bg-background text-white pb-32">
      {/* Global Progress Bar */}
      <div className="h-4 w-full bg-gray-900 relative">
        <div
          className="h-full bg-success transition-all duration-1000 shadow-[0_0_10px_#00ff88]"
          style={{ width: `${progressPercent}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/50 tracking-widest">
          CREWMATE TASK PROGRESS
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Main Dashboard) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="au-panel p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary/20 rounded-full animate-radar opacity-20 pointer-events-none">
              <div className="w-1/2 h-1/2 bg-gradient-to-tr from-primary/0 via-primary/10 to-primary/40 rounded-tl-full origin-bottom-right"></div>
            </div>

            <div className="relative z-10">
              <h1 className="au-title text-4xl text-white tracking-widest">{game?.name}</h1>
              <p className="text-muted font-bold uppercase mt-1">Host Dashboard</p>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center">
              <div className="bg-white p-2 rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.5)]">
                <QRCodeSVG value={`JOIN_${game?.join_code}`} size={120} level="H" />
              </div>
              <div className="text-center bg-background border-4 border-card-border px-6 py-3 rounded-xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)] flex flex-col justify-center">
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Join Code</p>
                <p className="text-3xl font-mono font-black text-secondary tracking-widest">
                  {game?.join_code}
                </p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-danger/20 border border-danger/50 text-danger-100 p-4 rounded-xl mb-8">
              {errorMsg}
            </div>
          )}

          {inMeeting && (
            <div className="bg-blue-900/50 border border-blue-500 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center animate-pulse shadow-[0_0_20px_rgba(0,100,255,0.4)]">
              <AlertOctagon className="w-16 h-16 text-danger mb-4" />
              <h2 className="text-3xl font-black text-white mb-2 tracking-widest">{game?.meeting_type === 'BODY_REPORT' ? 'DEAD BODY REPORTED' : 'EMERGENCY MEETING'}</h2>
              <p className="text-blue-300 font-bold mb-2">Votes Cast: {votes.length} / {alivePlayersCount}</p>
              <div className="text-5xl font-mono font-black text-white mb-6 bg-black/50 px-6 py-2 rounded-xl border border-blue-500/30">
                {formatTime(meetingTimeLeft)}
              </div>
              <button
                onClick={handleForceEnd}
                className="bg-danger hover:bg-danger/80 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2"
              >
                <XSquare className="w-5 h-5" /> FORCE END MEETING
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="au-panel p-6 flex flex-col items-center justify-center">
              <Users className="w-8 h-8 text-primary mb-2" />
              <p className="text-3xl font-black">{players.length} / {game?.max_players}</p>
              <p className="text-xs text-muted font-bold uppercase mt-1">Total Players</p>
            </div>
            <div className="au-panel p-6 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-success">{alivePlayersCount}</p>
              <p className="text-xs text-muted font-bold uppercase mt-1">Alive</p>
            </div>
            <div className="au-panel p-6 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-secondary uppercase text-center">{game?.status.replace('_', ' ')}</p>
              <p className="text-xs text-muted font-bold uppercase mt-1">Status</p>
            </div>
          </div>

          {(game?.status === 'ACTIVE' || game?.status === 'MEETING') && (
            <div className="au-panel p-6 mb-8 flex flex-col items-center justify-center relative overflow-hidden">
              <Timer className="w-12 h-12 text-secondary mb-2 opacity-50 absolute right-6 top-1/2 -translate-y-1/2" />
              <p className="text-xs text-muted font-bold uppercase tracking-widest mb-1">Time Remaining</p>
              <p className={`text-6xl font-mono font-black tracking-widest ${timeLeft !== null && timeLeft <= 60000 ? 'text-danger animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </p>
              {game.status === 'MEETING' && game.meeting_type === 'EMERGENCY' && (
                <p className="text-blue-400 font-bold text-sm mt-2">TIMER PAUSED</p>
              )}
            </div>
          )}

          <div className="au-panel p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 border-b border-card-border pb-4">Player Roster</h2>
            {players.length === 0 ? (
              <p className="text-muted text-center py-8">No players have joined yet.</p>
            ) : (
              <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((p) => {
                  const isDead = p.status === 'DEAD';
                  const hasVoted = votes.some(v => v.voter_id === p.id);
                  const colorInfo = getPlayerColor(p.player_token);
                  return (
                    <li key={p.id} className={`border px-4 py-3 rounded-lg flex items-center justify-between ${isDead ? 'bg-black/50 border-gray-800 opacity-50' : 'bg-card border-card-border'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border border-black/50" style={{ backgroundColor: colorInfo.hex }}></div>
                        <span className={`font-bold truncate ${isDead ? 'line-through text-gray-500' : ''}`} style={{ color: isDead ? undefined : colorInfo.hex }}>
                          {p.display_name}
                        </span>
                      </div>

                      {game?.status === 'LOBBY' && p.is_ready && <span className="w-3 h-3 bg-success rounded-full shadow-[0_0_8px_#00ff88]"></span>}
                      {inMeeting && !isDead && hasVoted && <span className="text-xs bg-success text-black px-2 py-0.5 font-bold rounded">VOTED</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`/amongus/host/game/${gameId}/print`, '_blank')}
                className="au-btn w-full bg-card text-white py-3.5 text-base flex items-center justify-center gap-2 border border-card-border"
              >
                <QrCode className="w-5 h-5 text-gray-300" />
                PRINT BADGES
              </button>

              <button
                onClick={() => window.open('/amongus/host/sim-vault-9x7q', '_blank')}
                className="au-btn w-full bg-card border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 py-3.5 text-base flex items-center justify-center gap-2 font-bold tracking-wider"
              >
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                SIMULATOR
              </button>
            </div>

            <button
              onClick={handleStartGame}
              disabled={starting || players.length < (game?.impostor_count + 1) || game?.status !== 'LOBBY'}
              className="au-btn w-full bg-primary text-white py-5 text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8 fill-current" />}
              {starting ? 'STARTING...' : game?.status === 'ACTIVE' ? 'GAME IN PROGRESS' : 'START GAME'}
            </button>
          </div>
        </div>

        {/* Right Column (Event Feed) */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-[800px]">
          <div className="au-panel p-6 flex-1 flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b border-card-border pb-4 z-10 sticky top-0 bg-card">
              <h2 className="text-lg font-bold uppercase tracking-widest">Event Feed</h2>
              <button
                onClick={handleDownloadLogs}
                disabled={downloadingLogs}
                title="Download complete event log history"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-border hover:bg-secondary hover:text-black text-xs font-bold text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
              >
                {downloadingLogs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-secondary" />
                )}
                <span>Download Logs</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-4">
              {events.length === 0 ? (
                <p className="text-muted text-center py-4 text-sm font-bold">NO EVENTS LOGGED.</p>
              ) : (
                events.map(e => (
                  <div key={e.id} className={`text-sm p-3 rounded-lg border-4 animate-in slide-in-from-right-2 ${e.event_type === 'KILL' ? 'bg-danger/10 border-danger/50 shadow-[inset_0_0_10px_rgba(197,17,17,0.2)]' :
                      e.event_type === 'MEETING' ? 'bg-blue-900/20 border-blue-500/50' :
                        e.event_type === 'TASK' ? 'bg-success/10 border-success/30' : 'bg-background border-card-border'
                    }`}>
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </span>
                    <span className={`font-black ${e.event_type === 'KILL' ? 'text-danger' :
                        e.event_type === 'MEETING' ? 'text-blue-400' :
                          e.event_type === 'TASK' ? 'text-success' : 'text-gray-300'
                      }`}>
                      {e.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={handleEndGame}
              className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-500 font-bold py-4 rounded-xl transition-all"
            >
              RESET TO LOBBY
            </button>
            <button
              onClick={handleDeleteGame}
              disabled={deleting}
              className="flex-1 bg-danger/10 hover:bg-danger/30 border border-danger/50 text-danger font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'DELETING...' : 'DELETE GAME'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
