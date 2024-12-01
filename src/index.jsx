import './style.scss';
import { Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence } from 'framer-motion';
import Experience from './Experience.jsx';
import LoadingScreen from './LoadingScreen'; // The loading screen you just created
import Music from './Music.jsx';

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleFadeComplete = () => {
    setIsLoaded(true);
  };

  return (
    <div style={{ position: 'relative', width: '100dvw', height: '100dvh' }}>
      {/* Orientation Overlay */}
      {isLoaded && (
        <div className="orientation-overlay">
          <p>Please rotate your device to landscape<br />for the best experience.</p>
        </div>
      )}

      {/* Three.js Canvas */}
      <Canvas
        flat
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [-2.4, 1.05, -0.6]
        }}
      >
        <color args={['#000000']} attach="background" />
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>

      {/* Music Component */}
      <Music />

      {/* Loading Screen */}
      <AnimatePresence>
        {!isLoaded && (
          <LoadingScreen onFadeComplete={handleFadeComplete} />
        )}
      </AnimatePresence>
    </div>
  );
};

const root = ReactDOM.createRoot(document.querySelector('#root'));

root.render(<App />);
