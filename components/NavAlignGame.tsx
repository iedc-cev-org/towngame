'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Compass, CheckCircle2, Navigation, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface NavAlignGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function NavAlignGame({ onComplete, onCancel }: NavAlignGameProps) {
  // Center is (150, 150)
  const CENTER_X = 150;
  const CENTER_Y = 150;
  const TARGET_RADIUS = 28;

  // Ship reticle position (starts offset)
  const [pos, setPos] = useState({ x: 70, y: 80 });
  const [lockProgress, setLockProgress] = useState(0); // 0 to 100%
  const [isCompleted, setIsCompleted] = useState(false);

  // Active thruster inputs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animRef = useRef<number | null>(null);

  // Distance from center
  const dist = Math.hypot(pos.x - CENTER_X, pos.y - CENTER_Y);
  const isInside = dist <= TARGET_RADIUS;

  // Turbulence and thruster physics loop
  useEffect(() => {
    if (isCompleted) return;

    let lastTime = performance.now();
    let turbulenceAngle = Math.random() * Math.PI * 2;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Slowly rotate turbulence vector
      turbulenceAngle += dt * 1.5;
      const driftSpeed = 22;
      const driftX = Math.cos(turbulenceAngle) * driftSpeed;
      const driftY = Math.sin(turbulenceAngle) * driftSpeed;

      // Thruster input force
      let thrustX = 0;
      let thrustY = 0;
      const THRUST_SPEED = 90;

      if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['btn-up']) thrustY -= THRUST_SPEED;
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['btn-down']) thrustY += THRUST_SPEED;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['btn-left']) thrustX -= THRUST_SPEED;
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['btn-right']) thrustX += THRUST_SPEED;

      setPos((prev) => {
        let nx = prev.x + (driftX + thrustX) * dt;
        let ny = prev.y + (driftY + thrustY) * dt;

        // Clamp to radar arena (boundary: radius 120 from center)
        const d = Math.hypot(nx - CENTER_X, ny - CENTER_Y);
        if (d > 115) {
          const angle = Math.atan2(ny - CENTER_Y, nx - CENTER_X);
          nx = CENTER_X + Math.cos(angle) * 115;
          ny = CENTER_Y + Math.sin(angle) * 115;
        }

        return { x: nx, y: ny };
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isCompleted]);

  // Lock progress timer
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setLockProgress((prev) => {
        if (isInside) {
          const next = prev + 6;
          if (next >= 100) {
            setIsCompleted(true);
            setTimeout(() => {
              onComplete();
            }, 700);
            return 100;
          }
          return next;
        } else {
          return Math.max(0, prev - 12);
        }
      });
    }, 80);

    return () => clearInterval(interval);
  }, [isInside, isCompleted, onComplete]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Direct touch/drag navigation on the radar screen
  const handleTouchArena = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isCompleted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    setPos({ x, y });
  };

  const setButtonThrust = (btn: string, active: boolean) => {
    keysPressed.current[btn] = active;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#0f1722] border-4 border-[#1f374d] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="text-center mb-3">
          <h3 className="text-xl font-black text-white tracking-widest uppercase flex items-center justify-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            ALIGN NAVIGATION
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'VECTOR LOCKED (100%)'
              : isInside
              ? 'HOLDING COORDINATES...'
              : 'STEER SHIP INTO TARGET RING'}
          </p>
        </div>

        {/* Lock Progress Bar */}
        <div className="mb-3 bg-[#080d14] p-2 rounded-xl border border-[#162738]">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400 uppercase">COORDINATE SYNC:</span>
            <span className={lockProgress >= 100 ? 'text-green-400 font-bold' : 'text-cyan-400'}>
              {lockProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-75 ${
                lockProgress >= 100
                  ? 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                  : 'bg-gradient-to-r from-yellow-500 to-cyan-400'
              }`}
              style={{ width: `${lockProgress}%` }}
            />
          </div>
        </div>

        {/* Radar Starfield Display */}
        <div className="relative bg-[#04090e] border-2 border-[#16364a] rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          <svg
            viewBox="0 0 300 300"
            className="w-full h-56 cursor-pointer touch-none"
            onPointerDown={handleTouchArena}
            onPointerMove={(e) => {
              if (e.buttons === 1) handleTouchArena(e);
            }}
          >
            {/* Ambient Starfield */}
            <circle cx="40" cy="50" r="1.5" fill="#ffffff" opacity="0.6" />
            <circle cx="260" cy="80" r="1" fill="#ffffff" opacity="0.4" />
            <circle cx="80" cy="240" r="1.5" fill="#ffffff" opacity="0.5" />
            <circle cx="230" cy="220" r="1" fill="#ffffff" opacity="0.6" />
            <circle cx="160" cy="30" r="1" fill="#ffffff" opacity="0.5" />

            {/* Radar Circular Grid */}
            <circle cx="150" cy="150" r="115" stroke="#163144" strokeWidth="1.5" fill="none" />
            <circle cx="150" cy="150" r="75" stroke="#163144" strokeWidth="1" fill="none" strokeDasharray="3 3" />

            {/* Crosshairs */}
            <line x1="150" y1="20" x2="150" y2="280" stroke="#183d54" strokeWidth="1" />
            <line x1="20" y1="150" x2="280" y2="150" stroke="#183d54" strokeWidth="1" />

            {/* Target Ring (Bullseye) */}
            <circle
              cx="150"
              cy="150"
              r={TARGET_RADIUS}
              stroke={isInside ? '#22c55e' : '#f59e0b'}
              strokeWidth="2.5"
              fill={isInside ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.05)'}
              strokeDasharray={isInside ? 'none' : '4 2'}
              className="transition-colors duration-200"
              style={{
                filter: isInside ? 'drop-shadow(0 0 8px #22c55e)' : 'none',
              }}
            />
            <circle cx="150" cy="150" r="3" fill={isInside ? '#22c55e' : '#f59e0b'} />

            {/* Player's Drifting Ship Reticle */}
            <g transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r="18"
                stroke={isInside ? '#22c55e' : '#00e5ff'}
                strokeWidth="2.5"
                fill="none"
                style={{
                  filter: isInside
                    ? 'drop-shadow(0 0 10px #22c55e)'
                    : 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))',
                }}
              />
              <line x1="-10" y1="0" x2="10" y2="0" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#ffffff" strokeWidth="1.5" />
              <circle r="3" fill="#ffffff" />
            </g>
          </svg>

          {/* Success Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-lg tracking-widest uppercase">
                COURSE ALIGNED
              </span>
            </div>
          )}
        </div>

        {/* Thruster Direction Controls */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <button
            onPointerDown={() => setButtonThrust('btn-up', true)}
            onPointerUp={() => setButtonThrust('btn-up', false)}
            onPointerLeave={() => setButtonThrust('btn-up', false)}
            className="w-12 h-10 bg-[#162738] hover:bg-[#203a54] active:bg-cyan-500 active:text-black text-cyan-400 rounded-lg flex items-center justify-center border border-[#25425e] shadow transition-all active:scale-95"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex gap-4">
            <button
              onPointerDown={() => setButtonThrust('btn-left', true)}
              onPointerUp={() => setButtonThrust('btn-left', false)}
              onPointerLeave={() => setButtonThrust('btn-left', false)}
              className="w-12 h-10 bg-[#162738] hover:bg-[#203a54] active:bg-cyan-500 active:text-black text-cyan-400 rounded-lg flex items-center justify-center border border-[#25425e] shadow transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => setButtonThrust('btn-down', true)}
              onPointerUp={() => setButtonThrust('btn-down', false)}
              onPointerLeave={() => setButtonThrust('btn-down', false)}
              className="w-12 h-10 bg-[#162738] hover:bg-[#203a54] active:bg-cyan-500 active:text-black text-cyan-400 rounded-lg flex items-center justify-center border border-[#25425e] shadow transition-all active:scale-95"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => setButtonThrust('btn-right', true)}
              onPointerUp={() => setButtonThrust('btn-right', false)}
              onPointerLeave={() => setButtonThrust('btn-right', false)}
              className="w-12 h-10 bg-[#162738] hover:bg-[#203a54] active:bg-cyan-500 active:text-black text-cyan-400 rounded-lg flex items-center justify-center border border-[#25425e] shadow transition-all active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Tap or drag thrusters to hold the reticle in the target ring.
        </p>
      </div>
    </div>
  );
}
