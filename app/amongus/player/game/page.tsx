'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/amongus/supabase/client';
import { getMyRole, eliminatePlayer, completeTask, submitTaskPin, reportDeadBody, autoEndMeeting, timeExpired } from '@/app/amongus/actions/game';
import { Loader2, ScanFace, Ghost, Skull, AlertOctagon, User, X, CheckCircle, FileScan, KeyRound, Search, UserX, MapPin, Map as MapIcon } from 'lucide-react';
import Scanner from '@/components/Scanner';
import { QRCodeSVG } from 'qrcode.react';
import WiringGame from '@/components/WiringGame';
import PuzzleGame from '@/components/PuzzleGame';
import AdminCardSwipeGame from '@/components/AdminCardSwipeGame';
import ReactorGame from '@/components/ReactorGame';
import ShieldsGame from '@/components/ShieldsGame';
import DistributorGame from '@/components/DistributorGame';
import RadioFreqGame from '@/components/RadioFreqGame';
import CircuitBypassGame from '@/components/CircuitBypassGame';
import PressureValvesGame from '@/components/PressureValvesGame';
import OrbitalDefenseGame from '@/components/OrbitalDefenseGame';
import DnaAnomalyGame from '@/components/DnaAnomalyGame';
import NavAlignGame from '@/components/NavAlignGame';
import FuelTransferGame from '@/components/FuelTransferGame';
import GarbageChuteGame from '@/components/GarbageChuteGame';
import BasketballDropGame from '@/components/BasketballDropGame';
import CoolantBypassGame from '@/components/CoolantBypassGame';
import { getPlayerColor } from '@/lib/colors';
import MapViewer from '@/components/map/MapViewer';

