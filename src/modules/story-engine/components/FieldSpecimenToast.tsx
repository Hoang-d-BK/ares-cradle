import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/modules/store/useStoryStore';

export const FieldSpecimenToast: React.FC = () => {
  const fieldToast = useStoryStore((state) => state.fieldToast);
  const dismissFieldToast = useStoryStore((state) => state.dismissFieldToast);

  useEffect(() => {
    if (!fieldToast) return;
    const timer = setTimeout(() => {
      dismissFieldToast();
    }, 3000);
    return () => clearTimeout(timer);
  }, [fieldToast, dismissFieldToast]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 pointer-events-none z-40 max-w-sm sm:max-w-md w-full px-4 font-mono select-none">
      <AnimatePresence>
        {fieldToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-3 text-white"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-xl shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {fieldToast.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {fieldToast.badge || 'ITEM COLLECTED'}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">CADET LEO LOG</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{fieldToast.title}</h4>
              <p className="text-[11px] text-slate-300 font-sans leading-tight mt-0.5 truncate">
                {fieldToast.fact}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldSpecimenToast;
