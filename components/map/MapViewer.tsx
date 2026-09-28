'use client';

import React, { useState, useEffect } from 'react';
import { useMapCamera } from '@/hooks/useMapCamera';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/lib/mapData';
import { FloorMap } from './FloorMap';
import { TaskMarker } from './TaskMarker';
import { X, Map as MapIcon } from 'lucide-react';

const TASK_COORDS: Record<string, { floor: 1 | 2; x: number; y: number }> = {
  'task-throw': { floor: 1, x: 770, y: 990 },
  'task-book-game': { floor: 1, x: 1400, y: 470 },
  'task-arrange-ball': { floor: 1, x: 1050, y: 520 },
  'task-basket-ball': { floor: 1, x: 950, y: 560 },
  'task-die-game': { floor: 1, x: 950, y: 560 },
  'task-football': { floor: 1, x: 950, y: 560 },
  'task-ring-throw': { floor: 1, x: 950, y: 560 },
  'task-single-leg': { floor: 1, x: 950, y: 560 },
  'task-memory-game': { floor: 1, x: 950, y: 560 },
  'task-stone-paper-scissors': { floor: 1, x: 950, y: 560 },
  'task-paint-fight': { floor: 1, x: 950, y: 560 },
  'task-hammer-hit': { floor: 1, x: 950, y: 560 },
  'task-light-finger': { floor: 1, x: 950, y: 560 },
  'task-fruit-duel': { floor: 1, x: 950, y: 560 },
  'task-fruit-dual': { floor: 1, x: 950, y: 560 },
  'task-coin-toss': { floor: 1, x: 950, y: 560 },
  'task-ballon-race': { floor: 1, x: 950, y: 560 },
  'task-cup-rebuild': { floor: 1, x: 950, y: 560 },
  'task-bottle-flip': { floor: 1, x: 950, y: 560 },
  'task-fill-bottle': { floor: 1, x: 950, y: 560 },
  'task-paper-plane': { floor: 1, x: 950, y: 560 },
  'task-color-picking': { floor: 1, x: 950, y: 560 },
  'task-pen-flight': { floor: 1, x: 950, y: 560 },
  'task-pen-fight': { floor: 1, x: 950, y: 560 },
  'task-find-object': { floor: 1, x: 1050, y: 1300 },
  'task-cleaning': { floor: 2, x: 1400, y: 1320 },
  'task-qr-drawing': { floor: 2, x: 1600, y: 1250 },
  'task-solar': { floor: 2, x: 1200, y: 885 },
  'task-reactor': { floor: 2, x: 1600, y: 660 },
  'task-puzzle': { floor: 2, x: 1450, y: 660 },
  'task-wiring': { floor: 2, x: 1210, y: 1115 },
  'task-potato': { floor: 2, x: 760, y: 1180 },
  'task-bulb': { floor: 2, x: 760, y: 1240 },
  'task-stack-cups': { floor: 2, x: 945, y: 1400 },
  'task-admin-swipe': { floor: 1, x: 770, y: 1330 },
  'task-shields': { floor: 1, x: 1250, y: 1100 },
  'task-distributor': { floor: 1, x: 850, y: 1240 },
  'task-radio-freq': { floor: 1, x: 800, y: 700 },
  'task-circuit-bypass': { floor: 1, x: 800, y: 1300 },
  'task-pressure-valves': { floor: 1, x: 650, y: 1100 },
  'task-orbital-defense': { floor: 1, x: 1350, y: 900 },
  'task-dna-anomaly': { floor: 1, x: 1150, y: 800 },
  'task-nav-align': { floor: 1, x: 1550, y: 1100 },
  'task-fuel-transfer': { floor: 1, x: 700, y: 1350 },
  'task-garbage-chute': { floor: 1, x: 1300, y: 700 },
  'task-coolant-bypass': { floor: 1, x: 1200, y: 750 },
};

interface MapViewerProps {
  tasks: any[];
  onClose: () => void;
}

export default function MapViewer({ tasks, onClose }: MapViewerProps) {
  const [currentFloor, setCurrentFloor] = useState<1 | 2>(1);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const handleResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { zoom, offset } = useMapCamera(viewport.w, viewport.h);

  return (
    <div className="fixed inset-0 z-50 bg-black touch-none select-none cursor-grab active:cursor-grabbing">
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-center z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-full p-1 flex shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentFloor(1); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-black tracking-widest text-xs sm:text-sm transition-colors ${
                currentFloor === 1 ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              FLOOR 1
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentFloor(2); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-black tracking-widest text-xs sm:text-sm transition-colors ${
                currentFloor === 2 ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white'
              }`}
            >
              FLOOR 2
            </button>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-transform hover:scale-110 active:scale-95"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center bg-black/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-sm border border-gray-800">
        <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <MapIcon className="w-3 h-3 sm:w-4 sm:h-4" /> Drag • Pinch/Scroll to zoom
        </p>
      </div>

      {/* The World Space */}
      <div 
        className="absolute transform-gpu origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
        }}
      >
        <FloorMap floor={currentFloor} />
        
        {tasks.map(task => {
          const coords = TASK_COORDS[task.task_location_id || task.location_id];
          if (!coords || coords.floor !== currentFloor) return null;
          
          return (
            <TaskMarker 
              key={task.id} 
              task={task} 
              x={coords.x} 
              y={coords.y} 
            />
          );
        })}
      </div>
    </div>
  );
}
