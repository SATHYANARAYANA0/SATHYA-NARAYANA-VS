import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveReaction } from '../types';

interface LiveReactionsOverlayProps {
  reactions: LiveReaction[];
}

export const LiveReactionsOverlay: React.FC<LiveReactionsOverlayProps> = ({ reactions }) => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      <AnimatePresence>
        {reactions.map((rx) => (
          <motion.div
            key={rx.id}
            initial={{ opacity: 0, y: '90vh', scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: ['85vh', '15vh'],
              scale: [0.7, 1.4, 1.2, 0.9],
              x: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3.2, ease: 'easeOut' }}
            style={{ left: `${rx.x}%` }}
            className="absolute select-none text-3xl sm:text-4xl filter drop-shadow-md"
          >
            {rx.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
