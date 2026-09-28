'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Gauge, CheckCircle2, Flame, ArrowUp, ArrowDown } from 'lucide-react';

interface PressureValvesGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface ValveState {
  id: string;
  name: string;
  psi: number; // 0 to 100
  driftRate: number; // change per second
  minSafe: number;
  maxSafe: number;
}

export default function PressureValvesGame({ onComplete, onCancel }: PressureValvesGameProps) {
  const [valves, setValves] = useState<ValveState[]>([
    { id: 'alpha', name: 'VALVE α', psi: 25, driftRate: 6.5, minSafe: 50, maxSafe: 75 },
    { id: 'beta', name: 'VALVE β', psi: 90, driftRate: -7.0, minSafe: 50, maxSafe: 75 },
    { id: 'gamma', name: 'VALVE γ', psi: 30, driftRate: 5.5, minSafe: 50, maxSafe: 75 },
  ]);

  const [stabilizeProgress, setStabilizeProgress] = useState(0); // 0 to 100%
  const [isCompleted, setIsCompleted] = useState(false);
  const animRef = useRef<number | null>(null);

  // Check if all 3 valves are in safe zone
  const allInZone = valves.every((v) => v.psi >= v.minSafe && v.psi <= v.maxSafe);

  // Continuous drift simulation with requestAnimationFrame
  useEffect(() => {
    if (isCompleted) return;

    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setValves((prev) =>
        prev.map((v) => {
          let nextPsi = v.psi + v.driftRate * dt;
          // Boundary bounce or clamp
          if (nextPsi >= 100) nextPsi = 100;
          if (nextPsi <= 0) nextPsi = 0;
          return { ...v, psi: nextPsi };
        })
      );

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isCompleted]);

  // Stabilization progress bar update
  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setStabilizeProgress((prev) => {
        if (allInZone) {
          const next = prev + 5;
          if (next >= 100) {
            setIsCompleted(true);
            setTimeout(() => {
              onComplete();
            }, 700);
            return 100;
          }
          return next;
        } else {
          return Math.max(0, prev - 8);
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [allInZone, isCompleted, onComplete]);

  // Player manual adjustment actions
  const adjustPsi = (index: number, delta: number) => {
    if (isCompleted) return;
    setValves((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const nextPsi = Math.min(100, Math.max(0, target.psi + delta));
      updated[index] = { ...target, psi: nextPsi };
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#17141f] border-4 border-[#3c2a4d] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
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
            <Gauge className="w-5 h-5 text-amber-400" />
            PRESSURE VALVES
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'PRESSURE EQUALIZED (100%)'
              : allInZone
              ? 'HOLDING STABLE PSI...'
              : 'KEEP ALL 3 NEEDLES IN GREEN'}
          </p>
        </div>

        {/* Stabilization Progress Bar */}
        <div className="mb-4 bg-[#0e0c14] p-2 rounded-xl border border-[#2b1f38]">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400 uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> PRESSURE STABILITY:
            </span>
            <span className={stabilizeProgress >= 100 ? 'text-green-400 font-bold' : 'text-amber-400'}>
              {stabilizeProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-100 ${
                stabilizeProgress >= 100
                  ? 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                  : 'bg-gradient-to-r from-amber-500 to-green-400'
              }`}
              style={{ width: `${stabilizeProgress}%` }}
            />
          </div>
        </div>

        {/* 3 Valves Columns */}
        <div className="grid grid-cols-3 gap-2">
          {valves.map((v, idx) => {
            const inSafe = v.psi >= v.minSafe && v.psi <= v.maxSafe;
            // Angle: 0 PSI is -120 deg, 100 PSI is +120 deg
            const needleAngle = -120 + (v.psi / 100) * 240;

            return (
              <div
                key={v.id}
                className={`bg-[#0d0b13] border-2 rounded-xl p-2 flex flex-col items-center transition-colors ${
                  inSafe ? 'border-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-[#2d2238]'
                }`}
              >
                {/* Valve Label */}
                <span className="text-[11px] font-black text-gray-300 font-mono tracking-wider">
                  {v.name}
                </span>

                {/* Dial Gauge */}
                <div className="relative w-20 h-20 my-1 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-20 h-20">
                    {/* Background dial track */}
                    <circle cx="50" cy="50" r="40" fill="#09070d" stroke="#251c2e" strokeWidth="6" />

                    {/* Safe zone arc (50% to 75% -> 0 deg to 60 deg) */}
                    <path
                      d="M 50 10 A 40 40 0 0 1 84.6 30"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />

                    {/* Center spindle */}
                    <circle cx="50" cy="50" r="7" fill="#3b2b48" stroke="#5b436f" strokeWidth="2" />

                    {/* Rotating needle */}
                    <g transform={`rotate(${needleAngle} 50 50)`}>
                      <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="16"
                        stroke={inSafe ? '#22c55e' : '#ef4444'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        style={{
                          filter: inSafe
                            ? 'drop-shadow(0 0 4px #22c55e)'
                            : 'drop-shadow(0 0 3px #ef4444)',
                        }}
                      />
                      <circle cx="50" cy="16" r="2.5" fill="#ffffff" />
                    </g>
                  </svg>
                </div>

                {/* PSI Readout */}
                <span
                  className={`text-xs font-mono font-black mb-2 ${
                    inSafe ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  {Math.round(v.psi)} PSI
                </span>

                {/* Action Buttons: Vent (-) and Pump (+) */}
                <div className="w-full flex flex-col gap-1.5">
                  <button
                    onClick={() => adjustPsi(idx, 12)}
                    disabled={isCompleted}
                    className="w-full py-1.5 bg-amber-600/30 hover:bg-amber-600/50 active:bg-amber-600 text-amber-300 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 border border-amber-500/40 transition-all active:scale-95"
                  >
                    <ArrowUp className="w-3 h-3" /> PUMP
                  </button>
                  <button
                    onClick={() => adjustPsi(idx, -12)}
                    disabled={isCompleted}
                    className="w-full py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 active:bg-cyan-600 text-cyan-300 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 border border-cyan-500/40 transition-all active:scale-95"
                  >
                    <ArrowDown className="w-3 h-3" /> VENT
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Modal */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 drop-shadow-[0_0_20px_#22c55e]" />
            <span className="text-white font-black text-xl tracking-widest uppercase">
              VALVES EQUALIZED
            </span>
          </div>
        )}

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Pump/Vent to keep all 3 gauges in the green arc until 100%.
        </p>
      </div>
    </div>
  );
}
