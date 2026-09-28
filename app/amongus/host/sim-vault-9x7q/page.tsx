'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Radio, Cpu, Gauge, Crosshair, Dna, ShieldCheck, Zap, 
  ArrowLeft, CheckCircle2, Play, Sparkles, RefreshCw,
  Compass, Fuel, Trash2, Target, Wind, ShieldAlert, Lock
} from 'lucide-react';

import BasketballDropGame from '@/components/BasketballDropGame';
import CoolantBypassGame from '@/components/CoolantBypassGame';
import RadioFreqGame from '@/components/RadioFreqGame';
import CircuitBypassGame from '@/components/CircuitBypassGame';
import PressureValvesGame from '@/components/PressureValvesGame';
import OrbitalDefenseGame from '@/components/OrbitalDefenseGame';
import DnaAnomalyGame from '@/components/DnaAnomalyGame';
import NavAlignGame from '@/components/NavAlignGame';
import FuelTransferGame from '@/components/FuelTransferGame';
import GarbageChuteGame from '@/components/GarbageChuteGame';
import ShieldsGame from '@/components/ShieldsGame';
import DistributorGame from '@/components/DistributorGame';
import WiringGame from '@/components/WiringGame';
import PuzzleGame from '@/components/PuzzleGame';
import AdminCardSwipeGame from '@/components/AdminCardSwipeGame';
import ReactorGame from '@/components/ReactorGame';

interface MiniGameItem {
  id: string;
  name: string;
  category: 'NEW' | 'RECENT' | 'CLASSIC';
  description: string;
  location: string;
  icon: any;
  color: string;
}

const GAMES_LIST: MiniGameItem[] = [
  // New Challenging Mini-Games
  {
    id: 'basket-ball',
    name: 'Basketball Hoop Drop',
    category: 'NEW',
    description: 'Time the overhead claw release to drop the basketball cleanly through the moving hoop. Land 3 swishes into the chute to win.',
    location: 'Basketball Court',
    icon: Target,
    color: '#f97316',
  },
  {
    id: 'coolant-bypass',
    name: 'Coolant Thruster Bypass',
    category: 'NEW',
    description: 'Hold to thrust upward and release to sink. Guide the cryogenic canister through shifting hazard grids and steam vents to 100%.',
    location: 'Staff Parking',
    icon: Wind,
    color: '#38bdf8',
  },
  {
    id: 'radio-freq',
    name: 'Radio Frequency Calibration',
    category: 'NEW',
    description: 'Adjust Frequency and Amplitude sliders on a CRT oscilloscope to match the carrier wave and hold lock.',
    location: 'Physics Lab',
    icon: Radio,
    color: '#00e5ff',
  },
  {
    id: 'circuit-bypass',
    name: 'Circuit Bypass Maze',
    category: 'NEW',
    description: 'Drag probe from START to CORE along copper tracks without lifting, drifting, or hitting laser sparks.',
    location: 'MCA Entrance',
    icon: Cpu,
    color: '#38bdf8',
  },
  {
    id: 'pressure-valves',
    name: 'Pressure Valve Regulation',
    category: 'NEW',
    description: 'Pump and vent 3 fluctuating steam pressure gauges to keep all needles in the green safe zone simultaneously.',
    location: 'MainBlock Fire Extinguisher',
    icon: Gauge,
    color: '#f59e0b',
  },
  {
    id: 'orbital-defense',
    name: 'Orbital Defense',
    category: 'NEW',
    description: 'Destroy 8 fast erratic space asteroids. Standard debris takes 1 tap; shielded crystal asteroids take 2 taps.',
    location: 'MainBlock - A107',
    icon: Crosshair,
    color: '#ef4444',
  },
  {
    id: 'dna-anomaly',
    name: 'DNA Anomaly Inspection',
    category: 'NEW',
    description: 'Inspect 4 centrifuge test tubes within 5.5s to quarantine the specified contaminant across 3 stages.',
    location: 'Chemistry Lab',
    icon: Dna,
    color: '#10b981',
  },
  {
    id: 'nav-align',
    name: 'Align Navigation',
    category: 'RECENT',
    description: 'Use directional thrusters or direct touch to steer the ship reticle into the central target ring.',
    location: 'Normal Parking',
    icon: Compass,
    color: '#38bdf8',
  },
  {
    id: 'fuel-transfer',
    name: 'Fuel Transfer',
    category: 'RECENT',
    description: 'Hold the pneumatic pump button and release precisely inside the 80%-90% target fill zone.',
    location: 'Generator',
    icon: Fuel,
    color: '#f59e0b',
  },
  {
    id: 'garbage-chute',
    name: 'Empty Garbage Chute',
    category: 'RECENT',
    description: 'Pull and hold the pneumatic purge handle down to vent debris into space without letting it spring back.',
    location: 'Waste Bin Near Library',
    icon: Trash2,
    color: '#ef4444',
  },
  {
    id: 'shields',
    name: 'Prime Shields',
    category: 'CLASSIC',
    description: 'Tap all unprimed hexagonal shield plates until the entire energy array glows bright cyan.',
    location: 'Main Block Old Repography',
    icon: ShieldCheck,
    color: '#38bdf8',
  },
  {
    id: 'distributor',
    name: 'Calibrate Distributor',
    category: 'CLASSIC',
    description: 'Time your press when each rotating distributor ring connects with the electrical contact wire.',
    location: 'Cafeteria',
    icon: Zap,
    color: '#f59e0b',
  },
  {
    id: 'wiring',
    name: 'Fix Wiring',
    category: 'CLASSIC',
    description: 'Drag wires from the left terminals to their matching color connectors on the right.',
    location: 'MCA Top Terrace Stair',
    icon: Sparkles,
    color: '#00e5ff',
  },
  {
    id: 'puzzle',
    name: 'Assemble Artifact Puzzle',
    category: 'CLASSIC',
    description: 'Slide randomized puzzle tiles into correct 1-to-8 numerical order.',
    location: 'MCA Near Room D309',
    icon: Sparkles,
    color: '#a855f7',
  },
  {
    id: 'admin-swipe',
    name: 'Admin Card Swipe',
    category: 'CLASSIC',
    description: 'Swipe the keycard through the terminal reader at optimal speed.',
    location: 'IEDC Notice Board',
    icon: Sparkles,
    color: '#ec4899',
  },
  {
    id: 'reactor',
    name: 'Unlock Manifolds / Reactor',
    category: 'CLASSIC',
    description: 'Memorize and repeat the glowing keypad flashing sequence.',
    location: 'MCA 2nd Floor Toilet Near D309',
    icon: Sparkles,
    color: '#f97316',
  },
];

export default function AdminMiniGamesVaultPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [completedGames, setCompletedGames] = useState<Record<string, boolean>>({});

  // Strict Host / Admin Authorization Gate
  useEffect(() => {
    const hostToken = localStorage.getItem('sus_irl_host_token');
    const hostPin = localStorage.getItem('sus_irl_host_pin');
    if (!hostToken || hostPin?.trim().toLowerCase() !== 'iedccev2026') {
      router.replace('/amongus/host');
    } else {
      setIsAuthorized(true);
      setAuthChecking(false);
    }
  }, [router]);

  const handleGameComplete = () => {
    if (activeGameId) {
      setCompletedGames((prev) => ({ ...prev, [activeGameId]: true }));
      setActiveGameId(null);
    }
  };

  if (authChecking || !isAuthorized) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mb-4 animate-pulse">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-black text-white tracking-widest uppercase mb-2">
          ADMIN ACCESS REQUIRED
        </h1>
        <p className="text-muted text-xs max-w-sm mb-6">
          This simulation vault is restricted to game hosts and administrators. Redirecting...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-card-border">
        <Link
          href="/amongus/host"
          className="flex items-center gap-2 text-muted hover:text-white font-mono text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> HOST CONTROL PANEL
        </Link>
        <span className="font-mono text-xs uppercase px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          ADMIN SIMULATION VAULT
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          MINI-GAMES VAULT
        </h1>
        <p className="text-muted text-sm">
          Admin testing console: launch and playtest mechanics, inspect hitboxes, and verify completion states.
        </p>
      </div>

      {/* Grid of Mini-Games */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES_LIST.map((game) => {
          const Icon = game.icon;
          const isDone = !!completedGames[game.id];

          return (
            <div
              key={game.id}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-card border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                  : 'bg-card border-card-border hover:border-gray-500'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl border border-white/10 flex items-center justify-center"
                      style={{ backgroundColor: `${game.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: game.color }} />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-white leading-tight">
                        {game.name}
                      </h2>
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mt-0.5">
                        {game.location}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      game.category === 'NEW'
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                        : game.category === 'RECENT'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {game.category}
                  </span>
                </div>

                <p className="text-gray-400 text-xs leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-card-border/60">
                {isDone ? (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-green-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> TESTED & PASSED
                  </span>
                ) : (
                  <span className="text-xs font-mono text-gray-500">READY TO PLAY</span>
                )}

                <button
                  onClick={() => setActiveGameId(game.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all transform active:scale-95 ${
                    isDone
                      ? 'bg-card-border hover:bg-white/10 text-white'
                      : 'bg-secondary hover:bg-secondary/90 text-background font-extrabold shadow-md'
                  }`}
                >
                  {isDone ? <RefreshCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  {isDone ? 'REPLAY' : 'LAUNCH GAME'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render Active Mini-Game Modal */}
      {activeGameId === 'basket-ball' && (
        <BasketballDropGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'coolant-bypass' && (
        <CoolantBypassGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'radio-freq' && (
        <RadioFreqGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'circuit-bypass' && (
        <CircuitBypassGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'pressure-valves' && (
        <PressureValvesGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'orbital-defense' && (
        <OrbitalDefenseGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'dna-anomaly' && (
        <DnaAnomalyGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'nav-align' && (
        <NavAlignGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'fuel-transfer' && (
        <FuelTransferGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'garbage-chute' && (
        <GarbageChuteGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'shields' && (
        <ShieldsGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'distributor' && (
        <DistributorGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'wiring' && (
        <WiringGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'puzzle' && (
        <PuzzleGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'admin-swipe' && (
        <AdminCardSwipeGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
      {activeGameId === 'reactor' && (
        <ReactorGame onComplete={handleGameComplete} onCancel={() => setActiveGameId(null)} />
      )}
    </main>
  );
}
