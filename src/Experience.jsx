import { useGLTF, useTexture, OrbitControls, Sparkles, MeshTransmissionMaterial, useFBO, Environment } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as THREE from 'three'
import { useRef } from 'react'

const objectNames = [
    "book", "chair2", "curtain", "coffee", "window1", "window2", 
    "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor", 
    "desk", "keyboard", "mouse", "plant1", "plant2", "plant3", 
    "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3", "phone"
]

const glasses = ['window1glass1', 'window1glass2', 'window2glass1', 'window2glass2']

export default function Experience() {
    const normalMap = useTexture("./model/dirt1.png");
    normalMap.wrapS = normalMap.wrapT = 1000;
    
    const buffer = useFBO();
    
    // References for glass, scene, and plane objects
    const sceneRef = useRef();
    const glassRef = useRef();
    const planeRef = useRef();

    const { nodes } = useGLTF('./model/room19.glb', true, (loader) => {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('draco/')
        loader.setDRACOLoader(dracoLoader)
    })

    const textures = {}
    objectNames.forEach((name) => {
        const texture = useTexture(`./model/${name}.jpg`)
        texture.flipY = false
        textures[name] = texture
    })

    // Use useFrame to handle rendering order
    useFrame((state) => {
        // Render the scene (including the plane) into the FBO buffer, but not the glass
        planeRef.current.visible = true;
        glassRef.current.visible = false;  // Hide glass
        state.gl.setRenderTarget(buffer);
        state.gl.render(state.scene, state.camera);  // Render scene and plane into the buffer
        state.gl.setRenderTarget(null);
        planeRef.current.visible = false;
        glassRef.current.visible = true;   // Show glass
    });

    return (
        <>
            <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
            
            {/* All non-glass objects, including the plane */}
            <group ref={sceneRef}>
                {/* Add the plane (which should be visible through the glass) */}
                <mesh rotation={[0, 0, 0]} position={[0, 1, -5]} ref={planeRef}>
                    <planeGeometry args={[10, 10]} /> {/* Width, height */}
                    <meshStandardMaterial color="red" />
                </mesh>

                {/* Non-glass objects */}
                {objectNames.map((name) => (
                    <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation}>
                        <meshBasicMaterial map={textures[name]} />
                    </mesh>
                ))}
            </group>

            {/* Glass objects */}
            {glasses.map((name) => (
                <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation} ref={glassRef}>
                    <MeshTransmissionMaterial
                        transmission={1}
                        roughness={0.1}
                        thickness={0.1}
                        normalMap={normalMap}
                        normalScale={[0.4, 0.4]}
                        color={"#ffffff"}
                        buffer={buffer.texture}
                        side={THREE.DoubleSide}
                    />
                    <mesh renderOrder={1} /> {/* Set higher renderOrder for glass */}
                </mesh>
            ))}

            {/* Render the environment (so it's behind everything else) */}
            <Environment preset="sunset" />

            <Sparkles
                size={2}
                scale={[3, 2, 3]}
                position={[-2, 1, -2]}
                speed={0.2}
                count={50}
            />
        </>
    )
}