export default function PlayerGameDashboard() {
  const router = useRouter();
  
  const [role, setRole] = useState<string | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [player, setPlayer] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [impostorTeammates, setImpostorTeammates] = useState<string[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isScanningKill, setIsScanningKill] = useState(false);
  const [isScanningTask, setIsScanningTask] = useState(false);
  const [isScanningBody, setIsScanningBody] = useState(false);
  const [killMessage, setKillMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [taskMessage, setTaskMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [bodyMessage, setBodyMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedMiniGame, setSelectedMiniGame] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isProcessingKill, setIsProcessingKill] = useState(false);
  const [isProcessingBody, setIsProcessingBody] = useState(false);
  const [isProcessingTask, setIsProcessingTask] = useState(false);
  
  const [ejectionText, setEjectionText] = useState<string | null>(null);
  const [wasEjected, setWasEjected] = useState(false);
  const [killCooldown, setKillCooldown] = useState(0);
  const [meetingAlert, setMeetingAlert] = useState(false);
  const [meetingCaller, setMeetingCaller] = useState<string | null>(null);
  const prevStatus = useRef(game?.status);
  const playerIdRef = useRef<string | null>(null);
  const isCompletingTaskRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [meetingTimeLeft, setMeetingTimeLeft] = useState<number | null>(null);
  const [expiredTriggered, setExpiredTriggered] = useState(false);

  const TASK_LOCATIONS: Record<string, string> = {
    'task-wiring': 'MCA Top Terrace Stair',
    'task-puzzle': 'MCA Near Room D309',
    'task-admin-swipe': 'IEDC Notice Board',
    'task-reactor': 'MCA 2nd Floor Toilet Near D309',
    'task-radio-freq': 'Physics Lab',
    'task-circuit-bypass': 'MCA Entrance',
    'task-pressure-valves': 'MainBlock Fire Extinguisher',
    'task-orbital-defense': 'MainBlock - A107',
    'task-dna-anomaly': 'Chemistry Lab',
    'task-nav-align': 'Normal Parking',
    'task-fuel-transfer': 'Generator',
    'task-garbage-chute': 'Waste Bin Near Library',
    'task-shields': 'Main Block Old Repography',
    'task-distributor': 'Cafeteria',
    'task-basket-ball': 'Basketball Court',
    'task-coolant-bypass': 'Staff Parking',
    'task-qr-drawing': 'MCA Drawing Room D209',
    'task-bulb': 'MCA Electrical Room (2nd floor)',
    'task-cleaning': 'MCA Near D209',
    'task-solar': 'MCA Upper Terrace',
    'task-potato': 'MCA Side Terrace',
    'task-stack-cups': 'MCA D309',
    'task-cup-rebuild': 'MCA Lecture Hall',
    'task-paper-plane': 'MCA Ground Floor',
    'task-color-picking': 'MCA Cafeteria + Junction',
    'task-find-object': 'Near Physics Lab (under stair)',
    'task-throw': 'Near Chemistry Lab',
    'task-arrange-ball': 'Near IEDC Town',
    'task-book-game': 'Library Front',
    'task-pen-flight': 'MainBlock - A107',
    'task-pen-fight': 'MainBlock - A107',
    'task-stone-paper-scissors': 'Main Block Reception',
    'task-rps': 'Main Block Reception',
    'task-memory-game': 'Main Block Reception',
    'task-fill-bottle': 'Main Block New Filter',
    'task-football': 'Basketball Court',
    'task-die-game': 'Normal Parking',
    'task-bottle-flip': 'Ladies Hostel Entrance Parking',
    'task-single-leg': 'Staff Parking',
    'task-ring-throw': 'New Parking',
    'task-coin-toss': 'Cafeteria',
    'task-ballon-race': 'Ladies Hostel Steps',
    'task-balloon-race': 'Ladies Hostel Steps',
    'task-hammer-hit': 'Quilandi Bus Parking',
    'task-paint-fight': 'Quilandi Bus Parking',
    'task-123-games': 'Quilandi Bus Parking',
    'task-123-game': 'Quilandi Bus Parking',
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
      return Math.max(0, (game.game_duration_ms || 1800000) - elapsed);
    };

    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0 && !expiredTriggered) {
        clearInterval(interval);
        setExpiredTriggered(true);
        if (gameId) timeExpired(gameId);
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
        if (gameId) autoEndMeeting(gameId);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [game?.status, game?.meeting_expires_at]);

  useEffect(() => {
    const lastKill = localStorage.getItem('sus_irl_last_kill_time');
    if (lastKill) {
      const elapsed = Math.floor((Date.now() - parseInt(lastKill, 10)) / 1000);
      if (elapsed < 30) {
        setKillCooldown(30 - elapsed);
      }
    }
  }, []);

  useEffect(() => {
    if (killCooldown > 0) {
      const timer = setTimeout(() => setKillCooldown(killCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [killCooldown]);

  // Play emergency meeting alarm beep using Web Audio API
  const playMeetingAlarm = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (startTime: number, freq: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Alarm pattern: rapid high-pitched beeps
      const now = audioCtx.currentTime;
      for (let i = 0; i < 8; i++) {
        playBeep(now + i * 0.25, i % 2 === 0 ? 880 : 660, 0.2);
      }
      // Final long alarm tone
      playBeep(now + 2.0, 880, 0.8);
    } catch (e) {
      // Audio API not available, silently skip
    }
  };

  const hasShownMeetingAlert = useRef(false);

  useEffect(() => {
    // Detect transition TO meeting OR initial load with MEETING status: show alert
    if (game?.status === 'MEETING' && !hasShownMeetingAlert.current) {
      hasShownMeetingAlert.current = true;
      setMeetingAlert(true);
      playMeetingAlarm();
      setTimeout(() => setMeetingAlert(false), 4000);
      // Fetch who called the meeting
      if (gameId) {
        supabase
          .from('game_events')
          .select('message')
          .eq('game_id', gameId)
          .eq('event_type', 'MEETING')
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setMeetingCaller(data[0].message.replace('🚨 ', ''));
            }
          });
      }
    }
    // Reset flag when game leaves meeting so alert can trigger again next meeting
    if (game?.status && game.status !== 'MEETING') {
      hasShownMeetingAlert.current = false;
      setMeetingCaller(null);
    }
    // Detect transition FROM meeting: show ejection
    if (prevStatus.current === 'MEETING' && game?.status === 'ACTIVE') {
      const fetchEjection = async () => {
        if (!gameId) return;
        const { data } = await supabase
          .from('game_events')
          .select('message')
          .eq('game_id', gameId)
          .eq('event_type', 'MEETING')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (data && data.length > 0) {
          const text = data[0].message.replace('💀 ', '').replace('➖ ', '');
          setEjectionText(text);
          setTimeout(() => setEjectionText(null), 7000);
        }
      };
      fetchEjection();
    }
    prevStatus.current = game?.status;
  }, [game?.status, gameId]);

  useEffect(() => {
    const initGame = async () => {
      const gId = localStorage.getItem('sus_irl_game_id');
      const pToken = localStorage.getItem('sus_irl_player_token');

      if (!gId || !pToken) {
        router.push('/');
        return;
      }
      
      setGameId(gId);
      setPlayerToken(pToken);

      try {
        const roleData = await getMyRole(gId, pToken);
        if (roleData.error) throw new Error(roleData.error);
        setRole(roleData.role);
        if (roleData.teammates) {
          setImpostorTeammates(roleData.teammates);
        }

        const { data: playerData, error: pErr } = await supabase
          .from('game_players')
          .select('*')
          .eq('game_id', gId)
          .eq('player_token', pToken)
          .single();
          
        if (pErr || !playerData) throw new Error('Player data not found');
        setPlayer(playerData);
        playerIdRef.current = playerData.id;

        const { data: gameData } = await supabase.from('games').select('*').eq('id', gId).single();
        setGame(gameData);

        const { data: playersData } = await supabase.from('game_players').select('*').eq('game_id', gId);
        if (playersData) setAllPlayers(playersData);

        let targetIds = [playerData.id];
        if (playerData.role === 'CREWMATE' && playerData.status === 'ALIVE' && playersData) {
          const deadCrewmates = playersData.filter(p => p.role === 'CREWMATE' && p.status === 'DEAD');
          deadCrewmates.forEach(p => targetIds.push(p.id));
        }

        const { data: tasksData } = await supabase.from('player_tasks').select('*').in('player_id', targetIds);
        if (tasksData) {
          const filteredTasks = tasksData.filter(t => t.player_id === playerData.id || !t.completed);
          filteredTasks.sort((a, b) => (a.player_id === playerData.id ? -1 : 1));
          setMyTasks(filteredTasks);
        }

        // Check if player was ejected (dead but not in kills table as victim)
        if (playerData.status === 'DEAD') {
          const { data: killRecord } = await supabase
            .from('kills')
            .select('id')
            .eq('victim_id', playerData.id)
            .limit(1);
          setWasEjected(!killRecord || killRecord.length === 0);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load game state');
      } finally {
        setLoading(false);
      }
    };

    initGame();
  }, [router]);

  useEffect(() => {
    if (!gameId || !playerIdRef.current) return;
    const currentPlayerId = playerIdRef.current;

    // Robust sync function to recover state when phone wakes up or reconnects
    const syncGameState = async () => {
      try {
        const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
        if (data) setGame(data);
        
        const { data: playersData } = await supabase.from('game_players').select('*').eq('game_id', gameId);
        if (playersData) {
          setAllPlayers(playersData);
          const me = playersData.find(p => p.id === currentPlayerId);
          if (me) setPlayer(me);
        }

        let targetIds = [currentPlayerId];
        if (playersData) {
          const me = playersData.find(p => p.id === currentPlayerId);
          if (me && me.role === 'CREWMATE' && me.status === 'ALIVE') {
            const deadCrewmates = playersData.filter(p => p.role === 'CREWMATE' && p.status === 'DEAD');
            deadCrewmates.forEach(p => targetIds.push(p.id));
          }
        }
        
        const { data: tasksData } = await supabase.from('player_tasks').select('*').in('player_id', targetIds);
        if (tasksData) {
          const filteredTasks = tasksData.filter(t => t.player_id === currentPlayerId || !t.completed);
          filteredTasks.sort((a, b) => (a.player_id === currentPlayerId ? -1 : 1));
          setMyTasks(filteredTasks);
        }
      } catch (e) {}
    };

    const handleWake = () => {
      if (document.visibilityState === 'visible') syncGameState();
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);

    const channelSuffix = Math.random().toString(36).substring(7);

    const playersChannel = supabase.channel(`players-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_players',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        setAllPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        if (payload.new.id === currentPlayerId) {
          setPlayer(payload.new);
          // When player just died, check if it was a kill or ejection
          if (payload.new.status === 'DEAD') {
            supabase
              .from('kills')
              .select('id')
              .eq('victim_id', currentPlayerId)
              .limit(1)
              .then(({ data: killRecord }) => {
                setWasEjected(!killRecord || killRecord.length === 0);
              });
          }
        }
      })
      .subscribe();

    const gameChannel = supabase.channel(`game-${gameId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        setGame(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncGameState();
        }
      });

    const taskChannel = supabase.channel(`tasks-${currentPlayerId}-${channelSuffix}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_tasks',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setMyTasks(prev => {
            const exists = prev.find(t => t.id === payload.new.id);
            if (exists) {
              return prev.map(t => t.id === payload.new.id ? payload.new : t);
            }
            return [...prev, payload.new as any];
          });
        } else if (payload.eventType === 'DELETE') {
          setMyTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    // Periodic sync fallback every 1.5 seconds for unreliable mobile realtime
    const syncInterval = setInterval(syncGameState, 1500);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [gameId, player?.id]);

  // Handle Game Reset
  useEffect(() => {
    if (game?.status === 'LOBBY') {
      router.push('/amongus/player');
    }
  }, [game?.status, router]);

  // Clean up any open mini-games or scanners if an emergency meeting is called or player dies
  useEffect(() => {
    if (game?.status !== 'ACTIVE' || player?.status === 'DEAD') {
      setSelectedMiniGame(null);
      setSelectedTask(null);
      setIsScanningTask(false);
      setIsScanningBody(false);
      setIsScanningKill(false);
    }
  }, [game?.status, player?.status]);

  const handleScanKill = async (decodedText: string) => {
    setIsScanningKill(false);
    setKillMessage(null);
    if (!gameId || !playerToken) return;
    
    const targetId = decodedText.trim();
    if (!targetId || targetId.length < 10 || targetId.startsWith('DEAD_') || targetId.startsWith('task-') || targetId.startsWith('fake-')) {
      setKillMessage({ type: 'error', text: 'Invalid player QR code.' });
      return;
    }

    setIsProcessingKill(true);
    try {
      const res = await eliminatePlayer(gameId, playerToken, targetId);
      if (res.error) {
        setKillMessage({ type: 'error', text: res.error });
      } else {
        setKillMessage({ type: 'success', text: 'Kill successful!' });
        setKillCooldown(30);
        localStorage.setItem('sus_irl_last_kill_time', Date.now().toString());
      }
    } catch (err: any) {
      setKillMessage({ type: 'error', text: 'Server error during elimination.' });
    } finally {
      setIsProcessingKill(false);
    }
  };

  const handleScanBody = async (decodedText: string) => {
    setIsScanningBody(false);
    setBodyMessage(null);
    if (!gameId || !playerToken) return;
    
    setIsProcessingBody(true);
    try {
      const res = await reportDeadBody(gameId, playerToken, decodedText.trim());
      if (res.error) setBodyMessage({ type: 'error', text: res.error });
      else setBodyMessage({ type: 'success', text: 'Body reported!' });
    } catch (err: any) {
      setBodyMessage({ type: 'error', text: 'Server error during report.' });
    } finally {
      setIsProcessingBody(false);
    }
  };

  const handleScanTask = async (decodedText: string) => {
    setIsScanningTask(false);
    setTaskMessage(null);
    if (!gameId || !playerToken) return;
    
    // Sanitize scanned input
    let cleanCode = decodedText.trim().replace(/^["']|["']$/g, '');
    if (cleanCode.includes('/')) {
      const parts = cleanCode.split('/').filter(Boolean);
      cleanCode = parts[parts.length - 1] || cleanCode;
    }
    if (cleanCode.includes('?')) {
      const match = cleanCode.match(/[?&](?:task|location|id|pin)=([^&]+)/i);
      if (match) cleanCode = match[1];
    }

    if (cleanCode.startsWith('fake-qr')) {
      setTaskMessage({ type: 'error', text: 'This is not the QR!' });
      return;
    }

    if (cleanCode.startsWith('DEAD_')) {
      setTaskMessage({ type: 'error', text: 'This is a dead body, not a task.' });
      return;
    }

    const cleanLower = cleanCode.toLowerCase();
    const cleanStripped = cleanLower.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');

    const tasksAtLocation = myTasks.filter(t => {
      const loc = (t.task_location_id || '').toLowerCase().trim();
      const locStripped = loc.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');
      const pin = (t.pin_code || '').toLowerCase().trim();
      const pinStripped = pin.replace(/^(task|game)-/i, '').replace(/[-_ ]/g, '');
      return (
        loc === cleanLower ||
        locStripped === cleanStripped ||
        (pin && (pin === cleanLower || pinStripped === cleanStripped))
      );
    });
    
    if (tasksAtLocation.length === 0) {
      setTaskMessage({ type: 'error', text: 'You do not have this task.' });
      return;
    }

    const task = tasksAtLocation.find(t => !t.completed) || tasksAtLocation[0];
    
    if (task.completed) {
      setTaskMessage({ type: 'error', text: 'Task already completed.' });
      return;
    }
    
    if (task.task_type === 'PIN') {
      setSelectedTask(task);
    } else if (task.task_type === 'MINIGAME') {
      setSelectedMiniGame(task);
    } else {
      // Optimistic update using task.id
      setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t));
      setIsProcessingTask(true);
      try {
        const res = await completeTask(gameId, playerToken, task.task_location_id);
        if (res.error) {
          setTaskMessage({ type: 'error', text: res.error });
          // Revert optimistic update
          setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: false } : t));
        } else {
          if (task.task_location_id === 'task-qr-drawing') {
            setTaskMessage({ type: 'success', text: 'Found the correct QR!' });
          } else {
            setTaskMessage({ type: 'success', text: 'Task completed!' });
          }
        }
      } catch (err: any) {
        setTaskMessage({ type: 'error', text: 'Server error.' });
        setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: false } : t));
      } finally {
        setIsProcessingTask(false);
      }
    }
  };

  const handleMiniGameComplete = async () => {
    if (!gameId || !playerToken || !selectedMiniGame || isCompletingTaskRef.current) return;
    isCompletingTaskRef.current = true;
    const miniGame = selectedMiniGame;
    setSelectedMiniGame(null);
    // Optimistic update
    setMyTasks(prev => prev.map(t => t.id === miniGame.id ? { ...t, completed: true } : t));
    setIsProcessingTask(true);
    try {
      const res = await completeTask(gameId, playerToken, miniGame.task_location_id);
      if (res.error) {
        setTaskMessage({ type: 'error', text: res.error });
        setMyTasks(prev => prev.map(t => t.id === miniGame.id ? { ...t, completed: false } : t));
      } else {
        setTaskMessage({ type: 'success', text: 'Task completed!' });
      }
    } catch (err: any) {
      setTaskMessage({ type: 'error', text: 'Server error.' });
      setMyTasks(prev => prev.map(t => t.id === miniGame.id ? { ...t, completed: false } : t));
    } finally {
      setIsProcessingTask(false);
      isCompletingTaskRef.current = false;
    }
  };

  const handleSubmitPin = async () => {
    if (!gameId || !playerToken || !selectedTask || isSubmittingTask) return;
    setIsSubmittingTask(true);
    const task = selectedTask;
    
    try {
      const res = await submitTaskPin(gameId, playerToken, task.id, pinInput);
      if (res.error) {
        setTaskMessage({ type: 'error', text: res.error });
      } else {
        setTaskMessage({ type: 'success', text: 'Task completed!' });
        setMyTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t));
        setSelectedTask(null);
        setPinInput('');
      }
    } catch (err: any) {
      setTaskMessage({ type: 'error', text: 'Server error.' });
    } finally {
      setIsSubmittingTask(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-6 text-center">
        <p className="text-danger font-bold mb-4">{error}</p>
        <button onClick={() => router.push('/')} className="bg-card border border-card-border px-6 py-2 rounded-xl">Back Home</button>
      </div>
    );
  }

  // Full-screen processing overlay
  const ProcessingOverlay = ({ message }: { message: string }) => (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
      <Loader2 className="w-16 h-16 text-secondary animate-spin mb-6" />
      <p className="text-white font-black text-2xl tracking-widest uppercase animate-pulse">{message}</p>
    </div>
  );

  const isImpostor = role === 'IMPOSTOR';
  const isDead = player?.status === 'DEAD';
  const inMeeting = game?.status === 'MEETING';
  const isGameOver = game?.status === 'CREWMATES_WIN' || game?.status === 'IMPOSTORS_WIN';

  if (isGameOver) {
    const isCrewmatesWin = game.status === 'CREWMATES_WIN';
    const didIWin = (isCrewmatesWin && !isImpostor) || (!isCrewmatesWin && isImpostor);

    return (
      <main className={`min-h-screen flex flex-col items-center justify-center p-6 text-white ${isCrewmatesWin ? 'bg-blue-900' : 'bg-red-950'}`}>
        <div className="animate-in zoom-in duration-1000 flex flex-col items-center text-center">
          <h1 className={`au-title text-6xl md:text-7xl mb-6 ${isCrewmatesWin ? 'text-secondary' : 'text-danger'}`}>
            {isCrewmatesWin ? 'CREWMATES WIN' : 'IMPOSTORS WIN'}
          </h1>
          
          <h2 className={`text-4xl font-bold mb-12 ${didIWin ? 'text-success' : 'text-gray-500'}`}>
            {didIWin ? 'VICTORY' : 'DEFEAT'}
          </h2>

          <button 
            onClick={() => router.push('/')}
            className="au-btn bg-card text-white px-8 py-4 text-xl"
          >
            Leave Game
          </button>
        </div>
      </main>
    );
  }

  if (ejectionText) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white relative overflow-hidden">
        {/* Starfield background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.2,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
              }}
            />
          ))}
        </div>
        
        {/* Ejection animation */}
        <div className="animate-eject flex flex-col items-center z-10 w-full text-center px-6">
          <UserX className="w-20 h-20 text-danger mb-8 drop-shadow-[0_0_30px_rgba(255,59,59,0.6)]" />
          <h2 className="au-title text-3xl md:text-4xl text-white leading-relaxed uppercase mb-4" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 0px #000' }}>
            {ejectionText}
          </h2>
        </div>
      </main>
    );
  }

  if (inMeeting) {
    // Show dramatic red flash alert for the first 4 seconds
    if (meetingAlert) {
      return (
        <main className="meeting-alert-screen min-h-screen flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
          {/* Flashing red overlay */}
          <div className="absolute inset-0 meeting-flash-bg z-0"></div>
          
          {/* Scan lines effect */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,_transparent,_transparent_2px,_rgba(0,0,0,0.3)_2px,_rgba(0,0,0,0.3)_4px)] z-10 pointer-events-none"></div>
          
          <div className="z-20 flex flex-col items-center text-center">
            <div className="meeting-alert-icon mb-6">
              <AlertOctagon className="w-32 h-32 text-white drop-shadow-[0_0_40px_rgba(255,59,59,1)]" />
            </div>
            
            <h1 className="meeting-alert-title au-title text-5xl md:text-8xl text-white mb-6" style={{ textShadow: '0 0 40px rgba(255,0,0,1), 0 0 80px rgba(255,0,0,0.8), 0 6px 0 #000' }}>
              {game?.meeting_type === 'BODY_REPORT' ? 'DEAD BODY' : 'EMERGENCY'}
            </h1>
            <h2 className="meeting-alert-subtitle text-3xl md:text-5xl font-black text-white tracking-[0.2em] md:tracking-[0.3em] uppercase animate-pulse" style={{ textShadow: '0 0 20px rgba(255,0,0,0.8)' }}>
              {game?.meeting_type === 'BODY_REPORT' ? 'REPORTED' : 'MEETING'}
            </h2>
            
            <div className="mt-10 meeting-alert-instruction">
              <p className="text-xl md:text-2xl font-black text-white uppercase tracking-widest animate-pulse">
                ⚠️ GO TO THE MEETING POINT NOW ⚠️
              </p>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-blue-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden shadow-[inset_0_0_100px_rgba(255,0,0,0.3)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,59,59,0.1)_0%,_transparent_60%)] animate-pulse"></div>

        <div className="z-10 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
          <AlertOctagon className="w-24 h-24 text-danger mb-6 drop-shadow-[0_0_20px_rgba(255,59,59,0.8)] animate-bounce" />
          <h1 className="au-title text-5xl md:text-6xl text-danger text-center mb-4">{game?.meeting_type === 'BODY_REPORT' ? 'DEAD BODY REPORTED' : 'MEETING CALLED'}</h1>
          
          {meetingCaller && (
            <div className="bg-danger/20 border border-danger/40 px-6 py-3 rounded-xl mb-6 max-w-sm w-full text-center animate-in fade-in duration-700">
              <p className="text-white font-bold text-lg" style={{ textShadow: '0 0 10px rgba(255,59,59,0.5)' }}>
                {meetingCaller}
              </p>
            </div>
          )}

          <div className="text-4xl font-mono font-black text-white mb-6 bg-black/50 px-6 py-2 rounded-xl border border-danger/30">
            {formatTime(meetingTimeLeft)}
          </div>
          
          <div className="bg-black/60 border border-gray-800 p-8 rounded-2xl max-w-sm w-full text-center mb-8 backdrop-blur-sm">
            <p className="text-xl font-bold mb-4">
              Head to the <span className="text-secondary font-black">PUBLIC TERMINAL</span> immediately!
            </p>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">
              Discuss and cast your vote on the public laptop.
            </p>
          </div>

          {isDead ? (
            <div className="au-panel px-8 py-4 bg-black/80 border-gray-800 text-gray-500 text-center w-full max-w-sm">
               <span className="font-bold text-lg tracking-widest uppercase">Ghosts cannot vote.</span>
            </div>
          ) : (
            <div className="au-panel px-8 py-4 bg-card border-card-border text-muted text-center w-full max-w-sm">
              <span className="font-bold text-lg tracking-widest uppercase animate-pulse">Go vote at the terminal!</span>
            </div>
          )}
        </div>
      </main>
    );
  }

  const progressPercent = game?.total_tasks > 0 ? (game.tasks_completed / game.total_tasks) * 100 : 0;

  return (
    <main className={`min-h-screen flex flex-col transition-colors duration-1000 ${
      isDead ? 'bg-black text-gray-400' : isImpostor ? 'bg-background' : 'bg-background'
    }`}>
      {isProcessingKill && <ProcessingOverlay message="Eliminating..." />}
      {isProcessingBody && <ProcessingOverlay message="Reporting..." />}
      {isProcessingTask && <ProcessingOverlay message="Completing..." />}
      {isDead && <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black opacity-80 z-0"></div>}

      {/* Global Progress Bar */}
      <div className="h-4 w-full bg-gray-900 relative z-20">
        <div 
          className="h-full bg-success transition-all duration-1000 shadow-[0_0_10px_#00ff88]" 
          style={{ width: `${progressPercent}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/50 tracking-widest">
          TOTAL TASK PROGRESS
        </div>
      </div>

      <header className={`p-4 border-b relative z-10 flex justify-between items-center ${
        isDead ? 'border-gray-800 bg-black/50' : 'border-card-border bg-card/50'
      }`}>
        <div className="flex items-center gap-2">
          {isDead ? <Ghost className="w-5 h-5 text-gray-500" /> : <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]`} style={{ backgroundColor: getPlayerColor(player?.player_token).hex, color: getPlayerColor(player?.player_token).hex }}></div>}
          <span className={`font-black tracking-widest text-sm ${isDead ? 'text-gray-500' : 'text-secondary'}`}>
            {isDead ? 'GHOST' : role}
          </span>
        </div>
        {(game?.status === 'ACTIVE' || game?.status === 'MEETING') && (
          <div className={`font-mono font-black text-lg tracking-widest text-center mx-2 ${timeLeft !== null && timeLeft <= 60000 ? 'text-danger animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
        )}
        <div className="flex items-center gap-3 ml-2">
          <button 
            onClick={() => setShowMap(true)}
            className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-500/50 flex items-center justify-center text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <div className="font-bold text-sm text-right overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: getPlayerColor(player?.player_token).hex }}>
            {player?.display_name}
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 relative z-10 overflow-y-auto">
        {isDead && (
          <div className="text-center animate-in fade-in zoom-in duration-1000 mb-8">
            {wasEjected ? (
              <>
                <UserX className="w-16 h-16 text-amber-500 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                <h1 className="text-2xl font-black text-amber-500 tracking-tighter mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">YOU WERE EJECTED</h1>
                <div className="au-panel p-5 mx-auto my-6 max-w-xs border-amber-900">
                  <p className="text-amber-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
                    The crew voted you out.
                  </p>
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">
                    You are now a ghost.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Skull className="w-16 h-16 text-gray-800 mx-auto mb-2" />
                <h1 className="text-2xl font-black text-danger tracking-tighter mb-2 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">YOU ARE DEAD</h1>
                <div className="bg-white p-4 rounded-2xl mx-auto my-6 w-max border-4 border-danger shadow-[0_0_30px_rgba(255,0,0,0.4)]">
                  <QRCodeSVG value={`DEAD_${player.id}`} size={150} level="H" />
                </div>
                <p className="text-danger font-bold uppercase tracking-widest text-xs max-w-[200px] mx-auto leading-loose mb-4">
                  Other players can scan this to report your body.
                </p>
              </>
            )}
          </div>
        )}

        {isImpostor && !isDead && (
          <div className="w-full flex flex-col items-center mb-10">
            {killMessage && (
              <div className={`w-full p-4 rounded-xl font-bold text-center mb-6 animate-in slide-in-from-top-4 fade-in ${
                killMessage.type === 'success' ? 'bg-danger/20 text-danger border border-danger/50 shadow-[0_0_15px_rgba(255,59,59,0.3)]' : 'bg-card text-muted border border-card-border'
              }`}>
                {killMessage.type === 'success' ? <Skull className="w-6 h-6 inline-block mr-2" /> : null}
                {killMessage.text}
              </div>
            )}
            
            <button 
              onClick={() => setIsScanningKill(true)}
              disabled={killCooldown > 0}
              className={`w-40 h-40 rounded-full border-[8px] border-card-border flex flex-col items-center justify-center gap-2 shadow-[0_8px_0_#060913] transition-all mx-auto ${
                killCooldown > 0 
                  ? 'bg-gray-800 opacity-50 cursor-not-allowed transform translate-y-2 shadow-[0_0_0_#060913]' 
                  : 'bg-secondary hover:scale-105 active:translate-y-2 active:shadow-[0_0_0_#060913]'
              }`}
            >
              {killCooldown > 0 ? (
                <span className="font-black text-white text-6xl tracking-tighter">{killCooldown}</span>
              ) : (
                <>
                  <ScanFace className="w-12 h-12 text-black" />
                  <span className="font-black text-black tracking-widest text-lg">SCAN</span>
                </>
              )}
            </button>
            <p className="text-muted text-sm font-bold mt-4 text-center px-8">Scan a player's QR code.</p>
            {impostorTeammates.length > 0 && (
              <p className="text-secondary/60 text-xs font-bold mt-2 text-center uppercase tracking-widest">
                Team: {impostorTeammates.map(id => allPlayers.find(p => p.id === id)?.display_name).filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}

        {!isDead && (
          <div className="w-full max-w-sm mx-auto">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-black text-white tracking-widest">{isImpostor ? 'FAKE TASKS' : 'TASKS'}</h2>
              {!isImpostor && (
                <button 
                  onClick={() => setIsScanningTask(true)}
                  className="au-btn bg-secondary text-white px-4 py-2 text-sm flex items-center gap-2"
                >
                  <FileScan className="w-4 h-4" /> SCAN TASK
                </button>
              )}
            </div>
            
            {taskMessage && (
              <div className={`w-full p-3 rounded-lg font-bold text-center mb-4 text-sm ${
                taskMessage.type === 'success' ? 'bg-success/20 text-success border border-success/50' : 'bg-danger/20 text-danger border border-danger/50'
              }`}>
                {taskMessage.text}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {myTasks.map(t => (
                <div 
                  key={t.id} 
                  className={`au-panel p-4 flex items-center justify-between transition-all ${
                    t.completed ? 'border-success opacity-50 animate-task-pop' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`font-bold ${t.completed ? 'text-success line-through' : 'text-white'}`}>
                      {t.task_name}
                    </span>
                    <span className="text-xs text-secondary/70 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {TASK_LOCATIONS[t.task_location_id] || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted mt-1 uppercase tracking-widest flex items-center gap-1">
                      {t.task_type === 'PIN' ? <><KeyRound className="w-3 h-3" /> Requires Referee PIN</> : 
                       t.task_type === 'MINIGAME' ? <><FileScan className="w-3 h-3" /> Scan to Play</> : 
                       <><FileScan className="w-3 h-3" /> Requires Scan</>}
                    </span>
                  </div>
                  {t.completed ? <CheckCircle className="w-6 h-6 text-success" /> : <div className="w-6 h-6 rounded-full border-2 border-muted"></div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isDead && (
        <div className="p-4 relative z-10 bg-background/80 backdrop-blur-sm border-t border-card-border mt-auto flex flex-col items-center">
          {bodyMessage && (
            <div className={`w-full p-3 rounded-lg font-bold text-center mb-4 text-sm ${
              bodyMessage.type === 'success' ? 'bg-success/20 text-success border border-success/50' : 'bg-danger/20 text-danger border border-danger/50'
            }`}>
              {bodyMessage.text}
            </div>
          )}
          <button 
            onClick={() => setIsScanningBody(true)}
            className="au-btn w-full py-4 text-lg bg-danger text-white flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,59,59,0.2)]"
          >
            <Search className="w-5 h-5" /> REPORT DEAD BODY
          </button>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="au-panel p-6 w-full max-w-sm relative">
            <h3 className="text-xl font-black mb-2 text-white uppercase">{selectedTask.task_name}</h3>
            <p className="text-muted text-sm mb-6 font-bold">Complete the physical challenge and enter the 4-digit PIN provided by the referee.</p>
            
            <input 
              type="text" 
              maxLength={4}
              placeholder="XXXX"
              className="w-full bg-background border-4 border-card-border p-4 rounded-xl text-center text-3xl font-mono text-white mb-4 tracking-[0.5em] focus:border-secondary outline-none"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
            />
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setSelectedTask(null); setPinInput(''); setTaskMessage(null); }} className="au-btn flex-1 py-3 bg-card text-white">CANCEL</button>
              <button disabled={isSubmittingTask || pinInput.length !== 4} onClick={handleSubmitPin} className="au-btn flex-1 py-3 bg-secondary text-white disabled:opacity-50 flex justify-center items-center">
                {isSubmittingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMiniGame?.pin_code === 'wiring' && (
        <WiringGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'puzzle' && (
        <PuzzleGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'admin-swipe' && (
        <AdminCardSwipeGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'reactor' && (
        <ReactorGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'shields' && (
        <ShieldsGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'distributor' && (
        <DistributorGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'radio-freq' && (
        <RadioFreqGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'circuit-bypass' && (
        <CircuitBypassGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'pressure-valves' && (
        <PressureValvesGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'orbital-defense' && (
        <OrbitalDefenseGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'dna-anomaly' && (
        <DnaAnomalyGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'nav-align' && (
        <NavAlignGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'fuel-transfer' && (
        <FuelTransferGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'garbage-chute' && (
        <GarbageChuteGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {(selectedMiniGame?.pin_code === 'basket-ball' || selectedMiniGame?.pin_code === 'basketball-drop') && (
        <BasketballDropGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}
      {selectedMiniGame?.pin_code === 'coolant-bypass' && (
        <CoolantBypassGame onComplete={handleMiniGameComplete} onCancel={() => setSelectedMiniGame(null)} />
      )}

      {isScanningBody && <Scanner onScan={handleScanBody} onClose={() => setIsScanningBody(false)} title="REPORT BODY" subtitle="Scan a dead player's QR code." />}
      {isScanningKill && <Scanner onScan={handleScanKill} onClose={() => setIsScanningKill(false)} title="ELIMINATE" subtitle="Scan a Crewmate's badge." />}
      {isScanningTask && <Scanner onScan={handleScanTask} onClose={() => setIsScanningTask(false)} title="SCAN TASK" subtitle="Scan the task QR code." />}
      
      {showMap && <MapViewer tasks={myTasks} onClose={() => setShowMap(false)} />}
    </main>
  );
}
