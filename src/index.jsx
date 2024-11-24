import './style.scss'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import Music from './music.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <>
        <div className="orientation-overlay">
            <p>Please rotate your device to landscape to view this page.</p>
        </div>

        <Canvas
            flat
            camera={ {
                fov: 45,
                near: 0.1,
                far: 1000,
                position: [-2.4, 1.05, -0.6]
            } }
        >
            <color args={ [ '#000000' ] } attach="background" />
            <Experience />
        </Canvas>
        <Music />
    </>
)