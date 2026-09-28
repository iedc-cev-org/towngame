'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface ShieldsGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function ShieldsGame({ onComplete, onCancel }: ShieldsGameProps) {
  // 7 shields: index 0 is center, indices 1-6 are the 6 outer surrounding shields
  const [shields, setShields] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Generate initial state with 2 to 4 shields red (false) and the rest cyan (true)
    const initial = [false, false, false, false, false, false, false];
    // Randomly choose 2 to 4 indices to be inactive (red)
    const countRed = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const indices = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    const redIndices = new Set(indices.slice(0, countRed));

    for (let i = 0; i < 7; i++) {
      initial[i] = !redIndices.has(i);
    }
    setShields(initial);
  }, []);

  const handleToggle = (index: number) => {
    if (shields[index] || isCompleted) return;

    const nextShields = [...shields];
    nextShields[index] = true;
    setShields(nextShields);

    if (nextShields.every(Boolean)) {
      setIsCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 700);
    }
  };

  // Positions for 7 hexagons: center at (150, 150), 6 outer around a circle radius R=75
  const R = 72;
  const cx = 150;
  const cy = 150;

  const hexPositions = [
    { x: cx, y: cy }, // 0: Center
    ...Array.from({ length: 6 }).map((_, i) => {
      const angle = (i * 60 - 30) * (Math.PI / 180);
      return {
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
      };
    }),
  ];

  // Helper to generate SVG hexagon path given center and radius
  const getHexPath = (x: number, y: number, r: number) => {
    const points = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i * 60 - 30) * (Math.PI / 180);
      return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
    });
    return `M ${points.join(' L ')} Z`;
  };

  const activeCount = shields.filter(Boolean).length;

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
          <h3 className="text-2xl font-black text-white tracking-widest uppercase">
            PRIME SHIELDS
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-400 mt-1">
            {isCompleted ? 'ALL SHIELDS PRIMED (100%)' : `DEFLECTORS CHARGED: ${activeCount} / 7`}
          </p>
        </div>

        {/* Shield Graphic Area */}
        <div className="bg-[#0b0e17] border-2 border-[#1c2742] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <svg viewBox="0 0 300 300" className="w-64 h-64">
            {/* Background circular guide line */}
            <circle cx={cx} cy={cy} r={R} stroke="#1f2c4a" strokeWidth="2" strokeDasharray="4 4" fill="none" />

            {/* 7 Hexagonal Shields */}
            {hexPositions.map((pos, idx) => {
              const active = shields[idx];
              const hexPath = getHexPath(pos.x, pos.y, 35);
              const innerHexPath = getHexPath(pos.x, pos.y, 29);

              return (
                <g
                  key={idx}
                  onClick={() => handleToggle(idx)}
                  className="cursor-pointer transition-transform transform active:scale-95"
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                >
                  {/* Outer Hex Border */}
                  <path
                    d={hexPath}
                    fill="#0f1524"
                    stroke={active ? '#00e5ff' : '#dc2626'}
                    strokeWidth="3.5"
                    className="transition-colors duration-300"
                    style={{
                      filter: active
                        ? 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.7))'
                        : 'drop-shadow(0 0 4px rgba(220, 38, 38, 0.4))',
                    }}
                  />

                  {/* Inner Hex Plate */}
                  <path
                    d={innerHexPath}
                    fill={active ? '#00e5ff' : '#991b1b'}
                    className="transition-all duration-300"
                    opacity={active ? 0.9 : 0.7}
                  />

                  {/* Center Node / Symbol */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill={active ? '#ffffff' : '#450a0a'}
                    stroke={active ? '#00e5ff' : '#dc2626'}
                    strokeWidth="2"
                    className="transition-colors duration-300"
                  />
                </g>
              );
            })}
          </svg>

          {isCompleted && (
            <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
              <ShieldCheck className="w-16 h-16 text-cyan-400 mb-2 animate-bounce drop-shadow-[0_0_20px_rgba(0,229,255,1)]" />
              <p className="text-2xl font-black text-white tracking-widest uppercase">
                SHIELDS ACTIVE
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-gray-400 text-xs font-bold text-center mt-5 uppercase tracking-wider">
          Tap the red shield plates to prime them.
        </p>
      </div>
    </div>
  );
}
