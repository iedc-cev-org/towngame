'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Crosshair, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';

interface OrbitalDefenseGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface TargetDebris {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number; // 1 for normal, 2 for armored
  isArmored: boolean;
}

export default function OrbitalDefenseGame({ onComplete, onCancel }: OrbitalDefenseGameProps) {
  const [targets, setTargets] = useState<TargetDebris[]>([]);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [totalTargets] = useState(8);
  const [heat, setHeat] = useState(0); // 0 to 3
  const [isOverheated, setIsOverheated] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [explosions, setExplosions] = useState<{ id: number; x: number; y: number }[]>([]);

  const animRef = useRef<number | null>(null);

  // Initialize targets
  useEffect(() => {
    const initial: TargetDebris[] = [];
    for (let i = 0; i < totalTargets; i++) {
      const isArmored = i < 2; // 2 armored targets
      initial.push({
        id: i,
        x: Math.random() * 220 + 30,
        y: Math.random() * 200 + 40,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        size: isArmored ? 28 : 22,
        hp: isArmored ? 2 : 1,
        isArmored,
      });
    }
    setTargets(initial);
  }, [totalTargets]);

  // Animate targets movement
  useEffect(() => {
    if (isCompleted) return;

    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTargets((prev) =>
        prev.map((t) => {
          let nx = t.x + t.vx * dt;
          let ny = t.y + t.vy * dt;
          let nvx = t.vx;
          let nvy = t.vy;

          // Bounce off radar boundary (0 to 280 x, 0 to 280 y)
          if (nx <= 20) { nx = 20; nvx = Math.abs(nvx); }
          if (nx >= 260) { nx = 260; nvx = -Math.abs(nvx); }
          if (ny <= 20) { ny = 20; nvy = Math.abs(nvy); }
          if (ny >= 260) { ny = 260; nvy = -Math.abs(nvy); }

          return { ...t, x: nx, y: ny, vx: nvx, vy: nvy };
        })
      );

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isCompleted]);

  const expCounter = useRef(0);

  // Handle tap on asteroid
  const handleHitTarget = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || isOverheated) return;

    setTargets((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      // Add explosion animation particle with guaranteed unique ID
      const expId = ++expCounter.current;
      setExplosions((exp) => [...exp, { id: expId, x: target.x, y: target.y }]);
      setTimeout(() => {
        setExplosions((exp) => exp.filter((item) => item.id !== expId));
      }, 500);

      if (target.hp > 1) {
        // Armored hit: crack shield
        return prev.map((t) => (t.id === id ? { ...t, hp: t.hp - 1 } : t));
      } else {
        // Destroyed!
        const remaining = prev.filter((t) => t.id !== id);
        const newCount = destroyedCount + 1;
        setDestroyedCount(newCount);

        if (remaining.length === 0) {
          setIsCompleted(true);
          setTimeout(() => {
            onComplete();
          }, 700);
        }
        return remaining;
      }
    });
  };

  // Handle missed tap (into empty radar space)
  const handleMiss = () => {
    if (isCompleted || isOverheated) return;

    setHeat((h) => {
      const next = h + 1;
      if (next >= 3) {
        setIsOverheated(true);
        setTimeout(() => {
          setIsOverheated(false);
          setHeat(0);
        }, 1200);
        return 3;
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#121c24] border-4 border-[#253f52] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
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
            <Crosshair className="w-5 h-5 text-red-500" />
            ORBITAL DEFENSE
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'SECTOR SECURED (100%)'
              : isOverheated
              ? 'TURRET OVERHEATED - COOLING'
              : `TARGETS ELIMINATED: ${destroyedCount} / ${totalTargets}`}
          </p>
        </div>

        {/* Heat Meter */}
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> CANNON HEAT:
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-6 h-2 rounded-sm transition-colors ${
                  heat >= step ? (step === 3 ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-yellow-400') : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Tactical Radar Screen */}
        <div
          onClick={handleMiss}
          className={`relative bg-[#071118] border-2 rounded-xl p-1 overflow-hidden shadow-inner h-72 cursor-crosshair ${
            isOverheated ? 'border-red-500 bg-red-950/20' : 'border-[#1b3a4d]'
          }`}
        >
          <svg viewBox="0 0 280 280" className="w-full h-full pointer-events-none">
            {/* Concentric radar rings */}
            <circle cx="140" cy="140" r="120" stroke="#163547" strokeWidth="1" fill="none" />
            <circle cx="140" cy="140" r="80" stroke="#163547" strokeWidth="1" fill="none" />
            <circle cx="140" cy="140" r="40" stroke="#163547" strokeWidth="1" fill="none" />

            {/* Radar crosshairs */}
            <line x1="140" y1="10" x2="140" y2="270" stroke="#1b3f54" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="10" y1="140" x2="270" y2="140" stroke="#1b3f54" strokeWidth="1" strokeDasharray="3 3" />

            {/* Center Ship Beacon */}
            <circle cx="140" cy="140" r="4" fill="#00e5ff" />
          </svg>

          {/* Active Targets */}
          {targets.map((t) => (
            <div
              key={t.id}
              onClick={(e) => handleHitTarget(t.id, e)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer active:scale-90 transition-transform"
              style={{ left: `${(t.x / 280) * 100}%`, top: `${(t.y / 280) * 100}%` }}
            >
              <div
                className={`relative flex items-center justify-center rounded-full border-2 ${
                  t.isArmored
                    ? t.hp === 2
                      ? 'w-10 h-10 bg-purple-950/80 border-purple-400 shadow-[0_0_12px_#c084fc]'
                      : 'w-10 h-10 bg-purple-900/60 border-yellow-400 border-dashed animate-pulse'
                    : 'w-8 h-8 bg-stone-800 border-red-500 shadow-[0_0_8px_#ef4444]'
                }`}
              >
                {/* Target icon */}
                {t.isArmored ? (
                  <ShieldAlert className={`w-5 h-5 ${t.hp === 2 ? 'text-purple-300' : 'text-yellow-400'}`} />
                ) : (
                  <Crosshair className="w-4 h-4 text-red-400" />
                )}

                {/* HP pill for armored */}
                {t.isArmored && (
                  <span className="absolute -top-2 px-1 bg-black text-[9px] font-mono font-bold text-yellow-300 rounded border border-yellow-400">
                    {t.hp}x
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Explosions */}
          {explosions.map((exp) => (
            <div
              key={exp.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping"
              style={{ left: `${(exp.x / 280) * 100}%`, top: `${(exp.y / 280) * 100}%` }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-red-500 opacity-80" />
            </div>
          ))}

          {/* Overheat warning overlay */}
          {isOverheated && (
            <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center pointer-events-none">
              <Zap className="w-12 h-12 text-yellow-400 animate-bounce mb-1" />
              <span className="text-white font-black text-sm uppercase tracking-wider">
                WEAPON OVERHEATED
              </span>
              <span className="text-yellow-300 text-xs font-mono">COOLING DOWN...</span>
            </div>
          )}

          {/* Victory overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-lg tracking-widest uppercase">
                RADAR CLEAR (100%)
              </span>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Tap red asteroids (1x) and armored shields (2x). Avoid misses.
        </p>
      </div>
    </div>
  );
}
