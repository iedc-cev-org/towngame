'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function Scanner({ 
  onScan, 
  onClose, 
  title = "SCAN TARGET", 
  subtitle = "Point camera at a QR code to scan." 
}: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);

  // Keep the latest onScan callback without re-triggering the scanner effect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('Camera access requires HTTPS or localhost');
      return;
    }

    // Prevent double initialization glitches
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );

      let isScanned = false;

      scannerRef.current.render(
        (decodedText) => {
          if (isScanned) return;
          isScanned = true;
          if (scannerRef.current) {
            scannerRef.current.clear().catch(e => console.error("Failed to clear", e));
          }
          onScanRef.current(decodedText);
        },
        (err) => {
          // Ignore normal scan errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear on unmount", e));
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <h2 className="text-white font-black text-xl flex items-center gap-2">
          <Camera className="text-danger w-6 h-6" /> 
          {title}
        </h2>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {error ? (
        <div className="text-danger font-bold text-center p-6 bg-danger/10 rounded-xl max-w-sm">
          {error}
        </div>
      ) : (
        <div className="w-full max-w-md p-4 mt-16 relative">
          <div className="relative w-full rounded-3xl overflow-hidden border-4 border-danger shadow-[0_0_30px_rgba(255,59,59,0.3)] bg-black">
            <div id="qr-reader" className="w-full [&>div]:border-none"></div>
            {/* Laser Animation Overlay */}
            <div className="absolute left-0 w-full h-1 bg-danger shadow-[0_0_15px_#ff3b3b] animate-laser z-20 pointer-events-none"></div>
          </div>
          
          <p className="text-center text-muted font-bold mt-8 animate-pulse text-sm">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

