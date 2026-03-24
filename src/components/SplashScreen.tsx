import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0b] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1c_0%,_#0a0a0b_100%)] opacity-60" />

      {/* Main Logo Container */}
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 ease-out-expo">
        <div className="relative mb-6">
          {/* Pulsing ring around logo */}
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-[#0d6e5d] flex items-center justify-center shadow-2xl shadow-primary/40 relative border border-white/10">
             <span className="text-4xl font-black text-white italic tracking-tighter">BG</span>
             
             {/* Decorative lines inside box */}
             <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/30" />
             <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white mb-1.5">
            budget<span className="text-primary italic">Guard</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            Secure Expense Management
          </p>
        </div>
      </div>

      {/* Loading indicator at bottom */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 overflow-hidden rounded-full h-[3px] bg-white/5 border border-white/5 shadow-inner">
         <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-full -translate-x-full animate-splash-loader" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splash-loader {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-splash-loader {
          animation: splash-loader 1.5s ease-in-out infinite;
        }
        .ease-out-expo {
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
}
