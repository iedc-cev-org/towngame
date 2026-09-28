import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

export default function WiringGame({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const [wiresLeft, setWiresLeft] = useState([
    { id: 1, color: '#ef4444', connectedTo: null as number | null },
    { id: 2, color: '#3b82f6', connectedTo: null as number | null },
    { id: 3, color: '#eab308', connectedTo: null as number | null },
    { id: 4, color: '#22c55e', connectedTo: null as number | null },
  ]);
  const [wiresRight, setWiresRight] = useState([
    { id: 1, color: '#3b82f6', connectedTo: null as number | null },
    { id: 2, color: '#22c55e', connectedTo: null as number | null },
    { id: 3, color: '#ef4444', connectedTo: null as number | null },
    { id: 4, color: '#eab308', connectedTo: null as number | null },
  ]);
  
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  useEffect(() => {
    // Shuffle the right side initially
    const shuffledRight = [...wiresRight].sort(() => Math.random() - 0.5);
    setWiresRight(shuffledRight);
  }, []);

  const handleLeftClick = (id: number) => {
    const leftWire = wiresLeft.find(w => w.id === id);
    if (!leftWire || leftWire.connectedTo !== null) return;
    setSelectedLeft(id);
  };

  const handleRightClick = (id: number) => {
    if (selectedLeft === null) return;
    const rightWire = wiresRight.find(w => w.id === id);
    if (!rightWire || rightWire.connectedTo !== null) return;

    const leftWire = wiresLeft.find(w => w.id === selectedLeft);
    if (leftWire?.color === rightWire.color) {
      // Connect them
      const newWiresLeft = wiresLeft.map(w => w.id === selectedLeft ? { ...w, connectedTo: id } : w);
      const newWiresRight = wiresRight.map(w => w.id === id ? { ...w, connectedTo: selectedLeft } : w);
      
      setWiresLeft(newWiresLeft);
      setWiresRight(newWiresRight);
      setSelectedLeft(null);
      
      // Check win condition
      if (newWiresLeft.every(w => w.connectedTo !== null)) {
        setTimeout(onComplete, 500);
      }
    } else {
      setSelectedLeft(null); // Wrong connection, just reset selection
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-4 border-gray-600 rounded-xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-black text-white text-center mb-8 uppercase tracking-widest">FIX WIRING</h3>
        
        <div className="flex justify-between items-center h-64 relative bg-black/50 p-4 rounded-xl border border-gray-700">
          {/* Left Wires */}
          <div className="flex flex-col justify-between h-full w-12 z-10">
            {wiresLeft.map((w) => (
              <div 
                key={w.id}
                onClick={() => handleLeftClick(w.id)}
                className={`w-full h-10 rounded-r-lg cursor-pointer flex items-center justify-end pr-2 transition-all active:scale-95 ${
                  selectedLeft === w.id ? 'scale-110 shadow-[0_0_15px_currentColor]' : ''
                }`}
                style={{ backgroundColor: w.color, color: w.color }}
              >
                {w.connectedTo !== null ? <CheckCircle className="w-4 h-4 text-white" /> : null}
              </div>
            ))}
          </div>

          {/* Lines (Simple visual connection) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {wiresLeft.map((wLeft, iLeft) => {
              if (wLeft.connectedTo === null) return null;
              const rightIndex = wiresRight.findIndex(w => w.id === wLeft.connectedTo);
              const y1 = 20 + (iLeft * 72);
              const y2 = 20 + (rightIndex * 72);
              return (
                <line 
                  key={wLeft.id}
                  x1="48" y1={y1} x2="calc(100% - 48px)" y2={y2} 
                  stroke={wLeft.color} 
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Right Wires */}
          <div className="flex flex-col justify-between h-full w-12 z-10">
            {wiresRight.map((w) => (
              <div 
                key={w.id}
                onClick={() => handleRightClick(w.id)}
                className={`w-full h-10 rounded-l-lg cursor-pointer flex items-center justify-start pl-2 transition-all active:scale-95`}
                style={{ backgroundColor: w.color }}
              >
                {w.connectedTo !== null ? <CheckCircle className="w-4 h-4 text-white" /> : null}
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-gray-400 text-sm font-bold text-center mt-6 uppercase tracking-widest">Connect matching colors.</p>
      </div>
    </div>
  );
}
