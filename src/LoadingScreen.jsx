// LoadingScreen.jsx
import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { motion } from 'framer-motion';

// The amount of assets is 36
let count = 0
let realProgress = 0
let isLoaded = false

const LoadingScreen = ({ onFadeComplete }) => {
  // useProgress will trigger refresh of this component
  const { progress } = useProgress();

  count++
  realProgress = Math.ceil((100 / 36) * count)
  if (realProgress > 95) {
    realProgress = 100
    setTimeout(() => {
      isLoaded = true
    }, 2500)
  }

  return (
    <motion.div
      className="loading"
      initial={{ opacity: 1 }}
      animate={{ opacity: realProgress < 100 ? 1 : 0 }}
      transition={{ duration: 1, delay: 1.5 }}
      onAnimationComplete={() => {
        if (isLoaded) {
          onFadeComplete()
        }
      }}
    >
      <p className={'loading-welcome'}>Welcome.<br />I'm Kelvin, a web dev based in the UK.</p>
      <div className='loading-bar'>
        <div
          className='loading-progress-wrap'
          style={{ width: realProgress + '%' }}
        >
          <div className='loading-progress'></div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;