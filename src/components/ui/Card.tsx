import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotion } from '../../lib/motion';

export default function Card({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { prefs } = useMotion();
  return (
    <motion.section
      className={`card ${className}`}
      initial={prefs.lists ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={prefs.lists ? { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
    >
      {children}
    </motion.section>
  );
}
