import { useGLTF, useTexture, OrbitControls, Center, Sparkles } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as THREE from 'three'

const objectNames = [
    "book", "chair2", "curtain", "coffee", "window1", "window2", 
    "computer", "desk_lamp", "ceiling", "wall1", "wall2", "floor", 
    "desk", "keyboard", "mouse", "plant1", "plant2", "plant3", 
    "floor_lamp", "curtain_stick", "poster1", "poster2", "poster3"
]

export default function Experience() {
    const { nodes } = useGLTF('./model/room18.glb', true, (loader) => {
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

    return <>
        <OrbitControls makeDefault target={[-3.2, 1.4, -3.5]} />
        {/* <axesHelper args={[5]} /> */}
        
        {objectNames.map((name) => (
            <mesh key={name} geometry={nodes[name]?.geometry} position={nodes[name]?.position} rotation={nodes[name]?.rotation}>
                <meshBasicMaterial map={textures[name]} />
            </mesh>
        ))}

        <Sparkles
            size={ 2 }
            scale={ [ 3, 2, 3 ] }
            position={[-2, 1, -2]}
            speed={ 0.2 }
            count={ 50 }
        />
    </>
}