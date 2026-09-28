'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Flame, ShieldAlert, CheckCircle2, Wind, ArrowUp } from 'lucide-react';

interface CoolantBypassGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

// Sound effects synthesizer helper using Web Audio API
class CoolantSoundEffects {
  private ctx: AudioContext | null = null;
  private thrustOsc: OscillatorNode | null = null;
  private thrustGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        this.ctx.resume().catch(() => {});
      } catch {
        // ignore
      }
    }
    return this.ctx;
  }

  startThrust() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (this.thrustOsc) return;
      this.thrustOsc = ctx.createOscillator();
      this.thrustGain = ctx.createGain();

      this.thrustOsc.type = 'triangle';
      this.thrustOsc.frequency.setValueAtTime(110, ctx.currentTime);

      this.thrustGain.gain.setValueAtTime(0.08, ctx.currentTime);

      this.thrustOsc.connect(this.thrustGain);
      this.thrustGain.connect(ctx.destination);
      this.thrustOsc.start();
    } catch {
      // ignore
    }
  }

  stopThrust() {
    if (this.thrustOsc && this.thrustGain && this.ctx) {
      try {
        this.thrustGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.thrustOsc.stop();
        this.thrustOsc.disconnect();
      } catch {
        // ignore
      }
      this.thrustOsc = null;
      this.thrustGain = null;
    }
  }

  playRupture() {
    this.stopThrust();
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  playSuccess() {
    this.stopThrust();
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      });
    } catch {
      // ignore
    }
  }
}

const coolantSfx = new CoolantSoundEffects();

interface SteamVent {
  progressTrigger: number; // percentage where vent appears (e.g. 25, 55, 80)
  type: 'TOP' | 'BOTTOM';
  width: number;
  height: number;
}

const HAZARD_VENTS: SteamVent[] = [
  { progressTrigger: 28, type: 'TOP', width: 14, height: 75 },
  { progressTrigger: 54, type: 'BOTTOM', width: 14, height: 75 },
  { progressTrigger: 78, type: 'TOP', width: 15, height: 80 },
];

