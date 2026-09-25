import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds for staggered entrances. */
  delay?: number;
  as?: 'div' | 'section' | 'li';
  className?: string;
  y?: number;
}

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * Scroll-triggered fade-up entrance.
 *
 * Per the skills: entrance motion should be motivated and staggered for
 * sequence (hierarchy), never gratuitous. `useReducedMotion` collapses it to a
 * plain render so reduced-motion users get no movement. Animates opacity +
 * transform only (GPU-friendly).
 */
export function Reveal({ children, delay = 0, className, y = 20 }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
