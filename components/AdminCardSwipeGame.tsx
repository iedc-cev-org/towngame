import { useState, useRef, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';

export default function AdminCardSwipeGame({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const [status, setStatus] = useState<'PLEASE SWIPE CARD' | 'TOO FAST. TRY AGAIN.' | 'TOO SLOW. TRY AGAIN.' | 'BAD SWIPE. TRY AGAIN.' | 'ACCEPTED.'>('PLEASE SWIPE CARD');
  const [swipeValue, setSwipeValue] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const startTime = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'ACCEPTED.') return;
    
    const val = parseInt(e.target.value);
    setSwipeValue(val);

    if (val === 0 && isSwiping) {
      setIsSwiping(false);
      startTime.current = null;
    }

    if (val > 0 && !isSwiping) {
      setIsSwiping(true);
      startTime.current = Date.now();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStatus('PLEASE SWIPE CARD');
    }

    if (val === 100 && isSwiping) {
      setIsSwiping(false);
      const endTime = Date.now();
      const duration = endTime - (startTime.current || endTime);
      
      // Typical Among Us times: too fast < 400ms, too slow > 1200ms
      if (duration < 600) {
        setStatus('TOO FAST. TRY AGAIN.');
        timeoutRef.current = setTimeout(() => {
          setSwipeValue(0);
          setStatus('PLEASE SWIPE CARD');
        }, 1500);
      } else if (duration > 1500) {
        setStatus('TOO SLOW. TRY AGAIN.');
        timeoutRef.current = setTimeout(() => {
          setSwipeValue(0);
          setStatus('PLEASE SWIPE CARD');
        }, 1500);
      } else {
        setStatus('ACCEPTED.');
        setTimeout(onComplete, 1000);
      }
    }
  };

  const handleMouseUp = () => {
    if (status === 'ACCEPTED.') return;
    
    if (swipeValue > 0 && swipeValue < 100) {
      // Bad swipe, didn't go all the way
      setIsSwiping(false);
      setStatus('BAD SWIPE. TRY AGAIN.');
      timeoutRef.current = setTimeout(() => {
        setSwipeValue(0);
        setStatus('PLEASE SWIPE CARD');
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border-[10px] border-gray-900 rounded-[2rem] p-8 w-full max-w-lg relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-8 h-8" />
        </button>
        <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-widest text-center">Admin Swipe</h3>
        
        {/* Status Screen */}
        <div className="bg-green-950 border-4 border-green-800 rounded-xl p-6 mb-8 flex items-center justify-center h-24 shadow-inner">
          <p className={`text-2xl font-mono font-bold tracking-widest ${
            status === 'ACCEPTED.' ? 'text-green-400' : 
            status.includes('AGAIN') ? 'text-red-500 animate-pulse' : 
            'text-green-600'
          }`}>
            {status}
          </p>
        </div>
        
        {/* Card Scanner */}
        <div className="bg-gray-900 border-b-[20px] border-gray-700 h-32 rounded-lg relative flex items-center px-4 overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_40px,transparent_40px)] bg-[length:60px_100%] opacity-20 pointer-events-none"></div>
          
          <input
            type="range"
            min="0"
            max="100"
            value={swipeValue}
            onChange={handleSliderChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="w-full appearance-none bg-transparent z-10 h-24 cursor-grab active:cursor-grabbing slider-thumb-card"
            style={{
              WebkitAppearance: 'none',
              outline: 'none'
            }}
          />
          {/* Custom styles for the slider thumb to look like a card */}
          <style dangerouslySetInnerHTML={{__html: `
            .slider-thumb-card::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 140px;
              height: 90px;
              background-color: #f8f9fa;
              border-radius: 12px;
              border: 4px solid #dee2e6;
              box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.2);
              cursor: pointer;
              background-image: linear-gradient(135deg, #f8f9fa 60%, #e9ecef 60%);
              position: relative;
            }
            .slider-thumb-card::-webkit-slider-thumb::before {
                content: '';
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                height: 15px;
                background: #343a40;
                border-radius: 4px;
            }
            .slider-thumb-card::-moz-range-thumb {
              width: 140px;
              height: 90px;
              background-color: #f8f9fa;
              border-radius: 12px;
              border: 4px solid #dee2e6;
              box-shadow: 0 4px 6px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.2);
              cursor: pointer;
            }
          `}} />
        </div>
        
        <p className="text-gray-400 text-sm font-bold text-center mt-6 uppercase tracking-widest">Drag the card through the scanner at the right speed.</p>
      </div>
    </div>
  );
}