export default function CoolantBypassGame({ onComplete, onCancel }: CoolantBypassGameProps) {
  // Canister physics state
  const [capsuleY, setCapsuleY] = useState(100); // 0 (top) to 200 (bottom)
  const [progress, setProgress] = useState(0); // 0% to 100%
  const [isThrusting, setIsThrusting] = useState(false);
  const [isRuptured, setIsRuptured] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [thrustParticles, setThrustParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Animation and physics refs
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isThrustingRef = useRef(false);
  const capsuleYRef = useRef(100);
  const velYRef = useRef(0);
  const progressRef = useRef(0);
  const isRupturedRef = useRef(false);
  const isCompletedRef = useRef(false);

  // Conduit dimensions
  const CONDUIT_HEIGHT = 200;
  const TOP_LIMIT = 26;
  const BOTTOM_LIMIT = 174;
  const CAPSULE_X = 65; // Fixed horizontal position of capsule in viewport

  // Physics constants
  const GRAVITY = 340; // px/s^2 downwards
  const THRUST_FORCE = -460; // px/s^2 upwards
  const SPEED_PERCENT_PER_SEC = 14; // Completes in ~7.1 seconds

  // Handle thrust start / stop
  const startThrust = () => {
    if (isCompletedRef.current || isRupturedRef.current) return;
    isThrustingRef.current = true;
    setIsThrusting(true);
    coolantSfx.startThrust();
  };

  const stopThrust = () => {
    isThrustingRef.current = false;
    setIsThrusting(false);
    coolantSfx.stopThrust();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        startThrust();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stopThrust();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      coolantSfx.stopThrust();
    };
  }, []);

  // Main 60fps physics simulation loop
  useEffect(() => {
    const tick = (now: number) => {
      if (isCompletedRef.current) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      if (!isRupturedRef.current) {
        // 1. Calculate acceleration & velocity
        const accelY = isThrustingRef.current ? THRUST_FORCE : GRAVITY;
        velYRef.current += accelY * dt;
        // Clamp terminal velocity
        velYRef.current = Math.max(-260, Math.min(260, velYRef.current));

        // 2. Update position
        capsuleYRef.current += velYRef.current * dt;
        setCapsuleY(capsuleYRef.current);

        // 3. Update horizontal progress
        progressRef.current = Math.min(100, progressRef.current + SPEED_PERCENT_PER_SEC * dt);
        setProgress(progressRef.current);

        // Emit thrust exhaust particles when firing
        if (isThrustingRef.current && Math.random() < 0.4) {
          setThrustParticles((prev) => [
            ...prev.slice(-8),
            {
              id: Date.now() + Math.random(),
              x: CAPSULE_X - 12,
              y: capsuleYRef.current + 8 + (Math.random() - 0.5) * 6,
            },
          ]);
        }

        // 4. Collision Detection
        let collision = false;

        // A. Wall bounds collision
        if (capsuleYRef.current <= TOP_LIMIT || capsuleYRef.current >= BOTTOM_LIMIT) {
          collision = true;
        }

        // B. Steam vent hazards collision
        const currentProg = progressRef.current;
        for (const vent of HAZARD_VENTS) {
          // Vent active when progress matches within 5% window
          const distToVent = Math.abs(currentProg - vent.progressTrigger);
          if (distToVent < 3.2) {
            if (vent.type === 'TOP' && capsuleYRef.current < vent.height + 15) {
              collision = true;
              break;
            }
            if (vent.type === 'BOTTOM' && capsuleYRef.current > CONDUIT_HEIGHT - vent.height - 15) {
              collision = true;
              break;
            }
          }
        }

        // Trigger Rupture Failure
        if (collision) {
          isRupturedRef.current = true;
          setIsRuptured(true);
          stopThrust();
          coolantSfx.playRupture();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([120, 60, 200]);
          }

          // Reset run back to 0% after brief screen shake
          setTimeout(() => {
            progressRef.current = 0;
            setProgress(0);
            capsuleYRef.current = 100;
            setCapsuleY(100);
            velYRef.current = 0;
            isRupturedRef.current = false;
            setIsRuptured(false);
          }, 650);
        }

        // 5. Completion Check
        if (progressRef.current >= 100) {
          isCompletedRef.current = true;
          setIsCompleted(true);
          stopThrust();
          coolantSfx.playSuccess();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(100);
          }
          setTimeout(() => {
            onComplete();
          }, 950);
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
      coolantSfx.stopThrust();
    };
  }, [onComplete]);

  // Calculate safe flow stream spline curve at current progress
  const generateStreamPoints = () => {
    const points: string[] = [];
    for (let x = 0; x <= 320; x += 20) {
      // undulating sine wave moving with progress
      const wavePhase = (progressRef.current * 0.12) + (x * 0.025);
      const streamY = 100 + Math.sin(wavePhase) * 28;
      points.push(`${x},${streamY}`);
    }
    return points.join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none touch-none">
      <div 
        className={`relative bg-[#07131e] border-2 ${
          isRuptured ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-shake' : 'border-[#1b3b55] shadow-2xl'
        } rounded-3xl w-full max-w-sm sm:max-w-md p-5 flex flex-col items-center transition-colors duration-200`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-[#1b3b55]/80">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isRuptured ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-black text-sm sm:text-base tracking-wider flex items-center gap-1.5">
                COOLANT BYPASS
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                  {Math.round(progress)}%
                </span>
              </h2>
              <p className="text-muted text-[11px] font-bold tracking-widest uppercase">
                Life Support • Cryo Conduit
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rupture Alert Banner */}
        {isRuptured && (
          <div className="w-full mt-3 bg-red-600/30 border border-red-500/60 rounded-xl px-3 py-1.5 flex items-center justify-center gap-2 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-black text-xs tracking-widest uppercase">
              CONTAINMENT RUPTURED! CONDUIT VENTED
            </span>
          </div>
        )}

        {/* Conduit Progress Bar */}
        <div className="w-full mt-3">
          <div className="flex justify-between text-[11px] font-mono font-bold text-gray-400 mb-1">
            <span>CONDUIT INTAKE</span>
            <span className="text-cyan-400">{Math.round(progress)}% / 100%</span>
            <span>CORE INJECTOR</span>
          </div>
          <div className="w-full h-2.5 bg-[#0a1b2b] border border-[#1d3d59] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-100 shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Conduit Gameplay Chamber */}
        <div
          onPointerDown={startThrust}
          onPointerUp={stopThrust}
          onPointerLeave={stopThrust}
          className="relative w-full h-[200px] my-3.5 rounded-2xl bg-[#030910] border-2 border-[#16324a] overflow-hidden cursor-pointer active:cursor-grabbing"
        >
          {/* Upper Electrified Wall Hazard */}
          <div className="absolute top-0 left-0 right-0 h-[24px] bg-gradient-to-b from-red-950/80 to-transparent border-b border-red-500/50 flex items-center justify-around pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="text-red-500/70 text-[10px] font-black tracking-widest">▲ HAZARD ▲</span>
            ))}
          </div>

          {/* Lower Electrified Wall Hazard */}
          <div className="absolute bottom-0 left-0 right-0 h-[24px] bg-gradient-to-t from-red-950/80 to-transparent border-t border-red-500/50 flex items-center justify-around pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="text-red-500/70 text-[10px] font-black tracking-widest">▼ HAZARD ▼</span>
            ))}
          </div>

          {/* Background moving conduit grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 200" preserveAspectRatio="none">
            {/* Safe cryo-fluid stream guide line */}
            <polyline
              points={generateStreamPoints()}
              fill="none"
              stroke="rgba(6, 182, 212, 0.25)"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={generateStreamPoints()}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />

            {/* Dynamic Hazard Steam Vents */}
            {HAZARD_VENTS.map((v, i) => {
              // Calculate screen horizontal position based on current progress
              // When progress == v.progressTrigger, vent is at CAPSULE_X
              const screenX = CAPSULE_X + (v.progressTrigger - progress) * 8;
              if (screenX < -30 || screenX > 350) return null;

              const isTop = v.type === 'TOP';
              const ventY = isTop ? 0 : 200 - v.height;

              return (
                <g key={i} transform={`translate(${screenX}, ${ventY})`}>
                  {/* Vent Nozzle */}
                  <rect
                    x="-8"
                    y={isTop ? 0 : v.height - 14}
                    width="16"
                    height="14"
                    fill="#475569"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                  {/* Blasting Steam Plume */}
                  <rect
                    x="-6"
                    y={isTop ? 14 : 0}
                    width="12"
                    height={v.height - 14}
                    fill={isTop ? 'url(#steamGradDown)' : 'url(#steamGradUp)'}
                    className="animate-pulse"
                  />
                  {/* Hazard icon */}
                  <circle cx="0" cy={isTop ? v.height - 4 : 4} r="4" fill="#ef4444" className="animate-ping" />
                </g>
              );
            })}

            <defs>
              <linearGradient id="steamGradDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="steamGradUp" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>

          {/* Thruster exhaust particles */}
          {thrustParticles.map((p) => (
            <div
              key={p.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#06b6d4] pointer-events-none"
              style={{ left: p.x, top: p.y }}
            />
          ))}

          {/* Coolant Canister Player Capsule */}
          <div
            className="absolute transition-transform duration-75 pointer-events-none"
            style={{
              left: `${CAPSULE_X - 18}px`,
              top: `${capsuleY - 14}px`,
              transform: `rotate(${isThrusting ? '-12deg' : '8deg'})`,
            }}
          >
            {/* Canister Body */}
            <div className={`relative w-9 h-7 rounded-lg border-2 ${
              isRuptured
                ? 'bg-red-500 border-white shadow-[0_0_15px_#ef4444]'
                : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-white border-cyan-200 shadow-[0_0_12px_#00e5ff]'
            } flex items-center justify-center`}>
              {/* Canister core liquid level */}
              <div className="w-5 h-3 bg-cyan-900 rounded-sm border border-cyan-300 flex items-center px-0.5">
                <div className="w-full h-1.5 bg-cyan-300 rounded-xs animate-pulse" />
              </div>
              {/* Front bumper */}
              <div className="absolute right-[-4px] top-1.5 w-1.5 h-4 bg-slate-300 rounded-r-xs" />
              {/* Thruster engine nozzle */}
              <div className="absolute left-[-5px] top-2 w-2 h-3 bg-slate-600 rounded-l-xs flex items-center justify-center">
                {isThrusting && (
                  <div className="w-3 h-2 bg-gradient-to-l from-cyan-300 to-transparent rounded-l-full animate-ping" />
                )}
              </div>
            </div>
          </div>

          {/* Success Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-base tracking-widest uppercase">
                COOLANT INJECTED
              </span>
              <span className="text-emerald-300 font-mono text-xs tracking-wider">
                CONDUIT SECURED
              </span>
            </div>
          )}
        </div>

        {/* Diagnostics & Guidance */}
        <div className="w-full flex items-center justify-between bg-[#0e1c2a] border border-[#1b3b55] rounded-xl px-4 py-2">
          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${isThrusting ? 'text-cyan-400 animate-bounce' : 'text-gray-500'}`} />
            <span className="text-gray-300 text-xs font-bold uppercase tracking-wider">
              THRUSTERS: {isThrusting ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase">INERTIA:</span>
            <span className="text-cyan-400 text-xs font-mono font-bold">
              {Math.abs(Math.round(capsuleY - 100))} PSI
            </span>
          </div>
        </div>

        {/* Tactile Hold Thruster Button */}
        <button
          onPointerDown={startThrust}
          onPointerUp={stopThrust}
          onPointerLeave={stopThrust}
          disabled={isCompleted || isRuptured}
          className={`w-full mt-3 py-4 rounded-2xl font-black text-lg tracking-widest uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 ${
            isCompleted
              ? 'bg-emerald-600 text-white cursor-default'
              : isThrusting
              ? 'bg-cyan-400 text-black shadow-[0_0_25px_#00e5ff] scale-98'
              : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110'
          }`}
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          {isCompleted ? 'INJECTION COMPLETE' : isThrusting ? 'FIRING THRUSTERS...' : 'HOLD TO THRUST'}
        </button>

        <p className="text-gray-400 text-[11px] font-bold text-center mt-3 uppercase tracking-wider">
          Hold button or screen to rise, release to sink. Avoid hazard grids and steam vents.
        </p>
      </div>
    </div>
  );
}
