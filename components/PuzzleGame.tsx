'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PuzzleGame({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const [pieces, setPieces] = useState<number[]>(() => {
    const nums = Array.from({ length: 9 }, (_, i) => i);
    let shuffled = [...nums];
    while (shuffled.every((val, index) => val === nums[index])) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    return shuffled;
  });
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);

  const handleClick = (index: number) => {
    if (isWon) return;

    if (selectedPiece === null) {
      setSelectedPiece(index);
    } else {
      // Swap the two pieces
      const newPieces = [...pieces];
      const temp = newPieces[selectedPiece];
      newPieces[selectedPiece] = newPieces[index];
      newPieces[index] = temp;
      
      setPieces(newPieces);
      setSelectedPiece(null);

      // Check win condition
      if (newPieces.every((val, i) => val === i)) {
        setIsWon(true);
        setTimeout(onComplete, 1500);
      }
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-4 border-gray-600 rounded-xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-black text-white text-center mb-6 uppercase tracking-widest">Fix the Picture</h3>
        
        <div className="bg-black/50 p-2 rounded-xl border border-gray-700 mx-auto w-[300px] h-[300px]">
          <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1">
            {pieces.map((val, index) => {
              const row = Math.floor(val / 3);
              const col = val % 3;
              const bgPosX = `${(col * 100) / 2}%`;
              const bgPosY = `${(row * 100) / 2}%`;
              
              const isSelected = selectedPiece === index;
              
              return (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  className={`w-full h-full overflow-hidden transition-all duration-200 ${
                    isSelected ? 'scale-90 border-4 border-secondary opacity-80' : 'border border-transparent'
                  } ${isWon ? 'border-none' : ''}`}
                  style={{
                    backgroundImage: "url('/puzzle-image.png')",
                    backgroundSize: '300% 300%',
                    backgroundPosition: `${bgPosX} ${bgPosY}`,
                    backgroundColor: '#111',
                    borderRadius: isWon ? '0' : '4px'
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div className="mt-6 text-center h-8">
          {isWon ? (
             <p className="text-success font-black text-xl uppercase tracking-widest animate-pulse">Accepted!</p>
          ) : (
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Tap two pieces to swap them.</p>
          )}
        </div>
      </div>
    </div>
  );
}
