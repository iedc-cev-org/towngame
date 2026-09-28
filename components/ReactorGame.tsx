import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ReactorGame({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentExpected, setCurrentExpected] = useState(1);
  const [wrongAnimation, setWrongAnimation] = useState(false);

  useEffect(() => {
    // Generate numbers 1 to 10 and shuffle
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    const shuffled = nums.sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  }, []);

  const handleClick = (num: number) => {
    if (num === currentExpected) {
      if (currentExpected === 10) {
        setCurrentExpected(11); // Win state
        setTimeout(onComplete, 500);
      } else {
        setCurrentExpected(prev => prev + 1);
      }
    } else if (num > currentExpected) {
      // Wrong sequence
      setWrongAnimation(true);
      setTimeout(() => setWrongAnimation(false), 400);
      setCurrentExpected(1); // Reset
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-gray-900 border-4 border-gray-600 rounded-xl p-6 w-full max-w-sm relative shadow-[0_0_50px_rgba(0,0,0,0.8)] ${wrongAnimation ? 'animate-shake' : ''}`}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-black text-white text-center mb-8 uppercase tracking-widest">START REACTOR</h3>
        
        <div className="bg-black/50 p-6 rounded-xl border border-gray-700">
          <div className="grid grid-cols-5 gap-3">
            {numbers.map((num) => (
              <button
                key={num}
                onClick={() => handleClick(num)}
                disabled={num < currentExpected}
                className={`w-12 h-12 flex items-center justify-center rounded-md font-mono text-xl font-bold transition-all shadow-md ${
                  num < currentExpected 
                    ? 'bg-green-500 text-white shadow-[0_0_10px_#22c55e]' 
                    : 'bg-gray-200 text-gray-900 hover:bg-white active:scale-95'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-8 mt-6">
          <p className="text-gray-400 text-sm font-bold text-center uppercase tracking-widest">Press numbers in order 1 to 10.</p>
        </div>
      </div>
    </div>
  );
}
