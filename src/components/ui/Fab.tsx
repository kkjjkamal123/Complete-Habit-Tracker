import { motion } from 'framer-motion';
import { haptic } from '../../lib/haptics';

export default function Fab({ onClick, label = 'Add' }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      className="fab"
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={() => {
        haptic('medium');
        onClick();
      }}
    >
      ＋
    </motion.button>
  );
}
