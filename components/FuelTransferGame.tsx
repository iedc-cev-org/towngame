'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Fuel, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';

interface FuelTransferGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function FuelTransferGame({ onComplete, onCancel }: FuelTransferGameProps) {
  const [fuelLevel, setFuelLevel] = useState(0); // 0 to 100%
  const [isPumping, setIsPumping] = useState(false);
  const [isOverflowed, setIsOverflowed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('HOLD BUTTON TO FILL TANK');
  const [isCompleted, setIsCompleted] = useState(false);

  const TARGET_MIN = 78;
  const TARGET_MAX = 90;

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Fuel pumping animation
  useEffect(() => {
    if (isCompleted || isOverflowed) return;

    if (isPumping) {
      const fillTick = (now: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = now;
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setFuelLevel((prev) => {
          const next = prev + 30 * dt; // fills at 30% per second
          if (next >= 100) {
            // Overfill triggered!
            triggerOverflow();
            return 100;
          }
          return next;
        });

        animRef.current = requestAnimationFrame(fillTick);
      };

      animRef.current = requestAnimationFrame(fillTick);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    };
  }, [isPumping, isCompleted, isOverflowed]);

  const triggerOverflow = () => {
    setIsPumping(false);
    setIsOverflowed(true);
    setStatusMessage('OVERFLOW! VALVE PURGING...');

    setTimeout(() => {
      setFuelLevel(0);
      setIsOverflowed(false);
      setStatusMessage('HOLD BUTTON TO FILL TANK');
    }, 900);
  };

  const handlePointerDown = () => {
    if (isCompleted || isOverflowed) return;
    setIsPumping(true);
    setStatusMessage('PUMPING FUEL...');
  };

  const handlePointerUp = () => {
    if (isCompleted || isOverflowed || !isPumping) return;
    setIsPumping(false);

    if (fuelLevel >= TARGET_MIN && fuelLevel <= TARGET_MAX) {
      // Success!
      setIsCompleted(true);
      setStatusMessage('FUEL TANK OPTIMAL');
      setTimeout(() => {
        onComplete();
      }, 700);
    } else if (fuelLevel < TARGET_MIN) {
      setStatusMessage(`UNDERFILLED (${Math.round(fuelLevel)}%) - REACH TARGET LINE`);
    } else {
      triggerOverflow();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div
        className={`bg-[#1c1815] border-4 border-[#3d2e24] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
          isOverflowed ? 'animate-shake' : ''
        }`}
      >
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
            <Fuel className="w-5 h-5 text-amber-500" />
            FUEL TRANSFER
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted ? 'TANK SECURED (100%)' : statusMessage}
          </p>
        </div>

        {/* Fuel Canister Display */}
        <div className="relative bg-[#0d0b09] border-2 border-[#2b211a] rounded-xl p-4 flex items-center justify-center shadow-inner">
          <div className="relative w-36 h-60 bg-[#14100d] border-4 border-[#423225] rounded-2xl overflow-hidden flex flex-col justify-end shadow-2xl">
            {/* Target Fill Zone Bracket */}
            <div
              className="absolute inset-x-0 border-y-2 border-dashed border-cyan-400 bg-cyan-400/10 z-10 flex items-center justify-between px-2"
              style={{
                bottom: `${TARGET_MIN}%`,
                height: `${TARGET_MAX - TARGET_MIN}%`,
              }}
            >
              <span className="text-[9px] font-mono font-black text-cyan-300">FILL ZONE</span>
              <span className="text-[9px] font-mono font-black text-cyan-300">80-90%</span>
            </div>

            {/* Rising Fuel Liquid */}
            <div
              className={`w-full transition-all duration-75 relative ${
                isCompleted
                  ? 'bg-gradient-to-t from-emerald-600 to-green-400 shadow-[0_0_20px_#22c55e]'
                  : isOverflowed
                  ? 'bg-gradient-to-t from-red-700 to-amber-500'
                  : 'bg-gradient-to-t from-amber-600 via-yellow-500 to-amber-400'
              }`}
              style={{ height: `${fuelLevel}%` }}
            >
              {/* Liquid surface wave ripple */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-white/40 shadow-sm" />

              {/* Bubbles when pumping */}
              {isPumping && (
                <div className="absolute inset-0 flex justify-around items-end pb-2 opacity-70">
                  <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </div>

            {/* Measurement Graduations */}
            <div className="absolute inset-y-0 right-1.5 flex flex-col justify-between py-3 pointer-events-none z-20">
              {[100, 75, 50, 25, 0].map((mark) => (
                <div key={mark} className="flex items-center gap-1 justify-end">
                  <span className="text-[8px] font-mono font-bold text-gray-500">{mark}</span>
                  <div className="w-2 h-0.5 bg-gray-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Current Level Pill */}
          <div className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg border border-[#3d2e24]">
            <span className="text-xs font-mono font-black text-amber-400">
              {Math.round(fuelLevel)}%
            </span>
          </div>

          {/* Overflow Alert */}
          {isOverflowed && (
            <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce mb-1" />
              <span className="text-white font-black text-sm uppercase">OVERFLOW TRIPPED</span>
            </div>
          )}

          {/* Success Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-lg tracking-widest uppercase">
                TANK PRIMED
              </span>
            </div>
          )}
        </div>

        {/* Hold To Pump Button */}
        <div className="mt-4">
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            disabled={isCompleted}
            className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              isCompleted
                ? 'bg-green-600 text-white cursor-default'
                : isPumping
                ? 'bg-amber-400 text-black shadow-[0_0_20px_#f59e0b]'
                : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:brightness-110'
            }`}
          >
            <Flame className={`w-5 h-5 ${isPumping ? 'animate-pulse text-red-600' : ''}`} />
            {isCompleted ? 'TANK FULL' : isPumping ? 'PUMPING...' : 'HOLD TO FILL'}
          </button>
        </div>

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Hold button and release precisely inside the cyan fill zone.
        </p>
      </div>
    </div>
  );
}
