if (process.env.NODE_ENV !== 'development') {
    console.warn = () => {
        return;
    };

    console.error = () => {
        return;
    };
}

import './style.scss'
import { Suspense } from 'react';
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import LoadingScreen from './LoadingScreen'; // The loading screen you just created
import Music from './Music.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <>
        <div className="orientation-overlay">
            <p>Please rotate your device to landscape<br />to have the best experience.</p>
        </div>

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
            <LoadingScreen />
        </Canvas>
        <Music />
    </>
)