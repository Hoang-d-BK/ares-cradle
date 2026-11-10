import React from 'react';
import { motion, Variants } from 'framer-motion';

export interface KineticTextSpringProps {
  text: string;
  mode?: 'word' | 'char';
  className?: string;
  delay?: number;
  stagger?: number;
  onComplete?: () => void;
}

/**
 * Kinetic Spring Typography
 * Designed for Elementary & Middle School Readers (Ages 7-12)
 * Delivers punchy, playful text rhythm without reading fatigue.
 */
export const KineticTextSpring: React.FC<KineticTextSpringProps> = ({
  text,
  mode = 'word',
  className = '',
  delay = 0.1,
  stagger = mode === 'word' ? 0.08 : 0.025,
  onComplete,
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 18,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 14,
        stiffness: 140,
      },
    },
  };

  if (mode === 'char') {
    const chars = text.split('');
    return (
      <motion.span
        className={`inline-block ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onAnimationComplete={onComplete}
      >
        {chars.map((char, idx) => (
          <motion.span
            key={idx}
            variants={childVariants}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  const words = text.split(' ');
  return (
    <motion.span
      className={`inline-flex flex-wrap items-center gap-x-1.5 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onComplete}
    >
      {words.map((word, idx) => (
        <motion.span key={idx} variants={childVariants} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default KineticTextSpring;
