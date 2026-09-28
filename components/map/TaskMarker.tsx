import React from 'react';

interface TaskMarkerProps {
  task: any; // We'll pass the game's task object
  x: number;
  y: number;
}

export function TaskMarker({ task, x, y }: TaskMarkerProps) {
  const isCompleted = task.status === 'COMPLETED' || task.completed === true;

  return (
    <div
      className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none group"
      style={{ left: x, top: y }}
    >
      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all transform group-hover:scale-110 ${
        isCompleted 
          ? 'bg-green-500 border-green-700' 
          : 'bg-yellow-400 border-yellow-600 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.6)]'
      }`}>
        <span className="text-2xl drop-shadow-md">
          {isCompleted ? '✓' : '!'}
        </span>
      </div>
      
      <div className="mt-1 sm:mt-2 text-[10px] sm:text-sm font-black text-white bg-black/80 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shadow-lg whitespace-nowrap border border-gray-700">
        {task.task_name || task.name}
      </div>
    </div>
  );
}
