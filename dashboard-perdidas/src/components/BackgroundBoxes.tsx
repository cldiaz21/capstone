import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundBoxes: React.FC = () => {
  const rows = new Array(150).fill(1);
  const cols = new Array(100).fill(1);
  
  const getRandomColor = () => {
    const colors = ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.08)'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="background-boxes-wrapper">
      <div className="background-boxes-container">
        {rows.map((_, i) => (
          <motion.div
            key={`row-${i}`}
            className="background-boxes-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: i * 0.002,
            }}
          >
            {cols.map((_, j) => (
              <motion.div
                key={`col-${j}`}
                className="background-box"
                whileHover={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transition: { duration: 0 },
                }}
                animate={{
                  backgroundColor: getRandomColor(),
                  transition: { duration: Math.random() * 3 + 2 },
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>
      
      {/* Gradient overlay */}
      <div className="background-boxes-overlay" />
    </div>
  );
};
