'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Dna, CheckCircle2, AlertOctagon, Timer, RotateCcw } from 'lucide-react';

interface DnaAnomalyGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface SampleData {
  id: number;
  isAnomaly: boolean;
  color: string;
  glowColor: string;
  particles: number;
  label: string;
}

const STAGE_CONFIGS = {
  1: {
    normalColor: '#06b6d4', // Cyan
    normalGlow: 'rgba(6, 182, 212, 0.4)',
    anomalyColor: '#ef4444', // Red
    anomalyGlow: 'rgba(239, 68, 68, 0.7)',
    description: 'ISOLATE: MUTATED RED PATHOGEN',
  },
  2: {
    normalColor: '#10b981', // Emerald
    normalGlow: 'rgba(16, 185, 129, 0.4)',
    anomalyColor: '#a855f7', // Purple
    anomalyGlow: 'rgba(168, 85, 247, 0.7)',
    description: 'ISOLATE: FOREIGN PURPLE SPORES',
  },
  3: {
    normalColor: '#3b82f6', // Blue
    normalGlow: 'rgba(59, 130, 246, 0.4)',
    anomalyColor: '#f59e0b', // Amber
    anomalyGlow: 'rgba(245, 158, 11, 0.7)',
    description: 'ISOLATE: CORRUPTED AMBER STRAIN',
  },
};

export default function DnaAnomalyGame({ onComplete, onCancel }: DnaAnomalyGameProps) {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [samples, setSamples] = useState<SampleData[]>([]);
  const [timeLeft, setTimeLeft] = useState(5.5);
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate randomized samples for a stage
  const setupStage = useCallback((stage: 1 | 2 | 3) => {
    const anomalyIndex = Math.floor(Math.random() * 4);
    const config = STAGE_CONFIGS[stage];

    const generated: SampleData[] = [0, 1, 2, 3].map((i) => {
      const isAnomaly = i === anomalyIndex;
      return {
        id: i + 1,
        isAnomaly,
        color: isAnomaly ? config.anomalyColor : config.normalColor,
        glowColor: isAnomaly ? config.anomalyGlow : config.normalGlow,
        particles: isAnomaly ? 6 : 3,
        label: `SPECIMEN-0${i + 1}`,
      };
    });

    setSamples(generated);
    setTimeLeft(5.5);
    setIsFailed(false);
    setFailReason(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    setupStage(1);
  }, [setupStage]);

  // Round countdown timer
  useEffect(() => {
    if (isCompleted || isFailed) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          setIsFailed(true);
          setFailReason('TIMEOUT: SPECIMEN SPOILED');
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isCompleted, isFailed]);

  const triggerFail = (reason: string) => {
    setIsFailed(true);
    setFailReason(reason);
  };

  const handleRetry = () => {
    setCurrentStage(1);
    setupStage(1);
  };

  const handleSelectSample = (sample: SampleData) => {
    if (isCompleted || isFailed) return;

    if (sample.isAnomaly) {
      // Correct specimen quarantined!
      if (currentStage === 3) {
        setIsCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 700);
      } else {
        const nextStage = (currentStage + 1) as 1 | 2 | 3;
        setCurrentStage(nextStage);
        setupStage(nextStage);
      }
    } else {
      // Wrong tube tapped
      triggerFail('WRONG SPECIMEN QUARANTINED');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div
        className={`bg-[#0d171d] border-4 border-[#1b3d4f] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
          isFailed ? 'animate-shake' : ''
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
            <Dna className="w-5 h-5 text-emerald-400" />
            DNA ANOMALY SCAN
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'BIO-SAMPLES PURIFIED (100%)'
              : `STAGE ${currentStage} OF 3: PURGE CONTAMINANT`}
          </p>
        </div>

        {/* Target Anomaly Directive Banner */}
        <div className="bg-[#082029] border border-cyan-500/50 rounded-xl p-2.5 mb-3 text-center">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
            MICROSCOPIC DIRECTIVE
          </span>
          <span className="text-xs font-black text-white tracking-wide uppercase">
            {STAGE_CONFIGS[currentStage].description}
          </span>
        </div>

        {/* Round Countdown Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-gray-400">
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-cyan-400" /> INCUBATION TIMER:
            </span>
            <span className={timeLeft <= 2 ? 'text-red-400 font-bold' : 'text-cyan-300 font-bold'}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-100 ${
                timeLeft <= 2 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
              }`}
              style={{ width: `${(timeLeft / 5.5) * 100}%` }}
            />
          </div>
        </div>

        {/* 4 Test Tubes Tray */}
        <div className="grid grid-cols-4 gap-2 bg-[#061117] p-3 rounded-xl border border-[#16384a]">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
            >
              {/* Glass Test Tube Graphic */}
              <div className="relative w-12 h-36 bg-[#0a1b24] border-2 border-[#1e485e] rounded-b-full rounded-t-md p-1 flex flex-col justify-end overflow-hidden group-hover:border-cyan-400 transition-colors shadow-inner">
                {/* Liquid Level */}
                <div
                  className="w-full rounded-b-full transition-all duration-300 relative overflow-hidden"
                  style={{
                    height: '80%',
                    backgroundColor: sample.color,
                    boxShadow: `0 0 15px ${sample.glowColor}`,
                    opacity: 0.85,
                  }}
                >
                  {/* Floating Microscopic Cells/DNA Rungs */}
                  <div className="absolute inset-0 flex flex-col items-center justify-around py-2">
                    {Array.from({ length: sample.particles }).map((_, pIdx) => (
                      <div
                        key={pIdx}
                        className="w-4 h-1.5 rounded-full bg-white/70 animate-pulse"
                        style={{
                          animationDelay: `${pIdx * 0.2}s`,
                          transform: sample.isAnomaly ? 'rotate(15deg)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Surface meniscus shine */}
                  <div className="w-full h-1 bg-white/40 absolute top-0" />
                </div>

                {/* Glass reflection streak */}
                <div className="absolute left-1.5 top-2 bottom-4 w-1 bg-white/15 rounded-full pointer-events-none" />
              </div>

              {/* Sample Label */}
              <span className="text-[10px] font-mono font-bold text-gray-400 mt-2">
                0{sample.id}
              </span>
            </div>
          ))}
        </div>

        {/* Failure Overlay with Clean Retry Button */}
        {isFailed && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 animate-in zoom-in-95 z-30">
            <AlertOctagon className="w-16 h-16 text-red-500 mb-2 animate-bounce drop-shadow-[0_0_20px_#ef4444]" />
            <span className="text-white font-black text-base tracking-wider uppercase text-center mb-1">
              CONTAMINATION SPREAD
            </span>
            <span className="text-red-300 text-xs font-mono text-center mb-4">
              {failReason}
            </span>

            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> RETRY SCAN
            </button>
          </div>
        )}

        {/* Success Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in zoom-in-95 z-30">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 drop-shadow-[0_0_20px_#22c55e]" />
            <span className="text-white font-black text-xl tracking-widest uppercase">
              SAMPLES PURIFIED
            </span>
          </div>
        )}

        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Inspect and tap the contaminated specimen before the timer expires.
        </p>
      </div>
    </div>
  );
}
