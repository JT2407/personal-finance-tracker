import { useEffect, useState } from 'react';
import { useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface NumberDisplayProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

/**
 * Animated number display built on motion.
 *
 * Rationale (per skills): animating money makes the dashboard feel alive, but
 * only where the change communicates a real state change. Values spring toward
 * the target; reduced-motion users get the plain final value.
 */
export function NumberDisplay({ value, format, className }: NumberDisplayProps) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 26, mass: 0.8 });
  const rendered = useTransform(spring, (v) => v);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    motionValue.set(value);
    const unsub = rendered.on('change', (v) => setDisplay(Number(v)));
    return () => unsub();
  }, [value, reduce, motionValue, rendered]);

  const text = format
    ? format(Number(display))
    : Number(display).toLocaleString('en-US');

  return <span className={cn('tabular-nums', className)}>{text}</span>;
}

export function moneyDisplay(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

