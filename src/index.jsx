import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <Canvas
        flat
        camera={ {
            fov: 45,
            near: 0.1,
            far: 50,
            position: [-2.4, 1.05, -0.6]
        } }
    >
        <color args={ [ '#000000' ] } attach="background" />
        <Experience />
    </Canvas>
)