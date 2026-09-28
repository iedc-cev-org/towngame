'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';

interface GarbageChuteGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface TrashItem {
  id: number;
  label: string;
  x: number;
  y: number;
  color: string;
  rotation: number;
}

export default function GarbageChuteGame({ onComplete, onCancel }: GarbageChuteGameProps) {
  // Lever position: 0 (top/released) to 100 (bottom/pulled)
  const [leverPos, setLeverPos] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [ejectProgress, setEjectProgress] = useState(0); // 0 to 100%
  const [isCompleted, setIsCompleted] = useState(false);

  // Trash pieces
  const [trashList, setTrashList] = useState<TrashItem[]>([
    { id: 1, label: '🥫', x: 25, y: 35, color: '#ef4444', rotation: 12 },
    { id: 2, label: '📄', x: 55, y: 25, color: '#f8fafc', rotation: -20 },
    { id: 3, label: '🔋', x: 35, y: 70, color: '#22c55e', rotation: 45 },
    { id: 4, label: '💎', x: 65, y: 65, color: '#38bdf8', rotation: -15 },
    { id: 5, label: '📦', x: 45, y: 45, color: '#d97706', rotation: 8 },
  ]);

  const animRef = useRef<number | null>(null);

  // Lever pull mechanics
  const isLeverDown = leverPos >= 85;

  useEffect(() => {
    if (isCompleted) return;

    if (isLeverDown) {
      const interval = setInterval(() => {
        setEjectProgress((prev) => {
          const next = prev + 5;
          if (next >= 100) {
            setIsCompleted(true);
            setTrashList([]);
            setTimeout(() => {
              onComplete();
            }, 700);
            return 100;
          }
          return next;
        });

        // Progressively remove trash as vacuum sucks it down
        setTrashList((prev) => {
          if (prev.length > 0 && Math.random() > 0.4) {
            return prev.slice(0, prev.length - 1);
          }
          return prev;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      // Snap lever back up when released
      const snapInterval = setInterval(() => {
        setLeverPos((prev) => Math.max(0, prev - 15));
      }, 30);
      return () => clearInterval(snapInterval);
    }
  }, [isLeverDown, isCompleted, onComplete]);

  const handlePointerDown = () => {
    if (isCompleted) return;
    setIsPulling(true);
    setLeverPos(100);
  };

  const handlePointerUp = () => {
    if (isCompleted) return;
    setIsPulling(false);
    setLeverPos(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#181a20] border-4 border-[#2d313d] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
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
            <Trash2 className="w-5 h-5 text-gray-400" />
            EMPTY CHUTE
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'CHUTE CLEARED (100%)'
              : isLeverDown
              ? 'EJECTING DEBRIS...'
              : 'PULL & HOLD LEVER DOWN'}
          </p>
        </div>

        {/* Chamber and Lever Arena */}
        <div className="flex gap-3 bg-[#0d0e12] border-2 border-[#20242e] rounded-xl p-3 shadow-inner">
          {/* Trash Chamber */}
          <div className="flex-1 bg-[#14161d] border-2 border-[#2b303e] rounded-xl relative h-64 overflow-hidden flex flex-col justify-between p-2 shadow-inner">
            {/* Upper intake grate */}
            <div className="w-full h-3 border-b border-gray-700/50 flex justify-around">
              {[1, 2, 3, 4, 5].map((g) => (
                <div key={g} className="w-1 h-full bg-gray-800" />
              ))}
            </div>

            {/* Trash Items inside chamber */}
            <div className="relative flex-1">
              {trashList.map((item) => (
                <div
                  key={item.id}
                  className="absolute text-2xl transition-all duration-300 transform select-none"
                  style={{
                    left: `${item.x}%`,
                    top: isLeverDown ? '110%' : `${item.y}%`,
                    transform: `rotate(${item.rotation}deg) scale(${isLeverDown ? 0.3 : 1})`,
                    opacity: isLeverDown ? 0.2 : 1,
                  }}
                >
                  {item.label}
                </div>
              ))}

              {/* Vacuum Suction Wind Lines */}
              {isLeverDown && (
                <div className="absolute inset-0 flex justify-around pointer-events-none opacity-40">
                  <div className="w-0.5 h-full bg-cyan-400 animate-pulse" />
                  <div className="w-0.5 h-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="w-0.5 h-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              )}
            </div>

            {/* Lower Trapdoor Hatch */}
            <div className="w-full relative h-4 bg-gray-900 border-t-2 border-gray-700 flex items-center justify-between px-2">
              <div
                className={`h-2 rounded transition-all duration-300 ${
                  isLeverDown ? 'w-0 bg-transparent' : 'w-full bg-yellow-500/80 shadow-[0_0_8px_#eab308]'
                }`}
              />
            </div>
          </div>

          {/* Heavy Lever Track */}
          <div className="w-16 bg-[#121318] border-2 border-[#2b303e] rounded-xl relative flex flex-col items-center justify-between py-3 shadow-inner">
            {/* Guide Slot */}
            <div className="absolute top-8 bottom-8 w-3 bg-[#08080a] rounded-full border border-gray-800" />

            {/* Top Indicator */}
            <span className="text-[9px] font-mono font-bold text-gray-500 z-10">UP</span>

            {/* Lever Knob Handle */}
            <div
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="absolute z-20 cursor-grab active:cursor-grabbing w-12 h-14 bg-gradient-to-b from-red-500 to-red-700 rounded-xl border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center transition-all duration-150 active:scale-95 touch-none"
              style={{
                top: `${20 + (leverPos / 100) * 160}px`,
              }}
            >
              <div className="w-8 h-1 bg-white/40 rounded-full mb-1" />
              <div className="w-8 h-1 bg-white/40 rounded-full mb-1" />
              <ChevronDown className="w-4 h-4 text-white animate-bounce" />
            </div>

            {/* Bottom Indicator */}
            <span className={`text-[9px] font-mono font-bold z-10 ${isLeverDown ? 'text-green-400' : 'text-gray-500'}`}>
              EJECT
            </span>
          </div>
        </div>

        {/* Ejection Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-gray-400 uppercase">CHUTE CLEARANCE:</span>
            <span className={ejectProgress >= 100 ? 'text-green-400 font-bold' : 'text-cyan-400'}>
              {ejectProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-100 ${
                ejectProgress >= 100
                  ? 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                  : 'bg-gradient-to-r from-yellow-500 to-cyan-400'
              }`}
              style={{ width: `${ejectProgress}%` }}
            />
          </div>
        </div>

        {/* Success Modal */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 drop-shadow-[0_0_20px_#22c55e]" />
            <span className="text-white font-black text-xl tracking-widest uppercase">
              CHUTE EMPTIED
            </span>
          </div>
        )}

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Drag and hold the red lever down until the chamber empties.
        </p>
      </div>
    </div>
  );
}
