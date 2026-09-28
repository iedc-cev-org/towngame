'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, CheckCircle2, Waves, Sliders } from 'lucide-react';

interface RadioFreqGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function RadioFreqGame({ onComplete, onCancel }: RadioFreqGameProps) {
  // Target values (randomized on mount)
  const [targetFreq, setTargetFreq] = useState(2.8);
  const [targetAmp, setTargetAmp] = useState(30);

  // User dial values
  const [userFreq, setUserFreq] = useState(1.2);
  const [userAmp, setUserAmp] = useState(15);

  // Lock progress (0 to 100%)
  const [lockProgress, setLockProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Phase animation ticker
  const [phase, setPhase] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    // Generate distinct randomized target
    const randomFreq = parseFloat((Math.random() * (4.2 - 1.8) + 1.8).toFixed(1));
    const randomAmp = Math.round(Math.random() * 20 + 22); // 22 to 42
    setTargetFreq(randomFreq);
    setTargetAmp(randomAmp);

    // Initial user settings far enough away
    setUserFreq(randomFreq > 3.0 ? 1.4 : 4.6);
    setUserAmp(randomAmp > 32 ? 16 : 44);
  }, []);

  // Continuous wave phase animation for live oscilloscope effect
  useEffect(() => {
    if (isCompleted) return;
    const animate = () => {
      setPhase((p) => (p + 0.08) % (Math.PI * 2));
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isCompleted]);

  // Compute accuracy
  const freqDiff = Math.abs(userFreq - targetFreq);
  const ampDiff = Math.abs(userAmp - targetAmp);
  const isAligned = freqDiff <= 0.25 && ampDiff <= 4;

  // Lock timer progress
  useEffect(() => {
    if (isCompleted) return;

    let timer: NodeJS.Timeout;
    if (isAligned) {
      timer = setInterval(() => {
        setLockProgress((prev) => {
          if (prev >= 100) {
            setIsCompleted(true);
            clearInterval(timer);
            setTimeout(() => {
              onComplete();
            }, 700);
            return 100;
          }
          return Math.min(100, prev + 5);
        });
      }, 50);
    } else {
      // Drain down if user loses alignment
      setLockProgress((prev) => Math.max(0, prev - 10));
    }

    return () => clearInterval(timer);
  }, [isAligned, isCompleted, onComplete]);

  // Generate SVG path for a sine wave
  const generateWavePath = (frequency: number, amplitude: number, phaseOffset: number) => {
    const width = 280;
    const height = 140;
    const midY = height / 2;
    const points: string[] = [];

    for (let x = 0; x <= width; x += 4) {
      const radians = (x / width) * (frequency * Math.PI * 2) + phaseOffset;
      const y = midY + Math.sin(radians) * amplitude;
      points.push(`${x},${y.toFixed(1)}`);
    }

    return `M ${points.join(' L ')}`;
  };

  const targetPath = generateWavePath(targetFreq, targetAmp, phase);
  const userPath = generateWavePath(userFreq, userAmp, phase);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#121829] border-4 border-[#253252] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-black text-white tracking-widest uppercase flex items-center justify-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            RADIO CALIBRATION
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-1">
            {isCompleted ? 'FREQUENCY LOCKED (100%)' : 'MATCH CARRIER WAVE & HOLD'}
          </p>
        </div>

        {/* Oscilloscope Screen */}
        <div className="relative bg-[#06120b] border-2 border-[#164e2e] rounded-xl p-2 overflow-hidden shadow-inner">
          {/* CRT scanlines grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(18, 255, 120, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(18, 255, 120, 0.15) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <svg viewBox="0 0 280 140" className="w-full h-36">
            {/* Center crosshair lines */}
            <line x1="0" y1="70" x2="280" y2="70" stroke="#14532d" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="140" y1="0" x2="140" y2="140" stroke="#14532d" strokeWidth="1" strokeDasharray="4 4" />

            {/* Target Wave (Orange / Gold dotted guide) */}
            <path
              d={targetPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              opacity="0.8"
            />

            {/* User Wave (Neon Green / Cyan) */}
            <path
              d={userPath}
              fill="none"
              stroke={isAligned ? '#22c55e' : '#00e5ff'}
              strokeWidth="3"
              style={{
                filter: isAligned
                  ? 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.9))'
                  : 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.8))',
              }}
            />
          </svg>

          {/* CRT Corner Status Overlay */}
          <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
            <span>TGT: {targetFreq.toFixed(1)}kHz / {targetAmp}dB</span>
          </div>

          <div className="absolute top-2 right-3 text-[10px] font-mono text-cyan-400">
            <span>SIG: {userFreq.toFixed(1)}kHz / {userAmp}dB</span>
          </div>

          {/* Lock status banner */}
          <div className="absolute bottom-2 inset-x-0 flex justify-center">
            {isAligned ? (
              <span className="bg-green-950/80 border border-green-500 text-green-400 font-mono text-xs px-3 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_10px_#22c55e]">
                {lockProgress >= 100 ? 'SIGNAL LOCKED!' : `SYNCHRONIZING ${lockProgress}%`}
              </span>
            ) : (
              <span className="bg-red-950/70 border border-red-500/50 text-red-400 font-mono text-xs px-2.5 py-0.5 rounded-full">
                SEARCHING SIGNAL...
              </span>
            )}
          </div>
        </div>

        {/* Sync Hold Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400 uppercase">Sync Hold Lock:</span>
            <span className={lockProgress >= 100 ? 'text-green-400 font-bold' : 'text-gray-300'}>
              {lockProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
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

        {/* Slider Controls */}
        <div className="mt-5 space-y-4 bg-[#0d1424] p-3 rounded-xl border border-[#1e2a47]">
          {/* Frequency Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-300 mb-1.5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Waves className="w-4 h-4" /> FREQUENCY
              </span>
              <span className="font-mono text-white">{userFreq.toFixed(1)} kHz</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={userFreq}
              disabled={isCompleted}
              onChange={(e) => setUserFreq(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none"
            />
          </div>

          {/* Amplitude Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-300 mb-1.5">
              <span className="flex items-center gap-1 text-secondary">
                <Sliders className="w-4 h-4" /> AMPLITUDE
              </span>
              <span className="font-mono text-white">{userAmp} dB</span>
            </div>
            <input
              type="range"
              min="10"
              max="48"
              step="1"
              value={userAmp}
              disabled={isCompleted}
              onChange={(e) => setUserAmp(parseInt(e.target.value))}
              className="w-full accent-secondary cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        <p className="text-gray-400 text-xs font-bold text-center mt-4 uppercase tracking-wider">
          Align user wave with orange target & hold steady.
        </p>
      </div>
    </div>
  );
}
