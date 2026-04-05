import { motion } from 'framer-motion';
import { Building2, Sparkles } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md transition-colors duration-500">
      <div className="relative">
        {/* Decorative Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-8 border-2 border-primary/10 rounded-[3rem]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-12 border border-primary/5 rounded-[4rem]"
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center gap-6"
        >
          {/* Logo Container */}
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [6, -6, 6]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(var(--primary),0.3)]"
            >
              <Building2 className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulsing Glow */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary rounded-[2.5rem] -z-10 blur-2xl"
            />
          </div>

          {/* Text & Progress */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-xl font-black tracking-tighter text-foreground">Kenqo</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden relative">
                <motion.div
                  animate={{ 
                    x: ["-100%", "100%"]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 animate-pulse">
                Initializing Intelligence...
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PageLoader;
