'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Cpu, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CircuitBypassGameProps {
  onComplete: () => void;
  onCancel: () => void;
}

// Points defining the path centerlines (in 300x300 coordinates)
const PATH_WAYPOINTS = [
  { x: 35, y: 45 },    // Start Node
  { x: 250, y: 45 },   // Top horizontal
  { x: 250, y: 125 },  // Right drop
  { x: 65, y: 125 },   // Middle horizontal left
  { x: 65, y: 205 },   // Left drop
  { x: 235, y: 205 },  // Lower horizontal right
  { x: 235, y: 265 },  // Final drop into End Node
];

// Helper to compute minimum distance from point P to line segment AB
function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
) {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export default function CircuitBypassGame({ onComplete, onCancel }: CircuitBypassGameProps) {
  const [isTracing, setIsTracing] = useState(false);
  const [probePos, setProbePos] = useState({ x: 35, y: 45 });
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Moving hazard positions (0.0 to 1.0 along their respective horizontal corridor)
  const [hazard1T, setHazard1T] = useState(0.2); // moves along Top corridor (x: 50 to 230, y: 45)
  const [hazard2T, setHazard2T] = useState(0.7); // moves along Middle corridor (x: 80 to 230, y: 125)
  const [hazard3T, setHazard3T] = useState(0.3); // moves along Lower corridor (x: 80 to 220, y: 205)

  const hDir1 = useRef(1);
  const hDir2 = useRef(-1);
  const hDir3 = useRef(1);
  const animRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Animate laser sparks back and forth
  useEffect(() => {
    if (isCompleted) return;

    let lastTime = performance.now();
    const updateHazards = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setHazard1T((t) => {
        let next = t + hDir1.current * 0.45 * dt;
        if (next >= 1) { next = 1; hDir1.current = -1; }
        if (next <= 0) { next = 0; hDir1.current = 1; }
        return next;
      });

      setHazard2T((t) => {
        let next = t + hDir2.current * 0.55 * dt;
        if (next >= 1) { next = 1; hDir2.current = -1; }
        if (next <= 0) { next = 0; hDir2.current = 1; }
        return next;
      });

      setHazard3T((t) => {
        let next = t + hDir3.current * 0.65 * dt;
        if (next >= 1) { next = 1; hDir3.current = -1; }
        if (next <= 0) { next = 0; hDir3.current = 1; }
        return next;
      });

      animRef.current = requestAnimationFrame(updateHazards);
    };

    animRef.current = requestAnimationFrame(updateHazards);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isCompleted]);

  // Actual coordinates of hazards
  const hazard1Pos = { x: 70 + hazard1T * 150, y: 45 };
  const hazard2Pos = { x: 90 + hazard2T * 135, y: 125 };
  const hazard3Pos = { x: 90 + hazard3T * 125, y: 205 };

  // Trigger failure
  const triggerFail = (reason: string) => {
    if (isCompleted || isFailed) return;
    setIsFailed(true);
    setFailReason(reason);
    setIsTracing(false);
    setProbePos({ x: 35, y: 45 });

    setTimeout(() => {
      setIsFailed(false);
      setFailReason(null);
    }, 600);
  };

  // Convert client pointer event into SVG coordinate (300x300)
  const getSvgCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCompleted || isFailed) return;
    const p = getSvgCoords(e);
    // Check if clicked near start node (35, 45)
    if (Math.hypot(p.x - 35, p.y - 45) < 30) {
      (e.target as Element).setPointerCapture(e.pointerId);
      setIsTracing(true);
      setProbePos({ x: 35, y: 45 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isTracing || isCompleted || isFailed) return;
    const p = getSvgCoords(e);
    setProbePos(p);

    // 1. Check distance to closest path segment (track tolerance: 22px)
    let minDistance = Infinity;
    for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
      const d = distToSegment(p, PATH_WAYPOINTS[i], PATH_WAYPOINTS[i + 1]);
      if (d < minDistance) minDistance = d;
    }

    if (minDistance > 24) {
      triggerFail('TRACE BROKEN: Stray off path');
      return;
    }

    // 2. Check collision with moving hazard sparks (danger radius: 18px)
    const d1 = Math.hypot(p.x - hazard1Pos.x, p.y - hazard1Pos.y);
    const d2 = Math.hypot(p.x - hazard2Pos.x, p.y - hazard2Pos.y);
    const d3 = Math.hypot(p.x - hazard3Pos.x, p.y - hazard3Pos.y);

    if (d1 < 18 || d2 < 18 || d3 < 18) {
      triggerFail('SURGE SHOCK: Touched laser pulse');
      return;
    }

    // 3. Check if reached End Node (235, 265)
    if (Math.hypot(p.x - 235, p.y - 265) < 22) {
      setIsTracing(false);
      setIsCompleted(true);
      setProbePos({ x: 235, y: 265 });
      setTimeout(() => {
        onComplete();
      }, 700);
    }
  };

  const handlePointerUp = () => {
    if (isTracing && !isCompleted) {
      triggerFail('PROBE LIFTED: Connection lost');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div
        className={`bg-[#0d171e] border-4 border-[#1b3547] rounded-2xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.9)] ${
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
            <Cpu className="w-5 h-5 text-cyan-400" />
            CIRCUIT BYPASS
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider text-muted mt-0.5">
            {isCompleted
              ? 'GRID POWERED (100%)'
              : isFailed
              ? failReason || 'SYSTEM SHORT'
              : isTracing
              ? 'GUIDE PROBE TO OUTPUT'
              : 'DRAG PROBE FROM START TO END'}
          </p>
        </div>

        {/* Circuit Board Arena */}
        <div className="relative bg-[#051015] border-2 border-[#123847] rounded-xl p-2 shadow-inner overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 300 300"
            className="w-full h-72 touch-none cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* PCB Background Circuit Traces Decoration */}
            <g opacity="0.15" stroke="#00e5ff" strokeWidth="1" fill="none">
              <path d="M 10 10 L 80 10 L 100 30" />
              <path d="M 290 290 L 220 290 L 200 270" />
              <path d="M 10 200 L 40 200 L 50 190" />
              <path d="M 280 80 L 260 80 L 240 100" />
              <circle cx="80" cy="10" r="3" fill="#00e5ff" />
              <circle cx="220" cy="290" r="3" fill="#00e5ff" />
            </g>

            {/* Trace Outer Track Glow / Safe Corridor */}
            <path
              d="M 35 45 L 250 45 L 250 125 L 65 125 L 65 205 L 235 205 L 235 265"
              fill="none"
              stroke="#0b2433"
              strokeWidth="38"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 35 45 L 250 45 L 250 125 L 65 125 L 65 205 L 235 205 L 235 265"
              fill="none"
              stroke={isCompleted ? '#22c55e' : isTracing ? '#00e5ff' : '#0284c7'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: isCompleted
                  ? 'drop-shadow(0 0 8px #22c55e)'
                  : 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.7))',
              }}
            />
            {/* Center Core Line */}
            <path
              d="M 35 45 L 250 45 L 250 125 L 65 125 L 65 205 L 235 205 L 235 265"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />

            {/* START Node */}
            <g transform="translate(35, 45)">
              <circle r="18" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
              <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                START
              </text>
            </g>

            {/* END Node */}
            <g transform="translate(235, 265)">
              <circle
                r="18"
                fill={isCompleted ? '#22c55e' : '#eab308'}
                stroke="#ffffff"
                strokeWidth="2.5"
                className={isCompleted ? 'animate-pulse' : ''}
              />
              <text y="4" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="900">
                CORE
              </text>
            </g>

            {/* Moving Laser Hazard Sparks */}
            {[hazard1Pos, hazard2Pos, hazard3Pos].map((pos, i) => (
              <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle r="10" fill="#ef4444" opacity="0.3" className="animate-ping" />
                <circle r="7" fill="#dc2626" stroke="#fecaca" strokeWidth="2" />
                <path d="M -3 -3 L 3 3 M 3 -3 L -3 3" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            ))}

            {/* Player's Probe Node (while dragging) */}
            <g transform={`translate(${probePos.x}, ${probePos.y})`}>
              <circle
                r="14"
                fill={isCompleted ? '#22c55e' : isFailed ? '#ef4444' : '#00e5ff'}
                stroke="#ffffff"
                strokeWidth="3"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 1))',
                }}
              />
              <circle r="4" fill="#ffffff" />
            </g>
          </svg>

          {/* Failure overlay alert */}
          {isFailed && (
            <div className="absolute inset-0 bg-red-950/75 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce mb-1" />
              <span className="text-white font-black text-sm tracking-wider uppercase">
                {failReason}
              </span>
            </div>
          )}

          {/* Success overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-95">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mb-1 drop-shadow-[0_0_15px_#22c55e]" />
              <span className="text-white font-black text-lg tracking-widest uppercase">
                GRID BYPASS COMPLETE
              </span>
            </div>
          )}
        </div>

        {/* Tip / instructions */}
        <p className="text-gray-400 text-xs font-bold text-center mt-3 uppercase tracking-wider">
          Touch START, drag without lifting, and dodge red laser sparks.
        </p>
      </div>
    </div>
  );
}
