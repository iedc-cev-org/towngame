'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Radio, Cpu, Gauge, Crosshair, Dna, ShieldCheck, Zap, 
  ArrowLeft, CheckCircle2, Play, Sparkles, RefreshCw,
  Compass, Fuel, Trash2, Target, Wind
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
    category: 'NEW',
    description: 'Use directional thrusters or direct touch to steer the ship reticle into the central target ring.',
    location: 'Normal Parking',
    icon: Compass,
    color: '#38bdf8',
  },
  {
    id: 'fuel-transfer',
    name: 'Fuel Transfer',
    category: 'NEW',
    description: 'Hold the pneumatic pump button and release precisely inside the 80%-90% target fill zone.',
    location: 'Generator',
    icon: Fuel,
    color: '#f59e0b',
  },
  {
    id: 'garbage-chute',
    name: 'Empty Garbage Chute',
    category: 'NEW',
    description: 'Pull and hold down the heavy red mechanical lever until the vacuum suction ejects all chamber debris.',
    location: 'Waste Bin Near Library',
    icon: Trash2,
    color: '#94a3b8',
  },

  // Recent In-Built Games
  {
    id: 'shields',
    name: 'Prime Shields',
    category: 'RECENT',
    description: 'Tap deactivated red hexagonal shields to charge all 7 deflectors to 100% capacity.',
    location: 'Main Block Old Repography',
    icon: ShieldCheck,
    color: '#06b6d4',
  },
  {
    id: 'distributor',
    name: 'Calibrate Distributor',
    category: 'RECENT',
    description: 'Time your tap to lock rotating needles to the target terminal across 3 speed stages.',
    location: 'Cafeteria',
    icon: Zap,
    color: '#eab308',
  },

  // Classic Games
  {
    id: 'wiring',
    name: 'Fix Wiring',
    category: 'CLASSIC',
    description: 'Connect matching colored wires from left to right.',
    location: 'MCA Top Terrace Stair',
    icon: Sparkles,
    color: '#3b82f6',
  },
  {
    id: 'puzzle',
    name: 'Manifold Puzzle',
    category: 'CLASSIC',
    description: 'Tap numbers in ascending order from 1 to 10.',
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

export default function TestGamesPage() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [completedGames, setCompletedGames] = useState<Record<string, boolean>>({});

  const handleGameComplete = () => {
    if (activeGameId) {
      setCompletedGames((prev) => ({ ...prev, [activeGameId]: true }));
      setActiveGameId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-white p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-card-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted hover:text-white font-mono text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK HOME
        </Link>
        <span className="font-mono text-xs uppercase px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary">
          MINI-GAMES PLAYTEST CONSOLE
        </span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
          MINI-GAMES ARENA
        </h1>
        <p className="text-muted text-sm">
          Select any game below to launch, playtest its mechanics, test error handling, and verify completion.
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${game.color}15`,
                        borderColor: `${game.color}40`,
                        color: game.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">{game.name}</h3>
                      <span className="text-[11px] font-mono text-muted uppercase">
                        📍 {game.location}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase border ${
                      game.category === 'NEW'
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                        : game.category === 'RECENT'
                        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {game.category}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-card-border/50">
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
                  {isDone ? 'REPLAY' : 'TEST GAME'}
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
