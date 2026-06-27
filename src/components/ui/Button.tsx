import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { haptic } from '../../lib/haptics';

interface Props extends Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'> {
  variant?: 'primary' | 'ghost' | 'soft';
  children: ReactNode;
  onClick?: () => void;
}

export default function Button({ variant = 'primary', children, onClick, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`btn btn-${variant}`}
      onClick={() => {
        haptic('light');
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
