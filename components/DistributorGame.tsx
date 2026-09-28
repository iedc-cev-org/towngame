'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, CheckCircle2 } from 'lucide-react';

interface DistributorGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function DistributorGame({ onComplete, onCancel }: DistributorGameProps) {
  // Stages: 1, 2, 3
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [lockedStages, setLockedStages] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  });

  const [angle, setAngle] = useState(0);
  const [isMissed, setIsMissed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animation frame reference
  const animRef = useRef<number | null>(null);
  const angleRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  // Speed in degrees per second for each stage (Stage 1: 180°/s, Stage 2: 240°/s, Stage 3: 300°/s)
  const speeds = { 1: 180, 2: 230, 3: 290 };

  useEffect(() => {
    if (isCompleted) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      const currentSpeed = speeds[currentStage] || 180;
      angleRef.current = (angleRef.current + currentSpeed * delta) % 360;
      setAngle(angleRef.current);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [currentStage, isCompleted]);

  // Target angle is 90 degrees (pointing directly right towards the contact wire)
  const TARGET_ANGLE = 90;
  const TOLERANCE = 24; // ±24 degrees window

  const handleConnect = () => {
    if (isCompleted || isMissed) return;

    const currentAng = angleRef.current;
    // Calculate difference to 90 degrees
    let diff = Math.abs(currentAng - TARGET_ANGLE);
    if (diff > 180) diff = 360 - diff;

    if (diff <= TOLERANCE) {
      // Hit!
      const nextLocked = { ...lockedStages, [currentStage]: true };
      setLockedStages(nextLocked);

      if (currentStage === 3) {
        setIsCompleted(true);
        if (animRef.current !== null) cancelAnimationFrame(animRef.current);
        setTimeout(() => {
          onComplete();
        }, 700);
      } else {
        // Move to next stage and reset angle slightly so it doesn't instantly align
        angleRef.current = 270;
        setAngle(270);
        setCurrentStage((prev) => (prev + 1) as 1 | 2 | 3);
      }
    } else {
      // Missed! Reset to stage 1 with visual error shake
      setIsMissed(true);
      setLockedStages({ 1: false, 2: false, 3: false });
      setCurrentStage(1);
      angleRef.current = 0;
      setAngle(0);

      setTimeout(() => {
        setIsMissed(false);
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div
        className={`bg-[#131b2e] border-4 border-[#253252] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
          isMissed ? 'animate-shake' : ''
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
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-white tracking-widest uppercase flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            CALIBRATE DISTRIBUTOR
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-1">
            {isCompleted
              ? 'CALIBRATION COMPLETE (100%)'
              : `ALIGN CONTACT BAR: STAGE ${currentStage} OF 3`}
          </p>
        </div>

        {/* 3 Distributor Wheel Stages */}
        <div className="space-y-4 bg-[#0a0e1a] p-4 rounded-xl border-2 border-[#1c2742]">
          {[1, 2, 3].map((stageNum) => {
            const isLocked = lockedStages[stageNum];
            const isActive = currentStage === stageNum && !isCompleted;
            const currentWheelAngle = isLocked ? TARGET_ANGLE : isActive ? angle : 0;

            const wireColor = isLocked ? '#22c55e' : isActive ? '#facc15' : '#475569';

            return (
              <div
                key={stageNum}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  isActive ? 'bg-[#18233c] border border-cyan-500/40' : 'bg-transparent'
                }`}
              >
                {/* Stage Indicator Badge */}
                <div className="w-8 text-center">
                  <span
                    className={`font-mono text-xs font-black ${
                      isLocked ? 'text-green-400' : isActive ? 'text-yellow-400' : 'text-gray-600'
                    }`}
                  >
                    0{stageNum}
                  </span>
                </div>

                {/* Rotating Wheel Display */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    {/* Outer dial track */}
                    <circle cx="32" cy="32" r="26" stroke="#1f2c4a" strokeWidth="4" fill="#0f1524" />

                    {/* Stationary target contact node on right (at 90 degrees) */}
                    <circle
                      cx="58"
                      cy="32"
                      r="4.5"
                      fill={isLocked ? '#22c55e' : '#eab308'}
                      stroke="#0f1524"
                      strokeWidth="1.5"
                      style={{
                        filter: isLocked
                          ? 'drop-shadow(0 0 4px #22c55e)'
                          : isActive
                          ? 'drop-shadow(0 0 4px #eab308)'
                          : 'none',
                      }}
                    />

                    {/* Rotating contact needle */}
                    <g transform={`rotate(${currentWheelAngle - 90} 32 32)`}>
                      <line
                        x1="32"
                        y1="32"
                        x2="56"
                        y2="32"
                        stroke={isLocked ? '#22c55e' : isActive ? '#00e5ff' : '#64748b'}
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="56"
                        cy="32"
                        r="3.5"
                        fill={isLocked ? '#ffffff' : isActive ? '#ffffff' : '#64748b'}
                      />
                    </g>

                    {/* Center spindle */}
                    <circle cx="32" cy="32" r="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  </svg>
                </div>

                {/* Connecting Wire to right terminal */}
                <div className="flex-1 mx-3 h-1 rounded" style={{ backgroundColor: wireColor }}></div>

                {/* Status Indicator LED */}
                <div className="w-10 flex justify-center">
                  {isLocked ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center shadow-[0_0_10px_#22c55e]">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full bg-yellow-400/20 border-2 border-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-800 border border-gray-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={handleConnect}
            disabled={isCompleted}
            className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all transform active:scale-95 shadow-lg ${
              isCompleted
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-gradient-to-r from-secondary to-cyan-400 hover:from-cyan-400 hover:to-secondary text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]'
            }`}
          >
            {isCompleted ? 'CALIBRATED' : 'STOP & CONNECT'}
          </button>
        </div>

        <p className="text-gray-400 text-xs font-bold text-center mt-4 uppercase tracking-wider">
          Tap CONNECT when the needle aligns with the right node.
        </p>
      </div>
    </div>
  );
}
