import Link from 'next/link';
import { ScanFace, ShieldAlert } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background glow effects */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/8 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md flex flex-col items-center px-4">
        {/* Logo */}
        <div className="mb-10 text-center animate-float">
          <h1 className="au-title text-6xl sm:text-7xl text-white mb-1 tracking-tight leading-none">
            AMONG<span className="text-primary"> US</span>
          </h1>
          <p className="text-secondary font-black tracking-[0.4em] uppercase text-xs sm:text-sm mt-3">
            IN REAL LIFE
          </p>
        </div>

        {/* Among Us character silhouette via CSS */}
        <div className="w-24 h-28 mb-8 relative animate-float" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-primary rounded-t-[50px] rounded-b-[20px]" />
          <div className="absolute top-[22%] right-[10%] w-[45%] h-[28%] bg-[#c0d8f0] rounded-[50%] opacity-90" />
          <div className="absolute bottom-0 left-[10%] w-[30%] h-[35%] bg-primary rounded-b-[10px]" />
          <div className="absolute bottom-0 right-[10%] w-[30%] h-[35%] bg-primary rounded-b-[10px]" />
          <div className="absolute top-[30%] left-[-15%] w-[30%] h-[40%] bg-primary rounded-l-[15px] rounded-r-[5px]" />
        </div>

        {/* Action buttons */}
        <div className="au-panel p-6 sm:p-8 w-full flex flex-col gap-4">
          <Link 
            href="/amongus/join" 
            className="au-btn bg-primary text-white py-4 sm:py-5 rounded-xl flex items-center justify-center gap-3 text-lg"
          >
            <ScanFace className="w-6 h-6" />
            JOIN GAME
          </Link>
          
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-card-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted text-xs font-bold uppercase tracking-[0.3em]">Or</span>
            <div className="flex-grow border-t border-card-border"></div>
          </div>

          <Link 
            href="/amongus/host" 
            className="au-btn bg-secondary/90 text-background py-4 sm:py-5 rounded-xl flex items-center justify-center gap-3 text-lg font-black"
          >
            <ShieldAlert className="w-6 h-6" />
            HOST GAME
          </Link>

          <Link 
            href="/" 
            className="au-btn bg-card text-muted hover:text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-card-border transition-colors mt-2"
          >
            ← BACK TO PORTAL
          </Link>
        </div>

        <p className="text-muted/50 text-[10px] mt-8 text-center uppercase tracking-widest font-bold">
          v2.0 • A Social Deduction Experience
        </p>
      </div>
    </main>
  );
}
