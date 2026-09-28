'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, RotateCcw } from 'lucide-react';

interface BasketballDropGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

// Sound effects synthesizer helper using Web Audio API
class BallSoundEffects {
  private ctx: AudioContext | null = null;

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

  playRelease() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  playRimClang() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High pitch metallic ring
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  playSwish() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Crisp white-noise / whoosh net friction
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);

      // Add a happy tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  playBuzzer() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    } catch {
      // ignore
    }
  }
}

const ballSfx = new BallSoundEffects();

export default function BasketballDropGame({ onComplete, onCancel }: BasketballDropGameProps) {
  // Game dimensions: 320px width x 360px height
  const COURT_WIDTH = 320;
  const COURT_HEIGHT = 360;

  // Hoop properties (Y fixed near lower region)
  const HOOP_Y = 270;
  const HOOP_WIDTH = 58;
  const BALL_RADIUS = 16;

  // Game state
  const [score, setScore] = useState(0); // Need 3 baskets to win
  const [attemptsLeft, setAttemptsLeft] = useState(5); // 5 total chances to get 3
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Ball & Claw physics state for rendering
  const [clawX, setClawX] = useState(160);
  const [hoopX, setHoopX] = useState(160);
  const [ballState, setBallState] = useState<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    isDropped: boolean;
  }>({
    x: 160,
    y: 42,
    vx: 0,
    vy: 0,
    isDropped: false,
  });

  // Animation & simulation refs
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const clawXRef = useRef(160);
  const clawDirRef = useRef(1);
  const hoopXRef = useRef(160);
  const hoopDirRef = useRef(1);
  const ballRef = useRef({
    x: 160,
    y: 42,
    vx: 0,
    vy: 0,
    isDropped: false,
  });
  const scoreRef = useRef(0);
  const attemptsRef = useRef(5);
  const isCompletedRef = useRef(false);
  const isResolvingRef = useRef(false);

  // Reset ball to claw
  const resetBallToClaw = () => {
    ballRef.current = {
      x: clawXRef.current,
      y: 42,
      vx: 0,
      vy: 0,
      isDropped: false,
    };
    setBallState({ ...ballRef.current });
    isResolvingRef.current = false;
  };

  // Main 60fps game loop
  useEffect(() => {
    const tick = (now: number) => {
      if (isCompletedRef.current) return;

      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = now;

      // 1. Move Overhead Dropper Claw
      // Claw speed scales with score: 140 -> 180 -> 220 px/s
      const clawSpeed = 135 + scoreRef.current * 40;
      clawXRef.current += clawDirRef.current * clawSpeed * dt;
      if (clawXRef.current <= 36) {
        clawXRef.current = 36;
        clawDirRef.current = 1;
      } else if (clawXRef.current >= COURT_WIDTH - 36) {
        clawXRef.current = COURT_WIDTH - 36;
        clawDirRef.current = -1;
      }
      setClawX(clawXRef.current);

      // 2. Move Basketball Hoop (Stationary on Score 0; moves gently on Score 1 and 2)
      if (scoreRef.current >= 1) {
        const hoopSpeed = scoreRef.current === 1 ? 75 : 120;
        hoopXRef.current += hoopDirRef.current * hoopSpeed * dt;
        if (hoopXRef.current <= 60) {
          hoopXRef.current = 60;
          hoopDirRef.current = 1;
        } else if (hoopXRef.current >= COURT_WIDTH - 60) {
          hoopXRef.current = COURT_WIDTH - 60;
          hoopDirRef.current = -1;
        }
        setHoopX(hoopXRef.current);
      } else {
        hoopXRef.current = 160;
        setHoopX(160);
      }

      // 3. Ball Physics (if dropped)
      if (ballRef.current.isDropped) {
        const GRAVITY = 750; // px/s^2
        ballRef.current.vy += GRAVITY * dt;
        ballRef.current.x += ballRef.current.vx * dt;
        ballRef.current.y += ballRef.current.vy * dt;

        // Air drag
        ballRef.current.vx *= 0.99;

        // Check Rim Collision / Score when ball reaches hoop level
        const currentHoopX = hoopXRef.current;
        const leftRimX = currentHoopX - HOOP_WIDTH / 2;
        const rightRimX = currentHoopX + HOOP_WIDTH / 2;

        if (!isResolvingRef.current) {
          // Check collision with rim edges or passing through net
          if (ballRef.current.y >= HOOP_Y - 4 && ballRef.current.y <= HOOP_Y + 18) {
            // Distance from center of hoop
            const distFromCenter = Math.abs(ballRef.current.x - currentHoopX);
            const swishThreshold = HOOP_WIDTH / 2 - 8;

            if (distFromCenter <= swishThreshold) {
              // CLEAN SWISH THROUGH THE HOLE!
              isResolvingRef.current = true;
              scoreRef.current += 1;
              setScore(scoreRef.current);
              setFeedback('SWISH! +1');
              ballSfx.playSwish();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([40, 30, 60]);
              }

              if (scoreRef.current >= 3) {
                // VICTORY!
                isCompletedRef.current = true;
                setIsCompleted(true);
                ballSfx.playVictory();
                setTimeout(() => {
                  onComplete();
                }, 900);
              } else {
                setTimeout(() => {
                  setFeedback(null);
                  resetBallToClaw();
                }, 600);
              }
            } else if (
              Math.abs(ballRef.current.x - leftRimX) <= 12 ||
              Math.abs(ballRef.current.x - rightRimX) <= 12
            ) {
              // HIT THE RIM! Clang and bounce off!
              isResolvingRef.current = true;
              ballSfx.playRimClang();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(60);
              }

              // Apply bounce deflection
              const bounceDir = ballRef.current.x < currentHoopX ? -1 : 1;
              ballRef.current.vx = bounceDir * 140;
              ballRef.current.vy = -180;
              setFeedback('CLANG! MISSED');

              attemptsRef.current -= 1;
              setAttemptsLeft(attemptsRef.current);

              if (attemptsRef.current <= 0 && scoreRef.current < 3) {
                // Out of balls!
                ballSfx.playBuzzer();
                setIsFailed(true);
                setTimeout(() => {
                  // Reset game
                  scoreRef.current = 0;
                  setScore(0);
                  attemptsRef.current = 5;
                  setAttemptsLeft(5);
                  setIsFailed(false);
                  setFeedback(null);
                  resetBallToClaw();
                }, 900);
              } else {
                setTimeout(() => {
                  setFeedback(null);
                  resetBallToClaw();
                }, 750);
              }
            }
          }

          // Complete airball / miss floor boundary
          if (ballRef.current.y > COURT_HEIGHT + 20) {
            isResolvingRef.current = true;
            ballSfx.playBuzzer();
            setFeedback('AIRBALL!');
            attemptsRef.current -= 1;
            setAttemptsLeft(attemptsRef.current);

            if (attemptsRef.current <= 0 && scoreRef.current < 3) {
              setIsFailed(true);
              setTimeout(() => {
                scoreRef.current = 0;
                setScore(0);
                attemptsRef.current = 5;
                setAttemptsLeft(5);
                setIsFailed(false);
                setFeedback(null);
                resetBallToClaw();
              }, 900);
            } else {
              setTimeout(() => {
                setFeedback(null);
                resetBallToClaw();
              }, 700);
            }
          }
        }

        setBallState({ ...ballRef.current });
      } else {
        // Ball follows the moving claw
        ballRef.current.x = clawXRef.current;
        ballRef.current.y = 42;
        setBallState({ ...ballRef.current });
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    };
  }, [onComplete]);

  // Handle player pressing Drop Ball
  const handleDrop = () => {
    if (ballRef.current.isDropped || isCompletedRef.current || isFailed) return;

    ballSfx.playRelease();
    ballRef.current.isDropped = true;
    // Give slight horizontal momentum based on claw speed
    ballRef.current.vx = clawDirRef.current * 20;
    ballRef.current.vy = 40;
    setBallState({ ...ballRef.current });
  };

  const leftRim = hoopX - HOOP_WIDTH / 2;
  const rightRim = hoopX + HOOP_WIDTH / 2;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none touch-none">
      <div 
        className={`relative bg-[#0d1624] border-2 ${
          isFailed ? 'border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-shake' : 'border-[#1b344d] shadow-2xl'
        } rounded-3xl w-full max-w-sm sm:max-w-md p-5 flex flex-col items-center transition-colors duration-200`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-[#1b344d]/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <span className="text-lg">🏀</span>
            </div>
            <div>
              <h2 className="text-white font-black text-sm sm:text-base tracking-wider flex items-center gap-1.5">
                BASKETBALL DROP
                <span className="text-[10px] bg-orange-950 border border-orange-500/40 text-orange-300 px-1.5 py-0.5 rounded font-mono">
                  {score}/3 BASKETS
                </span>
              </h2>
              <p className="text-muted text-[11px] font-bold tracking-widest uppercase">
                Recreation Deck • Gravity Chute
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

        {/* Failed Alert Banner */}
        {isFailed && (
          <div className="w-full mt-3 bg-red-600/30 border border-red-500/60 rounded-xl px-3 py-1.5 flex items-center justify-center gap-2 animate-bounce">
            <RotateCcw className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-black text-xs tracking-widest uppercase">
              OUT OF BALLS! RESETTING STREAK
            </span>
          </div>
        )}

        {/* Live Score & Balls Remaining Bar */}
        <div className="w-full flex items-center justify-between bg-[#08101a] border border-[#172a3e] rounded-xl px-4 py-2 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase">SCORE:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((b) => (
                <div
                  key={b}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    score >= b
                      ? 'bg-orange-500 text-black shadow-[0_0_8px_#f97316]'
                      : 'bg-[#15273b] text-gray-500 border border-[#233d59]'
                  }`}
                >
                  ✓
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase">BALLS:</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs transition-opacity ${i < attemptsLeft ? 'opacity-100' : 'opacity-20'}`}
                >
                  🏀
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Court Canvas Area */}
        <div
          onClick={handleDrop}
          className="relative w-full h-[280px] my-3.5 bg-[#050c17] border-2 border-[#162a3f] rounded-2xl overflow-hidden cursor-pointer active:brightness-110 shadow-inner"
        >
          {/* Court grid lines & floor reflection */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(249,115,22,0.1)_0%,_transparent_70%)] pointer-events-none" />

          {/* SVG Court Render */}
          <svg className="w-full h-full" viewBox="0 0 320 360">
            {/* Top overhead sliding rail */}
            <line x1="20" y1="18" x2="300" y2="18" stroke="#1d3854" strokeWidth="6" strokeLinecap="round" />
            <line x1="20" y1="18" x2="300" y2="18" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />

            {/* Claw Dropper Mechanism */}
            <g transform={`translate(${clawX}, 18)`}>
              {/* Slider carriage */}
              <rect x="-14" y="-6" width="28" height="12" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
              {/* Piston drop cord */}
              <line x1="0" y1="6" x2="0" y2="18" stroke="#94a3b8" strokeWidth="2.5" />
              {/* Mechanical gripper arms */}
              <path d="M -8 18 Q -10 24 -4 26" stroke="#f97316" strokeWidth="2" fill="none" />
              <path d="M 8 18 Q 10 24 4 26" stroke="#f97316" strokeWidth="2" fill="none" />
            </g>

            {/* Backboard behind Hoop */}
            <rect
              x={hoopX - 38}
              y={HOOP_Y - 48}
              width="76"
              height="44"
              rx="4"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="#e2e8f0"
              strokeWidth="2.5"
            />
            {/* Backboard inner target square */}
            <rect
              x={hoopX - 16}
              y={HOOP_Y - 32}
              width="32"
              height="22"
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
            />

            {/* Basketball Net (woven mesh) */}
            <path
              d={`M ${leftRim} ${HOOP_Y} L ${hoopX - 14} ${HOOP_Y + 32} L ${hoopX + 14} ${HOOP_Y + 32} L ${rightRim} ${HOOP_Y} Z`}
              fill="rgba(255, 255, 255, 0.08)"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Glowing Orange Rim */}
            <ellipse
              cx={hoopX}
              cy={HOOP_Y}
              rx={HOOP_WIDTH / 2}
              ry="7"
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              style={{ filter: 'drop-shadow(0 0 8px #f97316)' }}
            />
            {/* Rim edge bolts / bumpers */}
            <circle cx={leftRim} cy={HOOP_Y} r="3" fill="#ffffff" />
            <circle cx={rightRim} cy={HOOP_Y} r="3" fill="#ffffff" />

            {/* Chute Hole under Hoop */}
            <ellipse
              cx={hoopX}
              cy={HOOP_Y + 48}
              rx="24"
              ry="6"
              fill="#020617"
              stroke="#1e3a5a"
              strokeWidth="2"
            />

            {/* The Basketball */}
            <g transform={`translate(${ballState.x}, ${ballState.y})`}>
              {/* Ball sphere */}
              <circle
                r={BALL_RADIUS}
                fill="#ea580c"
                stroke="#9a3412"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
              />
              {/* Basketball ribs / seam lines */}
              <line x1={-BALL_RADIUS + 2} y1="0" x2={BALL_RADIUS - 2} y2="0" stroke="#431407" strokeWidth="1.5" />
              <line x1="0" y1={-BALL_RADIUS + 2} x2="0" y2={BALL_RADIUS - 2} stroke="#431407" strokeWidth="1.5" />
              <path
                d={`M -9 -11 Q 0 0 -9 11`}
                stroke="#431407"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d={`M 9 -11 Q 0 0 9 11`}
                stroke="#431407"
                strokeWidth="1.2"
                fill="none"
              />
              {/* Gloss highlight */}
              <circle cx="-5" cy="-5" r="4" fill="rgba(255,255,255,0.35)" />
            </g>
          </svg>

          {/* Feedback Floating Banner (SWISH, CLANG, AIRBALL) */}
          {feedback && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 border border-white/20 px-4 py-2 rounded-xl text-center pointer-events-none animate-in zoom-in-75">
              <span className={`font-black text-sm tracking-wider uppercase ${
                feedback.includes('SWISH') ? 'text-emerald-400 drop-shadow-[0_0_8px_#22c55e]' : 'text-red-400'
              }`}>
                {feedback}
              </span>
            </div>
          )}

          {/* Success Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-base sm:text-lg tracking-widest uppercase">
                TASK COMPLETED!
              </span>
              <span className="text-emerald-300 font-mono text-xs tracking-wider">
                3/3 SWISHES LOCKED
              </span>
            </div>
          )}
        </div>

        {/* Tactile DROP BALL Button */}
        <button
          onClick={handleDrop}
          disabled={ballState.isDropped || isCompleted || isFailed}
          className={`w-full py-4 rounded-2xl font-black text-lg tracking-widest uppercase flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 ${
            isCompleted
              ? 'bg-emerald-600 text-white cursor-default'
              : ballState.isDropped
              ? 'bg-[#152a40] text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:brightness-110 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]'
          }`}
        >
          <span>🏀</span>
          {isCompleted ? 'COMPLETED' : ballState.isDropped ? 'DROPPING...' : 'DROP BALL'}
        </button>

        <p className="text-gray-400 text-[11px] font-bold text-center mt-3 uppercase tracking-wider">
          Tap button or court to release the basketball. Drop 3 balls into the hoop hole!
        </p>
      </div>
    </div>
  );
}
